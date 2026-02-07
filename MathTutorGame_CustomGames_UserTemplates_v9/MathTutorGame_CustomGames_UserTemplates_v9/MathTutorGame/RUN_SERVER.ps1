# Run the backend reliably on Windows (no hot-reload).
# Hot-reload (--reload) can exit unexpectedly on some Windows setups.

$ErrorActionPreference = 'Stop'

if (!(Test-Path .\.venv)) {
  py -m venv .venv
}

.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt

# Disable Chroma telemetry noise
$env:ANONYMIZED_TELEMETRY = 'FALSE'

python -m uvicorn app.main:app --host 127.0.0.1 --port 5050
