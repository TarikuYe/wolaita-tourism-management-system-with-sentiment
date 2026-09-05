package com.wolaitatours.android.ui.reviews

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
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

@Composable
fun ReviewScreen(
    viewModel: ReviewViewModel,
    bookingId: String,
    tourId: String,
    tourName: String,
    onReviewSubmitted: () -> Unit = {},
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val (rating, setRating) = remember { mutableStateOf("5") }
    val (comment, setComment) = remember { mutableStateOf("") }
    
    // Navigate back when review is successfully submitted
    androidx.compose.runtime.LaunchedEffect(state.isSubmitted) {
        if (state.isSubmitted) {
            onReviewSubmitted()
        }
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
                    .padding(vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Write a Review",
                    style = MaterialTheme.typography.headlineMedium,
                    color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                )
                Text(
                    text = tourName,
                    style = MaterialTheme.typography.titleMedium,
                    color = SecondaryColor // Amber-600 - matches website
                )
                OutlinedTextField(
                    value = rating,
                    onValueChange = setRating,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Rating (1-5)", color = TextGray700) },
                    colors = androidx.compose.material3.OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextGray900,
                        unfocusedTextColor = TextGray900,
                        focusedLabelColor = TextGray700,
                        unfocusedLabelColor = TextGray600,
                        focusedBorderColor = SecondaryColor,
                        unfocusedBorderColor = TextGray600
                    )
                )
                OutlinedTextField(
                    value = comment,
                    onValueChange = setComment,
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f, fill = false),
                    label = { Text("Comment", color = TextGray700) },
                    minLines = 5,
                    colors = androidx.compose.material3.OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextGray900,
                        unfocusedTextColor = TextGray900,
                        focusedLabelColor = TextGray700,
                        unfocusedLabelColor = TextGray600,
                        focusedBorderColor = SecondaryColor,
                        unfocusedBorderColor = TextGray600
                    )
                )
                Spacer(modifier = Modifier.weight(1f))
                Button(
                    onClick = { 
                        viewModel.submitReview(
                            bookingId = bookingId,
                            tourId = tourId,
                            tourName = tourName,
                            rating = rating.toIntOrNull() ?: 5,
                            comment = comment
                        )
                    },
                    enabled = !state.isLoading && comment.isNotBlank() && rating.toIntOrNull() in 1..5,
                    modifier = Modifier.fillMaxWidth(),
                    colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                        containerColor = SecondaryColor
                    )
                ) {
                    Text(if (state.isLoading) "Submitting..." else "Submit Review")
                }
                if (state.error != null) {
                    Text(
                        text = "Error: ${state.error}",
                        color = ErrorRed
                    )
                }
            }
        }
    }
}

