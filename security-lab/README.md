# DEYN security v2 lab — not integrated

This branch is an isolated preparation area. Nothing here is included in either Android app yet.

## Current status
- The current production source in the ZIP remains unchanged.
- The v2 Ed25519 prototype has passed local tests with a temporary test keypair only.
- The configured public key is `GGV7VOrfbHEBHxS/wzJ7OeZsBc2Jx013mPZT5s4GML4=`.
- The corresponding production private PEM has not been recovered. Never commit or upload a private signing key.
- A Cloudflare Worker signed-time template has been added under `security-lab/trusted-time-worker/`.
- Its JavaScript syntax check passed, and 3 local tests passed: valid Ed25519 signature + nonce binding, malformed nonce rejection, and missing-secret fail-closed behavior.
- Trusted-time service is not deployed or configured; no endpoint or production key exists.
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
