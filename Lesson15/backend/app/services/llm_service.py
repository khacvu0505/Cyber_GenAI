from crewai import LLM

from ..config import settings


def create_openai_llm() -> LLM:
    if not settings.openai_api_key.strip():
        raise RuntimeError("OPENAI_API_KEY chưa được cấu hình ở backend.")
    model = settings.openai_model.strip()
    if "/" not in model:
        model = f"openai/{model}"
    return LLM(model=model, api_key=settings.openai_api_key, temperature=0.2)
