package com.shahboun.aqim;

import android.app.PendingIntent;
import android.appwidget.*;
import android.content.*;
import android.widget.RemoteViews;

public class PrayerWidget extends AppWidgetProvider {
    @Override public void onUpdate(Context c,AppWidgetManager m,int[] ids){for(int id:ids)updateOne(c,m,id);}
    public static void updateAll(Context c){AppWidgetManager m=AppWidgetManager.getInstance(c);ComponentName n=new ComponentName(c,PrayerWidget.class);for(int id:m.getAppWidgetIds(n))updateOne(c,m,id);}
    static void updateOne(Context c,AppWidgetManager m,int id){String[] x=MainActivity.nextPrayerInfo(c);RemoteViews v=new RemoteViews(c.getPackageName(),R.layout.aqim_widget);v.setTextViewText(R.id.widget_title,x[0]+" • "+x[1]);v.setTextViewText(R.id.widget_countdown,"باقي "+x[2]);v.setTextViewText(R.id.widget_location,x[3]);Intent i=new Intent(c,MainActivity.class);PendingIntent p=PendingIntent.getActivity(c,4001,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);v.setOnClickPendingIntent(R.id.widget_root,p);m.updateAppWidget(id,v);}
}
