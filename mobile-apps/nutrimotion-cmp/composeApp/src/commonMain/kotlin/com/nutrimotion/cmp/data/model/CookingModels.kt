package com.nutrimotion.cmp.data.model

import kotlinx.serialization.Serializable

@Serializable
data class CookingResponse(
    val today: String = "",
    val cookDays: List<Int> = emptyList(),
    val plans: List<CookPlanDto> = emptyList(),
)

@Serializable
data class CookPlanDto(
    val cookDate: String = "",
    val coversFrom: String = "",
    val coversTo: String = "",
    val totalMeals: Int = 0,
    val orderCount: Int = 0,
    val slots: List<CookSlotDto> = emptyList(),
    val days: List<CookDayTotal> = emptyList(),
)

@Serializable
data class CookSlotDto(
    val slot: String = "",
    val label: String = "",
    val total: Int = 0,
    val items: List<CookItemCount> = emptyList(),
)

@Serializable
data class CookItemCount(
    val name: String = "",
    val count: Int = 0,
)

@Serializable
data class CookDayTotal(
    val date: String = "",
    val total: Int = 0,
)

@Serializable
data class CookDaysRequest(val cookDays: List<Int>)
