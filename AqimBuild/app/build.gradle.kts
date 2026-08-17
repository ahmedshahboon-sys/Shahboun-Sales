import java.util.Base64

plugins { id("com.android.application") }

android {
    namespace = "com.shahboun.aqim"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.shahboun.aqim"
        minSdk = 24
        targetSdk = 36
        versionCode = 17
        versionName = "1.6.1"
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

val prepareLibyaOnlyAqim by tasks.registering {
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
            val legacy1="static LinkedHashMap<String,Calendar> todayTimes(Context c){return timesFor(c,Calendar.getInstance(TimeZone.getTimeZone(\"Africa/Tripoli\")));}static LinkedHashMap<String,Calendar> timesFor(Context c,Calendar d){double[]ll=currentLatLon(c);return PrayerTimes.calculate(d,ll[0],ll[1],offsets(c));}"
            val legacy2="static LinkedHashMap<String,Calendar> todayTimes(Context c){return timesFor(c,Calendar.getInstance(TimeZone.getTimeZone(c.getSharedPreferences(PREF,MODE_PRIVATE).getString(\"tzId\",TimeZone.getDefault().getID()))));}static LinkedHashMap<String,Calendar> timesFor(Context c,Calendar d){double[]ll=currentLatLon(c);LinkedHashMap<String,Calendar> base=PrayerTimes.calculate(d,ll[0],ll[1],offsets(c));return LibyaPrayerCalibration.apply(d,ll[0],ll[1],base);}"
            val legacy3="static LinkedHashMap<String,Calendar> todayTimes(Context c){return timesFor(c,Calendar.getInstance(TimeZone.getTimeZone(c.getSharedPreferences(PREF,MODE_PRIVATE).getString(\"tzId\",TimeZone.getDefault().getID()))));}static LinkedHashMap<String,Calendar> timesFor(Context c,Calendar d){double[]ll=currentLatLon(c);return PrayerTimes.calculate(d,ll[0],ll[1],offsets(c));}"
            val oldExact="static LinkedHashMap<String,Calendar> todayTimes(Context c){double[] ll=currentLatLon(c);TimeZone tz=LibyaPrayerTables.isLibya(ll[0],ll[1])?TimeZone.getTimeZone(\"Africa/Tripoli\"):TimeZone.getTimeZone(c.getSharedPreferences(PREF,MODE_PRIVATE).getString(\"tzId\",TimeZone.getDefault().getID()));return timesFor(c,Calendar.getInstance(tz));}static LinkedHashMap<String,Calendar> timesFor(Context c,Calendar d){double[]ll=currentLatLon(c);int[] off=offsets(c);LinkedHashMap<String,Calendar> libya=LibyaPrayerTables.calculate(c,d,ll[0],ll[1],off);if(libya!=null)return libya;return PrayerTimes.calculate(d,ll[0],ll[1],off);}"
            val exact="static LinkedHashMap<String,Calendar> todayTimes(Context c){return timesFor(c,Calendar.getInstance(TimeZone.getTimeZone(\"Africa/Tripoli\")));}static LinkedHashMap<String,Calendar> timesFor(Context c,Calendar d){double[]ll=currentLatLon(c);int[] off=offsets(c);LinkedHashMap<String,Calendar> libya=LibyaPrayerTables.calculate(c,d,ll[0],ll[1],off);return libya!=null?libya:new LinkedHashMap<String,Calendar>();}"
            s=s.replace(legacy1,exact).replace(legacy2,exact).replace(legacy3,exact).replace(oldExact,exact)
            s=s.replace("الإصدار 1.3.0","الإصدار 1.6.1").replace("الإصدار 1.5.0","الإصدار 1.6.1").replace("الإصدار 1.5.1","الإصدار 1.6.1").replace("الإصدار 1.5.2","الإصدار 1.6.1").replace("الإصدار 1.5.3","الإصدار 1.6.1").replace("الإصدار 1.5.4","الإصدار 1.6.1").replace("الإصدار 1.5.5","الإصدار 1.6.1").replace("الإصدار 1.5.6","الإصدار 1.6.1").replace("الإصدار 1.5.7","الإصدار 1.6.1").replace("الإصدار 1.5.8","الإصدار 1.6.1").replace("الإصدار 1.5.9","الإصدار 1.6.1").replace("الإصدار 1.6.0","الإصدار 1.6.1")
            f.writeText(s)
        }
        val q=file("src/main/java/com/shahboun/aqim/QuranActivity.java")
        if(q.exists()){
            var s=q.readText()
            s=s.replace("String[] keys={\"qaloon\",\"hafs\",\"warsh\",\"shouba\"};String[] labels={\"قالون عن نافع\",\"حفص عن عاصم\",\"ورش عن نافع\",\"شعبة عن عاصم\"};","String[] keys={\"qaloon\",\"hafs\"};String[] labels={\"قالون عن نافع\",\"حفص عن عاصم\"};")
            s=s.replace("key=getSharedPreferences(\"aqim\",0).getString(\"quranRiwaya\",\"qaloon\");","key=getSharedPreferences(\"aqim\",0).getString(\"quranRiwaya\",\"qaloon\");if(!\"qaloon\".equals(key)&&!\"hafs\".equals(key)){key=\"qaloon\";getSharedPreferences(\"aqim\",0).edit().putString(\"quranRiwaya\",key).apply();}")
            q.writeText(s)
        }
        file("src/main/assets/quran/warsh.json").delete();file("src/main/assets/quran/shouba.json").delete();file("src/main/res/font/quran_warsh.ttf").delete();file("src/main/res/font/quran_shouba.ttf").delete()
    }
}

tasks.matching { it.name == "preBuild" }.configureEach {
    dependsOn(prepareOfficialAqimLogo)
    dependsOn(prepareLibyaOnlyAqim)
}

// AQIM 1.6.1 targeted audio and icon repair