"""User model — the root entity of Mokshly's data model.

The user is never owned by a tenant. Tenants are affiliations attached via
``Membership``. Practice data (sessions, MCI, journal, reflections) is always
user-scoped, not tenant-scoped — this is a non-negotiable design rule from the
MCI and privacy framework.
"""

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel

# Practitioner phases, per docs/01-product/practitioner-journey.md.
PHASE_ARRIVING = "arriving"
PHASE_STEADYING = "steadying"
PHASE_INTEGRATING = "integrating"
PHASE_LIVING = "living"
PHASES = (PHASE_ARRIVING, PHASE_STEADYING, PHASE_INTEGRATING, PHASE_LIVING)


class User(BaseModel):
    """A Mokshly practitioner.

    ``email`` and ``password_hash`` are required for local auth. Profile fields
    (intention, phase, pronouns, timezone, etc.) are filled during onboarding
    and progressively updated.
    """

    __tablename__ = "users"

    # Identity
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(200), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Platform role — admin status is independent of practitioner phase.
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="user")

    # Top-level user type. Determines which portal/URL space they live in.
    # Values: "employee" (default) | "employer_admin" | "platform_admin".
    user_type: Mapped[str] = mapped_column(String(32), nullable=False, default="employee")

    # Onboarding state
    onboarded: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Practitioner profile (filled during onboarding flow)
    pronouns: Mapped[str | None] = mapped_column(String(40), nullable=True)
    timezone: Mapped[str] = mapped_column(String(60), nullable=False, default="UTC")
    intention: Mapped[str | None] = mapped_column(Text, nullable=True)
    career_stage: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Practice cadence preference
    preferred_time_of_day: Mapped[str] = mapped_column(
        String(20), nullable=False, default="morning",
    )
    preferred_days_per_week: Mapped[int] = mapped_column(nullable=False, default=5)
    # Specific clock time (HH:MM, 24-hour) the user has committed to.
    # Optional — falls back to the coarse `preferred_time_of_day` band when
    # absent. Set on the Rhythm page.
    preferred_practice_time: Mapped[str | None] = mapped_column(String(5), nullable=True)

    # Per-practice scheduled times (HH:MM, 24-hour) for the four core
    # practices. Writing is always the last of the day — bedtime ritual.
    # All optional; absence means "no scheduled reminder."
    breathing_time: Mapped[str | None] = mapped_column(String(5), nullable=True)
    thinking_time: Mapped[str | None] = mapped_column(String(5), nullable=True)
    talking_time: Mapped[str | None] = mapped_column(String(5), nullable=True)
    writing_time: Mapped[str | None] = mapped_column(String(5), nullable=True)
    # Up to 3 additional Breathing times across the day, stored as a
    # comma-separated "HH:MM,HH:MM,HH:MM" string. With breathing_time
    # this caps at 4 Breathing sessions per day — its role as a return-
    # anchor whenever the user needs it.
    breathing_extra_times: Mapped[str | None] = mapped_column(String(30), nullable=True)

    # Whether the user has opted in to in-app reminder banners (and,
    # when permission is granted, browser notifications). Off by default.
    reminders_on: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Cohort preferences
    cohort_preference: Mapped[str] = mapped_column(String(30), nullable=False, default="outside")
    cohort_meeting_day: Mapped[str | None] = mapped_column(String(10), nullable=True)
    cohort_meeting_window: Mapped[str | None] = mapped_column(String(30), nullable=True)

    # Whether the Connect / cohort feature is available for this practitioner.
    # Controlled by the employer (set by an admin per tenant). When False, the
    # cohort step is skipped during onboarding and the Connect section shows a
    # "coming when your team enables it" empty state. Eventually this will be
    # derived from a Tenant.cohort_enabled setting; per-user works for v1.
    cohort_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # The current phase. Mutable; users (or future automation) can advance it.
    phase: Mapped[str] = mapped_column(String(20), nullable=False, default=PHASE_ARRIVING)

    # Theme preference, persisted across sessions.
    theme: Mapped[str] = mapped_column(String(20), nullable=False, default="stillwater")

    # ── Personalization captured during onboarding ─────────────────
    # Where in life the practitioner is feeling stretched right now. Drives
    # which practice the Today screen leads with for the first 30 days.
    # Values: mind | body | heart | time
    stretched_area: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # How they best restore. Used to tune practice recommendations and
    # cohort presentation.
    # Values: solitude | movement | conversation | writing
    restore_style: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Tone preference for app voice and (later) the AI Guide.
    # Values: quiet | encouraging | reflective
    tone_preference: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Why the practitioner is here right now. Shapes the welcome greeting
    # and the first practice suggestion.
    # Values: burnout | transition | growth | curiosity | recommended
    here_because: Mapped[str | None] = mapped_column(String(20), nullable=True)
