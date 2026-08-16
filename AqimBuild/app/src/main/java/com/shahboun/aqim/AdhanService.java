package com.shahboun.aqim;

import android.app.*;
import android.content.*;
import android.media.*;
import android.net.Uri;
import android.os.*;

public class AdhanService extends Service {
    private static final String CH_ADHAN = "aqim_adhan";
    private static final String CH_REM = "aqim_reminders";
    private MediaPlayer player;

    @Override public void onCreate() {
        super.onCreate();
        NotificationManager nm = (NotificationManager)getSystemService(NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel a = new NotificationChannel(CH_ADHAN, "الأذان", NotificationManager.IMPORTANCE_HIGH);
            a.setDescription("تنبيهات دخول وقت الصلاة وتشغيل الأذان"); a.enableVibration(true); nm.createNotificationChannel(a);
            NotificationChannel r = new NotificationChannel(CH_REM, "تذكيرات الصلاة", NotificationManager.IMPORTANCE_DEFAULT); nm.createNotificationChannel(r);
        }
    }

    private Notification.Builder builder(String channel) {
        return Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, channel) : new Notification.Builder(this);
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        String prayer = intent != null ? intent.getStringExtra("prayer") : "الصلاة";
        String mode = intent != null ? intent.getStringExtra("mode") : "PRAYER";
        if (prayer == null) prayer = "الصلاة"; if (mode == null) mode = "PRAYER";
        if (!"PRAYER".equals(mode)) {
            Notification n = builder(CH_REM).setSmallIcon(android.R.drawable.ic_popup_reminder)
                    .setContentTitle("PRE".equals(mode) ? "اقترب موعد " + prayer : "هل صليت " + prayer + "؟")
                    .setContentText("PRE".equals(mode) ? "استعد للصلاة وتهيأ للوضوء" : "واصل يومك بذكر الله")
                    .setAutoCancel(true).build();
            startForeground(1002, n);
            ((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).notify((int)(System.currentTimeMillis()%100000), n);
            stopForeground(STOP_FOREGROUND_REMOVE); stopSelf(); return START_NOT_STICKY;
        }
        Notification n = builder(CH_ADHAN).setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("أَقِم • حان وقت " + prayer).setContentText("حي على الصلاة")
                .setOngoing(true).setCategory(Notification.CATEGORY_ALARM).build();
        startForeground(1001, n); play(prayer); return START_NOT_STICKY;
    }

    private void play(String prayer) {
        SharedPreferences p = getSharedPreferences("aqim", MODE_PRIVATE);
        if (!p.getBoolean("fullAdhan", true)) { stopForeground(STOP_FOREGROUND_REMOVE); stopSelf(); return; }
        String uriText = "الفجر".equals(prayer) ? p.getString("fajrUri", "") : p.getString("adhanUri", "");
        try {
            if (uriText != null && !uriText.isEmpty()) {
                player = new MediaPlayer(); player.setDataSource(this, Uri.parse(uriText));
                player.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build()); player.prepare();
            } else {
                int res = getResources().getIdentifier("adhan_default", "raw", getPackageName());
                if (res != 0) player = MediaPlayer.create(this, res);
                else player = MediaPlayer.create(this, RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM));
            }
            if (player != null) { player.setOnCompletionListener(mp -> { mp.release(); player=null; stopForeground(STOP_FOREGROUND_REMOVE); stopSelf(); }); player.start(); }
            else { stopForeground(STOP_FOREGROUND_REMOVE); stopSelf(); }
        } catch (Exception e) { stopForeground(STOP_FOREGROUND_REMOVE); stopSelf(); }
    }

    @Override public void onDestroy(){ if(player!=null){try{player.stop();}catch(Exception ignored){} player.release(); player=null;} super.onDestroy(); }
    @Override public android.os.IBinder onBind(Intent intent){ return null; }
}
