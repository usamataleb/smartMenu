# Plan 0004 — Commercial SaaS Platform

**Spec**: `codev/specs/0004-multitenant-saas.md`  
**Status**: Ready (starts after Plan 0003 complete)  
**Estimated time**: 3–4 weeks  
**Created**: 2026-04-30  
**Updated**: 2026-04-30

---

## Phase Breakdown

### Phase 4.0 — Public Landing Page with Pricing (Day 1)

**Goal**: Any restaurant owner who visits the site immediately understands what Smart Menu does, why they need it, and how to sign up — even if they have never heard of QR menus or AR.

Tasks:
- [ ] Rewrite `src/app/page.tsx` as a full SaaS marketing page with these sections:
  - **Nav**: Logo + "Sign in" + "Get started free" → `/signup`
  - **Hero**: Plain-language headline, subtext explaining QR + AR in simple terms, two CTAs (sign up + live demo)
  - **How it works**: 3 numbered steps — sign up → print QR → customers scan (no tech jargon)
  - **Features**: 6 cards covering always-updated menu, 3D AR preview, analytics, multi-branch, WhatsApp reminders, data safety
  - **Pricing**: 3 plan cards (Starter / Professional / Business) with TZS prices, feature checklist per plan, CTA buttons
  - **FAQ**: 6 common questions from restaurant owners (includes Swahili question labels for local context)
  - **Final CTA**: Full-width closing section with sign-up button
  - **Footer**: Links to sign in, pricing anchor, demo menu
- [ ] Pricing section links to `/signup?plan=professional` etc. (query param picked up in signup form to pre-select plan)
- [ ] Demo link opens `/menu/zanzibar-pizza` in new tab
- [ ] Verify page is mobile-responsive and readable on small Android screens
- [ ] `<details>` elements for FAQ (no JS required, pure HTML)

**Done when**: A restaurant owner with no tech background can read the page and understand exactly what to do next

---

### Phase 4.1 — Database Schema + Plan Seed (Day 1)

**Goal**: New models in DB, three plans seeded

Tasks:
- [ ] Add `Plan`, `Subscription`, `Payment`, `Branch`, `MenuPageView`, `MenuItemView` to `prisma/schema.prisma`
- [ ] Add `subscriptionId` relation to `Restaurant`
- [ ] Run `npx prisma db push && npx prisma generate`
- [ ] Seed the three plans in `prisma/seed.ts`:
  - `starter` — TZS 0 / month, 10 items, no AR
  - `professional` — TZS 50,000 / month, unlimited, AR
  - `business` — TZS 120,000 / month, 5 branches, custom branding
- [ ] Add `AZAMPAY_APP_NAME`, `AZAMPAY_CLIENT_ID`, `AZAMPAY_CLIENT_SECRET`, `AZAMPAY_CALLBACK_TOKEN` to `.env.local`
- [ ] Add `RESEND_API_KEY`, `AFRICASTALKING_API_KEY`, `AFRICASTALKING_USERNAME` to `.env.local`

**Done when**: `npx prisma studio` shows plans table with 3 rows

---

### Phase 4.2 — Restaurant Self-Service Signup (Day 2–3)

**Goal**: Any restaurant can register in under 5 minutes

Tasks:
- [ ] Create `src/app/(public)/signup/page.tsx` — form: restaurant name, owner name, email, phone, password, address
- [ ] Create `src/app/api/restaurants/register/route.ts` (POST):
  - Validate input (zod)
  - Generate unique slug from restaurant name
  - DB transaction: create `Restaurant` + `User` (bcrypt password) + `Subscription` (trial, 14 days)
  - Send welcome email via Resend
  - Return `{ slug, restaurantId }`
- [ ] Slug generation utility `src/lib/slug.ts`:
  ```ts
  slugify(name) → "zanzibar-pizza"
  ensureUniqueSlug(base) → "zanzibar-pizza-3" (checks DB)
  ```
- [ ] Rate-limit `/api/restaurants/register` — 5 req / IP / hour (use `next-rate-limit` or simple in-memory)
- [ ] On success: redirect to `/onboarding`

**Done when**: A new restaurant appears in DB after form submit, trial subscription created

