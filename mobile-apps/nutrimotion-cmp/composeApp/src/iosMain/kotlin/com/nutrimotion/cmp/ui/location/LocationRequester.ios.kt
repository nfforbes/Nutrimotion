package com.nutrimotion.cmp.ui.location

import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.useContents
import platform.CoreLocation.CLLocation
import platform.CoreLocation.CLLocationManager
import platform.CoreLocation.CLLocationManagerDelegateProtocol
import platform.CoreLocation.kCLAuthorizationStatusAuthorizedAlways
import platform.CoreLocation.kCLAuthorizationStatusAuthorizedWhenInUse
import platform.CoreLocation.kCLAuthorizationStatusDenied
import platform.CoreLocation.kCLAuthorizationStatusNotDetermined
import platform.CoreLocation.kCLAuthorizationStatusRestricted
import platform.CoreLocation.kCLLocationAccuracyBest
import platform.Foundation.NSError
import platform.darwin.NSObject

@Composable
actual fun rememberLocationRequester(onResult: (LocationResult) -> Unit): () -> Unit {
    val currentOnResult by rememberUpdatedState(onResult)
    val requester = remember { IosLocationRequester { currentOnResult(it) } }
    return { requester.request() }
}

@OptIn(ExperimentalForeignApi::class)
private class IosLocationRequester(
    private val onResult: (LocationResult) -> Unit,
) : NSObject(), CLLocationManagerDelegateProtocol {
    private val manager = CLLocationManager().apply { desiredAccuracy = kCLLocationAccuracyBest }
    private var pending = false

    init {
        manager.delegate = this
    }

    fun request() {
        pending = true
        when (manager.authorizationStatus) {
            kCLAuthorizationStatusNotDetermined -> manager.requestWhenInUseAuthorization()
            kCLAuthorizationStatusDenied, kCLAuthorizationStatusRestricted -> finish(LocationResult.Denied)
            else -> manager.requestLocation()
        }
    }

    private fun finish(result: LocationResult) {
        if (!pending) return
        pending = false
        onResult(result)
    }

    override fun locationManagerDidChangeAuthorization(manager: CLLocationManager) {
        if (!pending) return
        when (manager.authorizationStatus) {
            kCLAuthorizationStatusAuthorizedWhenInUse, kCLAuthorizationStatusAuthorizedAlways -> manager.requestLocation()
            kCLAuthorizationStatusDenied, kCLAuthorizationStatusRestricted -> finish(LocationResult.Denied)
            else -> Unit
        }
    }

    override fun locationManager(manager: CLLocationManager, didUpdateLocations: List<*>) {
        val location = didUpdateLocations.lastOrNull() as? CLLocation
        if (location == null) {
            finish(LocationResult.Unavailable)
            return
        }
        location.coordinate.useContents { finish(LocationResult.Fix(latitude, longitude)) }
    }

    override fun locationManager(manager: CLLocationManager, didFailWithError: NSError) {
        finish(LocationResult.Unavailable)
    }
}
