# 5.6 Cohort Technology — Live Audio Rooms

> Source: §5.6 of the Mokshly YouSourceful Platform Design Document.

---

## Audio Room Provider

- **Recommended:** LiveKit Cloud, Daily.co, or Agora.
- **Cost estimate:** ~$0.002/participant/minute. 5-person cohort × 15 min × 52 weeks ≈ **$8/cohort/year**.

---

## Audio Room Lifecycle

1. Cohort Service creates room 15 min before scheduled start.
2. Members join via one-tap link with short-lived tokens.
3. Room orchestrated by app — **agenda timer is UI-driven**.
4. Room closes at 15 min (or earlier if all leave).
5. Room destroyed. **No recording, transcript, or content retention.**

---

## Async Mode

- 24-hour posting window for Rounds.
- Posts are text or short audio (up to 90s per Round response).
- Content encrypted, visible only to cohort, **deleted after cycle ends**.

---

## Related Reading

- [Mokshly Connect (§2.3.4)](../02-pillars/connect.md) — cohort experience and rules.
- [User Flows · Flow 3](../01-product/user-flows.md#flow-3--weekly-cohort-connect-flow) — 15-minute meeting choreography.
- [Cohort Service (§5.3)](backend.md#cohort-service) — orchestrating service.
