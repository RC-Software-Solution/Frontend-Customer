# RC Customer Mobile UI Modernization — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize every customer-app screen while keeping its green identity, without adding weight, and close the order-visibility gaps the device audit found.

**Architecture:** Extend the existing token module (`theme/`) and shared primitives (`components/ui/`) rather than add new systems. Phase 1 fixes the foundation (contrast-safe tokens, one font, lighter assets, three small primitives) with automated checks; later phases migrate screens onto it and add the missing states. Each phase leaves the app shippable.

**Tech Stack:** React Native 0.86, Expo SDK 57, expo-router, TypeScript, Reanimated 4.5 (already installed), jest-expo + `@testing-library/react-native` 14. **No new dependencies.**

**Spec:** `docs/superpowers/specs/2026-10-26-mobile-ui-modernization-design.md`

## Global Constraints

- **No new dependencies.** `npx` one-off tools (`expo-optimize`) are allowed; nothing is added to `package.json`. Removing `@expo-google-fonts/raleway` in Task 19 is allowed.
- **Light mode only.** `app.json` `userInterfaceStyle` becomes `"light"` in Task 25.
- **Brand colour `#69bf70` stays** as the fill colour. It is never used as text (2.26:1 on white).
- **Text contrast ≥ 4.5:1** for every foreground/background pair in the theme, enforced by `theme/__tests__/contrast.test.ts`.
- **Bundled raster assets referenced by the app ≤ 1500 KB** (baseline 5600 KB), measured by `scripts/asset-weight.sh`.
- **Animation:** Reanimated only, `opacity`/`transform` only. **No blur.** At most one `expo-linear-gradient`, never behind scrolling content.
- **Lists:** `FlatList` with `keyExtractor`. Shadows on repeated rows: `elevation ≤ 2`.
- **View layer first.** Tasks 1–19 and 25 touch only `screens/`, `components/`, `theme/`, `app/`, `assets/`, `scripts/`, `docs/`, `app.json`. Tasks 20–24 touch `services/` and screens; none touch the Backend repo.
- **Touch targets ≥ 48×48 dp**, gutters stay `space.md` (16).
- **AppText never receives `fontWeight` in `style`.** Use the `weight` prop (a custom font family plus `fontWeight` can fake-bold on Android).
- **Never confirm Delete Account** while testing on the device.

### Verification protocol (every task)

1. `npx tsc --noEmit` → **0 errors** (baseline is 0).
2. The task's own jest file(s), then `npx jest` before each phase gate → all green (baseline **18 suites / 175 tests**, ~50 s).
3. **Device check** on the SM-A057F (Expo Go), signed in with the accounts in the `dev-test-environment` memory (`flow.*` and `qa.customer`, password `Passw0rd!`). Re-run `node scripts/dev-scenario.js all-open` in the Backend repo first if the menu shows Closed. Find elements by label with `uiautomator dump`, never fixed coordinates.
4. Each task states a **pass criterion** a reviewer can answer yes/no.

### Deviation from the writing-plans norm (deliberate, one)

Tasks 1–7 (Phase 1) have complete code and test steps. **Tasks 8–25 are scoped at task level** (files, change, pass criterion). Their code depends on decisions D1–D3 and on how the Phase-1 primitives look on the budget phone, so each phase's step-level detail is written at that phase's start, after the Phase-1 gate review. This keeps the plan from containing code that would be wrong by then.

### Decisions (confirmed by the product owner on 2026-10-26)

| ID | Used by | Decision |
|---|---|---|
| D1 label colour on green fills | Task 5 | **A:** dark ink labels on the `#69bf70` fill |
| D2 typeface | Task 4 | **Nunito 400/600/700 only**; drop Raleway |
| D3 order history shape | Task 22 | **New "History" screen reached from Orders**, not a 6th tab |

### Execution permissions (confirmed 2026-10-26)

- Run with `superpowers:subagent-driven-development`: a fresh subagent per task, a review between tasks, in a **new session**.
- **One local commit per task** on `feat/ui-modernization` (Task 1 creates it). **Never push**, and never open a PR without being asked (Task 25 ends with `finishing-a-development-branch`, which asks first).
- Stop at every **PHASE GATE** and report to the product owner before starting the next phase.

### Environment notes for the executor

- Device: SM-A057F over USB, app in Expo Go, Metro on the laptop. Reopen the project with `adb shell am start -a android.intent.action.VIEW -d exp://192.168.1.164:8081`. The phone's `adb` is at `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`. A dev-menu reload needs no text field focused (typing "rr" into a focused field types instead of reloading); force-stop `host.exp.exponent` and relaunch if Fast Refresh misses an edit.
- Backend: `C:\Users\budglk\RC\Backend` (docker compose in `docker/`; the gitignored `docker-compose.override.yml` already publishes the LAN ports). Before any device check run `node scripts/dev-scenario.js all-open` there: the open windows last about 3 hours and the menu shows "Closed" afterwards.
- Accounts: `flow.customer@test.local`, `flow.customer2@test.local`, `flow.unpaid@test.local`, `flow.noarea@test.local`, `qa.customer@test.local` all use `Passw0rd!`. `qa.customer` has one order per status (ids `ui-ord-*`). Do not print login response bodies (JWTs). Never confirm Delete Account.
- The dev error overlay (LogBox) can cover the screen and steal taps: dismiss it via its "Dismiss" button before continuing a device check.

---

# PHASE 1 — Foundation

