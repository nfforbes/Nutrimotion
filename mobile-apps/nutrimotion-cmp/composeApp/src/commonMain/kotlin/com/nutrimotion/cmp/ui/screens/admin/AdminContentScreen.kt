package com.nutrimotion.cmp.ui.screens.admin

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.nutrimotion.cmp.data.model.AdminPermissions
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import kotlinx.coroutines.launch

private enum class ContentTab(val label: String, val permission: String) {
    Recipes("Recipes", AdminPermissions.MANAGE_RECIPES),
    Videos("Videos", AdminPermissions.MANAGE_VIDEOS),
    Books("Books", AdminPermissions.MANAGE_BOOKS),
    Training("Training", AdminPermissions.MANAGE_TRAINING),
}

@Composable
fun AdminContentScreen(repo: NutrimotionRepository, hasPermission: (String) -> Boolean) {
    val tabs = ContentTab.entries.filter { hasPermission(it.permission) }
    var tab by remember { mutableStateOf(tabs.firstOrNull()) }

    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()).padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            tabs.forEach { t -> FilterChip(selected = tab == t, onClick = { tab = t }, label = { Text(t.label) }) }
        }
        key(tab) {
            when (tab) {
                ContentTab.Recipes -> SubscriptionLibrary(repo, "recipes")
                ContentTab.Videos -> SubscriptionLibrary(repo, "videos")
                ContentTab.Books -> BooksList(repo)
                ContentTab.Training -> TrainingList(repo)
                null -> MutedText("You don't have permission to manage content.")
            }
        }
    }
}

private data class LibraryItem(val id: String, val title: String, val subtitle: String?, val isFree: Boolean)

@Composable
private fun SubscriptionLibrary(repo: NutrimotionRepository, library: String) {
    val overrides = remember { mutableStateMapOf<String, Boolean>() }
    var message by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    AdminLoader(
        load = {
            if (library == "recipes") {
                repo.getAdminRecipes().map { list -> list.map { LibraryItem(it.id, it.title, null, it.isFree) } }
            } else {
                repo.getAdminVideos().map { list -> list.map { LibraryItem(it.id, it.title, it.category, it.isFree) } }
            }
        },
    ) { items, reload ->
        LazyColumn(
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            item { PriceCard(repo, library) }
            item {
                MutedText(
                    "Free items are open to everyone; the rest need a subscription. " +
                        "Upload or edit ${library} on the website.",
                )
                message?.let { Text(it, color = MaterialTheme.colorScheme.error) }
            }
            if (items.isEmpty()) item { MutedText("Nothing uploaded yet.") }
            items(items, key = { it.id }) { item ->
                val free = overrides[item.id] ?: item.isFree
                AdminCard {
                    Text(item.title, fontWeight = FontWeight.SemiBold)
                    item.subtitle?.takeIf { it.isNotBlank() }?.let { MutedText(it) }
                    SwitchRow("Free for everyone", free) { on ->
                        overrides[item.id] = on
                        scope.launch {
                            repo.setContentFree(library, item.id, on)
                                .onSuccess { reload() }
                                .onFailure {
                                    overrides.remove(item.id)
                                    message = it.friendlyMessage("Could not update ${item.title}")
                                }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PriceCard(repo: NutrimotionRepository, library: String) {
    var saved by remember { mutableStateOf<Double?>(null) }
    var text by remember { mutableStateOf("") }
    var message by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(library) {
        repo.getContentAccess(library)
            .onSuccess {
                saved = it.monthlyPrice
                text = formatMoney(it.monthlyPrice).removePrefix("$")
            }
            .onFailure { message = it.friendlyMessage("Could not load the price") }
    }

    val parsed = text.trim().toDoubleOrNull()
    AdminCard("Monthly subscription price") {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = text,
                onValueChange = {
                    text = it
                    message = null
                },
                label = { Text("Price ($)") },
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                modifier = Modifier.weight(1f),
            )
            Button(
                enabled = parsed != null && parsed >= 0 && parsed != saved,
                onClick = {
                    scope.launch {
                        repo.setContentPrice(library, parsed ?: return@launch)
                            .onSuccess {
                                saved = it.monthlyPrice
                                message = "Saved"
                            }
                            .onFailure { message = it.friendlyMessage("Could not save the price") }
                    }
                },
            ) { Text("Save") }
        }
        message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
    }
}

@Composable
private fun BooksList(repo: NutrimotionRepository) {
    AdminLoader(load = { repo.getAdminBooks() }) { books, _ ->
        LazyColumn(
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            item { MutedText("Add or edit books on the website.") }
            if (books.isEmpty()) item { MutedText("No books yet.") }
            items(books, key = { it.id }) { book ->
                AdminCard {
                    Row(modifier = Modifier.fillMaxWidth()) {
                        Text(book.title, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                        Text(formatMoney(book.price))
                    }
                    MutedText(listOfNotNull(book.author, book.pageCount?.let { "$it pages" }).joinToString(" · "))
                }
            }
        }
    }
}

@Composable
private fun TrainingList(repo: NutrimotionRepository) {
    AdminLoader(load = { repo.getAdminTraining() }) { packages, _ ->
        LazyColumn(
            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            item { MutedText("Add or edit training packages on the website.") }
            if (packages.isEmpty()) item { MutedText("No training packages yet.") }
            items(packages, key = { it.id }) { p ->
                AdminCard {
                    Row(modifier = Modifier.fillMaxWidth()) {
                        Text(p.name, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                        Text(formatMoney(p.price))
                    }
                    MutedText(listOf(p.duration, p.level.replaceFirstChar { it.uppercase() }).filter { it.isNotBlank() }.joinToString(" · "))
                }
            }
        }
    }
}
