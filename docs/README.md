# Mokshly · YouSourceful Platform — Design Documentation

> **Source:** Mokshly YouSourceful Platform — Product & Technical Design Document, v1.7 (MVP, 3–4 month build).
> **Status:** Canonical design canon. Every product decision should be traceable back to a section in this folder.

The docs are ordered from concept → product → pillars → systems → business → technical → planning → go-to-market. The two foundational truths in [philosophy](00-overview/philosophy.md) and the seven design principles in [design-principles](00-overview/design-principles.md) govern every decision in this folder.

## 00 — Overview

| Doc | What it covers |
|-----|----------------|
| [Executive Summary](00-overview/executive-summary.md) | Mission, problem, how Mokshly addresses it, what makes Mokshly different. |
| [Philosophy](00-overview/philosophy.md) | The two foundational truths — practice as doorway, player keeps own score. |
| [Design Principles](00-overview/design-principles.md) | The seven principles every feature is evaluated against. |
| [MVP Scope & Rollout](00-overview/mvp-scope.md) | What's in/out of MVP; the four rollout phases. |

## 01 — Product

| Doc | What it covers |
|-----|----------------|
| [Personas](01-product/personas.md) | All user categories: practitioners, enterprise, access, partners, internal, system. |
| [Tenant Architecture](01-product/tenant-architecture.md) | Three tenant types, memberships model, auto-migration. |
| [Practitioner Journey](01-product/practitioner-journey.md) | The four phases (Arriving, Steadying, Integrating, Living). |
| [Information Architecture](01-product/information-architecture.md) | Navigation for practitioners, HR, donors, enterprise IT. |
| [User Flows](01-product/user-flows.md) | The eight core flows (onboarding, daily practice, cohort, return, etc.). |

## 02 — Pillars (Feature Specifications)

| Doc | What it covers |
|-----|----------------|
| [Mokshly Learn](02-pillars/learn.md) | 5S Framework structured content. |
| [Mokshly Do](02-pillars/do.md) | The 7 Practices — delivery, self-logging, guardrails, anti-patterns. |
| [My Mokshly](02-pillars/my-mokshly.md) | Personal dashboard: journal, reflections, MCI, history, settings. |
| [Mokshly Connect](02-pillars/connect.md) | Cohort system, weekly Connect, daily view, rules. |
| [HR Admin Portal](02-pillars/hr-admin.md) | Aggregate analytics for enterprise HR (n≥10). |
| [Mokshly AI Guide](02-pillars/ai-guide.md) | Rule-based AI companion, crisis escalation, data boundaries. |
| [Mokshly Weekly Newsletter](02-pillars/weekly-newsletter.md) | 5-section format, Friday delivery, opt-out after week 4. |
| [Enterprise Admin Console](02-pillars/enterprise-admin.md) | SSO, SCIM, audit, compliance. |
| [Consent & Privacy](02-pillars/consent-and-privacy.md) | Four-tier consent (Tier 4 = AI Guide, MVP). |

## 03 — Systems

| Doc | What it covers |
|-----|----------------|
| [Mokshly Consistency Index (MCI)](03-systems/mci.md) | Full MCI spec, formula, milestones, reset rules. |
| [Nudging Engine](03-systems/nudging-engine.md) | Nudge categories, per-phase frequency caps, anti-nudges. |
| [Analytics Framework](03-systems/analytics-framework.md) | Three data tiers (Sacred, Operational, Aggregate), k-anonymity. |
| [Content Delivery](03-systems/content-delivery.md) | CMS, versioning, infrastructure, localization readiness. |

## 04 — Business

| Doc | What it covers |
|-----|----------------|
| [Tenant Deployment Models](04-business/tenant-deployment-models.md) | Enterprise / Commons / Access flows (§4.1). |
| [Mokshly Access & Donors](04-business/mokshly-access-and-donors.md) | Scholarship program + five-tier donor reporting (§4.4 + §4.5). |
| [Billing Architecture](04-business/billing-architecture.md) | Stripe Billing/Invoicing/Tax, grant ledger (§4.6). |
| [Partner Ecosystem & Insurance](04-business/partner-ecosystem-and-insurance.md) | Partner categories + insurance aggregate integration (§4.7 + §4.8). |
| [Privacy & Consent Framework](04-business/privacy-consent-framework.md) | Four-tier consent + regulatory compliance (§4.9). |

