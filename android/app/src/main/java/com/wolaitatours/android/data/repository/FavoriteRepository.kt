package com.wolaitatours.android.data.repository

import com.wolaitatours.android.data.model.Favorite
import com.wolaitatours.android.data.remote.FirestoreDataSource
import com.wolaitatours.android.util.Resource
import com.wolaitatours.android.util.toResource
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.onStart

@Singleton
class FavoriteRepository @Inject constructor(
    private val remote: FirestoreDataSource,
) {

    fun observeFavorites(userId: String): Flow<Resource<List<Favorite>>> {
        return remote.observeFavorites(userId)
            .map { favorites ->
                Resource.Success(favorites)
            }
            .onStart { emit(Resource.Loading()) }
            .catch { throwable ->
                emit(Resource.Error(throwable))
            }
    }

    suspend fun addFavorite(userId: String, tourId: String): Resource<Unit> {
        return runCatching {
            remote.addFavorite(userId, tourId)
        }.toResource()
    }

    suspend fun removeFavorite(favoriteId: String): Resource<Unit> {
        return runCatching {
            remote.deleteFavorite(favoriteId)
        }.toResource()
    }
}

