package com.wolaitatours.android.data.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentSnapshot

data class Favorite(
    val id: String = "",
    val userId: String = "",
    val tourId: String = "",
    val createdAt: Timestamp? = null,
)

fun DocumentSnapshot.toFavorite(): Favorite {
    return Favorite(
        id = id,
        userId = getString("userId").orEmpty(),
        tourId = getString("tourId").orEmpty(),
        createdAt = getTimestamp("createdAt"),
    )
}

