# 4.6 Billing and Payment Architecture

> Source: §4.6 of the Mokshly YouSourceful Platform Design Document.

Mokshly's billing architecture supports **three distinct revenue paths**, each with its own technology and operational requirements. The MVP architecture uses **Stripe Billing** as the primary payment platform with custom workflows for enterprise contracts and Mokshly Access scholarships.

---

## Billing Models by Tenant Type

| Tenant | Pricing Model | Payment | Billing Frequency |
|--------|---------------|---------|-------------------|
| **Enterprise** | Per-employee annual | ACH, wire, PO, credit card | Annual |
| **Mokshly Commons** | $100/year flat | Credit card via Stripe | Annual (no monthly option) |
| **Mokshly Access** | Grant-funded | Donor-funded; no recipient payment | N/A |

---

## Mokshly Commons Subscription

- **$100/year flat annual subscription.**
- **No monthly plan option** — commitment is annual to honor the depth of practice.
- **30-day free trial** standard (60-day Early Practitioner offer at launch, time-limited).
- Card capture happens at trial end with confirmation prompts at days 21, 25, 27, 29.
- Auto-conversion to annual subscription on day 30 (or 60).
- **No refunds** once subscription begins.
- **Pause-and-resume option** (up to 90 days, doesn't extend subscription).
- Annual auto-renewal with 30-day advance notice.

---

## Enterprise Billing

- Per-employee annual contract.
- **Net 30 or Net 60** payment terms.
- Payment methods: ACH, wire transfer, purchase order, credit card for smaller contracts.
- **Mid-year seat expansion** triggers pro-rated supplemental invoice.
- Annual auto-renewal with **90-day notice**.
- **Billing contact separate from HR Admin** (typically AP/Finance team).
- Invoice PDFs available in Enterprise Admin Console → Billing tab.

---

## Mokshly Access Funding Flow

1. Grant funds received from donor (foundation, CSR, government).
2. Funds tracked in Mokshly internal ledger by donor and grant agreement.
3. As recipients are allocated, the grant balance is decremented.
4. **No payment captured from the recipient** — they receive a complimentary membership.
5. Donor receives invoice/receipt for grant payment with tax receipt where applicable.

---

## Billing Technology

- **Mokshly Commons subscriptions:** Stripe Billing handles trial, conversion, recurring billing, dunning, and tax.
- **Enterprise contracts:** Stripe Invoicing for invoice generation. Custom workflow in Mokshly Admin Console for sales-initiated invoicing.
- **Mokshly Access:** Custom grant tracking ledger; integration with Stripe for donor invoicing.
- **Tax handling:** Stripe Tax for sales tax, VAT, GST in 40+ countries automatically.

---

## Billing UX in the Product

- **Mokshly Commons member:** "Membership" section in Me tab — view subscription, update card, change subscription, pause/cancel.
- **Enterprise Admin Console:** Billing tab (separate from HR Admin) — invoices, employee count, renewal dates, payment method, tax ID.
- **Donor Portal:** Grant ledger — funds received, allocated, remaining.

---

## Related Reading

- [Tenant Deployment Models](tenant-deployment-models.md) — billing follows tenant model.
- [Mokshly Access & Donors](mokshly-access-and-donors.md) — grant ledger details.
- [Backend Architecture · Billing Service](../05-technical/backend.md#billing-service-mvp) — service decomposition for billing.
