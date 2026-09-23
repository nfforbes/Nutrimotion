package com.nutrimotion.cmp.data.auth

actual fun createAuthService(): AuthService = DevAuthService()
