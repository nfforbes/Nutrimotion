package com.nutrimotion.cmp.ui.location

import androidx.compose.runtime.Composable

sealed interface LocationResult {
    data class Fix(val lat: Double, val lng: Double) : LocationResult
    data object Denied : LocationResult
    data object Unavailable : LocationResult
}

/**
 * Returns a function that asks for location permission (only the first time it's called)
 * and then reports the device's current position once.
 */
@Composable
expect fun rememberLocationRequester(onResult: (LocationResult) -> Unit): () -> Unit
