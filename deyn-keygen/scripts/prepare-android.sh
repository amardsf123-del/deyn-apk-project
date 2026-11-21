#!/usr/bin/env bash
# يُشغَّل بعد: npx cap add android   (وبعد كل إعادة مزامنة)
set -euo pipefail
cd "$(dirname "$0")/.."
RES=android/app/src/main/res
MAN=android/app/src/main/AndroidManifest.xml
[ -d "$RES" ] || { echo "شغّل 'npx cap add android' أولاً"; exit 1; }

# 1) الأيقونات (أيقونة عادية + دائرية + تكيفية)
rm -f $RES/mipmap-*/ic_launcher*.png $RES/mipmap-anydpi-v26/ic_launcher*.xml
cp -r android-res/mipmap-* $RES/

# 2) شاشة البداية: نفس الصورة في كل الكثافات الموجودة
find $RES -name "splash.png" -exec cp android-res/drawable/splash.png {} \;

# 3) منع النسخ الاحتياطي التلقائي لبيانات الترخيص + منع http غير مشفّر
if ! grep -q 'android:allowBackup="false"' "$MAN"; then
  sed -i 's/android:allowBackup="true"/android:allowBackup="false"/' "$MAN"
fi
if ! grep -q 'usesCleartextTraffic' "$MAN"; then
  sed -i '0,/<application/s//<application android:usesCleartextTraffic="false"/' "$MAN"
fi
echo "✔ تم تجهيز مشروع أندرويد"
