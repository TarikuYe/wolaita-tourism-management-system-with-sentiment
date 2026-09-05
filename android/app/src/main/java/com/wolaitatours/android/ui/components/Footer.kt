package com.wolaitatours.android.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.wolaitatours.android.ui.theme.TertiaryColor

@Composable
fun Footer() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                TertiaryColor, // Dark blue/grey footer background (matches website)
                shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)
            )
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            "Wolaita Tours",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = Color.White
        )
        Text(
            "Discover the authentic beauty and rich culture of Wolaita Zone with our expert local guides.",
            color = Color.White
        )
        // Social media icons can be added here
        FooterSection(title = "Quick Links", links = listOf("Tours", "Festivals", "About Us", "Contact"))
        FooterSection(title = "Services", links = listOf("Cultural Tours", "Adventure Tours", "Religious Tours", "Festival Events"))
        FooterSection(
            title = "Contact Info",
            links = listOf("Sodo, Wolaita Zone, Ethiopia", "+251 9XX XXX XXX", "info@wolaitatours.com")
        )
        Text(
            "© 2024 Wolaita Tours. All rights reserved.",
            style = MaterialTheme.typography.bodySmall,
            color = Color.White
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
            color = Color.White
        )
        links.forEach { link ->
            Text(
                text = link,
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White
            )
        }
    }
}
