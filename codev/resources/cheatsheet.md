# Smart Menu — Developer Cheatsheet

## Quick Commands

```bash
npm run dev                    # Start dev server
npx prisma studio              # DB GUI at localhost:5555
npx prisma db push             # Sync schema to MongoDB
npx prisma generate            # Regenerate client after schema change
npx prisma db seed             # Seed with test data
```

## Specs Status

| # | Spec | Status |
|---|------|--------|
| 0001 | Project Setup + Static Menu + QR | 🟡 In progress |
| 0002 | AR Viewer (model-viewer) | ⬜ Pending |
| 0003 | Admin Dashboard (full CRUD) | ⬜ Pending |
| 0004 | Multi-tenant SaaS + Azampay | ⬜ Future |

## Key Routes

| Route | Description |
|---|---|
| `/menu/[slug]` | Public customer menu |
| `/admin` | Owner dashboard (QR code) |
| `/admin/login` | Owner login |
| `/admin/menu` | Manage menu items (Phase 3) |
| `/admin/menu/new` | Add new item (Phase 3) |
| `/api/auth/[...nextauth]` | NextAuth handler |

## Environment Variables

```env
DATABASE_URL=mongodb+srv://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

## SPIR Protocol Reminder

1. **Specify** — write `codev/specs/XXXX-feature.md` before touching code
2. **Plan** — write `codev/plans/XXXX-feature-plan.md` with phases + tasks
3. **Implement** — build it, tick off checklist in plan
4. **Review** — write `codev/reviews/XXXX-feature-review.md` with lessons

## Key Decisions

- Currency: **TZS** always (no USD)
- 3D models: `.glb` format only
- AR: `@google/model-viewer` (no app download)
- Payments: **Azampay** (aggregates M-Pesa / Tigo / Airtel)
- Mobile-first: test on Chrome Android
