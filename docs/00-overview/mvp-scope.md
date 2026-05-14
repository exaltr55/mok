# MVP Scope and Rollout

> Source: §1.7 of the Mokshly YouSourceful Platform Design Document.

The MVP is targeted for delivery in **3 to 4 months**.

---

## MVP — In Scope

- Unified user identity with memberships model supporting **Enterprise, Commons, and Access** tenants.
- **Enterprise SSO** (SAML, OIDC) for employees.
- **Direct signup** for Mokshly Commons members.
- **Mokshly Access** scholarship program with grant-funded membership flows.
- **Mokshly Learn** — 5S Framework content.
- **Mokshly Do** — all 7 Practices with guided sessions and self-logging (1 log per practice per day).
- **My Mokshly** — personal dashboard with MCI, journal, reflections.
- **Mokshly Connect** — cross-tenant cohort matching, weekly 15-minute Connect (Live Audio + Async).
- **AI Guide system** — rule-based check-ins, app-level intelligence, no LLM costs.
- **Mokshly Weekly newsletter** — 5-section format, Friday afternoon delivery.
- **HR Admin portal** with aggregate analytics.
- **Insurance partner aggregate integration** (n≥50).
- **Mokshly Access Donor Portal** — grant tracking and impact reporting.
- **Billing infrastructure** — Stripe Billing for Commons, Stripe Invoicing for Enterprise, scholarship tracking for Access.
- **Crisis Team escalation system** for AI Guide care escalations.
- **Four-phase practitioner journey** with phase-aware presentation.
- **Rule-based nudging** (max 2/day, phase-adjusted).

## MVP — Out of Scope

- **Member-Partner Tenants** (Marriott, AARP, Costco pattern) — deferred to v1.1.
- **LLM-powered AI conversation** (rule-based AI Guide is MVP; LLM augmentation in v1.1+).
- **Recognition System** (golf-inspired moments like "Steady Week", "Return") — deferred to v1.1.
- **Native mobile apps** — v1.1.
- **Mokshly Tools** — v1.1.
- **Mokshly Shop** — v2.
- **Live video cohorts** — v2.
- **Languages beyond English** — v1.2+.

## Rollout Phases

| Phase | Duration | Key Deliverables |
|------|---------|------------------|
| **Phase 0 — Design & Foundations** | Weeks 1–3 | Finalize design, infrastructure, SSO prototype, billing infrastructure setup |
| **Phase 1 — Core Practice Loop** | Weeks 4–8 | Auth, onboarding, Learn, Do (all 7 practices + self-logging), My Mokshly, MCI engine, phase-aware UI |
| **Phase 2 — Cohort, AI Guide & Newsletter** | Weeks 9–12 | Cross-tenant cohort matching, Weekly Connect (Live Audio + Async), Host flows, AI Guide rule engine and message library, Mokshly Weekly newsletter system |
| **Phase 3 — Tenant Admin & Billing** | Weeks 13–15 | HR Admin, Mokshly Access program, Donor Portal, Enterprise IT console, Billing infrastructure (Stripe Billing + Invoicing), Insurance integration, consent framework, Crisis Team escalation |
| **Phase 4 — Hardening & Launch** | Week 16 | Security audit, accessibility audit, load testing, beta feedback |

## Related Reading

- [Executive Summary](executive-summary.md) — the case for what's in MVP.
- [Tenant Architecture](../01-product/tenant-architecture.md) — the three tenant types referenced above.
- [AI Guide](../02-pillars/ai-guide.md) — explanation of why MVP is rule-based, not LLM.
