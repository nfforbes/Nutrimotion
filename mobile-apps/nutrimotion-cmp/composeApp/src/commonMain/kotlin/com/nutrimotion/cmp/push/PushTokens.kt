package com.nutrimotion.cmp.push

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class PushToken(val value: String, val platform: String)

/**
 * Bridge between the platform push SDKs and shared code.
 * Platform code reports tokens with [update]; Android sets [permissionRequester]
 * so the notification prompt appears after sign-in rather than on first launch.
 */
object PushTokens {
    private val _token = MutableStateFlow<PushToken?>(null)
    val token: StateFlow<PushToken?> = _token.asStateFlow()

    var permissionRequester: (() -> Unit)? = null

    fun update(token: String, platform: String) {
        if (token.isNotBlank()) _token.value = PushToken(token, platform)
    }

    fun requestPermission() {
        permissionRequester?.invoke()
    }
}