## 05 — Technical

| Doc | What it covers |
|-----|----------------|
| [Architecture Overview](05-technical/overview.md) | Layers, components, third-party stack (§5.1). |
| [Frontend Architecture](05-technical/frontend.md) | Next.js stack, design system, app structure (§5.2). |
| [Backend Architecture](05-technical/backend.md) | Service decomposition for all 12 application services (§5.3). |
| [Data Architecture](05-technical/data.md) | Postgres, warehouse, classification tiers, encryption (§5.4). |
| [AI Layer](05-technical/ai-layer.md) | Rule-based MVP, v1.1 LLM augmentation, AI safety (§5.5). |
| [Cohort Audio](05-technical/cohort-audio.md) | Live Audio rooms, async mode, no-retention rules (§5.6). |
| [Ops · Security · Compliance](05-technical/ops-security-compliance.md) | Observability, security architecture, compliance roadmap (§5.7+§5.8+§5.9). |
| [Accessibility & Scale](05-technical/accessibility-and-scale.md) | WCAG 2.1 AA, Year-1 load, scaling strategy (§5.10+§5.11). |

## 06 — Planning

| Doc | What it covers |
|-----|----------------|
| [Success Metrics](06-planning/success-metrics.md) | WPP north star + supporting metrics + anti-metrics (§6.1). |
| [Risk Register](06-planning/risks.md) | Product / technical / business risks with mitigations (§6.2). |
| [Dependencies & Open Decisions](06-planning/dependencies-and-decisions.md) | Critical dependencies, locked decisions, open questions (§6.3 + §6.8). |
| [Sprint Roadmap](06-planning/sprint-roadmap.md) | 16-week MVP sprint plan (§6.4). |
| [Beta & Launch Readiness](06-planning/beta-and-launch.md) | Beta structure, exit criteria, launch checklist (§6.5 + §6.6). |
| [Post-Launch Evolution](06-planning/post-launch-and-closing.md) | Months 1–12 roadmap + closing statement (§6.7 + §6.9). |

## 07 — Go-to-Market

| Doc | What it covers |
|-----|----------------|
| [GTM Summary](07-gtm/go-to-market-summary.md) | Year-1 beachhead, revenue plan, engineering implications, Year 2/3 roadmap. |

## Content (canonical text rendered in-app)

| Folder | What's there |
|--------|--------------|
| [content/learn/](../content/learn/) | The 5S Framework — 7 markdown modules. |
| [content/do/](../content/do/) | The 7 Practices — 8 markdown modules (intro + 7 practices, Part A and Part B each). |

## How to use these docs

1. **Before building a feature**, read the relevant pillar doc and any systems it depends on. The MCI underlies almost every pillar; the privacy tiers and design principles override everything else.
2. **When writing a feature plan** under `docs/<category>/<feature-name>.md` (per [CLAUDE.md](../CLAUDE.md)), link back to the design sections it implements.
3. **If you find a conflict** between an implementation and the design docs, the design docs win — file an issue rather than silently diverging.

## Cross-cutting themes

These themes recur across many docs — when you see them, treat them as load-bearing:

- **Consistency over completion** — never "X of 7 today," never streaks shared with peers, depth as valuable as breadth.
- **Anti-engagement design** — every feature has a ceiling, return is welcomed without catch-up pressure.
- **The MCI is sacred** — never shared with anyone but the user, ever.
- **k-anonymity for aggregates** — k≥10 for tenants, k≥20 for donors, k≥50 for insurance partners.
- **Rule-based, not LLM-based, in MVP** — the AI Guide and nudges are deterministic; LLM augmentation is v1.1+.
- **Phase-aware presentation** — same data, different framing across the four practitioner phases.
- **Privacy as a product feature** — the MCI's sanctity and HR's aggregate-only view are sales-critical, not nice-to-haves.
