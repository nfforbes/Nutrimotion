package com.nutrimotion.cmp.ui.map

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier

data class MapMarker(val lat: Double, val lng: Double, val label: String = "")

@Composable
expect fun TrackingMapView(
    modifier: Modifier = Modifier,
    markers: List<MapMarker>,
    centerLat: Double? = null,
    centerLng: Double? = null,
)
