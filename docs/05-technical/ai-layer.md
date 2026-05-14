# 5.5 AI Layer (Rule-Based in MVP)

> Source: §5.5 of the Mokshly YouSourceful Platform Design Document.

---

## MVP Posture — Rule-Based Intelligence

The AI Guide system in MVP is fundamentally **rule-based**, running entirely at the application layer. **There are no LLM API calls, no per-conversation costs, and no user data leaves Mokshly's boundaries.** This decision optimizes for cost predictability, privacy, latency, and behavioral consistency.

- **Trigger Engine** evaluates deterministic rules against practice signals.
- **Message Library** is content-team-curated with 5–7 variants per moment.
- **Personalization** is variable substitution, not generation.
- All other personalization (practice recommendations, nudge timing) also rule-based in MVP.

---

## Why Rule-Based for MVP

- **Zero ongoing LLM API costs** at any scale.
- **Predictable, auditable behavior.**
- No third-party dependency for routine messages.
- **Simpler privacy model** — no sub-processor exposure.
- Faster development — no prompt engineering overhead.

---

## v1.1 LLM Augmentation

LLM-powered conversational AI is introduced in v1.1 as an **opt-in enhancement** (Tier 4 expanded), **not a replacement** for the rule-based core.

- **Provider:** Anthropic Claude (recommended for alignment with Mokshly values) or Azure OpenAI for enterprise customer preference.
- **Use cases:** Open-ended conversation with AI Guide, reflection summary from journal entries (opt-in), nudge phrasing variation.
- **Privacy:** Sub-processor disclosure. Minimized data sent in prompts. **No training on user data.** Short-lived retention.
- **Cost management:** Per-user metering, monthly caps, fallback to rule-based when caps reached.

---

## AI Safety (MVP)

- AI Guide **never gives therapeutic, medical, or legal advice.**
- **Crisis Detection (keyword-based)** auto-escalates to human Crisis Team.
- Clear user-facing "AI" labeling — **transparency required**.
- Bias monitoring — periodic content audits of message library.
- Hard escalation triggers documented and tested.
- Crisis Responder team trained on crisis response protocols.

---

## Related Reading

- [AI Guide pillar (§2.3.6)](../02-pillars/ai-guide.md) — trigger moments, data boundaries, conversation model.
- [Crisis Escalation Service (§5.3)](backend.md#crisis-escalation-service-mvp) — escalation handoff path.
- [Personas · M4 Crisis Team Responder](../01-product/personas.md#m4-crisis-team-responder).
