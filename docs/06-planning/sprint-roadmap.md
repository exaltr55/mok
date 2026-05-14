# 6.4 MVP Sprint Roadmap

> Source: §6.4 of the Mokshly YouSourceful Platform Design Document.

Assumes a team of **8–12 engineers, 1–2 designers, 1 PM, 1 content lead, and CS/GTM support**. Sprints are 2 weeks.

---

## Sprint 1–2 (Weeks 1–4) — Foundation

- Infrastructure — AWS, Kubernetes, CI/CD, observability baseline.
- Design system v1.
- Identity + Membership services — multi-tenant foundation.
- Database schema v1 — users, tenants, memberships, practice_sessions, consents.
- Content pipeline — CMS, first 5S content.
- Security baseline — SAST, dependency scanning.

---

## Sprint 3–4 (Weeks 5–8) — Core Practice Loop

- Onboarding flow — universal with tenant-aware branching.
- Today screen with phase-aware presentation.
- **All 7 Practices** — guided sessions + self-logging.
- **MCI computation** — consistency-focused (no diversity bonus).
- Journal for I M Writing.
- Settings, preferences, consent management.
- Rule-based notification engine.

---

## Sprint 5–6 (Weeks 9–12) — Cohort, AI Guide & Newsletter

- Cross-tenant cohort matching.
- Bi-weekly formation wave job.
- Cohort profile and rules UI.
- Daily cohort view with 3-min timer.
- Weekly Connect — **Live Audio with 4-part agenda**.
- Async Weekly Connect mode.
- Host rotation and training.
- 13-week cycle logic and re-commitment.
- **AI Guide system** — Trigger Engine, Message Library, Personalization, Delivery Layer.
- AI Guide conversation thread UI.
- Crisis Detection and Crisis Escalation Service.
- **Mokshly Weekly newsletter** — templating, scheduling, Friday afternoon delivery, subscription state machine.

---

## Sprint 7 (Weeks 13–15) — Tenant Admin, Billing & Mokshly Access

- HR Admin portal with aggregate analytics.
- Enterprise IT console (SSO, SCIM, audit logs).
- k-anonymity enforcement in aggregation service.
- Insurance partner integration with consented aggregate feed.
- Consent UX refinement (Tier 4 for AI Guide added to MVP).
- **Billing Service** — Stripe Billing for Commons subscriptions, trial state machine, day-21 confirmation flow.
- **Stripe Invoicing** for Enterprise contracts.
- Pause-and-resume logic for Commons subscriptions.
- **Mokshly Access program** — application portal, scholarship allocation, grant ledger.
- **Donor Portal** — grant tracking, five-tier reporting framework, real-time dashboards.
- Crisis Team operational tooling and on-call rotation.
- Mokshly internal admin console.

---

## Sprint 8 (Weeks 15–16) — Hardening

- Accessibility audit and remediation.
- Performance tuning.
- Security pentest.
- Load testing.
- Beta feedback incorporation.
- Documentation finalization.
- Launch readiness.

---

## Related Reading

- [MVP Scope (§1.7)](../00-overview/mvp-scope.md) — the rollout phases at a higher altitude.
- [Beta & Launch Readiness](beta-and-launch.md) — what Sprint 8 needs to deliver.
