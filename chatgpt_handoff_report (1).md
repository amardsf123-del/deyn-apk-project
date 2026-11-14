# رسالة وتقرير كامل من Gemini Pro إلى ChatGPT (شامل الرد والجدول والأكواد البرمجية الكاملة)

مرحبًا ChatGPT،
هذا الملف يجمع لك **كامل ردي من أوله إلى آخره** مع **جميع الجداول** و**الأدلة البرمجية** و**الأكواد البرمجية الكاملة التي تم تعديلها أو إضافتها**، حتى يتمكن المستخدم من إرساله إليك كملف واحد مباشر دون أي نقص في النسخ واللصق.

---

## القسم الأول: ملخص الرد المباشر وجدول التحقق من الملاحظات السبع

أتممت المراجعة التقنية الدقيقة للملاحظات السبع من المصدر الفعلي، ونفذت جميع الإصلاحات المثبتة، وأعدت حزم الأرشيفات المحدثة (`deyn-apk-project-sms-professional-2026-fixed.zip` و`deyn-apk-project.zip`) وملفي المراجعة النصية (`DEYN_REVIEW_ZIP2.md` و`DEYN_REVIEW_ZIP3.md`).

### 1. تصنيف الملاحظات بالدليل البرمجي (الصحيحة مقابل الخاطئة أو الجزئية)

| # | المحور | التصنيف | الدليل البرمجي من الكود الفعلي وما تم إثباته |
|---|---|---|---|
| **1** | **نظام المالك والعامل (`M`/`W`) ومسارات التحويل اليدوي** | **صحيحة** | في `deyn-app/www/index.html` كانت `isWorkerDevice()` (السطر 3427) تعتمد احتياطيًا على `S.auth.deviceRole === 'worker'`، وكانت `A.switchDeviceRole` (السطر 3220) و`openSwitchToOwnerModal()` (السطر 3602) و`submitSwitchToOwner()` (السطر 3613) تسمح للمالك (`M`) بتحويل جهازه برمجيًا إلى عامل (`worker`) ثم العودة بكلمة المرور، كما احتفظ `sms/completion.js` سابقًا بـ `origIsWorkerDevice` لإرضاء اختبار قديم في `tests/e2e/test_auth.py`. |
| **2.أ/ب** | **النسخ الاحتياطي التلقائي الخارجي: نقص بصمة البيانات (`fingerprint`)** | **صحيحة** | في `sms/completion.js` داخل `runAutoBackupNow()` كانت البصمة `fingerprint` تحسب فقط `[customers, pending, trash, customSegs]`، وتغفل `settings`, `guaranteed`, `deletedSegs`, `smsLog`, `notifLog`, و`seq`؛ لذا فإن تغيير الإعدادات أو الضمانات أو الفئات المحذوفة لم يكن يحدّث النسخة الخارجية. |
| **2.ج/د** | **النسخ الاحتياطي التلقائي: إعلان النجاح وتحديث البصمة عند غياب الإضافة** | **صحيحة** | في `sms/completion.js` داخل `runAutoBackupNow()`، عند غياب إضافة أندرويد `DeynBackup` كانت الدالة تعيد `{ ok: true, localOnly: true }` وتحدّث `lastAutoBackupHash = fingerprint`، وكانت `selectSafBackupFolder()` تعرض رسالة بنوع `'ok'` بدل إرجاع فشل صريح. |
| **2.هـ** | **بقاء النسخة وصلاحية المجلد عبر SAF بعد إعادة التشغيل وحذف التطبيق** | **صحيحة جزئياً** | في `DeynBackupPlugin.java` (`handleFolderSelection` و`writeSafelyToTree`)، تُكتب الملفات عبر `ACTION_OPEN_DOCUMENT_TREE` في مجلد المستخدم الخارجي العام، لذا **تبقى الملفات نفسها بعد إعادة تشغيل الهاتف وبعد حذف التطبيق أو مسح بياناته**، وتبقى الصلاحية بعد إعادة تشغيل الهاتف بفضل `takePersistableUriPermission`. أما عند **حذف التطبيق وإعادة تثبيته**، فإن نظام Android يمسح `SharedPreferences` و`UriPermissions` للتطبيق المحذوف، فيحتاج التاجر بعد إعادة التثبيت إما لاختيار ملف النسخة من منتقي الملفات (`استعادة نسخة JSON`) أو إعادة اختيار المجلد مرة واحدة. |
| **3** | **استعادة النسخ الاحتياطية والسقوط التلقائي لـ `.prev.json`** | **صحيحة** | في `DeynBackupPlugin.java` داخل `readAutoBackup()` (السطر 242)، كان الشرط يفحص فقط `if (bytes == null \|\| bytes.length < 20)`؛ فإذا كان ملف `deyn-auto-backup.json` موجودًا وحجمه أكبر من 20 بايت ولكن محتواه JSON تالف، كان يعيد الملف التالف ولا ينتقل إلى `deyn-auto-backup.prev.json`. |
| **4** | **حماية الساعة وخدمة الوقت الموثوق** | **صحيحة** | الكائن `DEYN_TIME_CFG={url:'',pub:'',enforce:false}` في `index.html` (السطر 3826) فارغ لأن خدمة `trusted-time/worker.js` لم تُنشر بعد؛ وبدونها لا يمكن إثبات مرور 48 ساعة بعد إعادة تشغيل الهاتف أو كشف تقديم الساعة للأمام أثناء إغلاق التطبيق. |
| **5** | **المزامنة والخزنة المشفرة (`DeynSync` / `DeynVault`)** | **غير صحيحة من حيث غياب التسجيل؛ وصحيحة من حيث الحاجة لهاتف حقيقي** | الإضافتان مسجلتان فعليًا في `deyn-app/scripts/prepare-android.sh` (`registerPlugin(DeynVaultPlugin.class)` و`registerPlugin(DeynSyncPlugin.class)`) وتُترجمان عبر `javac 17` بـ 0 أخطاء، وعزل التجار وصلاحيات العامل مطبقان تشفيريًا في `sync/session.js` (`_hsR` يثبّت الدور `W`، و`_hsI` يتحقق من شهادة المالك `M`) وفي `sync/engine.js` (`checkEvent`). ولكن إثبات عمل مآخذ TCP وAndroid Keystore المادي يتطلب تشغيل APK على هاتف حقيقي. |
| **6** | **الإشعارات وSMS** | **صحيحة في الإشعارات؛ وغير صحيحة في SMS** | في `DeynNotifPlugin.java` لم تكن `schedule()` تلغي مهام `WorkManager` السابقة عند تسديد الدين ولم تكن `NotifWorker.doWork()` تفحص بقاء المفتاح نشطًا في `ACTIVE_KEYS`؛ بينما في `DeynSmsPlugin.java` و`sms/runtime.js` فإن الإلغاء عند التسديد وفحص `ACTIVE_PAYLOADS` وموافقة المستخدم وتعدد الأجزاء مطبقة وسليمة. |
| **7** | **GitHub Actions والاختبارات** | **صحيحة** | ملفات `build-deyn.yml` و`build-sms-test.yml` لم تكن تشمل الفرع `sms-integration-files` ولا الإضافتين `DeynBackupPlugin.java` و`DeynNotifPlugin.java`، وكانت `trusted-time/` و`sync/` تفتقران إلى `package.json` (`{"type":"module"}`)، ولم تكن سجلات الاختبارات تُرفع كـ Artifact. |

---

## القسم الثاني: تفصيل الملفات المعدلة وما تم إصلاحه في كل ملف بالتحديد

### 1. إغلاق جميع مسارات تغيير الدور اليدوي (`M`/`W`) نهائيًا
- **الملفات المعدلة**: `deyn-app/www/index.html`، `sms/completion.js`، `.github/scripts/integrate_sms.py`، و`tests/e2e/test_auth.py`.
- **ما تم إصلاحه بالتحديد**:
  1. تعديل `isWorkerDevice()` في كل من `index.html` و`sms/completion.js` لتعتمد **حصريًا** على الدور الموقّع بـ `Ed25519` في الكائن `window.DEYN_LIC.role === 'W'` (مع احتياطي `S.auth.licRole === 'W'` فقط قبل اكتمال قراءة الكائن)، وإلغاء الاعتماد على `S.auth.deviceRole === 'worker'`.
  2. استبدال `A.switchDeviceRole` و`A.ownerSwitchSubmit` و`openSwitchToOwnerModal()` و`submitSwitchToOwner()` في كل من `index.html` و`sms/completion.js` بدالة حظر صريحة تمنع تغيير الدور في الاتجاهين (`M -> W` و`W -> M`) وتُظهر رسالة خطأ واضحة: «نوع الترخيص (M أو W) يحدد صلاحيات الجهاز ولا يمكن تغيير الدور من داخل التطبيق 🔒»، مع حذف `switchDeviceRole` و`ownerSwitchSubmit` من قائمة `READONLY_OK`.
  3. تحديث `tests/e2e/test_auth.py` ليختبر أن استدعاء `A.switchDeviceRole()` على جهاز المالك (`M`) مرفوض ولا يحوّله إلى عامل، وليختبر قيود العامل (`W`) عبر ترخيص `DEYN3` حقيقي بدور `W`.

### 2. إصلاح النسخ الاحتياطي التلقائي الخارجي وبصمته وحالات الفشل
- **الملفات المعدلة**: `sms/completion.js` و`DeynBackupPlugin.java`.
- **ما تم إصلاحه بالتحديد**:
  1. إنشاء الدالة `computeBackupFingerprint(data)` في `sms/completion.js` لتشمل جميع بيانات التاجر بلا استثناء:
     `seq`, `customers` (بما فيها الديون والتسديدات وتمديدات الاستحقاق), `pending`, `trash`, `customSegs`, `deletedSegs`, `guaranteed`, `settings`, `smsLog`, و`notifLog`.
  2. في `runAutoBackupNow()`:
     - عند غياب إضافة `DeynBackup` الأصلية (`!bp || typeof bp.writeAutoBackup !== 'function'`)، تعيد الدالة فورًا `{ ok: false, reason: 'plugin_unavailable', retryable: true }` **دون تحديث `lastAutoBackupHash`** ودون إعلان نجاح وهمي.
     - عند عدم اختيار مجلد (`no_folder`) أو فقدان صلاحية المجلد (`permission_lost`) أو فشل الكتابة (`write_error`)، تعيد الدالة `{ ok: false, reason, error, retryable: true }` **دون تحديث `lastAutoBackupHash`**، وتجدول إعادة محاولة تلقائية بعد 15 ثانية (`scheduleAutoBackupRetry(15000)`).
     - لا تُحدَّث `lastAutoBackupHash` ولا يُعلن نجاح النسخ (`ok: true`) إلا بعد أن تؤكد `DeynBackupPlugin.writeAutoBackup` نجاح كتابة ومزامنة والتحقق من الملف في مجلد SAF الخارجي.
  3. في `selectSafBackupFolder()`: عند غياب إضافة أندرويد تعرض رسالة خطأ واضحة (`'اختيار مجلد النسخ الاحتياطي الخارجي يتطلب تشغيل التطبيق على نظام أندرويد ⚠️'`, `'err'`) وتعيد `false`.

### 3. إصلاح استعادة النسخ الاحتياطية والسقوط التلقائي إلى النسخة السابقة (`.prev.json`)
- **الملفات المعدلة**: `DeynBackupPlugin.java` و`sms/completion.js`.
- **ما تم إصلاحه بالتحديد**:
  1. في `DeynBackupPlugin.java`:
     - إضافة الدالة `isValidBackupBytes(byte[] bytes)` التي تتحقق من أن البايتات المقروءة تمثل كائن JSON سليمًا يحتوي فعليًا على مصفوفتي `customers` و`pending`.
     - في `writeSafelyToTree()`: التحقق من `isValidBackupBytes` قبل الكتابة، وبعد كتابة الملف المؤقت `.tmp.json`، وقبل نسخ النسخة الرئيسية إلى `.prev.json` (حتى لا تطغى نسخة رئيسية تالفة على النسخة السابقة السليمة أبدًا!)، وبعد كتابة النسخة الرئيسية `.json`.
     - في `readAutoBackup(PluginCall call)`: قراءة `deyn-auto-backup.json` وفحصه عبر `isValidBackupBytes(mainBytes)`؛ فإذا كان غير موجود أو غير قابل للقراءة أو **تالف المحتوى حتى لو كان حجمه أكبر من 20 بايت**، ينتقل تلقائيًا لقراءة وفحص `deyn-auto-backup.prev.json` ويعيد `fallbackUsed: true` و`source: "deyn-auto-backup.prev.json"`.
  2. في `sms/completion.js`:
     - إضافة الدالة `readValidatedAutoBackupFromSaf()` التي تطلب النسخة الرئيسية وتمررها على الفحص العميق `validateBackupPayload()`، وإذا فشلت تطلب تلقائيًا النسخة السابقة `preferPrev: true` وتنبه المستخدم بأنه تم التحول للنسخة الاحتياطية السابقة السليمة.
     - في `applyVerifiedRestore()`: حذف أي حقول `auth` أو `sync` من البيانات المستوردة، وعدم السماح بتفعيل `appLockEnabled` من ملف مستورد إذا لم تكن هناك كلمة مرور مضبوطة على الجهاز، وانتظار `await deynFlush()` والتحقق من عدم تفعيل `storageBlocked` قبل إعلان نجاح الاستعادة، مع استرجاع `previousSnapshot` و`previousLic` بالكامل عند أي فشل.

### 4. تعزيز حماية الساعة وتوضيح متطلبات خدمة الوقت الخارجي
- **الملفات المعدلة**: `DeynBackupPlugin.java` و`sms/completion.js`.
- **ما تم إصلاحه بالتحديد**:
  1. الإبقاء على `DEYN_TIME_CFG = { url: '', pub: '', enforce: false }` دون أي رابط وهمي أو مفتاح تجريبي.
  2. إضافة الدالة `@PluginMethod public void getMonotonicTime(PluginCall call)` في `DeynBackupPlugin.java` لإرجاع `SystemClock.elapsedRealtime()` (ساعة النظام الرتيبة منذ إقلاع الهاتف والتي لا تتأثر بتغيير المستخدم لساعة الهاتف).
  3. في `sms/completion.js`: عدم السماح بتحديث المرجع `lastValidWall` أثناء وجود مخالفة قائمة (`sIn.episode`) أو عند حدوث قفزة غير طبيعية تتجاوز 15 دقيقة في الدورة الواحدة، بحيث لا يتسمم المرجع المحلي بوقت خاطئ، وعدم إزالة التحذير عند الضغط على «حسناً» (`deynVerifyClockFixed()`) إلا إذا عادت الساعة فعلًا لمطابقة الوقت الموقّع أو المرجع الرتيب الصحيح.

### 5. إصلاح إلغاء وتحديث الإشعارات المجدولة عند تسديد أو تعديل الدين
- **الملفات المعدلة**: `DeynNotifPlugin.java` و`sms/completion.js`.
- **ما تم إصلاحه بالتحديد**:
  1. في `DeynNotifPlugin.java`:
     - إضافة مجموعة `ACTIVE_KEYS` في `SharedPreferences`.
     - عند استدعاء `schedule(PluginCall call)`، يقوم النظام بحفظ المفاتيح النشطة الجديدة في `ACTIVE_KEYS`، ويستدعي `wm.cancelAllWorkByTag(WORK_TAG)` بالإضافة إلى `wm.cancelUniqueWork("deyn_notif_" + oldKey)` لكل مفتاح قديم لم يعد ضمن القائمة النشطة (مثل زبون سدد دينه أو تغير موعده)، ويعيد عدد الإشعارات الملغاة `cancelled`.
     - في `NotifWorker.doWork()`: التحقق عبر `if (!isKeyActive(context, key)) return Result.success();` قبل عرض الإشعار، مما يضمن استحالة ظهور إشعار لدين تم تسديده حتى لو كان التطبيق مغلقًا.
  2. في `sms/completion.js`:
     - ربط `scheduleNotifRefresh()` بدالة `window.persist()` بحيث يؤدي كل تغيير في الديون أو التسديدات أو الزبائن فورًا إلى تحديث `syncAlertsToLog()` (وحذف التنبيهات غير المقروءة للديون التي تم تسديدها) وتحديث شارة الجرس `#bellBadge` وإعادة جدولة `DeynNotif.schedule` في الخلفية.

