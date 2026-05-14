# User Personas

> Source: §1.4 of the Mokshly YouSourceful Platform Design Document.

Mokshly serves a set of user types organized across **five categories** (plus one system category). The architecture is unified: every user belongs to at least one tenant.

---

## Category 1 — Practitioners

### P1. Enterprise Employee

- **Who:** A professional working at a company that has licensed YouSourceful for its employees (including Mokshly Inc. itself).
- **Tenant:** Their employer's Enterprise Tenant.

### P2. Mokshly Access Member

- **Who:** An individual whose membership is funded through a grant from a foundation, corporate CSR program, or government initiative. Often community leaders, nonprofit workers, students, or those experiencing financial hardship.
- **Tenant:** Mokshly Access (the scholarship-funded tenant).

### P3. Mokshly Commons Member

- **Who:** An individual signing up directly on mokshly.com, with no enterprise affiliation.
- **Tenant:** The Mokshly Commons (virtual tenant).

### P4. Cohort Host (Rotating Role)

- **Who:** A practitioner whose turn it is to facilitate the week's cohort Connect. Every cohort member hosts approximately once every 5 weeks.
- **Responsibility:** Open and close the session, keep time, follow the structured agenda.

---

## Category 2 — Enterprise Users

### E1. HR Admin

Aggregate analytics access (n≥10). **No individual data.**

### E2. Enterprise Admin (IT)

SSO, provisioning, security, compliance.

---

## Category 3 — Mokshly Access Users

### MA1. Scholarship Recipient

- **Who:** An individual whose Mokshly membership is funded by a grant from a foundation, corporate CSR, or government program. **Same experience as a paying Commons member.**
- **Tenant:** Mokshly Access (separate from Commons for billing tracking; identical product experience).

### MA2. Grant Donor Admin

- **Who:** Administrator at a foundation, corporate CSR program, or government grant office that funds Mokshly Access scholarships.
- **Responsibilities:** View impact reports for the funded memberships, audit grant utilization, communicate with Mokshly partnerships team.

---

## Category 4 — Service-Provider Partners

### PA1. Partner Admin

- **Who:** Administrator at a service-provider partner organization — insurance, therapy, Ayurveda, coaching.

### PA2. Partner User

- **Who:** Licensed practitioners serving referred users.

---

## Category 5 — Mokshly Internal Team

### M1. Mokshly Admin

- **Who:** Mokshly platform administrator. Oversees tenant management, partner onboarding, billing reconciliation.

### M2. Content Curator

- **Who:** Mokshly content team member who publishes and updates content, including the AI Guide message library and Mokshly Weekly newsletter.

### M3. Cohort Guide

- **Who:** Trained Mokshly staff available on-call for cohort-level conflicts or escalations.

### M4. Crisis Team Responder

- **Who:** Trained Mokshly staff (1–2 for MVP) who handle escalations from the AI Guide system when a user's conversation indicates crisis (self-harm signals, severe distress, urgent mental health concern).
- **Responsibilities:** 24-hour response SLA on escalations. Trained in crisis response and resource referral. Maintain relationships with crisis lines and mental health partners. **Can permanently take over a user's care conversation if needed.**

---

## Category 6 — System Personas (Not Human)

### AI Guide

- **What:** A rule-based AI companion assigned to each user. Each AI Guide has a name (e.g., Anjali, Marcus, Priya, David) and consistent voice, but is fundamentally a software system, not a person.
- **How users see it:** Transparent disclosure — "Your AI Guide, Anjali." Users know they're interacting with AI.
- **What it does:** Sends curated check-in messages at meaningful moments (Day 7, after absences, phase transitions, anniversaries). Personalized via variable substitution from a content-team-curated message library. **No LLM costs in MVP** — logic and message library are app-level.

See [AI Guide pillar](../02-pillars/ai-guide.md) for the full specification.

---

## Related Reading

- [Tenant Architecture](tenant-architecture.md) — how personas map to tenants.
- [User Flows](user-flows.md) — onboarding flows specific to each practitioner type.
- [AI Guide](../02-pillars/ai-guide.md) — the full system-persona specification.
