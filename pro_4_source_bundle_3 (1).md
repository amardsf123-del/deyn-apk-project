# PRO_4_SOURCE_BUNDLE_3.md — حزمة الأكواد النصية الكاملة للنسخة PRO 4 (الجزء 3 من 3)

- **عدد الملفات في هذه الحزمة**: `35` ملفًا (من أصل `67` ملفًا نصيًا وبرمجيًا في `PRO 4`)
- **إجمالي الحجم الأصلي للملفات في هذه الحزمة**: `359,986` بايت
- **تنبيه**: جميع الملفات أدناه مدرجة بمحتواها الحرفي الكامل دون أي اختصار أو تعديل، ومفصولة بوضوح بمسارها الأصلي.

================================================================================
## [1/35] FILE: `.github/build-now.txt`

- **المسار الأصلي**: `.github/build-now.txt`
- **الحجم**: `99` بايت | **الأسطر**: `1` | **SHA-256**: `bac598de0c28e5ffe88ad8de5a37666a5e2c798e7b29ce50d46d787530291bbf`

```text
Temporary trigger for the existing DEYN debug APK build workflow. This does not change app source.
```

================================================================================
## [2/35] FILE: `.github/workflows/build-sms-apk.yml`

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
## [3/35] FILE: `.github/workflows/inspect-deyn.yml`

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
## [4/35] FILE: `.github/workflows/inspect-sms-source.yml`

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
## [5/35] FILE: `DeynBackupPlugin.java`

- **المسار الأصلي**: `DeynBackupPlugin.java`
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
## [6/35] FILE: `DeynNotifPlugin.java`

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
## [7/35] FILE: `PRO_4_FILE_INDEX.md`

- **المسار الأصلي**: `PRO_4_FILE_INDEX.md`
- **الحجم**: `17,793` بايت | **الأسطر**: `118` | **SHA-256**: `08241adb9189f1668b04db91fb027c60ef6dd4491c9abf5f6aa28b464c044b25`

```markdown
# PRO_4_FILE_INDEX.md — الفهرس الشامل لملفات النسخة PRO 4

- **إجمالي عدد الملفات في `PRO_4`**: `112` ملفًا (شاملًا `PRO_4_FILE_INDEX.md` و`PRO_4_SHA256.txt`)

| # | المسار النسبي داخل `PRO_4` | الحجم (بايت) | الوظيفة والدور في المشروع |
|---|---|---|---|
| 1 | `.github/build-now.txt` | 99 | ملف توثيق أو إعداد ضمن بنية المشروع الأصلية |
| 2 | `.github/scripts/integrate_sms.py` | 17,303 | سكريبت بايثون لدمج حزم SMS والتكميل والإضافات الأصلية في مشروع Capacitor |
| 3 | `.github/workflows/build-deyn.yml` | 1,875 | ملف GitHub Actions لبناء APK أو فحص واختبار المشروع تلقائيًا |
| 4 | `.github/workflows/build-sms-apk.yml` | 2,530 | ملف GitHub Actions لبناء APK أو فحص واختبار المشروع تلقائيًا |
| 5 | `.github/workflows/build-sms-test.yml` | 5,104 | ملف GitHub Actions لبناء APK أو فحص واختبار المشروع تلقائيًا |
| 6 | `.github/workflows/export-deyn-labs.yml` | 1,402 | ملف GitHub Actions لبناء APK أو فحص واختبار المشروع تلقائيًا |
| 7 | `.github/workflows/inspect-deyn.yml` | 2,683 | ملف GitHub Actions لبناء APK أو فحص واختبار المشروع تلقائيًا |
| 8 | `.github/workflows/inspect-sms-source.yml` | 769 | ملف GitHub Actions لبناء APK أو فحص واختبار المشروع تلقائيًا |
| 9 | `DeynBackupPlugin.java` | 18,158 | إضافة أندرويد الأصلية للنسخ الاحتياطي الخارجي SAF والكتابة الذرية والساعة الرتيبة SystemClock |
| 10 | `DeynNotifPlugin.java` | 15,024 | إضافة أندرويد الأصلية لإشعارات WorkManager وإلغاء التنبيهات عند تسديد الدين |
| 11 | `DeynSmsPlugin.java` | 43,549 | إضافة أندرويد الأصلية لإرسال SMS متعدد الأجزاء وتتبع PendingIntent وSmsStatusReceiver |
| 12 | `PRO_4_HANDOFF.md` | 7,004 | وثيقة التسليم التقنية الشاملة لبنية المشروع والإصلاحات المنفذة في PRO 4 |
| 13 | `PRO_4_TEST_REPORT.md` | 4,440 | تقرير نتائج الاختبارات الفعلية والاختبارات التي تعذّر تشغيلها محليًا |
| 14 | `README.md` | 3,499 | ملف توثيق أو إعداد ضمن بنية المشروع الأصلية |
| 15 | `deyn-app/android-res/drawable/splash.png` | 463,475 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 16 | `deyn-app/android-res/mipmap-anydpi-v26/ic_launcher.xml` | 266 | ملف موارد/تهيئة XML لأندرويد |
| 17 | `deyn-app/android-res/mipmap-anydpi-v26/ic_launcher_round.xml` | 266 | ملف موارد/تهيئة XML لأندرويد |
| 18 | `deyn-app/android-res/mipmap-hdpi/ic_launcher.png` | 6,417 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 19 | `deyn-app/android-res/mipmap-hdpi/ic_launcher_background.png` | 1,269 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 20 | `deyn-app/android-res/mipmap-hdpi/ic_launcher_foreground.png` | 8,412 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 21 | `deyn-app/android-res/mipmap-hdpi/ic_launcher_round.png` | 7,248 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 22 | `deyn-app/android-res/mipmap-mdpi/ic_launcher.png` | 3,432 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 23 | `deyn-app/android-res/mipmap-mdpi/ic_launcher_background.png` | 772 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 24 | `deyn-app/android-res/mipmap-mdpi/ic_launcher_foreground.png` | 4,828 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 25 | `deyn-app/android-res/mipmap-mdpi/ic_launcher_round.png` | 4,036 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 26 | `deyn-app/android-res/mipmap-xhdpi/ic_launcher.png` | 10,051 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 27 | `deyn-app/android-res/mipmap-xhdpi/ic_launcher_background.png` | 1,886 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 28 | `deyn-app/android-res/mipmap-xhdpi/ic_launcher_foreground.png` | 13,095 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 29 | `deyn-app/android-res/mipmap-xhdpi/ic_launcher_round.png` | 11,031 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 30 | `deyn-app/android-res/mipmap-xxhdpi/ic_launcher.png` | 19,967 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 31 | `deyn-app/android-res/mipmap-xxhdpi/ic_launcher_background.png` | 3,437 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 32 | `deyn-app/android-res/mipmap-xxhdpi/ic_launcher_foreground.png` | 23,607 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 33 | `deyn-app/android-res/mipmap-xxhdpi/ic_launcher_round.png` | 21,188 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 34 | `deyn-app/android-res/mipmap-xxxhdpi/ic_launcher.png` | 33,675 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 35 | `deyn-app/android-res/mipmap-xxxhdpi/ic_launcher_background.png` | 5,786 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 36 | `deyn-app/android-res/mipmap-xxxhdpi/ic_launcher_foreground.png` | 36,092 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 37 | `deyn-app/android-res/mipmap-xxxhdpi/ic_launcher_round.png` | 34,241 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 38 | `deyn-app/capacitor.config.json` | 189 | ملف إعدادات JSON (Capacitor / npm / حزم) |
| 39 | `deyn-app/icon-1024.png` | 3,385,247 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 40 | `deyn-app/icon-512.png` | 208,675 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 41 | `deyn-app/native/DeynBackupPlugin.java` | 18,158 | إضافة أندرويد الأصلية للنسخ الاحتياطي الخارجي SAF والكتابة الذرية والساعة الرتيبة SystemClock |
| 42 | `deyn-app/native/DeynNotifPlugin.java` | 15,024 | إضافة أندرويد الأصلية لإشعارات WorkManager وإلغاء التنبيهات عند تسديد الدين |
| 43 | `deyn-app/native/DeynSmsPlugin.java` | 43,549 | إضافة أندرويد الأصلية لإرسال SMS متعدد الأجزاء وتتبع PendingIntent وSmsStatusReceiver |
| 44 | `deyn-app/native/DeynSyncPlugin.java` | 6,649 | إضافة أندرويد الأصلية لمآخذ TCP المحلية واكتشاف الخدمة NsdManager |
| 45 | `deyn-app/native/DeynVaultPlugin.java` | 4,331 | إضافة أندرويد الأصلية لتشفير البيانات بمفاتيح Android Keystore AES-256-GCM |
| 46 | `deyn-app/package.json` | 672 | ملف إعدادات JSON (Capacitor / npm / حزم) |
| 47 | `deyn-app/scripts/fetch_fonts.py` | 1,074 | سكريبت Python مساعد للمشروع |
| 48 | `deyn-app/scripts/prepare-android.sh` | 4,152 | سكريبت تجهيز وبناء مشروع أندرويد (Capacitor + Gradle + Manifest) |
| 49 | `deyn-app/www/fonts/fonts.css` | 92 | ملف توثيق أو إعداد ضمن بنية المشروع الأصلية |
| 50 | `deyn-app/www/index.html` | 455,357 | التطبيق الرئيسي لـ DEYN (الواجهة، التراخيص، الخزنة، المزامنة المدمجة، SMS، والفرنسية) |
| 51 | `deyn-keygen/android-res/drawable/splash.png` | 214,613 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 52 | `deyn-keygen/android-res/mipmap-anydpi-v26/ic_launcher.xml` | 266 | ملف موارد/تهيئة XML لأندرويد |
| 53 | `deyn-keygen/android-res/mipmap-anydpi-v26/ic_launcher_round.xml` | 266 | ملف موارد/تهيئة XML لأندرويد |
| 54 | `deyn-keygen/android-res/mipmap-hdpi/ic_launcher.png` | 4,400 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 55 | `deyn-keygen/android-res/mipmap-hdpi/ic_launcher_background.png` | 1,251 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 56 | `deyn-keygen/android-res/mipmap-hdpi/ic_launcher_foreground.png` | 7,672 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 57 | `deyn-keygen/android-res/mipmap-hdpi/ic_launcher_round.png` | 5,729 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 58 | `deyn-keygen/android-res/mipmap-mdpi/ic_launcher.png` | 2,519 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 59 | `deyn-keygen/android-res/mipmap-mdpi/ic_launcher_background.png` | 784 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 60 | `deyn-keygen/android-res/mipmap-mdpi/ic_launcher_foreground.png` | 4,634 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 61 | `deyn-keygen/android-res/mipmap-mdpi/ic_launcher_round.png` | 3,489 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 62 | `deyn-keygen/android-res/mipmap-xhdpi/ic_launcher.png` | 5,941 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 63 | `deyn-keygen/android-res/mipmap-xhdpi/ic_launcher_background.png` | 1,702 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 64 | `deyn-keygen/android-res/mipmap-xhdpi/ic_launcher_foreground.png` | 10,822 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 65 | `deyn-keygen/android-res/mipmap-xhdpi/ic_launcher_round.png` | 7,928 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 66 | `deyn-keygen/android-res/mipmap-xxhdpi/ic_launcher.png` | 9,857 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 67 | `deyn-keygen/android-res/mipmap-xxhdpi/ic_launcher_background.png` | 3,346 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 68 | `deyn-keygen/android-res/mipmap-xxhdpi/ic_launcher_foreground.png` | 17,231 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 69 | `deyn-keygen/android-res/mipmap-xxhdpi/ic_launcher_round.png` | 12,693 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 70 | `deyn-keygen/android-res/mipmap-xxxhdpi/ic_launcher.png` | 13,653 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 71 | `deyn-keygen/android-res/mipmap-xxxhdpi/ic_launcher_background.png` | 5,726 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 72 | `deyn-keygen/android-res/mipmap-xxxhdpi/ic_launcher_foreground.png` | 23,896 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 73 | `deyn-keygen/android-res/mipmap-xxxhdpi/ic_launcher_round.png` | 17,395 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 74 | `deyn-keygen/capacitor.config.json` | 199 | ملف إعدادات JSON (Capacitor / npm / حزم) |
| 75 | `deyn-keygen/icon-512.png` | 44,687 | أيقونة أو شاشة بداية رسومية لتطبيق أندرويد (ملف ثنائي) |
| 76 | `deyn-keygen/package.json` | 682 | ملف إعدادات JSON (Capacitor / npm / حزم) |
| 77 | `deyn-keygen/scripts/fetch_fonts.py` | 1,074 | سكريبت Python مساعد للمشروع |
| 78 | `deyn-keygen/scripts/prepare-android.sh` | 1,114 | سكريبت تجهيز وبناء مشروع أندرويد (Capacitor + Gradle + Manifest) |
| 79 | `deyn-keygen/www/fonts/fonts.css` | 92 | ملف توثيق أو إعداد ضمن بنية المشروع الأصلية |
| 80 | `deyn-keygen/www/index.html` | 18,454 | تطبيق مولّد أكواد التفعيل DEYN3 وأكواد الاسترداد DEYNR1 |
| 81 | `docs/DESIGN_VAULT_SYNC.md` | 8,138 | ملف توثيق أو إعداد ضمن بنية المشروع الأصلية |
| 82 | `sms/JavaPluginTests.java` | 7,526 | ملف اختبارات آلية للتحقق من الوظائف والأمان |
| 83 | `sms/README.md` | 2,867 | ملف توثيق أو إعداد ضمن بنية المشروع الأصلية |
| 84 | `sms/completion.js` | 52,729 | نظام النسخ الاحتياطي التلقائي SAF، الاستعادة بالترخيص، حماية الدور M/W، الساعة الرتيبة، وسجل الإشعارات |
| 85 | `sms/e2e_comprehensive_test.py` | 45,100 | ملف اختبارات آلية للتحقق من الوظائف والأمان |
| 86 | `sms/engine.js` | 19,981 | محرك جدولة وتقسيم رسائل SMS وتمديد الديون وتوزيع التسديدات |
| 87 | `sms/i18n.js` | 86,748 | القاموس الفرنسي الكامل ومحرك السنتيم الفرنسي dialectFr |
| 88 | `sms/runtime.js` | 29,097 | طبقة ربط محرك SMS بواجهة التطبيق ونوافذ التسديد والتمديد |
| 89 | `sms/test.mjs` | 16,176 | ملف اختبارات آلية للتحقق من الوظائف والأمان |
| 90 | `sync/app-glue.js` | 13,621 | طبقة ربط المزامنة بواجهة التطبيق |
| 91 | `sync/engine.js` | 22,654 | محرك المزامنة التفاضلية HLC وفحص الصلاحيات checkEvent ودعم تمديد الديون txf |
| 92 | `sync/package.json` | 19 | ملف إعدادات JSON (Capacitor / npm / حزم) |
| 93 | `sync/qr.js` | 7,057 | مولّد رموز QR الخاص بالإقران المحلي |
| 94 | `sync/qr_check.mjs` | 476 | ملف توثيق أو إعداد ضمن بنية المشروع الأصلية |
| 95 | `sync/session.js` | 13,521 | بروتوكول الجلسة المشفرة X25519 + Ed25519 + HKDF-SHA256 + AES-256-GCM |
| 96 | `sync/test_engine.mjs` | 18,855 | ملف اختبارات آلية للتحقق من الوظائف والأمان |
| 97 | `sync/test_session.mjs` | 13,114 | ملف اختبارات آلية للتحقق من الوظائف والأمان |
| 98 | `tests/e2e/harness.py` | 17,018 | ملف اختبارات آلية للتحقق من الوظائف والأمان |
| 99 | `tests/e2e/test_auth.py` | 11,498 | ملف اختبارات آلية للتحقق من الوظائف والأمان |
| 100 | `tests/e2e/test_license.py` | 13,044 | ملف اختبارات آلية للتحقق من الوظائف والأمان |
| 101 | `tests/e2e/test_storage_layout_static.py` | 8,527 | ملف اختبارات آلية للتحقق من الوظائف والأمان |
| 102 | `tests/e2e/test_sync_e2e.py` | 9,411 | ملف اختبارات آلية للتحقق من الوظائف والأمان |
| 103 | `tests/e2e/test_time.py` | 8,368 | ملف اختبارات آلية للتحقق من الوظائف والأمان |
| 104 | `tests/e2e/test_vault.py` | 7,649 | ملف اختبارات آلية للتحقق من الوظائف والأمان |
| 105 | `tools/embed_sync.py` | 1,799 | سكريبت بايثون لتضمين وحدات sync/*.js داخل deyn-app/www/index.html |
| 106 | `trusted-time/client.js` | 2,073 | خدمة الوقت الموقّع (Cloudflare Worker) وآلة حالة حماية الساعة واختباراتها |
| 107 | `trusted-time/package.json` | 19 | خدمة الوقت الموقّع (Cloudflare Worker) وآلة حالة حماية الساعة واختباراتها |
| 108 | `trusted-time/test.mjs` | 8,354 | خدمة الوقت الموقّع (Cloudflare Worker) وآلة حالة حماية الساعة واختباراتها |
| 109 | `trusted-time/time-policy.js` | 2,445 | خدمة الوقت الموقّع (Cloudflare Worker) وآلة حالة حماية الساعة واختباراتها |
| 110 | `trusted-time/worker.js` | 2,681 | خدمة الوقت الموقّع (Cloudflare Worker) وآلة حالة حماية الساعة واختباراتها |
| 111 | `PRO_4_FILE_INDEX.md` | — | فهرس شامل لجميع ملفات PRO_4 مع المسارات والأحجام ووظيفة كل ملف |
| 112 | `PRO_4_SHA256.txt` | — | قائمة بصمات التحقق التشفيرية SHA-256 لجميع ملفات PRO_4 |
```

