package com.nutrimotion.cmp.data.auth

import com.nutrimotion.cmp.AppConfig

/**
 * Development auth: accepts a pasted Bearer token or uses an empty-login demo mode
 * when Auth0 native client is not configured yet.
 */
class DevAuthService : AuthService {
    override fun isConfigured(): Boolean =
        AppConfig.auth0ClientId.isNotBlank() &&
            !AppConfig.auth0ClientId.startsWith("REPLACE")

    override suspend fun login(): Result<String> {
        val existing = TokenStore.get()
        if (!existing.isNullOrBlank()) return Result.success(existing)
        return Result.failure(
            IllegalStateException(
                "Auth0 native client not configured. Set AppConfig.auth0ClientId " +
                    "or call TokenStore.set(<access_token>) for API testing."
            )
        )
    }

    override suspend fun logout() {
        TokenStore.clear()
    }

    override suspend fun getAccessToken(): String? = TokenStore.get()
}
