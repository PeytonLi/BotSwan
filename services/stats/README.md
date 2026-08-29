# BotSwan Stats Service

Python FastAPI microservice for sandboxed statistical code execution, chart rendering, PDF extraction, and URL screenshots.

## Requirements

- Python 3.11+
- [uv](https://github.com/astral-sh/uv) or pip

## Setup

From `services/stats/`:

```bash
# Using uv (recommended)
uv venv
uv pip install -e ".[dev]"

# Or using pip
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -e ".[dev]"
```

Optional browser support for URL screenshots:

```bash
uv pip install -e ".[browser]"
playwright install chromium
```

## Run

From `services/stats/`:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check: `GET http://localhost:8000/health`

## Test

```bash
pytest
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health check |
| POST | `/execute` | Run allowlisted Python code (`{"code": "print(2+2)"}`) |
| POST | `/render` | Render matplotlib chart to PNG bytes |

## Modules

- `app/sandbox.py` — Restricted code execution with module allowlist and timeout
- `app/render.py` — Matplotlib chart → PNG
- `app/pdf.py` — PDF page/image extraction (PyMuPDF)
- `app/screenshot.py` — URL screenshot via Playwright (optional)
