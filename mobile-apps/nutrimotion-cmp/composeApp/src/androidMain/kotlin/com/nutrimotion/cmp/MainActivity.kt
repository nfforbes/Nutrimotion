package com.nutrimotion.cmp

import com.nutrimotion.cmp.data.auth.createSecureTokenStorage
import com.nutrimotion.cmp.data.auth.initSecureStorage
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        AppConfig.apiBaseUrl = BuildConfig.API_BASE_URL
        AppConfig.auth0Domain = BuildConfig.AUTH0_DOMAIN
        AppConfig.auth0ClientId = BuildConfig.AUTH0_CLIENT_ID
        AppConfig.auth0Audience = BuildConfig.AUTH0_AUDIENCE
        initSecureStorage(this)
        createSecureTokenStorage().readToken()
        setContent { App() }
    }
}
