# Deployment Guide

1. **Prerequisites**
   - Android Studio Ladybug+ and SDK 34.
   - Firebase project configured with Auth/Firestore/Storage/Functions and `google-services.json` placed in `app/`.
   - Chapa backend proxy endpoint + API keys stored in `local.properties` or CI secrets.
   - Release keystore (`.jks`) and credentials.

2. **Configure Signing**
   - Create `keystore.properties` (excluded from VCS) with:
     ```
     storeFile=/absolute/path/wolaita.jks
     storePassword=*****
     keyAlias=wolaita
     keyPassword=*****
     ```
   - Reference `keystoreProperties` in `app/build.gradle.kts` inside `signingConfigs` and `buildTypes.release`.

3. **Set Version**
   - Update `versionCode` / `versionName` in `app/build.gradle.kts`.

4. **Build Release Bundle**
   ```bash
   cd android
   ./gradlew clean bundleRelease
   ```
   Outputs `app/build/outputs/bundle/release/app-release.aab`.

5. **Verify**
   - Install `app/build/outputs/apk/release/app-release.apk` on a test device for smoke tests.
   - Run automated checks: `./gradlew test connectedAndroidTest`.

6. **Play Console Upload**
   - In Play Console > Production (or internal track), upload the `.aab`.
   - Fill release notes (list key fixes/features).
   - Complete data safety/privacy declarations (Firebase/Analytics/Payments).

7. **Post Release**
   - Monitor Firebase Crashlytics / Play Console vitals.
   - Confirm Chapa webhook + Firebase Function updates Firestore bookings in production.

For staging/sandbox, set `CHAPA_BACKEND_URL` / `FUNCTIONS_REGION` via Gradle or CI environment variables (or introduce dedicated product flavors) before building so `BuildConfig` points to the correct Node/Functions endpoints.

