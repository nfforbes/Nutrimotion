@file:OptIn(ExperimentalForeignApi::class, BetaInteropApi::class)

package com.nutrimotion.cmp.data.auth

import kotlinx.cinterop.BetaInteropApi
import kotlinx.cinterop.ExperimentalForeignApi
import kotlinx.cinterop.alloc
import kotlinx.cinterop.convert
import kotlinx.cinterop.memScoped
import kotlinx.cinterop.ptr
import kotlinx.cinterop.value
import platform.CoreFoundation.CFDictionaryAddValue
import platform.CoreFoundation.CFDictionaryCreateMutable
import platform.CoreFoundation.CFMutableDictionaryRef
import platform.CoreFoundation.CFRelease
import platform.CoreFoundation.CFTypeRef
import platform.CoreFoundation.CFTypeRefVar
import platform.CoreFoundation.kCFBooleanTrue
import platform.CoreFoundation.kCFTypeDictionaryKeyCallBacks
import platform.CoreFoundation.kCFTypeDictionaryValueCallBacks
import platform.Foundation.CFBridgingRelease
import platform.Foundation.CFBridgingRetain
import platform.Foundation.NSData
import platform.Foundation.NSString
import platform.Foundation.NSUTF8StringEncoding
import platform.Foundation.create
import platform.Foundation.dataUsingEncoding
import platform.Security.SecItemAdd
import platform.Security.SecItemCopyMatching
import platform.Security.SecItemDelete
import platform.Security.errSecSuccess
import platform.Security.kSecAttrAccessible
import platform.Security.kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
import platform.Security.kSecAttrAccount
import platform.Security.kSecAttrService
import platform.Security.kSecClass
import platform.Security.kSecClassGenericPassword
import platform.Security.kSecMatchLimit
import platform.Security.kSecMatchLimitOne
import platform.Security.kSecReturnData
import platform.Security.kSecValueData

private const val SERVICE = "com.nutrimotion.cmp.auth"
private const val ACCOUNT = "access_token"

actual fun createSecureTokenStorage(): SecureTokenStorage = KeychainTokenStorage()

/** Stores the sign-in token in the iOS Keychain so users stay signed in between launches. */
private class KeychainTokenStorage : SecureTokenStorage {
    override fun saveToken(token: String) {
        deleteItem()
        val data = NSString.create(string = token).dataUsingEncoding(NSUTF8StringEncoding) ?: return
        withQuery(
            kSecValueData to data,
            kSecAttrAccessible to kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly,
        ) { SecItemAdd(it, null) }
        TokenStore.set(token)
    }

    override fun readToken(): String? {
        val token = withQuery(
            kSecReturnData to kCFBooleanTrue,
            kSecMatchLimit to kSecMatchLimitOne,
        ) { query ->
            memScoped {
                val result = alloc<CFTypeRefVar>()
                if (SecItemCopyMatching(query, result.ptr) != errSecSuccess) return@memScoped null
                val data = CFBridgingRelease(result.value) as? NSData ?: return@memScoped null
                NSString.create(data = data, encoding = NSUTF8StringEncoding)?.toString()
            }
        }
        return token?.takeIf { it.isNotBlank() }?.also { TokenStore.set(it) }
    }

    override fun clear() {
        deleteItem()
        TokenStore.clear()
    }

    private fun deleteItem() {
        withQuery { SecItemDelete(it) }
    }

    /**
     * Builds a generic-password query for this app's token plus [extra] attributes.
     * Kotlin/Foundation values are bridged to CoreFoundation and released afterwards.
     */
    private fun <T> withQuery(vararg extra: Pair<CFTypeRef?, Any?>, block: (CFMutableDictionaryRef?) -> T): T {
        val retained = mutableListOf<CFTypeRef?>()
        fun cf(value: Any?): CFTypeRef? = when (value) {
            null -> null
            is String -> CFBridgingRetain(NSString.create(string = value)).also { retained += it }
            is NSData -> CFBridgingRetain(value).also { retained += it }
            else -> value as? CFTypeRef
        }

        val query = CFDictionaryCreateMutable(
            null,
            0.convert(),
            kCFTypeDictionaryKeyCallBacks.ptr,
            kCFTypeDictionaryValueCallBacks.ptr,
        )
        CFDictionaryAddValue(query, kSecClass, kSecClassGenericPassword)
        CFDictionaryAddValue(query, kSecAttrService, cf(SERVICE))
        CFDictionaryAddValue(query, kSecAttrAccount, cf(ACCOUNT))
        extra.forEach { (key, value) -> CFDictionaryAddValue(query, key, cf(value)) }

        try {
            return block(query)
        } finally {
            CFRelease(query)
            retained.forEach { it?.let(::CFRelease) }
        }
    }
}
