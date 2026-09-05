package com.wolaitatours.android.data.repository

import com.wolaitatours.android.data.model.AvatarUpdateRequest
import com.wolaitatours.android.data.model.LanguageOption
import com.wolaitatours.android.data.model.UserProfile
import com.wolaitatours.android.data.remote.FirestoreDataSource
import com.wolaitatours.android.data.remote.StorageDataSource
import com.wolaitatours.android.util.toResource
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProfileRepository @Inject constructor(
    private val remote: FirestoreDataSource,
    private val storage: StorageDataSource,
) {

    suspend fun loadProfile(userId: String) = runCatching {
        android.util.Log.d("ProfileRepository", "Loading profile for userId: $userId")
        val profile = remote.fetchUserProfile(userId)
        android.util.Log.d("ProfileRepository", "Loaded profile: name=${profile.name}, email=${profile.email}, role=${profile.role}")
        profile
    }.toResource()

    suspend fun updateProfile(userId: String, profile: UserProfile) = runCatching {
        remote.updateUserProfile(
            userId,
            mapOf(
                "name" to profile.name,
                "phone" to profile.phone,
                "nationality" to profile.nationality, // Added to match website
                "preferredLanguage" to profile.preferredLanguage.code,
                "notificationEnabled" to profile.notificationEnabled,
            )
        )
    }.toResource()

    suspend fun updateAvatar(userId: String, request: AvatarUpdateRequest) = runCatching {
        val downloadUrl = storage.upload(request.remotePath, request.localUri)
        remote.updateUserProfile(userId, mapOf("profileImage" to downloadUrl))
        downloadUrl
    }.toResource()

    suspend fun updateLanguage(userId: String, option: LanguageOption) = runCatching {
        remote.updateUserProfile(userId, mapOf("preferredLanguage" to option.code))
    }.toResource()
}

