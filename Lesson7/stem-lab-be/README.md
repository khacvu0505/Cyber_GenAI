# STEM Reasoning Lab API

FastAPI backend for the Hugging Face-powered STEM tutor.

The AI layer supports:

- Hugging Face Inference Providers through `InferenceClient`.
- Local generation through `transformers.pipeline`.
- Deterministic direct and guided generation.
- Sampled self-consistency generation.
- Answer verification for curated problems.
- Structured pedagogical output instead of raw chain-of-thought.

See the project-level `README.md` for setup and configuration.
