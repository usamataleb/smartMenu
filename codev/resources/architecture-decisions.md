# Architecture Decisions

## ADR-001: Use model-viewer over custom WebXR

**Decision**: Use `@google/model-viewer` instead of building a raw WebXR implementation.

**Reason**: model-viewer handles WebXR, SceneViewer (Android), and QuickLook (iOS) fallbacks automatically. Building raw WebXR would take weeks. model-viewer is battle-tested by Google, open source, and requires zero app download from the customer.

---

## ADR-002: Azampay over direct telco integration

**Decision**: Use Azampay as payment aggregator for M-Pesa/Tigo/Airtel payments.

**Reason**: Direct telco APIs (Vodacom, Tigo, Airtel) each require separate business agreements and have inconsistent APIs. Azampay aggregates all three under one API, supports TZS natively, and has good Tanzania-focused documentation. Cost is higher per transaction but saves months of integration work.

---

## ADR-003: MongoDB over PostgreSQL

**Decision**: MongoDB with Prisma ORM.

**Reason**: Menu items are document-like (flexible attributes per item type). MongoDB Atlas has a generous free tier. Lion already has experience with Prisma + MongoDB from PochiIQ. Schema can evolve without migrations.

---

## ADR-004: Next.js App Router over Pages Router

**Decision**: Use Next.js 14 App Router.

**Reason**: Server components reduce JavaScript sent to mobile browsers. Route groups `(customer)` and `(admin)` cleanly separate the two user experiences. Consistent with PochiIQ stack.

---

## ADR-005: Free stock 3D models for MVP

**Decision**: Use free `.glb` models from Poly Pizza / Sketchfab for MVP client delivery.

**Reason**: Custom Blender models take time. The goal is to prove the AR concept to the client first. Lion will create custom models in Blender post-MVP. Models can be swapped by updating the `glbUrl` in the database.
