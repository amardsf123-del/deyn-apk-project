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
import android.os.PowerManager;
import android.provider.Settings;
import android.telephony.SmsManager;
import android.telephony.SmsMessage;
import android.telephony.SubscriptionManager;
import android.telephony.TelephonyManager;
import androidx.annotation.NonNull;
import androidx.work.Data;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ExistingWorkPolicy;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkInfo;
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
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.TimeZone;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
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
    /** Persistent per-reminder attempt counter (survives deferral/work re-creation; WorkManager's run-attempt count does not). */
    private static final String ATTEMPTS_PREFIX = "attempts_";
    private static final String NEXT_RETRY_PREFIX = "next_retry_at_";
    /** Written (and committed) IMMEDIATELY BEFORE SmsManager is called. Absent => the API was provably never reached. */
    private static final String API_CALLED_PREFIX = "api_called_";
    private static final String PREV_NEXT_PREFIX = "prev_next_send_";
    /** Time at which a pending WorkManager job for this id is expected to run, and why it waits. 0 = no pending job. */
    private static final String SCHED_FOR_PREFIX = "sched_for_";
    private static final String SCHED_REASON_PREFIX = "sched_reason_";
    public static final String WINDOW_END_MIN = "window_end_min";
    public static final String LAST_SCHEDULE_AT = "last_schedule_at";
    public static final String LAST_SCHEDULE_COUNT = "last_schedule_count";
    public static final String SWEEPER_NAME = "deyn_sms_sweeper";
    public static final int MAX_ATTEMPTS = 6;
    public static volatile long PERMISSION_RETRY_MS = 15L * 60000L;

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
        if (getPermissionState("sms") == PermissionState.GRANTED) {
            rescheduleActiveQueue(getContext());
        }
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

    /**
     * Replace the authoritative scheduled queue and persist its snapshot for reboot recovery.
     * The persisted snapshot (ACTIVE_QUEUE_JSON) is what workers read at send time, so a changed message
     * (partial payment) or a removed item (full payment / opt-out) takes effect without re-creating work.
     */
    @PluginMethod
    public void schedule(PluginCall call) {
        try {
            Context context = getContext();
            ensureDynamicReceiver(context);
            JSArray items = call.getArray("items", new JSArray());
            boolean force = Boolean.TRUE.equals(call.getBoolean("force", false));
            int windowEnd = call.getInt("windowEndMinutes", 22 * 60);
            windowEnd = Math.max(9 * 60 + 1, Math.min(23 * 60 + 59, windowEnd));
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
            long now = System.currentTimeMillis();
            synchronized (LOCK) {
                SharedPreferences.Editor ed = prefs(context).edit()
                    .putStringSet(ACTIVE, active)
                    .putStringSet(ACTIVE_PAYLOADS, activePayloads)
                    .putString(ACTIVE_QUEUE_JSON, persistedQueue.toString())
                    .putInt(WINDOW_END_MIN, windowEnd)
                    .putLong(LAST_SCHEDULE_AT, now)
                    .putInt(LAST_SCHEDULE_COUNT, active.size());
                for (String oldId : previousActive) {
                    if (!active.contains(oldId)) ed.putLong(SCHED_FOR_PREFIX + oldId, 0L).remove(SCHED_REASON_PREFIX + oldId);
                }
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
            int queued = enqueueQueueItems(context, persistedQueue, active, now, force);
            ensureSweeper(context);
            JSObject out = new JSObject();
            out.put("count", queued);
            out.put("active", active.size());
            out.put("replacedActiveItems", true);
            call.resolve(out);
        } catch (Exception e) {
            call.reject("SMS scheduling failed: " + e.getClass().getSimpleName() + (e.getMessage() != null ? " (" + e.getMessage() + ")" : ""));
        }
    }

    /** Owner-initiated retry of a failed / partial / uncertain reminder (the only path that may re-send an ambiguous message). */
    @PluginMethod
    public void release(PluginCall call) {
        String id = call.getString("id");
        if (id == null || id.trim().isEmpty()) { call.reject("Missing id"); return; }
        id = id.trim();
        Context context = getContext();
        JSObject out = new JSObject();
        boolean active;
        synchronized (LOCK) {
            SharedPreferences sp = prefs(context);
            if (sp.getStringSet(SENT, new HashSet<>()).contains(id) || STATUS_DELIVERED.equals(sp.getString(STATUS_PREFIX + id, ""))) {
                out.put("released", false);
                out.put("reason", "already_sent");
                call.resolve(out);
                return;
            }
            Set<String> claimed = new HashSet<>(sp.getStringSet(CLAIMED, new HashSet<>()));
            Set<String> partial = new HashSet<>(sp.getStringSet(PARTIAL, new HashSet<>()));
            Set<String> failed = new HashSet<>(sp.getStringSet(FAILED, new HashSet<>()));
            claimed.remove(id); partial.remove(id); failed.remove(id);
            sp.edit().putStringSet(CLAIMED, claimed).putStringSet(PARTIAL, partial).putStringSet(FAILED, failed)
                .remove(STATUS_PREFIX + id).remove(LAST_ERROR_PREFIX + id).remove(API_CALLED_PREFIX + id)
                .putInt(ATTEMPTS_PREFIX + id, 0).putLong(NEXT_RETRY_PREFIX + id, 0L).putLong(SCHED_FOR_PREFIX + id, 0L).commit();
            active = sp.getStringSet(ACTIVE, new HashSet<>()).contains(id);
        }
        if (active) {
            enqueueItemWork(WorkManager.getInstance(context), "deyn_sms_", id, 0L, ExistingWorkPolicy.REPLACE);
            setSched(context, id, System.currentTimeMillis(), "scheduled");
        }
        out.put("released", true);
        out.put("requeued", active);
        call.resolve(out);
    }

    /** Privacy-safe state dump for the owner's diagnostics screen: no message bodies, no names, masked numbers. */
    @PluginMethod
    public void getDiagnostics(final PluginCall call) {
        final Context context = getContext();
        SEND_EXECUTOR.execute(() -> {
            try {
                call.resolve(buildDiagnostics(context));
            } catch (Throwable t) {
                call.reject("Diagnostics failed: " + t.getClass().getSimpleName());
            }
        });
    }

    static JSObject buildDiagnostics(Context context) {
        JSObject out = new JSObject();
        long now = System.currentTimeMillis();
        out.put("now", now);
        out.put("sdk", Build.VERSION.SDK_INT);
        out.put("permissionSendSms", context.checkSelfPermission(Manifest.permission.SEND_SMS) == PackageManager.PERMISSION_GRANTED);
        TimeZone tz = TimeZone.getDefault();
        out.put("timezone", tz.getID());
        out.put("utcOffsetMinutes", tz.getOffset(now) / 60000);
        try { out.put("manufacturer", Build.MANUFACTURER); } catch (Throwable ignored) {}
        try { out.put("smsSubscriptionId", SmsManager.getDefaultSmsSubscriptionId()); } catch (Throwable ignored) {}
        try {
            TelephonyManager tm = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
            if (tm != null) out.put("simState", tm.getSimState());
        } catch (Throwable ignored) {}
        try { out.put("airplaneMode", Settings.Global.getInt(context.getContentResolver(), Settings.Global.AIRPLANE_MODE_ON, 0) == 1); } catch (Throwable ignored) {}
        try {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                out.put("ignoringBatteryOptimizations", pm.isIgnoringBatteryOptimizations(context.getPackageName()));
                out.put("deviceIdle", pm.isDeviceIdleMode());
            }
        } catch (Throwable ignored) {}
        SharedPreferences sp = prefs(context);
        JSArray queue = new JSArray();
        synchronized (LOCK) {
            reconcileStaleInFlightLocked(sp, now);
            out.put("windowEndMinutes", sp.getInt(WINDOW_END_MIN, 22 * 60));
            out.put("nextSendAt", sp.getLong(NEXT_SEND_AT, 0L));
            out.put("lastScheduleAt", sp.getLong(LAST_SCHEDULE_AT, 0L));
            out.put("lastScheduleCount", sp.getInt(LAST_SCHEDULE_COUNT, 0));
            try {
                JSONArray q = new JSONArray(sp.getString(ACTIVE_QUEUE_JSON, "[]"));
                for (int i = 0; i < q.length(); i++) {
                    JSONObject it = q.getJSONObject(i);
                    String id = it.optString("id", "");
                    JSObject row = new JSObject();
                    row.put("ref", shortRef(id));
                    row.put("to", maskPhone(it.optString("phone", "")));
                    row.put("at", it.optLong("at", 0L));
                    String rowSt = sp.getString(STATUS_PREFIX + id, "queued");
                    row.put("status", rowSt);
                    row.put("sentConfirmed", STATUS_SENT_TO_NETWORK.equals(rowSt) || STATUS_DELIVERED.equals(rowSt));
                    row.put("attempts", sp.getInt(ATTEMPTS_PREFIX + id, 0));
                    row.put("nextRetryAt", sp.getLong(NEXT_RETRY_PREFIX + id, 0L));
                    row.put("pendingJobAt", sp.getLong(SCHED_FOR_PREFIX + id, 0L));
                    row.put("pendingJobReason", sp.getString(SCHED_REASON_PREFIX + id, ""));
                    row.put("partsTotal", sp.getInt(PARTS_TOTAL_PREFIX + id, 0));
                    row.put("partsSent", sp.getStringSet(PARTS_SENT_SET_PREFIX + id, new HashSet<>()).size());
                    row.put("partsFailed", sp.getStringSet(PARTS_FAILED_SET_PREFIX + id, new HashSet<>()).size());
                    row.put("partsDelivered", sp.getStringSet(PARTS_DELIVERED_SET_PREFIX + id, new HashSet<>()).size());
                    String err = sp.getString(LAST_ERROR_PREFIX + id, "");
                    if (!err.isEmpty()) row.put("error", err);
                    queue.put(row);
                }
            } catch (Exception ignored) {}
        }
        // WorkManager state is read OUTSIDE the lock (the future completes on WorkManager's own executor).
        try {
            WorkManager wm = WorkManager.getInstance(context);
            for (int i = 0; i < queue.length(); i++) {
                JSONObject row = queue.getJSONObject(i);
                String ref = row.optString("ref", "");
                String id = refToId(sp, ref);
                if (id == null) continue;
                row.put("workState", uniqueWorkState(wm, "deyn_sms_" + id));
                row.put("deferredWorkState", uniqueWorkState(wm, "deyn_sms_deferred_" + id));
            }
            out.put("sweeperState", uniqueWorkState(wm, SWEEPER_NAME));
        } catch (Throwable ignored) {}
        out.put("queue", queue);
        return out;
    }

    private static String uniqueWorkState(WorkManager wm, String name) {
        try {
            Future<List<WorkInfo>> f = wm.getWorkInfosForUniqueWork(name);
            List<WorkInfo> infos = f.get(1500, TimeUnit.MILLISECONDS);
            if (infos == null || infos.isEmpty()) return "NONE";
            String best = "NONE";
            for (WorkInfo wi : infos) {
                String st = String.valueOf(wi.getState());
                if ("ENQUEUED".equals(st) || "RUNNING".equals(st) || "BLOCKED".equals(st)) return st;
                best = st;
            }
            return best;
        } catch (Throwable t) {
            return "UNKNOWN";
        }
    }

    static String shortRef(String id) {
        try {
            byte[] d = MessageDigest.getInstance("SHA-256").digest(id.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 4; i++) sb.append(String.format(Locale.ROOT, "%02x", d[i] & 0xff));
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            return "????????";
        }
    }

    private static String refToId(SharedPreferences sp, String ref) {
        try {
            JSONArray q = new JSONArray(sp.getString(ACTIVE_QUEUE_JSON, "[]"));
            for (int i = 0; i < q.length(); i++) {
                String id = q.getJSONObject(i).optString("id", "");
                if (shortRef(id).equals(ref)) return id;
            }
        } catch (Exception ignored) {}
        return null;
    }

    static String maskPhone(String p) {
        if (p == null) return "";
        String digits = p.replaceAll("[^0-9+]", "");
        if (digits.length() <= 4) return "****";
        return digits.substring(0, Math.min(4, digits.length() - 3)) + "•••" + digits.substring(digits.length() - 3);
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

    static long backoffMs(int attempts) {
        long unit = BACKOFF_UNIT_MS;
        long ms = unit << Math.max(0, Math.min(attempts - 1, 10));
        return Math.min(ms, 30L * unit);
    }
    /** 1 minute in production; tests shrink it. */
    public static volatile long BACKOFF_UNIT_MS = 60000L;
    /** A per-reminder job that should have run this long ago is considered lost; the periodic sweeper takes over. */
    public static volatile long STALE_JOB_MS = 20L * 60000L;

    static void enqueueItemWork(WorkManager wm, String namePrefix, String id, long delayMs, ExistingWorkPolicy policy) {
        Data data = new Data.Builder().putString("id", id).build();
        OneTimeWorkRequest request = new OneTimeWorkRequest.Builder(SmsWorker.class)
            .setInitialDelay(Math.max(0L, delayMs), TimeUnit.MILLISECONDS)
            .setInputData(data)
            .addTag(TAG)
            .build();
        wm.enqueueUniqueWork(namePrefix + id, policy, request);
    }

    static void setSched(Context c, String id, long when, String reason) {
        synchronized (LOCK) {
            prefs(c).edit().putLong(SCHED_FOR_PREFIX + id, when).putString(SCHED_REASON_PREFIX + id, reason).commit();
        }
    }

    static void clearSched(Context c, String id) {
        synchronized (LOCK) {
            prefs(c).edit().putLong(SCHED_FOR_PREFIX + id, 0L).remove(SCHED_REASON_PREFIX + id).commit();
        }
    }

    /**
     * (Re)enqueue per-reminder jobs. A job that is already pending and will run no later than needed (or that the worker itself
     * deferred for a native rule: sending window, shop-wide gap, retry back-off, missing permission) is left alone, so routine
     * saves do not churn, delay or cancel running work. {@code force} (app start, boot, permission grant) re-creates every job;
     * workers re-evaluate every rule on each run, so this is always safe.
     */
    static int enqueueQueueItems(Context context, JSONArray queue, Set<String> active, long now, boolean force) throws Exception {
        WorkManager wm = WorkManager.getInstance(context);
        int queued = 0;
        for (int i = 0; i < queue.length(); i++) {
            JSONObject item = queue.getJSONObject(i);
            String id = item.getString("id");
            if (!active.contains(id) || isTerminalOrInFlight(context, id)) continue;
            long at = item.getLong("at");
            long schedFor; String reason;
            synchronized (LOCK) {
                SharedPreferences sp = prefs(context);
                schedFor = sp.getLong(SCHED_FOR_PREFIX + id, 0L);
                reason = sp.getString(SCHED_REASON_PREFIX + id, "");
            }
            boolean nativeGoverned = "window".equals(reason) || "gap".equals(reason) || "retry".equals(reason) || "permission".equals(reason);
            long target = Math.max(at, now);
            if (!force && schedFor > 0L && (nativeGoverned || Math.abs(schedFor - target) <= 1000L)) continue;
            long delay = Math.max(0L, at - now);
            enqueueItemWork(wm, "deyn_sms_", id, delay, ExistingWorkPolicy.REPLACE);
            wm.cancelUniqueWork("deyn_sms_deferred_" + id);
            setSched(context, id, now + delay, "scheduled");
            queued++;
        }
        return queued;
    }

    /** Boot / app update / permission grant / app start: restore every pending reminder from the persisted queue. */
    public static int rescheduleActiveQueue(Context context) {
        if (context == null) return 0;
        try {
            SharedPreferences sp = prefs(context);
            String raw; Set<String> active;
            synchronized (LOCK) {
                reconcileStaleInFlightLocked(sp, System.currentTimeMillis());
                raw = sp.getString(ACTIVE_QUEUE_JSON, "[]");
                active = new HashSet<>(sp.getStringSet(ACTIVE, new HashSet<>()));
            }
            ensureSweeper(context);
            if (active.isEmpty() || raw == null || raw.isEmpty()) return 0;
            return enqueueQueueItems(context, new JSONArray(raw), active, System.currentTimeMillis(), true);
        } catch (Exception e) {
            return 0;
        }
    }

    /** Self-healing safety net: a 15-minute periodic job that sends/re-enqueues any due reminder whose one-time job was lost. */
    static void ensureSweeper(Context context) {
        try {
            PeriodicWorkRequest request = new PeriodicWorkRequest.Builder(SmsSweepWorker.class, 15, TimeUnit.MINUTES)
                .addTag(TAG)
                .build();
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(SWEEPER_NAME, ExistingPeriodicWorkPolicy.KEEP, request);
        } catch (Throwable ignored) {}
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
            if (STATUS_FAILED.equals(st) && sp.getInt(ATTEMPTS_PREFIX + id, 0) >= MAX_ATTEMPTS) return true;
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
        Set<String> failedIds = new HashSet<>(sp.getStringSet(FAILED, new HashSet<>()));
        SharedPreferences.Editor ed = sp.edit();
        for (String id : new HashSet<>(claimed)) {
            String st = sp.getString(STATUS_PREFIX + id, STATUS_ATTEMPTING);
            long attemptAt = sp.getLong(ATTEMPT_AT_PREFIX + id, 0L);
            long acceptedAt = sp.getLong(ACCEPTED_AT_PREFIX + id, attemptAt);
            long ref = Math.max(attemptAt, acceptedAt);
            if ((STATUS_ATTEMPTING.equals(st) || STATUS_ACCEPTED.equals(st)) && ref > 0L && (now - ref) > STALE_INFLIGHT_MS
                    && sp.getLong(API_CALLED_PREFIX + id, 0L) <= 0L) {
                // The marker is committed right before SmsManager is called, so its absence proves nothing was handed to Android:
                // release the claim so the reminder is retried instead of being stuck as "uncertain" forever.
                ed.putString(STATUS_PREFIX + id, STATUS_FAILED)
                  .putString(LAST_ERROR_PREFIX + id, "never_dispatched")
                  .putLong(NEXT_RETRY_PREFIX + id, 0L);
                claimed.remove(id);
                failedIds.add(id);
                dirty = true;
                continue;
            }
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
            ed.putStringSet(CLAIMED, claimed).putStringSet(FAILED, failedIds).commit();
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
                .remove(LAST_ERROR_PREFIX + id)
                .remove(API_CALLED_PREFIX + id);
            if (!preEdit.commit()) {
                throw new IllegalStateException("Could not persist SMS attempt state");
            }

            ArrayList<PendingIntent> sentIntents = new ArrayList<>(totalParts);
            ArrayList<PendingIntent> deliveryIntents = new ArrayList<>(totalParts);
            for (int i = 0; i < totalParts; i++) {
                sentIntents.add(buildPartBroadcastIntent(c, ACTION_SMS_SENT, id, i, totalParts, attemptAt));
                deliveryIntents.add(buildPartBroadcastIntent(c, ACTION_SMS_DELIVERED, id, i, totalParts, attemptAt));
            }

            if (!sp.edit().putLong(API_CALLED_PREFIX + id, System.currentTimeMillis())
                    .putLong(PREV_NEXT_PREFIX + id, sp.getLong(NEXT_SEND_AT, 0L)).commit()) {
                throw new IllegalStateException("Could not persist SMS dispatch marker");
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
        int attemptsDone = sp.getInt(ATTEMPTS_PREFIX + id, 0);
        item.put("attempts", attemptsDone);
        item.put("nextRetryAt", sp.getLong(NEXT_RETRY_PREFIX + id, 0L));
        item.put("exhausted", STATUS_FAILED.equals(st) && attemptsDone >= MAX_ATTEMPTS);
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
            long retryAtForFailure = 0L;
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
                    // Complete failure: 0 parts sent. Release claim; a bounded back-off retry is scheduled below.
                    ed.putString(STATUS_PREFIX + id, STATUS_FAILED);
                    int attemptsNow = sp.getInt(ATTEMPTS_PREFIX + id, 0) + 1;
                    ed.putInt(ATTEMPTS_PREFIX + id, attemptsNow);
                    long prevNext = sp.getLong(PREV_NEXT_PREFIX + id, 0L);
                    if (sp.getLong(NEXT_SEND_AT, 0L) > prevNext) ed.putLong(NEXT_SEND_AT, prevNext);
                    if (attemptsNow < MAX_ATTEMPTS && sp.getStringSet(ACTIVE, new HashSet<>()).contains(id)) {
                        retryAtForFailure = now + backoffMs(attemptsNow);
                        ed.putLong(NEXT_RETRY_PREFIX + id, retryAtForFailure)
                          .putLong(SCHED_FOR_PREFIX + id, retryAtForFailure).putString(SCHED_REASON_PREFIX + id, "retry");
                    }
                    sentIds.remove(id);
                    partialIds.remove(id);
                    failedIds.add(id);
                    ed.putStringSet(SENT, sentIds).putStringSet(PARTIAL, partialIds).putStringSet(FAILED, failedIds);
                }
            }
            ed.commit();
            if (retryAtForFailure > 0L) {
                try {
                    enqueueItemWork(WorkManager.getInstance(context), "deyn_sms_deferred_", id, retryAtForFailure - System.currentTimeMillis(), ExistingWorkPolicy.REPLACE);
                } catch (Throwable ignored) {}
            }
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

    /** Result of evaluating one reminder: finished, or "come back at retryAt because of reason". */
    static final class Outcome {
        final boolean done; final boolean leave; final long retryAt; final String reason;
        private Outcome(boolean done, boolean leave, long retryAt, String reason) { this.done = done; this.leave = leave; this.retryAt = retryAt; this.reason = reason; }
        static Outcome done(String reason) { return new Outcome(true, false, 0L, reason); }
        static Outcome leave(String reason) { return new Outcome(true, true, 0L, reason); }
        static Outcome waitUntil(long at, String reason) { return new Outcome(false, false, at, reason); }
    }

    private static long nextWindowStart(Calendar cal) {
        cal.set(Calendar.HOUR_OF_DAY, 9);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        return cal.getTimeInMillis();
    }

    /**
     * The single code path used by the per-reminder worker AND the periodic sweeper. Re-validates, from the persisted
     * authoritative queue, everything that can have changed since the job was created, then sends exactly once.
     */
    static Outcome processItem(Context context, String id, boolean awaitResult) {
        if (context.checkSelfPermission(Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
            synchronized (LOCK) { prefs(context).edit().putString(LAST_ERROR_PREFIX + id, "permission_denied").commit(); }
            return Outcome.waitUntil(System.currentTimeMillis() + PERMISSION_RETRY_MS, "permission");
        }
        String phone; String message; long at; int gap;
        DispatchResult dispatchResult;
        // The checks AND the dispatch share one critical section: the shop-wide gap / duplicate guards must be atomic.
        synchronized (LOCK) {
            SharedPreferences sp = prefs(context);
            long now = System.currentTimeMillis();
            reconcileStaleInFlightLocked(sp, now);
            if (!sp.getStringSet(ACTIVE, new HashSet<>()).contains(id)) return Outcome.done("inactive");
            JSONObject item = findActiveItemLocked(sp, id);
            if (item == null) return Outcome.done("inactive");
            if (isTerminalOrInFlight(context, id)) return Outcome.done("terminal");
            phone = item.optString("phone", "");
            message = item.optString("message", "");
            at = item.optLong("at", 0L);
            gap = Math.max(1, Math.min(60, item.optInt("gapMinutes", 5)));
            if (phone.isEmpty() || message.trim().isEmpty() || at <= 0L) return Outcome.done("invalid");
            if (now < at) return Outcome.waitUntil(at, "not_due");
            Calendar cal = Calendar.getInstance();
            int minutes = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE);
            int endMin = sp.getInt(WINDOW_END_MIN, 22 * 60);
            if (minutes < 9 * 60) {
                return Outcome.waitUntil(nextWindowStart(cal), "window");
            } else if (minutes > endMin) {
                cal.add(Calendar.DAY_OF_MONTH, 1);
                return Outcome.waitUntil(nextWindowStart(cal), "window");
            }
            long retryAt = sp.getLong(NEXT_RETRY_PREFIX + id, 0L);
            if (retryAt > now) return Outcome.waitUntil(retryAt, "retry");
            long next = sp.getLong(NEXT_SEND_AT, 0L);
            if (next > now) return Outcome.waitUntil(next, "gap");
            if (STATUS_FAILED.equals(sp.getString(STATUS_PREFIX + id, "")) && sp.getInt(ATTEMPTS_PREFIX + id, 0) >= MAX_ATTEMPTS) {
                return Outcome.done("exhausted");
            }
            try {
                dispatchResult = dispatchOnce(context, id, phone, message, true, at, gap);
            } catch (SecurityException se) {
                prefs(context).edit().putString(LAST_ERROR_PREFIX + id, "permission_denied").commit();
                return Outcome.waitUntil(System.currentTimeMillis() + PERMISSION_RETRY_MS, "permission");
            } catch (Exception e) {
                SharedPreferences sp2 = prefs(context);
                int attempts = sp2.getInt(ATTEMPTS_PREFIX + id, 0) + 1;
                long retryAt2 = System.currentTimeMillis() + backoffMs(attempts);
                sp2.edit().putInt(ATTEMPTS_PREFIX + id, attempts).putLong(NEXT_RETRY_PREFIX + id, retryAt2).commit();
                return attempts >= MAX_ATTEMPTS ? Outcome.done("exhausted") : Outcome.waitUntil(retryAt2, "retry");
            }
        }
        if (!dispatchResult.dispatched) return Outcome.done(dispatchResult.status);
        if (!awaitResult) return Outcome.done("dispatched");
        JSObject outcome = awaitDispatchOutcome(context, id, WAIT_FOR_RADIO_MS);
        if (STATUS_FAILED.equals(outcome.getString("status"))) {
            return Outcome.leave("failed"); // handlePartSent already persisted the attempt and scheduled the back-off retry
        }
        return Outcome.done("dispatched");
    }

    private static JSONObject findActiveItemLocked(SharedPreferences sp, String id) {
        try {
            JSONArray q = new JSONArray(sp.getString(ACTIVE_QUEUE_JSON, "[]"));
            for (int i = 0; i < q.length(); i++) {
                JSONObject o = q.getJSONObject(i);
                if (id.equals(o.optString("id", ""))) return o;
            }
        } catch (Exception ignored) {}
        return null;
    }

    private static void applyOutcome(Context context, String id, Outcome o) {
        if (o.leave) return;
        if (o.done) {
            clearSched(context, id);
            return;
        }
        setSched(context, id, o.retryAt, o.reason);
        enqueueItemWork(WorkManager.getInstance(context), "deyn_sms_deferred_", id, o.retryAt - System.currentTimeMillis(), ExistingWorkPolicy.REPLACE);
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
            String id = getInputData().getString("id");
            if (id == null || id.isEmpty()) return Result.failure();
            try {
                applyOutcome(context, id, processItem(context, id, true));
                return Result.success();
            } catch (Throwable t) {
                // Unexpected failure: never drop the reminder; WorkManager retries with its own back-off.
                return getRunAttemptCount() < 8 ? Result.retry() : Result.failure();
            }
        }
    }

    /** Periodic safety net (15 min, survives reboot): picks up any due reminder whose one-time job is missing or stale. */
    public static class SmsSweepWorker extends androidx.work.Worker {
        public SmsSweepWorker(@NonNull Context context, @NonNull androidx.work.WorkerParameters params) {
            super(context, params);
        }

        @NonNull
        @Override
        public Result doWork() {
            sweep(getApplicationContext());
            return Result.success();
        }
    }

    static void sweep(Context context) {
        ensureDynamicReceiver(context);
        List<String> ids = new ArrayList<>();
        synchronized (LOCK) {
            try {
                JSONArray q = new JSONArray(prefs(context).getString(ACTIVE_QUEUE_JSON, "[]"));
                for (int i = 0; i < q.length(); i++) ids.add(q.getJSONObject(i).optString("id", ""));
            } catch (Exception ignored) {}
        }
        for (String id : ids) {
            if (id.isEmpty() || isTerminalOrInFlight(context, id)) continue;
            long schedFor; long at = 0L;
            synchronized (LOCK) {
                SharedPreferences sp = prefs(context);
                schedFor = sp.getLong(SCHED_FOR_PREFIX + id, 0L);
                JSONObject it = findActiveItemLocked(sp, id);
                if (it != null) at = it.optLong("at", 0L);
            }
            long now = System.currentTimeMillis();
            boolean jobMissing = schedFor == 0L;
            boolean jobStale = schedFor > 0L && schedFor < now - STALE_JOB_MS;
            if (!jobMissing && !jobStale) continue;
            try {
                Outcome o = processItem(context, id, true);
                applyOutcome(context, id, o);
                if (o.done && "dispatched".equals(o.reason)) break; // one send per sweep; the shop-wide gap would defer the rest anyway
            } catch (Throwable ignored) {}
        }
    }
}
