# Consent & Privacy Controls

> Source: §2.3.9 of the Mokshly YouSourceful Platform Design Document.

---

## Four-Tier Consent (Tier 4 is now MVP)

- **Tier 1 — Platform data.** Required for account operation.
- **Tier 2 — Tenant aggregate sharing.** User's activity included in tenant aggregate reports. **Optional. Revocable.**
- **Tier 3 — Insurance aggregate sharing.** Activity included in insurance partner aggregates at policy-group level. **Optional.**
- **Tier 4 — AI Guide.** **Required** for AI Guide functionality. User can decline; they retain practice access without proactive check-ins.

---

## Consent UX Principles

- Consent is **never bundled** — each Tier is a separate yes/no.
- Consent language is **plain** — no legalese.
- **Revocation is as easy as granting.**
- Consent status always visible on Settings.

---

## Related Reading

- [AI Guide](ai-guide.md) — Tier 4 governs proactive check-ins.
- [Analytics Framework](../03-systems/analytics-framework.md) — how each tier maps to data flows.
- [My Mokshly · Memberships View](my-mokshly.md#memberships-view) — where users see and revoke consent.
- [User Flows · Flow 1 step 9](../01-product/user-flows.md#flow-1--onboarding-universal-structure) — consent collection during onboarding.
