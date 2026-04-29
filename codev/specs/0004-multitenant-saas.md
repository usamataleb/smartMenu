# Spec 0004 — Multi-Tenant SaaS & Onboarding

**Status**: Future  
**Priority**: Should  
**Phase**: 4 of 4  
**Created**: 2026-04-27  
**Author**: Lion (Hima Tech)

---

## Problem Statement

To scale beyond one restaurant, the platform needs self-service onboarding so any restaurant can sign up, create their menu, and get their QR code without Lion manually setting up each account.

---

## Goals

1. Public sign-up page for new restaurants
2. Each restaurant gets isolated data (tenant separation via restaurantId)
3. Free tier: up to 10 menu items, no 3D models
4. Paid tier (via Azampay): unlimited items + AR models
5. Subscription management (activate/cancel)

---

## User Stories

**As a new restaurant owner**, I want to sign up, enter my restaurant name, and receive a QR code within 5 minutes so I can start using the platform today.

**As a paying restaurant owner**, I want to add 3D AR models to my menu items so my customers get the premium experience.

---

## Acceptance Criteria

- [ ] `/signup` page creates a new Restaurant + User in one transaction
- [ ] New restaurant gets a unique slug (auto-generated from name)
- [ ] Free tier enforced: block adding item 11+ without subscription
- [ ] Azampay payment flow for monthly subscription (TZS)
- [ ] Subscription status stored on Restaurant model
- [ ] Owner sees subscription status + renewal date in admin

---

## Technical Notes

- Azampay docs: https://docs.azampay.co.tz
- Use webhook to confirm payment and activate subscription
- Slug uniqueness: `zanzibar-pizza`, `zanzibar-pizza-2` if conflict
- Consider rate limiting sign-ups to prevent abuse
