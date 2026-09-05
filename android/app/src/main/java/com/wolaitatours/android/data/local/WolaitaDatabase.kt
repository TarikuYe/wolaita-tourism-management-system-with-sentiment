package com.wolaitatours.android.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.wolaitatours.android.data.local.dao.BookingDao
import com.wolaitatours.android.data.local.dao.TourDao
import com.wolaitatours.android.data.local.entity.BookingEntity
import com.wolaitatours.android.data.local.entity.CachedTourEntity

@Database(
    entities = [
        CachedTourEntity::class,
        BookingEntity::class,
    ],
    version = 1,
    exportSchema = true,
)
abstract class WolaitaDatabase : RoomDatabase() {
    abstract fun tourDao(): TourDao
    abstract fun bookingDao(): BookingDao
}