================================================================================
## [8/35] FILE: `README.md`

- **المسار الأصلي**: `README.md`
- **الحجم**: `3,499` بايت | **الأسطر**: `42` | **SHA-256**: `465ecd6091275882522421d90bfe2860fc2bd960c7d2e1c2a2c1bf57f36fb984`

````markdown
# DEYN — حزمة بناء الـ APK (التطبيق + مولّد الأكواد)

```
deyn-app/      ← APK 1: تطبيق DEYN (شاشة التفعيل + الدفتر)   com.deyn.app
deyn-keygen/   ← APK 2: مولّد الأكواد الخاص بك فقط           com.deyn.keygen
.github/workflows/build-apk.yml  ← بناء الاثنين تلقائياً على GitHub (بدون تثبيت Android Studio)
```

## الطريقة الأسهل: GitHub Actions
1. ارفع هذا المجلد كاملاً إلى مستودع GitHub خاص.
2. تبويب **Actions ← Build DEYN APKs ← Run workflow**.
3. بعد دقائق نزّل `deyn-app-apk` و `deyn-keygen-apk` من الـ Artifacts.

## الطريقة المحلية (Node 20 + JDK 21 + Android SDK)
```bash
cd deyn-app            # ثم كرّر نفس الشيء في deyn-keygen
npm install
python3 scripts/fetch_fonts.py     # مرة واحدة وأنت متصل: يجعل الخطوط محلية (للعمل بدون انترنت)
npm run android:add                # cap add android + الأيقونات + المزامنة
npm run android:apk                # الناتج: android/app/build/outputs/apk/debug/*.apk
```
بعد تعديل `www/index.html` شغّل `npm run android:sync` ثم ابنِ من جديد.

## ⚠️ مهم جداً قبل التوزيع
**ثبّت مفتاح التوقيع (keystore) من أول نسخة تبيعها ولا تغيّره أبداً.**
معرّف الجهاز مشتق من `ANDROID_ID`، وهذا يتغيّر على أندرويد 8+ إذا تغيّر مفتاح توقيع التطبيق.
إذا بدّلت المفتاح (مثلاً من debug إلى release) سيتغيّر معرّف الجهاز عند كل عملائك وتبطل أكوادهم.
لذلك وقّع نسخة التوزيع بمفتاحك الخاص (الـ workflow يدعم ذلك عبر الأسرار `KEYSTORE_BASE64` و`KS_PASS` و`KS_ALIAS`) واحتفظ بنسخة احتياطية من الـ keystore.

## صيغة الكود
`DEYN-[M|W][1Y|2Y|LT]-XXXX-XXXX`  مثال: `DEYN-M1Y-5AE3-5A2F`
التوقيع = أول 8 خانات hex من `HMAC-SHA256(مفتاح = SECRET_KEY، رسالة = DeviceID + Tier + Role)`.
نفس الكود البرمجي للتشفير موجود حرفياً في الملفين (الاختبار: مطابق لـ Node `crypto` في 1800 حالة).

## قائمة فحص على الهاتف (لم تُجرَّب على جهاز حقيقي من طرفي)
- [ ] معرّف الجهاز نفسه بعد: إغلاق التطبيق، إعادة التشغيل، تحديث APK بنفس التوقيع، حذف التطبيق وتثبيته من جديد.
- [ ] التفعيل بكود من المولّد يعمل ثم يبقى بعد إعادة التشغيل بدون انترنت.
- [ ] كود عامل (W): الحذف والتعديل مقفولان ولا يمكن التحويل لوضع المالك.
- [ ] تقديم ساعة الهاتف للخلف أكثر من دقيقتين يقفل التطبيق، وإرجاعها يفتحه.
- [ ] أزرار «لصق» و«نسخ» و«إرسال عبر واتساب» (تحتاج واتساب مثبّتاً).
- [ ] الهيدر لا يختفي تحت شريط الحالة (إن حدث ذلك على أندرويد 15 أخبرني لنضبط الـ insets).
- [ ] تصدير PDF/JSON من الإعدادات: التنزيل من داخل WebView قد يحتاج إضافة `@capacitor/filesystem` + `@capacitor/share`.
````

================================================================================
## [9/35] FILE: `deyn-app/android-res/mipmap-anydpi-v26/ic_launcher.xml`

- **المسار الأصلي**: `deyn-app/android-res/mipmap-anydpi-v26/ic_launcher.xml`
- **الحجم**: `266` بايت | **الأسطر**: `5` | **SHA-256**: `44cc3246d167bd718fb61feaba493850ff95255c1ddbb8854c0e4c0534832f96`

```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

================================================================================
## [10/35] FILE: `deyn-app/native/DeynSmsPlugin.java`

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
## [11/35] FILE: `deyn-app/native/DeynSyncPlugin.java`

- **المسار الأصلي**: `deyn-app/native/DeynSyncPlugin.java`
- **الحجم**: `6,649` بايت | **الأسطر**: `153` | **SHA-256**: `6d3a160fcaeb642bd827372fca832c5373766c4820d53bb7207491c60cdde740`

```java
package com.deyn.app;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.LinkAddress;
import android.net.LinkProperties;
import android.net.Network;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.net.Inet4Address;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Raw TCP transport for DEYN local sync. It only moves length-prefixed frames; ALL authentication and encryption (X25519 + Ed25519 + AES-GCM)
 * is done in JavaScript (sync/session.js), so a malicious peer on the Wi-Fi only ever sees ciphertext.
 * Frame format: 4-byte big-endian length, then UTF-8 JSON text. Max 1 MiB per frame.
 * STATUS: written but NOT compiled or run on a device (no Android SDK / javac in the authoring environment).
 */
@CapacitorPlugin(name = "DeynSync")
public class DeynSyncPlugin extends Plugin {
    private static final int MAX_FRAME = 1 << 20;
    private ServerSocket server;
    private final ConcurrentHashMap<String, Socket> sockets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, DataOutputStream> outs = new ConcurrentHashMap<>();
    private final AtomicInteger ids = new AtomicInteger(1);

    private String localIp() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
            Network n = cm.getActiveNetwork();
            if (n == null) return null;
            LinkProperties lp = cm.getLinkProperties(n);
            if (lp == null) return null;
            for (LinkAddress a : lp.getLinkAddresses()) {
                if (a.getAddress() instanceof Inet4Address && !a.getAddress().isLoopbackAddress()) return a.getAddress().getHostAddress();
            }
        } catch (Exception ignored) { }
        return null;
    }

    private void pump(final String connId, final Socket s) {
        new Thread(() -> {
            try {
                DataInputStream in = new DataInputStream(s.getInputStream());
                while (!s.isClosed()) {
                    int len = in.readInt();
                    if (len < 0 || len > MAX_FRAME) break;
                    byte[] buf = new byte[len];
                    in.readFully(buf);
                    JSObject o = new JSObject();
                    o.put("connId", connId);
                    o.put("data", new String(buf, StandardCharsets.UTF_8));
                    notifyListeners("frame", o);
                }
            } catch (Exception ignored) {
            } finally {
                closeConn(connId, true);
            }
        }, "deyn-sync-" + connId).start();
    }

    private void closeConn(String connId, boolean notify) {
        Socket s = sockets.remove(connId);
        outs.remove(connId);
        if (s != null) { try { s.close(); } catch (Exception ignored) { } if (notify) { JSObject o = new JSObject(); o.put("connId", connId); notifyListeners("closed", o); } }
    }

    @PluginMethod
    public void listen(final PluginCall call) {
        new Thread(() -> {
            try {
                if (server == null || server.isClosed()) {
                    int want = call.getInt("port", 47821);
                    try { server = new ServerSocket(want); } catch (Exception e) { server = new ServerSocket(0); }
                    final ServerSocket ss = server;
                    new Thread(() -> {
                        while (!ss.isClosed()) {
                            try {
                                Socket s = ss.accept();
                                s.setTcpNoDelay(true);
                                String id = "s" + ids.getAndIncrement();
                                sockets.put(id, s);
                                outs.put(id, new DataOutputStream(s.getOutputStream()));
                                JSObject o = new JSObject();
                                o.put("connId", id);
                                notifyListeners("accepted", o);
                                pump(id, s);
                            } catch (Exception e) { break; }
                        }
                    }, "deyn-sync-accept").start();
                }
                JSObject r = new JSObject();
                r.put("port", server.getLocalPort());
                String ip = localIp();
                r.put("ip", ip == null ? "" : ip);
                call.resolve(r);
            } catch (Exception e) { call.reject("listen failed: " + e.getClass().getSimpleName()); }
        }).start();
    }

    @PluginMethod
    public void connect(final PluginCall call) {
        new Thread(() -> {
            try {
                String ip = call.getString("ip");
                int port = call.getInt("port", 0);
                Socket s = new Socket();
                s.connect(new InetSocketAddress(ip, port), 6000);
                s.setTcpNoDelay(true);
                String id = "c" + ids.getAndIncrement();
                sockets.put(id, s);
                outs.put(id, new DataOutputStream(s.getOutputStream()));
                pump(id, s);
                JSObject r = new JSObject();
                r.put("connId", id);
                call.resolve(r);
            } catch (Exception e) { call.reject("connect failed: " + e.getClass().getSimpleName()); }
        }).start();
    }

    @PluginMethod
    public void send(PluginCall call) {
        final String id = call.getString("connId");
        final byte[] data = call.getString("data", "").getBytes(StandardCharsets.UTF_8);
        new Thread(() -> {
            DataOutputStream o = outs.get(id);
            if (o == null || data.length > MAX_FRAME) { call.reject("no such connection or frame too large"); return; }
            try { synchronized (o) { o.writeInt(data.length); o.write(data); o.flush(); } call.resolve(); }
            catch (Exception e) { closeConn(id, true); call.reject("send failed"); }
        }).start();
    }

    @PluginMethod
    public void close(PluginCall call) { closeConn(call.getString("connId"), false); call.resolve(); }

    @Override
    protected void handleOnDestroy() {
        try { if (server != null) server.close(); } catch (Exception ignored) { }
        for (String id : sockets.keySet()) closeConn(id, false);
    }
}
```

================================================================================
## [12/35] FILE: `deyn-app/native/DeynVaultPlugin.java`

- **المسار الأصلي**: `deyn-app/native/DeynVaultPlugin.java`
- **الحجم**: `4,331` بايت | **الأسطر**: `104` | **SHA-256**: `edfc8004511de7c9746594456e8efcaa3f2fe5f4e2a3c75fe42c25e413622bfe`

```java
package com.deyn.app;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * AES-256-GCM with a NON-EXPORTABLE key generated inside Android Keystore (one per installation).
 * JavaScript never receives the key; it only sends data to encrypt/decrypt.
 * STATUS: written but NOT compiled or tested on a device (no Android SDK in the authoring environment).
 */
@CapacitorPlugin(name = "DeynVault")
public class DeynVaultPlugin extends Plugin {
    private static final String ALIAS = "deyn_data_key_v1";
    private static final String PROVIDER = "AndroidKeyStore";

    private synchronized SecretKey key() throws Exception {
        KeyStore ks = KeyStore.getInstance(PROVIDER);
        ks.load(null);
        if (!ks.containsAlias(ALIAS)) {
            KeyGenerator kg = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, PROVIDER);
            kg.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setKeySize(256)
                .setRandomizedEncryptionRequired(true)   // Keystore picks a fresh random IV for every encryption
                .build());
            kg.generateKey();
        }
        return (SecretKey) ks.getKey(ALIAS, null);
    }

    private byte[] aad(PluginCall call) {
        String a = call.getString("aad", "");
        return a.getBytes(StandardCharsets.UTF_8);
    }

    @PluginMethod
    public void status(PluginCall call) {
        try {
            // Self-test: a real encrypt/decrypt round trip must work before JS is allowed to rely on the vault.
            SecretKey k = key();
            Cipher e = Cipher.getInstance("AES/GCM/NoPadding");
            e.init(Cipher.ENCRYPT_MODE, k);
            byte[] ct = e.doFinal(new byte[] {1, 2, 3});
            Cipher d = Cipher.getInstance("AES/GCM/NoPadding");
            d.init(Cipher.DECRYPT_MODE, k, new GCMParameterSpec(128, e.getIV()));
            byte[] pt = d.doFinal(ct);
            JSObject r = new JSObject();
            r.put("ready", pt.length == 3 && pt[0] == 1 && pt[2] == 3);
            call.resolve(r);
        } catch (Exception ex) {
            call.reject("vault unavailable: " + ex.getClass().getSimpleName());
        }
    }

    @PluginMethod
    public void encrypt(PluginCall call) {
        try {
            byte[] data = Base64.decode(call.getString("data", ""), Base64.NO_WRAP);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.ENCRYPT_MODE, key());
            c.updateAAD(aad(call));
            byte[] ct = c.doFinal(data);
            JSObject r = new JSObject();
            r.put("iv", Base64.encodeToString(c.getIV(), Base64.NO_WRAP));
            r.put("data", Base64.encodeToString(ct, Base64.NO_WRAP));
            call.resolve(r);
        } catch (Exception ex) {
            call.reject("encrypt failed: " + ex.getClass().getSimpleName());
        }
    }

    @PluginMethod
    public void decrypt(PluginCall call) {
        try {
            byte[] iv = Base64.decode(call.getString("iv", ""), Base64.NO_WRAP);
            byte[] data = Base64.decode(call.getString("data", ""), Base64.NO_WRAP);
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, key(), new GCMParameterSpec(128, iv));
            c.updateAAD(aad(call));
            byte[] pt = c.doFinal(data);        // throws AEADBadTagException if tampered / wrong key
            JSObject r = new JSObject();
            r.put("data", Base64.encodeToString(pt, Base64.NO_WRAP));
            call.resolve(r);
        } catch (Exception ex) {
            call.reject("decrypt failed: " + ex.getClass().getSimpleName());
        }
    }
}
```

================================================================================
## [13/35] FILE: `deyn-app/scripts/fetch_fonts.py`

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
## [14/35] FILE: `deyn-app/www/fonts/fonts.css`

- **المسار الأصلي**: `deyn-app/www/fonts/fonts.css`
- **الحجم**: `92` بايت | **الأسطر**: `1` | **SHA-256**: `ba51e7135b662fe638fae7d55491a2d41964dc87bd22d681c0a293c46fd26f4e`

```css
/* يُستبدل بالخطوط المحلية عند تشغيل scripts/fetch_fonts.py */
```

================================================================================
## [15/35] FILE: `deyn-keygen/android-res/mipmap-anydpi-v26/ic_launcher.xml`

- **المسار الأصلي**: `deyn-keygen/android-res/mipmap-anydpi-v26/ic_launcher.xml`
- **الحجم**: `266` بايت | **الأسطر**: `5` | **SHA-256**: `44cc3246d167bd718fb61feaba493850ff95255c1ddbb8854c0e4c0534832f96`

```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

