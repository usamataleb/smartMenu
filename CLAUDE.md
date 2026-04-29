# Smart Menu — Claude Code Context

## Project Overview


**Smart Menu** is a SaaS platform for restaurants. Customers scan a QR code to open a web menu, tap any food item to launch an AR viewer showing a 3D model of the dish. Restaurant owners manage everything via an admin dashboard.

**Client type**: Restaurant business (B2B SaaS)
**Builder**: Lion (Usama Talib Juma) — Hima Tech, Zanzibar, Tanzania
**Target users**: Restaurant owners + their customers

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + HeroUI |
| Database | SQLite via Prisma |
| Auth | NextAuth.js |
| AR Viewer | `@google/model-viewer` (WebXR, no app needed) |
| 3D Assets | `.glb` format (free from Sketchfab / Poly Pizza) |
| QR Generation | `qrcode` npm package |
| Payments | Azampay (mobile money, TZS) |
| Hosting | Vercel |

---

## Development Protocol: SPIR

This project follows the **SPIR protocol**:
- **S**pecify → write a spec in `codev/specs/`
- **P**lan → break into phases in `codev/plans/`
- **I**mplement → build the code, write tests
- **R**eview → capture lessons in `codev/reviews/`

**Always read the relevant spec and plan before implementing any feature.**

---

## Project Structure

```
smart-menu/
├── codev/
│   ├── specs/          # Feature specifications (source of truth)
│   ├── plans/          # Implementation plans per spec
│   ├── reviews/        # Lessons learned after each phase
│   └── resources/      # Reference docs, decisions, context
├── src/
│   ├── app/            # Next.js App Router pages
│   │   ├── (customer)/ # Public menu & AR viewer routes
│   │   ├── (admin)/    # Restaurant owner dashboard
│   │   └── api/        # API routes
│   ├── components/     # Shared UI components
│   ├── lib/            # Prisma, auth, utils
│   └── types/          # TypeScript types
├── prisma/
│   └── schema.prisma
├── public/
│   └── models/         # .glb 3D model files
├── CLAUDE.md           # This file
└── AGENTS.md           # General agent instructions
```

---

## Key Business Rules

1. Each restaurant gets a unique QR code → unique slug URL (e.g. `/menu/zanzibar-pizza`)
2. Menu items have: name, description, price (TZS), category, image, `.glb` model URL, availability toggle
3. AR viewer launches on mobile when customer taps an item (falls back to image on desktop)
4. Admin panel is protected by NextAuth — restaurant owner logs in with email/password
5. Multi-tenant: one deployment serves multiple restaurants (identified by slug)
6. Currency is always TZS (Tanzanian Shilling)

---

## Database Models (Prisma)

```
Restaurant → has many MenuItems, has one Owner (User)
MenuItem   → belongs to Restaurant, has name/price/description/glbUrl/imageUrl/category/available
User       → is Owner of Restaurant, has email/password (hashed)
QRCode     → belongs to Restaurant, has url/slug
```

---

## Current Phase

**Phase 1** — Project setup + static menu display + QR generation
See: `codev/specs/0001-project-setup.md` and `codev/plans/0001-project-setup-plan.md`

---

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npx prisma studio    # Database GUI
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma db push   # Push schema to MongoDB
```

---

## Notes for AI Agents

- Always use **TZS** for currency, not USD
- Mobile-first: all UI must work on low-end Android phones
- When generating QR codes, point to `/menu/[slug]` route
- `.glb` model files go in `public/models/` for local dev, CDN for production
- Do not install unnecessary dependencies — keep the bundle lean
- Prefer server components unless client interactivity is required
