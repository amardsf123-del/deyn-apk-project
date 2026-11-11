package com.deyn.app;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.telephony.SmsManager;
import androidx.annotation.NonNull;
import androidx.work.Data;
import androidx.work.ExistingWorkPolicy;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@CapacitorPlugin(name = "DeynSms", permissions = {
    @Permission(strings = { Manifest.permission.SEND_SMS }, alias = "sms")
})
public class DeynSmsPlugin extends Plugin {
    private static final String PREFS = "deyn_sms";
    private static final String SENT = "sent_ids";
    private static final String ACTIVE = "active_ids";
    private static final String TAG = "deyn_sms";
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
        if (id == null || id.trim().isEmpty() || phone == null || message == null) { call.reject("Missing SMS id, phone or message"); return; }
        try {
            boolean sent = sendOnce(getContext(), id, phone, message);
            JSObject out = new JSObject(); out.put("sent", sent); out.put("duplicate", !sent); call.resolve(out);
        } catch (Exception e) { call.reject("SMS send failed: " + e.getClass().getSimpleName()); }
    }

    @PluginMethod public void schedule(PluginCall call) {
        try {
            Context context = getContext();
            JSArray items = call.getArray("items", new JSArray());
            Set<String> active = new HashSet<>();
            for (int i = 0; i < items.length(); i++) {
                String id = items.getJSONObject(i).optString("id", "");
                if (!id.isEmpty()) active.add(id);
            }
            synchronized (LOCK) { prefs(context).edit().putStringSet(ACTIVE, active).commit(); }
            WorkManager wm = WorkManager.getInstance(context);
            wm.cancelAllWorkByTag(TAG);
            long now = System.currentTimeMillis(); int queued = 0;
            for (int i = 0; i < items.length(); i++) {
                JSONObject item = items.getJSONObject(i);
                String id = item.getString("id");
                if (wasSent(context, id)) continue;
                long delay = item.getLong("at") - now;
                if (delay <= 0) continue;
                Data data = new Data.Builder().putString("id", id).putString("phone", item.getString("phone"))
                    .putString("message", item.getString("message")).build();
                OneTimeWorkRequest request = new OneTimeWorkRequest.Builder(SmsWorker.class)
                    .setInitialDelay(delay, TimeUnit.MILLISECONDS).setInputData(data).addTag(TAG).build();
                wm.enqueueUniqueWork("sms_" + id, ExistingWorkPolicy.REPLACE, request); queued++;
            }
            JSObject out = new JSObject(); out.put("count", queued); call.resolve(out);
        } catch (Exception e) { call.reject("SMS scheduling failed: " + e.getClass().getSimpleName()); }
    }

    @PluginMethod public void getSent(PluginCall call) {
        Set<String> ids = new HashSet<>(prefs(getContext()).getStringSet(SENT, new HashSet<>()));
        JSArray array = new JSArray(); for (String id : ids) array.put(id);
        JSObject out = new JSObject(); out.put("ids", array); call.resolve(out);
    }

    private static SharedPreferences prefs(Context c) { return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE); }
    private static boolean wasSent(Context c, String id) { return prefs(c).getStringSet(SENT, new HashSet<>()).contains(id); }

    /** At-most-once: durably claim the ID before Android accepts the SMS request. */
    private static boolean sendOnce(Context c, String id, String phone, String message) {
        synchronized (LOCK) {
            SharedPreferences sp = prefs(c);
            Set<String> sent = new HashSet<>(sp.getStringSet(SENT, new HashSet<>()));
            if (sent.contains(id)) return false;
            sent.add(id);
            if (!sp.edit().putStringSet(SENT, sent).commit()) throw new IllegalStateException("Could not persist idempotency key");
        }
        SmsManager manager = c.getSystemService(SmsManager.class);
        if (manager == null) throw new IllegalStateException("SMS service unavailable");
        ArrayList<String> parts = manager.divideMessage(message);
        manager.sendMultipartTextMessage(phone, null, parts, null, null);
        return true;
    }

    public static class SmsWorker extends androidx.work.Worker {
        public SmsWorker(@NonNull Context context, @NonNull androidx.work.WorkerParameters params) { super(context, params); }
        @NonNull @Override public Result doWork() {
            Context context = getApplicationContext();
            if (context.checkSelfPermission(Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) return Result.failure();
            String id = getInputData().getString("id"), phone = getInputData().getString("phone"), message = getInputData().getString("message");
            if (id == null || phone == null || message == null) return Result.failure();
            Set<String> active = new HashSet<>(prefs(context).getStringSet(ACTIVE, new HashSet<>()));
            if (!active.contains(id)) return Result.success();
            try { sendOnce(context, id, phone, message); return Result.success(); }
            catch (Exception e) { return Result.failure(); }
        }
    }
}
