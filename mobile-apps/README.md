# Nutrimotion Mobile Apps

Native iOS and Android applications for the Nutrimotion meal planning and delivery platform.

## Architecture

Both apps follow clean architecture principles:
- **iOS**: SwiftUI + Combine + MVVM
- **Android**: Jetpack Compose + Kotlin Coroutines + MVVM

## Features

### Client App
- Browse meals, training packages, books, recipes, and videos
- Add items to cart and checkout
- View order history
- Track delivery in real-time with map integration
- Manage profile and subscriptions
- Secure content access with DRM

### Driver App
- View assigned deliveries
- Update delivery status
- Share live location
- Navigate to customer addresses
- Mark deliveries as completed
- Push notifications for new assignments

## API Integration

Both apps consume the Next.js API endpoints:
- Base URL: `https://api.nutrimotion.com` (production)
- Authentication: Auth0 with JWT tokens
- All requests include Authorization header: `Bearer {token}`

## Project Structure

```
mobile-apps/
├── ios/                    # iOS app (Swift)
│   ├── Nutrimotion.xcodeproj
│   ├── Nutrimotion/
│   │   ├── App/
│   │   ├── Features/
│   │   │   ├── Auth/
│   │   │   ├── Catalog/
│   │   │   ├── Cart/
│   │   │   ├── Orders/
│   │   │   └── Tracking/
│   │   ├── Core/
│   │   │   ├── Network/
│   │   │   ├── Models/
│   │   │   └── Services/
│   │   └── Resources/
│   └── NutrimotionDriver/  # Driver app
│
└── android/                # Android app (Kotlin)
    ├── app/
    │   └── src/main/
    │       ├── java/com/nutrimotion/
    │       │   ├── ui/
    │       │   ├── data/
    │       │   ├── domain/
    │       │   └── di/
    │       └── res/
    └── driver/            # Driver app module
```

## Getting Started

### iOS

1. Requirements:
   - Xcode 15+
   - iOS 15.0+
   - CocoaPods or Swift Package Manager

2. Setup:
```bash
cd ios
pod install
open Nutrimotion.xcworkspace
```

3. Configure Auth0:
   - Add Auth0 credentials to `Info.plist`
   - Update callback URLs

### Android

1. Requirements:
   - Android Studio Hedgehog+
   - Android SDK 24+
   - Kotlin 1.9+

2. Setup:
```bash
cd android
./gradlew build
```

3. Configure Auth0:
   - Add Auth0 credentials to `local.properties`
   - Update callback URLs in manifest

## Dependencies

### iOS
- Auth0.swift - Authentication
- Alamofire - Networking
- Kingfisher - Image loading
- MapKit - Maps and location
- Combine - Reactive programming

### Android
- Auth0 Android - Authentication
- Retrofit - Networking
- Coil - Image loading
- Google Maps SDK - Maps and location
- Kotlin Coroutines - Async programming
- Jetpack Compose - UI framework

## Testing

### iOS
```bash
xcodebuild test -workspace Nutrimotion.xcworkspace -scheme Nutrimotion
```

### Android
```bash
./gradlew test
./gradlew connectedAndroidTest
```

## Build & Release

### iOS
1. Archive in Xcode
2. Upload to App Store Connect
3. Submit for review

### Android
1. Generate signed APK/Bundle
2. Upload to Google Play Console
3. Submit for review

## Environment Configuration

Create configuration files:

**iOS: `Config.xcconfig`**
```
API_BASE_URL = https:/$()/api.nutrimotion.com
AUTH0_DOMAIN = your-domain.auth0.com
AUTH0_CLIENT_ID = your-client-id
```

**Android: `local.properties`**
```
apiBaseUrl=https://api.nutrimotion.com
auth0Domain=your-domain.auth0.com
auth0ClientId=your-client-id
```

## Security

- Certificate pinning for API calls
- Keychain/KeyStore for token storage
- Jailbreak/Root detection
- Code obfuscation (ProGuard/R8 for Android)
- DRM integration for protected content

## Push Notifications

- **iOS**: APNs (Apple Push Notification service)
- **Android**: FCM (Firebase Cloud Messaging)

Register device tokens on login and update on server.

## Location Services

Required for driver app and delivery tracking:
- Request location permissions on first use
- Background location for active deliveries
- Send location updates every 10 seconds during delivery

## Accessibility

Both apps follow platform accessibility guidelines:
- VoiceOver/TalkBack support
- Dynamic type/font scaling
- High contrast mode
- Reduced motion support

## License

Private - All rights reserved
