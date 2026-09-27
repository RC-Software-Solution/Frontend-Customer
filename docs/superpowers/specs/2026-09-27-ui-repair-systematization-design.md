# RC Customer — UI Repair & Systematization

**Date:** 2026-09-27
**Status:** Approved design, pending implementation plan
**Branch:** `feat/ui-responsive-refactor`
**Audience:** whoever implements this (likely a later Claude Code session) and the reviewer

---

## 1. Problem

The app renders acceptably on the mid-size Android used for development and breaks in
visible ways almost everywhere else: clipped tabs, content under the system bars, list
items hidden behind the floating tab bar, forms whose submit button cannot be reached,
and text that overflows its card.

A full audit (2026-09-27) found the symptoms trace to three root causes rather than
eighteen independent mistakes:

1. **No safe-area handling.** `react-native-safe-area-context` is a dependency but has
   zero imports. Seven screens fake the status bar with a hardcoded `marginTop: 70`.
   RN 0.86 / Expo SDK 57 enable Android edge-to-edge by default, so content genuinely
   draws under the system bars.
2. **The tab bar is `position: absolute` and reserves no layout space.** Screens must
   manually pad for it. Only Home does.
3. **Fixed pixel padding inside `flexDirection: 'row'` containers.** This overflows on
   every phone narrower than roughly 470dp — which is every phone.

A fourth, milder cause: two competing responsive libraries
(`react-native-responsive-dimensions`, `react-native-responsive-screen`) are installed
and mixed within single files. Both snapshot `Dimensions.get()` at module load, so
neither reacts to rotation, fold, or split-screen.

## 2. Goals

- Correct layout on portrait phones from **320dp to 930dp** wide.
- Eliminate the duplicated styling that let the drift happen, so it does not return.
- Keep the existing visual identity. This is repair and systematization, not a redesign.

## 3. Non-goals

- No new visual direction: palette, shapes and general layout intent stay as they are.
- No replacement of the floating tab bar. It is a deliberate look; it gets fixed, not
  swapped.
- No changes to `services/`, `store/`, or navigation logic. This is a view-layer change.
- No landscape or tablet layouts. `app.json` locks orientation to portrait; the
  `supportsTablet: true` flag is left alone but no tablet-specific layout is added.
- No test infrastructure. See §9 for why, and what replaces it.

## 4. Decisions

Three forks were settled before design, and each closes off a materially different plan:

| Decision | Choice | Why |
|---|---|---|
| Scope | Repair **and** systematize | Fixing the bugs without extracting shared primitives leaves the duplication that caused them. |
| Styling foundation | Plain typed theme object + `StyleSheet.create` | Zero new dependencies; matches the idiom already in the codebase. NativeWind and Unistyles were both considered and rejected as buying breakpoints this portrait-locked app does not need, at the cost of a build-step change and a full restyle. |
| Rollout | Five phases, each verified on device | Avoids a state where all eighteen screens are simultaneously unverified. Each phase is independently shippable. |

## 5. Architecture

### 5.1 The `<Screen>` primitive

Every screen needs the same four things: safe-area insets, a scroll container,
consistent horizontal gutters, and clearance for the floating tab bar. Today each
screen hand-writes them, inconsistently or not at all.

A single `<Screen>` component owns all four. Screens declare intent through props:

```tsx
<Screen scroll>          // safe area + ScrollView + gutters + tab clearance
  ...
</Screen>
```

Rejected alternatives:

- **Hooks only** (`useScreenInsets()` returning style objects, screens assemble their
  own containers). Zero indirection, but every screen still hand-writes the same five
  lines — which is precisely how the current drift occurred.
- **Bare `SafeAreaView` per screen.** Smallest diff, but addresses only the safe-area
  cause and leaves tab clearance and gutter drift untouched.

**Escape hatch.** The hook that `<Screen>` uses internally is also exported, for the two
cases the wrapper cannot serve cleanly:

- **Home** — has a floating cart FAB that must sit outside the scroll container.
- **Auth screens** — have a full-bleed image above a curved form panel, so the safe-area
  inset applies to the image, not to the content.

The abstraction is opt-in. Any screen may drop to the hook.

### 5.2 Tab-bar clearance

The tab bar publishes its own height rather than each screen guessing:

```ts
// components/tabBar/tabBar.tsx
export const TAB_BAR_HEIGHT = 76  // paddingVertical 30 + icon 25 + gap 8 + label 13
```

