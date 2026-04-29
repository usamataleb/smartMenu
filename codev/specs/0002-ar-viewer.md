# Spec 0002 — AR Food Viewer

**Status**: Pending (starts after Spec 0001 complete)  
**Priority**: Must  
**Phase**: 2 of 4  
**Created**: 2026-04-27  
**Author**: Lion (Hima Tech)

---

## Problem Statement

Customers want to visualize food before ordering. A 3D AR viewer that shows a realistic model of the dish will increase confidence and order conversion for the restaurant.

---

## Goals

1. Integrate `@google/model-viewer` web component for AR display
2. When a customer taps a menu item, show the 3D model in AR on mobile
3. Show a fallback image + rotation viewer on desktop (no AR)
4. Load `.glb` model files efficiently (lazy load, show spinner)
5. Sourced from free Sketchfab / Poly Pizza assets initially

---

## Non-Goals

- Custom 3D model creation (Lion will create in Blender later)
- Model upload via admin panel (Spec 0003)
- Paid model marketplace

---

## User Stories

**As a customer on mobile**, I want to tap a menu item and see a 3D version of the dish appear on my table through my camera so I know exactly what I'm ordering.

**As a customer on desktop**, I want to see a 3D model I can rotate so I still get a better view than a flat photo.

**As a restaurant owner**, I want the AR to work without my customers downloading any app.

---

## Acceptance Criteria

- [ ] `<model-viewer>` component loads a `.glb` file for a menu item
- [ ] On mobile: "View in AR" button triggers WebXR AR mode
- [ ] On desktop: 3D model is rotatable via mouse/touch
- [ ] If no `.glb` exists for an item, falls back to regular image
- [ ] Loading spinner shows while model downloads
- [ ] AR viewer opens as a bottom sheet / modal on mobile (doesn't navigate away)
- [ ] Works on Chrome Android (primary target)

---

## Technical Notes

- Install: `npm install @google/model-viewer` (or use CDN script tag)
- `model-viewer` is a web component — wrap in a client component in Next.js
- `.glb` files stored in `public/models/[item-id].glb` for MVP
- `ar` attribute enables AR mode, `camera-controls` enables rotation
- Test with free pizza model from Poly Pizza: https://poly.pizza/m/pizza
- Set `ar-modes="webxr scene-viewer"` for best Android compatibility
- Add `loading="lazy"` to avoid blocking initial page load

---

## Free 3D Model Sources

- https://poly.pizza — free `.glb` food models
- https://sketchfab.com/features/free-3d-models — filter by food category
- Download `.glb` format, place in `public/models/`
