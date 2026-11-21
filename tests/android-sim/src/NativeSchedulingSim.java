package com.deyn.app;

import android.app.PendingIntent;
import android.content.Context;
import android.content.SharedPreferences;
import android.telephony.SmsManager;
import androidx.work.WorkManager;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import org.json.JSONObject;
import java.util.*;
import java.util.function.BooleanSupplier;

/**
 * Deterministic simulation of the NATIVE scheduled-SMS pipeline using the REAL DeynSmsPlugin.java
 * (compiled against hand-written Android/Capacitor/WorkManager stand-ins; see stubs/).
 * It proves the plugin's own state machine and WorkManager usage, NOT carrier delivery.
 */
public class NativeSchedulingSim {
    static int pass = 0, fail = 0;
    static final List<String> failures = new ArrayList<>();
    static DeynSmsPlugin plugin;
    static Context ctx = new Context();

    static void check(String name, boolean ok, String detail) {
        if (ok) { pass++; System.out.println("PASS  " + name); }
        else { fail++; failures.add(name); System.out.println("FAIL  " + name + (detail.isEmpty() ? "" : "  -> " + detail)); }
    }
    static void check(String name, boolean ok) { check(name, ok, ""); }

    static void setLocalHour(int hour) {
        // Put the JVM's local clock at `hour`:30 so the worker's 09:00-22:00 window logic is deterministic.
        long utc = System.currentTimeMillis();
        int utcHour = (int) ((utc / 3600000L) % 24);
        int off = ((hour - utcHour) % 24 + 24) % 24; if (off > 14) off -= 24;
        TimeZone.setDefault(TimeZone.getTimeZone("GMT" + (off >= 0 ? "+" : "-") + Math.abs(off)));
    }

    static void reset() {
        WorkManager.resetAll(); pause(400);   // let stragglers from the previous scenario finish before wiping state
        Context.DISK.clear(); Context.SEND_SMS_GRANTED = true; Context.smsManagerInstance = new SmsManager();
        SmsManager.Sim.reset(); PendingIntent.resetStore(); WorkManager.resetAll(); WorkManager.retryBackoffOverrideMs = 40;
        DeynSmsPlugin.BACKOFF_UNIT_MS = 100; DeynSmsPlugin.PERMISSION_RETRY_MS = 500; DeynSmsPlugin.STALE_JOB_MS = 400;
        plugin = new DeynSmsPlugin(); setLocalHour(12);
    }
    static SharedPreferences sp() { return ctx.getSharedPreferences("deyn_sms", 0); }
    static String status(String id) { return sp().getString("status_" + id, "none"); }
    static boolean sentSet(String id) { return sp().getStringSet("sent_ids", new HashSet<>()).contains(id); }

    static boolean waitFor(BooleanSupplier c, long ms) {
        long end = System.currentTimeMillis() + ms;
        while (System.currentTimeMillis() < end) { if (c.getAsBoolean()) return true; try { Thread.sleep(15); } catch (InterruptedException e) {} }
        return c.getAsBoolean();
    }
    static void pause(long ms) { try { Thread.sleep(ms); } catch (InterruptedException e) {} }

    static JSONObject item(String id, String phone, String msg, long at, int gap) throws Exception {
        JSONObject o = new JSONObject(); o.put("id", id); o.put("phone", phone); o.put("message", msg); o.put("at", at); o.put("gapMinutes", gap); return o;
    }
    static JSObject schedule(JSONObject... items) throws Exception {
        JSArray arr = new JSArray(); for (JSONObject i : items) arr.put(i);
        PluginCall call = new PluginCall(); call.put("items", arr);
        plugin.schedule(call); call.await(2000);
        if (call.rejected != null) throw new RuntimeException("schedule rejected: " + call.rejected);
        return call.resolved;
    }
    static String arLong(int chars) { StringBuilder b = new StringBuilder("السلام عليكم "); while (b.length() < chars) b.append("تذكير بالرصيد المتبقي "); return b.substring(0, chars); }

