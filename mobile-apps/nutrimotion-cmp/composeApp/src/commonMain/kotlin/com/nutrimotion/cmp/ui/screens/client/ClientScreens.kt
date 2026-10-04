package com.nutrimotion.cmp.ui.screens.client

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.Card
import androidx.compose.material3.Checkbox
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.ui.Alignment
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.unit.dp
import com.nutrimotion.cmp.data.model.CartDto
import com.nutrimotion.cmp.data.model.CartItemRequest
import com.nutrimotion.cmp.data.model.CatalogItemDto
import com.nutrimotion.cmp.data.model.CheckoutRequest
import com.nutrimotion.cmp.data.model.CouponDto
import com.nutrimotion.cmp.data.model.CreateSubscriptionRequest
import com.nutrimotion.cmp.data.model.DeliveryAddress
import com.nutrimotion.cmp.data.model.MealDto
import com.nutrimotion.cmp.data.model.MealSlots
import com.nutrimotion.cmp.data.model.OrderDto
import com.nutrimotion.cmp.data.model.PackageDto
import com.nutrimotion.cmp.data.model.ProfileUpdateRequest
import com.nutrimotion.cmp.data.model.RecipeDto
import com.nutrimotion.cmp.data.model.RecipesPage
import com.nutrimotion.cmp.data.model.SubscriptionDto
import com.nutrimotion.cmp.data.model.SubscriptionPlanDto
import com.nutrimotion.cmp.data.model.VideosPage
import com.nutrimotion.cmp.data.model.TrackingResponse
import com.nutrimotion.cmp.data.model.UserProfile
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import com.nutrimotion.cmp.domain.PackageBrowseLogic
import com.nutrimotion.cmp.domain.PackageSelectionLogic
import com.nutrimotion.cmp.domain.PackageSort
import com.nutrimotion.cmp.domain.PackageSpan
import com.nutrimotion.cmp.ui.components.EmptyBox
import com.nutrimotion.cmp.ui.components.ErrorBox
import com.nutrimotion.cmp.ui.components.LoadingBox
import com.nutrimotion.cmp.ui.components.PrimaryButton
import com.nutrimotion.cmp.ui.components.SecondaryButton
import com.nutrimotion.cmp.ui.components.SimpleListScreen
import com.nutrimotion.cmp.ui.map.MapMarker
import com.nutrimotion.cmp.ui.map.TrackingMapView
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.contentOrNull

