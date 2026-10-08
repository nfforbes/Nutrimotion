package com.nutrimotion.cmp.ui.screens.admin

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import com.nutrimotion.cmp.data.model.AdminPackageDto
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import kotlinx.coroutines.launch

private val DAY_NAMES = listOf("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")

private fun contents(p: AdminPackageDto): String = listOf(
    p.breakfastCount to "breakfast",
    p.lunchCount to "lunch",
    p.dinnerCount to "dinner",
    p.smoothieCount to "smoothie",
    p.juiceShotCount to "juice shot",
).filter { it.first > 0 }.joinToString(" · ") { (n, label) -> "$n $label${if (n == 1) "" else "s"}" }

@Composable
fun AdminPackagesScreen(repo: NutrimotionRepository) {
    var message by remember { mutableStateOf<String?>(null) }
    val overrides = remember { mutableStateMapOf<String, Boolean>() }
    val scope = rememberCoroutineScope()

    AdminLoader(load = { repo.getAdminPackages() }) { packages, reload ->
        Column(modifier = Modifier.fillMaxSize()) {
            Text(
                "Switch a package off to hide it from customers. Create or edit packages on the website.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(16.dp),
            )
            message?.let {
                Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(horizontal = 16.dp))
            }
            LazyColumn(
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                if (packages.isEmpty()) item { MutedText("No packages yet.") }
                items(packages, key = { it.id }) { pkg ->
                    val active = overrides[pkg.id] ?: pkg.active
                    AdminCard {
                        Row {
                            Text(pkg.name, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                            Text(formatMoney(pkg.cost), fontWeight = FontWeight.SemiBold)
                        }
                        MutedText(contents(pkg).ifBlank { "No meals set" })
                        MutedText(
                            if (pkg.daysOption == "specific" && pkg.specificDays.isNotEmpty()) {
                                "Days: " + pkg.specificDays.sorted().joinToString { DAY_NAMES.getOrElse(it) { "?" } }
                            } else {
                                "Any days"
                            },
                        )
                        SwitchRow("Offered to customers", active) { on ->
                            overrides[pkg.id] = on
                            scope.launch {
                                repo.setPackageActive(pkg.id, on)
                                    .onSuccess { reload() }
                                    .onFailure {
                                        overrides.remove(pkg.id)
                                        message = it.friendlyMessage("Could not update ${pkg.name}")
                                    }
                            }
                        }
                    }
                }
            }
        }
    }
}
