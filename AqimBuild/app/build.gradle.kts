import java.util.Base64

plugins { id("com.android.application") }

android {
    namespace = "com.shahboun.aqim"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.shahboun.aqim"
        minSdk = 24
        targetSdk = 36
        versionCode = 14
        versionName = "1.5.8"
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
            s=s.replace("الإصدار 1.3.0","الإصدار 1.5.8").replace("الإصدار 1.5.0","الإصدار 1.5.8").replace("الإصدار 1.5.1","الإصدار 1.5.8").replace("الإصدار 1.5.2","الإصدار 1.5.8").replace("الإصدار 1.5.3","الإصدار 1.5.8").replace("الإصدار 1.5.4","الإصدار 1.5.8").replace("الإصدار 1.5.5","الإصدار 1.5.8").replace("الإصدار 1.5.6","الإصدار 1.5.8").replace("الإصدار 1.5.7","الإصدار 1.5.8")
            f.writeText(s)
        }

        val d=file("src/main/java/com/shahboun/aqim/DashboardActivity.java")
        if(d.exists()){
            var s=d.readText()
            s=s.replace("if(best==null)return;float oldLat","if(best==null||!LibyaPrayerTables.isLibya(best.getLatitude(),best.getLongitude()))return;float oldLat")
            s=s.replace("String sysTz=TimeZone.getDefault().getID();","String sysTz=\"Africa/Tripoli\";")
            s=s.replace("🕋 اتجاه القبلة","اتجاه القبلة")
            s=s.replace("if(id==4){x.setCompoundDrawablesWithIntrinsicBounds(0,0,R.drawable.ic_kaaba,0);x.setCompoundDrawablePadding(dp(5));}","int ico=(id==6||id==16||id==17)?R.drawable.ic_islamic_lantern:R.drawable.ic_islamic_crescent;x.setCompoundDrawablesWithIntrinsicBounds(0,0,ico,0);x.setCompoundDrawablePadding(dp(5));")
            s=s.replace("addBottomNav(root);","")
            s=s.replace("مواقيت 5 أيام","التقويم الشهري")
            s=s.replace("addSection(root,\"العبادات والتذكير\",","addSection(root,\"وردك وتذكيرك\",")
            s=s.replace("new String[]{\"تذكير الذكر\",\"المسبحة والفقاعة\",\"الفجر القوي\",\"حصن المسلم\",\"أسماء الله الحسنى\",\"دليل المسلم والأدعية\"},new int[]{6,7,8,9,10,15}","new String[]{\"ومضة ذكر\",\"مواسم الخير\",\"المسبحة والفقاعة\",\"الفجر القوي\",\"مكتبة الأذكار\",\"أسماء الله الحسنى\",\"دليل المسلم والأدعية\"},new int[]{6,16,7,8,17,10,15}")
            s=s.replace("else if(k==15)in=new Intent(this,MuslimGuideActivity.class);else in=new Intent(this,AboutActivity.class);","else if(k==15)in=new Intent(this,MuslimGuideActivity.class);else if(k==16)in=new Intent(this,WorshipReminderActivity.class);else if(k==17)in=new Intent(this,DhikrLibraryActivity.class);else in=new Intent(this,AboutActivity.class);")
            if(!s.contains("GradientDrawable grad("))s=s.replace("GradientDrawable bg(int c,int radius){GradientDrawable g=new GradientDrawable();g.setColor(c);g.setCornerRadius(dp(radius));return g;}","GradientDrawable bg(int c,int radius){GradientDrawable g=new GradientDrawable();g.setColor(c);g.setCornerRadius(dp(radius));return g;} GradientDrawable grad(int a,int b,int radius){GradientDrawable g=new GradientDrawable(GradientDrawable.Orientation.TL_BR,new int[]{a,b});g.setCornerRadius(dp(radius));return g;}")
            s=s.replace("GradientDrawable normal=bg(Color.WHITE,18);normal.setStroke(dp(1),Color.rgb(235,229,214));","GradientDrawable normal=grad(Color.WHITE,Color.rgb(244,248,244),18);normal.setStroke(dp(1),Color.rgb(226,232,224));")
            s=s.replace("hero.setBackground(bg(DARK,24));","hero.setBackground(grad(Color.rgb(7,48,36),Color.rgb(28,111,82),24));")
            s=s.replace("prayer.setBackground(bg(Color.WHITE,22));","prayer.setBackground(grad(Color.WHITE,Color.rgb(241,248,243),22));")
            s=s.replace("c.setBackground(bg(Color.WHITE,18));","c.setBackground(grad(Color.WHITE,Color.rgb(249,245,232),18));")
            s=s.replace("الإصدار 1.5.4","الإصدار 1.5.8").replace("الإصدار 1.5.5","الإصدار 1.5.8").replace("الإصدار 1.5.6","الإصدار 1.5.8").replace("الإصدار 1.5.7","الإصدار 1.5.8")
            d.writeText(s)
        }

        val q=file("src/main/java/com/shahboun/aqim/QuranActivity.java")
        if(q.exists()){
            var s=q.readText()
            s=s.replace("String[] keys={\"qaloon\",\"hafs\",\"warsh\",\"shouba\"};String[] labels={\"قالون عن نافع\",\"حفص عن عاصم\",\"ورش عن نافع\",\"شعبة عن عاصم\"};","String[] keys={\"qaloon\",\"hafs\"};String[] labels={\"قالون عن نافع\",\"حفص عن عاصم\"};")
            s=s.replace("key=getSharedPreferences(\"aqim\",0).getString(\"quranRiwaya\",\"qaloon\");","key=getSharedPreferences(\"aqim\",0).getString(\"quranRiwaya\",\"qaloon\");if(!\"qaloon\".equals(key)&&!\"hafs\".equals(key)){key=\"qaloon\";getSharedPreferences(\"aqim\",0).edit().putString(\"quranRiwaya\",key).apply();}")
            val anchor="Button plan=bt(\"خطة الختمة والورد اليومي\");plan.setOnClickListener(v->showPlan());add(r,plan);"
            val repl="Button searchText=bt(\"بحث داخل نص القرآن\");searchText.setOnClickListener(v->startActivity(new Intent(this,QuranSearchActivity.class)));add(r,searchText);"+anchor
            if(!s.contains("بحث داخل نص القرآن"))s=s.replace(anchor,repl)
            q.writeText(s)
        }
        file("src/main/assets/quran/warsh.json").delete();file("src/main/assets/quran/shouba.json").delete();file("src/main/res/font/quran_warsh.ttf").delete();file("src/main/res/font/quran_shouba.ttf").delete()
    }
}

