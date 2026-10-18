package com.nutrimotion.cmp.ui.map

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.unit.dp

@Composable
actual fun TrackingMapView(
    modifier: Modifier,
    markers: List<MapMarker>,
    centerLat: Double?,
    centerLng: Double?,
) {
    val uriHandler = LocalUriHandler.current
    val lat = centerLat ?: markers.firstOrNull()?.lat
    val lng = centerLng ?: markers.firstOrNull()?.lng
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.surfaceVariant)
            .padding(12.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        if (lat == null || lng == null) {
            Text("No location yet", style = MaterialTheme.typography.bodyMedium)
            return@Column
        }
        markers.forEach {
            Text(
                "${it.label.ifBlank { "Location" }}: ${"%.5f".format(it.lat)}, ${"%.5f".format(it.lng)}",
                style = MaterialTheme.typography.bodyMedium,
            )
        }
        TextButton(
            onClick = {
                runCatching { uriHandler.openUri("https://www.google.com/maps/search/?api=1&query=$lat,$lng") }
            },
        ) {
            Text("Open in Maps")
        }
    }
}
