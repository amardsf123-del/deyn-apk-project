#!/usr/bin/env python3
from pathlib import Path

root = Path(__file__).resolve().parents[2]
runtime = (root / "sms/runtime.js").read_text(encoding="utf-8")
engine = (root / "sms/engine.js").read_text(encoding="utf-8")
native = (root / "DeynSmsPlugin.java").read_text(encoding="utf-8")

checks = {
    "global toggle does not overwrite customer preferences": "c.smsEnabled=true;c.smsOptOut=false" not in runtime,
    "auto language uses application locale": "Core.buildQueue(S,now,isFr()?'fr':'ar')" in runtime,
    "routine schedule uses KEEP": "persistedQueue, active, now, ExistingWorkPolicy.KEEP" in native,
    "payload-aware rescheduling exists": "previousActivePayloads.contains(payload)" in native,
    "permission denial keeps worker retryable": "permission is revoked" in native and "return Result.retry();" in native,
    "worker waits past the former 20-second blind-success window": "STALE_INFLIGHT_MS + 15000L" in native,
    "confirmed failures remain retryable": "if (STATUS_FAILED.equals(finalStatus))" in native and "return Result.retry();" in native,
    "language and global helpers are exported": "resolveSmsLang,setGlobalEnabled" in engine,
    "worker device is prevented from queuing SIM SMS": "if(isWorkerDevice()||!cfg().enabled)" in runtime,
    "only confirmed total failures are automatically retried": "if (STATUS_FAILED.equals(finalStatus))" in native and "STATUS_DISPATCH_UNCERTAIN.equals(st)" in native,
    "native worker validates the active queue payload before dispatch": "ACTIVE_PAYLOADS" in native and "dispatchOnce(context, id, phone, message, true, at, gap)" in native,
    "synced ledger persistence schedules a refreshed SMS queue": "const originalPersist=persist;" in runtime and "smsScheduleSoon();return r;" in runtime,
    "immediate sends revalidate debt and payment state": "Core.validateBeforeSend(S,x,now).ok" in runtime,
    "payment regression tests cover full and partial settlement": "SMS payment regression" in (root / "sms/test.mjs").read_text(encoding="utf-8"),
    "shared monthly due date is centralized in the SMS core": "function customerDueDate(c, referenceDate)" in engine and "customerDueDate(c,validDate(d.ts)?Number(d.ts):now)" in engine and "function getDebtDueDate(c, debt, now)" in engine,
    "customer UI delegates status to the shared due-date core": "payInfo=function(c){ return Core.customerPayInfo(c,Date.now()); }" in runtime,
    "transaction ledger display uses shared due dates": "window.DeynSmsCore.getDebtDueDate(c, t, Date.now())" in (root / ".github/scripts/integrate_sms.py").read_text(encoding="utf-8"),
    "reminder timestamps honor local calendar dates and chosen offsets": "function reminderTimestamp(dueAt, daysAfter, hhmm)" in engine and "reminderTimestamp(x.dueAt,cfg.days[i],cfg.times[i])" in engine,
    "send-time guard revalidates the same reminder timestamp": "now>=reminderTimestamp(ev.dueAt,cfg.days[ev.step-1],cfg.times[ev.step-1])" in engine,
    "custom 1,5,10,15 offsets and month-end tests are present": "const customDays=[1,5,10,15]" in (root / "sms/test.mjs").read_text(encoding="utf-8") and "Feb 29 in a leap year" in (root / "sms/test.mjs").read_text(encoding="utf-8"),
}
failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(("PASS" if ok else "FAIL") + ": " + name)
if failed:
    raise SystemExit("SMS delivery static verification failed: " + "; ".join(failed))
