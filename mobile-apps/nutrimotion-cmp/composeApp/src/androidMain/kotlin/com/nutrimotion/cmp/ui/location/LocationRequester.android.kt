package com.nutrimotion.cmp.ui.location

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.Looper
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.platform.LocalContext

private val LOCATION_PERMISSIONS = arrayOf(
    Manifest.permission.ACCESS_FINE_LOCATION,
    Manifest.permission.ACCESS_COARSE_LOCATION,
)

@Composable
actual fun rememberLocationRequester(onResult: (LocationResult) -> Unit): () -> Unit {
    val context = LocalContext.current
    val currentOnResult by rememberUpdatedState(onResult)
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { grants ->
        if (grants.values.any { it }) {
            fetchCurrentLocation(context) { currentOnResult(it) }
        } else {
            currentOnResult(LocationResult.Denied)
        }
    }
    return {
        if (hasLocationPermission(context)) {
            fetchCurrentLocation(context) { currentOnResult(it) }
        } else {
            launcher.launch(LOCATION_PERMISSIONS)
        }
    }
}

private fun hasLocationPermission(context: Context): Boolean =
    LOCATION_PERMISSIONS.any { context.checkSelfPermission(it) == PackageManager.PERMISSION_GRANTED }

private fun Location.toResult() = LocationResult.Fix(latitude, longitude)

@SuppressLint("MissingPermission")
private fun fetchCurrentLocation(context: Context, onResult: (LocationResult) -> Unit) {
    val manager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
    val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
        .filter { runCatching { manager?.isProviderEnabled(it) == true }.getOrDefault(false) }
    if (manager == null || providers.isEmpty()) {
        onResult(LocationResult.Unavailable)
        return
    }

    fun lastKnown(): LocationResult =
        providers.mapNotNull { runCatching { manager.getLastKnownLocation(it) }.getOrNull() }
            .maxByOrNull { it.time }
            ?.toResult()
            ?: LocationResult.Unavailable

    val provider = providers.first()
    try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            manager.getCurrentLocation(provider, null, context.mainExecutor) { location ->
                onResult(location?.toResult() ?: lastKnown())
            }
        } else {
            @Suppress("DEPRECATION")
            manager.requestSingleUpdate(
                provider,
                object : LocationListener {
                    override fun onLocationChanged(location: Location) = onResult(location.toResult())

                    @Deprecated("Required on older Android versions")
                    override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) = Unit
                    override fun onProviderDisabled(provider: String) = onResult(lastKnown())
                },
                Looper.getMainLooper(),
            )
        }
    } catch (e: SecurityException) {
        onResult(LocationResult.Denied)
    }
}