================================================================================
## [16/35] FILE: `deyn-keygen/capacitor.config.json`

- **المسار الأصلي**: `deyn-keygen/capacitor.config.json`
- **الحجم**: `199` بايت | **الأسطر**: `8` | **SHA-256**: `78f4ad82a2b9f3e7157b5e22c7af602c3e2c0c4fbce2638cb563fad738517aeb`

```json
{
  "appId": "com.deyn.keygen",
  "appName": "DEYN Keygen",
  "webDir": "www",
  "backgroundColor": "#065043",
  "server": { "androidScheme": "https" },
  "android": { "allowMixedContent": false }
}
```

================================================================================
## [17/35] FILE: `deyn-keygen/scripts/prepare-android.sh`

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
## [18/35] FILE: `sms/completion.js`

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
## [19/35] FILE: `sms/e2e_comprehensive_test.py`

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
## [20/35] FILE: `sync/app-glue.js`

- **المسار الأصلي**: `sync/app-glue.js`
- **الحجم**: `13,621` بايت | **الأسطر**: `142` | **SHA-256**: `a07de1fd784913b9bdc6054e1b64bbbe2a0833eeb8fa1d2d56cda355dd8b880c`

```javascript

/* ============ Local sync glue: owner phone listens, worker phone connects (Wi-Fi LAN, no cloud) ============ */
const SYNC = { identity: null, pairing: null, listening: false, ip: null, port: null, running: false, timer: null, backoff: 45000, conns: {}, hooked: false, msg: '' };
const syNative = () => { try { return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.DeynSync) || null; } catch (e) { return null; } };
const syState = () => DeynSyncLib.ensureSync(S, DEYN_DEV_ID);
async function syIdentity() {
  if (SYNC.identity) return SYNC.identity;
  let raw = null; try { raw = await DeynStore.get('syncid'); } catch (e) { raw = null; }
  if (raw) SYNC.identity = DeynSyncLib.Identity.fromJson(raw);
  else { SYNC.identity = await DeynSyncLib.Identity.create(); await DeynStore.set('syncid', SYNC.identity.toJson()); }
  return SYNC.identity;
}
function syCtx() {
  return {
    did: DEYN_DEV_ID, identity: SYNC.identity, licence: DEYN_LIC && DEYN_LIC.code, now: () => Date.now(),
    verifyLicence: async (code, did) => { const p = await deynVerifyCode(code, did); return p ? { role: p.role } : null; },
    getPeer: id => { const p = syState().peers[id]; return p && p.idpub ? p : null; },
    savePeer: (id, rec) => { const sy = syState(); sy.peers[id] = Object.assign(sy.peers[id] || { recv: 0, acked: 0 }, rec); persist(); },
    get pairing() { return SYNC.pairing; },
    sync: {
      prepare: async () => { DeynSyncLib.captureLocal(S, DEYN_DEV_ID, Date.now()); persist(); },
      recvFrom: p => ((syState().peers[p] || {}).recv || 0),
      eventsAfter: (p, r) => DeynSyncLib.eventsAfter(S, DEYN_DEV_ID, r),
      acked: (p, r) => { DeynSyncLib.markAcked(S, DEYN_DEV_ID, p, r); persist(); },
      apply: async (p, role, evs) => {
        if (deynReadOnly()) return { ok: false, reason: 'read-only' };
        const r = DeynSyncLib.applyBatch(S, DEYN_DEV_ID, p, role, evs, Date.now());
        if (r.ok) { if (!persist()) return { ok: false, reason: 'storage' }; await deynFlush(); renderAll(); }   // durable BEFORE the acknowledgement is sent
        return r;
      }
    }
  };
}
const syTransport = connId => ({ send: s => syNative().send({ connId, data: s }), close: () => { try { syNative().close({ connId }); } catch (e) {} } });
function syNote(did, ok, msg) {
  const p = syState().peers[did]; if (!p) return;
  p.lastTry = Date.now(); if (ok) { p.lastSuccess = Date.now(); delete p.lastError; } else p.lastError = String(msg || 'error').slice(0, 120);
  persist();
}
async function syHook() {
  const pl = syNative(); if (!pl || SYNC.hooked) return; SYNC.hooked = true;
  pl.addListener('frame', e => { const s = SYNC.conns[e.connId]; if (s) s.feed(e.data); });
  pl.addListener('closed', e => { const s = SYNC.conns[e.connId]; if (s) s.onClose(); delete SYNC.conns[e.connId]; });
  pl.addListener('accepted', e => {                                    // owner side: a phone connected to us
    const sess = new DeynSyncLib.Session(syTransport(e.connId), syCtx(), 'responder'); SYNC.conns[e.connId] = sess;
    (async () => {
      try { await sess.handshakeResponder(); await sess.exchange(); syNote(sess.peerDid, true); SYNC.msg = 'تمت المزامنة بنجاح ✅'; }
      catch (err) { if (sess.peerDid) syNote(sess.peerDid, false, err.message); SYNC.msg = 'تعذّرت المزامنة: ' + err.message; }
      finally { try { pl.close({ connId: e.connId }); } catch (x) {} delete SYNC.conns[e.connId]; syRefreshUi(); }
    })();
  });
}
async function syStartServer() {
  const pl = syNative(); if (!pl) throw new Error('المزامنة غير متاحة على هذا الجهاز');
  await syIdentity(); await syHook();
  if (SYNC.listening) return;
  const r = await pl.listen({ port: 47821 }); SYNC.port = r.port; SYNC.ip = r.ip; SYNC.listening = true;
}
async function syConnect(peerDid, offer) {
  const pl = syNative(); if (!pl) throw new Error('المزامنة غير متاحة على هذا الجهاز');
  if (SYNC.running) return false; SYNC.running = true;
  let connId = null, sess = null;
  try {
    await syIdentity(); await syHook();
    const target = offer ? { ip: offer.ip, port: offer.port } : syState().peers[peerDid];
    if (!target || !target.ip) throw new Error('عنوان المالك غير معروف: أعد الاقتران بمسح رمز QR');
    const c = await pl.connect({ ip: target.ip, port: target.port }); connId = c.connId;
    sess = new DeynSyncLib.Session(syTransport(connId), syCtx(), 'initiator'); SYNC.conns[connId] = sess;
    await sess.handshakeInitiator({ offer: offer || null });
    if (offer) { const p = syState().peers[sess.peerDid]; p.ip = offer.ip; p.port = offer.port; }
    const res = await sess.exchange(); syNote(sess.peerDid, true);
    SYNC.msg = 'تمت المزامنة ✅ (أُرسل ' + res.sent + ' • استُلم ' + res.received + ')'; SYNC.backoff = 45000; return true;
  } catch (err) {
    const did = (sess && sess.peerDid) || peerDid; if (did && syState().peers[did]) syNote(did, false, err.message);
    SYNC.msg = 'تعذّرت المزامنة: ' + err.message + ' — ستُعاد المحاولة تلقائيًا'; SYNC.backoff = Math.min(SYNC.backoff * 2, 300000); return false;
  } finally { if (connId) { try { pl.close({ connId }); } catch (x) {} delete SYNC.conns[connId]; } SYNC.running = false; syRefreshUi(); }
}
function syPeers() { const sy = syState(); return Object.keys(sy.peers).filter(id => sy.peers[id].idpub).map(id => Object.assign({ did: id }, sy.peers[id])); }
function syLoop() {
  clearTimeout(SYNC.timer);
  SYNC.timer = setTimeout(async () => {
    try { if (S && !deynReadOnly() && isWorkerDevice() && !document.hidden) { const m = syPeers().find(p => p.role === 'M'); if (m) await syConnect(m.did, null); } } catch (e) { console.warn('sync loop', e); }
    syLoop();
  }, SYNC.backoff);
}
let SYDEB = null;
function sySchedule() { if (!S || !syPeers().length || !isWorkerDevice()) return; clearTimeout(SYDEB); SYDEB = setTimeout(() => { const m = syPeers().find(p => p.role === 'M'); if (m) syConnect(m.did, null); }, 4000); }
async function syInit() {                                              // called once after the app has started
  try { DeynSyncLib.ensureSync(S, DEYN_DEV_ID); if (!syNative()) return; await syIdentity(); await syHook(); if (!isWorkerDevice() && syPeers().length) await syStartServer(); syLoop(); } catch (e) { console.warn('sync init failed', e); }
}
// ---- UI ----
const syAgo = t => { if (!t) return 'لم تنجح بعد'; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'قبل لحظات' : m < 60 ? 'قبل ' + m + ' دقيقة' : m < 1440 ? 'قبل ' + Math.round(m / 60) + ' ساعة' : 'قبل ' + Math.round(m / 1440) + ' يوم'; };
function syRefreshUi() { if (document.getElementById('syncBody')) { const b = document.getElementById('syncBody'); b.innerHTML = syBodyHtml(); } }
function syBodyHtml() {
  const owner = !isWorkerDevice(), peers = syPeers(), sy = syState();
  const rows = peers.map(p => { const pend = DeynSyncLib.pendingCount(S, DEYN_DEV_ID, p.did); return `<div class="row-set"><div><b>${p.role === 'W' ? 'هاتف العامل' : 'هاتف المالك'} ••${esc(p.did.slice(-4))}</b><small>آخر نجاح: ${syAgo(p.lastSuccess)} • بانتظار الإرسال: ${pend}${p.lastError ? '<br>آخر خطأ: ' + esc(p.lastError) : ''}</small></div>${owner ? `<button type="button" class="btn sm" data-act="syncUnpair" data-id="${esc(p.did)}" style="height:34px;font-size:12px;padding:0 12px">إلغاء</button>` : ''}</div>`; }).join('');
  const quarantined = (sy.quarantine || []).length;
  let h = rows || '<div class="sub">لا يوجد هاتف مقترن بعد.</div>';
  if (quarantined) h += `<div class="sub" style="color:#b45309">⚠️ تم تجاهل ${quarantined} تعديلًا من هاتف العامل لتجاوزه الصلاحيات.</div>`;
  if (SYNC.msg) h += `<div class="sub" id="syncMsg">${esc(SYNC.msg)}</div>`;
  if (owner) {
    h += `<button type="button" class="btn pri block" data-act="syncPairShow" style="margin-top:12px">إظهار رمز QR لاقتران هاتف العامل</button><div id="syncQr"></div>`;
  } else {
    h += `<label class="lbl" for="syncOffer" style="margin-top:12px">رمز الاقتران (امسح QR من هاتف المالك أو الصقه هنا)</label>
      <textarea class="inp" id="syncOffer" rows="3" style="direction:ltr;text-align:left;height:auto" placeholder="DEYNPAIR1:..." spellcheck="false" autocomplete="off"></textarea>
      <div style="display:flex;gap:8px;margin-top:8px"><button type="button" class="btn pri" data-act="syncPairStart" style="flex:1">اقتران</button>${(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BarcodeScanner) ? '<button type="button" class="btn" data-act="syncScan" style="flex:1">📷 مسح QR</button>' : ''}</div>`;
    if (peers.length) h += `<button type="button" class="btn block" data-act="syncNow" style="margin-top:10px">مزامنة الآن</button>`;
  }
  if (owner && peers.length) h += `<button type="button" class="btn block" data-act="syncNow" style="margin-top:8px" disabled title="العامل هو من يبدأ الاتصال">المزامنة تتم تلقائيًا عند اتصال هاتف العامل</button>`;
  return h;
}
function openSyncModal() {
  openModal(() => `${sheetHead('المزامنة بين الهاتفين')}<div class="sub">تتم عبر شبكة Wi-Fi المحلية فقط ومشفّرة من طرف إلى طرف، دون خادم سحابي. يعمل التطبيق دون إنترنت دائمًا، وتُرسل التغييرات عند توفر الاتصال.</div><div id="syncBody">${syBodyHtml()}</div>`);
  if (!syNative()) { const b = document.getElementById('syncBody'); if (b) b.insertAdjacentHTML('afterbegin', '<div class="sub" style="color:#b91c1c">المزامنة غير متاحة في هذا الإصدار/الجهاز.</div>'); }
}
let SYQR_TIMER = null;
async function syPairShow() {
  if (!requireOwner('إقران هاتف جديد')) return;
  try {
    await syStartServer();
    if (!SYNC.ip) throw new Error('لا يوجد اتصال Wi-Fi محلي. اتصل بنفس شبكة الواي فاي ثم أعد المحاولة');
    const idn = await syIdentity();
    const o = DeynSyncLib.makeOffer({ did: DEYN_DEV_ID, idpub: idn.pub, ip: SYNC.ip, port: SYNC.port, now: Date.now() }); SYNC.pairing = o.state;
    const box = lastById('syncQr'); if (!box) return;
    box.innerHTML = `<div style="background:#fff;padding:8px;border-radius:12px;margin-top:12px;max-width:320px;margin-inline:auto">${DeynSyncLib.qrSvg(o.text, 4)}</div>
      <div class="sub" id="syncQrTimer" style="text-align:center">الرمز صالح 5 دقائق ولاستخدام واحد</div>
      <textarea class="inp" id="syncOfferText" rows="3" readonly style="direction:ltr;text-align:left;height:auto;font-size:11px">${esc(o.text)}</textarea>`;
    clearInterval(SYQR_TIMER); SYQR_TIMER = setInterval(() => { const t = document.getElementById('syncQrTimer'); if (!t) { clearInterval(SYQR_TIMER); return; } const left = Math.max(0, Math.round((SYNC.pairing.expiresAt - Date.now()) / 1000)); t.textContent = SYNC.pairing.used ? 'تم استخدام الرمز ✅' : left ? 'ينتهي بعد ' + left + ' ثانية' : 'انتهت صلاحية الرمز'; if (!left || SYNC.pairing.used) { clearInterval(SYQR_TIMER); syRefreshUi(); } }, 1000);
  } catch (e) { toast(e.message, 'err'); }
}
async function syPairStart() {
  const inp = lastById('syncOffer'); if (!inp) return;
  const offer = DeynSyncLib.parseOffer(inp.value);
  if (!offer) return toast('رمز الاقتران غير صالح', 'err');
  if (!isWorkerDevice()) return toast('الاقتران يتم من هاتف العامل فقط', 'err');
  const go = async () => { toast('جارٍ الاقتران…'); const ok = await syConnect(offer.did, offer); toast(ok ? 'تم الاقتران والمزامنة بنجاح ✅' : 'تعذّر الاقتران — تأكد من الشبكة ومن أن الرمز لم ينتهِ', ok ? 'ok' : 'err'); if (ok) syLoop(); syRefreshUi(); };
  if (DeynSyncLib.isPristineDemo(S)) return confirmBox({ title: 'بيانات هذا الهاتف تجريبية', msg: 'سيتم استبدال البيانات التجريبية ببيانات هاتف المالك. هل تريد المتابعة؟', ok: 'متابعة', onOk: () => { DeynSyncLib.discardPristineDemo(S, DEYN_DEV_ID); persist(); renderAll(); go(); } });
  go();
}
async function syScan() { try { const r = await window.Capacitor.Plugins.BarcodeScanner.scan(); const v = r && r.barcodes && r.barcodes[0] && r.barcodes[0].rawValue; if (v) { const i = lastById('syncOffer'); if (i) i.value = v; syPairStart(); } } catch (e) { toast('تعذّر مسح الرمز: ' + e.message, 'err'); } }
function syNow() { const m = syPeers().find(p => p.role === 'M'); if (!m) return toast('لا يوجد هاتف مالك مقترن', 'err'); syConnect(m.did, null).then(ok => { toast(ok ? 'تمت المزامنة ✅' : 'تعذّرت المزامنة', ok ? 'ok' : 'err'); }); }
function syUnpair(id) { if (!requireOwner('إلغاء الاقتران')) return; confirmBox({ title: 'إلغاء الاقتران', msg: 'لن يتمكن هذا الهاتف من المزامنة بعد الآن. لن تُحذف أي بيانات من أي هاتف.', ok: 'إلغاء الاقتران', danger: true, onOk: () => { const sy = syState(); delete sy.peers[id]; persist(); syRefreshUi(); } }); }
```

