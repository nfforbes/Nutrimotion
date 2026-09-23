package com.nutrimotion.cmp.data.auth

/**
 * Platform auth (Auth0 native). Returns an access token for API Bearer auth.
 * Debug builds may use [DevAuthService] when Auth0 client IDs are placeholders.
 */
interface AuthService {
    suspend fun login(): Result<String>
    suspend fun logout()
    suspend fun getAccessToken(): String?
    fun isConfigured(): Boolean
}

expect fun createAuthService(): AuthService

/** In-memory / shared prefs token holder used by ApiClient. */
object TokenStore {
    private var token: String? = null

    fun set(token: String?) {
        this.token = token
    }

    fun get(): String? = token

    fun clear() {
        token = null
    }
}
