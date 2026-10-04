package com.nutrimotion.cmp

import androidx.compose.ui.window.ComposeUIViewController
import com.nutrimotion.cmp.push.installIosPushRequester
import platform.Foundation.NSBundle
import platform.UIKit.UIViewController

fun MainViewController(): UIViewController {
    (NSBundle.mainBundle.objectForInfoDictionaryKey("API_BASE_URL") as? String)
        ?.takeIf { it.startsWith("http") }
        ?.let { AppConfig.apiBaseUrl = it }
    installIosPushRequester()
    return ComposeUIViewController { App() }
}
