# DEYN recovery-mode screen specification

**Status:** design only; not integrated into the Android app.

## Entry conditions

The app must distinguish these startup outcomes before it initializes normal state:

- **New installation:** the storage key `deyn.v1` is genuinely absent (`getItem()` returns `null`). Only this case may proceed to the first-install seed.
- **Existing valid data:** JSON parses and the required schema is valid. Load the existing object without rewriting it during the inspection step.
- **Recovery required:** the key exists but its value is malformed, has an invalid schema, or has an unexpected type. Preserve the original value exactly.
- **Storage unavailable:** reading storage throws or storage cannot be accessed. Block startup; never interpret this as a new installation.

## Recovery screen copy (Arabic)

**Title:** تعذّر فتح بيانات التطبيق

**Message:** وجدنا بيانات محفوظة، لكن تعذّر قراءتها بالشكل الصحيح. لحماية سجلات الديون، أوقفنا تشغيل التطبيق مؤقتًا. لم نحذف البيانات ولم نستبدلها ببيانات تجريبية.

**Primary action:** حفظ نسخة من البيانات المتضررة

**Before export warning:** قد تحتوي النسخة على أسماء الزبائن ومبالغ الديون ومعلومات حساسة. احفظها في مكان خاص ولا ترسلها لأي شخص.

**After export:** تم تجهيز محتوى النسخة للتصدير. تأكد من حفظ الملف قبل إغلاق هذه الشاشة.

**Secondary information:** لا تحذف بيانات التطبيق ولا تمسح مساحة التخزين المؤقت أو بياناته. لا تعِد تثبيت التطبيق قبل حفظ نسخة من البيانات.

For a storage-read failure (where the raw value cannot be obtained), show instead:

**Title:** تعذّر الوصول إلى مساحة التخزين

**Message:** لم نتمكن من قراءة مساحة التخزين. لم نعتبر الجهاز تثبيتًا جديدًا، وأوقفنا التشغيل لتجنب إنشاء بيانات جديدة فوق بياناتك.

## Strict behavior while in recovery mode

- Do not call the normal app initializer.
- Do not call `seed()`, `persist()`, or any routine that writes `deyn.v1`.
- Do not clear localStorage, reset the app, or delete activation data.
- Do not offer backup import/restore yet. Import requires a separate validated parser, preview, compatibility rules, and rollback plan.
- Keep the exact raw string in memory for the current recovery session only.
- Offer raw export only after an explicit tap and a clear privacy warning.
- Do not automatically upload, email, share, or transmit the data.
- If storage read failed, do not claim an export is possible.
- Do not change the factory password `fcb1899` or owner/worker behavior as part of this recovery flow.

## Export implementation gate

The prototype returns the exact raw string but deliberately does not implement a browser download. Before app integration, test the chosen export method on the actual Android 13 phone and Capacitor WebView. Verify:
1. a file is actually created and visible to the user;
2. the file content matches the original raw string exactly (including whitespace and final newline);
3. the app reports success only after the platform confirms the save/share operation;
4. the user sees the sensitive-data warning before export;
5. export does not modify `deyn.v1`.

If the platform download API is unreliable, use a supported Capacitor Filesystem/share flow and verify it on-device. Do not silently fall back to copying data to an untrusted remote service.

## Exit from recovery mode

There is no “continue anyway” button. Recovery mode can only be exited after a separately validated recovery procedure is implemented. Until then, preserve the original value and keep normal writes disabled.

## Prototype tests

The pure controller tests cover absent key, valid existing record, malformed JSON, invalid schema, storage read exceptions, blocked actions, explicit raw export, invalid session creation, and unexpected value types. They do not test Android UI, file export, or restoration.
