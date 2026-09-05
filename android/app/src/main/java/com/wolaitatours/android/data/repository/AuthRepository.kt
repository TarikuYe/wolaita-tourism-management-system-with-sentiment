package com.wolaitatours.android.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.wolaitatours.android.data.model.AuthState
import com.wolaitatours.android.data.remote.FirebaseAuthDataSource
import com.wolaitatours.android.util.toResource
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val remote: FirebaseAuthDataSource,
    private val firebaseAuth: FirebaseAuth,
) {

    private val authState = MutableStateFlow<AuthState>(AuthState.Loading)

    init {
        firebaseAuth.addAuthStateListener { auth ->
            val currentUser = auth.currentUser
            if (currentUser != null) {
                authState.update { AuthState.SignedIn(currentUser) }
            } else {
                authState.update { AuthState.SignedOut }
            }
        }
    }

    fun authState(): StateFlow<AuthState> = authState.asStateFlow()

    suspend fun signIn(email: String, password: String) = runCatching {
        authState.update { AuthState.Loading }
        remote.signIn(email, password)
    }.onFailure { throwable ->
        authState.update { AuthState.Error(throwable.message ?: "Sign-in failed") }
    }.toResource()

    suspend fun signUp(
        email: String,
        password: String,
        name: String,
        phone: String,
        nationality: String
    ) = runCatching {
        authState.update { AuthState.Loading }
        val authResult = remote.signUp(email, password)
        val user = authResult.user
        if (user != null) {
            remote.createUserProfile(user.uid, name, email, phone, nationality)
        }
    }.onFailure { throwable ->
        authState.update { AuthState.Error(throwable.message ?: "Sign-up failed") }
    }.toResource()

    fun signOut() {
        remote.signOut()
        authState.update { AuthState.SignedOut }
    }

    suspend fun sendReset(email: String) = runCatching {
        remote.sendPasswordReset(email)
    }.toResource()

    suspend fun changePassword(oldPassword: String, newPassword: String) = runCatching {
        remote.reauthenticate(oldPassword)
        remote.updatePassword(newPassword)
    }.toResource()
}
