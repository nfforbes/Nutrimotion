package com.nutrimotion.cmp.ui.screens.driver

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
import com.nutrimotion.cmp.data.model.DeliveryAssignmentDto
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import com.nutrimotion.cmp.ui.components.ErrorBox
import com.nutrimotion.cmp.ui.components.LoadingBox
import com.nutrimotion.cmp.ui.components.PrimaryButton
import com.nutrimotion.cmp.ui.components.SecondaryButton
import com.nutrimotion.cmp.ui.components.SimpleListScreen
import com.nutrimotion.cmp.ui.map.MapMarker
import com.nutrimotion.cmp.ui.map.TrackingMapView
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

@Composable
fun DriverAssignmentsScreen(
    repo: NutrimotionRepository,
    onOpen: (DeliveryAssignmentDto) -> Unit,
) {
    var items by remember { mutableStateOf<List<DeliveryAssignmentDto>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        while (isActive) {
            loading = items.isEmpty()
            repo.getDriverAssignments()
                .onSuccess {
                    items = it
                    error = null
                }
                .onFailure { error = it.message }
            loading = false
            delay(30_000)
        }
    }

    SimpleListScreen(
        items = items,
        loading = loading,
        error = error,
        emptyMessage = "No assignments",
        onRetry = {},
    ) { assignment ->
        Column(modifier = Modifier.clickable { onOpen(assignment) }) {
            Text(
                assignment.orderNumber ?: assignment.orderId,
                style = MaterialTheme.typography.titleMedium,
            )
            Text(assignment.customerName)
            Text(assignment.status)
            Text(assignment.customerPhone)
        }
    }
}

@Composable
fun DriverAssignmentDetailScreen(
    repo: NutrimotionRepository,
    assignment: DeliveryAssignmentDto,
    onBack: () -> Unit,
) {
    var current by remember { mutableStateOf(assignment) }
    var message by remember { mutableStateOf<String?>(null) }
    var lat by remember { mutableStateOf(18.1096) }
    var lng by remember { mutableStateOf(-77.2975) }
    val scope = rememberCoroutineScope()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
    ) {
        TextButton(onClick = onBack) { Text("Back") }
        Text(
            current.orderNumber ?: current.orderId,
            style = MaterialTheme.typography.headlineSmall,
        )
        Text("Customer: ${current.customerName}")
        Text("Phone: ${current.customerPhone}")
        current.customerAddress?.let {
            Text("Address: ${it.street} ${it.parish}".trim())
        }
        Text("Status: ${current.status}", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(12.dp))

        listOf("preparing", "out_for_delivery", "delivered", "cancelled").forEach { status ->
            PrimaryButton(
                text = "Mark $status",
                onClick = {
                    scope.launch {
                        val id = current.id ?: return@launch
                        repo.updateAssignmentStatus(id, status)
                            .onSuccess {
                                current = it
                                message = "Updated to $status"
                            }
                            .onFailure { message = it.message }
                    }
                },
            )
            Spacer(modifier = Modifier.height(6.dp))
        }

        Spacer(modifier = Modifier.height(12.dp))
        Text(
            "Share location (demo coords - wire GPS on device)",
            style = MaterialTheme.typography.titleSmall,
        )
        TrackingMapView(
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp),
            markers = listOf(MapMarker(lat, lng, "You")),
            centerLat = lat,
            centerLng = lng,
        )
        SecondaryButton(
            text = "Post location",
            onClick = {
                scope.launch {
                    lat += 0.001
                    lng += 0.001
                    repo.postLocation(lat, lng, current.id)
                        .onSuccess { message = "Location posted" }
                        .onFailure { message = it.message }
                }
            },
        )
        message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
    }
}

@Composable
fun DriverDashboardScreen(repo: NutrimotionRepository) {
    var items by remember { mutableStateOf<List<DeliveryAssignmentDto>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        while (isActive) {
            repo.getDriverAssignments()
                .onSuccess {
                    items = it
                    error = null
                }
                .onFailure { error = it.message }
            loading = false
            delay(30_000)
        }
    }

    Column(modifier = Modifier.padding(16.dp)) {
        Text("Driver dashboard", style = MaterialTheme.typography.headlineSmall)
        Text(
            "Active: ${items.count { it.status != "delivered" && it.status != "cancelled" }}",
        )
        when {
            loading -> LoadingBox(modifier = Modifier.height(100.dp))
            error != null -> ErrorBox(error!!)
            else -> items.take(5).forEach {
                Text("${it.orderNumber ?: it.orderId}: ${it.status}")
            }
        }
    }
}
