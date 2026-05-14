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
    theme: str | None = Field(default=None, pattern=r"^(dawn|sage|twilight)$")
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
