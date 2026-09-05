package com.wolaitatours.android.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wolaitatours.android.data.model.Tour
import com.wolaitatours.android.data.repository.TourRepository
import com.wolaitatours.android.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeUiState(
    val tours: List<Tour> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
    val query: String = "",
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repository: TourRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(HomeUiState())
    val state: StateFlow<HomeUiState> = _state.asStateFlow()

    init {
        observeTours()
    }

    private fun observeTours() {
        viewModelScope.launch {
            repository.observeTours().collect { result ->
                when (result) {
                    is Resource.Success -> _state.update {
                        it.copy(tours = result.data, isLoading = false, error = null)
                    }

                    is Resource.Error -> _state.update {
                        it.copy(isLoading = false, error = result.throwable.message)
                    }

                    is Resource.Loading -> _state.update { it.copy(isLoading = true) }
                }
            }
        }
    }

    fun onQueryChange(query: String) {
        _state.update { it.copy(query = query) }
    }

    fun filteredTours(): List<Tour> {
        val current = _state.value
        if (current.query.isBlank()) return current.tours
        return current.tours.filter {
            it.title.contains(current.query, true) ||
                it.category.contains(current.query, true) ||
                it.location.contains(current.query, true)
        }
    }
}

