package com.nutrimotion.cmp.ui.screens.admin

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.nutrimotion.cmp.data.model.AdminOrderDto
import com.nutrimotion.cmp.data.model.AdminUserDto
import com.nutrimotion.cmp.data.model.OrderStatusRequest
import com.nutrimotion.cmp.data.model.OrderStatuses
import com.nutrimotion.cmp.data.model.Roles
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import kotlinx.coroutines.launch

@Composable
fun AdminOrdersScreen(repo: NutrimotionRepository) {
    var filter by remember { mutableStateOf<String?>(null) }
    var selectedId by remember { mutableStateOf<String?>(null) }

    AdminLoader(load = { repo.getAdminOrders() }) { orders, reload ->
        val selected = orders.firstOrNull { it.id == selectedId }
        if (selected != null) {
            OrderDetail(repo, selected, onBack = { selectedId = null }, onChanged = reload)
            return@AdminLoader
        }
        val shown = orders.filter { filter == null || it.status == filter }
        Column(modifier = Modifier.fillMaxSize()) {
            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                FilterChip(selected = filter == null, onClick = { filter = null }, label = { Text("All ${orders.size}") })
                OrderStatuses.ALL.forEach { status ->
                    val count = orders.count { it.status == status }
                    if (count > 0) {
                        FilterChip(
                            selected = filter == status,
                            onClick = { filter = status },
                            label = { Text("${OrderStatuses.label(status)} $count") },
                        )
                    }
                }
            }
            LazyColumn(
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                if (shown.isEmpty()) item { MutedText("No orders.") }
                items(shown, key = { it.id }) { order ->
                    Card(modifier = Modifier.fillMaxWidth().clickable { selectedId = order.id }) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row {
                                Text("#${order.orderNumber}", fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                                Text(formatMoney(order.total), fontWeight = FontWeight.SemiBold)
                            }
                            Text(order.userId?.name ?: order.userId?.email ?: "Unknown customer")
                            MutedText(
                                listOfNotNull(
                                    OrderStatuses.label(order.status),
                                    formatDateTime(order.createdAt),
                                    order.assignedDriverId?.name?.let { "Driver: $it" },
                                ).joinToString(" · "),
                            )
                        }
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun OrderDetail(
    repo: NutrimotionRepository,
    order: AdminOrderDto,
    onBack: () -> Unit,
    onChanged: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    var drivers by remember { mutableStateOf<List<AdminUserDto>>(emptyList()) }
    var driverId by remember(order.id) { mutableStateOf(order.assignedDriverId?.id) }
    var menuOpen by remember { mutableStateOf(false) }
    var busy by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        repo.getAdminUsers(Roles.DRIVER).onSuccess { drivers = it }
    }

    fun perform(action: suspend () -> Result<*>, success: String) {
        scope.launch {
            busy = true
            message = null
            action()
                .onSuccess {
                    message = success
                    onChanged()
                }
                .onFailure { message = it.friendlyMessage("Could not update the order") }
            busy = false
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        TextButton(onClick = onBack) { Text("← All orders") }
        Text("Order #${order.orderNumber}", style = MaterialTheme.typography.headlineSmall)
        MutedText("${OrderStatuses.label(order.status)} · ${formatDateTime(order.createdAt)}")

        AdminCard("Customer") {
            Text(order.userId?.name ?: "Unknown customer")
            order.userId?.email?.let { MutedText(it) }
            order.userId?.phone?.takeIf { it.isNotBlank() }?.let { MutedText(it) }
            order.deliveryAddress?.let { MutedText("${it.street}, ${it.parish}") }
            order.deliveryInstructions?.takeIf { it.isNotBlank() }?.let { MutedText("Note: $it") }
        }

        AdminCard("Items") {
            order.items.forEach { item ->
                InfoRow("${item.name} × ${item.quantity}", formatMoney(item.price * item.quantity))
                packageChoiceSummary(item.packageDetails).forEach { MutedText(it) }
            }
            if (order.discount > 0) InfoRow("Discount", "−${formatMoney(order.discount)}")
            InfoRow("Total", formatMoney(order.total))
        }

        AdminCard("Driver") {
            Box {
                OutlinedButton(onClick = { menuOpen = true }, enabled = !busy) {
                    Text(drivers.firstOrNull { it.id == driverId }?.name ?: order.assignedDriverId?.name ?: "Choose a driver")
                }
                DropdownMenu(expanded = menuOpen, onDismissRequest = { menuOpen = false }) {
                    if (drivers.isEmpty()) {
                        DropdownMenuItem(text = { Text("No drivers found") }, onClick = { menuOpen = false })
                    }
                    drivers.forEach { driver ->
                        DropdownMenuItem(
                            text = { Text(driver.name.ifBlank { driver.email }) },
                            onClick = {
                                driverId = driver.id
                                menuOpen = false
                            },
                        )
                    }
                }
            }
            val pick = driverId
            if (pick != null && pick != order.assignedDriverId?.id) {
                OutlinedButton(
                    enabled = !busy,
                    onClick = { perform({ repo.assignDriver(order.id, pick) }, "Driver assigned") },
                ) { Text("Assign driver") }
            }
        }

        AdminCard("Change status") {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                OrderStatuses.ALL.forEach { status ->
                    AssistChip(
                        enabled = !busy && status != order.status,
                        onClick = {
                            if (status == OrderStatuses.OUT_FOR_DELIVERY && driverId == null) {
                                message = "Choose a driver first."
                            } else {
                                perform(
                                    { repo.updateOrderStatus(order.id, OrderStatusRequest(status, driverId)) },
                                    "Status changed to ${OrderStatuses.label(status)}",
                                )
                            }
                        },
                        label = { Text(OrderStatuses.label(status)) },
                    )
                }
            }
        }
        message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }

        if (order.statusHistory.isNotEmpty()) {
            AdminCard("History") {
                order.statusHistory.reversed().forEach { h ->
                    InfoRow(OrderStatuses.label(h.status), formatDateTime(h.timestamp))
                    h.note?.takeIf { it.isNotBlank() }?.let { MutedText(it) }
                }
            }
        }
    }
}
