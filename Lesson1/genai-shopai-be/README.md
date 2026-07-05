# ShopAI Assistant Backend

FastAPI backend for products, orders, and the AI customer support chat.

## Run

```bash
python3 -m venv myenv
source myenv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

Open `http://127.0.0.1:8000/docs`.

## Environment

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5-mini
FRONTEND_ORIGIN=http://localhost:3000

DB_HOST=
DB_PORT=5432
DB_USER=
DB_PASSWORD=
DB_DATABASE=
DB_SSLMODE=require
```

Do not commit `.env`.