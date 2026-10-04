package com.nutrimotion.cmp.push

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging

object AndroidPush {
    const val CHANNEL_ID = "messages"

    /** Call from Activity.onCreate (the permission launcher must be registered before STARTED). */
    fun init(activity: ComponentActivity) {
        val appContext = activity.applicationContext
        createChannel(appContext)
        val launcher = activity.registerForActivityResult(
            ActivityResultContracts.RequestPermission(),
        ) { fetchToken(appContext) }

        PushTokens.permissionRequester = {
            val needsPrompt = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                ContextCompat.checkSelfPermission(appContext, Manifest.permission.POST_NOTIFICATIONS) !=
                PackageManager.PERMISSION_GRANTED
            if (needsPrompt) {
                launcher.launch(Manifest.permission.POST_NOTIFICATIONS)
            } else {
                fetchToken(appContext)
            }
        }
    }

    private fun fetchToken(context: Context) {
        if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) return
        if (FirebaseApp.getApps(context).isEmpty()) return
        FirebaseMessaging.getInstance().token.addOnSuccessListener { token ->
            PushTokens.update(token, "android")
        }
    }

    fun createChannel(context: Context) {
        val manager = context.getSystemService(NotificationManager::class.java) ?: return
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return
        manager.createNotificationChannel(
            NotificationChannel(CHANNEL_ID, "Messages", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "Messages from Nutrimotion"
            },
        )
    }
}