---

### Phase 4.3 — Onboarding Wizard (Day 3–4)

**Goal**: New owner sets up menu + gets QR in one guided session

Tasks:
- [ ] Create `src/app/(admin)/onboarding/page.tsx` — 3-step wizard:
  - **Step 1 — Your Restaurant**: Confirm name, address, logo upload (optional)
  - **Step 2 — First Menu Items**: Quick-add form (name, price, category) — at least 1 item required to proceed
  - **Step 3 — Your QR Code**: Show generated QR, download button, link to full dashboard
- [ ] Wizard state managed with `useState` + step index (client component)
- [ ] After Step 2: call existing menu item server actions from Spec 0003
- [ ] After Step 3: mark restaurant as `onboardingComplete = true` in DB
- [ ] `/admin` dashboard shows "Complete setup" banner if `!onboardingComplete`

**Done when**: New signup flows end-to-end to QR code in under 5 minutes

---

### Phase 4.4 — Subscription Tier Enforcement (Day 4–5)

**Goal**: Limits enforced silently in the app — not just a check at signup

Tasks:
- [ ] Create `src/lib/subscription.ts`:
  - `getSubscription(restaurantId)` — fetches plan + status
  - `canAddItem(restaurantId)` — true if active/trial and item count < plan.maxItems
  - `hasFeature(restaurantId, feature)` — checks plan flags
- [ ] Wrap menu item creation server action: call `canAddItem`, return error if over limit
- [ ] Menu page: hide AR viewer if `!plan.hasAR`
- [ ] Admin menu page: show upgrade banner if at item limit
- [ ] Suspended restaurants: `src/middleware.ts` intercepts `/menu/[slug]` — return `503` page with "Menu temporarily unavailable"
- [ ] Suspended restaurants: admin panel shows read-only mode with "Reactivate" CTA

**Done when**: Starter account blocked at item 11, AR hidden, suspended accounts show correct messages

---

### Phase 4.5 — Azampay Payment Integration (Day 5–7)

**Goal**: Owner clicks Pay, enters phone, receives M-Pesa push, subscription activates

Tasks:
- [ ] Create `src/lib/azampay.ts`:
  - `getToken()` — POST to Azampay auth endpoint, cache token
  - `initiateCollection({ amount, phone, externalId, callbackUrl })` — collection request
  - `verifyWebhookSignature(req)` — check `x-callback-token` header
- [ ] Create `src/app/api/payments/initiate/route.ts` (POST):
  - Auth: must be logged-in restaurant owner
  - Body: `{ planId, billingCycle: "monthly" | "annual" }`
  - Call `azampay.initiateCollection`
  - Create `Payment` record (status: "pending")
  - Return `{ message, transactionId }`
- [ ] Create `src/app/api/payments/callback/route.ts` (POST):
  - Verify webhook signature
  - Find `Payment` by `externalId`
  - If already `completed`: return 200 (idempotent)
  - Mark `Payment` as `completed`, activate/extend `Subscription`
  - Send confirmation WhatsApp/email
- [ ] Create `src/app/(admin)/admin/billing/page.tsx`:
  - Current plan + status card
  - Trial countdown (days remaining)
  - Payment history table (date, amount, provider, status)
  - "Upgrade Plan" section with plan cards
  - "Pay Now" button → initiates collection
- [ ] Test with Azampay sandbox credentials

**Done when**: Test payment flow completes in sandbox, subscription status updates to `active`

---

### Phase 4.6 — Email + WhatsApp Notifications (Day 7–8)

**Goal**: Owners never surprised by suspension — 3 reminders before it happens

Tasks:
- [ ] Create `src/lib/email.ts` using Resend SDK:
  - `sendWelcome(email, restaurantName)`
  - `sendTrialEnding(email, restaurantName, daysLeft)`
  - `sendPaymentConfirmed(email, amountTZS, period)`
  - `sendPaymentFailed(email, restaurantName)`
  - `sendSuspended(email, restaurantName)`
  - `sendReactivated(email, restaurantName)`
- [ ] Create `src/lib/whatsapp.ts` using Africa's Talking:
  - Same events as email (Business plan only)
