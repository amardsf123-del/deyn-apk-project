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