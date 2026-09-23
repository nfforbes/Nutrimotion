package com.nutrimotion.cmp.ui.screens.client

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
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
import com.nutrimotion.cmp.data.model.SubscriptionDto
import com.nutrimotion.cmp.data.model.TrackingResponse
import com.nutrimotion.cmp.data.model.UserProfile
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import com.nutrimotion.cmp.domain.PackageSelectionLogic
import com.nutrimotion.cmp.ui.components.EmptyBox
import com.nutrimotion.cmp.ui.components.ErrorBox
import com.nutrimotion.cmp.ui.components.LoadingBox
import com.nutrimotion.cmp.ui.components.PrimaryButton
import com.nutrimotion.cmp.ui.components.SecondaryButton
import com.nutrimotion.cmp.ui.components.SimpleListScreen
import com.nutrimotion.cmp.ui.map.MapMarker
import com.nutrimotion.cmp.ui.map.TrackingMapView
import kotlinx.coroutines.launch

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
        SimpleListScreen(
            items = packages,
            loading = loading,
            error = error,
            emptyMessage = "No packages available",
            onRetry = {},
        ) { pkg ->
            Column(
                modifier = Modifier.clickable {
                    selected = pkg
                    selections = PackageSelectionLogic.emptySelections(weekDayKeys(meals))
                },
            ) {
                Text(pkg.name, style = MaterialTheme.typography.titleMedium)
                Text(pkg.description, style = MaterialTheme.typography.bodySmall)
                Text("$${pkg.cost}", style = MaterialTheme.typography.titleSmall)
            }
        }
    } else {
        val pkg = selected!!
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
        ) {
            TextButton(onClick = { selected = null }) { Text("Back") }
            Text(pkg.name, style = MaterialTheme.typography.headlineSmall)
            Text("Pick meals within package quotas")
            Spacer(modifier = Modifier.height(8.dp))
            MealSlots.ORDER.forEach { slot ->
                val limit = PackageSelectionLogic.slotLimit(pkg, slot)
                if (limit <= 0) return@forEach
                val used = PackageSelectionLogic.countAcrossDays(selections, slot)
                Text(
                    "${MealSlots.LABELS[slot]} ($used / $limit)",
                    style = MaterialTheme.typography.titleMedium,
                )
                meals
                    .filter { it.slot == slot || (slot == MealSlots.SMOOTHIES && it.slot == "dinner") }
                    .take(20)
                    .forEach { meal ->
                        val day = meal.scheduledDate.take(10).ifBlank { weekDayKeys(meals).first() }
                        val chosen = selections[day]?.get(slot)?.contains(meal.id) == true
                        val prefix = if (chosen) "[x] " else ""
                        Text(
                            "$prefix${meal.name} - $${meal.price} ($day)",
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable {
                                    val dayMap = selections[day]?.toMutableMap() ?: mutableMapOf()
                                    val list = dayMap[slot]?.toMutableList() ?: mutableListOf()
                                    if (chosen) {
                                        list.remove(meal.id)
                                    } else if (PackageSelectionLogic.canAdd(pkg, selections, slot)) {
                                        meal.id?.let { list.add(it) }
                                    }
                                    dayMap[slot] = list
                                    selections = selections.toMutableMap().apply { put(day, dayMap) }
                                }
                                .padding(vertical = 6.dp),
                        )
                    }
                Spacer(modifier = Modifier.height(8.dp))
            }
            message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
            PrimaryButton(
                text = "Add package to cart",
                onClick = {
                    scope.launch {
                        val details = selections.mapValues { (_, slots) ->
                            slots.mapValues { (_, ids) -> ids }
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
fun CartScreen(repo: NutrimotionRepository, onCheckout: () -> Unit) {
    var cart by remember { mutableStateOf<CartDto?>(null) }
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

    LaunchedEffect(Unit) { reload() }

    when {
        loading && cart == null -> LoadingBox()
        error != null && cart == null -> ErrorBox(error!!, ::reload)
        cart == null || cart!!.items.isEmpty() -> EmptyBox("Cart is empty")
        else -> Column(
            modifier = Modifier
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
        ) {
            cart!!.items.forEach {
                Text("${it.name} x ${it.quantity} - $${it.price}")
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
            PrimaryButton(text = "Checkout", onClick = onCheckout)
            error?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        }
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
fun OrdersScreen(repo: NutrimotionRepository, onTrack: (String) -> Unit) {
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
        Column(modifier = Modifier.clickable { order.id?.let(onTrack) }) {
            Text(order.orderNumber, style = MaterialTheme.typography.titleMedium)
            Text(order.status)
            Text("Total $${order.total}")
            Text("Tap to track", color = MaterialTheme.colorScheme.primary)
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
fun SubscriptionsScreen(repo: NutrimotionRepository) {
    var items by remember { mutableStateOf<List<SubscriptionDto>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var message by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    fun reload() {
        scope.launch {
            loading = true
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

    Column {
        message?.let { Text(it, modifier = Modifier.padding(16.dp)) }
        PrimaryButton(
            text = "Subscribe to recipes",
            modifier = Modifier.padding(horizontal = 16.dp),
            onClick = {
                scope.launch {
                    repo.createSubscription(CreateSubscriptionRequest("recipes", price = 9.99))
                        .onSuccess {
                            message = "Subscribed"
                            reload()
                        }
                        .onFailure { message = it.message }
                }
            },
        )
        SimpleListScreen(items, loading, error, "No subscriptions", onRetry = ::reload) { sub ->
            Column {
                Text(sub.type, style = MaterialTheme.typography.titleMedium)
                Text("${sub.status} - $${sub.price} / ${sub.billingInterval}")
            }
        }
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
