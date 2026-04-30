# Plan 0006 — Owner Experience Improvements

Spec: `codev/specs/0006-owner-experience.md`

## Phase 1 — Image Upload (F1)

**Goal:** Replace URL text input on Add/Edit item with a real file upload.

### Files to create / modify

| File | Change |
|------|--------|
| `src/app/(admin)/admin/menu/new/page.tsx` | Add `ImageUploadField` component |
| `src/app/(admin)/admin/menu/[id]/edit/page.tsx` | Same |
| `src/components/ImageUploadField.tsx` | New client component |
| `src/app/api/admin/upload-image/route.ts` | New API route: PUT to Vercel Blob |

### Implementation steps

1. Create `ImageUploadField.tsx`:
   - `<input type="file" accept="image/*">` hidden behind a styled button
   - On file select: validate size (≤ 5 MB) and type
   - Show local preview immediately (URL.createObjectURL)
   - On form submit: upload via `PUT /api/admin/upload-image`, get back URL
   - Store URL in hidden input `name="imageUrl"`

2. Create `PUT /api/admin/upload-image`:
   - Require session (owner or superadmin)
   - Accept multipart/form-data with `file` field
   - Upload to Vercel Blob: `put('menu-images/${restaurantId}/${cuid()}.jpg', file, { access: 'public' })`
   - Return `{ url }`

3. Update Add/Edit item forms to use `ImageUploadField` in place of the URL text input.

4. Keep `imageUrl` hidden input so existing server actions work unchanged.

### Prisma changes
None — `imageUrl String?` already exists.

---

## Phase 2 — Email Notifications (F7)

**Goal:** Owner gets email before trial ends and when payment status changes.

### Files to create / modify

| File | Change |
|------|--------|
| `src/lib/email.ts` | New — Resend email helpers |
| `src/app/api/cron/trial-reminders/route.ts` | New — cron job |
| `src/app/api/payments/callback/route.ts` | Add notification on suspension |
| `vercel.json` | Add cron for `trial-reminders` |

### Email templates (inline React Email or plain HTML)

- `trialEndingSoon(restaurantName, daysLeft, upgradeUrl)` — subject: "Your Smart Menu trial ends in X days"
- `accountSuspended(restaurantName, renewUrl)` — subject: "Your menu is now offline"
- `accountReinstated(restaurantName, menuUrl)` — subject: "Your menu is back online!"

### Cron logic (`/api/cron/trial-reminders`)

```ts
// Runs daily at 08:00 EAT
// Find subscriptions where:
//   status = 'trial' AND trialEndsAt IN [now+7d, now+1d]
//   AND no reminder email sent yet (add trialReminderSentAt to Subscription)
// Send email via Resend
// Update trialReminderSentAt
```

### Prisma changes

```prisma
model Subscription {
  // add:
  trialReminderSentAt  DateTime?
  suspendReminderSentAt DateTime?
}
```

---

## Phase 3 — Menu Item Ordering (F2)

**Goal:** Owner can drag to reorder items and categories.

### Files to create / modify

| File | Change |
|------|--------|
| `src/app/(admin)/admin/menu/page.tsx` | Replace static list with `SortableMenu` |
| `src/app/(admin)/admin/menu/SortableMenu.tsx` | New client component |
| `src/app/api/admin/reorder/route.ts` | New — PATCH with ordered IDs |

### Implementation

- Use `@dnd-kit/sortable` (install: `npm install @dnd-kit/core @dnd-kit/sortable`)
- `SortableMenu` wraps the category list in `DndContext`
- On drag end: POST to `/api/admin/reorder` with `{ ids: string[] }` 
- Server: update each `MenuItem.sortOrder` in a transaction
- Optimistic: update local state immediately, revert if request fails

### Category ordering
- Store category order in `Restaurant.categoryOrder JSON?` field
- Or derive from lowest `sortOrder` item in each category

---

## Phase 4 — Customer Menu Improvements (F6)

**Goal:** Search and dietary tags on the public menu page.

