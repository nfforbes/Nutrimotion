package com.nutrimotion.cmp.ui.screens.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Card
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.nutrimotion.cmp.data.model.AnalyticsResponse
import com.nutrimotion.cmp.data.model.DayPoint
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import com.nutrimotion.cmp.ui.components.ErrorBox
import com.nutrimotion.cmp.ui.components.LoadingBox
import kotlin.math.max

@Composable
fun AnalyticsScreen(repo: NutrimotionRepository) {
    var days by remember { mutableStateOf(30) }
    var data by remember { mutableStateOf<AnalyticsResponse?>(null) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var reloadToken by remember { mutableStateOf(0) }

    LaunchedEffect(days, reloadToken) {
        loading = true
        error = null
        repo.getAnalytics(days)
            .onSuccess {
                data = it
                loading = false
            }
            .onFailure {
                error = it.message ?: "Failed to load analytics"
                loading = false
            }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("Analytics", style = MaterialTheme.typography.headlineSmall)
        data?.range?.let {
            Text("${it.start} → ${it.end}", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf(7, 30, 90).forEach { d ->
                FilterChip(
                    selected = days == d,
                    onClick = { days = d },
                    label = { Text("$d days") },
                )
            }
        }

        when {
            loading && data == null -> LoadingBox(modifier = Modifier.height(160.dp))
            error != null && data == null -> ErrorBox(error!!) { reloadToken++ }
            data != null -> {
                val a = data!!
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    KpiCard(
                        title = "Revenue",
                        value = money(a.kpis.revenue.value),
                        change = a.kpis.revenue.changePercent,
                        modifier = Modifier.weight(1f),
                        accent = Color(0xFF4CAF50),
                    )
                    KpiCard(
                        title = "Orders",
                        value = intStr(a.kpis.orders.value),
                        change = a.kpis.orders.changePercent,
                        modifier = Modifier.weight(1f),
                        accent = Color(0xFF2196F3),
                    )
                }
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    KpiCard(
                        title = "Users",
                        value = intStr(a.kpis.users.value),
                        change = a.kpis.users.changePercent,
                        modifier = Modifier.weight(1f),
                        accent = Color(0xFF9C27B0),
                        subtitle = "+${a.kpis.users.newInPeriod} new",
                    )
                    KpiCard(
                        title = "Deliveries",
                        value = intStr(a.kpis.deliveries.value),
                        change = a.kpis.deliveries.changePercent,
                        modifier = Modifier.weight(1f),
                        accent = Color(0xFFFF6F00),
                    )
                }

                SectionCard("Revenue trend") {
                    MiniBars(a.trends.revenue, Color(0xFF4CAF50), ::money)
                }
                if (a.trends.revenueForecast.isNotEmpty()) {
                    SectionCard("7-day revenue forecast") {
                        MiniBars(a.trends.revenueForecast, Color(0xFF81C784), ::money)
                    }
                }
                SectionCard("Order volume") {
                    MiniBars(a.trends.orders, Color(0xFF2196F3)) { v -> intStr(v) }
                }
                SectionCard("Order status") {
                    if (a.orderStatus.isEmpty()) {
                        Text("No orders", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    } else {
                        a.orderStatus.forEach {
                            StatRow(it.status.replace('_', ' '), it.count.toString())
                        }
                    }
                }
                SectionCard("Customer behavior") {
                    Text("Unique buyers: ${a.customers.unique}")
                    Text("Returning: ${a.customers.returning}")
                    Text(
                        a.customers.retentionRate?.let { "Multi-order rate: $it%" }
                            ?: "Multi-order rate: n/a",
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Top customers", style = MaterialTheme.typography.titleSmall)
                    if (a.topCustomers.isEmpty()) {
                        Text("No paid orders", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    } else {
                        a.topCustomers.forEach { c ->
                            StatRow("${c.name} (${c.orders})", money(c.spend))
                        }
                    }
                }
                SectionCard("Delivery performance") {
                    Text("Assignments: ${a.delivery.total}")
                    Text("Completed: ${a.delivery.completed}")
                    Text(
                        a.delivery.completionRate?.let { "Completion: $it%" } ?: "Completion: n/a",
                    )
                    Text(
                        a.delivery.avgMinutes?.let { "Avg time: ~$it min" } ?: "Avg time: n/a",
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    a.delivery.byStatus.forEach {
                        StatRow(it.status.replace('_', ' '), it.count.toString())
                    }
                }
                SectionCard("By parish") {
                    if (a.byParish.isEmpty()) {
                        Text("No parish data", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    } else {
                        a.byParish.forEach { p ->
                            StatRow(p.parish, "${p.orders} · ${money(p.revenue)}")
                        }
                    }
                }
                SectionCard("Popular items") {
                    if (a.popularItems.isEmpty()) {
                        Text("No item sales", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    } else {
                        a.popularItems.forEach { item ->
                            StatRow(
                                "${item.name} (${item.itemType})",
                                "x${item.quantity} · ${money(item.revenue)}",
                            )
                        }
                    }
                }
                Text(
                    "CMS tools (meals, coupons, content) remain on the web admin.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun KpiCard(
    title: String,
    value: String,
    change: Double?,
    modifier: Modifier = Modifier,
    accent: Color,
    subtitle: String? = null,
) {
    Card(modifier = modifier) {
        Column(modifier = Modifier.padding(12.dp)) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(8.dp))
                    .background(accent)
                    .padding(horizontal = 8.dp, vertical = 4.dp),
            ) {
                Text(title, color = Color.White, style = MaterialTheme.typography.labelMedium)
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(value, style = MaterialTheme.typography.titleLarge)
            subtitle?.let {
                Text(
                    it,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Text(
                when {
                    change == null -> "n/a vs prior"
                    change > 0 -> "+${change}% vs prior"
                    else -> "${change}% vs prior"
                },
                style = MaterialTheme.typography.labelSmall,
                color = when {
                    change == null -> MaterialTheme.colorScheme.onSurfaceVariant
                    change > 0 -> Color(0xFF2E7D32)
                    change < 0 -> Color(0xFFC62828)
                    else -> MaterialTheme.colorScheme.onSurfaceVariant
                },
            )
        }
    }
}

@Composable
private fun SectionCard(title: String, content: @Composable () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text(title, style = MaterialTheme.typography.titleMedium)
            content()
        }
    }
}

@Composable
private fun StatRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, modifier = Modifier.weight(1f))
        Text(value, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun MiniBars(
    points: List<DayPoint>,
    color: Color,
    format: (Double) -> String = { it.toString() },
) {
    if (points.isEmpty() || points.all { it.value <= 0.0 }) {
        Text("No data in this period", color = MaterialTheme.colorScheme.onSurfaceVariant)
        return
    }
    val maxV = max(points.maxOf { it.value }, 1.0)
    Row(
        modifier = Modifier.fillMaxWidth().height(120.dp),
        horizontalArrangement = Arrangement.spacedBy(2.dp),
        verticalAlignment = Alignment.Bottom,
    ) {
        points.forEach { p ->
            val h = ((p.value / maxV) * 100).toFloat().coerceAtLeast(if (p.value > 0) 4f else 0f)
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height((h * 1.1f).dp)
                    .clip(RoundedCornerShape(topStart = 3.dp, topEnd = 3.dp))
                    .background(if (p.value > 0) color else color.copy(alpha = 0.15f)),
            )
        }
    }
    Text(
        "Peak ${format(maxV)}",
        style = MaterialTheme.typography.labelSmall,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
    )
}

private fun money(n: Double): String {
    val rounded = (kotlin.math.round(n * 100.0) / 100.0)
    return "$" + rounded.toString()
}

private fun intStr(n: Double): String = n.toLong().toString()
