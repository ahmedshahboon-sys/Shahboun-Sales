package com.shahboun.aqim;
import android.content.*;
public class PrayerQuestionReceiver extends BroadcastReceiver{
 @Override public void onReceive(Context c,Intent i){String p=i.getStringExtra("prayer");int a=i.getIntExtra("attempt",0);PrayerActionReceiver.showQuestion(c,p==null?"الصلاة":p,a);}
}
