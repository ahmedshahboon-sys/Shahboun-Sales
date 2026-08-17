package com.shahboun.aqim;

import android.content.*;
import android.os.Build;

public class BootReceiver extends BroadcastReceiver {
 @Override public void onReceive(Context c,Intent i){
  MainActivity.scheduleAll(c);
  DhikrReminderReceiver.ensureScheduled(c);
  WorshipReminderReceiver.scheduleAll(c);
  if(c.getSharedPreferences("aqim",Context.MODE_PRIVATE).getBoolean("statusNotification",true)){
   Intent s=new Intent(c,AqimStatusService.class);
   try{if(Build.VERSION.SDK_INT>=26)c.startForegroundService(s);else c.startService(s);}catch(Exception ignored){}
  }
 }
}