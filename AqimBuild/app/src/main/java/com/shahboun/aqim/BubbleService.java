package com.shahboun.aqim;

import android.app.*;
import android.content.*;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.*;
import android.provider.Settings;
import android.view.*;
import android.widget.*;

public class BubbleService extends Service {
    private static final String CHANNEL = "aqim_tasbih_bubble";
    private WindowManager wm;
    private FrameLayout bubble;
    private TextView count;
    private WindowManager.LayoutParams params;
    private SharedPreferences prefs;
    private Typeface cairo;

    @Override public void onCreate() {
        super.onCreate();
        prefs = getSharedPreferences("aqim", MODE_PRIVATE);
        createChannel();
        Notification n = notification();
        if (Build.VERSION.SDK_INT >= 34) startForeground(2201, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        else startForeground(2201, n);
        if (Build.VERSION.SDK_INT >= 23 && !Settings.canDrawOverlays(this)) { stopSelf(); return; }
        try { if (Build.VERSION.SDK_INT >= 26) cairo = getResources().getFont(getResources().getIdentifier("cairo","font",getPackageName())); } catch (Exception ignored) {}
        showBubble();
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel c = new NotificationChannel(CHANNEL, "فقاعة التسبيح", NotificationManager.IMPORTANCE_LOW);
            c.setDescription("إبقاء فقاعة التسبيح ظاهرة فوق التطبيقات");
            ((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(c);
        }
    }

    private Notification notification() {
        Intent open = new Intent(this, MainActivity.class);
        PendingIntent pi = PendingIntent.getActivity(this, 2201, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this);
        return b.setSmallIcon(android.R.drawable.ic_popup_sync)
                .setContentTitle("أَقِم • فقاعة التسبيح")
                .setContentText("اضغط الفقاعة للتسبيح واسحبها لتحريكها")
                .setContentIntent(pi).setOngoing(true).build();
    }

    private void showBubble() {
        wm = (WindowManager)getSystemService(WINDOW_SERVICE);
        int type = Build.VERSION.SDK_INT >= 26 ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : WindowManager.LayoutParams.TYPE_PHONE;
        params = new WindowManager.LayoutParams(dp(78), dp(78), type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT);
        params.gravity = Gravity.TOP | Gravity.START;
        params.x = prefs.getInt("bubbleX", dp(10));
        params.y = prefs.getInt("bubbleY", dp(180));

        bubble = new FrameLayout(this);
        bubble.setPadding(dp(4),dp(4),dp(4),dp(4));
        GradientDrawable bg = new GradientDrawable(); bg.setShape(GradientDrawable.OVAL); bg.setColor(Color.rgb(15,76,58)); bg.setStroke(dp(2), Color.rgb(215,180,106));
        bubble.setBackground(bg); bubble.setElevation(dp(12));

        TextView word = new TextView(this); word.setText("ذِكر"); word.setTextColor(Color.WHITE); word.setTextSize(16); word.setGravity(Gravity.CENTER);
        if (cairo != null) word.setTypeface(cairo, Typeface.BOLD);
        bubble.addView(word, new FrameLayout.LayoutParams(-1,-1));

        count = new TextView(this); refreshCount(); count.setTextColor(Color.rgb(15,76,58)); count.setTextSize(10); count.setGravity(Gravity.CENTER); count.setTypeface(Typeface.DEFAULT_BOLD);
        GradientDrawable badge = new GradientDrawable(); badge.setShape(GradientDrawable.OVAL); badge.setColor(Color.rgb(248,244,235)); badge.setStroke(dp(1), Color.rgb(215,180,106)); count.setBackground(badge);
        FrameLayout.LayoutParams cp = new FrameLayout.LayoutParams(dp(28),dp(28), Gravity.TOP|Gravity.END); cp.setMargins(0,-dp(2),-dp(2),0); bubble.addView(count,cp);

        bubble.setOnTouchListener(new View.OnTouchListener(){
            int sx, sy; float tx, ty; boolean moved;
            public boolean onTouch(View v, android.view.MotionEvent e){
                switch(e.getAction()){
                    case android.view.MotionEvent.ACTION_DOWN: sx=params.x; sy=params.y; tx=e.getRawX(); ty=e.getRawY(); moved=false; return true;
                    case android.view.MotionEvent.ACTION_MOVE:
                        int nx=sx+(int)(e.getRawX()-tx), ny=sy+(int)(e.getRawY()-ty);
                        if(Math.abs(nx-sx)>dp(5)||Math.abs(ny-sy)>dp(5)) moved=true;
                        params.x=nx; params.y=ny; try{wm.updateViewLayout(bubble,params);}catch(Exception ignored){} return true;
                    case android.view.MotionEvent.ACTION_UP:
                        prefs.edit().putInt("bubbleX",params.x).putInt("bubbleY",params.y).apply();
                        if(!moved) increment(); return true;
                }
                return false;
            }
        });
        wm.addView(bubble, params);
    }

    private void increment(){
        int n = prefs.getInt("tasbih",0)+1;
        prefs.edit().putInt("tasbih",n).apply();
        refreshCount();
        if(bubble!=null) bubble.performHapticFeedback(android.view.HapticFeedbackConstants.KEYBOARD_TAP);
    }
    private void refreshCount(){ if(count!=null) count.setText(String.valueOf(prefs.getInt("tasbih",0))); }
    private int dp(int v){ return Math.round(v*getResources().getDisplayMetrics().density); }

    @Override public void onDestroy(){
        if(wm!=null && bubble!=null){ try{wm.removeView(bubble);}catch(Exception ignored){} }
        bubble=null; wm=null; super.onDestroy();
    }
    @Override public android.os.IBinder onBind(Intent i){ return null; }
}