@Composable
fun ClientHomeScreen(repo: NutrimotionRepository, userName: String?) {
    var orders by remember { mutableStateOf<List<OrderDto>>(emptyList()) }
    var coupons by remember { mutableStateOf<List<CouponDto>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        loading = true
        val o = repo.getOrders()
        val c = repo.getMyCoupons()
        orders = o.getOrDefault(emptyList())
        coupons = c.getOrDefault(emptyList())
        error = o.exceptionOrNull()?.message ?: c.exceptionOrNull()?.message
        loading = false
    }

    Column(
        modifier = Modifier
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
    ) {
        Text(
            "Welcome${userName?.let { ", $it" } ?: ""}",
            style = MaterialTheme.typography.headlineSmall,
        )
        Text("Your dashboard", color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(modifier = Modifier.height(16.dp))
        when {
            loading -> LoadingBox(modifier = Modifier.height(120.dp))
            error != null -> Text(error!!, color = MaterialTheme.colorScheme.error)
            else -> {
                Text("Recent orders: ${orders.size}", style = MaterialTheme.typography.titleMedium)
                orders.take(3).forEach {
                    Text("${it.orderNumber} - ${it.status} - $${it.total}")
                }
                Spacer(modifier = Modifier.height(12.dp))
                Text("Coupons: ${coupons.size}", style = MaterialTheme.typography.titleMedium)
                coupons.take(5).forEach { Text("${it.code} - ${it.description}") }
            }
        }
    }
}

@Composable
fun MealsScreen(repo: NutrimotionRepository, onAddedToCart: () -> Unit) {
    var packages by remember { mutableStateOf<List<PackageDto>>(emptyList()) }
    var meals by remember { mutableStateOf<List<MealDto>>(emptyList()) }
    var selected by remember { mutableStateOf<PackageDto?>(null) }
    var selections by remember { mutableStateOf<Map<String, Map<String, List<String>>>>(emptyMap()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }
    var packageSpan by remember { mutableStateOf<PackageSpan?>(null) }
    var packageSort by remember { mutableStateOf(PackageSort.PriceAsc) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        loading = true
        val p = repo.getPackages()
        val m = repo.getMeals()
        packages = p.getOrDefault(emptyList())
        meals = m.getOrDefault(emptyList())
        error = p.exceptionOrNull()?.message ?: m.exceptionOrNull()?.message
        loading = false
    }

    if (selected == null) {
        val groups = PackageBrowseLogic.group(packages, packageSpan, packageSort)
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
        ) {
            Text("Meal packages", style = MaterialTheme.typography.headlineSmall)
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                FilterChip(
                    selected = packageSpan == null,
                    onClick = { packageSpan = null },
                    label = { Text("All") },
                )
                PackageBrowseLogic.spanOrder.forEach { span ->
                    FilterChip(
                        selected = packageSpan == span,
                        onClick = { packageSpan = span },
                        label = { Text(span.label) },
                    )
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                PackageSort.entries.forEach { sort ->
                    FilterChip(
                        selected = packageSort == sort,
                        onClick = { packageSort = sort },
                        label = { Text(sort.label) },
                    )
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            when {
                loading -> LoadingBox(modifier = Modifier.height(120.dp))
                error != null && packages.isEmpty() -> ErrorBox(error!!) {}
                packages.isEmpty() -> EmptyBox("No packages available")
                groups.isEmpty() -> EmptyBox("No packages in this group")
                else -> {
                    groups.forEach { group ->
                        Text(group.label, style = MaterialTheme.typography.titleLarge)
                        Spacer(modifier = Modifier.height(8.dp))
                        group.packages.forEach { pkg ->
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable {
                                        selected = pkg
                                        selections = PackageSelectionLogic.emptySelections(weekDayKeys(meals))
                                    }
                                    .padding(vertical = 8.dp),
                            ) {
                                Text(pkg.name, style = MaterialTheme.typography.titleMedium)
                                if (pkg.description.isNotBlank()) {
                                    Text(pkg.description, style = MaterialTheme.typography.bodySmall)
                                }
                                Text("$${pkg.cost}", style = MaterialTheme.typography.titleSmall)
                            }
                        }
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }
            }
        }
    } else {
        val pkg = selected!!
        val steps = PackageSelectionLogic.wizardSlots(pkg)
        var stepIndex by remember(pkg.id) { mutableStateOf(0) }
        val slot = steps.getOrNull(stepIndex.coerceIn(0, (steps.size - 1).coerceAtLeast(0)))
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
        ) {
            TextButton(onClick = { selected = null }) { Text("Back") }
            Text(pkg.name, style = MaterialTheme.typography.headlineSmall)
            if (steps.isEmpty() || slot == null) {
                Text("This package has no meals to choose.")
            } else {
                val limit = PackageSelectionLogic.slotLimit(pkg, slot)
                val used = PackageSelectionLogic.countAcrossDays(selections, slot)
                val stepMeals = meals
                    .filter {
                        it.slot == slot ||
                            (slot == MealSlots.DINNER && (it.slot == "lunch" || it.slot == "dinner"))
                    }
                    .distinctBy { it.name }
                Text(
                    "Step ${stepIndex + 1} of ${steps.size}",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Text(
                    "${MealSlots.LABELS[slot]} ($used / $limit)",
                    style = MaterialTheme.typography.titleMedium,
                )
                Text("Check a meal, then use + and − to choose how many.")
                Spacer(modifier = Modifier.height(8.dp))
                stepMeals.forEach { meal ->
                    val mealId = meal.id ?: return@forEach
                    val day = meal.scheduledDate.take(10).ifBlank { weekDayKeys(meals).first() }
                    val qty = PackageSelectionLogic.quantityOf(selections, slot, mealId)
                    val canIncrease = PackageSelectionLogic.canAdd(pkg, selections, slot)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Checkbox(
                            checked = qty > 0,
                            onCheckedChange = { checked ->
                                selections = PackageSelectionLogic.withQuantity(
                                    selections,
                                    day,
                                    slot,
                                    mealId,
                                    if (checked) 1 else 0,
                                    limit,
                                )
                            },
                            enabled = qty > 0 || canIncrease,
                        )
                        Text(meal.name, modifier = Modifier.weight(1f))
                        IconButton(
                            onClick = {
                                selections = PackageSelectionLogic.withQuantity(
                                    selections, day, slot, mealId, qty - 1, limit,
                                )
                            },
                            enabled = qty > 0,
                        ) {
                            Icon(Icons.Filled.Remove, contentDescription = "Decrease")
                        }
                        Text("$qty", style = MaterialTheme.typography.titleMedium)
                        IconButton(
                            onClick = {
                                selections = PackageSelectionLogic.withQuantity(
                                    selections, day, slot, mealId, qty + 1, limit,
                                )
                            },
                            enabled = canIncrease,
                        ) {
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
                }
            }
            message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
            if (steps.isNotEmpty() && stepIndex == steps.lastIndex) {
            val complete = steps.all { step ->
                PackageSelectionLogic.countAcrossDays(selections, step) ==
                    PackageSelectionLogic.slotLimit(pkg, step)
            }
            PrimaryButton(
                text = "Add package to cart",
                enabled = complete,
                onClick = {
                    scope.launch {
                        val nameById = meals.mapNotNull { meal -> meal.id?.let { it to meal.name } }.toMap()
                        val details = selections.mapValues { (_, slots) ->
                            slots.mapValues { (_, ids) -> ids.map { nameById[it] ?: it } }
                        }
                        val result = repo.addCartItem(
                            CartItemRequest(
                                itemType = "package",
                                itemId = pkg.id.orEmpty(),
                                name = pkg.name,
                                price = pkg.cost,
                                quantity = 1,
                                imageUrl = pkg.imageUrl,
                                packageDetails = details,
                            ),
                        )
                        message = result.fold(
                            onSuccess = {
                                onAddedToCart()
                                "Added to cart"
                            },
                            onFailure = { it.message },
                        )
                    }
                },
            )
            }
        }
    }
}

private fun weekDayKeys(meals: List<MealDto>): List<String> {
    val fromMeals = meals.map { it.scheduledDate.take(10) }.filter { it.length == 10 }.distinct().sorted()
    return fromMeals.ifEmpty { listOf("today") }
}

@Composable
fun CatalogScreen(
    title: String,
    loader: suspend () -> Result<List<CatalogItemDto>>,
    onAdd: suspend (CatalogItemDto) -> Result<*>,
) {
    var items by remember { mutableStateOf<List<CatalogItemDto>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(title) {
        loading = true
        val result = loader()
        items = result.getOrDefault(emptyList())
        error = result.exceptionOrNull()?.message
        loading = false
    }

    Column {
        message?.let {
            Text(it, modifier = Modifier.padding(16.dp), color = MaterialTheme.colorScheme.primary)
        }
        SimpleListScreen(items, loading, error, "No $title yet", onRetry = {}) { item ->
            Column {
                Text(item.title ?: item.name ?: "Item", style = MaterialTheme.typography.titleMedium)
                Text(item.description, style = MaterialTheme.typography.bodySmall, maxLines = 3)
                Text("$${item.price}")
                PrimaryButton(
                    text = "Add to cart",
                    onClick = {
                        scope.launch {
                            message = onAdd(item).fold(
                                onSuccess = { "Added" },
                                onFailure = { it.message },
                            )
                        }
                    },
                )
            }
        }
    }
}

@Composable
fun CartScreen(
    repo: NutrimotionRepository,
    onContinueShopping: () -> Unit,
    onCheckout: () -> Unit,
) {
    var cart by remember { mutableStateOf<CartDto?>(null) }
    var mealNames by remember { mutableStateOf<Map<String, String>>(emptyMap()) }
    var code by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    fun reload() {
        scope.launch {
            loading = true
            repo.getCart()
                .onSuccess {
                    cart = it
                    error = null
                }
                .onFailure { error = it.message }
            loading = false
        }
    }

    LaunchedEffect(Unit) {
        reload()
        repo.getMeals().onSuccess { list ->
            mealNames = list.mapNotNull { meal -> meal.id?.let { it to meal.name } }.toMap()
        }
    }

    when {
        loading && cart == null -> LoadingBox()
        error != null && cart == null -> ErrorBox(error!!, ::reload)
        cart == null || cart!!.items.isEmpty() -> Column(
            modifier = Modifier.fillMaxSize().padding(24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text("Your cart is empty")
            Spacer(modifier = Modifier.height(12.dp))
            SecondaryButton(text = "Continue shopping", onClick = onContinueShopping)
        }
        else -> Column(
            modifier = Modifier
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
        ) {
            cart!!.items.forEach { item ->
                Text(
                    "${item.name} x ${item.quantity} - $${item.price}",
                    style = MaterialTheme.typography.titleMedium,
                )
                if (item.itemType == "package") {
                    packageChoiceLines(item.packageDetails, mealNames).forEach { line ->
                        Text(
                            line,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(start = 8.dp, top = 2.dp),
                        )
                    }
                }
                Spacer(modifier = Modifier.height(12.dp))
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text("Subtotal: $${cart!!.subtotal}")
            Text("Discount: $${cart!!.discount}")
            Text("Total: $${cart!!.total}", style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(12.dp))
            OutlinedTextField(
                value = code,
                onValueChange = { code = it },
                label = { Text("Coupon code") },
                modifier = Modifier.fillMaxWidth(),
            )
            PrimaryButton(
                text = "Apply coupon",
                onClick = {
                    scope.launch {
                        repo.applyDiscount(code.trim())
                            .onSuccess { cart = it }
                            .onFailure { error = it.message }
                    }
                },
            )
            SecondaryButton(
                text = "Clear coupons",
                onClick = {
                    scope.launch {
                        repo.clearDiscount()
                            .onSuccess { cart = it }
                            .onFailure { error = it.message }
                    }
                },
            )
            Spacer(modifier = Modifier.height(8.dp))
            SecondaryButton(text = "Continue shopping", onClick = onContinueShopping)
            PrimaryButton(text = "Checkout", onClick = onCheckout)
            error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        }
    }
}

private fun packageChoiceLines(details: JsonElement?, mealNames: Map<String, String>): List<String> {
    val root = details as? JsonObject ?: return emptyList()
    val bySlot = linkedMapOf<String, MutableList<String>>()
    for ((_, dayEl) in root) {
        val day = dayEl as? JsonObject ?: continue
        for ((slot, mealsEl) in day) {
            val meals = mealsEl as? JsonArray ?: continue
            val bucket = bySlot.getOrPut(slot) { mutableListOf() }
            for (meal in meals) {
                val raw = (meal as? JsonPrimitive)?.contentOrNull?.takeIf { it.isNotBlank() } ?: continue
                bucket += mealNames[raw] ?: raw
            }
        }
    }
    return MealSlots.ORDER.mapNotNull { slot ->
        val names = bySlot[slot].orEmpty()
        if (names.isEmpty()) return@mapNotNull null
        val summary = names.groupingBy { it }.eachCount().entries.joinToString(", ") { (name, count) ->
            if (count > 1) "$name × $count" else name
        }
        "${MealSlots.LABELS[slot] ?: slot}: $summary"
    }
}

@Composable
fun CheckoutScreen(repo: NutrimotionRepository, onDone: (OrderDto) -> Unit) {
    var street by remember { mutableStateOf("") }
    var parish by remember { mutableStateOf("") }
    var instructions by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    Column(modifier = Modifier.padding(16.dp)) {
        Text("Delivery address", style = MaterialTheme.typography.headlineSmall)
        OutlinedTextField(
            value = street,
            onValueChange = { street = it },
            label = { Text("Street") },
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = parish,
            onValueChange = { parish = it },
            label = { Text("Parish") },
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = instructions,
            onValueChange = { instructions = it },
            label = { Text("Instructions (optional)") },
            modifier = Modifier.fillMaxWidth(),
        )
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Spacer(modifier = Modifier.height(12.dp))
        PrimaryButton(
            text = if (loading) "Placing..." else "Place order",
            enabled = !loading && street.isNotBlank() && parish.isNotBlank(),
            onClick = {
                scope.launch {
                    loading = true
                    repo.checkout(
                        CheckoutRequest(
                            deliveryAddress = DeliveryAddress(street.trim(), parish.trim()),
                            deliveryInstructions = instructions.trim().ifBlank { null },
                        ),
                    ).onSuccess { onDone(it) }
                        .onFailure { error = it.message }
                    loading = false
                }
            },
        )
    }
}

@Composable
fun OrdersScreen(repo: NutrimotionRepository, onOpen: (OrderDto) -> Unit) {
    var orders by remember { mutableStateOf<List<OrderDto>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        loading = true
        repo.getOrders()
            .onSuccess {
                orders = it
                error = null
            }
            .onFailure { error = it.message }
        loading = false
    }

    SimpleListScreen(orders, loading, error, "No orders yet", onRetry = {}) { order ->
        Column(modifier = Modifier.fillMaxWidth().clickable { onOpen(order) }) {
            Text("Order #${order.orderNumber}", style = MaterialTheme.typography.titleMedium)
            order.createdAt?.take(10)?.let {
                Text(it, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text(orderStatusLabel(order.status), color = MaterialTheme.colorScheme.primary)
            val count = order.items.sumOf { it.quantity }
            Text("$count item${if (count == 1) "" else "s"} · Total $${formatMoney(order.total)}")
            Text("Tap to view order", color = MaterialTheme.colorScheme.primary)
        }
    }
}

private fun orderStatusLabel(status: String): String =
    status.replace('_', ' ').replaceFirstChar { it.uppercase() }

@Composable
fun OrderDetailScreen(order: OrderDto, onTrack: (String) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        Text("Order #${order.orderNumber}", style = MaterialTheme.typography.headlineSmall)
        order.createdAt?.take(10)?.let {
            Text(it, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        Text(
            orderStatusLabel(order.status),
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.primary,
        )

        Spacer(modifier = Modifier.height(16.dp))
        Text("Items", style = MaterialTheme.typography.titleMedium)
        order.items.forEach { item ->
            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(item.name)
                    Text(
                        "Quantity: ${item.quantity} × $${formatMoney(item.price)}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Text("$${formatMoney(item.price * item.quantity)}")
            }
        }

        Spacer(modifier = Modifier.height(12.dp))
        Row(modifier = Modifier.fillMaxWidth()) {
            Text("Subtotal", modifier = Modifier.weight(1f))
            Text("$${formatMoney(order.subtotal)}")
        }
        if (order.discount > 0) {
            Row(modifier = Modifier.fillMaxWidth()) {
                Text("Discount", modifier = Modifier.weight(1f))
                Text("-$${formatMoney(order.discount)}")
            }
        }
        Row(modifier = Modifier.fillMaxWidth()) {
            Text("Total", modifier = Modifier.weight(1f), style = MaterialTheme.typography.titleMedium)
            Text(
                "$${formatMoney(order.total)}",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary,
            )
        }

        order.deliveryAddress?.let { address ->
            Spacer(modifier = Modifier.height(16.dp))
            Text("Delivery address", style = MaterialTheme.typography.titleMedium)
            Text("${address.street}, ${address.parish}")
        }
        order.deliveryInstructions?.takeIf { it.isNotBlank() }?.let {
            Text("Instructions: $it", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }

        if (order.statusHistory.isNotEmpty()) {
            Spacer(modifier = Modifier.height(16.dp))
            Text("History", style = MaterialTheme.typography.titleMedium)
            order.statusHistory.forEach { entry ->
                val time = entry.timestamp?.take(16)?.replace('T', ' ').orEmpty()
                Text(
                    listOf(orderStatusLabel(entry.status), time, entry.note.orEmpty())
                        .filter { it.isNotBlank() }
                        .joinToString(" · "),
                    style = MaterialTheme.typography.bodySmall,
                )
            }
        }

        order.orderId()?.let { id ->
            Spacer(modifier = Modifier.height(16.dp))
            PrimaryButton(text = "Track delivery", onClick = { onTrack(id) })
        }
    }
}

@Composable
fun TrackingScreen(repo: NutrimotionRepository, orderId: String, onBack: () -> Unit) {
    var data by remember { mutableStateOf<TrackingResponse?>(null) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(orderId) {
        loading = true
        repo.getTracking(orderId)
            .onSuccess {
                data = it
                error = null
            }
            .onFailure { error = it.message }
        loading = false
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
    ) {
        TextButton(onClick = onBack) { Text("Back") }
        when {
            loading -> LoadingBox()
            error != null -> ErrorBox(error!!)
            data == null -> EmptyBox("No tracking data")
            else -> {
                Text(
                    data!!.order?.orderNumber ?: orderId,
                    style = MaterialTheme.typography.headlineSmall,
                )
                Text("Status: ${data!!.order?.status}")
                data!!.order?.statusHistory?.forEach {
                    Text("- ${it.status} ${it.timestamp.orEmpty()}")
                }
                data!!.driver?.let { Text("Driver: ${it.name} (${it.phone})") }
                Spacer(modifier = Modifier.height(12.dp))
                val loc = data!!.currentLocation
                TrackingMapView(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(220.dp),
                    markers = listOfNotNull(
                        loc?.let { MapMarker(it.lat, it.lng, "Driver") },
                    ),
                    centerLat = loc?.lat,
                    centerLng = loc?.lng,
                )
            }
        }
    }
}

@Composable
private fun LockedContentNotice(
    lockedCount: Int,
    subscribed: Boolean,
    noun: String,
    planLabel: String,
    monthlyPrice: Double,
    onSubscribe: () -> Unit,
) {
    if (subscribed || lockedCount <= 0) return
    val plural = if (lockedCount == 1) noun else "${noun}s"
    val price = if (monthlyPrice > 0) " for $${formatMoney(monthlyPrice)}/month" else ""
    Card(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                "You're missing $lockedCount $plural",
                style = MaterialTheme.typography.titleMedium,
            )
            Text("Get them all with a $planLabel subscription$price.")
            Spacer(modifier = Modifier.height(8.dp))
            PrimaryButton(text = "Subscribe", onClick = onSubscribe)
        }
    }
}

private fun formatMoney(value: Double): String {
    val cents = kotlin.math.round(value * 100).toLong()
    return "${cents / 100}.${(cents % 100).toString().padStart(2, '0')}"
}

private fun apiMessage(error: Throwable): String {
    val raw = error.message.orEmpty()
    val parsed = runCatching {
        val obj = kotlinx.serialization.json.Json.parseToJsonElement(raw) as? JsonObject
        (obj?.get("message") as? JsonPrimitive)?.contentOrNull
            ?: (obj?.get("error") as? JsonPrimitive)?.contentOrNull
    }.getOrNull()
    return parsed ?: raw.ifBlank { "Something went wrong" }
}

@Composable
fun RecipesScreen(
    repo: NutrimotionRepository,
    onOpen: (RecipeDto) -> Unit,
    onSubscribe: () -> Unit,
) {
    var page by remember { mutableStateOf<RecipesPage?>(null) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        loading = true
        repo.getRecipes()
            .onSuccess {
                page = it
                error = null
            }
            .onFailure { error = it.message }
        loading = false
    }

    val items = page?.items.orEmpty()
    Column {
        page?.let {
            LockedContentNotice(it.lockedCount, it.subscribed, "recipe", "Recipes", it.monthlyPrice, onSubscribe)
        }
        val empty = if ((page?.lockedCount ?: 0) > 0) "Subscribe to unlock recipes" else "No recipes yet"
        SimpleListScreen(items, loading, error, empty, onRetry = {}) { recipe ->
        Column {
            Text(recipe.title, style = MaterialTheme.typography.titleMedium)
            val badges = listOfNotNull(
                "This week".takeIf { recipe.thisWeek },
                "Free".takeIf { recipe.isFree },
            )
            if (badges.isNotEmpty()) {
                Text(badges.joinToString(" · "), color = MaterialTheme.colorScheme.primary)
            }
            if (recipe.description.isNotBlank()) {
                Text(
                    recipe.description,
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 3,
                )
            }
            Text(
                "${recipe.prepTime} min prep · ${recipe.cookTime} min cook · ${recipe.difficulty.replaceFirstChar { it.uppercase() }}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            PrimaryButton(text = "View recipe", onClick = { onOpen(recipe) })
        }
        }
    }
}

@Composable
fun VideosScreen(repo: NutrimotionRepository, onSubscribe: () -> Unit) {
    var page by remember { mutableStateOf<VideosPage?>(null) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    val uriHandler = LocalUriHandler.current

    LaunchedEffect(Unit) {
        loading = true
        repo.getVideos()
            .onSuccess {
                page = it
                error = null
            }
            .onFailure { error = it.message }
        loading = false
    }

    val items = page?.items.orEmpty()
    Column {
        page?.let {
            LockedContentNotice(it.lockedCount, it.subscribed, "video", "Videos", it.monthlyPrice, onSubscribe)
        }
        val empty = if ((page?.lockedCount ?: 0) > 0) "Subscribe to unlock videos" else "No videos yet"
        SimpleListScreen(items, loading, error, empty, onRetry = {}) { video ->
            Column {
                Text(video.title, style = MaterialTheme.typography.titleMedium)
                val badges = listOfNotNull(
                    "This week".takeIf { video.thisWeek },
                    "Free".takeIf { video.isFree },
                    "Free short".takeIf { video.access == "short" },
                )
                if (badges.isNotEmpty()) {
                    Text(badges.joinToString(" · "), color = MaterialTheme.colorScheme.primary)
                }
                if (video.description.isNotBlank()) {
                    Text(video.description, style = MaterialTheme.typography.bodySmall, maxLines = 3)
                }
                Text(
                    "${video.category.replaceFirstChar { it.uppercase() }} · ${maxOf(1, video.duration / 60)} min",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                val url = video.videoUrl ?: video.shortUrl
                PrimaryButton(
                    text = if (video.access == "short") "Watch short" else "Watch video",
                    enabled = !url.isNullOrBlank(),
                    onClick = { url?.let { runCatching { uriHandler.openUri(it) } } },
                )
            }
        }
    }
}

@Composable
fun RecipeDetailScreen(recipe: RecipeDto) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
    ) {
        Text(recipe.title, style = MaterialTheme.typography.headlineSmall)
        if (recipe.description.isNotBlank()) {
            Spacer(Modifier.height(8.dp))
            Text(recipe.description)
        }
        Spacer(Modifier.height(8.dp))
        Text(
            "${recipe.prepTime} min prep · ${recipe.cookTime} min cook · ${recipe.servings} servings · ${recipe.difficulty.replaceFirstChar { it.uppercase() }}",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(16.dp))
        Text("Ingredients", style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(8.dp))
        if (recipe.ingredients.isEmpty()) {
            Text("No ingredients listed")
        } else {
            recipe.ingredients.forEach { Text("• $it", modifier = Modifier.padding(vertical = 2.dp)) }
        }
        Spacer(Modifier.height(16.dp))
        Text("Instructions", style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(8.dp))
        if (recipe.instructions.isEmpty()) {
            Text("No instructions listed")
        } else {
            recipe.instructions.forEachIndexed { index, step ->
                Text("${index + 1}. $step", modifier = Modifier.padding(vertical = 4.dp))
            }
        }
    }
}

@Composable
fun SubscriptionsScreen(repo: NutrimotionRepository) {
    var items by remember { mutableStateOf<List<SubscriptionDto>>(emptyList()) }
    var plans by remember { mutableStateOf<List<SubscriptionPlanDto>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    fun reload() {
        scope.launch {
            loading = true
            repo.getSubscriptionPlans().onSuccess { plans = it }
            repo.getSubscriptions()
                .onSuccess {
                    items = it
                    error = null
                }
                .onFailure { error = it.message }
            loading = false
        }
    }

    LaunchedEffect(Unit) { reload() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
    ) {
        Text("Plans", style = MaterialTheme.typography.headlineSmall)
        Spacer(modifier = Modifier.height(8.dp))
        if (loading && plans.isEmpty()) {
            Text("Loading…")
        }
        plans.forEach { plan ->
            Card(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(plan.label, style = MaterialTheme.typography.titleMedium)
                    Text(
                        if (plan.monthlyPrice > 0) "$${formatMoney(plan.monthlyPrice)} / month" else "Coming soon",
                        style = MaterialTheme.typography.titleLarge,
                        color = MaterialTheme.colorScheme.primary,
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    if (plan.subscribed) {
                        Text("Subscribed", color = MaterialTheme.colorScheme.primary)
                    } else {
                        PrimaryButton(
                            text = if (busy == plan.type) "Subscribing…" else "Subscribe to ${plan.label}",
                            enabled = plan.monthlyPrice > 0 && busy == null,
                            onClick = {
                                scope.launch {
                                    busy = plan.type
                                    repo.createSubscription(CreateSubscriptionRequest(plan.type))
                                        .onSuccess {
                                            message = "You're subscribed to ${plan.label}"
                                            reload()
                                        }
                                        .onFailure { message = apiMessage(it) }
                                    busy = null
                                }
                            },
                        )
                    }
                }
            }
        }
        message?.let { Text(it, modifier = Modifier.padding(vertical = 8.dp)) }
        error?.let { Text(it, color = MaterialTheme.colorScheme.error) }

        Spacer(modifier = Modifier.height(16.dp))
        Text("My subscriptions", style = MaterialTheme.typography.titleLarge)
        if (items.isEmpty()) {
            Text("No subscriptions yet", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        items.forEach { sub ->
            Column(modifier = Modifier.padding(vertical = 6.dp)) {
                Text(sub.type.replaceFirstChar { it.uppercase() }, style = MaterialTheme.typography.titleMedium)
                Text("${sub.status} · $${formatMoney(sub.price)} / ${sub.billingInterval}")
                sub.endDate?.take(10)?.let { Text("Until $it", color = MaterialTheme.colorScheme.onSurfaceVariant) }
            }
        }
    }
}

private const val DEFAULT_WHATSAPP = "18764282339"

private fun urlEncode(text: String): String = buildString {
    text.encodeToByteArray().forEach { byte ->
        val c = byte.toInt().toChar()
        if (byte >= 0 && (c.isLetterOrDigit() || c in "-_.~")) {
            append(c)
        } else {
            append('%')
            append((byte.toInt() and 0xFF).toString(16).uppercase().padStart(2, '0'))
        }
    }
}

private fun formatWhatsAppNumber(digits: String): String =
    if (digits.length == 11 && digits.startsWith("1")) {
        "+1 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}"
    } else {
        "+$digits"
    }

@Composable
fun WhatsAppScreen(repo: NutrimotionRepository, userName: String?) {
    var number by remember { mutableStateOf(DEFAULT_WHATSAPP) }
    val firstName = userName?.trim()?.substringBefore(' ')?.takeIf { it.isNotBlank() }
    var message by remember {
        mutableStateOf("Hi Nutrimotion" + (firstName?.let { ", this is $it" } ?: "") + ". ")
    }
    var error by remember { mutableStateOf<String?>(null) }
    val uriHandler = LocalUriHandler.current

    LaunchedEffect(Unit) {
        repo.getContactSettings().onSuccess { settings ->
            settings.whatsapp.filter { it.isDigit() }.takeIf { it.length in 10..15 }?.let { number = it }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
    ) {
        Text("Message us on WhatsApp", style = MaterialTheme.typography.headlineSmall)
        Spacer(modifier = Modifier.height(4.dp))
        Text(
            "Write your message and we'll open WhatsApp so you can send it to our team.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(modifier = Modifier.height(12.dp))
        Text(formatWhatsAppNumber(number), style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(
            value = message,
            onValueChange = { message = it },
            label = { Text("Your message") },
            minLines = 4,
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(modifier = Modifier.height(16.dp))
        PrimaryButton(
            text = "Send on WhatsApp",
            enabled = message.isNotBlank(),
            onClick = {
                runCatching { uriHandler.openUri("https://wa.me/$number?text=${urlEncode(message.trim())}") }
                    .onFailure { error = "Couldn't open WhatsApp. Is it installed?" }
            },
        )
        error?.let { Text(it, color = MaterialTheme.colorScheme.error, modifier = Modifier.padding(top = 8.dp)) }
    }
}

@Composable
fun ProfileScreen(repo: NutrimotionRepository, onLogout: () -> Unit) {
    var profile by remember { mutableStateOf<UserProfile?>(null) }
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var street by remember { mutableStateOf("") }
    var parish by remember { mutableStateOf("") }
    var message by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        repo.getProfile().onSuccess {
            profile = it
            name = it.name
            phone = it.phone.orEmpty()
            street = it.address?.street.orEmpty()
            parish = it.address?.parish.orEmpty()
        }
    }

    Column(
        modifier = Modifier
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
    ) {
        Text("Profile", style = MaterialTheme.typography.headlineSmall)
        OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("Name") },
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = phone,
            onValueChange = { phone = it },
            label = { Text("Phone") },
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = street,
            onValueChange = { street = it },
            label = { Text("Street") },
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = parish,
            onValueChange = { parish = it },
            label = { Text("Parish") },
            modifier = Modifier.fillMaxWidth(),
        )
        message?.let { Text(it) }
        PrimaryButton(
            text = "Save",
            onClick = {
                scope.launch {
                    repo.updateProfile(
                        ProfileUpdateRequest(
                            name = name,
                            phone = phone,
                            address = DeliveryAddress(street, parish),
                        ),
                    ).onSuccess { message = "Saved" }
                        .onFailure { message = it.message }
                }
            },
        )
        Spacer(modifier = Modifier.height(16.dp))
        SecondaryButton(text = "Log out", onClick = onLogout)
    }
}
