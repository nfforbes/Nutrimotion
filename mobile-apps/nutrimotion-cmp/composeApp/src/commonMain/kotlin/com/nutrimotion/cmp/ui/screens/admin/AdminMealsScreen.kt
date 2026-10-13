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
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.nutrimotion.cmp.data.model.CatalogMealDto
import com.nutrimotion.cmp.data.model.MealSlots
import com.nutrimotion.cmp.data.model.PlaceMealRequest
import com.nutrimotion.cmp.data.model.PlacedMealDto
import com.nutrimotion.cmp.data.model.WeekMealFlagsRequest
import com.nutrimotion.cmp.data.model.WeekMealRequest
import com.nutrimotion.cmp.data.model.WeekPlanDto
import com.nutrimotion.cmp.data.model.WeekSlotRef
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import com.nutrimotion.cmp.ui.components.MealThumbnail
import kotlinx.coroutines.launch

private enum class PlannerView { Week, Month }

/** The meal picked to go into a slot: a saved meal, or one already placed that is being moved. */
private sealed interface Placing {
    val name: String

    data class New(val meal: CatalogMealDto) : Placing {
        override val name get() = meal.name
    }

    data class Move(val weekStart: String, val slot: String, val meal: PlacedMealDto) : Placing {
        override val name get() = meal.name
    }
}

private data class PlacedRef(val weekStart: String, val slot: String, val meal: PlacedMealDto)

private data class EditorState(val meal: CatalogMealDto?)

private val MONTH_NAMES = listOf(
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
)

private fun weekLabel(weekStart: String) = "${shortDay(weekStart)} – ${shortDay(shiftDayKey(weekStart, 6))}"

private fun slotLabel(slot: String) = MealSlots.LABELS[slot] ?: slot

/** "2026-10" → the Mondays of every week that touches that month. */
private fun monthWeeks(month: String): List<String> {
    val (y, m) = month.split("-").map { it.toInt() }
    val nextFirst = if (m == 12) "${y + 1}-01-01" else "$y-${(m + 1).toString().padStart(2, '0')}-01"
    val last = shiftDayKey(nextFirst, -1)
    return generateSequence(mondayOf("$month-01")) { shiftDayKey(it, 7) }.takeWhile { it <= last }.toList()
}

private fun shiftMonth(month: String, delta: Int): String {
    val (y, m) = month.split("-").map { it.toInt() }
    val total = y * 12 + (m - 1) + delta
    return "${total / 12}-${(total % 12 + 1).toString().padStart(2, '0')}"
}

