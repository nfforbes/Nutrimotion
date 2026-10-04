package com.nutrimotion.cmp

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.nutrimotion.cmp.data.auth.AndroidAuthBrowser
import com.nutrimotion.cmp.data.auth.createSecureTokenStorage
import com.nutrimotion.cmp.data.auth.initSecureStorage
import com.nutrimotion.cmp.push.AndroidPush

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        AppConfig.apiBaseUrl = BuildConfig.API_BASE_URL
        AppConfig.auth0Domain = BuildConfig.AUTH0_DOMAIN
        AppConfig.auth0ClientId = BuildConfig.AUTH0_CLIENT_ID
        AppConfig.auth0Audience = BuildConfig.AUTH0_AUDIENCE
        initSecureStorage(this)
        AndroidAuthBrowser.init(this)
        AndroidPush.init(this)
        createSecureTokenStorage().readToken()
        handleAuthRedirect(intent)
        setContent { App() }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleAuthRedirect(intent)
    }

    override fun onPause() {
        super.onPause()
        AndroidAuthBrowser.onHostPaused()
    }

    override fun onResume() {
        super.onResume()
        AndroidAuthBrowser.onHostResumed()
    }

    private fun handleAuthRedirect(intent: Intent?) {
        val data = intent?.data ?: return
        if (data.scheme == AppConfig.auth0Scheme) AndroidAuthBrowser.onRedirect(data)
    }
}
