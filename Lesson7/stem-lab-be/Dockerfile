# syntax=docker/dockerfile:1

FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN groupadd --system --gid 1001 stemlab \
    && useradd --system --uid 1001 --gid stemlab --home-dir /app stemlab

COPY requirements.txt ./
RUN pip install --upgrade pip \
    && pip install --requirement requirements.txt

COPY --chown=stemlab:stemlab app ./app
COPY --chown=stemlab:stemlab alembic ./alembic
COPY --chown=stemlab:stemlab alembic.ini docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER stemlab
EXPOSE 8001

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8001/api/health', timeout=3)" || exit 1

CMD ["./docker-entrypoint.sh"]
