package com.nutrimotion.cmp.ui.screens.admin

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.nutrimotion.cmp.data.model.LibraryMeal
import com.nutrimotion.cmp.data.model.LibraryMealPatch
import com.nutrimotion.cmp.data.model.MealMenu
import com.nutrimotion.cmp.data.model.MealSlots
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import kotlinx.coroutines.launch

@Composable
fun AdminMealsScreen(repo: NutrimotionRepository) {
    var menuKey by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }
    val overrides = remember { mutableStateMapOf<String, LibraryMeal>() }
    val scope = rememberCoroutineScope()

    AdminLoader(load = { repo.getMealLibrary() }) { library, reload ->
        val menus = library.menus
        fun keyOf(menu: MealMenu) = "${menu.label}|${menu.weekStart}"
        val menu = menus.firstOrNull { keyOf(it) == menuKey } ?: menus.lastOrNull()

        fun update(menu: MealMenu, meal: LibraryMeal, changed: LibraryMeal, patch: LibraryMealPatch) {
            val key = "${keyOf(menu)}|${meal.slot}|${meal.name}"
            overrides[key] = changed
            scope.launch {
                repo.patchLibraryMeal(patch)
                    .onSuccess { reload() }
                    .onFailure {
                        overrides.remove(key)
                        message = it.friendlyMessage("Could not update ${meal.name}")
                    }
            }
        }

        Column(modifier = Modifier.fillMaxSize()) {
            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 12.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                menus.forEach { m ->
                    FilterChip(
                        selected = menu != null && keyOf(m) == keyOf(menu),
                        onClick = { menuKey = keyOf(m) },
                        label = { Text(m.label) },
                    )
                }
            }
            Text(
                "Available off hides the meal everywhere. Sell individually off keeps it in packages only. " +
                    "Each switch applies to all 7 days. Add or edit meals on the website.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 16.dp),
            )
            message?.let {
                Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(horizontal = 16.dp))
            }
            if (menu == null) {
                MutedText("No meals yet.")
                return@Column
            }
            val meals = menu.meals.sortedWith(
                compareBy<LibraryMeal>({ MealSlots.ORDER.indexOf(it.slot).let { i -> if (i < 0) 99 else i } }, { it.name }),
            )
            LazyColumn(
                contentPadding = PaddingValues(12.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                items(meals, key = { "${it.slot}|${it.name}" }) { original ->
                    val meal = overrides["${keyOf(menu)}|${original.slot}|${original.name}"] ?: original
                    AdminCard {
                        Text(meal.name, fontWeight = FontWeight.SemiBold)
                        MutedText("${MealSlots.LABELS[meal.slot] ?: meal.slot} · ${formatMoney(meal.price)}")
                        SwitchRow("Available", meal.available) { on ->
                            update(
                                menu, original, meal.copy(available = on),
                                LibraryMealPatch(meal.name, meal.slot, menu.label, menu.weekStart, available = on),
                            )
                        }
                        SwitchRow("Sell individually", meal.soldIndividually) { on ->
                            update(
                                menu, original, meal.copy(soldIndividually = on),
                                LibraryMealPatch(meal.name, meal.slot, menu.label, menu.weekStart, soldIndividually = on),
                            )
                        }
                    }
                }
            }
        }
    }
}
