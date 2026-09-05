package com.wolaitatours.android.util

sealed class Resource<out T> {
    data class Success<T>(val data: T) : Resource<T>()
    data class Error(val throwable: Throwable) : Resource<Nothing>()
    data class Loading(val message: String? = null) : Resource<Nothing>()
}

inline fun <T> Result<T>.toResource(): Resource<T> =
    fold(
        onSuccess = { Resource.Success(it) },
        onFailure = { Resource.Error(it) }
    )

inline fun <T> Resource<T>.onSuccess(block: (T) -> Unit): Resource<T> {
    if (this is Resource.Success) block(data)
    return this
}

inline fun <T> Resource<T>.onError(block: (Throwable) -> Unit): Resource<T> {
    if (this is Resource.Error) block(throwable)
    return this
}

