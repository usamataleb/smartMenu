# Spec 0005 — Admin-Managed AR 3D Models

**Status**: Ready for planning  
**Priority**: Should (differentiates paid tiers)  
**Phase**: 5 (runs parallel to Phase 4 after Phase 2 complete)  
**Created**: 2026-04-30  
**Author**: Lion (Hima Tech)

---

## Problem Statement

Restaurant owners need a way to attach 3D models to menu items so customers can view food in AR. However:

1. **Creating 3D models is hard** — restaurant owners are not designers. Asking them to produce `.glb` files is unrealistic.
2. **Heavy models break on cheap phones** — a raw 3D model from Sketchfab can be 20–80 MB. A Tecno Spark on 3G will time out before it loads.
3. **Model quality is inconsistent** — a badly made model is worse than no model at all. It makes the restaurant look unprofessional.

**The solution**: Hima Tech (the admin / operator) acts as the 3D model manager. Restaurant owners request which dishes they want in AR. The admin sources or creates the models, optimises them for mobile, and attaches them to the restaurant's menu items. Restaurants never touch a `.glb` file.

---

## Goals

1. A shared **model library** of optimised food 3D models that any restaurant can use (e.g. a "Pilau Rice" model works for all restaurants that sell pilau)
2. Admin panel for Hima Tech to **upload, tag, optimise, and assign** models to menu items
3. Restaurant owners can **request** a 3D model for a specific item from their admin panel (triggers a task for Hima Tech)
4. Model file size is **enforced under 5 MB** before being assigned — displayed as a warning if over limit
5. A **preview tool** so admin can see the model before assigning it
6. Restaurant owners can see which of their items have AR enabled vs. pending vs. not available
7. Model library is **searchable by food category and name** (e.g. search "rice" shows 3 model options)

---

## Non-Goals

- AI-generated 3D models (future — needs GPU pipeline)
- Customer-uploaded models
- Table-surface calibration / occlusion (advanced ARCore feature)
- Animated models (static `.glb` only for now)

---

## User Stories

### Restaurant Owner
- I want to click "Request 3D model" on any of my menu items so Hima Tech knows I want AR for that dish.
- I want to see a "3D Ready" badge on items that already have a model, and "Pending" on ones I've requested.
- I want to pick from an existing model library if a matching dish already has one, so I don't have to wait.

### Hima Tech Admin
- I want to upload a `.glb` file, set its name and food tags, and see its file size before publishing it to the library.
- I want to see a live 3D preview of the model in the admin panel before assigning it.
- I want to assign a library model to a specific menu item with one click.
- I want to see a queue of all pending model requests from restaurants, sorted by plan tier (Business first).
- I want to be alerted if a model file is over 5 MB so I can compress it before assigning.

---

## Model Optimisation Requirements

| Constraint          | Target      | Reason |
|---------------------|-------------|--------|
| File size           | ≤ 5 MB      | Loads in < 3s on 3G (1 Mbps effective) |
| Polygon count       | ≤ 50,000    | Smooth on Tecno/Itel low-end Android GPU |
| Texture resolution  | ≤ 1024×1024 | Sufficient for a 6-inch screen view |
| Format              | `.glb`      | Single binary, no external texture files |
| Compression         | Draco       | ~60–70% size reduction with no visible quality loss |

**Toolchain for admin**: [gltf-transform](https://gltf-transform.dev/) CLI — `npx gltf-transform optimize input.glb output.glb --texture-compress webp`

---

## Database Schema Additions

```prisma
model ARModel {
  id          String       @id @default(cuid())
  name        String
  tags        String       // comma-separated: "rice,pilau,tanzanian"
  filePath    String       // Vercel Blob URL
  fileSizeKB  Int
  isPublished Boolean      @default(false)
  uploadedBy  String       // adminId
  createdAt   DateTime     @default(now())
  assignments ARAssignment[]
}

model ARAssignment {
  id         String   @id @default(cuid())
  modelId    String
  menuItemId String   @unique
  assignedBy String   // adminId
  assignedAt DateTime @default(now())
  model      ARModel  @relation(...)
  menuItem   MenuItem @relation(...)
}

model ARRequest {
  id           String   @id @default(cuid())
  menuItemId   String   @unique
  restaurantId String
  status       String   // pending | in_progress | done | rejected
  note         String?  // restaurant owner's description of the dish
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  menuItem     MenuItem @relation(...)
  restaurant   Restaurant @relation(...)
}
```

**MenuItem change**: add `arModelId String?` (optional relation to `ARAssignment`) and `arStatus String @default("none")` — `"none" | "pending" | "assigned"`.

---

## Acceptance Criteria

### Restaurant Owner (admin panel)
- [ ] Each menu item card shows AR status badge: `No AR` / `Pending` / `3D Ready ✓`
- [ ] "Request 3D Model" button on any item without AR (only for Professional/Business plans)
- [ ] Request form: optional text field "Describe this dish" (helps admin find the right model)
- [ ] "Browse model library" button — opens a modal showing all published library models with search
- [ ] Restaurant can self-assign a library model to their item if a match exists (no admin needed)
- [ ] Once assigned, item shows `3D Ready ✓` and AR viewer is live on the public menu

### Hima Tech Admin (superadmin panel)
- [ ] `/superadmin/ar-models` — model library list: name, tags, size, preview, assigned count, publish status
- [ ] Upload form: `.glb` file upload, name, tags, file size shown immediately
- [ ] Size warning displayed if file > 5 MB (blocks publishing until resolved)
- [ ] `<model-viewer>` preview embedded in the upload form (client component)
- [ ] `/superadmin/ar-requests` — queue of pending requests:
  - Restaurant name, dish name, plan tier, date requested
  - Sorted by: Business → Professional → date
  - Action: "Assign model" (pick from library) or "Mark as in progress" or "Reject with note"
- [ ] Assigning a model to a request: picks from library, creates `ARAssignment`, updates `ARRequest.status = "done"`, updates `MenuItem.arStatus = "assigned"`
- [ ] Admin can upload a new model directly from the request detail page

---

## Technical Notes

- **Model storage**: Vercel Blob — path `ar-models/{id}/{filename}.glb`
- **Preview**: Use `@google/model-viewer` (already in Spec 0002) in the admin upload form — `<model-viewer src={blobUrl} camera-controls />`
- **File size check**: read `file.size` on the client before upload; also validate server-side in the API route
- **Draco compression**: Admin runs `gltf-transform` locally before uploading — do not compress server-side in MVP (too heavy for Vercel functions)
- **Search**: Simple SQL `LIKE %tag%` on the `tags` column — no full-text index needed at this scale
- **Notification**: When admin assigns a model to a request, send a WhatsApp/email to the restaurant owner: "Your 3D model for [Dish Name] is ready!"
- **Free model sources**: [Sketchfab](https://sketchfab.com/features/free-3d-models) (CC license), [Poly Pizza](https://poly.pizza) — admin must verify license before adding to library

---

## Risks

| Risk | Mitigation |
|------|-----------|
| Restaurant owner expects instant AR after requesting | Set expectation: "We'll add your model within 48 hours" (shown on request confirmation) |
| Model file too large slips through | Server-side size validation rejects > 8 MB; client warns at > 5 MB |
| Admin library grows unmanageable | Tags + search handle up to ~500 models; beyond that, add category filter |
| `model-viewer` web component breaks on some browsers | Graceful fallback: show dish image if WebXR / model-viewer fails to load |
| License issue with Sketchfab model | Admin checklist on upload form: "I confirm this model is CC-licensed or original" |
