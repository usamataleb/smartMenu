# Plan 0001 — Project Setup & Static Menu Display

**Spec**: `codev/specs/0001-project-setup.md`  
**Status**: Ready  
**Estimated time**: 1–2 weeks  
**Created**: 2026-04-27

---

## Phase Breakdown

### Phase 1.1 — Initialize Project (Day 1)

**Goal**: Working Next.js app with all dependencies installed

Tasks:
- [ ] `npx create-next-app@latest smart-menu --typescript --tailwind --app`
- [ ] Install dependencies:
  ```bash
  npm install @heroui/react framer-motion
  npm install prisma @prisma/client
  npm install next-auth
  npm install qrcode @types/qrcode
  ```
- [ ] Initialize Prisma: `npx prisma init --datasource-provider sqlite`
- [ ] Set up `.env.local` with `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- [ ] Verify `npm run dev` works

**Done when**: App runs at localhost:3000 with no errors

---

### Phase 1.2 — Database Schema (Day 1–2)

**Goal**: Prisma schema defined and pushed to SQLite

Tasks:
- [ ] Write `prisma/schema.prisma` with models:
  - `Restaurant` (id, name, slug, logoUrl, address, createdAt)
  - `MenuItem` (id, name, description, price, category, imageUrl, glbUrl, available, restaurantId)
  - `User` (id, email, passwordHash, restaurantId, role)
- [ ] Run `npx prisma db push`
- [ ] Run `npx prisma generate`
- [ ] Create seed script `prisma/seed.ts` with 1 restaurant + 5 items
- [ ] Run seed: `npx prisma db seed`

**Done when**: `npx prisma studio` shows seeded data

---

### Phase 1.3 — Public Menu Page (Day 2–3)

**Goal**: `/menu/[slug]` renders menu items from DB

Tasks:
- [ ] Create `src/app/(customer)/menu/[slug]/page.tsx`
- [ ] Fetch restaurant by slug using Prisma
- [ ] Show 404 if restaurant not found
- [ ] Fetch all available menu items for that restaurant
- [ ] Group items by `category`
- [ ] Render each item: image, name, description, price in TZS format
- [ ] Mobile-responsive layout (single column on mobile, grid on desktop)
- [ ] Style with Tailwind + HeroUI Card components

**Done when**: `localhost:3000/menu/test-restaurant` shows seeded items

---

### Phase 1.4 — Auth + Admin Login (Day 3–4)

**Goal**: Restaurant owner can log in

Tasks:
- [ ] Configure NextAuth in `src/app/api/auth/[...nextauth]/route.ts`
- [ ] Use Credentials provider with email + bcrypt password check
- [ ] Create `src/app/(admin)/admin/login/page.tsx`
- [ ] Create middleware to protect `/admin/*` routes
- [ ] Hash seed user password with bcrypt
- [ ] Test login with seed credentials

**Done when**: Login redirects to `/admin`, wrong credentials show error

---

### Phase 1.5 — QR Code Generation (Day 4–5)

**Goal**: Admin sees downloadable QR code for their restaurant

Tasks:
- [ ] Create `src/app/(admin)/admin/page.tsx` (dashboard home)
- [ ] Generate QR code server-side using `qrcode` package
- [ ] QR points to `https://[domain]/menu/[slug]`
- [ ] Render as `<img>` tag with download button
- [ ] Show restaurant name, slug, and menu URL

**Done when**: Admin page shows correct QR that scans to menu URL

---

## File Structure After Phase 1

```
src/
├── app/
│   ├── (customer)/
│   │   └── menu/[slug]/
│   │       └── page.tsx
│   ├── (admin)/
│   │   └── admin/
│   │       ├── page.tsx
│   │       └── login/
│   │           └── page.tsx
│   └── api/
│       └── auth/[...nextauth]/
│           └── route.ts
├── lib/
│   ├── prisma.ts
│   └── auth.ts
└── middleware.ts
prisma/
├── schema.prisma
└── seed.ts
```

---

## Risks

- MongoDB Atlas free tier may have connection limits — use connection pooling
- `model-viewer` is a heavy web component — do not import in Phase 1
- NextAuth v5 API differs from v4 — use v4 for stability

---

## Definition of Done

All acceptance criteria in Spec 0001 are checked off and verified on mobile browser.
