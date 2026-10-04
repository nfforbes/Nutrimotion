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
        MealSlots.DINNER -> pkg.dinnerCount ?: 0
        MealSlots.SMOOTHIES -> pkg.smoothieCount
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

    fun wizardSlots(pkg: PackageDto): List<String> =
        MealSlots.ORDER.filter { slotLimit(pkg, it) > 0 }

    fun quantityOf(
        selections: Map<String, Map<String, List<String>>>,
        slot: String,
        mealId: String,
    ): Int = selections.values.sumOf { day -> day[slot]?.count { it == mealId } ?: 0 }

    /** Stores quantity by repeating the meal id. The package quota is the total for that slot. */
    fun withQuantity(
        selections: Map<String, Map<String, List<String>>>,
        day: String,
        slot: String,
        mealId: String,
        quantity: Int,
        slotLimit: Int,
    ): Map<String, Map<String, List<String>>> {
        val current = quantityOf(selections, slot, mealId)
        val others = countAcrossDays(selections, slot) - current
        val capped = quantity.coerceIn(0, (slotLimit - others).coerceAtLeast(0))
        val cleared = selections.mapValues { (_, slots) ->
            slots.mapValues { (key, ids) -> if (key == slot) ids.filter { it != mealId } else ids }
        }
        val dayMap = cleared[day]?.toMutableMap() ?: mutableMapOf()
        dayMap[slot] = (dayMap[slot] ?: emptyList()) + List(capped) { mealId }
        return cleared.toMutableMap().apply { put(day, dayMap) }
    }

    fun emptySelections(dayKeys: List<String>): Map<String, Map<String, List<String>>> =
        dayKeys.associateWith { day ->
            MealSlots.ORDER.associateWith { emptyList() }
        }
}

enum class PackageSpan(val label: String) {
    Monthly("Monthly"),
    Weeks("Weeks"),
    Days("Days"),
}

enum class PackageSort(val label: String) {
    PriceAsc("Price: low"),
    PriceDesc("Price: high"),
    MealsAsc("Meals: fewest"),
    MealsDesc("Meals: most"),
    Name("Name"),
}

data class PackageGroup(
    val span: PackageSpan,
    val label: String,
    val packages: List<PackageDto>,
)

/** Same monthly / weeks / days grouping as the website package list. */
object PackageBrowseLogic {
    val spanOrder = listOf(PackageSpan.Monthly, PackageSpan.Weeks, PackageSpan.Days)

    fun mealTotal(pkg: PackageDto): Int =
        pkg.breakfastCount +
            pkg.lunchCount +
            (pkg.dinnerCount ?: 0) +
            pkg.smoothieCount +
            pkg.juiceShotCount

    fun span(pkg: PackageDto): PackageSpan {
        val text = "${pkg.name} ${pkg.description}".lowercase()
        if ("full day" in text || "per day" in text) return PackageSpan.Days
        if ("month" in text) return PackageSpan.Monthly
        if ("week" in text) return PackageSpan.Weeks
        if (pkg.breakfastCount > 0 && (pkg.dinnerCount ?: 0) > 0) return PackageSpan.Days
        return PackageSpan.Weeks
    }

    fun group(
        packages: List<PackageDto>,
        span: PackageSpan?,
        sort: PackageSort,
    ): List<PackageGroup> {
        val spans = if (span == null) spanOrder else listOf(span)
        return spans.mapNotNull { key ->
            val matching = packages.filter { span(it) == key }.sortedWith(comparator(sort))
            if (matching.isEmpty()) null
            else PackageGroup(key, "${key.label} packages", matching)
        }
    }

    private fun comparator(sort: PackageSort): Comparator<PackageDto> = when (sort) {
        PackageSort.Name -> compareBy { it.name }
        PackageSort.PriceDesc -> compareByDescending<PackageDto> { it.cost }.thenBy { it.name }
        PackageSort.MealsAsc -> compareBy<PackageDto> { mealTotal(it) }.thenBy { it.name }
        PackageSort.MealsDesc -> compareByDescending<PackageDto> { mealTotal(it) }.thenBy { it.name }
        PackageSort.PriceAsc -> compareBy<PackageDto> { it.cost }.thenBy { it.name }
    }
}
