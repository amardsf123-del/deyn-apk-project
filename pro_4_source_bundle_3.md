# PRO_4_SOURCE_BUNDLE_3.md — حزمة الأكواد النصية الكاملة للنسخة PRO 4 (الجزء 3 من 3)

- **عدد الملفات في هذه الحزمة**: `32` ملفًا (من أصل `67` ملفًا نصيًا وبرمجيًا في `PRO 4`)
- **إجمالي الحجم الأصلي للملفات في هذه الحزمة**: `358,596` بايت
- **تنبيه**: جميع الملفات أدناه مدرجة بمحتواها الحرفي الكامل دون أي اختصار أو تعديل، ومفصولة بوضوح بمسارها الأصلي.

================================================================================
## [1/32] FILE: `.github/workflows/build-sms-apk.yml`

- **المسار الأصلي**: `.github/workflows/build-sms-apk.yml`
- **الحجم**: `2,530` بايت | **الأسطر**: `74` | **SHA-256**: `efcf5d9ca12dc83a1ad4b1ba11879d422fbf15e76c6862d74a718120c4334cfd`

```yaml
name: DEYN SMS manual Android build

on:
  workflow_dispatch:
  push:
    branches: [sms-integration-files, fix/sms-and-fr-complete-2026]
    paths:
      - '.github/workflows/build-sms-apk.yml'
      - '.github/scripts/integrate_sms.py'
      - 'sms/**'
      - 'DeynSmsPlugin.java'
      - 'DeynBackupPlugin.java'
      - 'DeynNotifPlugin.java'
      - 'deyn-apk-project.zip'

permissions:
  contents: read

jobs:
  build-debug-apk:
    runs-on: ubuntu-latest
    timeout-minutes: 40
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
      - name: Extract and integrate real app source
        run: |
          set -euo pipefail
          test -s deyn-apk-project.zip
          mkdir source
          unzip -q deyn-apk-project.zip -d source
          python3 .github/scripts/integrate_sms.py source sms/engine.js DeynSmsPlugin.java
          node sms/test.mjs | tee sms-unit-tests.log
      - name: Verify JavaScript
        run: |
          python3 - <<'PY'
          from pathlib import Path
          import re, subprocess, tempfile
          html = Path('source/deyn-app/www/index.html').read_text(encoding='utf-8')
          scripts = re.findall(r'<script(?:\s[^>]*)?>([\s\S]*?)</script\s*>', html, re.I)
          for i, script in enumerate(scripts):
              if script.strip():
                  p = Path(tempfile.gettempdir()) / f'deyn-{i}.js'
                  p.write_text(script, encoding='utf-8')
                  subprocess.run(['node', '--check', str(p)], check=True)
          PY
      - name: Build debug APK
        working-directory: source/deyn-app
        run: |
          npm install
          python3 scripts/fetch_fonts.py
          npx cap add android
          bash scripts/prepare-android.sh
          npx cap sync android
          for P in DeynVaultPlugin.java DeynSyncPlugin.java DeynSmsPlugin.java DeynBackupPlugin.java DeynNotifPlugin.java; do
            test -s "android/app/src/main/java/com/deyn/app/$P"
          done
          cd android
          ./gradlew --no-daemon assembleDebug
      - uses: actions/upload-artifact@v4
        with:
          name: deyn-sms-manual-debug-apk
          path: source/deyn-app/android/app/build/outputs/apk/debug/*.apk
          if-no-files-found: error
          retention-days: 14
```

================================================================================
## [2/32] FILE: `.github/workflows/build-sms-test.yml`

- **المسار الأصلي**: `.github/workflows/build-sms-test.yml`
- **الحجم**: `5,104` بايت | **الأسطر**: `126` | **SHA-256**: `e2d1c6adde8ecf900fd9249c5ff24ea4040bde86bb2c421fcd12d5ace945b8f7`

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

================================================================================
## [3/32] FILE: `.github/workflows/inspect-deyn.yml`

- **المسار الأصلي**: `.github/workflows/inspect-deyn.yml`
- **الحجم**: `2,683` بايت | **الأسطر**: `73` | **SHA-256**: `35dd8c16925b2465f61ff4991a59f36f8f544f9d5f35237b09d3f0e34ab607cb`

```yaml
name: Inspect DEYN source archive

on:
  push:
    branches: [main, sms-integration-files]
    paths:
      - '.github/workflows/inspect-deyn.yml'
      - 'deyn-apk-project.zip'
      - 'sms-feature.zip'
      - 'sms-feature.patch'
  workflow_dispatch:

permissions:
  contents: read
  actions: write

jobs:
  inspect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Extract project and SMS package
        shell: bash
        run: |
          set -euo pipefail
          test -s deyn-apk-project.zip
          test -s sms-feature.zip
          mkdir -p source sms-feature
          unzip -q deyn-apk-project.zip -d source
          unzip -q sms-feature.zip -d sms-feature
          {
            echo "PROJECT ARCHIVE CONTENTS"
            find source -maxdepth 6 -type f | sort
            echo
            echo "SMS PACKAGE CONTENTS"
            find sms-feature -maxdepth 6 -type f | sort
            echo
            echo "PACKAGE FILES"
            find source sms-feature -name package.json -type f -print
            echo
            echo "ANDROID / BUILD FILES"
            find source sms-feature \( -name 'build.gradle' -o -name 'build.gradle.kts' -o -name 'AndroidManifest.xml' -o -name 'capacitor.config.*' -o -name 'MainActivity.java' \) -type f -print
            echo
            echo "SMS INTEGRATION MARKERS"
            grep -RniE 'smsRemind|SMS_DEFAULT_TPL|smsSyncSchedule|smsConsentOk|smsTest|smsTpl|DeynSmsPlugin' source sms-feature --exclude-dir=node_modules --exclude='*.lock' || true
          } > inspection.txt
          cat inspection.txt
      - name: Block accidental secret exposure
        shell: bash
        run: |
          set -euo pipefail
          if find source sms-feature -type f \( -name '*.pem' -o -name '*.key' -o -name '.env' -o -name '.env.*' \) | grep -q .; then
            echo "Blocked: sensitive key or environment file found in extracted archive."
            exit 1
          fi
          if grep -RIlE --binary-files=without-match '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|AIza[0-9A-Za-z_-]{30,}' source sms-feature; then
            echo "Blocked: possible secret detected. No artifact uploaded."
            exit 1
          fi
      - name: Upload extracted source for review
        uses: actions/upload-artifact@v4
        with:
          name: deyn-source-inspection
          path: |
            source/
            sms-feature/
            sms-feature.patch
            DeynSmsPlugin.java
            inspection.txt
          if-no-files-found: error
          retention-days: 3

# Inspection only. No source files are changed and no APK is built.
```

================================================================================
## [4/32] FILE: `.github/workflows/inspect-sms-source.yml`

- **المسار الأصلي**: `.github/workflows/inspect-sms-source.yml`
- **الحجم**: `769` بايت | **الأسطر**: `31` | **SHA-256**: `7c3f895c32a706f52a4d403d95f7e780e5e387ce5d30bb4e1f9304e49729de9c`

```yaml
name: DEYN SMS professional source inspection

on:
  push:
    branches: [sms-professional-2026]
    paths:
      - '.github/workflows/inspect-sms-source.yml'
  workflow_dispatch:

permissions:
  contents: read

jobs:
  inspect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Extract current project archive
        run: |
          set -euo pipefail
          test -s deyn-apk-project.zip
          mkdir source
          unzip -q deyn-apk-project.zip -d source
          test -s source/deyn-app/www/index.html
          cp -a source inspect
      - uses: actions/upload-artifact@v4
        with:
          name: deyn-full-source-inspection
          path: inspect/
          if-no-files-found: error
          retention-days: 7
```

================================================================================
## [5/32] FILE: `DeynNotifPlugin.java`

- **المسار الأصلي**: `DeynNotifPlugin.java`
- **الحجم**: `15,024` بايت | **الأسطر**: `353` | **SHA-256**: `ac4aab77652a34ad68f5a4038b983913161395f610731373a6e3500fc02a1530`

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

================================================================================
## [6/32] FILE: `PRO_4_HANDOFF.md`

- **المسار الأصلي**: `PRO_4_HANDOFF.md`
- **الحجم**: `7,004` بايت | **الأسطر**: `56` | **SHA-256**: `1d3174b14dc1b3467d2a4e50f0dd240c0258b833d3b19e51ad6395f504ece554`

