package com.wolaitatours.android.ui.booking

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.wolaitatours.android.ui.components.Container
import com.wolaitatours.android.ui.theme.TextGray900
import com.wolaitatours.android.ui.theme.TextGray600
import com.wolaitatours.android.ui.theme.TextGray700
import com.wolaitatours.android.ui.theme.SecondaryColor
import com.wolaitatours.android.ui.theme.ErrorRed
import com.wolaitatours.android.ui.theme.Gray50
import androidx.compose.foundation.background

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BookingScreen(
    viewModel: BookingViewModel,
    tourName: String,
    agencyId: String,
    agencyName: String,
    basePrice: Double,
    onPaymentRequested: (String, Double, String) -> Unit,
) {
    val state by viewModel.formState.collectAsStateWithLifecycle()
    LaunchedEffect(basePrice) {
        viewModel.updateBasePrice(basePrice)
    }
    Box(
        modifier = Modifier
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
                    .padding(vertical = 16.dp, horizontal = 0.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Book Tour",
                    style = MaterialTheme.typography.headlineMedium,
                    color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                )
                Text(
                    text = tourName,
                    style = MaterialTheme.typography.titleMedium,
                    color = SecondaryColor // Amber-600 - matches website
                )
                OutlinedTextField(
                    value = state.participants.toString(),
                    onValueChange = { value ->
                        value.toIntOrNull()?.let { viewModel.updateParticipants(it) }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Number of travelers", color = TextGray700) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextGray900,
                        unfocusedTextColor = TextGray900,
                        focusedLabelColor = TextGray700,
                        unfocusedLabelColor = TextGray600,
                        focusedBorderColor = SecondaryColor,
                        unfocusedBorderColor = TextGray600
                    )
                )
                OutlinedTextField(
                    value = state.specialRequests,
                    onValueChange = viewModel::updateSpecialRequest,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Special requests", color = TextGray700) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextGray900,
                        unfocusedTextColor = TextGray900,
                        focusedLabelColor = TextGray700,
                        unfocusedLabelColor = TextGray600,
                        focusedBorderColor = SecondaryColor,
                        unfocusedBorderColor = TextGray600
                    )
                )
                Text(
                    text = "Total price: ETB ${state.totalPrice}",
                    style = MaterialTheme.typography.headlineSmall,
                    color = SecondaryColor // Amber-600 - matches website
                )
                // Show error message if booking failed
                if (state.status is FormStatus.Error) {
                    Text(
                        text = "Error: ${(state.status as FormStatus.Error).message ?: "Failed to create booking"}",
                        color = ErrorRed
                    )
                }
                Spacer(modifier = Modifier.weight(1f))
                // Only show "Confirm booking" button when booking is not yet successful
                if (state.status !is FormStatus.Success) {
                    Button(
                        onClick = { viewModel.submitBooking(tourName, agencyId, agencyName) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp),
                        enabled = state.status !is FormStatus.Loading,
                        colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                            containerColor = SecondaryColor
                        )
                    ) {
                        Text(if (state.status is FormStatus.Loading) "Processing..." else "Confirm booking")
                    }
                }
                // Show "Proceed to payment" button only after successful booking
                if (state.status is FormStatus.Success) {
                    val bookingId = (state.status as FormStatus.Success).bookingId
                    Button(
                        onClick = { onPaymentRequested(bookingId, state.totalPrice, tourName) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp),
                        colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                            containerColor = SecondaryColor
                        )
                    ) {
                        Text("Proceed to payment")
                    }
                }
            }
        }
    }
}
