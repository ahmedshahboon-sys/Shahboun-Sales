package com.shahboun.aqim;

import java.util.Calendar;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.TimeZone;

public final class PrayerTimes {
    private PrayerTimes() {}
    private static final int[] LIBYA_CAL = {7,-1,3,-1,3,3,4};

    public static LinkedHashMap<String, Calendar> calculate(Calendar date, double lat, double lon, int[] offsets) {
        TimeZone tz = date != null && date.getTimeZone() != null ? date.getTimeZone() : TimeZone.getDefault();
        Calendar day = (Calendar) date.clone(); day.setTimeZone(tz);
        int y = day.get(Calendar.YEAR), m = day.get(Calendar.MONTH) + 1, d = day.get(Calendar.DAY_OF_MONTH);
        double jd = julian(y, m, d) - lon / (15.0 * 24.0);
        double[] t = {5, 6, 12, 13, 18, 18, 18};
        for (int i = 0; i < 2; i++) {
            for (int j = 0; j < t.length; j++) t[j] /= 24.0;
            double fajr = sunAngleTime(jd, lat, 19.5, t[0], true);
            double sunrise = sunAngleTime(jd, lat, 0.833, t[1], true);
            double dhuhr = midDay(jd, t[2]);
            double asr = asrTime(jd, lat, 1, t[3]);
            double sunset = sunAngleTime(jd, lat, 0.833, t[4], false);
            double maghrib = sunset;
            double isha = sunAngleTime(jd, lat, 17.5, t[6], false);
            t = new double[]{fajr, sunrise, dhuhr, asr, sunset, maghrib, isha};
        }
        double zone = tz.getOffset(day.getTimeInMillis()) / 3600000.0;
        for (int i = 0; i < t.length; i++) t[i] = fixHour(t[i] + zone - lon / 15.0);
        String[] names = {"الفجر", "الشروق", "الظهر", "العصر", "الغروب", "المغرب", "العشاء"};
        LinkedHashMap<String, Calendar> out = new LinkedHashMap<>();
        boolean libya = "Africa/Tripoli".equals(tz.getID());
        for (int i = 0; i < names.length; i++) {
            Calendar c = Calendar.getInstance(tz, Locale.US); c.clear(); c.set(y, m - 1, d, 0, 0, 0);
            int hour = (int)Math.floor(t[i]); int min = (int)Math.round((t[i] - hour) * 60.0); if (min >= 60) { hour++; min -= 60; }
            c.set(Calendar.HOUR_OF_DAY, ((hour % 24) + 24) % 24); c.set(Calendar.MINUTE, min);
            if (libya) c.add(Calendar.MINUTE, LIBYA_CAL[i]);
            if (offsets != null && i < offsets.length) c.add(Calendar.MINUTE, offsets[i]);
            out.put(names[i], c);
        }
        return out;
    }

    public static String format(Calendar c) { return String.format(Locale.US, "%02d:%02d", c.get(Calendar.HOUR_OF_DAY), c.get(Calendar.MINUTE)); }
    private static double julian(int y, int m, int d) { if (m <= 2) { y -= 1; m += 12; } int a = y / 100; int b = 2 - a + a / 4; return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5; }
    private static double[] sunPosition(double jd) { double D = jd - 2451545.0; double g = fixAngle(357.529 + 0.98560028 * D); double q = fixAngle(280.459 + 0.98564736 * D); double L = fixAngle(q + 1.915 * sin(g) + 0.020 * sin(2 * g)); double e = 23.439 - 0.00000036 * D; double decl = arcsin(sin(e) * sin(L)); double ra = arctan2(cos(e) * sin(L), cos(L)) / 15.0; ra = fixHour(ra); return new double[]{decl, q / 15.0 - ra}; }
    private static double midDay(double jd, double time) { return fixHour(12 - sunPosition(jd + time)[1]); }
    private static double sunAngleTime(double jd, double lat, double angle, double time, boolean beforeNoon) { double decl = sunPosition(jd + time)[0]; double noon = midDay(jd, time); double x = (-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat)); x = Math.max(-1, Math.min(1, x)); double delta = arccos(x) / 15.0; return noon + (beforeNoon ? -delta : delta); }
    private static double asrTime(double jd, double lat, int factor, double time) { double decl = sunPosition(jd + time)[0]; double angle = -arccot(factor + tan(Math.abs(lat - decl))); return sunAngleTime(jd, lat, angle, time, false); }
    private static double sin(double d){ return Math.sin(Math.toRadians(d)); } private static double cos(double d){ return Math.cos(Math.toRadians(d)); } private static double tan(double d){ return Math.tan(Math.toRadians(d)); }
    private static double arcsin(double x){ return Math.toDegrees(Math.asin(x)); } private static double arccos(double x){ return Math.toDegrees(Math.acos(x)); } private static double arctan2(double y,double x){ return Math.toDegrees(Math.atan2(y,x)); } private static double arccot(double x){ return Math.toDegrees(Math.atan2(1.0,x)); }
    private static double fixAngle(double a){ a -= 360.0 * Math.floor(a / 360.0); return a < 0 ? a + 360 : a; } private static double fixHour(double a){ a -= 24.0 * Math.floor(a / 24.0); return a < 0 ? a + 24 : a; }
}
