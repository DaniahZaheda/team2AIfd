from __future__ import annotations
import argparse
import json
import re
from pathlib import Path
from typing import Any, Dict, List

from app.config import settings
from app.ollama_client import OllamaClient
from app.rag.store import ChromaStore
from app.planner.scheduler import load_skills

def extract_json_array(text: str) -> List[Dict[str, Any]]:
    m = re.search(r"\[.*\]", text, flags=re.DOTALL)
    if not m:
        return []
    blob = m.group(0)
    try:
        data = json.loads(blob)
        if isinstance(data, list):
            return data
    except Exception:
        return []
    return []

def normalize_questions(qs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out=[]
    for q in qs:
        if not isinstance(q, dict):
            continue
        qtype = q.get("type")
        prompt = q.get("prompt")
        if not qtype or not prompt:
            continue
        if qtype == "mcq_number":
            if not isinstance(q.get("choices"), list) or q.get("answer") is None:
                continue
        elif qtype == "fill_blank":
            if q.get("answer") is None:
                continue
        elif qtype == "drag_drop_match":
            if not isinstance(q.get("left_items"), list) or not isinstance(q.get("right_items"), list) or q.get("answer") is None:
                continue
        elif qtype == "drag_drop_order":
            if not isinstance(q.get("items"), list) or q.get("answer") is None:
                continue
        else:
            continue
        # ensure source exists
        if "source" not in q:
            q["source"] = {"book": None, "page": None}
        out.append(q)
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=settings.question_bank_path, help="Output JSON file path")
    ap.add_argument("--only_grade", type=int, default=None, help="Build only for specific grade (1-4)")
    ap.add_argument("--only_semester", type=int, default=None, help="Build only for specific semester (1-2)")
    ap.add_argument("--per_skill", type=int, default=25, help="How many questions to generate per skill")
    ap.add_argument("--rag_k", type=int, default=6, help="How many chunks to retrieve per skill")
    args = ap.parse_args()

    skills = load_skills(settings.skills_path)
    store = ChromaStore()
    ollama = OllamaClient()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    bank: Dict[str, List[Dict[str, Any]]] = {}
    if out_path.exists():
        try:
            bank = json.loads(out_path.read_text(encoding="utf-8"))
        except Exception:
            bank = {}

    for sid, sk in skills.items():
        if args.only_grade is not None and sk.grade != args.only_grade:
            continue
        if args.only_semester is not None and sk.semester != args.only_semester:
            continue

        if sid in bank and isinstance(bank[sid], list) and len(bank[sid]) >= args.per_skill:
            continue

        where = None
        if sk.grade is not None and sk.semester is not None:
            where = {"$and": [{"grade": int(sk.grade)}, {"semester": int(sk.semester)}]}

        query = f"تمارين وأسئلة على درس: {sk.title}. أريد أسئلة قصيرة مناسبة لطلاب الصف {sk.grade}."
        q_emb = ollama.embed([query])[0]
        chunks = store.query(q_emb, n_results=args.rag_k, where=where)
        context = "\n\n".join([f"- {c.text}\n  (المصدر: {c.metadata.get('source')} صفحة {c.metadata.get('page')})" for c in chunks])

        prompt = f"""أنت معلم رياضيات. المطلوب: أن تُنشئ أسئلة *للعبة تعليمية* مبنية على محتوى الكتاب.
المهارة: {sk.title}
الصف: {sk.grade} الفصل: {sk.semester}

مقاطع من الكتاب:
{context}

أعطني JSON فقط (بدون شرح) عبارة عن Array من {args.per_skill} سؤال.
مسموح فقط بالأنواع التالية (type):
- mcq_number: (prompt, choices[4], answer, source{{book,page}})
- fill_blank: (prompt, answer, source{{book,page}})
- drag_drop_match: (prompt, left_items, right_items, answer{{left->right}}, source{{book,page}})
- drag_drop_order: (prompt, items, answer[list], source{{book,page}})

قواعد مهمة:
- خلي الأسئلة قصيرة وواضحة جداً للطلاب.
- إذا ما كان السؤال حرفياً موجود بالنص، استنتج سؤال مشابه *بنفس فكرة الدرس* ولا تخترع موضوع خارج المقاطع.
- كل سؤال لازم يحتوي source من أحد المقاطع (book/page).
- لا تستخدم LaTeX.
"""

        resp = ollama.generate(prompt)
        qs = normalize_questions(extract_json_array(resp))
        if not qs:
            qs = [{
                "type": "fill_blank",
                "prompt": f"اكتبي/اكتب مثالاً بسيطاً على: {sk.title}",
                "answer": "—",
                "source": {"book": None, "page": None}
            }]

        bank[sid] = qs[:args.per_skill]
        out_path.write_text(json.dumps(bank, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Built {len(bank[sid])} questions for {sid} ({sk.title})")

    print(f"Saved question bank -> {out_path} | skills: {len(bank)}")

if __name__ == "__main__":
    main()
