# Spec 0006 — Owner Experience Improvements

## Problem

The current admin dashboard is functional but missing several critical features that restaurant owners need for day-to-day operations. Key gaps:

1. **Image upload** — owners must paste a URL; there is no real file upload
2. **Menu organisation** — no way to reorder items or categories
3. **Table QR codes** — Business plan advertises per-table QR but it is not built
4. **Staff accounts** — only one login per restaurant; waiters/managers need separate logins
5. **Daily specials** — no way to schedule availability (e.g. lunch only, weekends only)
6. **Customer-facing improvements** — menu has no search, allergen tags, or dietary filters
7. **Notifications** — owner gets no alert when trial expires, payment fails, or menu is suspended
8. **Branches page** — the Branches section exists in code but is incomplete and not linked in nav

---

## Goals

- Owner can manage everything from the dashboard without touching code or URLs
- Business plan features that are advertised (table QR, branches, branding) actually work
- Owner is notified by email/SMS before anything bad happens (trial ending, suspension)
- Customers get a better menu experience (search, filters, dietary tags)

---

## Features in scope

### F1 — Image upload (replace URL input)
- Drag-and-drop or file picker on Add/Edit item form
- Uploads to Vercel Blob, stores URL in DB
- Shows thumbnail preview before save
- Restrict: JPG/PNG/WebP only, max 5 MB

### F2 — Menu item ordering
- Drag-to-reorder items within a category (uses `sortOrder` field already in schema)
- Drag-to-reorder categories themselves
- Save order persists immediately (optimistic update)

### F3 — Table QR codes (Business plan)
- Owner defines table numbers (e.g. Table 1–20)
- Each table gets a unique QR: `/menu/[slug]?table=3`
- Menu page shows table number if present
- Owner can download all table QRs as a ZIP or PDF

### F4 — Staff accounts
- Owner can invite staff (waiter, manager roles) from profile page
- Staff login at `/admin/login` — redirected to limited dashboard
- Waiter: can only toggle availability, cannot edit prices or delete
- Manager: same as owner except cannot manage billing

### F5 — Availability scheduling
- Per item: "Available during" time range (e.g. 11:00–15:00 for lunch items)
- Per item: "Available on" days (Mon–Fri, Weekends, Every day)
- Menu page automatically hides unavailable items by schedule

### F6 — Customer menu improvements
- Search bar on `/menu/[slug]` page
- Dietary tags: Vegan, Vegetarian, Halal, Spicy, Contains nuts (set per item in admin)
- Filter chips on menu page by tag
- Show "Kitchen closed" banner if all items are scheduled unavailable

### F7 — Email notifications
- 7 days before trial ends: reminder email
- 1 day before trial ends: urgent email with upgrade link
- When payment fails: immediate email
- When account reinstated: confirmation email
- Use Resend (already configured)

### F8 — Branches management (Business plan)
- Complete the `/admin/branches` page that exists but is empty
- Owner can add branches with separate address, phone, slug
- Each branch has its own menu (inherits parent) or fully separate menu
- Each branch has its own QR code
- Superadmin can see all branches on restaurant detail page

---

## Out of scope (future)

- Online ordering / cart system
- Customer reviews and ratings
- WhatsApp integration
- Loyalty points
- Integration with POS systems

---

## Priority order

1. F1 (image upload) — highest pain, affects every user every day
2. F7 (email notifications) — retention, prevents surprise suspensions
3. F2 (menu ordering) — polishes the core product
4. F6 (customer menu improvements) — direct customer impact
5. F3 (table QR) — needed to unlock Business plan value
6. F4 (staff accounts) — important for real restaurants
7. F5 (scheduling) — nice to have
8. F8 (branches) — only Business plan users

---

## Acceptance criteria

- [ ] Owner can upload an image directly from the Add/Edit item form
- [ ] Uploaded image shows in `/menu/[slug]` within 5 seconds
- [ ] Owner can reorder items by drag and the order is preserved on page refresh
- [ ] Trial ending email arrives 7 days before expiry
- [ ] Customer can search for a dish by name on the menu page
- [ ] Business-plan restaurant can create per-table QR codes and download them
