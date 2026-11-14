# ربط ميزة SMS بتطبيق الأندرويد (Capacitor)

1. انسخ `DeynSmsPlugin.java` إلى `android/app/src/main/java/<package>/` وعدّل اسم الـ package في أول سطر.
2. في `MainActivity.java` سجّل الـ plugin قبل `super.onCreate`:
   `registerPlugin(DeynSmsPlugin.class);`
3. في `AndroidManifest.xml` أضف:
   `<uses-permission android:name="android.permission.SEND_SMS" />`
4. في `android/app/build.gradle` داخل dependencies:
   `implementation "androidx.work:work-runtime:2.9.0"`
5. `npx cap sync android` ثم ابنِ الـ APK.

ملاحظة: على بعض الهواتف (Xiaomi, Huawei, Oppo...) يجب إزالة قيود توفير البطارية عن التطبيق حتى تعمل الرسائل المجدولة والتطبيق مغلق.
