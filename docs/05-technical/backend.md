# 5.3 Backend Architecture

> Source: §5.3 of the Mokshly YouSourceful Platform Design Document.

---

## Technology Stack

- **Runtime:** Node.js 20+ with TypeScript; Go for performance-critical services.
- **Framework:** Fastify or NestJS.
- **API Style:** REST for CRUD; tRPC where type-sharing with frontend is beneficial.
- **Auth:** JWT (short-lived) + refresh tokens. Enterprise SSO via SAML/OIDC. Mokshly Access via scholarship-code activation.
- **ORM:** Prisma or Drizzle.
- **Background Jobs:** BullMQ on Redis, or managed SQS with Lambda workers.

> **v0 build note:** Mokshly v0 uses **Python 3.12 + FastAPI + SQLAlchemy 2.0 async** on PostgreSQL (matching the existing `mok` scaffold and the loom reference). Service boundaries below remain valid.

---

## Service Decomposition

### Identity Service
- User registration, authentication, session management.
- SSO orchestration (Enterprise).
- Mokshly Access scholarship-code activation flow.
- Commons email/password + social login.
- SCIM provisioning handler.

### Membership Service
- User-tenant relationship management.
- Primary membership designation and migration.
- Auto-migration from Commons to Enterprise when employer activates.
- Cross-membership resolution.

### Practice Service
- Practice content metadata.
- Practice session records (**Tier 1 data**, user-scoped).
- **MCI computation engine** (consistency-focused, no diversity bonus).
- Practice scheduling and recommendation logic.
- Phase-aware recommendation adjustment.

### Cohort Service
- Cross-tenant cohort matching.
- Bi-weekly formation waves (batch job).
- Cohort lifecycle (13-week cycles, re-commitment, disbanding).
- Weekly Connect orchestration (audio room lifecycle, async thread management).
- Host rotation logic.

### Content Service
- 5S Framework content delivery.
- 7 Practices content delivery.
- Weekly cohort prompt rotation.
- Nudge copy library.
- Content versioning and CMS integration.

### Analytics Service
- Aggregate metric computation with **k-anonymity enforcement**.
- Tenant dashboard data generation (Enterprise HR, Donor Portal).
- Insurance aggregate feed generation.
- Product analytics event processing.

### Consent Service
- Per-user, per-tenant, per-tier consent state.
- Consent change event streaming.
- Audit trail.
- GDPR/CCPA data rights request handling.

### Notification Service
- Nudge engine — **phase-aware schedule computation.**
- Multi-channel delivery (push, email, in-app).
- Throttling — **max 2/day per user**, phase-adjusted.
- Opt-in/opt-out management.

### Partner Service
- Partner onboarding and configuration.
- Partner catalog management.
- Referral flow orchestration.
- Partner aggregate data feed generation (insurance).

### AI Guide Service (MVP)
- **Trigger Engine** — evaluates signals (practice patterns, MCI trends, phase transitions, days elapsed) and fires rules when meaningful moments occur.
- **Message Library** — versioned, content-team-curated message templates (5–7 variants per moment).
- **Personalization Engine** — variable substitution (`firstName`, `intention`, `daysPracticed`, `currentPhase`).
- **Delivery Layer** — pushes messages into user's AI Guide conversation thread.
- **Crisis Detection** — keyword pattern matching on user replies; auto-escalates to human Crisis Team.
- **Rule-based architecture in MVP** — no LLM API calls, no per-conversation costs.
- LLM augmentation deferred to v1.1 (with explicit Tier 4 consent).

### Crisis Escalation Service (MVP)
- Receives escalation events from AI Guide Service.
- Notifies Crisis Team Responder via PagerDuty/SMS **within minutes**.
- Maintains escalation audit trail.
- Provides Crisis Responder with conversation context and resource referral playbook.
- **Hands off conversation from AI Guide to human** — AI Guide steps back.

### Newsletter Service (MVP)
- Mokshly Weekly content scheduling and templating.
- **5-section format rendering** (lead reflection, cohort prompt, practice in focus, practitioner note, Mokshly Notes).
- Personalization — first name, phase-aware salutation.
- Delivery via Resend or Customer.io.
- Friday afternoon delivery in user's local time zone.
- Subscription state — required for first 4 weeks, optional thereafter.
- Analytics: open rate, unsubscribe rate **only** — no per-link click tracking.

### Billing Service (MVP)
- **Stripe Billing** integration for Mokshly Commons subscriptions ($100/year, trial flow, dunning).
- **Stripe Invoicing** for Enterprise contracts (per-employee annual, ACH/wire/PO).
- Trial state machine — day 1 to day 30 (or 60), card capture window, conversion.
- Pause-and-resume logic for Commons subscriptions.
- Annual auto-renewal with advance notice.
- Tax handling via Stripe Tax.
- Invoice PDF generation and storage.

### Mokshly Access Service (MVP)
- **Grant ledger** — funds received from donors, balance tracking.
- Scholarship allocation — funds tagged to specific recipients.
- Application portal backend (manual review in MVP).
- Renewal management for scholarship-funded memberships.
- Integration with Donor Reporting Service for impact metrics.

### Donor Reporting Service (MVP)
- Aggregate metric computation per grant (**k≥20 enforced**).
- Five-tier reporting framework (utilization, engagement, outcomes, narrative, compliance).
- Real-time donor dashboard data feeds.
- Quarterly and annual report generation (PDF and CSV).
- Audit data export for major donors.
- Per-grant attribution — each donor sees impact of their specific funding.

---

## Related Reading

- [Data Architecture (§5.4)](data.md) — schemas owned by each service.
- [AI Layer (§5.5)](ai-layer.md) — rule-based posture explained.
- [Billing Architecture (§4.6)](../04-business/billing-architecture.md) — business detail behind the Billing Service.
