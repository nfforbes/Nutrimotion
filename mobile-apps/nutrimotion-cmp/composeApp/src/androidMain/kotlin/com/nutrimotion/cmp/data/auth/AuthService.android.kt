package com.nutrimotion.cmp.data.auth

import android.content.Context
import android.content.Intent
import android.net.Uri
import java.security.MessageDigest
import java.security.SecureRandom
import kotlinx.coroutines.CompletableDeferred

actual fun createAuthService(): AuthService = Auth0PkceAuthService(AndroidAuthBrowser)

actual fun secureRandomBytes(size: Int): ByteArray = ByteArray(size).also { SecureRandom().nextBytes(it) }

actual fun sha256(input: ByteArray): ByteArray = MessageDigest.getInstance("SHA-256").digest(input)

/**
 * Opens Auth0 in the system browser. MainActivity forwards the redirect and its
 * pause/resume events so returning without signing in counts as a cancel.
 */
object AndroidAuthBrowser : AuthBrowser {
    private var appContext: Context? = null
    private var pending: CompletableDeferred<String>? = null
    private var leftApp = false

    fun init(context: Context) {
        appContext = context.applicationContext
    }

    override suspend fun authorize(url: String, callbackScheme: String): String {
        val context = checkNotNull(appContext) { "AndroidAuthBrowser.init was not called." }
        pending?.completeExceptionally(AuthCancelledException())
        val deferred = CompletableDeferred<String>()
        pending = deferred
        leftApp = false
        context.startActivity(
            Intent(Intent.ACTION_VIEW, Uri.parse(url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
        return try {
            deferred.await()
        } finally {
            if (pending === deferred) pending = null
        }
    }

    fun onRedirect(uri: Uri) {
        pending?.complete(uri.toString())
    }

    fun onHostPaused() {
        if (pending != null) leftApp = true
    }

    fun onHostResumed() {
        if (leftApp) pending?.completeExceptionally(AuthCancelledException())
    }
}
