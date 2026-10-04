package com.nutrimotion.cmp.push

import platform.UIKit.UIApplication
import platform.UserNotifications.UNAuthorizationOptionAlert
import platform.UserNotifications.UNAuthorizationOptionBadge
import platform.UserNotifications.UNAuthorizationOptionSound
import platform.UserNotifications.UNUserNotificationCenter
import platform.darwin.dispatch_async
import platform.darwin.dispatch_get_main_queue

/** Asks for notification permission after sign-in; the AppDelegate forwards the APNs token to [PushTokens]. */
fun installIosPushRequester() {
    PushTokens.permissionRequester = {
        UNUserNotificationCenter.currentNotificationCenter().requestAuthorizationWithOptions(
            UNAuthorizationOptionAlert or UNAuthorizationOptionSound or UNAuthorizationOptionBadge,
        ) { granted, _ ->
            if (granted) {
                dispatch_async(dispatch_get_main_queue()) {
                    UIApplication.sharedApplication.registerForRemoteNotifications()
                }
            }
        }
    }
}
