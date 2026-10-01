package com.nutrimotion.cmp.data.auth

import com.nutrimotion.cmp.AppConfig
import com.nutrimotion.cmp.data.network.ApiJson
import com.nutrimotion.cmp.data.network.createPlatformEngineClient
import io.ktor.client.request.forms.submitForm
import io.ktor.client.statement.bodyAsText
import io.ktor.http.Parameters
import io.ktor.http.decodeURLQueryComponent
import io.ktor.http.encodeURLParameter
import kotlin.io.encoding.Base64
import kotlin.io.encoding.ExperimentalEncodingApi
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Opens the Auth0 login page and returns the redirect URL it finishes on. */
interface AuthBrowser {
    suspend fun authorize(url: String, callbackScheme: String): String
}

expect fun secureRandomBytes(size: Int): ByteArray

expect fun sha256(input: ByteArray): ByteArray

class AuthCancelledException : Exception("Sign-in was cancelled.")

@Serializable
private data class TokenResponse(
    @SerialName("access_token") val accessToken: String? = null,
    val error: String? = null,
    @SerialName("error_description") val errorDescription: String? = null,
)

/** Auth0 Universal Login using the authorization code flow with PKCE. */
class Auth0PkceAuthService(private val browser: AuthBrowser) : AuthService {
    private val http by lazy { createPlatformEngineClient() }
    private val redirectUri get() = "${AppConfig.auth0Scheme}://callback"

    override fun isConfigured(): Boolean =
        AppConfig.auth0ClientId.isNotBlank() && !AppConfig.auth0ClientId.startsWith("REPLACE")

    override suspend fun login(): Result<String> = runCatching {
        check(isConfigured()) { "Sign-in is not configured for this build." }
        val verifier = base64Url(secureRandomBytes(32))
        val challenge = base64Url(sha256(verifier.encodeToByteArray()))
        val state = base64Url(secureRandomBytes(16))
        val query = listOf(
            "response_type" to "code",
            "client_id" to AppConfig.auth0ClientId,
            "redirect_uri" to redirectUri,
            "scope" to "openid profile email",
            "audience" to AppConfig.auth0Audience,
            "code_challenge" to challenge,
            "code_challenge_method" to "S256",
            "state" to state,
            "prompt" to "login",
        ).joinToString("&") { (key, value) -> "$key=${value.encodeURLParameter()}" }

        val callback = browser.authorize(
            "https://${AppConfig.auth0Domain}/authorize?$query",
            AppConfig.auth0Scheme,
        )
        val params = queryParams(callback)
        params["error"]?.let { error(params["error_description"] ?: it) }
        check(params["state"] == state) { "Sign-in response did not match the request." }
        val code = params["code"] ?: error("Sign-in did not return an authorization code.")
        exchangeCode(code, verifier)
    }

    override suspend fun logout() {
        TokenStore.clear()
    }

    override suspend fun getAccessToken(): String? = TokenStore.get()

    private suspend fun exchangeCode(code: String, verifier: String): String {
        val response = http.submitForm(
            url = "https://${AppConfig.auth0Domain}/oauth/token",
            formParameters = Parameters.build {
                append("grant_type", "authorization_code")
                append("client_id", AppConfig.auth0ClientId)
                append("code", code)
                append("code_verifier", verifier)
                append("redirect_uri", redirectUri)
            },
        )
        val text = response.bodyAsText()
        val body = ApiJson.instance.decodeFromString(TokenResponse.serializer(), text)
        return body.accessToken
            ?: error(body.errorDescription ?: body.error ?: "Sign-in failed (${response.status.value}).")
    }
}

@OptIn(ExperimentalEncodingApi::class)
private fun base64Url(bytes: ByteArray): String = Base64.UrlSafe.encode(bytes).trimEnd('=')

private fun queryParams(url: String): Map<String, String> =
    url.substringAfter('?', "")
        .substringBefore('#')
        .split('&')
        .filter { it.isNotEmpty() }
        .associate { part ->
            part.substringBefore('=').decodeURLQueryComponent() to
                part.substringAfter('=', "").decodeURLQueryComponent()
        }
