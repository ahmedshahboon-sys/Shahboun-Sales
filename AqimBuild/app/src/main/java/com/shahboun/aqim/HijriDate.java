package com.shahboun.aqim;

import android.content.*;
import android.icu.util.IslamicCalendar;
import java.util.Date;
import java.util.Locale;

public final class HijriDate {
    private static final String[] MONTHS={"محرم","صفر","ربيع الأول","ربيع الآخر","جمادى الأولى","جمادى الآخرة","رجب","شعبان","رمضان","شوال","ذو القعدة","ذو الحجة"};
    private HijriDate(){}
    public static String format(Context c, Date date){
        try{
            IslamicCalendar h=new IslamicCalendar(new Locale("ar"));
            h.setTimeZone(android.icu.util.TimeZone.getTimeZone("Africa/Tripoli"));
            h.setCalculationType(IslamicCalendar.CalculationType.ISLAMIC_UMALQURA);
            h.setTime(date);
            int correction=c.getSharedPreferences("aqim",0).getInt("hijriCorrection",0);
            if(correction!=0)h.add(android.icu.util.Calendar.DAY_OF_MONTH,correction);
            int day=h.get(android.icu.util.Calendar.DAY_OF_MONTH),month=h.get(android.icu.util.Calendar.MONTH),year=h.get(android.icu.util.Calendar.YEAR);
            return day+" "+MONTHS[Math.max(0,Math.min(11,month))]+" "+year+" هـ";
        }catch(Exception e){return "التاريخ الهجري غير متاح";}
    }
}
