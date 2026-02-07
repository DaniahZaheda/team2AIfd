from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict, List, Tuple
import random
import uuid
import math
import re

def _qid() -> str:
    return str(uuid.uuid4())

def _mcq_from_numeric(prompt: str, correct: float, spread: int = 4) -> Dict[str, Any]:
    # build plausible distractors
    choices = {correct}
    while len(choices) < 4:
        delta = random.randint(-spread, spread)
        if delta == 0: 
            continue
        choices.add(correct + delta)
    choices = list(choices)
    random.shuffle(choices)
    return {
        "id": _qid(),
        "type": "mcq_number",
        "prompt": prompt,
        "choices": [str(c) for c in choices],
        "answer": str(correct),
        "answer_index": choices.index(correct)
    }

def gen_addition(n: int = 5) -> List[Dict[str, Any]]:
    out=[]
    for _ in range(n):
        a,b = random.randint(0,99), random.randint(0,99)
        out.append(_mcq_from_numeric(f"كم ناتج {a} + {b} ؟", a+b))
    return out

def gen_subtraction(n: int = 5) -> List[Dict[str, Any]]:
    out=[]
    for _ in range(n):
        a,b = random.randint(0,99), random.randint(0,99)
        if b>a: a,b=b,a
        out.append(_mcq_from_numeric(f"كم ناتج {a} − {b} ؟", a-b))
    return out

def gen_multiplication(n: int = 5) -> List[Dict[str, Any]]:
    out=[]
    for _ in range(n):
        a,b = random.randint(0,12), random.randint(0,12)
        out.append(_mcq_from_numeric(f"كم ناتج {a} × {b} ؟", a*b, spread=12))
    return out

def gen_division(n: int = 5) -> List[Dict[str, Any]]:
    out=[]
    for _ in range(n):
        b = random.randint(1,12)
        c = random.randint(0,12)
        a = b*c
        out.append(_mcq_from_numeric(f"كم ناتج {a} ÷ {b} ؟", c, spread=6))
    return out

def gen_fraction_decimal_match(n_pairs: int = 4) -> Dict[str, Any]:
    pairs=[]
    for _ in range(n_pairs):
        denom = random.choice([2,4,5,10,20])
        num = random.randint(1, denom-1)
        val = num/denom
        frac = f"{num}/{denom}"
        dec = f"{val:.2f}".rstrip("0").rstrip(".")
        pairs.append((frac, dec))
    left = [p[0] for p in pairs]
    right = [p[1] for p in pairs]
    random.shuffle(left); random.shuffle(right)
    answer = {l: next(r for (f,r) in pairs if f==l) for l in left}
    return {
        "id": _qid(),
        "type": "drag_drop_match",
        "prompt": "اسحبي/اسحب كل كسر إلى قيمته العشرية الصحيحة:",
        "left_items": left,
        "right_items": right,
        "answer": answer
    }


def gen_match_expressions(n_pairs: int = 4, max_val: int = 20) -> Dict[str, Any]:
    """
    Generate a kid-friendly matching question:
    left: simple expressions (e.g., 3 + 2)
    right: results (e.g., 5)
    """
    pairs=[]
    for _ in range(n_pairs):
        a = random.randint(0, max_val//2)
        b = random.randint(0, max_val//2)
        op = random.choice(["+", "-"])
        if op == "-":
            if b > a: a, b = b, a
            res = a - b
        else:
            res = a + b
        pairs.append((f"{a} {op} {b}", str(res)))
    left=[p[0] for p in pairs]
    right=[p[1] for p in pairs]
    random.shuffle(left); random.shuffle(right)
    answer = {l: next(r for (f,r) in pairs if f==l) for l in left}
    return {
        "id": _qid(),
        "type": "drag_drop_match",
        "prompt": "صِل كل عملية بإجابتِها الصحيحة:",
        "left_items": left,
        "right_items": right,
        "answer": answer
    }

def gen_order_numbers(n: int = 6) -> Dict[str, Any]:
    nums = random.sample(range(0, 50), k=n)
    correct = sorted(nums)
    return {
        "id": _qid(),
        "type": "drag_drop_order",
        "prompt": "رتّبي الأرقام من الأصغر إلى الأكبر:",
        "items": [str(x) for x in nums],
        "answer": [str(x) for x in correct]
    }

def generate_game_pack(skill_id: str, n: int = 5, mode: str | None = None) -> List[Dict[str, Any]]:
    sid = skill_id.lower()
    m = (mode or "").lower().strip()
    if m in ("connect","match"):
        # generate multiple matching questions
        return [gen_match_expressions(n_pairs=4, max_val=20) for _ in range(max(1, min(n, 3)))]
    # heuristic routing
    if "count" in sid:
        return [gen_order_numbers()]
    if "mult" in sid:
        return gen_multiplication(n)
    if "div" in sid:
        return gen_division(n)
    if "sub" in sid:
        return gen_subtraction(n)
    if "add" in sid:
        return gen_addition(n)
    if "fraction" in sid or "fractions" in sid:
        return [gen_fraction_decimal_match()]
    if "decimal" in sid or "decimals" in sid:
        # decimals addition
        out=[]
        for _ in range(n):
            a = round(random.uniform(0, 9.9), 1)
            b = round(random.uniform(0, 9.9), 1)
            correct = round(a+b, 1)
            out.append({
                "id": _qid(),
                "type": "fill_blank",
                "prompt": f"أكملي: {a} + {b} = ____",
                "answer": str(correct)
            })
        return out
    # default
    return gen_addition(n)
