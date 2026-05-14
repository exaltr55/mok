"""User profile endpoints — read & update the practitioner profile, onboarding,
practice history, MCI, and journal.
"""

from __future__ import annotations

from datetime import UTC, date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel as PydanticModel
from pydantic import Field
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: TC002

from app.api.auth import get_current_user
from app.database import get_db
from app.models.journal_entry import JOURNAL_STYLES, JournalEntry
from app.models.practice_session import PracticeSession
from app.models.user import PHASES, User
from app.services.mci import MciResult, compute_mci

router = APIRouter(prefix="/me", tags=["me"])


# ── Profile ─────────────────────────────────────────────────────


class ProfileOut(PydanticModel):
    id: str
    email: str
    name: str
    role: str
    phase: str
    onboarded: bool
    pronouns: str | None
    timezone: str
    intention: str | None
    career_stage: str | None
    preferred_time_of_day: str
    preferred_days_per_week: int
    cohort_preference: str
    cohort_meeting_day: str | None
    cohort_meeting_window: str | None
    theme: str
    # Personalization captured at onboarding.
    stretched_area: str | None
    restore_style: str | None
    tone_preference: str | None
    here_because: str | None

    model_config = {"from_attributes": True}


class ProfileUpdate(PydanticModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    pronouns: str | None = Field(default=None, max_length=40)
    timezone: str | None = Field(default=None, max_length=60)
    intention: str | None = Field(default=None, max_length=400)
    career_stage: str | None = Field(default=None, pattern=r"^(early|mid|senior|post-career)$")
    preferred_time_of_day: str | None = Field(
        default=None, pattern=r"^(morning|midday|evening|flexible)$",
    )
    preferred_days_per_week: int | None = Field(default=None, ge=1, le=7)
    cohort_preference: str | None = Field(
        default=None, pattern=r"^(outside|within|none)$",
    )
    cohort_meeting_day: str | None = Field(
        default=None,
        pattern=r"^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$",
    )
    cohort_meeting_window: str | None = Field(default=None, max_length=30)
    phase: str | None = Field(default=None, pattern="|".join(PHASES))
    theme: str | None = Field(
        default=None,
        pattern=r"^(stillwater|sunbeam|cobalt|sage|twilight)$",
    )
    # Personalization captured at onboarding.
    stretched_area: str | None = Field(
        default=None, pattern=r"^(mind|body|heart|time)$",
    )
    restore_style: str | None = Field(
        default=None, pattern=r"^(solitude|movement|conversation|writing)$",
    )
    tone_preference: str | None = Field(
        default=None, pattern=r"^(quiet|encouraging|reflective)$",
    )
    here_because: str | None = Field(
        default=None, pattern=r"^(burnout|transition|growth|curiosity|recommended)$",
    )
    onboarded: bool | None = None


@router.get("/profile", response_model=ProfileOut)
async def get_profile(user: User = Depends(get_current_user)) -> ProfileOut:
    return ProfileOut.model_validate(user)


@router.patch("/profile", response_model=ProfileOut)
async def update_profile(
    body: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ProfileOut:
    data = body.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(user, field, value)
    await db.flush()
    return ProfileOut.model_validate(user)


# ── MCI ─────────────────────────────────────────────────────────


class MciOut(PydanticModel):
    mci: float
    milestone: str
    practice_days: int
    window_days: int


def _mci(r: MciResult) -> MciOut:
    return MciOut(
        mci=r.mci, milestone=r.milestone,
        practice_days=r.practice_days, window_days=r.window_days,
    )


@router.get("/mci", response_model=MciOut)
async def get_mci(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> MciOut:
    return _mci(await compute_mci(db, user.id))


# ── Practice history ────────────────────────────────────────────


class HistoryDay(PydanticModel):
    day: date
    practiced: bool


class HistoryOut(PydanticModel):
    days: list[HistoryDay]


# ── Dashboard (aggregated charts) ───────────────────────────────


class PracticeBreakdown(PydanticModel):
    key: str
    name: str
    short_name: str
    count_30d: int
    count_90d: int
    last_practiced: date | None
    # Per-practice daily counts for the last 30 days (oldest → newest).
    # Each entry corresponds to the matching day in `last_30_days`.
    daily_30d: list[int]


class DashboardDay(PydanticModel):
    day: date
    count: int


class DashboardOut(PydanticModel):
    total_sessions: int
    days_practiced_30d: int
    days_practiced_90d: int
    by_practice: list[PracticeBreakdown]
    last_30_days: list[DashboardDay]
    # Most recently practiced (across all practices). Powers the
    # "Continue your practice" card on the dashboard.
    last_practice_key: str | None
    last_practice_day: date | None


@router.get("/dashboard", response_model=DashboardOut)
async def dashboard(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> DashboardOut:
    """Aggregate practice data for the dashboard charts.

    Returns total sessions, days practiced over 30/90 days, per-practice
    breakdown, and a 30-day daily count for the timeline chart. All data is
    user-scoped — never aggregated across users.
    """
    from app.services.practices import PRACTICES

    today = datetime.now(UTC).date()
    window_90 = today - timedelta(days=89)
    window_30 = today - timedelta(days=29)

    rows = await db.execute(
        select(
            PracticeSession.practice_key,
            PracticeSession.practice_day,
        ).where(
            PracticeSession.user_id == user.id,
            PracticeSession.practice_day >= window_90,
            PracticeSession.practice_day <= today,
        )
    )
    sessions = list(rows.all())

    # Aggregations
    total_sessions = len(sessions)

    days_30 = {s.practice_day for s in sessions if s.practice_day >= window_30}
    days_90 = {s.practice_day for s in sessions}

    by_practice: dict[str, dict] = {}
    per_practice_daily: dict[str, dict[date, int]] = {}
    for p in PRACTICES:
        by_practice[p.key] = {
            "key": p.key,
            "name": p.name,
            "short_name": p.short_name,
            "count_30d": 0,
            "count_90d": 0,
            "last_practiced": None,
        }
        per_practice_daily[p.key] = {}

    last_practice_day: date | None = None
    last_practice_key: str | None = None

    for s in sessions:
        b = by_practice.get(s.practice_key)
        if not b:
            continue
        b["count_90d"] += 1
        if s.practice_day >= window_30:
            b["count_30d"] += 1
            per_practice_daily[s.practice_key][s.practice_day] = (
                per_practice_daily[s.practice_key].get(s.practice_day, 0) + 1
            )
        if b["last_practiced"] is None or s.practice_day > b["last_practiced"]:
            b["last_practiced"] = s.practice_day
        if last_practice_day is None or s.practice_day > last_practice_day:
            last_practice_day = s.practice_day
            last_practice_key = s.practice_key

    last_30: dict[date, int] = {}
    for s in sessions:
        if s.practice_day >= window_30:
            last_30[s.practice_day] = last_30.get(s.practice_day, 0) + 1

    days = [window_30 + timedelta(days=i) for i in range(30)]
    timeline = [DashboardDay(day=d, count=last_30.get(d, 0)) for d in days]

    breakdowns: list[PracticeBreakdown] = []
    for v in by_practice.values():
        breakdowns.append(
            PracticeBreakdown(
                **v,
                daily_30d=[per_practice_daily[v["key"]].get(d, 0) for d in days],
            )
        )

    return DashboardOut(
        total_sessions=total_sessions,
        days_practiced_30d=len(days_30),
        days_practiced_90d=len(days_90),
        by_practice=breakdowns,
        last_30_days=timeline,
        last_practice_key=last_practice_key,
        last_practice_day=last_practice_day,
    )


@router.get("/history", response_model=HistoryOut)
async def history(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> HistoryOut:
    """Return a calendar of the last ``days`` days, marking which were practiced."""
    days = max(7, min(days, 90))
    today = datetime.now(UTC).date()
    start = today - timedelta(days=days - 1)

    rows = await db.execute(
        select(PracticeSession.practice_day).where(
            PracticeSession.user_id == user.id,
            PracticeSession.practice_day >= start,
            PracticeSession.practice_day <= today,
        )
    )
    practiced_days = {row[0] for row in rows}

    calendar = []
    for i in range(days):
        d = start + timedelta(days=i)
        calendar.append(HistoryDay(day=d, practiced=d in practiced_days))
    return HistoryOut(days=calendar)


# ── Journal ─────────────────────────────────────────────────────


class JournalIn(PydanticModel):
    style: str = Field(..., pattern="|".join(JOURNAL_STYLES))
    body: str = Field(..., min_length=1, max_length=20_000)


class JournalOut(PydanticModel):
    id: str
    entry_day: date
    style: str
    body: str
    created_at: datetime

    model_config = {"from_attributes": True}


@router.post("/journal", response_model=JournalOut, status_code=201)
async def create_journal(
    body: JournalIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> JournalOut:
    today = datetime.now(UTC).date()
    entry = JournalEntry(
        user_id=user.id,
        entry_day=today,
        style=body.style,
        body=body.body,
    )
    db.add(entry)
    try:
        await db.flush()
    except IntegrityError as e:
        raise HTTPException(
            status_code=409,
            detail="You've already journaled today. One entry per day — return tomorrow.",
        ) from e

    # Logging a journal entry also logs the "writing" practice for the day.
    # We silently no-op if a writing session was already logged today.
    existing_writing = await db.execute(
        select(PracticeSession).where(
            PracticeSession.user_id == user.id,
            PracticeSession.practice_key == "writing",
            PracticeSession.practice_day == today,
        )
    )
    if existing_writing.scalar_one_or_none() is None:
        db.add(PracticeSession(
            user_id=user.id,
            practice_key="writing",
            practice_day=today,
            source="self_log",
            note=f"Journal — {body.style}",
        ))
        await db.flush()

    return JournalOut.model_validate(entry)


@router.get("/journal", response_model=list[JournalOut])
async def list_journal(
    limit: int = 30,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[JournalOut]:
    limit = max(1, min(limit, 90))
    rows = await db.execute(
        select(JournalEntry)
        .where(JournalEntry.user_id == user.id)
        .order_by(JournalEntry.entry_day.desc())
        .limit(limit)
    )
    return [JournalOut.model_validate(e) for e in rows.scalars().all()]


@router.get("/journal/today", response_model=JournalOut | None)
async def todays_journal(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> JournalOut | None:
    today = datetime.now(UTC).date()
    result = await db.execute(
        select(JournalEntry).where(
            JournalEntry.user_id == user.id,
            JournalEntry.entry_day == today,
        )
    )
    entry = result.scalar_one_or_none()
    return JournalOut.model_validate(entry) if entry else None
