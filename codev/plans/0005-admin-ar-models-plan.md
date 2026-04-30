# Plan 0005 — Admin-Managed AR 3D Models

**Spec**: `codev/specs/0005-admin-ar-models.md`  
**Status**: Ready (starts after Plan 0002 AR viewer complete)  
**Estimated time**: 1–2 weeks  
**Created**: 2026-04-30

---

## Overview

This plan solves the hardest UX problem in Smart Menu: restaurant owners cannot make 3D models, but AR is the product's key differentiator. The solution is a two-sided workflow — restaurant owners request models, Hima Tech admin fulfils them from a shared library.

---

## Phase Breakdown

### Phase 5.1 — Schema & File Storage Setup (Day 1)

**Goal**: DB ready for models, Vercel Blob configured

Tasks:
- [ ] Add `ARModel`, `ARAssignment`, `ARRequest` models to `prisma/schema.prisma`
- [ ] Add `arStatus String @default("none")` to `MenuItem`
- [ ] Run `npx prisma db push && npx prisma generate`
- [ ] Install `@vercel/blob` package
- [ ] Add `BLOB_READ_WRITE_TOKEN` to `.env.local` (from Vercel dashboard)
- [ ] Create `src/lib/blob.ts` — `uploadModel(file, modelId)` → returns Blob URL
- [ ] Seed 2–3 sample `.glb` food models from Poly Pizza into `public/models/` for local dev testing

**Done when**: Schema pushed, blob helper compiles without errors

---

### Phase 5.2 — Admin Model Library (Day 2–3)

**Goal**: Admin can upload, preview, tag, and publish 3D models

Tasks:
- [ ] Create `src/app/(superadmin)/superadmin/ar-models/page.tsx`:
  - List all `ARModel` records: thumbnail (model-viewer poster), name, tags, size, published toggle, assigned count
  - "Upload new model" button → opens upload form
  - Search bar filters by name/tags (client-side filter over fetched list)
- [ ] Create `src/app/(superadmin)/superadmin/ar-models/new/page.tsx` — upload form:
  - File input (`.glb` only, `accept=".glb"`)
  - Show file size immediately on select (client-side `file.size / 1024` → KB)
  - Show amber warning if > 5 MB, red block if > 8 MB
  - `<model-viewer>` preview renders the selected file using `URL.createObjectURL(file)` (client component, no upload yet)
  - Name field, tags field (comma-separated)
  - Submit → `POST /api/superadmin/ar-models` → uploads to Vercel Blob, creates `ARModel` (unpublished)
- [ ] Create `src/app/api/superadmin/ar-models/route.ts` (POST):
  - Auth: superadmin only
  - Validate file is `.glb`, size ≤ 8 MB
  - Upload to Vercel Blob: `await put(\`ar-models/${id}/model.glb\`, file, { access: "public" })`
  - Create `ARModel` record with blob URL and size
- [ ] Create `src/app/api/superadmin/ar-models/[id]/route.ts` (PATCH):
  - Toggle `isPublished`, update name/tags
- [ ] Client component `src/components/ModelPreview.tsx`:
  ```tsx
  // Wraps @google/model-viewer — dynamic import with ssr: false
  // Props: src (URL or object URL), height (default 200px)
  // Shows spinner while loading, error text if load fails
  ```

**Done when**: Admin can upload a `.glb`, see it rotate in a preview, set tags, and publish it to the library

---

### Phase 5.3 — Restaurant AR Request Flow (Day 3–4)

**Goal**: Restaurant owner can request AR for any dish, or self-serve from library

Tasks:
- [ ] Update `src/app/(admin)/admin/menu/page.tsx` — each item row/card gets:
  - AR status badge (`No AR` grey / `Pending` amber / `3D Ready ✓` green)
  - "Request AR model" button (visible only on Professional/Business plans, hidden on Starter with upgrade prompt)
- [ ] Create `src/app/(admin)/admin/menu/[id]/ar-request/page.tsx`:
  - Step 1: "Browse library" — show all published `ARModel` records in a searchable grid with model-viewer thumbnails
    - If match found: "Use this model" button → creates `ARAssignment` directly, sets `arStatus = "assigned"` (no admin needed)
  - Step 2: If no match → "Request custom model" form with optional description text → creates `ARRequest`
  - After submit: success screen — "We'll notify you when your model is ready (within 48 hours)"
- [ ] Create `src/app/api/admin/ar-request/route.ts` (POST):
  - Auth: restaurant owner, Professional/Business plan only
  - Create `ARRequest` (status: "pending")
  - Update `MenuItem.arStatus = "pending"`
  - Send internal notification email to admin: "New AR request from [Restaurant Name] for [Dish]"
- [ ] Create `src/app/api/admin/ar-assign/route.ts` (POST):
  - For self-service library assignment (restaurant → picks from library)
  - Creates `ARAssignment`, sets `MenuItem.arStatus = "assigned"`, updates `glbUrl` on `MenuItem`

**Done when**: Restaurant owner can request a model and see "Pending" badge on their item

---

### Phase 5.4 — Admin Fulfilment Queue (Day 4–5)

**Goal**: Admin sees all pending requests in priority order and can assign models in one click

