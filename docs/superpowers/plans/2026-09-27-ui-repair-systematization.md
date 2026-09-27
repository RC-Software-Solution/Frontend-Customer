# RC Customer UI Repair & Systematization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every screen lay out correctly on portrait phones from 320dp to 930dp, and replace the duplicated styling that caused the breakage with a small set of shared primitives.

**Architecture:** A typed theme token module plus five presentational primitives. A `<Screen>` wrapper owns safe-area insets, scrolling, gutters and floating-tab-bar clearance, so no screen computes those again. Screens are migrated phase by phase; each phase leaves the app in a shippable state.

**Tech Stack:** React Native 0.86, Expo SDK 57, expo-router, TypeScript, `react-native-safe-area-context` (already a dependency, currently unused). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-27-ui-repair-systematization-design.md`

---

## Global Constraints

- **No new dependencies.** Two are removed in Task 18; none are added.
- **View layer only.** Do not modify `services/`, `store/`, or navigation logic.
- **Supported range:** portrait phones, **320dp–930dp** wide. Orientation stays locked to portrait.
- **Gutters are `space.md` (16)** everywhere. The existing 15/16 mix is eliminated, never reintroduced.
- **Never combine a percentage width with a horizontal margin.** This pattern caused the off-centre tab bar and the cart button conflict.
- **Brand colours are unchanged:** primary `#69bf70`, ink `#0A0A0F`.
- **No automated tests.** `npx jest` is broken (`jest-expo` cannot resolve `expo-modules-core`, and the sole test file imports a non-existent `../StyledText`). Repairing it is out of scope. Verification is the build check plus a visual criterion, both defined below.

### Verification protocol (every task)

**Build check** — run after every task, must be clean:

```bash
npx tsc --noEmit
```

**Visual check** — run on **both** device profiles. Most findings do not reproduce at 412dp; the narrow profile is where they appear.

| Profile | Purpose |
|---|---|
| Physical Android over USB (~412dp) | Regression check — nothing that worked should break |
| Emulator at **320×640** | The profile that actually surfaces the bugs |

Each task states a **pass criterion** that is falsifiable — a reviewer can answer yes or no without interpretation. If a criterion cannot be checked because the screen is unreachable, say so rather than marking the task done.

### Deviation from the spec (one, deliberate)

Spec §5.2 places `TAB_BAR_HEIGHT` in `components/tabBar/tabBar.tsx`. This plan puts it in `theme/layout.ts` instead. Reason: `<Screen>` needs the value, and importing it from `tabBar.tsx` would make every screen transitively pull in Reanimated and the expo-router navigation types. The spec's intent — one source of truth that the screens do not guess at — is preserved; only the file changes. `tabBar.tsx` imports it from `theme/layout.ts` and builds its own padding from it, so the constant and the bar cannot drift.

---

# PHASE 1 — Foundation

**Phase success criterion: the app looks *identical* after Phase 1.** These tasks add files; they change no screen. Any visible difference means a primitive is wrong.

---

### Task 1: Theme tokens and layout constants

**Files:**
- Create: `theme/index.ts`
- Create: `theme/layout.ts`

**Interfaces:**
- Produces: `color`, `space`, `radius`, `type`, `shadow` from `@/theme`; `TAB_BAR_HEIGHT`, `TAB_BAR_GAP` from `@/theme/layout`. Every later task imports from these two modules.

- [ ] **Step 1: Create `theme/layout.ts`**

```ts
// Height of the floating tab bar's own box: paddingVertical 15*2 = 30,
// icon 25, gap 8, label ~13.
//
// ponytail: a constant, not a measured value. The bar is fixed-layout, so a
// constant is honest and costs nothing to replace. If the bar ever becomes
// variable-height, publish the measured height through a React context and
// have useScreenPadding read that instead.
export const TAB_BAR_HEIGHT = 76;

// Gap between the bottom of the tab bar and the bottom safe-area inset.
export const TAB_BAR_GAP = 12;
```

- [ ] **Step 2: Create `theme/index.ts`**

```ts
export const color = {
  brand: '#69bf70',
  brandInk: '#ffffff',
  ink: '#0A0A0F',
  muted: '#666666',
  subtle: '#999999',
  bg: '#f5f5f5',
  surface: '#ffffff',
  field: '#f0f0f0',
  border: '#e6e6e6',
  danger: '#d9534f',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

export const type = { h1: 28, h2: 20, body: 16, caption: 14, micro: 12 } as const;

export const shadow = {
  card: {
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  bar: {
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
} as const;

export const theme = { color, space, radius, type, shadow };
export * from './layout';
```

- [ ] **Step 3: Build check**

Run: `npx tsc --noEmit`
Expected: clean. No screen imports these yet.

- [ ] **Step 4: Commit**

```bash
git add theme/
git commit -m "feat(ui): add theme tokens and layout constants

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: `useScreenPadding` hook and `<Screen>` component

**Files:**
- Create: `components/ui/Screen.tsx`

**Interfaces:**
- Consumes: `space`, `color` from `@/theme`; `TAB_BAR_HEIGHT`, `TAB_BAR_GAP` from `@/theme/layout`.
- Produces:
  - `useScreenPadding(opts?: { tabBar?: boolean; gutters?: boolean }): { paddingTop: number; paddingBottom: number; paddingHorizontal: number }`
  - `<Screen>` with props `{ scroll?: boolean; tabBar?: boolean; gutters?: boolean; background?: string; style?: StyleProp<ViewStyle>; children: ReactNode }`

  Home and the auth screens use the **hook**, not the component (spec §5.1). Everything else uses the component.

- [ ] **Step 1: Create `components/ui/Screen.tsx`**

```tsx
import React, { ReactNode } from 'react';
import { ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, space } from '@/theme';
import { TAB_BAR_GAP, TAB_BAR_HEIGHT } from '@/theme/layout';

type PaddingOpts = { tabBar?: boolean; gutters?: boolean };

/**
 * Resolves the four things every screen needs: top inset, bottom inset,
 * floating-tab-bar clearance, and horizontal gutters.
 *
 * Exported for screens that cannot use <Screen> — Home (floating cart FAB
 * must sit outside the scroll container) and the auth screens (full-bleed
 * image above a curved panel, so the top inset applies to the image).
 */
export function useScreenPadding({ tabBar = false, gutters = true }: PaddingOpts = {}) {
  const insets = useSafeAreaInsets();
  return {
    paddingTop: insets.top + space.md,
    paddingBottom:
      insets.bottom + space.md + (tabBar ? TAB_BAR_HEIGHT + TAB_BAR_GAP : 0),
    paddingHorizontal: gutters ? space.md : 0,
  };
}

type ScreenProps = PaddingOpts & {
  scroll?: boolean;
  background?: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function Screen({
  scroll = false,
  tabBar = false,
  gutters = true,
  background = color.surface,
  style,
  children,
}: ScreenProps) {
  const padding = useScreenPadding({ tabBar, gutters });

  if (scroll) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: background }}
        contentContainerStyle={[{ flexGrow: 1, ...padding }, style]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor: background, ...padding }, style]}>
      {children}
    </View>
  );
}
```

> **Note for the implementer:** `contentContainerStyle` uses `flexGrow: 1` and **never** `flex: 1`. `flex: 1` sets `flexBasis: 0` + `flexShrink: 1`, which pins content to screen height and silently disables scrolling. That is the exact bug being fixed in Task 10.

- [ ] **Step 2: Build check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/ui/Screen.tsx
git commit -m "feat(ui): add Screen primitive and useScreenPadding hook

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: `<AppText>` and `<Card>`

**Files:**
- Create: `components/ui/AppText.tsx`
- Create: `components/ui/Card.tsx`

**Interfaces:**
- Produces:
  - `<AppText variant?: 'h1'|'h2'|'body'|'caption'|'micro'; tone?: 'ink'|'muted'|'subtle'|'brand'|'danger'|'inverse'; weight?: 'regular'|'bold'>` — extends RN `TextProps`.
  - `<Card>` — extends RN `ViewProps`.

- [ ] **Step 1: Create `components/ui/AppText.tsx`**

```tsx
import React from 'react';
import { Text, TextProps } from 'react-native';
import { color, type } from '@/theme';

