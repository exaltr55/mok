"""The 7 Practices — catalog + content loader.

The catalog itself is structured data (per docs/02-pillars/do.md). The actual
written content (Part A / Part B) lives in markdown files under
``content/do/`` at the repo root and is loaded lazily.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import cache
from pathlib import Path


@dataclass(frozen=True)
class Practice:
    key: str
    name: str
    short_name: str
    format: str
    session_min: int
    session_max: int
    daily_log_limit: int
    description: str
    content_file: str  # relative path under content/do/


# Ordered as the doc lists them. Order matters: it drives the suggested
# sequencing for new users (Breathing → Thinking → Talking → Writing in
# the first four weeks).
PRACTICES: tuple[Practice, ...] = (
    Practice(
        key="breathing",
        name="I M Breathing",
        short_name="Breathing",
        format="Audio guided",
        session_min=1,
        session_max=2,
        daily_log_limit=1,
        description="Returning to Source through the breath. The simplest doorway.",
        content_file="01-breathing.md",
    ),
    Practice(
        key="thinking",
        name="I M Thinking",
        short_name="Thinking",
        format="Audio with silence",
        session_min=5,
        session_max=10,
        daily_log_limit=1,
        description="Noticing thoughts as they arise through an anchor thought.",
        content_file="02-thinking.md",
    ),
    Practice(
        key="talking",
        name="I M Talking",
        short_name="Talking",
        format="Audio affirmations",
        session_min=1,
        session_max=2,
        daily_log_limit=1,
        description="Consciously shaping inner self-talk through I am affirmations.",
        content_file="03-talking.md",
    ),
    Practice(
        key="writing",
        name="I M Writing",
        short_name="Writing",
        format="In-app journal",
        session_min=3,
        session_max=5,
        daily_log_limit=1,
        description="Expressive, reflective, or gratitude journaling. One entry per day.",
        content_file="04-writing.md",
    ),
    Practice(
        key="moving",
        name="I M Moving",
        short_name="Moving",
        format="Video + audio",
        session_min=10,
        session_max=15,
        daily_log_limit=1,
        description="Yoga postures, mindful walking, and squats — Awareness in the body.",
        content_file="05-moving.md",
    ),
    Practice(
        key="resetting",
        name="I M Resetting",
        short_name="Resetting",
        format="Reflection + log",
        session_min=2,
        session_max=5,
        daily_log_limit=1,
        description="A conscious pause and reset during the day.",
        content_file="06-resetting.md",
    ),
    Practice(
        key="aligning",
        name="I M Aligning",
        short_name="Aligning",
        format="Structured check-ins",
        session_min=2,
        session_max=3,
        daily_log_limit=1,
        description=(
            "Brief check-ins to align intention and action. "
            "Rolls up morning/midday/evening."
        ),
        content_file="07-aligning.md",
    ),
)

PRACTICE_BY_KEY: dict[str, Practice] = {p.key: p for p in PRACTICES}


@cache
def _content_root() -> Path:
    # backend/app/services/practices.py → up 4 levels → repo root → content/do
    here = Path(__file__).resolve()
    return here.parents[3] / "content" / "do"


def load_practice_content(key: str) -> str:
    """Read the canonical markdown for a practice. Empty string if missing."""
    practice = PRACTICE_BY_KEY.get(key)
    if not practice:
        return ""
    path = _content_root() / practice.content_file
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


# The four core practices the practitioner is introduced to over their
# first four days — Breathing, Thinking, Talking, Writing — and then
# practices together as the foundation of the seven-practice system.
CORE_FOUR = ("breathing", "thinking", "talking", "writing")
# The full seven once Moving, Resetting and Aligning have been added.
ALL_SEVEN = (*CORE_FOUR, "moving", "resetting", "aligning")


def recommend_for_user(day_index: int) -> Practice:
    """Stage-appropriate Today-screen recommendation. ``day_index`` is the
    0-based number of days since the practitioner's account was created.

    All four core practices (Breathing, Thinking, Talking, Writing) are
    available from Day 1. The Today spotlight gently rotates among them
    by day of week so each gets a turn.

    Days 1–21 (weeks 1–3): rotate among the four core practices.
    Days 22–28 (week 4): Moving introduced as the week's spotlight.
    Days 29–35 (week 5): Resetting becomes the spotlight.
    Days 36–42 (week 6): six practices rotate by day of week.
    Days 43+ (week 7 onwards): Aligning introduced; all seven now rotate.
    """
    from datetime import UTC, datetime

    weekday = datetime.now(UTC).weekday()
    d = max(day_index, 0)

    six_practices = (*CORE_FOUR, "moving", "resetting")

    # Days 1–21 (weeks 1–3): all four core unlocked from Day 1.
    # Today's spotlight rotates among them by day of week.
    if d < 21:
        key = CORE_FOUR[weekday % len(CORE_FOUR)]
    # Days 22–28 (week 4): Moving spotlight week.
    elif d < 28:
        key = "moving"
    # Days 29–35 (week 5): Resetting spotlight week.
    elif d < 35:
        key = "resetting"
    # Days 36–42 (week 6): six practices rotate by day of week.
    elif d < 42:
        key = six_practices[weekday % len(six_practices)]
    # Day 43+ (week 7 onwards): Aligning unlocks; all seven rotate.
    else:
        key = ALL_SEVEN[weekday % len(ALL_SEVEN)]
    return PRACTICE_BY_KEY[key]


def practices_available_on(day_index: int) -> tuple[str, ...]:
    """Practices the user can read / practice on a given day.

    All four core practices are available from Day 1. The Moving,
    Resetting, and Aligning practices unlock on weeks 4, 5, and 7
    respectively. Mirrors ``recommend_for_user`` boundaries.
    """
    d = max(day_index, 0)
    if d < 21:
        return CORE_FOUR
    if d < 28:
        return (*CORE_FOUR, "moving")
    if d < 42:
        return (*CORE_FOUR, "moving", "resetting")
    return ALL_SEVEN


def unlock_day_for(practice_key: str) -> int:
    """0-based day index when ``practice_key`` first becomes available."""
    unlock_map = {
        CORE_FOUR[0]: 0,   # Breathing — Day 1
        CORE_FOUR[1]: 0,   # Thinking — Day 1
        CORE_FOUR[2]: 0,   # Talking — Day 1
        CORE_FOUR[3]: 0,   # Writing — Day 1
        "moving": 21,      # Week 4 (Day 22)
        "resetting": 28,   # Week 5 (Day 29)
        "aligning": 42,    # Week 7 (Day 43)
    }
    return unlock_map.get(practice_key, 0)


# Practitioner phase derived from the week index.
#   Arriving    — weeks 1–7    (week_index  0–6)  — the introduction
#   Steadying   — weeks 8–10   (week_index  7–9)  — first three weeks of the
#                                                   full seven-practice rhythm
#   Integrating — weeks 11–12  (week_index 10–11) — practice begins to land
#   Living      — week 13+     (week_index 12+)   — the practice is part of
#                                                   the day
def derive_phase(week_index: int) -> str:
    if week_index < 7:
        return "arriving"
    if week_index < 10:
        return "steadying"
    if week_index < 12:
        return "integrating"
    return "living"
