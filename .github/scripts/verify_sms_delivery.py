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
}
failed = [name for name, ok in checks.items() if not ok]
for name, ok in checks.items():
    print(("PASS" if ok else "FAIL") + ": " + name)
if failed:
    raise SystemExit("SMS delivery static verification failed: " + "; ".join(failed))
