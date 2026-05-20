"""Employer portal endpoints — HR-facing signup, profile, and tenant settings.

Lives under ``/api/v1/employer/``. The first user of an organization signs up
here; they become an ``employer_admin`` user, the tenant is created in the
same transaction, and a Membership row joins them with ``tenant_role='hr_admin'``.
Subsequent employer admins can be invited by an existing admin (TODO).

The cohort feature flag lives on the Tenant and cascades to every member's
``User.cohort_enabled`` so the employee app can read it from a single field.
"""

from __future__ import annotations

import re
import unicodedata

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel as PydanticModel
from pydantic import EmailStr, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: TC002

import jwt

from app.api.auth import (
    AuthResponse,
    UserInfo,
    _create_access_token,
    _hash_password,
    validate_password_strength,
)
from app.config import settings
from app.database import get_db
from app.models.membership import Membership
from app.models.tenant import Tenant
from app.models.user import User

router = APIRouter(prefix="/employer", tags=["employer"])


# ── Schemas ─────────────────────────────────────────────────────


class EmployerSignup(PydanticModel):
    organisation_name: str = Field(..., min_length=2, max_length=200)
    contact_name: str = Field(..., min_length=1, max_length=200)
    contact_email: EmailStr
    password: str = Field(..., min_length=8, max_length=200)
    employee_count_band: str | None = Field(
        default=None, pattern=r"^(1-50|51-200|201-1000|1000\+)$",
    )


class TenantOut(PydanticModel):
    id: str
    slug: str
    display_name: str
    description: str | None
    status: str
    cohort_enabled: bool

    # Org public info
    website: str | None
    company_data: str | None
    # HQ address (structured)
    hq_street1: str | None
    hq_street2: str | None
    hq_city: str | None
    hq_state: str | None
    hq_postal_code: str | None
    hq_country: str | None
    hq_address: str | None  # legacy single-line

    # Primary contact (HR)
    contact_name: str | None
    contact_email: str | None
    contact_phone: str | None

    # Billing
    billing_contact_name: str | None
    billing_email: str | None
    billing_phone: str | None
    billing_street1: str | None
    billing_street2: str | None
    billing_city: str | None
    billing_state: str | None
    billing_postal_code: str | None
    billing_country: str | None
    billing_address: str | None  # legacy single-line

    # Leadership welcome messages
    hr_head_name: str | None
    hr_head_title: str | None
    hr_head_message: str | None
    ceo_name: str | None
    ceo_title: str | None
    ceo_message: str | None

    employee_count_band: str | None

    model_config = {"from_attributes": True}


class TenantUpdate(PydanticModel):
    display_name: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    cohort_enabled: bool | None = None
    status: str | None = Field(default=None, pattern=r"^(pending|invited|active)$")

    website: str | None = Field(default=None, max_length=255)
    company_data: str | None = Field(default=None, max_length=4000)
    hq_street1: str | None = Field(default=None, max_length=200)
    hq_street2: str | None = Field(default=None, max_length=200)
    hq_city: str | None = Field(default=None, max_length=100)
    hq_state: str | None = Field(default=None, max_length=100)
    hq_postal_code: str | None = Field(default=None, max_length=20)
    hq_country: str | None = Field(default=None, max_length=100)
    hq_address: str | None = Field(default=None, max_length=1000)

    contact_name: str | None = Field(default=None, max_length=200)
    contact_email: EmailStr | None = None
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
    billing_address: str | None = Field(default=None, max_length=1000)

    hr_head_name: str | None = Field(default=None, max_length=200)
    hr_head_title: str | None = Field(default=None, max_length=200)
    hr_head_message: str | None = Field(default=None, max_length=4000)
    ceo_name: str | None = Field(default=None, max_length=200)
    ceo_title: str | None = Field(default=None, max_length=200)
    ceo_message: str | None = Field(default=None, max_length=4000)

    employee_count_band: str | None = Field(
        default=None, pattern=r"^(1-50|51-200|201-1000|1000\+)$",
    )


class EmployerMe(PydanticModel):
    user: UserInfo
    tenant: TenantOut


# ── Helpers ─────────────────────────────────────────────────────


def _slugify(name: str) -> str:
    """Produce a URL-safe, lowercase slug from an organization name."""
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


async def _require_employer_admin(
    db: AsyncSession = Depends(get_db),
    claims: dict = Depends(__import__("app.api.auth", fromlist=["get_current_user_claims"]).get_current_user_claims),
) -> tuple[User, Tenant]:
    """Resolve the current user and their primary tenant. Reject non-admins."""
    user = await db.get(User, claims["sub"])
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    if user.user_type != "employer_admin":
        raise HTTPException(
            status_code=403, detail="Only an employer admin can access this resource",
        )

    membership = await db.execute(
        select(Membership).where(
            Membership.user_id == user.id,
            Membership.tenant_role == "hr_admin",
            Membership.is_active.is_(True),
        ),
    )
    m = membership.scalars().first()
    if not m:
        raise HTTPException(status_code=403, detail="No active HR admin membership")
    tenant = await db.get(Tenant, m.tenant_id)
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return user, tenant


# ── Endpoints ───────────────────────────────────────────────────


