package com.wolaitatours.android.ui.reviews

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.Timestamp
import com.wolaitatours.android.data.repository.ReviewRepository
import com.wolaitatours.android.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ReviewUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSubmitted: Boolean = false,
)

@HiltViewModel
class ReviewViewModel @Inject constructor(
    private val repository: ReviewRepository,
    private val auth: FirebaseAuth,
) : ViewModel() {

    private val _state = MutableStateFlow(ReviewUiState())
    val state: StateFlow<ReviewUiState> = _state.asStateFlow()

    fun submitReview(bookingId: String, tourId: String, tourName: String, rating: Int, comment: String) {
        val uid = auth.currentUser?.uid ?: return
        _state.value = ReviewUiState(isLoading = true)
        viewModelScope.launch {
            val payload = mapOf(
                "bookingId" to bookingId, // Added to match website
                "tourId" to tourId,
                "tourName" to tourName,
                "touristId" to uid,
                "touristName" to (auth.currentUser?.displayName ?: ""),
                "rating" to rating.toLong(),
                "comment" to comment,
                "createdAt" to Timestamp.now(),
                "verified" to false, // Changed to false to match website (admin verifies)
            )
            when (val result = repository.submitReview(payload)) {
                is Resource.Success -> {
                    android.util.Log.d("ReviewViewModel", "Review submitted successfully")
                    _state.value = ReviewUiState(isSubmitted = true)
                }
                is Resource.Error -> {
                    android.util.Log.e("ReviewViewModel", "Error submitting review", result.throwable)
                    _state.value = ReviewUiState(error = result.throwable.message)
                }
                else -> Unit
            }
        }
    }
}

