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
