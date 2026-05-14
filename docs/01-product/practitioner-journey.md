# The Practitioner Journey — Four Phases

> Source: §1.6 of the Mokshly YouSourceful Platform Design Document.

Mokshly is designed to evolve with the practitioner. There are **four phases**.

---

## Phase 1 — Arriving (approximately Weeks 1–4)

The user is building the bridge from curiosity to habit. The app is **directive** and holds their hand.

- Guided sessions are the primary path.
- Self-logging is available but secondary.
- Today screen is directive: "Today's practice: Breathing. Begin in 3 minutes."
- Nudges are active (2/day maximum).
- Cohort placement at end of Week 2.

**Success:** showing up 3–5 times per week, beginning to feel the practice.

---

## Phase 2 — Steadying (approximately Weeks 5–12)

The user has a rhythm but still benefits from structure.

- Guided and self-logged options become equal.
- App shifts to **supportive**: "How will you practice today?"
- Nudges reduce (average 1/day, max 2).
- Cohort dynamics deepen.

**Success:** consistent weekly practice, MCI trending below 20.

---

## Phase 3 — Integrating (approximately Weeks 13–26)

The practice moves into daily life, beyond the app.

- Self-logging is default on the Today screen.
- Today screen becomes **reflective**: "How is your practice today?"
- Nudges drop to 2–3 per week.
- Users customize practice (duration, timing, which practices they lean into).

**Success:** practice integrated into daily life, MCI stable below 15.

---

## Phase 4 — Living (Week 27+)

The practice is no longer a program — it is a way of being.

- The app becomes a **quiet companion**, not a coach.
- Today screen is minimal.
- No proactive practice recommendations.
- Nudges become rare — 1–2 per month.
- Users often take on cohort leadership.
- Formal practice frequency may decrease as Awareness integrates into daily life — **this is success, not failure.**

**Success:** the user returns because the practice is part of who they are.

---

## Phase Transition Mechanics

- Transitions require **three signals**: sufficient time elapsed, demonstrated practice consistency, and user readiness.
- The app **never forces** a transition. It invites: "You've built a steady rhythm. Would you like more autonomy?"
- **Reverse transitions are fully supported.** A user in Phase 3 going through a life transition may return to Phase 1's scaffolding.

## What Never Changes Across Phases

- The MCI and how it's computed.
- Privacy model.
- Guardrails (daily and weekly ceilings, 1 log per practice per day).
- The Seven Practices themselves.
- Cohort structure.

---

## Related Reading

- [User Flows](user-flows.md) — the Today screen flow is explicitly phase-aware (Flow 2).
- [MCI](../03-systems/mci.md) — invariant across phases.
- [Nudging Engine](../03-systems/nudging-engine.md) — frequency caps step down per phase.
