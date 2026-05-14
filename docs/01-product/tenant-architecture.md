# Tenant Architecture

> Source: §1.5 of the Mokshly YouSourceful Platform Design Document.

Every user in Mokshly belongs to at least one tenant. The tenant is the organizational container that provides context, branding, and aggregate visibility (with consent). **A tenant never supervises a user's practice.**

---

## Three Tenant Types in MVP

| Tenant Type | Examples | How Users Arrive | Who Pays |
|-------------|----------|------------------|----------|
| **Enterprise** | Acme Corp, TechCo, Mokshly Inc. | Company invitation, SSO | The company (per-employee annual) |
| **Mokshly Commons** | Virtual tenant for individuals | Direct signup on mokshly.com | The individual ($100/year annual) |
| **Mokshly Access** | Scholarship-funded individuals | Application + grant funding | Grant donors (foundations, CSR, government) |

**Member-Partner Tenants** (Marriott Bonvoy, AARP, Costco, and similar member-based organizations) are deferred to **v1.1**. The MVP focuses on Enterprise contracts, individual Commons subscriptions, and the grant-funded Mokshly Access program. Member-Partner integration will be added when MVP demonstrates the model is working.

---

## Memberships Model — User-Centric Architecture

**The user is the root entity in Mokshly's data model. Tenants are affiliations attached to the user. The user is never owned by a tenant.**

### Rules of the Memberships Model

1. Every user has a stable Mokshly identity across all memberships.
2. A user has one or more Memberships — each representing an affiliation with a tenant.
3. One membership is designated **Primary**. The Primary membership determines billing and default branding. **It does not determine data ownership.**
4. The MCI, journal entries, reflections, and all practice data belong to the user — **not to any tenant**.
5. Aggregate signals can be contributed to each tenant the user belongs to (with independent consent per tenant).
6. Cohorts are formed across tenants. A cohort can mix Enterprise employees, Mokshly Commons individuals, and Mokshly Access scholarship recipients.

---

## Auto-Migration Behavior

When a Mokshly Commons member's employer later signs up as an Enterprise Tenant, the user is auto-migrated to that tenant's primary membership, with clear notification:

> "Acme Corp is now a Mokshly customer. Your Mokshly practice is now sponsored by Acme Corp. Your practice, your cohort, and your MCI continue unchanged. Your personal subscription is cancelled with a pro-rated refund."

---

## Related Reading

- [Personas](personas.md) — the user types that occupy each tenant.
- [Practitioner Journey](practitioner-journey.md) — the same journey applies across all tenants.
- [Tenants, Billing & Partners](../04-business/tenants-billing-and-partners.md) — billing implications per tenant model.
