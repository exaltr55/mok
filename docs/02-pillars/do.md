# Mokshly Do (The 7 Practices)

> Source: §2.3.2 of the Mokshly YouSourceful Platform Design Document.

## Purpose

Mokshly Do is where daily life change happens. It delivers the 7 Practices as guided or self-logged sessions.

---

## The 7 Practices — Delivery Specifications

| Practice | Primary Format | Session Length | Daily Log Limit |
|----------|----------------|----------------|-----------------|
| **I M Breathing** | Audio guided | 1–5 min | 1 log/day |
| **I M Thinking** | Audio with silence | 5–10 min | 1 log/day |
| **I M Talking** | Audio affirmations | 2–5 min | 1 log/day |
| **I M Writing** | In-app journal | 5–10 min | 1 entry/day |
| **I M Moving** | Video + audio | 10–15 min | 1 log/day |
| **I M Resetting** | Reflection + log | 2–5 min in-app | 1 log/day |
| **I M Aligning** | Structured check-ins | 2–3 min check-ins | 1 log/day (rolls up morning/midday/evening) |

---

## Self-Logging (First-Class Feature)

Every practice supports self-logging for users who practiced outside the app. **Self-logged and guided sessions count equally toward the MCI.**

- "Log my practice" available on every practice page.
- Brief confirmation: "You practiced [practice name] today."
- Optional 3-question micro-reflection — duration preset (5/10/20 min or custom), how it felt (lighter/same/heavier), optional 1-line note.
- **24-hour backdating window** — users can log a practice up to 24 hours after the fact, not further.
- **1 log per practice per day** — uniform rule. For Aligning, the day's multiple check-ins roll up to 1 log.

---

## Practice Recommendation Logic

The Today screen recommends **one practice per day** (Phases 1–3). The logic honors the "doorway not destination" principle.

- The user's explicit schedule takes precedence.
- **Stage-appropriate sequencing** — new users are guided through Breathing → Thinking → Talking → Writing over their first 4 weeks.
- **Depth is honored** — if a user has returned to the same practice consistently, that choice is respected, not redirected.
- **Time-of-day alignment** — Writing suggested for evenings, Moving for energetic times.

---

## Guardrails

- **1 log per practice per day** (hard cap at API level).
- **Total in-app practice time per day capped at 90 minutes.**
- After reaching the ceiling: "You've cared for yourself generously today. The benefit deepens through rest. See you tomorrow."

---

## Anti-Patterns (What We Don't Do)

- No "X of 7 practices today" display.
- No per-practice streaks.
- No celebration at 7, 30, 100 day marks.
- No "catch-up" ability for missed days.
- No diversity-reward mechanics — **depth is as valuable as breadth.**

---

## Related Reading

- [Practitioner Journey](../01-product/practitioner-journey.md) — practice presentation shifts across phases.
- [MCI](../03-systems/mci.md) — self-logged and guided count equally.
- [Mokshly Learn](learn.md) — the conceptual foundation for these practices.
- [Philosophy](../00-overview/philosophy.md) — the "doorway not destination" truth.
