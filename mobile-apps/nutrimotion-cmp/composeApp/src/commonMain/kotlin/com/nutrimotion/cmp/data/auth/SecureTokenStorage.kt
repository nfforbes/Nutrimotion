package com.nutrimotion.cmp.data.auth

/**
 * Secure token persistence (EncryptedSharedPreferences / Keychain).
 */
interface SecureTokenStorage {
    fun saveToken(token: String)
    fun readToken(): String?
    fun clear()
}

expect fun createSecureTokenStorage(): SecureTokenStorage

class MemoryTokenStorage : SecureTokenStorage {
    private var token: String? = null
    override fun saveToken(token: String) {
        this.token = token
    }

    override fun readToken(): String? = token

    override fun clear() {
        token = null
    }
}
