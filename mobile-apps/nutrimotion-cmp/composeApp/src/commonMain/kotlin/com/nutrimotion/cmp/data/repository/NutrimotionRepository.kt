package com.nutrimotion.cmp.data.repository

import com.nutrimotion.cmp.data.model.*
import com.nutrimotion.cmp.data.network.ApiClient

class NutrimotionRepository(private val api: ApiClient = ApiClient()) {
    suspend fun getMe(): Result<AuthMeResponse> = api.get("api/auth/me")

    suspend fun getProfile(): Result<UserProfile> = api.get("api/users/me/profile")

    suspend fun updateProfile(body: ProfileUpdateRequest): Result<UserProfile> =
        api.patch("api/users/me/profile", body)

    suspend fun getMeals(date: String? = null, slot: String? = null): Result<List<MealDto>> {
        val params = buildMap {
            date?.let { put("date", it) }
            slot?.let { put("slot", it) }
        }
        return api.get("api/meals", params)
    }

    suspend fun getPackages(): Result<List<PackageDto>> = api.get("api/packages")

    suspend fun getTraining(): Result<List<CatalogItemDto>> = api.get("api/training")

    suspend fun getBooks(): Result<List<CatalogItemDto>> = api.get("api/books")

    suspend fun getRecipes(): Result<List<CatalogItemDto>> = api.get("api/recipes")

    suspend fun getVideos(): Result<List<CatalogItemDto>> = api.get("api/videos")

    suspend fun getCart(): Result<CartDto> = api.get("api/cart")

    suspend fun addCartItem(item: CartItemRequest): Result<CartDto> =
        api.post("api/cart/items", item)

    suspend fun applyDiscount(code: String): Result<CartDto> =
        api.post("api/cart/discount", DiscountRequest(code))

    suspend fun clearDiscount(): Result<CartDto> = api.delete("api/cart/discount")

    suspend fun getMyCoupons(): Result<List<CouponDto>> = api.get("api/coupons/mine")

    suspend fun checkout(request: CheckoutRequest): Result<OrderDto> =
        api.post("api/checkout", request)

    suspend fun getOrders(): Result<List<OrderDto>> = api.get("api/orders")

    suspend fun getTracking(orderId: String): Result<TrackingResponse> =
        api.get("api/tracking/$orderId")

    suspend fun getSubscriptions(): Result<List<SubscriptionDto>> = api.get("api/subscriptions")

    suspend fun createSubscription(body: CreateSubscriptionRequest): Result<SubscriptionDto> =
        api.post("api/subscriptions", body)

    suspend fun getDriverAssignments(): Result<List<DeliveryAssignmentDto>> =
        api.get("api/driver/assignments")

    suspend fun updateAssignmentStatus(id: String, status: String): Result<DeliveryAssignmentDto> =
        api.patch("api/driver/assignments/$id", StatusUpdateRequest(status))

    suspend fun postLocation(lat: Double, lng: Double, assignmentId: String?): Result<Unit> =
        api.post("api/driver/location", LocationUpdateRequest(lat, lng, assignmentId))

    suspend fun getAnalytics(days: Int = 30): Result<AnalyticsResponse> =
        api.get("api/admin/analytics", mapOf("days" to days.toString()))
}
