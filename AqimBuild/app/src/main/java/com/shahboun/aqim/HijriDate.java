package com.shahboun.aqim;

import android.content.*;
import android.icu.util.IslamicCalendar;
import java.util.*;

public final class HijriDate {
    private static final String[] MONTHS={"محرم","صفر","ربيع الأول","ربيع الآخر","جمادى الأولى","جمادى الآخرة","رجب","شعبان","رمضان","شوال","ذو القعدة","ذو الحجة"};
    private HijriDate(){}
    public static String format(Context c, Date date){
        try{
            IslamicCalendar h=new IslamicCalendar(TimeZone.getTimeZone("Africa/Tripoli"),new Locale("ar"));
            h.setCalculationType(IslamicCalendar.CalculationType.ISLAMIC_UMALQURA);
            h.setTime(date);
            int correction=c.getSharedPreferences("aqim",0).getInt("hijriCorrection",0);
            if(correction!=0)h.add(java.util.Calendar.DAY_OF_MONTH,correction);
            int day=h.get(java.util.Calendar.DAY_OF_MONTH),month=h.get(java.util.Calendar.MONTH),year=h.get(java.util.Calendar.YEAR);
            return day+" "+MONTHS[Math.max(0,Math.min(11,month))]+" "+year+" هـ";
        }catch(Exception e){return "التاريخ الهجري غير متاح";}
    }
}
