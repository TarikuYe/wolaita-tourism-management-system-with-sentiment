package com.wolaitatours.android.util

import com.google.firebase.Timestamp
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

fun Timestamp?.toDisplayString(locale: Locale = Locale.getDefault()): String {
    if (this == null) return "--"
    val formatter = SimpleDateFormat("MMM dd, yyyy", locale)
    return formatter.format(this.toDate())
}

fun Date?.toTimestamp(): Timestamp? = this?.let { Timestamp(it) }

