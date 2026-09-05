package com.wolaitatours.android.di

import com.wolaitatours.android.data.repository.BookingRepository
import com.wolaitatours.android.services.PaymentDeepLinkHandler
import dagger.hilt.EntryPoint
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

@EntryPoint
@InstallIn(SingletonComponent::class)
interface AppEntryPoint {
    fun paymentDeepLinkHandler(): PaymentDeepLinkHandler
    fun bookingRepository(): BookingRepository
}

