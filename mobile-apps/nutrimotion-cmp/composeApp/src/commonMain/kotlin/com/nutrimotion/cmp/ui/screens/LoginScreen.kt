package com.nutrimotion.cmp.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.nutrimotion.cmp.session.SessionState
import com.nutrimotion.cmp.ui.components.PrimaryButton
import com.nutrimotion.cmp.ui.components.SecondaryButton
import com.nutrimotion.cmp.ui.theme.NutrimotionOrange

@Composable
fun LoginScreen(
    state: SessionState,
    onTokenChange: (String) -> Unit,
    onLoginWithToken: () -> Unit,
    onLoginWithAuth0: () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        Text(
            "Nutrimotion",
            style = MaterialTheme.typography.displaySmall,
            color = NutrimotionOrange,
        )
        Text(
            "Client & Driver",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Spacer(Modifier.height(24.dp))
        Text(
            "Sign in with Auth0 (native) or paste an access token for API testing.",
            style = MaterialTheme.typography.bodyMedium,
        )
        Spacer(Modifier.height(16.dp))
        OutlinedTextField(
            value = state.tokenInput,
            onValueChange = onTokenChange,
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Access token") },
            singleLine = false,
            minLines = 3,
        )
        if (state.error != null) {
            Spacer(Modifier.height(8.dp))
            Text(state.error, color = MaterialTheme.colorScheme.error)
        }
        Spacer(Modifier.height(16.dp))
        PrimaryButton(
            text = if (state.loading) "Signing in…" else "Continue with token",
            onClick = onLoginWithToken,
            enabled = !state.loading,
        )
        Spacer(Modifier.height(8.dp))
        SecondaryButton(
            text = "Auth0 login",
            onClick = onLoginWithAuth0,
        )
    }
}
