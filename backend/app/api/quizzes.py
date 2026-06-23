"""Mokshly Quizzes — short revision quizzes for each of the 7 practices."""

from __future__ import annotations

from functools import cache
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel as PydanticModel

router = APIRouter(prefix="/quizzes", tags=["quizzes"])

QUIZ_FILES: dict[str, str] = {
    "breathing": "01-breathing.md",
    "thinking": "02-thinking.md",
    "talking": "03-talking.md",
    "writing": "04-writing.md",
    "moving": "05-moving.md",
    "resetting": "06-resetting.md",
    "aligning": "07-aligning.md",
}


@cache
def _content_root() -> Path:
    return Path(__file__).resolve().parents[3] / "content" / "quizzes"


class QuizQuestion(PydanticModel):
    question: str
    answer: str


class QuizDetail(PydanticModel):
    key: str
    title: str
    questions: list[QuizQuestion]


def _parse_quiz(markdown: str) -> tuple[str, list[QuizQuestion]]:
    """Parse a quiz markdown file into (title, questions).

    Format:
        # Quiz — Practice Name
        ## Question text
        Answer text (one or more lines, ends at the next ## or EOF).
    """
    title = ""
    questions: list[QuizQuestion] = []

    current_q: str | None = None
    current_a_lines: list[str] = []

    def _flush() -> None:
        if current_q is not None:
            questions.append(
                QuizQuestion(
                    question=current_q.strip(),
                    answer=" ".join(line.strip() for line in current_a_lines).strip(),
                )
            )

    for raw_line in markdown.splitlines():
        line = raw_line.rstrip()
        if line.startswith("# ") and not title:
            title = line[2:].strip()
            continue
        if line.startswith("## "):
            _flush()
            current_q = line[3:].strip()
            current_a_lines = []
            continue
        if current_q is not None and line.strip():
            current_a_lines.append(line)

    _flush()
    return title, questions


@router.get("/{key}", response_model=QuizDetail)
async def get_quiz(key: str) -> QuizDetail:
    filename = QUIZ_FILES.get(key)
    if not filename:
        raise HTTPException(status_code=404, detail="Quiz not found")
    path = _content_root() / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail="Quiz content missing")
    title, questions = _parse_quiz(path.read_text(encoding="utf-8"))
    return QuizDetail(key=key, title=title, questions=questions)
