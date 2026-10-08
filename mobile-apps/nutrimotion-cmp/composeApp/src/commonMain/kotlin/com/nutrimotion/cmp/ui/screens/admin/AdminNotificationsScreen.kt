package com.nutrimotion.cmp.ui.screens.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.nutrimotion.cmp.data.model.PushRecipient
import com.nutrimotion.cmp.data.model.SendPushRequest
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import kotlinx.coroutines.launch

@Composable
fun AdminNotificationsScreen(repo: NutrimotionRepository) {
    AdminLoader(load = { repo.getAdminNotifications() }) { state, reload ->
        Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            WhatsAppCard(repo)
            SendCard(repo, state.configured.android || state.configured.ios, state.totalDevices, state.recipients, reload)
            AdminCard("Sent notifications") {
                if (state.history.isEmpty()) MutedText("Nothing sent yet.")
                state.history.forEachIndexed { i, row ->
                    if (i > 0) HorizontalDivider()
                    Row {
                        Text(row.title, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                        Text("${row.reached}/${row.devices}")
                    }
                    Text(row.message, style = MaterialTheme.typography.bodySmall)
                    MutedText(
                        "${if (row.target == "all") "Everyone" else row.userLabel ?: "One customer"} · ${formatDateTime(row.createdAt)}",
                    )
                }
            }
        }
    }
}

@Composable
private fun WhatsAppCard(repo: NutrimotionRepository) {
    var saved by remember { mutableStateOf("") }
    var value by remember { mutableStateOf("") }
    var message by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        repo.getAdminContact()
            .onSuccess {
                saved = it.whatsapp
                value = it.whatsapp
            }
            .onFailure { message = it.friendlyMessage("Could not load the WhatsApp number") }
    }

    AdminCard("WhatsApp number") {
        MutedText("Customers who tap WhatsApp in the website or app message this number. Include the country code.")
        OutlinedTextField(
            value = value,
            onValueChange = {
                value = it
                message = null
            },
            label = { Text("WhatsApp number") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            modifier = Modifier.fillMaxWidth(),
        )
        Button(
            enabled = value.isNotBlank() && value != saved,
            onClick = {
                scope.launch {
                    repo.saveAdminContact(value)
                        .onSuccess {
                            saved = it.whatsapp
                            value = it.whatsapp
                            message = "Saved. The website and app now use this number."
                        }
                        .onFailure { message = it.friendlyMessage("Could not save the number") }
                }
            },
        ) { Text("Save") }
        message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
    }
}

@Composable
private fun SendCard(
    repo: NutrimotionRepository,
    configured: Boolean,
    totalDevices: Int,
    recipients: List<PushRecipient>,
    onSent: () -> Unit,
) {
    var toEveryone by remember { mutableStateOf(false) }
    var recipient by remember { mutableStateOf<PushRecipient?>(null) }
    var menuOpen by remember { mutableStateOf(false) }
    var title by remember { mutableStateOf("") }
    var body by remember { mutableStateOf("") }
    var sending by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    AdminCard("Send a push notification") {
        if (!configured) MutedText("Push is not set up on the server yet.")
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            FilterChip(selected = !toEveryone, onClick = { toEveryone = false }, label = { Text("One customer") })
            FilterChip(selected = toEveryone, onClick = { toEveryone = true }, label = { Text("Everyone ($totalDevices phones)") })
        }
        if (!toEveryone) {
            Box {
                OutlinedButton(onClick = { menuOpen = true }, modifier = Modifier.fillMaxWidth()) {
                    Text(recipient?.let { "${it.name} (${it.email})" } ?: "Choose a customer")
                }
                DropdownMenu(expanded = menuOpen, onDismissRequest = { menuOpen = false }) {
                    if (recipients.isEmpty()) {
                        DropdownMenuItem(
                            text = { Text("No customers have enabled notifications yet") },
                            onClick = { menuOpen = false },
                        )
                    }
                    recipients.forEach { r ->
                        DropdownMenuItem(
                            text = { Text("${r.name} · ${r.devices} phone${if (r.devices == 1) "" else "s"}") },
                            onClick = {
                                recipient = r
                                menuOpen = false
                            },
                        )
                    }
                }
            }
        }
        OutlinedTextField(
            value = title,
            onValueChange = { title = it.take(100) },
            label = { Text("Title") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = body,
            onValueChange = { body = it.take(1000) },
            label = { Text("Message") },
            minLines = 3,
            modifier = Modifier.fillMaxWidth(),
        )
        Button(
            enabled = configured && !sending && title.isNotBlank() && body.isNotBlank() && (toEveryone || recipient != null),
            onClick = {
                scope.launch {
                    sending = true
                    message = null
                    repo.sendPush(
                        SendPushRequest(
                            target = if (toEveryone) "all" else "user",
                            userId = if (toEveryone) null else recipient?.id,
                            title = title.trim(),
                            message = body.trim(),
                        ),
                    )
                        .onSuccess { r ->
                            message = if (r.reached > 0) {
                                title = ""
                                body = ""
                                "Delivered to ${r.reached} of ${r.devices} phone${if (r.devices == 1) "" else "s"}."
                            } else {
                                "Not delivered (${r.failed} failed). ${r.errors.firstOrNull().orEmpty()}".trim()
                            }
                            onSent()
                        }
                        .onFailure { message = it.friendlyMessage("Could not send the notification") }
                    sending = false
                }
            },
        ) { Text(if (sending) "Sending…" else "Send notification") }
        message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
    }
}
