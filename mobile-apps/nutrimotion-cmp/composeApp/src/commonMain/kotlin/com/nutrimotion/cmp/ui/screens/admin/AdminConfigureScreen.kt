package com.nutrimotion.cmp.ui.screens.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.nutrimotion.cmp.data.model.AppSettingsDto
import com.nutrimotion.cmp.data.model.DriveTestResult
import com.nutrimotion.cmp.data.model.DriveTestStep
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import kotlinx.coroutines.launch

private const val MS365 = "microsoft365"
private const val GOOGLE = "google_drive"

/** Secrets come back masked; sending them blank tells the server to keep the stored value. */
private val SECRET_KEYS = setOf("MS365_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN")

private val FIELD_LABELS = mapOf(
    "MS365_CLIENT_ID" to "Client ID",
    "MS365_CLIENT_SECRET" to "Client secret",
    "MS365_TENANT_ID" to "Tenant ID",
    "MS365_SHAREPOINT_SITE_ID" to "SharePoint site ID",
    "MS365_VIDEOS_FOLDER_PATH" to "Videos folder",
    "MS365_EMAIL_FROM" to "Send email from",
    "GOOGLE_CLIENT_ID" to "Client ID",
    "GOOGLE_CLIENT_SECRET" to "Client secret",
    "GOOGLE_REFRESH_TOKEN" to "Refresh token",
    "GOOGLE_DRIVE_FOLDER_ID" to "Drive folder ID",
)

private fun withoutSecrets(values: Map<String, String>) = values.mapValues { (k, v) -> if (k in SECRET_KEYS) "" else v }

@Composable
fun AdminConfigureScreen(repo: NutrimotionRepository) {
    AdminLoader(load = { repo.getAppSettings() }) { settings, _ ->
        var current by remember { mutableStateOf(settings) }
        var provider by remember { mutableStateOf(settings.fileStorageProvider) }
        var saving by remember { mutableStateOf(false) }
        var message by remember { mutableStateOf<String?>(null) }
        val scope = rememberCoroutineScope()

        Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            AdminCard("File storage") {
                MutedText("Where uploaded videos, recipes and books are stored.")
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    FilterChip(selected = provider == MS365, onClick = { provider = MS365 }, label = { Text("Microsoft 365") })
                    FilterChip(selected = provider == GOOGLE, onClick = { provider = GOOGLE }, label = { Text("Google Drive") })
                }
                Button(
                    enabled = !saving && provider != current.fileStorageProvider,
                    onClick = {
                        scope.launch {
                            saving = true
                            repo.saveAppSettings(
                                AppSettingsDto(
                                    fileStorageProvider = provider,
                                    ms365 = withoutSecrets(current.ms365),
                                    googleDrive = withoutSecrets(current.googleDrive),
                                ),
                            )
                                .onSuccess {
                                    current = it
                                    provider = it.fileStorageProvider
                                    message = "Saved"
                                }
                                .onFailure { message = it.friendlyMessage("Could not save settings") }
                            saving = false
                        }
                    },
                ) { Text(if (saving) "Saving…" else "Save") }
                message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
            }
            SettingsCard("Microsoft 365", current.ms365)
            SettingsCard("Google Drive", current.googleDrive) {
                var testing by remember { mutableStateOf(false) }
                var result by remember { mutableStateOf<DriveTestResult?>(null) }
                OutlinedButton(
                    enabled = !testing,
                    onClick = {
                        scope.launch {
                            testing = true
                            result = repo.testGoogleDrive().getOrElse { e ->
                                DriveTestResult(false, listOf(DriveTestStep("Test", false, e.friendlyMessage("Could not run the test"))))
                            }
                            testing = false
                        }
                    },
                ) { Text(if (testing) "Testing…" else "Test Google Drive connection") }
                result?.let { r ->
                    Text(
                        if (r.ok) "Google Drive is working." else "Google Drive test failed.",
                        color = if (r.ok) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                    )
                    r.steps.forEach { s -> MutedText("${if (s.ok) "✓" else "✗"} ${s.label}: ${s.detail}") }
                }
            }
            MutedText("Change keys and IDs on the website under Configure.")
        }
    }
}

@Composable
private fun SettingsCard(title: String, values: Map<String, String>, extra: @Composable () -> Unit = {}) {
    AdminCard(title) {
        values.forEach { (key, value) ->
            InfoRow(FIELD_LABELS[key] ?: key, value.ifBlank { "Not set" })
        }
        extra()
    }
}
