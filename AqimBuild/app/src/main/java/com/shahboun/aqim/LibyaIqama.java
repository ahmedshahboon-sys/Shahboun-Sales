package com.shahboun.aqim;

import android.content.Context;
import android.content.SharedPreferences;

/** Central Libya iqama policy. Prayer tables contain adhan times; iqama remains an editable local interval. */
public final class LibyaIqama {
    private LibyaIqama() {}
    private static final String[] NAMES={"الفجر","الظهر","العصر","المغرب","العشاء"};
    private static final String[] KEYS={"iqama_fajr","iqama_dhuhr","iqama_asr","iqama_maghrib","iqama_isha"};
    private static final int[] DEFAULTS={20,20,20,10,20};

    public static int minutes(Context c,String prayer){
        int i=index(prayer); if(i<0)return 0;
        SharedPreferences p=c.getSharedPreferences("aqim",Context.MODE_PRIVATE);
        return Math.max(0,Math.min(120,p.getInt(KEYS[i],DEFAULTS[i])));
    }
    public static int defaultMinutes(String prayer){int i=index(prayer);return i<0?0:DEFAULTS[i];}
    public static String key(String prayer){int i=index(prayer);return i<0?null:KEYS[i];}
    private static int index(String prayer){for(int i=0;i<NAMES.length;i++)if(NAMES[i].equals(prayer))return i;return -1;}
}
