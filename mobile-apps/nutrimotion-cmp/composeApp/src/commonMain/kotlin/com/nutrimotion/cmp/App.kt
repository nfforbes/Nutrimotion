package com.nutrimotion.cmp

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Autorenew
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Chat
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PlayCircle
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Restaurant
import androidx.compose.material.icons.filled.RestaurantMenu
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.nutrimotion.cmp.data.model.CartItemRequest
import com.nutrimotion.cmp.data.model.DeliveryAssignmentDto
import com.nutrimotion.cmp.data.model.OrderDto
import com.nutrimotion.cmp.data.model.RecipeDto
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import com.nutrimotion.cmp.session.AppMode
import com.nutrimotion.cmp.session.SessionViewModel
import com.nutrimotion.cmp.ui.components.DashboardItem
import com.nutrimotion.cmp.ui.components.IconDashboard
import com.nutrimotion.cmp.ui.screens.LoginScreen
import com.nutrimotion.cmp.ui.screens.admin.AnalyticsScreen
import com.nutrimotion.cmp.ui.screens.client.CartScreen
import com.nutrimotion.cmp.ui.screens.client.CatalogScreen
import com.nutrimotion.cmp.ui.screens.client.CheckoutScreen
import com.nutrimotion.cmp.ui.screens.client.MealsScreen
import com.nutrimotion.cmp.ui.screens.client.OrderDetailScreen
import com.nutrimotion.cmp.ui.screens.client.OrdersScreen
import com.nutrimotion.cmp.ui.screens.client.ProfileScreen
import com.nutrimotion.cmp.ui.screens.client.RecipeDetailScreen
import com.nutrimotion.cmp.ui.screens.client.RecipesScreen
import com.nutrimotion.cmp.ui.screens.client.SubscriptionsScreen
import com.nutrimotion.cmp.ui.screens.client.VideosScreen
import com.nutrimotion.cmp.ui.screens.client.WhatsAppScreen
import com.nutrimotion.cmp.ui.screens.client.TrackingScreen
import com.nutrimotion.cmp.ui.screens.driver.DriverAssignmentDetailScreen
import com.nutrimotion.cmp.ui.screens.driver.DriverAssignmentsScreen
import com.nutrimotion.cmp.ui.theme.NutrimotionTheme

private enum class ClientSection(
    val label: String,
    val icon: ImageVector,
    val color: Color,
) {
    Meals("Meals", Icons.Filled.Restaurant, Color(0xFFEE4D24)),
    Training("Training", Icons.Filled.FitnessCenter, Color(0xFF34C759)),
    Books("Books", Icons.Filled.MenuBook, Color(0xFF007AFF)),
    Recipes("Recipes", Icons.Filled.RestaurantMenu, Color(0xFFFF9500)),
    Videos("Videos", Icons.Filled.PlayCircle, Color(0xFFAF52DE)),
    Cart("Cart", Icons.Filled.ShoppingCart, Color(0xFFFF2D55)),
    Orders("Orders", Icons.Filled.ReceiptLong, Color(0xFF5AC8FA)),
    Subscriptions("Subscriptions", Icons.Filled.Autorenew, Color(0xFF5856D6)),
    WhatsApp("WhatsApp", Icons.Filled.Chat, Color(0xFF25D366)),
    Profile("Profile", Icons.Filled.Person, Color(0xFF8E8E93)),
}

private enum class DriverSection(val label: String, val icon: ImageVector, val color: Color) {
    Deliveries("Deliveries", Icons.Filled.LocalShipping, Color(0xFFEE4D24)),
    Profile("Profile", Icons.Filled.Person, Color(0xFF8E8E93)),
}