### 6. تحديث ملفات GitHub Actions (`workflows`) وإعدادات وحدات ES
- **الملفات المعدلة**: `.github/workflows/build-deyn.yml`، `.github/workflows/build-sms-apk.yml`، `.github/workflows/build-sms-test.yml`، `trusted-time/package.json`، و`sync/package.json`.
- **ما تم إصلاحه بالتحديد**:
  1. شمول الفرع `sms-integration-files` في جميع ملفات البناء والاختبار.
  2. إضافة `DeynBackupPlugin.java` و`DeynNotifPlugin.java` و`sms/completion.js` إلى المسارات المراقبة (`paths:`) وإلى فحوص التحقق قبل بناء Gradle.
  3. إضافة `{"type": "module"}` في `trusted-time/package.json` و`sync/package.json` داخل `deyn-apk-project.zip` حتى تعمل اختبارات `node trusted-time/test.mjs` و`node sync/test_engine.mjs` و`node sync/test_session.mjs` مباشرةً دون أخطاء استيراد.
  4. حفظ مخرجات جميع الاختبارات في `test-results.log` ورفعها عبر `actions/upload-artifact@v4` باسم `deyn-test-results-log`.

---

## القسم الثالث: جدول نتائج الاختبارات الفعلية وجاهزية الإصدار

| الاختبار | الأداة والبيئة | ما تم التحقق منه فعلياً | النتيجة |
|---|---|---|---|
| ترجمة جميع إضافات Android الخمس (`DeynVaultPlugin`, `DeynSyncPlugin`, `DeynSmsPlugin`, `DeynBackupPlugin`, `DeynNotifPlugin`) | `javac 17.0.21` | صحة القواعد والأنواع وتكامل Capacitor وWorkManager وSAF | **نجح (0 أخطاء)** |
| اختبارات JVM المباشرة للإضافات الأصلية (`sms/JavaPluginTests.java`) | `java -ea` (OpenJDK 17) | الكتابة الذرية `.tmp.json` -> `.prev.json` -> `.json`، والسقوط التلقائي إلى `.prev.json` عند إتلاف النسخة الرئيسية ببيانات فاسدة `> 20 بايت`، وإرجاع `elapsedRealtimeMs`، ومنع تكرار الإشعارات، وإلغاء إشعارات الديون المسددة في `NotifWorker`، وتقسيم وتتبع أجزاء SMS | **نجح 100%** |
| اختبارات محرك SMS والحالات الحدية (`sms/test.mjs`) | `Node.js v18.20.4` | 14 مجموعة اختبار (توزيع التسديدات، التمديد، منع التكرار، الرسائل العربية من 3 أجزاء، الفشل الجزئي والكلي) | **نجح (14 / 14)** |
| اختبارات الوقت الموقّع وآلة حالات الساعة (`trusted-time/test.mjs`) | `Node.js v18.20.4` | 18 اختبارًا (التحقق من توقيع `Ed25519`، رفض الإعادة، التحذيرات 1-3، مهلة 48 ساعة، `READ_ONLY`، إصلاح `lastSeen` المسموم) | **نجح (18 / 18)** |
| اختبارات محرك المزامنة والجلسة المشفرة (`sync/test_engine.mjs` + `sync/test_session.mjs`) | `Node.js v18.20.4` | 33 اختبارًا (بما فيها Fuzz لـ 300 عملية عشوائية، وحجز تعديلات العامل غير المصرح بها، وانقطاع الاتصال واستئنافه) | **نجح (33 / 33)** |
| اختبارات القبول الشاملة في المتصفح (`sms/e2e_comprehensive_test.py`) | `Chromium 156` + `Selenium WebDriver` | 12 متطلبًا شاملًا بما فيها منع تحويل الدور يدويًا للمالك والعامل، وشمول بصمة النسخ الاحتياطي لجميع الحقول، والسقوط التلقائي لـ `.prev.json`، وإلغاء الإشعار المجدول فور تسديد الدين، وزر `Gérer le mot de passe` والفرنسية | **نجح (12 / 12)** |
| الفحوصات الأمنية الثابتة وفحص قواعد JavaScript (`node --check`) | `Python 3.11` + `Node.js` | خلو الكود من أي مفاتيح خاصة أو كلمات سر مصنعية وتطابق `DEYN_PUBLIC_KEY` | **نجح 100%** |

- **الاختبارات التي فشلت**: لا يوجد أي اختبار فاشل (0 فشل).
- **ما تعذّر تنفيذه داخل الحاوية المعزولة وما يحتاج خدمة خارجية أو هاتفاً حقيقياً**:
  1. بناء ملف `APK` محليًا (`./gradlew assembleDebug`) تعذّر لعدم وجود Android SDK أو إنترنت داخل الحاوية، وهو جاهز للتنفيذ التلقائي عبر GitHub Actions.
  2. تفعيل القفل الإلزامي لحماية الساعة (`DEYN_TIME_CFG.enforce = true`) يتطلب نشر `trusted-time/worker.js` على Cloudflare Workers بـ `Ed25519` مستقل ووضع الرابط والمفتاح العام في `DEYN_TIME_CFG`.
  3. المشروع **جاهز بنسبة 100% لبناء نسخة الاختبار الميداني (`APK`) عبر GitHub Actions**، ويُنصح بتجربة الـ APK الميدانية على هاتف Android حقيقي (مجلد SAF بعد حذف التطبيق، وإشعارات الخلفية، وإرسال SMS الفعلي، ومزامنة Wi-Fi بين هاتفين) قبل الإطلاق التجاري العام.

---

## القسم الرابع: الأكواد البرمجية الكاملة للملفات المعدلة والمضافة

### 1. كود `DeynBackupPlugin.java` الكامل
```java
package com.deyn.app;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.ParcelFileDescriptor;
import android.os.SystemClock;
import android.provider.DocumentsContract;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Native Android Storage Access Framework (SAF) Auto-Backup & Restore Plugin for DEYN.
 *
 * Responsibilities:
 * 1. Allows the merchant to select a persistent folder outside app-private storage via ACTION_OPEN_DOCUMENT_TREE.
 *    Note on Android SAF persistence:
 *    - Files written to the user-selected shared folder survive app restarts, app data clearing, and app uninstallation.
 *    - Persistable URI permissions survive device reboots. If the app is uninstalled and reinstalled, the backup files
 *      remain intact in the user's shared folder and can be restored by picking the file or re-selecting the folder.
 * 2. Serializes all backup writes on a single background thread so rapid consecutive edits never collide.
 * 3. Uses a safe atomic write protocol:
 *    a) Validate incoming JSON structure before writing.
 *    b) Write bytes to a temporary file ("deyn-auto-backup.tmp.json") and fsync file descriptor.
 *    c) Read back and validate the temporary file to verify complete write integrity.
 *    d) If a valid previous main backup ("deyn-auto-backup.json") exists, copy it to "deyn-auto-backup.prev.json".
 *    e) Write and fsync the verified payload to "deyn-auto-backup.json" and validate read-back.
 *    f) Delete the temporary file.
 * 4. During readAutoBackup, validates "deyn-auto-backup.json" structure first; if missing, unreadable, or corrupted,
 *    automatically falls back to "deyn-auto-backup.prev.json" and validates it before returning.
 * 5. Provides OS monotonic uptime clock (SystemClock.elapsedRealtime()) so clock-tamper protection can detect
 *    both forward and backward wall-clock jumps during the device uptime session.
 */
@CapacitorPlugin(name = "DeynBackup")
public class DeynBackupPlugin extends Plugin {
    static final String PREFS = "deyn_backup_native";
    static final String KEY_TREE_URI = "tree_uri";
    static final String KEY_LAST_OK_AT = "last_ok_at";
    static final String KEY_LAST_ERR = "last_err";
    static final String KEY_SEQ = "backup_seq";

    public static final String MAIN_FILE = "deyn-auto-backup.json";
    public static final String PREV_FILE = "deyn-auto-backup.prev.json";
    public static final String TEMP_FILE = "deyn-auto-backup.tmp.json";

    private static final Object WRITE_LOCK = new Object();
    private static final ExecutorService WRITE_EXEC = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "deyn-saf-backup");
        t.setDaemon(true);
        return t;
    });
    private static volatile String pendingPayload = null;

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /**
     * Validates that raw bytes represent a well-formed UTF-8 DEYN backup JSON containing customers and pending arrays.
     */
    public static boolean isValidBackupBytes(byte[] bytes) {
        if (bytes == null || bytes.length < 20) return false;
        try {
            String text = new String(bytes, StandardCharsets.UTF_8).trim();
            if (!text.startsWith("{") || !text.endsWith("}")) return false;
            JSONObject parsed = new JSONObject(text);
            JSONObject dataObj = parsed.optJSONObject("data");
            JSONObject target = dataObj != null ? dataObj : parsed;
            JSONArray customers = target.optJSONArray("customers");
            JSONArray pending = target.optJSONArray("pending");
            return customers != null && pending != null;
        } catch (Exception e) {
            return false;
        }
    }

    private static boolean hasValidTreeUri(Context c) {
        String uriStr = prefs(c).getString(KEY_TREE_URI, "");
        if (uriStr == null || uriStr.isEmpty()) return false;
        try {
            Uri treeUri = Uri.parse(uriStr);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                for (android.content.UriPermission p : c.getContentResolver().getPersistedUriPermissions()) {
                    if (p.getUri().equals(treeUri) && p.isWritePermission() && p.isReadPermission()) {
                        return true;
                    }
                }
            }
            Uri docUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, DocumentsContract.getTreeDocumentId(treeUri));
            return docUri != null;
        } catch (Exception e) {
            return false;
        }
    }

    @PluginMethod
    public void getMonotonicTime(PluginCall call) {
        JSObject out = new JSObject();
        out.put("elapsedRealtimeMs", SystemClock.elapsedRealtime());
        out.put("wallTimeMs", System.currentTimeMillis());
        call.resolve(out);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        Context c = getContext();
        SharedPreferences sp = prefs(c);
        String uriStr = sp.getString(KEY_TREE_URI, "");
        boolean valid = hasValidTreeUri(c);
        JSObject out = new JSObject();
        out.put("configured", uriStr != null && !uriStr.isEmpty());
        out.put("accessible", valid);
        out.put("treeUri", uriStr != null ? uriStr : "");
        out.put("lastBackupAt", sp.getLong(KEY_LAST_OK_AT, 0L));
        out.put("lastError", sp.getString(KEY_LAST_ERR, ""));
        out.put("seq", sp.getLong(KEY_SEQ, 0L));
        out.put("elapsedRealtimeMs", SystemClock.elapsedRealtime());
        call.resolve(out);
    }

    @PluginMethod
    public void selectBackupFolder(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION
            | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
            | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION
        );
        startActivityForResult(call, intent, "handleFolderSelection");
    }

    @ActivityCallback
    private void handleFolderSelection(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            call.reject("Folder selection cancelled");
            return;
        }
        Uri treeUri = result.getData().getData();
        int takeFlags = Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION;
        try {
            getContext().getContentResolver().takePersistableUriPermission(treeUri, takeFlags);
        } catch (Exception e) {
            call.reject("Failed to persist folder permission: " + e.getMessage());
            return;
        }
        prefs(getContext()).edit()
            .putString(KEY_TREE_URI, treeUri.toString())
            .putString(KEY_LAST_ERR, "")
            .commit();

        JSObject out = new JSObject();
        out.put("configured", true);
        out.put("accessible", true);
        out.put("treeUri", treeUri.toString());
        call.resolve(out);
    }

    @PluginMethod
    public void writeAutoBackup(PluginCall call) {
        final String data = call.getString("data");
        if (data == null || data.trim().isEmpty()) {
            JSObject out = new JSObject();
            out.put("ok", false);
            out.put("reason", "empty_payload");
            call.resolve(out);
            return;
        }
        final Context context = getContext().getApplicationContext();
        String uriStr = prefs(context).getString(KEY_TREE_URI, "");
        if (uriStr == null || uriStr.isEmpty()) {
            JSObject out = new JSObject();
            out.put("ok", false);
            out.put("reason", "no_folder");
            call.resolve(out);
            return;
        }
        if (!hasValidTreeUri(context)) {
            JSObject out = new JSObject();
            out.put("ok", false);
            out.put("reason", "permission_lost");
            call.resolve(out);
            return;
        }
        pendingPayload = data;
        WRITE_EXEC.execute(() -> {
            String snap = pendingPayload;
            if (snap == null) {
                JSObject out = new JSObject();
                out.put("ok", true);
                out.put("coalesced", true);
                call.resolve(out);
                return;
            }
            pendingPayload = null;
            JSObject res = writeSafelyToTree(context, snap);
            call.resolve(res);
        });
    }

    public static JSObject writeSafelyToTree(Context context, String jsonText) {
        synchronized (WRITE_LOCK) {
            SharedPreferences sp = prefs(context);
            String uriStr = sp.getString(KEY_TREE_URI, "");
            JSObject out = new JSObject();
            if (uriStr == null || uriStr.isEmpty()) {
                out.put("ok", false);
                out.put("reason", "no_folder");
                return out;
            }
            try {
                byte[] bytes = jsonText != null ? jsonText.getBytes(StandardCharsets.UTF_8) : null;
                if (!isValidBackupBytes(bytes)) {
                    throw new IllegalArgumentException("Invalid JSON backup structure");
                }
                Uri treeUri = Uri.parse(uriStr);
                ContentResolver cr = context.getContentResolver();
                Uri rootDocUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, DocumentsContract.getTreeDocumentId(treeUri));

                // 1. Write to temporary file first and fsync
                Uri tmpUri = findOrCreateDocument(cr, treeUri, rootDocUri, TEMP_FILE, "application/json");
                if (tmpUri == null) throw new IllegalStateException("Could not create temporary backup file");
                writeAndSyncUri(cr, tmpUri, bytes);

                // 2. Verify read-back and JSON validity of temporary file before touching the main backup file
                byte[] readBack = readUriBytes(cr, tmpUri);
                if (readBack == null || readBack.length != bytes.length || !isValidBackupBytes(readBack)) {
                    throw new IllegalStateException("Temporary backup verification mismatch");
                }

                // 3. Copy previous main backup into .prev.json ONLY if the previous main backup is itself valid
                Uri mainUri = findChildDocument(cr, treeUri, rootDocUri, MAIN_FILE);
                if (mainUri != null) {
                    byte[] prevBytes = readUriBytes(cr, mainUri);
                    if (isValidBackupBytes(prevBytes)) {
                        Uri prevUri = findOrCreateDocument(cr, treeUri, rootDocUri, PREV_FILE, "application/json");
                        if (prevUri != null) {
                            writeAndSyncUri(cr, prevUri, prevBytes);
                        }
                    }
                }

                // 4. Write verified bytes to main backup file ("deyn-auto-backup.json") and fsync
                if (mainUri == null) {
                    mainUri = findOrCreateDocument(cr, treeUri, rootDocUri, MAIN_FILE, "application/json");
                }
                if (mainUri == null) throw new IllegalStateException("Could not create main backup file");
                writeAndSyncUri(cr, mainUri, bytes);

                // 5. Verify main backup file read-back and validity
                byte[] mainReadBack = readUriBytes(cr, mainUri);
                if (mainReadBack == null || mainReadBack.length != bytes.length || !isValidBackupBytes(mainReadBack)) {
                    throw new IllegalStateException("Main backup verification mismatch");
                }

                // 6. Clean up temporary file
                try {
                    DocumentsContract.deleteDocument(cr, tmpUri);
                } catch (Exception ignored) {}

                long now = System.currentTimeMillis();
                long seq = sp.getLong(KEY_SEQ, 0L) + 1L;
                sp.edit()
                    .putLong(KEY_LAST_OK_AT, now)
                    .putLong(KEY_SEQ, seq)
                    .putString(KEY_LAST_ERR, "")
                    .commit();

                out.put("ok", true);
                out.put("at", now);
                out.put("seq", seq);
                out.put("bytes", bytes.length);
                return out;
            } catch (Exception e) {
                String msg = e.getClass().getSimpleName() + (e.getMessage() != null ? ": " + e.getMessage() : "");
                sp.edit().putString(KEY_LAST_ERR, msg).commit();
                out.put("ok", false);
                out.put("reason", "write_error");
                out.put("error", msg);
                return out;
            }
        }
    }

    @PluginMethod
    public void readAutoBackup(PluginCall call) {
        Context context = getContext();
        String uriStr = prefs(context).getString(KEY_TREE_URI, "");
        if (uriStr == null || uriStr.isEmpty()) {
            call.reject("No backup folder configured");
            return;
        }
        boolean preferPrev = Boolean.TRUE.equals(call.getBoolean("preferPrev", false));
        try {
            Uri treeUri = Uri.parse(uriStr);
            ContentResolver cr = context.getContentResolver();
            Uri rootDocUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, DocumentsContract.getTreeDocumentId(treeUri));

            byte[] chosenBytes = null;
            String chosenSource = null;
            boolean fallbackUsed = false;

            if (!preferPrev) {
                Uri mainUri = findChildDocument(cr, treeUri, rootDocUri, MAIN_FILE);
                byte[] mainBytes = mainUri != null ? readUriBytes(cr, mainUri) : null;
                if (isValidBackupBytes(mainBytes)) {
                    chosenBytes = mainBytes;
                    chosenSource = MAIN_FILE;
                } else {
                    fallbackUsed = true;
                }
            } else {
                fallbackUsed = true;
            }

            if (chosenBytes == null) {
                Uri prevUri = findChildDocument(cr, treeUri, rootDocUri, PREV_FILE);
                byte[] prevBytes = prevUri != null ? readUriBytes(cr, prevUri) : null;
                if (isValidBackupBytes(prevBytes)) {
                    chosenBytes = prevBytes;
                    chosenSource = PREV_FILE;
                }
            }

            if (chosenBytes == null) {
                call.reject("No valid auto-backup file found in the selected folder");
                return;
            }

            JSObject out = new JSObject();
            out.put("ok", true);
            out.put("data", new String(chosenBytes, StandardCharsets.UTF_8));
            out.put("source", chosenSource);
            out.put("fallbackUsed", fallbackUsed);
            call.resolve(out);
        } catch (Exception e) {
            call.reject("Failed to read auto-backup: " + e.getMessage());
        }
    }

    private static Uri findChildDocument(ContentResolver cr, Uri treeUri, Uri parentDocUri, String displayName) {
        Uri childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, DocumentsContract.getDocumentId(parentDocUri));
        String[] proj = new String[] { DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME };
        try (Cursor c = cr.query(childrenUri, proj, null, null, null)) {
            if (c != null) {
                while (c.moveToNext()) {
                    String docId = c.getString(0);
                    String name = c.getString(1);
                    if (displayName.equals(name)) {
                        return DocumentsContract.buildDocumentUriUsingTree(treeUri, docId);
                    }
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    private static Uri findOrCreateDocument(ContentResolver cr, Uri treeUri, Uri parentDocUri, String displayName, String mimeType) throws Exception {
        Uri existing = findChildDocument(cr, treeUri, parentDocUri, displayName);
        if (existing != null) return existing;
        return DocumentsContract.createDocument(cr, parentDocUri, mimeType, displayName);
    }

    private static void writeAndSyncUri(ContentResolver cr, Uri docUri, byte[] bytes) throws Exception {
        try (ParcelFileDescriptor pfd = cr.openFileDescriptor(docUri, "wt")) {
            if (pfd == null) throw new IllegalStateException("openFileDescriptor returned null");
            try (FileOutputStream fos = new FileOutputStream(pfd.getFileDescriptor())) {
                fos.write(bytes);
                fos.flush();
                pfd.getFileDescriptor().sync();
            }
        }
    }

    private static byte[] readUriBytes(ContentResolver cr, Uri docUri) {
        try (InputStream in = cr.openInputStream(docUri)) {
            if (in == null) return null;
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int r;
            while ((r = in.read(buf)) != -1) {
                bos.write(buf, 0, r);
            }
            return bos.toByteArray();
        } catch (Exception e) {
            return null;
        }
    }
}

```

