"""Extract the department PDFs into JSONL chunks while preserving manifest metadata.

Usage: python scripts/ingest_pdfs.py
"""
import json
from pathlib import Path
import fitz

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT.parent / "23. RAG Security & Access Control "
manifest = json.loads((SOURCE / "sample_data" / "document_manifest.json").read_text())
out = ROOT / "data" / "chunks.jsonl"
out.parent.mkdir(exist_ok=True)
with out.open("w", encoding="utf-8") as stream:
    for doc in manifest:
        pdf = SOURCE / "output" / "pdf" / f"{doc['document_id']}.pdf"
        for page_number, page in enumerate(fitz.open(pdf), start=1):
            text = page.get_text("text").strip()
            if text:
                stream.write(json.dumps({**doc, "page": page_number, "text": text}, ensure_ascii=False) + "\n")
print(f"Wrote {out}")
