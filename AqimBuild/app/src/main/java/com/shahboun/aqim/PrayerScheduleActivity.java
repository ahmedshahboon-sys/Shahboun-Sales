package com.shahboun.aqim;

import android.app.*;
import android.content.*;
import android.graphics.*;
import android.graphics.drawable.GradientDrawable;
import android.os.*;
import android.view.*;
import android.widget.*;
import java.text.SimpleDateFormat;
import java.util.*;

public class PrayerScheduleActivity extends Activity{
    final int G=Color.rgb(15,76,58),GD=Color.rgb(205,168,92),I=Color.rgb(248,244,235),T=Color.rgb(35,48,43),M=Color.rgb(105,110,108);android.graphics.Typeface c;LinearLayout root;
    @Override public void onCreate(Bundle b){super.onCreate(b);try{if(Build.VERSION.SDK_INT>=26)c=getResources().getFont(getResources().getIdentifier("cairo","font",getPackageName()));}catch(Exception ignored){}showFive();}
    int dp(int v){return Math.round(v*getResources().getDisplayMetrics().density);}GradientDrawable bg(int color,int r){GradientDrawable g=new GradientDrawable();g.setColor(color);g.setCornerRadius(dp(r));return g;}TextView tx(String s,int z,int color,boolean bold){TextView t=new TextView(this);t.setText(s);t.setTextSize(z);t.setTextColor(color);t.setGravity(Gravity.CENTER);t.setPadding(dp(7),dp(7),dp(7),dp(7));if(c!=null)t.setTypeface(c,bold?1:0);return t;}Button bt(String s,boolean primary){Button b=new Button(this);b.setText(s);b.setAllCaps(false);b.setTextSize(14);b.setGravity(Gravity.CENTER);b.setTextColor(primary?Color.WHITE:T);b.setBackground(bg(primary?G:Color.WHITE,18));b.setElevation(dp(3));b.setMinHeight(0);b.setMinimumHeight(0);if(c!=null)b.setTypeface(c,1);return b;}
    void base(String title){root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setPadding(dp(16),dp(16),dp(16),dp(28));root.setBackgroundColor(I);root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);root.addView(tx(title,27,G,true));root.addView(tx("الحساب حسب موقعك وطريقة الحساب والمنطقة الزمنية المعتمدة في أَقِم.",12,M,false));}
    void showFive(){base("مواقيت الصلاة القادمة");Button pick=bt("اختيار تاريخ معين",true);pick.setOnClickListener(v->pickDate());add(pick);TimeZone tz=TimeZone.getTimeZone(getSharedPreferences("aqim",0).getString("tzId",TimeZone.getDefault().getID()));Calendar day=Calendar.getInstance(tz);for(int i=0;i<5;i++){Calendar d=(Calendar)day.clone();d.add(Calendar.DAY_OF_MONTH,i);addDay(d,i==0?"اليوم":i==1?"غدًا":"بعد "+i+" أيام");}set();}
    void pickDate(){TimeZone tz=TimeZone.getTimeZone(getSharedPreferences("aqim",0).getString("tzId",TimeZone.getDefault().getID()));Calendar now=Calendar.getInstance(tz);DatePickerDialog dlg=new DatePickerDialog(this,(v,y,m,d)->{Calendar c=Calendar.getInstance(tz);c.set(y,m,d,12,0,0);showOne(c);},now.get(Calendar.YEAR),now.get(Calendar.MONTH),now.get(Calendar.DAY_OF_MONTH));dlg.show();}
    void showOne(Calendar d){base("مواقيت تاريخ محدد");Button back=bt("الرجوع إلى 5 أيام",false);back.setOnClickListener(v->showFive());add(back);addDay(d,"التاريخ المختار");set();}
    void addDay(Calendar d,String caption){LinkedHashMap<String,Calendar> times=MainActivity.timesFor(this,d);LinearLayout card=new LinearLayout(this);card.setOrientation(LinearLayout.VERTICAL);card.setPadding(dp(12),dp(10),dp(12),dp(10));card.setBackground(bg(Color.WHITE,20));card.setElevation(dp(2));SimpleDateFormat f=new SimpleDateFormat("EEEE • dd/MM/yyyy",new Locale("ar"));card.addView(tx(caption+" • "+f.format(d.getTime()),16,G,true));StringBuilder s=new StringBuilder();String[] order={"الفجر","الشروق","الظهر","العصر","المغرب","العشاء"};for(String n:order){Calendar x=times.get(n);if(x!=null)s.append(n).append("  ").append(PrayerPresentation.format(this,x)).append("\n");}TextView body=tx(s.toString().trim(),16,T,false);body.setLineSpacing(0,1.35f);card.addView(body);LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.setMargins(0,dp(7),0,dp(7));root.addView(card,p);}
    void add(View v){LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,dp(58));p.setMargins(0,dp(7),0,0);root.addView(v,p);}void set(){ScrollView s=new ScrollView(this);s.setFillViewport(true);s.addView(root);if(Build.VERSION.SDK_INT>=21)s.setOnApplyWindowInsetsListener((v,i)->{int top,bottom;if(Build.VERSION.SDK_INT>=30){android.graphics.Insets z=i.getInsets(WindowInsets.Type.systemBars());top=z.top;bottom=z.bottom;}else{top=i.getSystemWindowInsetTop();bottom=i.getSystemWindowInsetBottom();}v.setPadding(0,top,0,bottom);return i;});setContentView(s);}
}
