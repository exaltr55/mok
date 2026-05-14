# 4.7 Service-Provider Partner Ecosystem & 4.8 Insurance Integration

> Source: §4.7 and §4.8 of the Mokshly YouSourceful Platform Design Document.

---

## 4.7 Service-Provider Partner Ecosystem

Service-provider partners extend Mokshly's offering — insurance, healthcare services, traditional medicine, coaching. Each has a defined integration model.

### Partner Categories

| Category | Example Partners | MVP Integration Depth |
|----------|------------------|----------------------|
| **Insurance** | Health insurers, wellness benefits providers | Full — aggregate data from day one |
| **Healthcare Services** | Therapy platforms, counseling networks | Light — referral only in MVP |
| **Traditional Medicine** | Ayurveda networks, practitioners | Light — referral only in MVP |
| **Coaching** | Executive and life coaches | Light — referral only in MVP |
| **Content** | Authors, teachers, publishers | Deferred to v2 (Mokshly Shop) |
| **Commerce** | Books, wellness products, journals | Deferred to v2 (Mokshly Shop) |

### Partner Admin Experience

- Partner profile management.
- Service catalog management.
- Aggregate data access (insurance only, MVP).
- Billing and reconciliation.
- Partner user management.

### Partner User Experience (Service Delivery)

- Manage availability calendar.
- Accept/decline appointments from referred users.
- **Limited user context** (only what user explicitly shares).
- **Session notes in partner's own system, not Mokshly.**

### Referral Flow (MVP)

1. Mokshly surfaces relevant partner options with disclosure.
2. User clicks through to partner system.
3. User authenticates separately with partner.
4. **Only data shared is what user explicitly provides in session.**

---

## 4.8 Insurance Integration Architecture

### Integration Model

1. Users opt into Insurance aggregate sharing during onboarding (**Tier 3 consent**).
2. Users mapped to policy groups via tenant enrollment data.
3. Mokshly computes aggregate signals at policy-group level (**n≥50 enforced**).
4. Aggregate signals pushed to insurance partner via secure API or SFTP.
5. **Individual-level data never transmitted.**

### Aggregate Signals Exposed to Insurance

- Percentage of enrolled members actively practicing in last 30 days.
- Aggregate cohort engagement rate.
- Aggregate practice diversity (count, not identification).
- Trend direction indicators.

### Data Contract with Insurance Partners

- **Written DPA.**
- **No re-identification** of users from aggregates.
- **Cannot be used to deny coverage or adjust individual premiums** without additional user consent.
- **Annual "Insurance Transparency Report"** published by Mokshly.

---

## Related Reading

- [Consent & Privacy](../02-pillars/consent-and-privacy.md) and [Privacy & Consent Framework](privacy-consent-framework.md) — Tier 3 consent governs insurance sharing.
- [Analytics Framework](../03-systems/analytics-framework.md) — k≥50 anonymity rules.
- [Personas · Partner Admin / Partner User](../01-product/personas.md#category-4--service-provider-partners).
