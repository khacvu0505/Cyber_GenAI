from __future__ import annotations

import json
from pathlib import Path

from .config import DATASET_DIR
from .schemas import User


def _read_json(name: str):
    with (DATASET_DIR / name).open(encoding="utf-8") as source:
        return json.load(source)


def _document_text(item: dict) -> str:
    path = DATASET_DIR / item["path"]
    return path.read_text(encoding="utf-8").replace("#", " ").replace("\n", " ").strip()


USERS = {item["user_id"]: User(**item) for item in _read_json("users.json")}
MANIFEST = _read_json("document_manifest.json")
DOCUMENTS = [{**item, "text": _document_text(item), "title": item["document_id"].replace("_", " ").title()} for item in MANIFEST]
