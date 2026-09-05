package com.wolaitatours.android.ui.dashboard

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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Apartment
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.wolaitatours.android.data.model.Booking
import com.wolaitatours.android.data.model.BookingStatus
import com.wolaitatours.android.data.model.Review
import com.wolaitatours.android.ui.theme.SecondaryColor
import com.wolaitatours.android.ui.theme.StarRating
import com.wolaitatours.android.ui.theme.Green600
import com.wolaitatours.android.ui.theme.Green700
import com.wolaitatours.android.ui.theme.SuccessGreen
import com.wolaitatours.android.ui.theme.WhiteBackground
import com.wolaitatours.android.ui.theme.TextGray900
import com.wolaitatours.android.ui.theme.Gray900
import com.wolaitatours.android.ui.theme.TextGray300
import com.wolaitatours.android.ui.theme.TextGray500
import com.wolaitatours.android.ui.theme.TextGray600
import com.wolaitatours.android.ui.theme.TextGray400
import java.text.SimpleDateFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TouristDashboardScreen(
    viewModel: TouristDashboardViewModel,
    onViewAllBookings: () -> Unit,
    onViewTours: () -> Unit,
    onViewFestivals: () -> Unit,
    onViewFavorites: () -> Unit,
    onBookingClick: (Booking) -> Unit,
    onLogout: () -> Unit,
    onLeaveReview: (Booking) -> Unit = {},
    onProfileClick: () -> Unit = {},
) {
    val state = viewModel.state.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = if (state.value.userName.isNotBlank()) {
                                "Welcome, ${state.value.userName}!"
                            } else {
                                "Welcome!"
                            },
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold,
                            color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                        )
                        Text(
                            text = "Tourist Dashboard",
                            style = MaterialTheme.typography.titleSmall,
                            color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                        )
                    }
                },
                actions = {
                    TextButton(onClick = onProfileClick) {
                        Text(text = "Profile", color = MaterialTheme.colorScheme.onSurface)
                    }
                    TextButton(onClick = onLogout) {
                        Text(text = "Sign out", color = MaterialTheme.colorScheme.onSurface)
                    }
                },
                colors = androidx.compose.material3.TopAppBarDefaults.topAppBarColors(
                    containerColor = WhiteBackground, // White background (bg-white) - matches website
                    titleContentColor = TextGray900, // Dark text (text-gray-900) - matches website
                    actionIconContentColor = TextGray900 // Dark text for actions - matches website
                )
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        if (state.value.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(24.dp)
            ) {
                // Stats Section
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        StatCard(
                            title = "Total Bookings",
                            value = state.value.totalBookings.toString(),
                            icon = Icons.Default.List,
                            modifier = Modifier.weight(1f)
                        )
                        StatCard(
                            title = "Upcoming Tours",
                            value = state.value.upcomingBookings.toString(),
                            icon = Icons.Default.CalendarToday,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        StatCard(
                            title = "Completed Tours",
                            value = state.value.completedBookings.toString(),
                            icon = Icons.Default.CheckCircle,
                            modifier = Modifier.weight(1f)
                        )
                        StatCard(
                            title = "Favorites",
                            value = state.value.favorites.toString(),
                            icon = Icons.Default.Favorite,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }

                // My Bookings Section
                item {
                    SectionWithButton(
                        title = "My Bookings",
                        buttonText = "+ Book Tour",
                        onButtonClick = onViewTours
                    )
                }

                if (state.value.bookings.isEmpty()) {
                    item {
                        EmptyState(
                            title = "No bookings yet",
                            buttonText = "+ Book Your First Tour",
                            onButtonClick = onViewTours
                        )
                    }
                } else {
                    items(state.value.bookings) { booking ->
                        val hasReview = state.value.hasReviewForBooking(booking.id)
                        BookingCard(
                            booking = booking,
                            onClick = { onBookingClick(booking) },
                            hasReview = hasReview,
                            onLeaveReview = if (booking.status == BookingStatus.completed && !hasReview) {
                                { onLeaveReview(booking) }
                            } else null
                        )
                    }
                }

                // My Reviews Section
                item {
                    SectionWithButton(title = "My Reviews")
                }
                if (state.value.reviews.isEmpty()) {
                    item {
                        EmptyState(
                            title = "No reviews yet",
                            subtitle = "Book a tour to leave your first review!"
                        )
                    }
                } else {
                    items(state.value.reviews) { review ->
                        ReviewCard(review = review)
                    }
                }

                // Quick Actions Section
                item {
                    Text(
                        text = "Quick Actions",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                    )
                }
                item {
                    QuickActionButtons(onViewTours, onViewFestivals, onViewFavorites)
                }

                // Footer
                item { Footer() }
            }
        }
    }
}