**Phase gate:** after Task 7, show before/after screenshots of Home, Orders, Profile and Sign In on the device. Visible changes are expected (dark button labels, darker green headings, a slightly deeper red, Nunito everywhere). Do not continue until D1 and D2 are confirmed.

---

### Task 1: Branch and housekeeping commits

**Files:** `screens/auth/login/login.screen.tsx` (already edited), `DEV_ENV_TROUBLESHOOTING.md` (already edited), `docs/superpowers/**` (new spec and plan)

- [ ] **Step 1: Commit the Google-button removal on its own**

```bash
git add screens/auth/login/login.screen.tsx
git commit -m "fix(auth): remove the Google button that opened a TikTok link; leave TODO(google-auth)"
```

- [ ] **Step 2: Commit the docs**

```bash
git add DEV_ENV_TROUBLESHOOTING.md docs/superpowers/specs/2026-10-26-mobile-ui-modernization-design.md docs/superpowers/plans/2026-10-26-mobile-ui-modernization.md
git commit -m "docs: LAN backend setup for phone testing; UI modernization spec and plan"
```

- [ ] **Step 3: Start the work branch**

```bash
git switch -c feat/ui-modernization
```

Expected: `Switched to a new branch 'feat/ui-modernization'`. **Pass criterion:** `git status --short` is empty.

---

### Task 2: Performance baseline

**Files:**
- Create: `scripts/asset-weight.sh`
- Create: `scripts/perf-frames.sh`
- Create: `docs/superpowers/perf-baseline.md`

- [ ] **Step 1: Create `scripts/asset-weight.sh`**

```bash
#!/usr/bin/env bash
# Size of every raster asset the app actually requires (Metro bundles only these), plus the total.
cd "$(dirname "$0")/.." || exit 1
grep -rhoE "assets/[A-Za-z0-9_./ ()-]+\.(png|jpg|jpeg|webp|gif)" \
  --include=*.tsx --include=*.ts --include=*.json \
  screens components app store services constants styles app.json 2>/dev/null | sort -u |
while read -r f; do [ -f "$f" ] && printf '%s\t%s\n' "$(stat -c %s "$f")" "$f"; done | sort -rn |
awk -F'\t' '{t+=$1; printf "%7.0f KB  %s\n",$1/1024,$2} END {printf "%7.0f KB  TOTAL (budget: 1500 KB)\n",t/1024}'
```

- [ ] **Step 2: Run it and confirm the baseline**

Run: `bash scripts/asset-weight.sh | tail -3`
Expected: last line is `5600 KB  TOTAL (budget: 1500 KB)` (±5 KB).

- [ ] **Step 3: Create `scripts/perf-frames.sh`**

```bash
#!/usr/bin/env bash
# Usage: bash scripts/perf-frames.sh <label>
# Start with the app signed in on Home (a customer that has orders). Coordinates are for the
# 1080x2400 SM-A057F: tab bar y=2143, tab x = 141 / 340 / 540 / 740 / 938.
ADB="${ADB:-$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe}"
PKG=host.exp.exponent
"$ADB" shell dumpsys gfxinfo "$PKG" reset >/dev/null
down() { "$ADB" shell input swipe 540 1700 540 600 250; sleep 0.4; }
up()   { "$ADB" shell input swipe 540 600 540 1700 250; sleep 0.4; }
tab()  { "$ADB" shell input tap "$1" 2143; sleep 2; }
for _ in 1 2 3 4; do down; done
for _ in 1 2 3 4; do up; done
tab 340; down; up; tab 540; down; up; tab 740; down; up; tab 938; down; up; tab 141
echo "== $1"
"$ADB" shell dumpsys gfxinfo "$PKG" | grep -E "Total frames rendered|Janky frames|50th percentile|90th percentile|95th percentile|99th percentile"
```

- [ ] **Step 4: Run it three times and keep the median janky %**

Run: `bash scripts/perf-frames.sh baseline-1` (then `-2`, `-3`)
Expected: each prints six lines (total frames, janky frames with %, four percentiles).

- [ ] **Step 5: Record in `docs/superpowers/perf-baseline.md`**

```markdown
# Performance baseline — 2026-10-26

Device: SM-A057F (Android 15), Expo Go, dev server (`__DEV__` on). **Relative comparison only:** dev mode
is slower than a release build, so compare like with like.

| Metric | Baseline | Budget / target |
|---|---|---|
| Referenced raster assets | 5600 KB | ≤ 1500 KB |
| Janky frames (median of 3 runs) | <fill from Step 4> % | no worse than baseline |
| 90th / 95th / 99th percentile frame time | <fill> / <fill> / <fill> ms | no worse than baseline |

Re-measure at the Phase-3 gate and in Task 25.
```

Replace every `<fill…>` with the measured numbers before committing. **Pass criterion:** the file contains no `<fill` text.

- [ ] **Step 6: Commit**

```bash
git add scripts/asset-weight.sh scripts/perf-frames.sh docs/superpowers/perf-baseline.md
git commit -m "chore(perf): asset-weight and frame-time scripts with a recorded baseline"
```

---

### Task 3: Contrast-safe tokens (TDD)

**Files:**
- Modify: `theme/index.ts`
- Create: `theme/__tests__/contrast.test.ts`

**Interfaces:**
- Produces: `color.onBrand`, `color.brandStrong`, `color.brandSoft` (new); `color.subtle` and `color.danger` (darker values); `status` map keyed by `pending | preparing | delivering | delivered | completed | cancelled | delivery_failed`, each `{ fg: string; bg: string }`. Tasks 4–7 and 12 consume these.

- [ ] **Step 1: Write the failing test** — `theme/__tests__/contrast.test.ts`

