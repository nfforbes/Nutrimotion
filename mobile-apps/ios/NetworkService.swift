/**
 * iOS Network Service
 * Handles API communication with Next.js backend
 */

import Foundation
import Combine

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case patch = "PATCH"
    case delete = "DELETE"
}

enum NetworkError: Error {
    case invalidURL
    case invalidResponse
    case unauthorized
    case serverError(String)
    case decodingError
}

class NetworkService {
    static let shared = NetworkService()
    
    private let baseURL = "https://api.nutrimotion.com"
    private var accessToken: String?
    
    private init() {}
    
    func setAccessToken(_ token: String) {
        self.accessToken = token
    }
    
    func request<T: Decodable>(
        endpoint: String,
        method: HTTPMethod = .get,
        body: Encodable? = nil
    ) -> AnyPublisher<T, NetworkError> {
        guard let url = URL(string: "\(baseURL)\(endpoint)") else {
            return Fail(error: NetworkError.invalidURL).eraseToAnyPublisher()
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = accessToken {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = try? JSONEncoder().encode(body)
        }
        
        return URLSession.shared.dataTaskPublisher(for: request)
            .tryMap { data, response -> Data in
                guard let httpResponse = response as? HTTPURLResponse else {
                    throw NetworkError.invalidResponse
                }
                
                switch httpResponse.statusCode {
                case 200...299:
                    return data
                case 401:
                    throw NetworkError.unauthorized
                case 400...599:
                    if let errorMessage = String(data: data, encoding: .utf8) {
                        throw NetworkError.serverError(errorMessage)
                    }
                    throw NetworkError.serverError("Server error")
                default:
                    throw NetworkError.invalidResponse
                }
            }
            .decode(type: T.self, decoder: JSONDecoder())
            .mapError { error in
                if error is DecodingError {
                    return NetworkError.decodingError
                }
                return error as? NetworkError ?? NetworkError.serverError(error.localizedDescription)
            }
            .eraseToAnyPublisher()
    }
}

// MARK: - API Endpoints

extension NetworkService {
    // Auth
    func getCurrentUser() -> AnyPublisher<User, NetworkError> {
        request(endpoint: "/api/auth/me")
    }
    
    // Meals
    func fetchMeals(date: Date? = nil, slot: String? = nil) -> AnyPublisher<[Meal], NetworkError> {
        var endpoint = "/api/meals"
        var queryItems: [URLQueryItem] = []
        
        if let date = date {
            let formatter = ISO8601DateFormatter()
            queryItems.append(URLQueryItem(name: "date", value: formatter.string(from: date)))
        }
        if let slot = slot {
            queryItems.append(URLQueryItem(name: "slot", value: slot))
        }
        
        if !queryItems.isEmpty {
            var components = URLComponents(string: endpoint)
            components?.queryItems = queryItems
            endpoint = components?.string ?? endpoint
        }
        
        return request(endpoint: endpoint)
    }
    
    // Cart
    func fetchCart() -> AnyPublisher<Cart, NetworkError> {
        request(endpoint: "/api/cart")
    }
    
    func addToCart(item: CartItemRequest) -> AnyPublisher<Cart, NetworkError> {
        request(endpoint: "/api/cart/items", method: .post, body: item)
    }
    
    // Orders
    func fetchOrders() -> AnyPublisher<[Order], NetworkError> {
        request(endpoint: "/api/orders")
    }
    
    func createOrder(deliveryAddress: Address, instructions: String?) -> AnyPublisher<Order, NetworkError> {
        struct CheckoutRequest: Encodable {
            let deliveryAddress: Address
            let deliveryInstructions: String?
        }
        
        let request = CheckoutRequest(
            deliveryAddress: deliveryAddress,
            deliveryInstructions: instructions
        )
        
        return self.request(endpoint: "/api/checkout", method: .post, body: request)
    }
    
    // Tracking
    func fetchTracking(orderId: String) -> AnyPublisher<TrackingData, NetworkError> {
        request(endpoint: "/api/tracking/\(orderId)")
    }
    
    // Driver
    func fetchAssignments() -> AnyPublisher<[DeliveryAssignment], NetworkError> {
        request(endpoint: "/api/driver/assignments")
    }
    
    func updateDeliveryStatus(assignmentId: String, status: String) -> AnyPublisher<DeliveryAssignment, NetworkError> {
        struct StatusUpdate: Encodable {
            let status: String
        }
        
        return request(
            endpoint: "/api/driver/assignments/\(assignmentId)",
            method: .patch,
            body: StatusUpdate(status: status)
        )
    }
    
    func updateLocation(lat: Double, lng: Double, assignmentId: String?) -> AnyPublisher<DriverLocation, NetworkError> {
        struct LocationUpdate: Encodable {
            let lat: Double
            let lng: Double
            let assignmentId: String?
        }
        
        return request(
            endpoint: "/api/driver/location",
            method: .post,
            body: LocationUpdate(lat: lat, lng: lng, assignmentId: assignmentId)
        )
    }
}

// MARK: - Models

struct User: Codable {
    let id: String
    let email: String
    let name: String
    let roles: [String]
    let permissions: [String]
}

struct Meal: Codable, Identifiable {
    let id: String
    let name: String
    let description: String
    let imageUrl: String
    let price: Double
    let slot: String
    let scheduledDate: Date
    let available: Bool
}

struct Cart: Codable {
    let id: String
    let items: [CartItem]
    let subtotal: Double
    let discount: Double
    let total: Double
    let discountCode: String?
}

struct CartItem: Codable, Identifiable {
    let id: String
    let itemType: String
    let itemId: String
    let name: String
    let price: Double
    let quantity: Int
    let imageUrl: String?
}

struct CartItemRequest: Encodable {
    let itemType: String
    let itemId: String
    let name: String
    let price: Double
    let quantity: Int
    let imageUrl: String?
}

struct Order: Codable, Identifiable {
    let id: String
    let orderNumber: String
    let status: String
    let items: [CartItem]
    let total: Double
    let deliveryAddress: Address?
    let createdAt: Date
}

struct Address: Codable {
    let street: String
    let city: String
    let state: String
    let zipCode: String
    let country: String
}

struct TrackingData: Codable {
    let order: OrderTracking
    let driver: Driver?
    let currentLocation: Location?
}

struct OrderTracking: Codable {
    let id: String
    let orderNumber: String
    let status: String
}

struct Driver: Codable {
    let name: String
    let phone: String
}

struct Location: Codable {
    let lat: Double
    let lng: Double
}

struct DeliveryAssignment: Codable, Identifiable {
    let id: String
    let orderId: String
    let orderNumber: String?
    let status: String
    let customerName: String
    let customerPhone: String
    let customerAddress: Address?
}

struct DriverLocation: Codable {
    let driverId: String
    let coordinates: Location
    let timestamp: Date
}
