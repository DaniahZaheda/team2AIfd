from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from app.ollama_client import OllamaClient
from app.rag.indexer import index_books
from app.rag.store import ChromaStore


def infer_meta_from_folder(folder: Path) -> dict:
    """
    Infer grade/semester from folder name like:
    g1s1, g1s2, g2s1, ...
    """
    name = folder.name.lower()
    m = re.search(r"g(\d+)\s*s(\d+)", name)
    if not m:
        return {}
    return {"grade": int(m.group(1)), "semester": int(m.group(2))}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--books_dir", required=True, help="Folder containing PDF/TXT books")
    ap.add_argument("--chroma_path", default=None)
    ap.add_argument("--collection", default=None)
    ap.add_argument(
        "--meta",
        default=None,
        help='Optional JSON metadata to attach to all chunks, e.g. {"grade": 4}',
    )
    args = ap.parse_args()

    books_dir = Path(args.books_dir)
    if not books_dir.exists():
        raise SystemExit(f"books_dir not found: {books_dir}")

    # ---- meta handling (SAFE for PowerShell) ----
    meta = {}
    if args.meta:
        try:
            meta = json.loads(args.meta)
        except Exception:
            # If meta isn't valid JSON, fall back to folder inference
            meta = infer_meta_from_folder(books_dir)
    else:
        meta = infer_meta_from_folder(books_dir)

    store = ChromaStore(persist_path=args.chroma_path, collection=args.collection)
    ollama = OllamaClient()
    stats = index_books(books_dir=books_dir, store=store, ollama=ollama, default_meta=meta)

    print(f"Using meta: {meta}")
    print(f"Indexed files: {stats.files_indexed}")
    print(f"Added chunks:  {stats.chunks_added}")
    print(f"Total docs in index now: {store.count()}")


if __name__ == "__main__":
    main()