```ts
import { color, status } from '@/theme';

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const AA = 4.5;

const textPairs: [string, string, string][] = [
  ['onBrand on brand fill', color.onBrand, color.brand],
  ['brandStrong on surface', color.brandStrong, color.surface],
  ['brandStrong on page bg', color.brandStrong, color.bg],
  ['brandStrong on brandSoft', color.brandStrong, color.brandSoft],
  ['ink on surface', color.ink, color.surface],
  ['muted on surface', color.muted, color.surface],
  ['muted on page bg', color.muted, color.bg],
  ['muted on field', color.muted, color.field],
  ['subtle on surface', color.subtle, color.surface],
  ['subtle on page bg', color.subtle, color.bg],
  ['subtle on field (placeholders)', color.subtle, color.field],
  ['danger on surface', color.danger, color.surface],
  ['white label on danger fill', color.brandInk, color.danger],
];

test.each(textPairs)('%s meets WCAG AA', (_name, fg, bg) => {
  expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AA);
});

test.each(Object.entries(status))('status chip "%s" meets WCAG AA', (_name, { fg, bg }) => {
  expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AA);
});

test('the brand fill is never used as text colour (it cannot pass)', () => {
  expect(contrast(color.brand, color.surface)).toBeLessThan(AA);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest theme/__tests__/contrast.test.ts`
Expected: FAIL (`color.onBrand` etc. are undefined, so `luminance(undefined)` throws, and `status` is not exported).

- [ ] **Step 3: Implement — replace the `color` block and add `status` in `theme/index.ts`**

```ts
export const color = {
  brand: '#69bf70', // FILLS ONLY: 2.26:1 on white, never use as text
  brandInk: '#ffffff', // white text on dark fills (danger, tab pill)
  onBrand: '#0A0A0F', // text on the brand fill (8.73:1)
  brandStrong: '#2E7D32', // brand-coloured TEXT and icons on light backgrounds (5.13:1 on white)
  brandSoft: '#E8F5E9', // tinted brand background (icon discs, selected rows)
  ink: '#0A0A0F',
  muted: '#666666',
  subtle: '#6B6B6B', // was #999999 (2.85:1); now 4.68:1 even on the field grey
  bg: '#f5f5f5',
  surface: '#ffffff',
  field: '#f0f0f0',
  border: '#e6e6e6',
  danger: '#C0392B', // was #d9534f (3.96:1); now 5.44:1 on white
} as const;

// Order status chips: every pair clears 5.7:1.
export const status = {
  pending: { fg: '#8A5300', bg: '#FFF3D6' },
  preparing: { fg: '#0B5CAD', bg: '#E3F0FD' },
  delivering: { fg: '#5B2EA6', bg: '#EFE7FB' },
  delivered: { fg: '#1B5E20', bg: '#E4F4E6' },
  completed: { fg: '#1B5E20', bg: '#E4F4E6' },
  cancelled: { fg: '#4F4F4F', bg: '#EEEEEE' },
  delivery_failed: { fg: '#A12622', bg: '#FDE8E7' },
} as const;
```

Also extend the bottom export: `export const theme = { color, space, radius, type, shadow, status };`

- [ ] **Step 4: Run it and watch it pass**

Run: `npx jest theme/__tests__/contrast.test.ts`
Expected: PASS, 21 tests (13 text pairs + 7 status + 1 guard).

- [ ] **Step 5: Typecheck and commit**

Run: `npx tsc --noEmit` → 0 errors.

```bash
git add theme/index.ts theme/__tests__/contrast.test.ts
git commit -m "feat(theme): contrast-safe colour tokens and order status palette, enforced by a jest test"
```

**Pass criterion:** the jest file is green and `color.brand` is not used as a text colour in the token test.

---

### Task 4: One font, loaded once at the root (D2)

**Files:**
- Modify: `app/_layout.tsx`
- Modify: `components/ui/AppText.tsx`
- Modify: `jest.setup.ts` (fonts must count as loaded under Jest, or `routeGuard.test.tsx`, which renders `RootLayout`, never gets past the blank screen)
- Create: `components/__tests__/AppText.test.tsx`

**Interfaces:**
- Consumes: `color.brandStrong`, `color.onBrand` (Task 3).
- Produces: `AppText` prop `weight: 'regular' | 'semibold' | 'bold'`; tone `onBrand`; tone `brand` now resolves to `color.brandStrong`. Fonts `Nunito_400Regular | Nunito_600SemiBold | Nunito_700Bold` are registered app-wide.

- [ ] **Step 1: Write the failing test** — `components/__tests__/AppText.test.tsx`

```tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { AppText } from '../ui/AppText';
import { color } from '@/theme';

const styleOf = (text: string) => StyleSheet.flatten(screen.getByText(text).props.style);

test('regular uses Nunito 400 and sets no fontWeight', async () => {
  await render(<AppText>hi</AppText>);
  expect(styleOf('hi').fontFamily).toBe('Nunito_400Regular');
  expect(styleOf('hi').fontWeight).toBeUndefined();
});

test('semibold and bold map to their own font files', async () => {
  await render(
    <>
      <AppText weight="semibold">semi</AppText>
      <AppText weight="bold">bold</AppText>
    </>,
  );
  expect(styleOf('semi').fontFamily).toBe('Nunito_600SemiBold');
  expect(styleOf('bold').fontFamily).toBe('Nunito_700Bold');
});

test('tone brand is the AA-safe green, never the fill green', async () => {
  await render(<AppText tone="brand">green</AppText>);
  expect(styleOf('green').color).toBe(color.brandStrong);
});

test('tone onBrand is the dark ink used on green fills', async () => {
  await render(<AppText tone="onBrand">label</AppText>);
  expect(styleOf('label').color).toBe(color.onBrand);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest components/__tests__/AppText.test.tsx`
