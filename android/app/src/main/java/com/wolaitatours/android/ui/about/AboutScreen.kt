package com.wolaitatours.android.ui.about

import androidx.compose.foundation.background
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
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.wolaitatours.android.R
import com.wolaitatours.android.ui.theme.WhiteBackground
import com.wolaitatours.android.ui.theme.TextGray900
import com.wolaitatours.android.ui.theme.TextGray600
import com.wolaitatours.android.ui.theme.TextGray700

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AboutScreen(
    onBack: () -> Unit
) {
    val listState = rememberLazyListState()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.about_title), color = TextGray900) },
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
                        text = stringResource(R.string.about_title),
                        style = MaterialTheme.typography.headlineLarge,
                        fontWeight = FontWeight.Bold,
                        textAlign = TextAlign.Center,
                        color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = stringResource(R.string.about_description),
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
                            text = stringResource(R.string.about_mission_title),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.SemiBold,
                            color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                        )
                        Text(
                            text = stringResource(R.string.about_mission_text),
                            style = MaterialTheme.typography.bodyLarge,
                            color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                        )
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
                            text = stringResource(R.string.about_why_choose_us_title),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.SemiBold,
                            color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                        )
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                text = "• ${stringResource(R.string.about_why_choose_us_item1)}",
                                style = MaterialTheme.typography.bodyLarge,
                                color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                            )
                            Text(
                                text = "• ${stringResource(R.string.about_why_choose_us_item2)}",
                                style = MaterialTheme.typography.bodyLarge,
                                color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                            )
                            Text(
                                text = "• ${stringResource(R.string.about_why_choose_us_item3)}",
                                style = MaterialTheme.typography.bodyLarge,
                                color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                            )
                            Text(
                                text = "• ${stringResource(R.string.about_why_choose_us_item4)}",
                                style = MaterialTheme.typography.bodyLarge,
                                color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                            )
                            Text(
                                text = "• ${stringResource(R.string.about_why_choose_us_item5)}",
                                style = MaterialTheme.typography.bodyLarge,
                                color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                            )
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
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        Text(
                            text = stringResource(R.string.about_tourism_title),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.SemiBold,
                            textAlign = TextAlign.Center,
                            color = TextGray900 // Gray-900 text (text-gray-900) - matches website
                        )
                        Text(
                            text = stringResource(R.string.about_total_tourists),
                            style = MaterialTheme.typography.bodyMedium,
                            textAlign = TextAlign.Center,
                            color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                        )
                        Text(
                            text = stringResource(R.string.about_foreign_tourists),
                            style = MaterialTheme.typography.bodyMedium,
                            textAlign = TextAlign.Center,
                            color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                        )
                        Text(
                            text = stringResource(R.string.about_local_tourists),
                            style = MaterialTheme.typography.bodyMedium,
                            textAlign = TextAlign.Center,
                            color = TextGray600 // Gray-600 text (text-gray-600) - matches website
                        )
                    }
                }
            }
        }
    }
}

