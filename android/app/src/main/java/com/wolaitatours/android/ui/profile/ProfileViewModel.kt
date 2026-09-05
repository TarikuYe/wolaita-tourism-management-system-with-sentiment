package com.wolaitatours.android.ui.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.wolaitatours.android.data.model.LanguageOption
import com.wolaitatours.android.data.model.UserProfile
import com.wolaitatours.android.data.repository.AuthRepository
import com.wolaitatours.android.data.repository.ProfileRepository
import com.wolaitatours.android.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileUiState(
    val profile: UserProfile? = null,
    val isLoading: Boolean = true,
    val error: String? = null,
    val message: String? = null, // Success/error message
    val isEditing: Boolean = false, // Edit mode state
    val isUpdatingPassword: Boolean = false, // Password update state
    // Profile form state
    val profileForm: ProfileForm = ProfileForm(),
    // Password form state
    val passwordForm: PasswordForm = PasswordForm(),
)

data class ProfileForm(
    val name: String = "",
    val phone: String = "",
    val nationality: String = "",
)

data class PasswordForm(
    val oldPassword: String = "",
    val newPassword: String = "",
    val confirmPassword: String = "",
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val repository: ProfileRepository,
    private val auth: FirebaseAuth,
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(ProfileUiState())
    val state: StateFlow<ProfileUiState> = _state.asStateFlow()

    init {
        loadProfile()
    }

    fun loadProfile() {
        val uid = auth.currentUser?.uid ?: return
        _state.value = _state.value.copy(isLoading = true, error = null, message = null)
        viewModelScope.launch {
            when (val result = repository.loadProfile(uid)) {
                is Resource.Success -> {
                    val profile = result.data
                    _state.value = _state.value.copy(
                        profile = profile,
                        isLoading = false,
                        profileForm = ProfileForm(
                            name = profile.name,
                            phone = profile.phone ?: "",
                            nationality = profile.nationality ?: "",
                        )
                    )
                }
                is Resource.Error -> _state.value = _state.value.copy(
                    error = result.throwable.message,
                    isLoading = false
                )
                else -> Unit
            }
        }
    }

    fun setEditing(isEditing: Boolean) {
        _state.value = _state.value.copy(isEditing = isEditing)
        if (!isEditing) {
            // Reset form to original values
            val profile = _state.value.profile
            if (profile != null) {
                _state.value = _state.value.copy(
                    profileForm = ProfileForm(
                        name = profile.name,
                        phone = profile.phone ?: "",
                        nationality = profile.nationality ?: "",
                    )
                )
            }
        }
    }

    fun updateProfileForm(name: String? = null, phone: String? = null, nationality: String? = null) {
        val current = _state.value.profileForm
        _state.value = _state.value.copy(
            profileForm = current.copy(
                name = name ?: current.name,
                phone = phone ?: current.phone,
                nationality = nationality ?: current.nationality,
            )
        )
    }

    fun updatePasswordForm(oldPassword: String? = null, newPassword: String? = null, confirmPassword: String? = null) {
        val current = _state.value.passwordForm
        _state.value = _state.value.copy(
            passwordForm = current.copy(
                oldPassword = oldPassword ?: current.oldPassword,
                newPassword = newPassword ?: current.newPassword,
                confirmPassword = confirmPassword ?: current.confirmPassword,
            )
        )
    }

    fun saveProfile() {
        val uid = auth.currentUser?.uid ?: return
        val currentProfile = _state.value.profile ?: return
        val form = _state.value.profileForm
        
        _state.value = _state.value.copy(isLoading = true, error = null, message = null)
        viewModelScope.launch {
            val updatedProfile = currentProfile.copy(
                name = form.name,
                phone = form.phone.takeIf { it.isNotBlank() },
                nationality = form.nationality.takeIf { it.isNotBlank() },
            )
            when (val result = repository.updateProfile(uid, updatedProfile)) {
                is Resource.Success -> {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        isEditing = false,
                        message = "Profile updated successfully!",
                        profile = updatedProfile
                    )
                }
                is Resource.Error -> _state.value = _state.value.copy(
                    isLoading = false,
                    error = result.throwable.message ?: "Failed to update profile"
                )
                else -> Unit
            }
        }
    }

    fun changePassword() {
        val form = _state.value.passwordForm
        
        // Validation
        if (form.newPassword != form.confirmPassword) {
            _state.value = _state.value.copy(error = "New passwords do not match")
            return
        }
        if (form.newPassword.length < 6) {
            _state.value = _state.value.copy(error = "Password should be at least 6 characters")
            return
        }
        
        _state.value = _state.value.copy(isUpdatingPassword = true, error = null, message = null)
        viewModelScope.launch {
            when (val result = authRepository.changePassword(form.oldPassword, form.newPassword)) {
                is Resource.Success -> {
                    _state.value = _state.value.copy(
                        isUpdatingPassword = false,
                        message = "Password updated successfully!",
                        passwordForm = PasswordForm() // Clear form
                    )
                }
                is Resource.Error -> {
                    val errorMsg = when {
                        result.throwable.message?.contains("wrong-password") == true -> "Current password is incorrect"
                        result.throwable.message?.contains("requires-recent-login") == true -> "Please log in again to change your password"
                        else -> result.throwable.message ?: "Failed to update password"
                    }
                    _state.value = _state.value.copy(
                        isUpdatingPassword = false,
                        error = errorMsg
                    )
                }
                else -> Unit
            }
        }
    }

    fun updateLanguage(option: LanguageOption) {
        val uid = auth.currentUser?.uid ?: return
        viewModelScope.launch {
            repository.updateLanguage(uid, option)
            loadProfile()
        }
    }

    fun clearMessage() {
        _state.value = _state.value.copy(message = null, error = null)
    }

    fun signOut() {
        authRepository.signOut()
    }
}