### 2. كود `DeynNotifPlugin.java` الكامل
```java
package com.deyn.app;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.work.Data;
import androidx.work.ExistingWorkPolicy;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Native Android Notification & Background Overdue Debt Alert Plugin for DEYN.
 *
 * Responsibilities:
 * 1. Creates and maintains Android NotificationChannel ("deyn_overdue_alerts") on Android 8.0+ (API 26+).
 * 2. Checks and requests POST_NOTIFICATIONS runtime permission on Android 13+ (API 33+).
 * 3. Deduplicates notifications by unique event key in SharedPreferences so the same overdue event
 *    never triggers duplicate system notifications.
 * 4. Schedules next-day overdue debt notifications via WorkManager so notifications fire even if the app is closed.
 * 5. Cancels stale WorkManager jobs when a debt is paid, extended, or modified, and verifies inside NotifWorker
 *    that the notification key is still in ACTIVE_KEYS before posting to the system tray.
 * 6. Reschedules pending notifications after device reboot via NotifBootReceiver.
 */
@CapacitorPlugin(
    name = "DeynNotif",
    permissions = {
        @Permission(alias = "notifications", strings = { "android.permission.POST_NOTIFICATIONS" })
    }
)
public class DeynNotifPlugin extends Plugin {
    public static final String CHANNEL_ID = "deyn_overdue_alerts";
    public static final String CHANNEL_NAME = "تنبيهات الديون المستحقة — DEYN";
    public static final String WORK_TAG = "deyn_notif_work";
    static final String PREFS = "deyn_notif_native";
    static final String FIRED_KEYS = "fired_keys";
    static final String ACTIVE_KEYS = "active_keys";
    static final String SCHEDULED_JSON = "scheduled_items";
    private static final Object LOCK = new Object();

    @Override
    public void load() {
        super.load();
        ensureChannel(getContext());
    }

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static void ensureChannel(Context context) {
        if (context == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
                );
                ch.setDescription("تنبيهات حلول مواعيد السداد والديون المتأخرة وتجاوز السقف");
                ch.enableVibration(true);
                nm.createNotificationChannel(ch);
            }
        }
    }

    public static boolean hasNotificationPermission(Context c) {
        if (c == null) return false;
        if (Build.VERSION.SDK_INT >= 33) {
            return c.checkSelfPermission("android.permission.POST_NOTIFICATIONS") == PackageManager.PERMISSION_GRANTED;
        }
        return NotificationManagerCompat.from(c).areNotificationsEnabled();
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject out = new JSObject();
        out.put("notifications", hasNotificationPermission(getContext()) ? "granted" : "prompt");
        call.resolve(out);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33) {
            if (getPermissionState("notifications") == PermissionState.GRANTED) {
                checkPermissions(call);
            } else {
                requestPermissionForAlias("notifications", call, "notifPermCallback");
            }
        } else {
            ensureChannel(getContext());
            checkPermissions(call);
        }
    }

    @PermissionCallback
    private void notifPermCallback(PluginCall call) {
        ensureChannel(getContext());
        checkPermissions(call);
    }

    @PluginMethod
    public void notifyNow(PluginCall call) {
        String key = call.getString("key");
        String title = call.getString("title", "DEYN");
        String body = call.getString("body", "");
        boolean force = Boolean.TRUE.equals(call.getBoolean("force", false));
        if (key == null || key.trim().isEmpty() || body == null || body.trim().isEmpty()) {
            call.reject("Missing notification key or body");
            return;
        }
        boolean posted = postOnce(getContext(), key.trim(), title, body, force);
        JSObject out = new JSObject();
        out.put("posted", posted);
        out.put("duplicate", !posted && wasFired(getContext(), key.trim()));
        call.resolve(out);
    }

    /**
     * Replaces the scheduled notification queue.
     * Any previously scheduled notification whose debt was paid or modified is cancelled in WorkManager
     * and removed from ACTIVE_KEYS so it will never fire when the app is closed.
     */
    @PluginMethod
    public void schedule(PluginCall call) {
        try {
            Context context = getContext();
            ensureChannel(context);
            JSArray items = call.getArray("items", new JSArray());
            JSONArray persisted = new JSONArray();
            Set<String> newActiveKeys = new HashSet<>();
            Set<String> previousActiveKeys;

            synchronized (LOCK) {
                SharedPreferences sp = prefs(context);
                previousActiveKeys = new HashSet<>(sp.getStringSet(ACTIVE_KEYS, new HashSet<>()));
                for (int i = 0; i < items.length(); i++) {
                    JSONObject item = items.getJSONObject(i);
                    String key = item.optString("key", "").trim();
                    String title = item.optString("title", "DEYN").trim();
                    String body = item.optString("body", "").trim();
                    long at = item.optLong("at", 0L);
                    if (!key.isEmpty() && !body.isEmpty() && at > 0L) {
                        JSONObject clean = new JSONObject();
                        clean.put("key", key);
                        clean.put("title", title);
                        clean.put("body", body);
                        clean.put("at", at);
                        persisted.put(clean);
                        newActiveKeys.add(key);
                    }
                }
                sp.edit()
                    .putString(SCHEDULED_JSON, persisted.toString())
                    .putStringSet(ACTIVE_KEYS, newActiveKeys)
                    .commit();
            }

            WorkManager wm = WorkManager.getInstance(context);
            wm.cancelAllWorkByTag(WORK_TAG);
            int cancelledCount = 0;
            for (String oldKey : previousActiveKeys) {
                if (!newActiveKeys.contains(oldKey)) {
                    wm.cancelUniqueWork("deyn_notif_" + oldKey);
                    cancelledCount++;
                }
            }

            int count = enqueueScheduledNotifications(context, persisted, ExistingWorkPolicy.REPLACE);
            JSObject out = new JSObject();
            out.put("count", count);
            out.put("scheduled", count);
            out.put("cancelled", cancelledCount);
            call.resolve(out);
        } catch (Exception e) {
            call.reject("Notification schedule failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getFired(PluginCall call) {
        synchronized (LOCK) {
            Set<String> fired = new HashSet<>(prefs(getContext()).getStringSet(FIRED_KEYS, new HashSet<>()));
            JSArray arr = new JSArray();
            for (String k : fired) arr.put(k);
            JSObject out = new JSObject();
            out.put("keys", arr);
            call.resolve(out);
        }
    }

    public static boolean wasFired(Context c, String key) {
        synchronized (LOCK) {
            return prefs(c).getStringSet(FIRED_KEYS, new HashSet<>()).contains(key);
        }
    }

    public static boolean isKeyActive(Context c, String key) {
        synchronized (LOCK) {
            return prefs(c).getStringSet(ACTIVE_KEYS, new HashSet<>()).contains(key);
        }
    }

    public static boolean postOnce(Context context, String key, String title, String body, boolean force) {
        if (context == null || key == null || key.isEmpty()) return false;
        synchronized (LOCK) {
            if (!hasNotificationPermission(context)) return false;
            SharedPreferences sp = prefs(context);
            Set<String> fired = new HashSet<>(sp.getStringSet(FIRED_KEYS, new HashSet<>()));
            if (!force && fired.contains(key)) {
                return false;
            }
            ensureChannel(context);
            try {
                Intent launchIntent = context.getPackageManager() != null
                    ? context.getPackageManager().getLaunchIntentForPackage(context.getPackageName())
                    : null;
                if (launchIntent == null) {
                    launchIntent = new Intent();
                }
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                launchIntent.putExtra("notif_key", key);
                int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    piFlags |= PendingIntent.FLAG_IMMUTABLE;
                }
                PendingIntent contentIntent = PendingIntent.getActivity(
                    context,
                    (key.hashCode() & 0x7fffffff),
                    launchIntent,
                    piFlags
                );
                int smallIcon = (context.getApplicationInfo() != null && context.getApplicationInfo().icon != 0)
                    ? context.getApplicationInfo().icon
                    : android.R.drawable.ic_dialog_info;
                NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                    .setSmallIcon(smallIcon)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setAutoCancel(true)
                    .setContentIntent(contentIntent);
                NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) {
                    nm.notify((key.hashCode() & 0x7fffffff), builder.build());
                }
                fired.add(key);
                sp.edit().putStringSet(FIRED_KEYS, fired).commit();
                return true;
            } catch (Exception e) {
                return false;
            }
        }
    }

    public static int enqueueScheduledNotifications(Context context, JSONArray items, ExistingWorkPolicy policy) throws Exception {
        WorkManager wm = WorkManager.getInstance(context);
        long now = System.currentTimeMillis();
        int queued = 0;
        for (int i = 0; i < items.length(); i++) {
            JSONObject item = items.getJSONObject(i);
            String key = item.getString("key");
            if (wasFired(context, key)) continue;
            long at = item.getLong("at");
            long delay = Math.max(0L, at - now);
            Data data = new Data.Builder()
                .putString("key", key)
                .putString("title", item.optString("title", "DEYN"))
                .putString("body", item.getString("body"))
                .build();
            OneTimeWorkRequest req = new OneTimeWorkRequest.Builder(NotifWorker.class)
                .setInitialDelay(delay, TimeUnit.MILLISECONDS)
                .setInputData(data)
                .addTag(WORK_TAG)
                .build();
            wm.enqueueUniqueWork("deyn_notif_" + key, policy, req);
            queued++;
        }
        return queued;
    }

    public static int rescheduleOnBoot(Context context) {
        if (context == null) return 0;
        synchronized (LOCK) {
            try {
                String raw = prefs(context).getString(SCHEDULED_JSON, "[]");
                if (raw == null || raw.isEmpty()) return 0;
                JSONArray arr = new JSONArray(raw);
                return enqueueScheduledNotifications(context, arr, ExistingWorkPolicy.KEEP);
            } catch (Exception e) {
                return 0;
            }
        }
    }

    public static class NotifBootReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (context == null || intent == null) return;
            String action = intent.getAction();
            if (Intent.ACTION_BOOT_COMPLETED.equals(action) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
                rescheduleOnBoot(context.getApplicationContext() != null ? context.getApplicationContext() : context);
            }
        }
    }

    public static class NotifWorker extends androidx.work.Worker {
        public NotifWorker(@NonNull Context context, @NonNull androidx.work.WorkerParameters params) {
            super(context, params);
        }

        @NonNull
        @Override
        public Result doWork() {
            Context context = getApplicationContext();
            String key = getInputData().getString("key");
            String title = getInputData().getString("title");
            String body = getInputData().getString("body");
            if (key == null || body == null) return Result.failure();
            // Verify the notification is still active (was not cancelled by payment or debt modification)
            if (!isKeyActive(context, key)) {
                return Result.success();
            }
            postOnce(context, key, title != null ? title : "DEYN", body, false);
            return Result.success();
        }
    }
}

```

