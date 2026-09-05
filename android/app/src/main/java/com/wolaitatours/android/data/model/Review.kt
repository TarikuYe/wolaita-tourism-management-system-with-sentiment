package com.wolaitatours.android.data.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentSnapshot

data class Review(
    val id: String = "",
    val bookingId: String = "",
    val tourId: String = "",
    val tourName: String = "",
    val touristId: String = "",
    val touristName: String = "",
    val rating: Int = 5,
    val comment: String = "",
    val commentAm: String? = null,
    val sentimentScore: Double = 0.0,
    val sentimentLabel: String = "neutral",
    val createdAt: Timestamp? = null,
    val verified: Boolean = false,
)

fun DocumentSnapshot.toReview(): Review {
    return Review(
        id = id,
        bookingId = getString("bookingId").orEmpty(),
        tourId = getString("tourId").orEmpty(),
        tourName = getString("tourName").orEmpty(),
        touristId = getString("touristId").orEmpty(),
        touristName = getString("touristName").orEmpty(),
        rating = (getLong("rating") ?: 5L).toInt(),
        comment = getString("comment").orEmpty(),
        commentAm = getString("commentAm"),
        sentimentScore = getDouble("sentimentScore") ?: 0.0,
        sentimentLabel = getString("sentimentLabel").orEmpty(),
        createdAt = getTimestamp("createdAt"),
        verified = getBoolean("verified") ?: false,
    )
}