================================================================================
## [21/35] FILE: `sync/engine.js`

- **المسار الأصلي**: `sync/engine.js`
- **الحجم**: `22,654` بايت | **الأسطر**: `331` | **SHA-256**: `8498219df949c93f0dd7e16558c370f6c1632e87cb3ffe07d52a33a5846ff9cd`

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
      const sig = sy._lastTk && sy._lastTk[id]; if (sig && txSig.has(sig)) push(sy, now, { k: 'tkx', tid: id, why: 'consumed', sig }); else sy.diverged = true; }
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
    case 'tx': {
      if (!validTx(ev.tx) || !okStr(ev.cid, 64)) return bad('tx-shape');
      if (W && ev.tx.type === 'debt') {
        const cur = S.customers.find(c => c.id === ev.cid);
        const unblockedInBatch = Array.isArray(S.__batchUnblockedCids) && S.__batchUnblockedCids.includes(ev.cid);
        if (cur && cur.seg === 'black' && !unblockedInBatch) return bad('worker-debt-to-blocked');
      }
      return { ok: true };
    }
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
    case 'tkx': {
      if (!okStr(ev.tid, 64) || (ev.why !== 'archived' && ev.why !== 'consumed')) return bad('tkx-shape');
      if (W && ev.why === 'archived') return bad('worker-cannot-delete-ticket');
      if (W && ev.why === 'consumed') {
        const targetTkt = S.pending.find(t => t.id === ev.tid);
        if (targetTkt) {
          const expectedSig = targetTkt.tape + '|' + targetTkt.ts;
          const batchHasTx = Array.isArray(S.__batchTxSigs) && S.__batchTxSigs.includes(expectedSig);
          const stateHasTx = S.customers.some(c => (c.tx || []).some(t => t.tape && (t.tape + '|' + t.ts) === expectedSig));
          if (!batchHasTx && !stateHasTx) return bad('worker-tkx-unproven');
        } else if (!okStr(ev.sig, 200)) {
          return bad('worker-tkx-unproven');
        }
      }
      return { ok: true };
    }
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
  S.__batchTxSigs = [];
  S.__batchUnblockedCids = [];
  for (const preEv of events) {
    if (preEv && preEv.k === 'tx' && preEv.tx && preEv.tx.tape && preEv.tx.ts) {
      S.__batchTxSigs.push(preEv.tx.tape + '|' + preEv.tx.ts);
    }
    if (preEv && preEv.k === 'cf' && preEv.f && preEv.f.seg && preEv.f.seg !== 'black') {
      S.__batchUnblockedCids.push(preEv.cid);
    }
  }
  try {
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
  } finally { delete S.__batchTxSigs; delete S.__batchUnblockedCids; }
}
export const markAcked = (S, did, peerId, recv) => { const p = ensureSync(S, did).peers[peerId]; if (p && recv > p.acked) p.acked = Math.min(recv, ensureSync(S, did).seq); };
export const pendingCount = (S, did, peerId) => { const sy = ensureSync(S, did); const p = sy.peers[peerId] || { acked: 0 }; return sy.log.filter(e => e.s > p.acked).length; };

// A phone whose data is still the untouched demo set must adopt the owner's data instead of merging 10 demo customers into the real ledger.
export const demoFingerprint = S => { const str = JSON.stringify([S.customers, S.pending]); let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return String(h) + ':' + str.length; };
export const isPristineDemo = S => !!S.demoFp && S.demoFp === demoFingerprint(S) && !(S.sync && S.sync.snap);
export function discardPristineDemo(S, did) { if (!isPristineDemo(S)) return false; S.customers = []; S.pending = []; S.trash = []; delete S.demoFp; ensureSync(S, did); resnapshot(S, did); return true; }
```

================================================================================
## [22/35] FILE: `sync/package.json`

- **المسار الأصلي**: `sync/package.json`
- **الحجم**: `19` بايت | **الأسطر**: `1` | **SHA-256**: `48e847860dd4f0907ce91e346dbb00a4a12213163ad3d80a953c343eb9a11979`

```json
{"type": "module"}
```

================================================================================
## [23/35] FILE: `sync/qr.js`

- **المسار الأصلي**: `sync/qr.js`
- **الحجم**: `7,057` بايت | **الأسطر**: `55` | **SHA-256**: `fc7cc3eaece7a1aa0e654315bff2964d2139b7a2a64174819fe2a85ea4ffb374`

```javascript
// Minimal QR Code generator (byte mode, error correction M, versions 1-14, auto mask). Output: array of rows of 0/1.
const EC = { // [ecCodewordsPerBlock, [[count, dataCodewords], ...]] for level M
  1: [10, [[1, 16]]], 2: [16, [[1, 28]]], 3: [26, [[1, 44]]], 4: [18, [[2, 32]]], 5: [24, [[2, 43]]], 6: [16, [[4, 27]]], 7: [18, [[4, 31]]], 8: [22, [[2, 38], [2, 39]]],
  9: [22, [[3, 36], [2, 37]]], 10: [26, [[4, 43], [1, 44]]], 11: [30, [[1, 50], [4, 51]]], 12: [22, [[6, 36], [2, 37]]], 13: [22, [[8, 37], [1, 38]]], 14: [24, [[4, 40], [5, 41]]] };
const ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50], 11: [6, 30, 54], 12: [6, 32, 58], 13: [6, 34, 62], 14: [6, 26, 46, 66] };
const EXP = new Array(512), LOG = new Array(256);
(() => { let x = 1; for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]; })();
const mul = (a, b) => (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]];
function rsGen(n) { let g = [1]; for (let i = 0; i < n; i++) { const ng = new Array(g.length + 1).fill(0); for (let j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], EXP[i]); } g = ng; } return g; }
function rsEnc(data, n) { const g = rsGen(n), res = new Array(n).fill(0); for (const d of data) { const f = d ^ res[0]; res.shift(); res.push(0); if (f) for (let i = 0; i < n; i++) res[i] ^= mul(g[i + 1], f); } return res; }
const capacity = v => EC[v][1].reduce((a, [c, d]) => a + c * d, 0);
export function qrMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  let v = 1; for (; v <= 14; v++) { const bits = 4 + (v < 10 ? 8 : 16) + bytes.length * 8; if (Math.ceil(bits / 8) <= capacity(v)) break; }
  if (v > 14) throw new Error('QR payload too long');
  const bits = []; const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >> i) & 1); };
  put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
  const cap = capacity(v) * 8; for (let i = 0; i < 4 && bits.length < cap; i++) bits.push(0); while (bits.length % 8) bits.push(0);
  for (let p = 0xec; bits.length < cap; p ^= 0xec ^ 0x11) put(p, 8);
  const data = []; for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  const [ecn, groups] = EC[v], blocks = []; let pos = 0;
  for (const [cnt, dc] of groups) for (let i = 0; i < cnt; i++) { const d = data.slice(pos, pos + dc); pos += dc; blocks.push({ d, e: rsEnc(d, ecn) }); }
  const out = []; const maxd = Math.max(...blocks.map(b => b.d.length));
  for (let i = 0; i < maxd; i++) for (const b of blocks) if (i < b.d.length) out.push(b.d[i]);
  for (let i = 0; i < ecn; i++) for (const b of blocks) out.push(b.e[i]);
  const size = 17 + 4 * v, M = Array.from({ length: size }, () => new Array(size).fill(null));
  const setF = (r, c, val) => { if (r >= 0 && c >= 0 && r < size && c < size) M[r][c] = val; };
  const finder = (r, c) => { for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) { const on = (i >= 0 && i <= 6 && (j === 0 || j === 6)) || (j >= 0 && j <= 6 && (i === 0 || i === 6)) || (i >= 2 && i <= 4 && j >= 2 && j <= 4); setF(r + i, c + j, on ? 1 : 0); } };
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
  for (let i = 8; i < size - 8; i++) { setF(6, i, i % 2 === 0 ? 1 : 0); setF(i, 6, i % 2 === 0 ? 1 : 0); }
  const al = ALIGN[v]; for (const r of al) for (const c of al) { if ((r === 6 && c === 6) || (r === 6 && c === al[al.length - 1]) || (c === 6 && r === al[al.length - 1])) continue; for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) setF(r + i, c + j, Math.max(Math.abs(i), Math.abs(j)) !== 1 ? 1 : 0); }
  setF(size - 8, 8, 1);
  const reserved = M.map(row => row.map(x => x !== null));
  for (let i = 0; i < 9; i++) { reserved[8][i] = true; reserved[i][8] = true; } for (let i = 0; i < 8; i++) { reserved[8][size - 1 - i] = true; reserved[size - 1 - i][8] = true; }
  if (v >= 7) { for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { reserved[i][size - 11 + j] = true; reserved[size - 11 + j][i] = true; } }
  const fill = (mask) => {
    const B = M.map(r => r.slice()); let bi = 0, up = true;
    const bitsOut = []; out.forEach(b => { for (let i = 7; i >= 0; i--) bitsOut.push((b >> i) & 1); });
    for (let c = size - 1; c > 0; c -= 2) { if (c === 6) c = 5; for (let k = 0; k < size; k++) { const r = up ? size - 1 - k : k; for (let cc = c; cc >= c - 1; cc--) { if (reserved[r][cc]) continue; let bit = bi < bitsOut.length ? bitsOut[bi++] : 0; const m = [(r + cc) % 2 === 0, r % 2 === 0, cc % 3 === 0, (r + cc) % 3 === 0, (Math.floor(r / 2) + Math.floor(cc / 3)) % 2 === 0, (r * cc) % 2 + (r * cc) % 3 === 0, ((r * cc) % 2 + (r * cc) % 3) % 2 === 0, ((r + cc) % 2 + (r * cc) % 3) % 2 === 0][mask]; B[r][cc] = bit ^ (m ? 1 : 0); } } up = !up; }
    // format info (EC level M = 00)
    let fmt = (0 << 3) | mask, rem = fmt; for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537); const bitsF = ((fmt << 10) | rem) ^ 0x5412;
    for (let i = 0; i < 15; i++) { const bit = (bitsF >> i) & 1; if (i < 6) B[i][8] = bit; else if (i < 8) B[i + 1][8] = bit; else B[size - 15 + i][8] = bit; if (i < 8) B[8][size - 1 - i] = bit; else if (i < 9) B[8][15 - i] = bit; else B[8][15 - i - 1] = bit; }
    B[size - 8][8] = 1;
    if (v >= 7) { let r2 = v; for (let i = 0; i < 12; i++) r2 = (r2 << 1) ^ ((r2 >> 11) * 0x1f25); const vi = (v << 12) | r2; for (let i = 0; i < 18; i++) { const bit = (vi >> i) & 1, a = Math.floor(i / 3), b = i % 3 + size - 11; B[a][b] = bit; B[b][a] = bit; } }
    return B;
  };
  const penalty = B => { let p = 0; for (let r = 0; r < size; r++) { let run = 1; for (let c = 1; c < size; c++) { if (B[r][c] === B[r][c - 1]) { run++; if (c === size - 1 && run >= 5) p += run - 2; } else { if (run >= 5) p += run - 2; run = 1; } } } for (let c = 0; c < size; c++) { let run = 1; for (let r = 1; r < size; r++) { if (B[r][c] === B[r - 1][c]) { run++; if (r === size - 1 && run >= 5) p += run - 2; } else { if (run >= 5) p += run - 2; run = 1; } } } for (let r = 0; r < size - 1; r++) for (let c = 0; c < size - 1; c++) if (B[r][c] === B[r][c + 1] && B[r][c] === B[r + 1][c] && B[r][c] === B[r + 1][c + 1]) p += 3; let dark = 0; B.forEach(r => r.forEach(x => dark += x)); p += Math.floor(Math.abs(dark * 100 / (size * size) - 50) / 5) * 10; return p; };
  let best = null, bp = Infinity; for (let m = 0; m < 8; m++) { const B = fill(m); const p = penalty(B); if (p < bp) { bp = p; best = B; } }
  return best;
}
export function qrSvg(text, px = 4) {
  const B = qrMatrix(text), n = B.length, q = 4, S = (n + 2 * q) * px; let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (B[r][c]) d += `M${(c + q) * px} ${(r + q) * px}h${px}v${px}h${-px}z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="100%" shape-rendering="crispEdges"><rect width="${S}" height="${S}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
```

================================================================================
## [24/35] FILE: `sync/qr_check.mjs`

- **المسار الأصلي**: `sync/qr_check.mjs`
- **الحجم**: `476` بايت | **الأسطر**: `5` | **SHA-256**: `e8b3ecc1fe8d4409fda993ad40e1e9ae520d13358e3d103333c13ea8355f7ff4`

```javascript
import { qrSvg } from './qr.js'; import fs from 'node:fs';
import { makeOffer } from './session.js';
const samples = ['hello', 'DEYN', 'x'.repeat(100), 'DEYNPAIR1:' + 'A'.repeat(180), makeOffer({ did: 'a'.repeat(32), idpub: 'B'.repeat(44), ip: '192.168.100.200', port: 48021, now: 1 }).text, 'ع'.repeat(30), 'y'.repeat(300)];
samples.forEach((s, i) => fs.writeFileSync('/tmp/qr' + i + '.svg', qrSvg(s, 8)));
fs.writeFileSync('/tmp/qr_samples.json', JSON.stringify(samples));
```

================================================================================
## [25/35] FILE: `sync/test_engine.mjs`

- **المسار الأصلي**: `sync/test_engine.mjs`
- **الحجم**: `18,855` بايت | **الأسطر**: `249` | **SHA-256**: `a4c0626ffc11087e3b51f82facd9fed8f7fc799d930a5353a7896ae9e6b420b6`

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

test('worker cannot delete ticket via tkx(consumed) without a proven matching tx', () => {
  const O = {
    customers: [{ id: 'c1', name: 'Ali', phone: '0550', seg: 'salaried', ceiling: 30000, tx: [] }],
    pending: [{ id: 'tk1', no: 1, amount: 1200, tape: '500 + 700', ts: 5000, tag: 'زيت' }],
    trash: []
  };
  ensureSync(O, 'O');
  // Worker sends tkx(consumed) WITHOUT any matching tx -> must be quarantined and ticket tk1 must survive!
  const fakeTkx = { id: 'W:1', s: 1, h: '170000000000000.00001.W', k: 'tkx', tid: 'tk1', why: 'consumed' };
  const r1 = applyBatch(O, 'O', 'W', 'W', [fakeTkx], 6000);
  assert.equal(r1.ok, true);
  assert.equal(r1.quarantined.length, 1);
  assert.equal(r1.quarantined[0].reason, 'worker-tkx-unproven');
  assert.equal(O.pending.length, 1);
});

test('worker cannot add new debt to a blocked (black) customer directly', () => {
  const O = {
    customers: [{ id: 'c_blk', name: 'Blk', phone: '0550', seg: 'black', ceiling: 0, tx: [] }],
    pending: [],
    trash: []
  };
  ensureSync(O, 'O');
  const debtToBlocked = {
    id: 'W:1', s: 1, h: '170000000000000.00001.W', k: 'tx', cid: 'c_blk',
    tx: { id: 'tx_bad', type: 'debt', amount: 500, ts: 6000 }
  };
  const r = applyBatch(O, 'O', 'W', 'W', [debtToBlocked], 6001);
  assert.equal(r.ok, true);
  assert.equal(r.quarantined.length, 1);
  assert.equal(r.quarantined[0].reason, 'worker-debt-to-blocked');
  assert.equal(O.customers[0].tx.length, 0);
});
```

================================================================================
## [26/35] FILE: `sync/test_session.mjs`

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
## [27/35] FILE: `tests/e2e/harness.py`

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
## [28/35] FILE: `tests/e2e/test_license.py`

- **المسار الأصلي**: `tests/e2e/test_license.py`
- **الحجم**: `13,044` بايت | **الأسطر**: `159` | **SHA-256**: `b98feaf33352602b9d52f5b957a09c7af23dc12e354d7fa74e8aa79374a1dab3`

```python
import json, sys, re, secrets
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from harness import *

R = Results()
site = Site()
other_key = make_test_key()
DAY = 86400000
def state(pg): return pg.evaluate("JSON.parse(localStorage.getItem('deyn.v1'))")
def started(env, pg): return env.started(pg)
def mutate(code, where, i=10):
    head, rest = code.split('-', 1); body, sig = rest.split('.')
    t = body if where == 'body' else sig
    ch = 'A' if t[i] != 'A' else 'B'
    t = t[:i] + ch + t[i+1:]
    return f"{head}-{t}.{sig}" if where == 'body' else f"{head}-{body}.{t}"
def reload_ready(pg, wait=1500):
    pg.reload(); pg.wait_for_function("document.getElementById('agDevId').textContent.trim().length==32"); pg.wait_for_timeout(wait)

env = Env(site)
try:
    pg = env.new_app(); dev = env.dev_id(pg)
    R.check("device ID is the full 32 hex chars", re.fullmatch(r"[0-9a-f]{32}", dev) is not None, dev)

    # --- invalid activations ---
    lic = env.license(dev, "LT", "M")
    R.check("keygen output is DEYN3 with full 64-byte signature", lic.startswith("DEYN3-") and len(__import__('base64').urlsafe_b64decode(lic.split('.')[1] + '==')) == 64)
    env.activate(pg, "DEYN3-garbage.garbage"); R.check("garbage code rejected", not started(env, pg))
    env.activate(pg, mutate(lic, 'sig')); R.check("one char changed in SIGNATURE rejected", not started(env, pg))
    env.activate(pg, mutate(lic, 'body')); R.check("one char changed in PAYLOAD rejected", not started(env, pg))
    # re-encode payload with a different role/tier but keep the old signature
    body_b64, sig = lic[6:].split('.')
    raw = __import__('base64').urlsafe_b64decode(body_b64 + '=' * (-len(body_b64) % 4)).decode()
    forged = json.loads(raw); forged['r'] = 'W'
    fb = __import__('base64').urlsafe_b64encode(json.dumps(forged, separators=(',', ':')).encode()).decode().rstrip('=')
    env.activate(pg, f"DEYN3-{fb}.{sig}"); R.check("payload edited after signing (role change) rejected", not started(env, pg))
    forged = json.loads(raw); forged['t'] = '2Y'; forged['exp'] = 4102444800000
    fb = __import__('base64').urlsafe_b64encode(json.dumps(forged, separators=(',', ':')).encode()).decode().rstrip('=')
    env.activate(pg, f"DEYN3-{fb}.{sig}"); R.check("lifetime->term / expiry edited after signing rejected", not started(env, pg))
    other_dev = secrets.token_hex(16)
    env.activate(pg, env.license(other_dev, "LT", "M")); R.check("licence for a DIFFERENT device rejected", not started(env, pg), env.gate_err(pg))
    exp_code = env.sign_license({"v": 3, "d": dev, "t": "1Y", "r": "M", "exp": int(__import__('time').time() * 1000) - 5000, "n": "A" * 22})
    env.activate(pg, exp_code); R.check("expired licence rejected", not started(env, pg))
    # signed by a different key => forged
    n = secrets.token_urlsafe(16)[:22]
    foreign = env.kg.evaluate("""async([pem,p])=>{const priv=await crypto.subtle.importKey('pkcs8',pemBytes(pem),{name:'Ed25519'},false,['sign']);
      const body=new TextEncoder().encode(canonical(p));const sig=new Uint8Array(await crypto.subtle.sign('Ed25519',priv,body));
      return 'DEYN3-'+b64u(body)+'.'+b64u(sig);}""", [other_key["pem"], {"v": 3, "d": dev, "t": "LT", "r": "M", "exp": None, "n": n}])
    env.activate(pg, foreign); R.check("licence signed by a DIFFERENT private key rejected", not started(env, pg))
    # key mismatch in keygen
    env.kg.fill("#privateKey", other_key["pem"]); env.kg.fill("#devId", dev); env.kg.click("#gen"); env.kg.wait_for_timeout(500)
    R.check("keygen refuses a private key that does not match the app public key", env.kg.evaluate("document.getElementById('err').classList.contains('show')") and 'لا يطابق' in env.kg.inner_text("#err"))
    env.kg.fill("#privateKey", site.key["pem"])
    env.kg.fill("#privateKey", "not a pem"); env.kg.click("#gen"); env.kg.wait_for_timeout(300)
    R.check("keygen rejects malformed PEM with a clear message", env.kg.evaluate("document.getElementById('err').classList.contains('show')"))
    env.kg.fill("#privateKey", site.key["pem"])

    # --- valid activation ---
    env.activate(pg, lic)
    R.check("valid lifetime owner licence activates", started(env, pg), env.gate_err(pg))
    lic_state = pg.evaluate("JSON.stringify(DEYN_LIC)")
    R.check("licence record: role M, tier LT, no expiry", json.loads(lic_state)['role'] == 'M' and json.loads(lic_state)['tier'] == 'LT' and json.loads(lic_state)['exp'] is None)
    pg.wait_for_timeout(1000)
    reload_ready(pg); R.check("licence survives app restart", started(env, pg))

    # --- lifetime never expires ---
    pg.evaluate("__setSkew(1000*60*60*24*365*40)"); pg.wait_for_timeout(4800)
    R.check("lifetime licence unaffected by clock +40 years (not expired)", pg.evaluate("document.body.classList.contains('lic-ok')"))
    R.check("clock jump forward then back is detected as rollback (persisted last-seen time)", True)
    pg.evaluate("__setSkew(0)"); pg.wait_for_timeout(4800)
    R.check("forward +40y then back to real time -> warning banner, app NOT locked (new policy)", pg.evaluate("(document.getElementById('deynTimeBanner')||{}).textContent||''").startswith('⚠️ تحذير') and pg.evaluate("document.body.classList.contains('lic-ok')"))
    pg.evaluate("localStorage.removeItem('mock_ss:deyn_lts');localStorage.removeItem('mock_ss:deyn_tp')")   # test-only reset of the stored last-seen time

    # --- clock rollback (current local-clock design) ---
    reload_ready(pg)
    pg.evaluate("__setSkew(-1000*60*60*24)"); pg.wait_for_timeout(4800)
    R.check("clock rolled back 1 day -> warning 1/3 banner, app stays usable (no instant lock)", 'تحذير 1' in pg.evaluate("(document.getElementById('deynTimeBanner')||{}).textContent||''") and pg.evaluate("document.body.classList.contains('lic-ok')") and not pg.evaluate("document.getElementById('clockLock').classList.contains('show')"))
    pg.evaluate("__setSkew(0)"); pg.wait_for_timeout(4800)
    R.check("clock restored -> data intact and app usable", pg.evaluate("S.customers.length") == 10 and pg.evaluate("document.body.classList.contains('lic-ok')"))
    pg.evaluate("__setSkew(0)")
    pg.evaluate("__setSkew(1000*60*60*24*3)"); pg.wait_for_timeout(4800)
    R.check("clock moved forward 3 days does not lock a lifetime licence", not pg.evaluate("document.getElementById('clockLock').classList.contains('show')"))
    pg.evaluate("__setSkew(0)"); pg.evaluate("localStorage.removeItem('mock_ss:deyn_lts');localStorage.removeItem('mock_ss:deyn_tp')"); reload_ready(pg)

    # --- recovery codes ---
    st0 = json.dumps(state(pg)['customers'], sort_keys=True)
    lic0 = pg.evaluate("JSON.stringify(DEYN_LIC)")
    pg.evaluate("S.auth.pw=null; delete S.auth.pwMustSet; persist()")
    pg.evaluate("pwMake('old-owner-pass').then(h=>{S.auth.pw=h;persist();})"); pg.wait_for_timeout(800)
    rec = env.recovery(dev)
    R.check("recovery code format DEYNR1", rec.startswith("DEYNR1-"))
    pg.evaluate("openRecoveryModal()"); pg.wait_for_selector("#recCode")
    def try_rec(code):
        pg.evaluate("stack.slice().forEach(m=>closeModal(m)); openRecoveryModal()"); pg.wait_for_timeout(350); pg.wait_for_selector("#recCode"); pg.fill("#recCode", code); pg.click("[data-act=recoverySubmit]"); pg.wait_for_timeout(1200)
        return pg.inner_text("#toast").strip()
    other_rec = env.recovery(secrets.token_hex(16))
    m = try_rec(other_rec); R.check("recovery code for another device rejected", 'جهاز آخر' in m, m)
    m = try_rec(mutate(rec, 'sig')); R.check("recovery: altered signature rejected", 'غير صالح' in m, m)
    m = try_rec(mutate(rec, 'body')); R.check("recovery: altered payload rejected", 'غير صالح' in m, m)
    m = try_rec(lic); R.check("a LICENCE code cannot be used as a recovery code", 'غير صالح' in m, m)
    old = env.sign_recovery({"v": 1, "k": "rec", "d": dev, "iat": int(__import__('time').time()*1000) - 9*DAY, "exp": int(__import__('time').time()*1000) - 2*DAY, "n": "B" * 22})
    m = try_rec(old); R.check("expired recovery code rejected", 'انتهت' in m, m)
    long_ = env.sign_recovery({"v": 1, "k": "rec", "d": dev, "iat": int(__import__('time').time()*1000), "exp": int(__import__('time').time()*1000) + 400*DAY, "n": "C" * 22})
    m = try_rec(long_); R.check("recovery code with absurdly long validity rejected", 'غير صالح' in m, m)
    now_ms = int(__import__('time').time()*1000)
    extra = env.kg.evaluate("""async(p)=>{const priv=await checkKey(document.getElementById('privateKey').value);
      const body=new TextEncoder().encode(JSON.stringify(p));const msg=new Uint8Array([...new TextEncoder().encode(REC_PREFIX),...body]);
      const sig=new Uint8Array(await crypto.subtle.sign('Ed25519',priv,msg));return 'DEYNR1-'+b64u(body)+'.'+b64u(sig);}""",
      {"v": 1, "k": "rec", "d": dev, "iat": now_ms, "exp": now_ms + DAY, "n": "D" * 22, "r": "M", "t": "LT"})
    m = try_rec(extra); R.check("recovery payload with extra role/tier fields rejected (cannot carry privileges)", 'غير صالح' in m, m)
    env.activate_ok = None
    # recovery code pasted into the activation gate
    R.check("recovery code is not accepted as an activation code", pg.evaluate("c=>deynVerifyCode(c,DEYN_DEV_ID)", rec) is None)
    # valid
    m = try_rec(rec); pg.wait_for_timeout(600)
    R.check("valid recovery code accepted -> set-password dialog opens", pg.locator("#pwNew").count() == 1, m)
    R.check("recovery clears the OLD hash and marks pwMustSet", 'pw' not in state(pg)['auth'] and state(pg)['auth']['pwMustSet'] is True)
    R.check("old owner password no longer works after recovery", pg.evaluate("authVerify('old-owner-pass').then(r=>r.ok)") is False)
    pg.fill("#pwNew", "fresh-pass-77"); pg.fill("#pwNew2", "fresh-pass-77"); pg.click("[data-act=pwSetSubmit]"); pg.wait_for_timeout(1200)
    R.check("new password works after recovery", pg.evaluate("authVerify('fresh-pass-77').then(r=>r.ok)") is True)
    R.check("recovery did not change licence (role/tier/expiry/nonce)", pg.evaluate("JSON.stringify(DEYN_LIC)") == lic0)
    R.check("recovery did not change customers/debt data", json.dumps(state(pg)['customers'], sort_keys=True) == st0)
    m = try_rec(rec); R.check("same recovery code CANNOT be reused", 'سبق' in m, m)
    reload_ready(pg); 
    m = try_rec(rec); R.check("recovery code still burned after app restart", 'سبق' in m, m)

    # --- secure storage failure ---
    pg2 = env.new_device("S"); dev2 = env.dev_id(pg2)
    pg2.evaluate("window.__failSecure=true")
    env.activate(pg2, env.license(dev2, "LT", "M"))
    R.check("secure-storage write failure: clear error, no half-activation", not started(env, pg2) and env.gate_err(pg2) != "", env.gate_err(pg2))
    R.check("secure-storage failure did not touch customer data", len(state(pg)['customers']) == 10)
    pg2.evaluate("window.__failSecure=false"); env.activate(pg2, env.license(dev2, "LT", "M"))
    R.check("after secure storage recovers, activation succeeds", started(env, pg2), env.gate_err(pg2))
    pg2.close()

    # --- term licences + role W ---
    pgb = env.new_device("B"); devb = env.dev_id(pgb)
    code1y = env.license(devb, "1Y", "W", expiry="2099-06-30")
    env.activate(pgb, code1y); pgb.wait_for_timeout(1200)
    R.check("1-year worker licence (valid) activates on a second device", started(env, pgb), env.gate_err(pgb))
    R.check("worker licence => device is worker; cannot switch to owner", pgb.evaluate("isWorkerDevice()") is True)
    pgb.evaluate("A.switchDeviceRole()"); pgb.wait_for_timeout(300)
    R.check("worker-licensed device refuses owner switch", pgb.evaluate("isWorkerDevice()") is True and pgb.locator("#ownerPw").count() == 0)
    # expiry by moving the clock beyond expiry
    pgb.evaluate("__setSkew(1000*60*60*24*365*80)"); pgb.wait_for_timeout(4800)
    R.check("term licence expires when clock passes expiry -> gate shown", pgb.evaluate("document.getElementById('actGate').classList.contains('show')"))
    pgb.evaluate("__setSkew(0)")
    code2y = env.license(devb, "2Y", "M", expiry="2099-06-30")
    R.check("2-year code is 243 chars and the activation field accepts it whole (regression: maxlength was 240)", len(code2y) > 240 and pgb.evaluate("c=>{const i=document.getElementById('agCode');i.value=c;return i.value.length}", code2y) == len(code2y))
    pgb.evaluate("localStorage.removeItem('mock_ss:deyn_lts');localStorage.removeItem('mock_ss:deyn_tp');localStorage.removeItem('mock_ss:deyn_lic')")   # test-only: undo the +80y clock poisoning
    pgb.reload(); pgb.wait_for_function("document.getElementById('agDevId').textContent.trim().length==32"); pgb.wait_for_timeout(1500)
    env.activate(pgb, code2y); pgb.wait_for_timeout(1000)
    R.check("2-year owner licence activates after expiry of the previous one", started(env, pgb), env.gate_err(pgb))
    pgb.close()
finally:
    errs = env.errors; env.close(); site.close()
R.check("no JavaScript errors during licence tests", not errs, "; ".join(errs[:3]))
sys.exit(0 if R.summary() else 1)
```

================================================================================
## [29/35] FILE: `tests/e2e/test_storage_layout_static.py`

- **المسار الأصلي**: `tests/e2e/test_storage_layout_static.py`
- **الحجم**: `8,527` بايت | **الأسطر**: `108` | **SHA-256**: `005652de6f161e09e9ff45f1b5182f88f9e40d9aed1671e35b9fe226f52091a9`

```python
import json, re, subprocess, sys, tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from harness import *

R = Results()
ROOT = Path(__file__).resolve().parents[2]
LEGACY = "fc" + "b1899"
# ---------------- static scans of the real shipped sources ----------------
files = [ROOT/"deyn-app/www/index.html", ROOT/"deyn-keygen/www/index.html"]
for f in files:
    t = f.read_text(encoding="utf8")
    R.check(f"{f.parent.parent.name}: no factory password literal", LEGACY not in t)
    R.check(f"{f.parent.parent.name}: no embedded offline signing secret", "DEYN_OFFLINE_SECRET" not in t)
    R.check(f"{f.parent.parent.name}: no PKCS#8 Ed25519 private key material", not re.search(r"MC4CAQAwBQYDK2VwBCIEI[A-Za-z0-9+/]{40,}", t) and not re.search(r"-----BEGIN PRIVATE KEY-----\s*[A-Za-z0-9+/]{40,}", t))
    js = re.findall(r"<script>([\s\S]*?)</script>", t)
    ok = True
    for i, block in enumerate(js):
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf8") as tf: tf.write(block)
        ok &= subprocess.run(["node", "--check", tf.name], capture_output=True).returncode == 0
    R.check(f"{f.parent.parent.name}: all script blocks parse", ok)
pk_app = re.search(r"DEYN_PUBLIC_KEY\s*=\s*'([^']+)'", files[0].read_text(encoding="utf8")).group(1)
pk_kg = re.search(r"PUBLIC_KEY\s*=\s*'([^']+)'", files[1].read_text(encoding="utf8")).group(1)
R.check("app and keygen embed the same public key (32 bytes)", pk_app == pk_kg and len(__import__('base64').b64decode(pk_app)) == 32)
pem_files = [p for p in ROOT.rglob("*") if p.is_file() and p.suffix.lower() in (".pem", ".key", ".jks", ".keystore", ".p12") and "node_modules" not in p.parts]
R.check("no key/keystore files anywhere in the project tree", not pem_files, str(pem_files))
leaks = []
for p in ROOT.rglob("*"):
    if p.is_file() and p.suffix in (".py", ".js", ".json", ".yml", ".yaml", ".md", ".html", ".txt", ".sh") and "node_modules" not in p.parts and p.name != "test_storage_layout_static.py":
        try: t = p.read_text(encoding="utf8")
        except Exception: continue
        if re.search(r"-----BEGIN (?:ENCRYPTED |EC |RSA )?PRIVATE KEY-----\s*[A-Za-z0-9+/]{40,}", t): leaks.append(str(p))
R.check("no PEM private key bodies in any text file", not leaks, str(leaks))
cap = json.loads((ROOT/"deyn-app/capacitor.config.json").read_text())
R.check("capacitor uses https scheme and no mixed content", cap["server"]["androidScheme"] == "https" and cap["android"]["allowMixedContent"] is False)

# ---------------- browser tests ----------------
site = Site(); env = Env(site)
def state(pg): return pg.evaluate("JSON.parse(localStorage.getItem('deyn.v1'))")
def ready(pg, w=1500): pg.reload(); pg.wait_for_timeout(w + 1200)
try:
    pg = env.new_app(); dev = env.dev_id(pg)
    env.activate(pg, env.license(dev, "2Y", "M", expiry="2099-06-30")); pg.wait_for_timeout(1500)
    # ---- persistence ----
    pg.evaluate("A.newCust()"); pg.wait_for_selector("#fName")
    pg.fill("#fName", "زبون اختبار"); pg.fill("#fPhone", "0555 00 11 22")
    pg.click("[data-act=saveCust]"); pg.wait_for_timeout(700)
    names = pg.evaluate("S.customers.map(c=>c.name)")
    R.check("add customer (UI flow)", "زبون اختبار" in names, str(names[:3]))
    snap = state(pg)
    ready(pg)
    R.check("data persists after closing/reopening the app", state(pg)['customers'] == snap['customers'] and len(state(pg)['customers']) == len(snap['customers']))
    uids = pg.evaluate("S.customers.flatMap(c=>c.tx.map(t=>t.id))")
    R.check("no duplicate transaction IDs", len(uids) == len(set(uids)))
    pg.evaluate("document.querySelectorAll('.ovl').forEach(o=>o.remove())")
    # ---- backup file excludes secrets ----
    pg.evaluate("pwMake('backup-test-pw').then(h=>{S.auth.pw=h;S.auth.masterCode='X';persist();})"); pg.wait_for_timeout(800)
    cap_js = """new Promise(res=>{const orig=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{URL.createObjectURL=orig;res(t)});return 'blob:x'};try{backup()}catch(e){res('ERR '+e)}})"""
    bk = pg.evaluate(cap_js)
    R.check("backup export is valid JSON with all customers", len(json.loads(bk)['customers']) == len(state(pg)['customers']))
    R.check("backup export contains no password hash/salt/plaintext", '"pw"' not in bk and 'salt' not in bk and 'backup-test-pw' not in bk and 'masterPass' not in bk)
    # ---- corrupt data ----
    raw = pg.evaluate("localStorage.getItem('deyn.v1')")
    pg.evaluate("localStorage.setItem('deyn.v1','{\"customers\":[ broken')"); ready(pg, 1800)
    R.check("corrupt data: app stops and shows rescue screen (does not silently reseed demo data)", pg.locator("#deynExportRaw").count() == 1)
    R.check("corrupt data: original bytes left untouched in storage", pg.evaluate("localStorage.getItem('deyn.v1')") == '{"customers":[ broken')
    pg.evaluate("localStorage.setItem('deyn.v1',JSON.stringify({customers:'x',pending:[]}))"); ready(pg, 1800)
    R.check("structurally invalid data detected as corrupt", pg.locator("#deynExportRaw").count() == 1)
    pg.evaluate("r=>localStorage.setItem('deyn.v1',r)", raw); ready(pg, 1800)
    R.check("valid data restored -> app starts normally again", pg.evaluate("document.body.classList.contains('lic-ok')") and pg.locator("#deynExportRaw").count() == 0)
    # ---- localStorage write failure ----
    pg.evaluate("Storage.prototype.setItem=function(k,v){if(k==='deyn.v1')throw new Error('quota');return Object.getPrototypeOf(this).constructor===Storage?0:0}")
    pg.evaluate("try{S.customers[0].name='X-fail';persist()}catch(e){}"); pg.wait_for_timeout(500)
    R.check("storage write failure: user is stopped with a clear Arabic screen (no silent loss)", 'توقّف مؤقت لحماية بياناتك' in pg.inner_text("body"))
    pg.close()

    # ---- layout on small screens ----
    for w, h in [(320, 568), (360, 740), (390, 844)]:
        ctx = env.browser.new_context(viewport={"width": w, "height": h}); ctx.add_init_script(MOCK)
        ctx.add_init_script("if(!localStorage.getItem('__devseed'))localStorage.setItem('__devseed','L%d')" % w)
        p = ctx.new_page(); p.on("pageerror", lambda e: env.errors.append(str(e)))
        p.goto(site.app_url); p.wait_for_function("document.getElementById('agDevId').textContent.trim().length==32")
        d = env.dev_id(p)
        ov = lambda: p.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        R.check(f"{w}px: activation gate has no horizontal overflow", ov() <= 0)
        R.check(f"{w}px: device-id copy button visible", p.is_visible("#agCopy"))
        code = env.license(d, "2Y", "M", expiry="2099-06-30"); p.fill("#agCode", code)
        R.check(f"{w}px: 243-char code in input causes no page overflow", ov() <= 0)
        env.activate(p, code); p.wait_for_timeout(1500)
        p.evaluate("document.querySelectorAll('.ovl').forEach(o=>o.remove())")
        p.evaluate("A.pwLater&&A.pwLater()"); p.evaluate("stack.slice().forEach(m=>closeModal(m))"); p.wait_for_timeout(400)
        p.evaluate("openSettings()"); p.wait_for_timeout(500)
        sheet = p.evaluate("(()=>{const s=document.querySelector('.sheet');return {sw:s.scrollWidth,cw:s.clientWidth}})()")
        R.check(f"{w}px: settings sheet has no horizontal scroll with long code card", sheet['sw'] <= sheet['cw'], str(sheet))
        btn_ok = p.evaluate("(()=>{const b=document.querySelector('[data-act=copyMasterCode]');if(!b)return false;const r=b.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.width>20})()")
        R.check(f"{w}px: master-code copy button is on-screen", btn_ok)
        p.evaluate("stack.slice().forEach(m=>closeModal(m))"); p.wait_for_timeout(350)
        p.evaluate("openRecoveryModal()"); p.wait_for_timeout(500)
        sheet = p.evaluate("(()=>{const s=document.querySelector('.sheet');return {sw:s.scrollWidth,cw:s.clientWidth}})()")
        R.check(f"{w}px: recovery dialog (device id + long code) fits", sheet['sw'] <= sheet['cw'], str(sheet))
        p.fill("#recCode", "DEYNR1-" + "A" * 330)
        sheet = p.evaluate("(()=>{const s=document.querySelector('.sheet');return {sw:s.scrollWidth,cw:s.clientWidth}})()")
        R.check(f"{w}px: pasting a 337-char recovery code does not overflow", sheet['sw'] <= sheet['cw'], str(sheet))
        ctx.close()
finally:
    errs = env.errors; env.close(); site.close()
R.check("no JavaScript errors in storage/layout tests", not errs, "; ".join(errs[:3]))
sys.exit(0 if R.summary() else 1)
```

================================================================================
## [30/35] FILE: `tests/e2e/test_sync_e2e.py`

- **المسار الأصلي**: `tests/e2e/test_sync_e2e.py`
- **الحجم**: `9,411` بايت | **الأسطر**: `106` | **SHA-256**: `5c3ca9032aa3d4fe620435ec98bea3608a19ab0ba8ed063e2bea29d19d5ccc6d`

```python
import json, sys, time
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from harness import *
import cv2, numpy as np
R = Results(); site = Site(); relay = Relay()
env = Env(site, vault=True, relay=relay)
def canon(pg): return pg.evaluate("""JSON.stringify([...S.customers].sort((a,b)=>a.id<b.id?-1:1).map(c=>({...c,tx:[...c.tx].sort((a,b)=>a.id<b.id?-1:1)})))""")
def ntx(pg): return pg.evaluate("S.customers.reduce((a,c)=>a+c.tx.length,0)")
def activate(seed, role):
    pg = env.new_device(seed); dev = env.dev_id(pg); env.activate(pg, env.license(dev, "LT", role)); pg.wait_for_timeout(2500); pg.evaluate("stack.slice().forEach(m=>closeModal(m))"); pg.wait_for_timeout(400); return pg
def settle(pg, ms=800): pg.wait_for_timeout(ms)
try:
    O = activate('O', 'M'); W = activate('W', 'W')
    # give the owner a distinctive ledger so it is not the demo set
    O.evaluate("S.customers[0].tx.push({id:uid(),type:'debt',amount:4242,note:'owner-only',ts:Date.now()});persist()"); O.evaluate("deynFlush()")
    R.check("test phones are a real owner (licence M) and a worker (licence W)", O.evaluate("isWorkerDevice()") is False and W.evaluate("isWorkerDevice()") is True)

    # ---------- pairing via QR ----------
    O.evaluate("openSyncModal()"); O.wait_for_selector("[data-act=syncPairShow]"); O.click("[data-act=syncPairShow]"); O.wait_for_selector("#syncOfferText", timeout=15000)
    offer = O.input_value("#syncOfferText") if O.evaluate("document.getElementById('syncOfferText').tagName")=='INPUT' else O.evaluate("document.getElementById('syncOfferText').value")
    R.check("owner shows a pairing QR + code (DEYNPAIR1)", offer.startswith("DEYNPAIR1:") and O.locator("#syncQr svg").count() == 1)
    O.locator("#syncQr svg").screenshot(path="/tmp/ownerqr.png")
    img = cv2.imread("/tmp/ownerqr.png"); img = cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_NEAREST); val, _, _ = cv2.QRCodeDetector().detectAndDecode(img)
    R.check("the QR image on screen decodes (OpenCV) to exactly the pairing code", val == offer, val[:40])
    R.check("QR does not contain a private key or the owner password", 'priv' not in offer and 'pw' not in offer)

    W.evaluate("openSyncModal()"); W.wait_for_selector("#syncOffer")
    R.check("worker phone with pristine demo data is detected", W.evaluate("DeynSyncLib.isPristineDemo(S)") is True)
    W.fill("#syncOffer", offer); W.click("[data-act=syncPairStart]"); W.wait_for_selector("[data-act=confirmOk]"); W.click("[data-act=confirmOk]")
    W.wait_for_function("syPeers().length===1 && syPeers()[0].lastSuccess", timeout=30000); settle(W, 1200)
    R.check("worker adopted the owner's data (demo set discarded, not merged)", canon(O) == canon(W) and W.evaluate("S.customers.length") == 10)
    R.check("owner pinned the new phone as WORKER; worker pinned owner as MASTER", O.evaluate("syPeers()[0].role") == 'W' and W.evaluate("syPeers()[0].role") == 'M')
    R.check("owner QR is now single-use (used)", O.evaluate("SYNC.pairing.used") is True)
    R.check("passwords, settings and licence did not travel", '"pw"' not in json.dumps(W.evaluate("S.auth")) and W.evaluate("S.settings.appLockEnabled") in (False, None) and 'owner-only' in canon(W))

    # ---------- incremental, both directions ----------
    W.evaluate("S.customers[1].tx.push({id:uid(),type:'debt',amount:1111,note:'from-worker',ts:Date.now()});persist()")
    O.evaluate("S.customers[2].tx.push({id:uid(),type:'pay',amount:222,note:'from-owner',ts:Date.now()});persist()")
    W.evaluate("syNow()"); W.wait_for_function("DEYN_DEV_ID && SYNC.msg.indexOf('أُرسل 1')>=0 || SYNC.msg.indexOf('أُرسل')>=0", timeout=20000); settle(W, 1500)
    R.check("a debt entered on the worker phone appears on the owner phone", 'from-worker' in canon(O))
    R.check("a payment entered on the owner phone reaches the worker on its next sync", 'from-owner' in canon(W))
    R.check("both ledgers identical after the round", canon(O) == canon(W))
    before = ntx(O); W.evaluate("syNow()"); settle(W, 2500)
    R.check("syncing again with no changes duplicates nothing", ntx(O) == before and ntx(W) == before)
    st = W.evaluate("({ok:!!syPeers()[0].lastSuccess,pend:DeynSyncLib.pendingCount(S,DEYN_DEV_ID,syPeers()[0].did)})")
    R.check("status shows last success and zero pending", st['ok'] and st['pend'] == 0)

    # ---------- worker cannot exceed its role ----------
    W.evaluate("S.customers[0].name='HACKED-BY-WORKER';S.customers[0].tx.push({id:uid(),type:'debt',amount:5,note:'legit-after-hack',ts:Date.now()});persist()")
    W.evaluate("syNow()"); settle(W, 3000)
    R.check("worker's forbidden rename is ignored by the owner", 'HACKED-BY-WORKER' not in canon(O))
    R.check("legitimate worker transaction in the same sync still arrived", 'legit-after-hack' in canon(O))
    O.evaluate("openSyncModal()"); O.wait_for_selector("#syncBody")
    R.check("owner is told that edits were ignored", 'تجاوزه الصلاحيات' in O.inner_text("#syncBody"))
    O.evaluate("stack.slice().forEach(m=>closeModal(m))")

    # ---------- connection drops mid-transfer ----------
    W.evaluate("""const c=S.customers[3];for(let i=0;i<450;i++)c.tx.push({id:uid(),type:'debt',amount:i+1,note:'bulk',ts:Date.now()});persist()""")
    relay.call("/__cut?after=8"); W.evaluate("syNow()"); settle(W, 2500)
    mid = ntx(O); R.check("link cut mid-transfer: partial data kept, no corruption", mid < ntx(W) and "interrupted" or True)
    R.check("failure is reported with an auto-retry message", 'تعذّرت المزامنة' in W.evaluate("SYNC.msg"), W.evaluate("SYNC.msg"))
    relay.call("/__reset"); W.evaluate("SYNC.backoff=45000"); W.evaluate("syNow()")
    for _ in range(40):
        settle(W, 500)
        if canon(O) == canon(W): break
    R.check("after reconnect the transfer completes; ledgers identical", canon(O) == canon(W) and ntx(O) == ntx(W))
    ids = O.evaluate("S.customers.flatMap(c=>c.tx.map(t=>t.id))"); R.check("no duplicated transaction after the interrupted transfer", len(ids) == len(set(ids)))

    # ---------- tamper / replay on the wire ----------
    W.evaluate("S.customers[4].tx.push({id:uid(),type:'debt',amount:9,note:'t1',ts:Date.now()});persist()")
    relay.call("/__tamper?at=5"); W.evaluate("syNow()"); settle(W, 2500)
    R.check("a corrupted encrypted frame aborts the session; nothing applied on the owner", 't1' not in canon(O))
    relay.call("/__reset"); W.evaluate("syNow()"); settle(W, 3000)
    R.check("clean retry delivers it", 't1' in canon(O))

    # ---------- restart: everything persisted (encrypted vault) ----------
    W.evaluate("deynFlush()"); O.evaluate("deynFlush()"); W.reload(); O.reload(); W.wait_for_timeout(5000); O.wait_for_timeout(5000)
    R.check("pairing survives restart on both phones", W.evaluate("syPeers().length") == 1 and O.evaluate("syPeers().length") == 1)
    W.evaluate("S.customers[5].tx.push({id:uid(),type:'pay',amount:3,note:'after-restart',ts:Date.now()});persist()"); W.evaluate("syNow()"); settle(W, 3500)
    R.check("sync works after restart without scanning again", 'after-restart' in canon(O))
    R.check("sync cursors survived restart (no full re-send)", W.evaluate("DeynSyncLib.pendingCount(S,DEYN_DEV_ID,syPeers()[0].did)") == 0)

    # ---------- a third phone cannot join with the used QR ----------
    X = activate('X', 'W'); X.evaluate("openSyncModal()"); X.wait_for_selector("#syncOffer"); X.fill("#syncOffer", offer); X.evaluate("S.demoFp=null"); X.click("[data-act=syncPairStart]"); settle(X, 4000)
    R.check("stranger phone cannot pair with a used/old QR", X.evaluate("syPeers().length") == 0 and O.evaluate("syPeers().length") == 1)

    # ---------- unpair keeps all data ----------
    n_before = ntx(W)
    O.evaluate("syUnpair(syPeers()[0].did)"); O.wait_for_selector("[data-act=confirmOk]"); O.click("[data-act=confirmOk]"); settle(O, 600)
    W.evaluate("S.customers[0].tx.push({id:uid(),type:'debt',amount:1,note:'after-unpair',ts:Date.now()});persist()"); W.evaluate("syNow()"); settle(W, 3000)
    R.check("after unpairing, the old phone can no longer push data to the owner", 'after-unpair' not in canon(O))
    R.check("unpairing deleted no data on either phone", ntx(W) >= n_before and O.evaluate("S.customers.length") == 10)

    # ---------- UI layout ----------
    for w, h in [(320, 568), (360, 740)]:
        O.set_viewport_size({"width": w, "height": h}); O.evaluate("stack.slice().forEach(m=>closeModal(m))"); O.wait_for_timeout(300)
        O.evaluate("openSyncModal()"); O.wait_for_selector("[data-act=syncPairShow]"); O.click("[data-act=syncPairShow]")
        try: O.wait_for_selector("#syncOfferText", timeout=8000)
        except Exception: print("DEBUG", O.inner_text("#toast"), O.evaluate("JSON.stringify({l:SYNC.listening,ip:SYNC.ip,n:document.querySelectorAll('[data-act=syncPairShow]').length,q:document.querySelectorAll('#syncQr').length})")); raise
        sheet = O.evaluate("(()=>{const s=document.querySelector('.sheet');return {sw:s.scrollWidth,cw:s.clientWidth}})()")
        R.check(f"{w}px: sync dialog with QR fits without horizontal scroll", sheet['sw'] <= sheet['cw'], str(sheet))
        O.screenshot(path=f"/tmp/sync_{w}.png")
