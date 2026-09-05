package com.wolaitatours.android.ui.explore

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
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.DirectionsBus
import androidx.compose.material.icons.filled.Flight
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.WbSunny
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.draw.clip
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.wolaitatours.android.R
import com.wolaitatours.android.ui.components.Container
import kotlinx.coroutines.delay

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExploreScreen() {
    val listState = rememberLazyListState()
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(text = stringResource(R.string.explore_title)) }
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            state = listState,
            contentPadding = PaddingValues(bottom = 32.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            item { ExploreHeroSection() }
            item { ExploreIntroSection() }
            item { ExploreTourGuideSection() }
            item { ExploreAttractionsSection() }
            item { ExploreGallerySection() }
        }
    }
}

@Composable
private fun ExploreHeroSection(
    backgroundImageUrl: String = HERO_IMAGE,
) {
    Container(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(320.dp)
                .heroClip()
                .background(Color.DarkGray, RoundedCornerShape(24.dp))
        ) {
            AsyncImage(
                model = backgroundImageUrl,
                contentDescription = null,
                modifier = Modifier.matchParentSize(),
                contentScale = ContentScale.Crop
            )
            Box(
                modifier = Modifier
                    .matchParentSize()
                    .background(
                        Brush.verticalGradient(
                            listOf(Color.Black.copy(alpha = 0.65f), Color.Transparent)
                        )
                    )
            )
            Column(
                modifier = Modifier
                    .matchParentSize()
                    .padding(24.dp),
                verticalArrangement = Arrangement.Bottom,
                horizontalAlignment = Alignment.Start
            ) {
                Text(
                    text = stringResource(R.string.explore_title),
                    style = MaterialTheme.typography.headlineMedium.copy(
                        color = Color.White,
                        fontWeight = FontWeight.Bold
                    )
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = stringResource(R.string.home_hero_subtitle),
                    style = MaterialTheme.typography.bodyLarge.copy(color = Color.White),
                    modifier = Modifier.fillMaxWidth(0.9f)
                )
            }
        }
    }
}

