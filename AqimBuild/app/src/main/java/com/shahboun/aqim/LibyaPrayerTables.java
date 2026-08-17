package com.shahboun.aqim;

import android.content.Context;
import android.util.Base64;
import java.io.*;
import java.util.*;
import java.util.zip.GZIPInputStream;

/** Offline Libya timetable dataset extracted from the verified reference APK supplied by the user. */
public final class LibyaPrayerTables {
    private LibyaPrayerTables(){}
    static final String[] NAMES={"الفجر","الشروق","الظهر","العصر","المغرب","العشاء"};
    static final ArrayList<City> CITIES=new ArrayList<>();
    static volatile boolean loaded=false;
    static class City{String key;double lat,lon;int[][] t;City(String k,double a,double o,int[][]x){key=k;lat=a;lon=o;t=x;}}

    public static boolean isLibya(double lat,double lon){return lat>=19.0&&lat<=34.5&&lon>=8.5&&lon<=25.5;}

    public static LinkedHashMap<String,Calendar> calculate(Context c,Calendar date,double lat,double lon,int[] offsets){
        if(!isLibya(lat,lon))return null;
        ensureLoaded(c); if(CITIES.isEmpty())return null;
        City city=nearest(lat,lon); if(city==null||city.t==null||city.t.length==0)return null;
        int idx=leapDayIndex(date); if(idx<0||idx>=city.t.length)return null;
        TimeZone tz=TimeZone.getTimeZone("Africa/Tripoli");
        LinkedHashMap<String,Calendar> out=new LinkedHashMap<>();
        for(int i=0;i<6;i++){
            int mins=city.t[idx][i]+manualOffset(offsets,i);
            Calendar x=Calendar.getInstance(tz); x.clear();
            x.set(date.get(Calendar.YEAR),date.get(Calendar.MONTH),date.get(Calendar.DAY_OF_MONTH),0,0,0);
            x.add(Calendar.MINUTE,mins); out.put(NAMES[i],x);
            if(i==4)out.put("الغروب",(Calendar)x.clone());
        }
        return out;
    }

    static int manualOffset(int[] o,int tableIndex){
        if(o==null)return 0;
        // Existing AQIM offset order follows fajr,sunrise,dhuhr,asr,maghrib,isha (+ optional sunset).
        return tableIndex<o.length?o[tableIndex]:0;
    }

    static int leapDayIndex(Calendar d){
        Calendar x=Calendar.getInstance(TimeZone.getTimeZone("Africa/Tripoli")); x.clear();
        x.set(2024,d.get(Calendar.MONTH),d.get(Calendar.DAY_OF_MONTH),12,0,0);
        return x.get(Calendar.DAY_OF_YEAR)-1;
    }

    static City nearest(double lat,double lon){City best=null;double bd=Double.MAX_VALUE;for(City x:CITIES){double d=haversine(lat,lon,x.lat,x.lon);if(d<bd){bd=d;best=x;}}return best;}
    static double haversine(double a,double o,double b,double p){double r=6371.0,da=Math.toRadians(b-a),dl=Math.toRadians(p-o);double q=Math.sin(da/2)*Math.sin(da/2)+Math.cos(Math.toRadians(a))*Math.cos(Math.toRadians(b))*Math.sin(dl/2)*Math.sin(dl/2);return 2*r*Math.asin(Math.sqrt(q));}

    static synchronized void ensureLoaded(Context c){if(loaded)return;loaded=true;try{
        StringBuilder s=new StringBuilder(45000);for(int i=0;i<4;i++){String f=String.format(Locale.US,"libya_times_%02d.b64",i);InputStream in=c.getAssets().open(f);byte[]buf=new byte[4096];int n;while((n=in.read(buf))>0)s.append(new String(buf,0,n,"US-ASCII"));in.close();}
        byte[] gz=Base64.decode(s.toString(),Base64.DEFAULT);DataInputStream in=new DataInputStream(new BufferedInputStream(new GZIPInputStream(new ByteArrayInputStream(gz))));
        byte[] magic=new byte[4];in.readFully(magic);if(!"LPD1".equals(new String(magic,"US-ASCII")))throw new IOException("bad Libya data");int count=in.readUnsignedShort();
        for(int ci=0;ci<count;ci++){int nl=in.readUnsignedByte();byte[]nb=new byte[nl];in.readFully(nb);String name=new String(nb,"UTF-8");double lat=in.readFloat(),lon=in.readFloat();int rows=in.readUnsignedShort();int[][] t=new int[rows][6];for(int j=0;j<6;j++)t[0][j]=in.readUnsignedShort();int nibCount=in.readInt();byte[]packed=new byte[(nibCount+1)/2];in.readFully(packed);int extraCount=in.readInt();byte[]extras=new byte[extraCount];in.readFully(extras);int ni=0,ei=0;for(int r=1;r<rows;r++){for(int j=0;j<6;j++){int by=packed[ni>>1]&255;int nib=((ni&1)==0)?(by>>>4):(by&15);ni++;int delta=nib<15?nib-7:extras[ei++];t[r][j]=t[r-1][j]+delta;}}CITIES.add(new City(name,lat,lon,t));}
        in.close();
    }catch(Exception e){CITIES.clear();}}
}