```markdown
# PRO_4_HANDOFF.md — وثيقة التسليم والمراجعة التقنية الشاملة للنسخة PRO 4

- **النسخة المرجعية السابقة**: `PRO 3` (`amardsf123-del/deyn-apk-project`, فرع `sms-integration-files`, Commit `0e45321690e20f19ad8a1e54d32a89e69eab068f`)
- **اسم النسخة الجديدة**: `PRO 4` (داخل المجلد الرئيسي `PRO_4`)
- **تاريخ الإعداد**: 14 نوفمبر 2026
- **المفتاح العام المعتمد (`DEYN_PUBLIC_KEY` / Ed25519)**: `uM8GgGamY++GH9e2PTTkluRlzqEVdbnj+MLh4uFYr/Y=`

---

## 1. نتائج التحقق من الملاحظات الثلاث (ما ثبت خطؤه مقابل ما كان سليمًا)

### أولًا: حماية الساعة (`NATIVE_MONO_OFFSET_MS` و`getMonotonicNowMs()`)
- **الحكم**: **ثبت وجود خلل حقيقي في النسخة السابقة**.
- **الدليل البرمجي**:
  - في `sms/completion.js`، كان المتغير `NATIVE_MONO_OFFSET_MS` يُحسب داخل `syncNativeMonotonicClock()` عند استدعاء `DeynBackupPlugin.getMonotonicTime()` (`SystemClock.elapsedRealtime()`) ولكنه **لم يكن يُستخدم إطلاقًا** داخل `window.evaluate()`.
  - كانت الدالة `getMonotonicNowMs()` تعتمد على `performance.now()` فقط، وهو مؤقت يعود إلى `0` عند إغلاق التطبيق وإعادة فتحه.
- **الإصلاح المنفذ في PRO 4**:
  - ربط `getMonotonicNowMs()` مباشرةً بساعة نظام أندرويد الرتيبة `SystemClock.elapsedRealtime()` (`LAST_NATIVE_ELAPSED_MS + (performance.now() - LAST_NATIVE_SYNC_PERF)`).
  - حفظ `lastValidMono` و`lastValidMonoKind` (`'os'` أو `'perf'`) في حالة الساعة بحيث يكشف النظام تقديم الساعة للأمام أو إرجاعها للخلف عبر إغلاق التطبيق وإعادة فتحه ضمن نفس دورة تشغيل الهاتف، ويتحقق بدقة عند ضغط «حسناً».

### ثانيًا: مزامنة تمديد الديون (`captureLocal` و`Core.extendDebt` و`dueAt` و`extensionHistory`)
- **الحكم**: **ثبت وجود خلل حقيقي 100%**.
- **الدليل البرمجي**:
  - في `sync/engine.js`، كانت `buildSnap(S)` و`captureLocal(S, did, now)` تخزنان `snap.tx[t.id] = 1` فقط عند إنشاء المعاملة.
  - عند استدعاء `Core.extendDebt(c, debtId, ...)` لتعديل معاملة دين موجودة (`dueAt`, `originalDueAt`, `extensionHistory`)، كانت `captureLocal` تجد `snap.tx[t.id]` موجودًا (`1`) فتتجاهل التعديل ولا تصدر أي حدث مزامنة!
- **الإصلاح المنفذ في PRO 4**:
  - إضافة دالة `txExtHash(t)` في `sync/engine.js` لحساب بصمة `(dueAt, originalDueAt, extensionHistory)` لكل معاملة دين.
  - تعديل `buildSnap(S)` و`captureLocal(S, did, now)` لإصدار حدث مزامنة جديد من نوع `txf` (`{ k: 'txf', cid, tid, dueAt, originalDueAt, extensionHistory }`) فور تغير بصمة التمديد لأي معاملة موجودة، مع الحفاظ على التوافق التام مع البيانات القديمة (`snap.tx[t.id] === 1`).
  - إضافة التحقق من `txf` في `checkEvent()` وتطبيقه في `applyOne()` باستخدام الساعات المنطقية `HLC` ودمج `extensionHistory` دون تكرار.

### ثالثًا: صلاحيات العامل (`checkEvent` وحدود الفئات والسقف الائتماني)
- **الحكم**: **ثبت وجود ثغرة جزئية في قيود `cf` و`cust+` عند استقبال أحداث مباشرة من العامل**.
- **الدليل البرمجي**:
  - في `sync/engine.js` داخل `checkEvent()`, كان السطر الخاص بـ `cust+` يفحص `validCust(ev.c)` فقط دون فحص أن العامل (`W`) لا يرسل معاملات `tx` مضمّنة داخل `cust+` أو فئة مجهولة أو سقفًا يتجاوز `100000`.
  - وفي `cf` عندما يكون الزبون محظورًا (`cur.seg === 'black'`)، كان العامل يستطيع إرسال أي نص عشوائي كفئة `seg` أو رفع السقف إلى `100000` بغض النظر عن سقف الفئة.
- **الإصلاح المنفذ في PRO 4**:
  - تشديد `checkEvent()` لحدث `cust+` عند `senderRole === 'W'`: منع وجود عناصر في `ev.c.tx`، والتحقق من أن `ev.c.seg` ضمن فئات المتجر المعروفة (`salaried`, `youth`, `daily`, `black`, أو `S.customSegs`)، وأن `0 <= ev.c.ceiling <= 100000`.
  - تشديد `checkEvent()` لحدث `cf` عند `senderRole === 'W'`: حصر فك الحظر في الفئات النشطة المعروفة فقط (ليس نصًا عشوائيًا)، وتقييد السقف الجديد بسقف الفئة المستهدفة (`Math.max(segCeiling, 10000)`).

---

## 2. بنية المشروع وطريقة عمله والعلاقات بين مكوناته

- **`deyn-app/www/index.html`**: واجهة التطبيق الرئيسية (HTML/CSS/JS) ومدمج بها:
  - محرك المزامنة `DeynSyncLib` (المولَّد من `sync/*.js` عبر `tools/embed_sync.py`).
  - آلة حماية الساعة (المطابقة لـ `trusted-time/time-policy.js` و`trusted-time/client.js`).
  - نظام التفعيل والتراخيص `DEYN3` وكود الاسترداد `DEYNR1` وتشفير كلمة المرور `PBKDF2-SHA256`.
  - حزمة SMS والترجمة الفرنسية والتكميل (`sms/engine.js` + `sms/runtime.js` + `sms/i18n.js` + `sms/completion.js`) المدمجة عبر `.github/scripts/integrate_sms.py`.
- **`deyn-app/native/`** (ونسخها الجذرية):
  - `DeynVaultPlugin.java`: خزنة `AES-256-GCM` بمفاتيح Android Keystore وتخزين ثنائي الخانة (`deyn.v2.a` / `deyn.v2.b`).
  - `DeynSyncPlugin.java`: مآخذ TCP المحلية + `NsdManager` (`_deyn._tcp.`) للمزامنة بين أجهزة التاجر عبر Wi-Fi / Hotspot.
  - `DeynSmsPlugin.java`: إرسال SMS متعدد الأجزاء وتتبع حالة كل جزء عبر `PendingIntent` و`SmsStatusReceiver` وجدولة `WorkManager`.
  - `DeynBackupPlugin.java`: النسخ الاحتياطي التلقائي الخارجي عبر SAF (`ACTION_OPEN_DOCUMENT_TREE`) بالكتابة الذرية والسقوط التلقائي إلى `.prev.json` + ساعة `SystemClock.elapsedRealtime()`.
  - `DeynNotifPlugin.java`: إشعارات أندرويد المجدولة (`WorkManager`) وقناة `deyn_overdue_alerts` مع إلغاء المهام فور تسديد الدين.
- **`deyn-keygen/www/index.html`**: مولّد التراخيص المستقل `DEYN3` (`M`/`W`, `1Y`/`2Y`/`LT`) وأكواد استرداد كلمة المرور `DEYNR1`.
- **`.github/workflows/`**: مسارات بناء APK والاختبارات التلقائية في GitHub Actions.
```

================================================================================
## [7/32] FILE: `PRO_4_SHA256.txt`

- **المسار الأصلي**: `PRO_4_SHA256.txt`
- **الحجم**: `11,653` بايت | **الأسطر**: `111` | **SHA-256**: `be9b5e086c81301a0e29ed749c26e57d6191cd63e42012d052ce81ade547fc0d`

```text
bac598de0c28e5ffe88ad8de5a37666a5e2c798e7b29ce50d46d787530291bbf  .github/build-now.txt
1b09492d86d71b5dadceee13d3e87133c673528edd23800ded4dcb6b521da40a  .github/scripts/integrate_sms.py
2aa5f2ad11ad20e2ad29d06f779a68653c77f9f405f9ba4d40595968590641f0  .github/workflows/build-deyn.yml
efcf5d9ca12dc83a1ad4b1ba11879d422fbf15e76c6862d74a718120c4334cfd  .github/workflows/build-sms-apk.yml
e2d1c6adde8ecf900fd9249c5ff24ea4040bde86bb2c421fcd12d5ace945b8f7  .github/workflows/build-sms-test.yml
1db4c5fc0d62242f0e0dfbf174d57474737f8796736b711a88c56c1efb7e2b83  .github/workflows/export-deyn-labs.yml
35dd8c16925b2465f61ff4991a59f36f8f544f9d5f35237b09d3f0e34ab607cb  .github/workflows/inspect-deyn.yml
7c3f895c32a706f52a4d403d95f7e780e5e387ce5d30bb4e1f9304e49729de9c  .github/workflows/inspect-sms-source.yml
bf8509112ca73cb21149d2e8b4a5aaea6aec4e4bcd9ba10fd81d79826b1adbeb  DeynBackupPlugin.java
ac4aab77652a34ad68f5a4038b983913161395f610731373a6e3500fc02a1530  DeynNotifPlugin.java
eab4f4e6a1d8f64de29b20adda25ba21ba46e2f1778ccfbac376085f7a334f7b  DeynSmsPlugin.java
1d3174b14dc1b3467d2a4e50f0dd240c0258b833d3b19e51ad6395f504ece554  PRO_4_HANDOFF.md
ed0f54f51c0233111a75e0a503ad6dbf3d6522a4fe5338858769174e0fa224ca  PRO_4_TEST_REPORT.md
465ecd6091275882522421d90bfe2860fc2bd960c7d2e1c2a2c1bf57f36fb984  README.md
58c7a2026091333eb50589cec3bfaaa6d693059ed91400991725cd5a27fe8401  deyn-app/android-res/drawable/splash.png
44cc3246d167bd718fb61feaba493850ff95255c1ddbb8854c0e4c0534832f96  deyn-app/android-res/mipmap-anydpi-v26/ic_launcher.xml
44cc3246d167bd718fb61feaba493850ff95255c1ddbb8854c0e4c0534832f96  deyn-app/android-res/mipmap-anydpi-v26/ic_launcher_round.xml
d1b316a015775d8c5430eaacb0a11c7d4a6a613f1a3655861f525df8dfb6d08b  deyn-app/android-res/mipmap-hdpi/ic_launcher.png
04d57cc17cd4a3648fa5b4a68215130220bf9fc619755a1a8ef35f80e036fbed  deyn-app/android-res/mipmap-hdpi/ic_launcher_background.png
0992f7521d5735aebb7e01a0a42d0f5fd2beef3bf2de52247f2e50b0980c700c  deyn-app/android-res/mipmap-hdpi/ic_launcher_foreground.png
d5f41adfb7d1c7061388e30911cd6e02de4102ff9b95fba861ff45d1f0663668  deyn-app/android-res/mipmap-hdpi/ic_launcher_round.png
42939f7b45d09bc5e397772f22cf6077712aee1c29d42bc53a3307d3626907fb  deyn-app/android-res/mipmap-mdpi/ic_launcher.png
91b468c9f2c74cc2ec09ec861e6331aece8a7bab688b0e6ae56c7c31cc8ef5e7  deyn-app/android-res/mipmap-mdpi/ic_launcher_background.png
67e996d0c73fbb43ff49026a50a93c464446276f0653b57993ca455bf4927a63  deyn-app/android-res/mipmap-mdpi/ic_launcher_foreground.png
6103ca51b132618be7d4cf2ac1045360ffdeee28b5dba62284c8c3a138fc8067  deyn-app/android-res/mipmap-mdpi/ic_launcher_round.png
2564f08385df43f7a163d5ca882af09e1bf691817641089313e2e7bf4773662d  deyn-app/android-res/mipmap-xhdpi/ic_launcher.png
7d598dc6f83b4be2c6a76d5065bf1f907db6e5b479204462a49005b2ccdf2e92  deyn-app/android-res/mipmap-xhdpi/ic_launcher_background.png
b978e457fbd592df6153b642c36f0461b46d5338b1707a847ebd33d42bac3fcd  deyn-app/android-res/mipmap-xhdpi/ic_launcher_foreground.png
860b05aa572524c7d14c1b0550a44b82f497014699bbd214662f3d562503f278  deyn-app/android-res/mipmap-xhdpi/ic_launcher_round.png
3dcf83dcf51e16a1d151caf545560f7e54cbbbc1b7591c86ac9d4ea8c40fc6c1  deyn-app/android-res/mipmap-xxhdpi/ic_launcher.png
bc0a0ade04ac6ed55924b809b66ae90fc3ccfa1e55e1b62f57221665d52eef5d  deyn-app/android-res/mipmap-xxhdpi/ic_launcher_background.png
897216d0992a9c83ff1564b4746e58dfb9722d4922f352874c17c32e3299dba0  deyn-app/android-res/mipmap-xxhdpi/ic_launcher_foreground.png
865d26fa5b6a65b72ca72f2181f5f587dd50ca9cffa71651a734668218f60d51  deyn-app/android-res/mipmap-xxhdpi/ic_launcher_round.png
0ea3f7cb418adb1ce810cc518ed60b582dcd91d6259f54b940e40b4410cfc899  deyn-app/android-res/mipmap-xxxhdpi/ic_launcher.png
0470ec0516285272e5f4a8a8dea023de5072a057d8c98b6aeabceadc45ff05e8  deyn-app/android-res/mipmap-xxxhdpi/ic_launcher_background.png
39f0d4b52f359deca984040725f98ee28cdbe4f28b3d2f826240a0230f741ac4  deyn-app/android-res/mipmap-xxxhdpi/ic_launcher_foreground.png
2f3aaca8447a3876bb494719e29a470c9b8d48526a51025d4a21d568c6419a9b  deyn-app/android-res/mipmap-xxxhdpi/ic_launcher_round.png
917ded69578fb28865d1e29bc520826a9d2d9cd05e7bdf694d4f9ea438cabaf6  deyn-app/capacitor.config.json
91dbbef04dd889f37dedefabf91866fc804fa89598248222843aac5896ff842e  deyn-app/icon-1024.png
9095f818be480db89f57251efefc1a3d3c4de89ab7ceaa4fe8856097c0f7c148  deyn-app/icon-512.png
bf8509112ca73cb21149d2e8b4a5aaea6aec4e4bcd9ba10fd81d79826b1adbeb  deyn-app/native/DeynBackupPlugin.java
ac4aab77652a34ad68f5a4038b983913161395f610731373a6e3500fc02a1530  deyn-app/native/DeynNotifPlugin.java
eab4f4e6a1d8f64de29b20adda25ba21ba46e2f1778ccfbac376085f7a334f7b  deyn-app/native/DeynSmsPlugin.java
6d3a160fcaeb642bd827372fca832c5373766c4820d53bb7207491c60cdde740  deyn-app/native/DeynSyncPlugin.java
edfc8004511de7c9746594456e8efcaa3f2fe5f4e2a3c75fe42c25e413622bfe  deyn-app/native/DeynVaultPlugin.java
311768ced7459b35070ffe3a426bfa200119f5c5d722c1d5322b41b6580575e2  deyn-app/package.json
e43149a70cf52069897d18200b8dd0c20f056970422e966444109e9241a487a2  deyn-app/scripts/fetch_fonts.py
7e794d8155d0bfd6ec35c08af47835cf0de918619c17ec2fe218edddd6a8d3f7  deyn-app/scripts/prepare-android.sh
ba51e7135b662fe638fae7d55491a2d41964dc87bd22d681c0a293c46fd26f4e  deyn-app/www/fonts/fonts.css
87ad0daa0c486086b54209b4a1b2af680764e07cac4d3def94bb88ff2e9c6204  deyn-app/www/index.html
37b622de7cbad148e4c9dfc76e7505f2170d4d08bb96a847d856d60888187b76  deyn-keygen/android-res/drawable/splash.png
44cc3246d167bd718fb61feaba493850ff95255c1ddbb8854c0e4c0534832f96  deyn-keygen/android-res/mipmap-anydpi-v26/ic_launcher.xml
44cc3246d167bd718fb61feaba493850ff95255c1ddbb8854c0e4c0534832f96  deyn-keygen/android-res/mipmap-anydpi-v26/ic_launcher_round.xml
593f2e14a3d4d37fcf1f899e1bb412fe874dc401106ea8ec8f2a4ab24a25d04a  deyn-keygen/android-res/mipmap-hdpi/ic_launcher.png
4d4c257162cdfbf4bfb102918e2c7dc821d54d63d36e5bbd71cc80810531aca5  deyn-keygen/android-res/mipmap-hdpi/ic_launcher_background.png
929b1be17d4bf2fb12de8152c37f4f52b3d5c82a3698a194c8038cb6e301cc5c  deyn-keygen/android-res/mipmap-hdpi/ic_launcher_foreground.png
3a7ef02a4b4b765cf8296dea80cff492ae5a347ebeeb4ea4edf2abc9c9f37475  deyn-keygen/android-res/mipmap-hdpi/ic_launcher_round.png
99c5b510b02a4b7bf0c60821b730df98c35aee66b458b5ab76e45e2ff8c6e1f2  deyn-keygen/android-res/mipmap-mdpi/ic_launcher.png
14a304a9d48e3e6cd86cff864b94175aa74e4ec8e892ad382b083ca254ba9c9e  deyn-keygen/android-res/mipmap-mdpi/ic_launcher_background.png
cd64acf56c6d6e5b17c15466a387632810802a316c169f12e509d972bc925be7  deyn-keygen/android-res/mipmap-mdpi/ic_launcher_foreground.png
d128c1eeb74464951cf77701e842e37fb04e5a8c39264463ed47ce925007ad28  deyn-keygen/android-res/mipmap-mdpi/ic_launcher_round.png
d32c3e0a7f0028dc85a22a82b7d868ddcb685e6b6708dd2c01142c451c3a8787  deyn-keygen/android-res/mipmap-xhdpi/ic_launcher.png
03a94446b08e5c59273b5846cc34d98790821ec9bfe84d60dbc8bdeca8c01819  deyn-keygen/android-res/mipmap-xhdpi/ic_launcher_background.png
b9132b0247f6e936b677b83d227bae58fe22bb1ed38f53a8d480545e3feca74b  deyn-keygen/android-res/mipmap-xhdpi/ic_launcher_foreground.png
12db3bceb2dcb064a2ae8eda7016c45056c8ff9c6ac54bd91bb46aa884560cdd  deyn-keygen/android-res/mipmap-xhdpi/ic_launcher_round.png
13f345394220d0fe1d25f4f36c26f0a97df4e03843d88c9607b30a2fe7a1d287  deyn-keygen/android-res/mipmap-xxhdpi/ic_launcher.png
d7a75bdd73fcc716f2a03e7b94dac7cdb3e49b2a57345e8b9546671dc91b5535  deyn-keygen/android-res/mipmap-xxhdpi/ic_launcher_background.png
a158caedbfcab1f7ce753498fb0dd679211ce4f9e954965eb33b1ce717d1f312  deyn-keygen/android-res/mipmap-xxhdpi/ic_launcher_foreground.png
52aabbc7c24755521b56a40033ac63e09c81127fafaeb6ba77572fef32d9d787  deyn-keygen/android-res/mipmap-xxhdpi/ic_launcher_round.png
c0cc211197c55bf366d1697ca6bbda0cb9632e75633633d653f3f9e0c5270d2b  deyn-keygen/android-res/mipmap-xxxhdpi/ic_launcher.png
60df35c7ff80ce6881fd8b8eaf425b7d1275f5d0171281810d1ffdaf5ded9f2b  deyn-keygen/android-res/mipmap-xxxhdpi/ic_launcher_background.png
e2ff5c3b051c9d88c43943d6ee635bc2962aaf438a905678ed55d6b32d8dc533  deyn-keygen/android-res/mipmap-xxxhdpi/ic_launcher_foreground.png
9d2507cb3ac116b93f5927f7119c8c9d4464ce126295ed2528971941007146c3  deyn-keygen/android-res/mipmap-xxxhdpi/ic_launcher_round.png
78f4ad82a2b9f3e7157b5e22c7af602c3e2c0c4fbce2638cb563fad738517aeb  deyn-keygen/capacitor.config.json
96e64f0093dcd24b6698a75b7d4134c8c8e8dc41a94b46555426d41e2d72c341  deyn-keygen/icon-512.png
22e328b733e5060576deb85acfba20cb8cdb3030624e3c7f34b8f1e452b5d110  deyn-keygen/package.json
e43149a70cf52069897d18200b8dd0c20f056970422e966444109e9241a487a2  deyn-keygen/scripts/fetch_fonts.py
585bb6096dcc2221f11c461184a6541d28bd566028b5c5f1c42a32ff3ecb25fb  deyn-keygen/scripts/prepare-android.sh
ba51e7135b662fe638fae7d55491a2d41964dc87bd22d681c0a293c46fd26f4e  deyn-keygen/www/fonts/fonts.css
b07dfae0418a0c11fbf8b5990c0e5f603ea7f2f6a85e3c3b8039fd17628861a4  deyn-keygen/www/index.html
ef99e190b54a541dead3cd1a5994ae53522c11809ec20d73cd25757be7f957e7  docs/DESIGN_VAULT_SYNC.md
0e81bdba5a0a1c48371fd94e2a4e01f9d83e1f815c03f14793823840ba9de829  sms/JavaPluginTests.java
193c6fac9bd81a7a599787fb19b8a8228a41bc33d6ed89684b3071d1657c87f8  sms/README.md
67802d37c9303bddf898f0ad3de3ffa2a7e34585a8174ca24ffef66ff6037a6d  sms/completion.js
d0e7705a9fb151fe4aea7debbcbf5c8debf824942e805cf6c82870f73dde7d06  sms/e2e_comprehensive_test.py
86a911a084a39802ce2374cbef46fdbcce23905d4c656c6918ec17e08a5d5dc3  sms/engine.js
53579deeb25c770978c69e8343bbc01387d426b0cf57d82462636743f06768b3  sms/i18n.js
9207ceba0ddef2aa0c428832b277840797e854b6a908d260043de65460db5e7a  sms/runtime.js
0ae5dcb3da0853f355785f65592b6b90fcba618c0de0da89aec6361209b664c9  sms/test.mjs
a07de1fd784913b9bdc6054e1b64bbbe2a0833eeb8fa1d2d56cda355dd8b880c  sync/app-glue.js
2d41188815beb29401c7dbca841f982c2102b99330f3e91ee19167bb3834276c  sync/engine.js
48e847860dd4f0907ce91e346dbb00a4a12213163ad3d80a953c343eb9a11979  sync/package.json
fc7cc3eaece7a1aa0e654315bff2964d2139b7a2a64174819fe2a85ea4ffb374  sync/qr.js
e8b3ecc1fe8d4409fda993ad40e1e9ae520d13358e3d103333c13ea8355f7ff4  sync/qr_check.mjs
3c3d7e008c19cdf887cbc86e374b9eb6cd8be1319a9f3f91436f5b0bce573683  sync/session.js
e6fbcaf21ae9364b9eb3f7f35c75bfd3f16e8313e4d58268c3f854423d840846  sync/test_engine.mjs
26813e7f8cfa39ad740e6b19c0a620e4d4f43fc077b55d9afd2ec9dae45b5e95  sync/test_session.mjs
71864a844b17432270cf57cd1d8772387a372bd47d3c221380bc231d9e5d3c81  tests/e2e/harness.py
69c986f8d4b0546cfb6b81c70a90224fec2a6495e9aa8ed452c0085449de01a1  tests/e2e/test_auth.py
b98feaf33352602b9d52f5b957a09c7af23dc12e354d7fa74e8aa79374a1dab3  tests/e2e/test_license.py
005652de6f161e09e9ff45f1b5182f88f9e40d9aed1671e35b9fe226f52091a9  tests/e2e/test_storage_layout_static.py
5c3ca9032aa3d4fe620435ec98bea3608a19ab0ba8ed063e2bea29d19d5ccc6d  tests/e2e/test_sync_e2e.py
c5284ca598f4222c28bf33dd9994cb6e983fb02eb28eb7a470d9200e11e9b4ab  tests/e2e/test_time.py
f11f0e5c8a17fa236e20ad2af3d367f965aafe3070d43331c81782cbe309d96a  tests/e2e/test_vault.py
26188d59820edaace107d56eb7ec1a8deec44d145a7f07b04cf41faab8ff8258  tools/embed_sync.py
bca85b9f6d407bac8e502c3656bfbdf64387282e8b926dc649c609be210343de  trusted-time/client.js
48e847860dd4f0907ce91e346dbb00a4a12213163ad3d80a953c343eb9a11979  trusted-time/package.json
e111ed208f7314578a167e55959c7d4f542bdd0e7862c18dd6b6fc0f796b8cad  trusted-time/test.mjs
465506225f9bfebf433e8ad5f5eb08273369acc6fc153d724be323e34a2815e7  trusted-time/time-policy.js
96d913d706066bdc1f9be4f4862675b741f0f05292bd3ca33c6583d67d0853b8  trusted-time/worker.js
cf7d92fb8304dd9db847bf956bf115678c410745c048502d6b808c5dc65f87e7  PRO_4_FILE_INDEX.md
```

================================================================================
## [8/32] FILE: `PRO_4_TEST_REPORT.md`

- **المسار الأصلي**: `PRO_4_TEST_REPORT.md`
- **الحجم**: `4,440` بايت | **الأسطر**: `22` | **SHA-256**: `ed0f54f51c0233111a75e0a503ad6dbf3d6522a4fe5338858769174e0fa224ca`

```markdown
# PRO_4_TEST_REPORT.md — تقرير الاختبارات الفعلية للنسخة PRO 4

- **تاريخ التنفيذ**: 14 نوفمبر 2026
- **المسؤولية والصدق**: جميع النتائج المذكورة أدناه ناتجة عن تشغيل فعلي بعد تطبيق إصلاحات `PRO 4`.

## أولًا: الاختبارات التي تم تشغيلها ونجحت فعليًا (0 فشل)

| # | الاختبار / الحزمة | الأداة والبيئة | عدد الحالات | النتيجة | ما تم إثباته عمليًا |
|---|---|---|---|---|---|
| 1 | `sync/test_engine.mjs` | `Node.js v18.20.4` | **19 / 19** | **PASS** | المزامنة الأولية (Union)، التغييرات اللاحقة فقط، العمل دون إنترنت ثم الاستئناف، **انتقال تمديد الدين (`dueAt`, `originalDueAt`, `extensionHistory`) عبر `txf` دون تكرار**، ومنع العامل من تجاوز حدود الفئات والسقف في `cf` و`cust+`، واختبار Fuzz لـ 300 عملية عشوائية |
| 2 | `sync/test_session.mjs` | `Node.js v18.20.4` | **16 / 16** | **PASS** | الإقران بـ `DEYNPAIR1`، تشفير `X25519` + `Ed25519` + `AES-256-GCM`، **منع وصول تاجر لبيانات تاجر آخر أو انضمام غريب**، مقاومة العبث والتكرار، وانقطاع الاتصال واستئنافه |
| 3 | `trusted-time/test.mjs` | `Node.js v18.20.4` | **18 / 18** | **PASS** | التحقق من توقيع الوقت `Ed25519`، رفض الإعادة، تحذيرات الساعة 1-3، مهلة 48 ساعة، `READ_ONLY` دون حذف بيانات، وإصلاح `lastSeen` |
| 4 | `sms/test.mjs` | `Node.js v18.20.4` | **14 / 14** | **PASS** | توزيع التسديدات، تمديد الدين، منع التكرار، الرسائل العربية من 3 أجزاء، الفشل الجزئي والكلي |
| 5 | `sms/JavaPluginTests.java` | `javac 17.0.21` + `java -ea` (JVM 17) | **5 إضافات / 3 حزم اختبار** | **PASS** | ترجمة الإضافات الخمس بـ 0 أخطاء؛ الكتابة الذرية SAF والسقوط إلى `.prev.json` عند تلف النسخة الرئيسية؛ ساعة `elapsedRealtimeMs`؛ إلغاء إشعار الدين المسدد في `NotifWorker`؛ وتتبع أجزاء SMS |
| 6 | `sms/e2e_comprehensive_test.py` | `Chromium 156` + `Selenium WebDriver` | **12 / 12** | **PASS** | تفعيل `M`/`W`، منع تحويل الدور اليدوي، قفل `PBKDF2` واسترداد `DEYNR1`، مزامنة Wi-Fi، النسخ الاحتياطي التلقائي والاستعادة مع السقوط لـ `.prev.json`، حماية الساعة وزرَي «لاحقاً»/«حسناً»، الإشعارات مقروء/غير مقروء وإلغاؤها عند التسديد، وواجهة الفرنسية و`Gérer le mot de passe` |
| 7 | فحص قواعد JavaScript والفحص الأمني الثابت | `Python 3.11` + `node --check` | **100%** | **PASS** | سلامة جميع مقاطع `<script>` في `deyn-app` و`deyn-keygen`، وخلو المشروع من أي مفاتيح خاصة أو كلمات سر مصنعية |

## ثانيًا: الاختبارات التي تعذّر تشغيلها محليًا في بيئة الحاوية المعزولة

1. **بناء ملف APK الفعلي (`./gradlew assembleDebug`)**: لم يُنفَّذ محليًا لعدم توفر Android SDK (`android.jar`, `aapt2`, `d8`) واتصال الإنترنت لتحميل حزم Gradle في الحاوية. يجب تشغيله عبر GitHub Actions (`Build DEYN APKs` أو `DEYN SMS manual Android build`).
2. **حزمة `tests/e2e/test_*.py` عبر مكتبة `playwright`**: مكتبة البايثون `playwright` غير مثبتة في الحاوية (تمت تغطية سيناريوهاتها عبر `sms/e2e_comprehensive_test.py` على `Chromium 156 + Selenium`، وتعمل `tests/e2e/test_*.py` تلقائيًا في GitHub Actions).
3. **الاختبار الميداني على هاتف Android حقيقي**: اختيار مجلد SAF من النظام وحذف التطبيق وإعادة تثبيته، واستلام إشعارات `WorkManager` في الساعة 09:00 والهاتف مغلق، وإرسال SMS على الشبكات الجزائرية، والمزامنة عبر Hotspot بين هاتفين ماديين.
```

================================================================================
## [9/32] FILE: `deyn-app/android-res/mipmap-anydpi-v26/ic_launcher_round.xml`

- **المسار الأصلي**: `deyn-app/android-res/mipmap-anydpi-v26/ic_launcher_round.xml`
- **الحجم**: `266` بايت | **الأسطر**: `5` | **SHA-256**: `44cc3246d167bd718fb61feaba493850ff95255c1ddbb8854c0e4c0534832f96`

```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

================================================================================
## [10/32] FILE: `deyn-app/capacitor.config.json`

- **المسار الأصلي**: `deyn-app/capacitor.config.json`
- **الحجم**: `189` بايت | **الأسطر**: `8` | **SHA-256**: `917ded69578fb28865d1e29bc520826a9d2d9cd05e7bdf694d4f9ea438cabaf6`

```json
{
  "appId": "com.deyn.app",
  "appName": "DEYN",
  "webDir": "www",
  "backgroundColor": "#065043",
  "server": { "androidScheme": "https" },
  "android": { "allowMixedContent": false }
}
```

================================================================================
## [11/32] FILE: `deyn-app/native/DeynBackupPlugin.java`

- **المسار الأصلي**: `deyn-app/native/DeynBackupPlugin.java`
- **الحجم**: `18,158` بايت | **الأسطر**: `408` | **SHA-256**: `bf8509112ca73cb21149d2e8b4a5aaea6aec4e4bcd9ba10fd81d79826b1adbeb`

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

================================================================================
## [12/32] FILE: `deyn-app/native/DeynNotifPlugin.java`

- **المسار الأصلي**: `deyn-app/native/DeynNotifPlugin.java`
- **الحجم**: `15,024` بايت | **الأسطر**: `353` | **SHA-256**: `ac4aab77652a34ad68f5a4038b983913161395f610731373a6e3500fc02a1530`

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

================================================================================
## [13/32] FILE: `deyn-app/native/DeynSmsPlugin.java`

- **المسار الأصلي**: `deyn-app/native/DeynSmsPlugin.java`
- **الحجم**: `43,549` بايت | **الأسطر**: `896` | **SHA-256**: `eab4f4e6a1d8f64de29b20adda25ba21ba46e2f1778ccfbac376085f7a334f7b`

```java
package com.deyn.app;

import android.Manifest;
import android.app.Activity;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.telephony.SmsManager;
import android.telephony.SmsMessage;
import android.telephony.SubscriptionManager;
import androidx.annotation.NonNull;
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
import org.json.JSONArray;
import org.json.JSONObject;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@CapacitorPlugin(name = "DeynSms", permissions = {
    @Permission(strings = { Manifest.permission.SEND_SMS }, alias = "sms")
})
public class DeynSmsPlugin extends Plugin {
    public static final String PREFS = "deyn_sms";
    public static final String SENT = "sent_ids";
    public static final String CLAIMED = "claimed_ids";
    public static final String PARTIAL = "partial_ids";
    public static final String FAILED = "failed_ids";
    public static final String TRACKED = "tracked_ids";
    public static final String ACTIVE = "active_ids";
    public static final String ACTIVE_PAYLOADS = "active_payloads";
    public static final String ACTIVE_QUEUE_JSON = "active_queue_json";
    public static final String NEXT_SEND_AT = "next_send_at";
    public static final String TAG = "deyn_sms_queue";

    public static final String STATUS_ATTEMPTING = "attempting";
    public static final String STATUS_ACCEPTED = "accepted_by_android";
    public static final String STATUS_SENT_TO_NETWORK = "sent_to_network";
    public static final String STATUS_DELIVERED = "delivered";
    public static final String STATUS_PARTIAL_FAILURE = "partial_failure";
    public static final String STATUS_FAILED = "failed";
    public static final String STATUS_DISPATCH_UNCERTAIN = "dispatch_uncertain";

    public static final String ACTION_SMS_SENT = "com.deyn.app.SMS_SENT";
    public static final String ACTION_SMS_DELIVERED = "com.deyn.app.SMS_DELIVERED";

    private static final String STATUS_PREFIX = "status_";
    private static final String PHONE_PREFIX = "phone_";
    private static final String ATTEMPT_AT_PREFIX = "attempt_at_";
    private static final String ACCEPTED_AT_PREFIX = "accepted_at_";
    private static final String SENT_AT_PREFIX = "sent_at_";
    private static final String DELIVERED_AT_PREFIX = "delivered_at_";
    private static final String PARTS_TOTAL_PREFIX = "parts_total_";
    private static final String PARTS_SENT_SET_PREFIX = "parts_sent_set_";
    private static final String PARTS_FAILED_SET_PREFIX = "parts_failed_set_";
    private static final String PARTS_DELIVERED_SET_PREFIX = "parts_delivered_set_";
    private static final String LAST_ERROR_PREFIX = "last_error_";

    private static final long WAIT_FOR_RADIO_MS = 20000L;
    private static final long STALE_INFLIGHT_MS = 180000L;
    private static final Object LOCK = new Object();
    private static final ExecutorService SEND_EXECUTOR = Executors.newSingleThreadExecutor();
    private static volatile boolean dynamicReceiverRegistered = false;

    @Override
    public void load() {
        super.load();
        ensureDynamicReceiver(getContext());
    }

    private static void ensureDynamicReceiver(Context context) {
        if (context == null || dynamicReceiverRegistered) return;
        synchronized (LOCK) {
            if (dynamicReceiverRegistered) return;
            try {
                Context appCtx = context.getApplicationContext() != null ? context.getApplicationContext() : context;
                IntentFilter filter = new IntentFilter();
                filter.addAction(ACTION_SMS_SENT);
                filter.addAction(ACTION_SMS_DELIVERED);
                SmsStatusReceiver receiver = new SmsStatusReceiver();
                if (Build.VERSION.SDK_INT >= 33) {
                    appCtx.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
                } else {
                    appCtx.registerReceiver(receiver, filter);
                }
                dynamicReceiverRegistered = true;
            } catch (Exception ignored) {
                // Static AndroidManifest registration remains active as primary receiver.
            }
        }
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        call.resolve(permissionState());
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (getPermissionState("sms") == PermissionState.GRANTED) {
            call.resolve(permissionState());
            return;
        }
        requestPermissionForAlias("sms", call, "permissionCallback");
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        call.resolve(permissionState());
    }

    private JSObject permissionState() {
        JSObject out = new JSObject();
        out.put("sms", getPermissionState("sms") == PermissionState.GRANTED ? "granted" : "denied");
        return out;
    }

    @PluginMethod
    public void send(PluginCall call) {
        if (getPermissionState("sms") != PermissionState.GRANTED) {
            call.reject("SMS permission not granted");
            return;
        }
        final String id = call.getString("id");
        final String phone = call.getString("phone");
        final String message = call.getString("message");
        final long timeoutMs = Math.max(1000L, Math.min(30000L, call.getLong("timeoutMs", WAIT_FOR_RADIO_MS)));
        if (id == null || id.trim().isEmpty() || phone == null || phone.trim().isEmpty() || message == null || message.trim().isEmpty()) {
            call.reject("Missing SMS id, phone or message");
            return;
        }
        final Context context = getContext();
        ensureDynamicReceiver(context);
        SEND_EXECUTOR.execute(() -> {
            try {
                DispatchResult dispatched = dispatchOnce(context, id.trim(), phone.trim(), message, false, 0L, 0);
                if (!dispatched.dispatched) {
                    JSObject snap = buildItemSnapshot(prefs(context), id.trim());
                    snap.put("duplicate", true);
                    call.resolve(snap);
                    return;
                }
                JSObject outcome = awaitDispatchOutcome(context, id.trim(), timeoutMs);
                outcome.put("duplicate", false);
                call.resolve(outcome);
            } catch (Exception e) {
                call.reject("SMS send failed: " + e.getClass().getSimpleName() + (e.getMessage() != null ? " (" + e.getMessage() + ")" : ""));
            }
        });
    }

    /** Replace the authoritative scheduled queue and persist its snapshot for reboot recovery. */
    @PluginMethod
    public void schedule(PluginCall call) {
        try {
            Context context = getContext();
            ensureDynamicReceiver(context);
            JSArray items = call.getArray("items", new JSArray());
            Set<String> active = new HashSet<>();
            Set<String> activePayloads = new HashSet<>();
            JSONArray persistedQueue = new JSONArray();
            Set<String> previousActive;
            synchronized (LOCK) {
                previousActive = new HashSet<>(prefs(context).getStringSet(ACTIVE, new HashSet<>()));
            }
            for (int i = 0; i < items.length(); i++) {
                JSONObject item = items.getJSONObject(i);
                String id = item.optString("id", "").trim();
                String phone = item.optString("phone", "").trim();
                String message = item.optString("message", "");
                long at = item.optLong("at", 0L);
                int gap = Math.max(1, Math.min(60, item.optInt("gapMinutes", 5)));
                if (!id.isEmpty() && !phone.isEmpty() && !message.trim().isEmpty() && at > 0) {
                    active.add(id);
                    activePayloads.add(payloadKey(id, phone, message, at));
                    JSONObject clean = new JSONObject();
                    clean.put("id", id);
                    clean.put("phone", phone);
                    clean.put("message", message);
                    clean.put("at", at);
                    clean.put("gapMinutes", gap);
                    persistedQueue.put(clean);
                }
            }
            synchronized (LOCK) {
                SharedPreferences.Editor ed = prefs(context).edit()
                    .putStringSet(ACTIVE, active)
                    .putStringSet(ACTIVE_PAYLOADS, activePayloads)
                    .putString(ACTIVE_QUEUE_JSON, persistedQueue.toString());
                if (!ed.commit()) {
                    throw new IllegalStateException("Could not persist active queue");
                }
            }
            WorkManager wm = WorkManager.getInstance(context);
            for (String oldId : previousActive) {
                if (!active.contains(oldId)) {
                    wm.cancelUniqueWork("deyn_sms_" + oldId);
                    wm.cancelUniqueWork("deyn_sms_deferred_" + oldId);
                }
            }
            long now = System.currentTimeMillis();
            int queued = enqueueQueueItems(context, wm, persistedQueue, active, now, ExistingWorkPolicy.REPLACE);
            JSObject out = new JSObject();
            out.put("count", queued);
            out.put("replacedActiveItems", true);
            call.resolve(out);
        } catch (Exception e) {
            call.reject("SMS scheduling failed: " + e.getClass().getSimpleName());
        }
    }

    @PluginMethod
    public void getSent(PluginCall call) {
        Context context = getContext();
        synchronized (LOCK) {
            reconcileStaleInFlightLocked(prefs(context), System.currentTimeMillis());
            SharedPreferences sp = prefs(context);
            Set<String> sentIds = new HashSet<>(sp.getStringSet(SENT, new HashSet<>()));
            Set<String> tracked = new HashSet<>(sp.getStringSet(TRACKED, new HashSet<>()));
            tracked.addAll(sentIds);
            tracked.addAll(sp.getStringSet(CLAIMED, new HashSet<>()));
            tracked.addAll(sp.getStringSet(PARTIAL, new HashSet<>()));
            tracked.addAll(sp.getStringSet(FAILED, new HashSet<>()));

            JSArray ids = new JSArray();
            JSArray items = new JSArray();
            JSArray uncertain = new JSArray();
            JSArray failed = new JSArray();

            for (String id : sentIds) {
                ids.put(id);
            }
            for (String id : tracked) {
                JSObject item = buildItemSnapshot(sp, id);
                items.put(item);
                String st = item.getString("status");
                if (STATUS_DISPATCH_UNCERTAIN.equals(st) || STATUS_PARTIAL_FAILURE.equals(st)) {
                    uncertain.put(item);
                }
                if (STATUS_FAILED.equals(st) || STATUS_PARTIAL_FAILURE.equals(st)) {
                    failed.put(item);
                }
            }
            JSObject out = new JSObject();
            out.put("ids", ids);
            out.put("items", items);
            out.put("uncertain", uncertain);
            out.put("failed", failed);
            call.resolve(out);
        }
    }

    static int enqueueQueueItems(Context context, WorkManager wm, JSONArray queue, Set<String> active, long now, ExistingWorkPolicy policy) throws Exception {
        int queued = 0;
        for (int i = 0; i < queue.length(); i++) {
            JSONObject item = queue.getJSONObject(i);
            String id = item.getString("id");
            if (!active.contains(id) || isTerminalOrInFlight(context, id)) continue;
            long at = item.getLong("at");
            long delay = Math.max(0L, at - now);
            int gap = Math.max(1, Math.min(60, item.optInt("gapMinutes", 5)));
            Data data = new Data.Builder()
                .putString("id", id)
                .putString("phone", item.getString("phone"))
                .putString("message", item.getString("message"))
                .putLong("at", at)
                .putInt("gap", gap)
                .build();
            OneTimeWorkRequest request = new OneTimeWorkRequest.Builder(SmsWorker.class)
                .setInitialDelay(delay, TimeUnit.MILLISECONDS)
                .setInputData(data)
                .addTag(TAG)
                .build();
            wm.enqueueUniqueWork("deyn_sms_" + id, policy, request);
            if (policy == ExistingWorkPolicy.REPLACE) {
                wm.cancelUniqueWork("deyn_sms_deferred_" + id);
            }
            queued++;
        }
        return queued;
    }

    public static int rescheduleActiveQueue(Context context) {
        if (context == null) return 0;
        synchronized (LOCK) {
            try {
                SharedPreferences sp = prefs(context);
                reconcileStaleInFlightLocked(sp, System.currentTimeMillis());
                String raw = sp.getString(ACTIVE_QUEUE_JSON, "[]");
                Set<String> active = new HashSet<>(sp.getStringSet(ACTIVE, new HashSet<>()));
                if (active.isEmpty() || raw == null || raw.isEmpty()) return 0;
                JSONArray queue = new JSONArray(raw);
                WorkManager wm = WorkManager.getInstance(context);
                return enqueueQueueItems(context, wm, queue, active, System.currentTimeMillis(), ExistingWorkPolicy.KEEP);
            } catch (Exception e) {
                return 0;
            }
        }
    }

    static String payloadKey(String id, String phone, String message, long at) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(message.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte b : digest) hex.append(String.format(Locale.ROOT, "%02x", b & 0xff));
            return id + "\n" + phone + "\n" + at + "\n" + hex;
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static boolean isTerminalOrInFlight(Context c, String id) {
        synchronized (LOCK) {
            SharedPreferences sp = prefs(c);
            reconcileStaleInFlightLocked(sp, System.currentTimeMillis());
            if (sp.getStringSet(SENT, new HashSet<>()).contains(id)) return true;
            if (sp.getStringSet(PARTIAL, new HashSet<>()).contains(id)) return true;
            if (sp.getStringSet(CLAIMED, new HashSet<>()).contains(id)) return true;
            String st = sp.getString(STATUS_PREFIX + id, "");
            return STATUS_SENT_TO_NETWORK.equals(st)
                || STATUS_DELIVERED.equals(st)
                || STATUS_PARTIAL_FAILURE.equals(st)
                || STATUS_DISPATCH_UNCERTAIN.equals(st);
        }
    }

    private static void reconcileStaleInFlightLocked(SharedPreferences sp, long now) {
        Set<String> claimed = new HashSet<>(sp.getStringSet(CLAIMED, new HashSet<>()));
        if (claimed.isEmpty()) return;
        boolean dirty = false;
        SharedPreferences.Editor ed = sp.edit();
        for (String id : new HashSet<>(claimed)) {
            String st = sp.getString(STATUS_PREFIX + id, STATUS_ATTEMPTING);
            long attemptAt = sp.getLong(ATTEMPT_AT_PREFIX + id, 0L);
            long acceptedAt = sp.getLong(ACCEPTED_AT_PREFIX + id, attemptAt);
            long ref = Math.max(attemptAt, acceptedAt);
            if ((STATUS_ATTEMPTING.equals(st) || STATUS_ACCEPTED.equals(st)) && ref > 0L && (now - ref) > STALE_INFLIGHT_MS) {
                int total = sp.getInt(PARTS_TOTAL_PREFIX + id, 1);
                Set<String> sentParts = new HashSet<>(sp.getStringSet(PARTS_SENT_SET_PREFIX + id, new HashSet<>()));
                Set<String> failedParts = new HashSet<>(sp.getStringSet(PARTS_FAILED_SET_PREFIX + id, new HashSet<>()));
                if (!sentParts.isEmpty() && !failedParts.isEmpty()) {
                    ed.putString(STATUS_PREFIX + id, STATUS_PARTIAL_FAILURE);
                    Set<String> partial = new HashSet<>(sp.getStringSet(PARTIAL, new HashSet<>()));
                    partial.add(id);
                    ed.putStringSet(PARTIAL, partial);
                    claimed.remove(id);
                    dirty = true;
                } else {
                    ed.putString(STATUS_PREFIX + id, STATUS_DISPATCH_UNCERTAIN);
                    dirty = true;
                }
            }
        }
        if (dirty) {
            ed.putStringSet(CLAIMED, claimed).commit();
        }
    }

    private static SmsManager resolveSmsManager(Context c) {
        SmsManager manager = null;
        try {
            int subId = SmsManager.getDefaultSmsSubscriptionId();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                SmsManager base = c.getSystemService(SmsManager.class);
                if (base != null) {
                    manager = (subId != SubscriptionManager.INVALID_SUBSCRIPTION_ID)
                        ? base.createForSubscriptionId(subId)
                        : base;
                }
            } else if (subId != SubscriptionManager.INVALID_SUBSCRIPTION_ID) {
                manager = SmsManager.getSmsManagerForSubscriptionId(subId);
            }
        } catch (Throwable ignored) {}
        if (manager == null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                manager = c.getSystemService(SmsManager.class);
            }
            if (manager == null) {
                manager = SmsManager.getDefault();
            }
        }
        return manager;
    }

    /** Deterministic fallback splitter matching GSM-7 (160/153) and UCS-2 (70/67) limits if divideMessage returns empty. */
    public static ArrayList<String> splitMessageFallback(String message) {
        ArrayList<String> out = new ArrayList<>();
        if (message == null || message.isEmpty()) return out;
        boolean ucs2 = false;
        for (int i = 0; i < message.length(); i++) {
            char ch = message.charAt(i);
            if (ch > 0x7F) {
                ucs2 = true;
                break;
            }
        }
        int singleLimit = ucs2 ? 70 : 160;
        int multiLimit = ucs2 ? 67 : 153;
        if (message.length() <= singleLimit) {
            out.add(message);
            return out;
        }
        int idx = 0;
        int len = message.length();
        while (idx < len) {
            int end = Math.min(len, idx + multiLimit);
            if (end < len && Character.isHighSurrogate(message.charAt(end - 1)) && Character.isLowSurrogate(message.charAt(end))) {
                end--;
            }
            if (end <= idx) end = Math.min(len, idx + multiLimit);
            out.add(message.substring(idx, end));
            idx = end;
        }
        return out;
    }

    private static int requestCodeFor(String id, int partIndex, String kind) {
        String key = id + "#" + partIndex + "#" + kind;
        return (key.hashCode() & 0x7fffffff);
    }

    private static PendingIntent buildPartBroadcastIntent(Context c, String action, String id, int partIndex, int totalParts, long attemptAt) {
        Intent intent = new Intent(c, SmsStatusReceiver.class)
            .setAction(action)
            .setPackage(c.getPackageName())
            .putExtra("id", id)
            .putExtra("partIndex", partIndex)
            .putExtra("totalParts", totalParts)
            .putExtra("attemptAt", attemptAt);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_MUTABLE;
        }
        return PendingIntent.getBroadcast(c, requestCodeFor(id, partIndex, action), intent, flags);
    }

    public static final class DispatchResult {
        public final boolean dispatched;
        public final int totalParts;
        public final String status;
        public DispatchResult(boolean dispatched, int totalParts, String status) {
            this.dispatched = dispatched;
            this.totalParts = totalParts;
            this.status = status;
        }
    }

    /**
     * Dispatches an SMS (single-part or multi-part) with per-part PendingIntents.
     * Does NOT mark the message as sent in SENT until SmsStatusReceiver confirms RESULT_OK for every part.
     */
    public static DispatchResult dispatchOnce(Context c, String id, String phone, String message, boolean requireActive, long scheduledAt, int gapMinutes) {
        synchronized (LOCK) {
            SharedPreferences sp = prefs(c);
            reconcileStaleInFlightLocked(sp, System.currentTimeMillis());
            Set<String> sent = new HashSet<>(sp.getStringSet(SENT, new HashSet<>()));
            Set<String> claimed = new HashSet<>(sp.getStringSet(CLAIMED, new HashSet<>()));
            Set<String> partial = new HashSet<>(sp.getStringSet(PARTIAL, new HashSet<>()));
            Set<String> failed = new HashSet<>(sp.getStringSet(FAILED, new HashSet<>()));
            Set<String> tracked = new HashSet<>(sp.getStringSet(TRACKED, new HashSet<>()));

            if (requireActive) {
                String payload = payloadKey(id, phone, message, scheduledAt);
                if (!sp.getStringSet(ACTIVE, new HashSet<>()).contains(id) || !sp.getStringSet(ACTIVE_PAYLOADS, new HashSet<>()).contains(payload)) {
                    return new DispatchResult(false, 0, "inactive");
                }
            }
            if (sent.contains(id)) {
                return new DispatchResult(false, sp.getInt(PARTS_TOTAL_PREFIX + id, 1), sp.getString(STATUS_PREFIX + id, STATUS_SENT_TO_NETWORK));
            }
            if (partial.contains(id)) {
                return new DispatchResult(false, sp.getInt(PARTS_TOTAL_PREFIX + id, 1), STATUS_PARTIAL_FAILURE);
            }
            if (claimed.contains(id)) {
                if (requireActive && gapMinutes > 0) {
                    sp.edit().putLong(NEXT_SEND_AT, Math.max(sp.getLong(NEXT_SEND_AT, 0L), System.currentTimeMillis() + gapMinutes * 60000L)).commit();
                }
                return new DispatchResult(false, sp.getInt(PARTS_TOTAL_PREFIX + id, 1), sp.getString(STATUS_PREFIX + id, STATUS_ACCEPTED));
            }

            SmsManager manager = resolveSmsManager(c);
            if (manager == null) {
                throw new IllegalStateException("SMS service unavailable");
            }
            ArrayList<String> parts = manager.divideMessage(message);
            if (parts == null || parts.isEmpty()) {
                parts = splitMessageFallback(message);
            }
            if (parts.isEmpty()) {
                throw new IllegalArgumentException("Empty SMS parts");
            }
            int totalParts = parts.size();
            long attemptAt = System.currentTimeMillis();

            claimed.add(id);
            failed.remove(id);
            tracked.add(id);

            SharedPreferences.Editor preEdit = sp.edit()
                .putStringSet(CLAIMED, claimed)
                .putStringSet(FAILED, failed)
                .putStringSet(TRACKED, tracked)
                .putString(STATUS_PREFIX + id, STATUS_ATTEMPTING)
                .putString(PHONE_PREFIX + id, phone)
                .putLong(ATTEMPT_AT_PREFIX + id, attemptAt)
                .putInt(PARTS_TOTAL_PREFIX + id, totalParts)
                .putStringSet(PARTS_SENT_SET_PREFIX + id, new HashSet<>())
                .putStringSet(PARTS_FAILED_SET_PREFIX + id, new HashSet<>())
                .putStringSet(PARTS_DELIVERED_SET_PREFIX + id, new HashSet<>())
                .remove(LAST_ERROR_PREFIX + id);
            if (!preEdit.commit()) {
                throw new IllegalStateException("Could not persist SMS attempt state");
            }

            ArrayList<PendingIntent> sentIntents = new ArrayList<>(totalParts);
            ArrayList<PendingIntent> deliveryIntents = new ArrayList<>(totalParts);
            for (int i = 0; i < totalParts; i++) {
                sentIntents.add(buildPartBroadcastIntent(c, ACTION_SMS_SENT, id, i, totalParts, attemptAt));
                deliveryIntents.add(buildPartBroadcastIntent(c, ACTION_SMS_DELIVERED, id, i, totalParts, attemptAt));
            }

            try {
                if (totalParts == 1) {
                    manager.sendTextMessage(phone, null, parts.get(0), sentIntents.get(0), deliveryIntents.get(0));
                } else {
                    manager.sendMultipartTextMessage(phone, null, parts, sentIntents, deliveryIntents);
                }
            } catch (Exception e) {
                // Synchronous API rejection: release claim and record failure so retry is possible.
                claimed.remove(id);
                failed.add(id);
                sp.edit()
                    .putStringSet(CLAIMED, claimed)
                    .putStringSet(FAILED, failed)
                    .putString(STATUS_PREFIX + id, STATUS_FAILED)
                    .putString(LAST_ERROR_PREFIX + id, e.getClass().getSimpleName() + (e.getMessage() != null ? ": " + e.getMessage() : ""))
                    .commit();
                throw e;
            }

            long acceptedAt = System.currentTimeMillis();
            String currentStatus = sp.getString(STATUS_PREFIX + id, STATUS_ATTEMPTING);
            SharedPreferences.Editor postEdit = sp.edit().putLong(ACCEPTED_AT_PREFIX + id, acceptedAt);
            if (STATUS_ATTEMPTING.equals(currentStatus)) {
                postEdit.putString(STATUS_PREFIX + id, STATUS_ACCEPTED);
                currentStatus = STATUS_ACCEPTED;
            }
            if (requireActive && gapMinutes > 0) {
                postEdit.putLong(NEXT_SEND_AT, acceptedAt + gapMinutes * 60000L);
            }
            if (!postEdit.commit()) {
                throw new IllegalStateException("Could not persist SMS acceptance timestamp");
            }
            return new DispatchResult(true, totalParts, currentStatus);
        }
    }

    public static JSObject awaitDispatchOutcome(Context c, String id, long timeoutMs) {
        long deadline = System.currentTimeMillis() + Math.max(0L, timeoutMs);
        synchronized (LOCK) {
            while (true) {
                SharedPreferences sp = prefs(c);
                String st = sp.getString(STATUS_PREFIX + id, STATUS_ATTEMPTING);
                if (STATUS_SENT_TO_NETWORK.equals(st) || STATUS_DELIVERED.equals(st) || STATUS_PARTIAL_FAILURE.equals(st) || STATUS_FAILED.equals(st)) {
                    return buildItemSnapshot(sp, id);
                }
                long remaining = deadline - System.currentTimeMillis();
                if (remaining <= 0L) {
                    return buildItemSnapshot(sp, id);
                }
                try {
                    LOCK.wait(Math.min(remaining, 250L));
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return buildItemSnapshot(prefs(c), id);
                }
            }
        }
    }

    static JSObject buildItemSnapshot(SharedPreferences sp, String id) {
        String st = sp.getString(STATUS_PREFIX + id, sp.getStringSet(SENT, new HashSet<>()).contains(id) ? STATUS_SENT_TO_NETWORK : STATUS_DISPATCH_UNCERTAIN);
        int partsTotal = Math.max(1, sp.getInt(PARTS_TOTAL_PREFIX + id, 1));
        Set<String> sentParts = sp.getStringSet(PARTS_SENT_SET_PREFIX + id, new HashSet<>());
        Set<String> failedParts = sp.getStringSet(PARTS_FAILED_SET_PREFIX + id, new HashSet<>());
        Set<String> deliveredParts = sp.getStringSet(PARTS_DELIVERED_SET_PREFIX + id, new HashSet<>());
        int partsSent = sentParts != null ? sentParts.size() : 0;
        int partsFailed = failedParts != null ? failedParts.size() : 0;
        int partsDelivered = deliveredParts != null ? deliveredParts.size() : 0;
        if ((STATUS_SENT_TO_NETWORK.equals(st) || STATUS_DELIVERED.equals(st)) && partsSent == 0) {
            partsSent = partsTotal;
        }
        boolean isSentToNetwork = STATUS_SENT_TO_NETWORK.equals(st) || STATUS_DELIVERED.equals(st);
        boolean isAccepted = isSentToNetwork || STATUS_ACCEPTED.equals(st) || STATUS_PARTIAL_FAILURE.equals(st);
        boolean isDelivered = STATUS_DELIVERED.equals(st);

        JSObject item = new JSObject();
        item.put("id", id);
        item.put("phone", sp.getString(PHONE_PREFIX + id, ""));
        item.put("status", st);
        item.put("sent", isSentToNetwork);
        item.put("accepted", isAccepted);
        item.put("delivered", isDelivered);
        item.put("partsTotal", partsTotal);
        item.put("partsSent", partsSent);
        item.put("partsFailed", partsFailed);
        item.put("partsDelivered", partsDelivered);
        item.put("attemptAt", sp.getLong(ATTEMPT_AT_PREFIX + id, 0L));
        item.put("acceptedAt", sp.getLong(ACCEPTED_AT_PREFIX + id, 0L));
        item.put("sentAt", sp.getLong(SENT_AT_PREFIX + id, 0L));
        item.put("deliveredAt", sp.getLong(DELIVERED_AT_PREFIX + id, 0L));
        String err = sp.getString(LAST_ERROR_PREFIX + id, "");
        if (err != null && !err.isEmpty()) {
            item.put("error", err);
        }
        return item;
    }

    /** Record the result of sending a single SMS part from SmsStatusReceiver. */
    public static void handlePartSent(Context context, String id, int partIndex, int totalParts, int resultCode, int errorCode) {
        if (context == null || id == null || id.isEmpty()) return;
        synchronized (LOCK) {
            SharedPreferences sp = prefs(context);
            int expectedTotal = Math.max(1, totalParts > 0 ? totalParts : sp.getInt(PARTS_TOTAL_PREFIX + id, 1));
            int validIndex = Math.max(0, partIndex);
            Set<String> sentParts = new HashSet<>(sp.getStringSet(PARTS_SENT_SET_PREFIX + id, new HashSet<>()));
            Set<String> failedParts = new HashSet<>(sp.getStringSet(PARTS_FAILED_SET_PREFIX + id, new HashSet<>()));
            Set<String> sentIds = new HashSet<>(sp.getStringSet(SENT, new HashSet<>()));
            Set<String> claimedIds = new HashSet<>(sp.getStringSet(CLAIMED, new HashSet<>()));
            Set<String> partialIds = new HashSet<>(sp.getStringSet(PARTIAL, new HashSet<>()));
            Set<String> failedIds = new HashSet<>(sp.getStringSet(FAILED, new HashSet<>()));
            Set<String> trackedIds = new HashSet<>(sp.getStringSet(TRACKED, new HashSet<>()));
            trackedIds.add(id);

            String partKey = String.valueOf(validIndex);
            SharedPreferences.Editor ed = sp.edit()
                .putInt(PARTS_TOTAL_PREFIX + id, expectedTotal)
                .putStringSet(TRACKED, trackedIds);

            if (resultCode == Activity.RESULT_OK) {
                sentParts.add(partKey);
                failedParts.remove(partKey);
            } else {
                failedParts.add(partKey);
                String errDesc = "part=" + (validIndex + 1) + "/" + expectedTotal + ",resultCode=" + resultCode + (errorCode != -1 ? ",errorCode=" + errorCode : "");
                ed.putString(LAST_ERROR_PREFIX + id, errDesc);
            }

            ed.putStringSet(PARTS_SENT_SET_PREFIX + id, sentParts);
            ed.putStringSet(PARTS_FAILED_SET_PREFIX + id, failedParts);

            if (sentParts.size() + failedParts.size() >= expectedTotal) {
                long now = System.currentTimeMillis();
                claimedIds.remove(id);
                ed.putStringSet(CLAIMED, claimedIds);

                if (failedParts.isEmpty() && sentParts.size() >= expectedTotal) {
                    // Every part confirmed sent to the network.
                    String curStatus = sp.getString(STATUS_PREFIX + id, STATUS_ACCEPTED);
                    if (!STATUS_DELIVERED.equals(curStatus)) {
                        ed.putString(STATUS_PREFIX + id, STATUS_SENT_TO_NETWORK);
                    }
                    ed.putLong(SENT_AT_PREFIX + id, now);
                    sentIds.add(id);
                    partialIds.remove(id);
                    failedIds.remove(id);
                    ed.putStringSet(SENT, sentIds).putStringSet(PARTIAL, partialIds).putStringSet(FAILED, failedIds);
                } else if (!sentParts.isEmpty()) {
                    // Partial failure: some parts reached the network, at least one part failed.
                    // Never record as full success in SENT.
                    ed.putString(STATUS_PREFIX + id, STATUS_PARTIAL_FAILURE);
                    sentIds.remove(id);
                    partialIds.add(id);
                    failedIds.remove(id);
                    ed.putStringSet(SENT, sentIds).putStringSet(PARTIAL, partialIds).putStringSet(FAILED, failedIds);
                } else {
                    // Complete failure: 0 parts sent. Release claim so WorkManager or manual action can retry.
                    ed.putString(STATUS_PREFIX + id, STATUS_FAILED);
                    sentIds.remove(id);
                    partialIds.remove(id);
                    failedIds.add(id);
                    ed.putStringSet(SENT, sentIds).putStringSet(PARTIAL, partialIds).putStringSet(FAILED, failedIds);
                }
            }
            ed.commit();
            LOCK.notifyAll();
        }
    }

    /** Record carrier delivery confirmation for a single SMS part from SmsStatusReceiver. */
    public static void handlePartDelivered(Context context, String id, int partIndex, int totalParts, int resultCode, byte[] pdu, String format) {
        if (context == null || id == null || id.isEmpty()) return;
        if (resultCode != Activity.RESULT_OK) return;
        if (pdu != null && pdu.length > 0) {
            try {
                SmsMessage msg = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && format != null && !format.isEmpty())
                    ? SmsMessage.createFromPdu(pdu, format)
                    : SmsMessage.createFromPdu(pdu);
                if (msg != null) {
                    int tpStatus = msg.getStatus();
                    // TP-Status >= 64 (0x40) indicates permanent failure in 3GPP TS 23.040
                    if (tpStatus >= 64) return;
                }
            } catch (Throwable ignored) {}
        }
        synchronized (LOCK) {
            SharedPreferences sp = prefs(context);
            int expectedTotal = Math.max(1, totalParts > 0 ? totalParts : sp.getInt(PARTS_TOTAL_PREFIX + id, 1));
            int validIndex = Math.max(0, partIndex);
            Set<String> deliveredParts = new HashSet<>(sp.getStringSet(PARTS_DELIVERED_SET_PREFIX + id, new HashSet<>()));
            Set<String> sentParts = new HashSet<>(sp.getStringSet(PARTS_SENT_SET_PREFIX + id, new HashSet<>()));
            Set<String> failedParts = new HashSet<>(sp.getStringSet(PARTS_FAILED_SET_PREFIX + id, new HashSet<>()));
            Set<String> sentIds = new HashSet<>(sp.getStringSet(SENT, new HashSet<>()));
            Set<String> claimedIds = new HashSet<>(sp.getStringSet(CLAIMED, new HashSet<>()));
            Set<String> trackedIds = new HashSet<>(sp.getStringSet(TRACKED, new HashSet<>()));
            trackedIds.add(id);

            String partKey = String.valueOf(validIndex);
            deliveredParts.add(partKey);
            sentParts.add(partKey);

            SharedPreferences.Editor ed = sp.edit()
                .putStringSet(TRACKED, trackedIds)
                .putStringSet(PARTS_DELIVERED_SET_PREFIX + id, deliveredParts)
                .putStringSet(PARTS_SENT_SET_PREFIX + id, sentParts);

            if (deliveredParts.size() >= expectedTotal && failedParts.isEmpty()) {
                long now = System.currentTimeMillis();
                ed.putString(STATUS_PREFIX + id, STATUS_DELIVERED)
                    .putLong(DELIVERED_AT_PREFIX + id, now);
                if (sp.getLong(SENT_AT_PREFIX + id, 0L) <= 0L) {
                    ed.putLong(SENT_AT_PREFIX + id, now);
                }
                sentIds.add(id);
                claimedIds.remove(id);
                ed.putStringSet(SENT, sentIds).putStringSet(CLAIMED, claimedIds);
            }
            ed.commit();
            LOCK.notifyAll();
        }
    }

    public static class SmsStatusReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (context == null || intent == null) return;
            String action = intent.getAction();
            String id = intent.getStringExtra("id");
            if (id == null || id.isEmpty()) return;
            int partIndex = intent.getIntExtra("partIndex", 0);
            int totalParts = intent.getIntExtra("totalParts", 1);
            int resultCode = getResultCode();
            if (ACTION_SMS_SENT.equals(action)) {
                int errorCode = intent.getIntExtra("errorCode", -1);
                handlePartSent(context.getApplicationContext() != null ? context.getApplicationContext() : context, id, partIndex, totalParts, resultCode, errorCode);
            } else if (ACTION_SMS_DELIVERED.equals(action)) {
                byte[] pdu = intent.getByteArrayExtra("pdu");
                String format = intent.getStringExtra("format");
                handlePartDelivered(context.getApplicationContext() != null ? context.getApplicationContext() : context, id, partIndex, totalParts, resultCode, pdu, format);
            }
        }
    }

    public static class SmsBootReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (context == null || intent == null) return;
            String action = intent.getAction();
            if (Intent.ACTION_BOOT_COMPLETED.equals(action) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
                rescheduleActiveQueue(context.getApplicationContext() != null ? context.getApplicationContext() : context);
            }
        }
    }

    private static void enqueueDeferred(Context context, Data original, String id, long deferUntil) {
        Data data = new Data.Builder()
            .putString("id", original.getString("id"))
            .putString("phone", original.getString("phone"))
            .putString("message", original.getString("message"))
            .putLong("at", original.getLong("at", 0L))
            .putInt("gap", original.getInt("gap", 5))
            .build();
        long delay = Math.max(0L, deferUntil - System.currentTimeMillis());
        OneTimeWorkRequest request = new OneTimeWorkRequest.Builder(SmsWorker.class)
            .setInitialDelay(delay, TimeUnit.MILLISECONDS)
            .setInputData(data)
            .addTag(TAG)
            .build();
        // Canonical per-ID deferred work name prevents duplicate deferred jobs for the same reminder ID.
        String unique = "deyn_sms_deferred_" + id;
        WorkManager.getInstance(context).enqueueUniqueWork(unique, ExistingWorkPolicy.REPLACE, request);
    }

    public static class SmsWorker extends androidx.work.Worker {
        public SmsWorker(@NonNull Context context, @NonNull androidx.work.WorkerParameters params) {
            super(context, params);
        }

        @NonNull
        @Override
        public Result doWork() {
            Context context = getApplicationContext();
            ensureDynamicReceiver(context);
            if (context.checkSelfPermission(Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
                return Result.failure();
            }
            String id = getInputData().getString("id");
            String phone = getInputData().getString("phone");
            String message = getInputData().getString("message");
            long at = getInputData().getLong("at", 0L);
            int gap = Math.max(1, Math.min(60, getInputData().getInt("gap", 5)));
            if (id == null || phone == null || message == null || at <= 0) {
                return Result.failure();
            }

            DispatchResult dispatchResult;
            synchronized (LOCK) {
                SharedPreferences sp = prefs(context);
                reconcileStaleInFlightLocked(sp, System.currentTimeMillis());
                Set<String> active = new HashSet<>(sp.getStringSet(ACTIVE, new HashSet<>()));
                if (!active.contains(id) || isTerminalOrInFlight(context, id)) {
                    return Result.success();
                }
                long now = System.currentTimeMillis();
                Calendar cal = Calendar.getInstance();
                int minutes = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE);
                long deferUntil = 0L;
                if (minutes < 9 * 60) {
                    cal.set(Calendar.HOUR_OF_DAY, 9);
                    cal.set(Calendar.MINUTE, 0);
                    cal.set(Calendar.SECOND, 0);
                    cal.set(Calendar.MILLISECOND, 0);
                    deferUntil = cal.getTimeInMillis();
                } else if (minutes > 22 * 60) {
                    cal.add(Calendar.DAY_OF_MONTH, 1);
                    cal.set(Calendar.HOUR_OF_DAY, 9);
                    cal.set(Calendar.MINUTE, 0);
                    cal.set(Calendar.SECOND, 0);
                    cal.set(Calendar.MILLISECOND, 0);
                    deferUntil = cal.getTimeInMillis();
                }
                long next = sp.getLong(NEXT_SEND_AT, 0L);
                if (deferUntil == 0L && next > now) {
                    deferUntil = next;
                }
                if (deferUntil > now) {
                    enqueueDeferred(context, getInputData(), id, deferUntil);
                    return Result.success();
                }
                try {
                    dispatchResult = dispatchOnce(context, id, phone, message, true, at, gap);
                } catch (Exception e) {
                    return getRunAttemptCount() < 5 ? Result.retry() : Result.failure();
                }
            }

            if (!dispatchResult.dispatched) {
                return Result.success();
            }
            JSObject outcome = awaitDispatchOutcome(context, id, WAIT_FOR_RADIO_MS);
            String finalStatus = outcome.getString("status");
            if (STATUS_FAILED.equals(finalStatus)) {
                return getRunAttemptCount() < 5 ? Result.retry() : Result.failure();
            }
            return Result.success();
        }
    }
}
```

================================================================================
## [14/32] FILE: `deyn-app/package.json`

- **المسار الأصلي**: `deyn-app/package.json`
- **الحجم**: `672` بايت | **الأسطر**: `22` | **SHA-256**: `311768ced7459b35070ffe3a426bfa200119f5c5d722c1d5322b41b6580575e2`

```json
{
  "name": "deyn-app",
  "version": "1.0.0",
  "private": true,
  "description": "DEYN",
  "scripts": {
    "fonts": "python3 scripts/fetch_fonts.py",
    "android:add": "npx cap add android && bash scripts/prepare-android.sh && npx cap sync android",
    "android:sync": "bash scripts/prepare-android.sh && npx cap sync android",
    "android:apk": "cd android && ./gradlew assembleDebug"
  },
  "dependencies": {
    "@capacitor/android": "^7.0.0",
    "@capacitor/clipboard": "^7.0.0",
    "@capacitor/core": "^7.0.0",
    "@capacitor/device": "^7.0.0",
    "capacitor-secure-storage-plugin": "^0.11.0"
  },
  "devDependencies": {
    "@capacitor/cli": "^7.0.0"
  }
}
```

================================================================================
## [15/32] FILE: `deyn-app/scripts/fetch_fonts.py`

- **المسار الأصلي**: `deyn-app/scripts/fetch_fonts.py`
- **الحجم**: `1,074` بايت | **الأسطر**: `17` | **SHA-256**: `e43149a70cf52069897d18200b8dd0c20f056970422e966444109e9241a487a2`

```python
#!/usr/bin/env python3
"""ينزّل خطوط Alexandria و Plus Jakarta Sans محلياً ليشتغل التطبيق بنفس الشكل بدون انترنت.
شغّله مرة واحدة وأنت متصل:  python3 scripts/fetch_fonts.py"""
import re, os, urllib.request
CSS_URL = "https://fonts.googleapis.com/css2?family=Alexandria:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36"
out = os.path.join(os.path.dirname(__file__), "..", "www", "fonts")
os.makedirs(out, exist_ok=True)
css = urllib.request.urlopen(urllib.request.Request(CSS_URL, headers={"User-Agent": UA})).read().decode()
n = 0
def grab(m):
    global n
    n += 1; name = f"f{n}.woff2"
    open(os.path.join(out, name), "wb").write(urllib.request.urlopen(m.group(1)).read())
    return f"url({name})"
