package com.wolaitatours.android.ui.payment

import android.net.Uri
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.wolaitatours.android.data.model.ManualPaymentReceipt
import com.wolaitatours.android.ui.components.Container
import com.wolaitatours.android.ui.theme.TextGray900
import com.wolaitatours.android.ui.theme.TextGray600
import com.wolaitatours.android.ui.theme.TextGray700
import com.wolaitatours.android.ui.theme.SecondaryColor
import com.wolaitatours.android.ui.theme.ErrorRed
import com.wolaitatours.android.ui.theme.Gray50
import androidx.compose.foundation.background

@Composable
fun ManualPaymentScreen(
    viewModel: PaymentViewModel,
    bookingId: String,
    currency: String,
    amount: Double = 0.0,
    onPickImage: (onUri: (Uri?) -> Unit) -> Unit,
) {
    val state = viewModel.state.collectAsStateWithLifecycle()
    val (bank, setBank) = remember { mutableStateOf("") }
    val (account, setAccount) = remember { mutableStateOf("") }
    val (depositor, setDepositor) = remember { mutableStateOf("") }
    val (amountText, setAmountText) = remember { mutableStateOf(amount.toString()) }
    val (receiptUri, setReceiptUri) = remember { mutableStateOf<Uri?>(null) }

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
                    text = "Manual Payment",
                    style = MaterialTheme.typography.headlineMedium,
                    color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                )
                Text(
                    text = "Booking: $bookingId • Total: $currency $amount",
                    style = MaterialTheme.typography.bodyLarge,
                    color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                )
                OutlinedTextField(
                    value = bank,
                    onValueChange = setBank,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Bank name", color = TextGray700) },
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
                    value = account,
                    onValueChange = setAccount,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Account number", color = TextGray700) },
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
                    value = depositor,
                    onValueChange = setDepositor,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Depositor name", color = TextGray700) },
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
                    value = amountText,
                    onValueChange = setAmountText,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Amount", color = TextGray700) },
                    colors = androidx.compose.material3.OutlinedTextFieldDefaults.colors(
                        focusedTextColor = TextGray900,
                        unfocusedTextColor = TextGray900,
                        focusedLabelColor = TextGray700,
                        unfocusedLabelColor = TextGray600,
                        focusedBorderColor = SecondaryColor,
                        unfocusedBorderColor = TextGray600
                    )
                )
                Button(
                    onClick = {
                        onPickImage { uri -> setReceiptUri(uri) }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                        containerColor = SecondaryColor
                    )
                ) {
                    Text("Select receipt image")
                }
                if (receiptUri != null) {
                    Text(
                        text = "Receipt selected",
                        style = MaterialTheme.typography.bodySmall,
                        color = SecondaryColor
                    )
                }
                Spacer(modifier = Modifier.weight(1f))
                Button(
                    onClick = {
                        val payload = ManualPaymentReceipt(
                            bookingId = bookingId,
                            amount = amountText.toDoubleOrNull() ?: amount,
                            currency = currency,
                            bankName = bank,
                            accountNumber = account,
                            depositorName = depositor,
                            receiptImage = receiptUri?.toString(),
                        )
                        viewModel.submitManual(payload)
                    },
                    enabled = receiptUri != null,
                    modifier = Modifier.fillMaxWidth(),
                    colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                        containerColor = SecondaryColor
                    )
                ) {
                    Text("Submit receipt")
                }
                if (state.value.error != null) {
                    Text(
                        text = state.value.error ?: "",
                        color = ErrorRed
                    )
                }
            }
        }
    }
}

