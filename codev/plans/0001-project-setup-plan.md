# Plan 0001 — Project Setup & Static Menu Display

**Spec**: `codev/specs/0001-project-setup.md`  
**Status**: ✅ Complete  
**Estimated time**: 1–2 weeks  
**Created**: 2026-04-27  
**Completed**: 2026-04-30

---

## Phase Breakdown

### Phase 1.1 — Initialize Project (Day 1)

**Goal**: Working Next.js app with all dependencies installed

Tasks:
- [x] `npx create-next-app@latest smart-menu --typescript --tailwind --app`
- [x] Install dependencies:
  ```bash
  npm install @heroui/react framer-motion
  npm install prisma @prisma/client
  npm install next-auth
  npm install qrcode @types/qrcode
  ```
- [x] Initialize Prisma: `npx prisma init --datasource-provider sqlite`
- [x] Set up `.env.local` with `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- [x] Verify `npm run dev` works

**Done when**: App runs at localhost:3000 with no errors  
**Notes**: Prisma 7 requires `@prisma/adapter-better-sqlite3` driver adapter (breaking change from v5). `src/` directory created manually after `create-next-app` (used `--no-src-dir` default).

---

### Phase 1.2 — Database Schema (Day 1–2)

**Goal**: Prisma schema defined and pushed to SQLite

Tasks:
- [x] Write `prisma/schema.prisma` with models:
  - `Restaurant` (id, name, slug, logoUrl, address, createdAt)
  - `MenuItem` (id, name, description, price, category, imageUrl, glbUrl, available, restaurantId)
  - `User` (id, email, passwordHash, restaurantId, role)
- [x] Run `npx prisma db push`
- [x] Run `npx prisma generate`
- [x] Create seed script `prisma/seed.ts` with 1 restaurant + 5 items
- [x] Run seed: `npx prisma db seed`

**Done when**: `npx prisma studio` shows seeded data  
**Notes**: Seed uses `bcryptjs` for password hashing. Seeded restaurant: `zanzibar-pizza`, owner: `owner@zanzibar-pizza.com` / `password123`.

---

### Phase 1.3 — Public Menu Page (Day 2–3)

**Goal**: `/menu/[slug]` renders menu items from DB

Tasks:
- [x] Create `src/app/(customer)/menu/[slug]/page.tsx`
- [x] Fetch restaurant by slug using Prisma
- [x] Show 404 if restaurant not found
- [x] Fetch all available menu items for that restaurant
- [x] Group items by `category`
- [x] Render each item: image, name, description, price in TZS format
- [x] Mobile-responsive layout (single column on mobile, grid on desktop)
- [x] Style with Tailwind + HeroUI Card components

**Done when**: `localhost:3000/menu/zanzibar-pizza` shows seeded items  
**Notes**: Added `CategoryTabs.tsx` client component with `IntersectionObserver` for sticky scrollable category navigation. Per-category emoji + color gradient system. Price displayed as a colored badge.

---

### Phase 1.4 — Auth + Admin Login (Day 3–4)

**Goal**: Restaurant owner can log in

Tasks:
- [x] Configure NextAuth in `src/app/api/auth/[...nextauth]/route.ts`
- [x] Use Credentials provider with email + bcrypt password check
- [x] Create `src/app/(admin)/admin/login/page.tsx`
- [x] Create middleware to protect `/admin/*` routes
- [x] Hash seed user password with bcrypt
- [x] Test login with seed credentials

**Done when**: Login redirects to `/admin`, wrong credentials show error  
**Notes**: JWT session strategy. `restaurantId` and `restaurantSlug` stored in JWT token and session. Middleware uses `withAuth` from `next-auth/middleware`.

---

### Phase 1.5 — QR Code Generation (Day 4–5)

**Goal**: Admin sees downloadable QR code for their restaurant

Tasks:
- [x] Create `src/app/(admin)/admin/page.tsx` (dashboard home)
- [x] Generate QR code server-side using `qrcode` package
- [x] QR points to `https://[domain]/menu/[slug]`
- [x] Render as `<img>` tag with download button
- [x] Show restaurant name, slug, and menu URL

**Done when**: Admin page shows correct QR that scans to menu URL  
**Notes**: QR generated as base64 data URL server-side. Download uses `<a href={dataUrl} download="slug-qr.png">`.

---

## File Structure After Phase 1

```
smart-menu/
├── src/
│   ├── app/
│   │   ├── (customer)/
│   │   │   └── menu/[slug]/
│   │   │       ├── page.tsx          ✅
│   │   │       └── CategoryTabs.tsx  ✅ (added — sticky category nav)
│   │   ├── (admin)/
│   │   │   └── admin/
│   │   │       ├── page.tsx          ✅
│   │   │       └── login/
│   │   │           └── page.tsx      ✅
│   │   ├── api/
│   │   │   └── auth/[...nextauth]/
│   │   │       └── route.ts          ✅
│   │   ├── page.tsx                  ✅ (landing page — expanded beyond original spec)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── generated/
│   │   └── prisma/                   ✅ (Prisma 7 generates here)
│   └── lib/
│       ├── prisma.ts                 ✅
│       └── auth.ts                   ✅
├── src/middleware.ts                 ✅
├── prisma/
│   ├── schema.prisma                 ✅
│   ├── seed.ts                       ✅
│   └── dev.db                        ✅
├── prisma.config.ts                  ✅ (Prisma 7 config)
└── .env.local                        ✅
```

---

## Risks (Resolved)

- ~~MongoDB Atlas free tier~~ — using SQLite (plan changed; Prisma 7 uses driver adapters)
- ~~`model-viewer` heavy~~ — not imported in Phase 1 ✅
- ~~NextAuth v5 API~~ — using v4 (`next-auth@4.24.x`) ✅

---

## Definition of Done

All acceptance criteria in Spec 0001 are checked off and verified. ✅
