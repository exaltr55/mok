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
