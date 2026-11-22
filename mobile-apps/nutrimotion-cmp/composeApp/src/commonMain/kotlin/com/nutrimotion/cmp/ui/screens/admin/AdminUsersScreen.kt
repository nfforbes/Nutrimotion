package com.nutrimotion.cmp.ui.screens.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.nutrimotion.cmp.data.model.Roles
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import com.nutrimotion.cmp.ui.components.PrimaryButton
import kotlinx.coroutines.launch

private val ROLE_LABELS = listOf(
    Roles.CLIENT to "Client",
    Roles.DRIVER to "Driver",
    Roles.ADMINISTRATOR to "Admin",
)

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AdminUsersScreen(repo: NutrimotionRepository) {
    var query by remember { mutableStateOf("") }
    var message by remember { mutableStateOf<String?>(null) }
    var inviteOpen by remember { mutableStateOf(false) }
    var inviteEmail by remember { mutableStateOf("") }
    var inviteName by remember { mutableStateOf("") }
    var inviteRoles by remember { mutableStateOf(listOf(Roles.CLIENT)) }
    var inviting by remember { mutableStateOf(false) }
    val pendingRoles = remember { mutableStateMapOf<String, List<String>>() }
    val scope = rememberCoroutineScope()

    AdminLoader(load = { repo.getAdminUsers() }) { users, reload ->
        val q = query.trim().lowercase()
        val shown = users.filter { q.isEmpty() || it.name.lowercase().contains(q) || it.email.lowercase().contains(q) }
        Column(modifier = Modifier.fillMaxSize()) {
            OutlinedTextField(
                value = query,
                onValueChange = { query = it },
                label = { Text("Search ${users.size} users") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
            )
            PrimaryButton(
                text = "Invite user",
                onClick = {
                    inviteEmail = ""
                    inviteName = ""
                    inviteRoles = listOf(Roles.CLIENT)
                    inviteOpen = true
                },
                modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp),
            )
            message?.let {
                Text(
                    it,
                    color = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp),
                )
            }
            LazyColumn(
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(shown, key = { it.id }) { user ->
                    val roles = pendingRoles[user.id] ?: user.roles
                    AdminCard {
                        Text(user.name.ifBlank { user.email }, fontWeight = FontWeight.SemiBold)
                        MutedText(listOfNotNull(user.email, user.createdAt?.let { "Joined ${formatDateTime(it, false)}" }).joinToString(" · "))
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            ROLE_LABELS.forEach { (role, label) ->
                                FilterChip(
                                    selected = role in roles,
                                    enabled = user.id !in pendingRoles,
                                    onClick = {
                                        val updated = if (role in roles) roles - role else roles + role
                                        if (updated.isEmpty()) {
                                            message = "A user needs at least one role."
                                            return@FilterChip
                                        }
                                        pendingRoles[user.id] = updated
                                        scope.launch {
                                            repo.updateUserRoles(user.id, updated)
                                                .onSuccess {
                                                    message = "Updated roles for ${user.name.ifBlank { user.email }}"
                                                    reload()
                                                }
                                                .onFailure { message = it.friendlyMessage("Could not change roles") }
                                            pendingRoles.remove(user.id)
                                        }
                                    },
                                    label = { Text(label) },
                                )
                            }
                        }
                    }
                }
            }
        }

        if (inviteOpen) {
            AlertDialog(
                onDismissRequest = { if (!inviting) inviteOpen = false },
                title = { Text("Invite user by email") },
                text = {
                    Column {
                        Text(
                            "We’ll create their account and Auth0 will email them a link to set a password.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Spacer(Modifier.height(12.dp))
                        OutlinedTextField(
                            value = inviteEmail,
                            onValueChange = { inviteEmail = it },
                            label = { Text("Email") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                        )
                        Spacer(Modifier.height(8.dp))
                        OutlinedTextField(
                            value = inviteName,
                            onValueChange = { inviteName = it },
                            label = { Text("Name (optional)") },
                            singleLine = true,
                            modifier = Modifier.fillMaxWidth(),
                        )
                        Spacer(Modifier.height(8.dp))
                        Text("Roles", style = MaterialTheme.typography.labelLarge)
                        FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            ROLE_LABELS.forEach { (role, label) ->
                                FilterChip(
                                    selected = role in inviteRoles,
                                    onClick = {
                                        inviteRoles = if (role in inviteRoles) {
                                            val next = inviteRoles - role
                                            if (next.isEmpty()) inviteRoles else next
                                        } else {
                                            inviteRoles + role
                                        }
                                    },
                                    label = { Text(label) },
                                )
                            }
                        }
                    }
                },
                confirmButton = {
                    TextButton(
                        enabled = !inviting && inviteEmail.trim().isNotEmpty() && inviteRoles.isNotEmpty(),
                        onClick = {
                            inviting = true
                            scope.launch {
                                val name = inviteName.trim().ifBlank { null }
                                repo.inviteUser(inviteEmail.trim(), name, inviteRoles)
                                    .onSuccess { result ->
                                        inviteOpen = false
                                        message = result.warning
                                            ?: if (result.emailSent) {
                                                "Invite sent to ${result.email}"
                                            } else {
                                                "Account created for ${result.email}, but the invite email could not be sent."
                                            }
                                        reload()
                                    }
                                    .onFailure { message = it.friendlyMessage("Could not invite that user") }
                                inviting = false
                            }
                        },
                    ) {
                        Text(if (inviting) "Sending…" else "Send invite")
                    }
                },
                dismissButton = {
                    TextButton(enabled = !inviting, onClick = { inviteOpen = false }) {
                        Text("Cancel")
                    }
                },
            )
        }
    }
}
