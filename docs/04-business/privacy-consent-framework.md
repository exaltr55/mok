# 4.9 Privacy and Consent Framework

> Source: §4.9 of the Mokshly YouSourceful Platform Design Document.
>
> This file is the **complete privacy framework with regulatory context**. The pillar-level UX surface is at [02-pillars/consent-and-privacy.md](../02-pillars/consent-and-privacy.md); the two documents complement each other.

---

## Four-Tier Consent Architecture (Tier 4 in MVP)

### Tier 1 — Platform Data (Required)
- Necessary for account operation.
- **Cannot be revoked without account deletion.**

### Tier 2 — Tenant Aggregate Sharing (Optional)
- User's activity included in tenant aggregate reports (HR or Donor Portal).
- **No individual data exposed.**
- Revocable anytime.

### Tier 3 — Insurance Aggregate Sharing (Optional)
- Activity included at policy-group level.
- Explicit disclosure of how insurance uses the data.

### Tier 4 — AI Guide (Required for AI Guide functionality, MVP)
- AI Guide uses practice patterns and MCI signals to provide check-ins.
- **Granular:** user can enable AI Guide check-ins, decline conversation memory, etc.
- **Plain language:** "Your AI Guide will see your practice patterns and consistency to support you well. They will not see your journal or reflections — those remain private."
- User can decline Tier 4 entirely — no AI Guide assigned, full practice access retained.

---

## Consent UX Principles

1. **Never bundled** — each Tier is separate.
2. **Plain language** — no legalese.
3. **Revocation as easy as granting.**
4. **Always visible on Settings.**

---

## Regulatory Compliance

- **GDPR:** Controller/joint-controller responsibilities. Article 28 DPA. DPIA completed.
- **CCPA/CPRA:** Access, deletion, correction, opt-out (Mokshly does not sell data).
- **HIPAA:** Not a Covered Entity. Business Associate in certain insurance integrations. **BAA available.**
- **Cross-border:** Standard Contractual Clauses for any data transfers outside EU.

---

## Related Reading

- [02-pillars/consent-and-privacy.md](../02-pillars/consent-and-privacy.md) — practitioner-facing UX.
- [AI Guide](../02-pillars/ai-guide.md) — Tier 4 governs AI Guide.
- [Insurance Integration](partner-ecosystem-and-insurance.md#48-insurance-integration-architecture) — Tier 3 governs insurance.
- [Analytics Framework](../03-systems/analytics-framework.md) — three data tiers map to consent tiers.
- [Compliance (§5.9)](../05-technical/compliance.md) — implementation roadmap for SOC 2, GDPR, CCPA, HIPAA.
