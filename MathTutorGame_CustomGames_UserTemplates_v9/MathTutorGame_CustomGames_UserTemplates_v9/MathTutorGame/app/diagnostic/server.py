from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import json
import uuid
import random
from pathlib import Path

from .diagnostic import (
    Skill,
    Session,
    AskedItem,
    MAX_QUESTIONS_BY_GRADE,
    build_plan_for_grade,
    get_progress,
    pick_next_skill,
    record_asked,
    maybe_enqueue_prereq,
    update_mastery,
    exam_missing_skills,
    exam_results,
)
from .question_gen import generate_question
from .grader import grade
from .store import SESSIONS

app = FastAPI(title="Math Skill Diagnostic (Grades 1-4)")

# CORS: السماح فقط للواجهة المحلية بالاتصال (بدل فتحها لأي Origin)
# إذا واجهتِ مشكلة (مثلاً بتفتحي html مباشرة من الكمبيوتر origin=null)
# الأفضل تفتحي الواجهة من /ui داخل نفس السيرفر.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5050",
        "http://127.0.0.1:5050",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
SKILLS_PATH = DATA_DIR / "skills.json"


def load_skills() -> dict[str, Skill]:
    raw = json.loads(SKILLS_PATH.read_text(encoding="utf-8"))
    skills: dict[str, Skill] = {}
    for r in raw:
        skills[r["skill_id"]] = Skill(
            skill_id=r["skill_id"],
            grade=int(r["grade"]),
            semester=int(r.get("semester", 1)),
            title=r["title"],
            threshold=float(r.get("threshold", 0.7)),
            prereq=list(r.get("prereq", [])),
        )
    return skills


SKILLS = load_skills()


class StartReq(BaseModel):
    target_grade: int
    seed: int | None = None


class Progress(BaseModel):
    current: int
    total: int
    remaining: int


class StartRes(BaseModel):
    session_id: str
    question: str
    skill_id: str
    progress: Progress


class AnswerReq(BaseModel):
    session_id: str
    student_answer: str


class AnswerRes(BaseModel):
    done: bool
    question: str | None = None
    skill_id: str | None = None
    missing_skills: list[str] | None = None
    strong_skills: list[str] | None = None
    not_assessed: list[str] | None = None
    progress: Progress | None = None


class FinishReq(BaseModel):
    session_id: str


class FinishRes(BaseModel):
    missing_skills: list[str]
    strong_skills: list[str]
    not_assessed: list[str]


class ManualUpdateReq(BaseModel):
    session_id: str
    skill_id: str
    is_correct: bool


def new_mastery(target_grade: int) -> dict[str, float]:
    # مبدئياً 0.5 لكل مهارة حتى صف الطالب (مفيد لتحديد المستوى)
    m: dict[str, float] = {}
    for sid, sk in SKILLS.items():
        if sk.grade <= target_grade:
            m[sid] = 0.5
    return m


def next_question(sess: Session) -> tuple[str, str, str]:
    sid = pick_next_skill(SKILLS, sess.mastery, sess)
    if not sid:
        return ("", "", "")
    q, expected = generate_question(sid)
    return sid, q, expected


@app.post("/start", response_model=StartRes)
def start(req: StartReq):
    if req.target_grade < 1 or req.target_grade > 4:
        raise HTTPException(400, "target_grade must be 1..4")

    if req.seed is not None:
        random.seed(req.seed)

    sid = str(uuid.uuid4())

    # خطة الامتحان = كل مهارات صف الطالب
    plan = build_plan_for_grade(SKILLS, req.target_grade)

    # عدد الأسئلة ثابت حسب الصف (ولا يحدده الطالب)
    max_q = MAX_QUESTIONS_BY_GRADE.get(req.target_grade, 18)
    # تأكد ألا يقل عن عدد مهارات الصف (حتى يكون الامتحان شامل)
    if max_q < len(plan):
        max_q = len(plan)

    sess = Session(
        session_id=sid,
        target_grade=req.target_grade,
        max_questions=max_q,
        mastery=new_mastery(req.target_grade),
        plan=plan,
    )

    skill_id, q, expected = next_question(sess)
    if not skill_id:
        raise HTTPException(500, "No skills available")

    record_asked(sess, skill_id)
    sess._pending = {"skill_id": skill_id, "question": q, "expected": expected}

    SESSIONS[sid] = sess
    return StartRes(
        session_id=sid,
        question=q,
        skill_id=skill_id,
        progress=Progress(**get_progress(sess)),
    )


@app.post("/answer", response_model=AnswerRes)
def answer(req: AnswerReq):
    sess = SESSIONS.get(req.session_id)
    if not sess:
        raise HTTPException(404, "session_id not found")

    pending = getattr(sess, "_pending", None)
    if not pending:
        raise HTTPException(400, "No pending question. Call /start first")

    skill_id = pending["skill_id"]
    expected = pending["expected"]
    q = pending["question"]

    is_correct = grade(req.student_answer, expected)
    update_mastery(sess.mastery, skill_id, is_correct)

    # لو غلط، نحاول نضيف prerequisite لتأكيد سبب الضعف (بدون إطالة)
    if not is_correct:
        maybe_enqueue_prereq(sess, SKILLS, skill_id)

    sess.history.append(
        AskedItem(
            skill_id=skill_id,
            question=q,
            expected_answer=expected,
            student_answer=req.student_answer,
            is_correct=is_correct,
        )
    )

    # شرط التوقف: عدد الأسئلة الثابت
    if len(sess.history) >= sess.max_questions:
        r = exam_results(SKILLS, sess)
        return AnswerRes(
            done=True,
            missing_skills=r["missing_skills"],
            strong_skills=r["strong_skills"],
            not_assessed=r["not_assessed"],
            progress=Progress(**get_progress(sess)),
        )

    # سؤال جديد
    next_skill, next_q, next_expected = next_question(sess)
    if not next_skill:
        r = exam_results(SKILLS, sess)
        return AnswerRes(
            done=True,
            missing_skills=r["missing_skills"],
            strong_skills=r["strong_skills"],
            not_assessed=r["not_assessed"],
            progress=Progress(**get_progress(sess)),
        )

    record_asked(sess, next_skill)
    sess._pending = {"skill_id": next_skill, "question": next_q, "expected": next_expected}

    return AnswerRes(
        done=False,
        question=next_q,
        skill_id=next_skill,
        progress=Progress(**get_progress(sess)),
    )


@app.post("/finish", response_model=FinishRes)
def finish(req: FinishReq):
    sess = SESSIONS.get(req.session_id)
    if not sess:
        raise HTTPException(404, "session_id not found")
    r = exam_results(SKILLS, sess)
    return FinishRes(
        missing_skills=r["missing_skills"],
        strong_skills=r["strong_skills"],
        not_assessed=r["not_assessed"],
    )


@app.post("/update_manual")
def update_manual(req: ManualUpdateReq):
    sess = SESSIONS.get(req.session_id)
    if not sess:
        raise HTTPException(404, "session_id not found")
    if req.skill_id not in SKILLS:
        raise HTTPException(400, "Unknown skill_id")
    update_mastery(sess.mastery, req.skill_id, req.is_correct)
    return {"ok": True}


# خريطة skill_id -> title (للعرض بالعربي في الموقع)
@app.get("/skills_map")
def skills_map():
    raw = json.loads(SKILLS_PATH.read_text(encoding="utf-8"))
    return {s["skill_id"]: s.get("title", s["skill_id"]) for s in raw}