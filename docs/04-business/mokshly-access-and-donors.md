# 4.4 Mokshly Access Program & 4.5 Donor Portal

> Source: §4.4 and §4.5 of the Mokshly YouSourceful Platform Design Document.

---

## 4.4 Mokshly Access Program

Mokshly Access is the scholarship-funded membership program that makes the practice available to people for whom the standard fee is a barrier. It is a **first-class program** with its own brand identity, application flow, and donor reporting infrastructure.

### Program Philosophy

Mokshly Access exists because **Human Sustainability cannot be a privilege**. The practice is for everyone who chooses it. Through grant funding from foundations, corporate CSR programs, and government initiatives, we provide complimentary annual memberships to those who need them — with the same dignity, the same experience, and the same cohort access as paying members.

### Eligibility

- Community leaders and nonprofit workers.
- Students (undergraduate and graduate).
- Individuals experiencing financial hardship (job loss, medical, displacement).
- People from underprivileged communities.
- **Application-based** with simple, dignity-preserving criteria.

### Funding Sources

- Wellness-focused foundations.
- Corporate CSR programs (often from Mokshly enterprise customers).
- Government grant programs.
- Private donors.
- **Mokshly's own match** — a small percentage of every paid Commons subscription funds Access scholarships.

### Program Operations

- Mokshly partnerships team manages grant relationships and allocation.
- Application portal accepts applications year-round.
- Allocation matches applicants to available grant funds.
- Recipients receive invitation with scholarship code.
- Same membership lifecycle as paying members — annual renewal, pause options, etc.

### Recipient Experience

From the recipient's perspective, **they are a Mokshly member.** There is no labeling, no "scholarship recipient" tag, no different feature set. Their cohort, their AI Guide, their MCI, their journal — all identical to any other member.

- **Dignity-first design** — no public marker of scholarship status.
- Same onboarding flow.
- Same AI Guide assignment.
- Same cohort placement.
- Same MCI.
- Renewal handled by Mokshly partnerships team — if grant funding continues, membership auto-renews; if not, recipient is offered transition path to Commons or sunset.

### MVP Operational Scope

- Launch with **1–2 anchor donor relationships**.
- Year 1 target: 50–100 scholarship recipients.
- Build the infrastructure to support 1,000+ recipients by year 2.
- Manual application review in MVP; automated matching in v1.1.

---

## 4.5 Mokshly Access Donor Portal

The Donor Portal is a dedicated surface for foundations, CSR programs, and government grant administrators to view the impact of their funded memberships. **It is the credibility infrastructure that makes grant funding sustainable.**

### Why the Donor Portal Matters

Institutional donors require accountability. They need to see that grant funds reach real people, that those people genuinely benefit, and that outcomes are measurable. The Donor Portal answers these questions credibly **while protecting individual user privacy**.

### Five-Tier Reporting Framework

#### Tier 1 — Grant Utilization Report
- Total grant amount received.
- Total scholarships funded.
- Demographic breakdown (aggregate, anonymized): age ranges, geographic regions, eligibility categories.
- Utilization rate — percentage of funded memberships currently active.
- Time-to-activation.

#### Tier 2 — Engagement Report
- Activation rate of scholarship recipients.
- Practiced at least once in first 30 days.
- Still practicing at 90, 180, and 365 days.
- Aggregate practice frequency.
- Cohort participation rate.

#### Tier 3 — Outcome Report
- Aggregate MCI distribution at 90, 180, and 365 days.
- Comparison to paid-member baseline.
- Cohort retention rates.
- Phase progression distribution.

#### Tier 4 — Narrative Report (Optional, Opt-In)
- Aggregate themes from recipients' reflections (with consent, processed via privacy-preserving summarization).
- Qualitative patterns about life impact.
- Voluntary testimonials from recipients who explicitly choose to share.
- **Never identifiable; never individual stories without explicit written consent.**

#### Tier 5 — Compliance & Audit Report
- Eligibility criteria documented and verifiable.
- Selection process audit trail.
- Grant allocation records.
- Financial reconciliation between grant funds received and scholarships funded.
- Annual third-party audit support for major donors.

### Donor Portal Features

- **Real-time dashboards** (not quarterly PDFs) — donors see impact as it accumulates.
- Custom-branded reports for the donor.
- Downloadable quarterly and annual summaries (PDF and CSV).
- On-demand audit data exports for major donors.
- **Per-grant tracking** — each donor sees exactly which memberships their funding supported.

### Privacy Guardrails for Donor Reporting

- **Minimum aggregation: k≥20** for any outcome metric. Grants funding fewer than 20 memberships are aggregated with other grants for reporting.
- **No re-identification:** Donors cannot drill down to individuals.
- **No practice content:** Journal entries, reflections, and conversation content are never exposed.
- **Recipient opt-in for narrative:** Only consenting recipients have anonymized reflections in narrative reports.
- **Annual transparency report:** Mokshly publishes which donors received which aggregate data.

---

## Related Reading

- [Tenant Deployment Models · Model 3](tenant-deployment-models.md#model-3--mokshly-access-scholarship-funded) — recipient onboarding flow.
- [Personas · MA1 Scholarship Recipient and MA2 Grant Donor Admin](../01-product/personas.md#category-3--mokshly-access-users).
- [Information Architecture · Donor Portal Navigation](../01-product/information-architecture.md#mokshly-access-donor-portal-navigation).
- [Analytics Framework](../03-systems/analytics-framework.md) — k-anonymity engineering that gates donor reporting.
