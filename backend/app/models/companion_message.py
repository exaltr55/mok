"""CompanionMessage — every question the user asks the Companion is logged
here, with the answer the Companion gave and where it came from
(library vs LLM provider). Used for daily rate limiting, for promoting
common LLM Q&A pairs into the static library, and for cost tracking.

Per the user-privacy stance, journal content is never sent to the LLM
provider, so it never appears here either.
"""

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import BaseModel

SOURCE_LIBRARY = "library"
SOURCE_CLAUDE = "claude"
SOURCE_OPENAI = "openai"
COMPANION_SOURCES = (SOURCE_LIBRARY, SOURCE_CLAUDE, SOURCE_OPENAI)


class CompanionMessage(BaseModel):
    __tablename__ = "companion_messages"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String(20), nullable=False, default=SOURCE_LIBRARY)

    # Library hits are free; LLM hits report token counts so we can
    # bound spend and reason about cost.
    input_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
    output_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