Expected: FAIL (`fontFamily` undefined, no `semibold`, `brand` is `#69bf70`).

- [ ] **Step 3: Replace `components/ui/AppText.tsx`**

```tsx
import React from 'react';
import { Text, TextProps } from 'react-native';
import { color, type } from '@/theme';

const tones = {
  ink: color.ink,
  muted: color.muted,
  subtle: color.subtle,
  brand: color.brandStrong, // text-safe green; the fill green fails contrast
  danger: color.danger,
  inverse: color.brandInk,
  onBrand: color.onBrand,
} as const;

// One family, three files. Do not pass fontWeight: on Android a custom family plus fontWeight fake-bolds.
const families = {
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
} as const;

type AppTextProps = TextProps & {
  variant?: keyof typeof type;
  tone?: keyof typeof tones;
  weight?: keyof typeof families;
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
      style={[{ fontSize: type[variant], color: tones[tone], fontFamily: families[weight] }, style]}
      {...rest}
    />
  );
}
```

- [ ] **Step 4: Load the fonts once in `app/_layout.tsx`**

Add the import and replace `RootNavigator`'s head:

```tsx
import { useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';

const RootNavigator = () => {
  const { isAuthenticated, loading } = useAuth();
  const [fontsLoaded, fontError] = useFonts({ Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold });
  // A font failure must not trap the user on the splash screen: fall back to the system font.
  const ready = !loading && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
```

(The `Stack.Protected` tree below it is unchanged.)

- [ ] **Step 4b: Treat fonts as loaded under Jest** — append to `jest.setup.ts`

```ts
// Web fonts need the native font loader, which never resolves under Jest: report them as loaded.
jest.mock('@expo-google-fonts/nunito', () => ({
  useFonts: () => [true, null],
  Nunito_400Regular: 'Nunito_400Regular',
  Nunito_600SemiBold: 'Nunito_600SemiBold',
  Nunito_700Bold: 'Nunito_700Bold',
}));
```

Run: `npx jest screens/__tests__/routeGuard.test.tsx` → PASS (unchanged from baseline). If it fails, fix the mock before going on.

- [ ] **Step 5: Find and fix any `fontWeight` passed to `AppText`**

Run: `grep -rnE "AppText[^>]*fontWeight|fontWeight" screens components --include=*.tsx | grep -v __tests__`
For each hit inside an `<AppText …>` style, replace it with the `weight` prop. Hits on plain `<Text>` are migrated in their own screen tasks.

- [ ] **Step 6: Run tests, typecheck, check on device**

Run: `npx jest components/__tests__/AppText.test.tsx` → PASS (4 tests). `npx tsc --noEmit` → 0 errors.
Device: cold-launch signed out, then sign in as `flow.customer`. **Pass criterion:** Orders and Profile text now renders in Nunito (rounded letterforms) where it was Roboto before, and the splash screen hides normally.

- [ ] **Step 7: Commit**

```bash
git add app/_layout.tsx components/ui/AppText.tsx components/__tests__/AppText.test.tsx jest.setup.ts
git commit -m "feat(type): load Nunito once at the root and map AppText weights to font files"
```

---

### Task 5: AppButton — readable labels and a stable accessible name (D1)

**Files:**
- Modify: `components/ui/AppButton.tsx`
- Create: `components/__tests__/AppButton.test.tsx`

**Interfaces:** Consumes `AppText` tone `onBrand`, `color.onBrand`.

- [ ] **Step 1: Write the failing test** — `components/__tests__/AppButton.test.tsx`

```tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { AppButton } from '../ui/AppButton';
import { color } from '@/theme';

test('primary label is dark ink on the green fill', async () => {
  await render(<AppButton title="Go" onPress={jest.fn()} />);
  expect(StyleSheet.flatten(screen.getByText('Go').props.style).color).toBe(color.onBrand);
});

test('danger label stays white', async () => {
  await render(<AppButton title="Delete" variant="danger" onPress={jest.fn()} />);
  expect(StyleSheet.flatten(screen.getByText('Delete').props.style).color).toBe(color.brandInk);
});

test('keeps its accessible name while loading (no "busy" announcement)', async () => {
  await render(<AppButton title="Go" onPress={jest.fn()} loading />);
  expect(screen.getByLabelText('Go')).toBeTruthy();
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest components/__tests__/AppButton.test.tsx`
Expected: FAIL (primary label is `#ffffff`; no `accessibilityLabel`).

- [ ] **Step 3: Edit `components/ui/AppButton.tsx`**

Change `labelTones` and add the label and a variant-aware spinner:

```tsx
const labelTones: Record<Variant, 'onBrand' | 'ink' | 'inverse'> = {
  primary: 'onBrand',
  secondary: 'ink',
  danger: 'inverse',
};

const spinnerColors: Record<Variant, string> = {
  primary: color.onBrand,
  secondary: color.ink,
  danger: color.brandInk,
};
```

On the `TouchableOpacity` add `accessibilityLabel={title}`. Replace the spinner with `<ActivityIndicator size="small" color={spinnerColors[variant]} />` and the label with `<AppText variant="body" weight="bold" tone={labelTones[variant]}>{title}</AppText>`.

- [ ] **Step 4: Run, typecheck, device check**