### Files to create / modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `tags String @default("")` to `MenuItem` |
| `src/app/(admin)/admin/menu/new/page.tsx` | Add tag selector (checkboxes) |
| `src/app/(admin)/admin/menu/[id]/edit/page.tsx` | Same |
| `src/app/(customer)/menu/[slug]/page.tsx` | Add search + filter UI |
| `src/app/(customer)/menu/[slug]/MenuClient.tsx` | New client component for search/filter |

### Tags
Predefined set: `vegan`, `vegetarian`, `halal`, `spicy`, `nuts`, `gluten-free`
Stored as comma-separated string in `MenuItem.tags`

### Menu page
- `MenuClient.tsx` receives all items from server component
- Search: `useState` filter on item name + description
- Filter chips: click to toggle active tags, `AND` filter
- Smooth: items fade out that don't match

---

## Phase 5 — Table QR Codes (F3)

**Goal:** Business plan owners can generate per-table QR codes.

### Files to create / modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `Table` model |
| `src/app/(admin)/admin/tables/page.tsx` | New — table list + QR download |
| `src/app/(admin)/admin/tables/actions.ts` | New — create/delete tables |
| `src/app/(customer)/menu/[slug]/page.tsx` | Read `?table=N` param, show banner |

### Prisma

```prisma
model Table {
  id           String     @id @default(cuid())
  restaurantId String
  number       Int
  restaurant   Restaurant @relation(...)
}
```

### Admin table page
- Only visible if `plan.hasTableQR === true`
- Owner enters number of tables (e.g. 20), click "Generate"
- Shows grid of QR codes: Table 1, Table 2, …
- "Download all as ZIP" button (use `jszip` package)

---

## Phase 6 — Staff Accounts (F4)

**Goal:** Owner can invite additional staff logins.

### Files to create / modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `staffRole` to `User` model |
| `src/app/(admin)/admin/profile/page.tsx` | Add "Team" section |
| `src/app/(admin)/admin/profile/InviteForm.tsx` | New client component |
| `src/app/api/admin/invite/route.ts` | New — create staff account, send invite email |
| `src/lib/auth.ts` | Update session to include staffRole |

### Staff roles
- `owner` — full access (existing)
- `manager` — all except billing
- `waiter` — can only toggle availability

### Auth middleware
Update `src/proxy.ts` — if `staffRole === 'waiter'`, block access to `/admin/menu/new`, `/admin/menu/[id]/edit`, `/admin/billing`, `/admin/profile`

---

## Phase 7 — Availability Scheduling (F5)

### Files to modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `availableFrom`, `availableTo`, `availableDays` to `MenuItem` |
| `src/app/(admin)/admin/menu/new/page.tsx` | Add schedule section to form |
| `src/app/(admin)/admin/menu/[id]/edit/page.tsx` | Same |
| `src/app/(customer)/menu/[slug]/page.tsx` | Filter items by current time/day |

---

## Phase 8 — Branches (F8)

**Goal:** Complete the Branches section for Business plan restaurants.

### Files to modify/create

| File | Change |
|------|--------|
| `src/app/(admin)/admin/branches/page.tsx` | Complete the page (currently stub) |
| `src/app/(admin)/admin/branches/new/page.tsx` | Complete the form (currently stub) |
| `src/app/(admin)/admin/layout.tsx` | Add "Branches" to nav when `plan.maxBranches > 1` |
| `src/app/(customer)/menu/[slug]/page.tsx` | Support branch slugs |

---

## Recommended build order

```
Phase 1 (image upload)     — 1 day
Phase 2 (email alerts)     — 1 day
Phase 3 (item ordering)    — 1 day
Phase 4 (customer menu)    — 1 day
Phase 5 (table QR)         — 1–2 days
Phase 6 (staff accounts)   — 2 days
Phase 7 (scheduling)       — 1 day
Phase 8 (branches)         — 1–2 days
```

Total estimate: **~10 days** of focused implementation.

## Dependencies to install

```bash
npm install @dnd-kit/core @dnd-kit/sortable   # Phase 3
npm install jszip                               # Phase 5
npm install react-email @react-email/components # Phase 2 (optional)
```
