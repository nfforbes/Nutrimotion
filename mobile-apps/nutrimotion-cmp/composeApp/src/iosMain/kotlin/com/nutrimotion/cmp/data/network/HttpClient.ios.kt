package com.nutrimotion.cmp.data.network

import io.ktor.client.HttpClient
import io.ktor.client.engine.darwin.Darwin

actual fun createPlatformEngineClient(): HttpClient = HttpClient(Darwin)
