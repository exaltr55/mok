"""Authentication endpoints — register, login, forgot/reset password, current user.

User profile fields (phase, intention, etc.) live on the User but are exposed
through /me endpoints rather than baked into the JWT. The JWT carries only the
minimum (`sub`, `email`, `role`, `exp`) — short-lived, stateless, narrow.
"""

from __future__ import annotations

import contextlib
import time
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel as PydanticModel
from pydantic import EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: TC002

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.services.email_service import (
    send_password_changed_email,
    send_password_reset_email,
    send_welcome_email,
)

router = APIRouter(prefix="/auth", tags=["auth"])

_BCRYPT_ROUNDS = 14


# ── Password policy ─────────────────────────────────────────────


def validate_password_strength(password: str) -> None:
    errors: list[str] = []
    if len(password) < settings.password_min_length:
        errors.append(f"at least {settings.password_min_length} characters")
    if settings.password_require_uppercase and not any(c.isupper() for c in password):
        errors.append("at least one uppercase letter")
    if settings.password_require_lowercase and not any(c.islower() for c in password):
        errors.append("at least one lowercase letter")
    if settings.password_require_digit and not any(c.isdigit() for c in password):
        errors.append("at least one digit")
    if errors:
        raise HTTPException(
            status_code=422, detail=f"Password must contain: {', '.join(errors)}",
        )


# ── Schemas ─────────────────────────────────────────────────────


class AuthLogin(PydanticModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=200)


class AuthRegister(PydanticModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=200)
    name: str = Field(..., min_length=1, max_length=200)


class UserInfo(PydanticModel):
    id: str
    email: str
    name: str
    role: str
    phase: str
    onboarded: bool

    model_config = {"from_attributes": True}


class AuthResponse(PydanticModel):
    access_token: str
    user: UserInfo


class ChangePassword(PydanticModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=200)


class ForgotPassword(PydanticModel):
    email: EmailStr


class ResetPassword(PydanticModel):
    token: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=200)


class MessageResponse(PydanticModel):
    message: str


# ── Crypto helpers ──────────────────────────────────────────────


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode(), bcrypt.gensalt(rounds=_BCRYPT_ROUNDS),
    ).decode()


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def _create_access_token(user: User) -> str:
    payload = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "exp": datetime.now(UTC) + timedelta(minutes=settings.jwt_expiration_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def _create_reset_token(user: User) -> str:
    payload = {
        "sub": user.id,
        "email": user.email,
        "purpose": "password_reset",
        "exp": datetime.now(UTC) + timedelta(minutes=settings.password_reset_token_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_jwt(token: str) -> dict:
    try:
        return jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired") from None
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token") from None


def _decode_reset_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm],
        )
        if payload.get("purpose") != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid reset token")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="Reset link has expired") from None
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Invalid reset token") from None


async def get_current_user_claims(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    return decode_jwt(auth[7:])


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(get_current_user_claims),
) -> User:
    """FastAPI dependency that returns the full ``User`` row."""
    user = await db.get(User, claims["sub"])
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ── In-process rate limit (replace with Redis in prod) ──────────

_login_attempts: dict[str, list[float]] = {}


def _check_login_rate_limit(request: Request) -> None:
    max_attempts = settings.login_rate_limit_attempts
    window = settings.login_rate_limit_window_seconds
    if max_attempts <= 0:
        return
    ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    cutoff = now - window
    attempts = [t for t in _login_attempts.get(ip, []) if t > cutoff]
    if len(attempts) >= max_attempts:
        retry_after = int(attempts[0] + window - now) or 1
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts. Try again later.",
            headers={"Retry-After": str(retry_after)},
        )
    attempts.append(now)
    _login_attempts[ip] = attempts


# ── Endpoints ───────────────────────────────────────────────────


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(
    body: AuthRegister,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    validate_password_strength(body.password)

    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    # First user in the system becomes admin; everyone else is a regular user.
    any_user = await db.execute(select(User.id).limit(1))
    is_first_user = any_user.first() is None
    role = "admin" if is_first_user else "user"

    user = User(
        email=body.email,
        name=body.name,
        password_hash=_hash_password(body.password),
        role=role,
    )
    db.add(user)
    await db.flush()

    with contextlib.suppress(Exception):
        await send_welcome_email(to=user.email, name=user.name)

    return AuthResponse(
        access_token=_create_access_token(user),
        user=UserInfo.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    body: AuthLogin,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    _check_login_rate_limit(request)
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not _verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    return AuthResponse(
        access_token=_create_access_token(user),
        user=UserInfo.model_validate(user),
    )


@router.get("/me", response_model=UserInfo)
async def get_me(user: User = Depends(get_current_user)) -> UserInfo:
    return UserInfo.model_validate(user)


@router.post("/change-password", response_model=MessageResponse)
async def change_password(
    body: ChangePassword,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> MessageResponse:
    if not _verify_password(body.current_password, user.password_hash):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    validate_password_strength(body.new_password)
    user.password_hash = _hash_password(body.new_password)
    await db.flush()

    with contextlib.suppress(Exception):
        await send_password_changed_email(to=user.email, name=user.name)

    return MessageResponse(message="Password changed")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    body: ForgotPassword,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user and user.is_active:
        token = _create_reset_token(user)
        with contextlib.suppress(Exception):
            await send_password_reset_email(to=user.email, name=user.name, reset_token=token)
    return MessageResponse(
        message="If an account exists with that email, a reset link has been sent.",
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    body: ResetPassword,
    db: AsyncSession = Depends(get_db),
) -> MessageResponse:
    payload = _decode_reset_token(body.token)
    user = await db.get(User, payload["sub"])
    if not user or not user.is_active or user.email != payload.get("email"):
        raise HTTPException(status_code=400, detail="Invalid reset token")
    validate_password_strength(body.new_password)
    user.password_hash = _hash_password(body.new_password)
    await db.flush()
    return MessageResponse(message="Password has been reset. You can now sign in.")