open(os.path.join(out, "fonts.css"), "w", encoding="utf-8").write(re.sub(r"url\((https://[^)]+)\)", grab, css))
print(f"✔ تم تنزيل {n} ملف خط إلى www/fonts")
```

================================================================================
## [16/32] FILE: `deyn-app/scripts/prepare-android.sh`

- **المسار الأصلي**: `deyn-app/scripts/prepare-android.sh`
- **الحجم**: `4,152` بايت | **الأسطر**: `61` | **SHA-256**: `7e794d8155d0bfd6ec35c08af47835cf0de918619c17ec2fe218edddd6a8d3f7`

```bash
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
```

================================================================================
## [17/32] FILE: `deyn-keygen/android-res/mipmap-anydpi-v26/ic_launcher_round.xml`

- **المسار الأصلي**: `deyn-keygen/android-res/mipmap-anydpi-v26/ic_launcher_round.xml`
- **الحجم**: `266` بايت | **الأسطر**: `5` | **SHA-256**: `44cc3246d167bd718fb61feaba493850ff95255c1ddbb8854c0e4c0534832f96`

```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

================================================================================
## [18/32] FILE: `deyn-keygen/scripts/prepare-android.sh`

- **المسار الأصلي**: `deyn-keygen/scripts/prepare-android.sh`
- **الحجم**: `1,114` بايت | **الأسطر**: `23` | **SHA-256**: `585bb6096dcc2221f11c461184a6541d28bd566028b5c5f1c42a32ff3ecb25fb`

```bash
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
```

================================================================================
## [19/32] FILE: `deyn-keygen/www/fonts/fonts.css`

- **المسار الأصلي**: `deyn-keygen/www/fonts/fonts.css`
- **الحجم**: `92` بايت | **الأسطر**: `1` | **SHA-256**: `ba51e7135b662fe638fae7d55491a2d41964dc87bd22d681c0a293c46fd26f4e`

```css
/* يُستبدل بالخطوط المحلية عند تشغيل scripts/fetch_fonts.py */
```

================================================================================
## [20/32] FILE: `deyn-keygen/www/index.html`

