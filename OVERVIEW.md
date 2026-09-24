# RC Frontend-Customer — Overview

RC is a food-delivery platform: this customer-facing app, a delivery-driver app, an admin console, and a backend of microservices. This file is a brief orientation for anyone (including a future Claude Code session) opening this repo on its own, without the rest of the project's context. Full detail lives in the RC root: `../GO-LIVE-PLAYBOOK.md` and `../AWS-INFRASTRUCTURE-PLAYBOOK.md`.

## What this repo is

An Expo/React Native app (file-based routing via `expo-router`) — the app customers use to browse the menu, order, track status, and manage their profile. **`main` is the branch to use here** — it's already ahead of `origin/dev`, which is missing most of the real service-integration code found on `main`.

## Current status: the most complete of the two mobile apps

Built against real backend APIs already:
- Onboarding, auth (login/signup/forgot-password)
- Home/menu browsing — real data from menu-service, veg/non-veg grouping, refresh-on-focus
- Cart — Redux Toolkit (`cartSlice`), submits real orders
- Order status/tracking — real fetch + cancel
- Pending payments — real API
- Profile — recently fixed a stale-user-on-account-switch bug via a new `useAuth` hook

Still a stub: **Notifications** screen — hardcoded fake array, no backend call.

**Known bug**: `app/_layout.tsx` has an `isLoggedIn` state that's never set to `true` — the actual login→tabs transition happens via ad hoc `router.replace` calls from individual screens, not through this root-level gate. Worth fixing rather than relying on the ad hoc redirects long-term.

## Backend it talks to

`user-service` (auth), `menu-service` (browsing), `order-service` (cart/orders/status) — see `../Backend/OVERVIEW.md` for what's actually built there. Currently pointed at local/dev URLs; needs environment/build-profile updates before a production build against the deployed AWS API.

## Deployment direction

Ships to the App Store and Google Play via **EAS Build** (free tier covers this app's build volume). Cash-on-delivery only at launch — no payment gateway integration in this app. See `../GO-LIVE-PLAYBOOK.md` for the account setup (Apple/Google) and timeline.
