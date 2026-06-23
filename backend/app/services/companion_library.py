"""Q&A library for the Companion — token-free answer layer.

Loads ``content/companion/qa.md`` once at first call and matches user
questions against canonical entries by keyword overlap. The matcher is
deliberately simple for v0; we can swap in embeddings later if needed.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

QA_PATH = (
    Path(__file__).resolve().parent.parent.parent.parent / "content" / "companion" / "qa.md"
)

STOPWORDS = frozenset({
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "of", "to", "in", "on", "at", "for", "by", "with", "from", "into",
    "and", "or", "but", "if", "then", "else", "than",
    "what", "how", "why", "when", "where", "which", "who", "whom",
    "do", "does", "did", "done",
    "can", "could", "should", "would", "may", "might", "must", "will", "shall",
    "i", "me", "my", "mine",
    "you", "your", "yours",
    "we", "our", "us",
    "it", "its", "this", "that", "these", "those",
    "have", "has", "had", "having",
})


@dataclass
class LibraryHit:
    question: str
    answer: str
    score: float


_entries_cache: list[tuple[str, str]] | None = None


def _load_entries() -> list[tuple[str, str]]:
    """Parse the markdown library into (question, answer) tuples.

    Each ``## …`` heading is a question; everything between it and the
    next ``## …`` (or end of file) is the answer.
    """
    if not QA_PATH.exists():
        return []
    text = QA_PATH.read_text()
    # Split on H2 boundaries. The first chunk is preamble; skip it.
    chunks = re.split(r"^## ", text, flags=re.M)
    out: list[tuple[str, str]] = []
    for chunk in chunks[1:]:
        lines = chunk.split("\n", 1)
        if len(lines) < 2:
            continue
        question = lines[0].strip()
        answer = lines[1].strip().rstrip("-").strip()
        # Drop the trailing "---" separator line if present.
        answer = re.sub(r"\n-{3,}\s*$", "", answer).strip()
        if question and answer:
            out.append((question, answer))
    return out


def get_entries() -> list[tuple[str, str]]:
    global _entries_cache
    if _entries_cache is None:
        _entries_cache = _load_entries()
    return _entries_cache


def reload_entries() -> None:
    """Force a re-read of the markdown file. Useful in dev / tests."""
    global _entries_cache
    _entries_cache = None


def _tokenize(text: str) -> set[str]:
    return {
        w for w in re.findall(r"[a-zA-Z][a-zA-Z']*", text.lower())
        if len(w) > 1 and w not in STOPWORDS
    }


def best_match(question: str, threshold: float = 0.45) -> LibraryHit | None:
    """Return the highest-scoring library entry above ``threshold``.

    Score = fraction of meaningful query tokens covered by entry text.
    Returns ``None`` if no entry clears the threshold — the caller
    should fall back to an LLM in that case.
    """
    q_tokens = _tokenize(question)
    if not q_tokens:
        return None
    best: LibraryHit | None = None
    for entry_q, entry_a in get_entries():
        # Weight the question heading higher than the answer body.
        entry_q_tokens = _tokenize(entry_q)
        entry_a_tokens = _tokenize(entry_a)
        # Each query token contributes 1.0 if it appears in the heading,
        # 0.5 if only in the answer body.
        hit = 0.0
        for t in q_tokens:
            if t in entry_q_tokens:
                hit += 1.0
            elif t in entry_a_tokens:
                hit += 0.5
        score = hit / len(q_tokens)
        if best is None or score > best.score:
            best = LibraryHit(question=entry_q, answer=entry_a, score=score)
    if best and best.score >= threshold:
        return best
    return None
