from __future__ import annotations
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional, Tuple
import uuid
import json
from pathlib import Path

from .config import settings
from .ollama_client import OllamaClient
from .rag.store import ChromaStore
from .planner.scheduler import load_skills, build_plan
from .games.generator import generate_game_pack

# Required game API (stable /api endpoints)
from .game_api import router as game_router

app = FastAPI(title="Math Tutor RAG API", version="1.0.0")

# Stable endpoints for the MathTutor Game
app.include_router(game_router)

# Provide stable answer-check endpoint under /api as well (frontend may use it)
from fastapi import Request

@app.post("/api/check_answer")
def api_check_answer(payload: Dict[str, Any]):
    # Avoid forward-ref issues during route registration
    req = CheckAnswerRequest(**payload)
    return check_answer(req)


# Serve UI (static HTML/JS) and mount diagnostic sub-app
try:
    from .diagnostic.server import app as diag_app  # Diagnostic API
    app.mount("/diag", diag_app, name="diagnostic")
except Exception as _e:
    # diagnostic is optional; API can still run without it
    diag_app = None  # type: ignore

UI_DIR = Path(__file__).resolve().parent / "ui"
if UI_DIR.exists():
    app.mount("/ui", StaticFiles(directory=str(UI_DIR), html=True), name="ui")

@app.get("/")
def root():
    # Redirect to the original (nicer) diagnostic UI by default
    if (UI_DIR / "diagnostic" / "index.html").exists():
        return RedirectResponse(url="/ui/diagnostic/index.html")
    return {"ok": True, "message": "Math Tutor RAG API is running. Visit /docs"}

ollama = OllamaClient()
store = ChromaStore()
skills = load_skills(settings.skills_path)

def load_videos(path: str) -> Dict[str, Any]:
    p = Path(path)
    if not p.exists():
        return {}
    return json.loads(p.read_text(encoding='utf-8'))

videos = load_videos(settings.videos_path)


def load_question_bank(path: str) -> Dict[str, List[Dict[str, Any]]]:
    p = Path(path)
    if not p.exists():
        return {}
    try:
        data = json.loads(p.read_text(encoding='utf-8'))
        # New schema: a flat list of questions with {id, grade, skill_id, ...}
        if isinstance(data, list):
            bank: Dict[str, List[Dict[str, Any]]] = {}
            for q in data:
                sid = q.get("skill_id")
                if not sid:
                    continue
                bank.setdefault(sid, []).append(q)
            return bank
        # Legacy schema: dict skill_id -> questions[]
        if isinstance(data, dict):
            return data
        return {}
    except Exception:
        return {}

question_bank = load_question_bank(settings.question_bank_path)

# Build question id index for server-side answer checking (so UI doesn't need answers).
# IMPORTANT: Never store *mutable references* that later get stripped, otherwise answers disappear.
QID_INDEX: Dict[str, Dict[str, Any]] = {}
for _sid, _qs in question_bank.items():
    for _q in (_qs or []):
        _qid = _q.get('id')
        if _qid:
            # store a COPY to protect answers from accidental mutation/stripping
            QID_INDEX[str(_qid)] = dict(_q)

def pick_questions_from_bank(skill_id: str, n: int = 5) -> List[Dict[str, Any]]:
    # Return COPIES so we never mutate the source bank.
    qs = [dict(q) for q in (question_bank.get(skill_id, []) or [])]
    if not qs:
        return []
    import random
    random.shuffle(qs)
    return qs[:n]

@app.post("/reload_assets")
def reload_assets():
    global videos, question_bank, QID_INDEX
    videos = load_videos(settings.videos_path)
    question_bank = load_question_bank(settings.question_bank_path)
    QID_INDEX = {}
    for _sid, _qs in question_bank.items():
        for _q in (_qs or []):
            _qid = _q.get('id')
            if _qid:
                QID_INDEX[str(_qid)] = dict(_q)
    return {"ok": True, "videos": len(videos), "question_bank_skills": len(question_bank), "question_count": len(QID_INDEX)}

class MasteryItem(BaseModel):
    skill_id: str
    mastery: float = Field(ge=0.0, le=1.0)

class PlanRequest(BaseModel):
    mastery: List[MasteryItem] = Field(default_factory=list)
    missing_skills: Optional[List[str]] = None
    minutes_per_day: int = 15
    include_prereqs: bool = True
    language: str = "ar"
    days_limit: Optional[int] = None
    rag_k: int = 4
    fast_mode: bool = True

class DayPlan(BaseModel):
    day_index: int
    skills: List[Dict[str, Any]]

class PlanResponse(BaseModel):
    total_days: int
    days: List[DayPlan]

