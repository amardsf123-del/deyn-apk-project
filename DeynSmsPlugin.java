package com.deyn.app;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.telephony.SmsManager;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.work.Data;
import androidx.work.ExistingWorkPolicy;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PermissionState;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.concurrent.TimeUnit;

@CapacitorPlugin(name = "DeynSms", permissions = {
    @Permission(strings = { Manifest.permission.SEND_SMS }, alias = "sms")
})
public class DeynSmsPlugin extends Plugin {
    private static final String PREFS = "deyn_sms";
    private static final String SENT = "sent_ids";
    private static final String CLAIMED = "claimed_ids";
    private static final String SENT_AT_PREFIX = "sent_at_";
    private static final String ACTIVE = "active_ids";
    private static final String ACTIVE_PAYLOADS = "active_payloads";
    private static final String NEXT_SEND_AT = "next_send_at";
    private static final String TAG = "deyn_sms_queue";
    private static final Object LOCK = new Object();

    @PluginMethod public void checkPermissions(PluginCall call) { call.resolve(permissionState()); }
    @PluginMethod public void requestPermissions(PluginCall call) {
        if (getPermissionState("sms") == PermissionState.GRANTED) { call.resolve(permissionState()); return; }
        requestPermissionForAlias("sms", call, "permissionCallback");
    }
    @PermissionCallback private void permissionCallback(PluginCall call) { call.resolve(permissionState()); }
    private JSObject permissionState() {
        JSObject out = new JSObject();
        out.put("sms", getPermissionState("sms") == PermissionState.GRANTED ? "granted" : "denied");
        return out;
    }

    @PluginMethod public void send(PluginCall call) {
        if (getPermissionState("sms") != PermissionState.GRANTED) { call.reject("SMS permission not granted"); return; }
        String id = call.getString("id"), phone = call.getString("phone"), message = call.getString("message");
        if (id == null || id.trim().isEmpty() || phone == null || message == null || message.trim().isEmpty()) { call.reject("Missing SMS id, phone or message"); return; }
        try {
            boolean accepted = sendOnce(getContext(), id, phone, message, false, 0L, 0);
            JSObject out = new JSObject(); out.put("sent", accepted); out.put("duplicate", !accepted);
            out.put("status", accepted ? "accepted_by_android" : "already_accepted"); call.resolve(out);
        } catch (Exception e) { call.reject("SMS send failed: " + e.getClass().getSimpleName()); }
    }

    /** Replace the entire authoritative queue. Removed/edited items are invalidated before new work is enqueued. */
    @PluginMethod public void schedule(PluginCall call) {
        try {
            Context context = getContext();
            JSArray items = call.getArray("items", new JSArray());
            Set<String> active = new HashSet<>(); Set<String> activePayloads = new HashSet<>();
            for (int i = 0; i < items.length(); i++) {
                JSONObject item = items.getJSONObject(i);
                String id = item.optString("id", ""), phone = item.optString("phone", ""), message = item.optString("message", "");
                long at = item.optLong("at", 0L);
                if (!id.isEmpty() && !phone.isEmpty() && !message.isEmpty() && at > 0) {
                    active.add(id); activePayloads.add(payloadKey(id, phone, message, at));
                }
            }
            synchronized (LOCK) {
                if (!prefs(context).edit().putStringSet(ACTIVE, active).putStringSet(ACTIVE_PAYLOADS, activePayloads).commit()) throw new IllegalStateException("Could not persist active queue");
            }
            WorkManager wm = WorkManager.getInstance(context);
            wm.cancelAllWorkByTag(TAG);
            long now = System.currentTimeMillis(); int queued = 0;
            for (int i = 0; i < items.length(); i++) {
                JSONObject item = items.getJSONObject(i);
                String id = item.getString("id");
                if (!active.contains(id) || wasSent(context, id)) continue;
                long at = item.getLong("at");
                long delay = Math.max(0L, at - now);
                Data data = new Data.Builder().putString("id", id).putString("phone", item.getString("phone"))
                    .putString("message", item.getString("message")).putLong("at", at)
                    .putInt("gap", Math.max(1, Math.min(60, item.optInt("gapMinutes", 5)))).build();
                OneTimeWorkRequest request = new OneTimeWorkRequest.Builder(SmsWorker.class)
                    .setInitialDelay(delay, TimeUnit.MILLISECONDS).setInputData(data).addTag(TAG).build();
                wm.enqueueUniqueWork("deyn_sms_" + id, ExistingWorkPolicy.REPLACE, request); queued++;
            }
            JSObject out = new JSObject(); out.put("count", queued); out.put("cancelledAndReplaced", true); call.resolve(out);
        } catch (Exception e) { call.reject("SMS scheduling failed: " + e.getClass().getSimpleName()); }
    }

