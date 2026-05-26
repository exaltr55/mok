"""Practice endpoints — catalog, content, self-logging, and today's recommendation."""

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
from app.models.practice_session import (
    MOODS,
    SOURCE_SELF_LOG,
    SOURCES,
    PracticeSession,
)
from app.models.user import User
from app.services.mci import MciResult, compute_mci
from app.services.practices import (
    PRACTICE_BY_KEY,
    PRACTICES,
    Practice,
    derive_phase,
    load_practice_content,
    recommend_for_user,
)

router = APIRouter(prefix="/practices", tags=["practices"])


# ── Schemas ─────────────────────────────────────────────────────


class PracticeSummary(PydanticModel):
    key: str
    name: str
    short_name: str
    format: str
    session_min: int
    session_max: int
    daily_log_limit: int
    description: str


class PracticeDetail(PracticeSummary):
    content: str  # markdown (Part A + Part B)


class PracticeLogIn(PydanticModel):
    source: str = Field(default=SOURCE_SELF_LOG, pattern="|".join(SOURCES))
    duration_minutes: int | None = Field(default=None, ge=1, le=120)
    mood: str | None = Field(default=None, pattern="|".join(MOODS))
    note: str | None = Field(default=None, max_length=400)
    practice_day: date | None = None  # for 24-hour backdate


class PracticeLogOut(PydanticModel):
    id: str
    practice_key: str
    practice_day: date
    source: str
    duration_minutes: int | None
    mood: str | None
    note: str | None

    model_config = {"from_attributes": True}


def _to_summary(p: Practice) -> PracticeSummary:
    return PracticeSummary(
        key=p.key,
        name=p.name,
        short_name=p.short_name,
        format=p.format,
        session_min=p.session_min,
        session_max=p.session_max,
        daily_log_limit=p.daily_log_limit,
        description=p.description,
    )


# ── Catalog ─────────────────────────────────────────────────────


@router.get("", response_model=list[PracticeSummary])
async def list_practices() -> list[PracticeSummary]:
    """List the 7 Practices in canonical order."""
    return [_to_summary(p) for p in PRACTICES]


@router.get("/{key}", response_model=PracticeDetail)
async def get_practice(key: str) -> PracticeDetail:
    practice = PRACTICE_BY_KEY.get(key)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")
    summary = _to_summary(practice)
    return PracticeDetail(
        **summary.model_dump(),
        content=load_practice_content(key),
    )


# ── Self-logging ────────────────────────────────────────────────


@router.post("/{key}/log", response_model=PracticeLogOut, status_code=201)
async def log_practice(
    key: str,
    body: PracticeLogIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> PracticeLogOut:
    """Record a practice. Honors the 1-per-practice-per-day guardrail."""
    practice = PRACTICE_BY_KEY.get(key)
    if not practice:
        raise HTTPException(status_code=404, detail="Practice not found")

    today = datetime.now(UTC).date()
    target_day = body.practice_day or today

    # Enforce the 24-hour backdate window (today or yesterday only).
    if target_day < today - timedelta(days=1) or target_day > today:
        raise HTTPException(
            status_code=422,
            detail="Practices can be logged for today or yesterday only.",
        )

    session = PracticeSession(
        user_id=user.id,
        practice_key=key,
        practice_day=target_day,
        source=body.source,
        duration_minutes=body.duration_minutes,
        mood=body.mood,
        note=body.note,
    )
    db.add(session)
    try:
        await db.flush()
    except IntegrityError as e:
        # Unique constraint on (user_id, practice_key, practice_day)
        raise HTTPException(
            status_code=409,
            detail=(
                f"You've already logged {practice.short_name} for "
                f"{'today' if target_day == today else 'yesterday'}. "
                f"One entry per practice per day — see you tomorrow."
            ),
        ) from e
    return PracticeLogOut.model_validate(session)


# ── Today screen ────────────────────────────────────────────────


class TodayPractice(PydanticModel):
    key: str
    name: str
    short_name: str
    format: str
    session_min: int
    session_max: int


class MciOut(PydanticModel):
    mci: float
    milestone: str
    practice_days: int
    window_days: int


class TodayScreen(PydanticModel):
    user_name: str
    phase: str
    today: date
    recommended_practice: TodayPractice
    practiced_today: list[str]
    mci: MciOut


def _mci_to_out(r: MciResult) -> MciOut:
    return MciOut(
        mci=r.mci,
        milestone=r.milestone,
        practice_days=r.practice_days,
        window_days=r.window_days,
    )


@router.get("/today/summary", response_model=TodayScreen, tags=["practices", "today"])
async def today_summary(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TodayScreen:
    today = datetime.now(UTC).date()

    # Determine the practice to recommend.
    day_index = max(0, (today - user.created_at.date()).days)
    week_index = day_index // 7
    rec = recommend_for_user(day_index)

    # Auto-advance the practitioner phase as weeks pass. We only step
    # forward — manual edits in Preferences are respected if they jumped
    # ahead.
    PHASE_ORDER = ("arriving", "steadying", "integrating", "living")
    derived = derive_phase(week_index)
    if PHASE_ORDER.index(derived) > PHASE_ORDER.index(user.phase):
        user.phase = derived
        await db.commit()
        await db.refresh(user)

    # What did they already practice today?
    rows = await db.execute(
        select(PracticeSession.practice_key).where(
            PracticeSession.user_id == user.id,
            PracticeSession.practice_day == today,
        )
    )
    practiced_today = [row[0] for row in rows]

    mci = await compute_mci(db, user.id, on=today)

    return TodayScreen(
        user_name=user.name,
        phase=user.phase,
        today=today,
        recommended_practice=TodayPractice(
            key=rec.key,
            name=rec.name,
            short_name=rec.short_name,
            format=rec.format,
            session_min=rec.session_min,
            session_max=rec.session_max,
        ),
        practiced_today=practiced_today,
        mci=_mci_to_out(mci),
    )