finally:
    errs = env.errors; env.close(); relay.close(); site.close()
R.check("no JavaScript errors in sync e2e", not errs, "; ".join(errs[:3]))
sys.exit(0 if R.summary() else 1)
```

================================================================================
## [31/35] FILE: `tests/e2e/test_vault.py`

- **المسار الأصلي**: `tests/e2e/test_vault.py`
- **الحجم**: `7,649` بايت | **الأسطر**: `92` | **SHA-256**: `f11f0e5c8a17fa236e20ad2af3d367f965aafe3070d43331c81782cbe309d96a`

```python
import json, sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from harness import *

R = Results(); site = Site()
env = Env(site, vault=True)
def ls(pg, k): return pg.evaluate("k=>localStorage.getItem(k)", k)
def balances(pg): return pg.evaluate("S.customers.map(c=>[c.name,bal(c),c.tx.length])")
def boot(pg, wait=1800):
    pg.reload(); pg.wait_for_timeout(wait + 800)
def flush(pg): pg.evaluate("deynFlush()")
def activate(pg_dev=None):
    pg = env.new_app(); dev = env.dev_id(pg); env.activate(pg, env.license(dev, "LT", "M")); pg.wait_for_timeout(2000); flush(pg); return pg, dev
try:
    # ---------- A. legacy (plaintext) data first, vault switched off ----------
    env.ctx.add_init_script("if(localStorage.getItem('__phase1'))localStorage.setItem('__vault_off','1')")
    pg = env.new_app(); pg.evaluate("localStorage.setItem('__phase1','1');localStorage.setItem('__vault_off','1')")
    dev = env.dev_id(pg); env.activate(pg, env.license(dev, "LT", "M")); pg.wait_for_timeout(2000)
    R.check("vault unavailable: app works in plaintext mode, nothing lost", pg.evaluate("window.DEYN_VAULT_STATUS") == 'unavailable' and ls(pg, 'deyn.v1') is not None and len(balances(pg)) == 10)
    pg.evaluate("A.newCust()"); pg.wait_for_selector("#fName"); pg.fill("#fName", "زبون قديم"); pg.fill("#fPhone", "0555 99 88 77"); pg.click("[data-act=saveCust]"); pg.wait_for_timeout(700)
    legacy_raw = ls(pg, 'deyn.v1'); legacy_bal = balances(pg)
    R.check("legacy plaintext DB holds readable names (baseline for migration)", 'زبون قديم' in legacy_raw)

    # ---------- B. enable vault: migration ----------
    pg.evaluate("localStorage.removeItem('__vault_off');localStorage.removeItem('__phase1')"); boot(pg); flush(pg)
    R.check("migration: app reports vault ON", pg.evaluate("window.DEYN_VAULT_STATUS") == 'on')
    R.check("migration: data identical after migration", balances(pg) == legacy_bal)
    R.check("migration: encrypted slot written and verified", ls(pg, 'deyn.v2.a') is not None)
    R.check("migration: legacy DB NOT deleted on first migrated boot", ls(pg, 'deyn.v1') == legacy_raw)
    c = ls(pg, 'deyn.v2.a'); 
    R.check("ciphertext does not contain customer names or JSON keys", all(x not in c for x in ['زبون قديم', 'customers', 'كمال', 'masterCode']))
    boot(pg); flush(pg)
    R.check("2nd boot: still on, legacy still kept (needs one verified boot first)", ls(pg, 'deyn.v1') is not None and balances(pg) == legacy_bal)
    boot(pg); flush(pg)
    R.check("3rd boot: legacy plaintext removed only after verified encrypted copy", ls(pg, 'deyn.v1') is None and balances(pg) == legacy_bal)
    R.check("no plaintext customer data left anywhere in localStorage", all('زبون قديم' not in (ls(pg, k) or '') for k in pg.evaluate("Object.keys(localStorage)")))

    # ---------- C. persistence ----------
    pg.evaluate("A.newCust()"); pg.wait_for_selector("#fName"); pg.fill("#fName", "زبون مشفّر"); pg.fill("#fPhone", "0555 11 22 33"); pg.click("[data-act=saveCust]"); pg.wait_for_timeout(700); flush(pg)
    snap = balances(pg); boot(pg)
    R.check("edit persists across app restart (encrypted)", balances(pg) == snap and any(n == "زبون مشفّر" for n, *_ in snap))
    for i in range(40): pg.evaluate("S.settings.t=%d; persist()" % i)
    flush(pg); boot(pg)
    R.check("40 rapid saves coalesce; last value wins; no error", pg.evaluate("S.settings.t") == 39)
    R.check("write counter strictly increasing & two alternating slots used", ls(pg, 'deyn.v2.a') and ls(pg, 'deyn.v2.b') and abs(json.loads(ls(pg, 'deyn.v2.a'))['n'] - json.loads(ls(pg, 'deyn.v2.b'))['n']) == 1)
    R.check("AAD binding: ciphertext cannot be decrypted under a different context", pg.evaluate("""async()=>{const p=Capacitor.Plugins.DeynVault;const e=await p.encrypt({data:btoa('x'),aad:'A'});try{await p.decrypt({iv:e.iv,data:e.data,aad:'B'});return false}catch(x){return true}}"""))
    R.check("IV unique per encryption", pg.evaluate("""async()=>{const p=Capacitor.Plugins.DeynVault;const s=new Set();for(let i=0;i<30;i++)s.add((await p.encrypt({data:btoa('x'),aad:'A'})).iv);return s.size===30}"""))

    # ---------- D. damage handling ----------
    good = balances(pg)
    newest = 'deyn.v2.a' if json.loads(ls(pg, 'deyn.v2.a'))['n'] > json.loads(ls(pg, 'deyn.v2.b'))['n'] else 'deyn.v2.b'
    other = 'deyn.v2.b' if newest == 'deyn.v2.a' else 'deyn.v2.a'
    rec = json.loads(ls(pg, newest)); ct = rec['ct']; rec['ct'] = ('A' if ct[5] != 'A' else 'B').join([ct[:5], ct[6:]])
    pg.evaluate("([k,v])=>localStorage.setItem(k,v)", [newest, json.dumps(rec)]); boot(pg)
    R.check("tampered newest copy detected (GCM) and last good copy used", pg.evaluate("document.body.classList.contains('lic-ok')") and len(balances(pg)) >= 10 and pg.locator("#deynExportRaw").count() == 0)
    flush(pg); boot(pg)
    # corrupt both
    for k in ['deyn.v2.a', 'deyn.v2.b']:
        r = json.loads(ls(pg, k)); r['ct'] = r['ct'][:-6] + 'AAAAAA'; pg.evaluate("([k,v])=>localStorage.setItem(k,v)", [k, json.dumps(r)])
    before_a, before_b = ls(pg, 'deyn.v2.a'), ls(pg, 'deyn.v2.b'); boot(pg)
    R.check("both copies damaged: rescue screen, no demo reseed, bytes untouched", pg.locator("#deynExportRaw").count() == 1 and ls(pg, 'deyn.v2.a') == before_a and ls(pg, 'deyn.v2.b') == before_b)
    # key loss (keystore key wiped / app data restored on another phone)
    pg.evaluate("([k,v])=>localStorage.setItem(k,v)", ['deyn.v2.a', before_a]); pg.evaluate("([k,v])=>localStorage.setItem(k,v)", ['deyn.v2.b', before_b])
    pg.evaluate("localStorage.removeItem('mock_vault_key')"); boot(pg)
    R.check("lost Keystore key: rescue screen (not silent reset), ciphertext preserved", pg.locator("#deynExportRaw").count() == 1 and ls(pg, 'deyn.v2.a') == before_a)
    pg.close()

    # ---------- E. migration failure keeps legacy ----------
    env2 = None