@router.post("/signup", response_model=AuthResponse, status_code=201)
async def employer_signup(
    payload: EmployerSignup,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    """Create a tenant + employer-admin user + HR membership in one transaction."""
    validate_password_strength(payload.password)

    # Reject if the contact email is already a user (could be employee or admin).
    existing = await db.execute(select(User).where(User.email == str(payload.contact_email)))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="An account already exists for this email. Sign in to continue.",
        )

    slug = await _unique_slug(db, _slugify(payload.organisation_name))
    tenant = Tenant(
        slug=slug,
        display_name=payload.organisation_name.strip(),
        kind="enterprise",
        contact_email=str(payload.contact_email),
        employee_count_band=payload.employee_count_band,
        status="pending",
        cohort_enabled=False,
    )
    db.add(tenant)
    await db.flush()  # populate tenant.id

    admin = User(
        email=str(payload.contact_email),
        name=payload.contact_name.strip(),
        password_hash=_hash_password(payload.password),
        role="user",
        user_type="employer_admin",
        onboarded=False,        # they walk through HR onboarding next
        cohort_enabled=False,
    )
    db.add(admin)
    await db.flush()

    membership = Membership(
        user_id=admin.id,
        tenant_id=tenant.id,
        is_primary=True,
        tenant_role="hr_admin",
        is_active=True,
    )
    db.add(membership)
    await db.commit()
    await db.refresh(admin)

    token = _create_access_token(admin)
    return AuthResponse(access_token=token, user=UserInfo.model_validate(admin))


@router.get("/me", response_model=EmployerMe)
async def employer_me(
    ctx: tuple[User, Tenant] = Depends(_require_employer_admin),
) -> EmployerMe:
    user, tenant = ctx
    return EmployerMe(
        user=UserInfo.model_validate(user),
        tenant=TenantOut.model_validate(tenant),
    )


@router.patch("/tenant", response_model=TenantOut)
async def update_tenant(
    payload: TenantUpdate,
    db: AsyncSession = Depends(get_db),
    ctx: tuple[User, Tenant] = Depends(_require_employer_admin),
) -> TenantOut:
    """Update tenant settings. When cohort_enabled changes, cascade the flag to
    every employee of this tenant so their AuthUser response reflects it."""
    _user, tenant = ctx

    data = payload.model_dump(exclude_unset=True)
    cohort_change: bool | None = data.pop("cohort_enabled", None)

    for field, value in data.items():
        setattr(tenant, field, value)

    if cohort_change is not None and cohort_change != tenant.cohort_enabled:
        tenant.cohort_enabled = cohort_change
        # Cascade to every employee of this tenant via Membership.
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


class AcceptInvite(PydanticModel):
    token: str = Field(..., min_length=1)
    password: str = Field(..., min_length=8, max_length=200)


@router.get("/invite/preview")
async def invite_preview(
    token: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str | None]:
    """Decode an invite token without consuming it — used by the accept page
    to greet the HR contact by name and show their organisation."""
    try:
        claims = jwt.decode(
            token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm],
        )
    except jwt.ExpiredSignatureError as e:
        raise HTTPException(status_code=400, detail="This invitation has expired.") from e
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=400, detail="This invitation link is invalid.") from e
    if claims.get("purpose") != "employer_invite":
        raise HTTPException(status_code=400, detail="This link is not an employer invite.")

    user = await db.get(User, claims["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="Invitation no longer valid.")

    membership_q = await db.execute(
        select(Membership).where(
            Membership.user_id == user.id,
            Membership.tenant_role == "hr_admin",
            Membership.is_active.is_(True),
        ),
    )
    m = membership_q.scalars().first()
    tenant = await db.get(Tenant, m.tenant_id) if m else None

    return {
        "contact_name": user.name,
        "contact_email": user.email,
        "organisation_name": tenant.display_name if tenant else None,
    }


@router.post("/accept-invite", response_model=AuthResponse)
async def accept_invite(
    payload: AcceptInvite,
    db: AsyncSession = Depends(get_db),
) -> AuthResponse:
    """Set the HR contact's password, activate the user, and sign them in."""
    validate_password_strength(payload.password)

    try:
        claims = jwt.decode(
            payload.token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm],
        )
    except jwt.ExpiredSignatureError as e:
        raise HTTPException(status_code=400, detail="This invitation has expired.") from e
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=400, detail="This invitation link is invalid.") from e
    if claims.get("purpose") != "employer_invite":
        raise HTTPException(status_code=400, detail="This link is not an employer invite.")

    user = await db.get(User, claims["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="Invitation no longer valid.")

    user.password_hash = _hash_password(payload.password)
    user.is_active = True
    await db.commit()
    await db.refresh(user)

    token = _create_access_token(user)
    return AuthResponse(access_token=token, user=UserInfo.model_validate(user))


@router.post("/complete-onboarding", response_model=EmployerMe)
async def complete_onboarding(
    db: AsyncSession = Depends(get_db),
    ctx: tuple[User, Tenant] = Depends(_require_employer_admin),
) -> EmployerMe:
    """Mark the HR contact's onboarding as complete and activate the tenant."""
    user, tenant = ctx
    user.onboarded = True
    if tenant.status == "pending":
        tenant.status = "active"
    await db.commit()
    await db.refresh(user)
    await db.refresh(tenant)
    return EmployerMe(
        user=UserInfo.model_validate(user),
        tenant=TenantOut.model_validate(tenant),
    )
