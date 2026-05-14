"""Mokshly Consistency Index — server-side computation.

Implements the formula in docs/03-systems/mci.md:

    MCI = 36 − (base_credit + consistency_bonus)

Where:
- ``base_credit`` = one credit per distinct practice-day in the 30-day window.
- ``consistency_bonus`` = +0.1 per practice-day inside any rolling 7-day window
  where the user practiced 5+ days.

The MCI is never shared with anyone but the user. Server code that returns
the MCI must be gated by an authenticated user dependency.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.practice_session import PracticeSession

WINDOW_DAYS = 30
TARGET_DAYS_PER_WEEK = 5
MCI_CEILING = 36.0


@dataclass(frozen=True)
class MciResult:
    mci: float
    practice_days: int
    consistency_bonus: float
    milestone: str
    window_days: int = WINDOW_DAYS


def _milestone(mci: float) -> str:
    if mci <= 6:
        return "Deep Practitioner"
    if mci <= 10:
        return "Aligned Practitioner"
    if mci <= 15:
        return "Grounded Practitioner"
    if mci <= 20:
        return "Steady Practitioner"
    if mci <= 30:
        return "Returning"
    return "Beginning"


async def compute_mci(db: AsyncSession, user_id: str, on: date | None = None) -> MciResult:
    """Compute the MCI for ``user_id`` looking back 30 days from ``on`` (today)."""
    today = on or date.today()
    window_start = today - timedelta(days=WINDOW_DAYS - 1)

    rows = await db.execute(
        select(PracticeSession.practice_day)
        .where(
            PracticeSession.user_id == user_id,
            PracticeSession.practice_day >= window_start,
            PracticeSession.practice_day <= today,
        )
    )
    days_practiced: set[date] = {row[0] for row in rows}
    base_credit = float(len(days_practiced))

    # Consistency bonus: +0.1 for each practice day inside any 7-day window
    # where the user practiced at least 5 of those days. Walk every starting
    # day of every 7-day window inside the 30-day window.
    bonus = 0.0
    for window_end_offset in range(7, WINDOW_DAYS + 1):
        win_end = window_start + timedelta(days=window_end_offset - 1)
        win_start = win_end - timedelta(days=6)
        days_in_window = sum(1 for d in days_practiced if win_start <= d <= win_end)
        if days_in_window >= TARGET_DAYS_PER_WEEK:
            bonus += 0.1 * days_in_window
    # Cap the bonus generously — formula in the doc cites "~+2 across 4 weeks".
    bonus = min(round(bonus, 2), 4.0)

    total = base_credit + bonus
    mci = max(0.0, round(MCI_CEILING - total, 2))

    return MciResult(
        mci=mci,
        practice_days=len(days_practiced),
        consistency_bonus=bonus,
        milestone=_milestone(mci),
    )
