# Mokshly AI Guide System

> Source: §2.3.6 of the Mokshly YouSourceful Platform Design Document.

## Purpose

The AI Guide is a rule-based companion assigned to each user that provides proactive check-ins at meaningful moments. It is the human-touch layer that recognizes the user's practice **without surveilling it**, encourages **without pressuring**, and supports **without replacing** genuine professional care.

The AI Guide runs entirely at the application level. **There are no LLM API calls in MVP.** The system uses a rules engine + curated message library, ensuring zero ongoing LLM costs, predictable behavior, and no user data leaving Mokshly's boundaries.

---

## Architecture

- **Trigger Engine** — evaluates practice patterns, MCI trends, phase transitions, time elapsed, and other signals. Fires rules when meaningful moments occur.
- **Message Library** — a versioned, content-team-curated library of message templates for each moment. 5–7 variants per moment to keep the experience fresh.
- **Personalization Engine** — fills variables (first name, intention, days practiced, current phase) into selected messages.
- **Delivery Layer** — pushes messages into the user's conversation thread with their AI Guide.
- **Crisis Detection** — keyword-based pattern matching that watches user replies for crisis signals. Auto-escalates to human Crisis Team.

---

## AI Guide Persona

- Each user is assigned a named AI Guide on first login (e.g., Anjali, Marcus, Priya, David).
- The same Guide stays with the user throughout their practice.
- **Transparent disclosure** — "Your AI Guide, Anjali" — users always know they're interacting with AI.
- Consistent voice across all messages — **calm, observational, never coaching.**

---

## Trigger Moments (MVP)

| Trigger | When It Fires | Tone of Message |
|---------|---------------|-----------------|
| **Welcome to Day 1** | First login after onboarding | Warm welcome, sets expectations |
| **Day 7 check-in** | End of first week | Curious — how is the practice landing? |
| **Day 30 milestone** | 30 days of practice | Acknowledgment of consistency |
| **Phase transition** | User moves between phases | Gentle marker of growth |
| **Return after absence** | Practice after 5+ day gap | Welcoming, no pressure |
| **Cohort first Connect** | Day before first weekly Connect | Light preparation |
| **Quarterly check-in** | Every 90 days | Reflective — what's working? |
| **Anniversary** | Yearly | Honoring the year |

---

## Data Access Boundaries

The AI Guide has **mid-tier visibility** — enough signal to be helpful, never enough to violate user sanctuary.

### AI Guide CAN access

- Name, pronouns, time zone.
- Phase, MCI.
- 30-day practice patterns (**counts and timing only**).
- Cohort participation status.
- Stated intention.
- Conversation history with this Guide.

### AI Guide CANNOT access

- Journal entries.
- Aligning reflections.
- Cohort conversation content.
- Specific feelings logged.
- Other users' data.

---

## User Conversation Model

- **Asynchronous** — user responds when they want.
- Threaded conversation history visible to user.
- User can reply with structured options (e.g., "How is the practice landing? [Lighter] [Same] [Heavier]") or short free-text.
- Free-text replies are saved and available for future Guide context but **do not trigger LLM processing in MVP**.
- User can pause AI Guide outreach anytime.
- User can delete conversation history anytime.

---

## Crisis Escalation

The AI Guide is **not a therapist**. When a user's reply contains crisis signals, the system immediately escalates to the human Crisis Team.

### Hard escalation triggers

- Mentions of self-harm.
- Suicidal ideation.
- Harm to others.
- Severe medical emergency.
- Abuse disclosure.

### On trigger

- AI Guide says: "I want to make sure you're supported well. I'm bringing in a member of our human team — they'll reach out within a few hours. If you're in immediate danger, please contact a crisis line."
- **AI Guide does NOT continue conversation post-trigger.**
- Human Crisis Responder takes over within **24 hours** (often within minutes during business hours).
- The Crisis Responder has clinical training and access to crisis resource referrals.

---

## Tier 4 Consent (Required for AI Guide)

Tier 4 consent is now required at MVP for AI Guide functionality.

- User can decline Tier 4 — then no AI Guide is assigned, and proactive check-ins are not received. **User retains full practice access.**
- Plain-language disclosure during onboarding.

---

## Anti-Patterns

- AI Guide never sends advertising, upsells, or promotions.
- AI Guide **never references the user's MCI specifically** (just acknowledges "consistent practice" qualitatively).
- AI Guide **never says "you missed your practice yesterday"** or similar shame language.
- AI Guide never claims to be human or sentient.
- AI Guide never gives clinical, medical, or legal advice.

---

## Related Reading

- [Personas · M4 Crisis Team Responder](../01-product/personas.md#m4-crisis-team-responder) — the human role escalations flow to.
- [Consent & Privacy](consent-and-privacy.md) — the full four-tier consent model.
- [Nudging Engine](../03-systems/nudging-engine.md) — Guide check-ins respect nudge frequency caps.
- [MCI](../03-systems/mci.md) — Guide can access but cannot reference specifically.
