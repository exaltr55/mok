# Content Delivery Model

> Source: §3.4 of the Mokshly YouSourceful Platform Design Document.

---

## Content Types

- **5S Framework content** — Welcome, S1 through S5, bridge.
- **7 Practices content** — Part A and Part B for each practice.
- **Cohort weekly prompts** — 52+ prompts for yearly rotation.
- **Nudge copy library** — variants for each category.
- **Onboarding microcopy.**

---

## Content Versioning

- All content versioned in a **headless CMS** (Sanity recommended for MVP).
- Content changes require **review and approval workflow**.
- **Deployed content is immutable** — users continue with their engagement version unless they opt into updates.
- Audit trail retained for **3 years**.

---

## Cohort Prompt Library — Key Additions

The prompt library includes prompts that reinforce the **"doorway not destination"** principle:

- "What did you not practice this week, and why?"
- "Where did you bring Awareness into your day, even without a formal practice?"
- "What does consistency look like in your life right now?"
- "When was a practice not needed because Awareness was already present?"

---

## Content Delivery Infrastructure

- Audio and video served via **CDN** (CloudFront or Cloudflare).
- Audio in multiple bitrates for mobile and desktop.
- **Transcripts** for all audio and video (accessibility).
- **PWA offline caching** for core 7 Practices audio.

---

## Localization Readiness (MVP: English Only)

- Content structure supports localization.
- String externalization for all UI text.
- First non-English launch targeted **v1.2** (Spanish, then Hindi).

---

## Related Reading

- [Mokshly Learn](../02-pillars/learn.md) — 5S content delivery surface.
- [Mokshly Do](../02-pillars/do.md) — 7 Practices content delivery surface.
- [Mokshly Connect](../02-pillars/connect.md) — uses the cohort prompt library.
- Canonical content lives at [`mok/content/`](../../content/).
