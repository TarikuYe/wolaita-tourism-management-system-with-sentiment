package com.wolaitatours.android.ui.favorites

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wolaitatours.android.data.model.AuthState
import com.wolaitatours.android.data.model.Tour
import com.wolaitatours.android.data.repository.AuthRepository
import com.wolaitatours.android.data.repository.FavoriteRepository
import com.wolaitatours.android.data.repository.TourRepository
import com.wolaitatours.android.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class FavoriteTourItem(
    val favoriteId: String,
    val tour: Tour,
)

data class FavoritesUiState(
    val items: List<FavoriteTourItem> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
    val isSignedIn: Boolean = false,
)

@HiltViewModel
class FavoritesViewModel @Inject constructor(
    private val favoriteRepository: FavoriteRepository,
    private val tourRepository: TourRepository,
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(FavoritesUiState())
    val state: StateFlow<FavoritesUiState> = _state.asStateFlow()

    private var favoritesJob: Job? = null

    init {
        observeAuth()
    }

    private fun observeAuth() {
        viewModelScope.launch {
            authRepository.authState().collectLatest { authState ->
                when (authState) {
                    is AuthState.SignedIn -> {
                        _state.update {
                            it.copy(
                                isSignedIn = true,
                                isLoading = true,
                                error = null
                            )
                        }
                        observeFavoriteTours(authState.user.uid)
                    }

                    AuthState.Loading -> _state.update { it.copy(isLoading = true) }

                    else -> {
                        favoritesJob?.cancel()
                        _state.update {
                            it.copy(
                                isSignedIn = false,
                                items = emptyList(),
                                isLoading = false,
                                error = "Please sign in to view favorites"
                            )
                        }
                    }
                }
            }
        }
    }

    private fun observeFavoriteTours(userId: String) {
        favoritesJob?.cancel()
        favoritesJob = viewModelScope.launch {
            combine(
                tourRepository.observeTours(),
                favoriteRepository.observeFavorites(userId)
            ) { tourResource, favoriteResource ->
                when {
                    tourResource is Resource.Loading || favoriteResource is Resource.Loading -> {
                        _state.update { it.copy(isLoading = true) }
                    }

                    tourResource is Resource.Success && favoriteResource is Resource.Success -> {
                        val items = favoriteResource.data.mapNotNull { favorite ->
                            tourResource.data.firstOrNull { it.id == favorite.tourId }
                                ?.let { FavoriteTourItem(favorite.id, it) }
                        }
                        _state.update {
                            it.copy(
                                items = items,
                                isLoading = false,
                                error = null
                            )
                        }
                    }

                    tourResource is Resource.Error -> _state.update {
                        it.copy(
                            isLoading = false,
                            error = tourResource.throwable.message
                        )
                    }

                    favoriteResource is Resource.Error -> _state.update {
                        it.copy(
                            isLoading = false,
                            error = favoriteResource.throwable.message
                        )
                    }
                }
            }
        }
    }

    fun removeFavorite(favoriteId: String) {
        viewModelScope.launch {
            val result = favoriteRepository.removeFavorite(favoriteId)
            if (result is Resource.Error) {
                _state.update { it.copy(error = result.throwable.message) }
            }
        }
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }
}

