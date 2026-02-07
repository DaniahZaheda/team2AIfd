from __future__ import annotations
from dataclasses import dataclass
from typing import Any, Dict, List, Optional
import os

# chromadb is optional for running the MathTutor Game.
# If it's not installed, we provide a tiny in-memory fallback so the app can still start.
try:
    import chromadb  # type: ignore
    from chromadb.config import Settings as ChromaSettings  # type: ignore
except Exception:  # pragma: no cover
    chromadb = None
    ChromaSettings = None
from ..config import settings

@dataclass
class RetrievedChunk:
    text: str
    metadata: Dict[str, Any]
    distance: float

class ChromaStore:
    def __init__(self, persist_path: str | None = None, collection: str | None = None):
        self.persist_path = persist_path or settings.chroma_path
        self.collection_name = collection or settings.rag_collection
        self._mem: List[RetrievedChunk] = []
        self.client = None
        self.collection = None

        # On some Windows environments, Chroma/Posthog telemetry can emit noisy errors
        # (e.g. "capture() takes 1 positional argument but 3 were given").
        # Those errors SHOULD NOT stop the web server. If Chroma fails to init, we
        # gracefully fall back to an in-memory store so FastAPI stays up.
        if chromadb is not None:
            try:
                os.environ.setdefault("ANONYMIZED_TELEMETRY", "FALSE")
                self.client = chromadb.PersistentClient(
                    path=self.persist_path,
                    settings=ChromaSettings(anonymized_telemetry=False),
                )
                self.collection = self.client.get_or_create_collection(
                    name=self.collection_name,
                    metadata={"hnsw:space": "cosine"},
                )
            except Exception:
                self.client = None
                self.collection = None

    def add(self, ids: List[str], documents: List[str], embeddings: List[List[float]], metadatas: List[Dict[str, Any]]):
        if self.collection is None:
            # minimal fallback (no embeddings search). Keep text + metadata.
            for doc, meta in zip(documents, metadatas):
                self._mem.append(RetrievedChunk(text=doc, metadata=meta or {}, distance=0.0))
            return
        self.collection.add(ids=ids, documents=documents, embeddings=embeddings, metadatas=metadatas)

    def count(self) -> int:
        if self.collection is None:
            return len(self._mem)
        return self.collection.count()

    def query(self, query_embedding: List[float], n_results: int = 5, where: Optional[Dict[str, Any]] = None) -> List[RetrievedChunk]:
        if self.collection is None:
            # fallback: just return last N chunks
            return list(reversed(self._mem))[:n_results]

        res = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where,
            include=["documents", "metadatas", "distances"],
        )
        docs = res.get("documents", [[]])[0]
        metas = res.get("metadatas", [[]])[0]
        dists = res.get("distances", [[]])[0]
        out: List[RetrievedChunk] = []
        for t, m, d in zip(docs, metas, dists):
            out.append(RetrievedChunk(text=t, metadata=m or {}, distance=float(d)))
        return out
