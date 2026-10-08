package com.nutrimotion.cmp.ui.screens.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.nutrimotion.cmp.data.model.MealSlots
import com.nutrimotion.cmp.data.network.ApiJson
import com.nutrimotion.cmp.ui.components.ErrorBox
import com.nutrimotion.cmp.ui.components.LoadingBox
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

private val MONTHS = listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
private const val JAMAICA_OFFSET_MINUTES = -5 * 60

/** Server error text from `{"error": "..."}` bodies, falling back to the raw message. */
fun Throwable.friendlyMessage(fallback: String = "Something went wrong"): String {
    val raw = message?.trim().orEmpty()
    val parsed = runCatching {
        val obj = ApiJson.instance.parseToJsonElement(raw) as JsonObject
        (obj["error"] ?: obj["message"])?.jsonPrimitive?.content
    }.getOrNull()
    return parsed?.takeIf { it.isNotBlank() } ?: raw.takeIf { it.isNotBlank() && !it.startsWith("<") } ?: fallback
}

fun formatMoney(n: Double): String {
    val cents = kotlin.math.round(n * 100).toLong()
    val whole = cents / 100
    val frac = (cents % 100).toString().padStart(2, '0')
    return if (frac == "00") "$$whole" else "$$whole.$frac"
}

private fun daysFromCivil(y: Int, m: Int, d: Int): Long {
    val yy = if (m <= 2) y - 1 else y
    val era = (if (yy >= 0) yy else yy - 399) / 400
    val yoe = yy - era * 400
    val doy = (153 * (m + (if (m > 2) -3 else 9)) + 2) / 5 + d - 1
    val doe = yoe * 365 + yoe / 4 - yoe / 100 + doy
    return era * 146097L + doe - 719468L
}

private fun civilFromDays(z0: Long): Triple<Int, Int, Int> {
    val z = z0 + 719468
    val era = (if (z >= 0) z else z - 146096) / 146097
    val doe = z - era * 146097
    val yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365
    val doy = doe - (365 * yoe + yoe / 4 - yoe / 100)
    val mp = (5 * doy + 2) / 153
    val d = (doy - (153 * mp + 2) / 5 + 1).toInt()
    val m = (if (mp < 10) mp + 3 else mp - 9).toInt()
    val y = (yoe + era * 400 + (if (m <= 2) 1 else 0)).toInt()
    return Triple(y, m, d)
}

/** "2026-10-08T18:30:00.000Z" → "Oct 8, 1:30 PM" in Jamaica time. Date-only strings → "Oct 8, 2026". */
fun formatDateTime(iso: String?, withTime: Boolean = true): String {
    if (iso.isNullOrBlank() || iso.length < 10) return ""
    val y = iso.substring(0, 4).toIntOrNull() ?: return iso
    val m = iso.substring(5, 7).toIntOrNull() ?: return iso
    val d = iso.substring(8, 10).toIntOrNull() ?: return iso
    if (!withTime || iso.length < 16) return "${MONTHS[m - 1]} $d, $y"
    val hh = iso.substring(11, 13).toIntOrNull() ?: 0
    val mm = iso.substring(14, 16).toIntOrNull() ?: 0
    val total = daysFromCivil(y, m, d) * 1440 + hh * 60 + mm + JAMAICA_OFFSET_MINUTES
    val (_, lm, ld) = civilFromDays(total.floorDiv(1440L))
    val minutes = total.mod(1440L).toInt()
    val hour = minutes / 60
    val h12 = if (hour % 12 == 0) 12 else hour % 12
    val ampm = if (hour < 12) "AM" else "PM"
    return "${MONTHS[lm - 1]} $ld, $h12:${(minutes % 60).toString().padStart(2, '0')} $ampm"
}

/** Package picks as lines like "Oct 11 · Lunch: Jerk Chicken, Curry Goat". */
fun packageChoiceSummary(details: JsonElement?): List<String> {
    val days = details as? JsonObject ?: return emptyList()
    return days.entries.sortedBy { it.key }.flatMap { (day, slots) ->
        val slotMap = slots as? JsonObject ?: return@flatMap emptyList()
        MealSlots.ORDER.mapNotNull { slot ->
            val names = (slotMap[slot] as? JsonArray)
                ?.mapNotNull { (it as? JsonPrimitive)?.contentOrNull?.takeIf(String::isNotBlank) }
                .orEmpty()
            if (names.isEmpty()) null
            else "${formatDateTime(day, withTime = false).substringBefore(",")} · ${MealSlots.LABELS[slot]}: ${names.joinToString()}"
        }
    }
}

@Composable
fun AdminCard(title: String? = null, modifier: Modifier = Modifier, content: @Composable () -> Unit) {
    Card(modifier = modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            title?.let { Text(it, style = MaterialTheme.typography.titleMedium) }
            content()
        }
    }
}

@Composable
fun InfoRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, modifier = Modifier.weight(1f))
        Text(value, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
fun SwitchRow(label: String, checked: Boolean, enabled: Boolean = true, onChange: (Boolean) -> Unit) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(label, modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium)
        Switch(checked = checked, enabled = enabled, onCheckedChange = onChange)
    }
}

@Composable
fun MutedText(text: String) {
    Text(text, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
}

/** Loads data once (and again whenever `reload` is called), showing a spinner or a retry box meanwhile. */
@Composable
fun <T> AdminLoader(
    load: suspend () -> Result<T>,
    content: @Composable (data: T, reload: () -> Unit) -> Unit,
) {
    var data by remember { mutableStateOf<T?>(null) }
    var error by remember { mutableStateOf<String?>(null) }
    var token by remember { mutableStateOf(0) }

    LaunchedEffect(token) {
        load()
            .onSuccess {
                data = it
                error = null
            }
            .onFailure { error = it.friendlyMessage("Could not load") }
    }

    val current = data
    when {
        current != null -> content(current) { token++ }
        error != null -> ErrorBox(error!!) { token++ }
        else -> LoadingBox(modifier = Modifier.height(160.dp))
    }
}
