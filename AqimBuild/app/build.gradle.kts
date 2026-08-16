plugins { id("com.android.application") }

android {
    namespace = "com.shahboun.aqim"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.shahboun.aqim"
        minSdk = 24
        targetSdk = 36
        versionCode = 6
        versionName = "1.5.0"
    }
    buildTypes { release { isMinifyEnabled = false } }
}

val prepareOfficialAqimLogo by tasks.registering {
    doLast {
        val payload = projectDir.parentFile.resolve("branding/aqim_logo.webp.b64")
        check(payload.exists()) { "Missing official AQIM logo payload" }
        val drawableDir = file("src/main/res/drawable")
        drawableDir.mkdirs()
        file("src/main/res/drawable/aqim_logo.xml").delete()
        file("src/main/res/drawable/aqim_logo.webp").writeBytes(
            java.util.Base64.getDecoder().decode(payload.readText().trim())
        )
    }
}

tasks.matching { it.name == "preBuild" }.configureEach {
    dependsOn(prepareOfficialAqimLogo)
}

// AQIM 1.5.0 comprehensive update build
