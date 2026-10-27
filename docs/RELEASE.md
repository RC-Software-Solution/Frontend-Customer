# Releasing the RC customer app

Commands are bash (Git Bash on Windows). Builds run on EAS; `android/` and `ios/` are generated from `app.json`
(Continuous Native Generation) and are not committed.

## Current identity and build setup
- App name `RC Caterings`, slug `rc-customer`, scheme `rccustomer`, iOS bundle id `com.rcdelivery.customer`.
- Android package: `app.json` still says `com.company.rc.customer` (see the one-time list). The store package is
  `com.rcdelivery.customer`.
- `eas.json` profiles (both pin Node `24.22.1`, `appVersionSource` is `remote`):
  - `preview`: internal distribution, Android APK, `EXPO_PUBLIC_API_URL=https://api-staging.rcdelivery.com/api`.
  - `production`: store builds, build numbers auto-increment, `EXPO_PUBLIC_API_URL=https://api.rcdelivery.com/api`.
- `scripts/check-bundle.mjs <dir> <expectedApiUrl>` scans every `.js`, `.hbc` and `.bundle` file under `<dir>` for LAN IPs,
  `127.0.0.1`, `[API_CLIENT]` debug logs and private keys, and checks that the expected API URL was inlined.

## One-time setup (before the first store upload, except where a step says otherwise)
None of these is done yet. Tick each item and write the date.

- [ ] Firebase: register the Android app `com.rcdelivery.customer` in the Firebase project, download its
  `google-services.json`, and in the same commit replace `google-services.json` and set `android.package` in `app.json`
  to `com.rcdelivery.customer`. The two must change together: the Google Services Gradle plugin fails when the package
  has no matching client in the file. Date: ____
- [ ] EAS project: `npx eas-cli@latest init` creates `<owner>/rc-customer` and writes `extra.eas.projectId` into `app.json`.
  Owner: ____
- [ ] Credentials: let EAS generate the Android upload key and the iOS distribution certificate and profile. Store the
  Android upload-key backup and the App Store Connect API key in the company password manager. Turn Play App Signing on.
- [ ] Firebase Android API key: restrict it to `com.rcdelivery.customer` and the EAS upload-key SHA-1 (`eas credentials`,
  available as soon as the upload key exists). Date: ____
- [ ] Versions: `npx eas-cli@latest build:version:set` for each platform if the stores already hold builds of this app
  (remote build numbers must start above them).
- [ ] Submit config: fill `submit.production` in `eas.json` (Play service-account key path and track `internal`;
  App Store Connect app id and API key). It is `{}` today, so `eas submit` will prompt or fail until this is done.
- [ ] Push: upload the FCM V1 service-account key and the APNs key to EAS.
- [ ] Push in the app: switch the app from native device tokens (`getDevicePushTokenAsync` in
  `services/push/push.service.ts`) to Expo push tokens, which needs the EAS `projectId` above. Accepting both token
  types is only on the unmerged Backend branch `chore/customer-readiness`; merge and deploy that branch before the app
  sends Expo tokens. Until this ships, iOS devices register an APNs token that the backend cannot deliver through FCM, so
  iOS push does not work.
- [ ] After the first upload to Play Console: add the Play App Signing SHA-1 (Play Console > App integrity > App signing)
  to the same Firebase API key restriction. That fingerprint exists only once the app is in Play, so this cannot be done
  before the first upload. Date: ____
- [ ] Backend: the customer-readiness changes (1 h customer access tokens via `CUSTOMER_ACCESS_TOKEN_TTL`, server-side
  password rule, account deletion that removes personal data, no password hashes or internal errors in responses,
  Expo push delivery) are on the Backend branch `chore/customer-readiness`. Merge and deploy it to staging and production
  before the first store build points at them.
- [ ] Rotate the backend signing key (`private.pem`) before launch.
- [ ] Web account-deletion page live (see Store listing answers). Google Play rejects the listing without it.

