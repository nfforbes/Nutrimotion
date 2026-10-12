package com.nutrimotion.cmp.ui.screens.admin

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.nutrimotion.cmp.data.model.LibraryMeal
import com.nutrimotion.cmp.data.model.LibraryMealPatch
import com.nutrimotion.cmp.data.model.MealMenu
import com.nutrimotion.cmp.data.model.MealSlots
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import com.nutrimotion.cmp.ui.components.MealThumbnail
import com.nutrimotion.cmp.ui.images.MealPhotos
import com.nutrimotion.cmp.ui.images.rememberImagePicker
import kotlinx.coroutines.launch

@Composable
fun AdminMealsScreen(repo: NutrimotionRepository) {
    var menuKey by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }
    var notice by remember { mutableStateOf<String?>(null) }
    val overrides = remember { mutableStateMapOf<String, LibraryMeal>() }
    /** Photo per meal name after an upload/removal this session; "" means removed. */
    val photos = remember { mutableStateMapOf<String, String>() }
    var photoTarget by remember { mutableStateOf<String?>(null) }
    var photoBusy by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    val pickPhoto = rememberImagePicker { picked ->
        val name = photoTarget ?: return@rememberImagePicker
        photoTarget = null
        if (picked == null) return@rememberImagePicker
        photoBusy = name
        message = null
        notice = null
        scope.launch {
            val prepared = MealPhotos.prepare(picked)
            if (prepared == null) {
                message = "That image couldn't be read. Please choose a JPG, PNG or WebP photo."
                photoBusy = null
                return@launch
            }
            repo.uploadMealPhoto(name, prepared.bytes, prepared.contentType)
                .onSuccess { url ->
                    photos[name] = url
                    notice = if (prepared.reduced) {
                        "Photo for $name saved — reduced from ${MealPhotos.formatSize(prepared.originalBytes)} " +
                            "to ${MealPhotos.formatSize(prepared.bytes.size)}."
                    } else {
                        "Photo for $name saved."
                    }
                }
                .onFailure { message = it.friendlyMessage("Could not upload the photo for $name") }
            photoBusy = null
        }
    }

    fun removePhoto(name: String) {
        photoBusy = name
        message = null
        notice = null
        scope.launch {
            repo.removeMealPhoto(name)
                .onSuccess {
                    photos[name] = ""
                    notice = "Photo removed from $name."
                }
                .onFailure { message = it.friendlyMessage("Could not remove the photo from $name") }
            photoBusy = null
        }
    }

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
                    "Each switch and photo applies to every day of the meal. Photos over 5 MB are reduced automatically.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(horizontal = 16.dp),
            )
            message?.let {
                Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(horizontal = 16.dp))
            }
            notice?.let {
                Text(it, color = MaterialTheme.colorScheme.primary, modifier = Modifier.padding(horizontal = 16.dp))
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
                    val photo = (photos[meal.name] ?: meal.imageUrl)?.takeIf { it.isNotBlank() }
                    AdminCard {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            MealThumbnail(photo, contentDescription = meal.name, size = 72.dp)
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(meal.name, fontWeight = FontWeight.SemiBold)
                                MutedText("${MealSlots.LABELS[meal.slot] ?: meal.slot} · ${formatMoney(meal.price)}")
                                if (photoBusy == meal.name) {
                                    CircularProgressIndicator(modifier = Modifier.padding(top = 6.dp).size(20.dp), strokeWidth = 2.dp)
                                } else {
                                    Row {
                                        TextButton(
                                            onClick = {
                                                photoTarget = meal.name
                                                pickPhoto()
                                            },
                                            enabled = photoBusy == null,
                                        ) { Text(if (photo == null) "Add photo" else "Change photo") }
                                        if (photo != null) {
                                            TextButton(onClick = { removePhoto(meal.name) }, enabled = photoBusy == null) {
                                                Text("Remove")
                                            }
                                        }
                                    }
                                }
                            }
                        }
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
