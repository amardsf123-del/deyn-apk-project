package com.deyn.app;   // غيّر الـ package حسب تطبيقك

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.telephony.SmsManager;
import androidx.annotation.NonNull;
import androidx.work.*;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@CapacitorPlugin(name = "DeynSms", permissions = { @Permission(strings = { Manifest.permission.SEND_SMS }, alias = "sms") })
public class DeynSmsPlugin extends Plugin {
  static final String PREFS = "deyn_sms", SENT = "sent", TAG = "deyn_sms";

  @PluginMethod public void checkPermissions(PluginCall call) { call.resolve(state()); }

  @PluginMethod public void requestPermissions(PluginCall call) {
    if (getPermissionState("sms") == PermissionState.GRANTED) { call.resolve(state()); return; }
    requestPermissionForAlias("sms", call, "permCb");
  }
  @PermissionCallback private void permCb(PluginCall call) { call.resolve(state()); }

  private JSObject state() {
    JSObject o = new JSObject();
    o.put("sms", getPermissionState("sms") == PermissionState.GRANTED ? "granted" : "denied");
    return o;
  }

  @PluginMethod public void send(PluginCall call) {
    if (getPermissionState("sms") != PermissionState.GRANTED) { call.reject("SMS permission not granted"); return; }
    try { sendNow(getContext(), call.getString("phone"), call.getString("message")); call.resolve(new JSObject().put("sent", true)); }
    catch (Exception e) { call.reject(e.getMessage()); }
  }

  /** Replaces all pending reminders with the given list: items[{id, phone, message, at(ms)}] */
  @PluginMethod public void schedule(PluginCall call) {
    try {
      WorkManager wm = WorkManager.getInstance(getContext());
      wm.cancelAllWorkByTag(TAG);
      JSArray items = call.getArray("items", new JSArray());
      long now = System.currentTimeMillis(); int n = 0;
      for (int i = 0; i < items.length(); i++) {
        JSONObject it = items.getJSONObject(i);
        long delay = it.getLong("at") - now; if (delay <= 0) continue;
        Data d = new Data.Builder().putString("id", it.getString("id")).putString("phone", it.getString("phone")).putString("message", it.getString("message")).build();
        wm.enqueueUniqueWork("sms_" + it.getString("id"), ExistingWorkPolicy.REPLACE,
          new OneTimeWorkRequest.Builder(SmsWorker.class).setInitialDelay(delay, TimeUnit.MILLISECONDS).setInputData(d).addTag(TAG).build());
        n++;
      }
      call.resolve(new JSObject().put("count", n));
    } catch (Exception e) { call.reject(e.getMessage()); }
  }

  @PluginMethod public void getSent(PluginCall call) {
    SharedPreferences sp = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    JSArray ids = new JSArray(); for (String s : sp.getStringSet(SENT, new java.util.HashSet<>())) ids.put(s);
    call.resolve(new JSObject().put("ids", ids));
  }

  static void sendNow(Context c, String phone, String msg) {
    SmsManager sm = c.getSystemService(SmsManager.class);
    ArrayList<String> parts = sm.divideMessage(msg);
    sm.sendMultipartTextMessage(phone, null, parts, null, null);
  }

  public static class SmsWorker extends Worker {
    public SmsWorker(@NonNull Context c, @NonNull WorkerParameters p) { super(c, p); }
    @NonNull @Override public Result doWork() {
      Context c = getApplicationContext();
      if (c.checkSelfPermission(Manifest.permission.SEND_SMS) != android.content.pm.PackageManager.PERMISSION_GRANTED) return Result.failure();
      try {
        sendNow(c, getInputData().getString("phone"), getInputData().getString("message"));
        SharedPreferences sp = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        java.util.Set<String> set = new java.util.HashSet<>(sp.getStringSet(SENT, new java.util.HashSet<>()));
        set.add(getInputData().getString("id")); sp.edit().putStringSet(SENT, set).apply();
        return Result.success();
      } catch (Exception e) { return Result.failure(); }
    }
  }
}