    public static void main(String[] a) throws Exception {
        String only = a.length > 0 ? a[0] : "";
        Map<String, ThrowingRunnable> tests = new LinkedHashMap<>();
        tests.put("t01", NativeSchedulingSim::t01_scheduledRunsAtDueTime);
        tests.put("t02", NativeSchedulingSim::t02_multipartArabicPerPartCallbacks);
        tests.put("t03", NativeSchedulingSim::t03_partialFailureNotSuccess);
        tests.put("t04", NativeSchedulingSim::t04_confirmedFailureBoundedRetry);
        tests.put("t05", NativeSchedulingSim::t05_routineSavesNoDuplicateNoDelay);
        tests.put("t06", NativeSchedulingSim::t06_permissionMissingThenGranted);
        tests.put("t07", NativeSchedulingSim::t07_rebootRestoresQueue);
        tests.put("t08", NativeSchedulingSim::t08_fullPaymentCancels);
        tests.put("t09", NativeSchedulingSim::t09_partialPaymentUpdatesMessage);
        tests.put("t10", NativeSchedulingSim::t10_outsideWindowDefers);
        tests.put("t11", NativeSchedulingSim::t11_gapBetweenMessages);
        tests.put("t12", NativeSchedulingSim::t12_processDiedBeforeApiCall);
        tests.put("t13", NativeSchedulingSim::t13_callbacksLostAfterApiCall);
        tests.put("t14", NativeSchedulingSim::t14_securityExceptionIsRetriedNotLost);
        tests.put("t15", NativeSchedulingSim::t15_deferredWorkSurvivesRoutineSave);
        tests.put("t16", NativeSchedulingSim::t16_sweeperRecoversLostJob);
        tests.put("t17", NativeSchedulingSim::t17_exhaustedThenOwnerRelease);
        tests.put("t18", NativeSchedulingSim::t18_diagnosticsArePrivacySafe);
        tests.put("t19", NativeSchedulingSim::t19_customWindowEndHonoured);
        for (Map.Entry<String, ThrowingRunnable> e : tests.entrySet()) {
            if (!only.isEmpty() && !e.getKey().equals(only)) continue;
            System.out.println("--- " + e.getKey());
            try { reset(); e.getValue().run(); } catch (Throwable t) { fail++; failures.add(e.getKey() + " EXCEPTION"); System.out.println("FAIL  " + e.getKey() + " threw " + t); t.printStackTrace(System.out); }
        }
        System.out.println("\n==== native scheduling simulation: " + pass + " passed, " + fail + " failed ====");
        if (fail > 0) System.out.println("FAILED: " + failures);
        System.exit(fail == 0 ? 0 : 1);
    }
    interface ThrowingRunnable { void run() throws Exception; }

    // ---------------------------------------------------------------------------------------------
    static void t01_scheduledRunsAtDueTime() throws Exception {
        long at = System.currentTimeMillis() + 400;
        JSObject r = schedule(item("c1|aaa", "+213555123456", "السلام عليكم Ali، عليكم 5,000 دج منذ 11/11/2026. شكرا.", at, 5));
        check("t01 schedule() enqueues one worker", r.optInt("count", -1) == 1);
        pause(150);
        check("t01 nothing is sent before the due time", SmsManager.Sim.sent.isEmpty());
        boolean ok = waitFor(() -> SmsManager.Sim.sent.size() == 1, 3000);
        check("t01 worker reaches SmsManager after the delay", ok);
        long late = System.currentTimeMillis() - at;
        check("t01 sent within 1.5s of the due time (fake clock lag only)", late < 1500, "late=" + late);
        check("t01 payload recipient/body are exactly what JS handed over",
            ok && SmsManager.Sim.sent.get(0)[0].equals("+213555123456") && SmsManager.Sim.sent.get(0)[1].contains("5,000"));
        check("t01 status reaches sent_to_network/delivered after the sent callback", waitFor(() -> { String st = status("c1|aaa"); return st.equals("sent_to_network") || st.equals("delivered"); }, 2000), status("c1|aaa"));
        check("t01 recorded in SENT only after callback", sentSet("c1|aaa"));
    }

