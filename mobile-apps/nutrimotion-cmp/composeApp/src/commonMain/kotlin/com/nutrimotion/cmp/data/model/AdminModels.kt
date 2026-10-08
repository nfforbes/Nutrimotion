package com.nutrimotion.cmp.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

object AdminPermissions {
    const val MANAGE_MEALS = "manage:meals"
    const val MANAGE_PACKAGES = "manage:packages"
    const val MANAGE_TRAINING = "manage:training"
    const val MANAGE_BOOKS = "manage:books"
    const val MANAGE_RECIPES = "manage:recipes"
    const val MANAGE_VIDEOS = "manage:videos"
    const val MANAGE_USERS = "manage:users"
    const val MANAGE_ORDERS = "manage:orders"
    const val MANAGE_COUPONS = "manage:coupons"
    const val ASSIGN_DRIVERS = "assign:drivers"
    const val UPDATE_DELIVERY_STATUS = "update:delivery_status"
}

object OrderStatuses {
    const val PENDING = "pending"
    const val PURCHASED = "purchased"
    const val PREPARING = "preparing"
    const val OUT_FOR_DELIVERY = "out_for_delivery"
    const val DELIVERED = "delivered"
    const val CANCELLED = "cancelled"
    val ALL = listOf(PENDING, PURCHASED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED)

    fun label(status: String): String =
        status.replace('_', ' ').replaceFirstChar { it.uppercase() }
}

@Serializable
data class AdminDashboardDto(
    val date: String = "",
    val stats: DashboardStats = DashboardStats(),
    val mealBreakdown: Map<String, List<NameCount>> = emptyMap(),
    val slotOrder: List<String> = emptyList(),
)

@Serializable
data class DashboardStats(
    val mealsOrdered: Int = 0,
    val activeOrders: Int = 0,
    val inDelivery: Int = 0,
    val totalUsers: Int = 0,
)

@Serializable
data class NameCount(val name: String = "", val count: Int = 0)

@Serializable
data class UserRef(
    @SerialName("_id") val id: String = "",
    val name: String? = null,
    val email: String? = null,
    val phone: String? = null,
)

@Serializable
data class AdminAddress(val street: String = "", val parish: String = "")

@Serializable
data class AdminOrderDto(
    @SerialName("_id") val id: String = "",
    val orderNumber: String = "",
    val status: String = "",
    val userId: UserRef? = null,
    val assignedDriverId: UserRef? = null,
    val items: List<CartItemDto> = emptyList(),
    val subtotal: Double = 0.0,
    val discount: Double = 0.0,
    val total: Double = 0.0,
    val deliveryAddress: AdminAddress? = null,
    val deliveryInstructions: String? = null,
    val createdAt: String? = null,
    val statusHistory: List<StatusHistoryDto> = emptyList(),
)

@Serializable
data class OrderStatusRequest(val status: String, val driverId: String? = null, val note: String? = null)

@Serializable
data class AssignDriverRequest(val driverId: String)

@Serializable
data class AdminUserDto(
    @SerialName("_id") val id: String = "",
    val name: String = "",
    val email: String = "",
    val roles: List<String> = emptyList(),
    val createdAt: String? = null,
)

@Serializable
data class RolesRequest(val roles: List<String>)

@Serializable
data class AdminAssignmentDto(
    val id: String = "",
    val orderId: String = "",
    val orderNumber: String? = null,
    val deliveryAddress: AdminAddress? = null,
    val driverId: String = "",
    val driverName: String? = null,
    val status: String = "",
    val assignedAt: String? = null,
    val startedAt: String? = null,
    val arrivedAt: String? = null,
    val deliveredAt: String? = null,
)

@Serializable
data class PushConfigured(val android: Boolean = false, val ios: Boolean = false)

@Serializable
data class PushRecipient(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val devices: Int = 0,
    val platforms: List<String> = emptyList(),
)

@Serializable
data class PushHistoryRow(
    val id: String = "",
    val target: String = "",
    val userLabel: String? = null,
    val title: String = "",
    val message: String = "",
    val devices: Int = 0,
    val reached: Int = 0,
    val failed: Int = 0,
    val sentBy: String? = null,
    val createdAt: String? = null,
)

