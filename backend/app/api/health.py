"""Health and readiness endpoints."""

from __future__ import annotations

import time

from fastapi import APIRouter
from sqlalchemy import text
from starlette.responses import JSONResponse

from app.config import settings
from app.database import engine

router = APIRouter(tags=["system"])


@router.get("/health")
async def health() -> dict:
    """Liveness probe — is the process running?"""
    return {"status": "ok", "service": settings.app_name, "version": "0.1.0"}


@router.get("/ready")
async def ready() -> JSONResponse:
    """Readiness probe — can we serve traffic? Checks database connectivity."""
    checks: dict[str, dict] = {}

    t0 = time.monotonic()
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["database"] = {
            "status": "ok",
            "latency_ms": round((time.monotonic() - t0) * 1000, 1),
        }
    except Exception as e:
        checks["database"] = {"status": "error", "error": str(e)}

    all_ok = all(c["status"] == "ok" for c in checks.values())
    return JSONResponse(
        content={"status": "ok" if all_ok else "degraded", "checks": checks},
        status_code=200 if all_ok else 503,
    )
