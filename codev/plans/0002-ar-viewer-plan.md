# Plan 0002 — AR Food Viewer

**Spec**: `codev/specs/0002-ar-viewer.md`  
**Status**: ✅ Complete  
**Estimated time**: 1 week  
**Completed Date**: 2026-04-30

---

## Phase Breakdown

### Phase 2.1 — model-viewer Integration (Day 1–2)

Tasks:
- [x] Install or CDN-load `@google/model-viewer`
- [x] Create `src/components/ARViewer.tsx` as a client component
- [x] Accept `glbUrl` and `posterUrl` (fallback image) as props
- [x] Set attributes: `ar`, `camera-controls`, `ar-modes="webxr scene-viewer"`, `loading="lazy"`
- [x] Wrap in dynamic import with `ssr: false` (web component doesn't work server-side)

### Phase 2.2 — Menu Item Modal (Day 2–3)

Tasks:
- [x] Create `src/components/MenuItemModal.tsx`
- [x] Opens as bottom sheet on mobile, centered modal on desktop
- [x] Shows item name, description, price, and ARViewer component
- [x] "View in AR" button (only shown on mobile)
- [x] Close button / swipe to dismiss

### Phase 2.3 — Connect to Menu Page (Day 3)

Tasks:
- [x] Update `menu/[slug]/page.tsx` — clicking an item opens the modal
- [x] Pass `glbUrl` to ARViewer; fall back to image if null
- [x] Download 2–3 free `.glb` food models and add to `public/models/`
- [x] Update seed data with `glbUrl` paths

### Phase 2.4 — Testing (Day 4)

Tasks:
- [x] Test on Chrome Android (real device)
- [x] Test fallback on desktop
- [x] Test with item that has no glbUrl (should show image only)
- [x] Check performance — model load time under 5 seconds on 4G

---

## Definition of Done

Customer can tap a menu item, see a 3D model rotate on desktop, and launch AR on Android Chrome.
