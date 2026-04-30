# Plan 0003 — Admin Dashboard (Full CRUD)

**Spec**: `codev/specs/0003-admin-dashboard.md`  
**Status**: ✅ Complete  
**Estimated time**: 1 week  
**Created**: 2026-04-30  
**Completed**: 2026-04-30

---

## Phase Breakdown

### Phase 3.1 — Admin Shell Layout

**Goal**: Consistent navigation across all admin pages

Tasks:
- [x] Create `src/app/(admin)/admin/layout.tsx` — wraps all admin pages
  - Sticky top header: restaurant name + sign-out button
  - Desktop horizontal nav: Dashboard · My Menu · Profile · Billing (soon)
  - Mobile bottom tab bar: 4 tabs with icons
  - Skips nav entirely when no session (login page shows plain)
- [x] Create `src/app/(admin)/admin/SignOutButton.tsx` — client component calling `signOut()`
- [x] Login page redesigned — dark theme matching landing page, "Sign up free" link, role-aware redirect after login (superadmin → `/superadmin`, owner → `/admin`)

**Done when**: All admin pages share the same nav, mobile shows bottom tabs

---

### Phase 3.2 — Owner Dashboard (Home)

**Goal**: Dashboard shows subscription health, stats, and quick actions at a glance

Tasks:
- [x] Rewrite `src/app/(admin)/admin/page.tsx`:
  - Welcome header: restaurant name + live menu link
  - Subscription banner: plan name, status badge, trial countdown, renewal date, Upgrade CTA
  - 3 stat cards: total items, available items, categories
  - Item limit warning: amber alert at ≥ 80% of plan limit
  - 3 quick action tiles: Add new dish, Manage menu, Edit profile
  - QR code section: thumbnail + Download PNG + Open live menu buttons
- [x] Superadmin redirected to `/superadmin` on dashboard load (role check)

**Done when**: Owner sees subscription status, trial days, and can act in 1 tap

---

### Phase 3.3 — Menu Item CRUD

**Goal**: Full create, read, update, delete for menu items

Tasks:
- [x] Create `src/app/(admin)/admin/menu/actions.ts` — server actions:
  - `createMenuItem(prevState, formData)` — zod validation, auth check, creates item
  - `updateMenuItem(id, prevState, formData)` — validates ownership, updates
  - `deleteMenuItem(id)` — validates ownership, deletes
  - `toggleAvailability(id, available)` — instant toggle
- [x] Create `src/app/(admin)/admin/menu/page.tsx` — list view:
  - Items grouped by category with category headers
  - Colour dot for availability status, AR badge for items with glbUrl
  - Toggle switch (optimistic UI), Edit link, Delete button per row
  - Empty state with "Add your first dish" CTA
- [x] Create `src/app/(admin)/admin/menu/ItemForm.tsx` — shared client form component:
  - Fields: name, category (datalist with suggestions), description, price (TZS prefix), image URL, GLB URL, available checkbox
  - `useActionState` for server action feedback
  - Error display from zod validation
- [x] Create `src/app/(admin)/admin/menu/ToggleButton.tsx` — `useOptimistic` for instant feedback
- [x] Create `src/app/(admin)/admin/menu/DeleteButton.tsx` — `confirm()` dialog + `useTransition`
- [x] Create `src/app/(admin)/admin/menu/new/page.tsx` — breadcrumb + form
- [x] Create `src/app/(admin)/admin/menu/[id]/edit/page.tsx` — pre-fills form with existing item, validates ownership

**Done when**: Owner can add, edit, delete items; toggle availability instantly

---

### Phase 3.4 — Restaurant Profile

**Goal**: Owner can update restaurant details without developer help

Tasks:
- [x] Create `src/app/(admin)/admin/profile/ProfileForm.tsx` — client form with `useActionState`
- [x] Create `src/app/(admin)/admin/profile/page.tsx` — server component:
  - `updateProfile` server action (name, address, phone) with validation
  - Shows slug as read-only with explanation ("Slug locked after QR printed")
  - Account section: email, menu URL

**Done when**: Owner can edit name/address/phone, changes reflect on public menu

---

## Files Created

```
src/
├── app/
│   └── (admin)/
│       └── admin/
│           ├── layout.tsx          ✅
│           ├── SignOutButton.tsx    ✅
│           ├── page.tsx            ✅ (rebuilt as full dashboard)
│           ├── login/
│           │   └── page.tsx        ✅ (redesigned + role-aware redirect)
│           ├── menu/
│           │   ├── page.tsx        ✅
│           │   ├── actions.ts      ✅
│           │   ├── ItemForm.tsx    ✅
│           │   ├── ToggleButton.tsx ✅
│           │   ├── DeleteButton.tsx ✅
│           │   ├── new/
│           │   │   └── page.tsx    ✅
│           │   └── [id]/edit/
│           │       └── page.tsx    ✅
│           └── profile/
│               ├── page.tsx        ✅
│               └── ProfileForm.tsx ✅
```

---

## Notes

- `zod` added as dependency for server-side form validation
- `sortOrder` field added to `MenuItem` schema for future drag-and-drop ordering
- `phone` and `onboardingComplete` fields added to `Restaurant` schema
- Server actions use `revalidatePath("/admin/menu")` so list refreshes without full navigation
- `useOptimistic` used for availability toggle — UI responds instantly, server confirms in background

---

## Definition of Done

All Spec 0003 acceptance criteria met ✅