Run: `npx jest components/__tests__/AppButton.test.tsx` → PASS (3). `npx tsc --noEmit` → 0.
Device (Sign In screen): **Pass criterion:** the "Sign In" label is dark on green, and after a failed login the `uiautomator` dump still names the button "Sign In" (it previously changed to "busy").

- [ ] **Step 5: Commit**

```bash
git add components/ui/AppButton.tsx components/__tests__/AppButton.test.tsx
git commit -m "fix(a11y): dark labels on green buttons (8.7:1) and a stable accessible name"
```

---

### Task 6: StatusChip and EmptyState primitives (TDD)

**Files:**
- Create: `components/ui/StatusChip.tsx`, `components/ui/EmptyState.tsx`
- Create: `components/__tests__/StatusChip.test.tsx`, `components/__tests__/EmptyState.test.tsx`

**Interfaces:**
- Consumes: `status`, `color`, `space`, `radius` (Task 3); `AppText`, `AppButton`.
- Produces: `StatusChip({ value: string })` and `type OrderStatus = keyof typeof status`; `EmptyState({ icon, title, message?, actionLabel?, onAction? })`. Tasks 12, 14, 15, 22, 23 use them.

- [ ] **Step 1: Write the failing tests**

`components/__tests__/StatusChip.test.tsx`:

```tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { StatusChip } from '../ui/StatusChip';
import { status } from '@/theme';

test.each([
  ['pending', 'Pending'],
  ['preparing', 'Preparing'],
  ['delivering', 'On the way'],
  ['delivered', 'Delivered'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
  ['delivery_failed', 'Delivery failed'],
])('%s shows "%s" in its own colours', async (value, label) => {
  await render(<StatusChip value={value} />);
  const style = StyleSheet.flatten(screen.getByText(label).props.style);
  expect(style.color).toBe(status[value as keyof typeof status].fg);
});

test('an unknown status from the server shows its raw text on a neutral chip', async () => {
  await render(<StatusChip value="on_hold" />);
  const style = StyleSheet.flatten(screen.getByText('on_hold').props.style);
  expect(style.color).toBe(status.cancelled.fg);
});
```

`components/__tests__/EmptyState.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { EmptyState } from '../ui/EmptyState';

test('shows the title and message', async () => {
  await render(<EmptyState icon="receipt-outline" title="No orders yet" message="Your orders appear here" />);
  expect(screen.getByText('No orders yet')).toBeTruthy();
  expect(screen.getByText('Your orders appear here')).toBeTruthy();
});

test('renders the action only when both label and handler are given, and calls it', async () => {
  const onAction = jest.fn();
  await render(<EmptyState icon="refresh" title="Could not load" actionLabel="Try again" onAction={onAction} />);
  fireEvent.press(screen.getByText('Try again'));
  expect(onAction).toHaveBeenCalledTimes(1);
});

test('has no button without an action', async () => {
  await render(<EmptyState icon="refresh" title="Nothing here" />);
  expect(screen.queryByRole('button')).toBeNull();
});
```

- [ ] **Step 2: Run both and watch them fail**

Run: `npx jest components/__tests__/StatusChip.test.tsx components/__tests__/EmptyState.test.tsx`
Expected: FAIL (modules not found).

- [ ] **Step 3: Create `components/ui/StatusChip.tsx`**

```tsx
import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';
import { radius, space, status } from '@/theme';

export type OrderStatus = keyof typeof status;

const labels: Record<OrderStatus, string> = {
  pending: 'Pending',
  preparing: 'Preparing',
  delivering: 'On the way',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  delivery_failed: 'Delivery failed',
};

// `value` is a plain string because it comes from the server: a status added later must degrade to a
// neutral chip with its raw text, not crash the screen.
export function StatusChip({ value }: { value: string }) {
  const known = value in status;
  const { fg, bg } = known ? status[value as OrderStatus] : status.cancelled;
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: bg,
        borderRadius: radius.pill,
        paddingHorizontal: space.sm + 2,
        paddingVertical: space.xs,
      }}
    >
      <AppText variant="micro" weight="bold" style={{ color: fg }}>
        {known ? labels[value as OrderStatus] : value}
      </AppText>
    </View>
  );
}
```

- [ ] **Step 4: Create `components/ui/EmptyState.tsx`**

```tsx
import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { color, space } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// A vector icon on a tinted disc: zero image weight, works offline.
export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: space.lg, gap: space.sm }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: color.brandSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: space.sm,
        }}
      >
        <Ionicons name={icon} size={32} color={color.brandStrong} />
      </View>
      <AppText variant="h2" weight="bold" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      {message ? (
        <AppText tone="muted" style={{ textAlign: 'center' }}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <AppButton title={actionLabel} onPress={onAction} style={{ marginTop: space.md, alignSelf: 'stretch' }} />
      ) : null}
    </View>
  );
}
```

- [ ] **Step 5: Run, typecheck, commit**

Run: `npx jest components/__tests__/StatusChip.test.tsx components/__tests__/EmptyState.test.tsx` → PASS (8 + 3 tests). `npx tsc --noEmit` → 0.

```bash
git add components/ui/StatusChip.tsx components/ui/EmptyState.tsx components/__tests__/StatusChip.test.tsx components/__tests__/EmptyState.test.tsx
git commit -m "feat(ui): StatusChip and EmptyState primitives"
```

**Pass criterion:** both suites green; an unknown status renders its raw text.

---

### Task 7: Asset diet

**Files:** `assets/**` (delete, recompress); no source changes.

- [ ] **Step 1: Record "before"**

