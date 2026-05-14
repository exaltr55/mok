"""End-to-end tests for the auth router.

Covers register, login, /me, forgot/reset password, change password, and
common failure modes (duplicate email, wrong password, invalid token).
"""

from __future__ import annotations

import pytest

VALID_PASSWORD = "Hunter2!"
NEW_PASSWORD = "NewHunter3!"


def _payload(email: str = "alice@example.com", password: str = VALID_PASSWORD) -> dict:
    return {"email": email, "password": password, "name": "Alice"}


# ── Register ────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_register_creates_user(client):
    async with client as c:
        resp = await c.post("/api/v1/auth/register", json=_payload())
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["user"]["email"] == "alice@example.com"
    assert body["user"]["role"] == "admin"  # first user becomes admin
    assert body["access_token"]


@pytest.mark.asyncio
async def test_register_rejects_weak_password(client):
    async with client as c:
        resp = await c.post(
            "/api/v1/auth/register",
            json={**_payload(), "password": "short"},
        )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_register_rejects_duplicate_email(client):
    async with client as c:
        await c.post("/api/v1/auth/register", json=_payload())
        resp = await c.post("/api/v1/auth/register", json=_payload())
    assert resp.status_code == 409


# ── Login + /me ─────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_login_then_me(client):
    async with client as c:
        await c.post("/api/v1/auth/register", json=_payload())
        login = await c.post(
            "/api/v1/auth/login",
            json={"email": "alice@example.com", "password": VALID_PASSWORD},
        )
        assert login.status_code == 200
        token = login.json()["access_token"]

        me = await c.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me.status_code == 200
        assert me.json()["email"] == "alice@example.com"


@pytest.mark.asyncio
async def test_login_rejects_bad_password(client):
    async with client as c:
        await c.post("/api/v1/auth/register", json=_payload())
        resp = await c.post(
            "/api/v1/auth/login",
            json={"email": "alice@example.com", "password": "Wrong1234"},
        )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_me_rejects_missing_token(client):
    async with client as c:
        resp = await c.get("/api/v1/auth/me")
    assert resp.status_code == 401


# ── Forgot / reset password ─────────────────────────────────────


@pytest.mark.asyncio
async def test_forgot_password_always_returns_ok(client):
    """No email enumeration: unknown emails get the same response."""
    async with client as c:
        resp = await c.post(
            "/api/v1/auth/forgot-password",
            json={"email": "nobody@example.com"},
        )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_forgot_then_reset_password_flow(client):
    """Use the auth helper directly to obtain the reset token, then reset."""
    from sqlalchemy import select

    from app.api.auth import _create_reset_token
    from app.database import async_session
    from app.models import User

    async with client as c:
        await c.post("/api/v1/auth/register", json=_payload())

        async with async_session() as s:
            user = (await s.execute(select(User))).scalar_one()
            token = _create_reset_token(user)

        reset = await c.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": NEW_PASSWORD},
        )
        assert reset.status_code == 200

        # Old password no longer works.
        old = await c.post(
            "/api/v1/auth/login",
            json={"email": "alice@example.com", "password": VALID_PASSWORD},
        )
        assert old.status_code == 401

        # New password works.
        new = await c.post(
            "/api/v1/auth/login",
            json={"email": "alice@example.com", "password": NEW_PASSWORD},
        )
        assert new.status_code == 200


@pytest.mark.asyncio
async def test_reset_password_rejects_invalid_token(client):
    async with client as c:
        resp = await c.post(
            "/api/v1/auth/reset-password",
            json={"token": "not-a-real-token", "new_password": NEW_PASSWORD},
        )
    assert resp.status_code == 400


# ── Change password (authenticated) ─────────────────────────────


@pytest.mark.asyncio
async def test_change_password(client):
    async with client as c:
        register = await c.post("/api/v1/auth/register", json=_payload())
        token = register.json()["access_token"]

        ok = await c.post(
            "/api/v1/auth/change-password",
            headers={"Authorization": f"Bearer {token}"},
            json={"current_password": VALID_PASSWORD, "new_password": NEW_PASSWORD},
        )
        assert ok.status_code == 200

        login = await c.post(
            "/api/v1/auth/login",
            json={"email": "alice@example.com", "password": NEW_PASSWORD},
        )
        assert login.status_code == 200
