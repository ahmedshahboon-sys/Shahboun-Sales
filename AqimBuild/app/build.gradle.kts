import java.util.Base64

plugins { id("com.android.application") }

android {
    namespace = "com.shahboun.aqim"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.shahboun.aqim"
        minSdk = 24
        targetSdk = 36
        versionCode = 11
        versionName = "1.5.5"
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
            val oldBack="@Override public void onBackPressed(){if(screen!=0){if(testActive)stopAdhan();showHome();}else super.onBackPressed();}"
            val oldFinish="@Override public void onBackPressed(){if(testActive)stopAdhan();finish();}"
            val newBack="@Override public void onBackPressed(){if(testActive)stopAdhan();goBackInternal();}"
            s=s.replace(oldBack,newBack).replace(oldFinish,newBack)
            val oldButton="back.setOnClickListener(v->{if(testActive)stopAdhan();showHome();});"
            val oldButtonFinish="back.setOnClickListener(v->{if(testActive)stopAdhan();finish();});"
            val newButton="back.setOnClickListener(v->{if(testActive)stopAdhan();goBackInternal();});"
            s=s.replace(oldButton,newButton).replace(oldButtonFinish,newButton)
            if(!s.contains("void goBackInternal(){")){
                val marker="    void loadFont(){"
                val nav="    void goBackInternal(){if(screen==8||screen==9||screen==10||screen==11||screen==12){showSettings();return;}finish();}\n\n"
                s=s.replace(marker,nav+marker)
            }
            s=s.replace("source.setOnClickListener(v->showAdhanPicker(false));","source.setOnClickListener(v->startActivity(new Intent(this,AdhanPickerActivity.class).putExtra(\"fajr\",false)));")
            s=s.replace("fajr.setOnClickListener(v->showAdhanPicker(true));","fajr.setOnClickListener(v->startActivity(new Intent(this,AdhanPickerActivity.class).putExtra(\"fajr\",true)));")
            s=s.replace("city.setOnClickListener(v->showCityPicker());","city.setOnClickListener(v->startActivity(new Intent(this,WorldLocationActivity.class)));")
            s=s.replace("@Override protected void onResume(){super.onResume();if(screen==7)showOnboarding();}","@Override protected void onResume(){super.onResume();if(screen==7)showOnboarding();else if(screen==5)showSettings();}")
            s=s.replace("getSharedPreferences(PREF,MODE_PRIVATE).edit().putBoolean(\"onboarded\",true).apply();startStatusIfEnabled();scheduleAll(this);showHome();","getSharedPreferences(PREF,MODE_PRIVATE).edit().putBoolean(\"onboarded\",true).apply();startStatusIfEnabled();scheduleAll(this);showSettings();")
            s=s.replace("الإصدار 1.3.0","الإصدار 1.5.5").replace("الإصدار 1.5.0","الإصدار 1.5.5").replace("الإصدار 1.5.1","الإصدار 1.5.5").replace("الإصدار 1.5.2","الإصدار 1.5.5").replace("الإصدار 1.5.3","الإصدار 1.5.5").replace("الإصدار 1.5.4","الإصدار 1.5.5")
            f.writeText(s)
        }
        val d=file("src/main/java/com/shahboun/aqim/DashboardActivity.java")
        if(d.exists()){
            var s=d.readText()
            s=s.replace("🕋 اتجاه القبلة","اتجاه القبلة")
            s=s.replace("if(id==4){x.setCompoundDrawablesWithIntrinsicBounds(0,0,R.drawable.ic_kaaba,0);x.setCompoundDrawablePadding(dp(5));}","")
            s=s.replace("addBottomNav(root);","")
            s=s.replace("الإصدار 1.5.4","الإصدار 1.5.5")
            d.writeText(s)
        }
    }
}

val prepareNearbyMosques by tasks.registering {
    doLast {
        val f=file("src/main/java/com/shahboun/aqim/IslamicToolsActivity.java")
        if(f.exists()){
            var s=f.readText()
            s=s.replace("15*60*1000L","5*60*1000L")
            val oldLaunch="void launchMosqueSearch(double lat,double lon){String geo=\"geo:\"+lat+\",\"+lon+\"?q=\"+lat+\",\"+lon+\"(\"+Uri.encode(\"مساجد قريبة\")+\")\";Intent maps=new Intent(Intent.ACTION_VIEW,Uri.parse(geo));maps.setPackage(\"com.google.android.apps.maps\");try{startActivity(maps);return;}catch(Exception ignored){}Uri web=Uri.parse(\"https://www.google.com/maps/search/mosque/@\"+lat+\",\"+lon+\",15z\");try{startActivity(new Intent(Intent.ACTION_VIEW,web));}catch(Exception e){Toast.makeText(this,\"لا يوجد تطبيق خرائط متاح\",Toast.LENGTH_LONG).show();}}"
            val newLaunch="void launchMosqueSearch(double lat,double lon){String geo=\"geo:\"+lat+\",\"+lon+\"?q=\"+Uri.encode(\"مسجد\");Intent maps=new Intent(Intent.ACTION_VIEW,Uri.parse(geo));maps.setPackage(\"com.google.android.apps.maps\");try{startActivity(maps);return;}catch(Exception ignored){}String url=\"https://www.google.com/maps/search/?api=1&query=\"+Uri.encode(\"مسجد\")+\"&center=\"+lat+\",\"+lon;try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)));}catch(Exception e){Toast.makeText(this,\"لا يوجد تطبيق خرائط متاح\",Toast.LENGTH_LONG).show();}}"
            s=s.replace(oldLaunch,newLaunch)
            s=s.replace("new Handler(Looper.getMainLooper()).postDelayed(()->{try{lm.removeUpdates(listener);}catch(Exception ignored){}},10000);","new Handler(Looper.getMainLooper()).postDelayed(()->{try{lm.removeUpdates(listener);}catch(Exception ignored){}Toast.makeText(this,\"تعذر تحديد موقعك الحالي بدقة. حاول مرة أخرى بعد تفعيل GPS.\",Toast.LENGTH_LONG).show();},12000);")
            f.writeText(s)
        }
    }
}

tasks.matching { it.name == "preBuild" }.configureEach {
    dependsOn(prepareOfficialAqimLogo)
    dependsOn(prepareSingleDashboardNavigation)
    dependsOn(prepareNearbyMosques)
}

// AQIM 1.5.5 review build based on the same com.shahboun.aqim project
