from __future__ import annotations

"""Game API required by the assignment.

Endpoints (stable):
  - GET  /api/diagnostic?grade=1|2|3|4
  - POST /api/diagnostic/submit
  - POST /api/plan

This module is intentionally independent from the optional RAG/Ollama parts,
so the backend can run locally without needing Ollama.
"""

import json
import random
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from .config import settings
from .planner.scheduler import Skill, load_skills


router = APIRouter(prefix="/api", tags=["Game"])


def _load_json(path: str) -> Any:
    p = Path(path)
    if not p.exists():
        return None
    return json.loads(p.read_text(encoding="utf-8"))


SKILLS: Dict[str, Skill] = load_skills(settings.skills_path)
VIDEOS: Dict[str, str] = _load_json(settings.videos_path) or {}


def load_question_bank_unified(path: str) -> List[Dict[str, Any]]:
    """Loads a unified question bank (a list of questions).

    We also tolerate a legacy dict-by-skill format and normalize it.
    The unified schema is:
      {
        id: str,
        grade: 1..4,
        skill_id: str,
        type: multiple_choice|input_number|fill_blank|drag_drop_match|drag_drop_sort,
        prompt: str,
        choices?: [str],
        answer_index?: int,
        answer: any,
        explanation?: str,
        ... (type-specific fields)
      }
    """
    data = _load_json(path)
    if data is None:
        return []

    if isinstance(data, list):
        return data

    out: List[Dict[str, Any]] = []
    if isinstance(data, dict):
        # legacy: {skill_id: [ ...questions ]}
        for sid, items in data.items():
            for i, q in enumerate(items or []):
                qq = dict(q)
                qq.setdefault("skill_id", sid)
                qq.setdefault("id", f"QB_{sid}_{i:03d}")
                # best-effort grade inference from skill_id prefix (G1_, G2_, ...)
                if "grade" not in qq:
                    try:
                        qq["grade"] = int(str(sid).split("_")[0].replace("G", ""))
                    except Exception:
                        qq["grade"] = 1
                out.append(qq)
        return out

    return []


QUESTION_BANK: List[Dict[str, Any]] = load_question_bank_unified(settings.question_bank_path)


def _index_bank(bank: List[Dict[str, Any]]) -> Tuple[Dict[str, List[Dict[str, Any]]], Dict[int, List[Dict[str, Any]]]]:
    by_skill: Dict[str, List[Dict[str, Any]]] = {}
    by_grade: Dict[int, List[Dict[str, Any]]] = {1: [], 2: [], 3: [], 4: []}
    for q in bank:
        sid = str(q.get("skill_id") or "").strip()
        if not sid:
            continue
        by_skill.setdefault(sid, []).append(q)
        try:
            g = int(q.get("grade"))
        except Exception:
            g = None
        if g in by_grade:
            by_grade[g].append(q)
    return by_skill, by_grade


BANK_BY_SKILL, BANK_BY_GRADE = _index_bank(QUESTION_BANK)


def _pick_questions(grade: int, n_total: int = 10) -> List[Dict[str, Any]]:
    """Pick a balanced diagnostic set across the grade's skills."""
    grade_skills = [sid for sid, sk in SKILLS.items() if sk.grade == grade]
    random.shuffle(grade_skills)
    picked: List[Dict[str, Any]] = []
    # 1-2 questions per skill until we reach n_total
    for sid in grade_skills:
        qs = BANK_BY_SKILL.get(sid, [])
        qs = [q for q in qs if int(q.get("grade", grade)) == grade]
        random.shuffle(qs)
        for q in qs[:2]:
            picked.append(q)
            if len(picked) >= n_total:
                return picked

    # fallback: any grade questions
    pool = list(BANK_BY_GRADE.get(grade, []))
    random.shuffle(pool)
    return (picked + pool)[:n_total]


# --- In-memory sessions (fine for local demo) ---
_SESSIONS: Dict[str, Dict[str, Any]] = {}


class DiagnosticResponse(BaseModel):
    session_id: str
    grade: int
    questions: List[Dict[str, Any]]


