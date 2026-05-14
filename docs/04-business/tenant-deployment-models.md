# 4.1 Tenant Deployment Models

> Source: §4.1 of the Mokshly YouSourceful Platform Design Document.

Mokshly supports three distinct tenant deployment models in MVP. Each has its own onboarding, billing, and reporting approach. **All three share the same underlying platform and identical practitioner experience.**

---

## Model 1 — Enterprise Tenants

Enterprises license YouSourceful for their employees on a per-employee annual subscription. Mokshly Inc. itself is an enterprise tenant.

### Enterprise Sales-to-Activation Flow

1. **Contract signed** — per-employee annual pricing for total employee headcount, regardless of activation.
2. **Onboarding kickoff** with Mokshly Customer Success.
3. **Technical provisioning** — SSO, SCIM, domain verification.
4. **HR Admin activation** — setup email, dashboard configuration.
5. **Communication rollout** — branded invitation emails using Mokshly templates.
6. **Employee activation waves** — gradual rollout.
7. **First aggregate reports at 30 days post-activation** (once n≥10 threshold met).

---

## Model 2 — Mokshly Commons (Direct Users)

Individuals subscribe directly on mokshly.com. They become members of the Mokshly Commons virtual tenant.

### Direct Subscription Flow

1. **Marketing site → "Begin" CTA → account creation.**
2. **30-day free trial** standard (60-day **Early Practitioner** offer at launch, time-limited).
3. **No card required during trial.**
4. **Day 21** (or Day 51 for launch trial) — first confirmation prompt.
5. **Reminders at Days 25/27/29** (or 55/57/59) before trial ends.
6. **Day 30** (or Day 60) — auto-convert to $100 annual subscription if card on file. If no card, account moves to paused state.
7. Standard onboarding. Primary membership = Mokshly Commons.
8. **Cohort placement only after card capture** (display mode during trial).

---

## Model 3 — Mokshly Access (Scholarship-Funded)

Individuals receive Mokshly memberships funded by grants from foundations, corporate CSR programs, or government initiatives. **The product experience is identical to Mokshly Commons.**

### Mokshly Access Activation Flow

1. Grant donor commits funding to Mokshly Access (e.g., $10,000 for 100 scholarships).
2. Mokshly partnerships team allocates funded scholarships to eligible applicants.
3. Recipient receives invitation email with scholarship code.
4. Recipient lands on **dignified welcome page** (no "free" or "scholarship" framing in user-facing copy).
5. Account created; tagged internally as Access tenant for billing and donor reporting.
6. Standard onboarding follows.
7. Cohort placement in next formation wave (no payment trial period — scholarship covers immediately).

---

## Tenant Model — Cross-Cutting Principles

- **Data isolation:** Tenant data is logically isolated at the application layer with row-level security.
- **Cross-tenant cohorts:** Cohort matching is the primary cross-tenant operation, exposing only non-identifying criteria.
- **Identical practitioner experience:** Whether Enterprise, Commons, or Access, the practice is identical.
- **Member-Partner deferral:** Member-Partner Tenants (Marriott, AARP) are deferred to v1.1.

---

## Related Reading

- [Tenant Architecture (§1.5)](../01-product/tenant-architecture.md) — the user-centric memberships model these deployments rest on.
- [Billing Architecture](billing-architecture.md) — Stripe configuration per model.
- [Mokshly Access Program](mokshly-access-and-donors.md) — scholarship operations.
