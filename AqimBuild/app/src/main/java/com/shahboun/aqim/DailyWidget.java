package com.shahboun.aqim;

import android.app.PendingIntent;import android.appwidget.*;import android.content.*;import android.widget.RemoteViews;import java.util.*;

public class DailyWidget extends AppWidgetProvider{
 static final String[][] ITEMS={{"آية اليوم","وَأَقِمِ الصَّلَاةَ لِذِكْرِي","طه: 14"},{"ذكر اليوم","سبحان الله وبحمده","صحيح البخاري وصحيح مسلم"},{"دعاء اليوم","رَبِّ زِدْنِي عِلْمًا","طه: 114"},{"ذكر اليوم","أستغفر الله وأتوب إليه","الاستغفار والتوبة ثابتان في السنة الصحيحة"}};
 @Override public void onUpdate(Context c,AppWidgetManager m,int[] ids){Calendar cal=Calendar.getInstance();String[] x=ITEMS[cal.get(Calendar.DAY_OF_YEAR)%ITEMS.length];for(int id:ids){RemoteViews v=new RemoteViews(c.getPackageName(),R.layout.aqim_daily_widget);v.setTextViewText(R.id.daily_widget_title,x[0]);v.setTextViewText(R.id.daily_widget_body,x[1]);v.setTextViewText(R.id.daily_widget_source,x[2]);Intent in=new Intent(c,DashboardActivity.class);PendingIntent p=PendingIntent.getActivity(c,5101,in,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);v.setOnClickPendingIntent(R.id.daily_widget_root,p);m.updateAppWidget(id,v);}}
}
