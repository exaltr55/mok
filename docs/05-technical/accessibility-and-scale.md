# 5.10 Accessibility · 5.11 Scalability

> Source: §5.10 + §5.11 of the Mokshly YouSourceful Platform Design Document.

---

## 5.10 Accessibility

### Standards
- **WCAG 2.1 AA** at launch.
- **WCAG 2.2 AA** stretch post-launch.

### Features
- Semantic HTML.
- **Full keyboard navigation.**
- ARIA landmarks and labels.
- High-contrast mode.
- Font size controls.
- **Transcripts** for all audio.
- **Captions** for all video.
- Screen reader testing — JAWS, NVDA, VoiceOver.
- `prefers-reduced-motion` honored.

### Inclusivity
- Gender-neutral pronouns.
- Culturally diverse content examples.
- Alternative paths in Moving practice.
- Tiered pricing for economic accessibility.

---

## 5.11 Scalability

### Year 1 Load Expectations

- **50,000 active practitioners** end of Year 1.
- **Peak concurrent:** 10,000.
- **Daily practice completions:** up to 40,000/day.
- **Cohort Connects:** up to 10,000/week across time zones.

### Scaling Strategy

- Horizontal scaling via Kubernetes.
- PostgreSQL read replicas.
- CDN for static content.
- Background job autoscaling.
- **Cohort formation as bi-weekly batch** (avoids real-time matching load).

### Performance Targets

- API **p95 < 200ms**.
- LCP < 2.5s on 3G mobile.
- **Audio practice start < 1s after tap.**
- Availability SLO — **99.9% practice core**, 99.5% admin.

---

## Related Reading

- [Frontend Architecture (§5.2)](frontend.md) — design system supports accessibility.
- [Cohort Audio (§5.6)](cohort-audio.md) — bi-weekly batch matching strategy.
- [Content Delivery (§3.4)](../03-systems/content-delivery.md) — transcripts requirement.
