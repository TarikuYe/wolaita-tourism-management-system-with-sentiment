package com.wolaitatours.android.data.repository

import com.squareup.moshi.Moshi
import com.wolaitatours.android.data.local.dao.TourDao
import com.wolaitatours.android.data.local.entity.CachedTourEntity
import com.wolaitatours.android.data.model.Tour
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
class TourRepository @Inject constructor(
    private val remote: FirestoreDataSource,
    private val dao: TourDao,
    private val moshi: Moshi,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher,
) {

    private val adapter = moshi.adapter(Tour::class.java)

    fun observeTours(): Flow<Resource<List<Tour>>> {
        val remoteFlow = remote.observeTours()
            .map { tours ->
                withContext(ioDispatcher) {
                    dao.insertAll(
                        tours.map { tour ->
                            CachedTourEntity(
                                id = tour.id,
                                payload = adapter.toJson(tour),
                                updatedAt = System.currentTimeMillis(),
                            )
                        }
                    )
                }
                Resource.Success(tours)
            }

        val cacheFlow = dao.observeTours()
            .map { entities ->
                val tours = entities.mapNotNull { entity -> adapter.fromJson(entity.payload) }
                Resource.Success(tours)
            }

        return combine(cacheFlow, remoteFlow) { cache, remoteData ->
            if (remoteData is Resource.Error) cache else remoteData
        }.flowOn(ioDispatcher)
    }

    suspend fun getTour(tourId: String) = runCatching {
        remote.getTour(tourId)
    }.toResource()
}

