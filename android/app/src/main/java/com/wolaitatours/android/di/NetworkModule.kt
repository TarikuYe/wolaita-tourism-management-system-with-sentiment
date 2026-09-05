package com.wolaitatours.android.di

import com.google.firebase.Timestamp
import com.squareup.moshi.JsonAdapter
import com.squareup.moshi.JsonReader
import com.squareup.moshi.JsonWriter
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import com.wolaitatours.android.BuildConfig
import com.wolaitatours.android.data.remote.api.ChapaApi
import com.wolaitatours.android.data.remote.api.ChapaInitData
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import java.util.Date
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    // Custom adapter for Firebase Timestamp to handle serialization
    object FirebaseTimestampAdapter : JsonAdapter<Timestamp>() {
        override fun fromJson(reader: JsonReader): Timestamp? {
            return if (reader.peek() == JsonReader.Token.NULL) {
                reader.nextNull()
            } else {
                try {
                    // Handle object form: { "seconds": ..., "nanoseconds": ... }
                    reader.beginObject()
                    var seconds = 0L
                    var nanoseconds = 0
                    while (reader.hasNext()) {
                        when (reader.nextName()) {
                            "seconds" -> seconds = reader.nextLong()
                            "nanoseconds" -> nanoseconds = reader.nextInt()
                            else -> reader.skipValue()
                        }
                    }
                    reader.endObject()
                    Timestamp(seconds, nanoseconds)
                } catch (e: Exception) {
                    // Fallback for primitive long form (milliseconds)
                    Timestamp(Date(reader.nextLong()))
                }
            }
        }

        override fun toJson(writer: JsonWriter, value: Timestamp?) {
            if (value == null) {
                writer.nullValue()
            } else {
                // Serialize as a nested object to match Firestore's structure
                writer.beginObject()
                writer.name("seconds").value(value.seconds)
                writer.name("nanoseconds").value(value.nanoseconds)
                writer.endObject()
            }
        }
    }

    // Custom adapter for ChapaInitData to handle missing fields gracefully
    // This allows parsing even if tx_ref or checkout_url are missing
    object ChapaInitDataAdapter : JsonAdapter<ChapaInitData>() {
        override fun fromJson(reader: JsonReader): ChapaInitData? {
            return when (reader.peek()) {
                JsonReader.Token.NULL -> {
                    reader.nextNull<Any>()
                    null
                }
                JsonReader.Token.BEGIN_OBJECT -> {
                    reader.beginObject()
                    var checkoutUrl: String? = null
                    var txRef: String? = null
                    while (reader.hasNext()) {
                        val fieldName = reader.nextName()
                        when {
                            reader.peek() == JsonReader.Token.NULL -> {
                                reader.nextNull<Any>()
                                // Field is null, skip it
                            }
                            fieldName == "checkout_url" -> {
                                checkoutUrl = reader.nextString()
                            }
                            fieldName == "tx_ref" -> {
                                txRef = reader.nextString()
                            }
                            else -> reader.skipValue()
                        }
                    }
                    reader.endObject()
                    ChapaInitData(checkout_url = checkoutUrl, tx_ref = txRef)
                }
                else -> {
                    // If it's not an object, skip it
                    reader.skipValue()
                    null
                }
            }
        }

        override fun toJson(writer: JsonWriter, value: ChapaInitData?) {
            if (value == null) {
                writer.nullValue()
            } else {
                writer.beginObject()
                value.checkout_url?.let { writer.name("checkout_url").value(it) }
                value.tx_ref?.let { writer.name("tx_ref").value(it) }
                writer.endObject()
            }
        }
    }

    @Provides
    @Singleton
    fun provideMoshi(): Moshi = Moshi.Builder()
        .add(Timestamp::class.java, FirebaseTimestampAdapter)
        // Add custom adapter BEFORE KotlinJsonAdapterFactory so it takes precedence
        .add(ChapaInitData::class.java, ChapaInitDataAdapter)
        .addLast(KotlinJsonAdapterFactory())
        .build()

    @Provides
    @Singleton
    fun provideOkHttp(): OkHttpClient = OkHttpClient.Builder()
        .addInterceptor(
            HttpLoggingInterceptor().setLevel(
                if (BuildConfig.DEBUG) HttpLoggingInterceptor.Level.BODY
                else HttpLoggingInterceptor.Level.NONE
            )
        )
        .addInterceptor { chain ->
            val request = chain.request()
            val response = chain.proceed(request)
            
            // Log response for debugging
            if (BuildConfig.DEBUG) {
                val responseBody = response.peekBody(1024 * 1024) // Peek up to 1MB
                android.util.Log.d("NetworkModule", "Response for ${request.url}: ${responseBody.string()}")
            }
            
            response
        }
        .build()

    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient, moshi: Moshi): Retrofit {
        // Ensure base URL ends with / for Retrofit
        val baseUrl = if (BuildConfig.CHAPA_BACKEND_URL.endsWith("/")) {
            BuildConfig.CHAPA_BACKEND_URL
        } else {
            "${BuildConfig.CHAPA_BACKEND_URL}/"
        }
        android.util.Log.d("NetworkModule", "Retrofit base URL: $baseUrl")
        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
    }

    @Provides
    @Singleton
    fun provideChapaApi(retrofit: Retrofit): ChapaApi = retrofit.create(ChapaApi::class.java)
}
