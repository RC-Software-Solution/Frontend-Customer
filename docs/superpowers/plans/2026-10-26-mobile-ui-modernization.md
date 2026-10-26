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

**Visual spec:** approved mocks, artifact `https://claude.ai/artifact/XAaVXvE9vWNCxsoB3B2KrU` (any board's bottom bar). D1/D2 confirmed at the Phase-1 gate.

**Files:** `components/tabBar/tabBar.tsx`, `components/tabBarButton.tsx/tabBarButton.tsx` → move with `git mv` to `components/tabBarButton/tabBarButton.tsx` (the directory is oddly named `tabBarButton.tsx`; fix the one import in `tabBar.tsx` in the same commit), `constants/constants.tsx` (the `icon` map, its only consumer is the tab button), `theme/index.ts` (`shadow.bar`), create `components/__tests__/TabBarButton.test.tsx`.

- [ ] **Step 1 (test first):** `TabBarButton.test.tsx` renders `TabBarButton` and asserts: the label text is visible when focused AND when not focused (today the focused label is hidden at opacity 0); `accessibilityState.selected` is true only when focused; `badge={3}` shows "3" with accessibility label "3 unread", `badge={12}` shows "9+", `badge={0}` shows nothing; the label of a focused tab uses `color.onBrand` and an unfocused one `color.muted` (flatten the style as the other component tests do). Run it and watch it fail.
- [ ] **Step 2:** Rewrite `tabBarButton.tsx` on tokens: no hex, no `fontSize`/`fontWeight` literals, no `Text`/`Animated.Text`; label is `<AppText variant="micro" weight="semibold|bold" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>` (tone `onBrand` when focused, `muted` otherwise). Icons are `Ionicons` (no image weight), outline when unfocused and filled when focused, size 24: `index` `restaurant-outline`/`restaurant`, `order-status/index` `time-outline`/`time`, `pending-payments/index` `receipt-outline`/`receipt`, `notification/index` `notifications-outline`/`notifications`, `profile/index` `person-outline`/`person`; icon colour `color.onBrand` when focused else `color.muted`. Remove the animated `top` interpolation (it animates a layout property); keep at most a `transform`/`opacity` press or focus effect, or none. Badge: `color.danger` fill, `color.brandInk` text, `AppText variant="micro" weight="bold"`, positioned at the icon's top-right, label `"{n} unread"`, `9+` above 9. The pressable is ≥ 48 dp tall and, because five tabs share the bar, at least 56 dp tall with `accessibilityRole="button"`, `accessibilityLabel` = the label text and `accessibilityState={{ selected: isFocused }}`.
- [ ] **Step 3:** In `tabBar.tsx` remove the two literal colours (`'#69bf70'`, `'#222'`), stop passing a `color` prop, and size the sliding pill from tokens (fill `color.brand`, radius `radius.lg`, inset `space.xs`/`space.sm` rather than the magic 25/15/12.5). Keep the spring slide of the pill (it is a `transform`). Bar `shadow`: edit `shadow.bar` in `theme/index.ts` to `elevation: 6, shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }`. Keep `TAB_BAR_HEIGHT` and `TAB_BAR_GAP` unchanged (screens depend on them).
- [ ] **Step 4:** Remove the now-unused `icon` export from `constants/constants.tsx` (keep `onboardingSwiperData`). After this the five `assets/navbarIcons/{homeIcon,orderStatus,payUp,notify,prof}.png` files are unreferenced: prove it with the same grep as Task 7 Step 2, then `git rm` them.
- [ ] **Step 5 (verify):** `npx tsc --noEmit` 0 errors; `npx jest` all green (baseline 23 suites / 214 tests, +the new tests); `grep -nE "#[0-9a-fA-F]{3,8}\b|fontSize|fontWeight" components/tabBar/tabBar.tsx components/tabBarButton/tabBarButton.tsx` prints nothing; `bash scripts/asset-weight.sh | tail -1` is lower than 1430 KB. Device: all five labels fully readable (no clipping of "Notifications"), the selected pill slides between tabs, the unread badge shows with a notice present (`flow.customer` — use the backend's admin notice route or `node scripts/dev-scenario.js` if one exists, otherwise state that the badge was verified by the unit test only) and clears after opening the tab; screenshot Home with the bar.

**Pass:** no hex literal and no `fontSize`/`fontWeight` in either file; label visible on every tab; the selected pill is filled (not colour-only); badge shows and clears; `home` and `notifications` suites still green with no assertion changes.

### Task 9: Card, Field, popup modal

**Files:** `theme/index.ts` (`shadow.card`, new `color.scrim`), `components/ui/Field.tsx`, `components/popupmodel/popupModel.tsx`; create `components/__tests__/Field.test.tsx`, `components/__tests__/CancelModal.test.tsx`. `components/ui/Card.tsx` needs no edit (it reads `shadow.card`).

- [ ] **Step 1 (tests first), `Field.test.tsx`:** unfocused field has a transparent border; after `fireEvent(input, 'focus')` its `borderColor` is `color.brandStrong`; after `blur` it returns to transparent; with `error="x"` the border is `color.danger` even when focused; a caller-supplied `onFocus`/`onBlur` is still called; the password toggle (`secure`) has accessibility label "Show password" then "Hide password" and its style `width` and `height` are both ≥ 48. `CancelModal.test.tsx`: renders the default title "Cancel Order", the default message, pressing "No" calls `onClose`, pressing "Yes" calls `onConfirm`, custom `title`/`confirmText` render. Run both and watch the Field tests fail (the modal tests may already pass: that is fine, they pin behaviour before the restyle).
- [ ] **Step 2 (`theme/index.ts`):** `shadow.card` becomes `{ elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 }` (the single biggest paint cost on repeated cards: elevation 5 → 2). Add `scrim: 'rgba(10,10,15,0.5)'` to `color` (it is an overlay, not a text colour, so it is not added to the contrast test).
- [ ] **Step 3 (`Field.tsx`):** track focus with `useState`; always `borderWidth: 2` (so focusing causes no layout shift); border `color.danger` when `error`, else `color.brandStrong` when focused, else `'transparent'`; background `color.surface` when focused else `color.field`. Wrap the caller's `onFocus`/`onBlur` (call theirs after setting state). Replace the toggle's `hitSlop` with an explicit 48×48 touch area (`width: 48, height: 48, alignItems/justifyContent: 'center'`, `right: 0`) and widen the input's right padding to match. Label: `AppText variant="caption" tone="muted" weight="semibold"`.
- [ ] **Step 4 (`popupModel.tsx`):** tokens only. Scrim `color.scrim`; sheet `color.surface`, `radius.lg`, `padding: space.lg`; title `AppText variant="h2" weight="bold"` with `marginBottom: space.sm`; message `AppText variant="body" tone="muted"` centred with `marginBottom: space.lg`; remove the `Text` import and every hex / `fontSize` / `fontWeight` literal; the two buttons keep their `minHeight: 48`, their `cancelButton`/`confirmButton` colours, behaviour and props unchanged.
- [ ] **Step 5 (verify):** `npx tsc --noEmit` 0; `npx jest` green (adds the new tests); `grep -nE "#[0-9a-fA-F]{3,8}\b|fontSize|fontWeight" components/ui/Field.tsx components/popupmodel/popupModel.tsx` prints nothing. Device: the Edit Order and Cancel dialogs (Orders → Cancel on the pending order, then choose **No**; never confirm a destructive action) look unchanged in behaviour; tap a Field (Sign In email) and see the green focus border; cards on Orders are visibly lighter but still separate from the page. Screenshot Orders with the Cancel dialog open and Sign In with a focused field.

**Pass:** shadows visibly lighter, cards still separate from the page; the dialogs behave exactly as before; focused fields show a visible border; the two new test files are green.

### Task 10: Home

**Visual spec:** the approved Home and Menu-list boards (artifact above). **Behaviour does not change:** the real Home expands the Veg / Non-Veg section in place under its banner and items are chosen with a checkbox, then the cart button opens the cart. The mock's "Add" buttons and "View cart" bar are NOT built; take only the row look, the meal-tab look and the cart button look from the mocks.

**Files:** `screens/homeTab/home/home.screen.tsx`, `components/flatList/flatList.tsx`. `screens/__tests__/home.screen.test.tsx` must pass with **no assertion changes**: it relies on the exact texts "Choose Your Preference", "Vegetarian Items (1)", "RC Caterings", the hint strings from the server ("Open now", "Closed", "Opens 6:00 PM", "No menu"), the accessibility labels "Toggle Vegetarian Items" and "View cart", and `testID="select-<name>"`. Keep every one of them.

- [ ] **Step 1 (baseline):** `npx jest screens/__tests__/home.screen.test.tsx` is green before you start; note the count.
- [ ] **Step 2 (`flatList.tsx`, the menu row):** wrap in `React.memo`; use `Card` (`components/ui/Card`) with `padding: space.sm + 2`, `marginBottom: space.sm`; thumbnail 72×72, `radius.md`, `resizeMode="cover"`, `backgroundColor: color.field` as its placeholder (still the bundled `plate.jpeg`); name `AppText variant="body" weight="bold"`; description `AppText variant="caption" tone="muted" numberOfLines={2}`; price `AppText variant="caption" weight="bold"` (ink). `BouncyCheckbox`: `fillColor={color.brandStrong}`, `unFillColor={color.surface}`, `iconStyle={{ borderColor: color.brandStrong }}`, keep `testID`, `disabled`, `isChecked`, `onPress`; make its touch area ≥ 48 dp by giving its `style` `padding: 12` (25 + 24 = 49). Keep the `flexGrow/flexShrink` comment and values on the text column (they fix a real Android bug). Remove `Text` and every hex/font literal; the disabled look stays `opacity: 0.55`.
- [ ] **Step 3 (`home.screen.tsx`):** `Text` → `AppText` everywhere and remove the `Text` import: "RC Caterings" `variant="h1" weight="bold"`; "Choose Your Preference" `variant="h2" weight="bold"`; loading text `tone="brand"` (the old `#69bf70` text fails contrast), spinner `color={color.brandStrong}`; `loadingContainer` etc. keep their layout. Meal tabs: container `Card`-like (surface, `radius.lg`, `padding: space.xs`); each tab `minHeight: 64`, `radius.md`, `accessibilityRole="button"`, `accessibilityState={{ selected }}`; selected: `color.brand` fill with `tone="onBrand"` for **both** lines and no opacity on the hint; unselected: name `tone="brand"`, hint `tone="muted"`. The closed/state banner (`tab.banner`) uses `status.pending.bg` fill and `status.pending.fg` text colour (replaces `#fff4d6`). Backgrounds and the `StatusBarScrim` use `color.bg`. Preference banners: keep `require(...)` images, fixed `height: 150`, `borderRadius: radius.lg`, `resizeMode="cover"`, `accessibilityRole="button"`, `accessibilityState={{ expanded }}`; expanded section title gets `marginBottom: space.md` (spacing under "Vegetarian Items (n)") and its tone is `ink` with `weight="bold"`. Cart button: 56×56, `color.brand` fill, `Ionicons name="cart-outline" size={28} color={color.onBrand}` (replaces `cart.png`; delete `assets/cart.png` after proving it is unreferenced), `...shadow.card`; update `CART_FAB_SIZE` to 56 and keep `bottom: padding.paddingBottom + space.sm`, `right: space.md` and the scroll `paddingBottom` that already clears it.
- [ ] **Step 4:** The expandable lists stay as `items.map(...)` inside the existing `ScrollView` (a `FlatList` nested in a vertical `ScrollView` is a React Native anti-pattern and warns); add `// ponytail: bounded list (a handful of dishes per session), a nested FlatList would warn. Switch the screen to one SectionList if menus grow past ~30 items.` above the map. `keyExtractor` equivalent is `key={item.id}` which is already there.
- [ ] **Step 5 (verify):** `npx tsc --noEmit` 0; `npx jest` green and the Home suite's test count unchanged; `grep -nE "#[0-9a-fA-F]{3,8}\b|fontSize|fontWeight" screens/homeTab/home/home.screen.tsx components/flatList/flatList.tsx` prints nothing; `bash scripts/asset-weight.sh | tail -1` lower than before (cart.png gone). Device (run `node scripts/dev-scenario.js all-open` in the Backend repo first): Breakfast/Lunch/Dinner tabs read clearly (dark on green when selected, green or grey when not), both banners expand and collapse, rows scroll, checkbox taps register on the first try, the cart button never covers a banner or row (scroll to the bottom of an expanded section), and `bash scripts/perf-frames.sh phase2-home` ×3 median janky % is no worse than the baseline in `docs/superpowers/perf-baseline.md` (2.38 %). Screenshots: Home collapsed, Home with Vegetarian expanded.

**Pass:** `home.screen.test.tsx` green with no assertion changes; no hex/font literal left in the two files; median janky % not above baseline; cart button overlaps nothing when scrolled to the end.

### Task 11: Cart

**Visual spec:** the approved Cart board. **Behaviour does not change** (`handleConfirmOrder` and the error mapping inside it are not touched; Task 24 owns the messages).

**Files:** `screens/cart/cart.screen.tsx`, `screens/__tests__/cart.screen.test.tsx` (locators only, see Step 1).

- [ ] **Step 1 (test locators):** the current test finds the stepper and remove buttons by their glyph text (`getByText('+')`, `getByText('-')`, `getAllByText('✖')`). Those glyphs go away (trash icon), and a test that locates by a glyph is coupled to the implementation, so change only those three locators to accessibility labels: `getByLabelText('Increase quantity of String Hoppers')`, `getAllByLabelText(/^Decrease quantity of/)[0]` (or the exact name), `getByLabelText('Remove String Hoppers')`; keep every behavioural assertion (totals, "Parcel Quantity: 3", "Total: Rs. 800.00", item removal) exactly as is. Run it and watch the three updated tests fail (labels do not exist yet).
- [ ] **Step 2 (screen):** `Text`/`StyleSheet` hex and font literals out; use `AppText`, `Card`, `AppButton`, `Ionicons`, tokens. Header row (not absolutely positioned): a 48×48 back button (`Ionicons arrow-back`, `color.ink`, label "Go back") then the title `AppText variant="h2" weight="bold"`; keep the title text exactly as the test expects (if the test asserts the emoji heading, keep it, otherwise drop the emoji: emoji never render reliably on this app, the Orders audit found one that did not). Each item is a `Card` (row): 72×72 `item.image` with `radius.md` and `color.field` placeholder, name `AppText variant="body" weight="bold"`, unit price `variant="caption" tone="muted"`, stepper below: two 48×48 round buttons (decrease on `color.field`, increase on `color.brand`), `Ionicons remove`/`add` in `color.ink`/`color.onBrand`, `accessibilityRole="button"`, labels `Decrease quantity of {name}` / `Increase quantity of {name}`, the quantity `AppText weight="bold"` between them, and the line total on the right. Remove: 48×48 touch area, `Ionicons trash-outline` size 22 in `color.danger`, label `Remove {name}`. The `FlatList` keeps its `keyExtractor`.
- [ ] **Step 3:** Summary and button: keep the exact strings "Parcel Quantity: {n}" and "Total: Rs. {x}" (tests match them), as `AppText variant="body" weight="bold"` rows inside a bottom `Card`-style bar with top radius `radius.lg`; `AppButton title="CONFIRM ORDER"` below it with `marginBottom: padding.paddingBottom`, so it sits above the safe area and is never covered. Page background `color.bg`.
- [ ] **Step 4 (verify):** `npx tsc --noEmit` 0; `npx jest` green; `grep -nE "#[0-9a-fA-F]{3,8}\b|fontSize|fontWeight" screens/cart/cart.screen.tsx` prints nothing. Device: pick two dishes on Home, open the cart: the steppers respond on the first tap, the trash removes the right row, CONFIRM ORDER is visible and tappable with the dev LogBox open (dismiss it if it appears). **Do not confirm an order** unless the account is `qa.customer`-style test data; if you do, say so in the report (a confirmed order stays in the dev database). Screenshot the Cart with two items.

**Pass:** CONFIRM ORDER is reachable and never covered; the three updated locators pass and no behavioural assertion changed; no hex/font literal in the file.

### Task 11b: Cart parity with the approved mock (added 2026-10-26 after the product owner found the built UI differed from the mocks)

**Visual spec:** approved Cart board. The gear button drawn at the top right of every mock is Expo Go's own floating dev button, not part of the app: do not build or restyle it.

**Files:** `screens/cart/cart.screen.tsx` only (plus its test file for new assertions; existing assertions stay).

- [ ] **Step 1 (tests first):** add to `screens/__tests__/cart.screen.test.tsx`: the title reads "My cart"; a meal chip shows the cart's meal ("Breakfast") and a caption "2 items" style count text (`{n} item` / `{n} items`, then ", delivered today" when the cart's `session_date` equals `colomboToday()` from `@/services/menu/todayMenu`, otherwise the date as `D MMM`); a "Delivering to" row renders (see Step 3) with an accessible button "Change delivery area in Profile". Run them red.
- [ ] **Step 2 (layout, per the mock):** header title `AppText h2 bold` "My cart" (test strings: update any existing assertion on "Food Basket" to "My cart" — it is the only text change allowed). Under the header a row: chip (`color.brandSoft` fill, `color.brandStrong` text, `radius.pill`, `AppText variant="micro" weight="bold"`) with the meal name capitalised, then the caption (`variant="caption" tone="muted"`). Each item card: top row = 72×72 thumbnail, name + unit price column, trash button (top right, 48×48); **bottom row spans the full card width under the thumbnail**: stepper on the left (48 dp round buttons, quantity between) and the line total on the right (`AppText variant="body" weight="bold"`). This fixes the earlier placement of the line total on the price row.
- [ ] **Step 3 ("Delivering to" row):** a `Card`-style row under the items (mock: 40 dp `brandSoft` disc with a `location-outline` Ionicon in `brandStrong`, caption "Delivering to", the customer's address text in `variant="body" weight="bold"`, and on the right a `Profile` text button in `brandStrong` that does `router.push('/(tabs)/profile')`). The address comes from the same current-user object the profile screen shows as "Location" (find it in `authService.getCurrentUser()` / `useAuth().user`; the existing `loadUser` effect already calls `getCurrentUser`, so reuse its result rather than adding a request). If no address is available render "Set your delivery area in Profile" instead. Tests must not need new network mocks beyond what `getCurrentUser` already returns in this suite.
- [ ] **Step 4 (verify):** `npx tsc --noEmit` 0; `npx jest` all green; the hex/font grep on `cart.screen.tsx` is empty; no Prettier. Device: cart with two items matches the mock (chip row, stepper row with the line total at the right, "Delivering to" row, one bottom sheet); do NOT press CONFIRM ORDER; leave the cart empty. Screenshot beside the mock.

**Pass:** the Cart screenshot and the mock agree on header, chip row, item layout, delivery row and bottom sheet; existing behavioural assertions unchanged.

### Task 11c: Menu list screen and the add-to-cart flow (added 2026-10-26; the product owner chose "build the mock flow")

**Behaviour change, approved by the product owner:** today Home expands a banner in place and dishes are chosen with a checkbox, then the cart button copies the ticked dishes into the cart. The approved mock instead opens a separate **Menu list** screen from a banner, with an **Add** button (then a − / + stepper) per dish that edits the cart directly, and a "View cart" bar. Visual spec: the approved Home and Menu-list boards.

**Files:** create `store/menuSlice.ts`, `screens/menuList/menuList.screen.tsx`, `app/(routes)/menu/index.tsx`, `components/menu/MenuRow.tsx`, `screens/__tests__/menuList.screen.test.tsx`; modify `store/index.ts`, `app/_layout.tsx` (register the route under `Stack.Protected guard={isAuthenticated}`), `screens/homeTab/home/home.screen.tsx`, `screens/__tests__/home.screen.test.tsx`; delete `components/flatList/flatList.tsx` after `MenuRow` replaces it. `store/cartSlice.ts` is NOT changed.

- [ ] **Step 1 (menu store):** `menuSlice` holds `{ menu: TodayMenu | null }` with `setMenu`. Home dispatches `setMenu` after every successful `menuService.getTodaysMenu()` (its existing timers/AppState/focus refresh keep working unchanged and now also feed the Menu screen). The Menu screen reads the menu from the store and derives its tab with `buildTabs`, so a session that opens or closes while the Menu screen is open updates live. Add the reducer to `store/index.ts`.
- [ ] **Step 2 (route):** `app/(routes)/menu/index.tsx` renders `MenuListScreen` inside `GestureHandlerRootView` like the cart route; params `meal` (`breakfast|lunch|dinner`) and `kind` (`veg|nonveg`) via `useLocalSearchParams`; register `(routes)/menu/index` in the authenticated `Stack.Protected`.
- [ ] **Step 3 (Home):** remove the checkbox/selection state, `handleViewCart`, `expansionState` and the in-place lists. A banner press does `router.push({ pathname: '/(routes)/menu', params: { meal: activeButton, kind } })`. Rename the banner `accessibilityLabel`s from `Toggle Vegetarian Items` / `Toggle Non-Vegetarian Items` to `Open Vegetarian Items` / `Open Non-Vegetarian Items` (they no longer toggle) and update the tests that use them. Add the mock's count pill on each banner (bottom right over the photo: `{n} items`, `AppText variant="micro" weight="bold"` white on a `color.scrim` pill), the sentence-case heading "Choose your preference" (update the test string), and a count badge on the cart button (`cart.items` total quantity, `color.ink` fill, white text, hidden at 0, accessibility label "View cart, {n} items" when n>0 else "View cart"). The cart button still navigates to the cart. The tab hints / banner / empty / closed behaviours and the menu loading timers stay exactly as they are.
- [ ] **Step 4 (`MenuRow`):** per the Menu-list mock plus the existing description: 72×72 thumbnail (`plate.jpeg` fallback or `image_url`), name `AppText body bold`, description `caption muted numberOfLines={2}`, price `caption bold`, and the action area: when the dish is not in the cart a 48 dp-high **Add** button (`color.brand` fill, `color.onBrand` bold label, accessibility label `Add {name}`); when it is in the cart a − / quantity / + stepper (48 dp round buttons: − on `color.field`, + on `color.brand`, labels `Decrease quantity of {name}` / `Increase quantity of {name}`); pressing − at quantity 1 removes the item (`removeItem`), otherwise `updateQuantity decrease`. `disabled` (session not open) renders the Add button inert (`color.field` fill, `color.subtle` label, `accessibilityState disabled`) and hides the stepper. `React.memo`.
- [ ] **Step 5 (Menu screen):** header row (48×48 back button `Ionicons arrow-back`, label "Go back"; title `AppText h2 bold` "{Vegetarian|Non-Vegetarian} Items ({n})" — keep the existing strings so the title still reads "Vegetarian Items (1)"; subtitle `{Meal}, today` caption muted); a status strip under it: for an open session a `brandSoft`/`brandStrong` chip "{Meal} is open now" with a clock Ionicon, otherwise the `tab.banner` text on `status.pending` colours (existing wording, e.g. "Ordering opens today at 6:00 PM."); the list is a **`FlatList`** with `keyExtractor` of `MenuRow`s; an empty tab shows `EmptyState` (title "No items", message the tab banner). Bottom "View cart ({totalQuantity})  Rs. {total}" bar (`color.ink` fill, white text, 52 dp, `...shadow.bar`, sits above the safe area; hidden when the cart is empty) → `router.push('/(routes)/cart')`. Add pressed: build the cart item exactly as `handleViewCart` did (`id: String(foodItem.id)`, `food_item_id`, `name`, `price: parseFloat`, `quantity: 1`, `image`, `meal_type`, `meal_time`, `description`, `session_date: tab.sessionDate`) and `dispatch(addToCart(item))`. **One meal per order:** if the cart already holds items with a different `meal_time` than this tab's, show `Alert.alert('Start a new cart?', 'Your cart has {Meal} items. An order can only hold one meal, so adding this will clear it.', [{ text: 'Keep cart', style: 'cancel' }, { text: 'Start new cart', onPress: () => { dispatch(clearCart()); dispatch(addToCart(item)); } }])`.
- [ ] **Step 6 (tests):** rewrite the selection-flow tests in `home.screen.test.tsx` (the ones that press `select-<name>` and `View cart` and assert the cart contents) as `menuList.screen.test.tsx` cases: Add puts the dish in the cart with the right fields (including `session_date` and `meal_time`); the stepper increases and decreases, − at 1 removes it; a closed or upcoming session has an inert Add; adding from another meal prompts and "Start new cart" clears first, "Keep cart" leaves the cart unchanged; the View cart bar shows the quantity and total and navigates; the title reads "Vegetarian Items (n)". Keep all Home assertions that are about tabs, hints, banners, empty state, loading, transitions and timers unchanged; Home gets new cases: banner press navigates with the right params, the banner count pill, and the cart-button badge. Every changed Home assertion is listed in the report with the reason.
- [ ] **Step 7 (verify):** `npx tsc --noEmit` 0; `npx jest` all green; no hex/`fontSize`/`fontWeight` literals in the new and touched files; no Prettier. `react-native-bouncy-checkbox` becomes unused: leave `package.json` alone and say so in the report. Device (`node scripts/dev-scenario.js all-open` first; do NOT press CONFIRM ORDER): Home → Vegetarian opens the Menu list; Add, then + and − and the removal at 1; View cart opens the Cart with the same items; back keeps the cart; try adding a lunch dish with a breakfast cart and see the prompt; empty the cart afterwards. `bash scripts/perf-frames.sh phase2-menu` ×3: janky median no worse than 2.38 %. Screenshots next to the mocks: Home, Menu list with an added dish, the View-cart bar.

**Pass:** the flow and the screens match the approved mocks; behaviour assertions for tabs, banners and timers unchanged; one meal per order enforced at add time; janky median not above baseline.

**PHASE 2 GATE:** `npx jest`, `npx tsc --noEmit`, `perf-frames.sh phase2`, screenshots of Home, Menu list, Cart and the tab bar next to the mocks.

---

# PHASE 3 — Tab screens

### Start here (new session)

Phases 1 and 2 are done and committed on `feat/ui-modernization` (jest 27 suites / 243 tests, tsc 0, assets 1386 KB, janky median 1.88 %). The SDD ledger for this plan is `.superpowers/sdd/2026-10-26-mobile-ui-modernization/progress.md` (git-excluded, same checkout): tasks with a `Task <N>: complete` line are done, so resume at **Task 12**. Read the ledger's deferred-minor lines first (the final review triages them) and the plan's "Environment notes". Two things bit earlier tasks: tell implementers **not to run Prettier** (no config in the repo; one task was sent back for churn), and if `npx tsc` complains about a new route, restart Metro or regenerate the gitignored `.expo/types/router.d.ts`.

**Mock parity rule (the product owner caught the first two phases differing from the mocks).** The approved mocks (artifact `https://claude.ai/artifact/XAaVXvE9vWNCxsoB3B2KrU`, boards Orders, Payments, Notifications, Profile; the sticky notes on the canvas list what is deliberately later) are the visual spec. Before each task, the implementer reads the board's source (`Artifact` `read_file`, path `project/<Board>.dc.html`) and builds to it. Before each task is marked complete, the controller compares the device screenshot with the board. **A gate page must never claim parity: it lists every remaining difference and which task owns it.** The settings gear drawn in older versions of the mocks is Expo Go's dev button, not the app.

| Mock element | Built in |
|---|---|
| Orders: card layout, status chip, Edit / Cancel outline buttons, addable item prices, empty state | Task 12 |
| Orders: "Order history" link, "On the way" card, hiding Edit/Cancel by status, honest cancel errors | Tasks 20, 22 |
| Payments: banner, unpaid total card, rows with date + chip + amount, empty state | Task 13 |
| Payments: "Delivery failed" rows in the list, final wording | Task 21 |
| Notifications: unread vs read cards, empty / error states | Task 14 |
| Notifications: "Mark all read" | not built (opening the tab already marks everything seen); removed from the mock |
| Profile: initials avatar, name + email, Location / Phone Number rows, Edit Profile / Change Password rows, Logout, Danger zone | Task 15 |
| Profile: stronger Delete Account confirmation | waits for the product owner (Task 15 Step 5: ask at the gate) |
| Sign In, sign-up screens, empty / error / loading boards | Phase 4, Task 23 |

### Task 12: Orders

**Visual spec:** the Orders board (read `project/Orders.dc.html`). **Files:** `screens/orderStatus/orderStatus.screen.tsx` (370 lines, 26 hex, 14 font sizes), `components/ui/AppButton.tsx` and `components/__tests__/AppButton.test.tsx` (two new variants), `components/ui/StatusChip.tsx` and `components/__tests__/StatusChip.test.tsx` (prototype-key fix), create `screens/__tests__/orderStatus.screen.test.tsx`. Do not touch the service layer or the data the screen loads (Task 20 changes it).

- [ ] **Step 1 (AppButton, tests first):** add `variant="outline"` (transparent fill, 2 px `color.ink` border, `ink` label) and `variant="dangerOutline"` (transparent, 2 px `color.danger` border, `danger` label; `AppText` tone `danger`), both `minHeight` unchanged (52) and with spinner colours to match; tests: label tone/border colour per variant, and the existing three tests stay green.
- [ ] **Step 2 (StatusChip, deferred minor from Task 6):** replace `value in status` with `Object.prototype.hasOwnProperty.call(status, value)`; add a test that `"__proto__"`, `"constructor"` and `"toString"` render their raw text on the neutral chip without throwing.
- [ ] **Step 3 (tests first for the screen):** `orderStatus.screen.test.tsx` (mock `@/services` the way the other screen tests do): a pending order renders the meal "Breakfast", the order id, the chip "Pending", each item line, the total "Rs. 300.00", Edit and Cancel; a `preparing` order renders the chip "Preparing"; pressing Cancel shows the dialog ("Keep Order" / "Yes, Cancel") and "Keep Order" closes it without calling `deleteOrder`, "Yes, Cancel" calls `deleteOrder(order_id)`; the empty list shows the `EmptyState` ("No orders found" / "Your current orders will appear here"); pressing Edit opens the edit modal with the items and its "Save Changes" / "Close" buttons. Run red.
- [ ] **Step 4 (the screen, per the board):** `AppText` and tokens everywhere (no `Text`, no hex, no `fontSize`/`fontWeight`). Header "RC Caterings" `AppText variant="h1" weight="bold"` then the section title "My Orders" `variant="h2" weight="bold"` (ink; the old green text fails contrast). Each order is a `Card` (`marginHorizontal: space.md`): top row = meal name capitalised (`variant="body" weight="bold"`) with the order id under it (`variant="micro" tone="muted" numberOfLines={1}`), and the `StatusChip` on the right; item lines `{food_name} x {quantity}` left and `{meal_type}` right (`caption`, meal type muted); a 1 px `color.border` separator; footer row: "Total" caption muted over the amount `variant="h2" weight="bold"` on the left, `AppButton variant="outline"` "Edit" and `variant="dangerOutline"` "Cancel" on the right (keep their handlers and the `setSelectedOrderId` / dialog logic exactly). Loading: `ActivityIndicator color={color.brandStrong}` and `AppText tone="brand"`. Empty: `EmptyState icon="receipt-outline"` with the two existing strings. The `FlatList`, `keyExtractor`, the focus refresh and every Alert / service call stay as they are.
- [ ] **Step 5 (edit modal):** same behaviour, restyled: sheet `color.surface`, `radius.lg`, `padding: space.md`; scrim `color.scrim`; title `AppText variant="h2" weight="bold"`; each editable row: name and `{meal_type}` on the left (`AppText`, `numberOfLines={1}`), a 48 dp `−` / quantity / `+` stepper (`Ionicons remove`/`add`, labels `Decrease quantity of {name}` / `Increase quantity of {name}`), and a 48 dp `trash-outline` remove button in `color.danger` (label `Remove {name}`); the "Add Items" list shows each addable dish with its **price** (`Rs. {price}`, add `price: parseFloat(fi.price)` when building `allChoices`; the field is on `foodItem`) and a 48 dp "+ Add" `brandStrong` text button; footer `AppButton variant="secondary"` "Close" and `AppButton` "Save Changes". `handleSaveEdits`, `handleOpenEdit` and the quantity handlers keep their logic.
- [ ] **Step 6 (verify):** `npx tsc --noEmit` 0; `npx jest` green (new tests included); `grep -nE "#[0-9a-fA-F]{3,8}\b|fontSize|fontWeight|\bText\b" screens/orderStatus/orderStatus.screen.tsx` prints nothing. Device (`all-open` first; `flow.customer` has a pending order, `qa.customer` has one order per status but this screen only lists today's pending/preparing until Task 20): compare with the board, open the Cancel dialog and choose "Keep Order" (never confirm a cancel), open Edit and check the prices. Screenshot Orders and the edit modal; re-check that Orders text now renders in Nunito (Task 4's deferred check).

**Pass:** the screenshot and the Orders board agree except for the Phase-5 items in the table above; PENDING and PREPARING are distinguishable by chip; the new tests are green; no literal left; Orders text is Nunito.

### Task 13: Payments

**Visual spec:** the Payments board (read `project/Payments.dc.html`). **Files:** `screens/pendingPayments/pendingPayments.screen.tsx`, create `screens/__tests__/pendingPayments.screen.test.tsx`; delete `assets/pendPay.png` after proving it unreferenced. The data call (`getPendingPaymentOrders`) is not changed here (Task 21 changes it).

- [ ] **Step 1 (tests first):** mock `@/services` like the other screen tests. Cases: two unpaid delivered orders render the danger banner ("You can't place new orders while you have 2 unpaid orders. Pay these to order again."), the total card ("Total unpaid", "Rs. 550.00", "2 orders") and one row per order with its chip "Delivered", its amount and its id; one unpaid order shows no banner but the muted intro line ("Unpaid orders appear here. With 2 unpaid orders you can't place new ones.") and "1 order"; an order with `target_date: '2026-10-26'`, `meal_time: 'lunch'` shows the title "Mon, 26 Oct, Lunch" (weekday from the date string without timezone drift); with no `target_date` the title falls back to `created_at`'s date; the empty list shows the `EmptyState` ("No pending payments" / "All your orders are paid"). Run red.
- [ ] **Step 2 (screen, per the board):** `AppText`, `Card`, `StatusChip`, `EmptyState`, tokens; no hex / `fontSize` / `fontWeight`. Header "RC Caterings" `variant="h1" weight="bold"`, section title "Payments" `variant="h2" weight="bold"`. Banner (shown when `pendingOrders.length >= 2`): `status.delivery_failed.bg` fill and `.fg` text, `radius.md`, `padding: space.md`, an `alert-circle-outline` Ionicon, text `variant="caption" weight="bold"`. Total card: `color.ink` fill, `radius.lg`, white `AppText` ("Total unpaid" caption, the amount `variant="h1" weight="bold"`, "{n} order(s)" micro). Rows: `Card`, title = `{Weekday, D Mon}, {Meal}` (`body bold`), order id (`micro muted`, one line), the amount on the right (`h2 bold`), `StatusChip` under the title. **Date:** use `order.target_date` (`YYYY-MM-DD`) when present, formatted from its parts (never `new Date(string)` in local time), else the date part of `created_at`; this fixes the "Date shows created_at, not the meal date" bug, so **Task 21 skips that part**. Loading: spinner `color.brandStrong`, `AppText tone="brand"`. Remove the `console.log` calls that dump orders (they print customer data).
- [ ] **Step 3 (verify):** tsc 0; jest green; the literal grep on the screen file is empty; `bash scripts/asset-weight.sh | tail -1` lower than 1386 KB. Device: `flow.unpaid` (has unpaid orders) and `flow.customer` (none): compare with the board; screenshot both states.

**Pass:** the screenshots and the Payments board agree except for the Phase-5 items in the table; both populated and empty states render; no literals; the date shows the meal date.

### Task 14: Notifications

**Visual spec:** the Notifications board (read `project/Notifications.dc.html`). **Files:** `screens/notifications/notifications.screen.tsx`, `services/push/unread.ts` (export the existing `readSeen` helper only), `screens/__tests__/notifications.screen.test.tsx` (existing assertions unchanged, new cases added); delete `assets/bell.png` after proving it unreferenced.

- [ ] **Step 1 (tests first):** keep the four existing tests untouched (they pin "Holiday"/"Closed on Friday"/"Menu change", `getAllByText('11 Oct 2026')` ×2, "No notifications yet.", "Tap to retry" and the badge-clearing behaviour). Add: with `AsyncStorage` seeded `notices_seen_u1 = '3'` and notices ids 7 and 3, the id-7 card is marked unread (accessibility label "Unread" or an `accessibilityState`/testID you choose, asserted) and the id-3 card is not; with nothing seeded all cards are unread on the first open; after a pull-to-refresh the cards that were unread when the tab opened stay highlighted (the watermark has moved on, the view should not flicker); the error state shows "Could not load notifications." with a "Tap to retry" button and the empty state shows the title "No notifications yet.". Run red.
- [ ] **Step 2 (unread per card):** in `load`, when it was triggered by a focus (not a pull-to-refresh), read the previous watermark with `readSeen(userId)` **before** `markSeen`, keep it in a ref (`seenAtOpen`), and treat a notice as unread when `Number(item.id) > seenAtOpen`. The badge logic (`markSeen`, `dispatch(setUnread(0))`, `hasLoaded`, the keep-last-good-list behaviour) is unchanged.
- [ ] **Step 3 (screen, per the board):** `AppText`, tokens, no hex / `fontSize` / `fontWeight`; header "RC Caterings" `variant="h1" weight="bold"`, section title "Notifications" `variant="h2" weight="bold"` (ink). Each notice: unread = `color.surface` card with a 2 px `color.brandSoft` border, `shadow.card`, title `body bold` and a 10 px `brandStrong` dot on the right; read = transparent card with a 1–2 px `color.border` outline, title `body semibold` in `tone="muted"`; both have a 40 px disc (unread `brandSoft` + `brandStrong` icon, read `field` + `muted` icon) holding `Ionicons name="megaphone-outline"` (replaces the bell image), the body `caption`, the date `micro muted`. Empty: `EmptyState icon="notifications-outline"` title "No notifications yet." (exact, with the period) and message "Announcements from RC Caterings appear here." Error: `EmptyState icon="cloud-offline-outline"` title "Could not load notifications." action "Tap to retry" → `retry`. Loading: `ActivityIndicator color={color.brandStrong}`. The `FlatList` keeps `keyExtractor`, `onRefresh`, `ListEmptyComponent` (give it `flexGrow: 1` centring through `contentContainerStyle` when empty). "Mark all read" is **not** built.
- [ ] **Step 4 (verify):** tsc 0; jest green; the literal grep on the screen is empty; `asset-weight.sh` lower than before. Device: create a notice for `flow.customer` the way Task 8 did (an admin notice; delete it afterwards), open the tab: the new one is highlighted, reopen: it is not; screenshot; compare with the board.

**Pass:** `notifications.screen.test.tsx`'s existing assertions unchanged and green; unread vs read is visible beyond the tab badge; the screenshot and the board agree except for "Mark all read" (not built, removed from the mock).

### Task 15: Profile, edit-profile and change-password

**Visual spec:** the Profile board (read `project/Profile.dc.html`; note the sticky note on the canvas). **Files:** `screens/profile/profile.screen.tsx`, `components/profile/EditProfileForm.tsx`, `components/profile/ChangePasswordModal.tsx`, `screens/__tests__/profile.screen.test.tsx` (locators for the read-only values only), create a small `initials` helper with its test (put it next to the screen, e.g. `screens/profile/initials.ts` and `screens/__tests__/initials.test.ts`); delete `assets/propic.png` (the mascot avatar becomes an initials disc as in the mock; this is the one owner-visible content change here, list it in the report).

- [ ] **Step 1 (tests first):** `initials('Nimal Perera') === 'NP'`, one word gives one letter, extra spaces and empty/undefined give `'?'`, lower case input is upper-cased. In `profile.screen.test.tsx` the profile view now shows the email under the name and the Location / Phone Number as text rows instead of read-only inputs, so change **only** the profile-view locators from `getByDisplayValue(...)` to `getByText(...)` (the values, the "Edit Profile" / "Change Password" buttons and every edit-form and password-modal assertion stay exactly as they are; the edit form's `queryByDisplayValue('nimal@test.local')` must stay null). List each changed locator and the reason in the report. Run red.
- [ ] **Step 2 (screen, per the board):** `AppText` and tokens, no `Text`/`TextInput`/hex/`fontSize`/`fontWeight` in `profile.screen.tsx`. Title "Profile" `variant="h1" weight="bold"` (the board has no "RC Caterings" line here). Avatar: 88 px disc, `color.brandSoft`, initials `variant="h1" weight="bold" tone="brand"`; name `variant="h2" weight="bold"`; email `variant="caption" tone="muted"` (**remove the "User ID" row**). A `Card`-like group (surface, `radius.lg`, `shadow.card`, rows separated by a 1 px `color.border`) with rows "Location" (`user.address`) and "Phone Number" (`user.phone`): label `micro muted`, value `body semibold`, row `minHeight: 56`, a leading `location-outline` / `call-outline` Ionicon in `muted`. Second group: two 56 dp pressable rows "Edit Profile" (`create-outline`) and "Change Password" (`lock-closed-outline`), label `body semibold`, a trailing `chevron-forward` in `subtle`, `accessibilityRole="button"`. Then `AppButton variant="outline"` "Logout". Then a divider, a caption "Danger zone" and a 48 dp text button "Delete Account" in `color.danger` (opens the existing `CancelModal`; the dialog's copy and behaviour do not change in this task). Loading text `tone="brand"`, spinner `brandStrong`. `Screen scroll tabBar` already clears the tab bar; confirm Delete Account scrolls fully clear of it.
- [ ] **Step 3 (shared titles):** `EditProfileForm` and `ChangePasswordModal`: make the two titles sit at the **same top offset** on the device (they differ today: the modal opens under the translucent status bar). Measure both in `uiautomator dump` and fix the cause (e.g. `statusBarTranslucent` on the `Modal`, or the same `paddingTop` source for both) rather than a magic number; no other change to the forms, their fields, validation or buttons.
- [ ] **Step 4 (verify):** tsc 0; `npx jest` green (the Profile suite's existing behavioural assertions unchanged); the literal grep on the three files is empty; `asset-weight.sh` lower than before. Device: compare with the board; the two titles' top bounds are equal in the dump; open Delete Account's dialog and choose Cancel (**never confirm**); screenshot Profile, Edit Profile and Change Password.
- [ ] **Step 5 (ask first, do not guess):** the stronger Delete Account confirmation (typing `DELETE` or re-entering the password) is **waiting for the product owner**; do not build it. Report that the current dialog is unchanged and leave the question for the gate.

**Pass:** the screenshot and the Profile board agree; `profile.screen.test.tsx` green with only the listed locators changed; the two form titles share one top offset; the initials helper is tested.

**PHASE 3 GATE:** `npx jest`, `npx tsc --noEmit`, `perf-frames.sh phase3` ×3 (compare with the baseline in `perf-baseline.md`: 2.38 % janky, p90/95/99 23/24/28 ms), `asset-weight.sh`, then a gate page (an Artifact, same approach as the Phase 1 and 2 pages) with phone screenshots of Home, Orders, Payments, Notifications and Profile **next to the mock boards**, a "what still differs from the mocks" list that names the owning task for each difference (use the table at the top of this phase), and the open questions: the stronger Delete Account confirmation, and the Profile avatar change from the mascot picture to initials. Re-check the deferred checks: Nunito on Orders and Profile (Task 4), the Notifications label on a 360 dp-wide screen if one is available (Task 8). Stop and report.

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
**Change:** request `{ type: 'all', payment_status: 'unpaid' }` (the backend already supports it) so `delivery_failed` unpaid orders appear and the list matches what checkout counts; (the meal date and the status chip already replaced `created_at` in Task 13, do not redo that;) reword the intro to "You can't place new orders while you have 2 unpaid orders".
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
