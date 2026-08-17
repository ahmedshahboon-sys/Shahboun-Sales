package com.shahboun.aqim;

import android.app.*;
import android.content.*;
import android.content.pm.ServiceInfo;
import android.os.*;

public class AqimStatusService extends Service {
    private static final String CH="aqim_status";
    private final Handler h=new Handler(Looper.getMainLooper());
    private final Runnable tick=new Runnable(){public void run(){update();h.postDelayed(this,60000);}};
    @Override public void onCreate(){super.onCreate();createChannel();Notification n=build();if(Build.VERSION.SDK_INT>=34)startForeground(3101,n,ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);else startForeground(3101,n);h.postDelayed(tick,60000);PrayerWidget.updateAll(this);}
    private void createChannel(){if(Build.VERSION.SDK_INT>=26){NotificationChannel c=new NotificationChannel(CH,"الصلاة القادمة",NotificationManager.IMPORTANCE_LOW);c.setDescription("شريط دائم يعرض الصلاة القادمة والوقت المتبقي والإقامة");c.setShowBadge(false);((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(c);}}
    static long remainingMs(String s){try{String[]p=s.replaceAll("[^0-9:]","").split(":");if(p.length==3)return (Long.parseLong(p[0])*3600+Long.parseLong(p[1])*60+Long.parseLong(p[2]))*1000L;if(p.length==2)return (Long.parseLong(p[0])*60+Long.parseLong(p[1]))*1000L;}catch(Exception ignored){}return 0;}
    private Notification build(){String[] n=MainActivity.nextPrayerInfo(this);Intent open=new Intent(this,DashboardActivity.class);PendingIntent pi=PendingIntent.getActivity(this,3101,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);Notification.Builder b=Build.VERSION.SDK_INT>=26?new Notification.Builder(this,CH):new Notification.Builder(this);String iq=n.length>4?" • "+n[4]:"";long target=System.currentTimeMillis()+remainingMs(n[2]);b.setSmallIcon(android.R.drawable.ic_lock_idle_alarm).setContentTitle("أَقِم • "+n[0]+" "+n[1]).setContentText(n[3]+iq).setContentIntent(pi).setOngoing(true).setOnlyAlertOnce(true).setVisibility(Notification.VISIBILITY_PUBLIC).setWhen(target).setUsesChronometer(true).setShowWhen(true);if(Build.VERSION.SDK_INT>=24)b.setChronometerCountDown(true);return b.build();}
    private void update(){if(!getSharedPreferences("aqim",MODE_PRIVATE).getBoolean("statusNotification",true)){stopSelf();return;}((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).notify(3101,build());PrayerWidget.updateAll(this);}
    @Override public int onStartCommand(Intent i,int f,int id){update();return START_STICKY;}
    @Override public void onDestroy(){h.removeCallbacks(tick);super.onDestroy();}
    @Override public android.os.IBinder onBind(Intent i){return null;}
}
