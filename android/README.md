# Wolaita Tours Native Android App

Production-ready Android implementation of the tourist experience for the Wolaita Tour Management System. The app mirrors the existing React web client feature-by-feature and talks to the same Firebase project (Auth, Firestore, Storage, Functions) plus Chapa for payments.

## Tech Stack

- Android Studio Ladybug / Gradle 8.7 / AGP 8.5
- Kotlin 2.0, Jetpack Compose, Navigation, ViewModel, LiveData/Flows
- Hilt dependency injection
- Firebase Auth / Firestore / Storage / Functions / Cloud Messaging
- Room offline cache for tours & bookings
- Retrofit + Moshi for Chapa proxy
- Coil for images, DataStore for preferences

## Architecture

```
┌────────────┐    ┌─────────────┐    ┌────────────┐
│ UI (Compose│──▶│ ViewModels  │──▶ │Repositories│
│ screens)   │    │ (MVVM)      │    │            │
└────────────┘    └────▲─┬──────┘    └────▲──┬────┘
                       │ │               │  │
                 StateFlow │        Firebase / Chapa
                       │ │               │  │
             ┌─────────┴─▼──────┐ ┌──────┴──▼────┐
             │ Room cache /     │ │ Remote data  │
             │ DataStore        │ │ sources      │
             └──────────────────┘ └──────────────┘
```

## Project Structure

```
android/
 ├─ app/
 │  ├─ src/main/java/com/wolaitatours/android
 │  │  ├─ data (models, repositories, data sources)
 │  │  ├─ di (Hilt modules)
 │  │  ├─ ui (auth, home, booking, payment, profile, reviews)
 │  │  ├─ notifications, services, util
 │  │  └─ MainActivity.kt, WolaitaToursApp.kt
 │  ├─ src/test … unit tests
 │  └─ src/androidTest … instrumentation tests
 ├─ assets/ (icon.png, adaptive-icon.png, splash.png, favicon.png)
 ├─ google-services.json.example
 └─ local.properties.example
```

## Prerequisites

- Android Studio Ladybug+ with Android SDK 34 installed
- Java 17
- Firebase project already configured for the existing web client
- Chapa public key and backend proxy endpoint

## Setup

1. Copy `android/local.properties.example` to `local.properties` and update:
   ```
   sdk.dir=/absolute/path/to/Android/sdk
   CHAPA_PUBLIC_KEY=CHAPUBK_live_xxxx
   FIREBASE_WEB_API_KEY=AIza...
   # Optionally override the shared backend host/region (otherwise defaults to prod)
   CHAPA_BACKEND_URL=https://your-node-backend.example.com/api/chapa
   FUNCTIONS_REGION=us-central1
   ```
2. Download your Firebase `google-services.json` (same project as web) and place it in `android/app/google-services.json`.
3. Open the `android` folder in Android Studio (File ▸ Open).
4. Sync Gradle. If the wrapper JAR is missing, run `gradle wrapper --gradle-version 8.7` once from the `android` directory.

## Environment Variables

- Android now mirrors the website’s `.env` approach: Gradle reads `CHAPA_BACKEND_URL`, `FUNCTIONS_REGION`, `CHAPA_PUBLIC_KEY`, etc. from (in order) `local.properties`, `gradle.properties`, or process environment variables (CI/CD).  
- Omit the optional overrides to fall back to the production proxy used by the web client; set sandbox/staging URLs per developer by editing `local.properties`.  
- Never commit real secrets; keep `local.properties` excluded from VCS and configure CI secrets via environment variables instead.

## Building

```bash
cd android
./gradlew assembleDebug
```

Outputs an APK at `app/build/outputs/apk/debug/app-debug.apk`.

## Testing

- Unit tests: `./gradlew test`
- Instrumentation (Espresso + Compose): `./gradlew connectedAndroidTest`

### Included Samples

- `AuthRepositoryTest`: verifies auth repository wiring/mocking
- `LoginFlowTest`: simple Compose UI test ensuring login screen renders
- Extend with more flows (booking -> payment) using Espresso / Test doubles.

## Firebase & Backend Integration

- Firestore collections: `tours`, `bookings`, `payments`, `reviews`, `users`
- Firebase Functions: `verifyChapaPayment` callable
- FCM: `WolaitaFirebaseMessagingService` registers tokens & listens for updates
- Storage: avatar uploads + manual payment receipts

### Configuring Firebase

1. Enable Email/Password auth in the Firebase console.
2. Ensure Firestore/Storage rules match the web client (tourist role only).
3. Enable Cloud Messaging and download the updated `google-services.json`.
4. Deploy/confirm the `verifyChapaPayment` HTTPS callable function.

## Payments (Chapa)

- Online payments: `PaymentViewModel` initializes via Retrofit (`CHAPA_BACKEND_URL`).
- Manual payments: users upload receipt images which are stored to Firebase Storage and linked in Firestore.
- Chapa web checkout handled via `ChapaWebViewActivity` with a deep-link back to `wolaita://tours`.

## Localization

- English strings: `res/values/strings.xml`
- Amharic strings: `res/values-am/strings.xml`
- Language preference persisted via DataStore + reflected in Profile screen.

## Notifications

- Firebase Cloud Messaging token registered post-auth.
- `WolaitaFirebaseMessagingService` ready for booking/payment update payloads with deep-links to `BookingHistoryScreen`.

## Assets

`android/assets/` contains required PNGs:

- `icon.png`, `adaptive-icon.png`, `splash.png`, `favicon.png`

Use Android Studio Image Asset tool to refine as needed.

## Deployment

1. Update versionCode/versionName in `app/build.gradle.kts`.
2. Generate a signing key (if you don’t already have one):
   ```
   keytool -genkey -v -keystore wolaita.keystore -alias wolaita \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
3. Create `keystore.properties` (never commit) with store/key credentials.
4. Configure `signingConfigs` + `buildTypes.release` in `app/build.gradle.kts`.
5. Build release bundle: `./gradlew bundleRelease`.
6. Upload the generated `.aab` from `app/build/outputs/bundle/release/` to Google Play Console.
7. Attach privacy policy & content declarations required for Firebase + webviews.

## Manual QA Checklist

- [ ] Login / logout / password reset
- [ ] Tour search, detail, image carousel
- [ ] Booking flow with traveler count + schedule
- [ ] Booking history status transitions
- [ ] Chapa online payment (sandbox) + deep link result
- [ ] Manual bank transfer w/ receipt upload + status update
- [ ] Review submission/edit/delete
- [ ] Profile edits, avatar upload, language toggle (English ↔ Amharic)
- [ ] Push notification delivery for booking + payment updates
- [ ] Offline caching (tours/bookings) by enabling flight mode
- [ ] Accessibility: talkback labels, large fonts

## Notes & Future Enhancements

- Extend Compose UI polish (animations, skeleton loading).
- Implement full push notification channels with deep links per booking/payment.
- Add offline-first Room syncing for reviews + profile.
- Improve manual payment receipt picker with Android Photo Picker API (SDK 33+).
- Provide detailed analytics and crash reporting via Firebase Analytics / Crashlytics (hook ready via Gradle).

---
Questions or enhancements? See `README.md` in the repo root for backend/web context or reach out to the web team for schema changes.

