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
    private static final String CHANNEL="aqim_tasbih_bubble";
    private WindowManager wm; private FrameLayout bubble,trash; private TextView count; private WindowManager.LayoutParams params,trashParams; private SharedPreferences prefs; private Typeface cairo;
    private ScaleGestureDetector scaler; private int size;

    @Override public void onCreate(){super.onCreate();prefs=getSharedPreferences("aqim",MODE_PRIVATE);createChannel();Notification n=notification();if(Build.VERSION.SDK_INT>=34)startForeground(2201,n,ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);else startForeground(2201,n);if(Build.VERSION.SDK_INT>=23&&!Settings.canDrawOverlays(this)){stopSelf();return;}try{if(Build.VERSION.SDK_INT>=26)cairo=getResources().getFont(getResources().getIdentifier("cairo","font",getPackageName()));}catch(Exception ignored){}showBubble();}
    private void createChannel(){if(Build.VERSION.SDK_INT>=26){NotificationChannel c=new NotificationChannel(CHANNEL,"فقاعة التسبيح",NotificationManager.IMPORTANCE_LOW);c.setDescription("فقاعة تسبيح عائمة فوق التطبيقات");((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(c);}}
    private Notification notification(){Intent open=new Intent(this,MainActivity.class);PendingIntent pi=PendingIntent.getActivity(this,2201,open,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);Notification.Builder b=Build.VERSION.SDK_INT>=26?new Notification.Builder(this,CHANNEL):new Notification.Builder(this);return b.setSmallIcon(android.R.drawable.ic_popup_sync).setContentTitle("أَقِم • فقاعة التسبيح").setContentText("اضغط للتسبيح • اسحب للتحريك • إصبعان لتغيير الحجم").setContentIntent(pi).setOngoing(true).build();}

    private void showBubble(){
        wm=(WindowManager)getSystemService(WINDOW_SERVICE);int type=Build.VERSION.SDK_INT>=26?WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY:WindowManager.LayoutParams.TYPE_PHONE;
        size=Math.max(dp(46),Math.min(dp(92),prefs.getInt("bubbleSize",dp(58))));
        params=new WindowManager.LayoutParams(size,size,type,WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,PixelFormat.TRANSLUCENT);params.gravity=Gravity.TOP|Gravity.START;params.x=prefs.getInt("bubbleX",dp(12));params.y=prefs.getInt("bubbleY",dp(180));
        bubble=new FrameLayout(this);bubble.setPadding(dp(3),dp(3),dp(3),dp(3));GradientDrawable bg=new GradientDrawable();bg.setShape(GradientDrawable.OVAL);bg.setColor(Color.rgb(15,76,58));bg.setStroke(dp(2),Color.rgb(215,180,106));bubble.setBackground(bg);bubble.setElevation(dp(10));
        TextView word=new TextView(this);word.setText("سبّح");word.setTextColor(Color.WHITE);word.setTextSize(13);word.setGravity(Gravity.CENTER);if(cairo!=null)word.setTypeface(cairo,Typeface.BOLD);bubble.addView(word,new FrameLayout.LayoutParams(-1,-1));
        count=new TextView(this);refreshCount();count.setTextColor(Color.rgb(15,76,58));count.setTextSize(9);count.setGravity(Gravity.CENTER);count.setTypeface(Typeface.DEFAULT_BOLD);GradientDrawable badge=new GradientDrawable();badge.setShape(GradientDrawable.OVAL);badge.setColor(Color.rgb(248,244,235));badge.setStroke(dp(1),Color.rgb(215,180,106));count.setBackground(badge);FrameLayout.LayoutParams cp=new FrameLayout.LayoutParams(dp(24),dp(24),Gravity.TOP|Gravity.END);cp.setMargins(0,-dp(3),-dp(3),0);bubble.addView(count,cp);
        scaler=new ScaleGestureDetector(this,new ScaleGestureDetector.SimpleOnScaleGestureListener(){@Override public boolean onScale(ScaleGestureDetector d){size=(int)(size*d.getScaleFactor());size=Math.max(dp(46),Math.min(dp(96),size));params.width=params.height=size;try{wm.updateViewLayout(bubble,params);}catch(Exception ignored){}prefs.edit().putInt("bubbleSize",size).apply();return true;}});
        bubble.setOnTouchListener(new View.OnTouchListener(){int sx,sy;float tx,ty;boolean moved;public boolean onTouch(View v,MotionEvent e){scaler.onTouchEvent(e);if(e.getPointerCount()>1)return true;switch(e.getActionMasked()){case MotionEvent.ACTION_DOWN:sx=params.x;sy=params.y;tx=e.getRawX();ty=e.getRawY();moved=false;return true;case MotionEvent.ACTION_MOVE:int nx=sx+(int)(e.getRawX()-tx),ny=sy+(int)(e.getRawY()-ty);if(Math.abs(nx-sx)>dp(4)||Math.abs(ny-sy)>dp(4))moved=true;params.x=nx;params.y=ny;showTrash();try{wm.updateViewLayout(bubble,params);}catch(Exception ignored){}return true;case MotionEvent.ACTION_UP:hideTrash();if(isOverTrash()){stopSelf();return true;}prefs.edit().putInt("bubbleX",params.x).putInt("bubbleY",params.y).apply();if(!moved)increment();return true;}return false;}});
        wm.addView(bubble,params);
    }
    private void showTrash(){if(trash!=null)return;int type=Build.VERSION.SDK_INT>=26?WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY:WindowManager.LayoutParams.TYPE_PHONE;trash=new FrameLayout(this);TextView x=new TextView(this);x.setText("×");x.setTextSize(34);x.setTextColor(Color.WHITE);x.setGravity(Gravity.CENTER);GradientDrawable g=new GradientDrawable();g.setShape(GradientDrawable.OVAL);g.setColor(Color.rgb(160,55,55));trash.setBackground(g);trash.addView(x,new FrameLayout.LayoutParams(-1,-1));trashParams=new WindowManager.LayoutParams(dp(70),dp(70),type,WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,PixelFormat.TRANSLUCENT);trashParams.gravity=Gravity.BOTTOM|Gravity.CENTER_HORIZONTAL;trashParams.y=dp(30);try{wm.addView(trash,trashParams);}catch(Exception ignored){trash=null;}}
    private void hideTrash(){if(trash!=null){try{wm.removeView(trash);}catch(Exception ignored){}trash=null;}}
    private boolean isOverTrash(){if(wm==null)return false;android.graphics.Point p=new android.graphics.Point();wm.getDefaultDisplay().getSize(p);float cx=params.x+size/2f,cy=params.y+size/2f;return cy>p.y-dp(150)&&Math.abs(cx-p.x/2f)<dp(120);}
    private void increment(){int n=prefs.getInt("tasbih",0)+1;prefs.edit().putInt("tasbih",n).apply();refreshCount();if(bubble!=null)bubble.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP);}
    private void refreshCount(){if(count!=null)count.setText(String.valueOf(prefs.getInt("tasbih",0)));}
    private int dp(int v){return Math.round(v*getResources().getDisplayMetrics().density);}
    @Override public void onDestroy(){hideTrash();if(wm!=null&&bubble!=null){try{wm.removeView(bubble);}catch(Exception ignored){}}bubble=null;wm=null;super.onDestroy();}
    @Override public android.os.IBinder onBind(Intent i){return null;}
}