- [ ] Create `src/app/api/cron/billing-check/route.ts`:
  - Protected by `CRON_SECRET` header
  - Runs daily (Vercel Cron): check all subscriptions
  - Trial ending in 3 days → send email
  - Payment overdue → move to `grace`, send email
  - Grace period expired → move to `suspended`, send email
- [ ] Add Vercel Cron config to `vercel.json`:
  ```json
  { "crons": [{ "path": "/api/cron/billing-check", "schedule": "0 8 * * *" }] }
  ```

**Done when**: A test account in trial sends a reminder email at T-3 days

---

### Phase 4.7 — Analytics (Day 8–9)

**Goal**: Owners see scan counts and popular items; Hima Tech sees revenue

Tasks:
- [ ] Middleware update: on every `/menu/[slug]` request, insert `MenuPageView` (non-blocking `prisma.$executeRaw`)
- [ ] On every menu item card click (client component): POST to `/api/analytics/item-view` → insert `MenuItemView`
- [ ] Create `src/app/(admin)/admin/analytics/page.tsx`:
  - Total scans this week vs last week (% change)
  - Top 5 items by view count (bar chart or ranked list)
  - Scans by day (7-day sparkline using CSS only — no charting library)
  - Source breakdown: QR vs direct
- [ ] Gate analytics page by plan: redirect to upgrade prompt for Starter
- [ ] Auto-purge `MenuPageView` rows older than 90 days via cron

**Done when**: Visiting a menu page increments scan count visible in admin analytics

---

### Phase 4.8 — Multi-Branch Support (Day 9–10)

**Goal**: Business plan owners manage multiple locations

