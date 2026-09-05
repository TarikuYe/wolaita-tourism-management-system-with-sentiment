package com.wolaitatours.android.data.model

import com.google.firebase.Timestamp
import com.google.firebase.firestore.DocumentSnapshot

enum class BookingStatus {
    pending,
    confirmed,
    completed,
    cancelled,
    disputed,
    review_pending,
    reviewed
}

enum class PaymentStatus {
    pending,
    paid,
    verified,
    failed,
    refunded
}

data class Booking(
    val id: String = "",
    val tourId: String = "",
    val touristId: String = "",
    val agencyId: String = "",
    val agencyName: String? = null,
    val tourName: String = "",
    val customerName: String = "",
    val participants: Int = 1,
    val totalPrice: Double = 0.0,
    val bookingDate: Timestamp? = null,
    val tourDate: Timestamp? = null,
    val status: BookingStatus = BookingStatus.pending,
    val paymentStatus: PaymentStatus = PaymentStatus.pending,
    val paymentId: String? = null,
    val specialRequests: String? = null,
    val completedAt: Timestamp? = null,
    val createdAt: Timestamp? = null, // Added to match website
)

fun DocumentSnapshot.toBooking(): Booking {
    return Booking(
        id = id,
        tourId = getString("tourId").orEmpty(),
        touristId = getString("touristId").orEmpty(),
        agencyId = getString("agencyId").orEmpty(),
        agencyName = getString("agencyName"),
        tourName = getString("tourName").orEmpty(),
        customerName = getString("customerName").orEmpty(),
        participants = (getLong("participants") ?: 1L).toInt(),
        totalPrice = getDouble("totalPrice") ?: 0.0,
        bookingDate = getTimestamp("bookingDate"),
        tourDate = getTimestamp("tourDate"),
        status = runCatching { BookingStatus.valueOf(getString("status").orEmpty()) }
            .getOrDefault(BookingStatus.pending),
        paymentStatus = runCatching { PaymentStatus.valueOf(getString("paymentStatus").orEmpty()) }
            .getOrDefault(PaymentStatus.pending),
        paymentId = getString("paymentId"),
        specialRequests = getString("specialRequests"),
        completedAt = getTimestamp("completedAt"),
        createdAt = getTimestamp("createdAt"), // Added to match website
    )
}

