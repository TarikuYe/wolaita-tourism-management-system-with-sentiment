package com.wolaitatours.android.data.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentSnapshot

data class Tour(
    val id: String = "",
    val title: String = "",
    val titleAm: String = "",
    val description: String = "",
    val descriptionAm: String = "",
    val agencyId: String = "",
    val agencyName: String = "",
    val price: Double = 0.0,
    val duration: Int = 0,
    val maxParticipants: Int = 0,
    val images: List<String> = emptyList(),
    val location: String = "",
    val locationAm: String = "",
    val highlights: List<String> = emptyList(),
    val highlightsAm: List<String> = emptyList(),
    val difficulty: String = "Easy",
    val category: String = "Cultural",
    val available: Boolean = true,
    val rating: Double = 0.0,
    val reviewsCount: Int = 0,
    val createdAt: Timestamp? = null,
)

fun DocumentSnapshot.toTour(): Tour {
    return Tour(
        id = id,
        title = getString("title").orEmpty(),
        titleAm = getString("titleAm").orEmpty(),
        description = getString("description").orEmpty(),
        descriptionAm = getString("descriptionAm").orEmpty(),
        agencyId = getString("agencyId").orEmpty(),
        agencyName = getString("agencyName").orEmpty(),
        price = getDouble("price") ?: 0.0,
        duration = (getLong("duration") ?: 0L).toInt(),
        maxParticipants = (getLong("maxParticipants") ?: 0L).toInt(),
        images = get("images") as? List<String> ?: emptyList(),
        location = getString("location").orEmpty(),
        locationAm = getString("locationAm").orEmpty(),
        highlights = get("highlights") as? List<String> ?: emptyList(),
        highlightsAm = get("highlightsAm") as? List<String> ?: emptyList(),
        difficulty = getString("difficulty").orEmpty(),
        category = getString("category").orEmpty(),
        available = getBoolean("available") ?: true,
        rating = getDouble("rating") ?: 0.0,
        reviewsCount = (getLong("reviewsCount") ?: 0L).toInt(),
        createdAt = getTimestamp("createdAt"),
    )
}

