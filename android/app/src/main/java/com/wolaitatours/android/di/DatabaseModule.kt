package com.wolaitatours.android.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import androidx.room.Room
import com.wolaitatours.android.data.local.WolaitaDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

private val Context.userPreferencesDataStore: DataStore<Preferences> by preferencesDataStore(
    name = "user_preferences"
)

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): WolaitaDatabase =
        Room.databaseBuilder(
            context,
            WolaitaDatabase::class.java,
            "wolaita.db"
        ).fallbackToDestructiveMigration().build()

    @Provides
    fun provideTourDao(db: WolaitaDatabase) = db.tourDao()

    @Provides
    fun provideBookingDao(db: WolaitaDatabase) = db.bookingDao()

    @Provides
    @Singleton
    fun providePreferences(@ApplicationContext context: Context): DataStore<Preferences> =
        context.userPreferencesDataStore
}

