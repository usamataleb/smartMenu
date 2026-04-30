# Spec 0004 — Commercial SaaS Platform (Multi-Tenant, Billing, Onboarding)

**Status**: Ready for planning  
**Priority**: Must (revenue-critical)  
**Phase**: 4 of 4  
**Created**: 2026-04-27  
**Updated**: 2026-04-30  
**Author**: Lion (Hima Tech)

---

## Problem Statement

Right now, adding a new restaurant requires Lion to manually seed the database.  
To become a real business, any restaurant owner in Zanzibar or Tanzania must be able to:

1. Sign up themselves in under 5 minutes
2. Build their menu without calling Lion
3. Pay monthly via mobile money (not credit card)
4. Get suspended automatically if they don't pay — and reinstated when they do

Without this, Smart Menu cannot scale beyond 3–5 manually managed clients.

---

## Goals

1. Self-service restaurant signup with auto-generated slug
2. 14-day free trial → paid subscription
3. Three subscription tiers with limits enforced in the app
4. Azampay integration for TZS mobile money payments (M-Pesa, Tigo, Airtel, Halo)
5. Guided onboarding wizard (menu setup + QR code in one session)
6. Automatic suspension when payment lapses, auto-reinstatement on payment
7. Super admin panel for Hima Tech to manage all restaurants
8. Email + WhatsApp notifications for billing events
9. Per-restaurant analytics (scan count, popular items, peak hours)
10. Multi-branch support (one owner, multiple locations)

---

## Non-Goals (this spec)

- Customer-facing ordering / cart (future)
- Loyalty programs
- Table-specific ordering with kitchen display
- Invoice PDF generation (nice-to-have, Phase 5)

---

## Subscription Tiers

| Feature                      | Starter (Free) | Professional          | Business                  |
|------------------------------|----------------|-----------------------|---------------------------|
| Price (TZS / month)          | 0              | 50,000                | 120,000                   |
| Menu items                   | 10             | Unlimited             | Unlimited                 |
| AR 3D viewer                 | ✗              | ✓                     | ✓                         |
| Image uploads                | ✗ (URL only)   | ✓                     | ✓                         |
| Analytics dashboard          | ✗              | Basic (views, scans)  | Advanced (hourly, device) |
| Branches / locations         | 1              | 1                     | Up to 5                   |
| Custom branding (colors, logo)| ✗             | ✗                     | ✓                         |
| Table-level QR codes         | ✗              | ✗                     | ✓                         |
| WhatsApp order notifications | ✗              | ✗                     | ✓                         |
| Support                      | Community      | WhatsApp (48h)        | WhatsApp (24h)            |
| Annual discount              | —              | 20% off (480,000/yr)  | 20% off (1,152,000/yr)    |

> **Annual billing**: Cheaper for the restaurant, better cash flow for Hima Tech.



---

## User Stories

### New Restaurant Owner
- I want to visit the website, enter my restaurant details, and get a QR code in under 5 minutes so I can start showing customers my digital menu today.
- I want the slug auto-suggested from my restaurant name so I don't have to think about URL design.
- I want to pay using M-Pesa or Tigo Pesa because I don't have a credit card.
- I want a 14-day trial so I can test the platform before committing to payment.
- I want an SMS or WhatsApp reminder 3 days before my payment is due so I don't get suspended by surprise.

### Existing Paying Restaurant Owner
- I want to see my subscription status and next billing date in the admin dashboard.
- I want to add a second branch location with its own QR code and separate menu.
- I want to know how many customers scanned my QR code this week.
- I want to upgrade my plan directly from the admin panel.

### Hima Tech (Super Admin)
- I want to see all registered restaurants, their plan, and their payment status in one view.
- I want to manually activate or suspend a restaurant account.
- I want to see total monthly recurring revenue (MRR) and trial-to-paid conversion rate.
- I want to flag abusive accounts without deleting their data.

---

## Subscription Lifecycle & States

```
[Signup] → trial (14 days)
                │
        trial expires
                │
        ┌───── paid? ─────┐
        │ Yes             │ No
        ▼                 ▼
     active           grace (7 days)
        │                 │
   payment fails    still unpaid
        │                 │
        ▼                 ▼
     grace (7 days)  suspended
        │
   payment received
        │
        ▼
     active
```

**What suspended means:**
- Public `/menu/[slug]` shows: "Menu temporarily unavailable. Contact the restaurant."
- Admin panel login still works but all editing is locked
- Data is preserved — no deletion on suspension
- Auto-reinstated as soon as valid payment is confirmed via webhook

---

## Slug Generation Algorithm

1. Take restaurant name → lowercase, replace spaces/special chars with `-`
2. e.g. "Zanzibar Pizza & Grill" → `zanzibar-pizza-grill`
3. Check DB for uniqueness
4. If taken → append `-2`, `-3`, etc.
5. Owner can customise slug once during signup (before first QR is downloaded)
6. After QR download: slug is locked (changing it breaks existing printed QR codes)

---

## Azampay Payment Flow

```
Admin clicks "Pay Now"
        │
        ▼
POST /api/payments/initiate
  → calls Azampay Checkout API
  → returns payment URL / push notification to phone
        │
        ▼
Customer completes payment on phone
        │
        ▼
Azampay sends webhook → POST /api/payments/callback
  → verify signature
  → mark Payment as completed
  → activate / extend Subscription
  → send confirmation WhatsApp/email
```