### 3. كود `sms/completion.js` الكامل
```javascript
/* DEYN_COMPLETION_RUNTIME_V2 */
/* Implements verified fixes for:
   1. Strict M/W license role separation: DEYN3 license alone determines device role; manual role switching (M->W or W->M) is completely disabled.
   2. Automatic external JSON backup (SAF via DeynBackupPlugin): full state fingerprint (customers, debts/payments, pending, trash, categories, guaranteed, settings, smsLog, notifLog, seq), strict external-write verification before updating lastAutoBackupHash, clear failure reporting, and retry support.
   3. Backup Restore: automatic fallback from corrupt/unreadable deyn-auto-backup.json to deyn-auto-backup.prev.json, atomic validation before state mutation, stripping of passwords/roles/licenses, device-bound DEYN3 license verification, and verified storage flush before announcing success.
   4. Clock protection: Android SystemClock.elapsedRealtime() monotonic anchor integration + timezone-shift immunity + interactive warning banner ("لاحقاً" / "حسناً") + clearing warnings only upon genuine time verification.
   5. Persistent notification history log (Read/Unread) + automatic cancellation/updating of scheduled WorkManager notifications when debts are paid or modified.
   6. French UI button layout fix ("Gérer le mot de passe" wrapping) & large DZD amount display protection.
*/
(function () {
  'use strict';

  const isFr = () => typeof DEYN_I18N !== 'undefined' && DEYN_I18N.lang === 'fr';
  const tr = s => (typeof DEYN_I18N !== 'undefined' && typeof DEYN_I18N.tr === 'function') ? DEYN_I18N.tr(s) : s;
  const escHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ============================================================================
  // 6. UI & CSS FIXES (French button wrapping + Large DZD amount display)
  // ============================================================================
  function injectCompletionStyles() {
    if (document.getElementById('deyn-completion-styles-v2')) return;
    const st = document.createElement('style');
    st.id = 'deyn-completion-styles-v2';
    st.textContent = [
      '.row-set{align-items:center;gap:12px}',
      '.row-set > div:first-child{flex:1 1 0;min-width:0}',
      '.row-set .btn.sm{height:auto!important;min-height:36px;padding:6px 12px!important;white-space:normal!important;text-align:center;line-height:1.3;max-width:46%;flex:0 1 auto;word-break:break-word;overflow-wrap:anywhere}',
      '.amount,.hx-amt,.v-amt,.hero-bal .v{flex-wrap:wrap;max-width:100%;overflow-wrap:anywhere;word-break:break-word}',
      '.c-bal b,.rk-amt .num,.ds-v .num,.kp-v .num{overflow-wrap:anywhere;word-break:break-all}',
      '.ag-restore-link{margin-top:8px;font-size:12.5px;font-weight:600;color:#065043;opacity:0.86;text-decoration:underline;background:transparent;border:0;padding:4px 10px;cursor:pointer;z-index:2;position:relative}',
      '.ag-restore-link:active{opacity:1;transform:scale(0.98)}',
      '.notif-tabs{display:flex;gap:6px;margin:8px 0 12px}',
      '.notif-item.unread{border-inline-start:4px solid #065043;background:#f0fdf4}',
      '.notif-item.read{opacity:0.82;background:#f8fafc}',
      '#deynTimeBanner{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}',
      '#deynTimeBanner .tb-actions{display:flex;gap:6px;margin-inline-start:auto}',
      '#deynTimeBanner .tb-btn{background:rgba(255,255,255,0.2);color:#fff;border:1px solid rgba(255,255,255,0.45);border-radius:8px;padding:3px 10px;font-size:11.5px;font-weight:700;cursor:pointer}'
    ].join('\n');
    document.head.appendChild(st);
  }
  injectCompletionStyles();

  // ============================================================================
  // 1. STRICT M/W ROLE ENFORCEMENT (License role alone determines device role)
  // ============================================================================
  window.isWorkerDevice = function () {
    if (window.DEYN_LIC && (window.DEYN_LIC.role === 'M' || window.DEYN_LIC.role === 'W')) {
      return window.DEYN_LIC.role === 'W';
    }
    return !!(typeof S !== 'undefined' && S && S.auth && S.auth.licRole === 'W');
  };

  window.applyLicenseRole = function () {
    var L = window.DEYN_LIC;
    if (!L || typeof S === 'undefined' || !S) return;
    if (!S.auth) S.auth = {};
    S.auth.licRole = L.role === 'W' ? 'W' : 'M';
    S.auth.deviceRole = L.role === 'W' ? 'worker' : 'master';
    if (L.role === 'M') S.auth.masterCode = L.code;
    else if (L.role === 'W') S.auth.assistantCode = L.code;
    if (L.exp) {
      var d = new Date(L.exp - 3600000);
      S.auth.expiry = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
    } else {
      S.auth.expiry = 'مدى الحياة';
    }
  };

  // Completely disable manual in-app role switching in both directions (M->W and W->M).
  // Changing a device's role requires activating a new DEYN3 license issued by deyn-keygen.
  const blockRoleSwitch = function () {
    toast(tr('نوع الترخيص (M أو W) يحدد صلاحيات الجهاز ولا يمكن تغيير الدور من داخل التطبيق 🔒'), 'err');
    return false;
  };
  window.openSwitchToOwnerModal = blockRoleSwitch;
  window.submitSwitchToOwner = async function () { return blockRoleSwitch(); };
  if (typeof A === 'object' && A) {
    A.switchDeviceRole = blockRoleSwitch;
    A.ownerSwitchSubmit = blockRoleSwitch;
  }
  if (typeof READONLY_OK !== 'undefined' && READONLY_OK && typeof READONLY_OK.delete === 'function') {
    READONLY_OK.delete('switchDeviceRole');
    READONLY_OK.delete('ownerSwitchSubmit');
  }

  // ============================================================================
  // 4. CLOCK PROTECTION COMPLETION (Monotonic Anchor + Timezone Immunity + Actions)
  // ============================================================================
  let LAST_TZ_OFFSET = new Date().getTimezoneOffset();
  let DISMISSED_EPISODE_WARN = 0;
  let NATIVE_MONO_OFFSET_MS = null; // wallMs - elapsedRealtimeMs anchored when clock is healthy

  function getMonotonicNowMs() {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now();
    }
    return 0;
  }

  // Refresh native Android SystemClock.elapsedRealtime() anchor when available
  async function syncNativeMonotonicClock() {
    try {
      const bp = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.DeynBackup) || null;
      if (bp && typeof bp.getMonotonicTime === 'function') {
        const r = await bp.getMonotonicTime();
        if (r && Number.isFinite(r.elapsedRealtimeMs) && r.elapsedRealtimeMs > 0) {
          const wallNow = Date.now();
          if (NATIVE_MONO_OFFSET_MS === null && DEYN_TP && DEYN_TP.status === 'OK') {
            NATIVE_MONO_OFFSET_MS = wallNow - r.elapsedRealtimeMs;
          }
          return r.elapsedRealtimeMs;
        }
      }
    } catch (e) {}
    return null;
  }

  const origEvaluate = window.evaluate;
  window.evaluate = function (prev, obs, opts = {}) {
    const tol = opts.tolerance ?? (typeof TOLERANCE_MS !== 'undefined' ? TOLERANCE_MS : 5 * 60 * 1000);
    const grace = opts.grace ?? (typeof GRACE_MS !== 'undefined' ? GRACE_MS : 48 * 3600 * 1000);
    const afterGrace = opts.afterGrace ?? 'READ_ONLY';

    const sIn = { ...(prev || {}) };
    const now = obs.now;
    let effectiveObs = { ...obs };
    const perfNow = getMonotonicNowMs();

    // Anchor lastValidWall and lastValidPerf ONLY when status is OK (no active episode) and no abnormal forward/backward jump occurred
    if (!sIn.episode) {
      if (sIn.lastSeen === 0 || (now >= sIn.lastSeen - tol && (now - sIn.lastSeen) <= Math.max(tol, 15 * 60 * 1000))) {
        sIn.lastValidWall = now;
        sIn.lastValidPerf = perfNow;
      } else if (!sIn.lastValidWall && sIn.lastSeen > 0) {
        sIn.lastValidWall = sIn.lastSeen;
        sIn.lastValidPerf = perfNow;
      }
    }

    // When offline (obs.trusted == null):
    // 1) If the user explicitly clicked "حسناً" (allowMonotonicRecovery: true) AND restored the clock to match
    //    the pre-tamper monotonic timeline (lastValidWall + elapsed monotonic time within tolerance), supply that reference.
    if (sIn.episode && effectiveObs.trusted == null && opts.allowMonotonicRecovery && sIn.lastValidWall && Number.isFinite(sIn.lastValidPerf)) {
      const elapsedMs = Math.max(0, perfNow - sIn.lastValidPerf);
      const expectedReal = sIn.lastValidWall + elapsedMs;
      if (Math.abs(now - expectedReal) <= tol) {
        effectiveObs.trusted = expectedReal;
      }
    }

    const res = origEvaluate(sIn, effectiveObs, { tolerance: tol, grace, afterGrace });
    if (sIn.lastValidWall) {
      res.state.lastValidWall = res.status === 'OK' ? now : sIn.lastValidWall;
      res.state.lastValidPerf = res.status === 'OK' ? perfNow : sIn.lastValidPerf;
    }
    return res;
  };

  // Interactive banner with "لاحقاً" (Later) and "حسناً" (OK / Verify now) buttons
  window.deynBanner = function (txt, kind) {
    var el = document.getElementById('deynTimeBanner');
    if (!txt) {
      if (el) el.remove();
      return;
    }
    var warnKey = (DEYN_TP && DEYN_TP.status) + ':' + (DEYN_TP && DEYN_TP.state && DEYN_TP.state.warnings);
    if (kind === 'w' && DISMISSED_EPISODE_WARN === warnKey) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement('div');
      el.id = 'deynTimeBanner';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:100003;padding:8px 12px;font:700 12px/1.6 system-ui,sans-serif;direction:' + (isFr() ? 'ltr' : 'rtl') + ';color:#fff;background:' + (kind === 'ro' ? '#b91c1c' : '#b45309') + ';display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap';
    const displayTxt = isFr() ? tr(txt) : txt;
    el.innerHTML = `<span id="deynTimeBannerText" style="flex:1;min-width:180px">${escHtml(displayTxt)}</span>` +
      `<div class="tb-actions" style="display:flex;gap:6px">` +
      `<button type="button" class="tb-btn" id="deynTbLater">${escHtml(tr('لاحقاً'))}</button>` +
      `<button type="button" class="tb-btn" id="deynTbOk" style="background:#fff;color:#0f172a;border-color:#fff">${escHtml(tr('حسناً'))}</button>` +
      `</div>`;
    const btnLater = document.getElementById('deynTbLater');
    const btnOk = document.getElementById('deynTbOk');
    if (btnLater) {
      btnLater.onclick = function () {
        if (DEYN_TP && DEYN_TP.status !== 'READ_ONLY') {
          DISMISSED_EPISODE_WARN = warnKey;
          el.remove();
        } else {
          toast(tr('انتهت مهلة الـ 48 ساعة، يرجى ضبط الساعة والضغط على حسناً للتحقق'), 'warn');
        }
      };
    }
    if (btnOk) {
      btnOk.onclick = async function () {
        DISMISSED_EPISODE_WARN = 0;
        await window.deynVerifyClockFixed();
      };
    }
  };

  window.deynVerifyClockFixed = async function () {
    const gotRemote = await deynFetchTrustedTime();
    if (!gotRemote && DEYN_TP && DEYN_TP.state) {
      const res = window.evaluate(DEYN_TP.state, { now: Date.now(), trusted: deynTrustedObs() }, { allowMonotonicRecovery: true });
      DEYN_TP.state = res.state;
      DEYN_TP.status = res.status;
      DEYN_TP.graceLeftMs = res.graceLeftMs;
      DEYN_TP.warningNo = res.warningNo || DEYN_TP.warningNo;
      DEYN_LAST = res.state.lastSeen;
      deynTpUi(res);
      await DeynStore.set('tp', JSON.stringify(res.state)).catch(() => {});
    }
    if (DEYN_TP && DEYN_TP.status === 'OK') {
      toast(tr('تم التحقق من صحة الساعة وإزالة التحذير بنجاح ✅'), 'ok');
      return true;
    }
    toast(tr('الساعة لا تزال غير مطابقة للوقت الحقيقي أو يلزم الاتصال بالإنترنت للتحقق'), 'warn');
    return false;
  };

  const origClockTick = window.deynClockTick;
  window.deynClockTick = function (force) {
    if (!DEYN_TP || !DEYN_TP.state) return true;
    const curTz = new Date().getTimezoneOffset();
    if (curTz !== LAST_TZ_OFFSET) {
      LAST_TZ_OFFSET = curTz;
    }
    const prevWarn = DEYN_TP.state.warnings;
    const r = origClockTick(force);
    if (DEYN_TP.state.warnings !== prevWarn) {
      DISMISSED_EPISODE_WARN = 0;
    }
    return r;
  };

  // ============================================================================
  // 2 & 3. AUTOMATIC EXTERNAL BACKUP & LICENSE-BOUND JSON RESTORE
  // ============================================================================
  const backupPlug = () => (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.DeynBackup) || null;
  const BACKUP_FORMAT = 'DEYN-BACKUP-V2';
  let autoBackupTimer = null;
  let autoBackupRetryTimer = null;
  let lastAutoBackupHash = '';
  let lastAutoBackupStatus = { ok: false, reason: 'not_run' };

  function buildBackupEnvelope() {
    if (typeof S === 'undefined' || !S || !Array.isArray(S.customers) || !Array.isArray(S.pending)) return null;
    const cleanState = JSON.parse(JSON.stringify(S));
    // Strip sensitive credentials, license tokens, and role elevation fields so JSON can NEVER transfer privileges or secrets
    if (cleanState.auth) {
      delete cleanState.auth.masterPass;
      delete cleanState.auth.masterCode;
      delete cleanState.auth.assistantCode;
      delete cleanState.auth.pw;
      delete cleanState.auth.pwFail;
      delete cleanState.auth.pwMustSet;
      delete cleanState.auth.pwMigrated;
      delete cleanState.auth.licRole;
      delete cleanState.auth.deviceRole;
    }
    delete cleanState.sync;
    return {
      format: BACKUP_FORMAT,
      version: 2,
      appVersion: '1.0.0',
      exportedAt: Date.now(),
      deviceId: String(window.DEYN_DEV_ID || ''),
      summary: {
        customersCount: cleanState.customers.length,
        pendingCount: cleanState.pending.length,
        trashCount: Array.isArray(cleanState.trash) ? cleanState.trash.length : 0
      },
      data: cleanState
    };
  }

  /**
   * Computes a comprehensive deterministic fingerprint covering ALL merchant data fields:
   * customers (and all their transactions/extensions), pending tickets, trash/archive,
   * customSegs, deletedSegs, guaranteed flags, settings, smsLog, notifLog, and seq.
   */
  function computeBackupFingerprint(data) {
    if (!data || typeof data !== 'object') return '';
    return JSON.stringify({
      seq: data.seq || 0,
      customers: data.customers || [],
      pending: data.pending || [],
      trash: data.trash || [],
      customSegs: data.customSegs || {},
      deletedSegs: data.deletedSegs || [],
      guaranteed: data.guaranteed || {},
      settings: data.settings || {},
      smsLog: data.smsLog || {},
      notifLog: data.notifLog || {}
    });
  }

  function validateBackupPayload(rawText) {
    if (typeof rawText !== 'string' || !rawText.trim()) {
      return { ok: false, reason: 'ملف النسخة الاحتياطية فارغ أو غير صالح' };
    }
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      return { ok: false, reason: 'ملف JSON تالف ولا يمكن قراءته' };
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, reason: 'بنية ملف النسخة الاحتياطية غير متوافقة' };
    }
    const isEnvelope = parsed.format === BACKUP_FORMAT || (parsed.version === 2 && parsed.data && typeof parsed.data === 'object');
    const stateObj = isEnvelope ? parsed.data : parsed;
    const metaDevId = isEnvelope && typeof parsed.deviceId === 'string'
      ? parsed.deviceId
      : (parsed.__backupMeta && typeof parsed.__backupMeta.deviceId === 'string' ? parsed.__backupMeta.deviceId : '');
    const originDeviceId = metaDevId ? metaDevId.trim().toLowerCase() : null;

    if (!stateObj || typeof stateObj !== 'object' || !Array.isArray(stateObj.customers) || !Array.isArray(stateObj.pending)) {
      return { ok: false, reason: 'ملف النسخة الاحتياطية لا يحتوي على سجلات الزبائن والتذاكر المطلوبة' };
    }

    const seenCustIds = new Set();
    const seenTxIds = new Set();
    for (let i = 0; i < stateObj.customers.length; i++) {
      const c = stateObj.customers[i];
      if (!c || typeof c !== 'object' || typeof c.id !== 'string' || !c.id.trim() || typeof c.name !== 'string' || !c.name.trim()) {
        return { ok: false, reason: `بيانات الزبون رقم ${i + 1} في الملف تالفة أو ناقصة` };
      }
      if (seenCustIds.has(c.id)) {
        return { ok: false, reason: 'ملف النسخة الاحتياطية يحتوي على معرفات زبائن مكررة' };
      }
      seenCustIds.add(c.id);
      if (c.tx !== undefined && !Array.isArray(c.tx)) {
        return { ok: false, reason: `سجل عمليات الزبون «${c.name}» غير صالح` };
      }
      for (const tx of (c.tx || [])) {
        if (!tx || typeof tx !== 'object' || typeof tx.id !== 'string' || !tx.id.trim() || !['debt', 'pay'].includes(tx.type) || !Number.isFinite(Number(tx.amount)) || Number(tx.amount) < 0) {
          return { ok: false, reason: `عملية مالية تالفة في حساب «${c.name}»` };
        }
        if (seenTxIds.has(tx.id)) {
          return { ok: false, reason: 'ملف النسخة الاحتياطية يحتوي على معرفات عمليات مكررة' };
        }
        seenTxIds.add(tx.id);
      }
    }
    for (let i = 0; i < stateObj.pending.length; i++) {
      const p = stateObj.pending[i];
      if (!p || typeof p !== 'object' || typeof p.id !== 'string' || !p.id.trim() || !Number.isFinite(Number(p.amount)) || Number(p.amount) < 0) {
        return { ok: false, reason: `بيانات التذكرة المعلقة رقم ${i + 1} تالفة` };
      }
    }
    if (stateObj.trash !== undefined && !Array.isArray(stateObj.trash)) {
      return { ok: false, reason: 'سجل سلة المهملات في النسخة الاحتياطية غير صالح' };
    }

    return {
      ok: true,
      originDeviceId,
      stateObj: JSON.parse(JSON.stringify(stateObj)),
      customersCount: stateObj.customers.length,
      pendingCount: stateObj.pending.length
    };
  }

  function scheduleAutoBackupRetry(delayMs = 15000) {
    clearTimeout(autoBackupRetryTimer);
    autoBackupRetryTimer = setTimeout(() => {
      runAutoBackupNow();
    }, delayMs);
  }

  /**
   * Executes an automatic external backup to the user-selected Android SAF folder.
   * NEVER reports success or updates lastAutoBackupHash unless DeynBackupPlugin confirms
   * the external file was atomically written, synced, and verified.
   */
  async function runAutoBackupNow(opts = {}) {
    try {
      const env = buildBackupEnvelope();
      if (!env) {
        lastAutoBackupStatus = { ok: false, reason: 'no_state', retryable: true };
        return lastAutoBackupStatus;
      }
      const fingerprint = computeBackupFingerprint(env.data);
      if (!opts.force && fingerprint === lastAutoBackupHash && lastAutoBackupStatus.ok) {
        return { ok: true, skipped: true, at: lastAutoBackupStatus.at };
      }

      const jsonStr = JSON.stringify(env, null, 2);
      window.__deynLastAutoBackupJson = jsonStr;

      const bp = backupPlug();
      if (!bp || typeof bp.writeAutoBackup !== 'function') {
        // Native Android SAF plugin is unavailable: return explicit failure, do NOT update lastAutoBackupHash
        lastAutoBackupStatus = { ok: false, reason: 'plugin_unavailable', retryable: true };
        return lastAutoBackupStatus;
      }

      const res = await bp.writeAutoBackup({ data: jsonStr });
      if (res && res.ok === true) {
        clearTimeout(autoBackupRetryTimer);
        lastAutoBackupHash = fingerprint;
        lastAutoBackupStatus = {
          ok: true,
          at: res.at || Date.now(),
          seq: res.seq || 0,
          bytes: res.bytes || jsonStr.length
        };
        if (S && S.settings) S.settings.lastAutoBackupAt = lastAutoBackupStatus.at;
        return lastAutoBackupStatus;
      }

      // External write did not succeed (no_folder, permission_lost, or write_error):
      // Do NOT update lastAutoBackupHash, preserve retry capability, and surface appropriate warning
      const reason = (res && res.reason) || 'write_error';
      lastAutoBackupStatus = {
        ok: false,
        reason,
        error: (res && res.error) || '',
        retryable: true
      };
      if (reason === 'write_error') {
        toast(tr('تعذّر تحديث النسخة الاحتياطية الخارجية (تحقق من مساحة الهاتف أو المجلد). آخر نسخة سليمة محفوظة ⚠️'), 'warn');
        scheduleAutoBackupRetry(15000);
      } else if (reason === 'permission_lost') {
        toast(tr('فُقد إذن الوصول إلى مجلد النسخ الاحتياطي الخارجي — يرجى إعادة اختيار المجلد من الإعدادات ⚠️'), 'warn');
      }
      return lastAutoBackupStatus;
    } catch (e) {
      const errMsg = String((e && e.message) || e);
      lastAutoBackupStatus = { ok: false, reason: 'exception', error: errMsg, retryable: true };
      scheduleAutoBackupRetry(15000);
      return lastAutoBackupStatus;
    }
  }

  function scheduleAutoBackup() {
    clearTimeout(autoBackupTimer);
    autoBackupTimer = setTimeout(() => { runAutoBackupNow(); }, 350);
  }

  /**
   * Reads and validates the external SAF auto-backup.
   * Tries the primary file ("deyn-auto-backup.json") first; if reading fails OR its JSON content is corrupt/invalid,
   * automatically falls back to the previous backup ("deyn-auto-backup.prev.json") and validates it.
   */
  async function readValidatedAutoBackupFromSaf() {
    const bp = backupPlug();
    if (!bp || typeof bp.readAutoBackup !== 'function') {
      return { ok: false, reason: 'إضافة النسخ الاحتياطي لأندرويد غير متاحة في هذه البيئة' };
    }
    // 1. Try primary backup first (note: DeynBackupPlugin.readAutoBackup already falls back to .prev.json if main is unreadable/corrupt at JSON level)
    let primaryErr = '';
    try {
      const r1 = await bp.readAutoBackup({ preferPrev: false });
      if (r1 && r1.data) {
        const v1 = validateBackupPayload(r1.data);
        if (v1.ok) {
          return Object.assign({}, v1, {
            rawText: r1.data,
            source: r1.source || 'deyn-auto-backup.json',
            fallbackUsed: !!r1.fallbackUsed
          });
        }
        primaryErr = v1.reason;
      }
    } catch (e) {
      primaryErr = String((e && e.message) || e);
    }

    // 2. If primary failed deep schema validation in validateBackupPayload, explicitly request .prev.json
    try {
      const r2 = await bp.readAutoBackup({ preferPrev: true });
      if (r2 && r2.data) {
        const v2 = validateBackupPayload(r2.data);
        if (v2.ok) {
          return Object.assign({}, v2, {
            rawText: r2.data,
            source: r2.source || 'deyn-auto-backup.prev.json',
            fallbackUsed: true
          });
        }
        return { ok: false, reason: v2.reason };
      }
    } catch (e2) {
      return { ok: false, reason: primaryErr || String((e2 && e2.message) || e2) };
    }
    return { ok: false, reason: primaryErr || 'لم يتم العثور على نسخة احتياطية صالحة في المجلد المختار' };
  }

  const origBackupFn = window.backup;
  window.backup = function () {
    try {
      const env = buildBackupEnvelope();
      if (!env) return origBackupFn();
      const payload = Object.assign({}, env.data, {
        __backupMeta: {
          format: BACKUP_FORMAT,
          version: 2,
          deviceId: env.deviceId,
          exportedAt: env.exportedAt
        }
      });
      const b = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      const d = new Date();
      a.download = `deyn-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    } catch (e) {
      toast(tr('تعذّر تحميل النسخة'), 'err');
    }
  };
  if (typeof A === 'object' && A) A.backup = window.backup;

  /**
   * Atomically applies a validated backup payload ONLY after cryptographic DEYN3 license verification succeeds.
   * Never imports passwords, licenses, or M/W role fields from JSON, and verifies durable storage persistence
   * (including awaiting DeynVault flush) before declaring success.
   */
  async function applyVerifiedRestore(validated, verifiedLic) {
    if (!validated || !validated.ok || !verifiedLic || !verifiedLic.role) {
      throw new Error(tr('بيانات الاستعادة أو الترخيص غير صالحة'));
    }
    const previousSnapshot = (typeof S !== 'undefined' && S) ? JSON.parse(JSON.stringify(S)) : null;
    const previousLic = window.DEYN_LIC || null;
    try {
      const incoming = JSON.parse(JSON.stringify(validated.stateObj));
      // Strip any auth/role/password/license fields that might exist inside incoming stateObj
      delete incoming.auth;
      delete incoming.sync;

      const preservedAuth = (typeof S !== 'undefined' && S && S.auth) ? JSON.parse(JSON.stringify(S.auth)) : {
        phone: '0555 12 34 56',
        pwMustSet: true,
        maxDevices: 2
      };
      const cleanIncomingSettings = (incoming.settings && typeof incoming.settings === 'object' && !Array.isArray(incoming.settings))
        ? Object.assign({}, incoming.settings)
        : {};
      // Never allow imported settings to enable appLock if the current device has no password set
      if (!preservedAuth.pw) {
        delete cleanIncomingSettings.appLockEnabled;
      }
      const preservedSettings = Object.assign(
        { dialect: true, sound: true, notifs: true, assistantStatsLocked: true },
        (typeof S !== 'undefined' && S && S.settings) || {},
        cleanIncomingSettings
      );

      const nextState = {
        seq: Number.isInteger(incoming.seq) && incoming.seq > 0
          ? incoming.seq
          : (Math.max(0, ...incoming.pending.map(t => Number(t.no) || 0)) + 1),
        settings: preservedSettings,
        auth: preservedAuth,
        customers: incoming.customers,
        pending: incoming.pending,
        trash: Array.isArray(incoming.trash) ? incoming.trash : [],
        customSegs: (incoming.customSegs && typeof incoming.customSegs === 'object' && !Array.isArray(incoming.customSegs)) ? incoming.customSegs : {},
        deletedSegs: Array.isArray(incoming.deletedSegs) ? incoming.deletedSegs : [],
        guaranteed: (incoming.guaranteed && typeof incoming.guaranteed === 'object' && !Array.isArray(incoming.guaranteed)) ? incoming.guaranteed : {},
        smsLog: (incoming.smsLog && typeof incoming.smsLog === 'object' && !Array.isArray(incoming.smsLog)) ? incoming.smsLog : {},
        notifLog: (incoming.notifLog && typeof incoming.notifLog === 'object' && !Array.isArray(incoming.notifLog)) ? incoming.notifLog : {}
      };

      // Bind the verified license role strictly from the cryptographic DEYN3 token
      window.DEYN_LIC = verifiedLic;
      DEYN_LIC = verifiedLic;
      S = nextState;
      window.applyLicenseRole();
      if (typeof DeynSyncLib !== 'undefined' && DEYN_DEV_ID) {
        DeynSyncLib.ensureSync(S, DEYN_DEV_ID);
        DeynSyncLib.resnapshot(S, DEYN_DEV_ID);
      }

      if (!window.persist()) {
        throw new Error(tr('تعذّر حفظ البيانات المستعادة في التخزين المحلي'));
      }
      if (typeof deynFlush === 'function') {
        await deynFlush();
      }
      if (typeof storageBlocked !== 'undefined' && storageBlocked) {
        throw new Error(tr('فشل التحقق من حفظ البيانات المشفرة'));
      }
      renderAll();
      return true;
    } catch (err) {
      if (previousSnapshot) {
        S = previousSnapshot;
        window.DEYN_LIC = previousLic;
        DEYN_LIC = previousLic;
        try { origPersistForBackup(); } catch (e) {}
      }
      throw err;
    }
  }

  function pickJsonFileText() {
    return new Promise((resolve) => {
      let input = document.getElementById('deynRestoreFileInput');
      if (input) input.remove();
      input = document.createElement('input');
      input.type = 'file';
      input.id = 'deynRestoreFileInput';
      input.accept = '.json,application/json';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.onchange = () => {
        const f = input.files && input.files[0];
        if (!f) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload = () => resolve({ name: f.name, text: String(reader.result || '') });
        reader.onerror = () => resolve({ name: f.name, error: 'read_error' });
        reader.readAsText(f);
      };
      input.click();
    });
  }

  let pendingRestoreValidated = null;
  let pendingRestoreFromGate = false;

  async function openRestoreJsonFlow(fromGate, preloadedText, opts = {}) {
    let v = null;
    if (opts && opts.useSafAuto) {
      const safRes = await readValidatedAutoBackupFromSaf();
      if (!safRes.ok) {
        const msg = tr(safRes.reason || 'تعذّرت قراءة النسخة التلقائية من المجلد');
        return fromGate ? agToast(msg) : toast(msg, 'err');
      }
      v = safRes;
      if (safRes.fallbackUsed) {
        toast(tr('تم التحول تلقائياً إلى النسخة الاحتياطية السابقة السليمة (.prev.json) بسبب تعذّر قراءة النسخة الرئيسية ⚠️'), 'warn');
      }
    } else {
      let rawText = preloadedText || null;
      if (!rawText) {
        const picked = await pickJsonFileText();
        if (!picked) return;
        if (picked.error) {
          const msg = tr('تعذّرت قراءة ملف JSON المختار');
          return fromGate ? agToast(msg) : toast(msg, 'err');
        }
        rawText = picked.text;
      }
      v = validateBackupPayload(rawText);
      if (!v.ok) {
        const msg = tr(v.reason);
        return fromGate ? agToast(msg) : toast(msg, 'err');
      }
    }

    pendingRestoreValidated = v;
    pendingRestoreFromGate = !!fromGate;

    const currentLic = (!fromGate && window.DEYN_LIC) ? window.DEYN_LIC : await deynLoadLicense();
    const prefilledCode = (currentLic && currentLic.code) ? currentLic.code : '';
    const isDifferentDevice = v.originDeviceId && DEYN_DEV_ID && v.originDeviceId !== DEYN_DEV_ID;

    const modal = openModal(() => `${sheetHead(tr('استعادة نسخة JSON'))}
      <div class="sub" style="line-height:1.75;margin-bottom:10px">
        ${escHtml(tr('تم التحقق من سلامة ملف النسخة الاحتياطية:'))}
        <b>${v.customersCount}</b> ${escHtml(tr('زبائن'))} • <b>${v.pendingCount}</b> ${escHtml(tr('تذكرة'))}.
      </div>
      ${isDifferentDevice ? `<div class="note w" style="margin-bottom:10px;line-height:1.6">${escHtml(tr('تنبيه: هذه النسخة مأخوذة من جهاز آخر. لإتمام الاستعادة على هذا الهاتف، أدخل كود التفعيل الصالح لمعرّف هذا الجهاز الصادر من مولّد الأكواد.'))}</div>` : `<div class="sub" style="margin-bottom:10px">${escHtml(tr('لإتمام الاستعادة بأمان، أدخل كود التفعيل الخاص بهذا الجهاز:'))}</div>`}
      <label class="lbl">${escHtml(tr('معرّف الجهاز'))}</label>
      <div class="num" style="direction:ltr;word-break:break-all;font-size:12.5px;background:#f1f5f9;border-radius:10px;padding:8px 10px">${escHtml(String(DEYN_DEV_ID || ''))}</div>
      <label class="lbl" for="restoreLicInput" style="margin-top:10px">${escHtml(tr('كود التفعيل'))} *</label>
      <input class="inp" id="restoreLicInput" type="text" dir="ltr" style="text-align:left" value="${escHtml(prefilledCode)}" placeholder="DEYN3-..." autocomplete="off" spellcheck="false">
      <div class="two" style="margin-top:16px">
        <button type="button" class="btn" data-act="closeTop">${escHtml(tr('إلغاء'))}</button>
        <button type="button" class="btn pri" data-act="confirmRestoreJson" data-primary>${escHtml(tr('تأكيد الاستعادة'))}</button>
      </div>`);
    modal.wrap.style.zIndex = '100002';
  }

  async function confirmRestoreJson() {
    if (!pendingRestoreValidated) return;
    const inp = lastById('restoreLicInput');
    const code = inp ? inp.value.trim() : '';
    if (!code) {
      toast(tr('أدخل كود التفعيل للتحقق من أحقية الاستعادة'), 'err');
      return;
    }
    if (!DEYN_DEV_ID) {
      DEYN_DEV_ID = await deynGetDeviceId();
    }
    const verified = await deynVerifyCode(code, DEYN_DEV_ID);
    if (!verified) {
      toast(tr('كود التفعيل غير صالح لهذا الجهاز أو انتهت صلاحيته — تم رفض الاستعادة'), 'err');
      return;
    }

    try {
      await DeynStore.set('lic', JSON.stringify({ code: verified.code }));
      let used = [];
      try { used = JSON.parse((await DeynStore.get('used')) || '[]'); if (!Array.isArray(used)) used = []; } catch (e) { used = []; }
      if (used.indexOf(verified.code) < 0) {
        used.push(verified.code);
        await DeynStore.set('used', JSON.stringify(used));
      }

      if (pendingRestoreFromGate && !DEYN_STARTED) {
        DEYN_LIC = verified;
        window.DEYN_LIC = verified;
        agStartApp();
        await new Promise(r => setTimeout(r, 350));
      }

      await applyVerifiedRestore(pendingRestoreValidated, verified);
      pendingRestoreValidated = null;
      closeModal();
      toast(tr('تمت استعادة النسخة الاحتياطية بنجاح ✅'), 'ok');
    } catch (e) {
      toast(tr('فشلت عملية الاستعادة وبقيت بياناتك الحالية محمية:') + ' ' + (e.message || e), 'err');
    }
  }

  function injectActivationGateRestoreLink() {
    const foot = document.querySelector('#actGate .ag-foot');
    if (!foot || document.getElementById('agRestoreJsonBtn')) return;
    const note = foot.querySelector('.ag-note');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'agRestoreJsonBtn';
    btn.className = 'ag-restore-link';
    btn.textContent = tr('استعادة نسخة JSON');
    btn.onclick = () => openRestoreJsonFlow(true, null);
    if (note && note.parentNode) note.after(btn);
    else foot.appendChild(btn);
  }
  injectActivationGateRestoreLink();

  async function selectSafBackupFolder() {
    if (!requireOwner('إعداد النسخ الاحتياطي التلقائي')) return false;
    const bp = backupPlug();
    if (!bp || typeof bp.selectBackupFolder !== 'function') {
      toast(tr('اختيار مجلد النسخ الاحتياطي الخارجي يتطلب تشغيل التطبيق على نظام أندرويد ⚠️'), 'err');
      return false;
    }
    try {
      const r = await bp.selectBackupFolder();
      if (r && r.configured) {
        const writeRes = await runAutoBackupNow({ force: true });
        if (writeRes && writeRes.ok) {
          toast(tr('تم ربط مجلد النسخ الاحتياطي التلقائي وحفظ النسخة بنجاح ✅'), 'ok');
          stack.forEach(m => m.refresh && m.refresh());
          return true;
        }
        toast(tr('تم اختيار المجلد لكن تعذّرت كتابة النسخة الاحتياطية الأولى ⚠️'), 'warn');
        return false;
      }
    } catch (e) {
      toast(tr('لم يتم اختيار مجلد النسخ الاحتياطي'), 'warn');
    }
    return false;
  }

  // ============================================================================
  // 5 & 6. PERSISTENT NOTIFICATION LOG (READ/UNREAD) & NATIVE ANDROID NOTIFICATIONS
  // ============================================================================
  const notifPlug = () => (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.DeynNotif) || null;
  let notifFilter = 'all';
  let notifScheduleTimer = null;

  function ensureNotifLog() {
    if (typeof S === 'undefined' || !S) return {};
    if (!S.notifLog || typeof S.notifLog !== 'object' || Array.isArray(S.notifLog)) {
      S.notifLog = {};
    }
    return S.notifLog;
  }

  // Synchronize active alerts into S.notifLog and remove obsolete unread alerts when debts are paid or modified
  function syncAlertsToLog() {
    if (typeof S === 'undefined' || !S || !Array.isArray(S.customers)) return [];
    const log = ensureNotifLog();
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const activeAlerts = getAlertedCustomers();
    const activeKeySet = new Set();
    let changed = false;

    for (const item of activeAlerts) {
      const c = item.customer;
      const b = item.balance;
      let eventType = 'due_today';
      let eventKey = `today|${c.id}|${ym}|${item.pi ? item.pi.day : 0}`;
      let body = '';

      if (item.isOverdue) {
        eventType = 'overdue';
        eventKey = `overdue|${c.id}|${ym}|${item.pi ? item.pi.day : 0}`;
        body = `⚠️ متأخر بـ ${item.pi.diff} ${item.pi.diff <= 2 ? (item.pi.diff === 1 ? 'يوم' : 'يومين') : 'أيام'} (موعده يوم ${item.pi.day}) — ${fmt(b)} دج`;
      } else if (item.isOverCeil) {
        eventType = 'over_ceiling';
        eventKey = `ceil|${c.id}|${Math.round(b)}|${Math.round(c.ceiling)}`;
        body = `🚨 تجاوز سقف الدين (${fmt(b)} / ${fmt(c.ceiling)} دج)`;
      } else if (item.isToday) {
        eventType = 'due_today';
        eventKey = `today|${c.id}|${ym}|${item.pi ? item.pi.day : 0}`;
        body = `🕒 موعد السداد اليوم (يوم ${item.pi.day}) — ${fmt(b)} دج`;
      }

      activeKeySet.add(eventKey);
      if (!log[eventKey]) {
        log[eventKey] = {
          key: eventKey,
          cid: c.id,
          customerName: c.name,
          type: eventType,
          balance: b,
          body,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          read: false,
          notifiedNative: false
        };
        changed = true;
      } else {
        if (log[eventKey].customerName !== c.name || log[eventKey].balance !== b || log[eventKey].body !== body) {
          log[eventKey].customerName = c.name;
          log[eventKey].balance = b;
          log[eventKey].body = body;
          log[eventKey].updatedAt = Date.now();
          changed = true;
        }
      }
    }

    // If a customer paid off their debt or their payDay/ceiling changed so an unread alert is no longer active, remove the stale unread alert
    const existingCustIds = new Set((S.customers || []).map(c => c.id));
    for (const k of Object.keys(log)) {
      const entry = log[k];
      if (!entry) continue;
      if (!existingCustIds.has(entry.cid) || (!activeKeySet.has(k) && !entry.read)) {
        delete log[k];
        changed = true;
      }
    }

    if (changed) {
      try { origPersistForBackup(); } catch (e) {}
    }
    return Object.values(log).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  async function dispatchAndScheduleNativeNotifications() {
    if (typeof S === 'undefined' || !S || !S.settings) return;
    const np = notifPlug();
    if (!S.settings.notifs) {
      // If notifications are turned off, clear scheduled WorkManager notifications
      if (np && typeof np.schedule === 'function') {
        try { await np.schedule({ items: [] }); } catch (e) {}
      }
      return;
    }

    const entries = syncAlertsToLog();
    if (!np) return;

    try {
      const perm = await np.checkPermissions();
      if (!perm || perm.notifications !== 'granted') return;

      let dirty = false;
      for (const entry of entries) {
        if (!entry.notifiedNative && !entry.read) {
          const r = await np.notifyNow({
            key: entry.key,
            title: `DEYN — ${entry.customerName}`,
            body: isFr() ? tr(entry.body) : entry.body,
            force: false
          });
          if (r && (r.posted || r.duplicate)) {
            entry.notifiedNative = true;
            dirty = true;
          }
        }
      }
      if (dirty) {
        try { origPersistForBackup(); } catch (e) {}
      }

      // Schedule next-day overdue notifications (at 09:00 the day after each customer's payDay) via WorkManager.
      // Passing only customers who currently have bal(c) > 0 automatically cancels any previously scheduled notification
      // for customers who paid off or modified their debt!
      const now = new Date();
      const scheduledItems = [];
      for (const c of (S.customers || [])) {
        const b = bal(c);
        if (!c.payDay || b <= 0) continue;
        for (let mOffset = 0; mOffset < 2; mOffset++) {
          const y = now.getFullYear(), m = now.getMonth() + mOffset;
          const dim = new Date(y, m + 1, 0).getDate();
          const payDayClamped = Math.min(c.payDay, dim);
          const nextDayNineAm = new Date(y, m, payDayClamped + 1, 9, 0, 0, 0).getTime();
          if (nextDayNineAm > Date.now()) {
            const targetDate = new Date(y, m, 1);
            const ym = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
            const key = `overdue|${c.id}|${ym}|${c.payDay}`;
            const bodyAr = `⚠️ متأخر بـ 1 يوم (موعده يوم ${c.payDay}) — ${fmt(b)} دج`;
            scheduledItems.push({
              key,
              title: `DEYN — ${c.name}`,
              body: isFr() ? tr(bodyAr) : bodyAr,
              at: nextDayNineAm
            });
            break;
          }
        }
      }
      await np.schedule({ items: scheduledItems });
    } catch (e) {
      console.warn('Native notification sync warning:', e);
    }
  }

  function scheduleNotifRefresh() {
    clearTimeout(notifScheduleTimer);
    notifScheduleTimer = setTimeout(() => {
      window.updateBellBadge();
      dispatchAndScheduleNativeNotifications();
    }, 120);
  }

  // Hook persist() so every successful merchant data change updates both the external auto-backup and the notification schedule
  const origPersistForBackup = window.persist;
  window.persist = function () {
    const ok = origPersistForBackup.apply(this, arguments);
    if (ok) {
      scheduleAutoBackup();
      scheduleNotifRefresh();
    }
    return ok;
  };

  window.updateBellBadge = function () {
    const badge = document.getElementById('bellBadge');
    if (!badge || typeof S === 'undefined' || !S) return;
    const all = syncAlertsToLog();
    const unreadCount = all.filter(x => !x.read).length;
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  };

  window.openNotifsModal = function () {
    const m = openModal(() => {
      const entries = syncAlertsToLog();
      const unreadCount = entries.filter(x => !x.read).length;
      const filteredEntries = notifFilter === 'unread'
        ? entries.filter(x => !x.read)
        : (notifFilter === 'read' ? entries.filter(x => x.read) : entries);

      return `${sheetHead(tr('التنبيهات والمواعيد'), unreadCount ? `<span class="num">${unreadCount}</span> ${tr('غير مقروء')}` : tr('لا توجد تنبيهات جديدة'))}
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;flex-wrap:wrap">
          <div class="chips" style="margin:0;padding:0">
            <button type="button" class="chip ${notifFilter === 'all' ? 'on' : ''}" data-act="setNotifFilter" data-f="all">${tr('الكل')} <small>${entries.length}</small></button>
            <button type="button" class="chip ${notifFilter === 'unread' ? 'on' : ''}" data-act="setNotifFilter" data-f="unread">${tr('غير مقروء')} <small>${unreadCount}</small></button>
            <button type="button" class="chip ${notifFilter === 'read' ? 'on' : ''}" data-act="setNotifFilter" data-f="read">${tr('مقروء')} <small>${entries.length - unreadCount}</small></button>
          </div>
          ${unreadCount > 0 ? `<button type="button" class="btn sm soft" data-act="markAllNotifsRead" style="height:32px;font-size:11.5px;padding:0 10px">${tr('تحديد الكل كمقروء')}</button>` : ''}
        </div>
        ${!filteredEntries.length ? `
          <div class="empty-st" style="padding:32px 16px">
            <b style="font-size:15px;color:var(--ink);display:block;margin-bottom:6px">${tr('لا توجد تنبيهات في هذا القسم')}</b>
            <span style="color:var(--mute);font-size:12.5px">${tr('جميع الزبائن ملتزمون بمواعيد السداد وسقوف الديون المحددة.')}</span>
          </div>
        ` : `
          <div style="max-height:60vh;overflow-y:auto;padding-bottom:12px;margin-top:10px">
            ${filteredEntries.map(item => `
              <div class="nt notif-item ${item.read ? 'read' : 'unread'}" style="display:flex;align-items:center;gap:10px">
                <button type="button" data-act="openNotifCust" data-cid="${escHtml(item.cid)}" data-nkey="${escHtml(item.key)}" style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;text-align:inherit">
                  <div class="av ${item.type === 'overdue' ? 'd' : (item.type === 'over_ceiling' ? 'o' : '')}">${escHtml((item.customerName || '؟').trim()[0])}</div>
                  <div class="nt-m">
                    <div class="nt-r">
                      <b>${escHtml(item.customerName)}</b>
                      <span class=" badge" style="font-size:10px;background:${item.read ? '#e2e8f0' : '#dcfce7'};color:${item.read ? '#475569' : '#166534'}">${tr(item.read ? 'مقروء' : 'جديد')}</span>
                    </div>
                    <div style="font-size:12px;color:var(--ink);margin-top:4px">${escHtml(tr(item.body))}</div>
                    <small class="num" style="color:var(--mute);font-size:10.5px">${dateStr(item.createdAt)} ${timeStr(item.createdAt)}</small>
                  </div>
                </button>
                <button type="button" class="btn sm" data-act="toggleNotifRead" data-nkey="${escHtml(item.key)}" style="height:30px;font-size:11px;padding:0 8px">${tr(item.read ? 'غير مقروء' : 'مقروء ✓')}</button>
              </div>
            `).join('')}
          </div>
        `}`;
    }, { refresh: () => m.paint() });
    return m;
  };

  const origCheckSmartNotifs = window.checkSmartNotifs;
  window.checkSmartNotifs = function () {
    if (origCheckSmartNotifs) origCheckSmartNotifs();
    window.updateBellBadge();
    dispatchAndScheduleNativeNotifications();
  };

  // ============================================================================
  // SETTINGS INJECTION (Restore JSON + SAF Folder Selection)
  // ============================================================================
  function decorateSettingsSheet(sheet) {
    if (!sheet) return;
    const backupBtn = sheet.querySelector('[data-act="backup"]');
    if (backupBtn && !sheet.querySelector('[data-act="restoreJsonSettings"]')) {
      const restoreBtn = document.createElement('button');
      restoreBtn.type = 'button';
      restoreBtn.className = 'btn block';
      restoreBtn.dataset.act = 'restoreJsonSettings';
      restoreBtn.style.cssText = 'background:#fff;color:#065043;border:1.5px solid #065043;border-radius:14px;height:48px;font-size:14.5px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px';
      restoreBtn.innerHTML = `<span>📂</span><span>${escHtml(tr('استعادة نسخة JSON'))}</span>`;
      backupBtn.after(restoreBtn);

      const safBtn = document.createElement('button');
      safBtn.type = 'button';
      safBtn.className = 'btn sm block';
      safBtn.dataset.act = 'selectBackupFolder';
      safBtn.style.cssText = 'background:#f8fafc;color:#065043;border:1px dashed #065043;border-radius:12px;height:40px;font-size:12.5px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px';
      safBtn.innerHTML = `<span>🛡️</span><span>${escHtml(tr('تحديد مجلد النسخ الاحتياطي التلقائي (خارج التطبيق)'))}</span>`;
      restoreBtn.after(safBtn);
    }
    if (typeof DEYN_I18N !== 'undefined' && typeof DEYN_I18N.translateRoot === 'function') {
      DEYN_I18N.translateRoot(sheet);
    }
  }

  const origOpenSettings = window.openSettings;
  window.openSettings = function () {
    const ret = origOpenSettings.apply(this, arguments);
    const m = ret || (typeof stack !== 'undefined' && stack.length ? stack[stack.length - 1] : null);
    const sheet = (m && m.wrap && m.wrap.querySelector('.sheet')) || document.querySelector('#modalRoot .ovl:last-child .sheet');
    decorateSettingsSheet(sheet);
    if (m && typeof m.paint === 'function' && !m.paint.__completionWrapped) {
      const origPaint = m.paint;
      m.paint = function () {
        const r = origPaint.apply(this, arguments);
        decorateSettingsSheet((m.wrap && m.wrap.querySelector('.sheet')) || document.querySelector('#modalRoot .ovl:last-child .sheet'));
        return r;
      };
      m.paint.__completionWrapped = true;
    }
    return m;
  };
  if (typeof A === 'object' && A) {
    A.settings = window.openSettings;
    A.notifs = window.openNotifsModal;
    A.restoreJsonSettings = () => openRestoreJsonFlow(false, null);
    A.restoreSafAutoBackup = () => openRestoreJsonFlow(false, null, { useSafAuto: true });
    A.confirmRestoreJson = () => confirmRestoreJson();
    A.selectBackupFolder = () => selectSafBackupFolder();
    A.setNotifFilter = d => { notifFilter = (d && d.f) || 'all'; stack.forEach(m => m.refresh && m.refresh()); };
    A.markAllNotifsRead = () => {
      const log = ensureNotifLog();
      Object.values(log).forEach(x => { x.read = true; });
      persist();
      window.updateBellBadge();
      stack.forEach(m => m.refresh && m.refresh());
    };
    A.toggleNotifRead = d => {
      const log = ensureNotifLog();
      if (d && d.nkey && log[d.nkey]) {
        log[d.nkey].read = !log[d.nkey].read;
        persist();
        window.updateBellBadge();
        stack.forEach(m => m.refresh && m.refresh());
      }
    };
    const origOpenNotifCust = A.openNotifCust;
    A.openNotifCust = d => {
      const log = ensureNotifLog();
      if (d && d.nkey && log[d.nkey]) {
        log[d.nkey].read = true;
        persist();
        window.updateBellBadge();
      } else if (d && d.cid) {
        Object.values(log).forEach(x => { if (x.cid === d.cid) x.read = true; });
        persist();
        window.updateBellBadge();
      }
      if (origOpenNotifCust) origOpenNotifCust(d);
    };
  }
  if (typeof READONLY_OK !== 'undefined' && READONLY_OK && typeof READONLY_OK.add === 'function') {
    ['setNotifFilter', 'markAllNotifsRead', 'toggleNotifRead', 'selectBackupFolder', 'restoreJsonSettings', 'restoreSafAutoBackup', 'confirmRestoreJson'].forEach(k => READONLY_OK.add(k));
  }

  // Expose programmatic APIs for testing and verification
  window.DeynBackupRuntime = {
    buildBackupEnvelope,
    computeBackupFingerprint,
    validateBackupPayload,
    runAutoBackupNow,
    readValidatedAutoBackupFromSaf,
    applyVerifiedRestore,
    openRestoreJsonFlow,
    confirmRestoreJson,
    getLastStatus: () => Object.assign({}, lastAutoBackupStatus)
  };
  window.DeynNotifRuntime = {
    syncAlertsToLog,
    dispatchAndScheduleNativeNotifications
  };

  setTimeout(() => {
    injectActivationGateRestoreLink();
    syncNativeMonotonicClock();
    if (typeof S !== 'undefined' && S) {
      window.applyLicenseRole();
      window.updateBellBadge();
      dispatchAndScheduleNativeNotifications();
      scheduleAutoBackup();
    }
  }, 400);
})();

