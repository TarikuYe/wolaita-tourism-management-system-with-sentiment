package com.wolaitatours.android.ui.festivals

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.People
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.wolaitatours.android.R
import com.wolaitatours.android.data.model.Festival
import com.wolaitatours.android.ui.theme.SecondaryColor

// Sample festivals data matching the website
private val festivals = listOf(
    Festival(
        id = "1",
        name = "Yoyo Gifata Festival",
        nameAm = "ዮዮ ጊፋታ በዓል",
        description = "The most important cultural festival of the Wolaita people, celebrating the harvest season with traditional dances, music, and communal feasting.",
        descriptionAm = "የወላይታ ህዝብ ዋና የባህል በዓል፣ የመሸልሸያ ወቅትን በባህላዊ ውዳቀ፣ ሙዚቃ እና የጋራ ድግስ በማክበር",
        date = "September 15-17, 2024",
        location = "Sodo, Wolaita Zone",
        locationAm = "ሶዶ፣ የወላይታ ዞን",
        image = "https://images.pexels.com/photos/2356045/pexels-photo-2356045.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
        category = "Cultural",
        featured = true,
        relatedTours = 5,
        video = "https://youtu.be/s9_VqzP96tQ?si=8cqviZOobKcNjciw"
    ),
    Festival(
        id = "2",
        name = "Meskel Festival",
        nameAm = "መስቀል በዓል",
        description = "Celebrate the finding of the True Cross with colorful processions, traditional songs, and the iconic bonfire ceremony.",
        descriptionAm = "የእውነተኛው መስቀል መገኘትን በሰልፍ፣ ባህላዊ ዘመማት እና በአንደኛ የእሳት ሥነ ሥርዓት ያክብሩ",
        date = "September 27, 2024",
        location = "Various Churches",
        locationAm = "የተለያዩ ቤተክርስቲያናት",
        image = "https://images.pexels.com/photos/2356045/pexels-photo-2356045.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
        category = "Religious",
        featured = true,
        relatedTours = 3
    ),
    Festival(
        id = "3",
        name = "Coffee Ceremony Festival",
        nameAm = "የቡና ሥነ ሥርዓት በዓል",
        description = "Experience the sacred Ethiopian coffee ceremony, from roasting green beans to sharing three rounds of perfectly brewed coffee.",
        descriptionAm = "የተቀደሰ የኢትዮጵያ የቡና ሥነ ሥርዓት፣ ከአረንጓዴ ፍሬ ማብስል እስከ ሦስት ዙር ፍጹም የተቀቀለ ቡና መጋራት",
        date = "October 10-12, 2024",
        location = "Traditional Villages",
        locationAm = "ባህላዊ መንደሮች",
        image = "https://images.pexels.com/photos/1695052/pexels-photo-1695052.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
        category = "Cultural",
        featured = false,
        relatedTours = 4
    ),
    Festival(
        id = "4",
        name = "Timkat Festival",
        nameAm = "ጥምቀት በዓል",
        description = "Join the Orthodox Christian celebration of Epiphany with colorful processions, water blessings, and traditional ceremonies.",
        descriptionAm = "በኦርቶዶክስ ክርስቲያን የጥምቀት በዓል በአዳራሽ፣ የውኃ በረከት እና ባህላዊ ሥነ ሥርዓቶች ይቀላቀሉ",
        date = "January 19, 2025",
        location = "Water Bodies",
        locationAm = "የውኃ አካባቢዎች",
        image = "https://images.pexels.com/photos/2356045/pexels-photo-2356045.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
        category = "Religious",
        featured = false,
        relatedTours = 2
    ),
    Festival(
        id = "5",
        name = "Traditional Wrestling Festival",
        nameAm = "ባህላዊ ግልግል በዓል",
        description = "Watch exciting traditional wrestling matches that showcase strength, skill, and cultural heritage of Wolaita warriors.",
        descriptionAm = "የወላይታ ተዋጊዎች ጥንካሬ፣ ችሎታ እና ባህላዊ ቅርስ የሚያሳዩ ደሳሳ ባህላዊ ግልግል ውድድሮች ይመልከቱ",
        date = "November 5-7, 2024",
        location = "Community Grounds",
        locationAm = "የማህበረሰብ ሜዳዎች",
        image = "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
        category = "Sports",
        featured = false,
        relatedTours = 3
    ),
    Festival(
        id = "6",
        name = "Harvest Celebration",
        nameAm = "የመሸልሸያ በዓል",
        description = "Celebrate the bounty of the harvest season with traditional foods, dances, and community gatherings.",
        descriptionAm = "የመሸልሸያ ወቅት ብዛት በባህላዊ ምግቦች፣ ውዳቄዎች እና የማህበረሰብ ስብሰባዎች ያክብሩ",
        date = "December 20-22, 2024",
        location = "Agricultural Areas",
        locationAm = "የእርሻ አካባቢዎች",
        image = "https://images.pexels.com/photos/1271619/pexels-photo-1271619.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop",
        category = "Agricultural",
        featured = false,
        relatedTours = 4
    )
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FestivalsScreen(
    onBack: () -> Unit,
    onFestivalSelected: (Festival) -> Unit = {},
    onViewTours: () -> Unit = {},
) {
    val featuredFestivals = festivals.filter { it.featured }
    val upcomingFestivals = festivals.filter { !it.featured }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.festivals_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = stringResource(R.string.cd_back)
                        )
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(32.dp)
        ) {
            // Header
            item {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = stringResource(R.string.festivals_title),
                        style = MaterialTheme.typography.headlineLarge,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        color = Color.White
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = stringResource(R.string.festivals_subtitle),
                        style = MaterialTheme.typography.titleMedium,
                        textAlign = TextAlign.Center,
                        color = Color.White
                    )
                }
            }

            // Featured Festivals Section
            item {
                Text(
                    text = stringResource(R.string.festivals_featured_title),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
            items(featuredFestivals) { festival ->
                FeaturedFestivalCard(
                    festival = festival,
                    onClick = { onFestivalSelected(festival) },
                    onViewTours = onViewTours
                )
            }

            // Upcoming Festivals Section
            item {
                Text(
                    text = stringResource(R.string.festivals_upcoming_title),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }
            item {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    contentPadding = PaddingValues(vertical = 8.dp)
                ) {
                    items(upcomingFestivals) { festival ->
                        UpcomingFestivalCard(
                            festival = festival,
                            onClick = { onFestivalSelected(festival) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun FeaturedFestivalCard(
    festival: Festival,
    onClick: () -> Unit,
    onViewTours: () -> Unit,
) {
    val context = LocalContext.current
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column {
            Box {
                AsyncImage(
                    model = festival.image,
                    contentDescription = festival.name,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    contentScale = ContentScale.Crop
                )
                Text(
                    text = festival.category,
                    modifier = Modifier
                        .padding(12.dp)
                        .background(
                            color = SecondaryColor,
                            shape = RoundedCornerShape(20.dp)
                        )
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White,
                    fontWeight = FontWeight.SemiBold
                )
            }
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text(
                    text = festival.name,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White
                )
                Text(
                    text = festival.description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White,
                    maxLines = 3,
                    overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                )
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.CalendarToday,
                            contentDescription = null,
                            tint = SecondaryColor,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = festival.date,
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.White
                        )
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.LocationOn,
                            contentDescription = null,
                            tint = SecondaryColor,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = festival.location,
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.White
                        )
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Filled.People,
                            contentDescription = null,
                            tint = SecondaryColor,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = context.resources.getString(
                                R.string.festivals_related_tours,
                                festival.relatedTours
                            ),
                            style = MaterialTheme.typography.bodyMedium,
                            color = Color.White
                        )
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = onClick,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = SecondaryColor
                        )
                    ) {
                        Text(stringResource(R.string.festivals_learn_more))
                    }
                    OutlinedButton(
                        onClick = onViewTours,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = SecondaryColor
                        )
                    ) {
                        Text(stringResource(R.string.festivals_view_tours))
                    }
                }
            }
        }
    }
}

