"""JournalEntry — Tier 1 sacred data.

One entry per user per day maximum. Three styles: expressive, reflective,
gratitude (see docs/02-pillars/my-mokshly.md → Journal). Bodies should be
encrypted at rest in production; v0 stores plaintext for simplicity but the
column type is wide enough for ciphertext.
"""

from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel

STYLE_EXPRESSIVE = "expressive"
STYLE_REFLECTIVE = "reflective"
STYLE_GRATITUDE = "gratitude"
JOURNAL_STYLES = (STYLE_EXPRESSIVE, STYLE_REFLECTIVE, STYLE_GRATITUDE)


class JournalEntry(BaseModel):
    __tablename__ = "journal_entries"
    __table_args__ = (
        UniqueConstraint("user_id", "entry_day", name="uq_user_journal_day"),
    )

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    entry_day: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    style: Mapped[str] = mapped_column(String(20), nullable=False, default=STYLE_REFLECTIVE)
    body: Mapped[str] = mapped_column(Text, nullable=False)