    @PluginMethod public void getSent(PluginCall call) {
        Set<String> ids = new HashSet<>(prefs(getContext()).getStringSet(SENT, new HashSet<>()));
        JSArray array = new JSArray(); JSArray items = new JSArray(); JSArray uncertain = new JSArray(); SharedPreferences sp = prefs(getContext());
        for (String id : ids) { array.put(id); JSObject item = new JSObject(); item.put("id", id); item.put("acceptedAt", sp.getLong(SENT_AT_PREFIX + id, 0L)); item.put("status", "accepted_by_android"); items.put(item); }
        for (String id : sp.getStringSet(CLAIMED, new HashSet<>())) { JSObject item = new JSObject(); item.put("id", id); item.put("status", "dispatch_uncertain"); uncertain.put(item); }
        JSObject out = new JSObject(); out.put("ids", array); out.put("items", items); out.put("uncertain", uncertain); call.resolve(out);
    }


    private static String payloadKey(String id, String phone, String message, long at) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(message.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte b : digest) hex.append(String.format(java.util.Locale.ROOT, "%02x", b & 0xff));
            return id + "\n" + phone + "\n" + at + "\n" + hex;
        } catch (NoSuchAlgorithmException e) { throw new IllegalStateException("SHA-256 unavailable", e); }
    }

    private static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }
    private static boolean wasSent(Context c, String id) { return prefs(c).getStringSet(SENT, new HashSet<>()).contains(id); }

    /** At-most-once dispatch. The ID is durably claimed before dispatch so concurrent workers cannot duplicate a text. */
    private static boolean sendOnce(Context c, String id, String phone, String message, boolean requireActive, long scheduledAt, int gapMinutes) {
        synchronized (LOCK) {
            SharedPreferences sp = prefs(c);
            Set<String> sent = new HashSet<>(sp.getStringSet(SENT, new HashSet<>()));
            Set<String> claimed = new HashSet<>(sp.getStringSet(CLAIMED, new HashSet<>()));
            if (requireActive) {
                String payload = payloadKey(id, phone, message, scheduledAt);
                if (!sp.getStringSet(ACTIVE, new HashSet<>()).contains(id) || !sp.getStringSet(ACTIVE_PAYLOADS, new HashSet<>()).contains(payload)) return false;
            }
            if (sent.contains(id)) return false;
            if (claimed.contains(id)) {
                if (requireActive && gapMinutes > 0) sp.edit().putLong(NEXT_SEND_AT, Math.max(sp.getLong(NEXT_SEND_AT, 0L), System.currentTimeMillis() + gapMinutes * 60000L)).commit();
                return false;
            }
            claimed.add(id);
            if (!sp.edit().putStringSet(CLAIMED, claimed).commit()) throw new IllegalStateException("Could not persist SMS idempotency claim");
            SmsManager manager;
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) manager = c.getSystemService(SmsManager.class);
                else manager = SmsManager.getDefault();
                if (manager == null) throw new IllegalStateException("SMS service unavailable");
                ArrayList<String> parts = manager.divideMessage(message);
                manager.sendMultipartTextMessage(phone, null, parts, null, null);
            } catch (Exception e) {
                // A failed API dispatch is not reported as accepted. Remove the claim so WorkManager may retry.
                claimed.remove(id); sp.edit().putStringSet(CLAIMED, claimed).commit(); throw e;
            }
            // Keep the durable claim if this write fails: an uncertain dispatch must never be retried as a duplicate.
            sent.add(id); claimed.remove(id);
            long acceptedAt = System.currentTimeMillis();
            SharedPreferences.Editor accepted = sp.edit().putStringSet(SENT, sent).putStringSet(CLAIMED, claimed).putLong(SENT_AT_PREFIX + id, acceptedAt);
            if (requireActive && gapMinutes > 0) accepted.putLong(NEXT_SEND_AT, acceptedAt + gapMinutes * 60000L);
            if (!accepted.commit()) throw new IllegalStateException("Could not persist SMS acceptance status");
            return true;
        }
    }

    private static void enqueueDeferred(Context context, Data original, String id, long at) {
        Data data = new Data.Builder().putString("id", original.getString("id"))
            .putString("phone", original.getString("phone")).putString("message", original.getString("message"))
            .putLong("at", original.getLong("at", 0L)).putInt("gap", original.getInt("gap", 5)).build();
        long delay = Math.max(0L, at - System.currentTimeMillis());
        OneTimeWorkRequest request = new OneTimeWorkRequest.Builder(SmsWorker.class)
            .setInitialDelay(delay, TimeUnit.MILLISECONDS).setInputData(data).addTag(TAG).build();
        String unique = "deyn_sms_deferred_" + Integer.toHexString(id.hashCode()) + "_" + at;
        WorkManager.getInstance(context).enqueueUniqueWork(unique, ExistingWorkPolicy.KEEP, request);
    }

    public static class SmsWorker extends androidx.work.Worker {
        public SmsWorker(@NonNull Context context, @NonNull androidx.work.WorkerParameters params) { super(context, params); }
        @NonNull @Override public Result doWork() {
            Context context = getApplicationContext();
            if (context.checkSelfPermission(Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) return Result.failure();
            String id = getInputData().getString("id"), phone = getInputData().getString("phone"), message = getInputData().getString("message");
            long at = getInputData().getLong("at", 0L); int gap = Math.max(1, Math.min(60, getInputData().getInt("gap", 5)));
            if (id == null || phone == null || message == null || at <= 0) return Result.failure();
            synchronized (LOCK) {
                SharedPreferences sp = prefs(context);
                Set<String> active = new HashSet<>(sp.getStringSet(ACTIVE, new HashSet<>()));
                if (!active.contains(id) || wasSent(context, id)) return Result.success();
                long now = System.currentTimeMillis(); java.util.Calendar cal = java.util.Calendar.getInstance();
                int minutes = cal.get(java.util.Calendar.HOUR_OF_DAY) * 60 + cal.get(java.util.Calendar.MINUTE);
                long deferUntil = 0L;
                if (minutes < 9 * 60) { cal.set(java.util.Calendar.HOUR_OF_DAY, 9); cal.set(java.util.Calendar.MINUTE, 0); cal.set(java.util.Calendar.SECOND, 0); cal.set(java.util.Calendar.MILLISECOND, 0); deferUntil = cal.getTimeInMillis(); }
                else if (minutes > 22 * 60) { cal.add(java.util.Calendar.DAY_OF_MONTH, 1); cal.set(java.util.Calendar.HOUR_OF_DAY, 9); cal.set(java.util.Calendar.MINUTE, 0); cal.set(java.util.Calendar.SECOND, 0); cal.set(java.util.Calendar.MILLISECOND, 0); deferUntil = cal.getTimeInMillis(); }
                long next = sp.getLong(NEXT_SEND_AT, 0L); if (deferUntil == 0L && next > now) deferUntil = next;
                if (deferUntil > now) { enqueueDeferred(context, getInputData(), id, deferUntil); return Result.success(); }
                try { sendOnce(context, id, phone, message, true, at, gap); return Result.success(); }
                catch (Exception e) { return getRunAttemptCount() < 5 ? Result.retry() : Result.failure(); }
            }
        }
    }
}
