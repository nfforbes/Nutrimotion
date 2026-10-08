package com.nutrimotion.cmp.ui.screens.admin

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.nutrimotion.cmp.data.model.AdminCouponDto
import com.nutrimotion.cmp.data.model.ClientRef
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import kotlinx.coroutines.launch

private fun discountText(c: AdminCouponDto): String {
    val value = if (c.type == "percentage") "${c.value.toInt()}% off" else "${formatMoney(c.value)} off"
    val extras = listOfNotNull(
        c.minOrderAmount?.let { "min ${formatMoney(it)}" },
        c.maxDiscount?.let { "max ${formatMoney(it)}" },
    )
    return (listOf(value) + extras).joinToString(" · ")
}

@Composable
fun AdminCouponsScreen(repo: NutrimotionRepository) {
    var sendingFor by remember { mutableStateOf<AdminCouponDto?>(null) }
    var message by remember { mutableStateOf<String?>(null) }
    val overrides = remember { mutableStateMapOf<String, Boolean>() }
    val scope = rememberCoroutineScope()

    val sending = sendingFor
    if (sending != null) {
        SendCoupon(repo, sending, onDone = { result ->
            result?.let { message = it }
            sendingFor = null
        })
        return
    }

    AdminLoader(load = { repo.getAdminCoupons() }) { coupons, reload ->
        Column(modifier = Modifier.fillMaxSize()) {
            Text(
                "Switch coupons on or off, or send one to clients. Create or edit coupons on the website.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(16.dp),
            )
            message?.let {
                Text(it, color = MaterialTheme.colorScheme.primary, modifier = Modifier.padding(horizontal = 16.dp))
            }
            LazyColumn(
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                if (coupons.isEmpty()) item { MutedText("No coupons yet.") }
                items(coupons, key = { it.id }) { c ->
                    val active = overrides[c.id] ?: c.active
                    AdminCard {
                        Row {
                            Text(c.code, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                            Text(discountText(c))
                        }
                        Text(c.description, style = MaterialTheme.typography.bodySmall)
                        MutedText(
                            listOfNotNull(
                                "Valid ${formatDateTime(c.validFrom, false)} – ${formatDateTime(c.validUntil, false)}",
                                "Used ${c.usageCount}${c.usageLimit?.let { " of $it" } ?: ""}",
                            ).joinToString(" · "),
                        )
                        SwitchRow("Active", active) { on ->
                            overrides[c.id] = on
                            scope.launch {
                                repo.setCouponActive(c.id, on)
                                    .onSuccess { reload() }
                                    .onFailure {
                                        overrides.remove(c.id)
                                        message = it.friendlyMessage("Could not update ${c.code}")
                                    }
                            }
                        }
                        OutlinedButton(onClick = {
                            message = null
                            sendingFor = c
                        }) { Text("Send to clients") }
                    }
                }
            }
        }
    }
}

@Composable
private fun SendCoupon(repo: NutrimotionRepository, coupon: AdminCouponDto, onDone: (String?) -> Unit) {
    var clients by remember { mutableStateOf<List<ClientRef>?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var query by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    val picked = remember { mutableStateMapOf<String, Boolean>() }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        repo.getCouponClients()
            .onSuccess { clients = it }
            .onFailure { error = it.friendlyMessage("Could not load clients") }
    }

    val q = query.trim().lowercase()
    val shown = clients.orEmpty().filter { q.isEmpty() || it.name.lowercase().contains(q) || it.email.lowercase().contains(q) }
    val selectedIds = picked.filterValues { it }.keys.toList()

    Column(modifier = Modifier.fillMaxSize().padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
        TextButton(onClick = { onDone(null) }) { Text("← Coupons") }
        Text("Send ${coupon.code}", style = MaterialTheme.typography.headlineSmall)
        MutedText("Clients see it under their coupons at checkout.")
        OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            label = { Text("Search clients") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Button(
            enabled = selectedIds.isNotEmpty() && !busy,
            modifier = Modifier.fillMaxWidth(),
            onClick = {
                scope.launch {
                    busy = true
                    repo.sendCoupon(coupon.id, selectedIds)
                        .onSuccess { r ->
                            onDone(
                                "Sent ${coupon.code} to ${r.sent} client${if (r.sent == 1) "" else "s"}" +
                                    if (r.alreadySent > 0) " (${r.alreadySent} already had it)" else "",
                            )
                        }
                        .onFailure { error = it.friendlyMessage("Could not send the coupon") }
                    busy = false
                }
            },
        ) { Text(if (busy) "Sending…" else "Send to ${selectedIds.size} selected") }
        LazyColumn(modifier = Modifier.fillMaxWidth()) {
            items(shown, key = { it.id }) { client ->
                val checked = picked[client.id] == true
                Row(
                    modifier = Modifier.fillMaxWidth().clickable { picked[client.id] = !checked }.padding(vertical = 2.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Checkbox(checked = checked, onCheckedChange = { picked[client.id] = it })
                    Column {
                        Text(client.name.ifBlank { client.email })
                        MutedText(client.email)
                    }
                }
            }
        }
    }
}
