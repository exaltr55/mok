"""MciSnapshot — a daily cached MCI reading.

The MCI itself is always derived from practice_sessions per the formula in
docs/03-systems/mci.md. We persist a snapshot per day so that:
  - the Today screen can read it in O(1),
  - the 90-day MCI line on the user dashboard is queryable without recomputing,
  - we have an audit trail of the user's own arc over time.
"""

from datetime import date

from sqlalchemy import Date, Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel


class MciSnapshot(BaseModel):
    __tablename__ = "mci_snapshots"
    __table_args__ = (UniqueConstraint("user_id", "snapshot_day", name="uq_user_mci_day"),)

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    snapshot_day: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    mci: Mapped[float] = mapped_column(Float, nullable=False)
    practice_days_in_window: Mapped[int] = mapped_column(Integer, nullable=False)
    consistency_bonus: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
