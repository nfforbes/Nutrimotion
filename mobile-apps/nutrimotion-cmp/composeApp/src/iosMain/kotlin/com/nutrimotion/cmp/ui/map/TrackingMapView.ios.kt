package com.nutrimotion.cmp.ui.map

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.UIKitView
import kotlinx.cinterop.ExperimentalForeignApi
import platform.CoreLocation.CLLocationCoordinate2DMake
import platform.MapKit.MKCoordinateRegionMakeWithDistance
import platform.MapKit.MKMapView
import platform.MapKit.MKPointAnnotation

private const val JAMAICA_LAT = 18.1096
private const val JAMAICA_LNG = -77.2975

@OptIn(ExperimentalForeignApi::class)
@Composable
actual fun TrackingMapView(
    modifier: Modifier,
    markers: List<MapMarker>,
    centerLat: Double?,
    centerLng: Double?,
) {
    UIKitView(
        factory = { MKMapView() },
        modifier = modifier,
        update = { map ->
            map.removeAnnotations(map.annotations)
            map.addAnnotations(
                markers.map { marker ->
                    MKPointAnnotation().apply {
                        setCoordinate(CLLocationCoordinate2DMake(marker.lat, marker.lng))
                        setTitle(marker.label.ifBlank { null })
                    }
                },
            )

            val lat = centerLat ?: markers.firstOrNull()?.lat
            val lng = centerLng ?: markers.firstOrNull()?.lng
            val region = if (lat != null && lng != null) {
                MKCoordinateRegionMakeWithDistance(CLLocationCoordinate2DMake(lat, lng), 1_500.0, 1_500.0)
            } else {
                MKCoordinateRegionMakeWithDistance(
                    CLLocationCoordinate2DMake(JAMAICA_LAT, JAMAICA_LNG),
                    250_000.0,
                    250_000.0,
                )
            }
            map.setRegion(region, animated = true)
        },
    )
}
