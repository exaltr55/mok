# HR Admin Portal

> Source: §2.3.5 of the Mokshly YouSourceful Platform Design Document.

## Purpose

Give enterprise HR leaders privacy-respecting program health — **enough to demonstrate ROI, nothing that surveils individuals.**

---

## Dashboards

- **Overview** — licenses, activated, weekly practice rate, cohort formation rate.
- Practice distribution (aggregate n≥10, no per-practice identification of individuals).
- Cohort health (aggregate).
- **Analytics** — monthly and quarterly reports, exportable PDF.

---

## Privacy Guardrails

- **Permanent banner:** "You see aggregate signals only. Individual practitioner data — practices, reflections, journal entries, conversations, and MCI — is never exposed to HR."
- **No aggregation for groups smaller than n≥10.**
- No drill-down to individuals.
- No "most/least engaged" lists.
- **No ability to message individuals through the platform.**

---

## Related Reading

- [Analytics Framework](../03-systems/analytics-framework.md) — the three data tiers and k-anonymity rules.
- [Consent & Privacy](consent-and-privacy.md) — Tier 2 is HR aggregate consent, optional per user.
- [User Flows · Flow 6](../01-product/user-flows.md#flow-6--hr-admin-first-login) — HR admin onboarding.
