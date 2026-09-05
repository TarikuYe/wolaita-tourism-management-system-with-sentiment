package com.wolaitatours.android.ui.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.widthIn
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

/**
 * Container component that centers content and limits max width (similar to max-w-7xl in web)
 * This ensures content is properly centered and doesn't stretch too wide on large screens
 */
@Composable
fun Container(
    modifier: Modifier = Modifier,
    maxWidth: androidx.compose.ui.unit.Dp = 1280.dp, // Equivalent to max-w-7xl
    content: @Composable () -> Unit
) {
    Box(
        modifier = modifier.fillMaxWidth(),
        contentAlignment = Alignment.Center
    ) {
        Box(
            modifier = Modifier.widthIn(max = maxWidth)
        ) {
            content()
        }
    }
}

