"""Tenant model — the organizational container per docs/01-product/tenant-architecture.md.

Three tenant kinds in MVP: commons, enterprise, access. Member-Partner tenants
are deferred to v1.1.
"""

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel

KIND_COMMONS = "commons"
KIND_ENTERPRISE = "enterprise"
KIND_ACCESS = "access"
TENANT_KINDS = (KIND_COMMONS, KIND_ENTERPRISE, KIND_ACCESS)


class Tenant(BaseModel):
    """A tenant — Commons, Enterprise, or Mokshly Access.

    Slugs are human-readable identifiers; ``kind`` drives billing, branding,
    and aggregate-reporting behaviour.
    """

    __tablename__ = "tenants"

    slug: Mapped[str] = mapped_column(String(60), unique=True, index=True, nullable=False)
    display_name: Mapped[str] = mapped_column(String(200), nullable=False)
    kind: Mapped[str] = mapped_column(String(20), nullable=False, default=KIND_COMMONS)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # ── Employer-portal extensions ─────────────────────────────────
    # Organisation public info
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_data: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── HQ address (standard structured format) ────────────────────
    hq_street1: Mapped[str | None] = mapped_column(String(200), nullable=True)
    hq_street2: Mapped[str | None] = mapped_column(String(200), nullable=True)
    hq_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    hq_state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    hq_postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    hq_country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # Legacy single-line field — kept for back-compat with rows captured
    # before the structured fields landed. Read-only at the UI level.
    hq_address: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Primary (HR) contact — the person Mokshly invites to set up the portal.
    contact_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # ── Billing ────────────────────────────────────────────────────
    billing_contact_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    billing_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    billing_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # Standard structured billing address.
    billing_street1: Mapped[str | None] = mapped_column(String(200), nullable=True)
    billing_street2: Mapped[str | None] = mapped_column(String(200), nullable=True)
    billing_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    billing_state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    billing_postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    billing_country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # Legacy single-line — kept for back-compat.
    billing_address: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Leadership messages shown to every employee during their orientation —
    # a warm "welcome from your HR head" and "welcome from your CEO" card.
    hr_head_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    hr_head_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    hr_head_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    ceo_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    ceo_title: Mapped[str | None] = mapped_column(String(200), nullable=True)
    ceo_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Rough team-size band so we never have to ask for an exact headcount.
    # Values: "1-50" | "51-200" | "201-1000" | "1000+"
    employee_count_band: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Lifecycle:
    #   "pending"  — provisioned by Mokshly, HR has not yet accepted the invite
    #   "invited"  — invite sent (separate from pending only for telemetry)
    #   "active"   — HR has completed onboarding
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")

    # Feature flags
    cohort_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
