# Multi-stage build for mok backend.
# Stage 1: dependency resolution with uv on a slim Python image.
# Stage 2: copy the resolved venv + app code into a non-root runtime image.

FROM python:3.12-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential curl ca-certificates git \
    && rm -rf /var/lib/apt/lists/*

RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

WORKDIR /app
COPY pyproject.toml ./
COPY app ./app

RUN uv sync --no-dev


FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:${PATH}"

RUN groupadd --system mok && useradd --system --gid mok --uid 1000 mok

WORKDIR /app
COPY --from=builder --chown=mok:mok /app/.venv ./.venv
COPY --chown=mok:mok app ./app

USER mok

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
