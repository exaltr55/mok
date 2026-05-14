# Nudging and Engagement Engine

> Source: §3.2 of the Mokshly YouSourceful Platform Design Document.

> Nudges are the **most sensitive surface** of the product. A nudge done well feels like a caring reminder. A nudge done poorly feels like pressure.

---

## Nudge Principles

- **Maximum 2 nudges per day per user** (Phase 1), reducing by phase.
- **No nudges during user-defined quiet hours** (default: 10pm to 7am local time).
- Every nudge is **pro-practitioner**, not pro-engagement.
- Nudges use the user's own intention as context when possible.
- If a nudge is ignored 3 times in a row, the nudge type is downgraded in frequency.
- **Nudges never imply completion** — never reference "practices you haven't done today."

---

## Nudge Frequency by Phase

| Phase | Nudges per Day | Nudges per Week |
|-------|----------------|-----------------|
| **Phase 1 — Arriving** | Up to 2 | Up to 14 |
| **Phase 2 — Steadying** | Up to 2, averaging ~1 | Up to 7 |
| **Phase 3 — Integrating** | Rare, on-demand | 2–3 |
| **Phase 4 — Living** | Very rare | 1–2 per month |

---

## Nudge Categories

### Practice Reminders

- Triggered by user's own schedule preference.
- Content: "Your [practice name] is ready when you are."

### Weekly Cohort Prompt Delivery

- 24 hours before the weekly Connect.
- Content: "This week's cohort prompt: [prompt]. Take a moment to reflect."

### Cohort Connect Reminder

- 15 minutes before the weekly Connect.
- Content: "Your cohort meets in 15 minutes."

### Return Ritual

- **Triggered on 5th day of non-practice (never before).**
- Content: "Your practice is waiting when you're ready. No catching up required."
- **Only one such nudge; if ignored, respected.**

---

## Anti-Nudges (What We Don't Send)

- "You haven't done your [practice] today" — never.
- "X of 7 practices remaining" — never.
- Streak-break warnings.
- FOMO cohort activity updates.
- "You're falling behind" summaries.
- Achievement unlock announcements.
- Marketing content from within the practitioner experience.

---

## Rule-Based Personalization (MVP)

- Nudge timing driven by user's preferred practice time.
- Nudge content variation from a curated library of approved variants.
- Days since last practice → triggers Return Ritual at day 5.

---

## AI Enhancement (v1.1)

- Reflection summary from journal entries (opt-in, Tier 4).
- Nudge phrasing adaptation to user's style.
- Practice recommendation enrichment.
- **Always fallback to rule-based if LLM is unavailable.**

---

## Related Reading

- [Practitioner Journey](../01-product/practitioner-journey.md) — phase definitions referenced in the frequency table.
- [User Flows · Flow 4](../01-product/user-flows.md#flow-4--return-ritual) — Return Ritual full flow.
- [AI Guide](../02-pillars/ai-guide.md) — Guide check-ins share the nudge budget.
- [Design Principle 7 · Design for Return](../00-overview/design-principles.md#principle-7--design-for-return-not-retention).
