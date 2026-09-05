package com.wolaitatours.android.data.repository

import com.wolaitatours.android.data.model.Review
import com.wolaitatours.android.data.remote.FirestoreDataSource
import com.wolaitatours.android.util.Resource
import com.wolaitatours.android.util.toResource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onStart
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ReviewRepository @Inject constructor(
    private val remote: FirestoreDataSource,
) {

    fun observeReviews(tourId: String): Flow<Resource<List<Review>>> {
        return remote.observeReviewsForTour(tourId)
            .map { Resource.Success(it) }
            .onStart { emit(Resource.Loading()) }
            .catch { emit(Resource.Error(it)) }
    }

    fun observeUserReviews(touristId: String): Flow<Resource<List<Review>>> {
        return remote.observeUserReviews(touristId)
            .map { Resource.Success(it) }
            .onStart { emit(Resource.Loading()) }
            .catch { emit(Resource.Error(it)) }
    }

    suspend fun hasUserReviewed(bookingId: String, touristId: String): Resource<Boolean> {
        return runCatching {
            remote.hasUserReviewed(bookingId, touristId)
        }.toResource()
    }

    suspend fun submitReview(payload: Map<String, Any?>) = runCatching {
        remote.submitReview(payload)
    }.toResource()

    suspend fun updateReview(reviewId: String, payload: Map<String, Any?>) = runCatching {
        remote.updateReview(reviewId, payload)
    }.toResource()

    suspend fun deleteReview(reviewId: String) = runCatching {
        remote.deleteReview(reviewId)
    }.toResource()
}

