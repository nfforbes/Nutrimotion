package com.nutrimotion.cmp.ui.screens.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.nutrimotion.cmp.data.model.MealSlots
import com.nutrimotion.cmp.data.repository.NutrimotionRepository

@Composable
fun AdminDashboardScreen(repo: NutrimotionRepository) {
    AdminLoader(load = { repo.getAdminDashboard() }) { data, reload ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.weight(1f)) {
                    Text("Today", style = MaterialTheme.typography.headlineSmall)
                    MutedText(formatDateTime(data.date, withTime = false))
                }
                TextButton(onClick = reload) { Text("Refresh") }
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatTile("Meals today", data.stats.mealsOrdered, Modifier.weight(1f))
                StatTile("Active orders", data.stats.activeOrders, Modifier.weight(1f))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                StatTile("Out for delivery", data.stats.inDelivery, Modifier.weight(1f))
                StatTile("Users", data.stats.totalUsers, Modifier.weight(1f))
            }
            AdminCard("Meals ordered for today") {
                val slots = data.slotOrder.ifEmpty { data.mealBreakdown.keys.toList() }
                val nonEmpty = slots.filter { data.mealBreakdown[it].orEmpty().isNotEmpty() }
                if (nonEmpty.isEmpty()) MutedText("No meals ordered for today.")
                nonEmpty.forEach { slot ->
                    val items = data.mealBreakdown[slot].orEmpty()
                    Text(
                        "${MealSlots.LABELS[slot] ?: slot} · ${items.sumOf { it.count }}",
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(top = 6.dp),
                    )
                    items.forEach { InfoRow(it.name, "× ${it.count}") }
                }
            }
        }
    }
}

@Composable
private fun StatTile(label: String, value: Int, modifier: Modifier) {
    Card(modifier = modifier) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(value.toString(), style = MaterialTheme.typography.headlineMedium)
            MutedText(label)
        }
    }
}
