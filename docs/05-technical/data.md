# 5.4 Data Architecture

> Source: §5.4 of the Mokshly YouSourceful Platform Design Document.

---

## Database Technology

- **Primary OLTP:** PostgreSQL 16+ (AWS RDS).
- **Analytics Warehouse:** BigQuery or Snowflake.
- **Caching:** Redis (managed).
- **Search:** PostgreSQL full-text for MVP.
- **Object Storage:** S3 for audio/video, journal exports.
- **Audit Store:** S3 with Object Lock.

---

## Core Data Model Shape

Key entities and relationships:

- `user` (root entity; **stable identity**)
- `tenant` (Enterprise, Mokshly Commons, or Mokshly Access)
- `membership` (user ↔ tenant association; one designated **primary**)
- `practice_session` (user-scoped; belongs to user, **not tenant**)
- `mci_snapshot` (user-scoped; **Tier 1 sacred**)
- `journal_entry` (user-scoped; Tier 1 sacred)
- `cohort` (tenant-agnostic; cross-tenant members allowed)
- `cohort_membership` (user ↔ cohort)
- `consent` (user ↔ tenant ↔ tier, with state and timestamps)

---

## Data Classification and Isolation

| Classification | Example Data | Access Pattern |
|----------------|--------------|----------------|
| **Sacred (Tier 1)** | Journal, MCI, cohort content, reflections | User-only; encrypted with user-scoped keys |
| **Operational (Tier 2)** | Session logs, auth events, error logs | Mokshly SRE with audit; 90-day retention |
| **Aggregate (Tier 3)** | Aggregates for tenants/insurance | k-anonymity enforced (k≥10 tenant, k≥50 insurance) |
| **Content** | 5S, 7 Practices, prompts, nudges | Public with auth; CDN-served |

---

## Encryption

- **At rest** — AES-256 via managed keys (AWS KMS).
- **In transit** — TLS 1.3 minimum.
- **Tier 1** — additional application-level encryption, **user-scoped keys**.
- **Key rotation** — annual, zero-downtime.

---

## Multi-Tenancy Strategy

- Logical multi-tenancy via `tenant_id` on tenant-scoped tables.
- **But:** user data is user-scoped, not tenant-scoped (MCI, journal, sessions).
- Row-level security policies in PostgreSQL.
- Dedicated schemas per enterprise tenant available for data residency compliance.

---

## Related Reading

- [Tenant Architecture (§1.5)](../01-product/tenant-architecture.md) — the principle that drives `user`-rooted data.
- [Analytics Framework (§3.3)](../03-systems/analytics-framework.md) — the three-tier classification.
- [Privacy & Consent Framework (§4.9)](../04-business/privacy-consent-framework.md) — how Tier 1 / 2 / 3 map to consents.
