package com.wolaitatours.android.ui.contact

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.wolaitatours.android.R
import com.wolaitatours.android.ui.theme.WhiteBackground
import com.wolaitatours.android.ui.theme.TextGray900
import com.wolaitatours.android.ui.theme.TextGray600
import com.wolaitatours.android.ui.theme.TextGray700
import com.wolaitatours.android.ui.theme.SecondaryColor

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContactScreen(
    onBack: () -> Unit
) {
    val listState = rememberLazyListState()
    var name by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.contact_title), color = TextGray900) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = stringResource(R.string.action_back),
                            tint = TextGray900
                        )
                    }
                },
                colors = androidx.compose.material3.TopAppBarDefaults.topAppBarColors(
                    containerColor = WhiteBackground,
                    titleContentColor = TextGray900,
                    navigationIconContentColor = TextGray900
                )
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            state = listState,
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            item {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = stringResource(R.string.contact_title),
                        style = MaterialTheme.typography.headlineLarge,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = stringResource(R.string.contact_subtitle),
                        style = MaterialTheme.typography.titleMedium,
                        textAlign = TextAlign.Center,
                        color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                    )
                }
            }
            
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = WhiteBackground // White background (bg-white) - matches website
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            text = stringResource(R.string.contact_form_title),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.SemiBold,
                            color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                        )
                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text(stringResource(R.string.contact_name_label)) },
                            modifier = Modifier.fillMaxWidth(),
                            colors = TextFieldDefaults.outlinedTextFieldColors(
                                focusedTextColor = TextGray900,
                                unfocusedTextColor = TextGray900,
                                focusedLabelColor = TextGray700,
                                unfocusedLabelColor = TextGray600,
                                focusedBorderColor = SecondaryColor,
                                unfocusedBorderColor = TextGray600
                            )
                        )
                        OutlinedTextField(
                            value = email,
                            onValueChange = { email = it },
                            label = { Text(stringResource(R.string.contact_email_label)) },
                            modifier = Modifier.fillMaxWidth(),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                            colors = TextFieldDefaults.outlinedTextFieldColors(
                                focusedTextColor = TextGray900,
                                unfocusedTextColor = TextGray900,
                                focusedLabelColor = TextGray700,
                                unfocusedLabelColor = TextGray600,
                                focusedBorderColor = SecondaryColor,
                                unfocusedBorderColor = TextGray600
                            )
                        )
                        OutlinedTextField(
                            value = message,
                            onValueChange = { message = it },
                            label = { Text(stringResource(R.string.contact_message_label)) },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(120.dp),
                            maxLines = 4,
                            colors = TextFieldDefaults.outlinedTextFieldColors(
                                focusedTextColor = TextGray900,
                                unfocusedTextColor = TextGray900,
                                focusedLabelColor = TextGray700,
                                unfocusedLabelColor = TextGray600,
                                focusedBorderColor = SecondaryColor,
                                unfocusedBorderColor = TextGray600
                            )
                        )
                        Button(
                            onClick = { /* Handle send message */ },
                            modifier = Modifier.fillMaxWidth(),
                            colors = androidx.compose.material3.ButtonDefaults.buttonColors(
                                containerColor = SecondaryColor
                            )
                        ) {
                            Text(stringResource(R.string.contact_send_button))
                        }
                    }
                }
            }
            
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = WhiteBackground // White background (bg-white) - matches website
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            text = stringResource(R.string.contact_info_title),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.SemiBold,
                            color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                        )
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Column {
                                Text(
                                    text = stringResource(R.string.contact_address_label),
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Medium,
                                    color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                                )
                                Text(
                                    text = stringResource(R.string.contact_address_value),
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                                )
                            }
                            Column {
                                Text(
                                    text = stringResource(R.string.contact_phone_label),
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Medium,
                                    color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                                )
                                Text(
                                    text = stringResource(R.string.contact_phone_value),
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                                )
                            }
                            Column {
                                Text(
                                    text = stringResource(R.string.contact_email_label),
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Medium,
                                    color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                                )
                                Text(
                                    text = stringResource(R.string.contact_email_value),
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                                )
                            }
                            Column {
                                Text(
                                    text = stringResource(R.string.contact_hours_label),
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Medium,
                                    color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                                )
                                Text(
                                    text = stringResource(R.string.contact_hours_weekdays),
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                                )
                                Text(
                                    text = stringResource(R.string.contact_hours_saturday),
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                                )
                                Text(
                                    text = stringResource(R.string.contact_hours_sunday),
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                                )
                            }
                        }
                    }
                }
            }
            
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = WhiteBackground // White background (bg-white) - matches website
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            text = stringResource(R.string.contact_safety_title),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.SemiBold,
                            color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                        )
                        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                            Column {
                                Text(
                                    text = stringResource(R.string.contact_emergency_police),
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Medium,
                                    color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                                )
                                Text(
                                    text = "${stringResource(R.string.contact_emergency_phone_label)}: ${stringResource(R.string.contact_emergency_police_phone)}",
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                                )
                                Text(
                                    text = "${stringResource(R.string.contact_emergency_location_label)}: ${stringResource(R.string.contact_emergency_police_location)}",
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                                )
                            }
                            Column {
                                Text(
                                    text = stringResource(R.string.contact_emergency_hospital),
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Medium,
                                    color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                                )
                                Text(
                                    text = "${stringResource(R.string.contact_emergency_phone_label)}: ${stringResource(R.string.contact_emergency_hospital_phone)}",
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                                )
                                Text(
                                    text = "${stringResource(R.string.contact_emergency_location_label)}: ${stringResource(R.string.contact_emergency_hospital_location)}",
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                                )
                            }
                            Column {
                                Text(
                                    text = stringResource(R.string.contact_emergency_clinic),
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Medium,
                                    color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                                )
                                Text(
                                    text = "${stringResource(R.string.contact_emergency_phone_label)}: ${stringResource(R.string.contact_emergency_clinic_phone)}",
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                                )
                                Text(
                                    text = "${stringResource(R.string.contact_emergency_location_label)}: ${stringResource(R.string.contact_emergency_clinic_location)}",
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                                )
                            }
                            Column {
                                Text(
                                    text = stringResource(R.string.contact_emergency_redcross),
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Medium,
                                    color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                                )
                                Text(
                                    text = "${stringResource(R.string.contact_emergency_phone_label)}: ${stringResource(R.string.contact_emergency_redcross_phone)}",
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                                )
                                Text(
                                    text = "${stringResource(R.string.contact_emergency_service_label)}: ${stringResource(R.string.contact_emergency_redcross_service)}",
                                    style = MaterialTheme.typography.bodyLarge,
                                    color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

