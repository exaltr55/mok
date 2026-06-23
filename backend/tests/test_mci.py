"""Tests for the v2 Mokshly Consistency Index.

The Index folds three signals on a golf-handicap scale (0 = deep, 36 =
beginning):

    return_rate    weeks-with-any-session / N
    practice_grip  per-practice: weeks with ≥3 days / N
    breadth        practices with grip ≥ 0.5

    mci = 36 × (1 − 0.4 × return_rate − 0.6 × (breadth / 7))

These tests pin the formula's behavior at the boundaries that matter
for product copy and milestones: empty state, activation threshold,
return without breadth, breadth from a single practice, and the deep
floor when several practices have crossed the grip bar.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest

from app.models.practice_session import PracticeSession
from app.models.user import User
from app.services.mci import (
    ACTIVATION_WEEKS,
    DAYS_PER_WEEK_THRESHOLD,
    LOOKBACK_WEEKS,
    MCI_CEILING,
    PRACTICE_GRIP_THRESHOLD,
    TOTAL_PRACTICES,
    W_BREADTH,
    W_RETURN,
    compute_mci,
)

# ── helpers ──────────────────────────────────────────────────────────


async def _new_user(session, *, weeks_ago: int) -> User:
    """Create a user whose account was created ``weeks_ago`` ago."""
    user = User(
        email=f"u-{weeks_ago}-{id(session)}@test.local",
        password_hash="x",
        name="Test User",
    )
    user.created_at = datetime.now(UTC).replace(tzinfo=None) - timedelta(weeks=weeks_ago)
    session.add(user)
    await session.flush()
    return user


async def _log(session, user: User, *, practice: str, week: int, days: int) -> None:
    """Log ``days`` distinct days of ``practice`` inside ``week`` (0-indexed
    from the user's start)."""
    start = (
        user.created_at.date() if hasattr(user.created_at, "date") else user.created_at
    )
    for d in range(days):
        practice_day = start + timedelta(days=week * 7 + d)
        session.add(PracticeSession(
            user_id=user.id,
            practice_key=practice,
            practice_day=practice_day,
        ))
    await session.flush()


# ── tests ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_brand_new_user_returns_ceiling_and_not_activated(test_session_factory):
    async with test_session_factory() as s:
        user = await _new_user(s, weeks_ago=0)
        result = await compute_mci(s, user.id)
    assert result.mci == MCI_CEILING
    assert result.activated is False
    assert result.return_rate == 0.0
    assert result.breadth == 0


@pytest.mark.asyncio
async def test_activation_gate_at_lookback_window(test_session_factory):
    """Activation flips on once ``ACTIVATION_WEEKS`` have elapsed — not before."""
    async with test_session_factory() as s:
        early = await _new_user(s, weeks_ago=ACTIVATION_WEEKS - 1)
        late = await _new_user(s, weeks_ago=ACTIVATION_WEEKS + 1)
        early_r = await compute_mci(s, early.id)
        late_r = await compute_mci(s, late.id)
    assert early_r.activated is False
    assert late_r.activated is True


@pytest.mark.asyncio
async def test_return_alone_caps_below_full(test_session_factory):
    """Logging one practice every day for N weeks gives full return_rate
    but only one practice toward breadth. With weights (0.4, 0.6), the
    Index should land at 36 × (1 − 0.4 − 0.6/7) ≈ 18.5."""
    async with test_session_factory() as s:
        user = await _new_user(s, weeks_ago=LOOKBACK_WEEKS - 1)
        # Every day of every week, log just Breathing.
        for week in range(LOOKBACK_WEEKS):
            await _log(s, user, practice="breathing", week=week, days=7)
        result = await compute_mci(s, user.id)

    assert result.return_rate == pytest.approx(1.0)
    assert result.breadth == 1
    expected = round(MCI_CEILING * (1 - W_RETURN * 1.0 - W_BREADTH * (1 / TOTAL_PRACTICES)), 1)
    assert result.mci == pytest.approx(expected)


@pytest.mark.asyncio
async def test_breadth_requires_grip_threshold(test_session_factory):
    """A practice done on 2 days per week (below ``DAYS_PER_WEEK_THRESHOLD``)
    never adds to breadth, no matter how many weeks it spans."""
    async with test_session_factory() as s:
        user = await _new_user(s, weeks_ago=LOOKBACK_WEEKS - 1)
        # Below the days-per-week threshold but in every week of the window.
        for week in range(LOOKBACK_WEEKS):
            await _log(s, user, practice="thinking", week=week, days=DAYS_PER_WEEK_THRESHOLD - 1)
        result = await compute_mci(s, user.id)

    assert result.practice_grip["thinking"] == 0.0
    assert result.breadth == 0
    # Return rate is still 1.0 — sessions exist in every week.
    assert result.return_rate == pytest.approx(1.0)


@pytest.mark.asyncio
async def test_breadth_grip_threshold_at_exact_cutoff(test_session_factory):
    """A practice with grip == PRACTICE_GRIP_THRESHOLD counts toward breadth."""
    # Need at least 50% of the lookback weeks regular.
    regular_weeks_needed = max(1, int(LOOKBACK_WEEKS * PRACTICE_GRIP_THRESHOLD))
    async with test_session_factory() as s:
        user = await _new_user(s, weeks_ago=LOOKBACK_WEEKS - 1)
        for week in range(regular_weeks_needed):
            await _log(s, user, practice="moving", week=week, days=DAYS_PER_WEEK_THRESHOLD)
        result = await compute_mci(s, user.id)

    assert result.practice_grip["moving"] >= PRACTICE_GRIP_THRESHOLD
    assert result.breadth >= 1


@pytest.mark.asyncio
async def test_deep_practitioner_floor(test_session_factory):
    """All 7 practices, ≥3 days/week, every week of the window.

    return_rate = 1.0, breadth = 7 → mci = 0.0 (deep practitioner)."""
    async with test_session_factory() as s:
        user = await _new_user(s, weeks_ago=LOOKBACK_WEEKS - 1)
        practices = (
            "breathing", "thinking", "talking",
            "writing", "moving", "resetting", "aligning",
        )
        for week in range(LOOKBACK_WEEKS):
            for p in practices:
                await _log(s, user, practice=p, week=week, days=DAYS_PER_WEEK_THRESHOLD)
        result = await compute_mci(s, user.id)

    assert result.return_rate == pytest.approx(1.0)
    assert result.breadth == 7
    assert result.mci == pytest.approx(0.0)
    assert result.milestone == "Deep practitioner"


@pytest.mark.asyncio
async def test_practice_grip_keys_cover_all_seven(test_session_factory):
    """``practice_grip`` always exposes a value for each of the 7
    practices — even when none have been done."""
    async with test_session_factory() as s:
        user = await _new_user(s, weeks_ago=LOOKBACK_WEEKS - 1)
        result = await compute_mci(s, user.id)

    expected = {"breathing", "thinking", "talking", "writing", "moving", "resetting", "aligning"}
    assert set(result.practice_grip) == expected
    assert all(v == 0.0 for v in result.practice_grip.values())


@pytest.mark.asyncio
async def test_lifetime_days_independent_of_window(test_session_factory):
    """``practice_days`` is all-time distinct days, not window-bounded —
    used by surfaces that show "X days of practice" since you began."""
    async with test_session_factory() as s:
        user = await _new_user(s, weeks_ago=LOOKBACK_WEEKS + 4)
        # Log one day per week far outside the window.
        for week in range(LOOKBACK_WEEKS + 3):
            await _log(s, user, practice="breathing", week=week, days=1)
        result = await compute_mci(s, user.id)

    assert result.practice_days == LOOKBACK_WEEKS + 3


@pytest.mark.asyncio
async def test_mci_descending_as_signals_grow(test_session_factory):
    """Adding practices to a steady rhythm should monotonically lower the MCI."""
    async with test_session_factory() as s:
        user = await _new_user(s, weeks_ago=LOOKBACK_WEEKS - 1)

        scores: list[float] = []
        # Add practices one at a time and remeasure.
        for p in ("breathing", "thinking", "talking", "writing", "moving"):
            for week in range(LOOKBACK_WEEKS):
                await _log(s, user, practice=p, week=week, days=DAYS_PER_WEEK_THRESHOLD)
            r = await compute_mci(s, user.id)
            scores.append(r.mci)

    assert scores == sorted(scores, reverse=True), (
        f"Expected MCI to decrease monotonically; got {scores}"
    )
