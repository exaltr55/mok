"""Platform-admin endpoints — Mokshly team uses these to set up employers.

Provisioning happens from inside the Mokshly admin tool: an admin fills in the
new employer's details, the backend creates the Tenant, creates the HR
contact as an ``employer_admin`` user with no password yet, and emails them
an invite link valid for 14 days. The HR contact accepts the invite, sets a
password, and lands in the employer onboarding flow.
"""

from __future__ import annotations

import re
import unicodedata
from datetime import UTC, datetime, timedelta

import jwt
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel as PydanticModel
from pydantic import EmailStr, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: TC002

from app.api.auth import get_current_user
from app.api.employer import TenantOut, TenantUpdate
from app.config import settings
from app.database import get_db
from app.models.membership import Membership
from app.models.tenant import Tenant
from app.models.user import User
from app.services.email_service import send_employer_invite

router = APIRouter(prefix="/admin", tags=["admin"])

_INVITE_PURPOSE = "employer_invite"
_INVITE_DAYS = 14


# ── Schemas ─────────────────────────────────────────────────────


class ProvisionEmployer(PydanticModel):
    organisation_name: str = Field(..., min_length=2, max_length=200)
    website: str | None = Field(default=None, max_length=255)
    company_data: str | None = Field(default=None, max_length=4000)
    hq_street1: str | None = Field(default=None, max_length=200)
    hq_street2: str | None = Field(default=None, max_length=200)
    hq_city: str | None = Field(default=None, max_length=100)
    hq_state: str | None = Field(default=None, max_length=100)
    hq_postal_code: str | None = Field(default=None, max_length=20)
    hq_country: str | None = Field(default=None, max_length=100)

    contact_name: str = Field(..., min_length=1, max_length=200)
    contact_email: EmailStr
    contact_phone: str | None = Field(default=None, max_length=50)

    billing_contact_name: str | None = Field(default=None, max_length=200)
    billing_email: EmailStr | None = None
    billing_phone: str | None = Field(default=None, max_length=50)
    billing_street1: str | None = Field(default=None, max_length=200)
    billing_street2: str | None = Field(default=None, max_length=200)
    billing_city: str | None = Field(default=None, max_length=100)
    billing_state: str | None = Field(default=None, max_length=100)
    billing_postal_code: str | None = Field(default=None, max_length=20)
    billing_country: str | None = Field(default=None, max_length=100)

    employee_count_band: str | None = Field(
        default=None, pattern=r"^(1-50|51-200|201-1000|1000\+)$",
    )
    notes: str | None = Field(default=None, max_length=4000)


class ProvisionedOut(PydanticModel):
    tenant: TenantOut
    invite_url: str
    invite_sent: bool


# ── Auth gate ───────────────────────────────────────────────────


async def _require_platform_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Platform admin role required")
    return user


# ── Helpers ─────────────────────────────────────────────────────


def _slugify(name: str) -> str:
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()
    return s or "org"


async def _unique_slug(db: AsyncSession, base: str) -> str:
    candidate = base
    suffix = 1
    while True:
        existing = await db.execute(select(Tenant).where(Tenant.slug == candidate))
        if existing.scalar_one_or_none() is None:
            return candidate
        suffix += 1
        candidate = f"{base}-{suffix}"


