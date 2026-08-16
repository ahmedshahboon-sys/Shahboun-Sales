plugins { id("com.android.application") }
android {
    namespace = "com.shahboun.aqim"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.shahboun.aqim"
        minSdk = 24
        targetSdk = 36
        versionCode = 3
        versionName = "1.2.0"
    }
    buildTypes { release { isMinifyEnabled = false } }
}