const tones = {
  ink: color.ink,
  muted: color.muted,
  subtle: color.subtle,
  brand: color.brand,
  danger: color.danger,
  inverse: color.brandInk,
} as const;

type AppTextProps = TextProps & {
  variant?: keyof typeof type;
  tone?: keyof typeof tones;
  weight?: 'regular' | 'bold';
};

export function AppText({
  variant = 'body',
  tone = 'ink',
  weight = 'regular',
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        {
          fontSize: type[variant],
          color: tones[tone],
          fontWeight: weight === 'bold' ? '700' : '400',
        },
        style,
      ]}
      {...rest}
    />
  );
}
```

- [ ] **Step 2: Create `components/ui/Card.tsx`**

```tsx
import React from 'react';
import { View, ViewProps } from 'react-native';
import { color, radius, shadow, space } from '@/theme';

export function Card({ style, ...rest }: ViewProps) {
  return (
    <View
      style={[
        {
          backgroundColor: color.surface,
          borderRadius: radius.lg,
          padding: space.md,
          marginBottom: space.sm,
          ...shadow.card,
        },
        style,
      ]}
      {...rest}
    />
  );
}
```

> **Note:** `Card` carries **no horizontal margin**. Gutters belong to `<Screen>`. A card that sets its own margin is how the 15-versus-16 drift started.

- [ ] **Step 3: Build check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add components/ui/AppText.tsx components/ui/Card.tsx
git commit -m "feat(ui): add AppText and Card primitives

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: `<AppButton>`

**Files:**
- Create: `components/ui/AppButton.tsx`

**Interfaces:**
- Produces: `<AppButton title: string; onPress: () => void; variant?: 'primary'|'secondary'|'danger'; loading?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle>>`

- [ ] **Step 1: Create `components/ui/AppButton.tsx`**

```tsx
import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { AppText } from './AppText';
import { color, radius, space } from '@/theme';

type Variant = 'primary' | 'secondary' | 'danger';

const fills: Record<Variant, string> = {
  primary: color.brand,
  secondary: color.field,
  danger: color.danger,
};