class ChatRequest(BaseModel):
    message: str
    skill_id: Optional[str] = None
    grade: Optional[int] = None
    semester: Optional[int] = None
    k: int = 4

class ExplainRequest(BaseModel):
    skill_id: str
    question: Optional[str] = None
    k: int = 5

@app.get("/health")
def health():
    return {"ok": True, "docs_in_index": store.count()}

@app.get("/skills_map")
def skills_map():
    return {sid: sk.title for sid, sk in skills.items()}

def rag_retrieve(skill_id: str, question: str, k: int = 5):
    # Build query from skill title + question to anchor retrieval
    title = skills.get(skill_id).title if skill_id in skills else skill_id
    q = f"{title}\n{question}".strip()
    q_emb = ollama.embed([q])[0]

    # Filter by grade/semester if skill exists and index chunks were stored with same metadata
    where = None
    if skill_id in skills:
        g = skills[skill_id].grade
        s = skills[skill_id].semester
        if g is not None and s is not None:
            where = {"$and": [{"grade": int(g)}, {"semester": int(s)}]}

    chunks = store.query(q_emb, n_results=k, where=where)
    return q, chunks


@app.post("/explain_skill")
def explain_skill(req: ExplainRequest):
    title = skills.get(req.skill_id).title if req.skill_id in skills else req.skill_id
    question = req.question or "اشرح المهارة ببساطة مع مثال أو مثالين."
    q, chunks = rag_retrieve(req.skill_id, question, k=req.k)
    context = "\n\n".join([f"- {c.text}\n  (المصدر: {c.metadata.get('source')} صفحة {c.metadata.get('page')})" for c in chunks])
    prompt = f"""أنت معلم رياضيات. اشرح للطالب بالعربية وببساطة. 
المهارة: {title}
سؤال/هدف الشرح: {question}

مقاطع من الكتاب (مصدر موثوق):
{context}

المطلوب:
- شرح مختصر (6-10 جمل)
- مثالان محلولان خطوة بخطوة
- 3 أخطاء شائعة ونصيحة لتجنبها
"""
    answer = ollama.generate(prompt, options={"num_predict": 260})
    sources = [{"source": c.metadata.get("source"), "page": c.metadata.get("page"), "distance": c.distance} for c in chunks]
    return {"skill_id": req.skill_id, "title": title, "answer": answer.strip(), "sources": sources}

@app.post("/chat")
def chat(req: ChatRequest):
    # Build retrieval constraints
    where = None
    if req.skill_id and req.skill_id in skills:
        g = skills[req.skill_id].grade
        s = skills[req.skill_id].semester
        if g is not None and s is not None:
            where = {"$and": [{"grade": int(g)}, {"semester": int(s)}]}
    elif req.grade is not None and req.semester is not None:
        where = {"$and": [{"grade": int(req.grade)}, {"semester": int(req.semester)}]}

    q_emb = ollama.embed([req.message])[0]
    chunks = store.query(q_emb, n_results=req.k, where=where)
    context = "\n\n".join([f"- {c.text}\n  (المصدر: {c.metadata.get('source')} صفحة {c.metadata.get('page')})" for c in chunks])

    prompt = f"""أنت مساعد تعليمي لطالب رياضيات. أجب بالعربية وببساطة وبشكل داعم.
قواعد:
- إذا السؤال عن المنهاج، استخدم المقاطع كمصدر واذكر الصفحة إن أمكن.
- إذا السؤال عام وغير موجود بالمقاطع، أجب إجابة عامة مفيدة بدون اختلاق معلومات من الكتاب.
- لا تطوّل: 6-10 جمل كحد أقصى.
- لو احتجت توضيح، اسأل سؤالاً واحداً قصيراً.

سؤال الطالب:
{req.message}

مقاطع من الكتاب (قد تكون فارغة أو غير كافية):
{context}
"""
    # Keep it short/faster for kids
    answer = ollama.generate(prompt, options={"num_predict": 120}).strip()
    sources = [{"source": c.metadata.get("source"), "page": c.metadata.get("page"), "distance": c.distance} for c in chunks]
    return {"answer": answer, "sources": sources}


