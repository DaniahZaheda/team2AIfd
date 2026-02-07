# Math Tutor RAG (Ollama + Gemma3) — FastAPI

منصة تشخيص + خطة علاجية + ألعاب تعليمية مدعومة بـ RAG.

## ماذا يفعل المشروع؟
- فهرسة كتب المنهاج (PDF/TXT) داخل **Chroma Vector DB**
- استرجاع مقاطع (RAG) عبر **Ollama Embeddings**
- تشخيص مهارات الطالب (Grades 1–4) بإجابات وتصحيح آلي
- توليد خطة علاجية (مثلاً 15 دقيقة/يوم) حسب المهارات الناقصة
- توليد ألعاب: MCQ / Fill blank / Drag&Drop (match & order)
- ربط فيديو يوتيوب لكل مهارة عبر `videos.json`

> ملاحظة: “تدريب” RAG هنا يعني **Indexing + Embeddings** وليس Fine-tuning.

---

## المتطلبات
- Python 3.11 
- Ollama يعمل محليًا على `http://localhost:11434`

### تنزيل نماذج Ollama (مرة واحدة)
```bash
ollama pull gemma3:latest
ollama pull embeddinggemma:latest
- **جلسات التشخيص حاليًا In-Memory** (تُحفظ داخل متغير `SESSIONS`) لأغراض الديمو والاختبار السريع.
- يمكن تطوير ذلك بسهولة إلى **تخزين دائم** مثل **SQLite** أو **Redis** لضمان بقاء الجلسات بعد إعادة تشغيل السيرفر، ودعم تعدد المستخدمين بشكل أفضل.



إنشاء بيئة افتراضية وتثبيت المكتبات##
ملف .venv
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
