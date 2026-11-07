# Critical finding: malformed legacy data can be overwritten by demo seed

**Confirmed in inspected source archive; not yet fixed in the app.**

At startup the app runs:

```js
S = load() || seed();
...
persist();
```

The current `load()` returns `null` when:
- the `deyn.v1` key is missing,
- JSON parsing fails, or
- the parsed object does not have both `customers` and `pending` arrays.

Because startup then calls `seed()` and later `persist()`, an existing malformed or partially corrupted `deyn.v1` value can be replaced by demo data. That can destroy the only locally stored copy of customer/debt information.

## Required future correction

Before any migration work is integrated:
1. Distinguish a genuinely new install (key absent) from an existing but invalid record.
2. If the key is absent, allow intentional first-run seed behavior.
3. If the key exists but cannot be parsed/validated, do NOT call `seed()` and do NOT call `persist()`.
4. Show a recovery message and preserve the raw original value for export/recovery.
5. Do not auto-delete or auto-repair malformed content.
6. Test this exact startup sequence using a copy of a damaged record and verify byte-for-byte preservation.

This correction is not applied yet because it changes app startup behavior and must be tested against real data and backup/recovery flow.

## Lab migration prototype tests

The isolated migration helper has 7 passing Node tests:
- full record copy with old bytes preserved,
- missing/malformed source rejection,
- invalid schema rejection,
- idempotent repeat,
- conflicting destination protection,
- failed destination write preserves source,
- no trusted phone-clock timestamp.

These are in-memory prototype tests only. They are not Android, WebView, Capacitor, or production app tests.
