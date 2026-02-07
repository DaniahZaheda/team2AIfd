# تشغيل MathTutor Game على Windows (PowerShell)

> **المشروع = Backend (FastAPI) + Frontend (واجهة لعبة داخل نفس السيرفر)**

## 1) تجهيز البيئة

افتح PowerShell داخل مجلد المشروع (مكان `requirements.txt`) ثم:

```powershell
python -m venv .venv
./.venv/Scripts/Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

> إذا ظهرت مشكلة سياسة تشغيل السكربتات:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
./.venv/Scripts/Activate.ps1
```

## 2) تشغيل السيرفر

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 5050
```

## 3) فتح اللعبة من المتصفح

- اللعبة: `http://127.0.0.1:5050/ui/game/index.html`
- توثيق API: `http://127.0.0.1:5050/docs`

## 4) الـ API الثابتة المطلوبة

- **GET** `/api/diagnostic?grade=1|2|3|4`
- **POST** `/api/diagnostic/submit`
- **POST** `/api/plan`

## ملاحظات

- التقدم (Stars/Coins) محفوظ في `localStorage` داخل المتصفح.
- ملف بنك الأسئلة داخل المشروع: `app/data/question_bank.json`
- خريطة فيديوهات يوتيوب: `app/data/videos.json`
