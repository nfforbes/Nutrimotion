package com.nutrimotion.cmp.session

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nutrimotion.cmp.data.auth.AuthCancelledException
import com.nutrimotion.cmp.data.auth.AuthService
import com.nutrimotion.cmp.data.auth.SecureTokenStorage
import com.nutrimotion.cmp.data.auth.TokenStore
import com.nutrimotion.cmp.data.auth.createAuthService
import com.nutrimotion.cmp.data.auth.createSecureTokenStorage
import com.nutrimotion.cmp.data.model.AuthMeResponse
import com.nutrimotion.cmp.data.model.Permissions
import com.nutrimotion.cmp.data.model.Roles
import com.nutrimotion.cmp.data.repository.NutrimotionRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class AppMode { CLIENT, DRIVER, ADMIN }

data class SessionState(
    val loading: Boolean = false,
    val loggedIn: Boolean = false,
    val user: AuthMeResponse? = null,
    val mode: AppMode = AppMode.CLIENT,
    val error: String? = null,
)

class SessionViewModel(
    private val auth: AuthService = createAuthService(),
    private val repo: NutrimotionRepository = NutrimotionRepository(),
    private val secureStorage: SecureTokenStorage = createSecureTokenStorage(),
) : ViewModel() {
    private val _state = MutableStateFlow(SessionState())
    val state: StateFlow<SessionState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            TokenStore.unauthorized.collect { onUnauthorized() }
        }
        secureStorage.readToken()?.let { TokenStore.set(it) }
        if (!TokenStore.get().isNullOrBlank()) {
            _state.update { it.copy(loading = true) }
            refreshMe()
        }
    }

    private fun onUnauthorized() {
        secureStorage.clear()
        TokenStore.clear()
        if (_state.value.loggedIn) {
            _state.value = SessionState(error = "Your session has expired. Please sign in again.")
        }
    }

    fun login() {
        if (_state.value.loading) return
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            auth.login()
                .onSuccess { token ->
                    secureStorage.saveToken(token)
                    TokenStore.set(token)
                    refreshMe()
                }
                .onFailure { e ->
                    val message = if (e is AuthCancelledException) null else e.message ?: "Sign-in failed"
                    _state.update { it.copy(loading = false, error = message) }
                }
        }
    }

    fun refreshMe() {
        viewModelScope.launch {
            _state.update { it.copy(loading = true, error = null) }
            repo.getMe()
                .onSuccess { me ->
                    val roles = me.roles
                    val perms = me.permissions
                    val defaultMode = when {
                        Roles.ADMINISTRATOR in roles &&
                            Roles.CLIENT !in roles &&
                            Roles.DRIVER !in roles -> AppMode.ADMIN
                        Roles.DRIVER in roles && Roles.CLIENT !in roles -> AppMode.DRIVER
                        else -> AppMode.CLIENT
                    }
                    _state.update {
                        it.copy(
                            loading = false,
                            loggedIn = true,
                            user = me.copy(permissions = perms),
                            mode = defaultMode,
                            error = null,
                        )
                    }
                }
                .onFailure { e ->
                    TokenStore.clear()
                    secureStorage.clear()
                    _state.update {
                        it.copy(
                            loading = false,
                            loggedIn = false,
                            user = null,
                            error = e.message ?: "Failed to load session",
                        )
                    }
                }
        }
    }

    fun switchMode(mode: AppMode) {
        _state.update { it.copy(mode = mode) }
    }

    fun logout() {
        viewModelScope.launch {
            auth.logout()
            secureStorage.clear()
            TokenStore.clear()
            _state.value = SessionState()
        }
    }

    fun hasPermission(permission: String): Boolean =
        permission in _state.value.user?.permissions.orEmpty()

    fun hasRole(role: String): Boolean =
        role in _state.value.user?.roles.orEmpty()

    fun canViewAnalytics(): Boolean = hasPermission(Permissions.VIEW_ANALYTICS)

    fun canSwitchModes(): Boolean {
        var count = 0
        if (hasRole(Roles.CLIENT)) count++
        if (hasRole(Roles.DRIVER)) count++
        if (canViewAnalytics()) count++
        return count > 1
    }

    fun isAdminOnly(): Boolean {
        val roles = _state.value.user?.roles.orEmpty()
        return Roles.ADMINISTRATOR in roles &&
            Roles.CLIENT !in roles &&
            Roles.DRIVER !in roles
    }
}
