package com.wolaitatours.android.ui.home

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.wolaitatours.android.data.model.Tour
import com.wolaitatours.android.data.repository.TourRepository
import com.wolaitatours.android.util.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TourDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val repository: TourRepository,
) : ViewModel() {

    private val tourId: String = requireNotNull(savedStateHandle["tourId"])

    private val _state = MutableStateFlow<Resource<Tour>>(Resource.Loading())
    val state: StateFlow<Resource<Tour>> = _state

    init {
        viewModelScope.launch {
            _state.value = repository.getTour(tourId)
        }
    }
}

