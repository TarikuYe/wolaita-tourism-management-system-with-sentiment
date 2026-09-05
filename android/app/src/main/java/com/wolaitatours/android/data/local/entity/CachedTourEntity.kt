package com.wolaitatours.android.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tours")
data class CachedTourEntity(
    @PrimaryKey val id: String,
    val payload: String,
    val updatedAt: Long,
)

