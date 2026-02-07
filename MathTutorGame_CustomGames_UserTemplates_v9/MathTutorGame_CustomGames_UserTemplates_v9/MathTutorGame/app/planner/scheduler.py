from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, List, Optional, Set, Tuple
import json
from pathlib import Path

@dataclass
class Skill:
    skill_id: str
    title: str
    prereq: List[str]
    threshold: float
    grade: int | None = None
    semester: int | None = None

def load_skills(skills_path: str) -> Dict[str, Skill]:
    p = Path(skills_path)
    data = json.loads(p.read_text(encoding='utf-8'))
    skills: Dict[str, Skill] = {}
    for it in data:
        skills[it["skill_id"]] = Skill(
            skill_id=it["skill_id"],
            title=it.get("title",""),
            prereq=list(it.get("prereq") or []),
            threshold=float(it.get("threshold", 0.7)),
            grade=it.get("grade"),
            semester=it.get("semester"),
        )
    return skills

def topo_sort_subset(skills: Dict[str, Skill], subset: Set[str]) -> List[str]:
    # Kahn's algorithm on induced subgraph
    indeg: Dict[str, int] = {s: 0 for s in subset}
    adj: Dict[str, List[str]] = {s: [] for s in subset}
    for s in subset:
        for pre in skills.get(s, Skill(s,"",[],0.7)).prereq:
            if pre in subset:
                indeg[s] += 1
                adj[pre].append(s)
    q = [s for s, d in indeg.items() if d == 0]
    out = []
    while q:
        n = q.pop(0)
        out.append(n)
        for m in adj.get(n, []):
            indeg[m] -= 1
            if indeg[m] == 0:
                q.append(m)
    # Cycle fallback: append remaining in stable order
    if len(out) != len(subset):
        remain = [s for s in subset if s not in out]
        out.extend(sorted(remain))
    return out

def build_plan(
    missing: List[Tuple[str, float]],  # (skill_id, mastery)
    skills: Dict[str, Skill],
    minutes_per_day: int = 15,
    include_prereqs: bool = True,
) -> List[List[str]]:
    # Decide which skills to schedule
    missing_ids = [sid for sid, _ in missing]
    to_cover: Set[str] = set(missing_ids)
    if include_prereqs:
        # include prereqs recursively
        stack = list(missing_ids)
        seen = set(stack)
        while stack:
            sid = stack.pop()
            for pre in skills.get(sid, Skill(sid,"",[],0.7)).prereq:
                if pre not in seen:
                    seen.add(pre)
                    to_cover.add(pre)
                    stack.append(pre)

    ordered = topo_sort_subset(skills, to_cover)

    # simple packing: 1 skill/day, sometimes 2 if minutes_per_day>=20
    per_day = 2 if minutes_per_day >= 20 else 1
    plan: List[List[str]] = []
    day: List[str] = []
    for sid in ordered:
        day.append(sid)
        if len(day) >= per_day:
            plan.append(day)
            day = []
    if day:
        plan.append(day)
    return plan
