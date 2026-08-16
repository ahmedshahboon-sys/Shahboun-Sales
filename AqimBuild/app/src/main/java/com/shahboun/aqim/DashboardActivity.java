package com.shahboun.aqim;

import android.app.*;
import android.content.*;
import android.graphics.*;
import android.graphics.drawable.GradientDrawable;
import android.os.*;
import android.view.*;
import android.widget.*;

public class DashboardActivity extends Activity {
    static final int GREEN=Color.rgb(15,76,58), GOLD=Color.rgb(205,168,92), IVORY=Color.rgb(248,244,235), TEXT=Color.rgb(35,48,43), MUTED=Color.rgb(105,110,108);
    android.graphics.Typeface cairo;
    @Override public void onCreate(Bundle b){super.onCreate(b);getWindow().setStatusBarColor(GREEN);getWindow().setNavigationBarColor(IVORY);try{if(Build.VERSION.SDK_INT>=26)cairo=getResources().getFont(getResources().getIdentifier("cairo","font",getPackageName()));}catch(Exception ignored){}DhikrReminderReceiver.ensureScheduled(this);show();}
    @Override protected void onResume(){super.onResume();if(!isFinishing())show();}
    int dp(int v){return Math.round(v*getResources().getDisplayMetrics().density);} GradientDrawable bg(int c,int r){GradientDrawable g=new GradientDrawable();g.setColor(c);g.setCornerRadius(dp(r));return g;}
    TextView t(String s,int z,int c,boolean bold){TextView x=new TextView(this);x.setText(s);x.setTextSize(z);x.setTextColor(c);x.setGravity(Gravity.CENTER);x.setPadding(dp(6),dp(6),dp(6),dp(6));if(cairo!=null)x.setTypeface(cairo,bold?1:0);return x;}
    Button b(String s,boolean p){Button x=new Button(this);x.setText(s);x.setAllCaps(false);x.setTextSize(15);x.setGravity(Gravity.CENTER);x.setTextColor(p?Color.WHITE:TEXT);x.setBackground(bg(p?GREEN:Color.WHITE,22));x.setElevation(dp(5));if(cairo!=null)x.setTypeface(cairo,1);return x;}
    void show(){LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setGravity(Gravity.CENTER_HORIZONTAL);root.setPadding(dp(18),dp(16),dp(18),dp(30));root.setBackgroundColor(IVORY);root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);
        ImageView logo=new ImageView(this);logo.setImageResource(getResources().getIdentifier("aqim_logo","drawable",getPackageName()));logo.setScaleType(ImageView.ScaleType.CENTER_CROP);LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(dp(126),dp(126));lp.setMargins(0,dp(6),0,dp(10));root.addView(logo,lp);
        root.addView(t("أَقِم",36,GREEN,true));root.addView(t("صلاتك • ذكرك • قرآنك • يومك",15,MUTED,false));
        String[] n;try{n=MainActivity.nextPrayerInfo(this);}catch(Exception e){n=new String[]{"—","--:--","--:--","حدّد موقعك"};}
        LinearLayout card=new LinearLayout(this);card.setOrientation(LinearLayout.VERTICAL);card.setGravity(Gravity.CENTER);card.setPadding(dp(14),dp(14),dp(14),dp(14));card.setBackground(bg(Color.WHITE,26));card.setElevation(dp(5));card.addView(t("الصلاة القادمة: "+n[0],23,GREEN,true));card.addView(t(n[1]+"  •  باقي "+n[2],18,GOLD,true));card.addView(t(n[3],13,MUTED,false));LinearLayout.LayoutParams cp=new LinearLayout.LayoutParams(-1,-2);cp.setMargins(0,dp(14),0,dp(12));root.addView(card,cp);
        GridLayout grid=new GridLayout(this);grid.setColumnCount(getResources().getConfiguration().smallestScreenWidthDp>=600?3:2);String[] labels={"الصلاة والأذان","المصحف والروايات","عبادتي اليوم","الموقع العالمي","القبلة الحية","تذكير الذكر","المسبحة والفقاعة","الإعدادات"};Class<?>[] cls={MainActivity.class,QuranActivity.class,IbadatiActivity.class,WorldLocationActivity.class,LiveQiblaActivity.class,DhikrSettingsActivity.class,MainActivity.class,MainActivity.class};for(int i=0;i<labels.length;i++){Button x=b(labels[i],false);final int k=i;x.setOnClickListener(v->{Intent in=new Intent(this,cls[k]);startActivity(in);});GridLayout.LayoutParams gp=new GridLayout.LayoutParams();gp.width=0;gp.height=dp(84);gp.columnSpec=GridLayout.spec(GridLayout.UNDEFINED,1f);gp.setMargins(dp(6),dp(6),dp(6),dp(6));grid.addView(x,gp);}root.addView(grid,new LinearLayout.LayoutParams(-1,-2));
        root.addView(t("الإصدار 1.4.0 • تصميم وتطوير أحمد شهبون • 0921984045",12,MUTED,false),new LinearLayout.LayoutParams(-1,dp(54)));
        ScrollView sc=new ScrollView(this);sc.setFillViewport(true);sc.setBackgroundColor(IVORY);sc.addView(root,new ScrollView.LayoutParams(-1,-2));setContentView(sc);
    }
}
