# Design Principles

> Source: §1.3 of the Mokshly YouSourceful Platform Design Document.

The following seven principles flow from the [two foundational truths](philosophy.md). **Every feature decision in Mokshly is evaluated against these.**

---

## Principle 1 — Minimum Viable Engagement

The product succeeds when users spend less time in the app and more time living their lives. Every feature is designed to be used briefly and return to life. There are no infinite feeds, no autoplay mechanics, no attention traps.

## Principle 2 — Consistency Over Completion

We honor the user who practices one thing consistently over the user who samples all seven inconsistently. We reward showing up, not checking boxes. We never display "X of 7 practices today" or any variation that implies daily completion.

## Principle 3 — Guardrails, Not Gates

Every feature has a built-in usage ceiling.

- Daily practice time is capped.
- Journaling is limited to one entry per day.
- Cohort interaction is strictly timed.

These are not restrictions to bypass — **they define the experience**.

## Principle 4 — Self-Competition Only

Progress is always relative to the user's own past. There are no public rankings, no leaderboards, no visible streaks shared with peers. The Mokshly Consistency Index is private to the user.

## Principle 5 — The MCI Is Sacred

The MCI is never shared with HR, insurance, donor admins, cohort members, or anyone else. It is the user's private instrument for self-awareness. The MCI follows the user across all tenant memberships.

See [MCI specification](../03-systems/mci.md) for the full treatment.

## Principle 6 — Cohort Is Intimate, Not Social

Cohorts are small (4–6 members), structured (15 minutes per week, fixed agenda), and private. There is no social graph. There are no friend requests. There is no community feed.

See [Mokshly Connect](../02-pillars/connect.md) for cohort mechanics.

## Principle 7 — Design for Return, Not Retention

Absence is expected and accepted. The product does not punish missed days with guilt or red indicators. Instead, it creates welcoming return rituals.

See the [Return Ritual flow](../01-product/user-flows.md#flow-4--return-ritual) for the canonical pattern.

---

## How to apply these principles

When proposing or building any feature:

1. **Check it against each principle.** If it fails any, redesign or drop it.
2. **Watch for principle conflicts.** Engagement-driving features (Principle 1) often masquerade as helpful (e.g., "smart" reminders that nudge into practices not yet logged).
3. **The principles override product instincts borrowed from other domains.** Standard SaaS playbooks — streaks, leaderboards, push notifications for missed days — are explicitly anti-Mokshly.
4. **When in doubt, reread [Philosophy](philosophy.md).** The principles are how, the philosophy is why.

## Related Reading

- [Philosophy](philosophy.md) — the two foundational truths from which these principles flow.
- [Nudging Engine](../03-systems/nudging-engine.md) — anti-nudges and per-phase frequency caps embody Principle 1, 3, and 7.
- [Analytics Framework](../03-systems/analytics-framework.md) — the three data tiers operationalize Principle 5.