@Composable
private fun UpcomingFestivalCard(
    festival: Festival,
    onClick: () -> Unit,
) {
    Card(
        modifier = Modifier
            .width(280.dp)
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column {
            Box {
                AsyncImage(
                    model = festival.image,
                    contentDescription = festival.name,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp),
                    contentScale = ContentScale.Crop
                )
                Text(
                    text = festival.category,
                    modifier = Modifier
                        .padding(8.dp)
                        .align(Alignment.TopEnd)
                        .background(
                            color = Color.White.copy(alpha = 0.9f),
                            shape = RoundedCornerShape(8.dp)
                        )
                        .padding(horizontal = 8.dp, vertical = 4.dp),
                    style = MaterialTheme.typography.bodySmall,
                    fontWeight = FontWeight.SemiBold
                )
            }
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = festival.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.CalendarToday,
                        contentDescription = null,
                        tint = SecondaryColor,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = festival.date,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White
                    )
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Filled.LocationOn,
                        contentDescription = null,
                        tint = SecondaryColor,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = festival.location,
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White,
                        maxLines = 1,
                        overflow = androidx.compose.ui.text.style.TextOverflow.Ellipsis
                    )
                }
                Button(
                    onClick = onClick,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = SecondaryColor
                    )
                ) {
                    Text(
                        text = stringResource(R.string.festivals_view_details),
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }
    }
}

