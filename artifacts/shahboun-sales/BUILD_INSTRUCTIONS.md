# بناء ونشر تطبيق منظومة شهبون للمبيعات

## المتطلبات الأساسية

1. **حساب Expo** — أنشئ حسابًا مجانيًا على [expo.dev](https://expo.dev)
2. **حساب Google Play Console** — رسوم التسجيل لمرة واحدة: 25 دولار على [play.google.com/console](https://play.google.com/console)
3. **EAS CLI** — أداة البناء والنشر السحابي من Expo

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

---

## الخطوة 6: ربط Google Play Console بـ EAS Submit

### 6أ — إنشاء Service Account في Google Cloud

1. افتح [Google Play Console](https://play.google.com/console) وادخل على حسابك
2. من القائمة الجانبية اختر **Setup → API access**
3. اضغط **Link to a Google Cloud Project** ثم اختر مشروعًا موجودًا أو أنشئ مشروعًا جديدًا
4. في صفحة Google Cloud Console التي ستُفتح، اذهب إلى **IAM & Admin → Service Accounts**
5. اضغط **+ Create Service Account** وأدخل اسمًا مثل `eas-submit`
6. بعد الإنشاء، افتح الـ Service Account واذهب إلى تبويب **Keys**
7. اضغط **Add Key → Create new key → JSON** — سيُحمَّل ملف JSON
8. احفظ هذا الملف بالاسم `google-play-service-account.json` داخل مجلد `artifacts/shahboun-sales/`

> 🔒 **مهم:** أضف هذا الملف إلى `.gitignore` فورًا — لا ترفعه أبدًا على GitHub أو أي مستودع عام.

```bash
echo "google-play-service-account.json" >> .gitignore
```

### 6ب — منح الصلاحيات للـ Service Account

1. ارجع إلى **Google Play Console → Setup → API access**
2. ستجد الـ Service Account الجديد في القائمة — اضغط **Grant access**
3. اختر صلاحية **Release manager** (أو Admin إن أردت صلاحيات كاملة)
4. اضغط **Invite user** ثم **Apply**

---

## الخطوة 7: النشر الأول على Google Play (يدويًا)

**النشر الأول يجب أن يتم يدويًا** من Google Play Console — هذا شرط من Google لا يمكن تجاوزه:

1. افتح [Google Play Console](https://play.google.com/console)
2. اضغط **Create app** وأدخل:
   - **App name:** منظومة شهبون للمبيعات
   - **Default language:** Arabic
   - **App or game:** App
   - **Free or paid:** Free
3. في قائمة **Grow → Store listing**، أضف:
   - **Short description (80 حرف):** نظام إدارة مبيعات وفواتير وصندوق للمحلات التجارية
   - **Full description (4000 حرف):** (انظر قسم "نص وصف التطبيق" أدناه)
   - **App icon:** ارفع `assets/images/shahboun-icon.png` (512×512 بكسل)
   - **Feature graphic:** صورة 1024×500 بكسل (يمكن تصميمها بـ Canva)
   - **Screenshots:** 2–8 لقطات شاشة من الجوال (ارفع من جهازك بعد تثبيت APK)
4. في قائمة **Release → Internal testing**:
   - اضغط **Create new release**
   - ارفع ملف `.aab` الذي بنيته في الخطوة 5
   - أضف **Release notes** مثل: `الإصدار الأول - 1.1.0`
   - اضغط **Save → Review release → Start rollout**
5. في قائمة **Policy → App content**، أكمل جميع الأقسام المطلوبة:
   - **Privacy policy:** أضف رابط سياسة الخصوصية (يمكن إنشاؤها مجانًا على [privacypolicygenerator.info](https://privacypolicygenerator.info))
   - **Ads:** No ads
   - **Content rating:** أكمل الاستبيان (التطبيق للأعمال، سيحصل على تصنيف PEGI 3 / Everyone)
   - **Target audience:** Over 18
6. في قائمة **Release → Production**، اضغط **Start rollout to Production** عندما تكون جاهزًا للنشر العام

---

## الخطوة 8: النشر التلقائي للتحديثات اللاحقة عبر EAS Submit

بعد إتمام النشر الأول يدويًا، يمكنك رفع التحديثات تلقائيًا:

```bash
# بناء إصدار جديد
eas build --platform android --profile production

# رفعه مباشرةً على Google Play (Internal Testing)
eas submit --platform android --profile production
```

أو دمج البناء والرفع في أمر واحد:

```bash
eas build --platform android --profile production --auto-submit
```

> `--auto-submit` يبدأ عملية الرفع تلقائيًا بمجرد انتهاء البناء.

---

## إعدادات التطبيق الحالية

| الحقل | القيمة |
|-------|--------|
| `package` | `com.shahboun.sales` |
| `version` | `1.1.0` |
| `versionCode` | `1` |
| `track` (submit) | `internal` |
| `releaseStatus` | `draft` |
| `buildType` (preview) | `apk` |
| `buildType` (production) | `app-bundle` |

---

## ترقية الإصدار لاحقًا

عند إصدار تحديث جديد، عدّل في `app.json`:

```json
"version": "1.2.0",
"android": {
  "versionCode": 2
}
```

> `versionCode` يجب أن يزيد بمقدار 1 مع كل رفع على Google Play ولا يمكن إعادة استخدام رقم مستخدم سابقًا.

---

## مسارات النشر في Google Play

| المسار | الاستخدام |
|--------|-----------|
| `internal` | اختبار داخلي (حتى 100 مختبر) — فوري |
| `alpha` | اختبار مغلق (قائمة محددة) |
| `beta` | اختبار مفتوح (أي مستخدم يختار الانضمام) |
| `production` | النشر العام الكامل |

لتغيير المسار، عدّل `track` في `eas.json` أو مرر الخيار مباشرةً:

```bash
eas submit --platform android --profile production -- --track production
```

---

## نص وصف التطبيق (للصق في Google Play)

```
منظومة شهبون للمبيعات هو نظام إدارة متكامل مصمم خصيصًا للمحلات التجارية الصغيرة والمتوسطة.

الميزات الرئيسية:
• إدارة الفواتير: إنشاء فواتير بيع احترافية بسرعة وسهولة
• صندوق النقدية: تتبع الإيرادات والمصروفات اليومية
• إدارة المنتجات: كتالوج المنتجات مع الأسعار والمخزون
• إدارة العملاء: قاعدة بيانات العملاء مع سجل المشتريات
• الحوالات البنكية: تتبع المدفوعات الإلكترونية بشكل منفصل
• التقارير: ملخص يومي وشهري للمبيعات والأرباح
• النسخ الاحتياطي: حفظ البيانات واستعادتها بسهولة
• يعمل بدون إنترنت: جميع البيانات محفوظة محلياً على الجهاز

مناسب لـ:
- محلات البقالة والسوبرماركت
- محلات الملابس والأزياء
- محلات الإلكترونيات
- المطاعم والكافيهات
- أي نشاط تجاري يحتاج لإدارة مبيعات بسيطة

التطبيق خفيف، سريع، وسهل الاستخدام — لا يحتاج تدريبًا مسبقًا.
```

---

## المشاكل الشائعة وحلولها

| المشكلة | الحل |
|---------|------|
| `Package name already exists` | اسم الحزمة `com.shahboun.sales` مستخدم — غيّر `package` في `app.json` |
| `Service account does not have permission` | تأكد من منح صلاحية Release Manager في Play Console |
| `Version code already used` | ارفع `versionCode` بمقدار 1 في `app.json` |
| `APK/AAB not signed` | شغّل `eas credentials` وتأكد من وجود keystore |
| `google-play-service-account.json not found` | تأكد من وضع الملف في نفس مجلد `eas.json` |

---

## روابط مفيدة

- [وثائق EAS Build](https://docs.expo.dev/build/introduction/)
- [وثائق EAS Submit](https://docs.expo.dev/submit/android/)
- [إدارة Keystore](https://docs.expo.dev/app-signing/managed-credentials/)
- [Google Play Console](https://play.google.com/console)
- [متطلبات النشر على Google Play](https://support.google.com/googleplay/android-developer/answer/9859152)
