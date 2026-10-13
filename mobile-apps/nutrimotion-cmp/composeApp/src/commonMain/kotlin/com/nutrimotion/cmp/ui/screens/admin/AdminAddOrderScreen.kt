package com.nutrimotion.cmp.ui.screens.admin

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.nutrimotion.cmp.data.model.AdminAddress
import com.nutrimotion.cmp.data.model.AdminClientDto
import com.nutrimotion.cmp.data.model.AdminOrderItemRequest
import com.nutrimotion.cmp.data.model.AdminOrderOptionsDto
import com.nutrimotion.cmp.data.model.AdminOrderRequest
import com.nutrimotion.cmp.data.model.MealDto
import com.nutrimotion.cmp.data.model.MealSlots
import com.nutrimotion.cmp.data.model.OrderWeekDto
import com.nutrimotion.cmp.data.model.PackageDto
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import com.nutrimotion.cmp.ui.components.PackageMealPicker
import com.nutrimotion.cmp.ui.components.PrimaryButton
import com.nutrimotion.cmp.ui.components.weekdayOfDayKey
import kotlinx.coroutines.launch

private val DAY_NAMES = listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")
private val MONTH_NAMES = listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")

private data class OrderLine(
    val key: String,
    val itemType: String,
    val itemId: String,
    val name: String,
    val price: Double,
    val quantity: Int,
    val detail: String,
    val packageDetails: Map<String, Map<String, List<String>>>? = null,
)

/** "2026-10-20" → "Tue Oct 20". */
private fun dayLabel(key: String): String {
    val parts = key.take(10).split("-").mapNotNull { it.toIntOrNull() }
    val weekday = weekdayOfDayKey(key)
    if (parts.size != 3 || weekday == null) return key
    return "${DAY_NAMES[weekday]} ${MONTH_NAMES[parts[1] - 1]} ${parts[2]}"
}

private fun weekTitle(week: OrderWeekDto, options: AdminOrderOptionsDto): String {
    val tags = buildList {
        if (week.weekStart == options.weeks.firstOrNull()?.weekStart) add("this week")
        if (week.weekStart == options.clientWeek.weekStart) add("clients ordering")
        else if (week.clientCutoffPassed) add("client ordering closed")
    }
    return if (tags.isEmpty()) week.label else "${week.label} (${tags.joinToString()})"
}

private fun slotLabel(slot: String): String =
    MealSlots.LABELS[slot] ?: slot.replace('_', ' ').replaceFirstChar { it.uppercase() }

