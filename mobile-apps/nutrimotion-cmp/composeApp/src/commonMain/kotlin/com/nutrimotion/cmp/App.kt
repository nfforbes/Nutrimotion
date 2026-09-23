package com.nutrimotion.cmp

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
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
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.nutrimotion.cmp.data.model.CartItemRequest
import com.nutrimotion.cmp.data.model.DeliveryAssignmentDto
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import com.nutrimotion.cmp.session.AppMode
import com.nutrimotion.cmp.session.SessionViewModel
import com.nutrimotion.cmp.ui.components.LoadingBox
import com.nutrimotion.cmp.ui.screens.LoginScreen
import com.nutrimotion.cmp.ui.screens.admin.AnalyticsScreen
import com.nutrimotion.cmp.ui.screens.client.CartScreen
import com.nutrimotion.cmp.ui.screens.client.CatalogScreen
import com.nutrimotion.cmp.ui.screens.client.CheckoutScreen
import com.nutrimotion.cmp.ui.screens.client.ClientHomeScreen
import com.nutrimotion.cmp.ui.screens.client.MealsScreen
import com.nutrimotion.cmp.ui.screens.client.OrdersScreen
import com.nutrimotion.cmp.ui.screens.client.ProfileScreen
import com.nutrimotion.cmp.ui.screens.client.SubscriptionsScreen
import com.nutrimotion.cmp.ui.screens.client.TrackingScreen
import com.nutrimotion.cmp.ui.screens.driver.DriverAssignmentDetailScreen
import com.nutrimotion.cmp.ui.screens.driver.DriverAssignmentsScreen
import com.nutrimotion.cmp.ui.screens.driver.DriverDashboardScreen
import com.nutrimotion.cmp.ui.theme.NutrimotionTheme

private enum class ClientTab { Home, Meals, Catalog, Cart, Orders, Subs, Profile }
private enum class DriverTab { Home, Assignments, Profile }
private enum class AdminTab { Analytics, Profile }
private enum class CatalogKind { Training, Books, Recipes, Videos }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun App(sessionViewModel: SessionViewModel = viewModel { SessionViewModel() }) {
    val session by sessionViewModel.state.collectAsState()
    val repo = remember { NutrimotionRepository() }

    NutrimotionTheme {
        when {
            session.loading && !session.loggedIn -> LoadingBox()
            !session.loggedIn -> LoginScreen(
                state = session,
                onTokenChange = sessionViewModel::onTokenInputChange,
                onLoginWithToken = sessionViewModel::loginWithToken,
                onLoginWithAuth0 = sessionViewModel::loginWithAuth0,
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
    var tab by remember { mutableStateOf(AdminTab.Analytics) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Admin") },
                actions = { ModeSwitcher(sessionViewModel, AppMode.ADMIN) },
            )
        },
        bottomBar = {
            NavigationBar {
                AdminTab.entries.forEach { t ->
                    NavigationBarItem(
                        selected = tab == t,
                        onClick = { tab = t },
                        icon = { Text(t.name.take(1)) },
                        label = { Text(t.name) },
                    )
                }
            }
        },
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when (tab) {
                AdminTab.Analytics -> {
                    if (sessionViewModel.canViewAnalytics()) {
                        AnalyticsScreen(repo)
                    } else {
                        Column(modifier = Modifier.padding(24.dp)) {
                            Text("You do not have view:analytics permission.")
                            TextButton(onClick = sessionViewModel::logout) { Text("Log out") }
                        }
                    }
                }
                AdminTab.Profile -> ProfileScreen(repo, sessionViewModel::logout)
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
    var tab by remember { mutableStateOf(ClientTab.Home) }
    var catalogKind by remember { mutableStateOf(CatalogKind.Training) }
    var checkout by remember { mutableStateOf(false) }
    var trackingOrderId by remember { mutableStateOf<String?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Nutrimotion") },
                actions = { ModeSwitcher(sessionViewModel, AppMode.CLIENT) },
            )
        },
        bottomBar = {
            if (trackingOrderId == null && !checkout) {
                NavigationBar {
                    ClientTab.entries.forEach { t ->
                        NavigationBarItem(
                            selected = tab == t,
                            onClick = { tab = t },
                            icon = { Text(t.name.take(1)) },
                            label = { Text(t.name) },
                        )
                    }
                }
            }
        },
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when {
                trackingOrderId != null -> TrackingScreen(
                    repo = repo,
                    orderId = trackingOrderId!!,
                    onBack = { trackingOrderId = null },
                )
                checkout -> CheckoutScreen(repo) {
                    checkout = false
                    tab = ClientTab.Orders
                }
                else -> when (tab) {
                    ClientTab.Home -> ClientHomeScreen(repo, userName)
                    ClientTab.Meals -> MealsScreen(repo) { tab = ClientTab.Cart }
                    ClientTab.Catalog -> CatalogHub(repo, catalogKind) { catalogKind = it }
                    ClientTab.Cart -> CartScreen(repo) { checkout = true }
                    ClientTab.Orders -> OrdersScreen(repo) { trackingOrderId = it }
                    ClientTab.Subs -> SubscriptionsScreen(repo)
                    ClientTab.Profile -> ProfileScreen(repo, sessionViewModel::logout)
                }
            }
        }
    }
}

