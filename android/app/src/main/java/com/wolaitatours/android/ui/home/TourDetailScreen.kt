package com.wolaitatours.android.ui.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.wolaitatours.android.data.model.Tour
import com.wolaitatours.android.ui.components.Container
import com.wolaitatours.android.ui.theme.TextGray900
import com.wolaitatours.android.ui.theme.TextGray600
import com.wolaitatours.android.ui.theme.SecondaryColor
import com.wolaitatours.android.ui.theme.Gray50
import androidx.compose.foundation.background

@Composable
fun TourDetailScreen(
    tour: Tour,
    onBookClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Gray50) // Light gray background (bg-gray-50) - matches website
    ) {
        Container(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(tour.images) { image ->
                        AsyncImage(
                            model = image,
                            contentDescription = null,
                            modifier = Modifier
                                .height(250.dp)
                                .fillMaxWidth()
                        )
                    }
                }
                Text(
                    text = tour.title,
                    style = MaterialTheme.typography.headlineMedium,
                    color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                )
                Text(
                    text = tour.description,
                    style = MaterialTheme.typography.bodyLarge,
                    color = TextGray600, // Gray-600 text (text-gray-600) - matches website
                    modifier = Modifier.padding(vertical = 8.dp)
                )
                Text(
                    text = "ETB ${tour.price}",
                    style = MaterialTheme.typography.headlineSmall,
                    color = SecondaryColor // Amber-600 - matches website
                )
                Spacer(modifier = Modifier.weight(1f))
                Button(
                    onClick = onBookClick,
                    modifier = Modifier.fillMaxWidth(),
                    colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                        containerColor = SecondaryColor
                    )
                ) {
                    Text(text = "Book this tour")
                }
            }
        }
    }
}
