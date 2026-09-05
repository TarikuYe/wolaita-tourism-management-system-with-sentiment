package com.wolaitatours.android.data.repository

import com.squareup.moshi.Moshi
import com.wolaitatours.android.data.local.dao.BookingDao
import com.wolaitatours.android.data.local.entity.BookingEntity
import com.wolaitatours.android.data.model.Booking
import com.wolaitatours.android.data.remote.FirestoreDataSource
import com.wolaitatours.android.di.IoDispatcher
import com.wolaitatours.android.util.Resource
import com.wolaitatours.android.util.toResource
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class BookingRepository @Inject constructor(
    private val remote: FirestoreDataSource,
    private val dao: BookingDao,
    private val moshi: Moshi,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher,
) {

    private val adapter = moshi.adapter(Booking::class.java)

    fun observeBookings(userId: String): Flow<Resource<List<Booking>>> {
        val remoteFlow = remote.observeUserBookings(userId).map { bookings ->
            withContext(ioDispatcher) {
                dao.upsertAll(
                    bookings.map { booking ->
                        BookingEntity(
                            id = booking.id,
                            payload = adapter.toJson(booking),
                            updatedAt = System.currentTimeMillis(),
                        )
                    }
                )
            }
            Resource.Success(bookings)
        }

        val cacheFlow = dao.observeBookings().map { cached ->
            val bookings = cached.mapNotNull { adapter.fromJson(it.payload) }
            Resource.Success(bookings)
        }

        return combine(cacheFlow, remoteFlow) { cache, remoteData ->
            when (remoteData) {
                is Resource.Error -> cache
                else -> remoteData
            }
        }.flowOn(ioDispatcher)
    }

    suspend fun createBooking(payload: Map<String, Any?>) = runCatching {
        remote.upsertBooking(payload)
    }.toResource()

    suspend fun updateBooking(bookingId: String, payload: Map<String, Any?>) = runCatching {
        remote.updateBooking(bookingId, payload)
    }.toResource()
}