`<Screen>` computes `TAB_BAR_HEIGHT + space.sm + insets.bottom` and applies it as
bottom padding when passed `tabBar` — an explicit prop, not inferred from the route.
Inferring it would couple the primitive to the router and make the behaviour invisible
at the call site; five screens passing one boolean is the cheaper trade.

This is a deliberate simplification and gets a `ponytail:` comment at the definition.
A measured-height React context is the upgrade path if the bar ever becomes
variable-height; a constant is honest for a fixed-layout bar and is cheap to replace.

### 5.3 Token set

Kept deliberately small. Adding a token later is easier than auditing forty unused ones.

```ts
// theme/index.ts
color   brand · brandInk · ink · muted · bg · surface · border · danger
space   xs 4 · sm 8 · md 16 · lg 24 · xl 32
radius  sm 8 · md 12 · lg 20 · pill 999
type    h1 28 · h2 20 · body 16 · caption 14 · micro 12
```

Horizontal gutters standardize on `space.md` (16). The existing 15-versus-16 split is
arbitrary and causes a visible 1dp misalignment between the veg and non-veg sections of
the Home screen.

### 5.4 Component inventory

Five primitives. Each was chosen because it eliminates a specific class of audit finding,
not because it seemed generally useful.

| Component | Replaces | Audit findings closed |
|---|---|---|
| `<Screen>` | 7x `marginTop: 70`; 4x missing bottom padding | A1, A2 |
| `<Card>` | 4 near-identical shadow/radius blocks | gutter drift (D4) |
| `<AppButton>` | 6 button styles across 6 files | B12 |
| `<Field>` | label + input + error, hand-wired in 3 forms | B5 |
| `<AppText>` | ad-hoc `fontSize` throughout | type-scale drift |

`<AppButton>` carries three variants (`primary`, `secondary`, `danger`) and is always
full-width-within-gutters by default. The current mix of `width: '90%'` plus
`alignSelf: 'center'` plus `marginHorizontal: 16` — three declarations that fight each
other — is the bug this closes.

## 6. Responsiveness strategy

The governing rule: **flex over fixed, and never percentage combined with margin.**

- **Flex over fixed.** The Home meal-time tabs become `flex: 1` with
  `paddingHorizontal: space.sm`. This is correct at every width rather than at the
  widths that happened to get checked.
- **`useWindowDimensions()`** only where a genuine proportion is needed (the onboarding
  slide image). Unlike the two libraries being removed, it re-renders on resize.
- **`aspectRatio`** for the logo, which currently scales width on the width axis and
  height on the height axis and is therefore distorted differently on every device.
- **No percentage plus margin.** That combination produced the off-centre tab bar and
  the cart button's conflicting widths.

## 7. Phases

Ordered so no phase depends on work that has not landed. Each ends with a build, a
device run, and a commit.

### P1 — Foundation

Create `theme/` and the five primitives. **Touch no screens.**

Success criterion: the app builds and looks *identical*. A visual change here means a
primitive is wrong.

### P2 — Shell and navigation

- Add `SafeAreaProvider` at the root layout. *(A1)*
- Tab bar: replace `width: '90%'` + `marginHorizontal: 15` with `left`/`right`; anchor
  `bottom` to `insets.bottom`. *(A3)*
- Seed the indicator width from the first measured layout so the pill stops jumping on
  first render. *(D2)*
- Correct the focused-icon vertical offset. *(D3)*
- Apply tab clearance to the five tab screens. *(A2)*

### P3 — Auth and onboarding flow

Screens: onboarding, welcome-intro, login, sign-up, sign-up-second, verify.

- Remove `flex: 1` from the three `formContainer` styles. This is the fix that makes the
  signup button reachable; `flex: 1` sets `flexBasis: 0` + `flexShrink: 1`, which forces
  content to screen height and silently disables the `ScrollView`. *(B4)*
- Add `KeyboardAvoidingView`; set `softwareKeyboardLayoutMode` in `app.json`. *(A4, D7)*
- Rebuild the password eye icons as siblings inside a relative wrapper, replacing the
  hardcoded `top: 82` / `top: 152`. *(B5)*
- Onboarding: reposition the three decorative shapes; resolve the
  `paddingVertical` + fixed `height` conflict on the button; give the logo an
  `aspectRatio`. *(B10)*