    static void t02_multipartArabicPerPartCallbacks() throws Exception {
        String msg = arLong(150);
        schedule(item("m1", "+213555123456", msg, System.currentTimeMillis() + 100, 1));
        boolean ok = waitFor(() -> !SmsManager.Sim.sent.isEmpty(), 3000);
        int parts = ok ? SmsManager.Sim.partCounts.get(0) : 0;
        check("t02 long Arabic message is divided into >=3 parts", parts >= 3, "parts=" + parts);
        check("t02 every part carries its own sent+delivery PendingIntent (unique identity)", PendingIntent.distinct() == parts * 2, "distinct=" + PendingIntent.distinct() + " parts=" + parts);
        check("t02 full text is transmitted intact across parts", ok && SmsManager.Sim.sent.get(0)[1].equals(msg));
        check("t02 aggregated status reaches sent_to_network/delivered only after all parts", waitFor(() -> { String s = status("m1"); return s.equals("sent_to_network") || s.equals("delivered"); }, 3000), status("m1"));
        check("t02 delivery reports mark the message delivered", waitFor(() -> "delivered".equals(status("m1")), 2000), status("m1"));
    }

    static void t03_partialFailureNotSuccess() throws Exception {
        SmsManager.Sim.mode = 2; SmsManager.Sim.failPart = 1;
        schedule(item("p1", "+213555123456", arLong(150), System.currentTimeMillis() + 100, 1));
        check("t03 partial failure is recorded", waitFor(() -> "partial_failure".equals(status("p1")), 3000), status("p1"));
        check("t03 partial failure is NOT recorded as success", !sentSet("p1"));
        pause(600);
        check("t03 a partial failure is never blindly resent (would duplicate parts)", SmsManager.Sim.sent.size() == 1, "sends=" + SmsManager.Sim.sent.size());
    }

    static void t04_confirmedFailureBoundedRetry() throws Exception {
        SmsManager.Sim.mode = 1; SmsManager.Sim.failCode = SmsManager.RESULT_ERROR_NO_SERVICE;
        schedule(item("f1", "+213555123456", "قصيرة", System.currentTimeMillis() + 100, 1));
        check("t04 first confirmed failure is recorded as failed", waitFor(() -> "failed".equals(status("f1")), 3000), status("f1"));
        check("t04 failed item is NOT in SENT", !sentSet("f1"));
        check("t04 a back-off retry is scheduled by itself (no app launch needed)", waitFor(() -> sp().getLong("sched_for_f1", 0) > 0, 1000), "log=" + WorkManager.LOG);
        SmsManager.Sim.mode = 0;               // service returns
        check("t04 the retry delivers the message once service is back", waitFor(() -> sentSet("f1"), 6000), "status=" + status("f1") + " sends=" + SmsManager.Sim.sent.size() + " log=" + WorkManager.LOG);
        pause(500);
        long n = SmsManager.Sim.sent.size();
        check("t04 exactly one failed attempt + one success (no duplicates)", n == 2, "sends=" + n);
    }

    static void t05_routineSavesNoDuplicateNoDelay() throws Exception {
        long at = System.currentTimeMillis() + 700;
        JSONObject it = item("r1", "+213555123456", "رسالة", at, 1);
        for (int i = 0; i < 6; i++) { schedule(it); pause(50); }   // the JS bridge calls schedule() after every persist()
        boolean ok = waitFor(() -> !SmsManager.Sim.sent.isEmpty(), 3000);
        long late = System.currentTimeMillis() - at;
        check("t05 reminder still fires despite repeated schedule() calls", ok);
        pause(500);
        check("t05 exactly one SMS (no duplicate from repeated enqueue)", SmsManager.Sim.sent.size() == 1, "sends=" + SmsManager.Sim.sent.size());
        check("t05 repeated schedule() does not postpone the reminder", late < 1500, "late=" + late);
        boolean cancelledRunning = WorkManager.LOG.stream().anyMatch(s -> s.startsWith("RESULT-IGNORED"));
        check("t05 no running worker was cancelled by a routine save", !cancelledRunning, WorkManager.LOG.toString());
    }

