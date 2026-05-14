# Mokshly Consistency Index (MCI) — Full Specification

> Source: §3.1 of the Mokshly YouSourceful Platform Design Document.

The MCI is the **defining private metric** of Mokshly. It is the single number the user sees on their dashboard each day, reflecting their consistency with their own practice. **It is sacred — never shared with any tenant, partner, or cohort member.**

---

## Design Philosophy

The MCI rewards **consistency over completion**. It treats rest as part of practice. It is always personal. It never invites comparison. It is inspired by golf's handicap — a lifelong companion, not a competition. **Every practitioner is on their own arc.**

---

## Core Principles of the MCI

1. **Consistency is the only thing measured.** The MCI answers one question: how consistently has the user returned to their practice in the last 30 days?
2. **Diversity is not rewarded.** A user who practices Breathing daily has a better MCI than a user who samples all seven practices inconsistently. Depth matters as much as breadth. **The MCI honors both.**
3. **Rest is honored.** The target is **5 practice days per week, not 7**. Missing 1–2 days per week does not penalize.
4. **The MCI follows the user.** Across tenant migrations, across life transitions, across years — the MCI is the user's alone and travels with them.

---

## MCI Formula (v1)

### Parameters

- **Target practice rate:** 5 days per week (out of 7).
- **Evaluation window:** Last 30 days, rolling.
- **MCI range:** 0 to 36. **Lower is better.** New users start at 36.
- **Scratch score: 6** — reserved for users practicing at or above target for 30 consecutive days.

### Calculation

```
MCI = 36 − (Total Credit)
```

Where:

- Each practice day in the last 30 days contributes a **base credit of 1.0**.
- A "practice day" is **any day where the user completed or logged at least one practice**.
- **Consistency bonus:** If the user practiced on at least 5 of the last 7 days, **+0.1 credit per day** in that 7-day window.
- **Rest acknowledgment:** If the user practiced 5 of 7 days, missed days do not penalize.
- **No diversity bonus.** A user practicing the same practice daily is treated the same as a user varying their practice.

---

## Worked Example 1

**User A** practices Breathing every weekday (20 of 30 days), occasionally adding Writing or Moving.

- Base credit: **20**
- Consistency bonus: **~2** (applied across 4 weeks of meeting target).
- Total credit: **22**
- **MCI = 36 − 22 = 14.** → "Grounded Practitioner."

## Worked Example 2 (Depth Over Breadth)

**User B** practices only Breathing, but does so 25 of 30 days.

- Base credit: **25**
- Consistency bonus: **~2.5**
- Total credit: **~27.5**
- **MCI = 36 − 27.5 = 8.5.** → "Aligned Practitioner." **Depth is honored.**

---

## MCI Milestones

| MCI Range | Label | Meaning |
|-----------|-------|---------|
| ≤ 6 | **Deep Practitioner** | Consistent practice sustained over months |
| 7 – 10 | **Aligned Practitioner** | Steady practice, close to daily rhythm |
| 11 – 15 | **Grounded Practitioner** | Regular practice, reliable cadence |
| 16 – 20 | **Steady Practitioner** | Consistent foundation forming |
| 21 – 30 | **Returning** | Practice is developing |
| 31 – 36 | **Beginning** | Early practice or returning after long absence |

---

## What the User Sees

- A single number on the Today dashboard.
- A weekly change indicator.
- A milestone label when applicable.
- On tap: plain-language explanation and a simple 90-day MCI line.
- **No comparison to any other user, ever.**

---

## What the MCI Never Does

- **Never shared** with HR, insurance, donor admins, cohort members, or Mokshly staff outside aggregated trend analysis (which uses tenant-level aggregates only, never individual MCI).
- Never appears in notifications with shame framing.
- Never triggers automated re-engagement campaigns based on the score.
- **Never becomes a criterion for any benefit, premium, or reward.**

---

## MCI Reset

If a user returns after **21+ days of absence**, they are offered an optional MCI reset to 36 — a clean slate. **Opt-in only.**

---

## Related Reading

- [Design Principle 5 · The MCI Is Sacred](../00-overview/design-principles.md#principle-5--the-mci-is-sacred).
- [Philosophy · Second Truth](../00-overview/philosophy.md#the-second-truth--the-player-keeps-their-own-score) — the golf-inspired thinking.
- [Mokshly Do](../02-pillars/do.md) — what counts as a practice day.
- [Analytics Framework](analytics-framework.md) — why MCI is Tier 1 Sacred data.