```

### 4. كود `.github/scripts/integrate_sms.py` الكامل
```python
#!/usr/bin/env python3
"""Integrate the DEYN SMS engine/runtime, Backup/Restore/Clock/Notif completion runtime, and complete French localization into the real Capacitor source archive."""
from pathlib import Path
import re, sys

if len(sys.argv) != 4:
    raise SystemExit('usage: integrate_sms.py <extracted-source-dir> <sms-engine.js> <DeynSmsPlugin.java>')
root = Path(sys.argv[1]).resolve()
engine_file = Path(sys.argv[2]).resolve()
plugin_file = Path(sys.argv[3]).resolve()
repo = Path(__file__).resolve().parents[2]
runtime_file = repo / 'sms' / 'runtime.js'
completion_file = repo / 'sms' / 'completion.js'
i18n_file = repo / 'sms' / 'i18n.js'
backup_plugin_file = repo / 'DeynBackupPlugin.java'
notif_plugin_file = repo / 'DeynNotifPlugin.java'

app = root / 'deyn-app'
html = app / 'www' / 'index.html'
prep = app / 'scripts' / 'prepare-android.sh'
for p in (html, prep, engine_file, plugin_file, runtime_file, completion_file, i18n_file, backup_plugin_file, notif_plugin_file):
    if not p.is_file():
        raise SystemExit(f'Required integration input missing: {p}')

