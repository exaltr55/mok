# Core User Flows

> Source: §2.2 of the Mokshly YouSourceful Platform Design Document.

The eight core user flows. Each is written so the engineering team can build to it directly.

---

## Flow 1 — Onboarding (Universal Structure)

Onboarding takes approximately **5 minutes** and collects only what is essential. The flow adapts based on how the user arrived.

### Onboarding Sequence

1. **Welcome screen** — brand voice, simple promise: "Let's begin."
2. **Identity** — method depends on arrival path: Enterprise SSO, Mokshly Access scholarship invitation, or direct email/password/social for Commons.
3. **Tenant context** — the user is informed of their primary membership: "Your Mokshly practice is sponsored by [Acme Corp / Marriott Bonvoy / your personal subscription]."
4. **Intention** — user writes one sentence: "What brings you here?" (optional).
5. **Practice cadence** — preferred time(s) of day, days per week. Default: "most days, morning."
6. **Cohort preference** — "When you share things that matter, you'd rather be with..." → People outside my affiliation (default) / People from my affiliation / No preference.
7. **Meeting preference** — preferred day and time window for weekly Connect.
8. **Optional: career stage** — early / mid / senior / post-career (for matching only, never shared).
9. **Privacy consents** — four separate consents: Platform (required), Tenant aggregate sharing (optional), Insurance aggregate sharing (optional), AI personalization (v1.1, optional).
10. **First practice** — a guided 3-minute Breathing session is offered immediately.
11. **Cohort expectation setting** — "You will be placed in a cohort in the next formation wave (up to 2 weeks). In the meantime, your practice is waiting."

> **Design note:** Under no circumstances should the user be asked for health conditions, medications, diagnoses, or demographics beyond what is needed for cohort matching. **The app learns about the user through the practice, not through forms.**

---

## Flow 2 — Daily Practice Flow (Phase-Aware)

The Today screen adapts based on the user's current [phase](practitioner-journey.md). The same underlying data, presented differently.

### Phase 1 (Arriving) — Today Screen

- Warm greeting with user's first name.
- Directive presentation: "Today's practice: I M Breathing. 3 minutes."
- Primary button: **Begin guided session.**
- Secondary (smaller): "I already practiced today."
- MCI is present but small.
- Cohort whisper: "3 of your cohort have practiced today."

### Phase 2 (Steadying) — Today Screen

- Gentle greeting.
- Supportive presentation: "Today might be a Breathing day. How will you practice?"
- Two primary buttons side by side: **Begin guided session** and **Log my practice.**
- MCI visible with weekly change.
- Cohort status present.

### Phase 3 (Integrating) — Today Screen

- Quiet greeting.
- Reflective presentation: "How is your practice today?"
- Primary path: **Log my practice** (any of the 7).
- Secondary: "Open a guided session" (practice menu).
- MCI with milestone label.

### Phase 4 (Living) — Today Screen

- Minimal greeting.
- Just a gentle affirmation from the user's own intention.
- Single access point: "Today's moment" (opens practice menu or reflection).
- MCI shown, weekly change shown.
- **No recommendations. No cohort status on Today** (accessed via Cohort tab).

### Practice Session Flow (All Phases)

1. User taps to begin practice **OR** log practice.
2. For guided: brief intention prompt, then session (audio/video/prompts), then gentle close.
3. For logged: brief confirmation ("You practiced X today"), optional 3-question micro-reflection (duration, how it felt, one-line note).
4. Quiet acknowledgment — "Practice recorded" — return to Today.
5. **No celebration animation, no streak notification, no completion banner.**

---

## Flow 3 — Weekly Cohort Connect Flow

The Weekly Connect is **15 minutes**. Structured. Predictable. Every single week.

### Before the Meeting (24 hours prior)

- Calendar reminder and in-app notification.
- The week's cohort prompt is revealed — members see it 24 hours in advance.
- Attendance confirmation.
- Host of the week is highlighted; one-tap link to 5-minute Host refresher.

### At the Meeting Start

- Members join the Live Audio room via one-tap link.
- Cohort rules displayed. All members tap "I agree."
- Host taps "Begin" when at least 3 members are present.

### During the Meeting

- **Arrival (1 min)** — Host opens, invites three breaths, reads the week's prompt.
- **Rounds (9 min)** — app cycles through members in fixed order. 90 seconds each with visible countdown. Soft chime at 60s. Hard audio mute at 90s.
- **Acknowledgment (3 min)** — each member shares one resonance point, 30 seconds each.
- **Closing (2 min)** — each member names one intention for the week, 15 seconds each.

At exactly 15 minutes, the app ends the audio room.

### After the Meeting

- Single confirmation: "Cohort Connect complete. See you next week."
- **No transcript. No recording. No chat log.**
- Attendance recorded; content is not stored.

---

## Flow 4 — Return Ritual

Triggered when a user returns after **5+ days of absence**.

1. Welcome screen: "Welcome back. Let's take one breath together."
2. Immediate 90-second Breathing session — no other prompts, no guilt.
3. After the breath: "Your practice is waiting for you. Ready?"
4. The simplest practice (Breathing) is offered as today's suggestion.
5. MCI is neither shown nor hidden — available if the user asks.
6. **No mention of "days missed" or "catching up" anywhere.**

---

## Flow 5 — Direct Signup Flow (Mokshly Commons)

1. Marketing site → "Begin" CTA → account creation.
2. Pricing screen — monthly and annual options, 14-day free trial.
3. Payment capture (Stripe).
4. Standard onboarding begins.
5. Primary membership set to Mokshly Commons.
6. Cohort placement in next formation wave.

---

## Flow 6 — HR Admin First Login

1. Mokshly sales/CS sends a provisioning email.
2. HR admin sets up identity, receives 2FA setup.
3. Guided configuration — company name, enrollment cap, cohort preference (cross/within/mixed), SSO coordination.
4. Communication toolkit — branded email templates.
5. Aggregate dashboard — initially empty, populated as employees activate.

---

## Flow 7 — Mokshly Access: Scholarship Recipient Onboarding

1. Recipient receives invitation email with scholarship code (after grant funding allocated to them).
2. Click invitation link — lands on a dignified welcome page that does **NOT** mention "scholarship" or "free" (preserves dignity — they are a Mokshly member).
3. Account creation with email/password or social login.
4. Standard onboarding follows — identical to Commons experience.
5. **No payment capture** (scholarship covers the membership).
6. Internally tagged as Access tenant for billing and donor reporting.
7. Cohort placement in next formation wave.

---

## Flow 8 — Donor Admin First Login

1. Mokshly partnerships team provisions the donor admin account after grant agreement signed.
2. Donor admin sets up identity, receives 2FA setup.
3. Donor portal walkthrough — grant amount, allocation status, reporting dashboards.
4. First impact report available **30 days** after first scholarship recipients activate (k≥20 threshold).

---

## Related Reading

- [Practitioner Journey](practitioner-journey.md) — phase-aware Today screen variants in Flow 2 reference these phases.
- [Mokshly Connect](../02-pillars/connect.md) — Flow 3 implementation details.
- [Consent & Privacy](../02-pillars/consent-and-privacy.md) — Step 9 of onboarding (Flow 1).
