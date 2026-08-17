package com.shahboun.aqim;

import android.app.PendingIntent;
import android.appwidget.*;
import android.content.*;
import android.graphics.Color;
import android.os.SystemClock;
import android.widget.RemoteViews;

public class PrayerWidget extends AppWidgetProvider {
    @Override public void onUpdate(Context c,AppWidgetManager m,int[] ids){for(int id:ids)updateOne(c,m,id);}
    public static void updateAll(Context c){AppWidgetManager m=AppWidgetManager.getInstance(c);ComponentName n=new ComponentName(c,PrayerWidget.class);for(int id:m.getAppWidgetIds(n))updateOne(c,m,id);}
    static long remainingMs(String s){try{String[]p=s.replaceAll("[^0-9:]","").split(":");if(p.length==3)return (Long.parseLong(p[0])*3600+Long.parseLong(p[1])*60+Long.parseLong(p[2]))*1000L;if(p.length==2)return (Long.parseLong(p[0])*60+Long.parseLong(p[1]))*1000L;}catch(Exception ignored){}return 0;}
    static int bgFor(String prayer){if("الفجر".equals(prayer))return Color.rgb(34,54,77);if("الظهر".equals(prayer))return Color.rgb(42,91,66);if("العصر".equals(prayer))return Color.rgb(72,92,64);if("المغرب".equals(prayer))return Color.rgb(91,61,66);if("العشاء".equals(prayer))return Color.rgb(27,47,58);return Color.rgb(15,76,58);}
    static void updateOne(Context c,AppWidgetManager m,int id){
        String[] x=MainActivity.nextPrayerInfo(c);
        RemoteViews v=new RemoteViews(c.getPackageName(),R.layout.aqim_widget);
        v.setInt(R.id.widget_root,"setBackgroundColor",bgFor(x[0]));
        v.setTextViewText(R.id.widget_title,x[0]+" • "+x[1]);
        long rem=remainingMs(x[2]);long base=SystemClock.elapsedRealtime()+rem;
        v.setChronometer(R.id.widget_countdown,base,"باقي %s",true);
        if(android.os.Build.VERSION.SDK_INT>=24)v.setChronometerCountDown(R.id.widget_countdown,true);
        String extra=x.length>4?" • "+x[4]:"";
        v.setTextViewText(R.id.widget_location,x[3]+extra);
        Intent i=new Intent(c,DashboardActivity.class);
        PendingIntent p=PendingIntent.getActivity(c,4001,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.widget_root,p);
        m.updateAppWidget(id,v);
    }
}
