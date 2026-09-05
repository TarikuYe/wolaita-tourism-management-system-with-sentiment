package com.wolaitatours.android.data.repository

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.functions.FirebaseFunctionsException
import com.squareup.moshi.Moshi
import com.wolaitatours.android.data.model.ManualPaymentReceipt
import com.wolaitatours.android.data.model.PaymentRequest
import com.wolaitatours.android.data.model.PaymentResult
import com.wolaitatours.android.data.remote.CloudFunctionsDataSource
import com.wolaitatours.android.data.remote.FirestoreDataSource
import com.wolaitatours.android.data.remote.api.ChapaApi
import com.wolaitatours.android.util.toResource
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.HttpException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PaymentRepository @Inject constructor(
    private val chapaApi: ChapaApi,
    private val firestore: FirestoreDataSource,
    private val cloudFunctions: CloudFunctionsDataSource,
    private val auth: FirebaseAuth,
    private val moshi: Moshi,
) {

    suspend fun initializeChapaPayment(request: PaymentRequest) = runCatching {
        android.util.Log.d("PaymentRepository", "Initializing payment for booking: ${request.bookingId}")
        android.util.Log.d("PaymentRepository", "Request: amount=${request.amount}, email=${request.email}")
        
        val response = try {
            chapaApi.initializePayment(request)
        } catch (e: retrofit2.HttpException) {
            // Try to get error body for better debugging
            val errorBody = e.response()?.errorBody()?.string()
            android.util.Log.e("PaymentRepository", "HTTP error: ${e.code()}, message: ${e.message()}")
            android.util.Log.e("PaymentRepository", "Error body: $errorBody")
            throw Exception("Payment server error (${e.code()}): ${errorBody ?: e.message()}", e)
        } catch (e: Exception) {
            android.util.Log.e("PaymentRepository", "API call failed", e)
            android.util.Log.e("PaymentRepository", "Exception type: ${e.javaClass.simpleName}")
            android.util.Log.e("PaymentRepository", "Exception message: ${e.message}")
            android.util.Log.e("PaymentRepository", "Exception cause: ${e.cause?.message}")
            throw Exception("Failed to connect to payment server: ${e.message}", e)
        }
        
        // Check for error response first
        if (response.error != null) {
            throw IllegalStateException("Payment error: ${response.error}")
        }
        
        android.util.Log.d("PaymentRepository", "Response received: status=${response.status}, message=${response.message}")
        android.util.Log.d("PaymentRepository", "Response data object: ${response.data}")
        android.util.Log.d("PaymentRepository", "Direct fields: checkout_url=${response.checkout_url}, tx_ref=${response.tx_ref}")
        
        // Handle both direct response and wrapped response formats
        // Try data object first, then direct fields
        val checkoutUrl = response.data?.checkout_url 
            ?: response.checkout_url
            ?: throw IllegalStateException(
                "No checkout URL in response. " +
                "Status: ${response.status}, " +
                "Message: ${response.message}, " +
                "Error: ${response.error}, " +
                "Has data object: ${response.data != null}, " +
                "Data checkout_url: ${response.data?.checkout_url}, " +
                "Direct checkout_url: ${response.checkout_url}"
            )
        
        // Chapa API doesn't return tx_ref in the response - it only returns checkout_url
        // We need to use the tx_ref that we sent in the request
        // The response may include it, but we should use the one from the request as the source of truth
        val txRef = response.data?.tx_ref 
            ?: response.tx_ref
            ?: request.txRef // Fallback to the tx_ref we sent in the request
        
        if (txRef.isBlank()) {
            throw IllegalStateException(
                "No transaction reference available. " +
                "Status: ${response.status}, " +
                "Message: ${response.message}, " +
                "Error: ${response.error}, " +
                "Has data object: ${response.data != null}, " +
                "Data tx_ref: ${response.data?.tx_ref}, " +
                "Direct tx_ref: ${response.tx_ref}, " +
                "Request tx_ref: ${request.txRef}"
            )
        }
        
        android.util.Log.d("PaymentRepository", "Extracted checkoutUrl: $checkoutUrl, txRef: $txRef (from ${if (response.data?.tx_ref != null) "response.data" else if (response.tx_ref != null) "response" else "request"})")
        
        try {
            firestore.createPaymentRecord(
                mapOf(
                    "bookingId" to request.bookingId,
                    "amount" to request.amount,
                    "currency" to request.currency,
                    "method" to "chapa",
                    "status" to "pending",
                    "txRef" to txRef,
                    "touristId" to auth.currentUser?.uid,
                )
            )
        } catch (e: Exception) {
            android.util.Log.w("PaymentRepository", "Failed to create payment record in Firestore", e)
            // Continue even if Firestore fails - payment was initialized successfully
        }
        
        PaymentResult(
            checkoutUrl = checkoutUrl,
            txRef = txRef,
        )
    }.toResource()

    suspend fun verifyPayment(txRef: String) = runCatching {
        chapaApi.verifyPayment(txRef)
    }.toResource()

    suspend fun submitManualReceipt(receipt: ManualPaymentReceipt) = runCatching {
        firestore.createPaymentRecord(
            mapOf(
                "bookingId" to receipt.bookingId,
                "amount" to receipt.amount,
                "currency" to receipt.currency,
                "method" to "manual",
                "status" to "pending",
                "bankName" to receipt.bankName,
                "accountNumber" to receipt.accountNumber,
                "depositorName" to receipt.depositorName,
                "receiptImage" to receipt.receiptImage,
                "touristId" to auth.currentUser?.uid,
            )
        )
    }.toResource()

    suspend fun verifyChapaViaFunction(txRef: String) = runCatching {
        val result = cloudFunctions.callFunction(
            "verifyChapaPayment",
            mapOf("txRef" to txRef)
        )
        // The data from a Firebase Function is of type Any?, we need to cast it.
        @Suppress("UNCHECKED_CAST")
        val resultMap = result.data as? Map<String, Any>

        val adapter = moshi.adapter(Map::class.java)
        adapter.fromJson(adapter.toJson(resultMap))
    }.recoverCatching { throwable ->
        if (throwable is FirebaseFunctionsException) {
            throw IllegalStateException(throwable.message ?: "Verification failed")
        } else {
            throw throwable
        }
    }.toResource()
}
