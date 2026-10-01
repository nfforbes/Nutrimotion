@file:OptIn(ExperimentalForeignApi::class, ExperimentalUnsignedTypes::class)

package com.nutrimotion.cmp.data.auth

import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.addressOf
import kotlinx.cinterop.convert
import kotlinx.cinterop.usePinned
import kotlinx.coroutines.suspendCancellableCoroutine
import platform.AuthenticationServices.ASWebAuthenticationPresentationContextProvidingProtocol
import platform.AuthenticationServices.ASWebAuthenticationSession
import platform.CoreCrypto.CC_SHA256
import platform.CoreCrypto.CC_SHA256_DIGEST_LENGTH
import platform.Foundation.NSURL
import platform.Security.SecRandomCopyBytes
import platform.Security.kSecRandomDefault
import platform.UIKit.UIApplication
import platform.UIKit.UIWindow
import platform.darwin.NSObject

actual fun createAuthService(): AuthService = Auth0PkceAuthService(IosAuthBrowser)

actual fun secureRandomBytes(size: Int): ByteArray {
    val bytes = ByteArray(size)
    val status = bytes.usePinned { SecRandomCopyBytes(kSecRandomDefault, size.convert(), it.addressOf(0)) }
    check(status == 0) { "Could not generate secure random bytes ($status)." }
    return bytes
}

actual fun sha256(input: ByteArray): ByteArray {
    val digest = UByteArray(CC_SHA256_DIGEST_LENGTH)
    input.usePinned { src ->
        digest.usePinned { dst ->
            CC_SHA256(src.addressOf(0), input.size.convert(), dst.addressOf(0))
        }
    }
    return digest.asByteArray()
}

/** ASWebAuthenticationSessionErrorCodeCanceledLogin */
private const val CANCELED_LOGIN_CODE = 1L

private object IosAuthBrowser : AuthBrowser {
    private val anchorProvider = PresentationAnchorProvider()
    private var session: ASWebAuthenticationSession? = null

    override suspend fun authorize(url: String, callbackScheme: String): String =
        suspendCancellableCoroutine { cont ->
            val nsUrl = NSURL.URLWithString(url)
            if (nsUrl == null) {
                cont.resumeWithException(IllegalArgumentException("Invalid sign-in URL."))
                return@suspendCancellableCoroutine
            }
            val authSession = ASWebAuthenticationSession(nsUrl, callbackScheme) { callbackUrl, error ->
                session = null
                when {
                    callbackUrl != null -> cont.resume(callbackUrl.absoluteString.orEmpty())
                    error?.code == CANCELED_LOGIN_CODE -> cont.resumeWithException(AuthCancelledException())
                    else -> cont.resumeWithException(
                        IllegalStateException(error?.localizedDescription ?: "Sign-in failed.")
                    )
                }
            }
            authSession.presentationContextProvider = anchorProvider
            authSession.prefersEphemeralWebBrowserSession = true
            session = authSession
            cont.invokeOnCancellation { authSession.cancel() }
            if (!authSession.start()) {
                session = null
                cont.resumeWithException(IllegalStateException("Could not open sign-in."))
            }
        }
}

private class PresentationAnchorProvider :
    NSObject(),
    ASWebAuthenticationPresentationContextProvidingProtocol {
    override fun presentationAnchorForWebAuthenticationSession(
        session: ASWebAuthenticationSession,
    ): UIWindow = UIApplication.sharedApplication.keyWindow ?: UIWindow()
}
