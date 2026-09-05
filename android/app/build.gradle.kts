import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import java.util.Properties

val localProperties = Properties().apply {
    val localFile = rootProject.file("local.properties")
    if (localFile.exists()) {
        localFile.inputStream().use { load(it) }
    }
}

fun getEnvConfig(key: String, defaultValue: String): String {
    return localProperties.getProperty(key)
        ?: (project.findProperty(key) as? String)
        ?: System.getenv(key)
        ?: defaultValue
}

fun quoteForBuildConfig(value: String): String =
    "\"" + value.replace("\"", "\\\"") + "\""

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.google.gms.google-services")
    id("com.google.dagger.hilt.android")
    kotlin("kapt") // Required for Hilt
    id("kotlin-parcelize")
    id("com.google.devtools.ksp") // Required for Room
}

android {
    namespace = "com.wolaitatours.android"
    compileSdk = 34

    val defaultChapaBackendUrl = "https://wolaita-tours-functions.web.app/api/chapa"
    val chapaBackendUrl = getEnvConfig("CHAPA_BACKEND_URL", defaultChapaBackendUrl)
    val defaultFunctionsRegion = "us-central1"
    val functionsRegion = getEnvConfig("FUNCTIONS_REGION", defaultFunctionsRegion)

    defaultConfig {
        applicationId = "com.wolaitatours.android"
        minSdk = 28
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "com.wolaitatours.android.core.testing.HiltTestRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
        buildConfigField("String", "CHAPA_BACKEND_URL", quoteForBuildConfig(chapaBackendUrl))
        buildConfigField("String", "FUNCTIONS_REGION", quoteForBuildConfig(functionsRegion))
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlin {
        jvmToolchain(17)
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.11" // Add this line
    }

    packaging {
        resources {
            excludes += setOf(
                "META-INF/LICENSE.md",
                "META-INF/LICENSE-notice.md"
            )
        }
    }
}

dependencies {
    // Define versions at the top for easy management and consistency
    val roomVersion = "2.6.1"
    val composeBom = platform("androidx.compose:compose-bom:2024.05.00")
    val composeVersion = "1.6.8" // Add explicit compose version

    // Bill of Materials (BoM) for Compose
    implementation(composeBom)
    androidTestImplementation(composeBom)

    // Core Android & Lifecycle
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.4")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.4")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.4") // Add this
    implementation("androidx.activity:activity-compose:1.9.1")
    implementation("androidx.navigation:navigation-compose:2.7.7")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
    implementation("androidx.datastore:datastore-preferences:1.1.1")
    implementation("androidx.startup:startup-runtime:1.1.1")

    // Compose UI
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview") // Use tooling-preview instead of tooling
    implementation("androidx.compose.ui:ui-tooling") // Keep this for debug
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.compose.runtime:runtime-livedata:$composeVersion") // Add this for collectAsState
    implementation("com.google.accompanist:accompanist-swiperefresh:0.34.0")
    implementation("com.google.accompanist:accompanist-systemuicontroller:0.34.0")

    // Firebase (using BoM)
    implementation(platform("com.google.firebase:firebase-bom:33.5.1"))
    implementation("com.google.firebase:firebase-auth-ktx")
    implementation("com.google.firebase:firebase-firestore-ktx")
    implementation("com.google.firebase:firebase-storage-ktx")
    implementation("com.google.firebase:firebase-functions-ktx")
    implementation("com.google.firebase:firebase-messaging-ktx")

    // Play Services
    implementation("com.google.android.gms:play-services-auth:21.2.0")

    // Hilt (Dependency Injection - uses Kapt)
    implementation("com.google.dagger:hilt-android:2.51.1")
    kapt("com.google.dagger:hilt-compiler:2.51.1")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.8.1")

    // Room (Offline Database - uses KSP)
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    ksp("androidx.room:room-compiler:$roomVersion")

    // Networking
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-moshi:2.11.0")
    implementation("com.squareup.moshi:moshi-kotlin:1.15.1")

    // Image loading
    implementation("io.coil-kt:coil-compose:2.7.0")

    // Logging
    implementation("com.jakewharton.timber:timber:5.0.1")

    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("io.mockk:mockk:1.13.12")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")

    // Android Testing
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
    androidTestImplementation("com.google.dagger:hilt-android-testing:2.51.1")
    kaptAndroidTest("com.google.dagger:hilt-compiler:2.51.1")
    // Moshi for JSON serialization
    implementation("com.squareup.moshi:moshi:1.15.0")
    implementation("com.squareup.moshi:moshi-kotlin:1.15.0")
    kapt("com.squareup.moshi:moshi-kotlin-codegen:1.15.0")
}