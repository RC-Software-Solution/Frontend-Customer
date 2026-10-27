# Customer App Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the RC customer app safe to publish on Google Play and the App Store and to put in front of real customers: a release build that can only talk to the production API over HTTPS, a final and permanent app identity, store-compliant data handling, working push on both platforms, and a repeatable EAS build and release path.

**Architecture:** The app is an Expo SDK 58 / React Native 0.88 client (expo-router, Redux Toolkit, axios) that calls the Backend's Express services. Security is layered the same way as the Admin plan (`../Admin/docs/superpowers/plans/2026-10-24-admin-production-readiness.md`): (1) patched toolchain and dependencies, (2) a release bundle that cannot contain dev hosts, debug dumps or plaintext URLs, (3) device-side controls (Keychain/Keystore token storage, no cloud backup of app data, no unneeded permissions, error boundary), (4) backend controls the app relies on (short customer tokens, server-side password rules, data removed on logout and deletion, no internals in error bodies), (5) edge controls (an API Gateway type that WAF can protect, rate limits on login and signup). Every control gets a check that fails when the control is missing.

**Tech Stack:** Expo SDK 58, React Native 0.88, React 19.3, TypeScript 6.0, Jest 30 / jest-expo 58, EAS Build and Submit, Node 24 LTS (>= 24.22.1), GitHub Actions, Express 4 services (Backend repo), AWS API Gateway + WAF.

**Spec:** Section 1 of this file (scope and threat analysis). No separate design doc.

## Global Constraints

- Node.js >= 24.22.1 everywhere (dev, CI, EAS). Node 18 and 20 are end-of-life.
- No new runtime dependency in the app bundle unless a decision below names it (D2 adds none; D5 option (a) would add one). Dev tooling only if unavoidable.
- A release build (EAS profile `preview` or `production`) must use an `https://` API URL. The build must fail otherwise, and the app must refuse to start otherwise.
- Release API base URLs: production `https://api.rcdelivery.com/api`, staging `https://api-staging.rcdelivery.com/api`. These come from `AWS-INFRASTRUCTURE-PLAYBOOK.md` (`api.rcdelivery.com`). If decision D7 picks another domain, change only these two strings in `eas.json`.
- Backend role checks remain the enforcement point. The app's "customers only" check (`useAuth.ts:76-79`) is a convenience.
- The password rule is the same text in the app and on the server: `Password must be at least 8 characters, contain a number and a special character`.
- Do not run Prettier (the repo has no config; it causes churn). If `npx tsc` complains about a route type, restart Metro or regenerate the gitignored `.expo/types/router.d.ts`.
- Existing tests stay unchanged except the ones a task lists by name.
- Every code task ends with a runnable check and its own commit. Commands are bash (Git Bash on Windows).
- Customer app tasks run in `C:\Users\budglk\RC\Frontend-Customer`; Backend tasks run in `C:\Users\budglk\RC\Backend`.

## Before you start

- **Branches.** Customer app: `main` is at `59a20f5` and matches `origin/main`. Run `git switch -c chore/production-readiness`. Backend: the Admin plan's work sits on the unpushed `chore/production-readiness` branch, and `fix/order-status-guard` (`77e7af8`) is one commit ahead of it. Cut `chore/customer-readiness` from `fix/order-status-guard`, or from `dev` once both branches are merged.
- **Pre-existing dirty state.** `git status` lists `package.json` and `package-lock.json` as modified, but `git diff --stat` prints nothing (line endings or file mode only). Run `git diff --ignore-cr-at-eol --stat`. If it is still empty, run `git checkout -- package.json package-lock.json`. Otherwise commit it on its own before Task 1.
- **Baseline.** Record the current state so later tasks can say "unchanged": `npx tsc --noEmit` (the 2026-10-26 ledger lists one known error, `home.screen.tsx(76)`, which comes from the generated route types) and `npm test -- --ci` (59 suites / 491 tests at `524d4e3`).
- **Decisions (section 1.4) block later gates:** D1 and D7 block Task 8, D2 blocks Task 10, D3 blocks Task 11, D6 blocks Task 13, D4 blocks Task 15. Gates 0 and 1 and Tasks 12 and 14 can start immediately.

---

# 1. Scope and threat analysis

## 1.1 What is in scope

| Layer | In scope | Out of scope (tracked elsewhere) |
|---|---|---|
| Customer app (`Frontend-Customer/`) | Toolchain, dependencies, API configuration, bundle contents, logging, error handling, native config, identity, signing, push, CI, store compliance, release runbook | New features, UI work, payment gateway (cash on delivery only at launch, `GO-LIVE-PLAYBOOK.md`) |
| Backend surface the app calls (`user-service`, `order-service`, `menu-service`) | Customer token lifetime, password rules, logout and deletion data handling, error bodies, push sender | Everything the Admin plan already covers (Node 24, dependency patching, admin 8h tokens, CORS allowlist, compose hardening: done on `chore/production-readiness`) |
| Edge | API Gateway routing and WAF for `api.<domain>` | Full CDK stacks (see the AWS playbook) |

## 1.2 Recent events and whether they touch this app

