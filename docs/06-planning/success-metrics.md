# 6.1 Success Metrics

> Source: §6.1 of the Mokshly YouSourceful Platform Design Document.

Mokshly's metrics are carefully chosen to avoid the engagement-maximization trap of traditional SaaS. **Our north star is about impact on the practitioner's life, not minutes in the app, and never about "completing" all 7 practices.**

---

## North Star Metric

**Weekly Practicing Practitioners (WPP)** — the number of unique users who completed or logged at least one practice in the last 7 days.

This is our single most important business health metric. Notice what it does **not** measure: how many practices they did, how long they spent, whether they "completed" anything. It measures only one thing — **did they show up to their practice this week?**

---

## Supporting Practitioner Metrics

- **Activation Rate:** Percentage of invited users who complete first practice within 7 days. Target: ≥60% at launch, ≥75% by Month 6.
- **30-Day Practicing Rate:** Percentage of activated users who practiced 15+ of the last 30 days (about the target cadence of 5/week).
- **13-Week Cohort Retention:** Percentage of cohorts completing their first full 13-week cycle. Target: ≥50% at launch, ≥65% at Month 12.
- **Weekly Connect Attendance:** Aggregate percentage attending weekly Connect. Target: ≥70%.
- **Return Rate:** Percentage of lapsed users (10+ days absent) who return within 30 days. Target: ≥25%.
- **Phase Progression:** Percentage of users who progress to Phase 2 within 60 days of activation. Target: ≥40%.

---

## Tenant Metrics

- **Enterprise NPS:** HR Admin satisfaction. Target: NPS ≥ 40 by Month 6, ≥ 60 by Month 12.
- **Donor Renewal Rate:** Percentage of grant donors who renew funding annually. Target: ≥70% (institutional donors typically renew on multi-year cycles).
- **Renewal Rate:** Annual contract renewal. Target: ≥85% gross, ≥95% net.
- **Activation:** Percentage of licensed users activating within 90 days. Target: ≥50%.

---

## Product Quality Metrics

- **App Performance** — p95 API <200ms, LCP <2.5s.
- **Reliability** — 99.9% practice core availability.
- **Accessibility** — Zero WCAG 2.1 AA failures in quarterly audits.
- **Support Ticket Trend** — volume per 100 practitioners, declining.

---

## Anti-Metrics (What We Don't Optimize For)

- **Daily Active Users beyond North Star** — DAU can be anxiety-inflated.
- **Session duration** — longer sessions are not better.
- **Notifications per day sent** — we actively optimize for fewer.
- **Content consumption volume** — more learning is not better than more living.
- **Streak length** — streaks create guilt.
- **"Practices completed per day"** — we never show or celebrate this.
- **Practice diversity** — we never push users to sample all 7.

---

## Related Reading

- [Design Principles · Principle 1](../00-overview/design-principles.md#principle-1--minimum-viable-engagement) — Minimum Viable Engagement is the principle that makes these anti-metrics possible.
- [MCI (§3.1)](../03-systems/mci.md) — the user-facing version of "show up consistently."