const labelTones: Record<Variant, 'inverse' | 'ink'> = {
  primary: 'inverse',
  secondary: 'ink',
  danger: 'inverse',
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const inert = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inert}
      accessibilityRole="button"
      accessibilityState={{ disabled: inert, busy: loading }}
      style={[
        {
          backgroundColor: fills[variant],
          paddingVertical: space.md,
          paddingHorizontal: space.lg,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 52,
          opacity: inert ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color.brandInk} />
      ) : (
        <AppText variant="body" weight="bold" tone={labelTones[variant]}>
          {title}
        </AppText>
      )}
    </TouchableOpacity>
  );
}
```

> **Note:** no `width`, no `alignSelf`, no `marginHorizontal`. The button fills its parent's content box. Setting all three at once is the B12 bug.
> `minHeight: 52` keeps it above the 44dp minimum touch target.

- [ ] **Step 2: Build check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add components/ui/AppButton.tsx
git commit -m "feat(ui): add AppButton primitive with three variants

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: `<Field>`

**Files:**
- Create: `components/ui/Field.tsx`

**Interfaces:**
- Produces: `<Field label?: string; error?: string; secure?: boolean>` extending RN `TextInputProps`.

This is the structural fix for **B5**: the eye toggle is absolutely positioned inside the input's own relative wrapper, so it tracks the input wherever the input lands. The current code hardcodes `top: 82` / `top: 152` against the whole form, which detaches the moment a validation error appears.

- [ ] **Step 1: Create `components/ui/Field.tsx`**

```tsx
import React, { useState } from 'react';
import { TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { color, radius, space, type } from '@/theme';

type FieldProps = TextInputProps & {
  label?: string;
  error?: string;
  secure?: boolean;
};

export function Field({ label, error, secure = false, style, ...rest }: FieldProps) {
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={{ marginBottom: space.md }}>
      {label ? (
        <AppText variant="caption" tone="muted" style={{ marginBottom: space.xs }}>
          {label}
        </AppText>
      ) : null}

      {/* Relative wrapper: the toggle is positioned against THIS box, so it
          follows the input regardless of what renders above it. */}
      <View style={{ position: 'relative', justifyContent: 'center' }}>
        <TextInput
          style={[
            {
              backgroundColor: color.field,
              borderRadius: radius.md,
              paddingHorizontal: space.md,
              paddingRight: secure ? space.xl + space.md : space.md,
              minHeight: 52,
              fontSize: type.body,
              color: color.ink,
              borderWidth: 1,
              borderColor: error ? color.danger : 'transparent',
            },
            style,
          ]}
          placeholderTextColor={color.subtle}
          secureTextEntry={secure && !revealed}
          {...rest}
        />

        {secure ? (
          <TouchableOpacity
            onPress={() => setRevealed((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ position: 'absolute', right: space.md }}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={color.muted}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <AppText variant="caption" tone="danger" style={{ marginTop: space.xs }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
```

> **Note:** the error message occupies flow space below the input. The current screens use `marginTop: -10` to pull errors up into the gap, which shifts every following element when an error toggles. Reserving flow space keeps the form stable.

- [ ] **Step 2: Build check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Visual check — Phase 1 gate**

Run the app on the physical device.

**Pass criterion:** the app looks **exactly** as it did before Phase 1. No screen imports these primitives yet, so any visible change is a defect in a primitive — find it before proceeding.

- [ ] **Step 4: Commit**

```bash
git add components/ui/Field.tsx
git commit -m "feat(ui): add Field primitive with inline error and password toggle

Eye toggle is positioned against the input's own wrapper rather than the
form, so it tracks the input when validation errors change layout.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

# PHASE 2 — Shell and navigation

Closes A1, A2, A3, D2, D3.

---

### Task 6: `SafeAreaProvider` at the root

**Files:**
- Modify: `app/_layout.tsx`

**Interfaces:**
- Produces: a mounted `SafeAreaProvider`. `useSafeAreaInsets()` returns zeroes without it, so Task 2's hook is inert until this lands.

- [ ] **Step 1: Wrap the root layout**

In `app/_layout.tsx`, add the import:

```tsx
import { SafeAreaProvider } from 'react-native-safe-area-context';
```

Wrap the existing `<Provider store={store}>` so the tree becomes:

```tsx
<SafeAreaProvider>
  <Provider store={store}>
    {/* existing contents, unchanged */}
  </Provider>
</SafeAreaProvider>
```

Change nothing else in this file. The `isLoggedIn` branch is untouched.

- [ ] **Step 2: Build check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Visual check**

**Pass criterion:** app launches and navigates as before. No layout change is expected yet — nothing consumes insets. A crash here means the provider is in the wrong position.

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat(ui): mount SafeAreaProvider at the root

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: Tab bar — centring, insets, pill jump, icon offset

**Files:**
- Modify: `components/tabBar/tabBar.tsx`
- Modify: `components/tabBarButton.tsx/tabBarButton.tsx`

**Interfaces:**
- Consumes: `TAB_BAR_HEIGHT`, `TAB_BAR_GAP` from `@/theme/layout`.

Fixes **A3** (bar sits left of centre on every device), **D2** (pill jumps on first render), **D3** (focused icon sits low).

- [ ] **Step 1: Fix the bar's own geometry**

In `components/tabBar/tabBar.tsx`, replace the `styles.tabbar` block:

```tsx
// BEFORE — width 90% and marginHorizontal 15 fight each other.
// On a 360dp screen: left gap 15, right gap 21. Visibly off-centre.
tabbar: {
  position: 'absolute',
  bottom: 30,
  marginHorizontal: 15,
  width: '90%',
  paddingVertical: 15,
  ...
}
```

with a `left`/`right` anchored box. Because `bottom` now depends on insets, build the style inline:

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, radius, shadow, space } from '@/theme';
import { TAB_BAR_GAP } from '@/theme/layout';

// inside TabBar(), alongside the existing hooks:
const insets = useSafeAreaInsets();
```

Replace `<View onLayout={onTabbarLayout} style={styles.tabbar}>` with:

```tsx
<View
  onLayout={onTabbarLayout}
  style={[styles.tabbar, { bottom: insets.bottom + TAB_BAR_GAP }]}
>
```

and the StyleSheet entry with:

```tsx
tabbar: {
  position: 'absolute',
  left: space.md,
  right: space.md,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: color.surface,
  borderRadius: radius.lg,
  paddingVertical: 15,
  ...shadow.bar,
},
```

No `width`, no `marginHorizontal`. `left` and `right` centre it by construction at any width.

- [ ] **Step 2: Stop the pill jumping on first render**

The component seeds `useState({ height: 50, width: 300 })`, so `buttonWidth` is wrong until `onLayout` fires and the spring animates from a bad position.

Change the initial state to signal "not yet measured":

```tsx
const [dimensions, setDimensions] = useState<{ height: number; width: number } | null>(null);
const buttonWidth = dimensions ? dimensions.width / state.routes.length : 0;
```

Guard the position effect so it only animates once a real measurement exists:

```tsx
useEffect(() => {
  if (!dimensions) return;
  tabPositionX.value = withSpring(buttonWidth * state.index, {
    damping: 95,
    stiffness: 180,
  });
}, [state.index, buttonWidth, dimensions]);
```

Guard the indicator so it does not render before measurement:

```tsx
{dimensions ? (
  <Animated.View
    style={[
      animatedStyle,
      {
        position: 'absolute',
        backgroundColor: color.brand,
        width: buttonWidth - 25,
        height: dimensions.height - 15,
        marginHorizontal: 12.5,
        borderRadius: radius.lg,
      },
    ]}
  />
) : null}
```

Also set the position without animation on the very first measurement, inside `onTabbarLayout`:

```tsx
const onTabbarLayout = (e: LayoutChangeEvent) => {
  const { height, width } = e.nativeEvent.layout;
  const first = dimensions === null;
  setDimensions({ height, width });
  if (first) {
    tabPositionX.value = (width / state.routes.length) * state.index;
  }
};
```

- [ ] **Step 3: Fix the focused icon offset**

In `components/tabBarButton.tsx/tabBarButton.tsx`, the focused icon is pushed down 9dp while the pill stays vertically centred, so the icon sits low inside it.

Change the interpolation in `animatedIconStyle`:

```tsx
// BEFORE
const top = interpolate(scale.value, [0, 1], [0, 9]);

// AFTER — the label fades out, so the icon only needs to take up the slack
// left by the hidden label, not overshoot past centre.
const top = interpolate(scale.value, [0, 1], [0, 4]);
```

- [ ] **Step 4: Build check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Visual check**

Run on **both** profiles.

**Pass criteria — all four must hold:**
1. At 320dp and at 412dp, the left and right gaps beside the tab bar are **visually equal**.
2. The bar sits clear of the Android gesture bar / iOS home indicator (not flush against the screen bottom).
3. Cold-launching the app shows the green pill already under the Home icon — it does **not** slide in from the left.
4. On the focused tab, the icon is vertically centred within the green pill.

- [ ] **Step 6: Commit**

```bash
git add components/tabBar/tabBar.tsx components/tabBarButton.tsx/tabBarButton.tsx
git commit -m "fix(ui): centre tab bar, respect bottom inset, stop pill jump

Replaces width:90% + marginHorizontal:15 (which left the bar off-centre on
every screen width) with left/right anchoring. Bottom now tracks the safe
area inset. Indicator no longer animates from an unmeasured position.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: Tab-bar clearance on the five tab screens

**Files:**
- Modify: `screens/orderStatus/orderStatus.screen.tsx`
- Modify: `screens/pendingPayments/pendingPayments.screen.tsx`
- Modify: `screens/notifications/notifications.screen.tsx`
- Modify: `screens/profile/profile.screen.tsx`
- Modify: `screens/homeTab/home/home.screen.tsx`

**Interfaces:**
- Consumes: `useScreenPadding` from `@/components/ui/Screen`.

Closes **A1** and **A2** for the tab group. This task is deliberately minimal: it adds insets and clearance only. Per-screen layout bugs are Phase 4.

For each of the four non-Home screens, apply the same three edits:

- [ ] **Step 1: `orderStatus.screen.tsx`**

Add imports:

```tsx
import { useScreenPadding } from '@/components/ui/Screen';
```

Inside the component, above `return`:

```tsx
const padding = useScreenPadding({ tabBar: true, gutters: false });
```

Change the root `<View style={styles.container}>` to:

```tsx
<View style={[styles.container, { paddingTop: padding.paddingTop }]}>
```

Delete `marginTop: 70` from the header block (line ~183), replacing `marginTop: 70` with `marginTop: 0`.

Give the `FlatList` bottom clearance:

```tsx
<FlatList
  data={orders}
  keyExtractor={(item) => item.order_id}
  renderItem={renderItem}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingBottom: padding.paddingBottom }}
/>
```

- [ ] **Step 2: `pendingPayments.screen.tsx`** — same three edits

Import and call `useScreenPadding({ tabBar: true, gutters: false })`. Apply `paddingTop` to the root `View`. Replace the header's `marginTop: 70` with `marginTop: 0`. Replace `contentContainerStyle={styles.list}` with:

```tsx
contentContainerStyle={{ paddingBottom: padding.paddingBottom }}
```

- [ ] **Step 3: `notifications.screen.tsx`** — same three edits

Identical to Step 2, against the notifications `FlatList`.

- [ ] **Step 4: `profile.screen.tsx`** — top inset only

Profile has no `FlatList`; it becomes scrollable in Task 16. Here, only:
- call `useScreenPadding({ tabBar: true, gutters: false })`
- apply `paddingTop` to the root `View`
- replace the header's `marginTop: 70` with `marginTop: 0`

Leave the bottom alone — Task 16 handles it when the screen gains a scroll container.

- [ ] **Step 5: `home.screen.tsx`** — replace the magic number

Home already pads the bottom with a hardcoded `paddingBottom: 160` (line ~422). Replace it with the computed value so it tracks the bar:

```tsx
const padding = useScreenPadding({ tabBar: true, gutters: false });

// ...
contentContainerStyle={{ paddingBottom: padding.paddingBottom }}
```

Replace the header's `marginTop: 70` with `marginTop: padding.paddingTop`, and remove `paddingTop` from the outer container so the inset is applied once, not twice.

- [ ] **Step 6: Build check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 7: Visual check — Phase 2 gate**

Run on **both** profiles. Scroll each of the five tabs to the very bottom.

**Pass criteria — all must hold:**
1. On all five tabs, the **last item is fully visible** above the tab bar and not clipped by it.
2. On all five tabs, the "RC Caterings" heading clears the status bar with a consistent gap — not jammed against it, not floating far below it.
3. The gap above "RC Caterings" looks the **same on both profiles** (this is what `marginTop: 70` got wrong).
4. Home still scrolls and its cart FAB still sits above the tab bar.

- [ ] **Step 8: Commit**

```bash
git add screens/
git commit -m "fix(ui): apply safe-area insets and tab-bar clearance to tab screens

Replaces seven hardcoded marginTop:70 with real insets and the hardcoded
paddingBottom:160 with computed tab-bar clearance. Last list item is no
longer hidden behind the floating bar on four of five tabs.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

# PHASE 3 — Auth and onboarding flow

Closes A4, B4, B5, B10, B11, D5, D7.

---

### Task 9: Login screen + keyboard configuration

**Files:**
- Modify: `screens/auth/login/login.screen.tsx`
- Modify: `app.json`

**Interfaces:**
- Consumes: `Field`, `AppButton`, `AppText`, `useScreenPadding`.

This task establishes the pattern the other two auth forms follow. Fixes **B4** here and **A4**/**D7** app-wide.

- [ ] **Step 1: Configure the Android keyboard mode**

In `app.json`, inside the `android` block, add:

```json
"softwareKeyboardLayoutMode": "pan"
```

The block becomes:

```json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/images/adaptive-icon.png",
    "backgroundColor": "#ffffff"
  },
  "package": "com.company.rc.customer",
  "googleServicesFile": "./google-services.json",
  "softwareKeyboardLayoutMode": "pan"
}
```

- [ ] **Step 2: Fix the scroll container — this is the B4 fix**

In `screens/auth/login/login.screen.tsx`, remove `flex: 1` from `styles.formContainer`:

```tsx
// BEFORE — flex:1 sets flexBasis:0 + flexShrink:1, pinning the content to
// screen height and silently disabling the ScrollView.
formContainer: {
  backgroundColor: 'white',
  flex: 1,
  padding: 20,
  marginTop: -40,
  ...
}

// AFTER
formContainer: {
  backgroundColor: color.surface,
  padding: space.lg,
  marginTop: -40,
  borderTopLeftRadius: 40,
  borderTopRightRadius: 40,
  ...shadow.card,
},
```

- [ ] **Step 3: Add keyboard avoidance**

Replace the `<GestureHandlerRootView>` / `<ScrollView>` wrapper with:

```tsx
import { KeyboardAvoidingView, Platform } from 'react-native';

// ...
<GestureHandlerRootView style={styles.container}>
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  >
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, paddingBottom: space.xl }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* image + formContainer unchanged in structure */}
    </ScrollView>
  </KeyboardAvoidingView>
</GestureHandlerRootView>
```

- [ ] **Step 4: Replace the inputs and button with primitives**

Replace the email `TextInput` + its error block with:

```tsx
<Field
  label="Email"
  keyboardType="email-address"
  autoCapitalize="none"
  placeholder="example@gmail.com"
  value={userInfo.email}
  onChangeText={(text) => setUserInfo({ ...userInfo, email: text })}
  error={required && !userInfo.email ? 'Email is required' : undefined}
/>
```

Replace the password `TextInput` + its `visibleIcon` `TouchableOpacity` + error block with:

```tsx
<Field
  label="Password"
  secure
  placeholder="Password"
  value={userInfo.password}
  onChangeText={(text) => setUserInfo({ ...userInfo, password: text })}
  error={Error.passwordError || undefined}
/>
```

Delete the now-unused `styles.visibleIcon` (the `top: "40%"` block) and the local `isPasswordVisible` state — `Field` owns it.

Replace the sign-in `TouchableOpacity` with:

```tsx
<AppButton title="Sign In" onPress={handleSignIn} loading={buttonSpinner} />
```

Delete `styles.signUpButton`.

- [ ] **Step 5: Build check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 6: Visual check**

Run on the **320×640 emulator**.

**Pass criteria:**
1. The "Sign In" button is reachable by scrolling. (Before this task it is not.)
2. Tapping the password field does not leave the field hidden behind the keyboard.
3. The eye toggle sits inside the password field's right edge and stays there when the password error appears.
4. Triggering the validation error does not push the button off-screen.

- [ ] **Step 7: Commit**

```bash
git add screens/auth/login/login.screen.tsx app.json
git commit -m "fix(ui): make login form scrollable and keyboard-safe

Removing flex:1 from formContainer restores ScrollView behaviour; flex:1
sets flexBasis:0 + flexShrink:1, which pinned content to screen height.
Inputs now use the Field primitive, so the password toggle tracks its input.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: Sign-up and sign-up-second screens

**Files:**
- Modify: `screens/auth/signUp/signUp.screen.tsx`
- Modify: `screens/auth/signUpSecond/signUpSecond.screen.tsx`

**Interfaces:**
- Consumes: `Field`, `AppButton`.

Same fixes as Task 9 applied to both screens, plus **B5** proper (the hardcoded `top: 82` / `top: 152` eye icons).

- [ ] **Step 1: `signUp.screen.tsx` — container and keyboard**

Apply the identical treatment from Task 9 Steps 2–3: remove `flex: 1` from `styles.formContainer`, wrap in `KeyboardAvoidingView`, set `contentContainerStyle={{ flexGrow: 1, paddingBottom: space.xl }}`.

Note the stray `elevation: 5.` in this file's `formContainer` — write it as `elevation: 5`.

- [ ] **Step 2: `signUp.screen.tsx` — replace all four inputs**

Replace each `TextInput` + its `marginTop: 30` + its error block with a `Field`. All four follow this shape:

```tsx
<Field
  label="Full Name"
  placeholder="Full Name"
  value={userInfo.name}
  onChangeText={(text) => setUserInfo({ ...userInfo, name: text })}
  error={Error.nameError || undefined}
/>

<Field
  label="Email"
  placeholder="Email"
  keyboardType="email-address"
  autoCapitalize="none"
  value={userInfo.email}
  onChangeText={(text) => setUserInfo({ ...userInfo, email: text })}
  error={Error.emailError || undefined}
/>

<Field
  label="Phone Number"
  placeholder="Phone Number"
  keyboardType="numeric"
  maxLength={10}
  value={userInfo.phone}
  onChangeText={(text) => setUserInfo({ ...userInfo, phone: text })}
  error={Error.phoneError || undefined}
/>

<Field
  label="Location"
  placeholder="Location"
  value={userInfo.location}
  onChangeText={(text) => setUserInfo({ ...userInfo, location: text })}
  error={Error.locationError || undefined}
/>
```

This deletes every `marginTop: -10` error offset. Replace the Next `TouchableOpacity` with:

```tsx
<AppButton title="Next" onPress={handleNext} loading={buttonSpinner} />
```

- [ ] **Step 3: `signUpSecond.screen.tsx` — the B5 fix**

Apply Task 9 Steps 2–3 to this file's container.

Delete both `TouchableOpacity` eye-icon blocks (the ones with `style={[styles.eyeIcon,{top: 82}]}` and `{top: 152}`) and the `styles.eyeIcon` entry entirely. Replace the two inputs with:

```tsx
<Field
  label="Password"
  secure
  placeholder="Password"
  value={passwordInfo.password}
  onChangeText={(text) => setPasswordInfo({ ...passwordInfo, password: text })}
  error={Error.passwordError || undefined}
/>

<Field
  label="Confirm Password"
  secure
  placeholder="Confirm Password"
  value={passwordInfo.confirmPassword}
  onChangeText={(text) =>
    setPasswordInfo({ ...passwordInfo, confirmPassword: text })
  }
  error={Error.confirmPasswordError || undefined}
/>
```

Replace the submit `TouchableOpacity` with:

```tsx
<AppButton
  title="Complete SignUp"
  onPress={handleNext}
  loading={buttonSpinner}
/>
```

> **Behaviour note:** each `Field` now owns its own reveal state, so the two password fields toggle independently. Previously one shared `isPasswordVisible` flipped both. Independent is the correct behaviour for a confirm-password pair.

- [ ] **Step 4: Build check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Visual check**

Run on the **320×640 emulator**.

**Pass criteria:**
1. On sign-up, the "Next" button is reachable by scrolling with **all four validation errors showing**.
2. On sign-up-second, each eye toggle sits inside its **own** field — including after the password error appears, which is the case that broke before.
3. Toggling one password field's visibility does not toggle the other.
4. No input is left hidden behind the keyboard when focused.

- [ ] **Step 6: Commit**

```bash
git add screens/auth/signUp/ screens/auth/signUpSecond/
git commit -m "fix(ui): repair signup form scrolling and password toggles

Eye icons were absolutely positioned at top:82/152 against the form, so a
validation error detached them from their inputs. Field owns positioning now.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: Verify screen

**Files:**
- Modify: `screens/auth/verify/verify.screen.tsx`

Fixes **D5**: four 60dp boxes plus four 10dp margins plus 40dp padding equals exactly 320dp, so the last box's trailing margin overflows a 320dp screen.

- [ ] **Step 1: Make the code boxes flex**

Replace the `inputContainer` and `inputBox` styles:

```tsx
inputContainer: {
  flexDirection: 'row',
  marginBottom: space.lg,
  alignSelf: 'stretch',
  gap: space.sm,
},
inputBox: {
  flex: 1,
  aspectRatio: 1,
  maxWidth: 72,
  borderWidth: 1,
  borderColor: color.border,
  textAlign: 'center',
  borderRadius: radius.md,
  fontSize: type.h2,
  color: color.ink,
},
```

`flex: 1` with `gap` divides the available width; `aspectRatio: 1` keeps the boxes square at any size; `maxWidth` stops them ballooning on a 430dp screen.

Remove `marginRight: 10` from `inputBox` — `gap` replaces it and does not add a trailing margin.

- [ ] **Step 2: Fix the container height**

Replace `height: "100%"` with `flex: 1` in `styles.container`. `height: "100%"` resolves against a parent that may not define one; `flex: 1` is unambiguous.

- [ ] **Step 3: Replace the submit button**

The screen imports `CustomButton` from `components/button/button`, which uses `responsiveWidth(88)` — one of the libraries being removed in Task 18. Replace:

```tsx
<AppButton title="Submit" onPress={handleSubmit} />
```

and drop the `CustomButton` import.

- [ ] **Step 4: Build check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Visual check**

**Pass criteria:**
1. At **320dp**, all four code boxes are fully visible with even spacing and nothing clipped at the right edge.
2. At 412dp the boxes are square, evenly spaced, and not stretched wide.

- [ ] **Step 6: Commit**

```bash
git add screens/auth/verify/verify.screen.tsx
git commit -m "fix(ui): make verification code boxes fit at 320dp

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 12: Onboarding and welcome-intro

**Files:**
- Modify: `styles/onboarding/onboarding.tsx`
- Modify: `screens/onboarding/onboarding.tsx`
- Modify: `styles/common/common.styles.tsx`
- Modify: `screens/welcome/welcome.intro.tsx`

Fixes **B10** (decorative shapes overlap text; button height conflict; distorted logo) and **B11** (slide content overflows; dots collide with the button).

- [ ] **Step 1: Fix the logo aspect ratio**

In `styles/onboarding/onboarding.tsx`, the logo currently scales width on the width axis and height on the height axis, distorting differently on every device:

```tsx
// BEFORE
logo: { width: wp('23%'), height: hp('10%') },

// AFTER — one axis drives, aspect ratio follows
logo: { width: 96, aspectRatio: 1, resizeMode: 'contain' },
```

- [ ] **Step 2: Fix the decorative shapes**

`titleTextShape1` is `top: 100` inside a `titleWrapper` only ~40dp tall, so it renders ~60dp below the wrapper, on top of the description. `titleTextShape3` at `left: -80` sits partly off-screen.

Replace all three with a contained treatment:

```tsx
titleWrapper: {
  marginTop: space.lg,
  alignItems: 'center',
  justifyContent: 'center',
},
titleTextShape1: { position: 'absolute', right: -8, top: -18, width: 40, height: 40, resizeMode: 'contain' },
titleTextShape2: { position: 'absolute', left: -8, bottom: -14, width: 36, height: 36, resizeMode: 'contain' },
titleTextShape3: { position: 'absolute', left: -4, top: -20, width: 28, height: 28, resizeMode: 'contain' },
```

All offsets are now small and relative to the wrapper, so they stay attached to the title at any width.

- [ ] **Step 3: Fix the button height conflict**

`buttonWrapper` sets `paddingVertical: 18` **and** `height: hp('8%')`. On a 640dp screen 8% is 51dp, but padding alone needs 36dp plus ~20dp of text — the label is clipped.

```tsx
buttonWrapper: {
  backgroundColor: 'transparent',
  borderWidth: 3,
  borderColor: color.brand,
  width: '80%',
  maxWidth: 360,
  paddingVertical: space.md,
  minHeight: 56,
  borderRadius: radius.pill,
  justifyContent: 'center',
  alignItems: 'center',
  position: 'absolute',
  bottom: 50,
},
```

`minHeight` replaces the fixed `height`, so the box grows to fit its content instead of clipping it. Delete the now-dead `marginTop: 40` (it was overridden by `position: 'absolute'`).

- [ ] **Step 4: Add the bottom inset to the onboarding button**

In `screens/onboarding/onboarding.tsx`:

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// inside the component:
const insets = useSafeAreaInsets();
```

and on the `TouchableOpacity`:

```tsx
<TouchableOpacity
  style={[styles.buttonWrapper, { bottom: insets.bottom + space.lg }]}
  onPress={() => router.push('/(routes)/welcome-intro')}
>
```

- [ ] **Step 5: Fix the welcome-intro slide overflow**

In `styles/common/common.styles.tsx`, the slide image is a fixed 80% square and the wrapper adds `marginTop: 90`, overflowing short screens. Replace:

```tsx
// BEFORE
slideImage: {
  marginTop: 50,
  width: responsiveWidth(80),
  height: responsiveWidth(80),
},
description: { marginHorizontal: 60, ... },

// AFTER
slideImage: {
  marginTop: space.lg,
  alignSelf: 'center',
  marginBottom: space.sm,
  width: '70%',
  aspectRatio: 1,
  maxHeight: 260,
  resizeMode: 'contain',
},
description: {
  marginHorizontal: space.lg,
  marginBottom: space.sm,
  fontSize: type.caption,
  textAlign: 'center',
  color: color.muted,
},
```

`maxHeight` is what prevents the overflow on short screens; `marginHorizontal: 60` dropping to 24 gives the text room at 320dp.

In `screens/welcome/welcome.intro.tsx`, reduce the slide wrapper's `marginTop` from 90:

```tsx
<View style={{ marginTop: space.xl, paddingHorizontal: space.md }}>
```

- [ ] **Step 6: Stop the dots colliding with the button**

Still in `common.styles.tsx`, the dots use `bottom: responsiveHeight(10)` while the button uses `bottom: responsiveHeight(5)` — both scale with height at different rates, so they overlap on short screens. Pin both to fixed offsets:

```tsx
dotStyle: {
  backgroundColor: color.border,
  width: 8,
  height: 8,
  borderRadius: radius.pill,
  marginHorizontal: space.xs,
  bottom: 24,
},
activeDotStyle: {
  backgroundColor: color.brand,
  width: 8,
  height: 8,
  borderRadius: radius.pill,
  marginHorizontal: space.xs,
  bottom: 24,
},
welcomeButtonContainer: {
  backgroundColor: color.brand,
  width: '80%',
  maxWidth: 360,
  minHeight: 56,
  borderRadius: radius.pill,
  alignSelf: 'center',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: space.xl,
},
```

Note `welcomeButtonContainer` loses `position: 'absolute'` — it now sits in flow below the dots, which removes the overlap by construction rather than by tuning two offsets against each other.

Delete the `buttonContainer` entry entirely — it has the invalid seven-digit `#25123EC` and a 17dp height holding 20dp text, and nothing uses it.

- [ ] **Step 7: Build check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 8: Visual check — Phase 3 gate**

Run on **both** profiles.

**Pass criteria:**
1. On onboarding, the three decorative shapes sit around the title and **do not overlap** the description text.
2. The "Get Started" label is fully visible, not vertically clipped.
3. The logo has the same proportions on both profiles (not stretched on one).
4. On all three welcome-intro slides at **320×640**: heading, image, title and description are all fully visible without clipping.
5. The pagination dots and the Next/Done button do **not** overlap on either profile.

- [ ] **Step 9: Commit**

```bash
git add styles/ screens/onboarding/ screens/welcome/
git commit -m "fix(ui): repair onboarding and welcome-intro layout

Decorative shapes no longer overlap the description; button height no
longer clips its label; slide content fits at 640dp; pagination dots and
the action button no longer collide.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

# PHASE 4 — Tab screens and cart

Closes B1, B2, B3, B6, B7, B8, B9, B12, D1.

---

### Task 13: Home screen — meal tabs, nested lists, cart FAB

**Files:**
- Modify: `screens/homeTab/home/home.screen.tsx`

Fixes **B1** (meal tabs overflow on every phone), **B2** (nested VirtualizedLists), **B3** (FAB icon overflows its button).

- [ ] **Step 1: Fix the meal-time tabs — the B1 fix**

`paddingHorizontal: 43` across three buttons needs 258dp of padding before any text. Available at 360dp is 330dp. It overflows everywhere.

Replace the tab row's container and button styles:

```tsx
<View
  style={{
    flexDirection: 'row',
    marginTop: space.lg,
    marginHorizontal: space.md,
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    marginBottom: space.md,
    padding: space.xs,
  }}
>
  {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((category) => (
    <TouchableOpacity
      key={category}
      style={{
        flex: 1,
        paddingVertical: space.md,
        paddingHorizontal: space.sm,
        backgroundColor: activeButton === category ? color.brand : 'transparent',
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onPress={() => setActiveButton(category)}
    >
      <AppText
        variant="caption"
        weight="bold"
        numberOfLines={1}
        tone={activeButton === category ? 'inverse' : 'brand'}
      >
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </AppText>
      {dateLabels[category] ? (
        <AppText
          variant="micro"
          numberOfLines={1}
          tone={activeButton === category ? 'inverse' : 'brand'}
          style={{ marginTop: 2, opacity: 0.8 }}
        >
          {dateLabels[category]}
        </AppText>
      ) : null}
    </TouchableOpacity>
  ))}
</View>
```

`flex: 1` gives each tab an equal third of the available width at any screen size. `numberOfLines={1}` guarantees the row never grows taller than one line per label.

- [ ] **Step 2: Fix the nested VirtualizedLists — the B2 fix**

The screen renders `<FlatList data={[1]}>` as a ScrollView substitute and nests two more `FlatList`s inside it. This triggers RN's nested-VirtualizedList warning, breaks both scroll containers, and disables recycling.

Replace the outer list. Change the return block from:

```tsx
<FlatList
  data={[1]}
  keyExtractor={() => 'mainContent'}
  renderItem={renderContent}
  contentContainerStyle={{ paddingBottom: padding.paddingBottom }}
/>
```

to:

```tsx
<ScrollView
  contentContainerStyle={{ paddingBottom: padding.paddingBottom }}
  showsVerticalScrollIndicator={false}
>
  {renderContent()}
</ScrollView>
```

Change `renderContent` to take no arguments: `const renderContent = () => { ... }`.

Add `ScrollView` to the `react-native` import and remove `FlatList` if nothing else uses it.

- [ ] **Step 3: Replace the two inner FlatLists with `.map()`**

Both inner lists render a bounded, already-loaded array, so virtualization buys nothing. Replace the veg block:

```tsx
{isVegExpanded && (
  <View>
    <AppText variant="body" weight="bold" tone="brand" style={{ marginBottom: space.sm }}>
      Vegetarian Items ({menuData[currentCategory].Veg.length})
    </AppText>
    {menuData[currentCategory].Veg.map((item) => (
      <RenderItem
        key={item.id}
        item={{
          name: item.name,
          description: item.description,
          price: parseFloat(item.price),
        }}
        onPressCheckbox={handleMealSelection}
        isChecked={selectedItems[item.name] || false}
      />
    ))}
  </View>
)}
```

Apply the identical shape to the non-veg block, substituting `NonVeg` and `Non-Vegetarian Items`. Also delete the `console.log` calls inside both render paths — they fire on every item on every render.

While here, change the non-veg `Animated.View` `marginHorizontal` from **16** to `space.md` so it matches the veg block. They currently differ by 1dp, which is the visible D4 misalignment.

- [ ] **Step 4: Fix the cart FAB — the B3 fix**

The button is 60×60 but the icon inside is 80×80 at `top: -7, left: 5`, spilling 20dp past a circular button. It renders on iOS and is clipped on Android.

```tsx
<TouchableOpacity
  style={{
    position: 'absolute',
    bottom: padding.paddingBottom + space.sm,
    right: space.md,
    backgroundColor: color.brand,
    borderRadius: radius.pill,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow.card,
  }}
  onPress={handleViewCart}
  accessibilityRole="button"
  accessibilityLabel="View cart"
>
  <Image
    source={require('../../../assets/cart.png')}
    style={{ width: 30, height: 30, resizeMode: 'contain' }}
  />
</TouchableOpacity>
```

The FAB's `bottom` now derives from the same clearance value as the list, so it tracks the tab bar instead of using a hardcoded 150.

Delete the unused `styles.cartButton` and `styles.cartIcon` entries.

- [ ] **Step 5: Build check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 6: Visual check**

Run on **both** profiles.

**Pass criteria:**
1. At **320dp**, all three meal tabs — Breakfast, Lunch and **Dinner** — are fully visible. Dinner is not clipped.
2. The three tabs are equal width.
3. No "VirtualizedLists should never be nested" warning appears in the Metro console.
4. Expanding both the veg and non-veg sections still scrolls smoothly to the bottom.
5. The cart icon is fully inside its green circle on **Android** (this is where clipping showed).
6. The veg and non-veg cards are left-aligned with each other.

- [ ] **Step 7: Commit**

```bash
git add screens/homeTab/home/home.screen.tsx
git commit -m "fix(ui): repair home meal tabs, nested lists and cart FAB

paddingHorizontal:43 across three tabs needed 258dp before any text and
overflowed every phone width; tabs are now flex:1. Outer FlatList-as-
ScrollView and its two nested FlatLists are replaced with ScrollView + map.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 14: Order status screen

**Files:**
- Modify: `screens/orderStatus/orderStatus.screen.tsx`

Fixes **B6**: the `FlatList` is wrapped in a `flexDirection: 'row'` container with no `flex: 1`, so it has no bounded height and scrolling breaks.

- [ ] **Step 1: Delete the row wrapper**

Replace the whole wrapper block:

```tsx
// BEFORE — a row container with no flex, copy-pasted from Home's tab row.
<View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 30, borderRadius: 20, marginBottom: 15 }}>
  <FlatList data={orders} keyExtractor={(item) => item.order_id} renderItem={renderItem} showsVerticalScrollIndicator={false} />
</View>
```

with the list directly:

```tsx
<FlatList
  style={{ flex: 1, marginTop: space.md }}
  data={orders}
  keyExtractor={(item) => item.order_id}
  renderItem={renderItem}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingBottom: padding.paddingBottom }}
/>
```

- [ ] **Step 2: Adopt `<Card>` and normalise internal spacing**

The card sets `marginHorizontal: 15` while its text children each set `marginHorizontal: 10`, double-indenting the content.

Replace the card's root `<View style={styles.card}>` in `renderItem` with the primitive:

```tsx
import { Card } from '@/components/ui/Card';

// in renderItem:
<Card style={{ marginHorizontal: space.md }}>
  {/* existing children */}
</Card>
```

Delete `styles.card` entirely — `<Card>` supplies the background, radius, padding and shadow.

Remove `marginHorizontal: 10` from `orderNumber`, `itemText`, `totalPrice`, `statusText`, `mealTimeText`, and `actionsRow`. The card's own padding is the only indent.

- [ ] **Step 3: Make the edit modal fit short screens**

The modal stacks a 300dp scroll area, a 160dp scroll area, a title, a subtitle and an action row — roughly 560dp inside a 640dp screen with no outer bound. Cap the container:

```tsx
modalContainer: {
  backgroundColor: color.surface,
  width: '90%',
  maxHeight: '85%',
  borderRadius: radius.lg,
  padding: space.md,
},
```

and change the two inner `ScrollView`s from fixed `maxHeight` to flexible:

```tsx
// items list
<ScrollView style={{ flexShrink: 1 }}>

// add-items list
<ScrollView style={{ flexShrink: 1 }}>
```

- [ ] **Step 4: Build check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Visual check**

**Pass criteria:**
1. With enough orders to overflow the screen, the list **scrolls** and the last card is fully visible above the tab bar.
2. Card text is indented once, not twice — text starts a consistent distance from the card edge.
3. At **320×640**, opening Edit Order shows the modal fully on screen with its Close and Save buttons visible.

- [ ] **Step 6: Commit**

```bash
git add screens/orderStatus/orderStatus.screen.tsx
git commit -m "fix(ui): give order list a bounded height and cap the edit modal

The list was wrapped in a flexDirection:row container with no flex, so it
had no height to scroll within.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 15: Notifications and pending payments

**Files:**
- Modify: `screens/notifications/notifications.screen.tsx`
- Modify: `screens/pendingPayments/pendingPayments.screen.tsx`

Fixes **B7**: the notification card's text container has no `flex: 1`. RN defaults `flexShrink: 0` (unlike web), so long messages do not wrap — they overflow the card.

- [ ] **Step 1: Fix the notification card**

```tsx
// BEFORE — bare View, so the text cannot shrink and overflows.
<View>
  <Text style={styles.message}>{item.message}</Text>
  <Text style={styles.date}>{item.date}</Text>
</View>

// AFTER
<View style={{ flex: 1 }}>
  <AppText variant="body" weight="bold" style={{ marginBottom: space.xs }}>
    {item.message}
  </AppText>
  <AppText variant="caption" tone="muted">
    {item.date}
  </AppText>
</View>
```

Also reduce the icon so the text has room at 320dp:

```tsx
icon: { width: 44, height: 44, marginRight: space.md },
```

Adopt the `<Card>` primitive for the row, replacing `<View style={styles.card}>`:

```tsx
import { Card } from '@/components/ui/Card';

<Card style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: space.md }}>
  {/* icon + text */}
</Card>
```

Delete `styles.card` from this file.

- [ ] **Step 2: Fix the pending-payments icon size and adopt `<Card>`**

Apply the identical `<Card>` swap to `pendingPayments.screen.tsx`'s `renderItem`, deleting its `styles.card` too. This removes the third and fourth copies of the same shadow/radius block and is what closes **D4** — all cards now derive their gutter from one place.

Then fix the icon:

The 90×90 icon consumes 120dp of a 290dp content box at 320dp. Reduce it and remove the doubled margin:

```tsx
// BEFORE
icon: { width: 90, height: 90, marginRight: 15, marginLeft: 15 },

// AFTER
icon: { width: 56, height: 56, marginRight: space.md },
```

- [ ] **Step 3: Build check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 4: Visual check**

**Pass criteria:**
1. At **320dp**, the notification message *"Your order #5012 has been confirmed."* **wraps onto multiple lines inside the card** and does not spill past the card's right edge.
2. At 320dp, the pending-payments order ID, date and price all fit within the card.

- [ ] **Step 5: Commit**

```bash
git add screens/notifications/ screens/pendingPayments/
git commit -m "fix(ui): let notification text wrap inside its card

RN defaults flexShrink:0, so a bare View around the text could not shrink
and long messages overflowed the card.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 16: Profile screen

**Files:**
- Modify: `screens/profile/profile.screen.tsx`

Fixes **B8** (content is not scrollable; ~250dp unreachable at 640dp), **B9** (avatar larger than its container), **B12** (fixed-width right-aligned buttons).

- [ ] **Step 1: Make the screen scrollable**

Replace the root `<View style={styles.container}>` with `<Screen scroll tabBar>`:

```tsx
import { Screen } from '@/components/ui/Screen';

// ...
return (
  <Screen scroll tabBar>
    {/* existing children, minus the two header View wrappers' marginTop */}
  </Screen>
);
```

Task 8 left this screen applying `paddingTop` manually to the root `View`; `<Screen>` owns the top inset now, so remove that manual `paddingTop` and the `useScreenPadding` call along with it. Remove `marginHorizontal: 16` from `label` and `input`, since `<Screen>` supplies gutters.

- [ ] **Step 2: Fix the avatar — the B9 fix**

The image is 125×125 absolutely positioned inside a 109×109 container, overflowing 12dp top and 11dp right. `overflow: 'visible'` is ignored on Android when `elevation` is set, so it is clipped there and overflows on iOS. `borderRadius: 60` on a 125px image is not a circle either.

Replace both styles:

```tsx
profileImageContainer: {
  width: 112,
  height: 112,
  borderRadius: 56,
  overflow: 'hidden',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: color.brand,
  ...shadow.card,
},
profileImage: {
  width: '100%',
  height: '100%',
  resizeMode: 'cover',
},
```

The image now fills its container exactly. No absolute positioning, no overflow, identical on both platforms. Delete the commented-out `profileImage` block below it.

- [ ] **Step 3: Fix the action buttons — the B12 fix**

Both buttons set `width: 200` + `alignSelf: 'flex-end'` + `marginHorizontal: 16`, which is three conflicting declarations and inconsistent with every other button in the app.

```tsx
<AppButton title="Logout" onPress={handleLogout} />
<AppButton
  title="Delete Account"
  variant="danger"
  onPress={() => setModalVisible(true)}
  style={{ marginTop: space.md }}
/>
```

Delete `styles.logoutButton`, `styles.deleteButton`, `styles.logoutButtonText`, and `styles.deleteButtonText`.

- [ ] **Step 4: Fix the invalid label colour**

`label` uses `color: '#oaoaoa'` — letter `o`, not zero — which is invalid and falls back to black. Replace with `tone="muted"` via `AppText`, or `color: color.muted` if keeping the `Text`.

- [ ] **Step 5: Build check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 6: Visual check**

**Pass criteria — check these at 320×640 specifically:**
1. The screen **scrolls**, and both Logout and Delete Account are reachable. (Before this task, Delete Account is entirely off-screen at this size.)
2. The avatar is a clean circle, fully inside its green ring, and looks **the same on Android and iOS**.
3. Both buttons are full-width within the gutters and match the buttons on the auth screens.
4. Field labels are grey, not black.

- [ ] **Step 7: Commit**

```bash
git add screens/profile/profile.screen.tsx
git commit -m "fix(ui): make profile scrollable and fix avatar clipping

Delete Account was unreachable below 700dp. Avatar was a 125px image in a
109px container, clipped on Android and overflowing on iOS.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 17: Cart screen and confirmation modal

**Files:**
- Modify: `screens/cart/cart.screen.tsx`
- Modify: `components/popupmodel/popupModel.tsx`

Fixes **B12** (conflicting widths) and **D1** (destructive action renders grey, safe action renders brand-green).

- [ ] **Step 1: Fix the cart's safe area and back button**

```tsx
import { useScreenPadding } from '@/components/ui/Screen';

// inside the component:
const padding = useScreenPadding({ gutters: false });
```

Apply `paddingTop` to the root `View`, replace the header's `marginTop: 60` with `marginTop: 0`, and anchor the back button to the inset:

```tsx
<TouchableOpacity
  style={[styles.backButton, { top: padding.paddingTop }]}
  onPress={() => navigation.goBack()}
  accessibilityRole="button"
  accessibilityLabel="Go back"
  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
>
```

and remove `top: 50` from `styles.backButton`.

- [ ] **Step 2: Fix the confirm button's conflicting widths**

```tsx
// BEFORE — width 90% + alignSelf center + marginHorizontal 16, all at once.
confirmButton: {
  backgroundColor: '#69bf70',
  padding: 15,
  borderRadius: 10,
  alignItems: 'center',
  marginTop: 10,
  marginBottom: 50,
  width: '90%',
  alignSelf: 'center',
  marginHorizontal: 16,
},
```

Replace the `TouchableOpacity` with:

```tsx
<AppButton
  title="CONFIRM ORDER"
  onPress={handleConfirmOrder}
  style={{ marginHorizontal: space.md, marginBottom: padding.paddingBottom }}
/>
```

and delete `styles.confirmButton` and `styles.confirmText`.

- [ ] **Step 3: Give the cart list bottom clearance**

```tsx
<FlatList
  data={cartItems}
  keyExtractor={(item) => item.id}
  renderItem={/* unchanged */}
  contentContainerStyle={{ paddingBottom: space.md }}
/>
```

- [ ] **Step 4: Fix the modal's swapped colours — the D1 fix**

In `components/popupmodel/popupModel.tsx`, `cancelButton` is brand-green and `confirmButton` is grey `#ccc`. On the Delete Account and Cancel Order dialogs this renders the destructive action as disabled-looking and the safe action as primary — backwards.

```tsx
cancelButton: {
  backgroundColor: color.field,
},
confirmButton: {
  backgroundColor: color.danger,
},
```

and make the label colours follow:

```tsx
<TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
  <AppText variant="body" weight="bold" tone="ink">{cancelText}</AppText>
</TouchableOpacity>

<TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
  <AppText variant="body" weight="bold" tone="inverse">{confirmText}</AppText>
</TouchableOpacity>
```

Delete `styles.buttonText`. Also raise the button tap targets:

```tsx
button: {
  flex: 1,
  paddingVertical: space.md,
  marginHorizontal: space.xs,
  borderRadius: radius.md,
  alignItems: 'center',
  minHeight: 48,
},
```

> **Confirm this before marking the task done:** the modal is shared by Cancel Order and Delete Account. Both must read correctly — the destructive choice red, the safe choice neutral.

- [ ] **Step 5: Build check**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 6: Visual check — Phase 4 gate**

Run on **both** profiles.

**Pass criteria:**
1. The cart back button clears the status bar on both profiles.
2. The Confirm Order button is full-width within the gutters and visually matches the auth-screen buttons.
3. On **both** the Cancel Order and Delete Account dialogs, the destructive action is red and the safe action is neutral grey.
4. Both dialog buttons are at least 48dp tall.

- [ ] **Step 7: Commit**

```bash
git add screens/cart/cart.screen.tsx components/popupmodel/popupModel.tsx
git commit -m "fix(ui): repair cart layout and un-swap modal action colours

The shared confirm dialog rendered the destructive action grey and the safe
action brand-green on both Cancel Order and Delete Account.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

# PHASE 5 — Cleanup

Closes C, D6, and the A5 uninstall.

---

### Task 18: Remove dead code, invalid colours and the responsive libraries

**Files:**
- Delete: `screens/profile/profile-with-hook.screen.tsx`
- Modify: `screens/pendingPayments/pendingPayments.screen.tsx`
- Modify: `components/button/button.tsx`
- Modify: `package.json`

- [ ] **Step 1: Confirm the dead file is unreferenced, then delete it**

```bash
grep -rn "profile-with-hook" --include=*.tsx --include=*.ts app screens components services
```

Expected: no output. If anything matches, stop and report it rather than deleting.

```bash
git rm screens/profile/profile-with-hook.screen.tsx
```

It is 210 lines, imported nowhere, and carries the same bugs just fixed — leaving it guarantees it drifts from the corrected copy.

- [ ] **Step 2: Fix the remaining invalid colours**

In `screens/pendingPayments/pendingPayments.screen.tsx`, three values use the letter `o` instead of zero and silently fall back to black:

```tsx
// BEFORE
borderColor: '#oaoaoa',
details: { fontSize: 14, color: '#oaoaoa' },
price: { fontSize: 14, color: '#oaoaoa', fontWeight: 'bold', paddingTop: 10 },

// AFTER
borderColor: color.border,
details: { fontSize: type.caption, color: color.muted },
price: { fontSize: type.caption, color: color.ink, fontWeight: 'bold', paddingTop: space.sm },
```

- [ ] **Step 3: Verify every invalid colour is gone**

```bash
grep -rn "#oaoaoa\|#25123EC" --include=*.tsx --include=*.ts app screens components styles
```

Expected: **no output**. This is the pass criterion for the finding, and it is checkable without a device.

- [ ] **Step 4: Remove the last responsive-library consumers**

```bash
grep -rn "responsive-dimensions\|responsive-screen" --include=*.tsx --include=*.ts app screens components styles
```

Every remaining hit must be removed before Step 5. Expected remaining files: `components/button/button.tsx`, and whatever survives in `styles/`.

For `components/button/button.tsx` — `AppButton` replaces it. Confirm nothing imports it:

```bash
grep -rn "components/button/button" --include=*.tsx --include=*.ts app screens components
```

If clean, `git rm components/button/button.tsx`. If anything still imports it, convert that call site to `AppButton` first.

Re-run the first grep in this step. It must return **no output** before proceeding.

- [ ] **Step 5: Uninstall both libraries**

```bash
npm uninstall react-native-responsive-dimensions react-native-responsive-screen
```

- [ ] **Step 6: Build check**

Run: `npx tsc --noEmit`
Expected: clean. A "cannot find module" error here means Step 4 missed a consumer.

- [ ] **Step 7: Full regression pass — Phase 5 gate**

Run on **both** profiles. Walk the complete flow: onboarding → welcome-intro → sign-up → sign-up-second → login → all five tabs → cart → confirm dialog.

**Pass criteria:**
1. No screen crashes.
2. No red-box or Metro warnings about missing modules.
3. Every pass criterion from Tasks 7–17 still holds.
4. Text that was black-by-accident (the `#oaoaoa` values) now renders grey.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore(ui): remove dead code, invalid colours and responsive libs

Deletes the unreferenced profile-with-hook screen and the responsive-
dimensions button. Fixes four '#oaoaoa' values (letter o, not zero) that
silently fell back to black. Uninstalls both responsive libraries, whose
module-load Dimensions snapshot never updated on resize.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Self-review notes

**Spec coverage.** All 25 findings in spec §8 map to a task:

| Finding | Task | Finding | Task |
|---|---|---|---|
| A1 | 6, 8 | B7 | 15 |
| A2 | 8 | B8 | 16 |
| A3 | 7 | B9 | 16 |
| A4 | 9, 10 | B10 | 12 |
| A5 | 18 | B11 | 12 |
| B1 | 13 | B12 | 16, 17 |
| B2 | 13 | C | 16, 18 |
| B3 | 13 | D1 | 17 |
| B4 | 9, 10 | D2 | 7 |
| B5 | 5, 10 | D3 | 7 |
| B6 | 14 | D4 | 1, 13, 14, 15 |
| D5 | 11 | D6 | 18 |
| D7 | 9 | | |

**Known gaps, stated rather than hidden:**

1. **The `commonStyles` module is retired piecemeal, not deleted.** Tasks 9–12 migrate its consumers, but `styles/common/common.styles.tsx` still exists at the end of Phase 5 with `input` and `errorContainer` possibly unreferenced. Task 18 Step 4's grep will surface it. Deleting it is a two-line follow-up, deliberately not forced into this plan.

2. **`components/flatList/flatList.tsx` is not converted to `<Card>`.** It already gets `flex: 1` right and has no layout bug, so touching it is churn. It keeps its own styles.

3. **`components/Themed.tsx` and `constants/Colors.ts` are untouched.** They are Expo template leftovers; nothing in the app imports them. Removing them is outside the approved scope.

4. **The broken jest setup is not repaired.** `jest-expo` cannot resolve `expo-modules-core`, and `components/__tests__/StyledText-test.js` imports a non-existent `../StyledText`. Out of scope per spec §3, but it means this plan has **no automated regression net** — the visual pass criteria are the only guard.