    static void t06_permissionMissingThenGranted() throws Exception {
        Context.SEND_SMS_GRANTED = false;
        schedule(item("perm1", "+213555123456", "رسالة", System.currentTimeMillis() + 200, 1));
        pause(900);
        check("t06 nothing is sent while permission is missing", SmsManager.Sim.sent.isEmpty());
        check("t06 the reminder is NOT permanently failed/dropped (a continuation job is pending)", !"FAILED".equals(WorkManager.state("deyn_sms_perm1")) && sp().getLong("sched_for_perm1", 0) > 0 && !sentSet("perm1"), "wm=" + WorkManager.state("deyn_sms_perm1") + " log=" + WorkManager.LOG);
        check("t06 the owner can see why it is waiting (last_error=permission_denied)", "permission_denied".equals(sp().getString("last_error_perm1", "")));
        Context.SEND_SMS_GRANTED = true;      // user grants the permission; the app is NOT opened
        check("t06 the pending reminder is delivered after the grant with no app launch", waitFor(() -> SmsManager.Sim.sent.size() == 1, 6000), "wm=" + WorkManager.state("deyn_sms_perm1") + " log=" + WorkManager.LOG);
    }

    static void t07_rebootRestoresQueue() throws Exception {
        long at = System.currentTimeMillis() + 600;
        schedule(item("b1", "+213555123456", "رسالة", at, 1));
        WorkManager.resetAll();               // work table lost (e.g. data wiped by an OEM task killer / app update)
        new DeynSmsPlugin.SmsBootReceiver().onReceive(ctx, new android.content.Intent(android.content.Intent.ACTION_BOOT_COMPLETED));
        check("t07 boot receiver re-enqueues the persisted queue", WorkManager.TABLE.containsKey("deyn_sms_b1"), WorkManager.LOG.toString());
        check("t07 restored reminder fires once", waitFor(() -> SmsManager.Sim.sent.size() == 1, 3000));
        pause(400);
        check("t07 and never twice", SmsManager.Sim.sent.size() == 1);
    }

    static void t08_fullPaymentCancels() throws Exception {
        schedule(item("pay1", "+213555123456", "رسالة", System.currentTimeMillis() + 500, 1));
        pause(100);
        schedule();                            // debt fully paid -> JS hands over an empty queue
        pause(1000);
        check("t08 no SMS after full payment", SmsManager.Sim.sent.isEmpty(), "sends=" + SmsManager.Sim.sent.size());
        check("t08 worker no longer pending", !WorkManager.state("deyn_sms_pay1").equals("ENQUEUED"), WorkManager.state("deyn_sms_pay1"));
    }

    static void t09_partialPaymentUpdatesMessage() throws Exception {
        long at = System.currentTimeMillis() + 600;
        schedule(item("pp1", "+213555123456", "عليكم 5,000 دج", at, 1));
        pause(100);
        schedule(item("pp1", "+213555123456", "عليكم 3,000 دج", at, 1));   // partial payment: same id, new balance
        check("t09 an SMS is sent", waitFor(() -> !SmsManager.Sim.sent.isEmpty(), 3000));
        pause(500);
        check("t09 only ONE SMS", SmsManager.Sim.sent.size() == 1, "sends=" + SmsManager.Sim.sent.size());
        check("t09 it carries the UPDATED balance, never the stale snapshot", SmsManager.Sim.sent.get(0)[1].contains("3,000") && !SmsManager.Sim.sent.get(0)[1].contains("5,000"));
    }

    static void t10_outsideWindowDefers() throws Exception {
        setLocalHour(23);                     // 23:30 local: outside 09:00-22:00
        schedule(item("w1", "+213555123456", "رسالة", System.currentTimeMillis() + 100, 1));
        pause(700);
        check("t10 no SMS is sent at night", SmsManager.Sim.sent.isEmpty());
        check("t10 the reminder is deferred (not dropped)", WorkManager.TABLE.containsKey("deyn_sms_deferred_w1"), WorkManager.LOG.toString());
        schedule(item("w1", "+213555123456", "رسالة", System.currentTimeMillis() + 100, 1));   // routine save during the night
        pause(700);
        check("t10 a routine save at night still does not send", SmsManager.Sim.sent.isEmpty());
        check("t10 and the reminder is still pending afterwards", WorkManager.TABLE.containsKey("deyn_sms_deferred_w1") && !WorkManager.state("deyn_sms_deferred_w1").equals("CANCELLED"), WorkManager.LOG.toString());
    }

