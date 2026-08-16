package com.shahboun.aqim;

import android.app.*;
import android.content.*;
import android.os.Build;

public class PrayerActionReceiver extends BroadcastReceiver {
    private static final String CH="aqim_prayer_check";
    public static final String ACTION_DONE="com.shahboun.aqim.PRAYER_DONE";
    public static final String ACTION_SNOOZE="com.shahboun.aqim.PRAYER_SNOOZE";

    @Override public void onReceive(Context c, Intent i){
        String prayer=i.getStringExtra("prayer"); if(prayer==null)prayer="الصلاة";
        int attempt=i.getIntExtra("attempt",0);
        if(ACTION_DONE.equals(i.getAction())){
            c.getSharedPreferences("aqim",Context.MODE_PRIVATE).edit()
                    .putBoolean("done_"+dayKey()+"_"+prayer,true).apply();
            ((NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE)).cancel(notificationId(prayer));
            return;
        }
        if(ACTION_SNOOZE.equals(i.getAction())){
            ((NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE)).cancel(notificationId(prayer));
            int delay=c.getSharedPreferences("aqim",Context.MODE_PRIVATE).getInt("snooze",15);
            int max=c.getSharedPreferences("aqim",Context.MODE_PRIVATE).getInt("maxReminders",3);
            if(attempt+1<max) scheduleQuestion(c,prayer,attempt+1,System.currentTimeMillis()+delay*60000L);
        }
    }

    public static void showQuestion(Context c,String prayer,int attempt){
        if(c.getSharedPreferences("aqim",Context.MODE_PRIVATE).getBoolean("done_"+dayKey()+"_"+prayer,false))return;
        createChannel(c);
        Intent done=new Intent(c,PrayerActionReceiver.class).setAction(ACTION_DONE).putExtra("prayer",prayer).putExtra("attempt",attempt);
        Intent snooze=new Intent(c,PrayerActionReceiver.class).setAction(ACTION_SNOOZE).putExtra("prayer",prayer).putExtra("attempt",attempt);
        PendingIntent dp=PendingIntent.getBroadcast(c,5000+prayer.hashCode(),done,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        PendingIntent sp=PendingIntent.getBroadcast(c,6000+prayer.hashCode(),snooze,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b=Build.VERSION.SDK_INT>=26?new Notification.Builder(c,CH):new Notification.Builder(c);
        Notification n=b.setSmallIcon(android.R.drawable.ic_popup_reminder).setContentTitle("هل صليت "+prayer+"؟")
                .setContentText("أكد الصلاة أو أجّل التذكير حتى لا تفوتك")
                .setAutoCancel(false).setOngoing(false).setPriority(Notification.PRIORITY_HIGH)
                .addAction(0,"نعم، صليت",dp).addAction(0,"ذكّرني لاحقًا",sp).build();
        ((NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE)).notify(notificationId(prayer),n);
    }

    public static void scheduleQuestion(Context c,String prayer,int attempt,long when){
        Intent i=new Intent(c,PrayerQuestionReceiver.class).putExtra("prayer",prayer).putExtra("attempt",attempt);
        PendingIntent pi=PendingIntent.getBroadcast(c,7000+prayer.hashCode()+attempt,i,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        AlarmManager am=(AlarmManager)c.getSystemService(Context.ALARM_SERVICE);
        try{ if(Build.VERSION.SDK_INT>=31&&am.canScheduleExactAlarms())am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,when,pi); else if(Build.VERSION.SDK_INT>=23)am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,when,pi); else am.setExact(AlarmManager.RTC_WAKEUP,when,pi); }
        catch(Exception e){am.set(AlarmManager.RTC_WAKEUP,when,pi);}
    }
    static int notificationId(String p){return 8800+Math.abs(p.hashCode()%1000);}
    static String dayKey(){java.text.SimpleDateFormat f=new java.text.SimpleDateFormat("yyyyMMdd",java.util.Locale.US);f.setTimeZone(java.util.TimeZone.getTimeZone("Africa/Tripoli"));return f.format(new java.util.Date());}
    static void createChannel(Context c){if(Build.VERSION.SDK_INT>=26){NotificationChannel ch=new NotificationChannel(CH,"متابعة الصلاة",NotificationManager.IMPORTANCE_HIGH);ch.setDescription("تذكير تأكيد الصلاة والتأجيل");((NotificationManager)c.getSystemService(Context.NOTIFICATION_SERVICE)).createNotificationChannel(ch);}}
}
