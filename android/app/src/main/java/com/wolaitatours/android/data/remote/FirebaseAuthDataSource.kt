package com.wolaitatours.android.data.remote

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FieldValue
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FirebaseAuthDataSource @Inject constructor(
    private val auth: FirebaseAuth,
    private val firestore: FirebaseFirestore,
) {
    val currentUser get() = auth.currentUser

    suspend fun signIn(email: String, password: String) = auth.signInWithEmailAndPassword(email, password).await()

    suspend fun signUp(email: String, password: String) = auth.createUserWithEmailAndPassword(email, password).await()

    fun signOut() = auth.signOut()

    suspend fun sendPasswordReset(email: String) {
        auth.sendPasswordResetEmail(email).await()
    }

    suspend fun reauthenticate(password: String) {
        val user = auth.currentUser ?: throw IllegalStateException("No user signed in")
        val credential = com.google.firebase.auth.EmailAuthProvider.getCredential(user.email!!, password)
        user.reauthenticate(credential).await()
    }

    suspend fun updatePassword(newPassword: String) {
        val user = auth.currentUser ?: throw IllegalStateException("No user signed in")
        user.updatePassword(newPassword).await()
    }

    suspend fun createUserProfile(
        uid: String,
        name: String,
        email: String,
        phone: String,
        nationality: String
    ) {
        val userProfile = hashMapOf(
            "id" to uid, // Include id field for consistency with website
            "name" to name.trim(),
            "email" to email.lowercase().trim(), // Normalize email like website
            "phone" to phone.trim(),
            "nationality" to nationality.trim(),
            "role" to "tourist", // Default role
            "verified" to false, // New users are not verified by default
            "createdAt" to FieldValue.serverTimestamp() // Use Firestore Timestamp instead of milliseconds
        )
        firestore.collection("users").document(uid).set(userProfile).await()
    }
}
