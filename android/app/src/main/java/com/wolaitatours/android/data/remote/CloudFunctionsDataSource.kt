package com.wolaitatours.android.data.remote

import com.google.firebase.functions.FirebaseFunctions
import com.google.firebase.functions.HttpsCallableResult
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CloudFunctionsDataSource @Inject constructor(
    private val functions: FirebaseFunctions,
) {

    suspend fun callFunction(name: String, data: Map<String, Any?>): HttpsCallableResult {
        return functions
            .getHttpsCallable(name)
            .call(data)
            .await()
    }
}

