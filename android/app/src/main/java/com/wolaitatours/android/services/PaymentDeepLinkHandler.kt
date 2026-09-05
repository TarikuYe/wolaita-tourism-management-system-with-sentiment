package com.wolaitatours.android.services

import android.content.Intent
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PaymentDeepLinkHandler @Inject constructor() {

    fun parse(intent: Intent?): PaymentDeepLink? {
        val data = intent?.data ?: return null
        if (data.scheme != "wolaita") return null
        if (data.host != "tours") return null
        val status = data.getQueryParameter("status") ?: return null
        val bookingId = data.getQueryParameter("bookingId")
        return PaymentDeepLink(status, bookingId)
    }
}

data class PaymentDeepLink(
    val status: String,
    val bookingId: String?,
)