| Event | Facts | Exposure here | Action |
|---|---|---|---|
| **Node.js Oct 21 security release** (see Admin plan 1.2): patched 24.22.1. Node 18 and 20 are end-of-life. | This machine already runs 24.22.1. **CI runs Node 20** (`.github/workflows/ci.yml:15`), and nothing pins the version (no `.nvmrc`, no `engines`). | Task 1, Task 8 |
| **PHP2Shell, NGINX 1.30.6 / 1.31.7** (Admin plan 1.2) | The app has no PHP and no NGINX. Its only server dependency is the Backend, which the Admin plan already patched. | None |
| **npm advisories, measured today** (`npm audit --omit=dev`) | 4 high: `node-forge <=1.4.0` (fix available), `zod <4.6.6` via `expo > @expo/cli` (only "fix" is a downgrade to Expo 54), plus the two parent entries. `npm audit` also reports moderate `uuid <11.1.1`. `npm ls` shows `node-forge` and `zod` come only through `@expo/cli`, which is build tooling and never ends up in the JavaScript bundle. Expo closed a similar report (`image-size` through Metro, expo/expo#48670) as "does not put you at risk". **`uuid` and `react-native-get-random-values` are not imported anywhere** in the code. | Task 1 (fix `node-forge`, remove the unused packages), Task 8 (audit gate at `critical`, with the reason written next to it) |
| **Google Play target API**: since Aug 31, 2026, new apps and updates must target API 36. The one-time extension ended Nov 1, 2026. | RN 0.88 ships `targetSdk = "36"`. This already complies. | Re-check in Task 17 |
| **Expo SDK 58** (Oct 14) | The app is already on SDK 58 (`256fd37`). The changelog has no SDK 58 security advisories. EAS Observe added native crash reporting on Oct 7, which feeds decision D5. | None |

## 1.3 Findings, with evidence

IDs are referenced by the tasks. Every item was verified in this session by reading the code or running the command.

**Customer app**

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| C1 | Medium | CI runs on Node 20, which is end-of-life. No `.nvmrc`, `.npmrc` or `engines` pins the runtime. | `ci.yml:15`, `package.json` |
| C2 | Low | 4 high and 2 moderate advisories (see 1.2). Two packages are unused. | `npm audit`, `npm ls node-forge zod` |
| C3 | **High** | Every API URL is `http://<Metro host or 127.0.0.1>:400x/api`. There is no production configuration, no `eas.json` and no build profile. A release build would either call a LAN address in plaintext or fail, because Android blocks cleartext traffic in release builds and iOS App Transport Security blocks it too. | `services/config/api.config.ts:12-28` |
| C4 | Low | Dead code: `services/api.ts` (hardcoded `http://192.168.43.178:4001/api`), `services/authentication.ts`, `services/orderservice/orderservice.ts` and `legacyApi` in `services/index.ts:34-43` are imported nowhere. `LOCATION_SERVICE`, `DELIVERY_SERVICE` (which points at the analytics port 4006) and `PAYMENT_SERVICE` (the payment service has no `index.js`) are never used. `verifyEmail` and `resendVerificationEmail` call routes the backend does not have. | grep for imports; `user-api.client.ts:125-134` |
| C5 | Medium | About 85 `console.*` calls. Debug logs dump whole API responses and order payloads (`menu-api.client.ts:104-238`, `cart.screen.tsx:116-135`). The signup screen logs the signup response, which can contain a password hash (B5) (`signUpSecond.screen.tsx:52`). Release builds keep this output in logcat and the iOS Console. | grep |
| C6 | Low | No error boundary. A render error in a release build closes the app, and if the error repeats for the saved session, the app is stuck crashing on every launch. | `app/_layout.tsx` |
| C7 | Medium | CI has no audit gate, uses floating action tags, runs dependency install scripts, uses `--legacy-peer-deps`, has no bundle check, no Expo version check and no Dependabot. | `ci.yml` |
| C8 | **High (store blocker)** | `android/` is committed: 45 files of generated prebuild output with no custom native code. EAS uses it as-is, so the Android settings in `app.json` are silently ignored. Inside it: the `release` build type is **signed with `debug.keystore`** (`android/app/build.gradle:100-115`); the main manifest requests `SYSTEM_ALERT_WINDOW` and legacy storage permissions; `allowBackup="true"` has no backup rules, so the cached user profile in AsyncStorage goes to Google Drive backups and `expo-secure-store`'s backup exclusion never applies; and there is `expo-updates` metadata for a module that is not installed. | `git ls-files android`, `AndroidManifest.xml` |
| C9 | **High (store blocker, irreversible)** | The app identity is still a placeholder: `com.company.rc.customer`, name `RC_Customer`, URL scheme `myapp` (a generic scheme other apps also claim). An Android package name and an iOS bundle ID can never change after the first store upload, and `google-services.json` is tied to the current package name. | `app.json:3-19`, `google-services.json:10` |
| C10 | Low | `.idea/` and `graphify-out/` are tracked. `.env` is not ignored (only `.env*.local` is). | `git ls-files`, `.gitignore:33` |
| C11 | Medium | The password rules disagree. Signup requires 8 characters, a number and a special character, but only in the app. Reset and change-password require 6 characters, in both the app and the server. | `signUpSecond.screen.tsx:23`, `validation.ts:26-27` |
| C12 | Low | No iOS export-compliance flag, so every TestFlight upload stops to ask about encryption. `supportsTablet: true` means iPad screenshots are required and Apple reviews the iPad layout of a phone-only design. | `app.json:10-13` |
| C13 | **High (iOS)** | Push uses `getDevicePushTokenAsync()`. On iOS that returns an **APNs** token, but the backend sends with `firebase-admin`, which accepts only FCM tokens. So no iOS customer would ever get a push, and the backend's dead-token handling would erase the stored token. The `expo-notifications` config plugin is not listed in `app.json`, so iOS builds would also lack the push entitlement. | `push.service.ts:38-66`, `notificationService.js:36-43` |
| C14 | Medium | No EAS project, no credentials plan and no version management (`versionCode 1` is hardcoded). Losing the upload key without a backup means a reset through Play support. | no `eas.json`, `build.gradle:95-96` |
| C15 | Low (manual) | `google-services.json` is committed. Firebase Android API keys are not secrets by design, but they must be restricted to the app's package name and signing SHA-1. Whether this key is restricted is unverified. | `google-services.json` |

**Backend surface the app depends on** (Backend branch `fix/order-status-guard`; identical to `chore/production-readiness` for these files)

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| B1 | Medium | Customer access tokens last 7 days. The app already renews tokens silently (`useAuth.ts:50-54`, `token.utils.ts:118-141`), so a short lifetime costs nothing. Refresh tokens last 30 days and are not rotated on `/users/refresh-token`. | `jwt.js:26-29`, `jwt.js:48-59`, `user.controller.js:287-300` |
| B2 | **High** | `POST /api/users/login` and `/api/users/signup` have no rate limit and no lockout. The forgot/reset limiter is Redis-backed and fails open, and the AWS playbook provisions no Redis (Admin finding B1). Customers and staff sign in through the **same** endpoint. | `auth.routes.js:8`, `user.routes.js:8`, `rateLimiter.js:34-37` |
| B3 | Medium | Signup has no server-side password check. Reset and change-password check for 6 characters. Login rejects passwords under 6 characters (`auth.controller.js:36`); this must **stay** lenient, or existing accounts with short passwords are locked out. | `user.controller.js:10-64`, `auth.controller.js:163`, `user.controller.js:156` |
| B4 | Medium | Logout clears only the refresh token, so a phone that was handed over keeps receiving the previous customer's order notifications. Account deletion is a soft delete: name, email, phone, address and push token all stay. The unpaid-orders guard reads `unpaid_orders_count`, which is in `schema.sql:217` but not in the Sequelize model, so the guard may never fire. | `user.controller.js:243-283` |
| B5 | **High** | Signing up again with a deleted account's email returns `user: existingUser`: the full database row, including the bcrypt `password` hash and `refresh_token`. The app then logs that response (C5). | `user.controller.js:23-40` |
| B6 | Medium | Raw `error.message` on 500 responses: 9 user-service handlers the app calls, login (`auth.controller.js:96`) and order creation (`order.controller.js:179`). Sequelize messages include hostnames and SQL. | grep `error: error.message` |

**Edge and cross-repo**

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| E1 | **High** | The playbook's API Gateway routes (`/users/{proxy+}`, `/orders/{proxy+}`, `/menu/{proxy+}` and so on) do not match the paths the services serve (`/api/users/*`, `/api/orders`, `/api/meal-sessions`, `/api/meal-session-items`, `/api/food-items`, `/api/inventory`). The customer app's menu calls are not under `/menu` at all. As written, every mobile call returns 404. | `AWS-INFRASTRUCTURE-PLAYBOOK.md:284-289`, `apps/*/index.js` |
| E2 | **High** | The mobile API (`api.<domain>`) is planned as an **HTTP API**. AWS WAF protects only REST APIs among API Gateway types (confirmed in the AWS WAF developer guide this session). So login brute force against `api.<domain>/api/users/login` cannot be limited at the edge, and Admin's planned CloudFront WAF (Admin decision D2a) can be bypassed by calling the same endpoint through `api.<domain>`. | AWS WAF docs; playbook section 6 |
| E3 | Info | The playbook's pending item "unauthenticated `GET /api/users/:userId`" is already fixed (`internalAuthMiddleware`, `user.routes.js:14`). The checklist is stale. | `user.routes.js:14` |
| E4 | **Launch blocker (pre-existing, owned by the Admin plan's final review)** | `apps/user-service/secrets/private.pem` is a real RSA key, tracked and pushed to `origin/dev`. It signs **customer** tokens too. It must be rotated before any customer build ships. | Admin SDD ledger, final review |

**Already good (keep it that way):** tokens are in the iOS Keychain / Android Keystore through `expo-secure-store`, with a one-time move out of AsyncStorage (`token.utils.ts:43-56`). Refresh is single-flight, and an offline refresh does not log the user out. A wrong password on `/login` is not treated as an expired session. Password reset uses a 6-digit code typed in the app (no token in a link) with server-side attempt limits. Routes are guarded with `Stack.Protected`. There is no WebView, no `eval` and no HTML rendering. Hermes and the New Architecture are on. The app targets API 36. The Firebase admin key is not in git. JWT is RS256 with explicit `algorithms`. CORS does not apply to native apps (they send no `Origin`), so the Admin plan's CORS allowlist cannot break this app.

## 1.4 Decisions needed

| # | Decision | Recommendation | Why |
|---|---|---|---|
| D1 | **Native project mode.** (a) Continuous Native Generation: stop committing `android/`, keep all native config in `app.json`, and let EAS run prebuild. (b) Keep the committed `android/` and fix it by hand. | **(a)** | `android/` holds no custom native code (generated `MainActivity`/`MainApplication`). Keeping it means `app.json` changes silently do nothing on Android. iOS is already handled this way (no `ios/`). |
| D2 | **iOS push.** (a) This app sends Expo push tokens (`ExponentPushToken[...]`) on both platforms. The backend sender routes those tokens through Expo's push service and everything else through `firebase-admin`, so the delivery app is untouched. (b) Add `@react-native-firebase/messaging` to get FCM tokens on iOS (needs `GoogleService-Info.plist`, static frameworks and a new native dependency). (c) Launch iOS without push. | **(a)** | One token type for the customer app on both platforms. EAS manages the APNs key. No new native SDK. The backend change is about 40 lines, with tests. (b) adds the heaviest native dependency in the React Native ecosystem to an app that currently has none. |
| D3 | **Customer access-token lifetime.** (a) 1 hour for customers only (delivery staff keep 7 days, admins keep 8 hours). (b) Keep 7 days. | **(a)** | The app already renews tokens silently at launch and on any 401. A stolen access token is then worth one hour instead of seven days. |
| D4 | **API edge.** (a) Keep the HTTP API and put CloudFront + WAF in front of it, with an origin-verify header that every service checks. (b) Use a **REST API** for `api.<domain>` and attach a regional WAF web ACL to the stage. Disable the default `execute-api` endpoint and point Admin's CloudFront `/api/*` behaviour at the same custom domain. (c) No WAF: an app-level lockout table (needs a DB migration). | **(b)** | It is the only option where every path to `/api/users/login` passes the WAF without new backend code. No stack is built yet (playbook: "Nothing below has actually been touched"), so switching the CDK construct now costs nothing. **This supersedes Admin decision D2a and must be decided together with it.** REST costs about $3.50 per million requests against $1 for HTTP. At launch volume that is cents. |
| D5 | **Crash visibility.** (a) Sentry React Native SDK (new runtime dependency, DSN set per EAS profile). (b) EAS Observe (paid; native crashes since Oct 7, 2026). (c) None at launch: rely on Play Console vitals and App Store Connect crash reports. | **(c)** for launch, revisit within 30 days | The store consoles are free and report fatal JavaScript errors as native crashes with the JavaScript message. The Admin plan made the same call (Sentry deferred). |
| D6 | **What account deletion removes.** (a) Anonymise: replace name, email, phone, address, push token, password and reset fields; keep the row and the orders for accounting. (b) Keep the current soft delete. | **(a)** | Apple guideline 5.1.1(v) and Google Play's account deletion policy require that deletion actually removes the personal data. Keeping order records for legal or accounting reasons is allowed if the privacy policy says so. |
| D7 | **Final identity** (permanent after the first upload). Package and bundle ID, display name, URL scheme, API domain. | Package/bundle `com.rcdelivery.customer`, display name `RC Caterings` (the name the app's own header already shows, `orderStatus.screen.tsx:236`), scheme `rccustomer`, domain `rcdelivery.com` | Uses the reversed production domain from the playbook. The client must confirm the brand name before Task 9. |

## 1.5 Explicitly deferred (with reason)

- **Refresh-token rotation on `/refresh-token`** and a status check on refresh (blocked customers can renew tokens; Admin review noted the same). Backend change with migration risk; schedule within 30 days.
- **Certificate pinning.** A pin mistake bricks every installed copy until users update. Not worth it without OTA updates.
- **OTA updates (EAS Update).** Not installed. Adopt later with one channel per EAS profile. Until then a fix means a new store build (the Task 16 runbook covers this).
- **Root and jailbreak detection, biometric unlock.** No regulatory need: cash on delivery, no card data.
- **Expo push receipts.** Dead tokens that Expo reports only in receipts are not cleared (the send-time `DeviceNotRegistered` is). Low impact.
- **Delivery app token lifetime and password hints, and the Admin `PasswordReset.tsx` "6 characters" hint.** Task 12 makes the server stricter for every role, so those apps show the server's message instead of their own hint. List them for their owners; do not edit those repos here.
- **Admin-only methods in `menu-api.client.ts`** (create, update and delete food items, inventory). The backend refuses them for customers. Dead code, harmless.

---

# 2. File structure

**Customer app: create**

| File | Responsibility |
|---|---|
| `.nvmrc`, `.npmrc` | Pin Node; refuse to install on a wrong version |
| `.env.example` | Documents `EXPO_PUBLIC_API_URL` |
| `app.config.ts` | Wraps `app.json`; fails an EAS release build that has no `https://` API URL |
| `eas.json` | Build profiles (`preview`, `production`) with their API URL, versioning, submit settings |
| `babel.config.js` | Strips `console.log/info/debug` from release bundles |
| `scripts/check-bundle.mjs` | Fails if an exported bundle contains dev hosts, debug-log markers or keys, or lacks the expected API URL |
| `services/__tests__/api.config.test.ts`, `screens/__tests__/errorBoundary.test.tsx`, `services/__tests__/push.service.test.ts` | Tests for Tasks 3, 5, 10 |
| `.github/dependabot.yml` | Update automation |
| `docs/RELEASE.md` | Build, submit, rollout, rollback, credentials and store-compliance runbook |

**Customer app: modify:** `package.json`, `package-lock.json`, `.gitignore`, `app.json`, `services/config/api.config.ts`, `services/index.ts`, `services/clients/user-api.client.ts`, `services/README.md`, `services/utils/validation.ts`, `services/push/push.service.ts`, `screens/auth/signUpSecond/signUpSecond.screen.tsx`, `screens/auth/login/login.screen.tsx`, `screens/auth/resetPassword/resetPassword.screen.tsx`, `components/profile/ChangePasswordModal.tsx`, `app/_layout.tsx`, `.github/workflows/ci.yml`, `google-services.json` (replaced in Task 9).
**Customer app: delete:** `services/api.ts`, `services/authentication.ts`, `services/orderservice/`, `android/` (from git; Task 9).

**Backend: create:** `apps/user-service/src/utils/passwordPolicy.js`, `tests/password-policy.test.js`.
**Backend: modify:** `apps/user-service/src/utils/jwt.js` (+ `jwt.test.js`), `apps/user-service/src/controllers/user.controller.js`, `apps/user-service/src/controllers/auth.controller.js`, `apps/order-service/src/controllers/order.controller.js`, `apps/user-service/src/services/notificationService.js` (+ test), `apps/user-service/src/models/User.js` (only if Task 14 Step 1 says so), `tests/user-service.auth.test.js`, `docker/docker-compose.yml`.
**Workspace root (not a git repo):** `AWS-INFRASTRUCTURE-PLAYBOOK.md`.

## Task overview and order

| Gate | Task | Findings | Size* | Needs |
|---|---|---|---|---|
| **0: patch now** | 1 Toolchain and dependencies | C1, C2 | S | |
| | 2 Dead code and repo hygiene | C4, C10 | S | |
| **1: app code** | 3 Release API configuration and build guard | C3 | M | |
| | 4 Release bundle: strip debug logs, scan the bundle | C3, C5 | S | 3 |
| | 5 Error boundary | C6 | S | |
| | 6 One password rule in the app | C11 | S | |
| | 7 CI and supply chain | C1, C7 | S | 1, 4 |
| **2: native and release** | 8 Final identity and generated native projects | C8, C9, C12, C15 | M | D1, D7 |
| | 9 EAS project, credentials, versioning | C14 | M | 8 |
| | 10 Push on iOS | C13 | M | D2, 9 |
| **3: Backend** | 11 Short customer access tokens | B1 | S | D3 |
| | 12 Server-side password rule | B3 | S | 6 |
| | 13 Logout and account deletion remove personal data | B4 | S | D6 |
| | 14 No secrets or internals in responses | B5, B6 | S | |
| **4: edge** | 15 API routes and edge protection | E1, E2, E3, B2 | L | D4 |
| **5: launch** | 16 Store compliance and release runbook | C15, D6 | M | 9 |
| | 17 Pre-launch verification and go/no-go | all | M | all |

*Rough: S under an hour, M half a day, L a day or more. Gates 1 and 3 can run in parallel in separate worktrees. E4 (rotate the leaked JWT key) is a precondition for Task 17, owned by the Admin plan's follow-ups.

---

# 3. Tasks

## Task 1: Pin the toolchain and patch dependencies

**Repo:** Customer app. **Findings:** C1, C2.

**Files:**
- Create: `.nvmrc`, `.npmrc`
- Modify: `package.json`, `package-lock.json`

**Interfaces:** Produces: `npm install` fails on Node < 24.22.1. `uuid` and `react-native-get-random-values` are gone.

- [ ] **Step 1: Confirm the runtime**

Run: `node -v`
Expected: `v24.22.1` (or newer 24.x).

- [ ] **Step 2: Add the pins**

`.nvmrc`:
```
24.22.1
```

`.npmrc`:
```
engine-strict=true
```

In `package.json`, add after `"version": "1.0.0",`:
```json
  "engines": {
    "node": ">=24.22.1"
  },
```

- [ ] **Step 3: Remove the two unused packages**

Run: `rg -l "uuid|get-random-values" --glob '!node_modules/**' --glob '!package*.json' --glob '!docs/**' --glob '!.superpowers/**' --glob '!graphify-out/**' .`
Expected: only `ORDER_SERVICE_INTEGRATION.md` (prose). If any `.ts`/`.tsx` file appears, stop and report.

Run: `npm uninstall uuid react-native-get-random-values`

- [ ] **Step 4: Patch what can be patched without a breaking change**

Run: `npm audit fix` (never `--force`: it would install Expo 54)
Run: `npm audit --omit=dev`
Expected: `node-forge` gone. What remains is only `zod` and its two parents (`@expo/cli`, `expo`), all high, none critical.

Run: `npx expo install --check`
Expected: `Dependencies are up to date` (audit fix must not have moved an Expo-managed package).

- [ ] **Step 5: Decide about `--legacy-peer-deps`**

Run, in a throwaway folder so `node_modules` here is not disturbed:
```bash
rm -rf ../fc-peer && mkdir ../fc-peer && cp package.json package-lock.json .npmrc ../fc-peer/ \
  && (cd ../fc-peer && npm ci --ignore-scripts); rm -rf ../fc-peer
```
If it succeeds, CI drops the flag (Task 7). If it fails with `ERESOLVE`, add `legacy-peer-deps=true` to `.npmrc` so local and CI installs resolve the same way.

- [ ] **Step 6: Prove nothing broke**

Run: `npx tsc --noEmit && npm test -- --ci`
Expected: same result as the baseline.

- [ ] **Step 7: Commit**

```bash
git add .nvmrc .npmrc package.json package-lock.json
git commit -m "chore(security): pin Node >= 24.22.1, patch node-forge, drop unused uuid packages"
```

---

## Task 2: Dead code and repo hygiene

**Repo:** Customer app. **Findings:** C4, C10.

**Files:**
- Delete: `services/api.ts`, `services/authentication.ts`, `services/orderservice/orderservice.ts`
- Modify: `services/index.ts:33-43`, `services/config/api.config.ts:21-28`, `services/clients/user-api.client.ts:121-135`, `services/README.md`, `.gitignore`

**Interfaces:** Produces: `API_CONFIG.BASE_URLS` has exactly `USER_SERVICE`, `ORDER_SERVICE`, `MENU_SERVICE`. Task 3 relies on that.

- [ ] **Step 1: Prove they are unused (the failing check is that they exist)**

Run: `rg -n "from ['\"](\./|\.\./|@/services/)(api|authentication|orderservice/orderservice)['\"]|legacyApi|LOCATION_SERVICE|DELIVERY_SERVICE|PAYMENT_SERVICE|verifyEmail|resendVerificationEmail" app screens services components store --glob '!**/__tests__/**'`
Expected: hits only in the files being deleted, the definitions in `services/index.ts`, `api.config.ts` and `user-api.client.ts`, and `services/README.md`. Any other hit: stop and report.

Run the same search in `**/__tests__/**`. Expected: no hits. A test that references one of these must be listed in the report, and its owner must approve the edit.

- [ ] **Step 2: Delete and trim**

```bash
git rm services/api.ts services/authentication.ts services/orderservice/orderservice.ts
```

In `services/index.ts`, delete everything from the line `// Legacy API client for backward compatibility` to the end of the file (the `axios` import, the second `API_CONFIG` import and `legacyApi`).

In `services/config/api.config.ts`, make `BASE_URLS`:
```ts
  BASE_URLS: {
    USER_SERVICE: serviceUrl(4001),
    ORDER_SERVICE: serviceUrl(4002),
    MENU_SERVICE: serviceUrl(4005),
  },
```

In `services/clients/user-api.client.ts`, delete the `verifyEmail` and `resendVerificationEmail` methods. They call `/users/verify-email` and `/users/resend-verification`, which do not exist.

In `services/README.md`, delete the section that shows the legacy `api.post('/users/login', ...)` usage (around line 175-185).

- [ ] **Step 3: Stop tracking IDE and generated files; ignore `.env`**

Append to `.gitignore`:
```
.env

# IDE and generated analysis output
.idea/
graphify-out/
```

```bash
git rm -r --cached .idea graphify-out
```
(The files stay on disk; graphify keeps working locally.)

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npm test -- --ci`
Expected: same as the baseline.

- [ ] **Step 5: Commit**

```bash
git add -A services .gitignore
git commit -m "chore: remove dead API clients and unused service URLs, stop tracking IDE and graph output"
```

---

## Task 3: Release API configuration and build guard

**Repo:** Customer app. **Finding:** C3.

**Files:**
- Create: `app.config.ts`, `eas.json`, `.env.example`, `services/__tests__/api.config.test.ts`
- Modify: `services/config/api.config.ts:1-28`

**Interfaces:**
- Consumes: `BASE_URLS` with three keys (Task 2).
- Produces: `releaseApiUrl(url: string | undefined): string` (throws `EXPO_PUBLIC_API_URL must be an https:// URL in a release build`). The env var `EXPO_PUBLIC_API_URL` is the single base for every service in release builds. `eas.json` profiles `preview` and `production`. Task 4's bundle check expects the literal `127.0.0.1` to be **absent** from release bundles, which this task guarantees by keeping the dev host code inside a `__DEV__`-only branch.

- [ ] **Step 1: Write the failing test**

`services/__tests__/api.config.test.ts`:
```ts
import { releaseApiUrl } from '../config/api.config';

describe('releaseApiUrl', () => {
  it('accepts an https URL', () => {
    expect(releaseApiUrl('https://api.example.com/api')).toBe('https://api.example.com/api');
  });

  it.each([undefined, '', 'http://api.example.com/api', 'http://192.168.1.5:4001/api'])('refuses %p', (url) => {
    expect(() => releaseApiUrl(url)).toThrow('EXPO_PUBLIC_API_URL must be an https:// URL in a release build');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest services/__tests__/api.config.test.ts`
Expected: FAIL, `releaseApiUrl is not a function` (or a TypeScript import error).

- [ ] **Step 3: Replace the top of `services/config/api.config.ts` (through `BASE_URLS`)**

```ts
/**
 * API Configuration
 * Centralized configuration for all API endpoints and settings
 */

import Constants from 'expo-constants';

// Release builds get one https base (the API gateway) from eas.json. Expo inlines EXPO_PUBLIC_*
// at bundle time, so this must stay a literal `process.env.EXPO_PUBLIC_API_URL` read.
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export function releaseApiUrl(url: string | undefined): string {
  if (!url?.startsWith('https://')) {
    throw new Error('EXPO_PUBLIC_API_URL must be an https:// URL in a release build');
  }
  return url;
}

// Reuse the LAN IP the device already reached Metro on, so a new DHCP lease
// doesn't strand the app on a stale host. In tunnel mode hostUri is an
// *.exp.direct name that only proxies Metro's port, so ignore anything
// that isn't a literal IP and go straight to the LAN.
function devServiceUrl(port: number): string {
  const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];
  const host = metroHost && /^\d{1,3}(\.\d{1,3}){3}$/.test(metroHost) ? metroHost : '127.0.0.1';
  return `http://${host}:${port}/api`;
}

// devServiceUrl is referenced only on the __DEV__ side, so the minifier drops it (and its
// 127.0.0.1) from release bundles; scripts/check-bundle.mjs verifies that.
const serviceUrl = (port: number) => (__DEV__ ? API_URL ?? devServiceUrl(port) : releaseApiUrl(API_URL));

export const API_CONFIG = {
  // Base URLs for different services
  BASE_URLS: {
    USER_SERVICE: serviceUrl(4001),
    ORDER_SERVICE: serviceUrl(4002),
    MENU_SERVICE: serviceUrl(4005),
  },
```
Leave the rest of the file (`TIMEOUT` onward) unchanged.

- [ ] **Step 4: Run the test**

Run: `npx jest services/__tests__/api.config.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Add the build-time guard: `app.config.ts`**

```ts
import type { ConfigContext, ExpoConfig } from 'expo/config';

// A tester or store build must never be bundled against a missing or plaintext API URL.
// EAS sets EAS_BUILD_PROFILE (and the profile's env from eas.json) while it evaluates this file.
export default ({ config }: ConfigContext): ExpoConfig => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const url = process.env.EXPO_PUBLIC_API_URL ?? '';
  if (profile && !url.startsWith('https://')) {
    throw new Error(`EAS profile "${profile}" needs EXPO_PUBLIC_API_URL to be an https:// URL (got "${url}")`);
  }
  return config as ExpoConfig;
};
```

- [ ] **Step 6: Add `eas.json`**

```json
{
  "cli": {
    "version": ">= 16.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": { "EXPO_PUBLIC_API_URL": "https://api-staging.rcdelivery.com/api" }
    },
    "production": {
      "autoIncrement": true,
      "env": { "EXPO_PUBLIC_API_URL": "https://api.rcdelivery.com/api" }
    }
  },
  "submit": {
    "production": {}
  }
}
```

`.env.example`:
```
# Leave unset for development: the app then calls the dev services on the Metro host (ports 4001/4002/4005).
# Set it to try a deployed API from a dev build. Release builds take it from eas.json and must use https://.
EXPO_PUBLIC_API_URL=
```

- [ ] **Step 7: Verify the guard**

Run: `EAS_BUILD_PROFILE=production npx expo config --type public`
Expected: FAIL with `EAS profile "production" needs EXPO_PUBLIC_API_URL to be an https:// URL (got "")`.