@app.post("/game_pack")
def game_pack(skill_id: str, n: int = 5, mode: str = "auto"):
    """Return a set of practice questions for a skill.

    - For balloons/train: we prefer MCQ-style questions (multiple_choice / mcq_number).
    - For connect: we return drag_drop_match questions (tap-to-connect UI).
    IMPORTANT: We index full questions (with answers) in QID_INDEX BEFORE stripping answers for the UI.
    """
    global QID_INDEX

    m = (mode or "auto").lower().strip()

    def _to_mcq(q: Dict[str, Any]) -> Dict[str, Any]:
        """Convert input_number/fill_blank -> mcq_number with choices (server-side)."""
        if q.get("type") in ("fill_blank", "input_number") and q.get("answer") is not None:
            try:
                ans = str(q.get("answer")).strip().replace("٫", ".")
                val = float(ans) if "." in ans else int(ans)
            except Exception:
                return q
            import random
            choices = {val}
            spread = 4
            while len(choices) < 4:
                delta = random.randint(-spread, spread)
                if delta == 0:
                    continue
                choices.add(val + delta)
            choices = list(choices)
            random.shuffle(choices)

            def fmt(x):
                if isinstance(x, float) and abs(x - int(x)) < 1e-9:
                    x = int(x)
                return str(x)

            q2 = dict(q)
            q2["type"] = "mcq_number"
            q2["choices"] = [fmt(c) for c in choices]
            q2["answer"] = fmt(val)
            q2["answer_index"] = choices.index(val)
            return q2
        return q

    # ---- Build pack ----
    if m in ("connect", "match"):
        bank = [dict(q) for q in pick_questions_from_bank(skill_id, n=max(12, n * 4)) if q.get("type") == "drag_drop_match"]
        pack = bank[:n]
        if not pack:
            pack = generate_game_pack(skill_id, n=n, mode="connect")
    else:
        bank = [dict(q) for q in pick_questions_from_bank(skill_id, n=max(24, n * 6))]
        mcq = [q for q in bank if q.get("type") in ("multiple_choice", "mcq_number")]
        extra = [q for q in bank if q.get("type") in ("fill_blank", "input_number")]
        pack = (mcq + extra)[:n]
        if not pack:
            pack = generate_game_pack(skill_id, n=n)
        pack = [_to_mcq(q) for q in pack]

    # Ensure every question has an id
    for q in pack:
        if not q.get("id"):
            q["id"] = str(uuid.uuid4())

    # Normalize match fields for UI
    for q in pack:
        try:
            if q.get("type") == "drag_drop_match":
                if "left" not in q and "left_items" in q:
                    q["left"] = q.get("left_items")
                if "right" not in q and "right_items" in q:
                    q["right"] = q.get("right_items")
        except Exception:
            pass

    # Index full questions (including answers) server-side BEFORE stripping
    for q in pack:
        qid = q.get("id")
        if qid:
            QID_INDEX[str(qid)] = dict(q)

    # Return public copy (answers removed)
    public_pack = [dict(q) for q in pack]
    if not settings.debug_include_answers:
        for q in public_pack:
            q.pop("answer", None)
            q.pop("answer_index", None)

    return {"skill_id": skill_id, "mode": m, "questions": public_pack}


class CheckAnswerRequest(BaseModel):
    # UI may send question_id only, or question object that contains id.
    question_id: Optional[str] = None
    question: Dict[str, Any] = Field(default_factory=dict)
    student_answer: Any

@app.post("/check_answer")
def check_answer(req: CheckAnswerRequest):
    """Server-side answer checking.

    The UI may NOT include correct answers (DEBUG_INCLUDE_ANSWERS=false), so we look up by question.id when possible.
    Returns:
      {correct: bool, correct_answer?: any, explanation?: str}
    """
    def norm(x: Any) -> str:
        s = str(x).strip().replace("٫", ".").replace(" ", "")
        # Arabic-Indic digits -> Western digits
        trans = str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789")
        return s.translate(trans)

    def clean_text(x: Any) -> str:
        s = str(x or "")
        # remove common UI emojis/prefixes
        for p in ["📦", "🎈", "⭐", "✅", "❌"]:
            s = s.replace(p, "")
        return s.strip()


    q_in = req.question or {}
    qid = req.question_id or q_in.get("id")
    q = None
    if qid is not None:
        q = QID_INDEX.get(str(qid))
    if q is None:
        # fallback scan question_bank by id (extra safety)
        try:
            for _sid, _qs in question_bank.items():
                for _qq in (_qs or []):
                    if str(_qq.get("id")) == str(qid):
                        q = dict(_qq)
                        break
                if q is not None:
                    break
        except Exception:
            q = None
    if q is None:
        # fallback to whatever client sent (may include answers in debug mode)
        q = q_in

    qtype = q.get("type")
    student = req.student_answer

    correct = False
    correct_answer = None

    if qtype in ("multiple_choice", "mcq_number"):
        choices = q.get("choices") or q.get("options") or []
        # determine correct choice
        if "answer_index" in q and isinstance(choices, list) and choices:
            try:
                ci = int(q.get("answer_index"))
                correct_answer = choices[ci]
                # student may send index or text
                if isinstance(student, (int, float)):
                    correct = int(student) == ci
                elif isinstance(student, str) and clean_text(student).isdigit():
                    # Could be an index OR a textual numeric answer. Accept either.
                    try:
                        correct = (int(clean_text(student)) == ci) or (norm(clean_text(student)) == norm(correct_answer))
                    except Exception:
                        correct = norm(clean_text(student)) == norm(correct_answer)
                else:
                    correct = norm(clean_text(student)) == norm(correct_answer)
            except Exception:
                correct = False
        else:
            correct_answer = q.get("answer")
            correct = norm(clean_text(student)) == norm(correct_answer)

    elif qtype in ("input_number", "fill_blank"):
        correct_answer = q.get("answer")
        correct = norm(clean_text(student)) == norm(correct_answer)

    elif qtype == "drag_drop_match":
        # student expected dict left->right
        correct_answer = q.get("answer") or {}
        try:
            a = {str(k): str(v).strip() for k, v in dict(student).items()}
            b = {str(k): str(v).strip() for k, v in dict(correct_answer).items()}
            correct = a == b
        except Exception:
            correct = False

    elif qtype in ("drag_drop_sort", "drag_drop_order"):
        correct_answer = q.get("answer") or []
        try:
            a = [str(x).strip() for x in list(student)]
            b = [str(x).strip() for x in list(correct_answer)]
            correct = a == b
        except Exception:
            correct = False
    else:
        raise HTTPException(400, f"Unsupported question type: {qtype}")

    explanation = q.get("explanation")
    return {"correct": bool(correct), "correct_answer": correct_answer, "explanation": explanation}

