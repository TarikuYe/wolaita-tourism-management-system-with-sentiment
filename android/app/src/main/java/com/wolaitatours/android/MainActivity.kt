package com.wolaitatours.android

import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.runtime.LaunchedEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.core.os.LocaleListCompat
import com.wolaitatours.android.ui.navigation.AppNavGraph
import com.wolaitatours.android.ui.navigation.rememberAppState
import com.wolaitatours.android.ui.theme.WolaitaTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    private val notificationPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            viewModel.registerDeviceForNotifications()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        maybeAskForNotifications()
        handleIntent(intent)
        setContent {
            val appState = rememberAppState()
            val languageState = viewModel.language.collectAsStateWithLifecycle().value
            val authState = viewModel.authState.collectAsStateWithLifecycle().value

            LaunchedEffect(languageState) {
                val locales = LocaleListCompat.forLanguageTags(languageState.code)
                AppCompatDelegate.setApplicationLocales(locales)
            }

            WolaitaTheme {
                AppNavGraph(
                    appState = appState,
                    authState = authState,
                    mainViewModel = viewModel,
                    intent = intent,
                )
            }
        }
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        // Handle deep links when app is already running
        setIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: android.content.Intent?) {
        // Intent will be processed by AppNavGraph's LaunchedEffect
        // This method can be used for any immediate processing if needed
    }

    private fun maybeAskForNotifications() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            notificationPermission.launch(android.Manifest.permission.POST_NOTIFICATIONS)
        } else {
            viewModel.registerDeviceForNotifications()
        }
    }
}