    static void t11_gapBetweenMessages() throws Exception {
        long at = System.currentTimeMillis() + 200;
        schedule(item("g1", "+213555123456", "رسالة 1", at, 1), item("g2", "+213555000111", "رسالة 2", at, 1));
        waitFor(() -> SmsManager.Sim.sent.size() >= 1, 3000);
        pause(800);
        check("t11 the shop-wide gap spaces messages (second one deferred, not burst)", SmsManager.Sim.sent.size() == 1, "sends=" + SmsManager.Sim.sent.size());
        check("t11 the second message is deferred, not lost", WorkManager.TABLE.containsKey("deyn_sms_deferred_g1") || WorkManager.TABLE.containsKey("deyn_sms_deferred_g2"), WorkManager.LOG.toString());
    }

    static void t12_processDiedBeforeApiCall() throws Exception {
        // The worker claimed the id and persisted 'attempting', then the process was killed BEFORE SmsManager was called.
        Set<String> claimed = new HashSet<>(Arrays.asList("d1")); Set<String> tracked = new HashSet<>(claimed);
        long old = System.currentTimeMillis() - 10 * 60000L;
        sp().edit().putStringSet("claimed_ids", claimed).putStringSet("tracked_ids", tracked).putString("status_d1", "attempting").putLong("attempt_at_d1", old).putInt("parts_total_d1", 1).commit();
        schedule(item("d1", "+213555123456", "رسالة", System.currentTimeMillis() + 100, 1));
        pause(1200);
        check("t12 a claim that never reached SmsManager (no accepted_at) is retried, not lost forever", SmsManager.Sim.sent.size() == 1,
            "status=" + status("d1") + " sends=" + SmsManager.Sim.sent.size());
    }

    static void t13_callbacksLostAfterApiCall() throws Exception {
        SmsManager.Sim.mode = 3;              // API accepted the send, callbacks never arrive (process died)
        schedule(item("u1", "+213555123456", "رسالة", System.currentTimeMillis() + 100, 1));
        waitFor(() -> SmsManager.Sim.sent.size() == 1, 2000);
        // age the attempt beyond the reconcile window
        long old = System.currentTimeMillis() - 10 * 60000L;
        sp().edit().putLong("attempt_at_u1", old).putLong("accepted_at_u1", old).commit();
        JSObject snap = null; PluginCall c = new PluginCall(); plugin.getSent(c); c.await(1000); snap = c.resolved;
        check("t13 ambiguous dispatch is labelled dispatch_uncertain", "dispatch_uncertain".equals(status("u1")), status("u1"));
        pause(600);
        check("t13 an ambiguous dispatch is never blindly resent", SmsManager.Sim.sent.size() == 1);
    }

    static void t14_securityExceptionIsRetriedNotLost() throws Exception {
        SmsManager.Sim.mode = 4;              // SmsManager throws SecurityException (permission revoked / SIM glitch)
        schedule(item("s1", "+213555123456", "رسالة", System.currentTimeMillis() + 100, 1));
        pause(500);
        check("t14 nothing sent while the API throws", SmsManager.Sim.sent.isEmpty());
        SmsManager.Sim.mode = 0;
        check("t14 the reminder survives the exception and is sent afterwards", waitFor(() -> SmsManager.Sim.sent.size() == 1, 6000), "wm=" + WorkManager.state("deyn_sms_s1") + " status=" + status("s1") + " log=" + WorkManager.LOG);
    }

    static void t15_deferredWorkSurvivesRoutineSave() throws Exception {
        setLocalHour(23);
        JSONObject it = item("k1", "+213555123456", "رسالة", System.currentTimeMillis() + 100, 1);
        schedule(it); pause(500);
        for (int i = 0; i < 5; i++) { schedule(it); pause(100); }
        pause(300);
        long enq = WorkManager.LOG.stream().filter(s -> s.startsWith("ENQ deyn_sms_k1")).count();
        check("t15 repeated routine saves do not churn the work queue", enq <= 2, "enqueues=" + enq + " log=" + WorkManager.LOG);
    }

