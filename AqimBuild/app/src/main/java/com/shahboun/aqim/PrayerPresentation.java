package com.shahboun.aqim;

import android.content.Context;
import android.content.SharedPreferences;
import java.util.Calendar;
import java.util.Locale;

public final class PrayerPresentation {
    private PrayerPresentation() {}

    public static boolean use24(Context c){
        return c.getSharedPreferences("aqim",Context.MODE_PRIVATE).getBoolean("time24",true);
    }
    public static boolean showSeconds(Context c){
        return c.getSharedPreferences("aqim",Context.MODE_PRIVATE).getBoolean("showSeconds",false);
    }
    public static String format(Context c,Calendar t){
        boolean h24=use24(c), sec=showSeconds(c);
        int minute=t.get(Calendar.MINUTE),second=t.get(Calendar.SECOND);
        if(h24){
            return sec?String.format(Locale.US,"%02d:%02d:%02d",t.get(Calendar.HOUR_OF_DAY),minute,second)
                    :String.format(Locale.US,"%02d:%02d",t.get(Calendar.HOUR_OF_DAY),minute);
        }
        int hour=t.get(Calendar.HOUR); if(hour==0)hour=12;
        String ap=t.get(Calendar.AM_PM)==Calendar.AM?"ص":"م";
        return sec?String.format(Locale.US,"%02d:%02d:%02d %s",hour,minute,second,ap)
                :String.format(Locale.US,"%02d:%02d %s",hour,minute,ap);
    }
    public static String countdown(Context c,long millis){
        long total=Math.max(0,millis/1000L),h=total/3600,m=(total%3600)/60,s=total%60;
        return showSeconds(c)?String.format(Locale.US,"%02d:%02d:%02d",h,m,s):String.format(Locale.US,"%02d:%02d",h,m);
    }
    public static int iqamaMinutes(Context c,String prayer){
        SharedPreferences p=c.getSharedPreferences("aqim",Context.MODE_PRIVATE);
        String key;
        if("الفجر".equals(prayer))key="iqama_fajr";
        else if("الظهر".equals(prayer))key="iqama_dhuhr";
        else if("العصر".equals(prayer))key="iqama_asr";
        else if("المغرب".equals(prayer))key="iqama_maghrib";
        else if("العشاء".equals(prayer))key="iqama_isha";
        else return 0;
        int def="المغرب".equals(prayer)?10:20;
        return Math.max(0,p.getInt(key,def));
    }
    public static Calendar iqamaTime(Context c,String prayer,Calendar prayerTime){
        Calendar x=(Calendar)prayerTime.clone(); x.add(Calendar.MINUTE,iqamaMinutes(c,prayer)); return x;
    }
    public static String iqamaStatus(Context c,String prayer,Calendar prayerTime,Calendar now){
        int mins=iqamaMinutes(c,prayer); if(mins<=0)return "الإقامة غير مفعلة";
        Calendar iq=iqamaTime(c,prayer,prayerTime); long diff=iq.getTimeInMillis()-now.getTimeInMillis();
        if(diff>0)return "الإقامة "+format(c,iq)+" • باقي "+countdown(c,diff);
        long passed=-diff;
        if(passed<=90*60000L)return "الإقامة "+format(c,iq)+" • مضى "+countdown(c,passed);
        return "الإقامة كانت "+format(c,iq);
    }
}