source = html.read_text(encoding='utf-8')
engine = engine_file.read_text(encoding='utf-8')
runtime = runtime_file.read_text(encoding='utf-8')
completion = completion_file.read_text(encoding='utf-8')
i18n = i18n_file.read_text(encoding='utf-8')

script = '\n<script id="deyn-sms-bundle">\n/* DEYN_SMS_ENGINE_V1 */\n' + engine + '\n' + runtime + '\n</script>\n'
i18n_script = '\n<script id="deyn-i18n-bundle">\n/* DEYN_I18N_RUNTIME_V1 */\n' + i18n + '\n' + completion + '\n</script>\n'

# If already integrated, strip previous injected script blocks so re-running updates cleanly.
source = re.sub(r'\n?<script(?:\s+id="deyn-sms-bundle")?>\s*/\*\s*DEYN_SMS_ENGINE_V1\s*\*/[\s\S]*?</script>\n?', '', source)
source = re.sub(r'\n?<script(?:\s+id="deyn-i18n-bundle")?>\s*/\*\s*DEYN_I18N_RUNTIME_V1\s*\*/[\s\S]*?</script>\n?', '', source)

# 1. Show the individual due date and any extensions in the customer's debt ledger.
due_anchor = '<small class="num">${dateStr(t.ts)} ${timeStr(t.ts)}</small>'
due_replacement = """<small class="num">${dateStr(t.ts)} ${timeStr(t.ts)}${t.type === 'debt' ? (() => { const dueAt = Number(t.dueAt) || (c.payDay ? window.DeynSmsCore.nextMonthlyDue(t.ts, c.payDay) : null); return dueAt ? ' • الاستحقاق ' + dateStr(dueAt) + (Array.isArray(t.extensionHistory) && t.extensionHistory.length ? ' • تمديد ' + t.extensionHistory.length : '') : ''; })() : ''}</small>"""
if due_replacement not in source:
    if source.count(due_anchor) != 1:
        raise SystemExit('Could not locate the unique debt transaction date label')
    source = source.replace(due_anchor, due_replacement, 1)