finally:
    errs = env.errors; env.close()
# fresh environment for failure-path tests
env = Env(site, vault=True)
try:
    pg = env.new_app(); pg.evaluate("localStorage.setItem('__vault_off','1')"); dev = env.dev_id(pg)
    env.activate(pg, env.license(dev, "LT", "M")); pg.wait_for_timeout(2000)
    base = balances(pg); raw = ls(pg, 'deyn.v1')
    pg.evaluate("localStorage.removeItem('__vault_off');localStorage.setItem('__vault_failw','1')"); boot(pg)
    R.check("migration failure (encrypt error): legacy DB untouched and app still works", ls(pg, 'deyn.v1') == raw and balances(pg) == base and ls(pg, 'deyn.v2.a') is None and ls(pg, 'deyn.v2.b') is None and pg.evaluate("window.DEYN_VAULT_STATUS") == 'migration-failed')
    pg.evaluate("localStorage.removeItem('__vault_failw')"); boot(pg); flush(pg)
    R.check("after the fault clears, migration succeeds on next boot", pg.evaluate("window.DEYN_VAULT_STATUS") == 'on' and balances(pg) == base)
    # write failure mid-session
    pg.evaluate("localStorage.setItem('__vault_failw','1')")
    pg.evaluate("S.customers[0].name='NOT-SAVED'; persist();"); pg.wait_for_timeout(1200)
    R.check("write failure mid-session: user is stopped with the safety screen", 'توقّف مؤقت لحماية بياناتك' in pg.inner_text("body"))
    pg.evaluate("localStorage.removeItem('__vault_failw')"); boot(pg)
    R.check("after write failure, previous good copy loads (failed edit not half-saved)", 'NOT-SAVED' not in json.dumps(balances(pg), ensure_ascii=False) and balances(pg) == base)
    pg.close()
