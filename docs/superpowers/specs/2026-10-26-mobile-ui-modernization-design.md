# RC Customer Mobile UI Modernization — Design

**Date:** 2026-10-26 · **Branch base:** `feat/ui-responsive-refactor` · **Status:** approved; decisions confirmed (see §5)

## 1. Goal

Make the customer app look modern and feel consistent **while keeping its identity** (green brand, floating pill tab bar, card-on-grey layout), without making it heavier or slower. The app must stay usable on low-end Android phones and on unstable connections.

Scope is a **full screen-by-screen pass** over all 14 screens, plus the missing order states the audit found. Light mode only.

## 2. Non-goals

- Dark mode (lock the app to light; revisit later).
- Google sign-in (removed from the login screen; `TODO(google-auth)` marks the spot).
- New dependencies. Reanimated and `expo-linear-gradient` are already installed; nothing is added.
- Backend changes. Every behaviour fix below has a frontend-only route (see §5).
- iOS verification. Only an Android phone (SM-A057F, Expo Go) is available; iOS gets a checklist, not a sign-off.

## 3. Performance budget (hard constraints)

| Rule | Why |
|---|---|
| Bundled raster assets referenced by the app ≤ **1.5 MB** (today **5.5 MB**) | Decode memory and install size on weak devices |
| Remote dish images are thumbnails, with a placeholder and no layout shift | Slow or flaky networks |
| Animate only with Reanimated, only `opacity`/`transform`, press feedback and simple transitions | Keeps work on the UI thread |
| No blur. At most one gradient, never behind scrolling content | Expensive on budget GPUs |
| Lists are `FlatList` with `keyExtractor`; shadows on repeated rows stay at `elevation ≤ 2` | Scroll smoothness |
| Every loading, empty and error state is designed (skeleton, message, retry) | Unstable connections are normal, not an edge case |
| One font family, three weights, loaded once at the root | Today fonts load only on the onboarding screens, so signed-in users get the system font |

## 4. Audit evidence (measured 2026-10-26)

**Contrast (WCAG AA needs 4.5:1 for text):**

| Pair today | Ratio |
|---|---|
| White label on the green button (`#ffffff` on `#69bf70`) | **2.26** |
| Green heading text on white / on the grey page | **2.26 / 2.07** |
| `subtle` grey `#999999` on white | 2.85 |
| `danger` `#d9534f` on white (and white on a danger button) | 3.96 |

**Styling that bypasses the theme** (hard-coded colours / font sizes): `orderStatus` 26/14, `pendingPayments` 9/7, `cart` 8/7, `profile` 7/6, `home` 7/3, `tabBarButton` 5/2, `flatList` 6/3.

**Type:** two web-font families (Raleway, Nunito) load only inside `onboarding` and `welcome`; every other screen renders in the system font.

**Heavy assets (all referenced):** `propic.png` 927 KB, `vegBack.jpg` 748 KB, `swiperImages/image1.png` 669 KB, `nonVegBackground.jpeg` 646 KB, `cart.png` 615 KB, `pendPay.png` 429 KB. Nine unreferenced files (≈1.45 MB) sit in `assets/`.

**Behaviour gaps found on the device** (all verified, not assumed):

| Gap | Cause |
|---|---|
| A `delivering` order vanishes from Orders | `getUndeliveredOrdersToday` filters `pending,preparing` |
| Delivered-paid, completed, cancelled orders are visible nowhere | `getOrderHistory` exists but no screen uses it |
| `delivery_failed` is flagged unpaid but absent from Payments, while checkout still blocks | Checkout counts all `payment_status='unpaid'`; Payments lists `delivered` + unpaid only |
| Checkout message says "more than two" but blocks at two | Backend uses `>= 2` |
| `preparing` orders show Edit/Cancel; the backend refuses, the app says "Please try again", and the dialog stays open | No status gating, no error mapping |
| No-area users can fill a cart, then get a bare "Customer area not found" | Error falls through to the generic handler |
| Payments "Date" shows `created_at`, not the meal date | `pendingPayments.screen.tsx:55` |

**Dev-only noise (not product bugs):** the dark "Login failed: {…}" toast and the red full-screen overlay are React Native's LogBox, triggered by `console.error` for expected API errors. They block taps in development only.

## 5. Decisions (all three confirmed by the product owner on 2026-10-26: D1 = A, D2 = Nunito, D3 = History screen from Orders)

- **D1 — Label colour on green fills.** *(Phase 1, confirm on device.)* **A (default):** keep the `#69bf70` fill, use dark ink labels (8.73:1). **B:** darken the fill to `#2E7D32` with white labels (5.13:1) and keep `#69bf70` as an accent. A preserves the identity; B keeps white-on-green.
- **D2 — Typeface.** *(Phase 1.)* **Default:** Nunito 400/600/700 only, loaded once at the root; drop Raleway. Alternative: system font only (fastest, least brand).
- **D3 — Order history.** *(Phase 5.)* **Default:** a new "History" screen reached from Orders (not a sixth tab), using the existing `getOrders({ type: 'all' })` route. The Payments fix uses `type=all&payment_status=unpaid`, which the backend already supports, so no backend change is needed.

## 6. Success criteria

1. Every text/background pair in the theme ≥ 4.5:1, enforced by a jest test.
2. Referenced raster assets ≤ 1.5 MB, measured by `scripts/asset-weight.sh`.
3. Janky-frame % on Home scroll, Orders and Payments no worse than the Phase-1 baseline on the SM-A057F.
4. `npx tsc --noEmit` stays at 0 errors; `npx jest` stays green (baseline 18 suites / 175 tests) and grows.
5. No hard-coded colour or font size remains in `screens/` or `components/` (a grep check, listed in Task 25).
6. Every status in §4's table is visible in the app and distinguishable at a glance.