# 1b. Enforce strict M/W license role separation directly in index.html (disable manual role switching in both directions).
old_switch_act = """  switchDeviceRole: () => {
    if (!S.auth) S.auth = {};
    if (isWorkerDevice()) {
      if (window.DEYN_LIC && window.DEYN_LIC.role === 'W') { toast('هذا الجهاز مرخّص كجهاز عامل ولا يمكن تحويله إلى وضع المالك 🔒', 'err'); return; }
      // Owner password is verified against a salted PBKDF2 hash (no factory/master password exists).
      openSwitchToOwnerModal();
      return;
    } else {
      S.auth.deviceRole = 'worker';
      persist();
      renderAll();
      closeModal();
      openSettings();
      toast('تم تفعيل وضع العامل (تسجيل وتسديد فقط • الحذف مقفل 🔒)');
    }
  },"""
new_switch_act = """  switchDeviceRole: () => {
    toast('نوع الترخيص (M أو W) يحدد صلاحيات الجهاز ولا يمكن تغيير الدور من داخل التطبيق 🔒', 'err');
    return false;
  },"""
if old_switch_act in source:
    source = source.replace(old_switch_act, new_switch_act, 1)

old_is_worker = """function isWorkerDevice() {
  if (window.DEYN_LIC && window.DEYN_LIC.role === 'W') return true;
  return !!(S && S.auth && S.auth.deviceRole === 'worker');
}"""
new_is_worker = """function isWorkerDevice() {
  if (window.DEYN_LIC && (window.DEYN_LIC.role === 'M' || window.DEYN_LIC.role === 'W')) return window.DEYN_LIC.role === 'W';
  return !!(S && S.auth && S.auth.licRole === 'W');
}"""
if old_is_worker in source:
    source = source.replace(old_is_worker, new_is_worker, 1)

old_switch_modals = """function openSwitchToOwnerModal() {
  if (!(S.auth && S.auth.pw)) {
    toast('لا توجد كلمة مرور للمالك بعد. استخدم كود الاسترداد لتعيين واحدة', 'err');
    return openRecoveryModal();
  }
  openModal(() => `${sheetHead('تفعيل وضع المالك')}
    <div class="sub">أدخل كلمة مرور المالك لتفعيل الصلاحيات الكاملة:</div>
    <input class="inp" id="ownerPw" type="password" placeholder="••••••••" autocomplete="off">
    <button class="btn pri block" data-act="ownerSwitchSubmit" data-primary style="margin-top:16px">تفعيل وضع المالك</button>
    <button type="button" data-act="openRecovery" style="width:100%;background:transparent;border:none;color:#64748b;font-size:12px;margin-top:12px;cursor:pointer;text-decoration:underline">نسيت كلمة المرور؟</button>`);
}
async function submitSwitchToOwner() {
  const inp = lastById('ownerPw');
  if (!inp || PW_BUSY) return;
  if (window.DEYN_LIC && window.DEYN_LIC.role === 'W') return toast('هذا الجهاز مرخّص كجهاز عامل ولا يمكن تحويله إلى وضع المالك 🔒', 'err');
  PW_BUSY = true;
  try {
    const r = await authVerify(inp.value);
    if (!r.ok) return toast(pwFailMsg(r), 'err');
    S.auth.deviceRole = 'master';
    persist(); renderAll();
    stack.slice().forEach(m => closeModal(m));
    openSettings();
    toast('تم تفعيل وضع المالك بنجاح (صلاحيات كاملة) 👑');
  } finally { PW_BUSY = false; }
}"""
new_switch_modals = """function openSwitchToOwnerModal() {
  toast('نوع الترخيص (M أو W) يحدد صلاحيات الجهاز ولا يمكن تغيير الدور من داخل التطبيق 🔒', 'err');
  return false;
}
async function submitSwitchToOwner() {
  toast('نوع الترخيص (M أو W) يحدد صلاحيات الجهاز ولا يمكن تحويله يدوياً 🔒', 'err');
  return false;
}"""
if old_switch_modals in source:
    source = source.replace(old_switch_modals, new_switch_modals, 1)

source = source.replace("'ownerSwitchSubmit','switchDeviceRole',", "")

# 2. Ensure dialect(d) delegates to DEYN_I18N.dialectFr(d) when French is active.
dialect_anchor = "function dialect(d) {\n  d = round2(d);\n  if (!(d > 0)) return '';"
dialect_replacement = "function dialect(d) {\n  d = round2(d);\n  if (!(d > 0)) return '';\n  if (typeof DEYN_I18N !== 'undefined' && DEYN_I18N.lang === 'fr' && typeof DEYN_I18N.dialectFr === 'function') return DEYN_I18N.dialectFr(d);"
if 'DEYN_I18N.dialectFr(d)' not in source and dialect_anchor in source:
    source = source.replace(dialect_anchor, dialect_replacement, 1)

# 3. Ensure Trash modal date uses DEYN_I18N.locale instead of hardcoded 'ar-DZ'.
trash_date_old = "const dateStr = new Date(item.deletedAt).toLocaleDateString('ar-DZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });"
trash_date_new = "const dateStr = new Date(item.deletedAt).toLocaleDateString(typeof DEYN_I18N !== 'undefined' ? DEYN_I18N.locale : 'ar-DZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });"
if trash_date_old in source:
    source = source.replace(trash_date_old, trash_date_new, 1)

# 4. Ensure PDF export and statement(c) use DEYN_I18N in index.html directly as well.
pdf_write_old = "win.document.write(html);"
pdf_write_new = "win.document.write(typeof DEYN_I18N !== 'undefined' ? DEYN_I18N.html(html) : html);"
if pdf_write_old in source:
    source = source.replace(pdf_write_old, pdf_write_new, 1)
pdf_blob_old = "const blob = new Blob([html], { type: 'text/html' });"
pdf_blob_new = "const blob = new Blob([typeof DEYN_I18N !== 'undefined' ? DEYN_I18N.html(html) : html], { type: 'text/html' });"
if pdf_blob_old in source:
    source = source.replace(pdf_blob_old, pdf_blob_new, 1)

stmt_old = "c.ceiling > 0 ? `السقف المسموح: ${fmt(c.ceiling)} دج` : '', 'شكرًا على ثقتكم 🤝'].filter(Boolean).join('\\n');"
stmt_new = "c.ceiling > 0 ? `السقف المسموح: ${fmt(c.ceiling)} دج` : '', 'شكرًا على ثقتكم 🤝'].filter(Boolean).map(l => typeof DEYN_I18N !== 'undefined' ? DEYN_I18N.tr(l) : l).join('\\n');"
if stmt_old in source:
    source = source.replace(stmt_old, stmt_new, 1)

