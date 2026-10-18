package com.nutrimotion.cmp.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import com.nutrimotion.cmp.AppConfig

fun privacyPolicyUrl(): String = "${AppConfig.apiBaseUrl.trimEnd('/')}/privacy"

fun termsUrl(): String = "${AppConfig.apiBaseUrl.trimEnd('/')}/terms"

@Composable
fun LegalLinks(modifier: Modifier = Modifier, color: Color = Color.Unspecified) {
    val uriHandler = LocalUriHandler.current
    Row(modifier = modifier, horizontalArrangement = Arrangement.Center) {
        TextButton(onClick = { uriHandler.openUri(privacyPolicyUrl()) }) {
            Text("Privacy Policy", style = MaterialTheme.typography.bodySmall, color = color)
        }
        TextButton(onClick = { uriHandler.openUri(termsUrl()) }) {
            Text("Terms of Use", style = MaterialTheme.typography.bodySmall, color = color)
        }
    }
}