Run: `EAS_BUILD_PROFILE=production EXPO_PUBLIC_API_URL=http://x.example/api npx expo config --type public`
Expected: FAIL naming `http://x.example/api`.

Run: `EAS_BUILD_PROFILE=production EXPO_PUBLIC_API_URL=https://api.example.invalid/api npx expo config --type public`
Expected: PASS, prints the config.

Run: `npx expo config --type public` (no profile)
Expected: PASS. Local development is unaffected.

Run: `npx tsc --noEmit && npm test -- --ci`
Expected: baseline plus the 5 new tests.

- [ ] **Step 8: Development still works (NEEDS MANUAL CHECK if no device is attached)**

Start Metro (`npm start`), open the app on the phone, and sign in. It must reach the dev services on the LAN exactly as before.

- [ ] **Step 9: Commit**

```bash
git add app.config.ts eas.json .env.example services/config/api.config.ts services/__tests__/api.config.test.ts
git commit -m "feat(build): release builds take an https API URL from eas.json and refuse anything else"
```

---

## Task 4: Release bundle: strip debug logs, scan the bundle

**Repo:** Customer app. **Findings:** C3, C5.

**Files:**
- Create: `babel.config.js`, `scripts/check-bundle.mjs`
- Modify: `package.json` (dev dependency)

