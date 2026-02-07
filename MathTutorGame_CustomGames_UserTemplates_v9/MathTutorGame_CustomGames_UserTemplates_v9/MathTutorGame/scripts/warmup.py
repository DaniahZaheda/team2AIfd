from __future__ import annotations
from app.ollama_client import OllamaClient

def main():
    ollama = OllamaClient()
    print("Warming up embed model...")
    _ = ollama.embed(["مرحبا"])
    print("Warming up LLM...")
    _ = ollama.generate("قل مرحبا بالعربية بجملة قصيرة.")
    print("Done.")

if __name__ == "__main__":
    main()
