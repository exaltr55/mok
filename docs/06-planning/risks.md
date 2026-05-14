# 6.2 Risk Register

> Source: §6.2 of the Mokshly YouSourceful Platform Design Document.

---

## Product Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Users interpret Mokshly as a "do all 7" checklist despite our design | Medium | High | Explicit "doorway not destination" framing in onboarding, Today screen language, and cohort prompts. Measure and correct if users show completion-anxiety signals. |
| Cohort matching produces unhealthy cohorts | Medium | High | Conservative matching. Bi-weekly formation tuning. Close monitoring in first 6 months. |
| 15-minute weekly Connect feels too short | Medium | Medium | Supplement with daily 3-min view. Measure felt-belonging quarterly. |
| Users over-use despite guardrails | Low | Medium | Hard API-level ceilings. Educational moments near limits. |
| Users under-use, drift away, never return | High | High | Return Ritual, cohort accountability, gentle nudges. Target ≥25% 30-day return. |
| HR views feel too limited to justify price | Medium | High | Strong narrative about privacy-first differentiation. Executive reports with qualitative benefits. |
| MCI misunderstood (too abstract) | Medium | Medium | Thorough onboarding education. Pre-launch user research validation. |
| AI Guide messages feel impersonal or off-tone | Medium | High | Content team curates message library carefully. Multiple variants per moment. User feedback loop. Tone audit before launch. |
| AI Guide misses a crisis signal | Low | **Critical** | Conservative keyword matching errs on side of escalation. Human Crisis Team reviews flagged conversations daily. Continuous improvement of detection rules. |
| Donor reporting insufficient to win renewals | Medium | High | Five-tier reporting framework, real-time dashboards, third-party audit support. Anchor donor relationship gives early feedback. |
| 30-day trial conversion rate too low | Medium | High | 60-day Early Practitioner offer at launch. Strong AI Guide engagement during trial. Cohort placement deferred until paid (creates anticipation). |

---

## Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Live Audio provider unreliable at scale | Medium | High | Evaluate 2 providers in beta. 99.9% SLA contract. Async fallback. |
| Breach of Tier 1 sacred data | Low | **Critical** | Defense in depth. Quarterly reviews. Pentest. Bug bounty. |
| SSO integration blocks enterprise onboarding | Medium | Medium | Dedicated integration team. Reference integrations for top 5 IdPs. |
| Aggregate leak reveals individual identity | Low | **Critical** | k-anonymity in code. Differential privacy. Annual audits. |
| Scalability issues during rapid enterprise growth | Medium | Medium | Load testing pre-launch. Horizontal scaling. |
| Stripe integration edge cases (failed payments, dunning, tax) | Medium | Medium | Comprehensive Stripe webhook test suite. Manual reconciliation tooling for ops team. |
| Trial-to-paid state machine bugs | Medium | High | Extensive testing of day-by-day state transitions. Beta launch with internal team first. |
| AI Guide rule engine bugs cause inappropriate messages | Medium | High | Comprehensive test coverage of trigger conditions. Content team review of all message library updates. Phased rollout. |

---

## Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Competitors copy product model | High | Medium | Differentiation is values-driven design and content depth, not features. Focus on quality. |
| Enterprise sales cycles longer than expected | High | High | Parallel Commons subscriptions provide revenue during enterprise cycles. |
| Insurance partnerships slow to finalize | High | Medium | Platform valuable without them. One anchor insurance partner sufficient. |
| Regulatory changes impact health data handling | Medium | Medium | Privacy-first architecture insulates. Legal on retainer. |
| Donor funding for Mokshly Access doesn't materialize | Medium | Medium | Mokshly itself can fund initial cohort of scholarships from Commons revenue. Builds proof-of-impact for institutional grants. |
