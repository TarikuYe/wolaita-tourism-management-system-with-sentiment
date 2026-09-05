package com.wolaitatours.android.data.local.preferences

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.wolaitatours.android.data.model.LanguageOption
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserPreferencesRepository @Inject constructor(
    private val dataStore: DataStore<Preferences>,
) {

    val languageFlow: Flow<LanguageOption> =
        dataStore.data.map { prefs ->
            when (prefs[Keys.LANGUAGE]) {
                LanguageOption.AMHARIC.code -> LanguageOption.AMHARIC
                else -> LanguageOption.ENGLISH
            }
        }

    val notificationsEnabled: Flow<Boolean> =
        dataStore.data.map { prefs -> prefs[Keys.NOTIFICATIONS] ?: true }

    suspend fun setLanguage(option: LanguageOption) {
        dataStore.edit { prefs -> prefs[Keys.LANGUAGE] = option.code }
    }

    suspend fun setNotificationsEnabled(enabled: Boolean) {
        dataStore.edit { prefs -> prefs[Keys.NOTIFICATIONS] = enabled }
    }

    private object Keys {
        val LANGUAGE = stringPreferencesKey("language")
        val NOTIFICATIONS = booleanPreferencesKey("notifications_enabled")
    }
}

