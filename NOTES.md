# إصلاح موعد الاستحقاق (DEYN)

## الملفات
- `index.html` : النسخة النهائية، مبنية على `index.html` من `deyn.apk` الأخير + الإصلاح.
- `apply_due_fix.py` : نفس الإصلاح كسكريبت. يُشغَّل بعد `integrate_sms.py` حتى لا يضيع الإصلاح إذا أُعيد توليد الملف من نسخة أقدم.
- `due-fix.patch` : الفرق بين نسخة الـ APK ونسخة الإصلاح.
- `tests/` : اختبارات المحرك (Node) واختبارات الواجهة (Playwright، عربي وفرنسي).

## في الـ workflow (بعد خطوة integrate_sms.py)
    python3 apply_due_fix.py android/app/src/main/assets/public/index.html   # أو www/index.html قبل cap sync
    node tests/test_due_fix.mjs <مسار index.html>
السكريبت يتوقف بخطأ واضح إذا لم يجد الموضع المطلوب، ولا يطبق نصف التعديل.

## القاعدة الجديدة
الشاشة ونظام SMS يستعملان الآن نفس موعد الدين (`dueAt` لأقدم دين مفتوح).