    static void t16_sweeperRecoversLostJob() throws Exception {
        schedule(item("sw1", "+213555123456", "رسالة", System.currentTimeMillis() + 200, 1));
        WorkManager.TABLE.clear();            // the one-time job vanished (OEM cleanup / lost DB row); the periodic sweeper must notice
        check("t16 periodic sweeper registered", WorkManager.PERIODIC.containsKey("deyn_sms_sweeper"));
        check("t16 sweeper sends the due reminder although its one-time job is gone", waitFor(() -> SmsManager.Sim.sent.size() == 1, 4000), "log=" + WorkManager.LOG);
        pause(800);
        check("t16 sweeper + any late job never duplicate", SmsManager.Sim.sent.size() == 1, "sends=" + SmsManager.Sim.sent.size());
    }

    static void t17_exhaustedThenOwnerRelease() throws Exception {
        SmsManager.Sim.mode = 1; DeynSmsPlugin.BACKOFF_UNIT_MS = 30;
        schedule(item("x1", "+213555123456", "رسالة", System.currentTimeMillis() + 50, 1));
        check("t17 retries are bounded (MAX_ATTEMPTS)", waitFor(() -> sp().getInt("attempts_x1", 0) >= DeynSmsPlugin.MAX_ATTEMPTS, 8000), "attempts=" + sp().getInt("attempts_x1", 0));
        pause(600);
        long n = SmsManager.Sim.sent.size();
        check("t17 no more than MAX_ATTEMPTS sends, then a visible terminal failure", n == DeynSmsPlugin.MAX_ATTEMPTS && "failed".equals(status("x1")), "sends=" + n + " status=" + status("x1"));
        PluginCall c = new PluginCall(); plugin.getSent(c); c.await(1000);
        check("t17 getSent exposes exhausted=true so the UI can offer a manual retry", c.resolved != null && c.resolved.toString().contains("\"exhausted\":true"));
        schedule(item("x1", "+213555123456", "رسالة", System.currentTimeMillis() - 10, 1));   // routine save must not restart it
        pause(400);
        check("t17 a routine save does not restart an exhausted reminder", SmsManager.Sim.sent.size() == n);
        SmsManager.Sim.mode = 0;
        PluginCall rc = new PluginCall().put("id", "x1"); plugin.release(rc); rc.await(1000);
        check("t17 owner release re-queues it", rc.resolved != null && rc.resolved.optBoolean("released"));
        check("t17 and it is delivered after the release", waitFor(() -> sentSet("x1"), 5000), "status=" + status("x1"));
    }

    static void t18_diagnosticsArePrivacySafe() throws Exception {
        schedule(item("dg|1", "+213555123456", "نص خاص جدا بالعميل أحمد", System.currentTimeMillis() + 60000, 1));
        JSObject d = DeynSmsPlugin.buildDiagnostics(ctx);
        String json = d.toString();
        check("t18 diagnostics list the queued reminder with WorkManager state", json.contains("\"workState\":\"ENQUEUED\""), json);
        check("t18 no message body in diagnostics", !json.contains("نص خاص"));
        check("t18 phone number is masked", !json.contains("213555123456") && json.contains("•••"));
        check("t18 reports permission, timezone and window", json.contains("permissionSendSms") && json.contains("timezone") && json.contains("windowEndMinutes"));
    }

    static void t19_customWindowEndHonoured() throws Exception {
        setLocalHour(20);   // 20:30 local, window ends 20:00 (1200 min)
        JSArray arr = new JSArray(); arr.put(item("we1", "+213555123456", "رسالة", System.currentTimeMillis() + 100, 1));
        PluginCall call = new PluginCall(); call.put("items", arr); call.put("windowEndMinutes", 20 * 60); plugin.schedule(call); call.await(2000);
        pause(700);
        check("t19 the merchant's configured sending-window end is honoured natively", SmsManager.Sim.sent.isEmpty() && WorkManager.TABLE.containsKey("deyn_sms_deferred_we1"), "log=" + WorkManager.LOG);
    }
}
