package com.nutrimotion.cmp.ui.screens.admin

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.nutrimotion.cmp.data.model.CatalogMealDto
import com.nutrimotion.cmp.data.model.CatalogMealRequest
import com.nutrimotion.cmp.data.model.MealSlots
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import com.nutrimotion.cmp.ui.components.MealThumbnail
import com.nutrimotion.cmp.ui.components.PrimaryButton
import com.nutrimotion.cmp.ui.images.MealPhotos
import com.nutrimotion.cmp.ui.images.rememberImagePicker
import kotlinx.coroutines.launch

/** Breakfast, lunch, smoothies and juice shots — the slots a week's menu is planned in. */
val PLAN_SLOTS = listOf(MealSlots.BREAKFAST, MealSlots.LUNCH, MealSlots.SMOOTHIES, MealSlots.JUICE_SHOT)

private val DEFAULT_PRICES = mapOf(
    MealSlots.BREAKFAST to 1200.0,
    MealSlots.LUNCH to 1500.0,
    MealSlots.SMOOTHIES to 8.0,
    MealSlots.JUICE_SHOT to 8.0,
)

private fun priceText(price: Double): String =
    if (price % 1.0 == 0.0) price.toLong().toString() else price.toString()

/** Create (when [meal] is null) or edit a saved meal, including its photo. */
@Composable
fun AdminMealEditor(
    repo: NutrimotionRepository,
    meal: CatalogMealDto?,
    onClose: () -> Unit,
    onChanged: () -> Unit,
) {
    val scope = rememberCoroutineScope()
    var current by remember { mutableStateOf(meal) }
    var name by remember { mutableStateOf(meal?.name.orEmpty()) }
    var slot by remember { mutableStateOf(meal?.slot?.takeIf { it in PLAN_SLOTS } ?: MealSlots.LUNCH) }
    var price by remember { mutableStateOf(priceText(meal?.price ?: DEFAULT_PRICES.getValue(MealSlots.LUNCH))) }
    var description by remember { mutableStateOf(meal?.description.orEmpty()) }
    var instagram by remember { mutableStateOf(meal?.instagramLink.orEmpty()) }
    var soldIndividually by remember { mutableStateOf(meal?.soldIndividually ?: true) }
    var saving by remember { mutableStateOf(false) }
    var photoBusy by remember { mutableStateOf(false) }
    var confirmDelete by remember { mutableStateOf(false) }
    var message by remember { mutableStateOf<String?>(null) }
    var notice by remember { mutableStateOf<String?>(null) }
    /** Photo chosen before the meal is first saved; attached when it is created. */
    var pendingPhoto by remember { mutableStateOf<String?>(null) }

    val pickPhoto = rememberImagePicker { picked ->
        if (picked == null) return@rememberImagePicker
        val target = current
        if (target == null) {
            photoBusy = true
            message = null
            notice = null
            scope.launch {
                val prepared = MealPhotos.prepare(picked)
                if (prepared == null) {
                    message = "That image couldn't be read. Please choose a JPG, PNG or WebP photo."
                } else {
                    repo.storeMealPhoto(name.trim().ifBlank { "meal" }, prepared.bytes, prepared.contentType)
                        .onSuccess {
                            pendingPhoto = it
                            notice = "Photo ready — it is saved with the meal when you press Save."
                        }
                        .onFailure { message = it.friendlyMessage("Could not upload the photo") }
                }
                photoBusy = false
            }
            return@rememberImagePicker
        }
        photoBusy = true
        message = null
        notice = null
        scope.launch {
            val prepared = MealPhotos.prepare(picked)
            if (prepared == null) {
                message = "That image couldn't be read. Please choose a JPG, PNG or WebP photo."
                photoBusy = false
                return@launch
            }
            repo.uploadMealPhoto(target.name, prepared.bytes, prepared.contentType)
                .onSuccess { url ->
                    current = target.copy(imageUrl = url)
                    notice = if (prepared.reduced) {
                        "Photo saved — reduced from ${MealPhotos.formatSize(prepared.originalBytes)} " +
                            "to ${MealPhotos.formatSize(prepared.bytes.size)}."
                    } else {
                        "Photo saved."
                    }
                    onChanged()
                }
                .onFailure { message = it.friendlyMessage("Could not upload the photo") }
            photoBusy = false
        }
    }

    fun removePhoto() {
        val target = current
        if (target == null) {
            pendingPhoto = null
            return
        }
        photoBusy = true
        message = null
        notice = null
        scope.launch {
            repo.removeMealPhoto(target.name)
                .onSuccess {
                    current = target.copy(imageUrl = null)
                    notice = "Photo removed."
                    onChanged()
                }
                .onFailure { message = it.friendlyMessage("Could not remove the photo") }
            photoBusy = false
        }
    }

    fun save() {
        val amount = price.trim().toDoubleOrNull()
        if (amount == null || amount < 0) {
            message = "Price must be zero or more."
            return
        }
        saving = true
        message = null
        notice = null
        scope.launch {
            val body = CatalogMealRequest(
                name = name.trim(),
                description = description.trim(),
                price = amount,
                slot = slot,
                soldIndividually = soldIndividually,
                instagramLink = instagram.trim(),
            )
            val creating = current == null
            repo.saveCatalogMeal(current?.id, body)
                .onSuccess { saved ->
                    current = saved
                    notice = "Meal saved."
                    val photo = pendingPhoto
                    if (creating && photo != null) {
                        repo.setMealPhoto(saved.name, photo)
                            .onSuccess {
                                current = saved.copy(imageUrl = photo)
                                pendingPhoto = null
                            }
                            .onFailure {
                                message = it.friendlyMessage(
                                    "The meal was saved, but its photo could not be attached. Try adding it again",
                                )
                            }
                    }
                    onChanged()
                }
                .onFailure { message = it.friendlyMessage("Could not save the meal") }
            saving = false
        }
    }

    fun delete() {
        val target = current ?: return
        saving = true
        message = null
        scope.launch {
            repo.deleteCatalogMeal(target.id)
                .onSuccess {
                    onChanged()
                    onClose()
                }
                .onFailure { message = it.friendlyMessage("Could not delete the meal") }
            saving = false
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            TextButton(onClick = onClose, enabled = !saving) { Text("‹ Back") }
            Text(
                current?.let { "Edit ${it.name}" } ?: "New meal",
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.padding(start = 4.dp),
            )
        }
        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("Meal name") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        Text("Usual slot", style = MaterialTheme.typography.labelLarge)
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            PLAN_SLOTS.forEach { s ->
                FilterChip(
                    selected = slot == s,
                    onClick = {
                        if (current == null && slot != s) price = priceText(DEFAULT_PRICES.getValue(s))
                        slot = s
                    },
                    label = { Text(MealSlots.LABELS[s] ?: s) },
                )
            }
        }
        OutlinedTextField(
            value = price,
            onValueChange = { price = it },
            label = { Text("Price") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = description,
            onValueChange = { description = it },
            label = { Text("Description") },
            minLines = 2,
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = instagram,
            onValueChange = { instagram = it },
            label = { Text("Instagram link (optional)") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
        )
        SwitchRow("Sell individually (off = packages only)", soldIndividually) { soldIndividually = it }

        AdminCard(title = "Photo") {
            val photoUrl = (current?.imageUrl ?: pendingPhoto)?.takeIf { it.isNotBlank() }
            Row(verticalAlignment = Alignment.CenterVertically) {
                MealThumbnail(photoUrl, contentDescription = name.ifBlank { "Meal photo" }, size = 88.dp)
                Spacer(modifier = Modifier.width(12.dp))
                if (photoBusy) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                } else {
                    Column {
                        TextButton(onClick = { pickPhoto() }, enabled = !saving) {
                            Text(if (photoUrl == null) "Add photo" else "Change photo")
                        }
                        if (photoUrl != null) {
                            TextButton(onClick = { removePhoto() }, enabled = !saving) { Text("Remove photo") }
                        }
                    }
                }
            }
            MutedText("Photos over 5 MB are reduced automatically. The photo shows for every day this meal is served.")
        }

        message?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        notice?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
        if (current != null) {
            MutedText("Changes to the name, price and description also apply to this meal on today's and later days.")
        }
        PrimaryButton(
            text = if (saving) "Saving…" else "Save",
            onClick = { save() },
            enabled = !saving && !photoBusy && name.isNotBlank(),
        )
        if (current != null) {
            TextButton(onClick = { confirmDelete = true }, enabled = !saving, modifier = Modifier.fillMaxWidth()) {
                Text("Delete meal", color = MaterialTheme.colorScheme.error)
            }
        }
    }

    if (confirmDelete) {
        AlertDialog(
            onDismissRequest = { confirmDelete = false },
            title = { Text("Delete ${current?.name}?") },
            text = { Text("This removes the meal from your meal list. Meals on this week's or later menus must be removed from those weeks first.") },
            confirmButton = {
                TextButton(onClick = {
                    confirmDelete = false
                    delete()
                }) { Text("Delete", color = MaterialTheme.colorScheme.error) }
            },
            dismissButton = { TextButton(onClick = { confirmDelete = false }) { Text("Cancel") } },
        )
    }
}