@router.get("/diagnostic", response_model=DiagnosticResponse)
def get_diagnostic(grade: int = Query(..., ge=1, le=4)):
    qs = _pick_questions(grade=grade, n_total=10)
    if not qs:
        raise HTTPException(500, "question_bank فارغ أو غير صالح")
    session_id = str(uuid.uuid4())
    _SESSIONS[session_id] = {
        "grade": grade,
        "question_ids": [q.get("id") for q in qs],
        "created_at": time.time(),
    }
    return {"session_id": session_id, "grade": grade, "questions": qs}


class SubmitAnswer(BaseModel):
    question_id: str
    # Frontend sends "answer". Some older experiments used "response".
    answer: Optional[Any] = None
    response: Optional[Any] = None


class DiagnosticSubmitRequest(BaseModel):
    session_id: str
    answers: List[SubmitAnswer]


class DiagnosticSubmitResponse(BaseModel):
    grade: int
    mastery: Dict[str, float]
    weak_skills: List[str]
    plan: Dict[str, Any]


def _normalize_text(x: Any) -> str:
    return str(x).strip().replace("٫", ".")


def _is_correct(q: Dict[str, Any], student_answer: Any) -> bool:
    qtype = q.get("type")
    if qtype == "multiple_choice":
        # UI sends selected choice text
        correct_choice = None
        if "answer_index" in q and isinstance(q.get("choices"), list):
            try:
                correct_choice = q["choices"][int(q["answer_index"])]
            except Exception:
                correct_choice = None
        if correct_choice is not None:
            return _normalize_text(student_answer) == _normalize_text(correct_choice)
        # fallback: direct 'answer' comparison
        return _normalize_text(student_answer) == _normalize_text(q.get("answer"))

    if qtype in ("input_number", "fill_blank"):
        return _normalize_text(student_answer) == _normalize_text(q.get("answer"))

    if qtype == "drag_drop_match":
        try:
            return dict(student_answer) == dict(q.get("answer") or {})
        except Exception:
            return False

    if qtype == "drag_drop_sort":
        try:
            return list(student_answer) == list(q.get("answer") or [])
        except Exception:
            return False

    return False


def _compute_mastery(answers: List[SubmitAnswer]) -> Tuple[int, Dict[str, float]]:
    # Build qid->question map
    qmap = {q.get("id"): q for q in QUESTION_BANK}
    per_skill_total: Dict[str, int] = {}
    per_skill_correct: Dict[str, int] = {}
    grade_guess = 1
    for ans in answers:
        q = qmap.get(ans.question_id)
        if not q:
            continue
        try:
            grade_guess = int(q.get("grade", grade_guess))
        except Exception:
            pass
        sid = str(q.get("skill_id") or "").strip() or "UNKNOWN"
        per_skill_total[sid] = per_skill_total.get(sid, 0) + 1
        student_answer = ans.answer if ans.answer is not None else ans.response
        ok = _is_correct(q, student_answer)
        if ok:
            per_skill_correct[sid] = per_skill_correct.get(sid, 0) + 1

    mastery: Dict[str, float] = {}
    for sid, total in per_skill_total.items():
        corr = per_skill_correct.get(sid, 0)
        mastery[sid] = round(corr / max(1, total), 2)
    return grade_guess, mastery


def _pick_for_skill(skill_id: str, grade: int, wanted_types: List[str], n: int) -> List[Dict[str, Any]]:
    pool = [q for q in BANK_BY_SKILL.get(skill_id, []) if int(q.get("grade", grade)) == grade]
    random.shuffle(pool)
    out: List[Dict[str, Any]] = []
    for t in wanted_types:
        for q in pool:
            if q.get("type") == t and q not in out:
                out.append(q)
                break
            if len(out) >= n:
                return out
    # fill remaining
    for q in pool:
        if q not in out:
            out.append(q)
            if len(out) >= n:
                break
    return out


