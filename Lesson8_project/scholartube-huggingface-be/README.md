# ScholarTube Edu — Hugging Face Backend

FastAPI service for ScholarTube Edu.

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Hugging Face is the only AI provider. Configure:

- `HF_TOKEN`: a Hugging Face access token; never expose it to the frontend.
- `HF_MODEL`: defaults to `Qwen/Qwen2.5-7B-Instruct`.
- `HF_INFERENCE_PROVIDER`: defaults to `auto` for Hugging Face routing.
- `HF_MAX_TOKENS`: maximum response tokens.
- `HF_REDUCE_BATCH_SIZE`: number of intermediate notes per reduce group.

Summaries and study artifacts use hierarchical map-reduce. Every non-empty transcript
chunk is mapped; long videos are reduced in groups before the final generation. Transcript
requests accept `preferred_languages` and optional `translate_to` (`vi` or `en`).

Auth endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Demo password for seeded users: `Demo@12345`

Tables and demo marketplace data are created on startup through SQLAlchemy metadata. For production, add Alembic migrations before changing schemas.

## Database

The app reads PostgreSQL credentials from:

```env
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_DATABASE=
```

Without those values, it falls back to SQLite for local development.
