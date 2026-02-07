from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
import time

# تحديث mastery (بسيط وقابل للتعديل)
INC_CORRECT = 0.15
DEC_WRONG = 0.20

# امتحان شامل + قصير (ثابت حسب الصف)
# سؤال واحد على الأقل لكل مهارة من صف الطالب + أسئلة قليلة إضافية لتأكيد نقاط الضعف
MAX_QUESTIONS_BY_GRADE = {
    1: 12,  # مهارات الصف1 ~10
    2: 18,  # مهارات الصف2 ~16
    3: 18,  # مهارات الصف3 ~16
    4: 18,  # مهارات الصف4 ~16
}

# لا نكرر نفس المهارة أكثر من مرتين (حتى لا يمل الطفل)
MAX_REPEAT_PER_SKILL = 2


@dataclass
class Skill:
    skill_id: str
    grade: int
    semester: int
    title: str
    threshold: float = 0.7
    prereq: List[str] = field(default_factory=list)


@dataclass
class AskedItem:
    skill_id: str
    question: str
    expected_answer: str
    student_answer: str
    is_correct: bool


@dataclass
class Session:
    session_id: str
    target_grade: int
    max_questions: int
    mastery: Dict[str, float]

    # خطة الامتحان: مهارات الصف المستهدف فقط (لشمول الامتحان بدون إطالة)
    plan: List[str] = field(default_factory=list)

    # كم مرة انْسألت كل مهارة
    asked_counts: Dict[str, int] = field(default_factory=dict)

    # طابور مهارات prerequisites (تأتي فقط عند وجود وقت إضافي)
    prereq_queue: List[str] = field(default_factory=list)

    history: List[AskedItem] = field(default_factory=list)
    created_at: float = field(default_factory=time.time)


def clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def update_mastery(mastery: Dict[str, float], skill_id: str, is_correct: bool) -> None:
    cur = mastery.get(skill_id, 0.5)
    if is_correct:
        cur += INC_CORRECT
    else:
        cur -= DEC_WRONG
    mastery[skill_id] = clamp01(cur)


def missing_skills(skills: Dict[str, Skill], mastery: Dict[str, float], target_grade: int) -> List[str]:
    """المهارات الناقصة حتى صف الطالب (للإفادة في تحديد المستوى)."""
    out: List[str] = []
    for sid, sk in skills.items():
        if sk.grade <= target_grade and mastery.get(sid, 0.5) < sk.threshold:
            out.append(sid)
    out.sort(key=lambda s: mastery.get(s, 0.5))
    return out


def exam_missing_skills(skills: Dict[str, Skill], session: Session) -> List[str]:
    """نتيجة الامتحان الشامل (المفضلة للواجهة).

    المشكلة التي كانت تظهر عندك:
    - mastery يبدأ 0.5
    - threshold = 0.7
    - إجابة صحيحة واحدة (+0.15) تصبح 0.65 -> تُحسب ناقصة رغم أن الطالب أجاب صح.

    لذلك هنا نعتمد على نتيجة الامتحان لكل مهارة مباشرة:
    - مهارات صف الطالب الموجودة في plan: إذا أجاب عليها صح مرة واحدة على الأقل => ليست ناقصة
    - إذا كانت كل محاولاتها خطأ => ناقصة

    ونضيف أيضاً أي prerequisite تم سؤاله خلال الامتحان (إن وجد) بنفس القاعدة.
    """

    # احصائيات الإجابات لكل مهارة من history
    attempts: Dict[str, int] = {}
    corrects: Dict[str, int] = {}
    for it in session.history:
        attempts[it.skill_id] = attempts.get(it.skill_id, 0) + 1
        if it.is_correct:
            corrects[it.skill_id] = corrects.get(it.skill_id, 0) + 1

    # مهارات الصف المستهدف (شاملة)
    target_skills = list(session.plan)

    # أي مهارة إضافية تم سؤالها (مثل prereq)
    extra_skills = [sid for sid in attempts.keys() if sid not in target_skills]

    out: List[str] = []
    for sid in target_skills + extra_skills:
        # إذا لم تُسأل لأي سبب، لا نحكم عليها (لكن عادة الخطة تضمن سؤالها)
        if attempts.get(sid, 0) == 0:
            continue
        if corrects.get(sid, 0) == 0:
            # كل المحاولات خطأ => ناقصة
            out.append(sid)

    # رتبي: مهارات الصف أولاً ثم الإضافية
    out.sort(key=lambda s: (0 if s in target_skills else 1, skills.get(s, Skill(s, 0, 0, s)).title))
    return out