Run: `bash scripts/asset-weight.sh | tail -1` → `5600 KB  TOTAL (budget: 1500 KB)`.

- [ ] **Step 2: Delete the unreferenced files (≈1.45 MB, none ship in the bundle but they bloat the repo)**

First prove each is unreferenced (all four greps must print nothing):

```bash
for f in "image1.png" "track.png" "signinbackground.jpg" "logo.jpg" "profilePic.jpg" "moneyIcon.png" "orderIcon.png" "HouseSimple (1).png" "ordericon.svg"; do
  grep -rnF "$f" screens components app store services constants styles app.json graphify-out 2>/dev/null | grep -v "swiperImages/image1.png" ;
done
```

Then:

```bash
git rm assets/image1.png assets/track.png assets/signinbackground.jpg assets/logo.jpg assets/profilePic.jpg \
  assets/navbarIcons/moneyIcon.png assets/navbarIcons/orderIcon.png "assets/HouseSimple (1).png" assets/images/ordericon.svg
```

(`assets/swiperImages/image1.png` is referenced and stays; the root `assets/image1.png` is its unreferenced duplicate.)

- [ ] **Step 3: Compress the rest with Expo's own tool**

Run: `npx --yes expo-optimize --quality 75`
Then: `git status --short assets` and `bash scripts/asset-weight.sh | head -8`.
Expected: the six heavy files shrink. `expo-optimize` compresses but does not change pixel dimensions.

- [ ] **Step 4: If the TOTAL is still above 1500 KB, resize the remaining heavy files**

For each file still above 150 KB: find the size it is displayed at (`width`/`height` on its `<Image>`), compute `dp × 3` pixels as the maximum longest edge, and downscale in place without ever upscaling. Run `npx --yes sharp-cli --help` and use its resize command with that value. Re-run Step 3's script after each file.
Expected: TOTAL ≤ 1500 KB.

- [ ] **Step 5: Visual regression check**

Device, signed in: Home (both preference banners, cart FAB), Orders, Payments illustration, Notifications bell, Profile avatar, and the three onboarding slides. Screenshot each. **Pass criterion:** no visible blur or banding at normal viewing size, and `scripts/asset-weight.sh` TOTAL ≤ 1500 KB.

- [ ] **Step 6: Commit**

```bash
git add -A assets
git commit -m "perf(assets): drop unreferenced images and recompress the rest (5.6 MB -> under 1.5 MB)"
```

---

**PHASE 1 GATE (stop here).** Run `npx jest` (all green, count grew by 21 + 4 + 3 + 11 = 39 tests, to 214) and `npx tsc --noEmit` (0). Post before/after screenshots and the new `asset-weight` total, and get D1 and D2 confirmed. If D1 = B or D2 = system font, Tasks 3–5 get a small follow-up edit before Phase 2.

---

# PHASE 2 — Shared chrome, Home, Cart

Step-level detail is written at the start of this phase, using the Phase-1 primitives as they actually look on the device.

### Task 8: Tab bar and tab button

**Files:** `components/tabBar/tabBar.tsx`, `components/tabBarButton.tsx/tabBarButton.tsx` (the directory is oddly named `tabBarButton.tsx`; rename it to `components/tabBarButton/` and fix its imports in the same commit).
**Change:** token-only colours and type (5 hex + 2 font sizes removed), selected-pill label and badge on AA pairs, ≥ 48 dp targets, shadow `bar` reduced, animation kept to `transform`/`opacity`.
**Pass:** no hex literal left in either file; unread badge still shows and clears; the selected pill is distinguishable by more than colour (it is filled); jest `home`/`notifications` suites still green.

### Task 9: Card, Field, popup modal

**Files:** `components/ui/Card.tsx`, `components/ui/Field.tsx`, `components/popupmodel/popupModel.tsx`.
**Change:** `shadow.card` elevation 5 → 2 (the single biggest paint cost on repeated cards), focused-field border in `brandStrong`, modal on tokens (removes 2 hex + 2 font sizes), scrim and sheet radii from tokens.
**Pass:** shadows visibly lighter but cards still separate from the page; Edit Order and Cancel dialogs unchanged in behaviour; focused fields show a visible border.

### Task 10: Home

**Files:** `screens/homeTab/home/home.screen.tsx`, `components/flatList/flatList.tsx`.
**Change:** meal tabs and "Open now / Closed" states on tokens; preference banners as one lazy-decoded image each with fixed aspect ratio; menu rows as a single `FlatList` row component with a fixed thumbnail size, a placeholder, a price in `ink` and no per-row elevation above 2; spacing under "Vegetarian Items (n)"; cart FAB moved so it never overlaps a banner or the tab bar (clearance from `TAB_BAR_HEIGHT`); closed state banner kept.
**Pass:** the Veg/Non-Veg lists scroll with no more janky frames than the baseline (`perf-frames.sh`); FAB overlaps nothing at 320 dp and 412 dp; `home.screen.test.tsx` green.

### Task 11: Cart

**Files:** `screens/cart/cart.screen.tsx`.
**Change:** on tokens (8 hex + 7 font sizes removed); stepper buttons ≥ 48 dp; the remove ✖ becomes an Ionicons `trash-outline` in `danger`; the total bar sits above the safe area; item image gets the same placeholder as Home.
**Pass:** CONFIRM ORDER is reachable and never covered (check with the dev LogBox open); `cart.screen.test.tsx` green.

**PHASE 2 GATE:** `npx jest`, `npx tsc --noEmit`, `perf-frames.sh phase2`, screenshots of Home, Cart and the tab bar.

