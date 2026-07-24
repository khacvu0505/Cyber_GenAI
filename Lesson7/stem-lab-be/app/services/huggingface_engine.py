from __future__ import annotations

from typing import Any

from app.core.config import Settings


class HuggingFaceConfigurationError(RuntimeError):
    pass


class HuggingFaceGenerationError(RuntimeError):
    pass


class HuggingFaceEngine:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.mode = settings.hf_execution_mode.strip().lower()
        if self.mode not in {"inference", "local"}:
            raise HuggingFaceConfigurationError("HF_EXECUTION_MODE must be 'inference' or 'local'.")
        self._client: Any | None = None
        self._pipeline: Any | None = None

    def generate(
        self,
        messages: list[dict[str, str]],
        *,
        do_sample: bool,
        seed: int,
    ) -> str:
        if self.mode == "local":
            return self._generate_local(messages, do_sample=do_sample, seed=seed)
        return self._generate_inference(messages, do_sample=do_sample, seed=seed)

    def _generate_inference(
        self,
        messages: list[dict[str, str]],
        *,
        do_sample: bool,
        seed: int,
    ) -> str:
        if not self.settings.hf_token:
            raise HuggingFaceConfigurationError("HF_TOKEN is required when HF_EXECUTION_MODE=inference.")
        if self._client is None:
            try:
                from huggingface_hub import InferenceClient
            except ImportError as exc:
                raise HuggingFaceConfigurationError("Install dependencies from requirements.txt.") from exc
            self._client = InferenceClient(
                model=self.settings.hf_model_id,
                provider=self.settings.hf_inference_provider,
                token=self.settings.hf_token,
                timeout=self.settings.hf_timeout_seconds,
            )

        try:
            response = self._client.chat_completion(
                messages=messages,
                max_tokens=self.settings.hf_max_new_tokens,
                temperature=self.settings.hf_temperature if do_sample else 0.01,
                seed=seed,
            )
            content = response.choices[0].message.content
        except Exception as exc:
            raise HuggingFaceGenerationError(f"Hugging Face inference failed: {exc}") from exc
        return _ensure_content(content)

    def _generate_local(
        self,
        messages: list[dict[str, str]],
        *,
        do_sample: bool,
        seed: int,
    ) -> str:
        if self._pipeline is None:
            try:
                import torch
                from transformers import pipeline, set_seed
            except ImportError as exc:
                raise HuggingFaceConfigurationError(
                    "Local mode requires requirements-local.txt."
                ) from exc
            set_seed(seed)
            dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32
            self._pipeline = pipeline(
                "text-generation",
                model=self.settings.hf_model_id,
                dtype=dtype,
                device_map="auto",
            )
        else:
            from transformers import set_seed

            set_seed(seed)

        try:
            generation_kwargs: dict[str, Any] = {
                "max_new_tokens": self.settings.hf_max_new_tokens,
                "do_sample": do_sample,
                "return_full_text": True,
            }
            if do_sample:
                generation_kwargs["temperature"] = self.settings.hf_temperature
            output = self._pipeline(messages, **generation_kwargs)
            generated = output[0]["generated_text"]
            content = generated[-1]["content"] if isinstance(generated, list) else generated
        except Exception as exc:
            raise HuggingFaceGenerationError(f"Local Hugging Face generation failed: {exc}") from exc
        return _ensure_content(content)


def _ensure_content(content: str | None) -> str:
    if not content or not content.strip():
        raise HuggingFaceGenerationError("Hugging Face returned an empty response.")
    return content.strip()


_cached_engine: HuggingFaceEngine | None = None


def get_huggingface_engine(settings: Settings) -> HuggingFaceEngine:
    global _cached_engine
    if _cached_engine is None or _cached_engine.settings != settings:
        _cached_engine = HuggingFaceEngine(settings)
    return _cached_engine
