# 6.5 Beta Program · 6.6 Launch Readiness Checklist

> Source: §6.5 + §6.6 of the Mokshly YouSourceful Platform Design Document.

---

## 6.5 Beta Program

### Beta Structure

- **Duration:** Weeks 12–16.
- **Size:** 50 direct Commons users + 1 anchor enterprise (100–200 employees) + 5–10 Mokshly Access pilot recipients + 1 anchor donor in observer mode.
- **Goals:** Validate cohort dynamics, test nudge timing, stress-test Live Audio, validate tenant model across all three types.

### Beta Participants

- Mokshly Commons direct users from waitlist and referrals.
- Anchor enterprise (Mokshly itself qualifies as dogfooding tenant).
- Mokshly Access pilot — small group of scholarship recipients funded by anchor donor.
- Insurance partner in observer mode.

### Beta Exit Criteria

- ≥70% of beta users complete 8+ practices in 4-week beta.
- ≥60% of cohort members attend 3+ of 4 weekly Connects.
- AI Guide messages rated "helpful" or "on-tone" by ≥80% of beta users surveyed.
- Mokshly Weekly newsletter open rate ≥40%.
- Trial-to-paid conversion rate measured (target ≥25%).
- **Zero AI Guide crisis-detection misses.**
- No SEV1 incidents in final 2 weeks.
- NPS from beta users ≥ 40.
- **Zero critical security findings.**

---

## 6.6 Launch Readiness Checklist

### Technical Readiness

- All MVP features functional end-to-end.
- Automated test coverage — unit 80%+, integration 60%+, critical E2E covered.
- Infrastructure hardened — autoscaling, backups, DR tested.
- Monitoring and alerting operational. On-call rotation staffed.
- Data encryption verified.
- Security pentest complete; critical/high findings remediated.

### Compliance Readiness

- **SOC 2 Type 1 audit complete.**
- GDPR documentation complete.
- Privacy policy and terms of service legally reviewed.
- Cookie consent center live.
- Data rights request workflow tested.

### Product Readiness

- All 5S content published.
- All 7 Practices sessions produced.
- 52 weekly cohort prompts curated.
- Nudge library complete.
- Onboarding validated with user research.
- **WCAG 2.1 AA verified.**

### GTM Readiness

- Marketing website live.
- Enterprise sales collateral.
- Mokshly Access program collateral for donor outreach.
- Donor portal demo materials.
- Commons subscription pricing live ($100/year).
- Customer success playbook.
- **Crisis Team escalation playbook.**
- Support documentation.
- At least one anchor enterprise under contract.
- At least one anchor donor commitment for Mokshly Access.

### Operational Readiness

- On-call rotation active.
- Incident response playbook and tabletop exercised.
- Cohort Guide team trained.
- Content curator workflow operational.
- Insurance partner DPA signed.

---

## Related Reading

- [Sprint Roadmap](sprint-roadmap.md) — Sprint 8 is the hardening sprint that fills this checklist.
- [Compliance (§5.9)](../05-technical/ops-security-compliance.md#59-compliance-framework) — SOC 2 Type 1 and other compliance targets.
