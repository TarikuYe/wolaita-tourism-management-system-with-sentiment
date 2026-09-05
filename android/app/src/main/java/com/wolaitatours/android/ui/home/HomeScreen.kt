package com.wolaitatours.android.ui.home

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.People
import androidx.compose.ui.res.painterResource
import androidx.compose.foundation.Image
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.wolaitatours.android.R
import com.wolaitatours.android.data.model.LanguageOption
import com.wolaitatours.android.data.model.Tour
import com.wolaitatours.android.ui.components.Footer
import com.wolaitatours.android.ui.theme.SecondaryColor
import com.wolaitatours.android.ui.theme.StarRating
import com.wolaitatours.android.ui.theme.WhiteBackground
import com.wolaitatours.android.ui.theme.TextGray900
import com.wolaitatours.android.ui.theme.TextGray700
import com.wolaitatours.android.ui.theme.TextGray600

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: HomeViewModel,
    onTourSelected: (Tour) -> Unit,
    onExploreClick: () -> Unit,
    onViewAllTours: () -> Unit,
    onDashboardClick: () -> Unit,
    onLanguageChange: (LanguageOption) -> Unit,
    onAboutClick: () -> Unit = {},
    onContactClick: () -> Unit = {},
) {
    val uiState by viewModel.state.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    val listState = rememberLazyListState()
    val heroImage = R.drawable.heroimage
    var showLanguageMenu by remember { mutableStateOf(false) }

    val stats = listOf(
        HomeStat("500+", stringResource(R.string.home_stats_travelers)),
        HomeStat("50+", stringResource(R.string.home_stats_destinations)),
        HomeStat("25+", stringResource(R.string.home_stats_guides)),
        HomeStat("4.9", stringResource(R.string.home_stats_rating)),
    )

    val features = listOf(
        HomeFeature(
            icon = Icons.Filled.Favorite,
            title = stringResource(R.string.home_feature_authentic_title),
            description = stringResource(R.string.home_feature_authentic_desc)
        ),
        HomeFeature(
            icon = Icons.Outlined.People,
            title = stringResource(R.string.home_feature_guides_title),
            description = stringResource(R.string.home_feature_guides_desc)
        ),
        HomeFeature(
            icon = Icons.Filled.Lock,
            title = stringResource(R.string.home_feature_safety_title),
            description = stringResource(R.string.home_feature_safety_desc)
        ),
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Image(
                        painter = painterResource(id = R.drawable.logoicon),
                        contentDescription = "Wolaita Tours Logo",
                        modifier = Modifier.size(100.dp),
                        contentScale = ContentScale.Fit
                    )
                },
                colors = androidx.compose.material3.TopAppBarDefaults.topAppBarColors(
                    containerColor = WhiteBackground, // White background (bg-white) - matches website navbar
                    titleContentColor = TextGray900, // Dark text (text-gray-900) - matches website
                    actionIconContentColor = TextGray900 // Dark text for actions - matches website
                ),
                actions = {
                    TextButton(onClick = onAboutClick) {
                        Text(
                            text = stringResource(R.string.title_about),
                            color = TextGray900 // Dark text (text-gray-900) - matches website
                        )
                    }
                    TextButton(onClick = onContactClick) {
                        Text(
                            text = stringResource(R.string.title_contact),
                            color = TextGray900 // Dark text (text-gray-900) - matches website
                        )
                    }
                    IconButton(onClick = { showLanguageMenu = true }) {
                        Icon(
                            imageVector = Icons.Default.Language,
                            contentDescription = stringResource(R.string.label_language),
                            tint = TextGray900 // Dark icon color - matches website
                        )
                    }
                    DropdownMenu(
                        expanded = showLanguageMenu,
                        onDismissRequest = { showLanguageMenu = false }
                    ) {
                        DropdownMenuItem(text = { Text(stringResource(R.string.language_english)) }, onClick = {
                            onLanguageChange(LanguageOption.ENGLISH)
                            showLanguageMenu = false
                        })
                        DropdownMenuItem(text = { Text(stringResource(R.string.language_amharic)) }, onClick = {
                            onLanguageChange(LanguageOption.AMHARIC)
                            showLanguageMenu = false
                        })
                    }
                    IconButton(onClick = onDashboardClick) {
                        Icon(
                            imageVector = Icons.Default.Dashboard,
                            contentDescription = "Dashboard"
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
            state = listState,
            contentPadding = PaddingValues(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(32.dp)
        ) {
            item {
                HomeHeroSection(
                    title = stringResource(R.string.home_hero_title),
                    subtitle = stringResource(R.string.home_hero_subtitle),
                    ctaText = stringResource(R.string.home_hero_cta),
                    backgroundImageUrl = heroImage,
                    onCtaClick = onExploreClick
                )
            }
            item { HomeStatsSection(stats = stats) }
            item { HomeFeaturesSection(features = features) }
            item {
                HomeFeaturedToursSection(
                    tours = uiState.tours.take(3),
                    onTourSelected = onTourSelected,
                    onViewAllTours = onViewAllTours
                )
            }
            item { HomeCallToActionSection(onExploreClick = onExploreClick) }
            item { Footer() }
        }
    }
}

@Composable
private fun HomeHeroSection(
    title: String,
    subtitle: String,
    ctaText: String,
    backgroundImageUrl: Int,
    onCtaClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(400.dp)
            .background(Color.Black)
    ) {
        AsyncImage(
            model = backgroundImageUrl,
            contentDescription = null,
            modifier = Modifier.matchParentSize(),
            contentScale = ContentScale.Crop,
            alpha = 0.5f
        )
        Column(
            modifier = Modifier
                .matchParentSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.headlineLarge.copy(
                    color = Color.White,
                    fontWeight = FontWeight.Bold
                ),
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = subtitle,
                style = MaterialTheme.typography.titleMedium.copy(color = Color.White),
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(24.dp))
            Button(
                onClick = onCtaClick, colors = ButtonDefaults.buttonColors(
                    containerColor = SecondaryColor
                )
            ) {
                Text(text = ctaText, style = MaterialTheme.typography.titleMedium)
            }
        }
    }
}