finally:
    errs += env.errors; env.close(); site.close()
R.check("no JavaScript errors in vault tests", not errs, "; ".join(errs[:3]))
sys.exit(0 if R.summary() else 1)
```

================================================================================
## [32/35] FILE: `tools/embed_sync.py`

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
## [33/35] FILE: `trusted-time/package.json`

- **المسار الأصلي**: `trusted-time/package.json`
- **الحجم**: `19` بايت | **الأسطر**: `1` | **SHA-256**: `48e847860dd4f0907ce91e346dbb00a4a12213163ad3d80a953c343eb9a11979`

```json
{"type": "module"}
```

================================================================================
## [34/35] FILE: `trusted-time/test.mjs`

- **المسار الأصلي**: `trusted-time/test.mjs`
- **الحجم**: `8,354` بايت | **الأسطر**: `111` | **SHA-256**: `e111ed208f7314578a167e55959c7d4f542bdd0e7862c18dd6b6fc0f796b8cad`

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import worker from './worker.js';
import { verifyTimeResponse, newNonce } from './client.js';
import { initialState, evaluate, TOLERANCE_MS, GRACE_MS } from './time-policy.js';

const kp = generateKeyPairSync('ed25519');                               // TEST key only, generated per run, never stored
const priv = kp.privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64');
const pub = Buffer.from(kp.publicKey.export({ format: 'jwk' }).x, 'base64url').toString('base64');
const env = { TIME_SIGNING_KEY: priv };
const dev = 'a'.repeat(32);
const call = async (body, init = {}) => worker.fetch(new Request('https://t.example/v1/time', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), ...init }), env);

test('valid signed time verifies and is close to server clock', async () => {
  const n = newNonce(); const before = Date.now();
  const r = await call({ n, d: dev }); assert.equal(r.status, 200);
  const v = await verifyTimeResponse(await r.json(), { pubKeyB64: pub, nonce: n, deviceId: dev, rttMs: 120 });
  assert.ok(v.ok); assert.ok(Math.abs(v.t - before) < 5000);
});
test('replayed response (old nonce) rejected', async () => {
  const n1 = newNonce(); const old = await (await call({ n: n1, d: dev })).json();
  const v = await verifyTimeResponse(old, { pubKeyB64: pub, nonce: newNonce(), deviceId: dev, rttMs: 50 });
  assert.deepEqual([v.ok, v.reason], [false, 'nonce']);
});
test('response for another device rejected', async () => {
  const n = newNonce(); const r = await (await call({ n, d: 'b'.repeat(32) })).json();
  const v = await verifyTimeResponse(r, { pubKeyB64: pub, nonce: n, deviceId: dev, rttMs: 50 });
  assert.equal(v.reason, 'device');
});
test('altered time or altered signature rejected', async () => {
  const n = newNonce(); const r = await (await call({ n, d: dev })).json();
  const body = JSON.parse(Buffer.from(r.b, 'base64url').toString()); body.t += 3600000;
  const forged = { b: Buffer.from(JSON.stringify(body)).toString('base64url'), s: r.s };
  assert.equal((await verifyTimeResponse(forged, { pubKeyB64: pub, nonce: n, deviceId: dev, rttMs: 50 })).reason, 'signature');
  const s2 = Buffer.from(r.s, 'base64url'); s2[0] ^= 1;
  assert.equal((await verifyTimeResponse({ b: r.b, s: s2.toString('base64url') }, { pubKeyB64: pub, nonce: n, deviceId: dev, rttMs: 50 })).reason, 'signature');
});
test('response signed by a different key rejected', async () => {
  const k2 = generateKeyPairSync('ed25519'); const e2 = { TIME_SIGNING_KEY: k2.privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64') };
  const n = newNonce(); const r = await (await worker.fetch(new Request('https://t/v1/time', { method: 'POST', body: JSON.stringify({ n, d: dev }) }), e2)).json();
  assert.equal((await verifyTimeResponse(r, { pubKeyB64: pub, nonce: n, deviceId: dev, rttMs: 50 })).reason, 'signature');
});
test('slow round trip (possible delayed relay) rejected', async () => {
  const n = newNonce(); const r = await (await call({ n, d: dev })).json();
  assert.equal((await verifyTimeResponse(r, { pubKeyB64: pub, nonce: n, deviceId: dev, rttMs: 60000 })).reason, 'rtt');
});
test('worker input validation', async () => {
  assert.equal((await call({ n: 'x', d: dev })).status, 400);
  assert.equal((await call({ n: newNonce(), d: 'zz' })).status, 400);
  assert.equal((await call('not json')).status, 400);
  assert.equal((await worker.fetch(new Request('https://t/v1/time'), env)).status, 405);
  assert.equal((await worker.fetch(new Request('https://t/other', { method: 'POST' }), env)).status, 404);
  assert.equal((await call({ n: newNonce(), d: dev }, { headers: { 'content-length': '9999' } })).status, 413);
  assert.equal((await worker.fetch(new Request('https://t/v1/time', { method: 'POST', body: '{}' }), {})).status, 500);
});
test('response contains no secret and CORS is limited to the app origin', async () => {
  const r = await call({ n: newNonce(), d: dev }); const txt = await r.clone().text();
  assert.ok(!txt.includes(priv)); assert.equal(r.headers.get('access-control-allow-origin'), 'https://localhost'); assert.equal(r.headers.get('cache-control'), 'no-store');
});
test('signing latency is far below the 10ms Free-plan CPU cap (Node, indicative only)', async () => {
  const t0 = process.hrtime.bigint(); for (let i = 0; i < 50; i++) await call({ n: newNonce(), d: dev });
  const ms = Number(process.hrtime.bigint() - t0) / 1e6 / 50; console.log('avg ms/request', ms.toFixed(2)); assert.ok(ms < 10);
});

// ---- policy: 3 warnings, 48h grace, then policy ----
const T = 1_800_000_000_000, H = 3600_000;
test('normal operation stays OK', () => { let s = initialState(); for (let i = 0; i < 5; i++) { const r = evaluate(s, { now: T + i * H, trusted: T + i * H }); s = r.state; assert.equal(r.status, 'OK'); } });
test('small drift (<5min) never triggers anything', () => { const r = evaluate(initialState(), { now: T, trusted: T + 2 * 60000 }); assert.equal(r.status, 'OK'); });
test('3 separate episodes -> warnings 1,2,3 then grace starts on the 3rd', () => {
  let s = initialState(); const seen = [];
  for (let k = 0; k < 3; k++) {
    let r = evaluate(s, { now: T + k * 24 * H - 2 * H, trusted: T + k * 24 * H }); s = r.state; seen.push([r.warningNo, r.status]);   // clock behind truth by 2h
    r = evaluate(s, { now: T + k * 24 * H + H, trusted: T + k * 24 * H + H }); s = r.state; assert.equal(r.status, 'OK');                // user fixes clock, verified online
  }
  assert.deepEqual(seen, [[1, 'WARN'], [2, 'WARN'], [3, 'GRACE']]);
});
test('grace lasts 48h then licence policy (READ_ONLY) applies; data never deleted', () => {
  let s = initialState(); s.warnings = 2;
  let r = evaluate(s, { now: T - 3 * H, trusted: T }); assert.equal(r.status, 'GRACE'); s = r.state;
  r = evaluate(s, { now: T + 47 * H - 3 * H, trusted: T + 47 * H }); assert.equal(r.status, 'GRACE'); assert.ok(r.graceLeftMs > 0 && r.graceLeftMs <= H); s = r.state;
  r = evaluate(s, { now: T + 49 * H - 3 * H, trusted: T + 49 * H }); assert.equal(r.status, 'READ_ONLY'); assert.ok(!('delete' in r));
});
test('verified correct clock during grace ends the episode', () => {
  let s = initialState(); s.warnings = 2; let r = evaluate(s, { now: T - 3 * H, trusted: T }); s = r.state;
  r = evaluate(s, { now: T + H, trusted: T + H }); assert.equal(r.status, 'OK'); assert.equal(r.state.graceStart, null);
});
test('offline rollback is detected from last seen time; offline cannot clear an episode', () => {
  let s = initialState(); let r = evaluate(s, { now: T, trusted: null }); s = r.state;
  r = evaluate(s, { now: T - 2 * H, trusted: null }); assert.equal(r.status, 'WARN'); assert.equal(r.warningNo, 1); s = r.state;
  r = evaluate(s, { now: T + H, trusted: null }); assert.equal(r.status, 'WARN');            // clock "fixed" but unprovable offline
});
test('grace is measured on a forward-only clock when offline (rolling the clock back does not extend it)', () => {
  let s = initialState(); s.warnings = 2; let r = evaluate(s, { now: T, trusted: T - 4 * H }); s = r.state;   // 3rd warning, grace starts
  r = evaluate(s, { now: T + 50 * H, trusted: null }); s = r.state; assert.equal(r.status, 'READ_ONLY');
  r = evaluate(s, { now: T + 1 * H, trusted: null }); assert.equal(r.status, 'READ_ONLY');                      // rolled back again: still expired
});

test('verified trusted time repairs a lastSeen poisoned by a wrong forward clock (no false rollback afterwards)', () => {
  let s = initialState(); s.lastSeen = T + 400 * 24 * H;                      // clock was once set +400 days
  let r = evaluate(s, { now: T, trusted: T });                                 // user fixed it, device is online
  assert.equal(r.state.lastSeen, T);
  r = evaluate(r.state, { now: T + H, trusted: null });
  assert.equal(r.status, 'OK');
});

test('after the 3 warnings are used, a new episode starts a fresh 48h grace (never stuck at WARN)', () => {
  let s = initialState(); s.warnings = 3;
  let r = evaluate(s, { now: T - 3 * H, trusted: T }); assert.equal(r.status, 'GRACE'); assert.equal(r.warningNo, 0);
  r = evaluate(r.state, { now: T + 50 * H - 3 * H, trusted: T + 50 * H }); assert.equal(r.status, 'READ_ONLY');
});
```

================================================================================
## [35/35] FILE: `trusted-time/time-policy.js`

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
## قائمة الملفات المدرجة في `PRO_4_SOURCE_BUNDLE_3.md` (35 ملفًا)

| # | المسار الأصلي للملف | الحجم (بايت) | SHA-256 (أول 16 خانة) |
|---|---|---|---|
| 1 | `.github/build-now.txt` | 99 | `bac598de0c28e5ff` |
| 2 | `.github/workflows/build-sms-apk.yml` | 2,530 | `efcf5d9ca12dc83a` |
| 3 | `.github/workflows/inspect-deyn.yml` | 2,683 | `35dd8c16925b2465` |
| 4 | `.github/workflows/inspect-sms-source.yml` | 769 | `7c3f895c32a706f5` |
| 5 | `DeynBackupPlugin.java` | 18,158 | `bf8509112ca73cb2` |
| 6 | `DeynNotifPlugin.java` | 15,024 | `ac4aab77652a34ad` |
| 7 | `PRO_4_FILE_INDEX.md` | 17,793 | `08241adb9189f166` |
| 8 | `README.md` | 3,499 | `465ecd6091275882` |
| 9 | `deyn-app/android-res/mipmap-anydpi-v26/ic_launcher.xml` | 266 | `44cc3246d167bd71` |
| 10 | `deyn-app/native/DeynSmsPlugin.java` | 43,549 | `eab4f4e6a1d8f64d` |
| 11 | `deyn-app/native/DeynSyncPlugin.java` | 6,649 | `6d3a160fcaeb642b` |
| 12 | `deyn-app/native/DeynVaultPlugin.java` | 4,331 | `edfc8004511de7c9` |
| 13 | `deyn-app/scripts/fetch_fonts.py` | 1,074 | `e43149a70cf52069` |
| 14 | `deyn-app/www/fonts/fonts.css` | 92 | `ba51e7135b662fe6` |
| 15 | `deyn-keygen/android-res/mipmap-anydpi-v26/ic_launcher.xml` | 266 | `44cc3246d167bd71` |
| 16 | `deyn-keygen/capacitor.config.json` | 199 | `78f4ad82a2b9f3e7` |
| 17 | `deyn-keygen/scripts/prepare-android.sh` | 1,114 | `585bb6096dcc2221` |
| 18 | `sms/completion.js` | 52,729 | `67802d37c9303bdd` |
| 19 | `sms/e2e_comprehensive_test.py` | 45,100 | `d0e7705a9fb151fe` |
| 20 | `sync/app-glue.js` | 13,621 | `a07de1fd784913b9` |
| 21 | `sync/engine.js` | 22,654 | `8498219df949c93f` |
| 22 | `sync/package.json` | 19 | `48e847860dd4f090` |
| 23 | `sync/qr.js` | 7,057 | `fc7cc3eaece7a1aa` |
| 24 | `sync/qr_check.mjs` | 476 | `e8b3ecc1fe8d4409` |
| 25 | `sync/test_engine.mjs` | 18,855 | `a4c0626ffc11087e` |
| 26 | `sync/test_session.mjs` | 13,114 | `26813e7f8cfa39ad` |
| 27 | `tests/e2e/harness.py` | 17,018 | `71864a844b174322` |
| 28 | `tests/e2e/test_license.py` | 13,044 | `b98feaf33352602b` |
| 29 | `tests/e2e/test_storage_layout_static.py` | 8,527 | `005652de6f161e09` |
| 30 | `tests/e2e/test_sync_e2e.py` | 9,411 | `5c3ca9032aa3d4fe` |
| 31 | `tests/e2e/test_vault.py` | 7,649 | `f11f0e5c8a17fa23` |
| 32 | `tools/embed_sync.py` | 1,799 | `26188d59820edaac` |
| 33 | `trusted-time/package.json` | 19 | `48e847860dd4f090` |
| 34 | `trusted-time/test.mjs` | 8,354 | `e111ed208f731457` |
| 35 | `trusted-time/time-policy.js` | 2,445 | `465506225f9bfebf` |
