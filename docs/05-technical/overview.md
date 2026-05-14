# 5.1 Architecture Overview

> Source: §5.1 of the Mokshly YouSourceful Platform Design Document.

Mokshly is built as a **modern, cloud-native, multi-tenant SaaS platform.** The architecture prioritizes security, privacy, reliability, and iteration speed.

---

## Architecture Principles

1. **Cloud-native, managed services first.**
2. **API-first** — every internal capability accessible via clean APIs.
3. **Privacy-by-design** — data classification drives storage, access, encryption.
4. **Separation of concerns** — user-facing, admin, analytics, AI deployed independently.
5. **Observable** — logging, metrics, tracing from day one.
6. **Secure by default** — least privilege, encrypted, auditable.
7. **User-centric data model** — user is root entity; tenants are affiliations.

---

## High-Level Component View

| Layer | Components |
|-------|------------|
| **Client** | Practitioner Web App, HR Admin Portal, Donor Portal, Enterprise IT Console, Partner Portal, Mokshly Admin Console |
| **API Gateway** | Auth, rate limiting, routing, versioning |
| **Application Services** | Identity, Membership, Practice, Cohort, Content, Analytics, Consent, Notification, Partner, AI Guide, Crisis Escalation, Newsletter, Billing, Mokshly Access, Donor Reporting |
| **Data Layer** | User DB (PostgreSQL), Analytics Warehouse (BigQuery/Snowflake), CMS, Audit Log Store, Object Storage, Grant Ledger |
| **Infrastructure** | AWS (primary), Kubernetes (EKS), CDN, managed Postgres (RDS), managed Redis, SQS/SNS |
| **AI Layer** | Rule-based AI Guide engine in MVP; LLM integration layer added in v1.1+ |
| **Third-Party** | SSO providers, Stripe (Billing + Invoicing + Tax), CDN, Resend/Customer.io (email), audio room provider (LiveKit/Daily), CMS |

---

## Related Reading

- [Frontend (§5.2)](frontend.md), [Backend (§5.3)](backend.md), [Data (§5.4)](data.md) — depth on each layer.
- [Privacy Framework (§4.9)](../04-business/privacy-consent-framework.md) — privacy-by-design principle in action.
- [MCI (§3.1)](../03-systems/mci.md) — the user-centric data model expressed most concretely.
