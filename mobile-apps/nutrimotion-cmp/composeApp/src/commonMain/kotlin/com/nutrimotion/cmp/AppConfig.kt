package com.nutrimotion.cmp

object AppConfig {
    /** Override at runtime for staging/prod builds. */
    var apiBaseUrl: String = "https://www.nutrimotionjamaica.com"
    var auth0Domain: String = "n4consulting.us.auth0.com"
    var auth0ClientId: String = "WkjrdWm6dXyUY5IlUjwFXDXbWOXAbhGt"
    var auth0Audience: String = "https://n4consulting.us.auth0.com/api/v2/"
    var auth0Scheme: String = "nutrimotion"
}
