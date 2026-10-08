package com.nutrimotion.cmp.ui.screens.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.unit.dp
import com.nutrimotion.cmp.data.model.CookPlanDto
import com.nutrimotion.cmp.data.model.CookingResponse
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import com.nutrimotion.cmp.ui.components.ErrorBox
import com.nutrimotion.cmp.ui.components.LoadingBox
import kotlinx.coroutines.launch

private val WEEKDAYS = listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")
private val MONTHS = listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun CookingScreen(repo: NutrimotionRepository, canEditDays: Boolean) {
    var data by remember { mutableStateOf<CookingResponse?>(null) }
    var selected by remember { mutableStateOf<Set<Int>>(emptySet()) }
    var loading by remember { mutableStateOf(true) }
    var saving by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }
    var reloadToken by remember { mutableStateOf(0) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(reloadToken) {
        loading = true
        error = null
        repo.getCooking()
            .onSuccess {
                data = it
                selected = it.cookDays.toSet()
            }
            .onFailure { error = it.message ?: "Failed to load the cooking list" }
        loading = false
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("Cooking list", style = MaterialTheme.typography.headlineSmall)

        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Cook days", style = MaterialTheme.typography.titleMedium)
                Text(
                    "Each cook day covers meals eaten from that day up to the day before the next cook day.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    WEEKDAYS.forEachIndexed { i, label ->
                        FilterChip(
                            selected = i in selected,
                            enabled = canEditDays && !saving,
                            onClick = {
                                selected = if (i in selected) selected - i else selected + i
                                message = null
                            },
                            label = { Text(label) },
                        )
                    }
                }
                if (canEditDays) {
                    val dirty = data != null && selected.sorted() != data!!.cookDays
                    Button(
                        enabled = dirty && !saving,
                        onClick = {
                            scope.launch {
                                saving = true
                                repo.saveCookDays(selected.sorted())
                                    .onSuccess {
                                        data = it
                                        selected = it.cookDays.toSet()
                                        message = "Saved"
                                    }
                                    .onFailure { message = it.message ?: "Could not save cook days" }
                                saving = false
                            }
                        },
                    ) { Text(if (saving) "Saving…" else "Save cook days") }
                }
                message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
            }
        }

        val current = data
        when {
            loading && current == null -> LoadingBox(modifier = Modifier.height(160.dp))
            error != null && current == null -> ErrorBox(error!!) { reloadToken++ }
            current != null && current.cookDays.isEmpty() ->
                Text(
                    "Choose your cook days above to see what to cook.",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            current != null -> current.plans.forEach { plan ->
                PlanCard(plan, isToday = plan.cookDate == current.today)
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun PlanCard(plan: CookPlanDto, isToday: Boolean) {
    val range = if (plan.coversFrom == plan.coversTo) {
        formatDay(plan.coversFrom)
    } else {
        "${formatDay(plan.coversFrom)} – ${formatDay(plan.coversTo)}"
    }
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(
                "Cook ${formatDay(plan.cookDate)}${if (isToday) " · Today" else ""}",
                style = MaterialTheme.typography.titleMedium,
            )
            Text(
                "For meals eaten $range · ${plan.totalMeals} meal${if (plan.totalMeals == 1) "" else "s"} " +
                    "from ${plan.orderCount} order${if (plan.orderCount == 1) "" else "s"}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            FlowRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                plan.days.forEach { d ->
                    AssistChip(onClick = {}, label = { Text("${formatDay(d.date)}: ${d.total}") })
                }
            }
            if (plan.slots.isEmpty()) {
                Text("No meals ordered for these days yet.", color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            plan.slots.forEach { slot ->
                HorizontalDivider()
                CountRow(slot.label, slot.total, bold = true)
                slot.items.forEach { item -> CountRow(item.name, item.count, bold = false) }
            }
        }
    }
}

@Composable
private fun CountRow(label: String, count: Int, bold: Boolean) {
    val weight = if (bold) FontWeight.SemiBold else FontWeight.Normal
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, fontWeight = weight, modifier = Modifier.weight(1f))
        Text(if (bold) "$count" else "× $count", fontWeight = FontWeight.SemiBold)
    }
}

/** "2026-10-11" → "Sun Oct 11". */
private fun formatDay(key: String): String {
    val parts = key.split("-").mapNotNull { it.toIntOrNull() }
    if (parts.size != 3) return key
    val (y, m, d) = parts
    val offsets = intArrayOf(0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4)
    val yy = if (m < 3) y - 1 else y
    val weekday = (yy + yy / 4 - yy / 100 + yy / 400 + offsets[m - 1] + d) % 7
    return "${WEEKDAYS[weekday]} ${MONTHS[m - 1]} $d"
}
