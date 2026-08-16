plugins { id("com.android.application") }
android {
    namespace = "com.shahboun.aqim"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.shahboun.aqim"
        minSdk = 24
        targetSdk = 36
        versionCode = 4
        versionName = "1.3.0"
    }
    buildTypes { release { isMinifyEnabled = false } }
}
