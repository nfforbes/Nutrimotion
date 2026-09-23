package com.nutrimotion.cmp.data.auth

actual fun createSecureTokenStorage(): SecureTokenStorage = MemoryTokenStorage()
