package com.wolaitatours.android.data.remote

import com.google.firebase.firestore.CollectionReference
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import com.google.firebase.Timestamp
import com.wolaitatours.android.data.model.Booking
import com.wolaitatours.android.data.model.Favorite
import com.wolaitatours.android.data.model.Review
import com.wolaitatours.android.data.model.Tour
import com.wolaitatours.android.data.model.UserProfile
import com.wolaitatours.android.data.model.toBooking
import com.wolaitatours.android.data.model.toFavorite
import com.wolaitatours.android.data.model.toReview
import com.wolaitatours.android.data.model.toTour
import com.wolaitatours.android.data.model.toUserProfile
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FirestoreDataSource @Inject constructor(
    private val firestore: FirebaseFirestore,
) {

    private val toursCollection: CollectionReference get() = firestore.collection("tours")
    private val bookingsCollection: CollectionReference get() = firestore.collection("bookings")
    private val reviewsCollection: CollectionReference get() = firestore.collection("reviews")
    private val usersCollection: CollectionReference get() = firestore.collection("users")
    private val paymentsCollection: CollectionReference get() = firestore.collection("payments")
    private val favoritesCollection: CollectionReference get() = firestore.collection("favorites")

    fun observeTours(): Flow<List<Tour>> = callbackFlow {
        val registration = toursCollection.orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val tours = snapshot?.documents.orEmpty().map { it.toTour() }
                trySend(tours)
            }
        awaitClose { registration.remove() }
    }

    fun observeFavorites(userId: String): Flow<List<Favorite>> = callbackFlow {
        val registration = favoritesCollection
            .whereEqualTo("userId", userId)
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    android.util.Log.e("FirestoreDataSource", "Error observing favorites for userId: $userId", error)
                    close(error)
                    return@addSnapshotListener
                }
                val favorites = snapshot?.documents.orEmpty().map { it.toFavorite() }
                android.util.Log.d("FirestoreDataSource", "Fetched ${favorites.size} favorites for userId: $userId")
                trySend(favorites)
            }
        awaitClose { registration.remove() }
    }

    fun observeUserBookings(touristId: String): Flow<List<Booking>> = callbackFlow {
        android.util.Log.d("FirestoreDataSource", "Observing bookings for touristId: $touristId")
        try {
            val registration = bookingsCollection
                .whereEqualTo("touristId", touristId)
                .orderBy("createdAt", Query.Direction.DESCENDING) // Match website: orderBy createdAt
                .addSnapshotListener { snapshot, error ->
                    if (error != null) {
                        android.util.Log.e("FirestoreDataSource", "Error observing bookings for touristId: $touristId", error)
                        android.util.Log.e("FirestoreDataSource", "Error code: ${error.code}, message: ${error.message}")
                        // Try without orderBy if index is missing (code 9 = FAILED_PRECONDITION)
                        if (error.code == com.google.firebase.firestore.FirebaseFirestoreException.Code.FAILED_PRECONDITION || 
                            error.message?.contains("index") == true ||
                            error.message?.contains("requires an index") == true) {
                            android.util.Log.w("FirestoreDataSource", "Index missing, trying query without orderBy")
                            bookingsCollection
                                .whereEqualTo("touristId", touristId)
                                .get()
                                .addOnSuccessListener { fallbackSnapshot ->
                                    val bookings = fallbackSnapshot.documents.map { it.toBooking() }
                                        .sortedByDescending { it.createdAt?.seconds ?: it.bookingDate?.seconds ?: 0L }
                                    android.util.Log.d("FirestoreDataSource", "Fallback: Fetched ${bookings.size} bookings")
                                    trySend(bookings)
                                }
                                .addOnFailureListener { e ->
                                    android.util.Log.e("FirestoreDataSource", "Fallback query failed", e)
                                    close(e)
                                }
                        } else {
                            close(error)
                        }
                        return@addSnapshotListener
                    }
                    val bookings = snapshot?.documents.orEmpty().map { it.toBooking() }
                    android.util.Log.d("FirestoreDataSource", "Fetched ${bookings.size} bookings for touristId: $touristId")
                    trySend(bookings)
                }
            awaitClose { registration.remove() }
        } catch (e: Exception) {
            android.util.Log.e("FirestoreDataSource", "Exception in observeUserBookings", e)
            close(e)
        }
    }

    fun observeReviewsForTour(tourId: String): Flow<List<Review>> = callbackFlow {
        val registration = reviewsCollection
            .whereEqualTo("tourId", tourId)
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    close(error)
                    return@addSnapshotListener
                }
                val reviews = snapshot?.documents.orEmpty().map { it.toReview() }
                trySend(reviews)
            }
        awaitClose { registration.remove() }
    }

    fun observeUserReviews(touristId: String): Flow<List<Review>> = callbackFlow {
        android.util.Log.d("FirestoreDataSource", "Observing reviews for touristId: $touristId")
        val registration = reviewsCollection
            .whereEqualTo("touristId", touristId)
            .orderBy("createdAt", Query.Direction.DESCENDING)
            .addSnapshotListener { snapshot, error ->
                if (error != null) {
                    android.util.Log.e("FirestoreDataSource", "Error observing user reviews for touristId: $touristId", error)
                    // Try without orderBy if index is missing
                    if (error.code == com.google.firebase.firestore.FirebaseFirestoreException.Code.FAILED_PRECONDITION ||
                        error.message?.contains("index") == true ||
                        error.message?.contains("requires an index") == true) {
                        android.util.Log.w("FirestoreDataSource", "Index missing, trying query without orderBy")
                        reviewsCollection
                            .whereEqualTo("touristId", touristId)
                            .get()
                            .addOnSuccessListener { fallbackSnapshot ->
                                val reviews = fallbackSnapshot.documents.map { it.toReview() }
                                    .sortedByDescending { it.createdAt?.seconds ?: 0L }
                                android.util.Log.d("FirestoreDataSource", "Fallback: Fetched ${reviews.size} user reviews")
                                trySend(reviews)
                            }
                            .addOnFailureListener { e ->
                                android.util.Log.e("FirestoreDataSource", "Fallback query failed", e)
                                close(e)
                            }
                    } else {
                        close(error)
                    }
                    return@addSnapshotListener
                }
                val reviews = snapshot?.documents.orEmpty().map { it.toReview() }
                android.util.Log.d("FirestoreDataSource", "Fetched ${reviews.size} user reviews for touristId: $touristId")
                trySend(reviews)
            }
        awaitClose { registration.remove() }
    }

    suspend fun hasUserReviewed(bookingId: String, touristId: String): Boolean {
        return try {
            val query = reviewsCollection
                .whereEqualTo("bookingId", bookingId)
                .whereEqualTo("touristId", touristId)
                .limit(1)
            val snapshot = query.get().await()
            !snapshot.isEmpty
        } catch (e: Exception) {
            android.util.Log.e("FirestoreDataSource", "Error checking review status", e)
            false
        }
    }

    suspend fun getTour(tourId: String): Tour {
        return toursCollection.document(tourId).get().await().toTour()
    }

    suspend fun upsertBooking(payload: Map<String, Any?>): String {
        val doc = bookingsCollection.document()
        doc.set(payload).await()
        return doc.id
    }

    suspend fun updateBooking(bookingId: String, payload: Map<String, Any?>) {
        bookingsCollection.document(bookingId).update(payload).await()
    }

    suspend fun submitReview(payload: Map<String, Any?>): String {
        val doc = reviewsCollection.document()
        doc.set(payload).await()
        return doc.id
    }

    suspend fun updateReview(reviewId: String, payload: Map<String, Any?>) {
        reviewsCollection.document(reviewId).update(payload).await()
    }

    suspend fun deleteReview(reviewId: String) {
        reviewsCollection.document(reviewId).delete().await()
    }

    suspend fun fetchUserProfile(userId: String): UserProfile {
        return usersCollection.document(userId).get().await().toUserProfile()
    }

    suspend fun updateUserProfile(userId: String, payload: Map<String, Any?>) {
        usersCollection.document(userId).set(payload, com.google.firebase.firestore.SetOptions.merge()).await()
    }

    suspend fun createPaymentRecord(payload: Map<String, Any?>): String {
        val doc = paymentsCollection.document()
        doc.set(payload).await()
        return doc.id
    }

    suspend fun addFavorite(userId: String, tourId: String) {
        favoritesCollection.document().set(
            mapOf(
                "userId" to userId,
                "tourId" to tourId,
                "createdAt" to Timestamp.now(),
            )
        ).await()
    }

    suspend fun deleteFavorite(favoriteId: String) {
        favoritesCollection.document(favoriteId).delete().await()
    }
}

