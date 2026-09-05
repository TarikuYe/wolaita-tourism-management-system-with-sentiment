package com.wolaitatours.android.ui.booking

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.Timestamp
import com.wolaitatours.android.data.model.Booking
import com.wolaitatours.android.data.model.BookingStatus
import com.wolaitatours.android.data.model.PaymentStatus
import com.wolaitatours.android.data.repository.BookingRepository
import com.wolaitatours.android.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class BookingFormState(
    val tourId: String = "",
    val touristId: String = "",
    val participants: Int = 1,
    val specialRequests: String = "",
    val basePrice: Double = 0.0,
    val totalPrice: Double = 0.0,
    val status: FormStatus = FormStatus.Idle,
)

sealed class FormStatus {
    data object Idle : FormStatus()
    data object Loading : FormStatus()
    data class Success(val bookingId: String) : FormStatus()
    data class Error(val message: String?) : FormStatus()
}

@HiltViewModel
class BookingViewModel @Inject constructor(
    private val repository: BookingRepository,
    private val auth: FirebaseAuth,
) : ViewModel() {

    private val _formState = MutableStateFlow(BookingFormState(touristId = auth.currentUser?.uid.orEmpty()))
    val formState: StateFlow<BookingFormState> = _formState.asStateFlow()

    private val _bookings = MutableStateFlow<Resource<List<Booking>>>(Resource.Loading())
    val bookings: StateFlow<Resource<List<Booking>>> = _bookings

    init {
        observeBookings()
    }

    fun updateParticipants(count: Int) {
        _formState.update {
            it.copy(
                participants = count,
                totalPrice = count * it.basePrice
            )
        }
    }

    fun updateSpecialRequest(value: String) {
        _formState.update { it.copy(specialRequests = value) }
    }

    fun updateBasePrice(value: Double) {
        _formState.update {
            it.copy(
                basePrice = value,
                totalPrice = value * it.participants
            )
        }
    }

    fun updateTour(tourId: String) {
        _formState.update { it.copy(tourId = tourId) }
    }

    fun submitBooking(tourName: String, agencyId: String, agencyName: String) {
        val form = _formState.value
        _formState.update { it.copy(status = FormStatus.Loading) }
        viewModelScope.launch {
            val payload = mapOf(
                "tourId" to form.tourId,
                "tourName" to tourName,
                "agencyId" to agencyId,
                "agencyName" to agencyName,
                "touristId" to auth.currentUser?.uid,
                "customerName" to auth.currentUser?.displayName,
                "participants" to form.participants,
                "totalPrice" to form.totalPrice,
                "status" to BookingStatus.pending.name,
                "paymentStatus" to PaymentStatus.pending.name,
                "tourDate" to Timestamp.now(),
                "bookingDate" to Timestamp.now(),
                "createdAt" to Timestamp.now(), // Added for query ordering
                "specialRequests" to form.specialRequests,
            )
            when (val result = repository.createBooking(payload)) {
                is Resource.Success -> _formState.update { it.copy(status = FormStatus.Success(result.data)) }
                is Resource.Error -> _formState.update { it.copy(status = FormStatus.Error(result.throwable.message)) }
                else -> Unit
            }
        }
    }

    private fun observeBookings() {
        val uid = auth.currentUser?.uid ?: return
        viewModelScope.launch {
            repository.observeBookings(uid).collect { _bookings.value = it }
        }
    }
}

