# تعليمات البناء والنشر — منظومة شهبون للمبيعات

## استراتيجية الإصدار

### المشكلة السابقة
كان `versionCode` في `app.json` يُحدَّث يدويًا، مما يعرّض النشر للخطأ البشري.
Google Play يرفض أي بناء يحمل `versionCode` مكرر أو أقل من الإصدار المنشور.

### الحل المُعتمد: `appVersionSource: "remote"`

تم تفعيل `appVersionSource: "remote"` في `eas.json`.

**كيف يعمل:**
- عند تشغيل `eas build`، يتصل EAS بخوادم Expo ويقرأ آخر `versionCode` المستخدم.
- يرفع EAS الرقم تلقائيًا بمقدار 1 لكل بناء جديد دون أي تدخل يدوي.
- القيمة المحلية في `app.json` → `android.versionCode` **تُتجاهَل** في وضع `remote`.

---

## أوامر البناء

### APK تجريبي (للاختبار الداخلي)
```bash
cd artifacts/shahboun-sales
eas build --profile preview --platform android
```

### App Bundle إنتاجي (Google Play)
```bash
cd artifacts/shahboun-sales
eas build --profile production --platform android
```

### رفع مباشر إلى Google Play
```bash
cd artifacts/shahboun-sales
eas submit --profile production --platform android
```

---

## متطلبات أولية

1. **تسجيل الدخول إلى EAS:**
   ```bash
   eas login
   ```

2. **ملف مفتاح Google Play** (`google-play-service-account.json`):
   - يجب وضعه في `artifacts/shahboun-sales/` قبل `eas submit`.
   - لا يُرفع إلى Git (مضاف في `.gitignore`).

3. **أول بناء بعد تفعيل `remote`:**
   - EAS يبدأ العد من `versionCode` الحالي في Google Play Console أو من 1 إن لم يكن هناك بناء منشور من قبل.

---

## ملاحظات مهمة

| الأمر | وصف |
|-------|------|
| `version` في `app.json` | الإصدار الظاهر للمستخدم (مثل `1.1.0`) — يُحدَّث يدويًا حسب الحاجة |
| `android.versionCode` | الرقم الداخلي لـ Google Play — يُدار تلقائيًا عبر EAS |

- **لا تحتاج** إلى تعديل `versionCode` في `app.json` بعد الآن.
- إن أردت رفع `version` الظاهر للمستخدم (مثل `1.1.0` → `1.2.0`)، عدّل `version` في `app.json` يدويًا فقط.
