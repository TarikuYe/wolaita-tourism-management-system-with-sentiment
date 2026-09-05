package com.wolaitatours.android.data.model

data class Festival(
    val id: String,
    val name: String,
    val nameAm: String,
    val description: String,
    val descriptionAm: String,
    val date: String,
    val location: String,
    val locationAm: String,
    val image: String,
    val video: String? = null,
    val category: String,
    val featured: Boolean,
    val relatedTours: Int = 0,
)