private enum class AdminSection(val label: String, val icon: ImageVector, val color: Color) {
    Analytics("Analytics", Icons.Filled.BarChart, Color(0xFF30B0C7)),
    Profile("Profile", Icons.Filled.Person, Color(0xFF8E8E93)),
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun App(sessionViewModel: SessionViewModel = viewModel { SessionViewModel() }) {
    val session by sessionViewModel.state.collectAsState()
    val repo = remember { NutrimotionRepository() }

    NutrimotionTheme {
        when {
            !session.loggedIn -> LoginScreen(
                state = session,
                onLogin = sessionViewModel::login,
            )
            session.mode == AppMode.ADMIN || sessionViewModel.isAdminOnly() -> AdminShell(
                sessionViewModel = sessionViewModel,
                repo = repo,
            )
            session.mode == AppMode.DRIVER -> DriverShell(
                sessionViewModel = sessionViewModel,
                repo = repo,
                userName = session.user?.user?.name ?: session.user?.name,
            )
            else -> ClientShell(
                sessionViewModel = sessionViewModel,
                repo = repo,
                userName = session.user?.user?.name ?: session.user?.name,
            )
        }
    }
}

@Composable
private fun ModeSwitcher(sessionViewModel: SessionViewModel, current: AppMode) {
    if (!sessionViewModel.canSwitchModes()) return
    if (current != AppMode.CLIENT && sessionViewModel.hasRole("client")) {
        TextButton(onClick = { sessionViewModel.switchMode(AppMode.CLIENT) }) { Text("Client") }
    }
    if (current != AppMode.DRIVER && sessionViewModel.hasRole("driver")) {
        TextButton(onClick = { sessionViewModel.switchMode(AppMode.DRIVER) }) { Text("Driver") }
    }
    if (current != AppMode.ADMIN && sessionViewModel.canViewAnalytics()) {
        TextButton(onClick = { sessionViewModel.switchMode(AppMode.ADMIN) }) { Text("Analytics") }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AdminShell(
    sessionViewModel: SessionViewModel,
    repo: NutrimotionRepository,
) {
    var section by remember { mutableStateOf<AdminSection?>(null) }
    val open = section

    Scaffold(
        topBar = {
            if (open != null) {
                SectionTopBar(open.label, onBack = { section = null }) {
                    ModeSwitcher(sessionViewModel, AppMode.ADMIN)
                }
            }
        },
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            if (open == null) {
                IconDashboard(
                    title = "Nutrimotion",
                    subtitle = "Admin",
                    items = AdminSection.entries.map { item ->
                        DashboardItem(item.label, item.icon, item.color) { section = item }
                    },
                    headerActions = { ModeSwitcher(sessionViewModel, AppMode.ADMIN) },
                )
            } else when (open) {
                AdminSection.Analytics -> {
                    if (sessionViewModel.canViewAnalytics()) {
                        AnalyticsScreen(repo)
                    } else {
                        Column(modifier = Modifier.padding(24.dp)) {
                            Text("You do not have view:analytics permission.")
                            TextButton(onClick = sessionViewModel::logout) { Text("Log out") }
                        }
                    }
                }
                AdminSection.Profile -> ProfileScreen(repo, sessionViewModel::logout)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ClientShell(
    sessionViewModel: SessionViewModel,
    repo: NutrimotionRepository,
    userName: String?,
) {
    var section by remember { mutableStateOf<ClientSection?>(null) }
    var selectedRecipe by remember { mutableStateOf<RecipeDto?>(null) }
    var checkout by remember { mutableStateOf(false) }
    var trackingOrderId by remember { mutableStateOf<String?>(null) }
    var selectedOrder by remember { mutableStateOf<OrderDto?>(null) }
    val open = section
    val recipe = selectedRecipe
    val order = selectedOrder
    val showDashboard = open == null && !checkout && trackingOrderId == null
    val title = when {
        trackingOrderId != null -> "Tracking"
        checkout -> "Checkout"
        open == ClientSection.Orders && order != null -> "Order #${order.orderNumber}"
        recipe != null -> recipe.title
        else -> open?.label ?: "Nutrimotion"
    }

    Scaffold(
        topBar = {
            if (!showDashboard) {
                SectionTopBar(
                    title = title,
                    onBack = {
                        when {
                            trackingOrderId != null -> trackingOrderId = null
                            checkout -> checkout = false
                            open == ClientSection.Orders && order != null -> selectedOrder = null
                            recipe != null -> selectedRecipe = null
                            else -> section = null
                        }
                    },
                ) {
                    ModeSwitcher(sessionViewModel, AppMode.CLIENT)
                }
            }
        },
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when {
                showDashboard -> IconDashboard(
                    title = "Nutrimotion",
                    subtitle = userName?.let { "Hello, $it" } ?: "Hello",
                    items = ClientSection.entries.map { item ->
                        DashboardItem(item.label, item.icon, item.color) {
                            selectedRecipe = null
                            selectedOrder = null
                            section = item
                        }
                    },
                    headerActions = { ModeSwitcher(sessionViewModel, AppMode.CLIENT) },
                )
                trackingOrderId != null -> TrackingScreen(
                    repo = repo,
                    orderId = trackingOrderId!!,
                    onBack = { trackingOrderId = null },
                )
                checkout -> CheckoutScreen(repo) {
                    checkout = false
                    section = ClientSection.Orders
                }
                open == ClientSection.Meals -> MealsScreen(repo) { section = ClientSection.Cart }
                open == ClientSection.Training -> CatalogPage(repo, ClientSection.Training)
                open == ClientSection.Books -> CatalogPage(repo, ClientSection.Books)
                open == ClientSection.Recipes && recipe != null -> RecipeDetailScreen(recipe)
                open == ClientSection.Recipes -> RecipesScreen(
                    repo = repo,
                    onOpen = { selectedRecipe = it },
                    onSubscribe = { section = ClientSection.Subscriptions },
                )
                open == ClientSection.Videos -> VideosScreen(repo) { section = ClientSection.Subscriptions }
                open == ClientSection.Cart -> CartScreen(
                    repo = repo,
                    onContinueShopping = { section = ClientSection.Meals },
                    onCheckout = { checkout = true },
                )
                open == ClientSection.Orders && order != null -> OrderDetailScreen(order) { trackingOrderId = it }
                open == ClientSection.Orders -> OrdersScreen(repo) { selectedOrder = it }
                open == ClientSection.Subscriptions -> SubscriptionsScreen(repo)
                open == ClientSection.WhatsApp -> WhatsAppScreen(repo, userName)
                open == ClientSection.Profile -> ProfileScreen(repo, sessionViewModel::logout)
            }
        }
    }
}

@Composable
private fun CatalogPage(repo: NutrimotionRepository, section: ClientSection) {
    when (section) {
        ClientSection.Training -> CatalogScreen("training", { repo.getTraining() }) { item ->
            repo.addCartItem(
                CartItemRequest(
                    itemType = "training",
                    itemId = item.catalogId(),
                    name = item.name ?: item.title.orEmpty(),
                    price = item.price,
                    imageUrl = item.imageUrl,
                )
            )
        }
        ClientSection.Books -> CatalogScreen("books", { repo.getBooks() }) { item ->
            repo.addCartItem(
                CartItemRequest(
                    itemType = "book",
                    itemId = item.catalogId(),
                    name = item.title ?: item.name.orEmpty(),
                    price = item.price,
                    imageUrl = item.coverImageUrl ?: item.imageUrl,
                )
            )
        }
        else -> Unit
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DriverShell(
    sessionViewModel: SessionViewModel,
    repo: NutrimotionRepository,
    userName: String?,
) {
    var section by remember { mutableStateOf<DriverSection?>(null) }
    var selected by remember { mutableStateOf<DeliveryAssignmentDto?>(null) }
    val open = section
    val showDashboard = open == null && selected == null

    Scaffold(
        topBar = {
            if (!showDashboard) {
                SectionTopBar(
                    title = if (selected != null) "Delivery" else open?.label ?: "Driver",
                    onBack = {
                        if (selected != null) selected = null else section = null
                    },
                ) {
                    ModeSwitcher(sessionViewModel, AppMode.DRIVER)
                }
            }
        },
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when {
                showDashboard -> IconDashboard(
                    title = "Nutrimotion",
                    subtitle = userName?.let { "Driver · $it" } ?: "Driver",
                    items = DriverSection.entries.map { item ->
                        DashboardItem(item.label, item.icon, item.color) { section = item }
                    },
                    headerActions = { ModeSwitcher(sessionViewModel, AppMode.DRIVER) },
                )
                selected != null -> DriverAssignmentDetailScreen(
                    repo = repo,
                    assignment = selected!!,
                    onBack = { selected = null },
                )
                open == DriverSection.Deliveries -> DriverAssignmentsScreen(repo) { selected = it }
                open == DriverSection.Profile -> ProfileScreen(repo, sessionViewModel::logout)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SectionTopBar(
    title: String,
    onBack: () -> Unit,
    actions: @Composable () -> Unit,
) {
    TopAppBar(
        title = { Text(title) },
        navigationIcon = {
            IconButton(onClick = onBack) {
                Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
            }
        },
        actions = { actions() },
    )
}
