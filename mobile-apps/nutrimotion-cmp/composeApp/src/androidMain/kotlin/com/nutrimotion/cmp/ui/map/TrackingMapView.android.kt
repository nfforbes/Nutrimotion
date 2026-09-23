package com.nutrimotion.cmp.ui.map

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
actual fun TrackingMapView(
    modifier: Modifier,
    markers: List<MapMarker>,
    centerLat: Double?,
    centerLng: Double?,
) {
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .padding(12.dp),
        contentAlignment = Alignment.Center,
    ) {
        val summary = buildString {
            append("Map preview\n")
            if (centerLat != null && centerLng != null) {
                append("Center: %.4f, %.4f\n".format(centerLat, centerLng))
            }
            markers.forEach { append("${it.label.ifBlank { "pin" }}: ${it.lat}, ${it.lng}\n") }
            if (markers.isEmpty()) append("No location points yet")
        }
        Text(summary, style = MaterialTheme.typography.bodyMedium)
    }
}
