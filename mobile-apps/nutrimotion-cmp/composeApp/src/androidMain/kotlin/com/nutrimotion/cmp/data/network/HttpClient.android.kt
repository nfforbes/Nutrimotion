package com.nutrimotion.cmp.data.network

import io.ktor.client.HttpClient
import io.ktor.client.engine.okhttp.OkHttp

actual fun createPlatformEngineClient(): HttpClient = HttpClient(OkHttp)