val prepareNearbyMosques by tasks.registering {
    doLast {
        val f=file("src/main/java/com/shahboun/aqim/IslamicToolsActivity.java")
        if(f.exists()){
            var s=f.readText()
            s=s.replace("15*60*1000L","5*60*1000L")
            val oldLaunch="void launchMosqueSearch(double lat,double lon){String geo=\"geo:\"+lat+\",\"+lon+\"?q=\"+lat+\",\"+lon+\"(\"+Uri.encode(\"مساجد قريبة\")+\")\";Intent maps=new Intent(Intent.ACTION_VIEW,Uri.parse(geo));maps.setPackage(\"com.google.android.apps.maps\");try{startActivity(maps);return;}catch(Exception ignored){}Uri web=Uri.parse(\"https://www.google.com/maps/search/mosque/@\"+lat+\",\"+lon+\",15z\");try{startActivity(new Intent(Intent.ACTION_VIEW,web));}catch(Exception e){Toast.makeText(this,\"لا يوجد تطبيق خرائط متاح\",Toast.LENGTH_LONG).show();}}"
            val newLaunch="void launchMosqueSearch(double lat,double lon){if(!LibyaPrayerTables.isLibya(lat,lon)){Toast.makeText(this,\"المساجد القريبة متاحة داخل ليبيا في هذا الإصدار\",Toast.LENGTH_LONG).show();return;}String geo=\"geo:\"+lat+\",\"+lon+\"?q=\"+Uri.encode(\"مسجد\");Intent maps=new Intent(Intent.ACTION_VIEW,Uri.parse(geo));maps.setPackage(\"com.google.android.apps.maps\");try{startActivity(maps);return;}catch(Exception ignored){}String url=\"https://www.google.com/maps/search/?api=1&query=\"+Uri.encode(\"مسجد\")+\"&center=\"+lat+\",\"+lon;try{startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse(url)));}catch(Exception e){Toast.makeText(this,\"لا يوجد تطبيق خرائط متاح\",Toast.LENGTH_LONG).show();}}"
            s=s.replace(oldLaunch,newLaunch)
            f.writeText(s)
        }
    }
}

tasks.matching { it.name == "preBuild" }.configureEach {
    dependsOn(prepareOfficialAqimLogo)
    dependsOn(prepareLibyaOnlyAqim)
    dependsOn(prepareNearbyMosques)
}

// AQIM 1.5.8 Libya-only review build based on the same com.shahboun.aqim project
