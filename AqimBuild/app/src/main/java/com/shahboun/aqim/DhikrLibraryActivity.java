package com.shahboun.aqim;

import android.app.*;import android.graphics.*;import android.graphics.drawable.GradientDrawable;import android.os.*;import android.view.*;import android.widget.*;

public class DhikrLibraryActivity extends Activity{
 final int G=Color.rgb(15,76,58),I=Color.rgb(248,244,235),T=Color.rgb(35,48,43),M=Color.rgb(105,110,108);android.graphics.Typeface c;LinearLayout root;
 String[][] items={
 {"الصباح والمساء","أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.","صحيح مسلم"},
 {"بعد الصلاة","أستغفر الله، أستغفر الله، أستغفر الله. اللهم أنت السلام ومنك السلام تباركت يا ذا الجلال والإكرام.","صحيح مسلم"},
 {"النوم","باسمك اللهم أموت وأحيا.","صحيح البخاري"},
 {"الاستيقاظ","الحمد لله الذي أحيانا بعدما أماتنا وإليه النشور.","صحيح البخاري"},
 {"الخروج من المنزل","بسم الله، توكلت على الله، ولا حول ولا قوة إلا بالله.","سنن أبي داود والترمذي"},
 {"دخول المسجد","اللهم افتح لي أبواب رحمتك.","صحيح مسلم"},
 {"الخروج من المسجد","اللهم إني أسألك من فضلك.","صحيح مسلم"},
 {"الطعام","بسم الله.","سنن أبي داود والترمذي"},
 {"السفر","سبحان الذي سخر لنا هذا وما كنا له مقرنين وإنا إلى ربنا لمنقلبون.","الزخرف 13-14، وأصل دعاء السفر في صحيح مسلم"},
 {"الكرب","لا إله إلا الله العظيم الحليم، لا إله إلا الله رب العرش العظيم، لا إله إلا الله رب السماوات ورب الأرض ورب العرش الكريم.","صحيح البخاري وصحيح مسلم"},
 {"الاستغفار","أستغفر الله وأتوب إليه.","أصل الاستغفار والتوبة ثابت في السنة الصحيحة"},
 {"الصلاة على النبي ﷺ","اللهم صل على محمد وعلى آل محمد كما صليت على إبراهيم وعلى آل إبراهيم، إنك حميد مجيد.","صحيح البخاري وصحيح مسلم"}
 };
 @Override public void onCreate(Bundle b){super.onCreate(b);getWindow().setStatusBarColor(I);getWindow().setNavigationBarColor(I);try{if(Build.VERSION.SDK_INT>=26)c=getResources().getFont(getResources().getIdentifier("cairo","font",getPackageName()));}catch(Exception ignored){}show();}
 int dp(int v){return Math.round(v*getResources().getDisplayMetrics().density);}GradientDrawable bg(int color){GradientDrawable g=new GradientDrawable();g.setColor(color);g.setCornerRadius(dp(20));g.setStroke(dp(1),Color.rgb(232,221,194));return g;}TextView tx(String s,int z,int color,boolean bold){TextView t=new TextView(this);t.setText(s);t.setTextSize(z);t.setTextColor(color);t.setGravity(Gravity.CENTER);t.setPadding(dp(9),dp(8),dp(9),dp(8));if(c!=null)t.setTypeface(c,bold?1:0);return t;}
 void show(){root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setPadding(dp(16),dp(16),dp(16),dp(34));root.setBackgroundColor(I);root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);root.addView(tx("مكتبة الأذكار",28,G,true));root.addView(tx("أذكار مختارة من القرآن والسنة الصحيحة، مرتبة حسب المناسبة وتعمل دون إنترنت.",12,M,false));for(String[]x:items)item(x[0],x[1],x[2]);ScrollView s=new ScrollView(this);s.setFillViewport(true);s.addView(root);if(Build.VERSION.SDK_INT>=21)s.setOnApplyWindowInsetsListener((v,i)->{int top,bottom;if(Build.VERSION.SDK_INT>=30){android.graphics.Insets z=i.getInsets(WindowInsets.Type.systemBars());top=z.top;bottom=z.bottom;}else{top=i.getSystemWindowInsetTop();bottom=i.getSystemWindowInsetBottom();}v.setPadding(0,top,0,bottom);return i;});setContentView(s);}
 void item(String title,String body,String ref){LinearLayout b=new LinearLayout(this);b.setOrientation(LinearLayout.VERTICAL);b.setPadding(dp(12),dp(12),dp(12),dp(12));b.setBackground(bg(Color.WHITE));b.setElevation(dp(2));b.addView(tx(title,16,G,true));TextView d=tx(body,18,T,false);d.setLineSpacing(0,1.35f);b.addView(d);b.addView(tx("المصدر: "+ref,11,M,false));LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.setMargins(0,dp(8),0,0);root.addView(b,p);}
}
