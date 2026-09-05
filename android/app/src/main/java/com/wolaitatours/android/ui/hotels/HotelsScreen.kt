package com.wolaitatours.android.ui.hotels

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
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
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.wolaitatours.android.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HotelsScreen(
    onBack: () -> Unit,
) {
    val hotels = remember { featuredHotels }
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(text = stringResource(R.string.hotels_title)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = null
                        )
                    }
                }
            )
        }
    ) { padding ->
        LazyVerticalGrid(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            columns = GridCells.Adaptive(280.dp),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(hotels, key = { it.nameRes }) { hotel ->
                HotelCard(hotel = hotel)
            }
        }
    }
}

@Composable
private fun HotelCard(hotel: HotelInfo) {
    Card(
        shape = RoundedCornerShape(20.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(hotel.imageUrl)
                    .crossfade(true)
                    .build(),
                contentDescription = stringResource(id = hotel.nameRes),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                contentScale = ContentScale.Crop
            )
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = stringResource(id = hotel.nameRes),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                InfoLine(
                    label = stringResource(R.string.hotels_address),
                    value = hotel.address
                )
                InfoLine(
                    label = stringResource(R.string.hotels_phone),
                    value = hotel.phone
                )
                hotel.email?.let {
                    InfoLine(
                        label = stringResource(R.string.hotels_email),
                        value = it
                    )
                }
                hotel.website?.let {
                    InfoLine(
                        label = stringResource(R.string.hotels_webpage),
                        value = it
                    )
                }
                Button(
                    onClick = { /* future deep link or contact */ },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(text = stringResource(R.string.hotels_card_book))
                }
            }
        }
    }
}

@Composable
private fun InfoLine(
    label: String,
    value: String,
) {
    Text(
        text = "$label: $value",
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant
    )
}

private data class HotelInfo(
    val nameRes: Int,
    val imageUrl: String,
    val address: String,
    val phone: String,
    val email: String? = null,
    val website: String? = null,
)

private const val HOTELS_ASSET_BASE =
    "https://raw.githubusercontent.com/Tariku1921/project212-wolaita-tourism/main/public/images/hotels"

private val featuredHotels = listOf(
    HotelInfo(
        nameRes = R.string.hotel_name_haile,
        imageUrl = "$HOTELS_ASSET_BASE/Hile.jpg",
        address = "Sodo, Wolaita, Ethiopia",
        phone = "+251 994 00 00 00",
        email = "Reservationwolaita@haileresorts.com",
        website = "www.hailehotelsandresorts.com"
    ),
    HotelInfo(
        nameRes = R.string.hotel_name_lewi,
        imageUrl = "$HOTELS_ASSET_BASE/Lewi.jpg",
        address = "Sodo, Wolaita, Ethiopia",
        phone = "+251 461 808 080 / +251 930 28 00 00",
        email = "info@lewihotelandresort.com"
    ),
    HotelInfo(
        nameRes = R.string.hotel_name_abebe,
        imageUrl = "$HOTELS_ASSET_BASE/Abebe.png",
        address = "Sodo, Wolaita, Ethiopia",
        phone = "+251 461 801 127 / +251 930 50 54 20",
        website = "www.abebezelekeinternationalhotel.com"
    ),
    HotelInfo(
        nameRes = R.string.hotel_name_nega,
        imageUrl = "$HOTELS_ASSET_BASE/Nega.jpg",
        address = "Sodo, Wolaita, Ethiopia",
        phone = "+251 911 69 93 84",
        email = "ajora@viewlodge.com"
    ),
    HotelInfo(
        nameRes = R.string.hotel_name_daystar,
        imageUrl = "$HOTELS_ASSET_BASE/DayStar.jpg",
        address = "Sodo, Wolaita, Ethiopia",
        phone = "+251 916 81 77 48 / +251 911 84 40 18",
        email = "mariamknn@yahoo.com",
        website = "www.daystarhotel.com"
    ),
    HotelInfo(
        nameRes = R.string.hotel_name_semayat,
        imageUrl = "$HOTELS_ASSET_BASE/Semayat.jpg",
        address = "Sodo, Wolaita, Ethiopia",
        phone = "+251 916 58 00 02",
        email = "ethio@culturalhotel.com"
    ),
)

