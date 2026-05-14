"""Membership — joins a user to a tenant.

A user can have multiple memberships across tenants. Exactly one is flagged
``is_primary``; it drives billing and default branding. It does NOT determine
data ownership — practice data belongs to the user, not the tenant.
"""

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class Membership(BaseModel):
    __tablename__ = "memberships"
    __table_args__ = (UniqueConstraint("user_id", "tenant_id", name="uq_user_tenant"),)

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    tenant_id: Mapped[str] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Within-tenant role (e.g., "member", "hr_admin", "donor_admin").
    tenant_role: Mapped[str] = mapped_column(String(40), nullable=False, default="member")

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
