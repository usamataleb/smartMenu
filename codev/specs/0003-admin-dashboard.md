# Spec 0003 — Admin Dashboard (Full CRUD)

**Status**: Pending (starts after Spec 0002 complete)  
**Priority**: Must  
**Phase**: 3 of 4  
**Created**: 2026-04-27  
**Author**: Lion (Hima Tech)

---

## Problem Statement

Restaurant owners need a self-service way to manage their menu — add dishes, update prices, upload 3D models, and toggle item availability — without needing a developer.

---

## Goals

1. Full CRUD for menu items (create, read, update, delete)
2. Upload or link `.glb` 3D model per menu item
3. Toggle item availability on/off instantly
4. View and re-download restaurant QR code
5. Edit restaurant profile (name, logo, contact)

---

## User Stories

**As a restaurant owner**, I want to add a new menu item with name, description, price, image, and 3D model so customers can see and AR-view it.

**As a restaurant owner**, I want to mark an item as unavailable when it's sold out, so customers don't order something I can't make.

**As a restaurant owner**, I want to download my QR code as a PDF-ready image so I can print it for tables.

---

## Acceptance Criteria

- [ ] `/admin/menu` lists all menu items with edit/delete buttons
- [ ] `/admin/menu/new` form: name, description, price (TZS), category, image upload, glb URL field, available toggle
- [ ] `/admin/menu/[id]/edit` pre-fills form with existing data
- [ ] Delete asks for confirmation before removing
- [ ] Availability toggle updates instantly (optimistic UI)
- [ ] `/admin/qr` shows QR code + download as PNG button
- [ ] `/admin/profile` lets owner update restaurant name, logo, address
- [ ] All routes are protected — redirect to login if not authenticated
- [ ] Form validation with helpful error messages

---

## Technical Notes

- Use Next.js Server Actions for form submissions (no separate API routes needed)
- Image upload: use Vercel Blob or Cloudinary free tier
- `.glb` field: URL input for MVP (upload in future iteration)
- HeroUI Table + Modal components for item list and delete confirm
- Prisma transactions for any multi-model updates
