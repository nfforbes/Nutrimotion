package com.nutrimotion.cmp.data.network

import com.nutrimotion.cmp.AppConfig
import com.nutrimotion.cmp.data.auth.TokenStore
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.plugins.HttpTimeout
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logging
import io.ktor.client.request.delete
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.parameter
import io.ktor.client.request.patch
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

expect fun createPlatformEngineClient(): HttpClient

object ApiJson {
    val instance = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }
}

class ApiClient {
    val http: HttpClient = createPlatformEngineClient().config {
        expectSuccess = false
        install(ContentNegotiation) { json(ApiJson.instance) }
        install(HttpTimeout) {
            requestTimeoutMillis = 30_000
            connectTimeoutMillis = 15_000
        }
        install(Logging) { level = LogLevel.INFO }
        defaultRequest {
            contentType(ContentType.Application.Json)
            TokenStore.get()?.let { header(HttpHeaders.Authorization, "Bearer $it") }
        }
    }

    fun absoluteUrl(path: String): String {
        val base = AppConfig.apiBaseUrl.trimEnd('/')
        val p = path.trimStart('/')
        return "$base/$p"
    }

    suspend inline fun <reified T> get(
        path: String,
        parameters: Map<String, String> = emptyMap(),
    ): Result<T> = request {
        http.get(absoluteUrl(path)) {
            parameters.forEach { (k, v) -> parameter(k, v) }
        }
    }

    suspend inline fun <reified T, reified B> post(path: String, body: B): Result<T> = request {
        http.post(absoluteUrl(path)) { setBody(body) }
    }

    suspend inline fun <reified T, reified B> patch(path: String, body: B): Result<T> = request {
        http.patch(absoluteUrl(path)) { setBody(body) }
    }

    suspend inline fun <reified T, reified B> put(path: String, body: B): Result<T> = request {
        http.put(absoluteUrl(path)) { setBody(body) }
    }

    suspend inline fun <reified T> delete(path: String): Result<T> = request {
        http.delete(absoluteUrl(path))
    }

    suspend inline fun <reified T> request(block: suspend () -> HttpResponse): Result<T> =
        runCatching {
            val response = block()
            if (response.status == HttpStatusCode.Unauthorized) {
                throw ApiException(401, "Unauthorized")
            }
            if (!response.status.isSuccess()) {
                throw ApiException(response.status.value, response.bodyAsText())
            }
            response.body()
        }
}

class ApiException(val status: Int, message: String) : Exception(message)
