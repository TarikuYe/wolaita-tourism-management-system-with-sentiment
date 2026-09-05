package com.wolaitatours.android.data.remote.api

import com.wolaitatours.android.data.model.PaymentRequest
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

// Backend response format - handle both wrapped and direct responses
// Chapa API can return different formats, so we make all fields nullable
// Also handle error responses from backend
// Using @Json annotation to make parsing more lenient
data class ChapaInitResponse(
    @com.squareup.moshi.Json(name = "message") val message: String? = null,
    @com.squareup.moshi.Json(name = "status") val status: String? = null,
    @com.squareup.moshi.Json(name = "data") val data: ChapaInitData? = null,
    // Direct response fields (if backend returns Chapa response directly)
    @com.squareup.moshi.Json(name = "checkout_url") val checkout_url: String? = null,
    @com.squareup.moshi.Json(name = "tx_ref") val tx_ref: String? = null,
    // Error response fields
    @com.squareup.moshi.Json(name = "error") val error: String? = null,
)

// Make fields nullable to handle partial responses
// Using @JsonClass to ensure custom adapter is used
@com.squareup.moshi.JsonClass(generateAdapter = false)
data class ChapaInitData(
    @com.squareup.moshi.Json(name = "checkout_url") val checkout_url: String? = null,
    @com.squareup.moshi.Json(name = "tx_ref") val tx_ref: String? = null,
)

data class ChapaStatusResponse(
    val status: String,
    val message: String?,
)

interface ChapaApi {
    @POST("initialize")
    suspend fun initializePayment(@Body request: PaymentRequest): ChapaInitResponse

    @GET("verify/{txRef}")
    suspend fun verifyPayment(@Path("txRef") txRef: String): ChapaStatusResponse
}

