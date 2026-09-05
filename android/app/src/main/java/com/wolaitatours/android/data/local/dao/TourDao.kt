package com.wolaitatours.android.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.wolaitatours.android.data.local.entity.CachedTourEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TourDao {
    @Query("SELECT * FROM tours ORDER BY updatedAt DESC")
    fun observeTours(): Flow<List<CachedTourEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(tours: List<CachedTourEntity>)

    @Query("DELETE FROM tours")
    suspend fun clear()
}