@app.post("/plan", response_model=PlanResponse)
def plan(req: PlanRequest):
    # Determine missing skills list
    if req.missing_skills:
        missing_ids = req.missing_skills
        mastery_map = {m.skill_id: m.mastery for m in req.mastery}
        missing = [(sid, float(mastery_map.get(sid, 0.0))) for sid in missing_ids]
    else:
        # fallback: compute missing by threshold
        missing = []
        for m in req.mastery:
            thr = skills.get(m.skill_id).threshold if m.skill_id in skills else 0.7
            if m.mastery < thr:
                missing.append((m.skill_id, m.mastery))
        if not missing:
            # if all mastered, still produce a light revision plan of weakest 3
            weakest = sorted([(m.skill_id, m.mastery) for m in req.mastery], key=lambda x: x[1])[:3]
            missing = weakest

    schedule = build_plan(missing, skills, minutes_per_day=req.minutes_per_day, include_prereqs=req.include_prereqs)
    if req.days_limit:
        schedule = schedule[:req.days_limit]

    days_out: List[DayPlan] = []
    for i, day_skill_ids in enumerate(schedule, start=1):
        skills_out=[]
        for sid in day_skill_ids:
            title = skills.get(sid).title if sid in skills else sid
            video_val = videos.get(sid)
            if isinstance(video_val, str):
                video_urls = [video_val]
            elif isinstance(video_val, list):
                video_urls = [v for v in video_val if isinstance(v, str)]
            else:
                video_urls = []
            # explanation: fast_mode can skip LLM and return retrieved snippets only
            explain_obj = None
            if req.fast_mode:
                q, chunks = rag_retrieve(sid, "اعطني خلاصة قصيرة للمهارة مع مثال.", k=req.rag_k)
                explain_obj = {
                    "summary": "\n".join([c.text[:220] for c in chunks[:2]]),
                    "sources": [{"source": c.metadata.get("source"), "page": c.metadata.get("page")} for c in chunks]
                }
            else:
                explain_obj = explain_skill(ExplainRequest(skill_id=sid, k=req.rag_k))  # type: ignore

            pack = pick_questions_from_bank(sid, n=5) or generate_game_pack(sid, n=5)
            # Ensure ids and index answers BEFORE stripping
            for q in pack:
                if not q.get("id"):
                    q["id"] = str(uuid.uuid4())
                QID_INDEX[str(q["id"])]=dict(q)

            public_pack = [dict(q) for q in pack]
            if not settings.debug_include_answers:
                for q in public_pack:
                    q.pop("answer", None)
                    q.pop("answer_index", None)

            skills_out.append({
                "skill_id": sid,
                "title": title,
                "video_urls": video_urls,
                "explain": explain_obj,
                "games": public_pack,
                "minutes": req.minutes_per_day // max(1, len(day_skill_ids)),
            })
        days_out.append(DayPlan(day_index=i, skills=skills_out))
    return PlanResponse(total_days=len(days_out), days=days_out)
