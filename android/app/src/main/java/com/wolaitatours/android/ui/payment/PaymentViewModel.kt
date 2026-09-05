package com.wolaitatours.android.ui.payment

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wolaitatours.android.data.model.ManualPaymentReceipt
import com.wolaitatours.android.data.model.PaymentRequest
import com.wolaitatours.android.data.repository.PaymentRepository
import com.wolaitatours.android.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PaymentUiState(
    val isProcessing: Boolean = false,
    val error: String? = null,
    val checkoutUrl: String? = null,
    val txRef: String? = null,
)

@HiltViewModel
class PaymentViewModel @Inject constructor(
    private val repository: PaymentRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(PaymentUiState())
    val state: StateFlow<PaymentUiState> = _state.asStateFlow()

    fun initializePayment(request: PaymentRequest) {
        _state.value = PaymentUiState(isProcessing = true, error = null)
        viewModelScope.launch {
            try {
                android.util.Log.d("PaymentViewModel", "Starting payment initialization")
                when (val result = repository.initializeChapaPayment(request)) {
                    is Resource.Success -> {
                        android.util.Log.d("PaymentViewModel", "Payment initialized successfully: ${result.data.checkoutUrl}")
                        _state.value = PaymentUiState(
                            checkoutUrl = result.data.checkoutUrl,
                            txRef = result.data.txRef
                        )
                    }
                    is Resource.Error -> {
                        val errorMsg = result.throwable.message ?: "Unknown error occurred"
                        android.util.Log.e("PaymentViewModel", "Payment initialization failed", result.throwable)
                        _state.value = PaymentUiState(
                            isProcessing = false,
                            error = errorMsg
                        )
                    }
                    is Resource.Loading -> {
                        _state.value = PaymentUiState(isProcessing = true)
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("PaymentViewModel", "Unexpected error in initializePayment", e)
                _state.value = PaymentUiState(
                    isProcessing = false,
                    error = "Payment failed: ${e.message ?: "Unknown error"}"
                )
            }
        }
    }

    fun submitManual(receipt: ManualPaymentReceipt) {
        _state.value = PaymentUiState(isProcessing = true)
        viewModelScope.launch {
            when (val result = repository.submitManualReceipt(receipt)) {
                is Resource.Success -> _state.value = PaymentUiState()
                is Resource.Error -> _state.value = PaymentUiState(error = result.throwable.message)
                else -> Unit
            }
        }
    }
}

