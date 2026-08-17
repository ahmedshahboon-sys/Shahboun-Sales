package com.shahboun.aqim;

import java.util.Calendar;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.TimeZone;

public final class PrayerTimes {
    private PrayerTimes() {}

    public enum Method {
        LIBYA(19.5, 17.5),
        MWL(18.0, 17.0),
        EGYPT(19.5, 17.5),
        KARACHI(18.0, 18.0),
        UMM_AL_QURA(18.5, Double.NaN);

        final double fajrAngle;
        final double ishaAngle;
        Method(double fajrAngle, double ishaAngle) {
            this.fajrAngle = fajrAngle;
            this.ishaAngle = ishaAngle;
        }
    }

    // Small Libya reference calibration applied after the astronomical calculation.
    // Order: fajr, sunrise, dhuhr, asr, sunset, maghrib, isha.
    private static final int[] LIBYA_CAL = {1,-1,3,2,2,2,2};

    public static LinkedHashMap<String, Calendar> calculate(Calendar date,double lat,double lon,int[] offsets){
        Method method=isLibya(lat,lon)?Method.LIBYA:Method.MWL;
        return calculate(date,lat,lon,offsets,true,isLibya(lat,lon),method);
    }

    public static LinkedHashMap<String, Calendar> calculate(Calendar date,double lat,double lon,int[] offsets,boolean shafii,boolean libyaCalibration){
        Method method=isLibya(lat,lon)?Method.LIBYA:Method.MWL;
        return calculate(date,lat,lon,offsets,shafii,libyaCalibration,method);
    }

    public static LinkedHashMap<String, Calendar> calculate(Calendar date,double lat,double lon,int[] offsets,boolean shafii,boolean libyaCalibration,Method method){
        if(date==null) date=Calendar.getInstance();
        if(method==null) method=isLibya(lat,lon)?Method.LIBYA:Method.MWL;
        TimeZone tz=date.getTimeZone()!=null?date.getTimeZone():TimeZone.getDefault();
        Calendar day=(Calendar)date.clone();
        day.setTimeZone(tz);
        int y=day.get(Calendar.YEAR),m=day.get(Calendar.MONTH)+1,d=day.get(Calendar.DAY_OF_MONTH);
        double jd=julian(y,m,d)-lon/(15.0*24.0);
        double[] t={5,6,12,13,18,18,18};
        for(int pass=0;pass<2;pass++){
            double[] p=new double[t.length];
            for(int i=0;i<t.length;i++)p[i]=t[i]/24.0;
            double fajr=sunAngleTime(jd,lat,method.fajrAngle,p[0],true);
            double sunrise=sunAngleTime(jd,lat,0.833,p[1],true);
            double dhuhr=midDay(jd,p[2]);
            double asr=asrTime(jd,lat,shafii?1:2,p[3]);
            double sunset=sunAngleTime(jd,lat,0.833,p[4],false);
            double isha=Double.isNaN(method.ishaAngle)?sunset+1.5:sunAngleTime(jd,lat,method.ishaAngle,p[6],false);
            t=new double[]{fajr,sunrise,dhuhr,asr,sunset,sunset,isha};
        }
        double zone=tz.getOffset(day.getTimeInMillis())/3600000.0;
        for(int i=0;i<t.length;i++)t[i]=fixHour(t[i]+zone-lon/15.0);
        String[] names={"الفجر","الشروق","الظهر","العصر","الغروب","المغرب","العشاء"};
        LinkedHashMap<String,Calendar> out=new LinkedHashMap<>();
        boolean libya=libyaCalibration&&isLibya(lat,lon);
        for(int i=0;i<names.length;i++){
            Calendar c=Calendar.getInstance(tz,Locale.US);
            c.clear();
            c.set(y,m-1,d,0,0,0);
            int hour=(int)Math.floor(t[i]);
            int min=(int)Math.round((t[i]-hour)*60.0);
            if(min>=60){hour++;min-=60;}
            c.set(Calendar.HOUR_OF_DAY,((hour%24)+24)%24);
            c.set(Calendar.MINUTE,min);
            if(libya)c.add(Calendar.MINUTE,LIBYA_CAL[i]);
            if(offsets!=null&&i<offsets.length)c.add(Calendar.MINUTE,offsets[i]);
            out.put(names[i],c);
        }
        return out;
    }

    public static Method methodFromId(String id){
        if(id==null)return Method.LIBYA;
        try{return Method.valueOf(id.trim().toUpperCase(Locale.US));}catch(Exception ignored){return Method.LIBYA;}
    }

    public static String format(Calendar c){return String.format(Locale.US,"%02d:%02d",c.get(Calendar.HOUR_OF_DAY),c.get(Calendar.MINUTE));}
    public static String format(Calendar c,boolean h24){if(h24)return format(c);int h=c.get(Calendar.HOUR);if(h==0)h=12;return String.format(Locale.US,"%02d:%02d %s",h,c.get(Calendar.MINUTE),c.get(Calendar.AM_PM)==Calendar.AM?"ص":"م");}
    public static long secondsUntil(Calendar target,Calendar now){return Math.max(0,(target.getTimeInMillis()-now.getTimeInMillis())/1000L);}
    private static boolean isLibya(double lat,double lon){return lat>=19&&lat<=34&&lon>=9&&lon<=26;}
    private static double julian(int y,int m,int d){if(m<=2){y--;m+=12;}int a=y/100,b=2-a+a/4;return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+b-1524.5;}
    private static double[] sunPosition(double jd){double D=jd-2451545.0,g=fixAngle(357.529+0.98560028*D),q=fixAngle(280.459+0.98564736*D),L=fixAngle(q+1.915*sin(g)+0.020*sin(2*g)),e=23.439-0.00000036*D,decl=arcsin(sin(e)*sin(L)),ra=arctan2(cos(e)*sin(L),cos(L))/15.0;ra=fixHour(ra);return new double[]{decl,q/15.0-ra};}
    private static double midDay(double jd,double time){return fixHour(12-sunPosition(jd+time)[1]);}
    private static double sunAngleTime(double jd,double lat,double angle,double time,boolean before){double decl=sunPosition(jd+time)[0],noon=midDay(jd,time),x=(-sin(angle)-sin(decl)*sin(lat))/(cos(decl)*cos(lat));x=Math.max(-1,Math.min(1,x));double delta=arccos(x)/15.0;return noon+(before?-delta:delta);}
    private static double asrTime(double jd,double lat,int factor,double time){double decl=sunPosition(jd+time)[0],angle=-arccot(factor+tan(Math.abs(lat-decl)));return sunAngleTime(jd,lat,angle,time,false);}
    private static double sin(double d){return Math.sin(Math.toRadians(d));}
    private static double cos(double d){return Math.cos(Math.toRadians(d));}
    private static double tan(double d){return Math.tan(Math.toRadians(d));}
    private static double arcsin(double x){return Math.toDegrees(Math.asin(x));}
    private static double arccos(double x){return Math.toDegrees(Math.acos(x));}
    private static double arctan2(double y,double x){return Math.toDegrees(Math.atan2(y,x));}
    private static double arccot(double x){return Math.toDegrees(Math.atan2(1.0,x));}
    private static double fixAngle(double a){a-=360*Math.floor(a/360);return a<0?a+360:a;}
    private static double fixHour(double a){a-=24*Math.floor(a/24);return a<0?a+24:a;}
}
