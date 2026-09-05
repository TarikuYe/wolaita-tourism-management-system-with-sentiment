package com.wolaitatours.android.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val LightColors = lightColorScheme(
    primary = Amber600, // Primary brand color (amber-600)
    secondary = Blue600, // Secondary brand color (blue-600)
    tertiary = TertiaryColor,
    background = Gray50, // Light gray background (bg-gray-50) - matches website
    surface = WhiteBackground, // White surface for cards (bg-white) - matches website
    surfaceVariant = Gray100, // Lighter gray for variant surfaces
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = TextGray900, // Dark text on light background (text-gray-900) - matches website
    onSurface = TextGray900, // Dark text on white surface (text-gray-900) - matches website
    onSurfaceVariant = TextGray700, // Dark gray text on variant surface (text-gray-700) - matches website
)

private val DarkColors = darkColorScheme(
    primary = Amber600, // Primary brand color (amber-600)
    secondary = Blue600, // Secondary brand color (blue-600)
    tertiary = TertiaryColor,
    background = Gray50, // Light gray background (bg-gray-50) - matches website
    surface = WhiteBackground, // White surface for cards (bg-white) - matches website
    surfaceVariant = Gray100, // Lighter gray for variant surfaces
    onPrimary = Color.White,
    onSecondary = Color.White,
    onBackground = TextGray900, // Dark text on light background (text-gray-900) - matches website
    onSurface = TextGray900, // Dark text on white surface (text-gray-900) - matches website
    onSurfaceVariant = TextGray700, // Dark gray text on variant surface (text-gray-700) - matches website
)

@Composable
fun WolaitaTheme(
    useDarkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (useDarkTheme) DarkColors else LightColors,
        typography = WolaitaTypography,
        content = content
    )
}