private fun placedNote(meal: PlacedMealDto): String = listOfNotNull(
    formatMoney(meal.price),
    if (meal.days < 7) "${meal.days} of 7 days" else null,
    if (!meal.available) "Hidden" else null,
    if (!meal.soldIndividually) "Packages only" else null,
).joinToString(" · ")

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun AdminMealsScreen(repo: NutrimotionRepository) {
    val scope = rememberCoroutineScope()
    val listState = rememberLazyListState()
    var view by remember { mutableStateOf(PlannerView.Week) }
    var todayWeek by remember { mutableStateOf<String?>(null) }
    var orderingWeek by remember { mutableStateOf<String?>(null) }
    var weekStart by remember { mutableStateOf<String?>(null) }
    var month by remember { mutableStateOf<String?>(null) }
    var plans by remember { mutableStateOf<List<WeekPlanDto>>(emptyList()) }
    var catalog by remember { mutableStateOf<List<CatalogMealDto>?>(null) }
    var loadError by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    var busy by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    var notice by remember { mutableStateOf<String?>(null) }
    var placing by remember { mutableStateOf<Placing?>(null) }
    var actionsFor by remember { mutableStateOf<PlacedRef?>(null) }
    var confirmRemove by remember { mutableStateOf<PlacedRef?>(null) }
    var copyFrom by remember { mutableStateOf<String?>(null) }
    var slotFilter by remember { mutableStateOf<String?>(null) }
    var editor by remember { mutableStateOf<EditorState?>(null) }
    var plansToken by remember { mutableStateOf(0) }
    var catalogToken by remember { mutableStateOf(0) }

    val shownWeek = weekStart
    val visibleWeeks: List<String> = when {
        shownWeek == null -> emptyList()
        view == PlannerView.Week -> listOf(shownWeek)
        else -> monthWeeks(month ?: shownWeek.take(7))
    }

    LaunchedEffect(Unit) {
        repo.getOrderWeek().onSuccess { orderingWeek = it.weekStart }
    }
    LaunchedEffect(catalogToken) {
        repo.getMealCatalog()
            .onSuccess { catalog = it }
            .onFailure { loadError = it.friendlyMessage("Could not load meals") }
    }
    LaunchedEffect(visibleWeeks, plansToken) {
        loading = true
        val result = if (visibleWeeks.isEmpty()) repo.getWeekPlans()
        else repo.getWeekPlans(visibleWeeks.first(), visibleWeeks.last())
        result
            .onSuccess {
                if (weekStart == null) {
                    val current = it.firstOrNull()?.weekStart
                    todayWeek = current
                    weekStart = current
                    month = current?.take(7)
                }
                plans = it
                loadError = null
            }
            .onFailure { loadError = it.friendlyMessage("Could not load the meal plan") }
        loading = false
    }

    fun <T> act(failure: String, block: suspend () -> Result<T>, onSuccess: (T) -> Unit = {}) {
        busy = true
        message = null
        notice = null
        scope.launch {
            block().onSuccess(onSuccess).onFailure { message = it.friendlyMessage(failure) }
            busy = false
            plansToken++
        }
    }

    fun placeHere(week: String, slot: String) {
        val picked = placing ?: return
        placing = null
        val from = (picked as? Placing.Move)?.let { WeekSlotRef(it.weekStart, it.slot) }
        if (from != null && from.weekStart == week && from.slot == slot) return
        act("Could not place ${picked.name}", { repo.placeMeal(PlaceMealRequest(week, slot, picked.name, from)) }) { result ->
            notice = when {
                from != null -> "${picked.name} moved to ${slotLabel(slot)} for ${weekLabel(week)}."
                result.added == 0 -> "${picked.name} is already in ${slotLabel(slot)} that week."
                else -> "${picked.name} added to ${slotLabel(slot)} every day of ${weekLabel(week)}."
            }
        }
    }

    fun setFlags(ref: PlacedRef, available: Boolean? = null, soldIndividually: Boolean? = null) {
        actionsFor = ref.copy(
            meal = ref.meal.copy(
                available = available ?: ref.meal.available,
                soldIndividually = soldIndividually ?: ref.meal.soldIndividually,
            ),
        )
        act(
            "Could not update ${ref.meal.name}",
            {
                repo.setWeekMealFlags(
                    WeekMealFlagsRequest(ref.weekStart, ref.slot, ref.meal.name, available, soldIndividually),
                )
            },
        )
    }

    fun pick(next: Placing) {
        placing = next
        message = null
        notice = null
        scope.launch { listState.animateScrollToItem(0) }
    }

    @Composable
    fun PlaceHereButton(week: String, slot: String) {
        val picked = placing ?: return
        Button(onClick = { placeHere(week, slot) }, enabled = !busy, modifier = Modifier.fillMaxWidth()) {
            Text("Place ${picked.name} here", maxLines = 1, overflow = TextOverflow.Ellipsis)
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            state = listState,
            contentPadding = PaddingValues(12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item(key = "header") {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                        PlannerView.entries.forEach { v ->
                            FilterChip(
                                selected = view == v,
                                onClick = {
                                    if (v == PlannerView.Month && view != v) month = shownWeek?.take(7)
                                    view = v
                                },
                                label = { Text(v.name) },
                            )
                        }
                        Spacer(modifier = Modifier.weight(1f))
                        if (view == PlannerView.Week && shownWeek != null) {
                            TextButton(onClick = { copyFrom = shownWeek }, enabled = !busy) { Text("Copy week") }
                        }
                    }
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        TextButton(onClick = {
                            if (view == PlannerView.Week) weekStart = shownWeek?.let { shiftDayKey(it, -7) }
                            else month = month?.let { shiftMonth(it, -1) }
                        }) { Text("‹ Prev") }
                        Text(
                            when {
                                shownWeek == null -> ""
                                view == PlannerView.Week -> weekLabel(shownWeek)
                                else -> month?.let { "${MONTH_NAMES[it.takeLast(2).toInt() - 1]} ${it.take(4)}" }.orEmpty()
                            },
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.weight(1f),
                        )
                        TextButton(onClick = {
                            weekStart = todayWeek
                            month = todayWeek?.take(7)
                        }) { Text("Today") }
                        TextButton(onClick = {
                            if (view == PlannerView.Week) weekStart = shownWeek?.let { shiftDayKey(it, 7) }
                            else month = month?.let { shiftMonth(it, 1) }
                        }) { Text("Next ›") }
                    }
                    if (view == PlannerView.Week && shownWeek != null) {
                        val tags = listOfNotNull(
                            if (shownWeek == todayWeek) "This week" else null,
                            if (shownWeek == orderingWeek) "Clients are ordering for this week" else null,
                            if (todayWeek != null && shownWeek < todayWeek!!) "This week has passed" else null,
                        )
                        if (tags.isNotEmpty()) MutedText(tags.joinToString(" · "))
                    }
                    if (loading || busy) LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                    loadError?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                    message?.let { Text(it, color = MaterialTheme.colorScheme.error) }
                    notice?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
                }
            }

            placing?.let { picked ->
                item(key = "placing") {
                    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                if (picked is Placing.Move) "Moving ${picked.name} — tap “Place here” on a slot."
                                else "Placing ${picked.name} — tap “Place here” on a slot to serve it all week.",
                                modifier = Modifier.weight(1f),
                                style = MaterialTheme.typography.bodyMedium,
                            )
                            TextButton(onClick = { placing = null }) { Text("Cancel") }
                        }
                    }
                }
            }

            if (view == PlannerView.Week) {
                val plan = plans.firstOrNull { it.weekStart == shownWeek }
                if (plan != null) {
                    items(PLAN_SLOTS, key = { "slot-$it" }) { slot ->
                        val meals = plan.slots[slot].orEmpty()
                        AdminCard(title = "${slotLabel(slot)} (${meals.size})") {
                            if (meals.isEmpty()) MutedText("No meals yet.")
                            meals.forEach { meal ->
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { actionsFor = PlacedRef(plan.weekStart, slot, meal) }
                                        .padding(vertical = 4.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    MealThumbnail(meal.imageUrl, contentDescription = meal.name, size = 44.dp)
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(meal.name, fontWeight = FontWeight.SemiBold)
                                        Text(
                                            placedNote(meal),
                                            style = MaterialTheme.typography.bodySmall,
                                            color = if (meal.days < 7) MaterialTheme.colorScheme.tertiary
                                            else MaterialTheme.colorScheme.onSurfaceVariant,
                                        )
                                    }
                                    Text("⋮", style = MaterialTheme.typography.titleMedium)
                                }
                            }
                            PlaceHereButton(plan.weekStart, slot)
                        }
                    }
                }
            } else {
                items(plans, key = { "week-${it.weekStart}" }) { plan ->
                    AdminCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(weekLabel(plan.weekStart), fontWeight = FontWeight.SemiBold)
                                val tags = listOfNotNull(
                                    if (plan.weekStart == todayWeek) "This week" else null,
                                    if (plan.weekStart == orderingWeek) "Clients ordering now" else null,
                                )
                                if (tags.isNotEmpty()) {
                                    Text(tags.joinToString(" · "), style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                                }
                            }
                            TextButton(onClick = {
                                weekStart = plan.weekStart
                                view = PlannerView.Week
                            }) { Text("Open") }
                            TextButton(onClick = { copyFrom = plan.weekStart }, enabled = !busy) { Text("Copy") }
                        }
                        PLAN_SLOTS.forEach { slot ->
                            val meals = plan.slots[slot].orEmpty()
                            Row(verticalAlignment = Alignment.Top) {
                                Text(
                                    slotLabel(slot),
                                    style = MaterialTheme.typography.labelMedium,
                                    modifier = Modifier.width(84.dp).padding(top = 14.dp),
                                )
                                FlowRow(
                                    modifier = Modifier.weight(1f),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                                ) {
                                    if (meals.isEmpty() && placing == null) {
                                        MutedText("—")
                                    }
                                    meals.forEach { meal ->
                                        AssistChip(
                                            onClick = { actionsFor = PlacedRef(plan.weekStart, slot, meal) },
                                            label = {
                                                Text(
                                                    if (meal.days < 7) "${meal.name} (${meal.days}/7)" else meal.name,
                                                    maxLines = 1,
                                                    overflow = TextOverflow.Ellipsis,
                                                )
                                            },
                                        )
                                    }
                                    placing?.let {
                                        AssistChip(
                                            onClick = { placeHere(plan.weekStart, slot) },
                                            enabled = !busy,
                                            label = { Text("+ Place here") },
                                            colors = AssistChipDefaults.assistChipColors(
                                                containerColor = MaterialTheme.colorScheme.primaryContainer,
                                            ),
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }

            item(key = "meals-header") {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp), modifier = Modifier.padding(top = 8.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("Meals", style = MaterialTheme.typography.titleLarge, modifier = Modifier.weight(1f))
                        OutlinedButton(onClick = { editor = EditorState(null) }) { Text("New meal") }
                    }
                    MutedText("Tap Place on a meal, then “Place here” on a slot to serve it every day of that week.")
                    Row(
                        modifier = Modifier.horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        FilterChip(selected = slotFilter == null, onClick = { slotFilter = null }, label = { Text("All") })
                        PLAN_SLOTS.forEach { s ->
                            FilterChip(selected = slotFilter == s, onClick = { slotFilter = s }, label = { Text(slotLabel(s)) })
                        }
                    }
                }
            }

            val meals = catalog
            if (meals == null) {
                item(key = "meals-loading") { MutedText("Loading meals…") }
            } else {
                val shown = meals.filter { slotFilter == null || it.slot == slotFilter }
                if (shown.isEmpty()) item(key = "meals-empty") { MutedText("No meals yet. Tap New meal to add one.") }
                items(shown, key = { "meal-${it.id}" }) { meal ->
                    val selected = (placing as? Placing.New)?.meal?.id == meal.id
                    AdminCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            MealThumbnail(meal.imageUrl, contentDescription = meal.name, size = 52.dp)
                            Spacer(modifier = Modifier.width(10.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(meal.name, fontWeight = FontWeight.SemiBold)
                                MutedText(
                                    listOfNotNull(
                                        slotLabel(meal.slot),
                                        formatMoney(meal.price),
                                        if (meal.soldIndividually) null else "Packages only",
                                    ).joinToString(" · "),
                                )
                            }
                            TextButton(onClick = { editor = EditorState(meal) }) { Text("Edit") }
                            if (selected) {
                                OutlinedButton(onClick = { placing = null }) { Text("Selected") }
                            } else {
                                Button(onClick = { pick(Placing.New(meal)) }, enabled = !busy) { Text("Place") }
                            }
                        }
                    }
                }
            }
        }

        editor?.let { state ->
            Surface(modifier = Modifier.fillMaxSize()) {
                AdminMealEditor(
                    repo = repo,
                    meal = state.meal,
                    onClose = { editor = null },
                    onChanged = {
                        catalogToken++
                        plansToken++
                    },
                )
            }
        }
    }

    actionsFor?.let { ref ->
        AlertDialog(
            onDismissRequest = { actionsFor = null },
            title = { Text(ref.meal.name) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    MutedText(
                        "${slotLabel(ref.slot)} · ${weekLabel(ref.weekStart)}" +
                            if (ref.meal.days < 7) " · served ${ref.meal.days} of 7 days" else "",
                    )
                    SwitchRow("Available to order", ref.meal.available, enabled = !busy) { on ->
                        setFlags(ref, available = on)
                    }
                    SwitchRow("Packages only", !ref.meal.soldIndividually, enabled = !busy) { on ->
                        setFlags(ref, soldIndividually = !on)
                    }
                    TextButton(onClick = {
                        actionsFor = null
                        pick(Placing.Move(ref.weekStart, ref.slot, ref.meal))
                    }) { Text("Move to another slot or week") }
                    if (ref.meal.days < 7) {
                        TextButton(onClick = {
                            actionsFor = null
                            act("Could not update ${ref.meal.name}", {
                                repo.placeMeal(PlaceMealRequest(ref.weekStart, ref.slot, ref.meal.name))
                            }) { notice = "${ref.meal.name} is now served all 7 days." }
                        }) { Text("Serve all 7 days") }
                    }
                    TextButton(onClick = {
                        actionsFor = null
                        confirmRemove = ref
                    }) { Text("Remove from this week", color = MaterialTheme.colorScheme.error) }
                }
            },
            confirmButton = { TextButton(onClick = { actionsFor = null }) { Text("Close") } },
        )
    }

    confirmRemove?.let { ref ->
        AlertDialog(
            onDismissRequest = { confirmRemove = null },
            title = { Text("Remove ${ref.meal.name}?") },
            text = { Text("It will no longer be served for ${slotLabel(ref.slot)} in ${weekLabel(ref.weekStart)}.") },
            confirmButton = {
                TextButton(onClick = {
                    confirmRemove = null
                    act("Could not remove ${ref.meal.name}", {
                        repo.removeWeekMeal(WeekMealRequest(ref.weekStart, ref.slot, ref.meal.name))
                    }) { notice = "${ref.meal.name} removed from ${weekLabel(ref.weekStart)}." }
                }) { Text("Remove", color = MaterialTheme.colorScheme.error) }
            },
            dismissButton = { TextButton(onClick = { confirmRemove = null }) { Text("Cancel") } },
        )
    }

    copyFrom?.let { source ->
        var target by remember(source) { mutableStateOf(shiftDayKey(source, 7)) }
        AlertDialog(
            onDismissRequest = { copyFrom = null },
            title = { Text("Copy ${weekLabel(source)}") },
            text = {
                Column {
                    MutedText("Every meal in this week will be served all week in the week you choose. Meals already there stay.")
                    (1..8).map { shiftDayKey(source, 7 * it) }.forEach { week ->
                        Row(
                            modifier = Modifier.fillMaxWidth().clickable { target = week },
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            RadioButton(selected = target == week, onClick = { target = week })
                            Text(weekLabel(week))
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    copyFrom = null
                    act("Could not copy the week", { repo.copyWeek(source, target) }) { result ->
                        notice = "Copied ${result.meals} meal${if (result.meals == 1) "" else "s"} into ${weekLabel(target)}" +
                            if (result.added == 0) " (they were already there)." else "."
                    }
                }) { Text("Copy") }
            },
            dismissButton = { TextButton(onClick = { copyFrom = null }) { Text("Cancel") } },
        )
    }
}