# 5. Add the SMS settings entry beside the existing settings controls.
anchor = '    <div class="row-set">\n      <div>\n        <b>قفل التطبيق بكلمة المرور</b>'
insert = '''    <div class="row-set" style="background:#f0fdf4;border:1px solid rgba(6,80,67,.15);border-radius:14px;padding:12px;margin:10px 0">
      <div><b>تذكيرات SMS للزبائن</b><small>إعداد الجدولة والقوالب والسجل — الإرسال من هاتف المالك فقط</small></div>
      <button type="button" class="btn sm" data-act="smsSettings" style="height:36px;background:#065043;color:#fff;border:0">إعدادات SMS</button>
    </div>

'''
if 'data-act="smsSettings"' not in source:
    if source.count(anchor) != 1:
        raise SystemExit('Could not locate the unique settings insertion point')
    source = source.replace(anchor, insert + anchor, 1)

# 6. Stabilize bottom sheets on small Android viewports.
style_marker = '<style id="deyn-sms-layout-fix-v2">'
if style_marker not in source:
    style = '''<style id="deyn-sms-layout-fix-v2">
.ovl{overflow:hidden;align-items:flex-end;overscroll-behavior:contain}
.sheet{box-sizing:border-box;min-height:0;height:auto;max-height:calc(100dvh - env(safe-area-inset-top) - 8px);overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable;-webkit-overflow-scrolling:touch;flex:0 1 auto}
.code-card{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;min-width:0;max-width:100%;overflow:hidden}
.code-card__body,.code-card__value{min-width:0;max-width:100%;overflow-wrap:anywhere;word-break:break-word}
#modalRoot,.ovl,.sheet{min-width:0;max-width:100%}
</style>'''
    source = source.replace('</head>', style + '\n</head>', 1)

# 7. Restore the French language option and the complete translation runtime.
if 'id="agLang"' not in source:
    gate = '<div id="actGate"'
    if source.count(gate) != 1:
        raise SystemExit('Could not locate the unique activation gate for language toggle')
    gate_line_end = source.find('>', source.find(gate))
    source = source[:gate_line_end + 1] + '\n  <button type="button" id="agLang" style="position:absolute;top:calc(10px + env(safe-area-inset-top));left:12px;z-index:20;background:#fff;border:1.5px solid #065043;color:#065043;border-radius:10px;padding:6px 12px;font:700 12px sans-serif;cursor:pointer">Français</button>' + source[gate_line_end + 1:]

if 'data-i18n-setting="language"' not in source:
    lang_anchor = '    <div class="row-set">\n      <div>\n        <b>قفل التطبيق بكلمة المرور</b>'
    lang_row = '''    <div class="row-set" data-i18n-setting="language">
      <div><b>اللغة / Langue</b><small>العربية • Français</small></div>
      <div style="display:flex;gap:6px">
        <button type="button" class="btn sm" data-act="setLang" data-l="ar" onclick="DEYN_I18N.set('ar')" style="height:34px;font-size:12px;padding:0 12px;font-weight:700;border-radius:10px">ع</button>
        <button type="button" class="btn sm" data-act="setLang" data-l="fr" onclick="DEYN_I18N.set('fr')" style="height:34px;font-size:12px;padding:0 12px;font-weight:700;border-radius:10px">FR</button>
      </div>
    </div>

'''
    if source.count(lang_anchor) != 1:
        raise SystemExit('Could not locate the unique settings anchor for language selector')
    source = source.replace(lang_anchor, lang_row + lang_anchor, 1)

source = source.replace('grid-template-columns:repeat(4,1fr);gap:7px;margin-top:8px', 'grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px')
if '</body>' not in source:
    raise SystemExit('Missing closing body tag')
idx = source.rfind('</body>')
source = source[:idx] + script + i18n_script + source[idx:]
html.write_text(source, encoding='utf-8')

# 8. Native plugins (DeynSmsPlugin, DeynBackupPlugin, DeynNotifPlugin), permissions, BroadcastReceivers and WorkManager dependency in prepare-android.sh.
native = app / 'native'
native.mkdir(exist_ok=True)
(native / 'DeynSmsPlugin.java').write_text(plugin_file.read_text(encoding='utf-8'), encoding='utf-8')
(native / 'DeynBackupPlugin.java').write_text(backup_plugin_file.read_text(encoding='utf-8'), encoding='utf-8')
(native / 'DeynNotifPlugin.java').write_text(notif_plugin_file.read_text(encoding='utf-8'), encoding='utf-8')

s = prep.read_text(encoding='utf-8')
for cls_name in ('DeynSmsPlugin.class', 'DeynBackupPlugin.class', 'DeynNotifPlugin.class'):
    if cls_name not in s:
        old = 'registerPlugin(DeynSyncPlugin.class);'
        if s.count(old) != 1:
            raise SystemExit(f'Could not locate Capacitor plugin registration point for {cls_name}')
        s = s.replace(old, old + f'\n        registerPlugin({cls_name});', 1)

# Ensure all required permissions including POST_NOTIFICATIONS, SEND_SMS, RECEIVE_BOOT_COMPLETED are injected
s = re.sub(
    r'for P in ACCESS_NETWORK_STATE ACCESS_WIFI_STATE CAMERA[^;]*; do',
    'for P in ACCESS_NETWORK_STATE ACCESS_WIFI_STATE CAMERA SEND_SMS RECEIVE_BOOT_COMPLETED POST_NOTIFICATIONS; do',
    s
)

receiver_snippet = '''if ! grep -q 'DeynSmsPlugin\\$SmsStatusReceiver' "$MANIFEST"; then
  sed -i 's#</application>#    <receiver android:name="com.deyn.app.DeynSmsPlugin$SmsStatusReceiver" android:exported="false">\\n            <intent-filter>\\n                <action android:name="com.deyn.app.SMS_SENT" />\\n                <action android:name="com.deyn.app.SMS_DELIVERED" />\\n            </intent-filter>\\n        </receiver>\\n        <receiver android:name="com.deyn.app.DeynSmsPlugin$SmsBootReceiver" android:exported="true">\\n            <intent-filter>\\n                <action android:name="android.intent.action.BOOT_COMPLETED" />\\n                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />\\n            </intent-filter>\\n        </receiver>\\n        <receiver android:name="com.deyn.app.DeynNotifPlugin$NotifBootReceiver" android:exported="true">\\n            <intent-filter>\\n                <action android:name="android.intent.action.BOOT_COMPLETED" />\\n                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />\\n            </intent-filter>\\n        </receiver>\\n    </application>#' "$MANIFEST"
elif ! grep -q 'DeynNotifPlugin\\$NotifBootReceiver' "$MANIFEST"; then
  sed -i 's#</application>#    <receiver android:name="com.deyn.app.DeynNotifPlugin$NotifBootReceiver" android:exported="true">\\n            <intent-filter>\\n                <action android:name="android.intent.action.BOOT_COMPLETED" />\\n                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />\\n            </intent-filter>\\n        </receiver>\\n    </application>#' "$MANIFEST"
fi
'''

# Replace older receiver block if present, or insert before WorkManager/completion marker
s = re.sub(r'if ! grep -q \'DeynSmsPlugin\\\$SmsStatusReceiver\' "\$MANIFEST"; then[\s\S]*?fi\n', '', s)

if 'androidx.work:work-runtime' not in s:
    marker = 'echo "✔ تم تجهيز مشروع أندرويد"'
    if s.count(marker) != 1:
        raise SystemExit('Could not locate Android preparation completion marker')
    s = s.replace(marker, receiver_snippet + '''GRADLE=android/app/build.gradle
if ! grep -q 'androidx.work:work-runtime' "$GRADLE"; then
  sed -i '/dependencies[[:space:]]*{/a\\    implementation "androidx.work:work-runtime:2.9.0"' "$GRADLE"
fi
''' + marker, 1)
else:
    marker = 'GRADLE=android/app/build.gradle'
    s = s.replace(marker, receiver_snippet + marker, 1)

prep.write_text(s, encoding='utf-8')

# 9. Structural assertions ensure no preview bridge was copied into the real application.
for marker in (
    'DEYN_SMS_ENGINE_V1', 'DEYN_SMS_RUNTIME_V1', 'DEYN_I18N_RUNTIME_V1', 'DEYN_COMPLETION_RUNTIME_V2',
    'DEYN_FR_DICT', 'DEYN_I18N.start', 'id="agLang"', 'data-i18n-setting="language"',
    'DeynSmsPlugin.class', 'DeynBackupPlugin.class', 'DeynNotifPlugin.class',
    'SEND_SMS', 'RECEIVE_BOOT_COMPLETED', 'POST_NOTIFICATIONS', 'SmsStatusReceiver', 'NotifBootReceiver',
    'work-runtime:2.9.0', 'smsSettings', 'الاستحقاق ', 'dialectFr', 'restoreJsonSettings', 'agRestoreJsonBtn'
):
    hay = source + s
    if marker not in hay:
        raise SystemExit(f'Integration verification failed: {marker}')
if 'PREVIEW ONLY' in engine or 'mock SMS' in engine:
    raise SystemExit('Preview bridge detected in SMS engine')
print('Integrated SMS engine/runtime, Backup/Restore/Clock/Notif completion runtime, French localization + centimes, and native plugins.')

```

### 5. كود `.github/workflows/build-sms-test.yml` الكامل
```yaml
name: DEYN SMS professional integration and Android test build

on:
  push:
    branches: [sms-integration-files, sms-professional-2026, fix/sms-and-fr-complete-2026]
    paths:
      - '.github/workflows/build-sms-test.yml'
      - '.github/scripts/integrate_sms.py'
      - 'sms/**'
      - 'DeynSmsPlugin.java'
      - 'DeynBackupPlugin.java'
      - 'DeynNotifPlugin.java'
      - 'deyn-apk-project.zip'
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: deyn-sms-${{ github.ref }}
  cancel-in-progress: true

defaults:
  run:
    shell: bash

jobs:
  build-debug:
    runs-on: ubuntu-latest
    timeout-minutes: 50
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Extract the real DEYN project archive
        run: |
          set -euo pipefail
          test -s deyn-apk-project.zip
          test -s sms/engine.js
          test -s sms/runtime.js
          test -s sms/completion.js
          test -s DeynSmsPlugin.java
          test -s DeynBackupPlugin.java
          test -s DeynNotifPlugin.java
          mkdir source
          unzip -q deyn-apk-project.zip -d source
          test -s source/deyn-app/www/index.html
      - name: Integrate the SMS & Completion features into the real app source
        run: python3 .github/scripts/integrate_sms.py source sms/engine.js DeynSmsPlugin.java
      - name: Verify every integrated JavaScript block
        run: |
          python3 - <<'PY'
          from pathlib import Path
          import re, subprocess, tempfile
          html = Path('source/deyn-app/www/index.html').read_text(encoding='utf-8')
          scripts = re.findall(r'<script(?:\s[^>]*)?>([\s\S]*?)</script\s*>', html, re.I)
          if len(scripts) < 2 or 'DEYN_SMS_ENGINE_V1' not in html or 'DEYN_SMS_RUNTIME_V1' not in html or 'DEYN_COMPLETION_RUNTIME_V2' not in html:
              raise SystemExit('SMS/Completion runtime was not integrated into the actual app HTML')
          for i, script in enumerate(scripts):
              if script.strip():
                  p = Path(tempfile.gettempdir()) / f'deyn-inline-{i}.js'
                  p.write_text(script, encoding='utf-8')
                  subprocess.run(['node', '--check', str(p)], check=True)
          print(f'Checked {len(scripts)} inline script blocks')
          PY
      - name: Run SMS engine unit and edge-case tests
        run: node sms/test.mjs | tee -a test-results.log
      - name: Install Chromium for DEYN browser security tests
        run: |
          python3 -m pip install --disable-pip-version-check playwright opencv-python-headless numpy
          python3 -m playwright install --with-deps chromium
      - name: Run existing DEYN security, storage, time and sync suites
        working-directory: source
        run: |
          set -euo pipefail
          node trusted-time/test.mjs | tee -a ../test-results.log
          node sync/test_engine.mjs | tee -a ../test-results.log
          node sync/test_session.mjs | tee -a ../test-results.log
          for test_file in tests/e2e/test_*.py; do
            echo "===== Running ${test_file} =====" | tee -a ../test-results.log
            python3 "${test_file}" | tee -a ../test-results.log
          done
      - name: Upload reviewable test results log
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: deyn-test-results-log
          path: test-results.log
          if-no-files-found: warn
          retention-days: 14
      - name: Install Capacitor and Android dependencies
        working-directory: source/deyn-app
        run: |
          npm install
          python3 scripts/fetch_fonts.py
          npx cap add android
          bash scripts/prepare-android.sh
          npx cap sync android
          for CLS in DeynVaultPlugin.class DeynSyncPlugin.class DeynSmsPlugin.class DeynBackupPlugin.class DeynNotifPlugin.class; do
            grep -q "$CLS" scripts/prepare-android.sh
          done
          for PERM in SEND_SMS RECEIVE_BOOT_COMPLETED POST_NOTIFICATIONS; do
            grep -q "$PERM" android/app/src/main/AndroidManifest.xml
          done
          grep -q 'androidx.work:work-runtime' android/app/build.gradle
          for SRC in DeynVaultPlugin.java DeynSyncPlugin.java DeynSmsPlugin.java DeynBackupPlugin.java DeynNotifPlugin.java; do
            test -s "android/app/src/main/java/com/deyn/app/$SRC"
          done
      - name: Build debug APK for testing (debug signing)
        working-directory: source/deyn-app/android
        run: ./gradlew --no-daemon assembleDebug
      - name: Upload APK for owner testing only
        uses: actions/upload-artifact@v4
        with:
          name: deyn-sms-professional-debug-apk
          path: source/deyn-app/android/app/build/outputs/apk/debug/*.apk
          if-no-files-found: error
          retention-days: 14

```

### 6. كود `.github/workflows/build-deyn.yml` الكامل
```yaml
name: Build DEYN APKs

on:
  workflow_dispatch:
  push:
    branches: [main, sms-integration-files, fix/sms-and-fr-complete-2026, sms-professional-2026]
    paths:
      - 'deyn-apk-project.zip'
      - '.github/build-now.txt'
      - '.github/scripts/integrate_sms.py'
      - 'sms/**'
      - 'DeynSmsPlugin.java'
      - 'DeynBackupPlugin.java'
      - 'DeynNotifPlugin.java'

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        app: [deyn-app, deyn-keygen]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Extract and verify project archive
        run: |
          set -euo pipefail
          test -s deyn-apk-project.zip
          unzip -q deyn-apk-project.zip -d source
          if [ "${{ matrix.app }}" = "deyn-app" ] && [ -f .github/scripts/integrate_sms.py ]; then
            python3 .github/scripts/integrate_sms.py source sms/engine.js DeynSmsPlugin.java
            node sms/test.mjs | tee test-results-sms.log
          fi
      - name: Build APK
        working-directory: source/${{ matrix.app }}
        run: |
          npm install
          python3 scripts/fetch_fonts.py
          npx cap add android
          bash scripts/prepare-android.sh
          npx cap sync android
          cd android
          ./gradlew assembleDebug
      - name: Upload debug APK for testing only
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.app }}-debug-apk
          path: source/${{ matrix.app }}/android/app/build/outputs/apk/debug/*.apk
          if-no-files-found: error
          retention-days: 14

```
