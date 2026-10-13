package com.nutrimotion.cmp.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.Checkbox
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.nutrimotion.cmp.data.model.MealDto
import com.nutrimotion.cmp.data.model.MealSlots
import com.nutrimotion.cmp.data.model.PackageDto
import com.nutrimotion.cmp.domain.PackageSelectionLogic

/** Weekday (0 = Sunday) of a YYYY-MM-DD key. */
fun weekdayOfDayKey(key: String): Int? {
    val parts = key.take(10).split("-").mapNotNull { it.toIntOrNull() }
    if (parts.size != 3) return null
    val (y, m, d) = parts
    val offsets = intArrayOf(0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4)
    val yy = if (m < 3) y - 1 else y
    return (yy + yy / 4 - yy / 100 + yy / 400 + offsets[m - 1] + d) % 7
}

/**
 * Step-by-step meal choices for a package, limited to the given week's days.
 * [onConfirm] receives day key → slot → meal names, the shape stored on orders.
 */
@Composable
fun PackageMealPicker(
    pkg: PackageDto,
    meals: List<MealDto>,
    dayKeys: List<String>,
    confirmLabel: String,
    busy: Boolean = false,
    onBack: () -> Unit,
    onConfirm: (Map<String, Map<String, List<String>>>) -> Unit,
) {
    val days = remember(pkg.id, dayKeys) {
        if (pkg.daysOption == "specific") dayKeys.filter { weekdayOfDayKey(it) in pkg.specificDays } else dayKeys
    }
    val dayMeals = remember(meals, days) { meals.filter { it.scheduledDate.take(10) in days } }
    var selections by remember(pkg.id, days) { mutableStateOf(PackageSelectionLogic.emptySelections(days)) }
    val steps = PackageSelectionLogic.wizardSlots(pkg)
    var stepIndex by remember(pkg.id) { mutableStateOf(0) }
    val slot = steps.getOrNull(stepIndex.coerceIn(0, (steps.size - 1).coerceAtLeast(0)))

    Column {
        TextButton(onClick = onBack) { Text("Back") }
        Text(pkg.name, style = MaterialTheme.typography.headlineSmall)
        if (steps.isEmpty() || slot == null) {
            Text("This package has no meals to choose.")
            return@Column
        }
        val limit = PackageSelectionLogic.slotLimit(pkg, slot)
        val used = PackageSelectionLogic.countAcrossDays(selections, slot)
        val stepMeals = dayMeals
            .filter {
                it.slot == slot ||
                    (slot == MealSlots.DINNER && (it.slot == MealSlots.LUNCH || it.slot == MealSlots.DINNER))
            }
            .distinctBy { it.name }
        Text("Step ${stepIndex + 1} of ${steps.size}", color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text("${MealSlots.LABELS[slot]} ($used / $limit)", style = MaterialTheme.typography.titleMedium)
        Text("Check a meal, then use + and − to choose how many.")
        Spacer(modifier = Modifier.height(8.dp))
        if (stepMeals.isEmpty()) {
            Text(
                "No ${MealSlots.LABELS[slot]?.lowercase()} options are on the menu this week.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        stepMeals.forEach { meal ->
            val mealId = meal.id ?: return@forEach
            val day = meal.scheduledDate.take(10)
            val qty = PackageSelectionLogic.quantityOf(selections, slot, mealId)
            val canIncrease = PackageSelectionLogic.canAdd(pkg, selections, slot)
            fun set(quantity: Int) {
                selections = PackageSelectionLogic.withQuantity(selections, day, slot, mealId, quantity, limit)
            }
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Checkbox(
                    checked = qty > 0,
                    onCheckedChange = { checked -> set(if (checked) 1 else 0) },
                    enabled = qty > 0 || canIncrease,
                )
                MealThumbnail(meal.imageUrl, contentDescription = meal.name)
                Spacer(modifier = Modifier.width(10.dp))
                Text(meal.name, modifier = Modifier.weight(1f))
                IconButton(onClick = { set(qty - 1) }, enabled = qty > 0) {
                    Icon(Icons.Filled.Remove, contentDescription = "Decrease")
                }
                Text("$qty", style = MaterialTheme.typography.titleMedium)
                IconButton(onClick = { set(qty + 1) }, enabled = canIncrease) {
                    Icon(Icons.Filled.Add, contentDescription = "Increase")
                }
            }
        }
        Spacer(modifier = Modifier.height(12.dp))
        if (stepIndex > 0) {
            TextButton(onClick = { stepIndex -= 1 }) { Text("Previous") }
        }
        if (stepIndex < steps.lastIndex) {
            PrimaryButton(
                text = "Next: ${MealSlots.LABELS[steps[stepIndex + 1]]}",
                enabled = used == limit,
                onClick = { stepIndex += 1 },
            )
        } else {
            val complete = steps.all { step ->
                PackageSelectionLogic.countAcrossDays(selections, step) == PackageSelectionLogic.slotLimit(pkg, step)
            }
            PrimaryButton(
                text = confirmLabel,
                enabled = complete && !busy,
                onClick = {
                    val nameById = dayMeals.mapNotNull { meal -> meal.id?.let { it to meal.name } }.toMap()
                    onConfirm(
                        selections.mapValues { (_, slots) ->
                            slots.mapValues { (_, ids) -> ids.map { nameById[it] ?: it } }
                        },
                    )
                },
            )
        }
    }
}
