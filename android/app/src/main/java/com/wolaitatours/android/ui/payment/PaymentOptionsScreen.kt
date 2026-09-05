package com.wolaitatours.android.ui.payment

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.wolaitatours.android.ui.components.Container
import com.wolaitatours.android.ui.theme.TextGray900
import com.wolaitatours.android.ui.theme.SecondaryColor
import com.wolaitatours.android.ui.theme.ErrorRed
import com.wolaitatours.android.ui.theme.Gray50
import androidx.compose.foundation.background

@Composable
fun PaymentOptionsScreen(
    onOnlinePayment: () -> Unit,
    onManualPayment: () -> Unit,
    isLoading: Boolean = false,
    error: String? = null,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Gray50) // Light gray background (bg-gray-50) - matches website
    ) {
        Container(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(vertical = 24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Payment Options",
                    style = MaterialTheme.typography.headlineMedium,
                    color = TextGray900, // Gray-900 text (text-gray-900) - matches website
                    modifier = Modifier.padding(bottom = 8.dp)
                )
                
                // Show error message if any
                if (error != null) {
                    Text(
                        text = error,
                        color = ErrorRed,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                }
                
                Spacer(modifier = Modifier.weight(1f))
                
                if (isLoading) {
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                } else {
                    Button(
                        onClick = onOnlinePayment,
                        modifier = Modifier.fillMaxWidth(),
                        enabled = error == null,
                        colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                            containerColor = SecondaryColor
                        )
                    ) {
                        Text("Pay with Chapa")
                    }
                    Button(
                        onClick = onManualPayment,
                        modifier = Modifier.fillMaxWidth(),
                        enabled = error == null,
                        colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                            containerColor = SecondaryColor
                        )
                    ) {
                        Text("Upload Manual Receipt")
                    }
                }
            }
        }
    }
}

