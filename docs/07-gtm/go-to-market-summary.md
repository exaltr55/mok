# Part 7 — Go-to-Market Summary

> Source: Part 7 of the Mokshly YouSourceful Platform Design Document v1.7.

Mokshly elevates how knowledge workers work, think, and live — so they thrive alongside the AI tools, not despite them.

Mokshly offers a system built on the 5S Framework and the 7 Practices that develops foundational human capacities. It is not a quick fix. **It is a methodology that produces lasting human change — the kind no app or content library can match.**

---

## 7.1 Purpose of This Section

This section gives the engineering and product teams visibility into who Mokshly is being built for and how it will be sold in Year 1. The complete GTM strategy is documented separately in *Mokshly Go-to-Market Strategy v1.0*; this section is a summary.

Understanding the Year 1 customer profile shapes engineering priorities: which integrations matter (SSO providers our buyers actually use), which compliance certifications matter most (**SOC 2 Type 1 at launch is non-negotiable**), and which features will be most demanded in early sales conversations (HR Admin aggregate analytics, privacy guardrails, the AI Guide).

---

## 7.2 The Year 1 Beachhead

### Target Segment

Mokshly's first 12 months focus on a single, sharply defined customer segment:

> **Mid-to-large US tech companies (1,000–5,000 employees) experiencing AI-driven workforce transition, where the CHRO and CFO are actively concerned about retention of high-value knowledge workers.**

### Why This Segment

- **Sales velocity:** 90–120 month decision cycles, fastest-moving enterprise segment.
- **Buyer pain is acute and named** — retention of knowledge workers through AI transition is a stated priority.
- **Reference networks are dense** — tech HR is one of the most networked communities in business.
- Mokshly's positioning as Human Elevation for the AI Era aligns directly with their public commitments.
- Deal sizes ($25K–$80K Year 1) match the right pricing for fast decisions.

### Buyer Profile (Dual Buyer Model)

- **Co-buyer 1 (Strategic):** Chief People Officer / VP People — owns retention strategy and employee experience.
- **Co-buyer 2 (Economic):** Chief Financial Officer — evaluates retention economics and ROI.
- **Champion:** Head of Total Rewards, Director of Wellness, or Chief of Staff to People function.
- **Influencers:** CTO/CPO when AI transformation is the trigger event.

---

## 7.3 The Year 1 Revenue Plan

### Customer and Revenue Targets

| Tier | Count | Avg Year 1 ACV | Subtotal |
|------|-------|----------------|----------|
| **Anchor accounts** | 5 | $80K | $400K |
| **Mid-market** | 10 | $40K | $400K |
| **Volume entry** | 8 | $25K | $200K |
| **Total Year 1** | **23** | Avg $43K | **$1M ARR** |

### Pricing

- **List price:** $200 per employee per year (premium positioning).
- **Volume bands:** 10% off for 501–1,500 employees, 20% off for 1,501–3,000.
- **Founding Customer discount:** 50% off Year 1, 25% off Year 2, full price Year 3+ — in exchange for reference partnership (logo, case study, testimonial, quarterly product feedback).
- **Multi-year incentive:** 24-month and 36-month contracts lock in extended discount pricing.

---

## 7.4 What This Means for Engineering

### Required for Year 1 Sales

These features and capabilities are **non-negotiable** to support Year 1 sales conversations:

- **SSO integrations** (SAML 2.0, OIDC) for top tech IdPs: Okta, Azure AD, Google Workspace.
- **SCIM 2.0** provisioning for automated user lifecycle.
- **SOC 2 Type 1** audit complete pre-launch (Type 2 follows Month 12).
- **HR Admin aggregate analytics dashboard with n≥10 enforcement** — the central artifact CHROs evaluate.
- **Permanent privacy banners** on HR Admin views — the proof point that builds CHRO trust.
- Branded customer onboarding emails (enterprise logo only).
- Enterprise IT console (audit logs, session policies, compliance documentation download).
- Standard enterprise security: SSO, MFA, encrypted at rest and in transit, audit logging.

### Sales Materials Engineering Should Support

- **Live product demo environment** for sales (separate from production with demo data).
- **Pilot deployment capability** — stand up a 50–100 employee pilot in days, not weeks.
- Reference customer case study landing pages.
- Security questionnaire response library (SIG, CAIQ, custom enterprise questionnaires).

### What CHROs Will Ask About in Discovery

Engineering should be ready for these recurring questions in early sales conversations:

- *"How exactly do you protect employee privacy from us as the employer?"* (Answer: Privacy guardrails section, n≥10 thresholds, MCI sacred status)
- *"Show me what I'll see as HR Admin."* (Answer: HR Admin portal with permanent privacy banner)
- *"What happens when an employee in crisis uses your AI Guide?"* (Answer: Crisis Team escalation, hard escalation triggers, human takeover)
- *"How do you measure if this is working?"* (Answer: Aggregate engagement metrics, cohort health, the WPP North Star)
- *"What's your security and compliance posture?"* (Answer: SOC 2, GDPR, CCPA, encryption, SSO, audit logs)
- *"Can we pilot this before signing a full contract?"* (Answer: Yes — 60–90 day pilot with 50–100 employees for anchor accounts)

---

## 7.5 Year 2 and Beyond

### Year 2 Adjacent Segment

Year 2 expands beyond the beachhead while continuing to dominate it. The first adjacent segment is **mid-sized professional services firms** (consulting, law, accounting, mid-tier investment banks) — selected because of similar buyer titles, comparable budgets, and partner influence networks. **Year 2 ARR target: $5–$7M combined.**

### Year 3 Healthcare and Member-Partner

Year 3 enters **healthcare systems** (mid-sized hospital systems and large multi-specialty practices) and the **first Member-Partner deals** (Marriott Bonvoy or AARP-style organizations). These segments require Member-Partner tenant infrastructure (v1.1 platform feature). **Year 3 ARR target: $10–$15M combined.**

### What This Means for Product Roadmap

- **v1.1 Member-Partner tenant infrastructure** becomes a Year 2/3 revenue enabler — prioritize accordingly.
- **HIPAA full compliance** becomes important when healthcare segment opens (Year 3) — plan investment in Year 2.
- **Multi-language support** (Spanish, then Hindi) becomes important for Year 2 international preparation.
- **Native mobile apps** (v1.1) reduce friction for healthcare segment adoption.

---

## 7.6 Reference to Full GTM Strategy

The complete Go-to-Market Strategy is documented in *Mokshly Go-to-Market Strategy v1.0* and covers in detail:

- Strategic foundation and ICP definition.
- Pricing strategy with full Founding Customer Program structure.
- 12-month sales motion with month-by-month plan.
- Marketing strategy and channel approach.
- Customer success methodology.
- Reference and Founding Customer system.
- Year 2 and Year 3 expansion roadmap.
- Hiring plan across sales, marketing, and customer success.
- Quarterly milestones and metrics.
- Risk register and mitigation.
- Year 1 GTM budget.

Engineering and product leadership should review the full GTM Strategy quarterly to align roadmap with sales and customer success needs.
