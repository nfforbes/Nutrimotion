package com.nutrimotion.cmp.data.auth

import com.nutrimotion.cmp.AppConfig

/**
 * Android AuthService. Uses [DevAuthService] until Auth0.Android is wired.
 * Replace this actual with Auth0 Universal Login when client IDs are configured.
 */
actual fun createAuthService(): AuthService {
    if (AppConfig.auth0ClientId.isNotBlank() &&
        !AppConfig.auth0ClientId.startsWith("REPLACE")
    ) {
        // Auth0.Android integration point — fall through to DevAuthService until SDK wired.
    }
    return DevAuthService()
}