def _create_invite_token(user: User) -> str:
    payload = {
        "sub": user.id,
        "email": user.email,
        "purpose": _INVITE_PURPOSE,
        "exp": datetime.now(UTC) + timedelta(days=_INVITE_DAYS),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


# ── Endpoints ───────────────────────────────────────────────────


@router.post("/employers", response_model=ProvisionedOut, status_code=201)
async def provision_employer(
    payload: ProvisionEmployer,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(_require_platform_admin),
) -> ProvisionedOut:
    """Create a Tenant + invited HR admin User + Membership, then email an invite."""
    # Reject collisions on the HR contact email.
    existing_user = await db.execute(
        select(User).where(User.email == str(payload.contact_email)),
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="An account already exists for this contact email.",
        )

    slug = await _unique_slug(db, _slugify(payload.organisation_name))
    tenant = Tenant(
        slug=slug,
        display_name=payload.organisation_name.strip(),
        kind="enterprise",
        website=payload.website,
        company_data=payload.company_data,
        hq_street1=payload.hq_street1,
        hq_street2=payload.hq_street2,
        hq_city=payload.hq_city,
        hq_state=payload.hq_state,
        hq_postal_code=payload.hq_postal_code,
        hq_country=payload.hq_country,
        contact_name=payload.contact_name.strip(),
        contact_email=str(payload.contact_email),
        contact_phone=payload.contact_phone,
        billing_contact_name=payload.billing_contact_name,
        billing_email=str(payload.billing_email) if payload.billing_email else None,
        billing_phone=payload.billing_phone,
        billing_street1=payload.billing_street1,
        billing_street2=payload.billing_street2,
        billing_city=payload.billing_city,
        billing_state=payload.billing_state,
        billing_postal_code=payload.billing_postal_code,
        billing_country=payload.billing_country,
        employee_count_band=payload.employee_count_band,
        description=payload.notes,
        status="invited",
        cohort_enabled=False,
    )
    db.add(tenant)
    await db.flush()

    # HR admin user — no password yet; the invite accept flow sets one.
    placeholder_hash = "!"  # unusable; matches bcrypt format check elsewhere by being non-empty.
    hr_admin = User(
        email=str(payload.contact_email),
        name=payload.contact_name.strip(),
        password_hash=placeholder_hash,
        role="user",
        user_type="employer_admin",
        is_active=False,  # activated when they accept the invite
        onboarded=False,
        cohort_enabled=False,
    )
    db.add(hr_admin)
    await db.flush()

    membership = Membership(
        user_id=hr_admin.id,
        tenant_id=tenant.id,
        is_primary=True,
        tenant_role="hr_admin",
        is_active=True,
    )
    db.add(membership)
    await db.commit()
    await db.refresh(tenant)
    await db.refresh(hr_admin)

    token = _create_invite_token(hr_admin)
    base_url = settings.frontend_url or "http://localhost:3000"
    invite_url = f"{base_url}/employer/accept-invite?token={token}"

    sent = await send_employer_invite(
        to=str(payload.contact_email),
        contact_name=payload.contact_name.strip(),
        organisation_name=payload.organisation_name.strip(),
        invite_token=token,
    )

    return ProvisionedOut(
        tenant=TenantOut.model_validate(tenant),
        invite_url=invite_url,
        invite_sent=sent,
    )


@router.get("/employers", response_model=list[TenantOut])
async def list_employers(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(_require_platform_admin),
) -> list[TenantOut]:
    result = await db.execute(select(Tenant).order_by(Tenant.created_at.desc()))
    return [TenantOut.model_validate(t) for t in result.scalars().all()]


@router.patch("/employers/{tenant_id}", response_model=TenantOut)
async def update_employer(
    tenant_id: str,
    payload: TenantUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(_require_platform_admin),
) -> TenantOut:
    """Mokshly-admin tenant update. The cohort_enabled flag here cascades to
    every member user of this tenant — same behaviour as the HR-side endpoint,
    so the Connect feature is consistently turned on/off across the team."""
    tenant = await db.get(Tenant, tenant_id)
    if tenant is None:
        raise HTTPException(status_code=404, detail="Employer not found")

    data = payload.model_dump(exclude_unset=True)
    cohort_change: bool | None = data.pop("cohort_enabled", None)

    for field, value in data.items():
        setattr(tenant, field, value)

    if cohort_change is not None and cohort_change != tenant.cohort_enabled:
        tenant.cohort_enabled = cohort_change
        member_user_ids_q = await db.execute(
            select(Membership.user_id).where(
                Membership.tenant_id == tenant.id,
                Membership.is_active.is_(True),
            ),
        )
        user_ids = [row[0] for row in member_user_ids_q.all()]
        if user_ids:
            await db.execute(
                update(User)
                .where(User.id.in_(user_ids))
                .values(cohort_enabled=cohort_change),
            )

    await db.commit()
    await db.refresh(tenant)
    return TenantOut.model_validate(tenant)
