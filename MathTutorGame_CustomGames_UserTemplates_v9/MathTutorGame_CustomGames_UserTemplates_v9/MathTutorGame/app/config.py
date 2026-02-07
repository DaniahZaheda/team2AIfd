
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


# Resolve default paths relative to the repository, not the current working directory.
_APP_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _APP_DIR.parent
_DATA_DIR = _APP_DIR / "data"

@dataclass(frozen=True)
class Settings:
    ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    llm_model: str = os.getenv("LLM_MODEL", "gemma3:latest")
    embed_model: str = os.getenv("EMBED_MODEL", "embeddinggemma:latest")
    chroma_path: str = os.getenv("CHROMA_PATH", str(_REPO_ROOT / "chroma_db"))
    skills_path: str = os.getenv("SKILLS_PATH", str(_DATA_DIR / "skills.json"))
    videos_path: str = os.getenv("VIDEOS_PATH", str(_DATA_DIR / "videos.json"))
    question_bank_path: str = os.getenv("QUESTION_BANK_PATH", str(_DATA_DIR / "question_bank.json"))
    rag_collection: str = os.getenv("RAG_COLLECTION", "school_books")
    debug_include_answers: bool = os.getenv("DEBUG_INCLUDE_ANSWERS", "false").lower() == "true"

settings = Settings()