def exam_results(skills: Dict[str, Skill], session: Session) -> Dict[str, List[str]]:
    """نتيجة الامتحان بصيغتين: مهارات ممتازة + مهارات ناقصة.

    - strong_skills: أي مهارة أجاب عليها الطالب "صح" مرة واحدة على الأقل.
    - missing_skills: مهارة أُسئل عنها ولكن كل محاولاتها كانت خطأ.
    - not_assessed: مهارة ضمن خطة الصف ولم تُسأل (يفترض نادراً).

    ملاحظة: نضيف أيضاً أي مهارة إضافية تم سؤالها (مثل prereq) بنفس القاعدة.
    """

    attempts: Dict[str, int] = {}
    corrects: Dict[str, int] = {}
    for it in session.history:
        attempts[it.skill_id] = attempts.get(it.skill_id, 0) + 1
        if it.is_correct:
            corrects[it.skill_id] = corrects.get(it.skill_id, 0) + 1

    target_skills = list(session.plan)
    extra_skills = [sid for sid in attempts.keys() if sid not in target_skills]

    strong: List[str] = []
    missing: List[str] = []
    not_assessed: List[str] = []

    for sid in target_skills:
        if attempts.get(sid, 0) == 0:
            not_assessed.append(sid)
            continue
        if corrects.get(sid, 0) >= 1:
            strong.append(sid)
        else:
            missing.append(sid)

    # المهارات الإضافية (مثل prereq): إذا صح => ممتازة، إذا كلّه غلط => ناقصة
    for sid in extra_skills:
        if corrects.get(sid, 0) >= 1:
            strong.append(sid)
        else:
            missing.append(sid)

    # ترتيب لطيف
    strong.sort(key=lambda s: (0 if s in target_skills else 1, skills.get(s, Skill(s, 0, 0, s)).title))
    missing.sort(key=lambda s: (0 if s in target_skills else 1, skills.get(s, Skill(s, 0, 0, s)).title))
    not_assessed.sort(key=lambda s: skills.get(s, Skill(s, 0, 0, s)).title)

    return {"strong_skills": strong, "missing_skills": missing, "not_assessed": not_assessed}


def build_plan_for_grade(skills: Dict[str, Skill], target_grade: int) -> List[str]:
    """يبني خطة الامتحان: كل مهارات صف الطالب فقط."""
    plan = [sid for sid, sk in skills.items() if sk.grade == target_grade]
    # ترتيب لطيف: فصل ثم اسم
    plan.sort(key=lambda sid: (skills[sid].semester, skills[sid].title))
    return plan


def get_progress(session: Session) -> Dict[str, int]:
    total = session.max_questions
    answered = len(session.history)
    current = min(answered + 1, total)
    # المتبقي بعد هذا السؤال (حتى يشعر الطالب أنه يقترب من النهاية)
    remaining = max(0, total - current)
    return {"current": current, "total": total, "remaining": remaining}


def can_ask(session: Session, skill_id: str) -> bool:
    return session.asked_counts.get(skill_id, 0) < MAX_REPEAT_PER_SKILL


def record_asked(session: Session, skill_id: str) -> None:
    session.asked_counts[skill_id] = session.asked_counts.get(skill_id, 0) + 1


def maybe_enqueue_prereq(session: Session, skills: Dict[str, Skill], skill_id: str) -> None:
    """عند خطأ الطالب، نضيف prerequisite (إذا موجود) لتأكيد سبب الضعف، بدون إطالة."""
    sk = skills.get(skill_id)
    if not sk:
        return
    for pre in sk.prereq:
        if pre in skills and skills[pre].grade <= session.target_grade:
            if pre not in session.asked_counts and pre not in session.prereq_queue:
                session.prereq_queue.append(pre)


def pick_next_skill(skills: Dict[str, Skill], mastery: Dict[str, float], session: Session) -> Optional[str]:
    """
    استراتيجية الامتحان:
    1) نمشي على كل مهارات صف الطالب (plan) سؤال واحد لكل مهارة.
    2) إذا بقي وقت إضافي (ضمن max_questions) نسأل مهارات prerequisites أو أضعف المهارات للتأكيد.
    """
    remaining_questions = session.max_questions - len(session.history)
    if remaining_questions <= 0:
        return None

    # مهارات الصف المستهدف غير المسؤولة بعد
    unasked_plan = [sid for sid in session.plan if sid not in session.asked_counts]

    # إذا يوجد prereq_queue نستخدمه فقط إذا لدينا "وقت إضافي" غير ضروري لإكمال plan
    if session.prereq_queue and remaining_questions > len(unasked_plan):
        while session.prereq_queue:
            pre = session.prereq_queue.pop(0)
            if can_ask(session, pre):
                return pre

    # أثناء تنفيذ plan: اسأل المهارة التالية في الخطة
    for sid in unasked_plan:
        if can_ask(session, sid):
            return sid

    # بعد اكتمال plan: اسأل أضعف مهارة (حتى صف الطالب) للتأكيد
    candidates = [sid for sid, sk in skills.items() if sk.grade <= session.target_grade and can_ask(session, sid)]
    if not candidates:
        return None

    def score(sid: str) -> Tuple[float, int]:
        m = mastery.get(sid, 0.5)
        prereq_missing = 0
        for pre in skills[sid].prereq:
            if pre in skills and mastery.get(pre, 0.5) < skills[pre].threshold:
                prereq_missing += 1
        return (m, -prereq_missing)

    candidates.sort(key=score)
    return candidates[0]
