package com.nutrimotion.cmp

/**
 * Digital goods (books, recipe and video subscriptions) can't be sold in the mobile apps without
 * In-App Purchase / Play Billing (App Store 3.1.1, Google Play Payments policy), so those purchase
 * paths are hidden where this is false.
 */
expect val canSellDigitalGoods: Boolean

/** Sent to the API so it can apply app-store rules to mobile requests. */
expect val clientPlatform: String

/** Cart item types that are digital goods. */
val DIGITAL_ITEM_TYPES = setOf("book", "subscription")
