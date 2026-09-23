# Nutrimotion Compose Multiplatform (Client + Driver)

Kotlin Multiplatform + Compose Multiplatform app for **Android** and **iOS**. Covers client shopping and driver delivery flows against the existing Nutrimotion Next.js `/api`. **Admin CMS stays on the web app.**

## Project layout

```
mobile-apps/nutrimotion-cmp/
  composeApp/          # shared UI + Android app + iOS framework
  iosApp/              # Xcode entry that hosts ComposeUIViewController
  README.md
```

The older stub under `mobile-apps/android` is reference-only — do not extend it.

## Prerequisites

- **JDK 17 or 21** (recommended: Temurin/Oracle JDK 21; avoid bleeding-edge JDKs)
- Android Studio Ladybug+ with KMP / Compose Multiplatform support
- Xcode 15+ (macOS, for iOS)
- Running Nutrimotion API (`nutrimotion-web`, e.g. `https://localhost:3600`)

## Auth0 setup

1. Create an Auth0 **Native** application (or separate Android + iOS apps).
2. Allowed callback (Android): `nutrimotion://n4consulting.us.auth0.com/android/com.nutrimotion.cmp/callback`
3. Allowed callback (iOS): `nutrimotion://n4consulting.us.auth0.com/ios/com.nutrimotion.cmp/callback`
4. Set API audience to match web `AUTH0_AUDIENCE` (see `nutrimotion-web/.env`).
5. Put client IDs in `composeApp/build.gradle.kts` `buildConfigField` values (do not commit production secrets). Prefer overriding via `local.properties` locally.

Until Auth0 native SDKs are fully wired, the login screen accepts a **pasted access token**. Obtain one from Auth0 (same API audience as the web app). Token is stored with **EncryptedSharedPreferences** on Android (in-memory on iOS simulator stub) and sent as `Authorization: Bearer`.

Web session already verifies Bearer JWTs in `nutrimotion-web/lib/auth/session.ts`. Native apps do not need CORS.

### Required Bearer scopes

Whatever scopes `/api/auth/me` and downstream APIs expect on web (typically `openid profile email` plus your API audience). Roles come from Mongo via the same Auth0 `sub`.

## Configure API base URL

| Target | Default |
|--------|---------|
| Android emulator (debug) | `https://10.0.2.2:3600` |
| iOS simulator | set `AppConfig.apiBaseUrl` to `https://localhost:3600` (ATS may need exceptions for self-signed) |
| Production | your Netlify / deployed URL |

Override at runtime via `AppConfig.apiBaseUrl` or change `BuildConfig.API_BASE_URL` in `composeApp/build.gradle.kts`.

Debug cleartext / user-CA trust for local HTTPS is allowed in `res/xml/network_security_config.xml`.

## Run Android

```bash
cd mobile-apps/nutrimotion-cmp
# Windows PowerShell: set JAVA_HOME to JDK 21 if needed
./gradlew :composeApp:assembleDebug
# or open this folder in Android Studio and Run
```

APK: `composeApp/build/outputs/apk/debug/composeApp-debug.apk`

## Run iOS

1. Generate the Xcode project (once / after `project.yml` changes):
   ```bash
   brew install xcodegen
   cd iosApp && xcodegen generate && open iosApp.xcodeproj
   ```
2. Or build the shared framework alone:
   ```bash
   ./gradlew :composeApp:linkDebugFrameworkIosSimulatorArm64
   ```
3. Swift entry: `iosApp/iosApp/ContentView.swift` → `MainViewControllerKt.MainViewController()`.

## Store CI (Play + TestFlight)

Aligned with **Lukaria** (same Apple Team ID `3CPQ68PXHC` and ASC/Play secret names). See **[docs/STORE_CI.md](docs/STORE_CI.md)**.

- Android → Play internal: `.github/workflows/deploy-android-play.yml`
- iOS → TestFlight: `.github/workflows/deploy-ios-testflight.yml`
- Bundle / package ID: `com.nutrimotion.cmp` (ASC: Nutrimotion Jamaica)

Copy Apple secrets from the Lukaria GitHub repo; create a Nutrimotion-specific Android upload keystore.

## Features

### Client
- Login (token / Auth0 stub) + role routing
- Home dashboard (orders + coupons)
- Meals / package builder with slot quotas (mirrors web `PackageSelection`)
- Catalog (training, books, recipes, videos) → cart
- Cart, coupons, checkout (`street` + `parish`)
- Orders + tracking map (expect/actual placeholder → MapKit / Maps next)
- Subscriptions
- Profile edit + logout

### Driver
- Dashboard with ~30s assignment polling
- Assignments list / detail, status updates
- Location post (`POST /api/driver/location`)
- Profile

### Admin (mobile)
- Analytics dashboard (shared Compose → `GET /api/admin/analytics`) for users with `view:analytics`
- Days toggle 7/30/90, KPIs, trends, customers, delivery, parish, popular items
- CMS tools (meals, coupons, content, configure) remain on the web app

### Explicitly out of scope (web only)
- Full `/admin/*` CMS, meal calendar, uploads, configure secrets
- Marketing / SEO
- Payment gateway (checkout creates `purchased` order, matching web)

## Role routing

After `GET /api/auth/me`:

- Roles include `driver` (and not client) → default **DriverShell**
- Administrator only (or `view:analytics` selected) → **AdminShell** (Analytics)
- Otherwise → **ClientShell**
- Multi-role / multi-permission → top-bar switcher (Client / Driver / Analytics)
- Full CMS still web-only; mobile admin surface is Analytics

## Smoke checklist

1. Start `nutrimotion-web` (`npm run dev` / HTTPS on 3600).
2. Paste a valid Auth0 access token → lands on Client or Driver shell by roles.
3. Client: package/catalog → cart → checkout → orders → track.
4. Driver: Assignments → update status → post location.
5. Multi-role user: switch Client/Driver from the top bar.
6. Logout clears the stored token.
