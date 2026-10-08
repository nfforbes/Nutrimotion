package com.nutrimotion.cmp.data.repository

import com.nutrimotion.cmp.data.model.*
import com.nutrimotion.cmp.data.network.ApiClient
import kotlinx.serialization.json.JsonElement

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

    suspend fun getRecipes(): Result<RecipesPage> = api.get("api/recipes")

    suspend fun getVideos(): Result<VideosPage> = api.get("api/videos")

    suspend fun getSubscriptionPlans(): Result<List<SubscriptionPlanDto>> = api.get("api/subscriptions/plans")

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

    suspend fun getCooking(): Result<CookingResponse> = api.get("api/admin/cooking")

    suspend fun saveCookDays(days: List<Int>): Result<CookingResponse> =
        api.put("api/admin/cooking", CookDaysRequest(days))

    suspend fun getAdminDashboard(): Result<AdminDashboardDto> = api.get("api/admin/dashboard")

    suspend fun getAdminOrders(status: String? = null): Result<List<AdminOrderDto>> =
        api.get("api/admin/orders", status?.let { mapOf("status" to it) } ?: emptyMap())

    suspend fun updateOrderStatus(orderId: String, body: OrderStatusRequest): Result<JsonElement> =
        api.patch("api/admin/orders/$orderId/status", body)

    suspend fun assignDriver(orderId: String, driverId: String): Result<JsonElement> =
        api.post("api/admin/orders/$orderId/assign", AssignDriverRequest(driverId))

    suspend fun getAdminUsers(role: String? = null): Result<List<AdminUserDto>> =
        api.get("api/admin/users", role?.let { mapOf("role" to it) } ?: emptyMap())

    suspend fun updateUserRoles(userId: String, roles: List<String>): Result<AdminUserDto> =
        api.put("api/admin/users/$userId/roles", RolesRequest(roles))

    suspend fun getAssignments(): Result<List<AdminAssignmentDto>> = api.get("api/admin/assignments")

    suspend fun getAdminNotifications(): Result<AdminNotificationsDto> = api.get("api/admin/notifications")

    suspend fun sendPush(body: SendPushRequest): Result<SendPushResult> =
        api.post("api/admin/notifications", body)

    suspend fun getAdminContact(): Result<ContactSettingsDto> = api.get("api/admin/contact")

    suspend fun saveAdminContact(whatsapp: String): Result<ContactSettingsDto> =
        api.patch("api/admin/contact", ContactSettingsDto(whatsapp))

    suspend fun getMealLibrary(): Result<MealLibraryResponse> = api.get("api/admin/meals/library")

    suspend fun patchLibraryMeal(body: LibraryMealPatch): Result<JsonElement> =
        api.patch("api/admin/meals/library", body)

    suspend fun getAdminPackages(): Result<List<AdminPackageDto>> = api.get("api/admin/packages")

    suspend fun setPackageActive(id: String, active: Boolean): Result<JsonElement> =
        api.patch("api/admin/packages/$id", ActiveRequest(active))

    suspend fun getAdminCoupons(): Result<List<AdminCouponDto>> = api.get("api/admin/coupons")

    suspend fun setCouponActive(id: String, active: Boolean): Result<JsonElement> =
        api.patch("api/admin/coupons/$id", ActiveRequest(active))

    suspend fun getCouponClients(): Result<List<ClientRef>> = api.get("api/admin/coupons/clients")

    suspend fun sendCoupon(id: String, userIds: List<String>): Result<SendCouponResult> =
        api.post("api/admin/coupons/$id/send", SendCouponRequest(userIds))

    suspend fun getAdminBooks(): Result<List<AdminBookDto>> = api.get("api/admin/uploads/books")

    suspend fun getAdminTraining(): Result<List<AdminTrainingDto>> = api.get("api/admin/uploads/training")

    suspend fun getAdminRecipes(): Result<List<AdminRecipeDto>> = api.get("api/admin/uploads/recipes")

    suspend fun getAdminVideos(): Result<List<AdminVideoDto>> = api.get("api/admin/uploads/videos")

    suspend fun setContentFree(library: String, id: String, isFree: Boolean): Result<JsonElement> =
        api.patch("api/admin/uploads/$library/$id", FreeRequest(isFree))

    suspend fun getContentAccess(library: String): Result<ContentAccessDto> =
        api.get("api/admin/content-access", mapOf("library" to library))

    suspend fun setContentPrice(library: String, monthlyPrice: Double): Result<ContentAccessDto> =
        api.patch("api/admin/content-access", ContentPriceRequest(library, monthlyPrice))

    suspend fun getAppSettings(): Result<AppSettingsDto> = api.get("api/admin/settings/app")

    suspend fun saveAppSettings(body: AppSettingsDto): Result<AppSettingsDto> =
        api.put("api/admin/settings/app", body)

    suspend fun testGoogleDrive(): Result<DriveTestResult> =
        api.post("api/admin/settings/app/test-google", emptyMap<String, String>())

    suspend fun getContactSettings(): Result<ContactSettingsDto> = api.get("api/settings/contact")

    suspend fun registerPushDevice(token: String, platform: String): Result<OkResponse> =
        api.post("api/users/me/push-devices", PushDeviceRequest(token, platform))

    suspend fun unregisterPushDevice(token: String): Result<OkResponse> =
        api.delete("api/users/me/push-devices", PushDeviceRequest(token))
}