**Interfaces:**
- Consumes: `EXPO_PUBLIC_API_URL` inlining (Task 3).
- Produces: `node scripts/check-bundle.mjs <dir> [expected-api-url]` exits 1 and prints one line per problem. Task 7 (CI), Task 16 (runbook) and Task 17 (store artifact) run it.

- [ ] **Step 1: Write the bundle check**

`scripts/check-bundle.mjs`:
```js
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const FORBIDDEN = [
  [/192\.168\.\d{1,3}\.\d{1,3}/, "LAN IP address"],
  [/127\.0\.0\.1/, "dev API host fallback"],
  [/\[API_CLIENT\]/, "debug log that release builds must strip"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "private key"],
];

const [dir = "dist", expected] = process.argv.slice(2);

const walk = (d) =>
  readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const bundles = walk(dir).filter((p) => /\.(js|hbc|bundle)$/.test(p));
if (!bundles.length) {
  console.error(`no .js, .hbc or .bundle file under ${dir}`);
  process.exit(1);
}

const problems = [];
let sawExpected = !expected;
for (const file of bundles) {
  // latin1 keeps every byte: Hermes bytecode (.hbc) stores ASCII strings verbatim
  const text = readFileSync(file, "latin1");
  for (const [re, what] of FORBIDDEN) if (re.test(text)) problems.push(`${file}: ${what} (${re})`);
  if (expected && text.includes(expected)) sawExpected = true;
}
if (!sawExpected) problems.push(`the API URL ${expected} is in no bundle: EXPO_PUBLIC_API_URL was not inlined`);

problems.forEach((p) => console.error(p));
console.log(problems.length ? `${problems.length} problem(s)` : `bundle clean (${bundles.length} file(s))`);
process.exit(problems.length ? 1 : 0);
```

- [ ] **Step 2: Run it against today's release bundle (the failing check)**

Run: `EXPO_PUBLIC_API_URL=https://api.example.invalid/api npx expo export --platform android --output-dir dist && node scripts/check-bundle.mjs dist https://api.example.invalid/api`
Expected: FAIL with at least `debug log that release builds must strip`. Task 3 should already have removed `127.0.0.1`. If `127.0.0.1` or a LAN IP is still reported, open the bundle around that offset. If the text belongs to a third-party library, not to `api.config.ts`, narrow that regex and say why in the commit message. If it is our fallback, the `__DEV__` branch in Task 3 did not get dropped: report it, do not loosen the check.

- [ ] **Step 3: Strip `console.log/info/debug` from release bundles**

Run: `npm install --save-dev babel-plugin-transform-remove-console`

`babel.config.js`:
```js
module.exports = function (api) {
  // Metro passes isDev; anything else (Jest) counts as dev so tests keep their console spies.
  const isDev = api.caller((caller) => caller?.isDev !== false);
  return {
    presets: ["babel-preset-expo"],
    plugins: isDev ? [] : [["transform-remove-console", { exclude: ["error", "warn"] }]],
  };
};
```

- [ ] **Step 4: Run the check again**

Run: `rm -rf dist && EXPO_PUBLIC_API_URL=https://api.example.invalid/api npx expo export --platform android --output-dir dist --clear && node scripts/check-bundle.mjs dist https://api.example.invalid/api`
Expected: PASS, `bundle clean (...)`.

Run: `npx expo export --platform ios --output-dir dist-ios --clear` with the same env, then `node scripts/check-bundle.mjs dist-ios https://api.example.invalid/api`, then `rm -rf dist-ios`
Expected: PASS.

Run: `npm test -- --ci`
Expected: same as before (the plugin is off under Jest).

- [ ] **Step 5: Development still logs (NEEDS MANUAL CHECK)**

`npm start`, open Home, and confirm the `[API_CLIENT]` lines still appear in the Metro terminal.

- [ ] **Step 6: Commit**

```bash
git add babel.config.js scripts/check-bundle.mjs package.json package-lock.json
git commit -m "feat(build): strip debug logs from release bundles and scan bundles for dev hosts"
```

---

## Task 5: Error boundary

**Repo:** Customer app. **Finding:** C6.

**Files:**
- Modify: `app/_layout.tsx`
- Test: `screens/__tests__/errorBoundary.test.tsx`

**Interfaces:** Produces: named export `ErrorBoundary` from `app/_layout.tsx` (expo-router renders it in place of the root layout when the tree throws).

- [ ] **Step 1: Write the failing test**

`screens/__tests__/errorBoundary.test.tsx`:
```tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { ErrorBoundary } from '@/app/_layout';
import { TokenUtils } from '@/services/utils/token.utils';

jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }));

describe('root ErrorBoundary', () => {
  it('offers Try again, which only retries', async () => {
    const retry = jest.fn(async () => {});
    const clear = jest.spyOn(TokenUtils, 'clearTokens');
    await render(<ErrorBoundary error={new Error('boom')} retry={retry} />);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    await fireEvent.press(screen.getByText('Try again'));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(clear).not.toHaveBeenCalled();
  });

  it('offers Sign out, which clears the saved session before retrying', async () => {
    const retry = jest.fn(async () => {});
    const clear = jest.spyOn(TokenUtils, 'clearTokens');
    await render(<ErrorBoundary error={new Error('boom')} retry={retry} />);
    await fireEvent.press(screen.getByText('Sign out'));
    await waitFor(() => expect(retry).toHaveBeenCalledTimes(1));
    expect(clear).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest screens/__tests__/errorBoundary.test.tsx`
Expected: FAIL (`ErrorBoundary` is undefined: element type is invalid).

- [ ] **Step 3: Implement in `app/_layout.tsx`**

Change the imports at the top to:
```tsx
import React, { useEffect } from 'react'
import { View } from 'react-native'
import { Stack, type ErrorBoundaryProps } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { Provider } from 'react-redux'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { store } from '@/store'
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/services';
import { TokenUtils } from '@/services/utils/token.utils';
import { API_CONFIG } from '@/services/config/api.config';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppButton } from '@/components/ui/AppButton';
import { useFonts, Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold } from '@expo-google-fonts/nunito';
```

Add above `const RootLayout`:
```tsx
// Replaces the whole tree after a render error, so it must not need the providers (they may be what failed).
// "Sign out" is the way out of a crash that repeats for the saved session on every launch.
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  useEffect(() => {
    SplashScreen.hideAsync(); // the error may have happened before the splash was hidden
  }, []);

  const signOut = async () => {
    await Promise.all([
      TokenUtils.clearTokens(),
      AsyncStorage.removeItem(API_CONFIG.STORAGE_KEYS.USER_DATA).catch(() => {}),
    ]);
    await retry();
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <EmptyState
        tone="error"
        icon="alert-circle-outline"
        title="Something went wrong"
        message="The app hit an unexpected problem."
        actionLabel="Try again"
        onAction={retry}
      />
      <AppButton title="Sign out" variant="secondary" onPress={signOut} />
    </View>
  );
}
```

- [ ] **Step 4: Run to verify it passes, then the whole suite**

Run: `npx jest screens/__tests__/errorBoundary.test.tsx`
Expected: PASS (2 tests).
Run: `npx tsc --noEmit && npm test -- --ci`
Expected: baseline plus the new tests. `routeGuard.test.tsx` is unchanged and passes.

- [ ] **Step 5: Crash check on a device (NEEDS MANUAL CHECK)**

Temporarily add `throw new Error('test')` to the top of `HomeScreen`'s render, reload, and confirm the fallback appears. Press Sign out and confirm the login screen appears. Remove the throw. Do not commit it.

- [ ] **Step 6: Commit**

```bash
git add app/_layout.tsx screens/__tests__/errorBoundary.test.tsx
git commit -m "feat(app): root error boundary with retry and a sign-out escape"
```

---

## Task 6: One password rule in the app

**Repo:** Customer app. **Finding:** C11.

**Files:**
- Modify: `services/utils/validation.ts:26-27`, `screens/auth/signUpSecond/signUpSecond.screen.tsx:19-26`, `screens/auth/resetPassword/resetPassword.screen.tsx:89`, `components/profile/ChangePasswordModal.tsx:58`
- Test (approved edits, old 6-character text only): `services/__tests__/validation.test.ts`, `screens/__tests__/passwordReset.test.tsx`, `screens/__tests__/passwordResetUi.test.tsx`, `screens/__tests__/profile.screen.test.tsx`

**Interfaces:** Produces: `PASSWORD_RULE` (the exact message in Global Constraints) and `validateNewPassword(value)` used by signup, reset and change-password. Task 12 enforces the same rule on the server.

- [ ] **Step 1: Write the failing test**

Add to `services/__tests__/validation.test.ts`:
```ts
import { validateNewPassword, PASSWORD_RULE } from '../utils/validation';

describe('validateNewPassword (same rule as signup and the server)', () => {
  it.each(['Brand-new-1', 'Passw0rd!', 'abc 12345'])('accepts %p', (pw) => {
    expect(validateNewPassword(pw)).toBeNull();
  });
  it.each(['short1!', 'no-digits-here', 'NoSymbol123', ''])('refuses %p', (pw) => {
    expect(validateNewPassword(pw)).toBe(PASSWORD_RULE);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx jest services/__tests__/validation.test.ts`
Expected: FAIL (`PASSWORD_RULE` is not exported; `no-digits-here` is accepted today).

- [ ] **Step 3: Implement**

In `services/utils/validation.ts`, replace `validateNewPassword`:
```ts
export const PASSWORD_RULE = 'Password must be at least 8 characters, contain a number and a special character';

export const validateNewPassword = (value: string): string | null =>
  value.length >= 8 && /\d/.test(value) && /[^A-Za-z0-9]/.test(value) ? null : PASSWORD_RULE;
```

In `signUpSecond.screen.tsx`, import it (`import { validateNewPassword } from "@/services/utils/validation";`) and replace the inline regex check:
```tsx
        const passwordProblem = validateNewPassword(passwordInfo.password);
        if (passwordProblem) {
            newErrors.passwordError = passwordProblem;
```
Keep the rest of `validatePassword` (the `isValid = false` line and the mismatch check) as it is.

Change both placeholders `"At least 6 characters"` (`resetPassword.screen.tsx:89`, `ChangePasswordModal.tsx:58`) to `"8+ characters, a number and a symbol"`.

- [ ] **Step 4: Update only the assertions on the old rule**

Run: `npm test -- --ci`
Expected failures: only assertions that query the placeholder `At least 6 characters` or expect the text `Password must be at least 6 characters`. In the four approved files, replace those strings with the new placeholder and `PASSWORD_RULE`'s text. Change nothing else. Any other failure is a regression: fix the code, not the test.

Run: `npm test -- --ci && npx tsc --noEmit`
Expected: all pass. `signUp.screen.test.tsx` passes unchanged (it already uses the same message).

- [ ] **Step 5: Commit**

```bash
git add services/utils/validation.ts screens/auth components/profile services/__tests__/validation.test.ts screens/__tests__/passwordReset.test.tsx screens/__tests__/passwordResetUi.test.tsx screens/__tests__/profile.screen.test.tsx
git commit -m "fix(auth): one password rule for signup, reset and change password"
```

---

## Task 7: CI and supply chain

