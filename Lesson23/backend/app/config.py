from __future__ import annotations

import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASET_DIR = Path(os.getenv("DATASET_DIR", str(PROJECT_ROOT.parent / "23. RAG Security & Access Control " / "sample_data")))
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{PROJECT_ROOT / 'data' / 'local.db'}")
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-before-production")
JWT_ALGORITHM = "HS256"
CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

if DATABASE_URL.startswith("sqlite"):
    (PROJECT_ROOT / "data").mkdir(exist_ok=True)
