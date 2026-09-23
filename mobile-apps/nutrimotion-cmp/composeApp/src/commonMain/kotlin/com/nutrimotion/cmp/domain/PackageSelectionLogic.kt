package com.nutrimotion.cmp.domain

import com.nutrimotion.cmp.data.model.MealSlots
import com.nutrimotion.cmp.data.model.PackageDto

/**
 * Mirrors PackageSelection slot quotas from the web app.
 */
object PackageSelectionLogic {
    fun slotLimit(pkg: PackageDto, slot: String): Int = when (slot) {
        MealSlots.BREAKFAST -> pkg.breakfastCount
        MealSlots.LUNCH -> pkg.lunchCount
        MealSlots.SMOOTHIES -> pkg.smoothieCount.takeIf { it > 0 } ?: (pkg.dinnerCount ?: 0)
        MealSlots.JUICE_SHOT -> pkg.juiceShotCount
        else -> 0
    }

    fun countAcrossDays(
        selections: Map<String, Map<String, List<String>>>,
        slot: String,
    ): Int = selections.values.sumOf { day -> day[slot]?.size ?: 0 }

    fun canAdd(
        pkg: PackageDto,
        selections: Map<String, Map<String, List<String>>>,
        slot: String,
    ): Boolean = countAcrossDays(selections, slot) < slotLimit(pkg, slot)

    fun emptySelections(dayKeys: List<String>): Map<String, Map<String, List<String>>> =
        dayKeys.associateWith { day ->
            MealSlots.ORDER.associateWith { emptyList() }
        }
}
