"""SQLAlchemy base model with common fields.

All models inherit from this base, getting:
- ULID-based primary key (sortable, URL-safe, no collisions)
- created_at / updated_at timestamps with automatic management
- Consistent table naming convention
"""

from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from ulid import ULID


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    pass


class TimestampMixin:
    """Adds created_at and updated_at columns with automatic timestamps."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


def generate_ulid() -> str:
    """Generate a ULID string for use as a primary key.

    ULIDs are sortable (timestamp-prefixed), URL-safe, and collision-resistant.
    Better than UUIDs for database indexing due to monotonic ordering.
    """
    return str(ULID())


class BaseModel(Base, TimestampMixin):
    """Abstract base model with ULID primary key and timestamps.

    All domain models should inherit from this.
    """

    __abstract__ = True

    id: Mapped[str] = mapped_column(
        String(26),
        primary_key=True,
        default=generate_ulid,
    )