@Composable
private fun ExploreIntroSection() {
    Container(modifier = Modifier.padding(horizontal = 16.dp)) {
        Column(
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = stringResource(R.string.explore_intro_title),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = stringResource(R.string.explore_intro_text),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun ExploreTourGuideSection() {
    val guideItems = listOf(
        ExploreGuideInfo(
            icon = Icons.Filled.Flight,
            title = stringResource(R.string.explore_tour_guide_air_title),
            description = stringResource(R.string.explore_tour_guide_air_text)
        ),
        ExploreGuideInfo(
            icon = Icons.Filled.DirectionsBus,
            title = stringResource(R.string.explore_tour_guide_road_title),
            description = stringResource(R.string.explore_tour_guide_road_text)
        ),
        ExploreGuideInfo(
            icon = Icons.Filled.People,
            title = stringResource(R.string.explore_tour_guide_population_title),
            description = stringResource(R.string.explore_tour_guide_population_text)
        ),
        ExploreGuideInfo(
            icon = Icons.Filled.WbSunny,
            title = stringResource(R.string.explore_tour_guide_weather_title),
            description = stringResource(R.string.explore_tour_guide_weather_text)
        ),
        ExploreGuideInfo(
            icon = Icons.Filled.Language,
            title = stringResource(R.string.explore_tour_guide_language_title),
            description = stringResource(R.string.explore_tour_guide_language_text)
        ),
    )

    Container(modifier = Modifier.padding(horizontal = 16.dp)) {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Text(
                text = stringResource(R.string.explore_tour_guide_title),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                guideItems.forEach { guide ->
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        )
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            RowWithIcon(guide = guide)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun RowWithIcon(guide: ExploreGuideInfo) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .background(
                        color = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f),
                        shape = RoundedCornerShape(12.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = guide.icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
            }
            Spacer(modifier = Modifier.size(12.dp))
            Text(
                text = guide.title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
        }
        Text(
            text = guide.description,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun ExploreAttractionsSection() {
    Container(modifier = Modifier.padding(horizontal = 16.dp)) {
        Column(
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = stringResource(R.string.explore_attractions_title),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = stringResource(R.string.explore_attractions_text),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun ExploreGallerySection() {
    val galleryItems = listOf(
        ExploreGalleryItem(
            imageUrl = "https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=1200",
            title = stringResource(R.string.explore_gallery_item_ajora_title),
            description = stringResource(R.string.explore_gallery_item_ajora_desc)
        ),
        ExploreGalleryItem(
            imageUrl = "https://images.pexels.com/photos/2356045/pexels-photo-2356045.jpeg?auto=compress&cs=tinysrgb&w=1200",
            title = stringResource(R.string.explore_gallery_item_ajora_twin_title),
            description = stringResource(R.string.explore_gallery_item_ajora_twin_desc)
        ),
        ExploreGalleryItem(
            imageUrl = "https://images.pexels.com/photos/210243/pexels-photo-210243.jpeg?auto=compress&cs=tinysrgb&w=1200",
            title = stringResource(R.string.explore_gallery_item_bridge_title),
            description = stringResource(R.string.explore_gallery_item_bridge_desc)
        ),
        ExploreGalleryItem(
            imageUrl = "https://images.pexels.com/photos/2157/mountains-sky-lake-reflection.jpg?auto=compress&cs=tinysrgb&w=1200",
            title = stringResource(R.string.explore_gallery_item_damot_title),
            description = stringResource(R.string.explore_gallery_item_damot_desc)
        ),
        ExploreGalleryItem(
            imageUrl = "https://images.pexels.com/photos/2039586/pexels-photo-2039586.jpeg?auto=compress&cs=tinysrgb&w=1200",
            title = stringResource(R.string.explore_gallery_item_culture_title),
            description = stringResource(R.string.explore_gallery_item_culture_desc)
        ),
    )

    var currentIndex by remember { mutableIntStateOf(0) }
    var isPlaying by remember { mutableStateOf(true) }

    LaunchedEffect(isPlaying, currentIndex) {
        if (isPlaying) {
            delay(5000)
            currentIndex = (currentIndex + 1) % galleryItems.size
        }
    }

    Container(modifier = Modifier.padding(horizontal = 16.dp)) {
        Column(
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = stringResource(R.string.explore_gallery_title),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = stringResource(R.string.explore_gallery_text),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(360.dp)
                    .heroClip()
                    .background(Color.DarkGray, RoundedCornerShape(24.dp))
            ) {
                val currentItem = galleryItems[currentIndex]
                AsyncImage(
                    model = currentItem.imageUrl,
                    contentDescription = currentItem.title,
                    modifier = Modifier.matchParentSize(),
                    contentScale = ContentScale.Crop
                )
                Box(
                    modifier = Modifier
                        .matchParentSize()
                        .background(
                            Brush.verticalGradient(
                                listOf(Color.Transparent, Color.Black.copy(alpha = 0.6f))
                            )
                        )
                )
                Column(
                    modifier = Modifier
                        .align(Alignment.BottomStart)
                        .padding(24.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = currentItem.title,
                        style = MaterialTheme.typography.titleLarge.copy(
                            color = Color.White,
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Text(
                        text = currentItem.description,
                        style = MaterialTheme.typography.bodyMedium.copy(color = Color.White)
                    )
                }
                IconButton(
                    onClick = {
                        currentIndex =
                            if (currentIndex == 0) galleryItems.lastIndex else currentIndex - 1
                    },
                    modifier = Modifier
                        .align(Alignment.CenterStart)
                        .padding(8.dp)
                        .background(
                            color = Color.Black.copy(alpha = 0.35f),
                            shape = CircleShape
                        )
                ) {
                    Icon(
                        imageVector = Icons.Filled.ChevronLeft,
                        contentDescription = stringResource(R.string.explore_gallery_prev),
                        tint = Color.White
                    )
                }
                IconButton(
                    onClick = { currentIndex = (currentIndex + 1) % galleryItems.size },
                    modifier = Modifier
                        .align(Alignment.CenterEnd)
                        .padding(8.dp)
                        .background(
                            color = Color.Black.copy(alpha = 0.35f),
                            shape = CircleShape
                        )
                ) {
                    Icon(
                        imageVector = Icons.Filled.ChevronRight,
                        contentDescription = stringResource(R.string.explore_gallery_next),
                        tint = Color.White
                    )
                }
                IconButton(
                    onClick = { isPlaying = !isPlaying },
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(16.dp)
                        .background(
                            color = Color.Black.copy(alpha = 0.35f),
                            shape = CircleShape
                        )
                ) {
                    Icon(
                        imageVector = if (isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
                        contentDescription = if (isPlaying) {
                            stringResource(R.string.explore_gallery_pause)
                        } else {
                            stringResource(R.string.explore_gallery_play)
                        },
                        tint = Color.White
                    )
                }
                DotsIndicator(
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 16.dp),
                    count = galleryItems.size,
                    currentIndex = currentIndex
                )
            }
        }
    }
}

@Composable
private fun DotsIndicator(
    modifier: Modifier = Modifier,
    count: Int,
    currentIndex: Int,
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        repeat(count) { index ->
            val isSelected = index == currentIndex
            Box(
                modifier = Modifier
                    .size(if (isSelected) 12.dp else 8.dp)
                    .background(
                        color = Color.White.copy(alpha = if (isSelected) 1f else 0.5f),
                        shape = CircleShape
                    )
            )
        }
    }
}

private data class ExploreGuideInfo(
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val title: String,
    val description: String,
)

private data class ExploreGalleryItem(
    val imageUrl: String,
    val title: String,
    val description: String,
)

private fun Modifier.heroClip(): Modifier = this.clip(RoundedCornerShape(24.dp))

private const val HERO_IMAGE =
    "https://images.pexels.com/photos/210243/pexels-photo-210243.jpeg?auto=compress&cs=tinysrgb&w=1200"