## Every release
1. `git switch main && git pull`, CI green on the commit.
2. Bump `expo.version` in `app.json` for a user-visible release (build numbers increment automatically).
3. Register each iPhone that will install the internal build: `npx eas-cli@latest device:create`. An ad-hoc build only
   installs on devices already in its provisioning profile, so register them before this build (a device added later
   needs a new build). Then `npx eas-cli@latest build --profile preview --platform all` and run the smoke list below on
   one Android phone and one iPhone.
4. Store build: `npx eas-cli@latest build --profile production --platform all`.
5. Scan the store artifacts. Each command must print `bundle clean`.
   - Android: download the `.aab`, then
     `unzip -o app.aab 'base/assets/index.android.bundle' -d aab && node scripts/check-bundle.mjs aab https://api.rcdelivery.com/api`.
   - iOS: download the `.ipa`. The bundle is named `main.jsbundle`, which the script does not pick up, so rename it:
     `unzip -o app.ipa 'Payload/*.app/main.jsbundle' -d ipa && mv ipa/Payload/*.app/main.jsbundle ipa/main.hbc && node scripts/check-bundle.mjs ipa https://api.rcdelivery.com/api`.
6. Submit: `npx eas-cli@latest submit --profile production --platform all --latest` (needs `submit.production`, see above).
7. Android: promote internal -> production with a staged rollout (10%, then 50%, then 100% after 48 h without new
   crashes in Play vitals). iOS: phased release on.

## Smoke list (release build, real devices)
Sign up, sign in, browse today's menu, add to cart, place an order, see it in Orders, cancel it, receive a push
(foreground, background, killed), change password, log out (no more pushes), sign in again, delete a test account.
Also check: a release build started with an `http://` API URL refuses to start; the app recovers from a crash screen
via the error boundary; the session survives past one hour (silent token refresh); the keyboard does not cover inputs.

## Rollback
There are no OTA updates. Android: halt the staged rollout in the Play Console; ship a fixed build with a higher version.
iOS: pause the phased release; submit a fixed build (request expedited review if customers are blocked).
Never reuse a build number.

## Store listing answers
Based on what the app sends today: sign-up sends full name, email, phone and a typed delivery address ("Location");
sign-up and sign-in both send the device push token; orders and their payment status are stored by the backend. The app has no
analytics, crash reporting, advertising, location permission or in-app payment. Re-check this list when any of that changes.
Items marked "confirm before submitting" are not established from the code.

- Privacy policy URL: ____ (must list name, email, phone, delivery address, order history, device push token;
  purpose: providing the service; not sold or shared; encrypted in transit; how to delete the account).
- Account deletion: in the app (Profile > Delete Account, confirmed by typing `DELETE`) and on the web at ____
  (Google Play requires a web link too). Deletion replaces the name and email with placeholders, clears phone,
  address, push token and sessions, and overwrites the password with the hash of a random value; the account row and
  order records are kept for accounting.
- Google Play Data safety: personal info (name, email, phone, address), app activity (order history; confirm before
  submitting whether Play wants this under "App activity" or "Financial info > purchase history"), device or other IDs
  (push token); collected, not shared; required for the service; encrypted in transit; deletion available.
- App Store privacy labels: Contact Info (name, email, phone, physical address) and Purchases (order history),
  linked to the user, used for App Functionality; no tracking. Confirm before submitting whether the push token needs
  declaring (Apple's "Device ID" usually means advertising or vendor IDs, which the app does not read).
- App Review notes: demo customer account `____ / ____` with an active delivery area. The app has no in-app payment;
  orders are paid outside the app (confirm before submitting: cash on delivery), so there is nothing to purchase in it.
- Export compliance: HTTPS only (`ios.config.usesNonExemptEncryption: false` in `app.json`).
- Content rating questionnaire: food ordering, no user-generated content, no gambling.

## Blanks to fill with the account owner
Privacy policy URL, web deletion page URL (a simple page on the company site with a form or an email address),
demo account, EAS owner, Firebase registration and API-key restriction dates. The web deletion page must be live
before the first Play submission.
