# Part 5 — Technical Foundation

> Source: Part 5 of the Mokshly YouSourceful Platform Design Document v1.7.

| Doc | Section | What it covers |
|-----|---------|----------------|
| [Architecture Overview](overview.md) | §5.1 | High-level layers, components, third parties. |
| [Frontend Architecture](frontend.md) | §5.2 | Next.js stack, design system, app structure. |
| [Backend Architecture](backend.md) | §5.3 | Service decomposition (Identity, Practice, Cohort, AI Guide, Billing, etc.). |
| [Data Architecture](data.md) | §5.4 | Postgres / warehouse / classification tiers / encryption. |
| [AI Layer](ai-layer.md) | §5.5 | Rule-based MVP, v1.1 LLM augmentation, AI safety. |
| [Cohort Audio](cohort-audio.md) | §5.6 | Live Audio rooms, async mode, content retention rules. |
| [Operations · Security · Compliance](ops-security-compliance.md) | §5.7 + §5.8 + §5.9 | Observability, security architecture, compliance roadmap. |
| [Accessibility & Scalability](accessibility-and-scale.md) | §5.10 + §5.11 | WCAG 2.1 AA, Year-1 load expectations, scaling strategy. |

## Note on stack divergence

The design doc specifies **Next.js + Node/TypeScript** for the v1 production stack. The current `mok` scaffold uses **Python (FastAPI) + React** (matching loom and the user's stated tech preference). Both stacks satisfy the architectural principles in §5.1; the v0 build below will continue with FastAPI + React. When the team is ready to converge on the design-doc stack, the principles, service boundaries, and data model translate without significant rework.
