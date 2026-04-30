# Spec 0001 — Project Setup & Static Menu Display

**Status**: ✅ Implemented  
**Priority**: Must  
**Phase**: 1 of 4  
**Created**: 2026-04-27  
**Completed**: 2026-04-30  
**Author**: Lion (Hima Tech)

---

## Problem Statement

A restaurant client needs a digital menu that customers can access by scanning a QR code. The MVP must show menu items with images and prices. No app download required.

---

## Goals

1. Initialize Next.js 14 project with correct dependencies
2. Set up MongoDB + Prisma schema for Restaurant, MenuItem, User
3. Create the public menu page: `/menu/[slug]`
4. Display menu items grouped by category with image, name, price (TZS)
5. Generate a QR code per restaurant pointing to their menu URL
6. Basic admin login page (NextAuth)

---

## Non-Goals (deferred to later specs)

- AR viewer (Spec 0002)
- Full admin CRUD dashboard (Spec 0003)
- Azampay payments (Spec 0004)
- Multi-tenant billing

---

## User Stories

**As a customer**, I want to scan a QR code and immediately see the restaurant menu so I can decide what to order without asking a waiter.

**As a restaurant owner**, I want to log into an admin panel and see my restaurant's menu URL and QR code so I can print and place it on tables.

---

## Acceptance Criteria

- [x] `npm run dev` starts with no errors
- [x] Prisma schema has `Restaurant`, `MenuItem`, `User` models
- [x] `/menu/[slug]` renders menu items from database, grouped by category
- [x] Each item shows: image, name, description, price in TZS
- [x] `/admin/login` works with NextAuth email/password
- [x] `/admin` (protected) shows restaurant QR code as downloadable PNG
- [x] QR code points to the correct `/menu/[slug]` URL
- [x] Page is mobile-responsive and usable on low-end Android

---

## Technical Notes

- Use `qrcode` package to generate QR PNG on the server
- Seed the database with 1 test restaurant + 5 menu items for development
- Menu items must have an `available` boolean — hide unavailable items
- Use Next.js server components for menu page (no client JS needed for static display)
- HeroUI for UI components, Tailwind for layout

---

## Out of Scope

- 3D models
- Payment
- Multiple restaurant owners
