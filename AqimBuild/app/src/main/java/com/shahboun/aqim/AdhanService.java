package com.shahboun.aqim;

import android.app.*;
import android.content.*;
import android.media.*;
import android.net.Uri;
import android.os.*;

public class AdhanService extends Service {
    public static final String ACTION_STOP = "com.shahboun.aqim.STOP_ADHAN";
    private static final String CH_ADHAN = "aqim_adhan";
    private static final String CH_REM = "aqim_reminders";
    private MediaPlayer player;

    @Override public void onCreate() {
        super.onCreate();
        NotificationManager nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        if(Build.VERSION.SDK_INT>=26){
            NotificationChannel a=new NotificationChannel(CH_ADHAN,"الأذان",NotificationManager.IMPORTANCE_HIGH);
            a.setDescription("تنبيهات دخول وقت الصلاة وتشغيل الأذان"); a.enableVibration(true); nm.createNotificationChannel(a);
            NotificationChannel r=new NotificationChannel(CH_REM,"تذكيرات الصلاة",NotificationManager.IMPORTANCE_HIGH); nm.createNotificationChannel(r);
        }
    }
    private Notification.Builder nb(String ch){ return Build.VERSION.SDK_INT>=26?new Notification.Builder(this,ch):new Notification.Builder(this); }

    @Override public int onStartCommand(Intent intent,int flags,int startId){
        if(intent!=null && ACTION_STOP.equals(intent.getAction())){ stopAdhan(); return START_NOT_STICKY; }
        String prayer=intent!=null?intent.getStringExtra("prayer"):"الصلاة";
        String mode=intent!=null?intent.getStringExtra("mode"):"PRAYER";
        boolean test=intent!=null&&intent.getBooleanExtra("test",false);
        if(prayer==null)prayer="الصلاة"; if(mode==null)mode="PRAYER";
        if("POST".equals(mode)){ PrayerActionReceiver.showQuestion(this,prayer,0); stopSelf(); return START_NOT_STICKY; }
        if("PRE".equals(mode)){
            Notification n=nb(CH_REM).setSmallIcon(android.R.drawable.ic_popup_reminder).setContentTitle("اقترب موعد "+prayer)
                    .setContentText("استعد للصلاة وتهيأ للوضوء").setAutoCancel(true).build();
            ((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).notify((int)(System.currentTimeMillis()%100000),n); stopSelf(); return START_NOT_STICKY;
        }
        Intent stop=new Intent(this,AdhanService.class).setAction(ACTION_STOP);
        PendingIntent stopPi=Build.VERSION.SDK_INT>=26?PendingIntent.getForegroundService(this,991,stop,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE):PendingIntent.getService(this,991,stop,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification n=nb(CH_ADHAN).setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(test?"اختبار أذان أَقِم":"أَقِم • حان وقت "+prayer).setContentText("إيقاف من الإشعار أو زر الصوت بعد تفعيل الخدمة")
                .setOngoing(true).setCategory(Notification.CATEGORY_ALARM).addAction(0,"إيقاف الأذان",stopPi).build();
        startForeground(1001,n); play(prayer); return START_NOT_STICKY;
    }

    private void play(String prayer){
        SharedPreferences p=getSharedPreferences("aqim",MODE_PRIVATE);
        if(!p.getBoolean("fullAdhan",true)){ stopAdhan(); return; }
        p.edit().putBoolean("adhanPlaying",true).apply();
        boolean fajr="الفجر".equals(prayer);
        String choice=fajr?p.getString("fajrChoice",p.getString("adhanChoice","mecca2013")):p.getString("adhanChoice","mecca2013");
        String custom=fajr?p.getString("fajrUri",""):p.getString("adhanUri","");
        try{
            if("custom".equals(choice)&&custom!=null&&!custom.isEmpty()){
                player=new MediaPlayer(); player.setDataSource(this,Uri.parse(custom));
                player.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build()); player.prepare();
            }else{
                int res=resourceFor(choice); if(res==0)res=getResources().getIdentifier("adhan_default","raw",getPackageName());
                player=res!=0?MediaPlayer.create(this,res):MediaPlayer.create(this,RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM));
                if(player!=null)player.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build());
            }
            if(player!=null){ player.setOnCompletionListener(mp->{try{mp.release();}catch(Exception ignored){} player=null; finishPlaying();}); player.start(); }
            else finishPlaying();
        }catch(Exception e){ finishPlaying(); }
    }
    private int resourceFor(String choice){
        if("classic".equals(choice))return getResources().getIdentifier("adhan_classic","raw",getPackageName());
        if("prophet".equals(choice))return getResources().getIdentifier("adhan_prophet_mosque","raw",getPackageName());
        if("africa".equals(choice))return getResources().getIdentifier("adhan_africa","raw",getPackageName());
        if("default".equals(choice))return getResources().getIdentifier("adhan_default","raw",getPackageName());
        return getResources().getIdentifier("adhan_mecca_2013","raw",getPackageName());
    }
    private void finishPlaying(){ getSharedPreferences("aqim",MODE_PRIVATE).edit().putBoolean("adhanPlaying",false).apply(); try{stopForeground(STOP_FOREGROUND_REMOVE);}catch(Exception ignored){} stopSelf(); }
    private void stopAdhan(){ if(player!=null){try{player.stop();}catch(Exception ignored){} try{player.release();}catch(Exception ignored){} player=null;} finishPlaying(); }
    @Override public void onDestroy(){ getSharedPreferences("aqim",MODE_PRIVATE).edit().putBoolean("adhanPlaying",false).apply(); if(player!=null){try{player.stop();player.release();}catch(Exception ignored){} player=null;} super.onDestroy(); }
    @Override public android.os.IBinder onBind(Intent i){return null;}
}