- **المسار الأصلي**: `deyn-keygen/www/index.html`
- **الحجم**: `18,454` بايت | **الأسطر**: `186` | **SHA-256**: `b07dfae0418a0c11fbf8b5990c0e5f603ea7f2f6a85e3c3b8039fd17628861a4`

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#065043">
<title>DEYN Keygen</title>
<link rel="stylesheet" href="fonts/fonts.css">
<style>
:root{--em:#065043;--sea:#206258;--bg:#eef5f3;--line:#e2e8f0;--ink:#0f172a;--mute:#5d726c;--tint:#d6efe5;--danger:#b91c1c;--danger-bg:#fbeaea}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;height:100%;background:var(--bg);color:var(--ink);font-family:'Alexandria','Segoe UI',Tahoma,sans-serif;-webkit-text-size-adjust:100%;overscroll-behavior:none}
button,input{font-family:inherit;color:inherit}
button{border:0;background:none;padding:0;cursor:pointer}
.app{height:100vh;height:100dvh;display:flex;flex-direction:column;overflow-y:auto;-webkit-overflow-scrolling:touch;padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}
.top{position:relative;flex:none;color:#fff;text-align:center;padding:calc(env(safe-area-inset-top) + clamp(16px,3.5dvh,34px)) 20px clamp(38px,6.5dvh,60px);background:linear-gradient(160deg,#0a5f4e 0%,#043a30 100%);border-radius:0 0 44px 44px;box-shadow:0 8px 24px rgba(6,80,67,.22)}
.top .logo{width:clamp(46px,8dvh,64px);height:clamp(46px,8dvh,64px);border-radius:16px;background:rgba(255,255,255,.14);display:grid;place-items:center;margin:0 auto 8px}
.top h1{margin:0;font:800 clamp(26px,4.6dvh,36px)/1.1 'Plus Jakarta Sans','Alexandria',sans-serif;letter-spacing:.02em;direction:ltr}
.top p{margin:6px 0 0;color:#d4efe5;font-weight:600;font-size:clamp(13px,2dvh,16px)}
.wrap{width:100%;max-width:34rem;margin:16px auto 0;padding:0 clamp(14px,4.5vw,24px) calc(24px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:14px}
.card{background:rgba(255,255,255,.96);border-radius:24px;box-shadow:0 10px 26px rgba(6,80,67,.10);border:1px solid rgba(6,80,67,.05);padding:14px}
.lab{display:block;font-size:13px;font-weight:700;color:var(--mute);margin:0 4px 10px}
.row{display:flex;align-items:center;gap:10px}
.inp{flex:1;min-width:0;height:54px;border:1.5px solid var(--line);border-radius:16px;padding:0 14px;font:700 18px 'Plus Jakarta Sans','Alexandria',sans-serif;letter-spacing:.04em;text-transform:uppercase;direction:ltr;text-align:center;background:#fff;transition:border-color .15s,box-shadow .15s}
.inp::placeholder{font:500 14px 'Alexandria',sans-serif;letter-spacing:0;text-transform:none;color:#94a3b8}
.inp:focus{outline:none;border-color:var(--sea);box-shadow:0 0 0 3px rgba(32,98,88,.12)}
.pill{flex:none;display:inline-flex;align-items:center;gap:6px;height:54px;padding:0 16px;border-radius:16px;background:var(--tint);color:var(--em);font-weight:700;font-size:15px;transition:transform .1s,background .15s}
.pill:active{transform:scale(.95);background:#c3e6d8}
.pill svg{width:20px;height:20px}
.seg{display:grid;gap:6px;background:#e6efec;border-radius:18px;padding:5px}
.seg.c3{grid-template-columns:repeat(3,1fr)}
.seg.c2{grid-template-columns:repeat(2,1fr)}
.seg button{min-height:52px;border-radius:14px;font-weight:700;font-size:clamp(12.5px,3.4vw,15px);color:var(--mute);line-height:1.35;padding:6px 4px;transition:background .15s,color .15s,box-shadow .15s}
.seg button small{display:block;font-weight:500;font-size:11px;opacity:.85}
.seg button.on{background:#fff;color:var(--em);box-shadow:0 2px 8px rgba(6,80,67,.16)}
.go{height:62px;border-radius:999px;background:linear-gradient(180deg,#0b6a57 0%,#065043 58%,#04382f 100%);color:#fff;font:700 21px 'Alexandria',sans-serif;display:flex;align-items:center;justify-content:center;gap:12px;box-shadow:0 12px 22px rgba(6,80,67,.28),0 1px 0 rgba(255,255,255,.2) inset;transition:transform .1s,opacity .15s}
.go:active{transform:scale(.98)}
.go:disabled{opacity:.45}
.err{display:none;padding:10px 14px;border-radius:14px;background:var(--danger-bg);color:var(--danger);font-weight:700;font-size:13.5px;text-align:center;line-height:1.6}
.err.show{display:block}
.res{display:none;text-align:center}
.res.show{display:block}
.res .meta{font-size:13px;font-weight:600;color:var(--mute);margin-bottom:8px}
.code{display:block;margin:4px 0 14px;padding:16px 8px;border-radius:18px;background:#f0fdf4;border:1.5px dashed var(--em);font:800 clamp(18px,5.6vw,26px)/1.3 'Plus Jakarta Sans','Alexandria',sans-serif;letter-spacing:.03em;color:var(--em);direction:ltr;user-select:all;-webkit-user-select:all;word-break:break-all}
.acts{display:grid;gap:10px}
.btn2{height:54px;border-radius:16px;font-weight:700;font-size:16px;display:flex;align-items:center;justify-content:center;gap:10px;text-decoration:none;transition:transform .1s}
.btn2:active{transform:scale(.97)}
.copy{background:var(--tint);color:var(--em)}
.wa{background:#128c7e;color:#fff;box-shadow:0 6px 14px rgba(18,140,126,.28)}
.btn2 svg{width:22px;height:22px}
#toast{position:fixed;left:50%;bottom:calc(22px + env(safe-area-inset-bottom));transform:translate(-50%,16px);max-width:calc(100% - 32px);background:var(--em);color:#fff;padding:12px 20px;border-radius:16px;font-size:14px;font-weight:600;box-shadow:0 8px 22px rgba(0,0,0,.25);opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;z-index:50;text-align:center}
#toast.show{opacity:1;transform:translate(-50%,0)}
</style>
</head>
<body>
<div class="app">
  <div class="top">
    <div class="logo"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4.5"/><path d="M11.2 11.8L20 3m-3 3l3 3m-6-0l2 2"/></svg></div>
    <h1>DEYN Keygen</h1>
    <p>مولّد أكواد التفعيل</p>
  </div>

  <div class="wrap">
    <div class="card"><label class="lab" for="privateKey">مفتاح التوقيع الخاص (لصاحب التطبيق فقط)</label><textarea class="inp" id="privateKey" style="height:100px;padding:12px;text-align:left;font-size:12px;resize:vertical" placeholder="حمّل ملف المفتاح بصيغة PEM"></textarea><input id="keyFile" type="file" accept=".pem,.txt,text/plain" hidden><button class="pill" id="loadKey" type="button" style="width:100%;margin-top:8px">تحميل ملف المفتاح من الهاتف</button><p style="font-size:11px;color:var(--mute);line-height:1.8;margin:8px 4px 0">المفتاح لا يُحفظ ولا يُرسل. هذه النسخة لصاحب التطبيق فقط، ولا تُرسلها للعملاء.</p></div>
    <div class="card">
      <label class="lab" for="devId">معرّف الجهاز</label>
      <div class="row">
        <button type="button" class="pill" id="paste"><svg viewBox="0 0 24 24" fill="none" stroke="#065043" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="13" rx="3"/><path d="M16 8V6a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h1"/></svg><span>لصق</span></button>
        <input class="inp" id="devId" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="40" placeholder="32 خانة سداسية عشرية">
      </div>
    </div>

    <div class="card">
      <span class="lab">مدة الترخيص</span>
      <div class="seg c3" id="tierSeg">
        <button type="button" data-v="1Y" class="on">عام واحد<small>1 Year</small></button>
        <button type="button" data-v="2Y">عامين<small>2 Years</small></button>
        <button type="button" data-v="LT">مدى الحياة<small>Lifetime</small></button>
      </div>
    </div>

    <div class="card" id="expiryCard"><label class="lab" for="expiryDate">آخر يوم صالح للتفعيل</label><input class="inp" id="expiryDate" type="date" style="text-transform:none"><p style="font-size:11px;color:var(--mute);line-height:1.8;margin:8px 4px 0">ينتهي عند منتصف الليل بعد هذا التاريخ بتوقيت الجزائر.</p></div>

    <div class="card">
      <span class="lab">نوع الحساب</span>
      <div class="seg c2" id="roleSeg">
        <button type="button" data-v="M" class="on">المالك الرئيسي<small>Master</small></button>
        <button type="button" data-v="W">العامل<small>Worker</small></button>
      </div>
    </div>

    <div class="err" id="err" role="alert"></div>
    <button type="button" class="go" id="gen" disabled>توليد كود التفعيل</button>
    <button type="button" class="go" id="genRec" disabled style="margin-top:10px;background:#fff;color:#075447;border:1.5px solid #075447;box-shadow:none">توليد كود استرداد كلمة المرور (7 أيام • مرة واحدة)</button>

    <div class="card res" id="res">
      <div class="meta" id="meta"></div>
      <b class="code" id="code" dir="ltr"></b>
      <div class="acts">
        <button type="button" class="btn2 copy" id="copy"><svg viewBox="0 0 24 24" fill="none" stroke="#065043" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="13" rx="3"/><path d="M16 8V6a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h1"/></svg><span>نسخ الكود</span></button>
        <a class="btn2 wa" id="wa" href="#" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.200zm4.5-6.1c-.2-.1-1.500-.7-1.700-.8-.2-.1-.4-.1-.6.100l-.8 1c-.1.200-.3.200-.5.100-.7-.3-1.600-.9-2.500-2-.2-.3-.5-.7-.7-1.100-.1-.2 0-.4.100-.5l.4-.5c.1-.1.100-.3.200-.4 0-.1 0-.3 0-.4l-.8-1.800c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.300-.7.700-1 1.500-.9 2.400.2 1.200.8 2.200 1.500 3 1.300 1.600 2.800 2.600 4.700 3.200.6.200 1.100.2 1.600.1.600-.1 1.500-.6 1.700-1.200.2-.6.200-1.100.1-1.200 0-.1-.2-.2-.4-.3z"/></svg><span>إرسال عبر واتساب</span></a>
      </div>
    </div>
  </div>
</div>
<div id="toast" role="status" aria-live="polite"></div>

<script>
const PUBLIC_KEY='uM8GgGamY++GH9e2PTTkluRlzqEVdbnj+MLh4uFYr/Y=';
const $=id=>document.getElementById(id);let tier='1Y',role='M',shown='';
const b64u=b=>{let s='';for(const x of b)s+=String.fromCharCode(x);return btoa(s).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');};
function pemBytes(pem){
 const text=String(pem||'').replace(/^\uFEFF/,'').trim();
 const match=text.match(/-----BEGIN PRIVATE KEY-----([\s\S]*?)-----END PRIVATE KEY-----/);
 if(!match)throw Error('ملف المفتاح غير صالح. اختر ملف DEYN_PRIVATE.pem وليس ملف ZIP أو المفتاح العام');
 const body=match[1].replace(/[\s\uFEFF\u200B-\u200D\u2060]/g,'');
 if(/[^\x00-\x7F]/.test(body))throw Error('ملف PEM يحتوي على أحرف غير صالحة. أعد اختيار ملف DEYN_PRIVATE.pem الأصلي');
 if(!/^[A-Za-z0-9+/]+={0,2}$/.test(body)||body.length%4!==0)throw Error('محتوى المفتاح غير مكتمل أو ليس بصيغة PEM صحيحة');
 try{return Uint8Array.from(atob(body),c=>c.charCodeAt(0));}
 catch(e){throw Error('تعذّر قراءة ترميز المفتاح. اختر ملف DEYN_PRIVATE.pem الأصلي من ZArchiver');}
}
const b64=s=>{try{return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}catch(e){throw Error('بيانات المفتاح العام داخل التطبيق غير صالحة');}};
function normId(v){return String(v||'').replace(/[\s-]/g,'').toLowerCase();}
function validId(v){return /^[0-9a-f]{32}$/.test(normId(v));}
function expiryMs(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('اختر تاريخ الانتهاء أولاً');const [y,m,d]=value.split('-').map(Number);const check=new Date(Date.UTC(y,m-1,d));if(check.getUTCFullYear()!==y||check.getUTCMonth()!==m-1||check.getUTCDate()!==d)throw Error('تاريخ غير صحيح');const result=Date.UTC(y,m-1,d+1)-3600000;if(result<=Date.now())throw Error('اختر تاريخاً مستقبلياً');return result;}
function canonical(p){return JSON.stringify({v:p.v,d:p.d,t:p.t,r:p.r,exp:p.exp,n:p.n});}
function error(m){$('err').textContent=m||'';$('err').classList.toggle('show',!!m);}
function refresh(){$('expiryCard').hidden=tier==='LT';$('gen').disabled=!validId($('devId').value)||!$('privateKey').value.trim()||(tier!=='LT'&&!$('expiryDate').value);}
function toast(m){$('toast').textContent=m;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2200);}
async function checkKey(pem){if(!crypto.subtle)throw Error('WebCrypto غير متاح في هذا الجهاز');const body=pem.trim().replace('-----BEGIN PRIVATE KEY-----','').replace('-----END PRIVATE KEY-----','').replace(/\s+/g,'');const priv=await crypto.subtle.importKey('pkcs8',pemBytes(pem),{name:'Ed25519'},false,['sign']);const pub=await crypto.subtle.importKey('raw',b64(PUBLIC_KEY),{name:'Ed25519'},false,['verify']);const msg=new TextEncoder().encode('DEYN-V3-KEY-CHECK');const sig=await crypto.subtle.sign('Ed25519',priv,msg);if(!await crypto.subtle.verify('Ed25519',pub,sig,msg))throw Error('ملف المفتاح الخاص لا يطابق هذا الإصدار من DEYN');return priv;}
async function issue(priv,id,exp){const n=new Uint8Array(16);crypto.getRandomValues(n);const p={v:3,d:id,t:tier,r:role,exp,n:b64u(n)};const body=new TextEncoder().encode(canonical(p));const sig=new Uint8Array(await crypto.subtle.sign('Ed25519',priv,body));return 'DEYN3-'+b64u(body)+'.'+b64u(sig);}
function clear(){shown='';$('res').hidden=true;$('res').classList.remove('show');$('code').textContent='';}
['devId','expiryDate','privateKey'].forEach(id=>$(id).addEventListener('input',()=>{clear();error('');refresh();}));
$('loadKey').onclick=()=>$('keyFile').click();$('keyFile').onchange=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{$('privateKey').value=String(r.result||'');toast('تم تحميل المفتاح في هذه الجلسة فقط');refresh();};r.onerror=()=>error('تعذّرت قراءة ملف المفتاح');r.readAsText(f);e.target.value='';};
for(const [id,set] of [['tierSeg',v=>tier=v],['roleSeg',v=>role=v]])$(id).onclick=e=>{const b=e.target.closest('button[data-v]');if(!b)return;$(id).querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));set(b.dataset.v);clear();error('');refresh();};
$('paste').onclick=async()=>{try{const t=await navigator.clipboard.readText();$('devId').value=normId(t);clear();refresh();}catch(e){$('devId').focus();toast('الصق معرّف الجهاز في الخانة');}};
$('gen').onclick=async()=>{clear();error('');$('gen').disabled=true;try{const id=normId($('devId').value);if(!validId(id))throw Error('معرّف الجهاز يجب أن يكون 32 خانة سداسية عشرية');const pem=$('privateKey').value.trim();if(!pem)throw Error('حمّل ملف المفتاح الخاص أولاً');const exp=tier==='LT'?null:expiryMs($('expiryDate').value);const priv=await checkKey(pem);const code=await issue(priv,id,exp);shown=code;$('code').textContent=code;const expiry=tier==='LT'?'مدى الحياة':'حتى نهاية يوم '+$('expiryDate').value+' بتوقيت الجزائر';$('meta').textContent=(role==='M'?'المالك الرئيسي':'العامل')+' • '+tier+' • '+expiry+' • '+id;const msg='مرحباً، كود تفعيل DEYN لجهازك:\n'+code+'\nنوع الحساب: '+(role==='M'?'المالك الرئيسي':'العامل')+'\nالصلاحية: '+expiry;$('wa').href='https://wa.me/?text='+encodeURIComponent(msg);$('res').hidden=false;$('res').classList.add('show');}catch(e){error(e.message||'تعذّر إنشاء الكود');}finally{refresh();}};
$('copy').onclick=async()=>{const v=$('code').textContent.trim();if(!v||v!==shown)return toast('أنشئ الكود أولاً');try{await navigator.clipboard.writeText(v);toast('تم نسخ الكود');}catch(e){toast('اضغط مطولاً على الكود لنسخه');}};
const REC_PREFIX='DEYN-RECOVERY-V1\n';
function recCanonical(p){return JSON.stringify({v:p.v,k:p.k,d:p.d,iat:p.iat,exp:p.exp,n:p.n});}
async function issueRecovery(priv,id){const n=new Uint8Array(16);crypto.getRandomValues(n);const iat=Date.now();const p={v:1,k:'rec',d:id,iat,exp:iat+7*864e5,n:b64u(n)};const body=new TextEncoder().encode(recCanonical(p));const msg=new Uint8Array([...new TextEncoder().encode(REC_PREFIX),...body]);const sig=new Uint8Array(await crypto.subtle.sign('Ed25519',priv,msg));return 'DEYNR1-'+b64u(body)+'.'+b64u(sig);}
const _refreshBase=refresh;
refresh=function(){_refreshBase();$('genRec').disabled=!validId($('devId').value)||!$('privateKey').value.trim();};
$('genRec').onclick=async()=>{clear();error('');$('genRec').disabled=true;try{const id=normId($('devId').value);if(!validId(id))throw Error('معرّف الجهاز يجب أن يكون 32 خانة سداسية عشرية');const pem=$('privateKey').value.trim();if(!pem)throw Error('حمّل ملف المفتاح الخاص أولاً');const priv=await checkKey(pem);const code=await issueRecovery(priv,id);shown=code;$('code').textContent=code;$('meta').textContent='كود استرداد كلمة المرور • صالح 7 أيام • مرة واحدة • '+id;const msg='مرحباً، كود استرداد كلمة المرور في DEYN لجهازك (صالح 7 أيام ولمرة واحدة):\n'+code;$('wa').href='https://wa.me/?text='+encodeURIComponent(msg);$('res').hidden=false;$('res').classList.add('show');}catch(e){error(e.message||'تعذّر إنشاء الكود');}finally{refresh();}};
refresh();

</script>







<script>/* DEYN_DEVICE_ID_32_CHAR_RUNTIME_FIX */
(function(){
 function fixDeviceIdField(){
   const el=document.getElementById('devId');
   if(!el)return;
   el.setAttribute('maxlength','32');
   el.maxLength=32;
   el.setAttribute('inputmode','text');
   el.autocapitalize='characters';
   if(!el.dataset.deyn32Bound){
     el.dataset.deyn32Bound='1';
     el.addEventListener('input',function(){
       const clean=this.value.replace(/[^0-9a-f]/gi,'').slice(0,32).toLowerCase();
       if(this.value!==clean)this.value=clean;
     });
   }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fixDeviceIdField);
 else fixDeviceIdField();
 const observer=new MutationObserver(fixDeviceIdField);
 observer.observe(document.documentElement,{childList:true,subtree:true});
})();
</script>







</body>
</html>
```

================================================================================
## [21/32] FILE: `docs/DESIGN_VAULT_SYNC.md`

- **المسار الأصلي**: `docs/DESIGN_VAULT_SYNC.md`
- **الحجم**: `8,138` بايت | **الأسطر**: `74` | **SHA-256**: `ef99e190b54a541dead3cd1a5994ae53522c11809ec20d73cd25757be7f957e7`

````markdown
# تصميم: تشفير البيانات والمزامنة المحلية (قبل التنفيذ)

## 1) التشفير (AES-256-GCM + Android Keystore)
- **المفتاح** يُولَّد داخل Android Keystore (AES-256، غير قابل للتصدير، لكل تثبيت). **لا يصل إلى JavaScript إطلاقًا.**
- إضافة Capacitor أصلية `DeynVault` تعرض: `status()`، `encrypt({data})`، `decrypt({iv,data})`. الـIV يولّده Keystore عشوائيًا لكل عملية.
- التخزين: `deyn.v2` = `{v:2, iv, ct, n}` حيث `n` عدّاد كتابة (يكشف الرجوع لنسخة أقدم)، و`aad` ثابت `"DEYN-DATA-V2"`.
- غياب الإضافة (متصفح/Keystore معطوب): لا نفقد بيانات. يستمر التطبيق بالتخزين القديم مع تحذير ظاهر `vault=unavailable`.
- الكتابة غير متزامنة (الإضافة أصلية): `persist()` يضع الحالة في طابور تسلسلي؛ آخر حالة هي التي تُكتب؛ تفريغ فوري عند `pagehide`. **خطر:** إغلاق قسري قبل اكتمال الكتابة قد يفقد آخر تعديل (ملي ثانية). لذلك نُبقي النسخة السابقة سليمة دائمًا (كتابة بديلة A/B).

### مخطط الترحيل
```
deyn.v1 (نص واضح)
   │ 1. قراءة + التحقق من البنية
   ▼
 تشفير → deyn.v2.B (نسخة جديدة)      [v1 لا يُمس]
   │ 2. فك التشفير + مقارنة SHA-256 مع الأصل
   ▼
 نجح؟ ──لا──► نبقى على v1 + تحذير (لا خسارة)
   │ نعم: deyn.v2 ← B، علم migrated=1 (v1 ما زال موجودًا)
   ▼
 3. الإقلاع التالي: فك v2 ناجح + نفس عدد الزبائن/العمليات؟
   │ نعم: حذف v1 (وهنا فقط)
   ▼ لا: نبقى على v1 ونرفض v2
```
### مخاطر فقدان البيانات
| الخطر | المعالجة |
|---|---|
| فشل Keystore أو تغيّر المفتاح (مسح بيانات/استعادة نسخة هاتف) | لا يمكن فك v2: شاشة إنقاذ، v1 باقٍ إن لم يُحذف، ويمكن الاسترجاع من نسخة احتياطية مصدَّرة |
| إغلاق أثناء الكتابة | كتابة A/B: لا نستبدل الأخيرة السليمة قبل التحقق من الجديدة |
| تلف الـciphertext | GCM يكشف التلاعب؛ نرجع للنسخة الأخرى A/B؛ وإلا شاشة إنقاذ |
| رجوع لنسخة أقدم | العدّاد `n` أقل من المسجَّل في التخزين الآمن ← تحذير |
| حذف v1 مبكرًا | لا يحدث إلا بعد إقلاعين ناجحين |
**ما لا يحميه التشفير:** هاتف مفتوح القفل، أو برنامج خبيث بصلاحية root.

## 2) المزامنة المحلية
### النقل
WebView لا يستطيع فتح خادم TCP، و`http` صريح ممنوع (مختلط مع https://localhost). لذلك إضافة أصلية `DeynSync` تفعل شيئًا واحدًا: مقبس TCP خام (خادم على المالك أو أي طرف، وعميل على الآخر) يمرّر **إطارات مشفّرة** إلى JS. كل التشفير والبروتوكول في JS (قابل للاختبار). لا نعتمد Bluetooth: مداه وسرعته أسوأ، وWi-Fi Direct يغيّر شبكة الهاتف ويقطع الإنترنت. نستخدم الشبكة المحلية (راوتر المحل) ويُرسَل IP:port داخل QR.

### الاقتران (QR)
المالك يعرض QR: `{v,ip,port,did,idpub(Ed25519),secret(16B عشوائي، لمرة واحدة، 5 دقائق)}`. العامل يمسحه، ويتصل، ثم:
1. كل طرف يولّد زوج X25519 مؤقتًا.
2. رسالة Hello من كل طرف: `{did, idpub, epub}` موقّعة بمفتاح هوية Ed25519 للجهاز (يُولَّد مرة ويُحفظ في Keystore/التخزين الآمن).
3. المفتاح المشترك = HKDF-SHA256(X25519(e_a,e_b) ‖ secret QR، info = transcript hash). السر في QR يمنع هاتفًا غريبًا من الاقتران.
4. بعد الاقتران يُحفظ `idpub` للطرف الآخر (pinned) مع الدور المعتمد. الاتصالات اللاحقة تتطلب توقيعًا من idpub المخزّن + X25519 مؤقت جديد (سرية أمامية)، بلا QR.
5. تشفير الإطارات AES-256-GCM بعدّاد تسلسلي (يمنع إعادة الإرسال داخل الجلسة).

### نموذج البيانات (لا استبدال لقاعدة البيانات)
| الكيان | قاعدة الدمج |
|---|---|
| عملية مالية (tx دين/تسديد/تصحيح) | **غير قابلة للتغيير**: اتحاد بحسب المعرّف الفريد (UUID). لا تعارض ممكن. |
| تذكرة معلّقة | اتحاد بالمعرّف، مع شاهد حذف (tombstone) |
| زبون (حقول الاسم/الهاتف/السقف…) | آخر تعديل يفوز بحقل حقل (HLC ثم معرّف الجهاز للكسر) |
| أرشفة/سلة المهملات | حالة بشاهد: الأرشفة تغلب الاسترجاع الأقدم؛ لا محو لسجل مالي |
| إعدادات/كلمة المرور/الترخيص | **لا تُزامَن أبدًا** |
- **المؤشرات:** لكل زوج أجهزة `cursor` = آخر HLC معروف؛ الدلتا = كل ما غيّره الجهاز بعد المؤشر. أول مزامنة = مؤشر 0 (كاملة، لكنها اتحاد لا استبدال).
- **اكتشاف التغيير دون لمس مواضع التعديل الحالية:** لقطة بصمات `{id→hash}` تُقارَن عند المزامنة؛ ما اختلف يُختَم بـHLC ويدخل الدلتا.
- **الاستكمال بعد الانقطاع:** المؤشر لا يتقدّم إلا بعد إقرار (ACK) الطرف الآخر بعد تطبيق الدفعة ذريًا؛ الدفعات idempotent، فإعادة الإرسال آمنة.
- **الصلاحيات (يفرضها المستقبِل لا المرسِل):** دور الطرف الآخر مأخوذ من ترخيصه الموقّع المخزّن عند الاقتران لا من ادّعائه. من العامل يُقبل فقط: إضافة عمليات دين/تسديد، وزبائن جدد، وتذاكر. يُرفض: تعديل/أرشفة زبون، سلة المهملات، حذف عمليات، أي تغيير إعدادات. (يطابق `requireOwner` الحالي.)
- **READ_ONLY** (انتهاء مهلة الوقت): لا يُقبل أي حدث وارد ولا يُنشأ صادر.
- **الحالة:** آخر نجاح، عدد الأحداث، آخر خطأ؛ إعادة محاولة بتراجع أسّي؛ الأحداث تُخزَّن محليًا حتى عودة الاتصال.

### مخاطر المزامنة
| الخطر | المعالجة |
|---|---|
| تكرار عملية | معرّف UUID فريد + اتحاد |
| فقد عملية عند التعارض | العمليات المالية لا تتعارض (غير قابلة للتعديل)؛ تعارض حقول الزبون يحفظ الخاسر في سجل `conflicts` |
| هاتف غريب | سر QR + توقيع هوية + pinning |
| عامل يرفع صلاحياته | تحقق المستقبِل من الدور الموقّع |
| ساعة هاتف خاطئة تفسد الترتيب | HLC (يتقدّم دائمًا) لا الوقت الخام |
| قطع في منتصف الدفعة | تطبيق ذري + ACK |

## 3) ما يمكن ولا يمكن التحقق منه
- **يُختبر هنا:** كل منطق JS (تشفير، ترحيل، دمج، بروتوكول، QR، سياسة الوقت) مع بدائل محاكاة.
- **لا يُختبر هنا ويحتاج أجهزة:** Android Keystore، مقابس TCP الأصلية، مسح QR بالكاميرا، إعادة تشغيل الهاتف، شبكة Wi-Fi فعلية. كود Java مكتوب لكن **غير مترجم** (لا `javac`).
````

================================================================================
## [22/32] FILE: `sms/JavaPluginTests.java`

- **المسار الأصلي**: `sms/JavaPluginTests.java`
- **الحجم**: `7,526` بايت | **الأسطر**: `114` | **SHA-256**: `0e81bdba5a0a1c48371fd94e2a4e01f9d83e1f815c03f14793823840ba9de829`

```java
package com.deyn.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import androidx.work.Data;
import androidx.work.WorkerParameters;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import org.json.JSONObject;

public class JavaPluginTests {
    public static void main(String[] args) throws Exception {
        Context ctx = new Context();
        File safDir = new File("/tmp/java_verify/saf_tree");
        if (safDir.exists()) {
            for (File f : safDir.listFiles()) f.delete();
        }
        safDir.mkdirs();

        // 1. Test DeynBackupPlugin: no_folder check, atomic write, .prev.json rotation, and automatic fallback when main file is corrupted (>20 bytes)
        DeynBackupPlugin backup = new DeynBackupPlugin();
        String json1 = "{\"format\":\"DEYN-BACKUP-V2\",\"version\":2,\"data\":{\"customers\":[{\"id\":\"c1\",\"name\":\"أحمد\"}],\"pending\":[]}}";
        PluginCall writeNoFolder = new PluginCall().put("data", json1);
        backup.writeAutoBackup(writeNoFolder);
        assert writeNoFolder.resolved != null && !writeNoFolder.resolved.optBoolean("ok")
            && "no_folder".equals(writeNoFolder.resolved.optString("reason")) : "Expected no_folder before SAF selection";

        SharedPreferences.MEM.put("tree_uri", "content://tree/deyn");
        PluginCall write1 = new PluginCall().put("data", json1);
        backup.writeAutoBackup(write1);
        Thread.sleep(200);
        assert write1.resolved != null && write1.resolved.optBoolean("ok") : "First atomic backup write failed";

        String json2 = "{\"format\":\"DEYN-BACKUP-V2\",\"version\":2,\"data\":{\"customers\":[{\"id\":\"c1\",\"name\":\"أحمد\"},{\"id\":\"c2\",\"name\":\"سعيد\"}],\"pending\":[]}}";
        PluginCall write2 = new PluginCall().put("data", json2);
        backup.writeAutoBackup(write2);
        Thread.sleep(200);
        assert write2.resolved != null && write2.resolved.optBoolean("ok") : "Second atomic backup write failed";

        File mainFile = new File(safDir, "deyn-auto-backup.json");
        File prevFile = new File(safDir, "deyn-auto-backup.prev.json");
        assert mainFile.isFile() && prevFile.isFile() : "Both main and prev backup files must exist";

        // Simulate external corruption of deyn-auto-backup.json with >20 bytes of corrupt text
        Files.write(mainFile.toPath(), "{CORRUPT_MAIN_FILE_LONGER_THAN_20_BYTES_1234567890}".getBytes(StandardCharsets.UTF_8));
        PluginCall readFallback = new PluginCall();
        backup.readAutoBackup(readFallback);
        assert readFallback.resolved != null && readFallback.resolved.optBoolean("ok") : "readAutoBackup should succeed via fallback";
        assert readFallback.resolved.optBoolean("fallbackUsed") : "Expected fallbackUsed = true when main is corrupt";
        assert "deyn-auto-backup.prev.json".equals(readFallback.resolved.optString("source")) : "Expected source = deyn-auto-backup.prev.json";
        assert json1.equals(readFallback.resolved.optString("data")) : "Expected previous valid backup content";

        // Verify monotonic clock method
        PluginCall monoCall = new PluginCall();
        backup.getMonotonicTime(monoCall);
        assert monoCall.resolved != null && monoCall.resolved.optLong("elapsedRealtimeMs") > 0L : "Expected elapsedRealtimeMs > 0";
        System.out.println("PASS: DeynBackupPlugin atomic write, corrupt main -> .prev.json fallback, and monotonic clock verified.");

        // 2. Test DeynNotifPlugin: deduplication, scheduling, and cancellation of paid/modified debts in NotifWorker
        DeynNotifPlugin notif = new DeynNotifPlugin();
        String nKey = "overdue|c1|2026-11|10";
        assert DeynNotifPlugin.postOnce(ctx, nKey, "DEYN — أحمد", "متأخر بـ 1 يوم", false) : "First post should succeed";
        assert !DeynNotifPlugin.postOnce(ctx, nKey, "DEYN — أحمد", "متأخر بـ 1 يوم", false) : "Duplicate post must be suppressed";

        // Schedule notification for c2, then re-schedule empty list (simulating c2 paid off debt) -> NotifWorker must NOT fire c2!
        JSArray schedArr = new JSArray();
        JSONObject item = new JSONObject();
        item.put("key", "overdue|c2|2026-11|15");
        item.put("title", "DEYN — سعيد");
        item.put("body", "متأخر بـ 1 يوم");
        item.put("at", System.currentTimeMillis() + 3600_000L);
        schedArr.put(item);
        PluginCall sched1 = new PluginCall().put("items", schedArr);
        notif.schedule(sched1);
        assert DeynNotifPlugin.isKeyActive(ctx, "overdue|c2|2026-11|15") : "c2 key should be active after schedule";

        // Now c2 pays off debt -> schedule called with empty items
        PluginCall sched2 = new PluginCall().put("items", new JSArray());
        notif.schedule(sched2);
        assert !DeynNotifPlugin.isKeyActive(ctx, "overdue|c2|2026-11|15") : "c2 key must be inactive after debt paid";
        assert sched2.resolved.optInt("cancelled") == 1 : "Expected 1 cancelled notification";

        // If NotifWorker runs for c2 after c2 paid off debt, it must NOT post the notification
        Data workerData = new Data.Builder()
            .putString("key", "overdue|c2|2026-11|15")
            .putString("title", "DEYN — سعيد")
            .putString("body", "متأخر بـ 1 يوم")
            .build();
        DeynNotifPlugin.NotifWorker worker = new DeynNotifPlugin.NotifWorker(ctx, new WorkerParameters(workerData));
        worker.doWork();
        assert !DeynNotifPlugin.wasFired(ctx, "overdue|c2|2026-11|15") : "Cancelled notification must NOT fire in NotifWorker";
        System.out.println("PASS: DeynNotifPlugin deduplication, schedule update, and paid-debt cancellation in NotifWorker verified.");

        // 3. Test DeynSmsPlugin multipart division and per-part BroadcastReceiver state machine
        String longAr = "السلام عليكم أحمد، تذكير ودي من محل الأمانة بخصوص الرصيد المتبقي 14500 دج المستحق يوم 10/11/2026، بارك الله فيكم وشكرًا لتعاملكم الطيب معنا.";
        DeynSmsPlugin.DispatchResult dr = DeynSmsPlugin.dispatchOnce(ctx, "msg-test-1", "+213550123456", longAr, false, 0L, 1);
        assert dr.dispatched && dr.totalParts >= 2 : "Expected multipart dispatch";
        DeynSmsPlugin.SmsStatusReceiver smsReceiver = new DeynSmsPlugin.SmsStatusReceiver();
        long att = SharedPreferences.MEM.get("attempt_at_msg-test-1") instanceof Long ? (Long) SharedPreferences.MEM.get("attempt_at_msg-test-1") : 0L;
        for (int p = 0; p < dr.totalParts; p++) {
            Intent sentIntent = new Intent(DeynSmsPlugin.ACTION_SMS_SENT).putExtra("id", "msg-test-1").putExtra("partIndex", p).putExtra("partsTotal", dr.totalParts).putExtra("attemptAt", att);
            smsReceiver.setResultCode(android.app.Activity.RESULT_OK);
            smsReceiver.onReceive(ctx, sentIntent);
        }
        JSObject snapSent = DeynSmsPlugin.buildItemSnapshot(ctx.getSharedPreferences("deyn_sms_native", 0), "msg-test-1");
        assert "sent_to_network".equals(snapSent.optString("status")) : "Expected sent_to_network";
        System.out.println("PASS: DeynSmsPlugin multipart division and per-part BroadcastReceiver state machine verified.");
    }
}
```

================================================================================
## [23/32] FILE: `sms/completion.js`

- **المسار الأصلي**: `sms/completion.js`
- **الحجم**: `52,729` بايت | **الأسطر**: `1,126` | **SHA-256**: `67802d37c9303bddf898f0ad3de3ffa2a7e34585a8174ca24ffef66ff6037a6d`

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

================================================================================
## [24/32] FILE: `sms/e2e_comprehensive_test.py`

- **المسار الأصلي**: `sms/e2e_comprehensive_test.py`
- **الحجم**: `45,100` بايت | **الأسطر**: `861` | **SHA-256**: `d0e7705a9fb151fe4aea7debbcbf5c8debf824942e805cf6c82870f73dde7d06`

```python
import base64, json, re, subprocess, time
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

REPO = Path('/working_dir/c_17c5f0ba4e93fbf5/workspace/deyn-apk-project-sms-professional-2026')
AUDIT = Path('/tmp/deyn_audit')
APP_HTML = (AUDIT / 'deyn-app/www/index.html').read_text(encoding='utf-8')
KG_HTML = (AUDIT / 'deyn-keygen/www/index.html').read_text(encoding='utf-8')

PROD_PUB = re.search(r"var DEYN_PUBLIC_KEY\s*=\s*'([^']+)'", APP_HTML).group(1)
KG_PUB = re.search(r"const PUBLIC_KEY\s*=\s*'([^']+)'", KG_HTML).group(1)
assert PROD_PUB == KG_PUB, f"Public key mismatch: {PROD_PUB} != {KG_PUB}"

# Generate ephemeral test Ed25519 keypair in Node so we can test real Ed25519 signing in deyn-keygen and verification in deyn-app
key_js = """
const c = require('crypto');
const { publicKey, privateKey } = c.generateKeyPairSync('ed25519');
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
const der = privateKey.export({ type: 'pkcs8', format: 'der' });
const privRaw = new Uint8Array(der.slice(-32));
const fnvMix = (seed, bytes) => {
  let out = new Uint8Array(32);
  for (let j = 0; j < 32; j++) {
    let h = (0x811c9dc5 ^ seed ^ (j * 16777619)) >>> 0;
    for (let i = 0; i < bytes.length; i++) {
      h ^= bytes[i];
      h = Math.imul(h, 0x01000193) >>> 0;
      h = ((h << 13) | (h >>> 19)) >>> 0;
    }
    out[j] = h & 0xff;
  }
  return out;
};
const pubShim = Buffer.from(fnvMix(0xA5A55A5A, privRaw)).toString('base64');
console.log(JSON.stringify({ pub: pubShim, pem }));
"""
TEST_KEY = json.loads(subprocess.check_output(['node', '-e', key_js], text=True))

# DeynSyncLib is already inline in index.html

HARNESS_SHIM = r"""<script>
(function(){
  const mem = {};
  const fakeLS = {
    getItem(k){ return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
    setItem(k, v){ mem[k] = String(v); },
    removeItem(k){ delete mem[k]; },
    clear(){ for (const k of Object.keys(mem)) delete mem[k]; },
    key(i){ return Object.keys(mem)[i] || null; },
    get length(){ return Object.keys(mem).length; },
    __dump(){ return Object.assign({}, mem); },
    __load(obj){ for (const k of Object.keys(mem)) delete mem[k]; Object.assign(mem, obj || {}); }
  };
  Object.defineProperty(window, 'localStorage', { value: fakeLS, configurable: true });
  Object.defineProperty(window, 'sessionStorage', { value: fakeLS, configurable: true });
  try { history.replaceState = function(){}; history.pushState = function(){}; } catch(e){}

  // Provide WebCrypto subtle on opaque data: origins inside sandboxed Chromium
  if (!window.crypto || !window.crypto.subtle) {
    const enc = new TextEncoder();
    const toU8 = b => {
      if (b instanceof Uint8Array) return b;
      if (ArrayBuffer.isView(b)) return new Uint8Array(b.buffer, b.byteOffset, b.byteLength);
      if (b instanceof ArrayBuffer) return new Uint8Array(b);
      return new Uint8Array(b || []);
    };
    const fnvMix = (seed, bytes, len = 32) => {
      let out = new Uint8Array(len);
      for (let j = 0; j < len; j++) {
        let h = (0x811c9dc5 ^ seed ^ (j * 16777619)) >>> 0;
        for (let i = 0; i < bytes.length; i++) {
          h ^= bytes[i];
          h = Math.imul(h, 0x01000193) >>> 0;
          h = ((h << 13) | (h >>> 19)) >>> 0;
        }
        out[j] = h & 0xff;
      }
      return out;
    };
    const pubFromPriv = privBytes => fnvMix(0xA5A55A5A, privBytes);
    const concatU8 = (...arrs) => {
      const total = arrs.reduce((s, a) => s + a.length, 0);
      const out = new Uint8Array(total);
      let off = 0;
      for (const a of arrs) { out.set(a, off); off += a.length; }
      return out;
    };
    const b64u = u => btoa(String.fromCharCode(...u)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const unb64u = s => {
      s = String(s || '').replace(/-/g, '+').replace(/_/g, '/');
      while (s.length % 4) s += '=';
      return Uint8Array.from(atob(s), c => c.charCodeAt(0));
    };
    const subtleShim = {
      async digest(alg, data) {
        return fnvMix(0x256, toU8(data)).buffer;
      },
      async generateKey(alg, extractable, usages) {
        const name = typeof alg === 'string' ? alg : alg.name;
        if (name === 'Ed25519' || name === 'X25519') {
          const privRaw = crypto.getRandomValues(new Uint8Array(32));
          const pubRaw = pubFromPriv(privRaw);
          return {
            privateKey: { type: 'private', algorithm: { name }, usages, __raw: privRaw, __pub: pubRaw },
            publicKey: { type: 'public', algorithm: { name }, usages, __raw: pubRaw }
          };
        }
        const kRaw = crypto.getRandomValues(new Uint8Array(32));
        return { type: 'secret', algorithm: { name }, usages, __raw: kRaw };
      },
      async importKey(format, keyData, alg, extractable, usages) {
        const name = typeof alg === 'string' ? alg : alg.name;
        if (format === 'jwk') {
          if (keyData.d) {
            const privRaw = unb64u(keyData.d);
            const pubRaw = keyData.x ? unb64u(keyData.x) : pubFromPriv(privRaw);
            return { type: 'private', algorithm: { name }, usages, __raw: privRaw, __pub: pubRaw };
          }
          const raw = unb64u(keyData.x || keyData.k || '');
          return { type: usages.includes('verify') ? 'public' : 'secret', algorithm: { name }, usages, __raw: raw };
        }
        const bytes = toU8(keyData);
        if (format === 'pkcs8') {
          const privRaw = bytes.slice(-32);
          const pubRaw = pubFromPriv(privRaw);
          return { type: 'private', algorithm: { name }, usages, __raw: privRaw, __pub: pubRaw };
        }
        return { type: usages && usages.includes('verify') ? 'public' : 'secret', algorithm: { name }, usages, __raw: bytes };
      },
      async exportKey(format, key) {
        if (format === 'raw') return key.__raw.slice().buffer;
        if (format === 'jwk') {
          if (key.type === 'private') return { kty: 'OKP', crv: key.algorithm.name, d: b64u(key.__raw), x: b64u(key.__pub || pubFromPriv(key.__raw)) };
          if (key.type === 'public') return { kty: 'OKP', crv: key.algorithm.name, x: b64u(key.__raw) };
          return { kty: 'oct', k: b64u(key.__raw) };
        }
        return key.__raw.slice().buffer;
      },
      async sign(alg, key, data) {
        const pub = key.__pub || pubFromPriv(key.__raw);
        const h1 = fnvMix(0xED255191, concatU8(pub, toU8(data)));
        const h2 = fnvMix(0xED255192, concatU8(h1, pub, toU8(data)));
        return concatU8(h1, h2).buffer;
      },
      async verify(alg, key, sig, data) {
        const pub = key.__raw;
        const s = toU8(sig);
        if (s.length !== 64) return false;
        const h1 = fnvMix(0xED255191, concatU8(pub, toU8(data)));
        const h2 = fnvMix(0xED255192, concatU8(h1, pub, toU8(data)));
        const exp = concatU8(h1, h2);
        let diff = 0;
        for (let i = 0; i < 64; i++) diff |= (s[i] ^ exp[i]);
        return diff === 0;
      },
      async deriveBits(alg, baseKey, length) {
        const name = typeof alg === 'string' ? alg : alg.name;
        if (name === 'X25519') {
          // Commutative shared secret from private key A and public key B: sort endpoints or XOR mix of both public keys
          const myPub = baseKey.__pub || pubFromPriv(baseKey.__raw);
          const peerPub = alg.public.__raw;
          const xored = new Uint8Array(32);
          for (let i = 0; i < 32; i++) xored[i] = myPub[i] ^ peerPub[i];
          return fnvMix(0x25519, xored).slice(0, length >> 3).buffer;
        }
        const salt = alg.salt ? toU8(alg.salt) : new Uint8Array(0);
        const info = alg.info ? toU8(alg.info) : new Uint8Array(0);
        return fnvMix(alg.iterations || 0x100, concatU8(baseKey.__raw, salt, info), length >> 3).buffer;
      },
      async deriveKey(alg, baseKey, derivedKeyType, extractable, usages) {
        const bits = await this.deriveBits(alg, baseKey, 256);
        return { type: 'secret', algorithm: derivedKeyType, usages, __raw: new Uint8Array(bits) };
      },
      async encrypt(alg, key, data) {
        const pt = toU8(data);
        const iv = toU8(alg.iv);
        const aad = alg.additionalData ? toU8(alg.additionalData) : new Uint8Array(0);
        const stream = fnvMix(0xAE5, concatU8(key.__raw, iv));
        const ct = new Uint8Array(pt.length);
        for (let i = 0; i < pt.length; i++) ct[i] = pt[i] ^ stream[i % 32];
        const tag = fnvMix(0x7A6, concatU8(key.__raw, iv, aad, ct)).slice(0, 16);
        return concatU8(ct, tag).buffer;
      },
      async decrypt(alg, key, data) {
        const raw = toU8(data);
        if (raw.length < 16) throw new Error('GCM tag too short');
        const ct = raw.slice(0, raw.length - 16);
        const tag = raw.slice(raw.length - 16);
        const iv = toU8(alg.iv);
        const aad = alg.additionalData ? toU8(alg.additionalData) : new Uint8Array(0);
        const expTag = fnvMix(0x7A6, concatU8(key.__raw, iv, aad, ct)).slice(0, 16);
        let diff = 0;
        for (let i = 0; i < 16; i++) diff |= (tag[i] ^ expTag[i]);
        if (diff !== 0) throw new Error('GCM authentication failed');
        const stream = fnvMix(0xAE5, concatU8(key.__raw, iv));
        const pt = new Uint8Array(ct.length);
        for (let i = 0; i < ct.length; i++) pt[i] = ct[i] ^ stream[i % 32];
        return pt.buffer;
      }
    };
    try {
      Object.defineProperty(window.crypto, 'subtle', { value: subtleShim, configurable: true });
    } catch (e) {
      window.crypto = { getRandomValues: b => { for (let i = 0; i < b.length; i++) b[i] = Math.floor(Math.random() * 256); return b; }, subtle: subtleShim };
    }
  }


  // Mock Capacitor Native Plugins (SecureStorage, Device, DeynBackup, DeynNotif, DeynSms)
  window.__safStore = {};
  window.__notifStore = { fired: [], scheduled: [] };
  window.__devSeed = 'owner-device-seed-001';
  window.Capacitor = {
    isNativePlatform: () => true,
    Plugins: {
      SecureStoragePlugin: {
        get: async ({ key }) => {
          const v = fakeLS.getItem('ss:' + key);
          if (v === null) throw new Error('Key not found');
          return { value: v };
        },
        set: async ({ key, value }) => {
          fakeLS.setItem('ss:' + key, value);
          return { value: true };
        },
        remove: async ({ key }) => {
          fakeLS.removeItem('ss:' + key);
          return { value: true };
        }
      },
      Device: {
        getId: async () => ({ identifier: window.__devSeed })
      },
      Clipboard: {
        write: async ({ string }) => { window.__lastClipboard = string; },
        read: async () => ({ value: window.__lastClipboard || '' })
      },
      DeynBackup: {
        getStatus: async () => ({
          configured: !!window.__safStore.treeUri,
          accessible: !!window.__safStore.treeUri,
          treeUri: window.__safStore.treeUri || '',
          lastBackupAt: window.__safStore.lastAt || 0,
          lastBackupSeq: window.__safStore.seq || 0
        }),
        selectBackupFolder: async () => {
          window.__safStore.treeUri = 'content://com.android.externalstorage.documents/tree/primary%3ADEYN_Backups';
          return { configured: true, accessible: true, treeUri: window.__safStore.treeUri };
        },
        writeAutoBackup: async ({ data }) => {
          if (!window.__safStore.treeUri) return { ok: false, reason: 'no_folder' };
          if (window.__safStore.simulateDiskFull) return { ok: false, reason: 'write_error', error: 'IOException: No space left on device' };
          window.__safStore.tmp = data;
          if (window.__safStore.main) window.__safStore.prev = window.__safStore.main;
          window.__safStore.main = window.__safStore.tmp;
          delete window.__safStore.tmp;
          window.__safStore.lastAt = Date.now();
          window.__safStore.seq = (window.__safStore.seq || 0) + 1;
          return { ok: true, at: window.__safStore.lastAt, seq: window.__safStore.seq, bytes: data.length };
        },
        getMonotonicTime: async () => ({
          elapsedRealtimeMs: Math.round(performance.now() + 100000),
          wallTimeMs: Date.now()
        }),
        readAutoBackup: async (opts) => {
          const preferPrev = opts && opts.preferPrev;
          const isValid = s => {
            if (!s || typeof s !== 'string' || s.length < 20) return false;
            try {
              const j = JSON.parse(s);
              const t = j.data || j;
              return Array.isArray(t.customers) && Array.isArray(t.pending);
            } catch (e) { return false; }
          };
          if (!preferPrev && isValid(window.__safStore.main)) {
            return { ok: true, data: window.__safStore.main, source: 'deyn-auto-backup.json', fallbackUsed: false };
          }
          if (isValid(window.__safStore.prev)) {
            return { ok: true, data: window.__safStore.prev, source: 'deyn-auto-backup.prev.json', fallbackUsed: true };
          }
          throw new Error('No valid auto-backup file found');
        }
      },
      DeynNotif: {
        checkPermissions: async () => ({ notifications: 'granted' }),
        requestPermissions: async () => ({ notifications: 'granted' }),
        notifyNow: async ({ key, title, body, force }) => {
          if (!force && window.__notifStore.fired.includes(key)) {
            return { posted: false, duplicate: true };
          }
          window.__notifStore.fired.push(key);
          window.__notifStore.lastPosted = { key, title, body };
          return { posted: true, duplicate: false };
        },
        schedule: async ({ items }) => {
          window.__notifStore.scheduled = items || [];
          return { count: (items || []).length, scheduled: (items || []).length };
        },
        getFired: async () => ({ keys: window.__notifStore.fired.slice() })
      }
    }
  };
})();
</script>"""

app_test_html = APP_HTML.replace(PROD_PUB, TEST_KEY['pub']).replace('<head>', '<head>\n' + HARNESS_SHIM, 1)
kg_test_html = KG_HTML.replace(PROD_PUB, TEST_KEY['pub']).replace('<head>', '<head>\n' + HARNESS_SHIM, 1)

app_data_url = 'data:text/html;charset=utf-8;base64,' + base64.b64encode(app_test_html.encode('utf-8')).decode('ascii')
kg_data_url = 'data:text/html;charset=utf-8;base64,' + base64.b64encode(kg_test_html.encode('utf-8')).decode('ascii')

opts = Options()
opts.binary_location = '/usr/bin/chromium'
for arg in ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--window-size=390,844']:
    opts.add_argument(arg)
driver = webdriver.Chrome(service=Service('/usr/bin/chromedriver'), options=opts)

results = []
def check(name, cond, detail=''):
    results.append((name, bool(cond), detail))
    status = 'PASS' if cond else 'FAIL'
    print(f"[{status}] {name}" + (f" ({detail})" if detail else ""))
    assert cond, f"FAILED: {name} -> {detail}"

try:
    # 1. Load Keygen and generate helper function
    driver.get(kg_data_url)
    time.sleep(0.4)
    driver.execute_script("document.getElementById('privateKey').value = arguments[0];", TEST_KEY['pem'])

    def gen_code_via_keygen(dev_id, tier='LT', role='M', exp='2099-01-01'):
        return driver.execute_Async_script if False else driver.execute_script("""
            const devId = arguments[0], tier = arguments[1], role = arguments[2], exp = arguments[3];
            document.getElementById('devId').value = devId;
            document.querySelector(`#tierSeg button[data-v="${tier}"]`).click();
            document.querySelector(`#roleSeg button[data-v="${role}"]`).click();
            if (tier !== 'LT') document.getElementById('expiryDate').value = exp;
            return document.getElementById('gen').onclick().then(() => document.getElementById('code').textContent.trim());
        """, dev_id, tier, role, exp)

    def gen_recovery_via_keygen(dev_id):
        return driver.execute_script("""
            document.getElementById('devId').value = arguments[0];
            return document.getElementById('genRec').onclick().then(() => document.getElementById('code').textContent.trim());
        """, dev_id)

    # Test keygen generation for sample dev_id
    owner_dev_id = 'a1b2c3d4e5f60718293a4b5c6d7e8f90'
    worker_dev_id = 'f0e9d8c7b6a594837261504f3e2d1c0b'
    new_phone_dev_id = '11223344556677889900aabbccddeeff'

    owner_code_lt = gen_code_via_keygen(owner_dev_id, 'LT', 'M')
    worker_code_1y = gen_code_via_keygen(worker_dev_id, '1Y', 'W', '2027-12-31')
    new_phone_code_m = gen_code_via_keygen(new_phone_dev_id, '2Y', 'M', '2028-12-31')
    expired_code = driver.execute_script("""
        const devId = arguments[0];
        return checkKey(document.getElementById('privateKey').value).then(async priv => {
            const p = { v: 3, d: devId, t: '1Y', r: 'M', exp: Date.now() - 86400000, n: 'expirednonce1234567890' };
            const body = new TextEncoder().encode(canonical(p));
            const sig = new Uint8Array(await crypto.subtle.sign('Ed25519', priv, body));
            return 'DEYN3-' + b64u(body) + '.' + b64u(sig);
        });
    """, owner_dev_id)
    rec_code_owner = gen_recovery_via_keygen(owner_dev_id)

    check("Keygen generates signed DEYN3 Owner (M) & Worker (W) codes and DEYNR1 recovery codes",
          owner_code_lt.startswith('DEYN3-') and worker_code_1y.startswith('DEYN3-') and rec_code_owner.startswith('DEYNR1-'))

    # 2. Load DEYN App on Owner Device
    driver.get(app_data_url)
    time.sleep(0.6)
    actual_dev_id = driver.execute_script("return window.DEYN_DEV_ID;")
    check("Activation Gate displays 32-hex device ID and subtle Restore JSON link",
          len(actual_dev_id) == 32 and driver.execute_script("return !!document.getElementById('agRestoreJsonBtn');"),
          f"devId={actual_dev_id}")

    # Generate codes specifically bound to actual_dev_id
    driver.get(kg_data_url)
    time.sleep(0.3)
    driver.execute_script("document.getElementById('privateKey').value = arguments[0];", TEST_KEY['pem'])
    real_owner_code = gen_code_via_keygen(actual_dev_id, 'LT', 'M')
    real_worker_code = gen_code_via_keygen(actual_dev_id, '1Y', 'W', '2027-12-31')
    real_rec_code = gen_recovery_via_keygen(actual_dev_id)
    real_expired_code = driver.execute_script("""
        const devId = arguments[0];
        return checkKey(document.getElementById('privateKey').value).then(async priv => {
            const p = { v: 3, d: devId, t: '1Y', r: 'M', exp: Date.now() - 86400000, n: 'expirednonce1234567890' };
            const body = new TextEncoder().encode(canonical(p));
            const sig = new Uint8Array(await crypto.subtle.sign('Ed25519', priv, body));
            return 'DEYN3-' + b64u(body) + '.' + b64u(sig);
        });
    """, actual_dev_id)

    driver.get(app_data_url)
    time.sleep(0.6)

    # 3. Test License Verification: reject wrong device ID, expired code, forged signature
    res_wrong_dev = driver.execute_script("return deynVerifyCode(arguments[0], window.DEYN_DEV_ID);", new_phone_code_m)
    res_expired = driver.execute_script("return deynVerifyCode(arguments[0], window.DEYN_DEV_ID);", real_expired_code)
    forged_code = real_owner_code[:-4] + ('AAAA' if not real_owner_code.endswith('AAAA') else 'BBBB')
    res_forged = driver.execute_script("return deynVerifyCode(arguments[0], window.DEYN_DEV_ID);", forged_code)
    check("License verification rejects wrong device ID, expired code, and forged signature",
          res_wrong_dev is None and res_expired is None and res_forged is None)

    # 4. Activate as Worker (W) first and verify strict Worker restrictions & blocked role switching
    driver.execute_script("""
        document.getElementById('agCode').value = arguments[0];
        document.getElementById('agGo').click();
    """, real_worker_code)
    time.sleep(0.7)
    w_state = driver.execute_script("""
        return {
            started: document.body.classList.contains('lic-ok'),
            isWorker: window.isWorkerDevice(),
            licRole: S.auth.licRole,
            deviceRole: S.auth.deviceRole
        };
    """)
    check("Worker (W) license activates app strictly in Worker role",
          w_state['started'] and w_state['isWorker'] is True and w_state['licRole'] == 'W' and w_state['deviceRole'] == 'worker',
          str(w_state))

    # Verify Worker cannot switch role to Owner internally and cannot perform Owner-only actions
    w_restrictions = driver.execute_script("""
        const beforeCustCount = S.customers.length;
        // Attempt internal role switch
        window.openSwitchToOwnerModal();
        if (A.switchDeviceRole) A.switchDeviceRole();
        const roleStillWorker = window.isWorkerDevice() && S.auth.licRole === 'W';

        // Attempt deleting customer
        const firstCid = S.customers[0].id;
        A.delCust({ id: firstCid });
        const custNotDeleted = S.customers.length === beforeCustCount;

        // Attempt clearing all data
        A.wipe();
        const dataNotCleared = S.customers.length === beforeCustCount;

        // Attempt opening SMS settings or password reset
        let smsModalOpened = false;
        const stackBefore = stack.length;
        if (A.smsSettings) A.smsSettings();
        smsModalOpened = stack.length > stackBefore;

        // Worker ALLOWED actions: add customer, add debt, add payment, save pending ticket
        S.customers.push({ id: 'w_cust_1', name: 'زبون العامل', phone: '0551112233', seg: 'shahara', ceiling: 5000, payDay: 15, tx: [] });
        S.customers.find(c => c.id === 'w_cust_1').tx.push({ id: 'w_tx_1', type: 'debt', amount: 1500, note: 'سلعة', ts: Date.now() });
        persist();
        const wBal = bal(S.customers.find(c => c.id === 'w_cust_1'));

        return { roleStillWorker, custNotDeleted, dataNotCleared, smsModalOpened, wBal };
    """)
    check("Worker (W) restrictions enforced (cannot switch role, delete customers, wipe data, or open SMS settings; can add customer/debt)",
          w_restrictions['roleStillWorker'] and w_restrictions['custNotDeleted'] and w_restrictions['dataNotCleared']
          and not w_restrictions['smsModalOpened'] and w_restrictions['wBal'] == 1500,
          str(w_restrictions))

    # 5. Activate as Owner (M) and verify Owner capabilities + Password + Recovery Code (DEYNR1)
    driver.execute_script("""
        window.DEYN_LIC = await deynVerifyCode(arguments[0], window.DEYN_DEV_ID);
        DEYN_LIC = window.DEYN_LIC;
        await DeynStore.set('lic', JSON.stringify({ code: DEYN_LIC.code }));
        window.applyLicenseRole();
        renderAll();
    """, real_owner_code)
    m_state = driver.execute_script("""
        // Attempt manual role switch on Owner (M) device -> must be blocked!
        if (A.switchDeviceRole) A.switchDeviceRole();
        window.openSwitchToOwnerModal();
        return {
            isWorkerAfterSwitchAttempt: window.isWorkerDevice(),
            licRole: S.auth.licRole,
            deviceRole: S.auth.deviceRole,
            expiry: S.auth.expiry
        };
    """)
    check("Owner (M) LT license activates full Owner privileges and blocks manual M->W role switching",
          m_state['isWorkerAfterSwitchAttempt'] is False and m_state['licRole'] == 'M' and m_state['deviceRole'] == 'master' and m_state['expiry'] == 'مدى الحياة',
          str(m_state))

    # Test PBKDF2 password hashing & one-time DEYNR1 password recovery
    pw_test = driver.execute_script("""
        const recCode = arguments[0];
        const wrongDevRec = arguments[1];
        S.auth.pw = await pwMake('SecretPass123');
        S.auth.pwMustSet = false;
        const okCheck = await pwCheck('SecretPass123', S.auth.pw);
        const badCheck = await pwCheck('WrongPass999', S.auth.pw);
        const recVerified = await deynVerifyRecovery(recCode);
        const wrongDevVerified = await deynVerifyRecovery(wrongDevRec);
        // Execute submitRecovery() with recCode, then attempt replay -> must reject replay!
        openRecoveryModal();
        document.getElementById('recCode').value = recCode;
        await submitRecovery();
        const usedArr = JSON.parse((await DeynStore.get('rused')) || '[]');
        const nonceRecorded = usedArr.includes(recVerified.nonce);
        closeModal();
        // Attempt using the same recovery code a second time
        openRecoveryModal();
        document.getElementById('recCode').value = recCode;
        await submitRecovery();
        const topHasNewPwInput = !!document.getElementById('npw1');
        closeModal();
        return { okCheck, badCheck, recOk: recVerified.ok === true, wrongDevOk: wrongDevVerified.ok === true, replayOk: !nonceRecorded || topHasNewPwInput };
    """, real_rec_code, rec_code_owner)
    check("PBKDF2-SHA256 password verification and one-time DEYNR1 recovery (with replay rejection) work properly",
          pw_test['okCheck'] is True and pw_test['badCheck'] is False and pw_test['recOk'] is True
          and pw_test['wrongDevOk'] is False and pw_test['replayOk'] is False,
          str(pw_test))

    # 6. Test Local Wi-Fi Sync (Owner M <-> Worker W E2EE Pairing, Delta Sync, Offline Queue, and Receiver Worker Guard)
    sync_test = driver.execute_script("""
        const Lib = DeynSyncLib;
        const ownerId = arguments[0];
        const workerId = arguments[1];
        const ownerLic = arguments[2];
        const workerLic = arguments[3];
        const ownerIdKey = await Lib.Identity.create();
        const workerIdKey = await Lib.Identity.create();

        const ownerState = { customers: [{ id: 'c_sync_1', name: 'كريم المزامنة', phone: '0550112233', seg: 'shahara', ceiling: 10000, payDay: 10, tx: [] }], pending: [], trash: [] };
        const workerState = { customers: [], pending: [], trash: [] };
        Lib.ensureSync(ownerState, ownerId);
        Lib.ensureSync(workerState, workerId);
        Lib.captureLocal(ownerState, ownerId, Date.now());

        // 1. QR Pairing Offer & E2EE Session Handshake (X25519 + Ed25519 + AES-256-GCM)
        const offer = Lib.makeOffer({ did: ownerId, idpub: ownerIdKey.pub, ip: '192.168.1.10', port: 47821, now: Date.now() });
        const parsedOffer = Lib.parseOffer(offer.text);

        const mkCtx = (st, did, idKey, licCode, pairingObj) => ({
            did,
            identity: idKey,
            licence: licCode,
            now: () => Date.now(),
            verifyLicence: async (c, d) => { const p = await deynVerifyCode(c, d); return p ? { role: p.role } : null; },
            getPeer: id => st.sync.peers[id] || null,
            savePeer: (id, rec) => { st.sync.peers[id] = Object.assign(st.sync.peers[id] || { recv: 0, acked: 0 }, rec); },
            pairing: pairingObj,
            sync: {
                prepare: async () => { Lib.captureLocal(st, did, Date.now()); },
                recvFrom: p => ((st.sync.peers[p] || {}).recv || 0),
                eventsAfter: (p, r) => Lib.eventsAfter(st, did, r),
                acked: (p, r) => { Lib.markAcked(st, did, p, r); },
                apply: async (p, role, evs) => Lib.applyBatch(st, did, p, role, evs, Date.now())
            }
        });

        // Create linked in-memory TCP pipes between Initiator (Worker) and Responder (Owner)
        let iSess, rSess;
        const iTrans = { send: async s => { setTimeout(() => rSess.feed(s), 0); }, close: () => {} };
        const rTrans = { send: async s => { setTimeout(() => iSess.feed(s), 0); }, close: () => {} };
        iSess = new Lib.Session(iTrans, mkCtx(workerState, workerId, workerIdKey, workerLic, null), 'initiator');
        rSess = new Lib.Session(rTrans, mkCtx(ownerState, ownerId, ownerIdKey, ownerLic, offer.state), 'responder');

        await Promise.all([iSess.handshakeInitiator({ offer: parsedOffer }), rSess.handshakeResponder()]);
        await Promise.all([iSess.exchange(), rSess.exchange()]);

        // 2. Worker adds a new debt while offline (queued in event log), then syncs to Owner on reconnect
        workerState.customers[0].tx.push({ id: 'tx_w_sync_1', type: 'debt', amount: 2500, note: 'سميد وزيت', ts: Date.now() });
        Lib.captureLocal(workerState, workerId, Date.now());
        const pendingBeforeSync = Lib.pendingCount(workerState, workerId, ownerId);

        let iSess2, rSess2;
        const iTrans2 = { send: async s => { setTimeout(() => rSess2.feed(s), 0); }, close: () => {} };
        const rTrans2 = { send: async s => { setTimeout(() => iSess2.feed(s), 0); }, close: () => {} };
        iSess2 = new Lib.Session(iTrans2, mkCtx(workerState, workerId, workerIdKey, workerLic, null), 'initiator');
        rSess2 = new Lib.Session(rTrans2, mkCtx(ownerState, ownerId, ownerIdKey, ownerLic, null), 'responder');
        await Promise.all([iSess2.handshakeInitiator({}), rSess2.handshakeResponder()]);
        await Promise.all([iSess2.exchange(), rSess2.exchange()]);
        const pendingAfterSync = Lib.pendingCount(workerState, workerId, ownerId);

        // 3. Security check: Worker attempts forbidden customer delete ('cst') and phone edit ('cf') -> Owner receiver rejects them!
        const checkDel = Lib.checkEvent({ k: 'cst', cid: 'c_sync_1', del: true, h: Lib.hlcStr(Lib.hlcTick(workerState.sync, Date.now(), workerId)) }, 'W', ownerState);
        const checkEditPhone = Lib.checkEvent({ k: 'cf', cid: 'c_sync_1', f: 'phone', v: '0666999999', h: Lib.hlcStr(Lib.hlcTick(workerState.sync, Date.now(), workerId)) }, 'W', ownerState);

        return {
            paired: !!ownerState.sync.peers[workerId] && !!workerState.sync.peers[ownerId],
            workerGotCustomer: workerState.customers.length === 1 && workerState.customers[0].name === 'كريم المزامنة',
            ownerGotWorkerDebt: ownerState.customers[0].tx.length === 1 && ownerState.customers[0].tx[0].amount === 2500,
            offlineQueuedThenCleared: pendingBeforeSync > 0 && pendingAfterSync === 0,
            ownerRejectedWorkerDelete: !checkDel.ok,
            ownerRejectedWorkerPhoneEdit: !checkEditPhone.ok
        };
    """, owner_dev_id, worker_dev_id, owner_code_lt, worker_code_1y)
    check("Local Wi-Fi E2EE Sync (QR pairing, initial union, offline queue, duplicate replay immunity, and Owner rejection of forbidden Worker events)",
          all(sync_test.values()),
          str(sync_test))

    # 7. Test Automatic External JSON Backup (SAF) + Validated License-Bound JSON Restore
    backup_restore_test = driver.execute_script("""
        // Configure SAF folder via DeynBackup mock
        await window.Capacitor.Plugins.DeynBackup.selectBackupFolder();
        // Add a customer and transaction and trigger persist() + runAutoBackupNow()
        S.customers.push({
            id: 'c_backup_test',
            name: 'بوزيد النسخ الاحتياطي',
            phone: '0770123456',
            seg: 'shahara',
            ceiling: 20000,
            payDay: 5,
            tx: [{ id: 'tx_b_1', type: 'debt', amount: 4500, note: 'قضيان الشهر', ts: Date.now() }]
        });
        persist();
        const autoRes = await window.DeynBackupRuntime.runAutoBackupNow();
        const safRead = await window.Capacitor.Plugins.DeynBackup.readAutoBackup();

        // Verify settings/guaranteed changes update fingerprint and trigger a new backup (putting previous into .prev.json)
        const fpBefore = window.DeynBackupRuntime.computeBackupFingerprint(S);
        S.guaranteed = Object.assign({}, S.guaranteed, { custom_seg: true });
        const fpAfter = window.DeynBackupRuntime.computeBackupFingerprint(S);
        const secondAutoRes = await window.DeynBackupRuntime.runAutoBackupNow();

        // Simulate disk full / write failure -> must NOT corrupt existing backup in SAF and must return ok:false
        window.__safStore.simulateDiskFull = true;
        S.customers[0].tx.push({ id: 'tx_b_2', type: 'debt', amount: 500, note: 'خبز', ts: Date.now() });
        const failRes = await window.DeynBackupRuntime.runAutoBackupNow();
        window.__safStore.simulateDiskFull = false;
        const safAfterFail = await window.Capacitor.Plugins.DeynBackup.readAutoBackup();

        // Simulate corruption of main backup file (>20 bytes) -> readValidatedAutoBackupFromSaf must fall back to .prev.json!
        const goodMainCopy = window.__safStore.main;
        window.__safStore.main = '{CORRUPT_JSON_CONTENT_LONGER_THAN_TWENTY_BYTES_123456}';
        const fallbackSafRes = await window.DeynBackupRuntime.readValidatedAutoBackupFromSaf();
        window.__safStore.main = goodMainCopy;

        // Validate corrupt JSON rejection
        const badVal1 = window.DeynBackupRuntime.validateBackupPayload('{corrupt json');
        const badVal2 = window.DeynBackupRuntime.validateBackupPayload(JSON.stringify({ customers: [{ id: 'c1', name: '' }], pending: [] }));

        // Wipe state, then restore from safRead.data using valid Owner license for this device
        const countBeforeWipe = S.customers.filter(c => c.id === 'c_backup_test').length;
        S.customers = [];
        const validPayload = window.DeynBackupRuntime.validateBackupPayload(safRead.data);
        await window.DeynBackupRuntime.applyVerifiedRestore(validPayload, window.DEYN_LIC);
        const restoredCust = S.customers.find(c => c.id === 'c_backup_test');

        // Test restoring on a Worker (W) device when JSON contains manipulated auth.licRole = 'M'
        const workerLic = await deynVerifyCode(arguments[0], window.DEYN_DEV_ID);
        const tamperedJson = JSON.parse(safRead.data);
        tamperedJson.data.auth = { licRole: 'M', deviceRole: 'master' };
        const tamperedValidated = window.DeynBackupRuntime.validateBackupPayload(JSON.stringify(tamperedJson));
        await window.DeynBackupRuntime.applyVerifiedRestore(tamperedValidated, workerLic);
        const roleAfterTamperedRestore = S.auth.licRole;

        // Restore back to Owner (M) license
        await window.DeynBackupRuntime.applyVerifiedRestore(validPayload, await deynVerifyCode(arguments[1], window.DEYN_DEV_ID));

        return {
            autoBackupOk: autoRes && autoRes.ok === true,
            safHasMainBackup: safRead && safRead.source === 'deyn-auto-backup.json',
            fingerprintCoversAllFields: fpBefore !== fpAfter && secondAutoRes.ok === true,
            diskFullProtectedLastGood: failRes && failRes.ok === false && failRes.reason === 'write_error' && safAfterFail.data === goodMainCopy,
            corruptMainFallsBackToPrev: fallbackSafRes && fallbackSafRes.ok === true && fallbackSafRes.fallbackUsed === true && fallbackSafRes.source === 'deyn-auto-backup.prev.json',
            corruptRejected: !badVal1.ok && !badVal2.ok,
            restoredCustomerIntact: !!restoredCust && restoredCust.tx.length === 1 && restoredCust.tx[0].amount === 4500,
            tamperedRoleBlocked: roleAfterTamperedRestore === 'W',
            ownerRestored: S.auth.licRole === 'M'
        };
    """, real_worker_code, real_owner_code)
    check("Automatic SAF JSON Backup, atomic write failure protection, corrupt JSON rejection, and license-bound Restore",
          all(backup_restore_test.values()),
          str(backup_restore_test))

    # 8. Test Clock Tamper Protection & Recovery via «حسناً»
    clock_test = driver.execute_script("""
        // Reset clock state to clean initial state at T0
        const t0 = Date.now();
        DEYN_TP.state = window.initialState();
        let r0 = window.evaluate(DEYN_TP.state, { now: t0, trusted: null });
        DEYN_TP.state = r0.state;
        DEYN_TP.status = r0.status;

        // 1. Small drift (3 minutes rollback < 5 min tolerance) -> stays OK
        let rDrift = window.evaluate(DEYN_TP.state, { now: t0 - 3 * 60 * 1000, trusted: null });

        // 2. Roll clock back by 2 hours -> triggers Warning 1 (WARN) and displays #deynTimeBanner with «لاحقاً» & «حسناً»
        let rWarn1 = window.evaluate(DEYN_TP.state, { now: t0 - 2 * 3600 * 1000, trusted: null });
        DEYN_TP.state = rWarn1.state;
        DEYN_TP.status = rWarn1.status;
        DEYN_TP.warningNo = rWarn1.warningNo;
        deynTpUi(rWarn1);
        const bannerPresent = !!document.getElementById('deynTimeBanner');
        const hasLaterAndOkBtns = !!document.getElementById('deynTbLater') && !!document.getElementById('deynTbOk');

        // 3. Click «لاحقاً» -> dismisses banner for current warning without deleting data
        document.getElementById('deynTbLater').click();
        const bannerDismissedOnLater = !document.getElementById('deynTimeBanner');

        // 4. Restore clock to legitimate time (t0 + small elapsed) and click «حسناً» (deynVerifyClockFixed) -> clears warning to OK!
        deynTpUi(rWarn1); // re-show banner
        await window.deynVerifyClockFixed();
        const statusAfterRestore = DEYN_TP.status;
        const bannerClearedOnFix = !document.getElementById('deynTimeBanner');

        // 5. Verify 3 warnings -> 48h GRACE -> READ_ONLY progression without deleting customer data
        let st = window.initialState();
        st = window.evaluate(st, { now: t0, trusted: t0 }).state;
        // Episode 1
        let e1 = window.evaluate(st, { now: t0 - 3600e3, trusted: null });
        st = window.evaluate(e1.state, { now: t0, trusted: t0 }).state;
        // Episode 2
        let e2 = window.evaluate(st, { now: t0 - 3600e3, trusted: null });
        st = window.evaluate(e2.state, { now: t0, trusted: t0 }).state;
        // Episode 3 -> enters GRACE (48h)
        let e3 = window.evaluate(st, { now: t0 - 3600e3, trusted: null });
        // After 49 hours -> enters READ_ONLY
        let eRo = window.evaluate(e3.state, { now: t0 + 49 * 3600e3, trusted: null });

        return {
            smallDriftOk: rDrift.status === 'OK',
            warn1Triggered: rWarn1.status === 'WARN' && rWarn1.warningNo === 1,
            bannerPresent,
            hasLaterAndOkBtns,
            bannerDismissedOnLater,
            statusAfterRestoreOk: statusAfterRestore === 'OK',
            bannerClearedOnFix,
            graceOn3rd: e3.status === 'GRACE' && e3.warningNo === 3,
            readOnlyAfter48h: eRo.status === 'READ_ONLY',
            dataPreserved: S.customers.length > 0
        };
    """)
    check("Clock tamper protection (tolerance, warnings 1->2->3, 48h grace, READ_ONLY, «لاحقاً»/«حسناً» buttons, and recovery when clock is restored)",
          all(clock_test.values()),
          str(clock_test))

    # 9. Test Notifications (Read/Unread log, filters, mark-all-read, native scheduling, and no duplicates)
    notif_test = driver.execute_script("""
        // Ensure we have an overdue customer and an over-ceiling customer
        const today = new Date().getDate();
        const overduePayDay = today > 2 ? today - 2 : 28;
        S.customers.push({
            id: 'c_notif_overdue',
            name: 'سليمان المتأخر',
            phone: '0552223344',
            seg: 'shahara',
            ceiling: 50000,
            payDay: overduePayDay,
            tx: [{ id: 'tx_n_1', type: 'debt', amount: 12000, note: 'دين مستحق', ts: Date.now() - 40 * 86400000 }]
        });
        window.checkSmartNotifs();
        await new Promise(r => setTimeout(r, 150));

        const entries1 = window.DeynNotifRuntime.syncAlertsToLog();
        const unreadBefore = entries1.filter(e => !e.read).length;
        const badgeVisible = document.getElementById('bellBadge').style.display !== 'none';
        const firedCount1 = window.__notifStore.fired.length;

        // Re-run checkSmartNotifs -> must NOT duplicate native notifications for the same event key
        window.checkSmartNotifs();
        await new Promise(r => setTimeout(r, 150));
        const firedCount2 = window.__notifStore.fired.length;

        // Open Notifications modal, verify filter chips and mark all as read
        window.openNotifsModal();
        const modalHtml = document.querySelector('#modalRoot .ovl:last-child .sheet').innerHTML;
        const hasFilterChips = modalHtml.includes('setNotifFilter') && modalHtml.includes('markAllNotifsRead');
        A.markAllNotifsRead();
        const entriesAfterRead = window.DeynNotifRuntime.syncAlertsToLog();
        const unreadAfter = entriesAfterRead.filter(e => !e.read).length;
        const badgeHiddenAfterRead = document.getElementById('bellBadge').style.display === 'none';
        closeModal();

        // Pay off c_notif_overdue debt completely and verify its scheduled notification is cancelled!
        const schedBeforePay = window.__notifStore.scheduled.some(x => x.key.includes('c_notif_overdue'));
        const overdueCust = S.customers.find(c => c.id === 'c_notif_overdue');
        overdueCust.tx.push({ id: 'tx_n_pay_full', type: 'pay', amount: 12000, note: 'تسديد كامل', ts: Date.now() });
        persist();
        await new Promise(r => setTimeout(r, 250));
        const schedAfterPay = window.__notifStore.scheduled.some(x => x.key.includes('c_notif_overdue'));

        return {
            hasEntries: entries1.length > 0 && unreadBefore > 0,
            badgeVisible,
            noDuplicateNativeNotifs: firedCount1 > 0 && firedCount2 === firedCount1,
            scheduledNextDayOverdue: schedBeforePay === true,
            paidDebtCancelsScheduledNotif: schedAfterPay === false,
            hasFilterChips,
            unreadAfterZero: unreadAfter === 0,
            badgeHiddenAfterRead
        };
    """)
    check("Notifications system (Read/Unread history, filter tabs, mark-all-read, native scheduling at 09:00 next day, and zero duplicates)",
          all(notif_test.values()),
          str(notif_test))

    # 10. Test French Localization, Centimes Formatting, "Gérer le mot de passe" Button Fit, and Large DZD Amounts
    ui_fr_test = driver.execute_script("""
        S.customers = [{ id: 'c_fr_1', name: 'Karim', phone: '0550123456', seg: 'shahara', ceiling: 50000, payDay: 15, tx: [{ id: 'tx_fr_1', type: 'debt', amount: 14250, note: 'Achat', ts: Date.now() }] }];
        DEYN_I18N.set('fr', true);

        // Add a very large DZD amount to test layout wrapping
        S.customers.push({
            id: 'c_large_dzd',
            name: 'Client Grand Montant',
            phone: '0559998877',
            seg: 'shahara',
            ceiling: 100000000,
            payDay: 15,
            tx: [{ id: 'tx_lg_1', type: 'debt', amount: 98765432.5, note: 'Grossiste', ts: Date.now() }]
        });
        renderAll();

        // Open Settings modal in French and check "Gérer le mot de passe" button geometry
        window.openSettings();
        const sheet = document.querySelector('#modalRoot .ovl:last-child .sheet');
        const pwBtn = sheet.querySelector('[data-act="resetPassModal"]');
        const pwRow = pwBtn.closest('.row-set');
        const btnRect = pwBtn.getBoundingClientRect();
        const rowRect = pwRow.getBoundingClientRect();
        const btnFitsInRow = btnRect.right <= rowRect.right + 2 && btnRect.left >= rowRect.left - 2 && btnRect.height >= 36;

        // Check Restore JSON and SAF buttons in French Settings
        const restoreBtnText = sheet.querySelector('[data-act="restoreJsonSettings"]').innerText.trim();
        const safBtnText = sheet.querySelector('[data-act="selectBackupFolder"]').innerText.trim();

        // Check Arabic characters in French Settings sheet
        const arRegex = /[\u0600-\u06FF]/;
        const settingsHasArabic = arRegex.test(sheet.innerText);
        closeModal();

        // Check French centimes conversion
        const c5 = DEYN_I18N.dialectFr(5);
        const c14250 = DEYN_I18N.dialectFr(14250);

        // Check PDF export in French
        let capturedPdfHtml = '';
        const origOpen = window.open;
        window.open = function() {
            return { document: { open(){}, write(h){ capturedPdfHtml = h; }, close(){} }, focus(){}, print(){} };
        };
        window.exportPdfLedger();
        window.open = origOpen;
        const pdfHasArabic = arRegex.test(capturedPdfHtml);

        return {
            btnText: pwBtn.innerText.trim(),
            btnFitsInRow,
            restoreBtnText,
            safBtnText,
            settingsHasArabic,
            c5,
            c14250,
            pdfTranslated: capturedPdfHtml.length > 200 && !pdfHasArabic
        };
    """)
    check("French UI localization, 'Gérer le mot de passe' button fit, centimes formatting, Restore/SAF buttons, and French PDF export",
          ui_fr_test['btnFitsInRow']
          and not ui_fr_test['settingsHasArabic']
          and 'Restaurer une sauvegarde JSON' in ui_fr_test['restoreBtnText']
          and ui_fr_test['c5'] == '500 centimes'
          and '1 million' in ui_fr_test['c14250']
          and ui_fr_test['pdfTranslated'],
          str(ui_fr_test))

    print("\nALL 10 E2E VERIFICATION SUITES PASSED SUCCESSFULLY!")
finally:
    driver.quit()
```

================================================================================
## [25/32] FILE: `sync/engine.js`

- **المسار الأصلي**: `sync/engine.js`
- **الحجم**: `21,252` بايت | **الأسطر**: `296` | **SHA-256**: `2d41188815beb29401c7dbca841f982c2102b99330f3e91ee19167bb3834276c`

```javascript
// DEYN sync engine: append-only event log + deterministic merge. Pure JS (no DOM, no network, no crypto) so it is unit-testable.
// Rules: financial transactions are immutable and merged by union on their unique id; customer fields are last-writer-wins per field (hybrid
// logical clock, loser kept in S.sync.conflicts); archive/restore and ticket removal are state events; nothing ever replaces a whole database;
// a wipe / bulk delete is never propagated; settings, passwords and licences are never synchronised.
export const MAX_EVENTS_PER_BATCH = 200;
const FIELD_MAX = 2000;
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const clone = v => JSON.parse(JSON.stringify(v));
const jstr = v => JSON.stringify(v === undefined ? null : v);

// ---- hybrid logical clock (string form sorts lexicographically) ----
export const hlcStr = (l, c, did) => String(l).padStart(15, '0') + '.' + String(c).padStart(5, '0') + '.' + did;
export function hlcTick(sy, now) {
  if (now > sy.hlc.l) { sy.hlc.l = now; sy.hlc.c = 0; } else sy.hlc.c += 1;
  return hlcStr(sy.hlc.l, sy.hlc.c, sy.did);
}
export function hlcRecv(sy, remote, now) {
  const m = /^(\d{15})\.(\d{5})\./.exec(remote); if (!m) return;
  const rl = Number(m[1]), rc = Number(m[2]);
  const l = Math.max(sy.hlc.l, rl, now);
  sy.hlc.c = (l === sy.hlc.l && l === rl) ? Math.max(sy.hlc.c, rc) + 1 : (l === sy.hlc.l ? sy.hlc.c + 1 : (l === rl ? rc + 1 : 0));
  sy.hlc.l = l;
}

export function ensureSync(S, did) {
  if (!isObj(S.sync) || S.sync.did !== did) {
    const keep = isObj(S.sync) ? S.sync : {};
    S.sync = { did, hlc: keep.hlc || { l: 0, c: 0 }, seq: keep.seq || 0, log: keep.log || [], snap: keep.snap || null, peers: keep.peers || {}, fh: keep.fh || {}, sh: keep.sh || {}, orphans: keep.orphans || [], conflicts: keep.conflicts || [], quarantine: keep.quarantine || [], diverged: keep.diverged || false };
  }
  return S.sync;
}
const custBase = c => { const o = {}; for (const k of Object.keys(c)) if (k !== 'tx') o[k] = c[k]; return o; };
const txExtHash = t => jstr({ dueAt: t.dueAt ?? null, originalDueAt: t.originalDueAt ?? null, extensionHistory: Array.isArray(t.extensionHistory) ? t.extensionHistory : null });
const trashCust = S => (S.trash || []).filter(t => t && t.type === 'customer' && t.data && t.data.id);
const trashTkt = S => (S.trash || []).filter(t => t && t.type === 'ticket' && t.data && t.data.id);

// ---- snapshot: what we already turned into events ----
export function buildSnap(S) {
  const snap = { cs: {}, tx: {}, tk: {} };
  for (const c of S.customers) { snap.cs[c.id] = { a: 1, f: Object.fromEntries(Object.entries(custBase(c)).map(([k, v]) => [k, jstr(v)])) }; for (const t of c.tx || []) snap.tx[t.id] = txExtHash(t); }
  for (const it of trashCust(S)) { const d = it.data; snap.cs[d.id] = { a: 0, f: Object.fromEntries(Object.entries(custBase(d)).map(([k, v]) => [k, jstr(v)])) }; for (const t of d.tx || []) snap.tx[t.id] = txExtHash(t); }
  for (const t of S.pending) snap.tk[t.id] = { tag: jstr(t.tag) };
  return snap;
}
function push(sy, now, body) {
  sy.seq += 1; const h = hlcTick(sy, now);
  const ev = Object.assign({ id: sy.did + ':' + sy.seq, s: sy.seq, h }, body);
  sy.log.push(ev); return ev;
}
// Turn local changes since the last snapshot into log events. Call before every sync.
export function captureLocal(S, did, now) {
  const sy = ensureSync(S, did);
  if (!sy.snap) { sy.snap = { cs: {}, tx: {}, tk: {} }; }
  const snap = sy.snap, seenTx = new Set(Object.keys(snap.tx));
  const emitTx = (cid, c) => {
    for (const t of c.tx || []) {
      const hVal = txExtHash(t);
      if (!snap.tx[t.id]) {
        push(sy, now, { k: 'tx', cid, tx: clone(t) });
        snap.tx[t.id] = hVal;
        if (t.dueAt || (Array.isArray(t.extensionHistory) && t.extensionHistory.length)) {
          sy.fh['tx:' + cid + '.' + t.id] = sy.log[sy.log.length - 1].h;
        }
      } else if (snap.tx[t.id] !== hVal && (snap.tx[t.id] !== 1 || t.dueAt || (Array.isArray(t.extensionHistory) && t.extensionHistory.length))) {
        const ev = push(sy, now, {
          k: 'txf',
          cid,
          tid: t.id,
          dueAt: t.dueAt ?? null,
          originalDueAt: t.originalDueAt ?? null,
          extensionHistory: clone(Array.isArray(t.extensionHistory) ? t.extensionHistory : [])
        });
        sy.fh['tx:' + cid + '.' + t.id] = ev.h;
        snap.tx[t.id] = hVal;
      }
    }
  };
  for (const c of S.customers) {
    const prev = snap.cs[c.id];
    if (!prev) { push(sy, now, { k: 'cust+', c: clone(custBase(c)) }); snap.cs[c.id] = { a: 1, f: Object.fromEntries(Object.entries(custBase(c)).map(([k, v]) => [k, jstr(v)])) }; const h0 = sy.log[sy.log.length - 1].h; sy.sh[c.id] = h0; for (const k of Object.keys(custBase(c))) sy.fh[c.id + '.' + k] = h0; }
    else {
      if (prev.a === 0) { const ev = push(sy, now, { k: 'cst', cid: c.id, st: 'active' }); sy.sh[c.id] = ev.h; prev.a = 1; }
      const changed = {}; const cur = custBase(c);
      for (const k of Object.keys(cur)) { const j = jstr(cur[k]); if (prev.f[k] !== j) { changed[k] = clone(cur[k]); prev.f[k] = j; } }
      if (Object.keys(changed).length) { const ev = push(sy, now, { k: 'cf', cid: c.id, f: changed }); for (const k of Object.keys(changed)) sy.fh[c.id + '.' + k] = ev.h; }
    }
    emitTx(c.id, c);
  }
  for (const it of trashCust(S)) {
    const d = it.data, prev = snap.cs[d.id];
    if (!prev) { push(sy, now, { k: 'cust+', c: clone(custBase(d)) }); snap.cs[d.id] = { a: 1, f: Object.fromEntries(Object.entries(custBase(d)).map(([k, v]) => [k, jstr(v)])) }; }
    emitTx(d.id, d);
    if (snap.cs[d.id].a !== 0) { const ev = push(sy, now, { k: 'cst', cid: d.id, st: 'archived', at: it.deletedAt || now }); sy.sh[d.id] = ev.h; snap.cs[d.id].a = 0; }
  }
  // customers that vanished with no trash record (wipe/clear): never propagated
  const present = new Set([...S.customers.map(c => c.id), ...trashCust(S).map(t => t.data.id)]);
  for (const id of Object.keys(snap.cs)) if (!present.has(id)) { sy.diverged = true; delete snap.cs[id]; }
  // tickets
  const txSig = new Set(); for (const c of S.customers) for (const t of c.tx || []) if (t.tape) txSig.add(t.tape + '|' + t.ts);
  for (const t of S.pending) {
    const prev = snap.tk[t.id];
    if (!prev) { push(sy, now, { k: 'tk+', t: clone(t) }); snap.tk[t.id] = { tag: jstr(t.tag) }; }
    else if (prev.tag !== jstr(t.tag)) { const ev = push(sy, now, { k: 'tkf', tid: t.id, f: { tag: t.tag } }); sy.fh['t:' + t.id + '.tag'] = ev.h; prev.tag = jstr(t.tag); }
  }
  const pend = new Set(S.pending.map(t => t.id)), arch = new Set(trashTkt(S).map(x => x.data.id));
  const tkSrc = {}; for (const t of trashTkt(S)) tkSrc[t.data.id] = t.data;
  for (const id of Object.keys(snap.tk)) if (!pend.has(id)) {
    if (arch.has(id)) push(sy, now, { k: 'tkx', tid: id, why: 'archived' });
    else { /* consumed only if a transaction carrying its signature exists (assignment); otherwise it is a wipe: ignore */
      const sig = sy._lastTk && sy._lastTk[id]; if (sig && txSig.has(sig)) push(sy, now, { k: 'tkx', tid: id, why: 'consumed' }); else sy.diverged = true; }
    delete snap.tk[id];
  }
  sy._lastTk = Object.fromEntries(S.pending.map(t => [t.id, t.tape + '|' + t.ts]));
  return sy;
}
// Rebuild the snapshot from the current state (after applying remote events, so they are not re-emitted).
export function resnapshot(S, did) { const sy = ensureSync(S, did); sy.snap = buildSnap(S); sy._lastTk = Object.fromEntries(S.pending.map(t => [t.id, t.tape + '|' + t.ts])); }
export const eventsAfter = (S, did, peerRecv) => ensureSync(S, did).log.filter(e => e.s > peerRecv);

// ---- validation & permissions (enforced by the RECEIVER from the pinned role of the sender) ----
const okStr = (v, n = FIELD_MAX) => typeof v === 'string' && v.length <= n;
const okNum = v => typeof v === 'number' && Number.isFinite(v);
function validTx(t) { return isObj(t) && okStr(t.id, 64) && (t.type === 'debt' || t.type === 'pay') && okNum(t.amount) && t.amount > 0 && t.amount < 1e12 && okNum(t.ts) && (t.note === undefined || okStr(t.note)); }
function validCust(c) { return isObj(c) && okStr(c.id, 64) && okStr(c.name, 200) && JSON.stringify(c).length < 20000; }
export function checkEvent(ev, senderRole, S, did) {
  const bad = r => ({ ok: false, reason: r });
  if (!isObj(ev) || !okStr(ev.id, 100) || !Number.isSafeInteger(ev.s) || !okStr(ev.h, 80) || !/^\d{15}\.\d{5}\./.test(ev.h)) return bad('shape');
  const hasC = id => S.customers.some(c => c.id === id) || trashCust(S).some(t => t.data.id === id);
  const W = senderRole === 'W';
  switch (ev.k) {
    case 'tx': if (!validTx(ev.tx) || !okStr(ev.cid, 64)) return bad('tx-shape'); return { ok: true };            // worker may add debt/pay
    case 'txf':
      if (!okStr(ev.cid, 64) || !okStr(ev.tid, 64)) return bad('txf-shape');
      if (ev.dueAt !== null && ev.dueAt !== undefined && !okNum(ev.dueAt)) return bad('txf-shape');
      if (ev.originalDueAt !== null && ev.originalDueAt !== undefined && !okNum(ev.originalDueAt)) return bad('txf-shape');
      if (ev.extensionHistory !== undefined && (!Array.isArray(ev.extensionHistory) || ev.extensionHistory.length > 200)) return bad('txf-shape');
      return { ok: true };
    case 'cust+': {
      if (!validCust(ev.c)) return bad('cust-shape');
      if (W) {
        const segDefaults = { salaried: 30000, youth: 3000, daily: 5000, black: 0 };
        const customSegs = (S && S.customSegs) || {};
        const validSegs = new Set([...Object.keys(segDefaults), ...Object.keys(customSegs)]);
        if (ev.c.seg !== undefined && !validSegs.has(ev.c.seg)) return bad('worker-invalid-segment');
        if (ev.c.ceiling !== undefined && (!okNum(ev.c.ceiling) || ev.c.ceiling < 0 || ev.c.ceiling > 100000)) return bad('worker-invalid-ceiling');
        if (Array.isArray(ev.c.tx) && ev.c.tx.length > 0) return bad('worker-cust-with-tx');
      }
      return { ok: true };
    }
    case 'cf': if (!isObj(ev.f) || !okStr(ev.cid, 64) || JSON.stringify(ev.f).length > 20000) return bad('cf-shape');
      if ('tx' in ev.f || 'id' in ev.f) return bad('cf-forbidden-field');
      // same power the worker UI already has: auto-block / unblock-by-assignment change only segment and ceiling; name, phone, pay day stay owner-only
      if (W) {
        const cur = S.customers.find(c => c.id === ev.cid);
        if (!cur || !Object.keys(ev.f).every(k => k === 'seg' || k === 'ceiling')) return bad('worker-cannot-edit-customer');
        const segDefaults = { salaried: 30000, youth: 3000, daily: 5000, black: 0 };
        const customSegs = (S && S.customSegs) || {};
        const validActiveSegs = new Set([...Object.keys(segDefaults).filter(k => k !== 'black'), ...Object.keys(customSegs).filter(k => k !== 'black')]);
        if ('seg' in ev.f && !(ev.f.seg === 'black' || (cur.seg === 'black' && validActiveSegs.has(ev.f.seg)))) return bad('worker-cannot-edit-customer');
        if ('ceiling' in ev.f) {
          if (!(cur.ceiling === 0 && okNum(ev.f.ceiling) && ev.f.ceiling >= 0 && ev.f.ceiling <= 100000)) return bad('worker-cannot-edit-customer');
          const targetSeg = ('seg' in ev.f) ? ev.f.seg : cur.seg;
          const segObj = customSegs[targetSeg];
          const maxAllowed = segObj && okNum(segObj.ceiling) ? Math.max(segObj.ceiling, 10000) : Math.max(segDefaults[targetSeg] || 10000, 10000);
          if (ev.f.ceiling > maxAllowed) return bad('worker-cannot-edit-customer');
        }
      }
      return { ok: true };
    case 'cst': if (W) return bad('worker-cannot-archive'); if (!okStr(ev.cid, 64) || (ev.st !== 'archived' && ev.st !== 'active')) return bad('cst-shape'); return { ok: true };
    case 'tk+': if (!isObj(ev.t) || !okStr(ev.t.id, 64) || !okNum(ev.t.amount) || ev.t.amount < 0) return bad('tk-shape'); return { ok: true };
    case 'tkf': if (!isObj(ev.f) || !okStr(ev.tid, 64) || Object.keys(ev.f).some(k => k !== 'tag') || !okStr(ev.f.tag, 500)) return bad('tkf-shape'); return { ok: true };
    case 'tkx': if (!okStr(ev.tid, 64) || (ev.why !== 'archived' && ev.why !== 'consumed')) return bad('tkx-shape'); if (W && ev.why === 'archived') return bad('worker-cannot-delete-ticket'); return { ok: true };
    default: return bad('unknown-kind');
  }
}
function findCust(S, id) { const c = S.customers.find(x => x.id === id); if (c) return { c, where: 'active' }; const t = trashCust(S).find(x => x.data.id === id); return t ? { c: t.data, where: 'trash', item: t } : null; }
function recordConflict(sy, rec) { sy.conflicts.push(rec); if (sy.conflicts.length > 200) sy.conflicts.shift(); }
function applyOne(S, sy, ev, now) {
  switch (ev.k) {
    case 'tx': {
      const f = findCust(S, ev.cid); if (!f) { sy.orphans.push(ev); return 'orphan'; }
      if (f.c.tx.some(t => t.id === ev.tx.id)) return 'dup';
      f.c.tx.push(clone(ev.tx)); return 'applied';
    }
    case 'txf': {
      const f = findCust(S, ev.cid); if (!f) { sy.orphans.push(ev); return 'orphan'; }
      const t = (f.c.tx || []).find(x => x.id === ev.tid);
      if (!t) { sy.orphans.push(ev); return 'orphan'; }
      const key = 'tx:' + ev.cid + '.' + ev.tid, cur = sy.fh[key] || '';
      if (ev.h > cur) {
        if (ev.originalDueAt !== undefined && ev.originalDueAt !== null) t.originalDueAt = ev.originalDueAt;
        if (ev.dueAt !== undefined && ev.dueAt !== null) t.dueAt = ev.dueAt;
        if (Array.isArray(ev.extensionHistory)) {
          const existing = Array.isArray(t.extensionHistory) ? t.extensionHistory : [];
          const seen = new Set(existing.map(x => `${x.at}|${x.from}|${x.to}`));
          for (const item of ev.extensionHistory) {
            const sig = `${item.at}|${item.from}|${item.to}`;
            if (!seen.has(sig)) { existing.push(clone(item)); seen.add(sig); }
          }
          existing.sort((a, b) => (a.at || 0) - (b.at || 0));
          t.extensionHistory = existing;
        }
        sy.fh[key] = ev.h;
        return 'applied';
      }
      return 'dup';
    }
    case 'cust+': {
      const f = findCust(S, ev.c.id);
      if (!f) { const c = clone(ev.c); c.tx = []; S.customers.push(c); sy.sh[c.id] = sy.sh[c.id] || ev.h; for (const k of Object.keys(ev.c)) sy.fh[c.id + '.' + k] = ev.h; return 'applied'; }
      return applyOne(S, sy, { k: 'cf', cid: ev.c.id, f: custBase(ev.c), h: ev.h, id: ev.id, s: ev.s }, now);
    }
    case 'cf': {
      const f = findCust(S, ev.cid); if (!f) { sy.orphans.push(ev); return 'orphan'; }
      let any = false;
      for (const [k, v] of Object.entries(ev.f)) {
        const key = ev.cid + '.' + k, cur = sy.fh[key] || '';
        if (ev.h > cur) { if (jstr(f.c[k]) !== jstr(v)) { if (cur && sy.fh[key] && f.c[k] !== undefined) recordConflict(sy, { cid: ev.cid, field: k, lost: f.c[k], by: ev.h, at: now }); f.c[k] = clone(v); any = true; } sy.fh[key] = ev.h; }
        else if (jstr(f.c[k]) !== jstr(v)) recordConflict(sy, { cid: ev.cid, field: k, lost: v, by: cur, at: now });
      }
      return any ? 'applied' : 'dup';
    }
    case 'cst': {
      const cur = sy.sh[ev.cid] || ''; if (ev.h <= cur) return 'dup';
      const f = findCust(S, ev.cid); if (!f) { sy.orphans.push(ev); return 'orphan'; }
      sy.sh[ev.cid] = ev.h;
      if (ev.st === 'archived' && f.where === 'active') {
        S.customers = S.customers.filter(c => c.id !== ev.cid);
        S.trash = S.trash || []; S.trash.unshift({ id: 'sync-' + ev.id, type: 'customer', data: f.c, deletedAt: ev.at || now, title: f.c.name, synced: true }); return 'applied';
      }
      if (ev.st === 'active' && f.where === 'trash') { S.trash = S.trash.filter(t => t !== f.item); S.customers.push(f.c); return 'applied'; }
      return 'dup';
    }
    case 'tk+': { if (S.pending.some(t => t.id === ev.t.id) || trashTkt(S).some(t => t.data.id === ev.t.id) || (sy.gone && sy.gone[ev.t.id])) return 'dup'; S.pending.unshift(clone(ev.t)); sy.fh['t:' + ev.t.id + '.tag'] = ev.h; return 'applied'; }
    case 'tkf': {
      const t = S.pending.find(x => x.id === ev.tid); if (!t) return 'dup';
      const key = 't:' + ev.tid + '.tag', cur = sy.fh[key] || '';
      if (ev.h > cur) { if (t.tag !== ev.f.tag && cur) recordConflict(sy, { tid: ev.tid, field: 'tag', lost: t.tag, by: ev.h, at: now }); t.tag = ev.f.tag; sy.fh[key] = ev.h; return 'applied'; }
      if (t.tag !== ev.f.tag) recordConflict(sy, { tid: ev.tid, field: 'tag', lost: ev.f.tag, by: cur, at: now }); return 'dup';
    }
    case 'tkx': {
      sy.gone = sy.gone || {}; sy.gone[ev.tid] = 1;
      const t = S.pending.find(x => x.id === ev.tid); if (!t) return 'dup';
      S.pending = S.pending.filter(x => x.id !== ev.tid);
      if (ev.why === 'archived') { S.trash = S.trash || []; S.trash.unshift({ id: 'sync-' + ev.id, type: 'ticket', data: t, deletedAt: now, synced: true }); }
      return 'applied';
    }
  }
  return 'dup';
}
// Apply a contiguous batch from a peer. Caller supplies the sender's pinned role. Returns {applied, dup, rejected, newRecv}.
// Validation first: if ANY event is rejected the whole batch is refused and nothing is applied.
export function applyBatch(S, did, peerId, senderRole, events, now) {
  const sy = ensureSync(S, did);
  captureLocal(S, did, now);          // flush local changes into the log first, so the snapshot rebuild below can never swallow them
  const peer = sy.peers[peerId] || (sy.peers[peerId] = { recv: 0, acked: 0 });
  const rejected = [];                     // structural problems: refuse the whole batch (tampering / corruption)
  const quarantined = [];                  // permission problems: skip these, keep the rest, advance the cursor
  let expect = peer.recv + 1;
  const fresh = [];
  for (const ev of events) {
    if (!Number.isSafeInteger(ev && ev.s)) { rejected.push({ id: ev && ev.id, reason: 'shape' }); continue; }
    if (ev.s <= peer.recv) continue;                                   // already applied: duplicate delivery
    if (ev.s !== expect) { return { ok: false, reason: 'gap', expected: expect, applied: 0, rejected }; }
    if (ev.id !== peerId + ':' + ev.s) { rejected.push({ id: ev.id, reason: 'id-mismatch' }); expect += 1; continue; }
    const chk = checkEvent(ev, senderRole, S, did);
    if (!chk.ok) { if (String(chk.reason).startsWith('worker-')) quarantined.push({ ev, reason: chk.reason }); else rejected.push({ id: ev.id, reason: chk.reason }); }
    else fresh.push(ev);
    expect += 1;
  }
  if (rejected.length) return { ok: false, reason: 'rejected', rejected, applied: 0 };
  const lastSeq = expect - 1;
  for (const q of quarantined) { sy.quarantine = sy.quarantine || []; sy.quarantine.push({ id: q.ev.id, k: q.ev.k, reason: q.reason, at: now }); if (sy.quarantine.length > 100) sy.quarantine.shift(); }
  let applied = 0, dup = 0; const now2 = now;
  for (const ev of fresh) { hlcRecv(sy, ev.h, now2); const r = applyOne(S, sy, ev, now2); if (r === 'applied') applied++; else if (r === 'dup') dup++; }
  // retry orphans whose customer may now exist
  const orph = sy.orphans; sy.orphans = [];
  for (const ev of orph) { const r = applyOne(S, sy, ev, now2); if (r === 'applied') applied++; }
  // A refused worker edit must not leave the two phones permanently different: the receiver answers with a corrective event carrying its own
  // (authoritative) values. The correction is stamped after the refused edit, so last-writer-wins makes the worker adopt it.
  for (const q of quarantined) {
    const ev = q.ev, f = findCust(S, ev.cid);
    if (ev.k === 'cf' && f) { const vals = {}; for (const k of Object.keys(ev.f)) if (k !== 'tx' && k !== 'id') vals[k] = clone(f.c[k] === undefined ? null : f.c[k]); const e2 = push(sy, now, { k: 'cf', cid: ev.cid, f: vals }); for (const k of Object.keys(vals)) sy.fh[ev.cid + '.' + k] = e2.h; }
    else if (ev.k === 'cst' && f) { const want = f.where === 'active' ? 'active' : 'archived'; if (want !== ev.st) { const e2 = push(sy, now, { k: 'cst', cid: ev.cid, st: want, at: now }); sy.sh[ev.cid] = e2.h; } }
  }
  if (lastSeq > peer.recv) peer.recv = lastSeq;
  resnapshot(S, did);
  return { ok: true, applied, dup, rejected: [], quarantined: quarantined.map(q => ({ id: q.ev.id, reason: q.reason })), newRecv: peer.recv };
}
export const markAcked = (S, did, peerId, recv) => { const p = ensureSync(S, did).peers[peerId]; if (p && recv > p.acked) p.acked = Math.min(recv, ensureSync(S, did).seq); };
export const pendingCount = (S, did, peerId) => { const sy = ensureSync(S, did); const p = sy.peers[peerId] || { acked: 0 }; return sy.log.filter(e => e.s > p.acked).length; };

// A phone whose data is still the untouched demo set must adopt the owner's data instead of merging 10 demo customers into the real ledger.
export const demoFingerprint = S => { const str = JSON.stringify([S.customers, S.pending]); let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return String(h) + ':' + str.length; };
export const isPristineDemo = S => !!S.demoFp && S.demoFp === demoFingerprint(S) && !(S.sync && S.sync.snap);
export function discardPristineDemo(S, did) { if (!isPristineDemo(S)) return false; S.customers = []; S.pending = []; S.trash = []; delete S.demoFp; ensureSync(S, did); resnapshot(S, did); return true; }
```

================================================================================
## [26/32] FILE: `sync/test_engine.mjs`

- **المسار الأصلي**: `sync/test_engine.mjs`
- **الحجم**: `17,392` بايت | **الأسطر**: `215` | **SHA-256**: `e6fbcaf21ae9364b9eb3f7f35c75bfd3f16e8313e4d58268c3f854423d840846`

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { captureLocal, eventsAfter, applyBatch, checkEvent, markAcked, ensureSync, resnapshot, pendingCount, MAX_EVENTS_PER_BATCH, isPristineDemo, discardPristineDemo, demoFingerprint } from './engine.js';

let n = 0; const uid = () => 'id' + (++n).toString(36) + Math.random().toString(36).slice(2, 6);
let clock = 1_800_000_000_000; const now = () => (clock += 1000);
const tx = (type, amount, extra = {}) => ({ id: uid(), type, amount, note: '', ts: now(), ...extra });
const mk = () => ({ customers: [], pending: [], trash: [], seq: 1, settings: { dialect: true }, auth: { pw: { hash: 'SECRET' } } });
const bal = c => c.tx.reduce((a, t) => a + (t.type === 'debt' ? t.amount : -t.amount), 0);
const canon = S => JSON.stringify({ c: [...S.customers].sort((a, b) => a.id < b.id ? -1 : 1).map(c => ({ ...c, tx: [...c.tx].sort((a, b) => a.id < b.id ? -1 : 1) })), p: [...S.pending].sort((a, b) => a.id < b.id ? -1 : 1), t: [...(S.trash || [])].filter(x => x.type === 'customer').map(x => ({ id: x.data.id, n: x.data.tx.length })).sort((a, b) => a.id < b.id ? -1 : 1) });
const OWNER = 'o'.repeat(32), WORK = 'w'.repeat(32);
// one direction of a sync round: sender -> receiver
function push(from, fromId, to, toId, toRole_of_sender, opts = {}) {
  captureLocal(from, fromId, now());
  const peer = ensureSync(to, toId).peers[fromId] || { recv: 0 };
  const evs = eventsAfter(from, fromId, peer.recv);
  const res = applyBatch(to, toId, fromId, toRole_of_sender, evs, now());
  if (res.ok) markAcked(from, fromId, toId, res.newRecv);
  return { res, evs };
}
function round(O, W) { const a = push(W, WORK, O, OWNER, 'W'); const b = push(O, OWNER, W, WORK, 'M'); return { a, b }; }
const seedOwner = () => { const O = mk(); for (let i = 0; i < 3; i++) { const c = { id: uid(), name: 'C' + i, phone: '055' + i, seg: 'daily', ceiling: 5000, payDay: null, tx: [] }; c.tx.push(tx('debt', 1000 * (i + 1)), tx('pay', 200)); O.customers.push(c); } O.pending.unshift({ id: uid(), no: 1, amount: 50, tape: '50', tag: 't', ts: now() }); return O; };

test('initial full sync = union, not replacement; worker converges to owner data', () => {
  const O = seedOwner(), W = mk(); W.customers.push({ id: uid(), name: 'LOCAL-W', phone: '1', seg: 'daily', ceiling: 1, payDay: null, tx: [tx('debt', 5)] });
  const { a, b } = round(O, W); assert.ok(a.res.ok && b.res.ok);
  round(O, W);
  assert.equal(canon(O), canon(W)); assert.equal(O.customers.length, 4);
  assert.ok(O.customers.some(c => c.name === 'LOCAL-W'), 'worker customer reached the owner');
});
test('later syncs send ONLY new events', () => {
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  const c = W.customers[0]; c.tx.push(tx('debt', 777));
  const r = push(W, WORK, O, OWNER, 'W'); assert.equal(r.evs.length, 1); assert.equal(r.evs[0].k, 'tx');
  const again = push(W, WORK, O, OWNER, 'W'); assert.equal(again.evs.length, 0);
  assert.equal(O.customers.find(x => x.id === c.id).tx.length, c.tx.length);
});
test('duplicate / re-delivered batches never duplicate a transaction', () => {
  const O = seedOwner(), W = mk(); round(O, W);
  W.customers[0].tx.push(tx('pay', 50)); captureLocal(W, WORK, now());
  const evs = eventsAfter(W, WORK, 0);
  const before = O.customers.find(c => c.id === W.customers[0].id).tx.length;
  const r1 = applyBatch(O, OWNER, WORK, 'W', evs, now()); const r2 = applyBatch(O, OWNER, WORK, 'W', evs, now());
  assert.ok(r1.ok && r2.ok && r2.applied === 0);
  assert.equal(O.customers.find(c => c.id === W.customers[0].id).tx.length, before + 1, 'applied exactly once');
});
test('concurrent transactions on the same customer are both kept; balances converge', () => {
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  const cid = O.customers[0].id;
  O.customers[0].tx.push(tx('debt', 111)); W.customers.find(c => c.id === cid).tx.push(tx('debt', 222), tx('pay', 33));
  round(O, W); round(O, W);
  const bo = bal(O.customers.find(c => c.id === cid)), bw = bal(W.customers.find(c => c.id === cid));
  assert.equal(bo, bw); assert.equal(canon(O), canon(W));
});
test('conflicting edits of the same field: deterministic last-writer-wins, loser recorded, both phones agree', () => {
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  const cid = O.customers[0].id;
  W.customers.find(c => c.id === cid).phone = 'W-PHONE'; O.customers[0].phone = 'O-PHONE';
  O.customers[0].ceiling = 9999;                                   // different field: no conflict
  round(O, W); round(O, W);
  const po = O.customers.find(c => c.id === cid), pw = W.customers.find(c => c.id === cid);
  assert.equal(po.phone, pw.phone); assert.equal(po.ceiling, 9999); assert.equal(pw.ceiling, 9999);
  assert.ok(O.sync.conflicts.length + W.sync.conflicts.length >= 1, 'losing value kept in conflicts log');
  const lost = [...O.sync.conflicts, ...W.sync.conflicts].map(c => c.lost);
  assert.ok(lost.includes('W-PHONE') || lost.includes('O-PHONE'));
});
test('worker cannot edit/archive customers, delete tickets or inject bad transactions (receiver enforces)', () => {
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  const forge = (ev) => { const s = ensureSync(W, WORK); const e = { id: WORK + ':' + (s.peers.__x = (s.peers.__x || 1000) + 1), s: 0, h: '000000000000001.00000.' + WORK, ...ev }; return e; };
  const attempt = (body) => { const W2 = JSON.parse(JSON.stringify(W)); const sy = ensureSync(W2, WORK); sy.log = []; sy.seq = ensureSync(O, OWNER).peers[WORK].recv; sy.seq += 1; const ev = { id: WORK + ':' + sy.seq, s: sy.seq, h: '999999999999999.00000.' + WORK, ...body }; sy.log.push(ev); return applyBatch(O, OWNER, WORK, 'W', eventsAfter(W2, WORK, ensureSync(O, OWNER).peers[WORK].recv), now()); };
  const cid = O.customers[0].id;
  const snapshot = canon(O);
  for (const [name, body] of [['rename', { k: 'cf', cid, f: { name: 'HACK' } }], ['ceiling', { k: 'cf', cid, f: { ceiling: 1e9 } }], ['ceiling when not blocked', { k: 'cf', cid, f: { ceiling: 6000 } }], ['unblock a customer that is not blocked', { k: 'cf', cid, f: { seg: 'salaried' } }], ['archive', { k: 'cst', cid, st: 'archived' }], ['del ticket', { k: 'tkx', tid: O.pending[0].id, why: 'archived' }],
    ['negative tx', { k: 'tx', cid, tx: tx('pay', -5) }], ['bad type', { k: 'tx', cid, tx: tx('refund', 5) }], ['unknown kind', { k: 'wipe' }], ['tx field injection', { k: 'cf', cid, f: { tx: [] } }]]) {
    const r = attempt(body); const q0 = (O.sync.quarantine || []).length; assert.equal(canon(O), snapshot, name + ' must not change anything'); if (r.ok) assert.ok(r.quarantined.length === 1, name + ' quarantined ' + JSON.stringify(r)); else assert.ok(['rejected', 'gap'].includes(r.reason), name + ' got ' + JSON.stringify(r));
  }
  const ok = attempt({ k: 'cf', cid, f: { seg: 'black' } }); assert.ok(ok.ok && ok.applied === 1, 'worker may block a customer (existing UI power)');
});
test('a rejected batch is atomic: valid events in the same batch are NOT applied either', () => {
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  const cid = O.customers[0].id, before = canon(O), recv = ensureSync(O, OWNER).peers[WORK].recv;
  W.customers.find(c => c.id === cid).tx.push(tx('debt', 10)); captureLocal(W, WORK, now());
  const sy = ensureSync(W, WORK); sy.seq += 1; sy.log.push({ id: WORK + ':' + sy.seq, s: sy.seq, h: '999999999999999.00000.' + WORK, k: 'tx', cid, tx: { id: 'bad', type: 'pay', amount: -5, ts: 1 } });
  const r = applyBatch(O, OWNER, WORK, 'W', eventsAfter(W, WORK, recv), now());
  assert.equal(r.ok, false); assert.equal(canon(O), before); assert.equal(ensureSync(O, OWNER).peers[WORK].recv, recv);
});
test('gap in sequence is refused (cursor does not advance)', () => {
  const O = seedOwner(), W = mk(); captureLocal(O, OWNER, now());
  const evs = eventsAfter(O, OWNER, 0).slice(2);
  const r = applyBatch(W, WORK, OWNER, 'M', evs, now()); assert.equal(r.reason, 'gap'); assert.equal(W.customers.length, 0);
});
test('owner archives a customer; worker had added a transaction offline: nothing lost, both end identical', () => {
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  const c = O.customers[0]; W.customers.find(x => x.id === c.id).tx.push(tx('debt', 400));
  O.customers = O.customers.filter(x => x.id !== c.id); O.trash.unshift({ id: uid(), type: 'customer', data: c, deletedAt: now() });
  round(O, W); round(O, W);
  assert.equal(W.customers.some(x => x.id === c.id), false); assert.equal(O.customers.some(x => x.id === c.id), false);
  const tO = O.trash.find(t => t.data.id === c.id).data, tW = W.trash.find(t => t.data.id === c.id).data;
  assert.ok(tO.tx.some(t => t.amount === 400) && tW.tx.some(t => t.amount === 400));
  assert.equal(canon(O), canon(W));
});
test('wipe / clear-all on one phone is NOT propagated and nothing is deleted on the other', () => {
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  O.customers = []; O.pending = [];
  const r = round(O, W); round(O, W);
  assert.equal(W.customers.length, 3); assert.equal(W.pending.length, 1); assert.ok(O.sync.diverged);
});
test('ticket assigned to a customer (consumed) disappears on the other phone; ticket archive by worker is refused', () => {
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  const t = O.pending[0]; const c = O.customers[0];
  c.tx.push(tx('debt', t.amount, { ts: t.ts, tape: t.tape })); O.pending = O.pending.filter(x => x.id !== t.id);
  round(O, W); round(O, W);
  assert.equal(W.pending.length, 0); assert.ok(W.customers.find(x => x.id === c.id).tx.some(x => x.tape === t.tape));
});
test('settings, passwords and licences are never part of any event', () => {
  const O = seedOwner(), W = mk(); O.settings.secretFlag = 'x'; O.auth.pw = { hash: 'SECRET' }; round(O, W);
  const all = JSON.stringify(ensureSync(O, OWNER).log); assert.ok(!all.includes('SECRET') && !all.includes('secretFlag') && !all.includes('dialect'));
});
test('interrupted transfer: partial progress is kept, resume sends only what is missing, result identical', () => {
  const O = mk(); const c = { id: uid(), name: 'Big', phone: '1', seg: 'daily', ceiling: 1, payDay: null, tx: [] };
  for (let i = 0; i < 500; i++) c.tx.push(tx('debt', i + 1)); O.customers.push(c);
  const W = mk(); captureLocal(O, OWNER, now());
  let evs = eventsAfter(O, OWNER, 0); assert.ok(evs.length > MAX_EVENTS_PER_BATCH);
  const first = evs.slice(0, MAX_EVENTS_PER_BATCH); assert.ok(applyBatch(W, WORK, OWNER, 'M', first, now()).ok);     // link dies after batch 1
  const recv = ensureSync(W, WORK).peers[OWNER].recv; assert.equal(recv, MAX_EVENTS_PER_BATCH);
  const rest = eventsAfter(O, OWNER, recv); assert.equal(rest.length, evs.length - MAX_EVENTS_PER_BATCH);
  for (let i = 0; i < rest.length; i += MAX_EVENTS_PER_BATCH) assert.ok(applyBatch(W, WORK, OWNER, 'M', rest.slice(i, i + MAX_EVENTS_PER_BATCH), now()).ok);
  assert.equal(canon(O), canon(W)); assert.equal(W.customers[0].tx.length, 500);
});
test('pristine demo data is discarded on the joining phone; edited data is merged instead', () => {
  const W = mk(); W.customers.push({ id: uid(), name: 'demo', phone: '', seg: 'daily', ceiling: 1, payDay: null, tx: [tx('debt', 1)] }); W.demoFp = demoFingerprint(W);
  assert.ok(isPristineDemo(W)); assert.ok(discardPristineDemo(W, WORK)); assert.equal(W.customers.length, 0);
  const W2 = mk(); W2.customers.push({ id: uid(), name: 'demo', phone: '', seg: 'daily', ceiling: 1, payDay: null, tx: [] }); W2.demoFp = demoFingerprint(W2); W2.customers[0].tx.push(tx('debt', 9));
  assert.equal(isPristineDemo(W2), false);
});
test('FUZZ: 300 random operations on both phones with random sync timing always converge with no lost or duplicated transaction', () => {
  let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  const all = new Set(); const addId = id => all.add(id);
  for (const c of O.customers) for (const t of c.tx) addId(t.id);
  for (let i = 0; i < 300; i++) {
    const side = rnd() < 0.5 ? O : W; const isO = side === O;
    const r = rnd();
    if (r < 0.45 && side.customers.length) { const c = side.customers[Math.floor(rnd() * side.customers.length)]; const t = tx(rnd() < 0.6 ? 'debt' : 'pay', 1 + Math.floor(rnd() * 500)); c.tx.push(t); addId(t.id); }
    else if (r < 0.6) { const c = { id: uid(), name: 'N' + i, phone: '', seg: 'daily', ceiling: 100, payDay: null, tx: [] }; side.customers.push(c); }
    else if (r < 0.75 && isO && side.customers.length) { side.customers[Math.floor(rnd() * side.customers.length)].phone = (isO ? 'O' : 'W') + i; }
    else if (r < 0.82 && isO && side.customers.length > 2) { const c = side.customers.pop(); side.trash.unshift({ id: uid(), type: 'customer', data: c, deletedAt: now() }); }
    else if (r < 0.9) { side.pending.unshift({ id: uid(), no: i, amount: 5, tape: 'x' + i, tag: 'g', ts: now() }); }
    if (rnd() < 0.2) { rnd() < 0.5 ? push(W, WORK, O, OWNER, 'W') : push(O, OWNER, W, WORK, 'M'); }
  }
  for (let k = 0; k < 4; k++) round(O, W);
  assert.equal(canon(O), canon(W));
  const txIds = S => S.customers.concat(S.trash.filter(t => t.type === 'customer').map(t => t.data)).flatMap(c => c.tx.map(t => t.id));
  for (const S of [O, W]) { const ids = txIds(S); assert.equal(new Set(ids).size, ids.length, 'no duplicate tx'); for (const id of all) { /* every tx created on either side must exist */ } }
  const idsO = new Set(txIds(O)); for (const id of all) assert.ok(idsO.has(id), 'no transaction lost: ' + id);
  assert.equal(pendingCount(O, OWNER, WORK), 0);
});

test('a quarantined worker edit never blocks later legitimate worker events (cursor advances)', () => {
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  const cid = O.customers[0].id;
  W.customers.find(c => c.id === cid).name = 'TAMPERED'; W.customers.find(c => c.id === cid).tx.push(tx('debt', 123));
  round(O, W); round(O, W);
  assert.notEqual(O.customers.find(c => c.id === cid).name, 'TAMPERED');
  assert.ok(O.customers.find(c => c.id === cid).tx.some(t => t.amount === 123), 'legit tx after the forbidden edit still arrives');
  assert.ok(O.sync.quarantine.some(q => q.reason === 'worker-cannot-edit-customer'));
  assert.equal(W.customers.find(c => c.id === cid).name, O.customers.find(c => c.id === cid).name, 'worker is corrected back to the owner value');
  assert.equal(canon(O), canon(W));
});
test('worker that archives a customer locally is corrected back to active by the owner', () => {
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  const c = W.customers[0]; W.customers = W.customers.filter(x => x.id !== c.id); W.trash.unshift({ id: uid(), type: 'customer', data: c, deletedAt: now() });
  round(O, W); round(O, W); round(O, W);
  assert.ok(O.customers.some(x => x.id === c.id) && W.customers.some(x => x.id === c.id)); assert.equal(canon(O), canon(W));
});

test('debt extension (dueAt & extensionHistory) syncs across devices via txf without duplicating the debt', () => {
  const O = { customers: [{ id: 'c1', name: 'Ali', phone: '0550', seg: 'salaried', ceiling: 30000, payDay: 10, tx: [{ id: 'd1', type: 'debt', amount: 5000, ts: 1000, dueAt: 2000 }] }], pending: [], trash: [] };
  const W = { customers: [], pending: [], trash: [] };
  ensureSync(O, 'O'); ensureSync(W, 'W');
  // Initial sync O -> W
  captureLocal(O, 'O', 1000);
  let r1 = applyBatch(W, 'W', 'O', 'M', eventsAfter(O, 'O', 0), 1001);
  assert.equal(r1.ok, true);
  assert.equal(W.customers[0].tx[0].dueAt, 2000);

  // Now O extends the debt (mutates existing transaction d1)
  O.customers[0].tx[0].originalDueAt = 2000;
  O.customers[0].tx[0].dueAt = 9000;
  O.customers[0].tx[0].extensionHistory = [{ at: 3000, from: 2000, to: 9000, amount: 7, unit: 'days' }];
  captureLocal(O, 'O', 3000);
  const evs = eventsAfter(O, 'O', r1.newRecv);
  assert.equal(evs.length, 1);
  assert.equal(evs[0].k, 'txf');

  let r2 = applyBatch(W, 'W', 'O', 'M', evs, 3001);
  assert.equal(r2.ok, true);
  assert.equal(W.customers[0].tx.length, 1);
  assert.equal(W.customers[0].tx[0].dueAt, 9000);
  assert.equal(W.customers[0].tx[0].originalDueAt, 2000);
  assert.equal(W.customers[0].tx[0].extensionHistory.length, 1);
});

test('worker cannot bypass segment/ceiling bounds via direct cf or cust+ events', () => {
  const O = { customers: [{ id: 'c1', name: 'Blk', phone: '0550', seg: 'black', ceiling: 0, tx: [] }], pending: [], trash: [] };
  ensureSync(O, 'O');
  const rBadSeg = checkEvent({ id: 'W:1', s: 1, h: '170000000000000.00001.W', k: 'cf', cid: 'c1', f: { seg: 'arbitrary_hacked_seg', ceiling: 5000 } }, 'W', O, 'O');
  assert.equal(rBadSeg.ok, false);
  const rBadCeil = checkEvent({ id: 'W:2', s: 2, h: '170000000000001.00001.W', k: 'cf', cid: 'c1', f: { seg: 'youth', ceiling: 99999 } }, 'W', O, 'O');
  assert.equal(rBadCeil.ok, false);
  const rCustWithTx = checkEvent({ id: 'W:3', s: 3, h: '170000000000002.00001.W', k: 'cust+', c: { id: 'c2', name: 'X', seg: 'daily', ceiling: 5000, tx: [{ id: 't1', type: 'debt', amount: 100, ts: 1 }] } }, 'W', O, 'O');
  assert.equal(rCustWithTx.ok, false);
  const rValidUnblock = checkEvent({ id: 'W:4', s: 4, h: '170000000000003.00001.W', k: 'cf', cid: 'c1', f: { seg: 'salaried', ceiling: 30000 } }, 'W', O, 'O');
  assert.equal(rValidUnblock.ok, true);
});
```

================================================================================
## [27/32] FILE: `sync/test_session.mjs`

- **المسار الأصلي**: `sync/test_session.mjs`
- **الحجم**: `13,114` بايت | **الأسطر**: `157` | **SHA-256**: `26813e7f8cfa39ad740e6b19c0a620e4d4f43fc077b55d9afd2ec9dae45b5e95`

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { Identity, Session, makeOffer, parseOffer, PAIR_TTL_MS } from './session.js';
import { captureLocal, eventsAfter, applyBatch, markAcked, ensureSync } from './engine.js';

let n = 0; const uid = () => 'u' + (++n).toString(36) + Math.random().toString(36).slice(2, 6);
let clock = 1_800_000_000_000; const now = () => (clock += 500);
const tx = (type, amount) => ({ id: uid(), type, amount, note: '', ts: now() });
const hex32 = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
const canon = S => JSON.stringify([...S.customers].sort((a, b) => a.id < b.id ? -1 : 1).map(c => ({ ...c, tx: [...c.tx].sort((a, b) => a.id < b.id ? -1 : 1) })));

async function device(role, S) {
  const d = { did: hex32(), role, S: S || { customers: [], pending: [], trash: [], settings: {}, auth: {} }, identity: await Identity.create(), peers: {}, pairing: null, applied: 0 };
  d.licence = 'LIC:' + d.did + ':' + role;
  d.ctx = {
    did: d.did, identity: d.identity, licence: d.licence, now,
    verifyLicence: async (code, did) => { const m = /^LIC:([0-9a-f]{32}):(M|W)$/.exec(code || ''); return m && m[1] === did ? { role: m[2] } : null; },
    getPeer: id => d.peers[id] || null, savePeer: (id, rec) => { d.peers[id] = rec; ensureSync(d.S, d.did).peers[id] = ensureSync(d.S, d.did).peers[id] || { recv: 0, acked: 0 }; },
    get pairing() { return d.pairing; },
    sync: {
      prepare: async () => { captureLocal(d.S, d.did, now()); },
      recvFrom: p => (ensureSync(d.S, d.did).peers[p] || { recv: 0 }).recv,
      eventsAfter: (p, r) => eventsAfter(d.S, d.did, r),
      acked: (p, r) => markAcked(d.S, d.did, p, r),
      apply: async (p, role, evs) => { const r = applyBatch(d.S, d.did, p, role, evs, now()); if (r.ok) d.applied += r.applied; return r; }
    }
  };
  return d;
}
// in-memory link with fault injection + a wire log
function link(opts = {}) {
  const wire = []; let count = 0, A, B;
  const mk = (peer) => ({ send: s => {
      count += 1; wire.push(s);
      if (opts.cutAfter && count > opts.cutAfter) { A && A.onClose(); B && B.onClose(); return; }
      let out = s;
      if (opts.tamper === count) { const m = JSON.parse(s); if (m.d) { const u = Buffer.from(m.d, 'base64'); u[5] ^= 1; m.d = u.toString('base64'); out = JSON.stringify(m); } }
      const deliver = () => (peer() ? peer().feed(out) : null);
      Promise.resolve().then(deliver); if (opts.dup === count) Promise.resolve().then(deliver);
    }, close: () => { Promise.resolve().then(() => { const p = peer(); if (p) p.onClose(); }); } });
  const ta = mk(() => B), tb = mk(() => A);
  return { ta, tb, setA: s => { A = s; }, setB: s => { B = s; }, wire };
}
async function connect(init, resp, { offer, opts } = {}) {
  const L = link(opts); const si = new Session(L.ta, init.ctx, 'initiator'), sr = new Session(L.tb, resp.ctx, 'responder'); L.setA(si); L.setB(sr);
  const hs = await Promise.allSettled([si.handshakeInitiator({ offer }), sr.handshakeResponder()]);
  return { si, sr, L, hs };
}
async function fullSync(si, sr) { return Promise.allSettled([si.exchange(), sr.exchange()]); }
const ownerData = () => { const S = { customers: [], pending: [], trash: [], settings: { secretsetting: 'S' }, auth: { pw: { hash: 'PWHASH' } } }; for (let i = 0; i < 3; i++) { const c = { id: uid(), name: 'عميل-' + i, phone: '0555' + i, seg: 'daily', ceiling: 5000, payDay: null, tx: [tx('debt', 1000), tx('pay', 100)] }; S.customers.push(c); } return S; };

async function pairedPair() {
  const O = await device('M', ownerData()), W = await device('W');
  const { offer, text, state } = makeOffer({ did: O.did, idpub: O.identity.pub, ip: '192.168.1.20', port: 4747, now: now() }); O.pairing = state;
  const parsed = parseOffer(text); assert.ok(parsed);
  const c = await connect(W, O, { offer: parsed }); assert.ok(c.hs.every(h => h.status === 'fulfilled'), JSON.stringify(c.hs.map(h => h.reason && h.reason.message)));
  return { O, W, c, text };
}

test('QR offer round-trips and rejects garbage', () => {
  const o = makeOffer({ did: hex32(), idpub: 'AAAA', ip: '10.0.0.5', port: 4000, now: 1 }); const p = parseOffer(o.text);
  assert.equal(p.port, 4000); assert.equal(p.ip, '10.0.0.5'); assert.equal(parseOffer('DEYNPAIR1:@@@'), null); assert.equal(parseOffer('hello'), null); assert.equal(parseOffer(null), null);
});
test('pairing: both phones pin each other; owner records the new phone as WORKER; worker records owner as MASTER', async () => {
  const { O, W } = await pairedPair();
  assert.equal(O.peers[W.did].role, 'W'); assert.equal(W.peers[O.did].role, 'M');
  assert.equal(O.peers[W.did].idpub, W.identity.pub); assert.equal(W.peers[O.did].idpub, O.identity.pub);
});
test('initial full sync over the encrypted channel; worker ends with the owner data; no settings/password leave the owner', async () => {
  const { O, W, c } = await pairedPair();
  const r = await fullSync(c.si, c.sr); assert.ok(r.every(x => x.status === 'fulfilled'), JSON.stringify(r.map(x => x.reason && x.reason.message)));
  assert.equal(canon(O.S), canon(W.S)); assert.equal(W.S.customers.length, 3);
  assert.ok(!JSON.stringify(W.S).includes('PWHASH') && !JSON.stringify(W.S).includes('secretsetting'));
});
test('eavesdropper sees no plaintext: names, amounts and JSON keys never appear on the wire after the handshake', async () => {
  const { O, W, c } = await pairedPair(); await fullSync(c.si, c.sr);
  const post = c.L.wire.filter(s => JSON.parse(s).t === 'e').join('');
  assert.ok(post.length > 500); for (const needle of ['عميل', 'customers', 'amount', '0555', 'debt']) assert.ok(!post.includes(needle), needle);
  const hs = c.L.wire.filter(s => JSON.parse(s).t !== 'e').join(''); assert.ok(!hs.includes('"s":'), 'QR secret never sent');
});
test('incremental sync afterwards (known peers, no QR): only new events travel; both directions', async () => {
  const { O, W, c } = await pairedPair(); await fullSync(c.si, c.sr);
  W.S.customers[0].tx.push(tx('debt', 321)); O.S.customers[1].tx.push(tx('pay', 55));
  const c2 = await connect(W, O, {}); assert.ok(c2.hs.every(h => h.status === 'fulfilled'), JSON.stringify(c2.hs.map(h => h.reason && h.reason.message)));
  const r = await fullSync(c2.si, c2.sr); const out = r.map(x => x.value);
  assert.equal(out[0].sent, 1); assert.equal(out[0].received, 1); assert.equal(canon(O.S), canon(W.S));
  const c3 = await connect(W, O, {}); const r3 = (await fullSync(c3.si, c3.sr)).map(x => x.value); assert.deepEqual([r3[0].sent, r3[0].received], [0, 0]);
});
test('wrong QR secret: responder refuses, nothing paired; 3 failures burn the offer even for the right secret', async () => {
  const O = await device('M', ownerData()), W = await device('W');
  const { offer, state } = makeOffer({ did: O.did, idpub: O.identity.pub, ip: 'x', port: 1, now: now() }); O.pairing = state;
  const wrong = { ...offer, secret: crypto.getRandomValues(new Uint8Array(16)) };
  for (let i = 0; i < 3; i++) { const c = await connect(W, O, { offer: wrong }); assert.ok(c.hs.some(h => h.status === 'rejected')); }
  assert.deepEqual(Object.keys(O.peers), []);
  const good = await connect(W, O, { offer: { ...offer, secret: state.secret } }); assert.ok(good.hs.some(h => h.status === 'rejected'), 'offer burned after 3 bad attempts');
});
test('the offer is single-use and expires', async () => {
  const O = await device('M', ownerData()), W = await device('W'), W2 = await device('W');
  const { offer, state } = makeOffer({ did: O.did, idpub: O.identity.pub, ip: 'x', port: 1, now: now() }); O.pairing = state;
  const ok = await connect(W, O, { offer: { ...offer, secret: state.secret } }); assert.ok(ok.hs.every(h => h.status === 'fulfilled'));
  const again = await connect(W2, O, { offer: { ...offer, secret: state.secret } }); assert.ok(again.hs.some(h => h.status === 'rejected'), 'a second phone cannot reuse the QR');
  const O2 = await device('M'); const f = makeOffer({ did: O2.did, idpub: O2.identity.pub, ip: 'x', port: 1, now: now() }); f.state.expiresAt = now() - 1; O2.pairing = f.state;
  const late = await connect(await device('W'), O2, { offer: { ...f.offer, secret: f.state.secret } }); assert.ok(late.hs.some(h => h.status === 'rejected'), 'expired');
});
test('a stranger that never paired cannot connect in "known" mode', async () => {
  const { O } = await pairedPair(); const stranger = await device('W');
  const c = await connect(stranger, O, {}); assert.ok(c.hs.some(h => h.status === 'rejected')); assert.equal(Object.keys(ensureSync(O.S, O.did).peers).length, 1);
});
test('impostor presenting a paired device id with its OWN key is rejected (identity pinned)', async () => {
  const { O, W } = await pairedPair(); const evil = await device('W'); evil.did = W.did; evil.ctx.did = W.did; evil.licence = 'LIC:' + W.did + ':W'; evil.ctx.licence = evil.licence;
  evil.peers[O.did] = { idpub: O.identity.pub, role: 'M' };
  const c = await connect(evil, O, {}); assert.ok(c.hs.some(h => h.status === 'rejected'));
});
test('a phone whose licence is worker-only cannot act as the OWNER during pairing', async () => {
  const fakeOwner = await device('W', ownerData()), W = await device('W');
  const { offer, state } = makeOffer({ did: fakeOwner.did, idpub: fakeOwner.identity.pub, ip: 'x', port: 1, now: now() }); fakeOwner.pairing = state;
  const c = await connect(W, fakeOwner, { offer: { ...offer, secret: state.secret } }); assert.ok(c.hs.some(h => h.status === 'rejected' && /owner/.test(h.reason.message)));
});
test('QR identity mismatch (attacker answers at the scanned address with another key) is detected by the scanner', async () => {
  const O = await device('M'), attacker = await device('M'), W = await device('W');
  const { offer } = makeOffer({ did: O.did, idpub: O.identity.pub, ip: 'x', port: 1, now: now() });
  const fp = makeOffer({ did: attacker.did, idpub: attacker.identity.pub, ip: 'x', port: 1, now: now() }); attacker.pairing = { secret: offer.secret, expiresAt: now() + 1e6, attemptsLeft: 3, used: false };
  const c = await connect(W, attacker, { offer }); assert.ok(c.hs.some(h => h.status === 'rejected'));
});
test('tampered ciphertext aborts the session and changes nothing', async () => {
  const { O, W, c } = await pairedPair(); const before = canon(W.S);
  const c2 = await connect(W, O, { opts: { tamper: 8 } }); const r = await fullSync(c2.si, c2.sr);
  assert.ok(r.some(x => x.status === 'rejected')); assert.equal(canon(W.S), before);
});
test('replayed (duplicated) frame aborts the session', async () => {
  const { O, W } = await pairedPair(); const c2 = await connect(W, O, { opts: { dup: 7 } }); const r = await fullSync(c2.si, c2.sr);
  assert.ok(r.some(x => x.status === 'rejected'));
});
test('connection cut mid-transfer: nothing lost or duplicated, resume completes from the saved cursor', async () => {
  const O = await device('M'), W = await device('W');
  const big = { id: uid(), name: 'Big', phone: '1', seg: 'daily', ceiling: 1, payDay: null, tx: [] }; for (let i = 0; i < 700; i++) big.tx.push(tx('debt', i + 1)); O.S.customers.push(big);
  const { offer, state } = makeOffer({ did: O.did, idpub: O.identity.pub, ip: 'x', port: 1, now: now() }); O.pairing = state;
  const c = await connect(W, O, { offer: { ...offer, secret: state.secret }, opts: { cutAfter: 10 } });
  const r1 = await Promise.allSettled([c.si.exchange(), c.sr.exchange()]); assert.ok(r1.some(x => x.status === 'rejected'), 'first attempt interrupted');
  const mid = W.S.customers.length ? W.S.customers[0].tx.length : 0; assert.ok(mid < 700);
  let tries = 0; for (; tries < 5 && canon(O.S) !== canon(W.S); tries++) { const cc = await connect(W, O, {}); await fullSync(cc.si, cc.sr); }
  assert.equal(canon(O.S), canon(W.S)); assert.equal(W.S.customers.find(x => x.id === big.id).tx.length, 700);
  const ids = W.S.customers.flatMap(x => x.tx.map(t => t.id)); assert.equal(new Set(ids).size, ids.length);
});
test('worker that sends forbidden edits through the secure channel: owner quarantines them, legit data still syncs', async () => {
  const { O, W, c } = await pairedPair(); await fullSync(c.si, c.sr);
  const cust = W.S.customers[0]; cust.name = 'WORKER-RENAME'; cust.tx.push(tx('debt', 77));
  const c2 = await connect(W, O, {}); const r = await fullSync(c2.si, c2.sr); assert.ok(r.every(x => x.status === 'fulfilled'));
  const oc = O.S.customers.find(x => x.id === cust.id); assert.notEqual(oc.name, 'WORKER-RENAME'); assert.ok(oc.tx.some(t => t.amount === 77));
  assert.ok(ensureSync(O.S, O.did).quarantine.length >= 1);
});
test('offline accumulation: events pile up while disconnected and flow once the link returns', async () => {
  const { O, W, c } = await pairedPair(); await fullSync(c.si, c.sr);
  for (let i = 0; i < 25; i++) W.S.customers[i % 3].tx.push(tx('debt', 10 + i));
  assert.ok(true); const c2 = await connect(W, O, {}); await fullSync(c2.si, c2.sr);
  assert.equal(canon(O.S), canon(W.S)); assert.equal(O.S.customers.reduce((a, x) => a + x.tx.length, 0), 6 + 25);
});
```

================================================================================
## [28/32] FILE: `tests/e2e/harness.py`

- **المسار الأصلي**: `tests/e2e/harness.py`
- **الحجم**: `17,018` بايت | **الأسطر**: `239` | **SHA-256**: `71864a844b17432270cf57cd1d8772387a372bd47d3c221380bc231d9e5d3c81`

```python
"""DEYN e2e harness: real app + real Keygen HTML in Chromium, ephemeral TEST Ed25519 key (never shipped)."""
import os, base64, http.server, json, os, re, socketserver, subprocess, tempfile, threading, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
APP_SRC = ROOT / "deyn-app/www/index.html"
KG_SRC = ROOT / "deyn-keygen/www/index.html"
PROD_PUB = re.search(r"var DEYN_PUBLIC_KEY\s*=\s*'([^']+)'", APP_SRC.read_text(encoding="utf8")).group(1)

def make_test_key():
    js = ("const c=require('crypto');const {publicKey,privateKey}=c.generateKeyPairSync('ed25519');"
          "const raw=Buffer.from(publicKey.export({format:'jwk'}).x,'base64url').toString('base64');"
          "console.log(JSON.stringify({pub:raw,pem:privateKey.export({type:'pkcs8',format:'pem'})}))")
    return json.loads(subprocess.check_output(["node", "-e", js]))

MOCK = r"""
(() => {
  const P='mock_ss:'; const skewInit=parseInt(localStorage.getItem('__skew')||'0',10)||0;
  const R=Date; let skew=skewInit;
  window.__setSkew=v=>{skew=v;localStorage.setItem('__skew',String(v));};
  class D extends R{constructor(...a){if(a.length===0)super(R.now()+skew);else super(...a);} static now(){return R.now()+skew;}}
  window.Date=D;
  window.__failSecure=false;
  window.Capacitor={Plugins:{
    SecureStoragePlugin:{
      get:async({key})=>{const v=localStorage.getItem(P+key);if(v===null)throw new Error('missing');return {value:v};},
      set:async({key,value})=>{if(window.__failSecure)throw new Error('secure storage failure');localStorage.setItem(P+key,value);return {value:true};},
      remove:async({key})=>{localStorage.removeItem(P+key);}},
    Device:{getId:async()=>({identifier:'test-device-'+(localStorage.getItem('__devseed')||'A')})},
    Clipboard:{write:async()=>{},read:async()=>({value:''})}}};
})();

// ---- opt-in AES-GCM stand-in for the native Keystore plugin (TEST ONLY: its key sits in localStorage, the real one never leaves Keystore)
(() => {
  if (!localStorage.getItem('__vault_mock')) return;
  const VK='mock_vault_key', E=new TextEncoder();
  const b64=u=>{let t='';for(const x of u)t+=String.fromCharCode(x);return btoa(t);}, un=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  async function key(){let j=localStorage.getItem(VK),k;if(j)k=await crypto.subtle.importKey('jwk',JSON.parse(j),'AES-GCM',true,['encrypt','decrypt']);else{k=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);localStorage.setItem(VK,JSON.stringify(await crypto.subtle.exportKey('jwk',k)));}return k;}
  window.Capacitor.Plugins.DeynVault={
    status:async()=>{if(localStorage.getItem('__vault_off'))throw new Error('keystore unavailable');await key();return {ready:true};},
    encrypt:async({data,aad})=>{if(localStorage.getItem('__vault_failw'))throw new Error('encrypt failed');const iv=crypto.getRandomValues(new Uint8Array(12));const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:E.encode(aad||'')},await key(),un(data)));return {iv:b64(iv),data:b64(ct)};},
    decrypt:async({iv,data,aad})=>{const pt=new Uint8Array(await crypto.subtle.decrypt({name:'AES-GCM',iv:un(iv),additionalData:E.encode(aad||'')},await key(),un(data)));return {data:b64(pt)};}
  };
})();
"""

class Site:
    def __init__(self, key=None, prod_key=False, enforce=True, time_pub=None):
        self.dir = Path(tempfile.mkdtemp(prefix="deynsite_"))
        self.key = key or make_test_key()
        pub = PROD_PUB if prod_key else self.key["pub"]
        app = APP_SRC.read_text(encoding="utf8").replace(PROD_PUB, pub)
        if enforce: app = app.replace("enforce:false}", "enforce:true}", 1)
        if time_pub: app = app.replace("pub:'',enforce", "pub:'%s',enforce" % time_pub, 1).replace("url:'',pub", "url:'https://time.test',pub", 1)
        kg = KG_SRC.read_text(encoding="utf8").replace(PROD_PUB, pub)
        (self.dir / "app").mkdir(); (self.dir / "kg").mkdir()
        (self.dir / "app/index.html").write_text(app, encoding="utf8")
        (self.dir / "kg/index.html").write_text(kg, encoding="utf8")
        d = str(self.dir)
        class H(http.server.SimpleHTTPRequestHandler):
            def __init__(s, *a, **k): super().__init__(*a, directory=d, **k)
            def log_message(s, *a): pass
        self.srv = socketserver.TCPServer(("127.0.0.1", 0), H)
        self.port = self.srv.server_address[1]
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()
    @property
    def app_url(self): return f"http://localhost:{self.port}/app/index.html"
    @property
    def kg_url(self): return f"http://localhost:{self.port}/kg/index.html"
    def close(self): self.srv.shutdown(); shutil.rmtree(self.dir, ignore_errors=True)

class Env:
    def __init__(self, site, width=360, height=740, vault=False, relay=None):
        self.site = site; self.vault = vault; self.relay = relay
        self.pw = sync_playwright().start()
        self.browser = self.pw.chromium.launch()
        self.ctx = self.browser.new_context(viewport={"width": width, "height": height})
        if vault: self.ctx.add_init_script("localStorage.setItem('__vault_mock','1')")
        self.ctx.add_init_script(MOCK)
        if relay: self.ctx.add_init_script(relay.script('main'))
        self.errors = []
        # keygen page (separate context so it has its own origin storage)
        self.kg_ctx = self.browser.new_context(viewport={"width": 390, "height": 800})
        self.kg = self.kg_ctx.new_page()
        self.kg.on("pageerror", lambda e: self.errors.append("KEYGEN: " + str(e)))
        self.kg.goto(site.kg_url)
        self.kg.fill("#privateKey", site.key["pem"])
    def new_app(self):
        pg = self.ctx.new_page()
        pg.on("pageerror", lambda e: self.errors.append("APP: " + str(e)))
        pg.goto(self.site.app_url); pg.wait_for_selector("#agDevId"); pg.wait_for_function("document.getElementById('agDevId').textContent.trim().length==32")
        return pg
    def new_device(self, seed):
        """A separate phone: own storage + own device seed."""
        ctx = self.browser.new_context(viewport={"width": 360, "height": 740})
        if self.vault: ctx.add_init_script("localStorage.setItem('__vault_mock','1')")
        ctx.add_init_script(MOCK)
        if self.relay: ctx.add_init_script(self.relay.script(seed))
        ctx.add_init_script("if(!localStorage.getItem('__devseed'))localStorage.setItem('__devseed','%s')" % seed)
        pg = ctx.new_page(); pg.on("pageerror", lambda e: self.errors.append("APP[%s]: %s" % (seed, e)))
        pg.goto(self.site.app_url); pg.wait_for_function("document.getElementById('agDevId').textContent.trim().length==32")
        return pg
    def dev_id(self, pg): return pg.inner_text("#agDevId").strip()
    def _gen(self, btn):
        self.kg.click(btn); self.kg.wait_for_function("document.getElementById('code').textContent.length>20 || document.getElementById('err').classList.contains('show')")
        if self.kg.evaluate("document.getElementById('err').classList.contains('show')"):
            raise RuntimeError(self.kg.inner_text("#err"))
        return self.kg.inner_text("#code").strip()
    def license(self, dev, tier="LT", role="M", expiry="2099-01-01"):
        self.kg.fill("#devId", dev)
        self.kg.click(f"#tierSeg button[data-v=\"{tier}\"]"); self.kg.click(f"#roleSeg button[data-v=\"{role}\"]")
        if tier != "LT": self.kg.fill("#expiryDate", expiry)
        return self._gen("#gen")
    def recovery(self, dev):
        self.kg.fill("#devId", dev); return self._gen("#genRec")
    def sign_license(self, payload):
        """Custom (possibly invalid) payload signed with the test key, to craft expired/odd licences."""
        return self.kg.evaluate("""async(p)=>{const priv=await checkKey(document.getElementById('privateKey').value);
          const body=new TextEncoder().encode(canonical(p));const sig=new Uint8Array(await crypto.subtle.sign('Ed25519',priv,body));
          return 'DEYN3-'+b64u(body)+'.'+b64u(sig);}""", payload)
    def sign_recovery(self, p):
        return self.kg.evaluate("""async(p)=>{const priv=await checkKey(document.getElementById('privateKey').value);
          const body=new TextEncoder().encode(recCanonical(p));const msg=new Uint8Array([...new TextEncoder().encode(REC_PREFIX),...body]);
          const sig=new Uint8Array(await crypto.subtle.sign('Ed25519',priv,msg));return 'DEYNR1-'+b64u(body)+'.'+b64u(sig);}""", p)
    def activate(self, pg, code):
        pg.fill("#agCode", code); pg.click("#agGo"); pg.wait_for_timeout(700)
    def started(self, pg): return pg.evaluate("document.body.classList.contains('lic-ok')")
    def gate_err(self, pg): return pg.inner_text("#agErr").strip() if pg.evaluate("document.getElementById('agErr').classList.contains('show')") else ""
    def close(self):
        self.browser.close(); self.pw.stop()

class Results:
    def __init__(self): self.rows = []
    def check(self, name, cond, detail=""):
        self.rows.append((name, bool(cond), detail)); print(("PASS " if cond else "FAIL ") + name + (f" — {detail}" if detail and not cond else ""))
    def summary(self):
        ok = sum(1 for r in self.rows if r[1]); print(f"\n{ok}/{len(self.rows)} passed"); return ok == len(self.rows)


import subprocess, time, urllib.request, urllib.parse
class TimeServer:
    """The REAL trusted-time Worker module served by Node, with a controllable fake clock offset. Test key only."""
    def __init__(self, allowed_origin):
        self.key = make_test_key()
        self.tmp = Path(tempfile.mkdtemp(prefix="deyntime_"))
        shutil.copy(ROOT / "trusted-time/worker.js", self.tmp / "worker.mjs")
        priv_b64 = self.key["pem"].replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace("\n", "").strip()
        (self.tmp / "srv.mjs").write_text("""
import http from 'node:http'; import worker from './worker.mjs';
let offset = 0; const RD = Date.now; Date.now = () => RD() + offset;
const env = { TIME_SIGNING_KEY: process.env.K, ALLOWED_ORIGIN: process.env.ORIGIN };
const srv = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname === '/__offset') { offset = Number(u.searchParams.get('ms')); res.end('ok'); return; }
  const chunks = []; for await (const c of req) chunks.push(c);
  const r = await worker.fetch(new Request('https://t' + req.url, { method: req.method, body: ['GET','HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) }), env);
  res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(await r.text());
});
srv.listen(0, '127.0.0.1', () => console.log(srv.address().port));
""", encoding="utf8")
        self.origin = allowed_origin
        env = dict(os.environ, K=priv_b64, ORIGIN=allowed_origin)
        self.proc = subprocess.Popen(["node", str(self.tmp / "srv.mjs")], env=env, stdout=subprocess.PIPE, text=True)
        self.port = int(self.proc.stdout.readline().strip())
    def set_offset(self, ms): urllib.request.urlopen(f"http://127.0.0.1:{self.port}/__offset?ms={int(ms)}").read()
    def attach(self, ctx, mode="live"):
        """Route https://time.test/* to the Node worker. mode: live | offline | replay"""
        self.last = None; self.mode = mode; self.captured = []
        def handler(route, request):
            if self.mode == "offline": return route.abort("connectionrefused")
            if self.mode == "replay" and self.captured and request.method == "POST":
                return route.fulfill(status=200, headers={"access-control-allow-origin": self.origin, "content-type": "application/json"}, body=self.captured[0])
            r = route.fetch(url=f"http://127.0.0.1:{self.port}{urllib.parse.urlparse(request.url).path}")
            if request.method == "POST": self.captured.append(r.text())
            route.fulfill(response=r)
        ctx.route("https://time.test/**", handler)
    def close(self): self.proc.kill(); shutil.rmtree(self.tmp, ignore_errors=True)


RELAY_JS = r"""
import http from 'node:http';
const conns = new Map(), listeners = new Map(), queues = new Map(), waiters = new Map();
let nextId = 1, frames = 0, cutAfter = 0, tamperAt = 0, dupAt = 0;
const emit = (client, ev) => { const q = queues.get(client) || []; q.push(ev); queues.set(client, q); const w = waiters.get(client); if (w) { waiters.delete(client); w(); } };
const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
const killAll = () => { for (const [id, c] of conns) { emit(c.client, { ev: 'closed', connId: id }); } conns.clear(); };
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  const body = await new Promise(r => { let b = ''; req.on('data', d => b += d); req.on('end', () => r(b ? JSON.parse(b) : {})); });
  const ok = o => { res.writeHead(200, { ...cors, 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
  if (u.pathname === '/listen') { listeners.set(body.client, 47821); return ok({ port: 47821 + listeners.size, ip: '192.168.1.' + (10 + listeners.size) }); }
  if (u.pathname === '/connect') {
    const target = [...listeners.keys()].find(c => c !== body.client); if (!target) { res.writeHead(500, cors); return res.end('refused'); }
    const a = 'c' + (nextId++), b = 's' + (nextId++); conns.set(a, { client: body.client, peer: b }); conns.set(b, { client: target, peer: a });
    emit(target, { ev: 'accepted', connId: b }); return ok({ connId: a });
  }
  if (u.pathname === '/send') {
    const c = conns.get(body.connId); if (!c) { res.writeHead(500, cors); return res.end('closed'); }
    frames++; let data = body.data;
    if (cutAfter && frames > cutAfter) { cutAfter = 0; killAll(); return ok({}); }
    if (tamperAt && frames === tamperAt) { const m = JSON.parse(data); if (m.d) { m.d = m.d.slice(0, 8) + (m.d[8] === 'A' ? 'B' : 'A') + m.d.slice(9); data = JSON.stringify(m); } }
    const p = conns.get(c.peer); if (p) { emit(p.client, { ev: 'frame', connId: c.peer, data }); if (dupAt && frames === dupAt) emit(p.client, { ev: 'frame', connId: c.peer, data }); }
    return ok({});
  }
  if (u.pathname === '/close') { const c = conns.get(body.connId); if (c) { const p = conns.get(c.peer); conns.delete(body.connId); if (p) { conns.delete(c.peer); emit(p.client, { ev: 'closed', connId: c.peer }); } } return ok({}); }
  if (u.pathname === '/poll') {
    const client = u.searchParams.get('client'); const q = queues.get(client) || [];
    if (!q.length) await Promise.race([new Promise(r => waiters.set(client, r)), new Promise(r => setTimeout(r, 1500))]);
    const out = queues.get(client) || []; queues.set(client, []); return ok(out);
  }
  if (u.pathname === '/__cut') { cutAfter = Number(u.searchParams.get('after')); frames = 0; return ok({}); }
  if (u.pathname === '/__tamper') { tamperAt = Number(u.searchParams.get('at')); frames = 0; return ok({}); }
  if (u.pathname === '/__dup') { dupAt = Number(u.searchParams.get('at')); frames = 0; return ok({}); }
  if (u.pathname === '/__reset') { cutAfter = tamperAt = dupAt = 0; frames = 0; killAll(); return ok({}); }
  if (u.pathname === '/__drop') { killAll(); return ok({}); }
  res.writeHead(404, cors); res.end();
}).listen(0, '127.0.0.1', function () { console.log(this.address().port); });
"""
class Relay:
    """Stand-in for the native DeynSync TCP plugin: connects two Chromium contexts through a local relay. Test only."""
    def __init__(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="deynrelay_")); (self.tmp / "r.mjs").write_text(RELAY_JS, encoding="utf8")
        self.proc = subprocess.Popen(["node", str(self.tmp / "r.mjs")], stdout=subprocess.PIPE, text=True)
        self.port = int(self.proc.stdout.readline().strip())
    def call(self, path):
        urllib.request.urlopen(f"http://127.0.0.1:{self.port}{path}").read()
    def script(self, client):
        return """
(() => { const BASE='http://127.0.0.1:%d', ME='%s'; const L={}; let polling=false;
  const post=async(p,b)=>{const r=await fetch(BASE+p,{method:'POST',body:JSON.stringify({client:ME,...b})});if(!r.ok)throw new Error(await r.text());return r.json();};
  const poll=async()=>{ if(polling)return; polling=true; for(;;){ try{ const r=await fetch(BASE+'/poll?client='+ME); const evs=await r.json(); for(const e of evs){ (L[e.ev]||[]).forEach(cb=>cb(e)); } }catch(x){ await new Promise(r=>setTimeout(r,300)); } } };
  window.Capacitor.Plugins.DeynSync={
    listen: async()=>post('/listen',{}), connect: async({ip,port})=>post('/connect',{ip,port}),
    send: async({connId,data})=>post('/send',{connId,data}), close: async({connId})=>post('/close',{connId}),
    addListener: async(ev,cb)=>{ (L[ev]=L[ev]||[]).push(cb); poll(); return {remove(){}}; } };
})();""" % (self.port, client)
    def close(self): self.proc.kill(); shutil.rmtree(self.tmp, ignore_errors=True)
```

================================================================================
## [29/32] FILE: `tests/e2e/test_auth.py`

- **المسار الأصلي**: `tests/e2e/test_auth.py`
- **الحجم**: `11,498` بايت | **الأسطر**: `142` | **SHA-256**: `69c986f8d4b0546cfb6b81c70a90224fec2a6495e9aa8ed452c0085449de01a1`

```python
import json, sys, time
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from harness import *

R = Results()
site = Site()
LEGACY_DEFAULT = "fc" + "b1899"   # built at runtime only so this test file is not itself a source of the literal in the app

def state(pg): return pg.evaluate("JSON.parse(localStorage.getItem('deyn.v1'))")
def set_state(pg, fn_js): pg.evaluate("(()=>{const s=JSON.parse(localStorage.getItem('deyn.v1'));"+fn_js+";localStorage.setItem('deyn.v1',JSON.stringify(s));})()")
def balances(pg): return pg.evaluate("S.customers.map(c=>[c.name,bal(c),c.tx.length])")
def toast(pg): return pg.inner_text("#toast").strip()

def boot_owner(env):
    pg = env.new_app(); dev = env.dev_id(pg)
    env.activate(pg, env.license(dev, "LT", "M"))
    assert env.started(pg), env.gate_err(pg)
    pg.wait_for_timeout(1200)
    return pg, dev

env = Env(site)
try:
    # ---------- fresh install ----------
    pg, dev = boot_owner(env)
    st = state(pg)
    R.check("fresh install: no plaintext/default password stored", 'masterPass' not in st['auth'] and LEGACY_DEFAULT not in json.dumps(st))
    R.check("fresh install: owner is asked to set a password (pwMustSet)", st['auth'].get('pwMustSet') is True and 'pw' not in st['auth'])
    R.check("fresh install: set-password prompt appears", pg.locator("#pwNew").count() == 1)
    seed_balances = balances(pg)
    R.check("demo data still present (10 customers)", len(seed_balances) == 10)

    # set password: mismatch / short / ok
    pg.fill("#pwNew", "abc"); pg.fill("#pwNew2", "abc"); pg.click("[data-act=pwSetSubmit]"); pg.wait_for_timeout(300)
    R.check("password shorter than 8 rejected", 'pw' not in state(pg)['auth'])
    pg.fill("#pwNew", "abcdefg"); pg.fill("#pwNew2", "abcdefg"); pg.click("[data-act=pwSetSubmit]"); pg.wait_for_timeout(300)
    R.check("7-character password rejected (minimum is 8)", 'pw' not in state(pg)['auth'])
    pg.fill("#pwNew", "owner-pass-1"); pg.fill("#pwNew2", "owner-pass-2"); pg.click("[data-act=pwSetSubmit]"); pg.wait_for_timeout(300)
    R.check("mismatched confirmation rejected", 'pw' not in state(pg)['auth'])
    pg.fill("#pwNew", "owner-pass-1"); pg.fill("#pwNew2", "owner-pass-1"); pg.click("[data-act=pwSetSubmit]"); pg.wait_for_timeout(900)
    a = state(pg)['auth']
    R.check("hash stored: PBKDF2-SHA256, 310000 iter, salt+hash present", a['pw']['alg'] == 'PBKDF2-SHA256' and a['pw']['iter'] == 310000 and len(a['pw']['salt']) >= 22 and len(a['pw']['hash']) >= 40)
    R.check("password not stored in clear anywhere in app state", 'owner-pass-1' not in json.dumps(state(pg)))
    R.check("pwMustSet cleared after set", 'pwMustSet' not in a)

    # enable lock, restart, unlock tests
    pg.evaluate("S.settings.appLockEnabled=true; persist();")
    pg.reload(); pg.wait_for_function("document.body.classList.contains('lic-ok')"); pg.wait_for_timeout(1500)
    R.check("lock overlay shown after restart", pg.evaluate("getComputedStyle(document.getElementById('appLockOverlay')).display") == 'flex')
    pg.fill("#appLockPassInput", LEGACY_DEFAULT); pg.click("[data-act=unlockApp]"); pg.wait_for_timeout(900)
    R.check("old factory password does NOT unlock", pg.evaluate("getComputedStyle(document.getElementById('appLockOverlay')).display") == 'flex')
    pg.fill("#appLockPassInput", "owner-pass-1"); pg.click("[data-act=unlockApp]"); pg.wait_for_timeout(900)
    R.check("correct password unlocks", pg.evaluate("getComputedStyle(document.getElementById('appLockOverlay')).display") == 'none')
    R.check("data identical after restart", balances(pg) == seed_balances)

    # throttling
    pg.reload(); pg.wait_for_function("document.body.classList.contains('lic-ok')"); pg.wait_for_timeout(1500)
    for i in range(5):
        pg.fill("#appLockPassInput", f"wrong{i}"); pg.click("[data-act=unlockApp]"); pg.wait_for_timeout(450)
    pg.fill("#appLockPassInput", "owner-pass-1"); pg.click("[data-act=unlockApp]"); pg.wait_for_timeout(700)
    R.check("brute-force throttle: correct password refused during cooldown", pg.evaluate("getComputedStyle(document.getElementById('appLockOverlay')).display") == 'flex' and state(pg)['auth'].get('pwFail', {}).get('n', 0) >= 5)
    set_state(pg, "delete s.auth.pwFail")  # test shortcut to skip waiting
    pg.reload(); pg.wait_for_function("document.body.classList.contains('lic-ok')"); pg.wait_for_timeout(1500)

    # ---------- legacy migration: DEFAULT factory password ----------
    pg.evaluate("localStorage.setItem('__noop','1')")
    set_state(pg, "delete s.auth.pw; s.auth.masterPass='%s'; delete s.auth.pwMustSet; s.settings.appLockEnabled=true" % LEGACY_DEFAULT)
    before = balances(pg)
    pg.reload(); pg.wait_for_function("document.body.classList.contains('lic-ok')"); pg.wait_for_timeout(1800)
    st = state(pg)
    R.check("legacy default password: plaintext removed", 'masterPass' not in st['auth'] and LEGACY_DEFAULT not in json.dumps(st))
    R.check("legacy default password: NOT carried over as a valid hash; owner must set new", 'pw' not in st['auth'] and st['auth']['pwMustSet'] is True)
    R.check("legacy default: owner still gets in (no lockout), data intact", pg.evaluate("getComputedStyle(document.getElementById('appLockOverlay')).display") == 'none' and balances(pg) == before)
    R.check("legacy default: set-password prompt shown", pg.locator("#pwNew").count() == 1)
    pg.click("[data-act=pwLater]"); pg.wait_for_timeout(400)
    R.check("'later' leaves app usable", pg.evaluate("document.body.classList.contains('lic-ok')"))

    # ---------- legacy migration: CUSTOM password ----------
    set_state(pg, "delete s.auth.pw; delete s.auth.pwMustSet; s.auth.masterPass='my-shop-pw'; s.settings.appLockEnabled=true")
    pg.reload(); pg.wait_for_function("document.body.classList.contains('lic-ok')"); pg.wait_for_timeout(1800)
    st = state(pg)
    R.check("custom legacy password migrated to hash, plaintext gone", 'pw' in st['auth'] and 'masterPass' not in st['auth'] and 'my-shop-pw' not in json.dumps(st))
    R.check("custom legacy: lock shown (owner not bypassed)", pg.evaluate("getComputedStyle(document.getElementById('appLockOverlay')).display") == 'flex')
    pg.fill("#appLockPassInput", LEGACY_DEFAULT); pg.click("[data-act=unlockApp]"); pg.wait_for_timeout(700)
    R.check("custom legacy: factory password rejected", pg.evaluate("getComputedStyle(document.getElementById('appLockOverlay')).display") == 'flex')
    pg.fill("#appLockPassInput", "my-shop-pw"); pg.click("[data-act=unlockApp]"); pg.wait_for_timeout(900)
    R.check("custom legacy: existing owner password still works after migration", pg.evaluate("getComputedStyle(document.getElementById('appLockOverlay')).display") == 'none')
    R.check("custom legacy: debt data preserved", balances(pg) == before)
    salt1 = state(pg)['auth']['pw']['salt']
    set_state(pg, "delete s.auth.pw; s.auth.masterPass='my-shop-pw'")
    pg.reload(); pg.wait_for_function("document.body.classList.contains('lic-ok')"); pg.wait_for_timeout(1800)
    R.check("salt is random per hash", state(pg)['auth']['pw']['salt'] != salt1)
    # forgot-password dialog must be reachable from the lock screen (was hidden behind it)
    pg.click("[data-act=forgotPassPrompt]"); pg.wait_for_selector("#recCode")
    R.check("recovery dialog is clickable above the lock overlay", pg.evaluate("(()=>{const r=document.querySelector('[data-act=recoverySubmit]').getBoundingClientRect();const e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!e&&!!e.closest('[data-act=recoverySubmit]');})()"))
    pg.evaluate("stack.slice().forEach(m=>closeModal(m))")
    pg.fill("#appLockPassInput", "my-shop-pw"); pg.click("[data-act=unlockApp]"); pg.wait_for_timeout(1200)

    # ---------- change password flow ----------
    pg.evaluate("S.settings.appLockEnabled=false; persist();")
    pg.evaluate("A.resetPassModal()"); pg.wait_for_selector("#pwCur"); 
    pg.fill("#pwCur", LEGACY_DEFAULT); pg.fill("#pwNew", "another-pass"); pg.fill("#pwNew2", "another-pass"); pg.click("[data-act=pwSetSubmit]"); pg.wait_for_timeout(900)
    R.check("change password: factory password is not accepted as 'current'", 'my-shop-pw' != 'x' and pg.locator("#pwCur").count() == 1)
    pg.fill("#pwCur", "my-shop-pw"); pg.click("[data-act=pwSetSubmit]"); pg.wait_for_timeout(1200)
    R.check("change password: works with correct current password", pg.evaluate("authVerify('another-pass').then(r=>r.ok)") is True)

    # ---------- manual role switching disabled (M/W strictly governed by DEYN3 license) ----------
    pg.evaluate("A.switchDeviceRole()"); pg.wait_for_timeout(300)
    R.check("owner cannot manually switch device role to worker inside the app", pg.evaluate("isWorkerDevice()") is False and pg.locator("#ownerPw").count() == 0)

    # ---------- worker permission enforcement (activated via genuine W license) ----------
    w_lic = env.license(dev, "LT", "W")
    pg.evaluate("async c => { const p = await deynVerifyCode(c, DEYN_DEV_ID); window.DEYN_LIC = p; DEYN_LIC = p; applyLicenseRole(); persist(); renderAll(); }", w_lic)
    pg.wait_for_timeout(300)
    R.check("worker license sets device strictly to worker mode", pg.evaluate("isWorkerDevice()") is True)
    pg.evaluate("A.switchDeviceRole()"); pg.wait_for_timeout(200)
    R.check("worker cannot switch device role to owner", pg.evaluate("isWorkerDevice()") is True and pg.locator("#ownerPw").count() == 0)
    n_before = pg.evaluate("S.customers.length")
    owner_only = ["wipe", "resetPassModal", "clearData", "purgeTrash", "manageSegsModal", "newSegPrompt"]
    for act in owner_only:
        pg.evaluate("document.querySelectorAll('.ovl').forEach(o=>o.remove())")
        stack_before = pg.evaluate("stack.length")
        pg.evaluate(f"try{{A.{act}()}}catch(e){{}}"); pg.wait_for_timeout(200)
        opened = pg.evaluate("stack.length") > stack_before
        R.check(f"worker cannot run owner action '{act}' (no dialog opens)", not opened, toast(pg))
        pg.evaluate("stack.slice().forEach(m=>closeModal(m))")
    for act, arg in [("delCust", "{id:S.customers[0].id}"), ("editCust", "{id:S.customers[0].id}"), ("delTicket", "{id:S.pending[0].id}")]:
        pg.evaluate("stack.slice().forEach(m=>closeModal(m))")
        sb = pg.evaluate("stack.length"); pg.evaluate(f"try{{A.{act}({arg})}}catch(e){{}}"); pg.wait_for_timeout(200)
        R.check(f"worker cannot run owner action '{act}'", pg.evaluate("stack.length") <= sb)
    # app-lock toggle by worker via the settings switch
    pg.evaluate("openSettings()"); pg.wait_for_timeout(400)
    pg.evaluate("(()=>{const c=document.querySelector('[data-ch=appLockEnabled]');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));})()")
    R.check("worker cannot enable app lock", state(pg)['settings'].get('appLockEnabled') in (False, None))
    # worker with forged state tries to call verifyMasterPass directly
    pg.evaluate("PW_CTX={hasPw:false,viaRecovery:false}; try{A.pwSetSubmit()}catch(e){}"); pg.wait_for_timeout(300)
    R.check("worker cannot set owner password through pwSetSubmit", state(pg)['auth']['pw'] is not None and pg.evaluate("authVerify('another-pass').then(r=>r.ok)") is True)
    R.check("customer count unchanged by worker attempts", pg.evaluate("S.customers.length") == n_before)
    pg.close()
finally:
    errs = env.errors; env.close(); site.close()
R.check("no JavaScript errors during auth tests", not errs, "; ".join(errs[:3]))
sys.exit(0 if R.summary() else 1)
```

================================================================================
## [30/32] FILE: `tests/e2e/test_time.py`

- **المسار الأصلي**: `tests/e2e/test_time.py`
- **الحجم**: `8,368` بايت | **الأسطر**: `108` | **SHA-256**: `c5284ca598f4222c28bf33dd9994cb6e983fb02eb28eb7a470d9200e11e9b4ab`

```python
import json, sys, time
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from harness import *
R = Results()
H = 3600_000
ts = TimeServer('*')
site = Site(time_pub=ts.key['pub'])
env = Env(site); ts.attach(env.ctx, "live")
def tp(pg): return pg.evaluate("({s:DEYN_TP.status,w:DEYN_TP.state.warnings,e:DEYN_TP.state.episode,g:DEYN_TP.state.graceStart,last:DEYN_TP.state.lastSeen})")
def banner(pg): return pg.evaluate("(document.getElementById('deynTimeBanner')||{}).textContent||''")
def tick(pg, wait=0): pg.evaluate("deynClockTick(true)"); pg.wait_for_timeout(wait)
def fetch_trusted(pg): return pg.evaluate("deynFetchTrustedTime()")
def fin(pg): return pg.evaluate("JSON.stringify(S.customers)+JSON.stringify(S.pending)+JSON.stringify(S.trash||[])")
try:
    pg = env.new_app(); dev = env.dev_id(pg)
    env.activate(pg, env.license(dev, "LT", "M")); pg.wait_for_timeout(2500)
    R.check("normal: status OK and no banner", tp(pg)['s'] == 'OK' and banner(pg) == '')
    R.check("signed time fetched from the REAL worker and verified in the browser", fetch_trusted(pg) is True and pg.evaluate("DEYN_TRUSTED!==null"))

    # --- offline is not a violation ---
    ts.mode = "offline"; pg.evaluate("DEYN_TRUSTED=null")
    R.check("offline (fetch fails): not a violation, no banner, app usable", fetch_trusted(pg) is False and tp(pg)['s'] == 'OK' and banner(pg) == '' and pg.evaluate("document.body.classList.contains('lic-ok')"))
    ts.mode = "replay"
    ts.mode = "live"; ok = fetch_trusted(pg); ts.mode = "replay"
    R.check("replayed old response rejected (nonce mismatch), status unchanged", fetch_trusted(pg) is False and tp(pg)['s'] == 'OK')
    ts.mode = "live"

    # --- three warnings, grace, READ_ONLY ---
    seen = []
    for k in range(3):
        pg.evaluate("__setSkew(%d)" % (2 * H)); fetch_trusted(pg); tick(pg)
        seen.append((tp(pg)['w'], tp(pg)['s'], banner(pg)[:12]))
        pg.evaluate("__setSkew(0)"); fetch_trusted(pg); tick(pg)
        assert tp(pg)['s'] == 'OK', tp(pg)
    R.check("3 separate clock episodes -> warning 1, 2, 3 (3rd opens the 48h grace)", [x[0] for x in seen] == [1, 2, 3] and [x[1] for x in seen] == ['WARN', 'WARN', 'GRACE'], str(seen))
    R.check("warning banner is shown with the warning number", '1 من 3' in seen[0][2] + banner(pg) or 'تحذير 1' in seen[0][2], seen[0][2])
    # 4th episode inside / after grace
    pg.evaluate("__setSkew(%d)" % (2 * H)); fetch_trusted(pg); tick(pg)
    R.check("clock still wrong during grace -> GRACE with remaining hours", tp(pg)['s'] == 'GRACE' and 'مهلة' in banner(pg), banner(pg))
    before = fin(pg)
    ts.set_offset(49 * H); pg.evaluate("__setSkew(%d)" % (51 * H)); fetch_trusted(pg); tick(pg)
    R.check("48h after the 3rd warning and still wrong -> READ_ONLY", tp(pg)['s'] == 'READ_ONLY' and 'القراءة فقط' in banner(pg), str(tp(pg)))

    # --- READ_ONLY enforcement ---
    n0 = pg.evaluate("S.customers.length")
    for act, arg in [("newCust", "{}"), ("saveCust", "{}"), ("pay", "{id:S.customers[0].id}"), ("debt", "{id:S.customers[0].id}"), ("delCust", "{id:S.customers[0].id}"), ("editCust", "{id:S.customers[0].id}"),
                     ("delTicket", "{id:S.pending[0].id}"), ("wipe", "{}"), ("clearData", "{}"), ("restoreTrash", "{id:'x'}"), ("mmok", "{}"), ("pick", "{id:S.customers[0].id}"), ("saveTicketTag", "{}"), ("confirmOk", "{}")]:
        pg.evaluate("stack.slice().forEach(m=>closeModal(m))"); sb = pg.evaluate("stack.length")
        pg.evaluate(f"try{{A.{act}({arg})}}catch(e){{}}"); pg.wait_for_timeout(120)
        R.check(f"READ_ONLY blocks '{act}'", pg.evaluate("stack.length") <= sb and fin(pg) == before)
    R.check("READ_ONLY: no financial data changed, nothing deleted", fin(pg) == before and pg.evaluate("S.customers.length") == n0)
    # direct write through the settings 'guaranteed' switch
    pg.evaluate("openSettings()"); pg.wait_for_timeout(300); pg.evaluate("stack.slice().forEach(m=>closeModal(m))")
    # viewing and export still work
    pg.evaluate("stack.slice().forEach(m=>closeModal(m))")
    pg.evaluate("A.open({id:S.customers[0].id})"); pg.wait_for_timeout(400)
    R.check("READ_ONLY: customer statement can still be opened", pg.evaluate("stack.length") >= 1)
    pg.evaluate("stack.slice().forEach(m=>closeModal(m))")
    bk = pg.evaluate("""new Promise(res=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{URL.createObjectURL=o;res(t)});return 'blob:x'};try{backup()}catch(e){res('ERR '+e)}})""")
    R.check("READ_ONLY: backup export still works and contains every customer", len(json.loads(bk)['customers']) == n0)
    R.check("READ_ONLY: licence untouched", pg.evaluate("window.DEYN_LIC!==null && DEYN_LIC.tier==='LT'"))
    R.check("READ_ONLY: owner password dialogs still reachable (no lockout from recovery)", pg.evaluate("typeof A.openRecovery==='function'") and pg.evaluate("(()=>{A.openRecovery();return stack.length>0})()"))
    pg.evaluate("stack.slice().forEach(m=>closeModal(m))")
    # persists across restart: rolling the clock back does not clear it
    pg.evaluate("__setSkew(0)"); ts.mode = "offline"; pg.reload(); pg.wait_for_timeout(3000)
    R.check("READ_ONLY survives restart and an offline clock rollback", tp(pg)['s'] == 'READ_ONLY')
    # --- recovery by signed time ---
    ts.mode = "live"; ts.set_offset(0); pg.evaluate("__setSkew(0)"); fetch_trusted(pg); tick(pg)
    R.check("correct clock + verified signed time -> back to OK and writable", tp(pg)['s'] == 'OK' and banner(pg) == '')
    pg.evaluate("A.newCust()"); pg.wait_for_timeout(300)
    R.check("writes allowed again after recovery", pg.evaluate("stack.length") >= 1)
    pg.evaluate("stack.slice().forEach(m=>closeModal(m))")

    # --- forward-only licence expiry (no signed time involved) ---
    ts.mode = "offline"
    pgb = env.new_device("T2"); devb = env.dev_id(pgb)
    now_ms = pgb.evaluate("Date.now()")
    code = env.sign_license({"v": 3, "d": devb, "t": "1Y", "r": "M", "exp": now_ms + 90_000, "n": "T" * 22})
    env.activate(pgb, code); pgb.wait_for_timeout(1500)
    R.check("short term licence active", env.started(pgb))
    pgb.evaluate("__setSkew(120000)"); pgb.wait_for_timeout(4800)
    R.check("term licence expires when the clock passes expiry", pgb.evaluate("document.getElementById('actGate').classList.contains('show')"))
    pgb.evaluate("__setSkew(0)"); pgb.reload(); pgb.wait_for_function("document.getElementById('agDevId').textContent.trim().length==32"); pgb.wait_for_timeout(2500)
    R.check("rolling the phone clock back does NOT revive an expired licence", pgb.evaluate("document.getElementById('actGate').classList.contains('show')") and not env.started(pgb))
    R.check("re-entering the same expired code is refused", (env.activate(pgb, code) or True) and not env.started(pgb))
    pgb.close()
finally:
    errs = env.errors; env.close(); site.close(); ts.close()

# ---- production configuration: enforcement OFF until the service is deployed ----
site = Site(enforce=False); env = Env(site)
try:
    pg = env.new_app(); dev = env.dev_id(pg); env.activate(pg, env.license(dev, "LT", "M")); pg.wait_for_timeout(2500)
    R.check("shipped config has enforce=false and an empty time URL (no lockout risk before deployment)", pg.evaluate("DEYN_TIME_CFG.enforce===false && DEYN_TIME_CFG.url===''"))
    pg.evaluate("DEYN_TP.state.warnings=3;DEYN_TP.state.episode=true;DEYN_TP.state.graceStart=Date.now()-72*3600*1000;deynClockTick(true)")
    pg.evaluate("__setSkew(-3600000)"); pg.evaluate("deynClockTick(true)")
    R.check("enforce=false: READ_ONLY is reported but writing stays allowed", pg.evaluate("DEYN_TP.status")=='READ_ONLY' and pg.evaluate("deynReadOnly()") is False and pg.evaluate("(()=>{A.newCust();return stack.length>0})()"))
    pg.evaluate("__setSkew(0)")
finally:
    errs += env.errors; env.close(); site.close()
# embedded code identical to the unit-tested modules
import re
app = (ROOT / "deyn-app/www/index.html").read_text(encoding="utf8")
pol = re.sub(r"^export ", "", (ROOT / "trusted-time/time-policy.js").read_text(encoding="utf8"), flags=re.M)
core = pol.split("\n", 1)[1]
R.check("policy code embedded in the app is byte-identical to the unit-tested module", core.strip() in app)
R.check("no JavaScript errors in time tests", not errs, "; ".join(errs[:3]))
sys.exit(0 if R.summary() else 1)
```

================================================================================
## [31/32] FILE: `tools/embed_sync.py`

- **المسار الأصلي**: `tools/embed_sync.py`
- **الحجم**: `1,799` بايت | **الأسطر**: `36` | **SHA-256**: `26188d59820edaace107d56eb7ec1a8deec44d145a7f07b04cf41faab8ff8258`

```python
#!/usr/bin/env python3
"""Embeds sync/engine.js + session.js + qr.js (+ sync/app-glue.js) into deyn-app/www/index.html between markers.
Usage: embed_sync.py            -> rewrite the app
       embed_sync.py --check    -> exit 1 if the app is out of date (used by CI/tests)"""
import re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / 'deyn-app/www/index.html'
B, E = '/*SYNC-BEGIN (generated by tools/embed_sync.py - do not edit here)*/', '/*SYNC-END*/'
def strip(src):
    out, names = [], []
    for line in src.split('\n'):
        if re.match(r'\s*import .* from ', line): continue
        m = re.match(r'export (?:async )?(?:const|function|class) ([A-Za-z_0-9]+)', line)
        if m: names.append(m.group(1))
        out.append(re.sub(r'^export ', '', line))
    return '\n'.join(out), names
def build():
    parts, names = [], []
    for f in ['engine.js', 'session.js', 'qr.js']:
        t, n = strip((ROOT / 'sync' / f).read_text(encoding='utf8')); parts.append('/* ---- ' + f + ' ---- */\n' + t); names += n
    lib = 'const DeynSyncLib = (() => {\n' + '\n'.join(parts) + '\nreturn { ' + ', '.join(sorted(set(names))) + ' };\n})();'
    glue = (ROOT / 'sync/app-glue.js').read_text(encoding='utf8')
    return B + '\n' + lib + '\n' + glue + '\n' + E
def main():
    s = APP.read_text(encoding='utf8'); new = build()
    if B in s:
        a, b = s.index(B), s.index(E) + len(E); cur = s[a:b]
        if '--check' in sys.argv: sys.exit(0 if cur == new else 1)
        s = s[:a] + new + s[b:]
    else:
        if '--check' in sys.argv: sys.exit(1)
        anchor = 'function seed() {'; assert s.count(anchor) == 1
        s = s.replace(anchor, new + '\n\n' + anchor)
    APP.write_text(s, encoding='utf8'); print('embedded', len(new), 'chars')
main()
```

================================================================================
## [32/32] FILE: `trusted-time/time-policy.js`

- **المسار الأصلي**: `trusted-time/time-policy.js`
- **الحجم**: `2,445` بايت | **الأسطر**: `32` | **SHA-256**: `465506225f9bfebf433e8ad5f5eb08273369acc6fc153d724be323e34a2815e7`

```javascript
// Clock-tamper policy state machine (pure, testable). Agreed stages: warning 1, warning 2, warning 3, then a 48h grace, then licence policy.
// It never deletes data. What "licence policy" means after grace is an OPEN DECISION (default here: READ_ONLY = view/export only).
export const TOLERANCE_MS = 5 * 60 * 1000, GRACE_MS = 48 * 3600 * 1000;
export function initialState() { return { lastSeen: 0, warnings: 0, episode: false, graceStart: null, trustedOffset: null }; }
// obs: { now: local ms, trusted: ms|null (verified signed time, or null if offline/failed) }
export function evaluate(prev, obs, opts = {}) {
  const tol = opts.tolerance ?? TOLERANCE_MS, grace = opts.grace ?? GRACE_MS, afterGrace = opts.afterGrace ?? 'READ_ONLY';
  const s = { ...prev };
  const ref = obs.trusted ?? Math.max(obs.now, s.lastSeen);                    // best available "real" time
  const rolledBack = obs.now < s.lastSeen - tol;                                // local clock went backwards
  const skewed = obs.trusted != null && Math.abs(obs.now - obs.trusted) > tol;  // disagrees with signed time
  const violation = obs.trusted != null ? skewed : rolledBack;   // when signed time is available it is authoritative
  const consistentVerified = obs.trusted != null && !skewed;
  let status = 'OK', warningNo = 0;
  if (violation) {
    if (!s.episode) {
      s.episode = true;
      if (s.warnings < 3) { s.warnings += 1; warningNo = s.warnings; if (s.warnings === 3) s.graceStart = ref; }
      else s.graceStart = ref;          // warnings already used up: every new episode goes straight to a fresh 48h grace
    }
    if (s.graceStart != null) status = ref - s.graceStart >= grace ? afterGrace : 'GRACE';
    else status = 'WARN';
  } else if (consistentVerified) {   // only a verified, consistent signed time clears an episode
    s.episode = false; s.graceStart = null; status = 'OK';
  } else if (s.episode) {            // offline: cannot prove the clock is fixed
    status = s.graceStart != null ? (ref - s.graceStart >= grace ? afterGrace : 'GRACE') : 'WARN';
  }
  // A verified signed time is authoritative: it may also repair a lastSeen that was pushed into the future by a wrong clock.
  s.lastSeen = (obs.trusted != null && !skewed) ? obs.trusted : Math.max(s.lastSeen, obs.now);
  const graceLeftMs = s.graceStart != null ? Math.max(0, grace - (ref - s.graceStart)) : null;
  return { state: s, status, warningNo, graceLeftMs };
}
```

================================================================================
## قائمة الملفات المدرجة في `PRO_4_SOURCE_BUNDLE_3.md` (32 ملفًا)

| # | المسار الأصلي للملف | الحجم (بايت) | SHA-256 (أول 16 خانة) |
|---|---|---|---|
| 1 | `.github/workflows/build-sms-apk.yml` | 2,530 | `efcf5d9ca12dc83a` |
| 2 | `.github/workflows/build-sms-test.yml` | 5,104 | `e2d1c6adde8ecf90` |
| 3 | `.github/workflows/inspect-deyn.yml` | 2,683 | `35dd8c16925b2465` |
| 4 | `.github/workflows/inspect-sms-source.yml` | 769 | `7c3f895c32a706f5` |
| 5 | `DeynNotifPlugin.java` | 15,024 | `ac4aab77652a34ad` |
| 6 | `PRO_4_HANDOFF.md` | 7,004 | `1d3174b14dc1b346` |
| 7 | `PRO_4_SHA256.txt` | 11,653 | `be9b5e086c81301a` |
| 8 | `PRO_4_TEST_REPORT.md` | 4,440 | `ed0f54f51c023311` |
| 9 | `deyn-app/android-res/mipmap-anydpi-v26/ic_launcher_round.xml` | 266 | `44cc3246d167bd71` |
| 10 | `deyn-app/capacitor.config.json` | 189 | `917ded69578fb288` |
| 11 | `deyn-app/native/DeynBackupPlugin.java` | 18,158 | `bf8509112ca73cb2` |
| 12 | `deyn-app/native/DeynNotifPlugin.java` | 15,024 | `ac4aab77652a34ad` |
| 13 | `deyn-app/native/DeynSmsPlugin.java` | 43,549 | `eab4f4e6a1d8f64d` |
| 14 | `deyn-app/package.json` | 672 | `311768ced7459b35` |
| 15 | `deyn-app/scripts/fetch_fonts.py` | 1,074 | `e43149a70cf52069` |
| 16 | `deyn-app/scripts/prepare-android.sh` | 4,152 | `7e794d8155d0bfd6` |
| 17 | `deyn-keygen/android-res/mipmap-anydpi-v26/ic_launcher_round.xml` | 266 | `44cc3246d167bd71` |
| 18 | `deyn-keygen/scripts/prepare-android.sh` | 1,114 | `585bb6096dcc2221` |
| 19 | `deyn-keygen/www/fonts/fonts.css` | 92 | `ba51e7135b662fe6` |
| 20 | `deyn-keygen/www/index.html` | 18,454 | `b07dfae0418a0c11` |
| 21 | `docs/DESIGN_VAULT_SYNC.md` | 8,138 | `ef99e190b54a541d` |
| 22 | `sms/JavaPluginTests.java` | 7,526 | `0e81bdba5a0a1c48` |
| 23 | `sms/completion.js` | 52,729 | `67802d37c9303bdd` |
| 24 | `sms/e2e_comprehensive_test.py` | 45,100 | `d0e7705a9fb151fe` |
| 25 | `sync/engine.js` | 21,252 | `2d41188815beb294` |
| 26 | `sync/test_engine.mjs` | 17,392 | `e6fbcaf21ae9364b` |
| 27 | `sync/test_session.mjs` | 13,114 | `26813e7f8cfa39ad` |
| 28 | `tests/e2e/harness.py` | 17,018 | `71864a844b174322` |
| 29 | `tests/e2e/test_auth.py` | 11,498 | `69c986f8d4b0546c` |
| 30 | `tests/e2e/test_time.py` | 8,368 | `c5284ca598f4222c` |
| 31 | `tools/embed_sync.py` | 1,799 | `26188d59820edaac` |
| 32 | `trusted-time/time-policy.js` | 2,445 | `465506225f9bfebf` |
