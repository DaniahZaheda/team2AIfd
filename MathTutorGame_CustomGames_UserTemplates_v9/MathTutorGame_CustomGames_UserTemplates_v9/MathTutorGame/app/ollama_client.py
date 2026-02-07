from __future__ import annotations
import requests
from typing import List, Dict, Any, Optional
from .config import settings

class OllamaClient:
    def __init__(self, base_url: str | None = None):
        self.base_url = (base_url or settings.ollama_base_url).rstrip("/")
        self._session = requests.Session()

    def embed(self, texts: List[str], model: str | None = None, timeout: int = 600) -> List[List[float]]:
        url = f"{self.base_url}/api/embed"
        payload: Dict[str, Any] = {
            "model": model or settings.embed_model,
            "input": texts,
        }
        # keep_alive is supported by Ollama for some endpoints; safe to include
        payload["keep_alive"] = "10m"
        r = self._session.post(url, json=payload, timeout=timeout)
        if r.status_code != 200:
            raise RuntimeError(f"Ollama embed error {r.status_code}: {r.text}")
        data = r.json()
        return data["embeddings"]

    def generate(self, prompt: str, model: str | None = None, timeout: int = 900, options: Dict[str, Any] | None = None) -> str:
        url = f"{self.base_url}/api/generate"
        payload: Dict[str, Any] = {
            "model": model or settings.llm_model,
            "prompt": prompt,
            "stream": False,
            "keep_alive": "10m",
        }
        # Speed defaults (can be overridden)
        payload["options"] = {
            "num_predict": 240,
            "temperature": 0.25,
            "top_p": 0.9,
        }
        if options:
            payload["options"].update(options)

        r = self._session.post(url, json=payload, timeout=timeout)
        if r.status_code != 200:
            raise RuntimeError(f"Ollama generate error {r.status_code}: {r.text}")
        return r.json().get("response", "")
