# 5.2 Frontend Architecture

> Source: §5.2 of the Mokshly YouSourceful Platform Design Document.

---

## Technology Stack

- **Framework:** Next.js 14+ (App Router).
- **Language:** TypeScript (strict mode).
- **UI Library:** Radix UI primitives + custom design system, Tailwind CSS.
- **State:** React Query (server state), Zustand (client state).
- **Forms:** React Hook Form + Zod.
- **PWA:** Progressive Web App with offline support for core 7 Practices.
- **Auth Client:** Auth.js for Commons; SSO SDKs for enterprise; scholarship-code activation flow for Mokshly Access.
- **Analytics Client:** PostHog or Amplitude for product analytics; custom server-side for sensitive data.
- **Testing:** Vitest (unit), Playwright (E2E), React Testing Library.

> **v0 build note:** Mokshly v0 uses **Vite + React 19** (matching the existing `mok` scaffold and the [loom](../../../loom/CLAUDE.md) reference). The component contracts and design system below are stack-agnostic and translate to Next.js when the team converges.

---

## Application Structure

- `apps/web` — practitioner.
- `apps/hr-admin` — HR Admin portal.
- `apps/donor-portal` — Mokshly Access Donor Portal.
- `apps/enterprise-it` — IT/Security console.
- `apps/partner-portal` — service partner admin and user.
- `apps/mokshly-admin` — internal platform admin (manages tenants, scholarships, billing reconciliation).
- `packages/ui` — shared design system.
- `packages/api-client` — shared typed API client.
- `packages/auth` — shared authentication utilities.

---

## Design System — Mokshly Voice

- **Typography:** soft, generous line-height. Serif for content (Lora), sans-serif for UI (Inter).
- **Color palette:** warm neutrals, soft accent blues/greens. Muted amber/rose for errors.
- **Motion:** slow, gentle. 300–500ms transitions.
- **Sound:** optional soft chimes. Fully silent mode supported.
- **Dark mode** from day one.

---

## Related Reading

- [Accessibility (§5.10)](accessibility-and-scale.md#510-accessibility) — WCAG 2.1 AA requirements that govern the design system.
- [Mokshly Weekly Newsletter (§2.3.7)](../02-pillars/weekly-newsletter.md) — uses the same Lora/Inter typography pair.
