# Store CI — aligned with Lukaria

Nutrimotion uses the **same Apple Developer team and GitHub secret names as Lukaria**, so you can copy secrets from the Lukaria repo into this one. Bundle / package IDs stay Nutrimotion-specific.

| | Lukaria | Nutrimotion |
|--|---------|-------------|
| Apple Team ID | `3CPQ68PXHC` | **same** (`APPLE_TEAM_ID`) |
| iOS bundle ID | `com.lukaria.svelte` | `com.nutrimotion.cmp` |
| Android package | `com.lukariagroup.app` | `com.nutrimotion.cmp` |
| ASC app | Svelte by Lukaria | **Nutrimotion Jamaica** |
| Workflows | `mobile/**` | `mobile-apps/nutrimotion-cmp/**` |

Workflows:

| File | Purpose |
|------|---------|
| `.github/workflows/deploy-android-play.yml` | Play **internal** (same secret names as Lukaria) |
| `.github/workflows/deploy-ios-testflight.yml` | TestFlight (Lukaria signing flow + ASC API key) |

---

## Copy secrets from Lukaria

In GitHub → Nutrimotion repo → **Settings → Secrets and variables → Actions**, add the same secret **names** (and values) you already use on Lukaria:

### Shared Apple (copy as-is)

| Secret | Notes |
|--------|--------|
| `APPLE_TEAM_ID` | `3CPQ68PXHC` (already defaulted in `iosApp/Configuration/Config.xcconfig`) |
| `APP_STORE_CONNECT_API_KEY_ID` | Same ASC API key as Lukaria |
| `APP_STORE_CONNECT_API_ISSUER_ID` | Same issuer |
| `APP_STORE_CONNECT_API_KEY_P8` | `.p8` private key **contents** (not base64) |
| `IOS_DISTRIBUTION_CERT_P12_BASE64` | Optional; same Distribution `.p12` works for both apps on the team |
| `IOS_DISTRIBUTION_CERT_PASSWORD` | Optional; `.p12` password |

### Play (usually **new** keystore for Nutrimotion package)

| Secret | Notes |
|--------|--------|
| `ANDROID_KEYSTORE_BASE64` | Prefer a **Nutrimotion** upload keystore (`com.nutrimotion.cmp`). Do not reuse Lukaria’s Play signing key for a different package. |
| `ANDROID_KEYSTORE_PASSWORD` | |
| `ANDROID_KEY_ALIAS` | |
| `ANDROID_KEY_PASSWORD` | |
| `PLAY_STORE_JSON_KEY` | Same Play Console **service account JSON** can work if that SA has access to the Nutrimotion Play app |

---

## One-time console checks

1. ASC: **Nutrimotion Jamaica** / `com.nutrimotion.cmp` exists (already verified).
2. Play Console: create app `com.nutrimotion.cmp` and grant the service account release-to-testing access.
   - Invite: `android-developer@api-project-43186447288.iam.gserviceaccount.com`
   - Path: **Users and permissions** → Invite user → App access for **Nutrimotion** → **Release apps to testing tracks** (Account permissions also need Play Console API access enabled for the SA).
   - Until this invite is accepted/granted, CI fails with `Google Api Error: The caller does not have permission` (403). The same SA already works for Lukaria (`com.lukariagroup.app`).
3. ASC API key needs **Admin** (Fastlane creates Distribution cert + App Store profile named **Nutrimotion App Store**).

### Store listing images (Play)

`fastlane/metadata/android/en-US/images/` ships icon (512), featureGraphic (1024×500), and phoneScreenshots. The Android lane uploads them (`skip_upload_images/screenshots: false`). App binary icons live under `composeApp/src/androidMain/res/mipmap-*` and iOS `Assets.xcassets/AppIcon.appiconset`.

---

## Local

```bash
cd mobile-apps/nutrimotion-cmp
bundle install

# iOS Xcode project
brew install xcodegen && cd iosApp && xcodegen generate && open iosApp.xcodeproj

# Fastlane
bundle exec fastlane android build
bundle exec fastlane ios simulator
```

`Config.xcconfig` API URL uses Lukaria’s `https:/$()/…` trick so `https://` is not truncated by xcconfig comments. Production default: `https://app.nutrimotion.com`.
