# DEYN2 → DEYN3 migration plan (lab only)

## Current-source facts

The recovered DEYN app currently uses a DEYN2 verifier and a legacy device ID:
- When the Capacitor Device plugin supplies an identifier, the app hashes it with SHA-256 but keeps only the first 4 bytes (32 bits), then displays it as `XXXX-XXXX`.
- If no native identifier is available, it loads or creates an 8-hex-character random ID and stores it through the current storage wrapper.
- The DEYN2 signed payload contains the device ID, tier, role and nonce, but no signed expiry timestamp.
- At activation time, the app calculates the 1-year / 2-year expiry from the phone's current local clock and stores that expiry locally.
- Existing license records, used-code records, last-seen clock data and device ID use legacy storage keys. The current storage wrapper also falls back to ordinary localStorage.

These details mean a direct replacement of the old ID or verifier would lock out existing customers. This document is a migration plan, not production code.

## Non-negotiable compatibility rules

1. Preserve the existing DEYN2 verifier and legacy device ID during the transition. Do not replace, overwrite or regenerate the existing `did`, `lic`, `used` or `lts` records.
2. Keep the v3 identity and license records in a separate namespace (for example `did_v3`, `lic_v3`, `used_v3`). Never repurpose legacy values.
3. Route by explicit prefix: DEYN2 to the legacy verifier; DEYN3 to the v3 verifier. A failed DEYN3 verification must never fall back to DEYN2. The lab-only router and tests implement this narrow rule.
4. Do not convert a DEYN2 code into a DEYN3 code on the device. The old payload has no signed expiry date, so the original entitlement expiry cannot be reconstructed from the signature.
5. Do not silently reseed, reset, migrate or rewrite customer debt data as part of license migration. Preserve the intentional demo seed on fresh installs and the existing Settings reset behavior.

## Device identity transition

The 8-character legacy ID has only 32 bits of entropy. Hashing it again or padding it to 32 hex characters does not create a secure 128-bit identity.

A v3 ID must be generated independently with a cryptographically secure random source (16 bytes / 128 bits) and stored in a native secure store. If secure storage is unavailable or cannot be read back, v3 activation must stop safely; do not use localStorage as a fallback for the v3 identity. Keep the old ID untouched for DEYN2 compatibility.

The v3 ID must be shown in the app's activation screen so the distributor can issue a matching DEYN3 code. Test persistence across app restarts, updates, reinstall behavior, device restore, and secure-store failure before customer rollout.

## Existing customers and entitlement continuity

- Existing customers with an already stored DEYN2 license must continue to use that record during a controlled transition window.
- Customers who have not yet activated an old DEYN2 code need a defined support/reissue process before a cutoff is enforced. The current DEYN2 payload does not prove when the code was issued.
- DEYN2 expiry was calculated locally at activation. Do not claim it is cryptographically protected. Decide whether grandfathered licenses retain the old expiry behavior or are moved to server-trusted time after an explicit migration/reissue.
- DEYN3 expiration is signed as an exact UTC timestamp and must be checked against authenticated trusted time, never the phone clock alone.

## Required release gates

Do not integrate the bridge into the production app or merge the lab branch until all of these are complete:
- Secure storage is fail-closed and verified on the target Android phone.
- v3 ID generation and persistence are tested on the target phone.
- Trusted-time service is deployed, configured and independently verified.
- DEYN3 verifier is integrated with authenticated trusted time.
- Dual-version routing and customer reissue/cutoff rules are tested with real upgrade scenarios.
- Existing customer debt data, demo seed, Settings reset, owner/worker behavior and lock-password recovery are regression-tested.
- Android System WebView supports Ed25519 on the target device.
- Release signing key and rollback/recovery process are established.

## Status

Lab design only. No production app source has been changed, no customer license has been migrated, and no DEYN3 code should be issued to customers yet.
