package com.nutrimotion.cmp.data.model

import kotlinx.serialization.Serializable

object Permissions {
    const val VIEW_ANALYTICS = "view:analytics"
}

@Serializable
data class AnalyticsResponse(
    val range: AnalyticsRange = AnalyticsRange(),
    val kpis: AnalyticsKpis = AnalyticsKpis(),
    val trends: AnalyticsTrends = AnalyticsTrends(),
    val orderStatus: List<StatusCount> = emptyList(),
    val popularItems: List<PopularItem> = emptyList(),
    val topCustomers: List<TopCustomer> = emptyList(),
    val delivery: DeliveryAnalytics = DeliveryAnalytics(),
    val customers: CustomerAnalytics = CustomerAnalytics(),
    val byParish: List<ParishStat> = emptyList(),
)

@Serializable
data class AnalyticsRange(
    val days: Int = 30,
    val start: String = "",
    val end: String = "",
)

@Serializable
data class AnalyticsKpis(
    val revenue: KpiMetric = KpiMetric(),
    val orders: KpiMetric = KpiMetric(),
    val users: UserKpiMetric = UserKpiMetric(),
    val deliveries: KpiMetric = KpiMetric(),
)

@Serializable
data class KpiMetric(
    val value: Double = 0.0,
    val previous: Double = 0.0,
    val changePercent: Double? = null,
)

@Serializable
data class UserKpiMetric(
    val value: Double = 0.0,
    val previous: Double = 0.0,
    val changePercent: Double? = null,
    val newInPeriod: Int = 0,
    val previousNew: Int = 0,
)

@Serializable
data class AnalyticsTrends(
    val revenue: List<DayPoint> = emptyList(),
    val orders: List<DayPoint> = emptyList(),
    val users: List<DayPoint> = emptyList(),
    val revenueForecast: List<DayPoint> = emptyList(),
    val orderForecast: List<DayPoint> = emptyList(),
)

@Serializable
data class DayPoint(
    val date: String = "",
    val value: Double = 0.0,
)

@Serializable
data class StatusCount(
    val status: String = "",
    val count: Int = 0,
)

@Serializable
data class PopularItem(
    val name: String = "",
    val itemType: String = "",
    val quantity: Int = 0,
    val revenue: Double = 0.0,
)

@Serializable
data class TopCustomer(
    val userId: String? = null,
    val name: String = "",
    val email: String = "",
    val orders: Int = 0,
    val spend: Double = 0.0,
)

@Serializable
data class DeliveryAnalytics(
    val total: Int = 0,
    val completed: Int = 0,
    val completionRate: Double? = null,
    val avgMinutes: Int? = null,
    val byStatus: List<StatusCount> = emptyList(),
)

@Serializable
data class CustomerAnalytics(
    val unique: Int = 0,
    val returning: Int = 0,
    val retentionRate: Double? = null,
)

@Serializable
data class ParishStat(
    val parish: String = "",
    val orders: Int = 0,
    val revenue: Double = 0.0,
)