@Composable
private fun StatCard(
    title: String,
    value: String,
    icon: ImageVector,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = SecondaryColor)
            Column {
                Text(
                    text = value,
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun SectionWithButton(
    title: String,
    buttonText: String? = null,
    onButtonClick: (() -> Unit)? = null
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = title, 
            style = MaterialTheme.typography.titleLarge, 
            fontWeight = FontWeight.Bold,
            color = TextGray900 // Gray-900 text (text-gray-900) - matches website
        )
        if (buttonText != null && onButtonClick != null) {
            TextButton(onClick = onButtonClick) {
                Text(text = buttonText, color = SecondaryColor) // Amber-600 - matches website
            }
        }
    }
}

@Composable
private fun EmptyState(
    title: String,
    subtitle: String? = null,
    buttonText: String? = null,
    onButtonClick: (() -> Unit)? = null
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Icon(
                imageVector = Icons.Default.CalendarToday,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge,
                color = TextGray500 // Gray-500 text (text-gray-500) - matches website
            )
            if (subtitle != null) {
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextGray400 // Gray-400 text (text-gray-400) - matches website
                )
            }
            if (buttonText != null && onButtonClick != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Button(
                    onClick = onButtonClick, colors = ButtonDefaults.buttonColors(
                        containerColor = SecondaryColor
                    )
                ) {
                    Text(text = buttonText)
                }
            }
        }
    }
}

@Composable
private fun QuickActionButtons(
    onBrowseTours: () -> Unit,
    onViewFestivals: () -> Unit,
    onMyFavorites: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Button(
            onClick = onBrowseTours, modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = SecondaryColor)
        ) {
            Text("Browse Tours")
        }
        Button(
            onClick = onViewFestivals, modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Green600)
        ) {
            Text("View Festivals")
        }
        Button(onClick = onMyFavorites, modifier = Modifier.fillMaxWidth()) {
            Icon(imageVector = Icons.Default.Favorite, contentDescription = null, modifier = Modifier.size(ButtonDefaults.IconSize))
            Spacer(Modifier.size(ButtonDefaults.IconSpacing))
            Text("My Favorites")
        }
    }
}

@Composable
private fun Footer() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Gray900, shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)) // Dark footer (bg-gray-900) - matches website
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            "Wolaita Tours", 
            style = MaterialTheme.typography.titleLarge, 
            fontWeight = FontWeight.Bold,
            color = Color.White // White text on dark footer - matches website
        )
        Text(
            "Discover the authentic beauty and rich culture of Wolaita Zone with our expert local guides.",
            color = TextGray300 // Light gray text (text-gray-300) - matches website
        )
        // Social media icons can be added here
        FooterSection(title = "Quick Links", links = listOf("Tours", "Festivals", "About Us", "Contact"))
        FooterSection(title = "Services", links = listOf("Cultural Tours", "Adventure Tours", "Religious Tours", "Festival Events"))
        FooterSection(title = "Contact Info", links = listOf("Sodo, Wolaita Zone, Ethiopia", "+251 9XX XXX XXX", "info@wolaitatours.com"))
        Text(
            "© 2024 Wolaita Tours. All rights reserved.", 
            style = MaterialTheme.typography.bodySmall,
            color = TextGray300 // Light gray text - matches website
        )
    }
}

@Composable
private fun FooterSection(title: String, links: List<String>) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = title, 
            style = MaterialTheme.typography.titleMedium, 
            fontWeight = FontWeight.Bold,
            color = Color.White // White text for footer titles - matches website
        )
        links.forEach { link ->
            Text(
                text = link, 
                style = MaterialTheme.typography.bodyMedium,
                color = TextGray300 // Light gray text for footer links (text-gray-300) - matches website
            )
        }
    }
}

@Composable
private fun BookingCard(
    booking: Booking,
    onClick: () -> Unit,
    hasReview: Boolean = false,
    onLeaveReview: (() -> Unit)? = null,
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = booking.tourName,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextGray900, // Gray-900 text (text-gray-900) - matches website
                    modifier = Modifier.weight(1f).clickable { onClick() }
                )
            }
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Date: ${formatDate(booking.tourDate)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "Price: $${String.format("%.2f", booking.totalPrice)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            // Show Leave Review button for completed bookings
            if (booking.status == BookingStatus.completed) {
                if (hasReview) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Review Submitted",
                            style = MaterialTheme.typography.bodySmall,
                            color = SuccessGreen,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                } else if (onLeaveReview != null) {
                    Button(
                        onClick = onLeaveReview,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = SecondaryColor
                        )
                    ) {
                        Icon(
                            imageVector = Icons.Filled.Star,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.size(8.dp))
                        Text("Leave Review")
                    }
                }
            }
        }
    }
}

@Composable
private fun ReviewCard(review: Review) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = review.tourName,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    repeat(review.rating) {
                        Icon(
                            imageVector = Icons.Filled.Star,
                            contentDescription = null,
                            tint = StarRating,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
            if (review.comment.isNotBlank()) {
                Text(
                    text = review.comment,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Text(
                text = "Reviewed on ${formatDate(review.createdAt)}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

private fun formatDate(timestamp: com.google.firebase.Timestamp?): String {
    if (timestamp == null) return "Not set"
    return try {
        val date = timestamp.toDate()
        SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(date)
    } catch (e: Exception) {
        "Invalid date"
    }
}
