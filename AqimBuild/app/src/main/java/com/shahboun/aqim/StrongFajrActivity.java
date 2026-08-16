package com.shahboun.aqim;

import android.app.*;
import android.content.*;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.*;
import android.text.InputType;
import android.view.*;
import android.view.WindowManager;
import android.widget.*;
import java.util.Random;

public class StrongFajrActivity extends Activity {
    private static final int GREEN=Color.rgb(15,76,58), GOLD=Color.rgb(205,168,92), IVORY=Color.rgb(248,244,235), TEXT=Color.rgb(35,48,43);
    private int answer;
    private EditText input;
    private TextView challenge;
    private android.graphics.Typeface cairo;

    @Override public void onCreate(Bundle b){
        super.onCreate(b);
        if(Build.VERSION.SDK_INT>=27){ setShowWhenLocked(true); setTurnScreenOn(true); }
        else getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED|WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON|WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        try{if(Build.VERSION.SDK_INT>=26)cairo=getResources().getFont(getResources().getIdentifier("cairo","font",getPackageName()));}catch(Exception ignored){}
        showChallenge();
    }

    private void showChallenge(){
        SharedPreferences p=getSharedPreferences("aqim",MODE_PRIVATE);
        if(!p.getBoolean("strongFajr",false)){finish();return;}
        LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setGravity(Gravity.CENTER);root.setPadding(dp(24),dp(28),dp(24),dp(28));root.setBackgroundColor(IVORY);root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        TextView title=txt("الفجر القوي",32,GREEN,true);root.addView(title,new LinearLayout.LayoutParams(-1,dp(72)));
        root.addView(txt("لإيقاف أذان الفجر أكمل التحدي الذي اخترته في الإعدادات.",15,TEXT,false));
        challenge=txt("",22,GREEN,true);LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,dp(92));cp.setMargins(0,dp(20),0,dp(12));root.addView(challenge,cp);
        input=new EditText(this);input.setGravity(Gravity.CENTER);input.setTextSize(22);input.setSingleLine(true);input.setBackground(round(Color.WHITE,20));if(cairo!=null)input.setTypeface(cairo);root.addView(input,new LinearLayout.LayoutParams(-1,dp(66)));
        String mode=p.getString("strongFajrMode","math");
        if("pin".equals(mode)){challenge.setText("أدخل PIN لإيقاف الأذان");input.setInputType(InputType.TYPE_CLASS_NUMBER|InputType.TYPE_NUMBER_VARIATION_PASSWORD);}
        else {Random r=new Random();int a=7+r.nextInt(23),b=4+r.nextInt(17);answer=a+b;challenge.setText(a+" + "+b+" = ؟");input.setInputType(InputType.TYPE_CLASS_NUMBER);}
        Button stop=new Button(this);stop.setText("إيقاف أذان الفجر");stop.setTextColor(Color.WHITE);stop.setTextSize(17);stop.setAllCaps(false);stop.setGravity(Gravity.CENTER);stop.setBackground(round(GREEN,22));if(cairo!=null)stop.setTypeface(cairo,1);stop.setOnClickListener(v->verify());LinearLayout.LayoutParams bp=new LinearLayout.LayoutParams(-1,dp(66));bp.setMargins(0,dp(16),0,0);root.addView(stop,bp);
        root.addView(txt("هذه الميزة اختيارية ويمكن تعطيلها من إعدادات الفجر القوي.",13,Color.DKGRAY,false));
        setContentView(root);
    }

    private void verify(){
        SharedPreferences p=getSharedPreferences("aqim",MODE_PRIVATE);String mode=p.getString("strongFajrMode","math");String entered=input.getText().toString().trim();boolean ok;
        if("pin".equals(mode))ok=!entered.isEmpty()&&entered.equals(p.getString("strongFajrPin","1234"));
        else {int n=-1;try{n=Integer.parseInt(entered);}catch(Exception ignored){}ok=n==answer;}
        if(!ok){input.setText("");Toast.makeText(this,"الإجابة غير صحيحة",Toast.LENGTH_SHORT).show();return;}
        Intent stop=new Intent(this,AdhanService.class).setAction(AdhanService.ACTION_STOP).putExtra("strongSolved",true);if(Build.VERSION.SDK_INT>=26)startForegroundService(stop);else startService(stop);finish();
    }
    @Override public void onBackPressed(){Toast.makeText(this,"أكمل التحدي أولًا",Toast.LENGTH_SHORT).show();}
    private int dp(int v){return Math.round(v*getResources().getDisplayMetrics().density);} private GradientDrawable round(int c,int r){GradientDrawable g=new GradientDrawable();g.setColor(c);g.setCornerRadius(dp(r));return g;} private TextView txt(String s,int z,int c,boolean bold){TextView t=new TextView(this);t.setText(s);t.setTextSize(z);t.setTextColor(c);t.setGravity(Gravity.CENTER);t.setPadding(dp(8),dp(8),dp(8),dp(8));if(cairo!=null)t.setTypeface(cairo,bold?1:0);return t;}
}
