package com.wolaitatours.android.data.model

import com.google.firebase.Timestamp
import com.squareup.moshi.Json

// Request DTO matching backend/Chapa API format (snake_case)
data class PaymentRequest(
    @Json(name = "amount") val amount: Double,
    @Json(name = "currency") val currency: String,
    @Json(name = "email") val email: String,
    @Json(name = "first_name") val firstName: String,
    @Json(name = "last_name") val lastName: String,
    @Json(name = "phone_number") val phoneNumber: String? = null,
    @Json(name = "tx_ref") val txRef: String,
    @Json(name = "callback_url") val callbackUrl: String,
    @Json(name = "return_url") val returnUrl: String,
    @Json(name = "description") val description: String,
    @Json(name = "payment_options") val paymentOptions: List<String>? = null,
    @Json(name = "meta") val meta: Map<String, Any>? = null,
    // Internal field not sent to API
    val bookingId: String,
)

data class PaymentResult(
    val checkoutUrl: String,
    val txRef: String,
    val expiresAt: Timestamp? = null,
)

data class ManualPaymentReceipt(
    val bookingId: String,
    val amount: Double,
    val currency: String,
    val bankName: String,
    val accountNumber: String,
    val depositorName: String,
    val receiptImage: String?,
)

