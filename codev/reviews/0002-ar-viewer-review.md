# Review 0002 — AR Food Viewer

**Spec**: `codev/specs/0002-ar-viewer.md`  
**Plan**: `codev/plans/0002-ar-viewer-plan.md`  
**Status**: ✅ Complete  
**Date**: 2026-04-30  

---

## Lessons Learned & Technical Notes

### 1. `model-viewer` with Next.js SSR
React elements (including custom elements like web components) are processed by Next.js SSR. However, `<model-viewer>` relies extensively on browser DOM and WebXR APIs to function.
**Solution**: Wrapped the `<model-viewer>` inside a sub-component and imported it via `next/dynamic` using `ssr: false` to ensure it only initializes on the client.

### 2. Loading the Model Viewer
Instead of heavy NPM bundling for the `model-viewer` web component, we inserted a CDN module script directly into the main `<Script />` within `layout.tsx`. This avoids bundle bloat and takes advantage of Google's edge delivery.

### 3. TypeScript IntrinsicElements
Since `<model-viewer>` isn't a native React element, trying to strictly type all its properties in `declare global` within a client component proved noisy and prone to TypeScript conflicts (especially given the differences between React 18/19 custom element handling natively). We mitigated the TS errors by utilizing a `// @ts-ignore` inside the `ARViewer.tsx` where the HTML tag is directly returned. In React 19, web components are seamlessly supported at runtime without synthetic event barriers.

### 4. Interactive State Management
We refactored the previously static `MenuItemCard` into a fully standalone Client Component carrying its own `useState` for the Modal. This cleanly decentralized the modal state logic and kept the `page.tsx` strictly handling the data-fetching and layout generation.

### 5. Fallback Testing
We successfully seeded a proxy `Astronaut.glb` and image URL to test the flow instead of a custom Pizza model allowing us to verify the loading state logic, modal pop-up scaling, and integration right away.

---

## Future Polish
1. We might want to compress any custom uploaded food assets since high-poly `.glb` models can take 5+ seconds to fetch over 3G (to be managed in Spec 5 admin queue).
2. For desktop models, if the user interacts immediately (dragging), we can hide the rotating spinner smoothly.
