"""FastAPI application entry point.

Configures the app, registers routers, sets up middleware, and provides
health/readiness endpoints. Seeds an initial admin user on first boot.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from llm_client import configure_keys

from app.api import auth, chat, contact, health, learn, me, practices
from app.config import settings
from app.database import async_session, engine
from app.logging import setup_logging
from app.models import Base, User

logger = structlog.stdlib.get_logger()


_INSECURE_JWT_SENTINEL = "dev-secret-change-in-production"


def _validate_security_config() -> None:
    """Refuse to start with insecure production config."""
    if settings.debug:
        return
    if settings.jwt_secret_key == _INSECURE_JWT_SENTINEL:
        raise RuntimeError(
            "MOK_JWT_SECRET_KEY is set to the development sentinel. "
            "Generate a strong secret before running in production.",
        )


async def _init_database() -> None:
    """Create tables on first boot, and additively reconcile new columns.

    The dev environment uses SQLite without Alembic, so when we add new
    optional columns to a model we apply them here with ``ALTER TABLE`` so
    existing dev databases continue to work. This is a no-op for fresh DBs
    (the column will already be present from ``Base.metadata.create_all``).
    Replace with Alembic for production schemas.
    """
    from sqlalchemy import inspect, text

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        def _migrate(sync_conn: object) -> None:
            inspector = inspect(sync_conn)
            existing = {c["name"] for c in inspector.get_columns("users")}
            additions = [
                ("stretched_area",   "VARCHAR(20)"),
                ("restore_style",    "VARCHAR(20)"),
                ("tone_preference",  "VARCHAR(20)"),
                ("here_because",     "VARCHAR(20)"),
            ]
            for col, ddl in additions:
                if col not in existing:
                    sync_conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {ddl}"))

        await conn.run_sync(_migrate)


async def _seed_admin_user() -> None:
    """Create a default admin user if no users exist.

    Source of truth:
      - MOK_INITIAL_ADMIN_EMAIL    (default: admin@mok.dev)
      - MOK_INITIAL_ADMIN_PASSWORD (default: empty → generate random)

    When the password is auto-generated, it's logged once at WARNING level so
    the operator can capture it from the log stream. There is no path that
    produces a hardcoded password.
    """
    import secrets

    from sqlalchemy import func, select

    from app.api.auth import _hash_password

    async with async_session() as session:
        result = await session.execute(select(func.count()).select_from(User))
        if (result.scalar() or 0) > 0:
            return

        email = settings.initial_admin_email
        password = settings.initial_admin_password
        generated = False
        if not password:
            password = secrets.token_urlsafe(16)
            generated = True

        admin = User(
            email=email,
            name="Admin",
            password_hash=_hash_password(password),
            role="admin",
        )
        session.add(admin)
        await session.commit()

        if generated:
            logger.warning(
                "seed_admin_created_with_generated_password",
                email=email,
                password=password,
                msg="Initial admin password was auto-generated. Capture it now "
                    "and rotate after first login. Set MOK_INITIAL_ADMIN_PASSWORD "
                    "to control it explicitly.",
            )
        else:
            logger.info("seed_admin_created", email=email)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup and shutdown lifecycle."""
    setup_logging()
    _validate_security_config()

    # Configure the shared LLM client once at startup.
    configure_keys(
        anthropic_api_key=settings.anthropic_api_key or None,
        openai_api_key=settings.openai_api_key or None,
        gemini_api_key=settings.gemini_api_key or None,
        ollama_base_url=settings.ollama_base_url or None,
    )

    await _init_database()
    try:
        await _seed_admin_user()
    except Exception as e:
        logger.warning("seed_admin_failed", error=str(e))

    logger.info("mok_starting", version="0.1.0", debug=settings.debug)
    yield
    await engine.dispose()
    logger.info("mok_shutdown_complete")


app = FastAPI(
    title=settings.app_name,
    description="Base AI application — Python + React starter",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# CORS — allow all in dev, allow the configured frontend URL in production.
# Never combine wildcard origins with allow_credentials=True.
_cors_origins: list[str] = ["*"] if settings.debug else (
    [settings.frontend_url] if settings.frontend_url else []
)
_cors_allow_credentials = "*" not in _cors_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=_cors_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(me.router, prefix="/api/v1")
app.include_router(practices.router, prefix="/api/v1")
app.include_router(learn.router, prefix="/api/v1")
app.include_router(contact.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(health.router)