- Payment amounts stored in TZS (no FX conversion)
- Webhook must verify `x-callback-token` header (Azampay security)
- Idempotent: duplicate webhook calls must not double-activate
- Retry: if webhook fails, Azampay retries — handle gracefully

---

## Database Schema Additions

```prisma
model Plan {
  id               String         @id @default(cuid())
  name             String         @unique  // "starter" | "professional" | "business"
  displayName      String
  priceMonthly     Int            // TZS
  priceAnnual      Int            // TZS
  maxItems         Int            // -1 = unlimited
  maxBranches      Int
  hasAR            Boolean
  hasImageUpload   Boolean
  hasAnalytics     Boolean
  hasCustomBranding Boolean
  hasTableQR       Boolean
  subscriptions    Subscription[]
}

model Subscription {
  id                 String       @id @default(cuid())
  restaurantId       String       @unique
  planId             String
  status             String       // trial | active | grace | suspended | cancelled
  trialEndsAt        DateTime?
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  gracePeriodEndsAt  DateTime?
  cancelledAt        DateTime?
  restaurant         Restaurant   @relation(...)
  plan               Plan         @relation(...)
  payments           Payment[]
}

model Payment {
  id             String       @id @default(cuid())
  restaurantId   String
  subscriptionId String
  amountTZS      Int
  provider       String       // mpesa | tigopesa | airtel | halopesa | azampesa
  providerRef    String?      // Azampay transaction reference
  status         String       // pending | completed | failed | refunded
  billingPeriod  String       // e.g. "2026-05"
  createdAt      DateTime     @default(now())
  confirmedAt    DateTime?
  restaurant     Restaurant   @relation(...)
  subscription   Subscription @relation(...)
}

model Branch {
  id           String     @id @default(cuid())
  restaurantId String
  name         String
  slug         String     @unique
  address      String?
  restaurant   Restaurant @relation(...)
  menuItems    MenuItem[] // branch overrides parent menu
}

model MenuPageView {
  id           String   @id @default(cuid())
  restaurantId String
  source       String   // qr | direct | share
  userAgent    String?
  viewedAt     DateTime @default(now())
  restaurant   Restaurant @relation(...)
}

model MenuItemView {
  id         String   @id @default(cuid())
  itemId     String
  viewedAt   DateTime @default(now())
  item       MenuItem @relation(...)
}
```

---

## Acceptance Criteria

### Signup & Onboarding
- [ ] `/signup` creates Restaurant + User + Subscription (trial) in one DB transaction
- [ ] Slug auto-generated and shown to user; editable before QR first download
- [ ] Slug collision handled silently (append `-2`, `-3`)
- [ ] 14-day trial countdown shown in admin dashboard
- [ ] 3-step onboarding wizard: details → first items → QR code
- [ ] Verification email sent on signup

### Plan Enforcement
- [ ] Starter: block adding item 11+ with an upgrade prompt
- [ ] Starter: "AR view" feature hidden/locked in menu page
- [ ] Professional: image upload available for all items
- [ ] Business: branch management tab appears
- [ ] Suspended accounts: menu page shows unavailability notice, admin locked

### Payments
- [ ] `/admin/billing` shows current plan, status, next due date, payment history
- [ ] "Pay Now" initiates Azampay checkout and redirects/shows phone push
- [ ] Webhook at `/api/payments/callback` verifies signature, marks payment, activates subscription
- [ ] Webhook is idempotent (same `providerRef` processed only once)
- [ ] Grace period: 7 days after expiry before suspension
- [ ] Payment confirmation WhatsApp/email sent

### Notifications
- [ ] Email: signup welcome, trial ending (3 days before), payment confirmed, payment failed, suspended, reactivated
- [ ] WhatsApp (Business tier): same events via Twilio or Africa's Talking

### Analytics
- [ ] `/admin/analytics` shows: total scans this week, top 5 items by views, scan trend (7-day chart)
- [ ] Data collected on every `/menu/[slug]` page load (server-side, no cookies)

### Super Admin
- [ ] `/superadmin` protected by `role: "superadmin"` (not restaurant owner)
- [ ] Table: all restaurants, plan, status, MRR contribution, last payment
- [ ] Actions: manually activate, suspend, change plan
- [ ] MRR widget: total active subscriptions × average plan price
- [ ] Trial-to-paid conversion rate shown

---

## Technical Notes

- **Azampay**: Use collection API with `callbackUrl` pointing to `/api/payments/callback`
- **Webhook security**: verify `x-callback-token` from Azampay dashboard env var
- **Rate limiting**: `/signup` max 5 attempts per IP per hour (prevent bot signups)
- **Image uploads**: Vercel Blob (free tier: 1 GB) — store as `restaurant/{id}/{filename}`
- **Analytics writes**: batch with 5-second debounce OR write directly (SQLite can handle it for MVP)
- **Africa's Talking vs Twilio**: Africa's Talking has lower cost for East Africa, supports Swahili sender IDs
- **Email**: Resend.com (free tier: 3000 emails/month) — simple transactional email API
- **Stripe alternative note**: Azampay is the only viable option for TZS mobile money — do not use Stripe

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Azampay webhook delivery failures | Medium | High | Idempotent handler + manual activation fallback in superadmin |
| Restaurant changes slug after QR printed | Medium | Medium | Lock slug after first QR download |
| Super admin account compromised | Low | Critical | Separate auth flow, env-var email whitelist |
| High signup volume crashes SQLite | Low (early) | High | Monitor; migrate to Postgres on Vercel Postgres when needed |
| WhatsApp Business API approval delayed | Medium | Low | Fall back to SMS via Africa's Talking |
