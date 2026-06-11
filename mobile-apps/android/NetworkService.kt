/**
 * Android Network Service
 * Handles API communication with Next.js backend
 */

package com.nutrimotion.data.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException

class NetworkService {
    private val baseUrl = "https://api.nutrimotion.com"
    private var accessToken: String? = null
    
    private val client = OkHttpClient.Builder()
        .addInterceptor { chain ->
            val request = chain.request().newBuilder()
            accessToken?.let {
                request.addHeader("Authorization", "Bearer $it")
            }
            request.addHeader("Content-Type", "application/json")
            chain.proceed(request.build())
        }
        .build()
    
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }
    
    fun setAccessToken(token: String) {
        accessToken = token
    }
    
    private suspend inline fun <reified T> request(
        endpoint: String,
        method: String = "GET"
    ): Result<T> = executeRequest(endpoint, method, null)

    private suspend inline fun <reified T, reified B> request(
        endpoint: String,
        method: String,
        body: B
    ): Result<T> = executeRequest(
        endpoint,
        method,
        json.encodeToString(body).toRequestBody("application/json".toMediaType())
    )

    private suspend inline fun <reified T> executeRequest(
        endpoint: String,
        method: String,
        requestBody: okhttp3.RequestBody?
    ): Result<T> = withContext(Dispatchers.IO) {
        try {
            val requestBuilder = Request.Builder()
                .url("$baseUrl$endpoint")
                .method(method, requestBody)
            
            val response = client.newCall(requestBuilder.build()).execute()
            
            when (response.code) {
                in 200..299 -> {
                    val responseBody = response.body?.string() ?: ""
                    Result.success(json.decodeFromString<T>(responseBody))
                }
                401 -> Result.failure(NetworkException.Unauthorized())
                else -> Result.failure(
                    NetworkException.ServerError(
                        response.body?.string() ?: "Unknown error"
                    )
                )
            }
        } catch (e: IOException) {
            Result.failure(NetworkException.NetworkError(e.message))
        } catch (e: Exception) {
            Result.failure(NetworkException.UnknownError(e.message))
        }
    }
    
    // Auth
    suspend fun getCurrentUser(): Result<User> = request("/api/auth/me")
    
    // Meals
    suspend fun fetchMeals(date: String? = null, slot: String? = null): Result<List<Meal>> {
        var endpoint = "/api/meals"
        val params = mutableListOf<String>()
        date?.let { params.add("date=$it") }
        slot?.let { params.add("slot=$it") }
        if (params.isNotEmpty()) {
            endpoint += "?" + params.joinToString("&")
        }
        return request(endpoint)
    }
    
    // Cart
    suspend fun fetchCart(): Result<Cart> = request("/api/cart")
    
    suspend fun addToCart(item: CartItemRequest): Result<Cart> =
        request("/api/cart/items", "POST", item)
    
    // Orders
    suspend fun fetchOrders(): Result<List<Order>> = request("/api/orders")
    
    suspend fun createOrder(
        deliveryAddress: Address,
        instructions: String?
    ): Result<Order> = request(
        "/api/checkout",
        "POST",
        CheckoutRequest(deliveryAddress, instructions)
    )
    
    // Tracking
    suspend fun fetchTracking(orderId: String): Result<TrackingData> =
        request("/api/tracking/$orderId")
    
    // Driver
    suspend fun fetchAssignments(): Result<List<DeliveryAssignment>> =
        request("/api/driver/assignments")
    
    suspend fun updateDeliveryStatus(
        assignmentId: String,
        status: String
    ): Result<DeliveryAssignment> = request(
        "/api/driver/assignments/$assignmentId",
        "PATCH",
        StatusUpdate(status)
    )
    
    suspend fun updateLocation(
        lat: Double,
        lng: Double,
        assignmentId: String?
    ): Result<DriverLocation> = request(
        "/api/driver/location",
        "POST",
        LocationUpdate(lat, lng, assignmentId)
    )
    
    companion object {
        @Volatile
        private var instance: NetworkService? = null
        
        fun getInstance(): NetworkService {
            return instance ?: synchronized(this) {
                instance ?: NetworkService().also { instance = it }
            }
        }
    }
}

// Exceptions
sealed class NetworkException(message: String? = null) : Exception(message) {
    class Unauthorized : NetworkException("Unauthorized")
    class ServerError(message: String) : NetworkException(message)
    class NetworkError(message: String?) : NetworkException(message)
    class UnknownError(message: String?) : NetworkException(message)
}

// Models
@Serializable
data class User(
    val id: String,
    val email: String,
    val name: String,
    val roles: List<String>,
    val permissions: List<String>
)

@Serializable
data class Meal(
    val id: String,
    val name: String,
    val description: String,
    val imageUrl: String,
    val price: Double,
    val slot: String,
    val scheduledDate: String,
    val available: Boolean
)

@Serializable
data class Cart(
    val id: String,
    val items: List<CartItem>,
    val subtotal: Double,
    val discount: Double,
    val total: Double,
    val discountCode: String? = null
)

@Serializable
data class CartItem(
    val id: String,
    val itemType: String,
    val itemId: String,
    val name: String,
    val price: Double,
    val quantity: Int,
    val imageUrl: String? = null
)

@Serializable
data class CartItemRequest(
    val itemType: String,
    val itemId: String,
    val name: String,
    val price: Double,
    val quantity: Int,
    val imageUrl: String? = null
)

@Serializable
data class Order(
    val id: String,
    val orderNumber: String,
    val status: String,
    val items: List<CartItem>,
    val total: Double,
    val deliveryAddress: Address? = null,
    val createdAt: String
)

@Serializable
data class Address(
    val street: String,
    val city: String,
    val state: String,
    val zipCode: String,
    val country: String
)

@Serializable
data class CheckoutRequest(
    val deliveryAddress: Address,
    val deliveryInstructions: String?
)

@Serializable
data class TrackingData(
    val order: OrderTracking,
    val driver: Driver? = null,
    val currentLocation: Location? = null
)

@Serializable
data class OrderTracking(
    val id: String,
    val orderNumber: String,
    val status: String
)

@Serializable
data class Driver(
    val name: String,
    val phone: String
)

@Serializable
data class Location(
    val lat: Double,
    val lng: Double
)

@Serializable
data class DeliveryAssignment(
    val id: String,
    val orderId: String,
    val orderNumber: String? = null,
    val status: String,
    val customerName: String,
    val customerPhone: String,
    val customerAddress: Address? = null
)

@Serializable
data class DriverLocation(
    val driverId: String,
    val coordinates: Location,
    val timestamp: String
)

@Serializable
data class StatusUpdate(val status: String)

@Serializable
data class LocationUpdate(
    val lat: Double,
    val lng: Double,
    val assignmentId: String?
)