@Serializable
data class AdminNotificationsDto(
    val configured: PushConfigured = PushConfigured(),
    val totalDevices: Int = 0,
    val recipients: List<PushRecipient> = emptyList(),
    val history: List<PushHistoryRow> = emptyList(),
)

@Serializable
data class SendPushRequest(val target: String, val userId: String? = null, val title: String, val message: String)

@Serializable
data class SendPushResult(
    val devices: Int = 0,
    val reached: Int = 0,
    val failed: Int = 0,
    val errors: List<String> = emptyList(),
)

@Serializable
data class LibraryMeal(
    val name: String = "",
    val slot: String = "",
    val price: Double = 0.0,
    val description: String = "",
    val soldIndividually: Boolean = true,
    val available: Boolean = true,
)

@Serializable
data class MealMenu(
    val label: String = "",
    val weekStart: String = "",
    val meals: List<LibraryMeal> = emptyList(),
)

@Serializable
data class MealLibraryResponse(val menus: List<MealMenu> = emptyList())

@Serializable
data class LibraryMealPatch(
    val name: String,
    val slot: String,
    val menuLabel: String,
    val weekStart: String,
    val soldIndividually: Boolean? = null,
    val available: Boolean? = null,
)

@Serializable
data class AdminPackageDto(
    @SerialName("_id") val id: String = "",
    val name: String = "",
    val description: String? = null,
    val cost: Double = 0.0,
    val breakfastCount: Int = 0,
    val lunchCount: Int = 0,
    val dinnerCount: Int = 0,
    val smoothieCount: Int = 0,
    val juiceShotCount: Int = 0,
    val daysOption: String = "any",
    val specificDays: List<Int> = emptyList(),
    val active: Boolean = true,
)

@Serializable
data class ActiveRequest(val active: Boolean)

@Serializable
data class AdminCouponDto(
    @SerialName("_id") val id: String = "",
    val code: String = "",
    val description: String = "",
    val type: String = "percentage",
    val value: Double = 0.0,
    val minOrderAmount: Double? = null,
    val maxDiscount: Double? = null,
    val validFrom: String? = null,
    val validUntil: String? = null,
    val usageLimit: Int? = null,
    val usageCount: Int = 0,
    val stackable: Boolean = false,
    val oneTimePerUser: Boolean = false,
    val active: Boolean = true,
)

@Serializable
data class ClientRef(val id: String = "", val name: String = "", val email: String = "")

@Serializable
data class SendCouponRequest(val userIds: List<String>)

@Serializable
data class SendCouponResult(val sent: Int = 0, val alreadySent: Int = 0)

@Serializable
data class AdminBookDto(
    @SerialName("_id") val id: String = "",
    val title: String = "",
    val author: String = "",
    val price: Double = 0.0,
    val pageCount: Int? = null,
)

@Serializable
data class AdminTrainingDto(
    @SerialName("_id") val id: String = "",
    val name: String = "",
    val price: Double = 0.0,
    val duration: String = "",
    val level: String = "",
)

@Serializable
data class AdminRecipeDto(
    @SerialName("_id") val id: String = "",
    val title: String = "",
    val isFree: Boolean = false,
)

@Serializable
data class AdminVideoDto(
    @SerialName("_id") val id: String = "",
    val title: String = "",
    val category: String? = null,
    val isFree: Boolean = false,
)

@Serializable
data class FreeRequest(val isFree: Boolean)

@Serializable
data class ContentAccessDto(
    val library: String = "",
    val monthlyPrice: Double = 0.0,
)

@Serializable
data class ContentPriceRequest(val library: String, val monthlyPrice: Double)

@Serializable
data class DriveTestStep(val label: String = "", val ok: Boolean = false, val detail: String = "")

@Serializable
data class DriveTestResult(val ok: Boolean = false, val steps: List<DriveTestStep> = emptyList())

@Serializable
data class AppSettingsDto(
    val fileStorageProvider: String = "microsoft365",
    val ms365: Map<String, String> = emptyMap(),
    val googleDrive: Map<String, String> = emptyMap(),
)