- Welcome-intro: make slide content fit at 640dp; stop the pagination dots and the Next
  button from colliding. *(B11)*
- Verify screen: make the four code boxes flex so they fit at 320dp. *(D5)*

### P4 — Tab screens and cart

Screens: home, order-status, pending-payments, notifications, profile, cart.

- Home meal tabs to `flex: 1`. *(B1)*
- Home: outer `FlatList data={[1]}` becomes a `ScrollView`; the two inner `FlatList`s
  become `.map()`. Resolves the nested-VirtualizedList warning and restores scrolling.
  *(B2)*
- Home: size the cart FAB icon to its button. *(B3)*
- Order-status: delete the `flexDirection: 'row'` wrapper around the list and give the
  `FlatList` `flex: 1`. *(B6)*
- Notifications: `flex: 1` on the text container so messages wrap. *(B7)*
- Profile: convert to a scroll container. *(B8)*
- Profile: fit the avatar to its container and correct the border radius; the current
  125px image in a 109px container is clipped on Android and overflows on iOS. *(B9)*
- Cart and profile: resolve the conflicting width declarations. *(B12)*
- Popup modal: swap the confirm and cancel colours, which currently render the
  destructive action grey and the safe action brand-green. *(D1)*

### P5 — Cleanup

- Delete `screens/profile/profile-with-hook.screen.tsx` (210 lines, imported nowhere,
  carries the same bugs and will drift from the fixed copy). *(D6)*
- Fix five invalid colour values: four `#oaoaoa` (letter `o`, not zero) and one
  seven-digit `#25123EC`. These currently fall back to black. *(C)*
- Uninstall `react-native-responsive-dimensions` and `react-native-responsive-screen`.

## 8. Findings-to-phase map

Every finding from the 2026-09-27 audit is assigned. Nothing is dropped.

| Finding | Phase |
|---|---|
| A1 safe area | P2 |
| A2 tab clearance | P2 |
| A3 tab bar off-centre | P2 |
| A4 keyboard avoidance | P3 |
| A5 duplicate responsive libs | P1 new code avoids them; P3/P4 migrate existing callers; P5 uninstall |
| B1 meal tabs overflow | P4 |
| B2 nested VirtualizedList | P4 |
| B3 cart FAB icon | P4 |
| B4 form `flex: 1` | P3 |
| B5 eye icon offsets | P3 |
| B6 order-status wrapper | P4 |
| B7 notifications overflow | P4 |
| B8 profile no scroll | P4 |
| B9 profile avatar | P4 |
| B10 onboarding shapes | P3 |
| B11 welcome-intro overflow | P3 |
| B12 width conflicts | P4 |
| C invalid colours | P5 |
| D1 popup colours swapped | P4 |
| D2 tab pill jump | P2 |
| D3 focused icon offset | P2 |
| D4 gutter 15/16 | P1 define, P3/P4 apply |
| D5 verify at 320dp | P3 |
| D6 dead profile file | P5 |
| D7 keyboard layout mode | P3 |

## 9. Verification

No test infrastructure exists beyond a stub, and standing up screenshot diffing for a
one-time refactor is not worth its cost. Verification is therefore:

1. **Build check** — `npx tsc --noEmit` after each phase.
2. **Device run** — the USB-connected Android already configured for development.
3. **A narrow-screen profile** — an emulator at **320x640**.

Item 3 is load-bearing, not optional. Most findings in the audit do not reproduce on a
412dp device; verifying only on the physical dev device would miss exactly the cases
this work exists to fix.

## 10. Risks

| Risk | Mitigation |
|---|---|
| `<Screen>` does not fit Home or the auth screens | The underlying hook is exported; both are expected to use it. Identified up front rather than discovered mid-phase. |
| P1 accidentally changes appearance | P1's success criterion is *no visual change*. Any diff is a defect. |
| `TAB_BAR_HEIGHT` drifts from the real bar | Constant lives beside the style block it describes, with a `ponytail:` comment naming the context-based upgrade path. |
| Android/iOS divergence (`overflow`, `elevation`) | The known case is the profile avatar (B9); the fix removes the overflow rather than relying on `overflow: visible`, which Android ignores under `elevation`. |

## 11. Open items

None blocking. Two deferred by explicit choice:

- Tablet layouts, despite `supportsTablet: true`.
- Replacing the floating tab bar, which is being repaired rather than redesigned.
