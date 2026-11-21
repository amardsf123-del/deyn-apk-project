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

# 3b) شريط الحالة بنفس لون ترويسة التطبيق (#065043) وخلفية النافذة كذلك، فلا يظهر شريط رمادي فوق التطبيق
python3 - "$RES/values/styles.xml" <<'PY_EOF'
import re, sys
p = sys.argv[1]
s = open(p, encoding="utf-8").read()
if "DEYN system bars" not in s:
    m = re.search(r'(<style\s+name="AppTheme\.NoActionBar"[^>]*>)(.*?)(</style>)', s, re.S)
    if not m:
        sys.exit("AppTheme.NoActionBar not found in styles.xml")
    add = ('\n        <!-- DEYN system bars -->'
           '\n        <item name="android:statusBarColor">#065043</item>'
           '\n        <item name="android:windowBackground">#065043</item>'
           '\n        <item name="android:windowLightStatusBar">false</item>\n    ')
    s = s[:m.end(2)] + add + s[m.end(2):]
    open(p, "w", encoding="utf-8").write(s)
PY_EOF

# 4) إضافات Capacitor الأصلية (DeynVault = Keystore، DeynSync = مقابس TCP للمزامنة) + تسجيلها في MainActivity
JAVA=android/app/src/main/java/com/deyn/app
mkdir -p "$JAVA"
cp native/*.java "$JAVA/"
cat > "$JAVA/MainActivity.java" <<'JAVA_EOF'
package com.deyn.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DeynVaultPlugin.class);
        registerPlugin(DeynSyncPlugin.class);
        registerPlugin(DeynNotifPlugin.class);
        registerPlugin(DeynBackupPlugin.class);
        registerPlugin(DeynSmsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
JAVA_EOF

# 5) صلاحيات الشبكة المحلية والكاميرا لمسح QR (تُضاف مرة واحدة)
MANIFEST=android/app/src/main/AndroidManifest.xml
for P in ACCESS_NETWORK_STATE ACCESS_WIFI_STATE CAMERA SEND_SMS RECEIVE_BOOT_COMPLETED POST_NOTIFICATIONS; do
  grep -q "android.permission.$P" "$MANIFEST" || sed -i "s#<application#<uses-permission android:name=\"android.permission.$P\" />\n    <application#" "$MANIFEST"
done
if ! grep -q 'DeynSmsPlugin\$SmsStatusReceiver' "$MANIFEST"; then
  sed -i 's#</application>#    <receiver android:name="com.deyn.app.DeynSmsPlugin$SmsStatusReceiver" android:exported="false">\n            <intent-filter>\n                <action android:name="com.deyn.app.SMS_SENT" />\n                <action android:name="com.deyn.app.SMS_DELIVERED" />\n            </intent-filter>\n        </receiver>\n        <receiver android:name="com.deyn.app.DeynSmsPlugin$SmsBootReceiver" android:exported="true">\n            <intent-filter>\n                <action android:name="android.intent.action.BOOT_COMPLETED" />\n                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />\n            </intent-filter>\n        </receiver>\n        <receiver android:name="com.deyn.app.DeynNotifPlugin$NotifBootReceiver" android:exported="true">\n            <intent-filter>\n                <action android:name="android.intent.action.BOOT_COMPLETED" />\n                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />\n            </intent-filter>\n        </receiver>\n    </application>#' "$MANIFEST"
elif ! grep -q 'DeynNotifPlugin\$NotifBootReceiver' "$MANIFEST"; then
  sed -i 's#</application>#    <receiver android:name="com.deyn.app.DeynNotifPlugin$NotifBootReceiver" android:exported="true">\n            <intent-filter>\n                <action android:name="android.intent.action.BOOT_COMPLETED" />\n                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />\n            </intent-filter>\n        </receiver>\n    </application>#' "$MANIFEST"
fi
GRADLE=android/app/build.gradle
if ! grep -q 'androidx.work:work-runtime' "$GRADLE"; then
  sed -i '/dependencies[[:space:]]*{/a\    implementation "androidx.work:work-runtime:2.9.0"' "$GRADLE"
fi
echo "✔ تم تجهيز مشروع أندرويد"
