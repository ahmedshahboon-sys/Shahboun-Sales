package com.shahboun.aqim;

import android.app.*;
import android.content.*;
import android.media.*;
import android.net.Uri;
import android.os.*;
import androidx.annotation.Nullable;

public class AdhanService extends Service {
    private static final String CH_ADHAN = "aqim_adhan";
    private static final String CH_REM = "aqim_reminders";
    private MediaPlayer player;

    @Override public void onCreate() {
        super.onCreate();
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel a = new NotificationChannel(CH_ADHAN, "الأذان", NotificationManager.IMPORTANCE_HIGH);
            a.setDescription("تنبيهات دخول وقت الصلاة وتشغيل الأذان");
            a.enableVibration(true);
            nm.createNotificationChannel(a);
            NotificationChannel r = new NotificationChannel(CH_REM, "تذكيرات الصلاة", NotificationManager.IMPORTANCE_DEFAULT);
            nm.createNotificationChannel(r);
        }
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        String prayer = intent != null ? intent.getStringExtra("prayer") : "الصلاة";
        String mode = intent != null ? intent.getStringExtra("mode") : "PRAYER";
        if (prayer == null) prayer = "الصلاة";
        if (mode == null) mode = "PRAYER";
        if (!"PRAYER".equals(mode)) {
            showReminder(prayer, mode);
            stopSelf();
            return START_NOT_STICKY;
        }
        Notification n = new Notification.Builder(this, CH_ADHAN)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle("أَقِم • حان وقت " + prayer)
                .setContentText("حي على الصلاة")
                .setOngoing(true)
                .setCategory(Notification.CATEGORY_ALARM)
                .build();
        startForeground(1001, n);
        play(prayer);
        return START_NOT_STICKY;
    }

    private void showReminder(String prayer, String mode) {
        String title = "PRE".equals(mode) ? "اقترب موعد " + prayer : "هل صليت " + prayer + "؟";
        String text = "PRE".equals(mode) ? "استعد للصلاة وتهيأ للوضوء" : "سجّل صلاتك وواصل يومك بذكر الله";
        Notification n = new Notification.Builder(this, CH_REM)
                .setSmallIcon(android.R.drawable.ic_popup_reminder)
                .setContentTitle(title).setContentText(text).setAutoCancel(true).build();
        getSystemService(NotificationManager.class).notify((int)(System.currentTimeMillis()%100000), n);
    }

    private void play(String prayer) {
        SharedPreferences p = getSharedPreferences("aqim", MODE_PRIVATE);
        boolean full = p.getBoolean("fullAdhan", true);
        if (!full) { stopSelf(); return; }
        String uriText = "الفجر".equals(prayer) ? p.getString("fajrUri", "") : p.getString("adhanUri", "");
        try {
            if (uriText != null && !uriText.isEmpty()) {
                player = new MediaPlayer();
                player.setDataSource(this, Uri.parse(uriText));
                AudioAttributes aa = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build();
                player.setAudioAttributes(aa);
                player.prepare();
            } else {
                int res = getResources().getIdentifier("adhan_default", "raw", getPackageName());
                if (res != 0) player = MediaPlayer.create(this, res);
                else {
                    Uri tone = android.media.RingtoneManager.getDefaultUri(android.media.RingtoneManager.TYPE_ALARM);
                    player = MediaPlayer.create(this, tone);
                }
            }
            if (player != null) {
                player.setOnCompletionListener(mp -> { mp.release(); player = null; stopForeground(STOP_FOREGROUND_REMOVE); stopSelf(); });
                player.start();
            } else stopSelf();
        } catch (Exception e) { stopSelf(); }
    }

    @Override public void onDestroy() {
        if (player != null) { try { player.stop(); } catch (Exception ignored) {} player.release(); player = null; }
        super.onDestroy();
    }

    @Nullable @Override public android.os.IBinder onBind(Intent intent) { return null; }
}
