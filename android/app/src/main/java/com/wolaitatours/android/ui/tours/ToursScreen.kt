package com.wolaitatours.android.ui.tours

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ElevatedFilterChip
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.wolaitatours.android.R
import com.wolaitatours.android.data.model.Tour
import com.wolaitatours.android.ui.components.Container
import com.wolaitatours.android.ui.components.TourCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ToursRoute(
    onBack: () -> Unit,
    onTourSelected: (Tour) -> Unit,
    viewModel: ToursViewModel = hiltViewModel(),
) {
    val uiState by viewModel.state.collectAsStateWithLifecycle()
    val groupedTours = remember(uiState.tours, uiState.query, uiState.selectedCategory) {
        viewModel.groups()
    }
    val snackbarHostState = remember { SnackbarHostState() }
    val favoriteErrorText = uiState.favoriteErrorResId?.let { stringResource(it) } ?: uiState.favoriteErrorMessage

    LaunchedEffect(favoriteErrorText) {
        val message = favoriteErrorText ?: return@LaunchedEffect
        snackbarHostState.showSnackbar(message)
        viewModel.clearFavoriteError()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(text = stringResource(R.string.tours_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = null
                        )
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Container(modifier = Modifier.padding(horizontal = 16.dp)) {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        OutlinedTextField(
                            value = uiState.query,
                            onValueChange = viewModel::onQueryChange,
                            modifier = Modifier.fillMaxWidth(),
                            placeholder = {
                                Text(text = stringResource(R.string.tours_search_placeholder))
                            }
                        )
                        FilterRow(
                            selected = uiState.selectedCategory,
                            onSelected = viewModel::onCategorySelected
                        )
                    }
                }
            }
            when {
                uiState.isLoading -> {
                    item {
                        BoxLoading()
                    }
                }
                uiState.error != null -> {
                    item {
                        Container(modifier = Modifier.padding(horizontal = 16.dp)) {
                            Text(
                                text = uiState.error ?: stringResource(R.string.tours_error_state),
                                color = MaterialTheme.colorScheme.error
                            )
                        }
                    }
                }
                groupedTours.isEmpty() -> {
                    item {
                        Container(modifier = Modifier.padding(horizontal = 16.dp)) {
                            EmptyToursState()
                        }
                    }
                }
                else -> {
                    groupedTours.forEach { group ->
                        item {
                            TourGroupSection(
                                group = group,
                                favorites = uiState.favorites,
                                showFavorite = uiState.isFavoriteEnabled,
                                onFavoriteToggle = viewModel::toggleFavorite,
                                onTourSelected = onTourSelected
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
private fun FilterRow(
    selected: TourCategory,
    onSelected: (TourCategory) -> Unit,
) {
    FlowRow(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        TourCategory.entries.forEach { category ->
            ElevatedFilterChip(
                selected = category == selected,
                onClick = { onSelected(category) },
                label = { Text(text = stringResource(category.labelRes)) }
            )
        }
    }
}

@Composable
private fun TourGroupSection(
    group: TourGroup,
    favorites: Map<String, String>,
    showFavorite: Boolean,
    onFavoriteToggle: (String) -> Unit,
    onTourSelected: (Tour) -> Unit,
) {
    Container(modifier = Modifier.padding(horizontal = 16.dp)) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            val context = LocalContext.current
            val sectionTitle = if (group.title.isBlank()) {
                stringResource(R.string.tours_unknown_agency)
            } else {
                context.resources.getString(R.string.tours_agency_section, group.title)
            }
            Text(
                text = sectionTitle,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.SemiBold
            )
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                group.tours.forEach { tour ->
                    TourCard(
                        tour = tour,
                        showFavorite = showFavorite,
                        isFavorite = favorites.containsKey(tour.id),
                        onFavoriteToggle = { onFavoriteToggle(tour.id) },
                        onClick = { onTourSelected(tour) }
                    )
                }
            }
        }
    }
}

@Composable
private fun EmptyToursState() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            text = stringResource(R.string.tours_empty_state),
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.Medium
        )
        Text(
            text = stringResource(R.string.action_search),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun BoxLoading() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 48.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        CircularProgressIndicator()
        Spacer(modifier = Modifier.height(12.dp))
        Text(text = stringResource(R.string.msg_loading))
    }
}

