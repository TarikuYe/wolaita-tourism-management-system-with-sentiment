package com.wolaitatours.android.ui.tours

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wolaitatours.android.R
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
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class ToursUiState(
    val tours: List<Tour> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
    val query: String = "",
    val selectedCategory: TourCategory = TourCategory.ALL,
    val favorites: Map<String, String> = emptyMap(),
    val favoriteErrorMessage: String? = null,
    val favoriteErrorResId: Int? = null,
    val isFavoriteEnabled: Boolean = false,
)

enum class TourCategory(val labelRes: Int, val remoteValue: String?) {
    ALL(com.wolaitatours.android.R.string.tours_filter_all, null),
    CULTURAL(com.wolaitatours.android.R.string.tours_filter_cultural, "Cultural"),
    ADVENTURE(com.wolaitatours.android.R.string.tours_filter_adventure, "Adventure"),
    RELIGIOUS(com.wolaitatours.android.R.string.tours_filter_religious, "Religious"),
    NATURE(com.wolaitatours.android.R.string.tours_filter_nature, "Nature"),
    HISTORICAL(com.wolaitatours.android.R.string.tours_filter_historical, "Historical"),
}

data class TourGroup(
    val title: String,
    val tours: List<Tour>,
)

@HiltViewModel
class ToursViewModel @Inject constructor(
    private val repository: TourRepository,
    private val favoriteRepository: FavoriteRepository,
    private val authRepository: AuthRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(ToursUiState())
    val state: StateFlow<ToursUiState> = _state.asStateFlow()
    private var favoritesJob: Job? = null
    private var currentUserId: String? = null

    init {
        observeAuth()
        observeTours()
    }

    private fun observeAuth() {
        viewModelScope.launch {
            authRepository.authState().collectLatest { authState ->
                when (authState) {
                    is AuthState.SignedIn -> {
                        currentUserId = authState.user.uid
                        _state.update { it.copy(isFavoriteEnabled = true) }
                        observeFavorites(authState.user.uid)
                    }

                    else -> {
                        currentUserId = null
                        favoritesJob?.cancel()
                        _state.update {
                            it.copy(
                                favorites = emptyMap(),
                                isFavoriteEnabled = false,
                                favoriteErrorMessage = null,
                                favoriteErrorResId = null
                            )
                        }
                    }
                }
            }
        }
    }

    private fun observeTours() {
        viewModelScope.launch {
            repository.observeTours().collect { result ->
                when (result) {
                    is Resource.Success -> _state.update {
                        it.copy(
                            tours = result.data,
                            isLoading = false,
                            error = null
                        )
                    }

                    is Resource.Error -> _state.update {
                        it.copy(
                            isLoading = false,
                            error = result.throwable.message ?: "Unable to load tours"
                        )
                    }

                    is Resource.Loading -> _state.update { it.copy(isLoading = true) }
                }
            }
        }
    }

    private fun observeFavorites(userId: String) {
        favoritesJob?.cancel()
        favoritesJob = viewModelScope.launch {
            favoriteRepository.observeFavorites(userId).collect { result ->
                when (result) {
                    is Resource.Success -> _state.update {
                        it.copy(
                            favorites = result.data.associate { fav -> fav.tourId to fav.id },
                            favoriteErrorMessage = null,
                            favoriteErrorResId = null
                        )
                    }

                    is Resource.Error -> _state.update {
                        it.copy(
                            favoriteErrorMessage = result.throwable.message,
                            favoriteErrorResId = null
                        )
                    }

                    is Resource.Loading -> Unit
                }
            }
        }
    }

    fun onQueryChange(query: String) {
        _state.update { it.copy(query = query) }
    }

    fun onCategorySelected(category: TourCategory) {
        _state.update { it.copy(selectedCategory = category) }
    }

    fun groups(): List<TourGroup> {
        val filtered = filteredTours()
        if (filtered.isEmpty()) return emptyList()
        val grouped = LinkedHashMap<String, MutableList<Tour>>()
        filtered.forEach { tour ->
            val key = tour.agencyName.ifBlank { tour.agencyId.ifBlank { "" } }
            val list = grouped.getOrPut(key) { mutableListOf() }
            list += tour
        }
        return grouped.map { (agencyKey, tours) ->
            val displayName = tours.firstOrNull()?.agencyName
                ?.takeIf { it.isNotBlank() }
                ?: tours.firstOrNull()?.agencyId
                ?: ""
            TourGroup(title = displayName, tours = tours)
        }
    }

    private fun filteredTours(): List<Tour> {
        val current = _state.value
        return current.tours.filter { tour ->
            val isAvailable = tour.available
            val matchesQuery = if (current.query.isBlank()) {
                true
            } else {
                val q = current.query.trim()
                tour.title.contains(q, true) ||
                    tour.titleAm.contains(q, true) ||
                    tour.category.contains(q, true) ||
                    tour.description.contains(q, true) ||
                    tour.descriptionAm.contains(q, true) ||
                    tour.location.contains(q, true) ||
                    tour.locationAm.contains(q, true) ||
                    tour.agencyName.contains(q, true)
            }

            val matchesCategory = current.selectedCategory.remoteValue?.let { category ->
                tour.category.equals(category, true)
            } ?: true

            matchesQuery && matchesCategory && isAvailable
        }
    }

    fun toggleFavorite(tourId: String) {
        val userId = currentUserId
        if (userId == null) {
            _state.update {
                it.copy(
                    favoriteErrorMessage = null,
                    favoriteErrorResId = R.string.favorites_sign_in_required
                )
            }
            return
        }

        viewModelScope.launch {
            val favoriteId = _state.value.favorites[tourId]
            val result = if (favoriteId == null) {
                favoriteRepository.addFavorite(userId, tourId)
            } else {
                favoriteRepository.removeFavorite(favoriteId)
            }
            if (result is Resource.Error) {
                _state.update {
                    it.copy(
                        favoriteErrorMessage = result.throwable.message,
                        favoriteErrorResId = null
                    )
                }
            }
        }
    }

    fun clearFavoriteError() {
        _state.update {
            it.copy(
                favoriteErrorMessage = null,
                favoriteErrorResId = null
            )
        }
    }
}