---

# PHASE 3 — Tab screens

### Task 12: Orders

**Files:** `screens/orderStatus/orderStatus.screen.tsx` (370 lines, 26 hex, 14 font sizes).
**Change:** card layout on `Card`; `StatusChip` replaces the green "Status - PENDING" text; meal time, items and total as a clear hierarchy; Edit and Cancel as `AppButton` variants; the edit modal shows each addable item's price; `EmptyState` for "No orders found".
**Pass:** PENDING and PREPARING are distinguishable by chip colour; no hex literal left in the file; tests for the screen (add `screens/__tests__/orderStatus.screen.test.tsx` covering empty state and a card with a chip) green.

### Task 13: Payments

**Files:** `screens/pendingPayments/pendingPayments.screen.tsx`.
**Change:** on `Card` and tokens (9 hex + 7 font sizes removed); an amount-first layout; the illustration replaced by the lighter recompressed asset or an `EmptyState` icon; the intro line becomes a banner when the customer is at the limit.
**Pass:** no hex literals left; empty and populated states both render.

### Task 14: Notifications

**Files:** `screens/notifications/notifications.screen.tsx`.
**Change:** cards on tokens; unread vs read distinguishable beyond the tab badge; `EmptyState` for empty, a retry `EmptyState` for errors (the screen already has a retry affordance, now visible and in the shared style); bell asset replaced by the recompressed one.
**Pass:** `notifications.screen.test.tsx` green with its existing assertions unchanged.

### Task 15: Profile, edit-profile and change-password

**Files:** `screens/profile/profile.screen.tsx`, `components/profile/EditProfileForm.tsx`, `components/profile/ChangePasswordModal.tsx`.
**Change:** header spacing matched between sibling screens (Edit Profile and Change Password titles sit at different heights today), avatar from the recompressed asset, read-only fields styled as read-only, Logout and Delete Account separated and Delete Account given a stronger confirmation (type the word `DELETE` or re-enter the password; confirm the choice with the product owner first), bottom clearance so Delete Account is not within one thumb-width of the tab bar.
**Pass:** `profile.screen.test.tsx` green; the title top offsets of Edit Profile and Change Password are identical in the `uiautomator` dump.

**PHASE 3 GATE:** `npx jest`, `tsc`, `perf-frames.sh phase3`, compare with the baseline in `perf-baseline.md`, screenshots of all four tabs.

---

# PHASE 4 — Auth family

### Task 16: AuthLayout and Sign In

**Files:** `components/ui/AuthLayout.tsx`, `screens/auth/login/login.screen.tsx`.
**Change:** hero image on a fixed 16:9 box with one `scrim` overlay (no gradient behind scrolling content); "Forgot Password?" gets spacing from the button; title uses `AppText`; inline errors attach to the right field (account-status errors go in a banner above the form, not under the password field); the `TODO(google-auth)` comment stays.
**Pass:** `login.screen.test.tsx` green; "Forgot Password?" and "Sign In" have ≥ 12 dp between them in the dump.

### Task 17: Sign-up (both steps) and verify

**Files:** `screens/auth/signUp/signUp.screen.tsx`, `screens/auth/signUpSecond/signUpSecond.screen.tsx`, `screens/auth/verify/verify.screen.tsx`.
**Change:** on `AuthLayout`, `Field` and tokens; step 2 gets a visible back affordance and a step indicator ("Step 2 of 2"); "Complete SignUp" → "Create account"; casing consistent with "Sign Up".
**Pass:** step 1 → step 2 → back preserves typed values; validation messages unchanged.

### Task 18: Forgot and reset password

**Files:** `screens/auth/forgotPassword/forgotPassword.screen.tsx`, `screens/auth/resetPassword/resetPassword.screen.tsx`.
**Change:** shorten the Reset Password intro to two lines; the resend timer in `muted` (4.5:1), "Use a different email" styled as a link; code field with `inputMode="numeric"` and 6-digit grouping.
**Pass:** `passwordReset.test.tsx` green with no assertion changes.

### Task 19: Onboarding and welcome

**Files:** `screens/onboarding/onboarding.tsx`, `screens/welcome/welcome.intro.tsx`, `package.json`.
**Change:** delete their own `useFonts` blocks and Raleway/Nunito imports (the root loads Nunito now); replace the `Raleway_*` and `Nunito_*` `fontFamily` literals with `AppText`; run `npm uninstall @expo-google-fonts/raleway`; compress the slide images further if Task 7 left any above 150 KB.
**Pass:** `grep -rn "Raleway" screens components app` prints nothing; the three slides and the welcome screen render in Nunito; the app starts with no `useFonts` outside `_layout.tsx`.

**PHASE 4 GATE:** `npx jest`, `tsc`, sign-out → onboarding → sign-up step 1/2 → login on the device, screenshots of each.

---

# PHASE 5 — Order states and behaviours

These are the audit's functional gaps. Each task starts by reading the backend rule it depends on (read-only; no Backend repo changes).

### Task 20: Orders — show `delivering`, gate actions by status, honest errors

**Files:** `services/order/order.service.ts` (`getUndeliveredOrdersToday`), `screens/orderStatus/orderStatus.screen.tsx`.
**Change:** request `status: 'pending,preparing,delivering'`; show Edit and Cancel only for `pending` (first confirm in `order.controller.js` which statuses the backend allows to cancel/edit); map the cancel failure to the server's real message; close the confirmation dialog whether the call succeeds or fails.
**Pass:** on `qa.customer` the `ui-ord-delivering` order appears with an "On the way" chip and no buttons; `ui-ord-preparing` shows no Cancel; cancelling a `pending` order still works; a failed cancel closes the dialog and shows the server's reason.

