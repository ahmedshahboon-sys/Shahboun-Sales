import java.util.Base64

plugins { id("com.android.application") }

android {
    namespace = "com.shahboun.aqim"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.shahboun.aqim"
        minSdk = 24
        targetSdk = 36
        versionCode = 7
        versionName = "1.5.1"
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
        file("src/main/res/drawable/aqim_logo.webp").writeBytes(Base64.getDecoder().decode(payload.readText().trim()))
    }
}

val prepareSingleDashboardNavigation by tasks.registering {
    doLast {
        val f=file("src/main/java/com/shahboun/aqim/MainActivity.java")
        if(f.exists()){
            var s=f.readText()
            s=s.replace(
                "@Override public void onBackPressed(){if(screen!=0){if(testActive)stopAdhan();showHome();}else super.onBackPressed();}",
                "@Override public void onBackPressed(){if(testActive)stopAdhan();finish();}"
            )
            s=s.replace(
                "back.setOnClickListener(v->{if(testActive)stopAdhan();showHome();});",
                "back.setOnClickListener(v->{if(testActive)stopAdhan();finish();});"
            )
            s=s.replace("الإصدار 1.3.0","الإصدار 1.5.1").replace("الإصدار 1.5.0","الإصدار 1.5.1")
            f.writeText(s)
        }
    }
}

tasks.matching { it.name == "preBuild" }.configureEach {
    dependsOn(prepareOfficialAqimLogo)
    dependsOn(prepareSingleDashboardNavigation)
}

// AQIM 1.5.1 review build based on the same com.shahboun.aqim project
