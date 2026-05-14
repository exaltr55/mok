# Mokshly Do — The 7 Practices

> Source: Learning content provided by the Mokshly content team (`~/Downloads/7 Practices/`, seven `.docx` files dated April 2026). Surface: [Mokshly Do pillar](../../docs/02-pillars/do.md).

The second pillar of YouSourceful. Eight modules: a Part II introduction (bridge from the 5S Framework), plus the seven practices themselves.

Each practice file contains both **Part A — Learning the Practice** (educational context, narrator/instructor voice) and **Part B — Daily Practice** (the actual guided session text). The two parts mirror the dual-mode delivery described in [02-pillars/do.md](../../docs/02-pillars/do.md) — Part A introduces and explains; Part B is what the user hears each time they begin a session.

| # | File | Practice | Primary format | Session length | Daily log limit |
|---|------|----------|----------------|----------------|-----------------|
| 00 | [00-introduction.md](00-introduction.md) | Part II Introduction | Text/audio | n/a | n/a |
| 01 | [01-breathing.md](01-breathing.md) | **I M Breathing** | Audio guided | 1–5 min | 1 log/day |
| 02 | [02-thinking.md](02-thinking.md) | **I M Thinking** | Audio with silence | 5–10 min | 1 log/day |
| 03 | [03-talking.md](03-talking.md) | **I M Talking** | Audio affirmations | 2–5 min | 1 log/day |
| 04 | [04-writing.md](04-writing.md) | **I M Writing** | In-app journal | 5–10 min | 1 entry/day |
| 05 | [05-moving.md](05-moving.md) | **I M Moving** | Video + audio (yoga, walking, squats) | 10–15 min | 1 log/day |
| 06 | [06-resetting.md](06-resetting.md) | **I M Resetting** | Reflection + log | 2–5 min in-app | 1 log/day |
| 07 | [07-aligning.md](07-aligning.md) | **I M Aligning** | Structured check-ins | 2–3 min check-ins | 1 log/day (rolls up M/M/E) |

> See [02-pillars/do.md](../../docs/02-pillars/do.md) for the full delivery specification, guardrails, recommendation logic, and anti-patterns.

## Source files

The canonical .docx files (April 2026, from the content team) live outside the repo at `~/Downloads/7 Practices/`. The plain-text extraction lived at `/tmp/Practice*.txt`; the markdown bodies were produced by `/tmp/txt2md.py` (preserves stanza structure and applies markdown soft-line-breaks within stanzas).

If the content team ships updated `.docx` files, re-run the conversion with the same script and overwrite these markdown files.

## Formatting note

The line structure in each file preserves the original breath-paced cadence — meant to support audio narration. Two trailing spaces on each non-empty line create markdown soft-breaks; blank lines separate stanzas. If you edit content here, preserve that pattern.
