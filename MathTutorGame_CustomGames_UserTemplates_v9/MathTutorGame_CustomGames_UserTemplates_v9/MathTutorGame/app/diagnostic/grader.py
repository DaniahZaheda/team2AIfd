from __future__ import annotations

def normalize(s: str) -> str:
    return (s or "").strip().replace(" ","")


def grade(student_answer: str, expected_answer: str) -> bool:
    # تصحيح بسيط:
    a = normalize(student_answer)
    e = normalize(expected_answer)

    # دعم بعض الصيغ: عشرات=...،آحاد=...
    if e.startswith("عشرات=") and "آحاد=" in e:
        # نقبل عدة صيغ قريبة
        return a.replace("؛",",").replace("،",",") == e or a == e.replace(",","")

    return a == e
