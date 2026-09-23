package com.nutrimotion.cmp.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

object Roles {
    const val ADMINISTRATOR = "administrator"
    const val CLIENT = "client"
    const val DRIVER = "driver"
}

object MealSlots {
    const val BREAKFAST = "breakfast"
    const val LUNCH = "lunch"
    const val SMOOTHIES = "smoothies"
    const val JUICE_SHOT = "juice_shot"
    val ORDER = listOf(BREAKFAST, LUNCH, SMOOTHIES, JUICE_SHOT)
    val LABELS = mapOf(
        BREAKFAST to "Breakfast",
        LUNCH to "Lunch",
        SMOOTHIES to "Smoothies",
        JUICE_SHOT to "Juice Shots",
    )
}

@Serializable
data class AuthMeResponse(
    val user: AuthUser? = null,
    val roles: List<String> = emptyList(),
    val permissions: List<String> = emptyList(),
    val id: String? = null,
    val email: String? = null,
    val name: String? = null,
)

@Serializable
data class AuthUser(
    val sub: String? = null,
    val email: String? = null,
    val name: String? = null,
    val picture: String? = null,
)

@Serializable
data class UserProfile(
    @SerialName("_id") val id: String? = null,
    val auth0Sub: String? = null,
    val email: String = "",
    val name: String = "",
    val phone: String? = null,
    val address: ProfileAddress? = null,
    val roles: List<String> = emptyList(),
)

@Serializable
data class ProfileAddress(
    val street: String = "",
    val parish: String = "",
    val city: String? = null,
    val state: String? = null,
    val zipCode: String? = null,
    val country: String? = null,
)

@Serializable
data class MealDto(
    @SerialName("_id") val id: String? = null,
    val name: String = "",
    val description: String = "",
    val imageUrl: String? = null,
    val price: Double = 0.0,
    val slot: String = "",
    val scheduledDate: String = "",
    val available: Boolean = true,
    val instagramLink: String? = null,
)

@Serializable
data class PackageDto(
    @SerialName("_id") val id: String? = null,
    val name: String = "",
    val description: String = "",
    val imageUrl: String? = null,
    val cost: Double = 0.0,
    val breakfastCount: Int = 0,
    val lunchCount: Int = 0,
    val smoothieCount: Int = 0,
    val juiceShotCount: Int = 0,
    val dinnerCount: Int? = null,
    val daysOption: String = "any",
    val specificDays: List<Int> = emptyList(),
    val available: Boolean = true,
)

@Serializable
data class CatalogItemDto(
    @SerialName("_id") val id: String? = null,
    val name: String? = null,
    val title: String? = null,
    val description: String = "",
    val imageUrl: String? = null,
    val coverImageUrl: String? = null,
    val thumbnailUrl: String? = null,
    val price: Double = 0.0,
    val author: String? = null,
    val duration: String? = null,
    val level: String? = null,
    val category: String? = null,
)

@Serializable
data class CartDto(
    @SerialName("_id") val id: String? = null,
    val items: List<CartItemDto> = emptyList(),
    val subtotal: Double = 0.0,
    val discount: Double = 0.0,
    val total: Double = 0.0,
    val discountCode: String? = null,
    val discountCodes: List<String> = emptyList(),
)

@Serializable
data class CartItemDto(
    @SerialName("_id") val id: String? = null,
    val itemType: String = "",
    val itemId: String = "",
    val name: String = "",
    val price: Double = 0.0,
    val quantity: Int = 1,
    val imageUrl: String? = null,
    val mealSlot: String? = null,
    val scheduledDate: String? = null,
    val packageDetails: JsonElement? = null,
)

@Serializable
data class CartItemRequest(
    val itemType: String,
    val itemId: String,
    val name: String,
    val price: Double,
    val quantity: Int = 1,
    val imageUrl: String? = null,
    val mealSlot: String? = null,
    val scheduledDate: String? = null,
    val packageDetails: Map<String, Map<String, List<String>>>? = null,
)

@Serializable
data class DiscountRequest(val code: String)

@Serializable
data class CheckoutRequest(
    val deliveryAddress: DeliveryAddress,
    val deliveryInstructions: String? = null,
)

@Serializable
data class DeliveryAddress(
    val street: String,
    val parish: String,
)

@Serializable
data class OrderDto(
    @SerialName("_id") val id: String? = null,
    val orderNumber: String = "",
    val status: String = "",
    val items: List<CartItemDto> = emptyList(),
    val subtotal: Double = 0.0,
    val discount: Double = 0.0,
    val total: Double = 0.0,
    val deliveryAddress: DeliveryAddress? = null,
    val deliveryInstructions: String? = null,
    val createdAt: String? = null,
    val statusHistory: List<StatusHistoryDto> = emptyList(),
)

@Serializable
data class StatusHistoryDto(
    val status: String = "",
    val timestamp: String? = null,
    val note: String? = null,
)

@Serializable
data class CouponDto(
    @SerialName("_id") val id: String? = null,
    val code: String = "",
    val description: String = "",
    val type: String = "percentage",
    val value: Double = 0.0,
    val active: Boolean = true,
)

@Serializable
data class SubscriptionDto(
    @SerialName("_id") val id: String? = null,
    val type: String = "",
    val status: String = "",
    val price: Double = 0.0,
    val billingInterval: String = "monthly",
    val startDate: String? = null,
    val endDate: String? = null,
    val autoRenew: Boolean = false,
)

@Serializable
data class CreateSubscriptionRequest(
    val type: String,
    val billingInterval: String = "monthly",
    val price: Double = 0.0,
)

@Serializable
data class TrackingResponse(
    val order: TrackingOrder? = null,
    val driver: TrackingDriver? = null,
    val currentLocation: GeoPoint? = null,
)

@Serializable
data class TrackingOrder(
    @SerialName("_id") val id: String? = null,
    val orderNumber: String = "",
    val status: String = "",
    val statusHistory: List<StatusHistoryDto> = emptyList(),
)

@Serializable
data class TrackingDriver(
    val name: String = "",
    val phone: String = "",
)

@Serializable
data class GeoPoint(
    val lat: Double = 0.0,
    val lng: Double = 0.0,
)

@Serializable
data class DeliveryAssignmentDto(
    @SerialName("_id") val id: String? = null,
    val orderId: String = "",
    val orderNumber: String? = null,
    val status: String = "",
    val customerName: String = "",
    val customerPhone: String = "",
    val customerAddress: ProfileAddress? = null,
    val estimatedDeliveryTime: String? = null,
)

@Serializable
data class StatusUpdateRequest(val status: String)

@Serializable
data class LocationUpdateRequest(
    val lat: Double,
    val lng: Double,
    val assignmentId: String? = null,
)

@Serializable
data class ProfileUpdateRequest(
    val name: String? = null,
    val phone: String? = null,
    val address: DeliveryAddress? = null,
)

@Serializable
data class ApiError(val error: String? = null, val message: String? = null)
