package com.wolaitatours.android.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wolaitatours.android.data.model.AuthState
import com.wolaitatours.android.data.model.Booking
import com.wolaitatours.android.data.model.BookingStatus
import com.wolaitatours.android.data.model.Review
import com.wolaitatours.android.data.repository.AuthRepository
import com.wolaitatours.android.data.repository.BookingRepository
import com.wolaitatours.android.data.repository.FavoriteRepository
import com.wolaitatours.android.data.repository.ReviewRepository
import com.wolaitatours.android.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DashboardUiState(
    val bookings: List<Booking> = emptyList(),
    val reviews: List<Review> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
    val userName: String = "",
    val favorites: Int = 0
) {
    val totalBookings: Int get() = bookings.size
    val upcomingBookings: Int get() = bookings.count {
        it.status == BookingStatus.confirmed || it.status == BookingStatus.pending
    }
    val completedBookings: Int get() = bookings.count {
        it.status == BookingStatus.completed
    }
    val recentBookings: List<Booking> get() = bookings.take(3)
    
    fun hasReviewForBooking(bookingId: String): Boolean {
        return reviews.any { it.bookingId == bookingId }
    }
    
    fun getReviewForBooking(bookingId: String): Review? {
        return reviews.firstOrNull { it.bookingId == bookingId }
    }
}

@HiltViewModel
class TouristDashboardViewModel @Inject constructor(
    private val bookingRepository: BookingRepository,
    private val authRepository: AuthRepository,
    private val favoriteRepository: FavoriteRepository,
    private val reviewRepository: ReviewRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(DashboardUiState())
    val state: StateFlow<DashboardUiState> = _state.asStateFlow()
    private var favoritesJob: Job? = null
    private var reviewsJob: Job? = null

    init {
        observeAuthChanges()
    }

    private fun observeAuthChanges() {
        viewModelScope.launch {
            authRepository.authState().collectLatest { authState ->
                when (authState) {
                    is AuthState.SignedIn -> {
                        val userId = authState.user.uid
                        android.util.Log.d("TouristDashboardViewModel", "User signed in with UID: $userId")
                        android.util.Log.d("TouristDashboardViewModel", "User email: ${authState.user.email}, displayName: ${authState.user.displayName}")
                        _state.update { it.copy(userName = authState.user.displayName ?: "") }
                        observeBookings(userId)
                        observeFavorites(userId)
                        observeReviews(userId)
                    }
                    else -> {
                        favoritesJob?.cancel()
                        reviewsJob?.cancel()
                        _state.update {
                            it.copy(
                                bookings = emptyList(),
                                reviews = emptyList(),
                                isLoading = false,
                                error = if (authState is AuthState.Error) authState.message else null,
                                favorites = 0
                            )
                        }
                    }
                }
            }
        }
    }

    private fun observeBookings(userId: String) {
        android.util.Log.d("TouristDashboardViewModel", "Starting to observe bookings for userId: $userId")
        viewModelScope.launch {
            bookingRepository.observeBookings(userId).collect { result ->
                when (result) {
                    is Resource.Success -> {
                        android.util.Log.d("TouristDashboardViewModel", "Successfully loaded ${result.data.size} bookings")
                        _state.update {
                            it.copy(
                                bookings = result.data,
                                isLoading = false,
                                error = null
                            )
                        }
                    }
                    is Resource.Error -> {
                        android.util.Log.e("TouristDashboardViewModel", "Error loading bookings", result.throwable)
                        _state.update {
                            it.copy(
                                isLoading = false,
                                error = result.throwable.message
                            )
                        }
                    }
                    is Resource.Loading -> {
                        android.util.Log.d("TouristDashboardViewModel", "Loading bookings...")
                        _state.update { it.copy(isLoading = true) }
                    }
                }
            }
        }
    }

    private fun observeFavorites(userId: String) {
        android.util.Log.d("TouristDashboardViewModel", "Starting to observe favorites for userId: $userId")
        favoritesJob?.cancel()
        favoritesJob = viewModelScope.launch {
            favoriteRepository.observeFavorites(userId).collect { result ->
                when (result) {
                    is Resource.Success -> {
                        android.util.Log.d("TouristDashboardViewModel", "Successfully loaded ${result.data.size} favorites")
                        _state.update { it.copy(favorites = result.data.size) }
                    }
                    is Resource.Error -> {
                        android.util.Log.e("TouristDashboardViewModel", "Error loading favorites", result.throwable)
                        _state.update { it.copy(error = result.throwable.message) }
                    }
                    is Resource.Loading -> {
                        android.util.Log.d("TouristDashboardViewModel", "Loading favorites...")
                    }
                }
            }
        }
    }

    private fun observeReviews(userId: String) {
        android.util.Log.d("TouristDashboardViewModel", "Starting to observe reviews for userId: $userId")
        reviewsJob?.cancel()
        reviewsJob = viewModelScope.launch {
            reviewRepository.observeUserReviews(userId).collect { result ->
                when (result) {
                    is Resource.Success -> {
                        android.util.Log.d("TouristDashboardViewModel", "Successfully loaded ${result.data.size} reviews")
                        _state.update { it.copy(reviews = result.data) }
                    }
                    is Resource.Error -> {
                        android.util.Log.e("TouristDashboardViewModel", "Error loading reviews", result.throwable)
                        _state.update { it.copy(error = result.throwable.message) }
                    }
                    is Resource.Loading -> {
                        android.util.Log.d("TouristDashboardViewModel", "Loading reviews...")
                    }
                }
            }
        }
    }
}
