package com.nutrimotion.cmp

/**
 * Digital goods (books, recipe and video subscriptions) can't be sold on iOS without
 * In-App Purchase (App Store guideline 3.1.1), so the iOS app hides those purchase paths.
 */
expect val canSellDigitalGoods: Boolean
