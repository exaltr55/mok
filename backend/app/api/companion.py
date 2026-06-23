"""Companion endpoint — answers user questions with a two-layer pipeline.

  1. Local Q&A library (``content/companion/qa.md``) — zero tokens.
  2. Claude fallback via ``llm-client`` when the library has no match.

Every Q&A pair is logged to ``companion_messages`` so we can promote
common LLM answers into the static library over time and bound spend.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from llm_client import create_provider, parse_model_string
from llm_client.base import LLMMessage, MessageRole
from pydantic import BaseModel as PydanticModel
from pydantic import Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession  # noqa: TC002

from app.api.auth import get_current_user
from app.config import settings
from app.database import get_db
from app.models.companion_message import (
    SOURCE_CLAUDE,
    SOURCE_LIBRARY,
    CompanionMessage,
)
from app.models.user import User  # noqa: TC001
from app.services.companion_library import best_match

router = APIRouter(prefix="/me/companion", tags=["companion"])

DAILY_LLM_CAP = 30
QUESTION_MAX_CHARS = 2000

SYSTEM_PROMPT = (
    "You are Buddy, a warm and gentle support inside the YouSourceful practice app.\n"
    "\n"
    "Voice and behavior:\n"
    "- Speak with steadiness and care, never preach or instruct.\n"
    "- Use simple, breath-paced sentences. No emojis. No exclamation marks.\n"
    "- The 5S framework is: Source, Seed, Soil, Season, Sowing.\n"
    "- The 7 practices are I M Breathing, I M Thinking, I M Talking, I M Writing,\n"
    "  I M Moving, I M Resetting, I M Aligning.\n"
    "- When useful, nudge the user toward a specific practice or page rather than long\n"
    "  explanations.\n"
    "- Never give medical, clinical, legal, or financial advice. Suggest seeing a\n"
    "  qualified professional instead.\n"
    "- Keep replies under ~150 words unless the user clearly asks for depth.\n"
    "- If the question is off-topic, gently bring it back to practice."
)


class CompanionMessageIn(PydanticModel):
    question: str = Field(..., min_length=1, max_length=QUESTION_MAX_CHARS)


class CompanionMessageOut(PydanticModel):
    answer: str
    source: str  # "library" | "claude"
    remaining_today: int | None = None  # LLM calls remaining (None for library hits)


class CompanionHistoryItem(PydanticModel):
    """A past question/answer the user has had with Buddy."""

    id: str
    question: str
    answer: str
    source: str
    created_at: datetime


class CompanionHistoryOut(PydanticModel):
    items: list[CompanionHistoryItem]
    total: int  # lifetime count for this user


async def _count_llm_today(db: AsyncSession, user_id: str) -> int:
    """Number of LLM-backed messages this user has sent in the last 24h."""
    since = datetime.now(UTC) - timedelta(hours=24)
    stmt = select(func.count(CompanionMessage.id)).where(
        CompanionMessage.user_id == user_id,
        CompanionMessage.source != SOURCE_LIBRARY,
        CompanionMessage.created_at >= since,
    )
    result = await db.execute(stmt)
    return result.scalar_one() or 0


@router.post("/message", response_model=CompanionMessageOut)
async def post_message(
    body: CompanionMessageIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> CompanionMessageOut:
    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Question is empty.")

    # Layer 1 — library lookup (free).
    hit = best_match(question)
    if hit:
        msg = CompanionMessage(
            user_id=user.id,
            question=question,
            answer=hit.answer,
            source=SOURCE_LIBRARY,
        )
        db.add(msg)
        await db.flush()
        return CompanionMessageOut(answer=hit.answer, source=SOURCE_LIBRARY)

    # Layer 2 — LLM fallback. Enforce daily cap.
    used = await _count_llm_today(db, user.id)
    if used >= DAILY_LLM_CAP:
        raise HTTPException(
            status_code=429,
            detail=(
                "You've reached the daily Companion message limit "
                f"({DAILY_LLM_CAP} questions in 24 hours). The library "
                "is still available for common questions — try again "
                "in a bit, or rephrase to match a library topic."
            ),
        )

    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503,
            detail="The Companion's AI fallback is not configured. Library answers still work.",
        )

    # Call Claude via the shared llm-client.
    model_string = settings.default_model  # e.g. "anthropic:claude-sonnet-4-6"
    try:
        provider_name, model_id = parse_model_string(model_string)
        provider = create_provider(provider_name, model_id)
        response = await provider.complete(
            [
                LLMMessage(role=MessageRole.SYSTEM, content=SYSTEM_PROMPT),
                LLMMessage(role=MessageRole.USER, content=question),
            ],
            temperature=0.6,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Companion couldn't reach Claude: {e}") from e

    answer = (response.message.content or "").strip()
    if not answer:
        answer = (
            "I don't have a good answer for that one. "
            "Maybe rephrase, or open the practice itself."
        )

    msg = CompanionMessage(
        user_id=user.id,
        question=question,
        answer=answer,
        source=SOURCE_CLAUDE,
        input_tokens=getattr(response.usage, "input_tokens", None),
        output_tokens=getattr(response.usage, "output_tokens", None),
    )
    db.add(msg)
    await db.flush()

    return CompanionMessageOut(
        answer=answer,
        source=SOURCE_CLAUDE,
        remaining_today=max(0, DAILY_LLM_CAP - used - 1),
    )


@router.get("/messages", response_model=CompanionHistoryOut)
async def list_messages(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    limit: int = 5,
) -> CompanionHistoryOut:
    """Return the user's most recent Buddy interactions and their lifetime
    total. Used by the Me overview to surface vibrancy ('5 questions
    asked this month') without exposing other users' content."""
    capped = max(1, min(limit, 20))
    items_stmt = (
        select(CompanionMessage)
        .where(CompanionMessage.user_id == user.id)
        .order_by(CompanionMessage.created_at.desc())
        .limit(capped)
    )
    items = (await db.execute(items_stmt)).scalars().all()

    total_stmt = select(func.count(CompanionMessage.id)).where(
        CompanionMessage.user_id == user.id,
    )
    total = (await db.execute(total_stmt)).scalar_one() or 0

    return CompanionHistoryOut(
        items=[
            CompanionHistoryItem(
                id=m.id,
                question=m.question,
                answer=m.answer,
                source=m.source,
                created_at=m.created_at,
            )
            for m in items
        ],
        total=total,
    )
