package com.nutrimotion.cmp.ui.screens.admin

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.nutrimotion.cmp.data.model.OrderStatusRequest
import com.nutrimotion.cmp.data.model.OrderStatuses
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import kotlinx.coroutines.launch

private val NEXT_STATUS = mapOf(
    OrderStatuses.PREPARING to OrderStatuses.OUT_FOR_DELIVERY,
    OrderStatuses.PURCHASED to OrderStatuses.OUT_FOR_DELIVERY,
    OrderStatuses.OUT_FOR_DELIVERY to OrderStatuses.DELIVERED,
)

@Composable
fun AdminDeliveriesScreen(repo: NutrimotionRepository, canUpdate: Boolean) {
    var showDone by remember { mutableStateOf(false) }
    var busyId by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    AdminLoader(load = { repo.getAssignments() }) { assignments, reload ->
        val done = setOf(OrderStatuses.DELIVERED, OrderStatuses.CANCELLED)
        val shown = assignments.filter { (it.status in done) == showDone }
        Column(modifier = Modifier.fillMaxSize()) {
            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                FilterChip(
                    selected = !showDone,
                    onClick = { showDone = false },
                    label = { Text("In progress ${assignments.count { it.status !in done }}") },
                )
                FilterChip(
                    selected = showDone,
                    onClick = { showDone = true },
                    label = { Text("Completed ${assignments.count { it.status in done }}") },
                )
            }
            message?.let {
                Text(it, color = MaterialTheme.colorScheme.primary, modifier = Modifier.padding(horizontal = 16.dp))
            }
            LazyColumn(
                contentPadding = PaddingValues(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                if (shown.isEmpty()) item { MutedText("No deliveries here.") }
                items(shown, key = { it.id }) { a ->
                    AdminCard {
                        Row {
                            Text("#${a.orderNumber ?: "—"}", fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                            Text(OrderStatuses.label(a.status))
                        }
                        Text("Driver: ${a.driverName ?: "Unknown"}")
                        a.deliveryAddress?.let { MutedText("${it.street}, ${it.parish}") }
                        MutedText(
                            listOfNotNull(
                                a.assignedAt?.let { "Assigned ${formatDateTime(it)}" },
                                a.startedAt?.let { "Left ${formatDateTime(it)}" },
                                a.deliveredAt?.let { "Delivered ${formatDateTime(it)}" },
                            ).joinToString(" · "),
                        )
                        val next = NEXT_STATUS[a.status]
                        if (canUpdate && next != null) {
                            OutlinedButton(
                                enabled = busyId == null,
                                onClick = {
                                    scope.launch {
                                        busyId = a.id
                                        repo.updateOrderStatus(a.orderId, OrderStatusRequest(next, a.driverId))
                                            .onSuccess {
                                                message = "#${a.orderNumber} is now ${OrderStatuses.label(next).lowercase()}"
                                                reload()
                                            }
                                            .onFailure { message = it.friendlyMessage("Could not update the delivery") }
                                        busyId = null
                                    }
                                },
                            ) { Text(if (busyId == a.id) "Saving…" else "Mark ${OrderStatuses.label(next).lowercase()}") }
                        }
                    }
                }
            }
        }
    }
}
