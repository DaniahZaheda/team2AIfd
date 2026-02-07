# MathTutorRAG - API + UI (FastAPI)
FROM python:3.11-slim

WORKDIR /app

# System deps for pypdf and general
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY scripts ./scripts
COPY README.md ./
COPY .env.example ./

# Persisted data
RUN mkdir -p /app/chroma_db /app/app/data

ENV PYTHONUNBUFFERED=1
ENV PORT=5050

EXPOSE 5050

CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","5050"]
