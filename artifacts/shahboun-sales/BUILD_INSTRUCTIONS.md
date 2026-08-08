# بناء APK لتطبيق منظومة شهبون للمبيعات

## المتطلبات الأساسية

1. **حساب Expo** — أنشئ حسابًا مجانيًا على [expo.dev](https://expo.dev)
2. **EAS CLI** — أداة البناء السحابي من Expo

---

## الخطوة 1: تثبيت EAS CLI

```bash
npm install -g eas-cli
```

---

## الخطوة 2: تسجيل الدخول

```bash
eas login
```

أدخل بريدك الإلكتروني وكلمة المرور لحساب Expo.

---

## الخطوة 3: ربط المشروع بحسابك

من داخل مجلد التطبيق (`artifacts/shahboun-sales`):

```bash
eas project:init
```

سيُنشئ هذا الأمر `projectId` في ملف `app.json` تلقائيًا.

---

## الخطوة 4: بناء APK للاختبار (preview)

```bash
eas build --platform android --profile preview
```

- **النتيجة:** ملف `.apk` قابل للتثبيت مباشرةً على أي جهاز Android
- **المدة:** 10–20 دقيقة (البناء يتم على سيرفرات Expo)
- **الرابط:** ستحصل على رابط تحميل مباشر عند الانتهاء

> ⚠️ **ملاحظة التوقيع:** في أول مرة، سيسألك EAS إن كنت تريد إنشاء keystore تلقائيًا. اختر `Generate new keystore` — Expo سيحفظه بأمان في حسابك.

---

## الخطوة 5: بناء AAB للنشر على Google Play (production)

```bash
eas build --platform android --profile production
```

- **النتيجة:** ملف `.aab` (Android App Bundle) مطلوب لرفع التطبيق على Google Play
- **التوزيع:** ارفع الملف عبر [Google Play Console](https://play.google.com/console)

---

## إعدادات التطبيق الحالية

| الحقل | القيمة |
|-------|--------|
| `package` | `com.shahboun.sales` |
| `version` | `1.0.0` |
| `versionCode` | `1` |
| `buildType` (preview) | `apk` |
| `buildType` (production) | `app-bundle` |

---

## ترقية الإصدار لاحقًا

عند إصدار تحديث جديد، عدّل في `app.json`:

```json
"version": "1.1.0",
"android": {
  "versionCode": 2
}
```

> `versionCode` يجب أن يزيد بمقدار 1 مع كل رفع على Google Play.

---

## روابط مفيدة

- [وثائق EAS Build](https://docs.expo.dev/build/introduction/)
- [إدارة Keystore](https://docs.expo.dev/app-signing/managed-credentials/)
- [نشر على Google Play](https://docs.expo.dev/submit/android/)
