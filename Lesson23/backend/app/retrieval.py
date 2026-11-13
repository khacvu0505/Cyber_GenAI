import re


def score(question: str, text: str) -> float:
    tokens = {term for term in re.findall(r"[\wÀ-ỹ]+", question.lower()) if len(term) > 2}
    hits = sum(1 for token in tokens if token in text.lower())
    return round(hits / max(1, len(tokens)), 3)


def rank(question: str, documents: list[dict], limit: int = 6) -> list[dict]:
    relevant = [item for item in documents if score(question, item["text"]) > 0]
    return sorted(relevant, key=lambda item: score(question, item["text"]), reverse=True)[:limit]


def excerpt(text: str, length: int = 360) -> str:
    clean = re.sub(r"\s+", " ", text)
    return clean[:length] + ("..." if len(clean) > length else "")
