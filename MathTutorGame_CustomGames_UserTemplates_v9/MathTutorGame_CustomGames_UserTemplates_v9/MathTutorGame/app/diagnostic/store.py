from __future__ import annotations
from typing import Dict
from .diagnostic import Session

# تخزين في الذاكرة (للاستخدام المحلي)
SESSIONS: Dict[str, Session] = {}