@Composable
private fun HomeStatsSection(
    stats: List<HomeStat>,
) {
    Column(
        modifier = Modifier.padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        stats.chunked(2).forEach { rowStats ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                rowStats.forEach { stat ->
                    Column(
                        modifier = Modifier.weight(1f),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = stat.number,
                            style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold),
                            color = SecondaryColor,
                        )
                        Text(
                            text = stat.label,
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextGray700, // Gray-700 text (text-gray-700) - matches website
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun HomeFeaturesSection(
    features: List<HomeFeature>,
) {
    Column(
        modifier = Modifier.padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        Text(
            text = stringResource(R.string.home_features_title),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
            color = TextGray900 // Gray-900 text (text-gray-900) - matches website
        )
        features.forEach { feature ->
            Card(
                shape = RoundedCornerShape(16.dp),
                elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = WhiteBackground // White background (bg-white) - matches website
                )
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Icon(
                        imageVector = feature.icon,
                        contentDescription = null,
                        tint = SecondaryColor, // Orange icon (text-amber-600) - matches website
                        modifier = Modifier.size(40.dp)
                    )
                    Column {
                        Text(
                            text = feature.title,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.SemiBold,
                            color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                        )
                        Text(
                            text = feature.description,
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun HomeFeaturedToursSection(
    tours: List<Tour>,
    onTourSelected: (Tour) -> Unit,
    onViewAllTours: () -> Unit,
) {
    Column(
        modifier = Modifier.padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = stringResource(R.string.home_featured_title),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
            color = TextGray900 // Gray-900 text (text-gray-900) - matches website
        )
        Text(
            text = stringResource(R.string.home_featured_description),
            style = MaterialTheme.typography.bodyMedium,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth(),
            color = TextGray600 // Gray-600 text (text-gray-600) - matches website
        )
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(vertical = 8.dp)
        ) {
            items(tours) { tour ->
                FeaturedTourCard(tour = tour, onClick = { onTourSelected(tour) })
            }
        }
        Button(
            onClick = onViewAllTours,
            modifier = Modifier.align(Alignment.CenterHorizontally)
        ) {
            Text(text = stringResource(R.string.home_view_all_tours))
        }
    }
}

@Composable
private fun FeaturedTourCard(tour: Tour, onClick: () -> Unit) {
    val context = LocalContext.current
    ElevatedCard(
        modifier = Modifier.size(width = 300.dp, height = 400.dp),
        shape = RoundedCornerShape(16.dp),
        onClick = onClick,
        colors = CardDefaults.elevatedCardColors(
            containerColor = WhiteBackground // White background (bg-white) - matches website
        )
    ) {
        Column {
            AsyncImage(
                model = tour.images.firstOrNull(),
                contentDescription = tour.title,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                contentScale = ContentScale.Crop
            )
            Column(
                modifier = Modifier
                    .padding(16.dp)
                    .fillMaxSize(),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = tour.title,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val ratingValue = if (tour.rating > 0) tour.rating else 4.9
                    Icon(Icons.Filled.Star, contentDescription = null, tint = StarRating)
                    Text(
                        text = context.resources.getString(
                            R.string.home_featured_rating,
                            ratingValue,
                            tour.reviewsCount
                        ),
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                    )
                }
                Text(
                    text = context.resources.getString(R.string.home_featured_price_from, "ETB ${"%,.0f".format(tour.price)}"),
                    style = MaterialTheme.typography.headlineSmall,
                    color = SecondaryColor,
                    fontWeight = FontWeight.Bold
                )
                Button(onClick = onClick, modifier = Modifier.fillMaxWidth()) {
                    Text(text = stringResource(R.string.action_book_now))
                }
            }
        }
    }
}

@Composable
private fun HomeCallToActionSection(
    onExploreClick: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
            .background(
                SecondaryColor, // Solid orange background (matches website)
                shape = RoundedCornerShape(16.dp)
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = stringResource(R.string.home_ready_title),
                style = MaterialTheme.typography.headlineSmall.copy(
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                ),
                textAlign = TextAlign.Center
            )
            Button(
                onClick = onExploreClick, colors = ButtonDefaults.buttonColors(
                    containerColor = Color.White,
                    contentColor = SecondaryColor
                )
            ) {
                Text(text = stringResource(R.string.home_start_journey), style = MaterialTheme.typography.titleMedium)
            }
        }
    }
}

private data class HomeStat(val number: String, val label: String)

private data class HomeFeature(
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val title: String,
    val description: String,
)

private const val HERO_FALLBACK_IMAGE = "https://www.wolaitatours.com/images/hero-bg.jpg"
