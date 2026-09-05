package com.wolaitatours.android.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.messaging.FirebaseMessaging
import com.wolaitatours.android.util.toResource
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationRepository @Inject constructor(
    private val messaging: FirebaseMessaging,
    private val auth: FirebaseAuth,
    private val firestore: FirebaseFirestore,
) {

    suspend fun refreshToken() = runCatching {
        val token = messaging.token.await()
        val uid = auth.currentUser?.uid ?: return@runCatching
        firestore.collection("users").document(uid)
            .set(mapOf("fcmToken" to token), com.google.firebase.firestore.SetOptions.merge())
            .await()
        token
    }.toResource()
}

