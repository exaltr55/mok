# Part 4 — Tenant, Billing, and Partner Integration

> Source: Part 4 of the Mokshly YouSourceful Platform Design Document v1.7.

| Doc | Section | What it covers |
|-----|---------|----------------|
| [Tenant Deployment Models](tenant-deployment-models.md) | §4.1 | Enterprise, Commons, and Mokshly Access — onboarding and billing flows for each. |
| [Mokshly Access Program & Donor Portal](mokshly-access-and-donors.md) | §4.4 + §4.5 | Scholarship program operations and five-tier donor reporting framework. |
| [Billing & Payment Architecture](billing-architecture.md) | §4.6 | Stripe Billing / Stripe Invoicing setup, trial mechanics, grant ledger. |
| [Partner Ecosystem & Insurance](partner-ecosystem-and-insurance.md) | §4.7 + §4.8 | Service-provider partner categories and insurance aggregate integration. |
| [Privacy & Consent Framework](privacy-consent-framework.md) | §4.9 | Four-tier consent architecture and regulatory compliance (GDPR, CCPA, HIPAA). |

> §4.2 HR Admin Experience and §4.3 Enterprise IT Console are covered by the pillar docs at [02-pillars/hr-admin.md](../02-pillars/hr-admin.md) and [02-pillars/enterprise-admin.md](../02-pillars/enterprise-admin.md). Both pillar files now include the Part 4 expansions inline.

## Cross-references

- **Tenants** appear conceptually in [01-product/tenant-architecture.md](../01-product/tenant-architecture.md). Part 4 turns that concept into concrete deployment, sales, and billing flows.
- **Aggregate analytics** ride on top of [03-systems/analytics-framework.md](../03-systems/analytics-framework.md). Part 4 specifies the k-anonymity thresholds per audience (k≥10 tenants, k≥20 donors, k≥50 insurance).
- **Consent** UX surfaces are in [02-pillars/consent-and-privacy.md](../02-pillars/consent-and-privacy.md); the underlying framework with regulatory compliance is here at §4.9.