@Composable
private fun CatalogHub(
    repo: NutrimotionRepository,
    kind: CatalogKind,
    onKind: (CatalogKind) -> Unit,
) {
    Column {
        Row(modifier = Modifier.padding(8.dp)) {
            CatalogKind.entries.forEach { k ->
                TextButton(onClick = { onKind(k) }) {
                    Text(if (k == kind) "[${k.name}]" else k.name)
                }
            }
        }
        when (kind) {
            CatalogKind.Training -> CatalogScreen("training", { repo.getTraining() }) { item ->
                repo.addCartItem(
                    CartItemRequest(
                        itemType = "training",
                        itemId = item.id.orEmpty(),
                        name = item.name ?: item.title.orEmpty(),
                        price = item.price,
                        imageUrl = item.imageUrl,
                    )
                )
            }
            CatalogKind.Books -> CatalogScreen("books", { repo.getBooks() }) { item ->
                repo.addCartItem(
                    CartItemRequest(
                        itemType = "book",
                        itemId = item.id.orEmpty(),
                        name = item.title ?: item.name.orEmpty(),
                        price = item.price,
                        imageUrl = item.coverImageUrl ?: item.imageUrl,
                    )
                )
            }
            CatalogKind.Recipes -> CatalogScreen("recipes", { repo.getRecipes() }) { item ->
                repo.addCartItem(
                    CartItemRequest(
                        itemType = "subscription",
                        itemId = item.id.orEmpty(),
                        name = item.title ?: item.name.orEmpty(),
                        price = item.price,
                        imageUrl = item.imageUrl,
                    )
                )
            }
            CatalogKind.Videos -> CatalogScreen("videos", { repo.getVideos() }) { item ->
                repo.addCartItem(
                    CartItemRequest(
                        itemType = "subscription",
                        itemId = item.id.orEmpty(),
                        name = item.title ?: item.name.orEmpty(),
                        price = item.price,
                        imageUrl = item.thumbnailUrl ?: item.imageUrl,
                    )
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DriverShell(
    sessionViewModel: SessionViewModel,
    repo: NutrimotionRepository,
    userName: String?,
) {
    var tab by remember { mutableStateOf(DriverTab.Home) }
    var selected by remember { mutableStateOf<DeliveryAssignmentDto?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Driver${userName?.let { " · $it" } ?: ""}") },
                actions = { ModeSwitcher(sessionViewModel, AppMode.DRIVER) },
            )
        },
        bottomBar = {
            if (selected == null) {
                NavigationBar {
                    DriverTab.entries.forEach { t ->
                        NavigationBarItem(
                            selected = tab == t,
                            onClick = { tab = t },
                            icon = { Text(t.name.take(1)) },
                            label = { Text(t.name) },
                        )
                    }
                }
            }
        },
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when {
                selected != null -> DriverAssignmentDetailScreen(
                    repo = repo,
                    assignment = selected!!,
                    onBack = { selected = null },
                )
                tab == DriverTab.Home -> DriverDashboardScreen(repo)
                tab == DriverTab.Assignments -> DriverAssignmentsScreen(repo) { selected = it }
                tab == DriverTab.Profile -> ProfileScreen(repo, sessionViewModel::logout)
            }
        }
    }
}
