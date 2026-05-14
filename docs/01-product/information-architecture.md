# Information Architecture

> Source: §2.1 of the Mokshly YouSourceful Platform Design Document.

The YouSourceful platform is organized around practitioner-facing and administrator-facing surfaces. In MVP, all core practitioner pillars are active, with Tools and Shop deferred to later releases.

---

## Practitioner Navigation

| Destination | Purpose | MVP |
|-------------|---------|-----|
| **Today (Home)** | Phase-aware home showing today's practice, MCI, cohort status | Yes |
| **Practices** | Access to all 7 Practices — guided or self-log | Yes |
| **Cohort** | Daily view, Weekly Connect, cohort rules | Yes |
| **Learn** | 5S Framework structured content | Yes |
| **Me** | Journal, reflections, history, preferences, settings, memberships | Yes |

---

## HR Admin Navigation

- **Overview** — workforce-level signals, executive summary.
- **Enrollment** — invite users, track activation, manage licenses.
- **Cohorts** — aggregate cohort health.
- **Analytics** — deeper reports, exportable summaries.
- **Settings** — SSO, billing, program configuration.

See [HR Admin Portal](../02-pillars/hr-admin.md).

---

## Mokshly Access Donor Portal Navigation

- **Grant Overview** — funds received, deployed, remaining.
- **Funded Memberships** — count and activation status.
- **Engagement** — aggregate practice signals for funded recipients (k≥20).
- **Outcomes** — aggregate MCI trends, cohort retention, phase progression.
- **Reports** — quarterly and annual downloadable reports, audit data exports.

---

## Enterprise IT Navigation

- **Identity & Access** — SSO, SCIM, session policies.
- **Security** — audit logs, posture.
- **Compliance** — residency, retention, reports.
- **Support** — ticket history, escalation.

See [Enterprise Admin Console](../02-pillars/enterprise-admin.md).

---

## Related Reading

- [User Flows](user-flows.md) — the eight core flows that traverse this navigation.
- [Pillars index](../02-pillars/) — each navigation destination corresponds to a pillar.
