package com.nutrimotion.cmp

import androidx.compose.ui.window.ComposeUIViewController

fun MainViewController() = ComposeUIViewController {
    AppConfig.apiBaseUrl = "https://localhost:3600"
    App()
}