@Composable
fun AdminAddOrderScreen(repo: NutrimotionRepository, onBack: () -> Unit, onCreated: () -> Unit) {
    AdminLoader(load = { repo.getAdminOrderOptions() }) { options, _ ->
        AddOrderForm(repo, options, onBack, onCreated)
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun AddOrderForm(
    repo: NutrimotionRepository,
    options: AdminOrderOptionsDto,
    onBack: () -> Unit,
    onCreated: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    var client by remember { mutableStateOf<AdminClientDto?>(null) }
    var clientQuery by remember { mutableStateOf("") }
    var weekStart by remember { mutableStateOf(options.clientWeek.weekStart) }
    var lines by remember { mutableStateOf<List<OrderLine>>(emptyList()) }
    var configuring by remember { mutableStateOf<PackageDto?>(null) }
    var packagesAdded by remember { mutableStateOf(0) }
    var packageMenu by remember { mutableStateOf(false) }
    var mealMenu by remember { mutableStateOf(false) }
    var street by remember { mutableStateOf("") }
    var parish by remember { mutableStateOf("") }
    var instructions by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    var saving by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }

    val week = options.weeks.firstOrNull { it.weekStart == weekStart }
    val weekMeals = remember(weekStart) {
        val days = week?.days.orEmpty()
        options.meals.filter { it.scheduledDate.take(10) in days }
    }
    val total = lines.sumOf { it.price * it.quantity }

    val pkgInProgress = configuring
    if (pkgInProgress != null && week != null) {
        Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp)) {
            MutedText("Week of ${week.label}")
            PackageMealPicker(
                pkg = pkgInProgress,
                meals = weekMeals,
                dayKeys = week.days,
                confirmLabel = "Add to order",
                onBack = { configuring = null },
                onConfirm = { details ->
                    val count = details.values.sumOf { slots -> slots.values.sumOf { it.size } }
                    val dayCount = details.count { (_, slots) -> slots.values.any { it.isNotEmpty() } }
                    packagesAdded += 1
                    lines = lines + OrderLine(
                        key = "package-$packagesAdded",
                        itemType = "package",
                        itemId = pkgInProgress.id.orEmpty(),
                        name = pkgInProgress.name,
                        price = pkgInProgress.cost,
                        quantity = 1,
                        detail = "$count meal${if (count == 1) "" else "s"} over $dayCount day${if (dayCount == 1) "" else "s"}",
                        packageDetails = details,
                    )
                    configuring = null
                },
            )
        }
        return
    }

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        TextButton(onClick = onBack) { Text("← All orders") }
        Text("Add order for a client", style = MaterialTheme.typography.headlineSmall)

        AdminCard("Client") {
            val chosen = client
            if (chosen != null) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(chosen.name.ifBlank { chosen.email }, fontWeight = FontWeight.SemiBold)
                        if (chosen.email.isNotBlank()) MutedText(chosen.email)
                    }
                    TextButton(onClick = { client = null }) { Text("Change") }
                }
            } else {
                OutlinedTextField(
                    value = clientQuery,
                    onValueChange = { clientQuery = it },
                    label = { Text("Search clients") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
                val q = clientQuery.trim().lowercase()
                val matches = options.clients
                    .filter { q.isEmpty() || it.name.lowercase().contains(q) || it.email.lowercase().contains(q) }
                    .take(8)
                if (matches.isEmpty()) MutedText("No clients match.")
                matches.forEach { c ->
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                client = c
                                street = c.address?.street.orEmpty()
                                parish = c.address?.parish.orEmpty()
                            }
                            .padding(vertical = 6.dp),
                    ) {
                        Text(c.name.ifBlank { c.email })
                        if (c.email.isNotBlank()) MutedText(c.email)
                    }
                }
            }
        }

        AdminCard("Week") {
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                options.weeks.forEach { w ->
                    FilterChip(
                        selected = w.weekStart == weekStart,
                        onClick = {
                            if (w.weekStart != weekStart) {
                                weekStart = w.weekStart
                                lines = emptyList()
                            }
                        },
                        label = { Text(weekTitle(w, options)) },
                    )
                }
            }
            if (lines.isNotEmpty()) MutedText("Changing the week clears the items added.")
            if (weekMeals.isEmpty()) {
                Text(
                    "No meals are on the menu for this week. Schedule meals for it before adding an order.",
                    color = MaterialTheme.colorScheme.error,
                )
            }
        }

        AdminCard("Items") {
            Box {
                OutlinedButton(onClick = { packageMenu = true }, enabled = weekMeals.isNotEmpty()) {
                    Text("Add a package")
                }
                DropdownMenu(expanded = packageMenu, onDismissRequest = { packageMenu = false }) {
                    options.packages.forEach { p ->
                        DropdownMenuItem(
                            text = { Text("${p.name} · ${formatMoney(p.cost)}") },
                            onClick = {
                                packageMenu = false
                                configuring = p
                            },
                        )
                    }
                }
            }
            Box {
                OutlinedButton(onClick = { mealMenu = true }, enabled = weekMeals.isNotEmpty()) {
                    Text("Add an individual meal")
                }
                DropdownMenu(expanded = mealMenu, onDismissRequest = { mealMenu = false }) {
                    weekMeals.forEach { m ->
                        DropdownMenuItem(
                            text = {
                                Text("${dayLabel(m.scheduledDate)} · ${slotLabel(m.slot)} · ${m.name} · ${formatMoney(m.price)}")
                            },
                            onClick = {
                                mealMenu = false
                                lines = addMealLine(lines, m)
                            },
                        )
                    }
                }
            }
            if (lines.isEmpty()) MutedText("No items yet.")
            lines.forEach { line ->
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(line.name, fontWeight = FontWeight.SemiBold)
                        MutedText("${line.detail} · ${formatMoney(line.price * line.quantity)}")
                    }
                    IconButton(
                        enabled = line.quantity > 1,
                        onClick = { lines = lines.map { if (it.key == line.key) it.copy(quantity = it.quantity - 1) else it } },
                    ) { Icon(Icons.Filled.Remove, contentDescription = "Decrease") }
                    Text("${line.quantity}")
                    IconButton(
                        onClick = { lines = lines.map { if (it.key == line.key) it.copy(quantity = it.quantity + 1) else it } },
                    ) { Icon(Icons.Filled.Add, contentDescription = "Increase") }
                    IconButton(onClick = { lines = lines.filter { it.key != line.key } }) {
                        Icon(Icons.Filled.Delete, contentDescription = "Remove ${line.name}")
                    }
                }
            }
            if (lines.isNotEmpty()) InfoRow("Total", formatMoney(total))
        }

        AdminCard("Delivery") {
            OutlinedTextField(value = street, onValueChange = { street = it }, label = { Text("Street") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = parish, onValueChange = { parish = it }, label = { Text("Parish") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(
                value = instructions,
                onValueChange = { instructions = it },
                label = { Text("Delivery instructions") },
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(value = note, onValueChange = { note = it }, label = { Text("Note (optional)") }, modifier = Modifier.fillMaxWidth())
        }

        message?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        val chosen = client
        PrimaryButton(
            text = if (saving) "Adding…" else "Add order · ${formatMoney(total)}",
            enabled = !saving && chosen != null && week != null && lines.isNotEmpty(),
            onClick = {
                if (chosen == null || week == null) return@PrimaryButton
                scope.launch {
                    saving = true
                    message = null
                    repo.createAdminOrder(
                        AdminOrderRequest(
                            userId = chosen.id,
                            weekStart = week.weekStart,
                            items = lines.map { AdminOrderItemRequest(it.itemType, it.itemId, it.quantity, it.packageDetails) },
                            deliveryAddress = AdminAddress(street.trim(), parish.trim()),
                            deliveryInstructions = instructions.trim().ifBlank { null },
                            note = note.trim().ifBlank { null },
                        ),
                    )
                        .onSuccess { onCreated() }
                        .onFailure { message = it.friendlyMessage("Could not add the order") }
                    saving = false
                }
            },
        )
    }
}

private fun addMealLine(lines: List<OrderLine>, meal: MealDto): List<OrderLine> {
    val id = meal.id ?: return lines
    val existing = lines.firstOrNull { it.itemType == "meal" && it.itemId == id }
    if (existing != null) return lines.map { if (it === existing) it.copy(quantity = it.quantity + 1) else it }
    return lines + OrderLine(
        key = id,
        itemType = "meal",
        itemId = id,
        name = meal.name,
        price = meal.price,
        quantity = 1,
        detail = "${dayLabel(meal.scheduledDate)} · ${slotLabel(meal.slot)}",
    )
}
