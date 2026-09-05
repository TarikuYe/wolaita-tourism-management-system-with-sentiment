package com.wolaitatours.android.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wolaitatours.android.data.repository.AuthRepository
import com.wolaitatours.android.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val success: Boolean = false,
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val repository: AuthRepository,
) : ViewModel() {

    private val _loginState = MutableStateFlow(AuthUiState())
    val loginState: StateFlow<AuthUiState> = _loginState

    private val _registerState = MutableStateFlow(AuthUiState())
    val registerState: StateFlow<AuthUiState> = _registerState

    fun login(email: String, password: String) {
        _loginState.value = AuthUiState(isLoading = true, error = null)
        viewModelScope.launch {
            when (val result = repository.signIn(email, password)) {
                is Resource.Success -> {
                    _loginState.value = AuthUiState(success = true)
                    // Navigation will happen automatically via auth state listener
                }
                is Resource.Error -> {
                    val errorMessage = getAuthErrorMessage(result.throwable)
                    _loginState.value = AuthUiState(error = errorMessage)
                }
                else -> {
                    _loginState.value = AuthUiState(error = "An unexpected error occurred")
                }
            }
        }
    }

    fun register(email: String, password: String, name: String, phone: String, nationality: String) {
        _registerState.value = AuthUiState(isLoading = true, error = null)
        viewModelScope.launch {
            when (val result = repository.signUp(email, password, name, phone, nationality)) {
                is Resource.Success -> {
                    _registerState.value = AuthUiState(success = true)
                    // Navigation will happen automatically via auth state listener
                }
                is Resource.Error -> {
                    val errorMessage = getAuthErrorMessage(result.throwable)
                    _registerState.value = AuthUiState(error = errorMessage)
                }
                else -> {
                    _registerState.value = AuthUiState(error = "An unexpected error occurred")
                }
            }
        }
    }

    private fun getAuthErrorMessage(throwable: Throwable): String {
        val errorCode = throwable.message?.substringBefore(":") ?: ""
        return when {
            errorCode.contains("user-not-found") -> "No account found with this email address."
            errorCode.contains("wrong-password") -> "Incorrect password. Please try again."
            errorCode.contains("invalid-email") -> "Invalid email address format."
            errorCode.contains("user-disabled") -> "This account has been disabled."
            errorCode.contains("too-many-requests") -> "Too many failed attempts. Please try again later."
            errorCode.contains("email-already-in-use") -> "An account with this email already exists."
            errorCode.contains("weak-password") -> "Password is too weak. Please use at least 6 characters."
            errorCode.contains("network-request-failed") -> "Network error. Please check your internet connection."
            errorCode.contains("operation-not-allowed") -> "Email/password accounts are not enabled."
            else -> throwable.message ?: "Failed to authenticate. Please try again."
        }
    }

    fun sendReset(email: String) {
        viewModelScope.launch {
            repository.sendReset(email)
        }
    }
}
