"""Consent — per-user, per-tenant, per-tier consent state.

Tier 1 (platform data) is implicit and not stored here — it's required to use
the platform. Tier 2 (tenant aggregate), Tier 3 (insurance), Tier 4 (AI Guide)
are tracked explicitly. Revocations create a new row rather than mutating the
existing one, preserving the audit trail.
"""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Consent(BaseModel):
    __tablename__ = "consents"
    __table_args__ = (
        UniqueConstraint("user_id", "tenant_id", "tier", name="uq_user_tenant_tier"),
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    tenant_id: Mapped[str | None] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=True, index=True,
    )
    tier: Mapped[int] = mapped_column(Integer, nullable=False)  # 2, 3, or 4
    granted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    granted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(),
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    purpose_note: Mapped[str | None] = mapped_column(String(200), nullable=True)
