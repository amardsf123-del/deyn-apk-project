# DEYN security v2 lab — not integrated

This branch is an isolated preparation area. Nothing here is included in either Android app yet.

## Current status
- The current production source in the ZIP remains unchanged.
- The v2 Ed25519 prototype has passed local tests with a temporary test keypair only.
- The configured public key is `GGV7VOrfbHEBHxS/wzJ7OeZsBc2Jx013mPZT5s4GML4=`.
- The corresponding production private PEM has not been recovered. Never commit or upload a private signing key.
- A Cloudflare Worker signed-time template and an app-side Ed25519 response verifier have been added under `security-lab/trusted-time-worker/`.
- Worker-side tests passed: valid signed response, nonce binding, malformed nonce rejection, and missing-secret fail-closed behavior.
- Client-verifier tests passed: valid signed time accepted, nonce mismatch rejected, and altered signature rejected.
- These are local Node/WebCrypto tests with temporary test keys; Android WebView compatibility and real deployment remain untested.
- Trusted-time service is not deployed or configured; no endpoint or production key exists.
- Clock-warning state machine added under `security-lab/clock-warning/`; all 6 Node tests passed, covering network outage, snooze, duplicate/debounced incidents, three warning stages, 48-hour grace, successful verification reset, and lifetime exemption.
- The warning module is isolated and not connected to app storage or UI.
- No APK from this branch should be distributed.

## Why this is separate
The old app and key generator share an embedded HMAC secret. Replacing that system in-place before the production signing key and migration/recovery plan are available could invalidate existing licenses or lock customers out. The lab branch keeps experiments separate from `main`.

## v2 direction
1. Ed25519 signatures: app contains only the public key; key generator receives the private PEM at runtime.
2. License binds to a full-strength device identifier, tier, role, exact calendar expiry, and random nonce.
3. Expiry checks use authenticated trusted-time responses, not only the phone clock.
4. Existing customer records and debt data must survive all license migration and recovery operations.
5. The factory password `fcb1899` remains the user's chosen local password-recovery mechanism. Do not remove or replace it with SMS. Keep the existing owner/worker switching code and its current behavior unless the owner explicitly changes that decision.
6. Do not restore the deleted owner/worker toggle button.

## Required before integration
- Recover and verify the exact private PEM corresponding to the public key above.
- Choose and configure a trusted-time service, including server-side signing key and endpoint.
- Confirm Android WebView/Capacitor support for Ed25519 on the target Android 13 device, or implement a tested native fallback.
- Design a safe migration that preserves existing device activation and debt data.
- Test app and keygen builds, activation, wrong-device rejection, tampering, expiry, lifetime licenses, owner/worker role enforcement, recovery, and clock anomaly handling on-device.

## Expiry and recovery policy to implement
- Owner selects a fixed calendar expiry date at issuance.
- Internet is required for activation and periodic trusted-time verification.
- Benign reboot, timezone changes, SIM changes, and normal network time sync must not be treated as tampering.
- Three staged warnings, then a 48-hour grace period if verification remains unresolved.
- Do not delete debt data or activation records due to clock anomalies.
- Lifetime licenses are exempt from term-expiry warnings.
- A one-time signed recovery token may restore the time anchor/activation state but must not extend expiry or change tier.
- Local-only software cannot reliably defeat rollback after data wipe/root/device modification; periodic online verification is necessary for stronger protection.

**This document is a work plan, not evidence that these controls are implemented.**


## Data-preservation work (2026-11-07)
- Added `DATA_MIGRATION_PLAN.md` and `SECURE_STORAGE_REVIEW.md`.
- Added isolated data migration prototype and 7 Node tests. The tests cover full-object copy, old-record preservation, malformed/invalid input rejection, idempotence, destination conflict protection, failed write safety, and no trusted phone-clock timestamp.
- Added startup safety guard prototype under `security-lab/startup-safety/`.
- All 7 startup guard Node tests passed locally. They cover first install seed, valid existing data, malformed JSON preservation, invalid schema preservation, unexpected storage value, invalid seed rejection, and retention of factory password/auth and unknown nested fields.
- **Critical source finding:** the inspected app currently does `S = load() || seed()` and then `persist()`. Since `load()` returns null for malformed or schema-invalid existing data, startup can overwrite that value with demo seed data. See `CRITICAL_DATA_PRESERVATION_FINDING.md`.
- The prototypes are simulated-storage tests only. They are not integrated, not tested on Android/WebView/Capacitor, and do not change the production ZIP or `main`.
- The current production startup flow remains unchanged until backup/recovery UI and on-device validation are designed and tested.

- Reviewed current backup path in `BACKUP_RESTORE_REVIEW.md`: current JSON button exports the entire `S` object (including auth fields) and no import/restore path was found in inspected source. The file must be treated as confidential. No backup/restore code was changed.


## Recovery-mode work (2026-11-07)
- Added `security-lab/recovery-mode/RECOVERY_SCREEN_SPEC.md` with Arabic screen wording and strict safe-start/export rules.
- Added a pure recovery-mode controller prototype and 9 Node tests. All 9 passed locally.
- Tests cover: truly absent key, valid existing record, malformed JSON, invalid schema, storage read exceptions, blocking normal app/seed/write/import while recovering, explicit byte-for-byte raw export, invalid recovery-session creation, and unexpected stored value types.
- Important distinction: a storage read exception is **not** a new installation. Startup must block rather than seed demo data.
- Raw export is only represented as an explicit user action in the prototype. Actual file creation/download has not been implemented or tested on Android 13/Capacitor WebView.
- There is no restore/import action and no “continue anyway” path. Recovery mode does not write or clear `deyn.v1`.
- The prototype and screen specification are isolated lab artifacts, not integrated into the app or production ZIP.


- Reviewed recovery export mechanics in `security-lab/recovery-mode/RAW_EXPORT_TECHNICAL_REVIEW.md`: the current app uses a Blob/anchor download for ordinary backup, but there is no evidence it reliably saves files in the installed Android WebView. The app does not currently declare Capacitor Filesystem or Share plugins. No dependency was added; device testing is still required before implementing raw export.


## Startup integration mapping (2026-11-07)
- Inspected the actual app startup code around `licenseBoot(init)`, `agStartApp()`, and `init()`.
- Confirmed order: license boot runs first; after license success it calls `init()`; `init()` does `S = load() || seed()`, then initializes defaults/UI and persists.
- Added `recovery-mode/SAFE_START_INTEGRATION_MAP.md` showing where a read-only data-integrity gate must run before license boot, how valid/new-install cases continue, and how damaged/unavailable storage must stop.
- The gate must not bypass licensing or expose normal debt UI. Existing activation, `fcb1899`, and owner/worker behavior remain outside the recovery change.
- This is a source-mapped plan only. No app source was integrated, no APK was built, and no production data or `main` branch was touched.
