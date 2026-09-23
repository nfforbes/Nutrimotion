package com.nutrimotion.cmp.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val NutrimotionOrange = Color(0xFFEE4D24)
val NutrimotionBlack = Color(0xFF000000)
val NutrimotionWhite = Color(0xFFFFFFFF)
val NutrimotionGrayLight = Color(0xFFF5F5F5)
val NutrimotionTextMedium = Color(0xFF333333)

private val LightColors = lightColorScheme(
    primary = NutrimotionOrange,
    onPrimary = NutrimotionWhite,
    secondary = NutrimotionBlack,
    onSecondary = NutrimotionOrange,
    background = NutrimotionGrayLight,
    onBackground = NutrimotionBlack,
    surface = NutrimotionWhite,
    onSurface = NutrimotionBlack,
    error = Color(0xFFD32F2F),
)

private val DarkColors = darkColorScheme(
    primary = NutrimotionOrange,
    onPrimary = NutrimotionBlack,
    secondary = NutrimotionOrange,
    onSecondary = NutrimotionBlack,
    background = Color(0xFF121212),
    onBackground = NutrimotionWhite,
    surface = Color(0xFF1E1E1E),
    onSurface = NutrimotionWhite,
)

@Composable
fun NutrimotionTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content,
    )
}