### Task 21: Payments — match the checkout rule

**Files:** `services/order/order.service.ts` (`getPendingPaymentOrders`), `screens/pendingPayments/pendingPayments.screen.tsx`.
**Change:** request `{ type: 'all', payment_status: 'unpaid' }` (the backend already supports it) so `delivery_failed` unpaid orders appear and the list matches what checkout counts; show the meal date and status chip instead of `created_at`; reword the intro to "You can't place new orders while you have 2 unpaid orders".
**Pass:** `qa.customer` (has `ui-ord-deliv-unpd` and `ui-ord-failed`) sees both in Payments and the count agrees with the checkout block.

### Task 22: Order history (D3)

**Files:** `services/order/order.service.ts` (`getOrderHistory`), create `screens/orderHistory/orderHistory.screen.tsx` and `app/(routes)/order-history/index.tsx`, register it in `app/_layout.tsx` under `Stack.Protected guard={isAuthenticated}`, add an entry point on Orders.
**Change:** before writing, read `order.controller.js` list handler for paging parameters; `FlatList` of `Card` + `StatusChip` rows; `EmptyState` when empty; skeleton while loading (Task 23).
**Pass:** `qa.customer` sees `ui-ord-deliv-paid`, `ui-ord-completed`, `ui-ord-cancelled` there; a jest test covers empty and populated states.

### Task 23: Loading, empty, error and offline states

**Files:** create `components/ui/Skeleton.tsx` (Reanimated `opacity` pulse, with the jest mock decision recorded at the top of the file), then adopt it and `EmptyState` in Home, Orders, Payments, Notifications, History.
**Change:** every list shows a skeleton while loading (not a spinner), an `EmptyState` with a retry button on failure, and keeps the last good data visible when a refresh fails.
**Pass:** with Wi-Fi off on the phone, each screen shows its error state with a working retry; no screen shows a blank page.

### Task 24: Checkout errors

**Files:** `screens/cart/cart.screen.tsx`, `services/` error mapping where the message strings are matched.
**Change:** map "Customer area not found" to "Set your delivery area in Profile before ordering"; the unpaid message says "2 or more"; the handler matches on a status code or error code where the backend provides one, falling back to the message; replace `console.error` for expected API errors with a `console.warn`-level logger so the dev LogBox no longer takes over the screen.
**Pass:** `flow.noarea` sees the area message at checkout; `qa.customer` sees the unpaid message; in development no red LogBox opens for either case.

**PHASE 5 GATE:** `npx jest` (new tests included), `tsc`, walk every status on `qa.customer`, screenshots.

---

# PHASE 6 — Release hygiene

### Task 25: Wrap-up

**Files:** `app.json`, `docs/superpowers/DEVICE-CHECKLIST-ui-refactor.md` (or a new `DEVICE-CHECKLIST-ui-modernization.md`), `docs/superpowers/perf-baseline.md`.
- [ ] Set `"userInterfaceStyle": "light"` in `app.json`.
- [ ] Drift check — must print nothing:

```bash
grep -rnE "#[0-9a-fA-F]{3,8}\b|rgba?\(|fontSize:\s*[0-9]+|fontFamily:\s*[\"']" screens components --include=*.tsx | grep -vE "__tests__|components/ui/(AppText|Field)\.tsx"
```
  Any hit is moved into the theme or replaced by a primitive. Hits in the allow-listed files are legitimate token consumers.
- [ ] `bash scripts/asset-weight.sh | tail -1` → ≤ 1500 KB; `bash scripts/perf-frames.sh final` three times; add a "Final" column to `perf-baseline.md`. **Pass:** median janky % no worse than baseline.
- [ ] `npx tsc --noEmit` → 0; `npx jest` → all green.
- [ ] Update the device checklist with: every order status (use `qa.customer`'s `ui-ord-*` orders), light-mode lock, slow/offline behaviour, and an **iOS pass list** to run when an iPhone is available (fonts, shadows, safe-area insets, keyboard avoidance).
- [ ] Commit, then use `superpowers:finishing-a-development-branch` to open the PR.

---

## Self-review (run against the spec)

- **§3 budget:** assets (Task 7, 25), animation/blur/gradient limits (Global Constraints, Task 23 `Skeleton`), lists and shadows (Tasks 9, 10), states (Task 23), one font (Tasks 4, 19). ✓
- **§4 evidence → fix:** contrast (3, 5), theme drift (8–19, check in 25), type (4, 19), assets (7), delivering (20), history (22), delivery_failed and checkout mismatch (21), wording (21, 24), `preparing` gating (20), no-area (24), Payments date (21), LogBox noise (24). ✓
- **§5 decisions:** D1 → Task 5, D2 → Task 4, D3 → Task 22; all gated at Phase 1 or Task 22. ✓
- **§6 criteria:** 1 → Task 3 test, 2 → Task 7 script, 3 → Tasks 2/25 frames, 4 → every task's protocol, 5 → Task 25 grep, 6 → Tasks 12, 20, 22. ✓
- **Names:** `onBrand`, `brandStrong`, `brandSoft`, `status`, `StatusChip`, `EmptyState`, `weight` are defined in Tasks 3–6 and used unchanged afterwards. ✓
- **Placeholder scan:** the only `<fill>` markers are the recorded measurements in Task 2 Step 5, which that step requires replacing before commit. Phases 2–6 are deliberately task-level, as stated in the header.
