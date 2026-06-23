"""Mokshly Consistency Index — server-side computation.

The Index is a golf-handicap-style number (0 = deep practitioner, 36 =
beginning) that captures three signals over the last ``LOOKBACK_WEEKS``:

1. **Return rate** — what fraction of those weeks did the user log any
   practice at all?
2. **Per-practice grip** — for each of the 7 practices, in what fraction
   of those weeks did the user do that practice on
   ``DAYS_PER_WEEK_THRESHOLD`` or more days? A practice with grip ≥
   ``PRACTICE_GRIP_THRESHOLD`` counts as a *consistent* practice.
3. **Breadth** — how many practices (0–7) are consistent by that
   definition?

Formula::

    raw = W_RETURN * return_rate + W_BREADTH * (breadth / 7)     # 0–1
    mci = round(MCI_CEILING * (1 - raw), 1)                       # 0–36

Lower MCI is deeper.

The Index is hidden in the UI until ``ACTIVATION_WEEKS`` have passed,
because before then the rhythm is still landing and any score would be
noise. The MCI is never shared with anyone but the user — callers must
gate server endpoints behind an authenticated user dependency.
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.practice_session import PracticeSession
from app.models.user import User
from app.services.practices import ALL_SEVEN

# ── Configuration ────────────────────────────────────────────────────

LOOKBACK_WEEKS = 8
TOTAL_PRACTICES = 7
MCI_CEILING = 36.0
WINDOW_DAYS = LOOKBACK_WEEKS * 7

# The Index begins populating once the user has been active for this
# many weeks (i.e. Arriving is complete and Steadying begins). Before
# then the rhythm is still settling and any score would be noise.
ACTIVATION_WEEKS = 7

# "Regularly" — how many days in a week a practice must be done to
# count as that week being a regular week for that practice.
DAYS_PER_WEEK_THRESHOLD = 3

# A practice's grip = (weeks regular / weeks in window). A practice
# counts toward breadth once its grip reaches this threshold.
PRACTICE_GRIP_THRESHOLD = 0.5

# Index weights — they must sum to 1.0. Heavier on breadth because the
# user's direction is that the Index headlines *which* practices have
# become habits, not just "did you log anything."
W_RETURN = 0.4
W_BREADTH = 0.6


# ── Result type ─────────────────────────────────────────────────────


@dataclass(frozen=True)
class MciResult:
    mci: float                              # 0 (deep) – 36 (beginning)
    practice_days: int                      # all-time distinct days, for the History card
    milestone: str
    activated: bool
    window_days: int = WINDOW_DAYS
    # Per-direction (v2) signals — exposed so the UI can show the
    # breakdown in the Index explainer.
    return_rate: float = 0.0                # 0–1: weeks-with-any-session / N
    breadth: int = 0                        # 0–7: practices with grip ≥ R
    practice_grip: dict[str, float] = field(default_factory=dict)
    # Legacy field — preserved so existing snapshot rows and any
    # downstream consumer keys keep working. Always 0.0 under v2.
    consistency_bonus: float = 0.0


# ── Helpers ─────────────────────────────────────────────────────────


def _milestone(mci: float) -> str:
    if mci <= 5:
        return "Deep practitioner"
    if mci <= 10:
        return "Aligned"
    if mci <= 18:
        return "Grounded"
    if mci <= 25:
        return "Steady"
    if mci <= 32:
        return "Returning"
    return "Beginning"


def _empty_result(activated: bool = False) -> MciResult:
    return MciResult(
        mci=MCI_CEILING,
        practice_days=0,
        milestone=_milestone(MCI_CEILING),
        activated=activated,
        return_rate=0.0,
        breadth=0,
        practice_grip={p: 0.0 for p in ALL_SEVEN},
    )


# ── Main computation ────────────────────────────────────────────────


async def compute_mci(
    db: AsyncSession, user_id: str, on: date | None = None,
) -> MciResult:
    """Compute the MCI for ``user_id`` as of ``on`` (defaults to today)."""
    today = on or date.today()

    # User start date — week boundaries anchor to created_at so they
    # stay stable per user across recomputations.
    user_row = await db.execute(
        select(User.created_at).where(User.id == user_id)
    )
    created_at = user_row.scalar_one_or_none()
    if created_at is None:
        return _empty_result()
    start_date = created_at.date() if hasattr(created_at, "date") else created_at

    rows = await db.execute(
        select(PracticeSession.practice_day, PracticeSession.practice_key)
        .where(PracticeSession.user_id == user_id)
    )
    sessions = [(row[0], row[1]) for row in rows.all()]

    # All-time distinct days the user practiced anything — surfaced
    # to History/Today screens as "X days of practice."
    lifetime_days = len({s[0] for s in sessions})

    days_since_start = max(0, (today - start_date).days)
    weeks_active = days_since_start // 7 + 1  # at least 1
    activated = weeks_active > ACTIVATION_WEEKS

    n_windows = min(LOOKBACK_WEEKS, weeks_active)
    if n_windows == 0:
        return _empty_result(activated=activated)

    # Group sessions by (week_idx, practice_key) → set of days.
    per_week_practice_days: dict[tuple[int, str], set[date]] = defaultdict(set)
    per_week_any_days: dict[int, set[date]] = defaultdict(set)

    for day, practice_key in sessions:
        delta_days = (day - start_date).days
        if delta_days < 0:
            continue  # session predates account creation (shouldn't happen)
        week_idx = delta_days // 7
        # Only weeks inside the rolling window count.
        if week_idx < weeks_active - n_windows or week_idx >= weeks_active:
            continue
        per_week_practice_days[(week_idx, practice_key)].add(day)
        per_week_any_days[week_idx].add(day)

    # Signal 1 — return rate.
    active_weeks = sum(1 for w in per_week_any_days.values() if w)
    return_rate = active_weeks / n_windows

    # Signal 2 — per-practice grip: fraction of weeks where the
    # practice was done on ≥ DAYS_PER_WEEK_THRESHOLD distinct days.
    practice_grip: dict[str, float] = {}
    for p in ALL_SEVEN:
        regular_weeks = sum(
            1
            for w_idx in range(weeks_active - n_windows, weeks_active)
            if len(per_week_practice_days.get((w_idx, p), ())) >= DAYS_PER_WEEK_THRESHOLD
        )
        practice_grip[p] = round(regular_weeks / n_windows, 3)

    # Signal 3 — breadth: practices with grip ≥ R.
    breadth = sum(1 for grip in practice_grip.values() if grip >= PRACTICE_GRIP_THRESHOLD)

    raw = W_RETURN * return_rate + W_BREADTH * (breadth / TOTAL_PRACTICES)
    raw = max(0.0, min(1.0, raw))
    mci = round(MCI_CEILING * (1 - raw), 1)

    return MciResult(
        mci=mci,
        practice_days=lifetime_days,
        milestone=_milestone(mci),
        activated=activated,
        return_rate=round(return_rate, 3),
        breadth=breadth,
        practice_grip=practice_grip,
    )
