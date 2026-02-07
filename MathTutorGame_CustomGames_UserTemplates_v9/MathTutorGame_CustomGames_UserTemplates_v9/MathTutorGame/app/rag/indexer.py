from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, Any, Iterable, List, Tuple
from pathlib import Path
import re
from pypdf import PdfReader
from tqdm import tqdm
import uuid

from .store import ChromaStore
from ..ollama_client import OllamaClient

def clean_text(s: str) -> str:
    s = s.replace("\u00a0", " ")
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()

def chunk_text(text: str, chunk_words: int = 220, overlap_words: int = 40) -> List[str]:
    # Simple word-based chunking that works better than raw char chunking
    words = text.split()
    if not words:
        return []
    chunks = []
    i = 0
    while i < len(words):
        j = min(len(words), i + chunk_words)
        chunk = " ".join(words[i:j])
        chunks.append(chunk)
        if j == len(words):
            break
        i = max(0, j - overlap_words)
    return chunks

def extract_pdf_pages(pdf_path: Path) -> List[Tuple[int, str]]:
    reader = PdfReader(str(pdf_path))
    pages = []
    for idx, page in enumerate(reader.pages, start=1):
        txt = page.extract_text() or ""
        txt = clean_text(txt)
        if txt:
            pages.append((idx, txt))
    return pages

@dataclass
class IndexStats:
    files_indexed: int
    chunks_added: int

def index_books(
    books_dir: Path,
    store: ChromaStore,
    ollama: OllamaClient,
    default_meta: Dict[str, Any] | None = None,
    batch_size: int = 32,
) -> IndexStats:
    default_meta = default_meta or {}
    files = []
    for ext in ("*.pdf", "*.txt"):
        files.extend(list(books_dir.rglob(ext)))
    chunks_added = 0
    files_indexed = 0

    # Batch buffers
    buf_docs: List[str] = []
    buf_ids: List[str] = []
    buf_meta: List[Dict[str, Any]] = []

    def flush():
        nonlocal chunks_added, buf_docs, buf_ids, buf_meta
        if not buf_docs:
            return
        embeds = ollama.embed(buf_docs)
        store.add(ids=buf_ids, documents=buf_docs, embeddings=embeds, metadatas=buf_meta)
        chunks_added += len(buf_docs)
        buf_docs, buf_ids, buf_meta = [], [], []

    for fp in tqdm(files, desc="Indexing books"):
        fp = Path(fp)
        if fp.suffix.lower() == ".pdf":
            pages = extract_pdf_pages(fp)
            if not pages:
                continue
            for page_no, page_text in pages:
                for chunk in chunk_text(page_text):
                    buf_docs.append(chunk)
                    buf_ids.append(str(uuid.uuid4()))
                    meta = dict(default_meta)
                    meta.update({"source": fp.name, "path": str(fp), "page": page_no})
                    buf_meta.append(meta)
                    if len(buf_docs) >= batch_size:
                        flush()
            files_indexed += 1
        elif fp.suffix.lower() == ".txt":
            txt = clean_text(fp.read_text(encoding="utf-8", errors="ignore"))
            if not txt:
                continue
            for chunk in chunk_text(txt):
                buf_docs.append(chunk)
                buf_ids.append(str(uuid.uuid4()))
                meta = dict(default_meta)
                meta.update({"source": fp.name, "path": str(fp), "page": None})
                buf_meta.append(meta)
                if len(buf_docs) >= batch_size:
                    flush()
            files_indexed += 1

    flush()
    return IndexStats(files_indexed=files_indexed, chunks_added=chunks_added)