**Repo:** Customer app. **Findings:** C1, C7.

**Files:**
- Modify: `.github/workflows/ci.yml`
- Create: `.github/dependabot.yml`

**Interfaces:** Consumes: `.nvmrc` (Task 1), `scripts/check-bundle.mjs` (Task 4).

- [ ] **Step 1: Replace `.github/workflows/ci.yml`**

The action SHAs are the ones the Admin repo already resolved and pinned (`Admin/.github/workflows/ci.yml`, v4.4.0).

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main, dev]

permissions:
  contents: read

jobs:
  verify:
    runs-on: ubuntu-latest
    env:
      EXPO_PUBLIC_API_URL: https://api.example.invalid/api
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0
        with:
          persist-credentials: false
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: .nvmrc
          cache: npm
      # --ignore-scripts: dependency install scripts are the usual route for npm supply-chain malware
      - run: npm ci --ignore-scripts
      - run: npx expo install --check
      - run: npx tsc --noEmit
      - run: npm test -- --ci
      # The remaining high advisories sit in Expo's CLI tooling (zod) with no non-breaking fix and never reach the app bundle
      - run: npm audit --omit=dev --audit-level=critical
      - run: npx expo export --platform android --output-dir dist
      - run: node scripts/check-bundle.mjs dist https://api.example.invalid/api
```
If Task 1 Step 5 added `legacy-peer-deps=true` to `.npmrc`, `npm ci` picks it up. No flag is needed here.

- [ ] **Step 2: Add `.github/dependabot.yml`**

```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    # Expo SDK packages move together through `npx expo install --fix`, never one at a time
    ignore:
      - dependency-name: "expo"
      - dependency-name: "expo-*"
      - dependency-name: "@expo/*"
      - dependency-name: "react"
      - dependency-name: "react-dom"
      - dependency-name: "react-native"
      - dependency-name: "react-native-*"
      - dependency-name: "@react-native/*"
      - dependency-name: "@react-native-async-storage/*"
```

- [ ] **Step 3: Run the whole CI sequence in a clean copy**

```bash
rm -rf ../fc-ci && mkdir ../fc-ci && git archive HEAD | tar -x -C ../fc-ci && cd ../fc-ci
npm ci --ignore-scripts && npx expo install --check && npx tsc --noEmit && npm test -- --ci \
  && npm audit --omit=dev --audit-level=critical \
  && EXPO_PUBLIC_API_URL=https://api.example.invalid/api npx expo export --platform android --output-dir dist \
  && node scripts/check-bundle.mjs dist https://api.example.invalid/api
