# DEYN data migration plan (analysis only)

Status: DOCUMENTATION ONLY. No application code, production ZIP, customer data, activation data, password, or owner/worker behavior was changed.

Source inspected: the archived `source/deyn-app/www/index.html` from the repository's inspection artifact. This document describes the inspected source, not a promise about any later build.

## 1. Existing storage map

### Main application record
- Browser storage key: `localStorage["deyn.v1"]`.
- `load()` parses this single JSON value and accepts it when `customers` and `pending` are arrays.
- `persist()` serializes the complete in-memory object `S` back to that same key.
- The record contains customer accounts and transaction histories, pending tickets, settings, auth fields, sequence counters, trash/recovery data, and other app state. It is one combined record, not separate customer/debt tables.
- The default `seed()` contains demonstration customers and tickets. A missing or unreadable record currently falls back to `seed()`; migration must NOT mistake this fallback for a real customer database or overwrite a damaged existing record.

### Activation / clock metadata
The `DeynStore` wrapper uses the Capacitor plugin named `SecureStoragePlugin` when available and also writes an obfuscated localStorage fallback.

| Logical key | Native plugin key | localStorage fallback key | Meaning |
|---|---|---|---|
| `did` | `deyn_did` | `deyn.sec.did` | Device identifier |
| `lts` | `deyn_lts` | `deyn.sec.lts` | Last observed local timestamp |
| `lic` | `deyn_lic` | `deyn.sec.lic` | JSON license record |
| `used` | `deyn_used` | `deyn.sec.used` | Array of used activation codes |

The fallback encoding uses a secret compiled into the app. It is obfuscation, not secure encryption. The wrapper silently catches plugin and localStorage errors; therefore a successful return from `set()` does not prove that native secure storage succeeded.

The current license record stores `code`, `at`, and `exp`. The existing app computes 1Y/2Y expiry from the activation-time phone clock. Do not carry this old expiry calculation into the new signed-expiry design.

## 2. Data that must remain untouched

1. Every customer object and every nested transaction in `S.customers`.
2. Every pending ticket in `S.pending`.
3. Trash contents, including individual and bulk recovery snapshots.
4. Custom segments, deleted-segment settings, guaranteed-payment settings, app preferences, sequence counters, and any other fields already present in `S`.
5. The chosen factory password `fcb1899`: keep the existing password/recovery behavior exactly as currently agreed. This migration plan does not replace it, move it to SMS, or remove its use.
6. Existing owner/worker behavior: do not restore the removed visible switch button and do not rewrite the existing switching code as part of this storage migration.
7. Existing activation state until a separately tested compatibility/migration decision has been made.

Do not assume `S.auth` is only activation metadata. It also contains app access information such as the master password, device role, codes, expiry display, and phone-related fields. It must not be copied into a public export or discarded accidentally.

## 3. Required safe migration sequence (not implemented)

### Phase A — read-only discovery
- On startup, read `deyn.v1` without modifying it.
- Validate JSON parsing and required top-level structure, then record a schema/version fingerprint.
- Distinguish: valid existing data, absent data, malformed data, and demo seed state.
- Never auto-seed over a malformed existing record.
- Read old activation metadata independently; a failure to read license storage must not trigger deletion of customer data.

### Phase B — backup before any write
- Offer a clear manual backup step before migration.
- Explain that the current JSON backup serializes the whole `S` object and can contain customer names, phone numbers, debt history, and auth fields. It must be kept private and must not be sent to GitHub or shared publicly.
- Verify a backup by parsing it and checking record counts and representative IDs; ideally compute a cryptographic digest and show it to the owner.
- Do not claim backup succeeded unless the file was actually created and verified.
- Keep the original `deyn.v1` record intact until the new record has been written, read back, parsed, and verified.

### Phase C — secure-storage capability gate
- Confirm the actual installed Capacitor plugin API and native Android implementation on the target APK. The current source only calls `get({key})` and `set({key,value})`; this alone does not prove Android Keystore-backed protection or plugin availability.
- Run a device test on the owner's Android 13 phone and the exact WebView version.
- If secure storage is unavailable or fails, do not silently migrate activation secrets to localStorage and do not delete the old record. Stop activation migration with a clear message.
- Keep ordinary customer/debt data migration separate from activation-key migration. Do not put the whole debt database into secure storage merely because it is called secure storage; it may be large and needs its own backup/recovery design.

### Phase D — versioned migration with rollback
- Write a new, versioned application-data record to a new key (proposed name only: `deyn.v2`).
- Preserve the original `deyn.v1` byte-for-byte until verification is complete.
- Copy the complete existing state object, preserving unknown fields; do not rebuild only known fields.
- Read the new record back and compare customer count, pending-ticket count, trash count, IDs, transaction counts, and a stable digest of the canonicalized data.
- If any check fails, continue using `deyn.v1`, mark migration as failed, and leave both records for recovery.
- Only after a later, explicitly tested release may old storage be retired. No automatic destructive cleanup in the first migration release.

### Phase E — activation migration is a separate project
- Do not convert old HMAC activation codes to Ed25519 by simply re-signing data on the phone.
- Old codes cannot be trusted as signed v2 claims. A controlled owner-side reissue/revalidation process is required.
- Preserve old license metadata read-only during transition. Do not let migration change tier, role, expiry, device binding, or lifetime status.
- The v2 signed expiry must come from the signed license payload, not from `rec.at` or the phone's current time.
- Never include a private signing key in the app, repository, APK, or customer backup.
- Keep the trusted-time signing key separate from the license signing key.

## 4. Test matrix required before integration

- Fresh install: no old data; seed appears only as the intentional first-run behavior.
- Valid `deyn.v1`: exact data preserved after migration and restart.
- Malformed `deyn.v1`: no seed overwrite; recovery path offered.
- SecureStorage plugin missing, denied, or failing: customer data remains available; activation migration stops safely.
- App killed during each migration write/read stage: old record remains usable.
- Low storage / quota exceeded: no destructive cleanup and clear failure status.
- Large database: migration completes without UI freeze or memory exhaustion.
- Export/restore: customer, ticket, trash, and transaction IDs remain intact.
- Existing owner and worker devices: no role escalation, no restoration of the deleted visible switch button.
- Factory password: `fcb1899` still behaves exactly as agreed.
- Old and new license compatibility: no customer lockout; test expiry, lifetime, role, and device binding.
- Android 13 target device: confirm actual SecureStorage plugin behavior and WebView crypto support.

## 5. Current decision

This plan is a safety boundary, not implementation approval. The next engineering step is to inspect the exact Capacitor Secure Storage plugin source/version and the app's backup/restore import path, then write automated migration tests against copied sample data. Do not edit `deyn-app/www/index.html`, the production ZIP, or the `main` branch until those tests pass and a reviewed migration implementation is ready.
