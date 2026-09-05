package com.wolaitatours.android.data.model

import android.net.Uri
import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.ktx.getField

data class UserProfile(
    val id: String = "",
    val email: String = "",
    val name: String = "",
    val role: String = "tourist",
    val phone: String? = null,
    val nationality: String? = null, // Added to match website
    val profileImage: String? = null,
    val photoURL: String? = null, // Added to match website (alternative field name)
    val preferredLanguage: LanguageOption = LanguageOption.ENGLISH,
    val notificationEnabled: Boolean = true,
    val createdAt: Timestamp? = null,
)

enum class LanguageOption(val code: String) {
    ENGLISH("en"),
    AMHARIC("am")
}

fun DocumentSnapshot.toUserProfile(): UserProfile {
    return UserProfile(
        id = id,
        email = getString("email").orEmpty(),
        name = getString("name").orEmpty(),
        role = getString("role").orEmpty(),
        phone = getString("phone"),
        nationality = getString("nationality"), // Added to match website
        profileImage = getString("profileImage") ?: getString("photoURL"), // Support both field names
        photoURL = getString("photoURL") ?: getString("profileImage"), // Support both field names
        preferredLanguage = when (getString("preferredLanguage")) {
            LanguageOption.AMHARIC.code -> LanguageOption.AMHARIC
            else -> LanguageOption.ENGLISH
        },
        notificationEnabled = getBoolean("notificationEnabled") ?: true,
        createdAt = getTimestamp("createdAt"),
    )
}

data class AvatarUpdateRequest(
    val localUri: Uri,
    val remotePath: String,
)

