# DEYN security v2 lab — not integrated

This branch is an isolated preparation area. Nothing here is included in either Android app yet.

## Current status
- The current production source in the ZIP remains unchanged.
- The recovered v2 Ed25519 license keypair was verified: the private PEM remains outside GitHub/ APKs, and its derived public key matches `GGV7VOrfbHEBHxS/wzJ7OeZsBc2Jx013mPZT5s4GML4=`.
- An isolated DEYN3 license-format prototype now exists under `security-lab/licensing-v3/`. It signs a fixed UTC expiry timestamp, binds a 128-bit device ID, and tests owner/worker and lifetime claims. It is not integrated into the app.
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
- **Important clarification from the owner:** demo seed data is intentional and must remain; it helps new customers explore the app. The existing Settings clear/reset option is also intentional and must remain. The only unsafe edge case is treating an existing unreadable/invalid stored record like a fresh install and silently replacing it with demo data. See `CRITICAL_DATA_PRESERVATION_FINDING.md`.
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
- Added `recovery-mode/SAFE_START_INTEGRATION_MAP.md` showing where a read-only data-integrity gate must run before license boot. It explicitly preserves the first-run demo seed and Settings reset feature, while blocking only damaged/unavailable existing storage.
- The gate must not bypass licensing or expose normal debt UI. Existing activation, `fcb1899`, and owner/worker behavior remain outside the recovery change.
- This is a source-mapped plan only. No app source was integrated, no APK was built, and no production data or `main` branch was touched.


## Demo seed and Settings reset compatibility (2026-11-07)
- Re-inspected the actual Settings UI and reset handlers in the source archive.
- Confirmed the visible Settings action is `clearData`: after owner confirmation it archives customers, pending tickets, and sequence number as one recoverable `bulk` trash item, then empties the active customer/ticket arrays and persists. It retains other app state such as settings/auth and the trash.
- Therefore a saved DEYN state with `customers: []` and `pending: []` is valid and must start normally. It is not a fresh install and must not trigger the demo seed or recovery screen.
- The app also has a separate `wipe` handler that empties those arrays without archiving; no visible `data-act="wipe"` button was found in the inspected Settings HTML. It is treated as apparently unused legacy code and was not changed.
- Added `recovery-mode/SETTINGS_RESET_BEHAVIOR_AUDIT.md` and 5 compatibility tests. All 5 tests passed locally: fresh install, existing demo data, intentional Settings reset with a bulk-trash record, valid empty state without trash, and damaged existing data.
- The demo seed and existing Settings reset/trash behavior must remain unchanged. The guard is only for an existing unreadable/invalid stored record or unavailable storage.
- No app source, production ZIP, APK, or `main` branch was changed.


## Read-only backup validator prototype (2026-11-07)
- Added `backup-validator/backup-validator.js`, its Node tests, and a README.
- Accepts the current legacy raw full-state JSON when the required `customers` and `pending` arrays are present; if `trash` exists it must be an array.
- Also validates a proposed versioned `DEYN_BACKUP` v1 envelope and checks its canonical SHA-256 digest.
- Preview reports customer, pending-ticket, and trash counts, plus whether auth/settings fields exist. It does not guess transaction counts because all transaction variants have not been fully mapped.
- Unknown fields, auth fields (including `fcb1899` if present), and bulk trash are preserved unchanged. Empty active arrays remain valid after the intentional Settings reset.
- 11 Node tests passed locally, covering legacy/versioned files, preservation, empty/reset states, malformed inputs, wrong versions, tampering, and fail-closed digest behavior.
- This is read-only prototype code only. It does not import/restore, write app storage, change the existing backup button, or modify production source/APK/`main`. Android WebView testing and a transactional restore design remain required.

## Recovered v2 package review (2026-11-07)

The previously saved v2 source package and the matching owner license-signing key were recovered from the Library. The private license key was verified to derive the public key already embedded in the v2 app/keygen. Actual keygen-to-app signing/verification checks passed in Node WebCrypto for a valid code; wrong-device and altered-signature checks were rejected. Both recovered HTML files passed JavaScript syntax checks.

This confirms the old shared HMAC secret can be removed from the v2 source. It does **not** make v2 ready for release. See `RECOVERED_V2_PACKAGE_REVIEW.md` for the blocking findings: unsigned/local-clock expiry, short device ID, plaintext localStorage fallback, incomplete clock warning/grace policy, undeployed trusted-time service, recovery-token integration, old-code migration, Android WebView validation, and missing release signing.

A separate Ed25519 keypair has now been created for the trusted-time service. Its public key is in `trusted-time-worker/client/public-key.js`; its private key is kept outside GitHub and APKs. A manual Cloudflare deployment workflow has been prepared and requires owner-controlled Cloudflare credentials and GitHub Actions secrets before it can be run. No Worker is deployed yet.

A CI workflow was added to run all security-lab JavaScript syntax checks and Node tests on pushes to this branch. The workflow file is present; its first remote run has not yet been confirmed.

The new GitHub Actions security-lab CI has now completed successfully after correcting one test import path: **51 tests passed, 0 failed**, and all JavaScript syntax checks passed (run `42321608221`, commit `7300a047af31b5340ab0b2a472beaab7afa9f957`). These are prototype/unit tests only; they do not replace Android device testing or prove the prototypes are integrated into the app.


## DEYN3 license prototype (2026-11-07)
- Added `security-lab/licensing-v3/license-v3.js`, an isolated Ed25519 signed-claim format.
- Expiry is now a signed exact UTC Unix-millisecond timestamp; lifetime tier uses null and is exempt from expiry.
- Device binding is 128-bit random hex, replacing the earlier 32-bit prototype identifier.
- Verifier requires trusted time as an input and rejects expired, wrong-device, malformed, non-canonical, altered-signature, wrong-key, and legacy DEYN2 codes.
- Added 8 Node tests. CI run `42322975776` completed successfully: 59 total security-lab tests passed, 0 failed.
- This remains a prototype only. It has not been integrated into app/keygen UI, does not solve old-code migration, and has not been tested on Android WebView.