cd ../Frontend-Customer && rm -rf ../fc-ci
```
Expected: every step exits 0. If a dependency needs its install script for the tests or the export, add a targeted `npm rebuild <package>` step after `npm ci` and name the package in a comment.

- [ ] **Step 4: Commit (do not push; the user pushes and turns on branch protection)**

```bash
git add .github/workflows/ci.yml .github/dependabot.yml
git commit -m "ci: Node from .nvmrc, pinned actions, no install scripts, audit, Expo check, bundle scan"
```

---

## Task 8: Final identity and generated native projects

**Repo:** Customer app. **Findings:** C8, C9, C12, C15. **Needs:** D1 = (a), D7 values. The JSON below uses the recommended D7 values.

**Files:**
- Modify: `app.json`, `.gitignore`, `google-services.json` (replaced)
- Delete from git: `android/`

**Interfaces:** Produces: the permanent package/bundle ID used by Task 9 (EAS project and credentials) and Task 10 (push).

- [ ] **Step 1: The failing check**

Run: `git ls-files android | wc -l; rg -n "SYSTEM_ALERT_WINDOW|allowBackup=\"true\"" android/app/src/main/AndroidManifest.xml; rg -n "signingConfig signingConfigs.debug" android/app/build.gradle`
Expected today: `45`, two manifest hits, two gradle hits.

- [ ] **Step 2: Register the final package in Firebase (manual, account owner)**

In the Firebase console (project `rc-notification-52917`): add an Android app with package `com.rcdelivery.customer`, download its `google-services.json`, and replace the root `google-services.json` with it. Then add an iOS app with bundle ID `com.rcdelivery.customer` (needed only if D2 = (b); skip it for (a)).

- [ ] **Step 3: Replace `app.json`**

```json
{
  "expo": {
    "name": "RC Caterings",
    "slug": "rc-customer",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "rccustomer",
    "userInterfaceStyle": "light",
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.rcdelivery.customer",
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.rcdelivery.customer",
      "googleServicesFile": "./google-services.json",
      "softwareKeyboardLayoutMode": "pan",
      "allowBackup": false,
      "blockedPermissions": [
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "resizeMode": "contain",
          "backgroundColor": "#ffffff"
        }
      ],
      "expo-status-bar",
      "expo-secure-store",
      "expo-notifications"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 4: Stop committing generated native projects**

```bash
git rm -r android
```
Append to `.gitignore`:
```
# Generated by `npx expo prebuild` / EAS Build from app.json (Continuous Native Generation)
/android
/ios
```

- [ ] **Step 5: Verify the generated project**

Run: `npx expo prebuild --platform android --clean --no-install`
Then:
Run: `rg -n "SYSTEM_ALERT_WINDOW|READ_EXTERNAL_STORAGE|WRITE_EXTERNAL_STORAGE" android/app/src/main/AndroidManifest.xml`
Expected: no `uses-permission` hits (a `tools:node="remove"` entry is fine).
Run: `rg -n "allowBackup|rccustomer|com.rcdelivery.customer" android/app/src/main/AndroidManifest.xml android/app/build.gradle`
Expected: `allowBackup="false"`, the `rccustomer` scheme, `applicationId 'com.rcdelivery.customer'`.
Run: `npx expo-doctor`
Expected: no failed checks.
Run: `npx tsc --noEmit && npm test -- --ci`
Expected: unchanged.

- [ ] **Step 6: Device check (NEEDS MANUAL CHECK)**

`npx expo run:android --variant release` on the test phone (the generated project signs release with the debug key locally, which is fine for this check; EAS signs real builds in Task 9). Sign in, place and cancel an order, receive a push from the Admin "notices" screen.

- [ ] **Step 7: Restrict the Firebase API key (manual, account owner)**

Google Cloud console, project `rc-notification-52917`: APIs & Services, Credentials, the Android key from the new `google-services.json`. Application restriction: Android apps, package `com.rcdelivery.customer`, with the SHA-1 of the EAS upload key and the Play App Signing key (both available after Task 9). API restriction: only the Firebase APIs the app uses (Firebase Installations, FCM Registration). Record the date in `docs/RELEASE.md` (Task 16).

- [ ] **Step 8: Commit**

```bash
git add app.json .gitignore google-services.json
git commit -m "chore(app): final app identity, native projects generated from app.json, no backup or unused permissions"
```

---

## Task 9: EAS project, credentials, versioning

**Repo:** Customer app. **Finding:** C14. Mostly account work; the account owner runs the interactive steps.

**Files:**
- Modify: `app.json` (EAS adds `extra.eas.projectId` and `owner`), `eas.json` (`submit`)

**Interfaces:** Produces: `Constants.expoConfig.extra.eas.projectId` (Task 10 passes it to `getExpoPushTokenAsync`), a production signing key held by EAS with an offline backup, and remote version numbers.

- [ ] **Step 1: Create the EAS project**

Run: `npx eas-cli@latest login` (the organisation account from `GO-LIVE-PLAYBOOK.md`), then `npx eas-cli@latest init`.
Expected: `app.json` gains `"extra": { "eas": { "projectId": "<uuid>" } }` and `"owner"`.

- [ ] **Step 2: Android signing**

Run: `npx eas-cli@latest credentials -p android`, choose the production build profile, and let EAS generate a new keystore.
Then download a backup through the same menu ("Download credentials") and store it in the company password manager, **never** in the repo (`*.jks` is already ignored). Play App Signing is mandatory for new apps: Google holds the app signing key, and this keystore becomes the upload key.

- [ ] **Step 3: iOS signing and push key**

Run: `npx eas-cli@latest credentials -p ios` and authenticate with the App Store Connect API key (the `.p8` from `GO-LIVE-PLAYBOOK.md`; the team-invite workaround applies). Let EAS create the distribution certificate, the provisioning profile and the **push key** (Task 10 needs it).

- [ ] **Step 4: Version numbers**

Run: `npx eas-cli@latest build:version:set -p android` and enter `1`. Repeat for `-p ios`.
`eas.json` already has `appVersionSource: remote` and `autoIncrement` on `production` (Task 3), so every production build gets the next build number. The user-facing `version` in `app.json` changes by hand per release.

- [ ] **Step 5: Submit settings**

Upload the Google Play service account JSON (from `GO-LIVE-PLAYBOOK.md`) to EAS (`npx eas-cli@latest credentials -p android`, "Google Service Account"). Then set `submit` in `eas.json`:
```json
  "submit": {
    "production": {
      "android": { "track": "internal", "releaseStatus": "draft" },
      "ios": { "ascAppId": "<numeric Apple ID from App Store Connect, App Information>" }
    }
  }
```
Create the App Store Connect app record first (bundle ID `com.rcdelivery.customer`) to get `ascAppId`. The Play Console app record must also exist; the first Android upload is done by hand in the Play Console (Google's rule), and later ones go through `eas submit`.

- [ ] **Step 6: Tester build**

Run: `npx eas-cli@latest build --profile preview --platform android`
Expected: the build succeeds. If it fails at "Reading app config" with the Task 3 guard message, the profile env did not reach `app.config.ts`: report it (do not remove the guard).
Install the APK. If the staging API is not up yet, the app must show the network error state, not crash. **NEEDS MANUAL CHECK.**

- [ ] **Step 7: Commit**

```bash
git add app.json eas.json
git commit -m "chore(eas): link the EAS project and set submit targets"
```

---

## Task 10: Push on iOS (decision D2 = (a))

**Repos:** Backend (sender), then customer app (token). **Finding:** C13. **Needs:** Task 9 (project ID, APNs key).

**Files:**
- Backend modify: `apps/user-service/src/services/notificationService.js`, `apps/user-service/src/services/notificationService.test.js`
- App modify: `services/push/push.service.ts`, `screens/auth/login/login.screen.tsx`, `screens/auth/signUpSecond/signUpSecond.screen.tsx`, `screens/__tests__/signUp.screen.test.tsx` (mock name only), any other test that mocks `getFcmToken` (find with `rg -l getFcmToken screens services`)
- App create: `services/__tests__/push.service.test.ts`

**Interfaces:**
- Produces (Backend): `sendPushNotification(token, title, message)` and `sendToMany(tokens, title, message)` accept both `ExponentPushToken[...]` and FCM tokens. Signatures are unchanged.
- Produces (App): `getPushToken(): Promise<string | null>` replaces `getFcmToken`. It is still sent as `fcm_token` (the column name does not change).

- [ ] **Step 1 (Backend): Write the failing tests**

Add to `notificationService.test.js` (after the existing `beforeEach`):
```js
const fetchCalls = [];
let fetchReply;
global.fetch = async (url, init) => {
    fetchCalls.push({ url, body: JSON.parse(init.body), headers: init.headers });
    return { json: async () => fetchReply(JSON.parse(init.body)) };
};
beforeEach(() => {
    fetchCalls.length = 0;
    fetchReply = (msgs) => ({ data: msgs.map(() => ({ status: "ok", id: "x" })) });
});

const EXPO = "ExponentPushToken[abc]";

test("an Expo token goes through Expo's push service, not firebase-admin", async () => {
    assert.equal(await sendPushNotification(EXPO, "T", "B"), true);
    assert.equal(calls.send.length, 0);
    assert.equal(fetchCalls[0].url, "https://exp.host/--/api/v2/push/send");
    assert.deepEqual(fetchCalls[0].body, [{ to: EXPO, title: "T", body: "B", sound: "default" }]);
});

test("an Expo token Expo reports as DeviceNotRegistered is cleared", async () => {
    fetchReply = () => ({ data: [{ status: "error", details: { error: "DeviceNotRegistered" } }] });
    assert.equal(await sendPushNotification(EXPO, "T", "B"), false);
    assert.deepEqual(calls.update[0].opts.where.fcm_token[Op.in], [EXPO]);
});

test("sendToMany splits Expo and FCM tokens and adds up the results", async () => {
    const res = await sendToMany([EXPO, "fcm-1", "fcm-2"], "T", "B");
    assert.deepEqual(res, { sent: 3, failed: 0 });
    assert.deepEqual(calls.multicast[0].tokens, ["fcm-1", "fcm-2"]);
    assert.equal(fetchCalls[0].body.length, 1);
});
```

- [ ] **Step 2 (Backend): Run them to verify they fail**

Run: `cd apps/user-service && node --test src/services/notificationService.test.js`
Expected: the 3 new tests FAIL (the Expo token goes to `firebase-admin`). The existing tests pass.

- [ ] **Step 3 (Backend): Implement**

In `notificationService.js`, add after `DEAD_TOKEN_CODES`:
```js
// The customer app registers Expo push tokens (iOS has no FCM token without the Firebase SDK);
// the delivery app still registers FCM tokens. Route each kind to the service that accepts it.
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_BATCH_LIMIT = 100;
const isExpoToken = (t) => typeof t === "string" && t.startsWith("ExponentPushToken[");

async function sendViaExpo(tokens, title, message) {
    const headers = { "Content-Type": "application/json", Accept: "application/json" };
    if (process.env.EXPO_ACCESS_TOKEN) headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
    let sent = 0;
    let failed = 0;
    for (let i = 0; i < tokens.length; i += EXPO_BATCH_LIMIT) {
        const batch = tokens.slice(i, i + EXPO_BATCH_LIMIT);
        try {
            const res = await fetch(EXPO_PUSH_URL, {
                method: "POST",
                headers,
                body: JSON.stringify(batch.map((to) => ({ to, title, body: message, sound: "default" }))),
            });
            const { data = [] } = await res.json();
            const ok = batch.filter((_, j) => data[j]?.status === "ok").length;
            sent += ok;
            failed += batch.length - ok;
            await clearTokens(batch.filter((_, j) => data[j]?.details?.error === "DeviceNotRegistered"));
        } catch (error) {
            console.log("error sending expo push batch", error);
            failed += batch.length;
        }
    }
    return { sent, failed };
}
```

In `sendPushNotification`, make the first line of the function body:
```js
    if (isExpoToken(fcm_token)) return (await sendViaExpo([fcm_token], title, message)).sent === 1;
```

Replace the first three lines of `sendToMany` (the signature, `let sent = 0;` and `let failed = 0;`) so that it splits the tokens first:
```js
const sendToMany = async (allTokens, title, message) => {
    const expo = await sendViaExpo(allTokens.filter(isExpoToken), title, message);
    const tokens = allTokens.filter((t) => !isExpoToken(t));
    let sent = expo.sent;
    let failed = expo.failed;
```
(The existing FCM loop below stays as it is and keeps using `tokens`.)

- [ ] **Step 4 (Backend): Run to verify**

Run: `node --test src/services/notificationService.test.js` (in `apps/user-service`), then `cd ../.. && npm run test:authz`
Expected: all pass.

- [ ] **Step 5 (Backend): Commit**

```bash
git add apps/user-service/src/services/notificationService.js apps/user-service/src/services/notificationService.test.js
git commit -m "feat(push): deliver Expo push tokens through Expo, FCM tokens through firebase-admin"
```

- [ ] **Step 6 (App): Write the failing test**

`services/__tests__/push.service.test.ts`:
```ts
// jest.mock factories are hoisted: they may only reference variables whose names start with "mock"
const mockGetExpoPushTokenAsync = jest.fn(async () => ({ data: 'ExponentPushToken[abc]' }));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: (...args: unknown[]) => mockGetExpoPushTokenAsync(...(args as [])),
  AndroidImportance: { MAX: 5 },
}));
jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'standalone', expoConfig: { extra: { eas: { projectId: 'proj-1' } } } },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));

import { getPushToken } from '../push/push.service';

it('returns the Expo push token for this EAS project', async () => {
  await expect(getPushToken()).resolves.toBe('ExponentPushToken[abc]');
  expect(mockGetExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'proj-1' });
});
```

- [ ] **Step 7 (App): Run it to verify it fails**

Run: `npx jest services/__tests__/push.service.test.ts`
Expected: FAIL (`getPushToken` is not exported).

- [ ] **Step 8 (App): Implement**

In `push.service.ts`, replace the doc comment and `getFcmToken` with:
```ts
/**
 * Returns this device's Expo push token, or null if unavailable.
 *
 * The backend sends `ExponentPushToken[...]` through Expo's push service, which forwards to FCM on
 * Android and APNs on iOS (notificationService.js). A raw device token would not work on iOS:
 * getDevicePushTokenAsync() returns an APNs token there, which firebase-admin rejects.
 */
export async function getPushToken(): Promise<string | null> {
  // iOS Simulator has no APNs registration; Android emulators with Play
  // Services do get tokens, so only iOS is excluded here.
  if (Platform.OS === 'ios' && !Device.isDevice) return null;

  const Notifications = await loadNotifications();
  if (!Notifications) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const granted =
    existing.status === 'granted' ||
    (await Notifications.requestPermissionsAsync()).status === 'granted';
  if (!granted) return null;

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch (error) {
    console.log('Push token fetch failed', error);
    return null;
  }
}
```
In `login.screen.tsx` and `signUpSecond.screen.tsx`, change the import and the call from `getFcmToken` to `getPushToken`. In every test that mocks `@/services/push/push.service`, rename the mocked key `getFcmToken` to `getPushToken` (approved edit, name only).

- [ ] **Step 9 (App): Run to verify**

Run: `npx jest services/__tests__/push.service.test.ts && npm test -- --ci && npx tsc --noEmit`
Expected: all pass.

- [ ] **Step 10: Push credentials and end-to-end check (manual)**

Upload an FCM V1 service-account key for the Firebase project to EAS (`npx eas-cli@latest credentials -p android`, "Push Notifications: FCM V1"). Use a dedicated key with only the "Firebase Cloud Messaging API Admin" role, not the backend's admin SDK key. The iOS push key came from Task 9. Optionally turn on "Enhanced push security" in the EAS project and give the backend `EXPO_ACCESS_TOKEN` through SSM Parameter Store (playbook section 7 pattern).
Then build `preview` for both platforms, sign in on an Android phone and an iPhone, and send a notice from the Admin console. Both must show the push in the foreground, in the background and when the app is killed. **NEEDS MANUAL CHECK.**

- [ ] **Step 11 (App): Commit**

```bash
git add services/push/push.service.ts services/__tests__/push.service.test.ts screens
git commit -m "feat(push): register Expo push tokens so iOS customers receive notifications"
```

---

## Task 11: Short customer access tokens (decision D3 = (a))

**Repo:** Backend. **Finding:** B1.

**Files:**
- Modify: `apps/user-service/src/utils/jwt.js:26-29`, `apps/user-service/src/utils/jwt.test.js`, `docker/docker-compose.yml` (user-service environment, next to `ACCESS_TOKEN_TTL`)

**Interfaces:** Produces: env var `CUSTOMER_ACCESS_TOKEN_TTL` (default `1h`). `ACCESS_TOKEN_TTL` now affects only non-admin, non-customer roles (delivery staff).

- [ ] **Step 1: Write the failing test**

In `jwt.test.js`, add `delete process.env.CUSTOMER_ACCESS_TOKEN_TTL;` next to the other `delete` lines. Then replace the test `'other roles keep the 7 day token'` with (approved edit):
```js
test('customers get a 1 hour token (the app renews it silently)', () => {
  assert.equal(lifetime('customer'), 3600);
});

test('delivery persons keep the 7 day token', () => {
  assert.equal(lifetime('delivery_person'), 7 * 24 * 3600);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd apps/user-service && node --test src/utils/jwt.test.js`
Expected: FAIL, `604800 !== 3600`.

- [ ] **Step 3: Implement**

```js
const ADMIN_ROLES = ['admin', 'super_admin'];
const accessTokenTtl = (role) => {
  if (ADMIN_ROLES.includes(role)) return process.env.ADMIN_ACCESS_TOKEN_TTL || '8h'; // staff use a browser console that has no refresh flow
  if (role === 'customer') return process.env.CUSTOMER_ACCESS_TOKEN_TTL || '1h'; // the app renews it with its refresh token
  return process.env.ACCESS_TOKEN_TTL || '7d'; // e.g. ACCESS_TOKEN_TTL=1m to test refresh
};
```
In `docker/docker-compose.yml`, under the user-service `environment`, next to `ACCESS_TOKEN_TTL=${ACCESS_TOKEN_TTL:-7d}`, add:
```yaml
      - CUSTOMER_ACCESS_TOKEN_TTL=${CUSTOMER_ACCESS_TOKEN_TTL:-1h}
```

- [ ] **Step 4: Run to verify it passes, then the whole suite**

Run: `node --test` (in `apps/user-service`), then `cd ../.. && npm run test:authz`
Expected: all pass.

- [ ] **Step 5: Silent renewal works (NEEDS MANUAL CHECK)**

`CUSTOMER_ACCESS_TOKEN_TTL=1m docker compose -f docker/docker-compose.yml up -d user-service`. Sign in on the phone, wait 2 minutes, pull to refresh on Home: still signed in, data loads. Kill and reopen the app: still signed in.

- [ ] **Step 6: Commit**

```bash
git add apps/user-service/src/utils/jwt.js apps/user-service/src/utils/jwt.test.js docker/docker-compose.yml
git commit -m "feat(auth): 1 hour customer access tokens"
```

---

## Task 12: Server-side password rule

**Repo:** Backend. **Finding:** B3. **Consumes:** the rule text from Task 6.

**Files:**
- Create: `apps/user-service/src/utils/passwordPolicy.js`, `tests/password-policy.test.js`
- Modify: `apps/user-service/src/controllers/user.controller.js` (signup, changePassword), `apps/user-service/src/controllers/auth.controller.js:162-167` (resetPassword), `tests/user-service.auth.test.js` (approved: `signupBody`'s default password and the `hashed:pw` expectation only)

**Interfaces:** Produces: `passwordProblem(pw): string | null` and `PASSWORD_RULE`. Login keeps its current `< 6` check on purpose: existing accounts with short passwords must still be able to sign in.

- [ ] **Step 1: Write the failing tests**

`tests/password-policy.test.js`:
```js
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { loadWithStubs, mockRes } = require('./helpers/stub');

const RULE = 'Password must be at least 8 characters, contain a number and a special character';
const USER = 'apps/user-service/src/controllers/user.controller.js';

let User, controller;
beforeEach(() => {
  User = {
    create: async (d) => ({ id: 9, ...d }),
    findOne: async () => null,
    findByPk: async () => ({ id: 1, password: 'h', save: async () => {} }),
    update: async () => [1],
  };
  controller = loadWithStubs(USER, {
    'models/User': User,
    'services/notificationService': { sendPushNotification: async () => {} },
    'services/emailService': { sendEmailQuietly: async () => {} },
    'utils/jwt': { verifyToken() {}, generateAccessToken: () => 'a', generateRefreshToken: () => 'r' },
    'utils/password': { hashPassword: async (p) => `hashed:${p}`, comparePassword: async () => true },
  });
});

const body = (password) => ({ full_name: 'Ann', email: 'a@x.com', password, role: 'customer', address: 'Colombo', phone: '0771234567' });

describe('signup password rule', () => {
  for (const pw of ['short1!', 'nodigits!!', 'NoSymbol123', undefined]) {
    test(`refuses ${pw}`, async () => {
      const res = mockRes();
      await controller.signup({ body: body(pw) }, res);
      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, RULE);
    });
  }
  test('accepts a strong password', async () => {
    const res = mockRes();
    await controller.signup({ body: body('Passw0rd!') }, res);
    assert.equal(res.statusCode, 201);
  });
});

describe('change-password rule', () => {
  test('refuses a weak new password', async () => {
    const res = mockRes();
    await controller.changePassword({ user: { id: 1 }, body: { current_password: 'old-pass', new_password: 'abcdef' } }, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, RULE);
  });
});
```
For reset-password, add one test to the existing `resetPassword` describe block in `tests/profile-and-reset.test.js`, reusing that block's stubs: `newPassword: 'abcdef'` must give 400 with `RULE` (approved addition).

- [ ] **Step 2: Run them to verify they fail**

Run: `node --test tests/password-policy.test.js tests/profile-and-reset.test.js`
Expected: the new tests FAIL (signup accepts anything; change and reset accept 6 characters).

- [ ] **Step 3: Implement**

`apps/user-service/src/utils/passwordPolicy.js`:
```js
// Same rule and wording as the customer app (Frontend-Customer services/utils/validation.ts).
const PASSWORD_RULE = 'Password must be at least 8 characters, contain a number and a special character';

const passwordProblem = (pw) =>
  typeof pw === 'string' && pw.length >= 8 && /\d/.test(pw) && /[^A-Za-z0-9]/.test(pw) ? null : PASSWORD_RULE;

module.exports = { PASSWORD_RULE, passwordProblem };
```
In `user.controller.js`: `const { passwordProblem } = require('../utils/passwordPolicy');`. In `signup`, right after the role check:
```js
    const weak = passwordProblem(password);
    if (weak) return res.status(400).json({ error: weak });
```
In `changePassword`, replace the `new_password.length < 6` block with:
```js
    const weak = passwordProblem(new_password);
    if (weak) return res.status(400).json({ error: weak });
```
In `auth.controller.js` `resetPassword`, require it the same way and replace the `newPassword.length < 6` block with the same two lines, using `newPassword`. Leave `login`'s check alone.

- [ ] **Step 4: Update the old fixtures, then run everything**

In `tests/user-service.auth.test.js`, change `signupBody`'s default `password: 'pw'` to `password: 'Passw0rd!'` and the expectation `'hashed:pw'` to `'hashed:Passw0rd!'` (approved).
Run: `rg -n "password: '[^']{0,7}'|newPassword: '[^']{0,7}'" tests scripts` and update any other fixture that signs up, resets or changes a password with a weak value. List each one in the commit body.
Run: `npm run test:authz`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add apps/user-service/src/utils/passwordPolicy.js apps/user-service/src/controllers tests
git commit -m "feat(auth): enforce the password rule on signup, reset and change password"
```

---

## Task 13: Logout and account deletion remove personal data (decision D6 = (a))

**Repo:** Backend. **Finding:** B4.

**Files:**
- Modify: `apps/user-service/src/controllers/user.controller.js` (`deleteAccount`, `logout`), `tests/user-service.auth.test.js` (new tests), `apps/user-service/src/models/User.js` (only if Step 1 finds the column missing)

**Interfaces:** Produces: after logout the user has no `fcm_token`. After deletion the row keeps only `id`, `role`, timestamps and `status = 'deleted'`; name, email, phone, address, password, push token and reset fields are replaced.

- [ ] **Step 1: Check the model**

Run: `rg -n "unpaid_orders_count|phone|address|full_name" apps/user-service/src/models/User.js`
If `unpaid_orders_count` is missing: confirm the column exists in the dev database (`SELECT unpaid_orders_count FROM users LIMIT 1;`), then add `unpaid_orders_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },` to the model. If the column does not exist in the database, stop and report: the deletion guard has never worked, and the fix needs a migration.
Note whether `phone`, `address` or `full_name` is `allowNull: false`. Step 3 uses `''` for those instead of `null`.

- [ ] **Step 2: Write the failing tests**

Add to `tests/user-service.auth.test.js`:
```js
describe('personal data on logout and deletion', () => {
  test('logout also forgets the device push token', async () => {
    const res = mockRes();
    await controller.logout({ user: { id: 1 } }, res);
    assert.deepEqual(User.updateArgs[0], { refresh_token: null, fcm_token: null });
  });

  test('deleting an account replaces personal data and keeps the row for order history', async () => {
    const u = fakeUser({ id: 1, full_name: 'Ann', email: 'a@x.com', phone: '0771234567', address: 'Colombo', fcm_token: 'f', password: 'old-hash', password_reset_token: 't' });
    User.findByPk = async () => u;
    const res = mockRes();
    await controller.deleteAccount({ params: { userId: '1' }, user: { id: 1, role: 'customer' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(u.status, 'deleted');
    assert.equal(u.full_name, 'Deleted user');
    assert.equal(u.email, 'deleted-1@deleted.invalid');
    assert.equal(u.phone, null);
    assert.equal(u.address, null);
    assert.equal(u.fcm_token, null);
    assert.equal(u.refresh_token, null);
    assert.equal(u.password_reset_token, null);
    assert.match(u.password, /^hashed:/);
    assert.notEqual(u.password, 'old-hash');
    assert.equal(u.saved, true);
  });
});
```
(If Step 1 found `allowNull: false` on `phone` or `address`, expect `''` for that field.)

- [ ] **Step 3: Run them to verify they fail**

Run: `node --test tests/user-service.auth.test.js`
Expected: the 2 new tests FAIL.

- [ ] **Step 4: Implement**

At the top of `user.controller.js`: `const crypto = require('crypto');`.
In `deleteAccount`, replace the four lines from `user.status = 'deleted';` to `await user.save();` with:
```js
    // Store policy: deletion removes personal data. The row (id, role, dates) stays so past orders keep a valid customer.
    user.status = 'deleted';
    user.deleted_at = new Date();
    user.full_name = 'Deleted user';
    user.email = `deleted-${user.id}@deleted.invalid`;
    user.phone = null;
    user.address = null;
    user.fcm_token = null;
    user.refresh_token = null; // revoke sessions
    user.password_reset_token = null;
    user.password_reset_expires = null;
    user.password = await hashPassword(crypto.randomUUID());
    await user.save();
```
In `logout`, replace the update with:
```js
    await User.update({ refresh_token: null, fcm_token: null }, { where: { id: req.user.id } });
```

- [ ] **Step 5: Run to verify, then the whole suite**

Run: `npm run test:authz`
Expected: all pass. The existing signup "reactivates a deleted account" path still works for accounts deleted before this change; newly deleted accounts no longer match by email, so signing up again creates a new row.

- [ ] **Step 6: Manual check on the dev stack (NEEDS MANUAL CHECK)**

Create a customer, place an order, delete the account from the app's Profile screen, then check the database: the order still exists and points to the user, and the user row holds no personal data. Sign up again with the same email: it succeeds. Log out on a phone, send a notice from Admin: the phone gets nothing.

- [ ] **Step 7: Commit**

```bash
git add apps/user-service/src/controllers/user.controller.js apps/user-service/src/models/User.js tests/user-service.auth.test.js
git commit -m "feat(privacy): account deletion removes personal data; logout forgets the push token"
```

---

## Task 14: No secrets or internals in responses

**Repo:** Backend. **Findings:** B5, B6.

**Files:**
- Modify: `apps/user-service/src/controllers/user.controller.js` (signup response, 9 `500` handlers), `apps/user-service/src/controllers/auth.controller.js:94-97`, `apps/order-service/src/controllers/order.controller.js:179` and `:712`
- Test: `tests/user-service.auth.test.js`; plus one test per other controller in the files that already load it (`tests/profile-and-reset.test.js` for `auth.controller.js`, `tests/order-status-guard.test.js` for `order.controller.js`)

**Interfaces:** Produces: every `500` from these controllers is `{ error: 'Server error' }` (order-service keeps its key name: `{ message: 'Server error' }`), with the details in the server log.

- [ ] **Step 1: Write the failing tests**

Add to `tests/user-service.auth.test.js`:
```js
describe('response hygiene', () => {
  test('re-registering a deleted account never returns the password hash or the refresh token', async () => {
    User.findOne = async () => fakeUser({ id: 7, status: 'deleted', email: 'a@x.com', password: 'old-hash', refresh_token: 'r-old' });
    const res = mockRes();
    await controller.signup({ body: signupBody() }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.user.password, undefined);
    assert.equal(res.body.user.refresh_token, undefined);
    assert.equal(res.body.user.save, undefined);
  });

  test('a database failure during signup does not leak its message', async () => {
    User.findOne = async () => { throw new Error('connect ECONNREFUSED 10.0.1.5:3306'); };
    const res = mockRes();
    await controller.signup({ body: signupBody() }, res);
    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { error: 'Server error' });
  });
});
```
Add the same "does not leak" test for `login` (in `tests/profile-and-reset.test.js`, using that file's `AUTH` stubs, with `User.findOne` throwing) and for order creation (in `tests/order-status-guard.test.js`, using that file's stubs, with the order model's create or transaction throwing). Expected body: `{ error: 'Server error' }` for login, `{ message: 'Server error' }` for orders.

- [ ] **Step 2: Run them to verify they fail**

Run: `npm run test:authz`
Expected: the new tests FAIL (the hash is returned; `error.message` is returned).

- [ ] **Step 3: Implement**

In `user.controller.js`, add below `PRIVATE_FIELDS`:
```js
const signupView = (u) => ({
  id: u.id, full_name: u.full_name, email: u.email, role: u.role, address: u.address, area_id: u.area_id,
  phone: u.phone, approved: u.approved, fcm_token: u.fcm_token, created_at: u.created_at, status: u.status,
});
```
Use `user: signupView(existingUser)` in the reactivation response and `user: signupView(newUser)` in the new-user response (this replaces the hand-written object; the shape is the same).

Replace each of the 9 `res.status(500).json({ error: error.message });` lines in `user.controller.js`, and the one in `auth.controller.js` `login`, with:
```js
    console.error('<handler name> failed:', error);
    res.status(500).json({ error: 'Server error' });
```
(Use the exported handler's name, e.g. `'signup failed:'`. The login handler already logs, so only its response line changes.)
In `order.controller.js`, line 179 becomes `return res.status(500).json({ message: 'Server error' });` (add `console.error('createOrder failed:', error);` above it if the handler does not already log). Remove the `error: error.message` property at line 712 the same way.

- [ ] **Step 4: Run to verify**

Run: `npm run test:authz && (cd apps/order-service && npm test) && (cd apps/user-service && node --test)`
Expected: all pass.
Run: `rg -n "error: error.message" apps/user-service/src/controllers/user.controller.js apps/user-service/src/controllers/auth.controller.js apps/order-service/src/controllers/order.controller.js`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add apps/user-service/src/controllers apps/order-service/src/controllers tests
git commit -m "fix(api): never return password hashes or internal error messages to clients"
```

---

## Task 15: API routes and edge protection (decision D4 = (b))

**Where:** `AWS-INFRASTRUCTURE-PLAYBOOK.md` (workspace root, not a git repo) now; the infrastructure repo when the CDK stacks are written. **Findings:** E1, E2, E3, B2.

**Interfaces:** Produces: `https://api.rcdelivery.com/api/...` reaches the right service for every path the apps call. `/api/internal/*` is never routed. Every request to the API passes one WAF web ACL, including Admin's CloudFront `/api/*` traffic.

- [ ] **Step 1: List the real public mounts**

Run (in `Backend`): `rg -n "app.use\(['\"]/api" apps/*/index.js`
Keep every mount except `/api/internal*`. Known today: user-service `/api/users` (it also covers `/api/users/customers`, `/notices`, `/admins`, `/delivery-persons`, `/settings`, `/audit-logs`); order-service `/api/orders`; menu-service `/api/food-items`, `/api/inventory`, `/api/meal-sessions`, `/api/meal-session-items`. Add the locations, delivery and analytics mounts from the output.

- [ ] **Step 2: Rewrite playbook section 6 (gateway) for a REST API**

Replace the `HttpApi` snippet with a `RestApi` (from `aws-cdk-lib/aws-apigateway`): one `LambdaIntegration` per service, with resources mirroring the mounts from Step 1 (`api/users/{proxy+}`, `api/orders/{proxy+}`, `api/meal-sessions/{proxy+}` and so on). Set `disableExecuteApiEndpoint: true` and use the custom domain `api.rcdelivery.com`. Add stage throttling (start with rate 50 requests per second, burst 100; tune after launch). State that `/api/internal/*` has no resource. Update the architecture diagram label at line 16 from "API Gateway (HTTP API)" to "API Gateway (REST API + WAF)".

- [ ] **Step 3: Add the WAF to the playbook**

A regional web ACL associated with the REST API stage, containing:
- the managed groups `AWSManagedRulesCommonRuleSet`, `AWSManagedRulesKnownBadInputsRuleSet` and `AWSManagedRulesAmazonIpReputationList`;
- a rate-based rule scoped to `POST /api/users/login`, `/api/users/signup`, `/api/users/forgot-password` and `/api/users/reset-password`, keyed on IP, **100 requests per 5 minutes**. Sri Lankan mobile networks put many customers behind shared carrier IPs (CGNAT), so a tight per-IP limit would lock out real customers. Start in Count mode for one week, read the metrics, then switch to Block;
- a general per-IP rate rule (for example 2,000 per 5 minutes) in Block.

Admin's CloudFront `/api/*` behaviour points at `api.rcdelivery.com` (Admin decision D3a still holds), so admin traffic passes the same WAF. Write next to Admin decision D2 in the Admin plan's section 1.4: "superseded by Customer plan D4 (b)".

- [ ] **Step 4: Fix the stale checklist item**

In the playbook's "Pending code changes", tick the `GET /api/users/:userId` line and note: "fixed: `internalAuthMiddleware`, `apps/user-service/src/routes/user.routes.js:14`".

- [ ] **Step 5: Verify on staging once deployed (NEEDS MANUAL CHECK)**

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://api-staging.rcdelivery.com/api/meal-sessions/today   # 200 or 401, never 404
curl -s -o /dev/null -w "%{http_code}\n" https://api-staging.rcdelivery.com/api/internal/analytics    # 403 or 404 from the gateway, never the service
curl -s -o /dev/null -w "%{http_code}\n" https://<api-id>.execute-api.<region>.amazonaws.com/prod/api/users/profile  # connection refused / 403: default endpoint disabled
```
Then send 150 bad logins from one IP within 5 minutes (after switching to Block): requests beyond 100 get `403` from the WAF.

---

## Task 16: Store compliance and release runbook

**Repo:** Customer app. **Findings:** C15, D6 (store side). Writing plus account work.

**Files:**
- Create: `docs/RELEASE.md`

- [ ] **Step 1: Write `docs/RELEASE.md`**

```markdown
# Releasing the RC customer app

## One-time (done in production-readiness Tasks 8-10; keep this list current)
- EAS project: `<owner>/rc-customer`. Credentials live in EAS; the Android upload-key backup and the
  App Store Connect API key live in the company password manager. Play App Signing is on.
- Firebase Android API key restricted to `com.rcdelivery.customer` + upload and app-signing SHA-1 (date: ____).
- Push: FCM V1 key and APNs key uploaded to EAS.

## Every release
1. `git switch main && git pull`, CI green on the commit.
2. Bump `expo.version` in `app.json` for a user-visible release (build numbers increment automatically).
3. Tester build: `npx eas-cli@latest build --profile preview --platform all`; run the smoke list below on one Android and one iPhone.
4. Store build: `npx eas-cli@latest build --profile production --platform all`.
5. Scan the store artifact: download the `.aab`, `unzip -o app.aab 'base/assets/index.android.bundle' -d aab`,
   `node scripts/check-bundle.mjs aab https://api.rcdelivery.com/api` must print `bundle clean`.
6. Submit: `npx eas-cli@latest submit --profile production --platform all --latest`.
7. Android: promote internal -> production with a staged rollout (10%, then 50%, then 100% after 48 h without new crashes in Play vitals).
   iOS: phased release on.

## Smoke list (release build, real devices)
Sign up, sign in, browse today's menu, add to cart, place an order, see it in Orders, cancel it, receive a push
(foreground, background, killed), change password, log out (no more pushes), sign in again, delete a test account.

## Rollback
There are no OTA updates. Android: halt the staged rollout in the Play Console; ship a fixed build with a higher version.
iOS: pause the phased release; submit a fixed build (request expedited review if customers are blocked).
Never reuse a build number.

## Store listing answers
- Privacy policy URL: ____ (must list name, email, phone, delivery address, order history, device push token;
  purpose: providing the service; not sold or shared; encrypted in transit; how to delete the account).
- Account deletion: in the app (Profile > Delete account) and on the web at ____ (Google Play requires a web link too).
  Deletion removes name, email, phone, address and push token; order records are kept for accounting.
- Google Play Data safety: personal info (name, email, phone, address), app activity (order history), device IDs (push token);
  collected, not shared; required for the service; encrypted in transit; deletion available.
- App Store privacy labels: Contact Info (name, email, phone, physical address) and Purchases (order history),
  linked to the user, used for App Functionality; no tracking.
- App Review notes: demo customer account `____ / ____` with an active delivery area; payment is cash on delivery,
  so there is nothing to purchase in the app.
- Export compliance: HTTPS only (`usesNonExemptEncryption: false`).
- Content rating questionnaire: food ordering, no user-generated content, no gambling.
```

- [ ] **Step 2: Fill the blanks with the account owner**

The privacy policy URL, the web deletion page URL (a simple page on the company site with a form or an email address), the demo account, the EAS owner and the Firebase restriction date. The web deletion page must be live before the first Play submission.

- [ ] **Step 3: Commit**

```bash
git add docs/RELEASE.md
git commit -m "docs: release runbook and store compliance answers"
```

---

## Task 17: Pre-launch verification and go/no-go

**Repos:** all. **Findings:** all.

- [ ] **Step 1: Automated gates are green**

The customer app CI (Task 7), Backend `npm run test:authz` plus each service's tests, and the Admin CI.

- [ ] **Step 2: Store artifact scan**

Run Task 16's step 5 on the real production `.aab`. Expected: `bundle clean` and the production URL is present.

- [ ] **Step 3: Secrets scan, including history**

Run: `npx gitleaks@latest detect --source . --log-opts="--all"` in the customer app and the Backend.
Expected: no findings except `google-services.json` (restricted key, Task 8 Step 7). Any keystore, `.p8`, `.p12`, service account or `private.pem` is a blocker: rotate it, then remove it from history.

- [ ] **Step 4: Device matrix on release builds**

One low-end Android (the SM-A057F used for the perf baseline), one recent Android, one iPhone on the current iOS. Run the full smoke list from `docs/RELEASE.md`, plus: airplane mode in the middle of checkout (error state, no crash, no duplicate order), an expired access token (wait more than 1 hour, then use the app: silently renewed), deleting the account while another device is signed in (that device is signed out on its next request).

- [ ] **Step 5: Edge checks**

Task 15 Step 5 against production. SSL Labs grade for `api.rcdelivery.com`: A or better.

- [ ] **Step 6: Go / no-go checklist**

- [ ] The leaked JWT private key (E4) is rotated, the new key comes from the secret store, and old tokens are invalid
- [ ] Node >= 24.22.1 in CI, EAS and every Lambda
- [ ] `npm audit --omit=dev` shows no critical issues in the app; the backend services are clean per the Admin plan
- [ ] Release builds use `https://api.rcdelivery.com/api`; the bundle scan is clean
- [ ] Final package/bundle ID registered; Android and iOS signing keys backed up offline
- [ ] Push works on Android and iOS (foreground, background, killed); logout stops pushes
- [ ] Account deletion removes personal data (database checked); the web deletion page is live
- [ ] WAF login rate rule in Block mode and proven; the default `execute-api` endpoint is disabled
- [ ] Privacy policy, Data safety and App Store privacy labels submitted; demo account works
- [ ] Rollback understood: staged rollout and phased release are on
- [ ] Follow-up dates set: refresh-token rotation, crash reporting decision (D5), Expo push receipts

---

# 4. Self-review

- **Coverage:** C1 (Tasks 1, 7), C2 (1), C3 (3, 4), C4 (2), C5 (4), C6 (5), C7 (7), C8 (8), C9 (8), C10 (2), C11 (6, 12), C12 (8), C13 (10), C14 (9), C15 (8, 16); B1 (11), B2 (15), B3 (12), B4 (13), B5 (14), B6 (14); E1 (15), E2 (15), E3 (15), E4 (go/no-go in 17, owned by the Admin follow-ups). Every decision maps to a task: D1 and D7 (8), D2 (10), D3 (11), D4 (15), D5 (deferred; checklist in 17), D6 (13, 16).
- **Interfaces:** `releaseApiUrl` (Task 3) and the `127.0.0.1` marker are consistent with Task 4's scan. `PASSWORD_RULE` text is identical in Tasks 6 and 12. `getPushToken` replaces `getFcmToken` in every caller and mock (Task 10). `CUSTOMER_ACCESS_TOKEN_TTL` (Task 11) does not change `ACCESS_TOKEN_TTL`. `projectId` comes from Task 9 before Task 10 uses it.
- **Known risks called out in the steps:** a third-party `127.0.0.1` string in the bundle (Task 4 Step 2), EAS profile env reaching `app.config.ts` (Task 9 Step 6), the `unpaid_orders_count` column (Task 13 Step 1), weak passwords in other test fixtures (Task 12 Step 4).

# Sources

- [Google Play: target API level requirements](https://support.google.com/googleplay/android-developer/answer/11926878)
- [Google Play: account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)
- [Apple App Review Guidelines 5.1.1(v): account deletion](https://developer.apple.com/app-store/review/guidelines/#5.1.1)
- [AWS WAF: protected resource types (REST APIs only among API Gateway types)](https://docs.aws.amazon.com/waf/latest/developerguide/what-is-aws-waf.html)
- [AWS re:Post: WAF rate-based rules on API Gateway REST APIs](https://repost.aws/knowledge-center/waf-api-gateway-rate-based-rules)
- [Expo: Notifications SDK (`getDevicePushTokenAsync` returns FCM on Android, APNs on iOS)](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo: sending notifications with Expo's push service](https://docs.expo.dev/push-notifications/sending-notifications/)
- [Expo: environment variables in EAS](https://docs.expo.dev/eas/environment-variables/)
- [Expo changelog (SDK 58, EAS Observe native crashes)](https://expo.dev/changelog)
- [expo/expo#48670: tooling advisories reachable through @expo/cli](https://github.com/expo/expo/issues/48670)
- [Firebase: API keys for Firebase are not secret, restrict them](https://firebase.google.com/docs/projects/api-keys)
- [Node.js October 2026 security releases](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases) (via the Admin plan)
