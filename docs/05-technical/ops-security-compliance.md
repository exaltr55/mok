# 5.7 Observability · 5.8 Security · 5.9 Compliance

> Source: §5.7 + §5.8 + §5.9 of the Mokshly YouSourceful Platform Design Document.

---

## 5.7 Observability and Operations

### Logging
- **Structured JSON** via Pino.
- Aggregation in Datadog.
- 90-day hot retention, 13-month cold.
- **Sensitive data never logged** — enforced at formatter level.

### Metrics
- OpenTelemetry.
- Business metrics dashboard (activation, retention, cohort health).
- SLO tracking per service.

### Tracing
- Distributed tracing via OpenTelemetry.
- Critical flows fully traced — onboarding, first practice, first cohort Connect.

### Alerting
- PagerDuty or Opsgenie.
- SEV1/SEV2/SEV3 severity.
- Cohort-specific alerts for Cohort Guide.

---

## 5.8 Security Architecture

### Application Security
- **OWASP Top 10 controls.**
- CSP strict mode.
- Rate limiting.
- **Secrets management** — AWS Secrets Manager.
- Dependency scanning — Snyk or Dependabot.

### Infrastructure Security
- VPC with private subnets.
- WAF — AWS or Cloudflare.
- DDoS protection.
- **MFA-required bastion access.**
- Infrastructure as Code — Terraform.

### Access Control
- **Least-privilege IAM.**
- SSO for internal admin console.
- Break-glass procedure with audit.
- Quarterly access review.

### Penetration Testing
- Third-party pentest **pre-launch**.
- Annual thereafter.
- Bug bounty after first 500 active users.

### Incident Response
- Documented playbook.
- Breach notification — **72h GDPR, 45d CCPA**.
- Annual tabletop exercises.

---

## 5.9 Compliance Framework

### MVP Compliance Targets

- **SOC 2 Type 1:** Complete pre-launch. Type 2 follows at Month 12.
- **GDPR:** Full compliance at launch.
- **CCPA/CPRA:** Full compliance at launch.
- **WCAG 2.1 AA:** Verified at launch.
- **HIPAA BAA:** Available for insurance partners.

### Post-MVP Roadmap

- **ISO 27001** — Month 18.
- **HIPAA full** — as partner demand dictates.
- **APEC CBPR** — for international expansion.

---

## Related Reading

- [Privacy & Consent Framework (§4.9)](../04-business/privacy-consent-framework.md) — regulatory specifics for GDPR/CCPA/HIPAA.
- [Analytics Framework (§3.3)](../03-systems/analytics-framework.md) — Tier 2 retention rules.
- [GTM (§7.4)](../07-gtm/go-to-market-summary.md#74-what-this-means-for-engineering) — SOC 2 Type 1 pre-launch is sales-critical.
