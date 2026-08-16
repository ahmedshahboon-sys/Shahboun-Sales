package com.shahboun.aqim;

import android.accessibilityservice.AccessibilityService;
import android.content.*;
import android.view.KeyEvent;
import android.view.accessibility.AccessibilityEvent;

public class VolumeStopAccessibilityService extends AccessibilityService {
 @Override protected boolean onKeyEvent(KeyEvent e){
  if(e.getAction()==KeyEvent.ACTION_DOWN && (e.getKeyCode()==KeyEvent.KEYCODE_VOLUME_UP || e.getKeyCode()==KeyEvent.KEYCODE_VOLUME_DOWN)){
   if(getSharedPreferences("aqim",MODE_PRIVATE).getBoolean("adhanPlaying",false)){
    Intent i=new Intent(this,AdhanService.class).setAction(AdhanService.ACTION_STOP);
    if(android.os.Build.VERSION.SDK_INT>=26)startForegroundService(i);else startService(i);
    return true;
   }
  }
  return super.onKeyEvent(e);
 }
 @Override public void onAccessibilityEvent(AccessibilityEvent e){}
 @Override public void onInterrupt(){}
}