def build_full_plan(grade: int, mastery: Dict[str, float], minutes_per_day: int = 15, days_limit: int = 10) -> Dict[str, Any]:
    grade_skills = [sid for sid, sk in SKILLS.items() if sk.grade == grade]
    # default mastery for unseen skills
    mastery_full = {sid: float(mastery.get(sid, 0.5)) for sid in grade_skills}
    # weak first
    weak = sorted(grade_skills, key=lambda s: mastery_full[s])
    weak_skills = [s for s in weak if mastery_full[s] < 0.7]
    if not weak_skills:
        weak_skills = weak[: min(5, len(weak))]

    days: List[Dict[str, Any]] = []
    for day_i in range(1, days_limit + 1):
        focus = weak_skills[(day_i - 1) % len(weak_skills)]
        title = SKILLS.get(focus).title if focus in SKILLS else focus
        yt = VIDEOS.get(focus) or "https://www.youtube.com/watch?v=J6MsnYmhbKs"

        # Build activities (15 minutes)
        hint_text = f"تلميح سريع: {title} — خذي نفسًا وابدئي خطوة خطوة."
        game_qs = _pick_for_skill(
            focus,
            grade,
            wanted_types=["drag_drop_match", "drag_drop_sort", "multiple_choice", "input_number", "fill_blank"],
            n=2,
        )
        if len(game_qs) < 2:
            # fallback to any grade questions
            pool = [q for q in BANK_BY_GRADE.get(grade, []) if q.get("type") in ("multiple_choice", "input_number", "fill_blank", "drag_drop_match", "drag_drop_sort")]
            random.shuffle(pool)
            game_qs = (game_qs + pool)[:2]

        quiz_qs = _pick_for_skill(
            focus,
            grade,
            wanted_types=["multiple_choice", "input_number", "fill_blank"],
            n=2,
        )
        if len(quiz_qs) < 2:
            pool = [q for q in BANK_BY_GRADE.get(grade, []) if q.get("type") in ("multiple_choice", "input_number", "fill_blank")]
            random.shuffle(pool)
            quiz_qs = (quiz_qs + pool)[:2]

        day = {
            "day_index": day_i,
            "total_minutes": minutes_per_day,
            "focus_skills": [focus],
            "activities": [
                {"type": "hint", "title": "💡 تلميح", "text": hint_text, "minutes": 2, "skill_id": focus},
                {"type": "video", "title": "🎬 فيديو قصير", "youtube_url": yt, "minutes": 4, "skill_id": focus},
                {"type": "game", "title": "🚂 لعبة القطار 1", "question": game_qs[0], "minutes": 4, "skill_id": focus},
                {"type": "game", "title": "🚂 لعبة القطار 2", "question": game_qs[1] if len(game_qs) > 1 else game_qs[0], "minutes": 3, "skill_id": focus},
                {"type": "mini_quiz", "title": "🧪 تقييم صغير", "questions": quiz_qs, "minutes": 2, "skill_id": focus},
            ],
        }
        days.append(day)

    return {"grade": grade, "days": days}


@router.post("/diagnostic/submit", response_model=DiagnosticSubmitResponse)
def submit_diagnostic(req: DiagnosticSubmitRequest):
    sess = _SESSIONS.get(req.session_id)
    if not sess:
        raise HTTPException(404, "جلسة التشخيص غير موجودة")

    grade, mastery = _compute_mastery(req.answers)
    # determine weak skills
    grade_skills = [sid for sid, sk in SKILLS.items() if sk.grade == grade]
    weak = [sid for sid in grade_skills if float(mastery.get(sid, 0.5)) < 0.7]
    weak = sorted(weak, key=lambda s: float(mastery.get(s, 0.5)))
    plan = build_full_plan(grade=grade, mastery=mastery, minutes_per_day=15, days_limit=10)
    return {"grade": grade, "mastery": mastery, "weak_skills": weak, "plan": plan}


class PlanRequest(BaseModel):
    grade: int = Field(ge=1, le=4)
    mastery: Dict[str, float] = Field(default_factory=dict)
    constraints: Dict[str, Any] = Field(default_factory=lambda: {"minutes_per_day": 15, "days_per_week": 5, "language": "ar"})


@router.post("/plan")
def plan(req: PlanRequest):
    minutes = int(req.constraints.get("minutes_per_day", 15))
    days_limit = int(req.constraints.get("days_limit", 10))
    plan = build_full_plan(grade=req.grade, mastery=req.mastery, minutes_per_day=minutes, days_limit=days_limit)
    return plan