Tasks:
- [ ] Create `src/app/(admin)/admin/branches/page.tsx` — list branches with QR per branch
- [ ] Create `src/app/(admin)/admin/branches/new/page.tsx` — form: branch name, address
- [ ] Branch creation server action: generate unique slug (`zanzibar-pizza-forodhani`), create `Branch`
- [ ] Each branch slug routes to the same menu (parent restaurant's items) — `menu/[slug]` checks `Branch` table too
- [ ] Each branch gets its own QR code pointing to `menu/[branch-slug]`
- [ ] Gate: Business plan only — show "Upgrade to Business" for others
- [ ] Max 5 branches enforced

**Done when**: Business plan account can create a second branch with its own QR

---

### Phase 4.9 — Super Admin Panel + Plan Management (Day 10–11)

**Goal**: Lion can see all restaurants, manage their plans, override billing, and see revenue — from one panel

Tasks:
- [ ] Add `role: "superadmin"` to User model (only in seed, not self-registerable)
- [ ] Seed one superadmin account (`admin@himatech.co.tz`)
- [ ] Create `src/middleware.ts` update: `/superadmin/*` requires `role === "superadmin"`
- [ ] Create `src/app/(superadmin)/superadmin/page.tsx` — dashboard home:
  - KPI cards: total restaurants, active, trial, grace, suspended
  - MRR card (sum of active subscriptions × plan price)
  - Trial-to-paid conversion rate (active ÷ (active + cancelled after trial))
  - "New this month" counter
  - Table: all restaurants, plan badge, status badge, last payment date, actions column
- [ ] **Plan management actions** (inline in the table + detail page):
  - Change plan: dropdown to move restaurant between Starter / Professional / Business (takes effect immediately, no prorating in MVP)
  - Override subscription status: manually set trial / active / grace / suspended
  - Extend trial: add N days to trial expiry
  - Waive payment: mark a billing period as paid without actual payment (for VIP/promo)
  - Note field: internal admin note per restaurant (e.g. "Owner on holiday, extend grace")
- [ ] Create `src/app/api/superadmin/plan/route.ts` (PATCH):
  - Auth: superadmin only
  - Body: `{ restaurantId, planId?, status?, trialExtendDays?, note? }`
  - Updates `Subscription` and logs change to new `AdminAction` table
- [ ] Create `AdminAction` model in schema:
  ```prisma
  model AdminAction {
    id           String   @id @default(cuid())
    restaurantId String
    adminId      String
    action       String   // "plan_change" | "status_override" | "trial_extend" | "waive_payment"
    details      String   // JSON string of what changed
    createdAt    DateTime @default(now())
  }
  ```
  — This is the audit log so Lion can see who changed what and when
- [ ] `/superadmin/restaurants/[id]` — full detail view:
  - Owner info (email, phone, joined date)
  - Current plan + subscription status timeline
  - All admin actions taken on this account (audit log)
  - All payments (date, amount, provider, status)
  - All menu items (read-only count, categories)
  - Quick actions sidebar: change plan, suspend, reactivate, extend trial
- [ ] `/superadmin/payments` — payment ledger:
  - Table: all payments across all restaurants, filterable by month / status / provider
  - Export to CSV button (simple server action returning CSV response)
- [ ] `/superadmin/plans` — plan catalog management:
  - List all plans (Starter, Professional, Business)
  - Edit plan price (takes effect for new billing cycles only — never retroactive)
  - Toggle plan availability (hide Starter from signup to push to paid)
  - **Do NOT allow deleting plans** — only deactivate (existing subscribers stay on old plan)

**Done when**: Super admin can move a restaurant from Starter to Professional, see the audit log entry, and the restaurant immediately gains access to Professional features

---

## File Structure After Phase 4

```
src/
├── app/
│   ├── (public)/
│   │   └── signup/
│   │       └── page.tsx
│   ├── (admin)/
│   │   ├── onboarding/
│   │   │   └── page.tsx
│   │   └── admin/
│   │       ├── billing/
│   │       │   └── page.tsx
│   │       ├── analytics/
│   │       │   └── page.tsx
│   │       └── branches/
│   │           ├── page.tsx
│   │           └── new/
│   │               └── page.tsx
│   ├── (superadmin)/
│   │   └── superadmin/
│   │       ├── page.tsx
│   │       ├── payments/
│   │       │   └── page.tsx
│   │       └── restaurants/
│   │           └── [id]/
│   │               └── page.tsx
│   └── api/
│       ├── restaurants/
│       │   └── register/
│       │       └── route.ts
│       ├── payments/
│       │   ├── initiate/
│       │   │   └── route.ts
│       │   └── callback/
│       │       └── route.ts
│       ├── analytics/
│       │   └── item-view/
│       │       └── route.ts
│       └── cron/
│           └── billing-check/
│               └── route.ts
├── lib/
│   ├── azampay.ts
│   ├── email.ts
│   ├── whatsapp.ts
│   ├── slug.ts
│   └── subscription.ts
```

---

## Environment Variables Required

```bash
# Azampay
AZAMPAY_APP_NAME=
AZAMPAY_CLIENT_ID=
AZAMPAY_CLIENT_SECRET=
AZAMPAY_CALLBACK_TOKEN=
AZAMPAY_ENV=sandbox            # → production on launch

# Email (Resend)
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@himatech.co.tz

# WhatsApp / SMS (Africa's Talking)
AFRICASTALKING_USERNAME=
AFRICASTALKING_API_KEY=

# Cron security
CRON_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://smartmenu.himatech.co.tz
```

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Azampay sandbox doesn't match production | Test with real phone + TZS 100 before launch |
| Webhook delivery failure → subscription not activated | Manual activation in super admin; retry log |
| Slug collision race condition on simultaneous signups | DB unique constraint + retry loop in slug.ts |
| SQLite write contention under load | Migrate to Vercel Postgres when > 50 concurrent restaurants |
| CRON_SECRET leaked → billing cron triggered by attacker | Rotate key; add IP allowlist for Vercel cron IPs |
| Africa's Talking WhatsApp API slow approval | Launch with email-only, add WhatsApp after approval |
| Restaurant changes mind after paying (refund requests) | Define refund policy: no refunds after QR printed (in ToS) |

---

## Definition of Done

1. A new restaurant can sign up, add 3 menu items, and download a QR code in < 5 minutes
2. Trial expires → grace → suspended (tested with manual date manipulation)
3. Azampay sandbox payment activates subscription
4. Super admin can view all restaurants and manually override status
5. Analytics show scan count after visiting the menu page
6. All spec acceptance criteria checked off
