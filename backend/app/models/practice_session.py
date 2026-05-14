"""PracticeSession — the atomic unit of practice.

A session is created either when the user completes a guided session OR when
they self-log (the design doc treats both as equivalent for MCI purposes). The
1-log-per-practice-per-day guardrail is enforced at the API layer; for the
``aligning`` practice, the day's multiple check-ins roll up to one log.
"""

from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel

SOURCE_GUIDED = "guided"
SOURCE_SELF_LOG = "self_log"
SOURCES = (SOURCE_GUIDED, SOURCE_SELF_LOG)

MOOD_LIGHTER = "lighter"
MOOD_SAME = "same"
MOOD_HEAVIER = "heavier"
MOODS = (MOOD_LIGHTER, MOOD_SAME, MOOD_HEAVIER)


class PracticeSession(BaseModel):
    """One day's practice for a given user × practice.

    ``practice_day`` is the user-local date the practice belongs to (allows
    the 24-hour backdate window without smearing days). The unique constraint
    enforces 1 log per practice per day at the database level.
    """

    __tablename__ = "practice_sessions"
    __table_args__ = (
        UniqueConstraint("user_id", "practice_key", "practice_day", name="uq_user_practice_day"),
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    practice_key: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    practice_day: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    source: Mapped[str] = mapped_column(String(20), nullable=False, default=SOURCE_SELF_LOG)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mood: Mapped[str | None] = mapped_column(String(20), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(),
    )
