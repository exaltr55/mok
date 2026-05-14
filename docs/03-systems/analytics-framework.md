# Tracking and Analytics Framework

> Source: §3.3 of the Mokshly YouSourceful Platform Design Document.

---

## Three Tiers of Data

### Tier 1 — Sacred (Never Shared)

- Journal entries (Writing).
- Reflections (Aligning).
- MCI.
- Cohort conversation content (**never stored**, only attendance).
- Practice-specific completions mapped to individual identity.

**Access:** Only the user. Encrypted at rest.

### Tier 2 — Operational (Mokshly Internal)

- Session logs, authentication events, error logs.

**Access:** Mokshly SRE and support with audit logging.
**Retention:** 90-day retention; then anonymized.

### Tier 3 — Aggregate (Shareable with Consent)

- Tenant-level aggregates (**n≥10 enforced**).
- Insurance partner aggregates (**n≥50 enforced**).
- Platform-wide trends for product improvement.

---

## Metrics Taxonomy

### User-Facing Metrics

- MCI and its components.
- Practice completion for the day (today, not a streak).
- Weekly practice count.
- Cohort attendance for the current cycle.

### Aggregate Metrics (Tenants, Insurance, Mokshly)

- Enrollment rate, activation rate, retention curves.
- Practice engagement by type (aggregate only).
- Cohort attendance rates.
- Escalation events (anonymized counts).

---

## Privacy Engineering

- **k-anonymity enforced** — aggregate views require k≥10 (tenant), k≥50 (insurance).
- **Differential privacy** on aggregate exports — ε=1.0 or stricter.
- **Purpose limitation** — data collected for one purpose cannot be repurposed without new consent.
- **Minimization** — no behavioral analytics beyond what the product requires.

---

## Related Reading

- [Consent & Privacy](../02-pillars/consent-and-privacy.md) — the four-tier consent that gates Tier 3 sharing.
- [HR Admin Portal](../02-pillars/hr-admin.md) — only consumes Tier 3 aggregates.
- [MCI](mci.md) — Tier 1 by definition; never appears in any aggregate.
