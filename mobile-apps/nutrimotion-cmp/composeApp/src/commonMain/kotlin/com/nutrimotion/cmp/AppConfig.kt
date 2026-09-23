package com.nutrimotion.cmp

object AppConfig {
    /** Override at runtime for staging/prod builds. */
    var apiBaseUrl: String = "https://10.0.2.2:3600"
    var auth0Domain: String = "n4consulting.us.auth0.com"
    var auth0ClientId: String = "REPLACE_NATIVE_CLIENT_ID"
    var auth0Audience: String = "https://n4consulting.us.auth0.com/api/v2/"
    var auth0Scheme: String = "nutrimotion"
}
