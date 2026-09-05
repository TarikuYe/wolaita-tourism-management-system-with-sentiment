package com.wolaitatours.android.data.model

import com.google.firebase.auth.FirebaseUser

/**
 * A sealed class representing the various states of user authentication.
 */
sealed class AuthState {
    /**
     * Represents the loading state while checking authentication status.
     */
    object Loading : AuthState()

    /**
     * Represents a successfully authenticated user.
     * @param user The authenticated Firebase user.
     */
    data class SignedIn(val user: FirebaseUser) : AuthState()

    /**
     * Represents the state where the user is not authenticated.
     */
    object SignedOut : AuthState()

    /**
     * Represents an error that occurred during the authentication process.
     * @param message The error message.
     */
    data class Error(val message: String) : AuthState()
}
