package com.nutrimotion.cmp.data.auth

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

/**
 * Platform auth (Auth0 native). Returns an access token for API Bearer auth.
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
    private val _unauthorized = MutableSharedFlow<Unit>(extraBufferCapacity = 1)

    /** Emits when the API rejects the current token (401). */
    val unauthorized: SharedFlow<Unit> = _unauthorized.asSharedFlow()

    fun set(token: String?) {
        this.token = token
    }

    fun get(): String? = token

    fun clear() {
        token = null
    }

    fun notifyUnauthorized() {
        token = null
        _unauthorized.tryEmit(Unit)
    }
}
