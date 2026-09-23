package com.nutrimotion.cmp.data.auth

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

private var appContext: Context? = null

fun initSecureStorage(context: Context) {
    appContext = context.applicationContext
}

actual fun createSecureTokenStorage(): SecureTokenStorage {
    val ctx = appContext ?: return MemoryTokenStorage()
    val prefs = createEncryptedPrefs(ctx)
    return object : SecureTokenStorage {
        override fun saveToken(token: String) {
            prefs.edit().putString("access_token", token).apply()
            TokenStore.set(token)
        }

        override fun readToken(): String? =
            prefs.getString("access_token", null)?.also { TokenStore.set(it) }

        override fun clear() {
            prefs.edit().remove("access_token").apply()
            TokenStore.clear()
        }
    }
}

private fun createEncryptedPrefs(context: Context): SharedPreferences {
    return try {
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        EncryptedSharedPreferences.create(
            context,
            "nutrimotion_tokens_encrypted",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM,
        )
    } catch (_: Exception) {
        context.getSharedPreferences("nutrimotion_tokens", Context.MODE_PRIVATE)
    }
}
