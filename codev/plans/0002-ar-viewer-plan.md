# Plan 0002 — AR Food Viewer

**Spec**: `codev/specs/0002-ar-viewer.md`  
**Status**: Pending (after Plan 0001 complete)  
**Estimated time**: 1 week  
**Created**: 2026-04-27

---

## Phase Breakdown

### Phase 2.1 — model-viewer Integration (Day 1–2)

Tasks:
- [ ] Install or CDN-load `@google/model-viewer`
- [ ] Create `src/components/ARViewer.tsx` as a client component
- [ ] Accept `glbUrl` and `posterUrl` (fallback image) as props
- [ ] Set attributes: `ar`, `camera-controls`, `ar-modes="webxr scene-viewer"`, `loading="lazy"`
- [ ] Wrap in dynamic import with `ssr: false` (web component doesn't work server-side)

### Phase 2.2 — Menu Item Modal (Day 2–3)

Tasks:
- [ ] Create `src/components/MenuItemModal.tsx`
- [ ] Opens as bottom sheet on mobile, centered modal on desktop
- [ ] Shows item name, description, price, and ARViewer component
- [ ] "View in AR" button (only shown on mobile)
- [ ] Close button / swipe to dismiss

### Phase 2.3 — Connect to Menu Page (Day 3)

Tasks:
- [ ] Update `menu/[slug]/page.tsx` — clicking an item opens the modal
- [ ] Pass `glbUrl` to ARViewer; fall back to image if null
- [ ] Download 2–3 free `.glb` food models and add to `public/models/`
- [ ] Update seed data with `glbUrl` paths

### Phase 2.4 — Testing (Day 4)

Tasks:
- [ ] Test on Chrome Android (real device)
- [ ] Test fallback on desktop
- [ ] Test with item that has no glbUrl (should show image only)
- [ ] Check performance — model load time under 5 seconds on 4G

---

## Definition of Done

Customer can tap a menu item, see a 3D model rotate on desktop, and launch AR on Android Chrome.
