package com.wolaitatours.android

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wolaitatours.android.data.local.preferences.UserPreferencesRepository
import com.wolaitatours.android.data.model.LanguageOption
import com.wolaitatours.android.data.repository.AuthRepository
import com.wolaitatours.android.data.model.AuthState
import com.wolaitatours.android.data.repository.NotificationRepository
import com.wolaitatours.android.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import timber.log.Timber
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val notificationRepository: NotificationRepository,
    private val preferencesRepository: UserPreferencesRepository,
) : ViewModel() {

    val authState: StateFlow<AuthState> = authRepository.authState()

    val language: StateFlow<LanguageOption> = preferencesRepository.languageFlow
        .stateIn(viewModelScope, SharingStarted.Eagerly, LanguageOption.ENGLISH)

    fun setLanguage(option: LanguageOption) {
        viewModelScope.launch {
            preferencesRepository.setLanguage(option)
        }
    }

    fun registerDeviceForNotifications() {
        viewModelScope.launch {
            when (val result = notificationRepository.refreshToken()) {
                is Resource.Error -> Timber.e(result.throwable, "Failed to refresh FCM token")
                else -> Unit
            }
        }
    }

    fun onSignOut() {
        viewModelScope.launch {
            authRepository.signOut()
        }
    }
}