Tasks:
- [ ] Create `src/app/(superadmin)/superadmin/ar-requests/page.tsx`:
  - Table columns: Restaurant, Plan (badge: Business / Professional), Dish name, Owner's description, Date requested, Status, Actions
  - Default sort: Business first → Professional → oldest
  - Status filter: All / Pending / In Progress / Done / Rejected
  - "Assign model" action → opens a modal
- [ ] Assignment modal (client component):
  - Search the model library by name/tag
  - Shows model-viewer preview for each result
  - "Assign" button → calls `PATCH /api/superadmin/ar-requests/[id]/assign`
- [ ] Create `src/app/api/superadmin/ar-requests/[id]/assign/route.ts` (PATCH):
  - Body: `{ modelId }`
  - Creates `ARAssignment` (modelId → menuItemId)
  - Sets `MenuItem.arStatus = "assigned"` and `MenuItem.glbUrl = model.filePath`
  - Sets `ARRequest.status = "done"`
  - Sends notification to restaurant owner (email + WhatsApp if Business plan):
    > "Great news! The 3D model for [Dish Name] is ready. Your customers can now view it in AR."
- [ ] Create `PATCH /api/superadmin/ar-requests/[id]/status` for marking "in_progress" or "rejected" with note
- [ ] "Upload + assign" shortcut: from the request page, admin can upload a new model AND immediately assign it to the requesting item in one flow

**Done when**: Admin can see pending requests, pick a library model, assign it in < 30 seconds, and the restaurant menu immediately shows the AR viewer

---

### Phase 5.5 — Public Menu AR Integration (Day 5–6)

**Goal**: AR viewer appears on menu page automatically once a model is assigned

Tasks:
- [ ] Update `menu/[slug]/page.tsx`:
  - If `item.glbUrl` is set → show `3D` badge on the item card
  - Tapping the card opens `MenuItemModal` (from Spec 0002) with AR viewer
  - If `item.glbUrl` is null → no AR badge, modal shows image only
- [ ] Graceful fallback in `ARViewer` component:
  - If `@google/model-viewer` fails to load (old browser, no WebGL) → show dish image with "3D not supported on this device" text
  - If model fails to load (network error, corrupt file) → show dish image, log error silently
- [ ] Add `loading="lazy"` and `poster={item.imageUrl}` to model-viewer so users see the image immediately while the model streams
- [ ] Test on a real low-end Android device with a model ≤ 5 MB:
  - [ ] Check load time on 4G
  - [ ] Check load time on 3G (throttle in DevTools)
  - [ ] Verify AR button appears in Chrome Android
  - [ ] Verify graceful fallback on desktop Firefox

**Done when**: Tapping a dish with an assigned model shows it rotating in 3D; AR mode launches on Android Chrome

---

## File Structure After Phase 5

```
src/
├── app/
│   ├── (admin)/
│   │   └── admin/
│   │       └── menu/
│   │           └── [id]/
│   │               └── ar-request/
│   │                   └── page.tsx
│   ├── (superadmin)/
│   │   └── superadmin/
│   │       ├── ar-models/
│   │       │   ├── page.tsx
│   │       │   └── new/
│   │       │       └── page.tsx
│   │       └── ar-requests/
│   │           └── page.tsx
│   └── api/
│       ├── admin/
│       │   ├── ar-request/
│       │   │   └── route.ts
│       │   └── ar-assign/
│       │       └── route.ts
│       └── superadmin/
│           ├── ar-models/
│           │   ├── route.ts
│           │   └── [id]/
│           │       └── route.ts
│           └── ar-requests/
│               └── [id]/
│                   ├── assign/
│                   │   └── route.ts
│                   └── status/
│                       └── route.ts
├── components/
│   └── ModelPreview.tsx
└── lib/
    └── blob.ts
```

---

## Admin Workflow Summary

```
Restaurant owner clicks "Request AR model"
        │
        ▼
Browse library → match found?
  Yes → self-assign → AR live immediately
  No  → submit request → status = "pending"
        │
        ▼
Admin sees request in /superadmin/ar-requests queue
        │
  Sources model (Poly Pizza / Sketchfab / custom)
  Runs: npx gltf-transform optimize input.glb output.glb
  Confirms file < 5 MB
        │
        ▼
Admin uploads to library → previews in 3D → publishes
        │
        ▼
Admin assigns model to request
        │
        ▼
MenuItem.glbUrl updated → AR viewer live on menu page
Restaurant owner notified via email + WhatsApp
```

---

## Tools Admin Needs (not in the app)

| Tool | Purpose | How to get |
|------|---------|------------|
| `gltf-transform` | Compress & optimise `.glb` | `npm i -g @gltf-transform/cli` |
| Blender (optional) | Create or edit 3D models | Free, blender.org |
| Poly Pizza | Free CC0 food models | poly.pizza |
| Sketchfab | More food models (check license) | sketchfab.com/features/free-3d-models |

---

## Definition of Done

1. Restaurant owner (Professional plan) can request a model and see "Pending" status
2. Admin sees the request in the queue, uploads a compressed model, assigns it
3. Public menu page shows AR button for that item within 1 minute of assignment
4. Model loads in < 5 seconds on 3G (simulated)
5. Graceful fallback works on desktop and old Android
6. All spec acceptance criteria checked off
