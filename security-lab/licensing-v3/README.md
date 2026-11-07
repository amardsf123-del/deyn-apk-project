# DEYN v3 signed-license prototype

Status: isolated prototype only. It is not integrated into either app and must not be issued to customers yet.

## Wire format and claims
- Prefix: `DEYN3-`; body and Ed25519 signature are base64url separated by a dot.
- Canonical signed JSON claim order: `v,d,t,r,exp,n`.
- Device binding: cryptographically random 128-bit identifier (32 hexadecimal characters).
- Tiers: `1Y`, `2Y`, `LT`; roles: `M` (owner/master), `W` (worker).
- `exp` is an exact UTC Unix timestamp in milliseconds, signed into the payload; lifetime uses null.
- Expiry is enforced at `trustedNowUtcMs >= exp`; verification refuses to use the device clock as its trust source.
- Unknown fields and non-canonical JSON are rejected.

## Experimental v3 key generator
The isolated Arabic UI is in `keygen-v3/index.html` and `keygen-v3/ui.js`.
- Requires a 32-character hexadecimal device ID.
- Owner chooses the final valid calendar date; the signed expiry is midnight UTC on the following day, so the chosen date remains valid for the whole day.
- Lifetime tier has no expiry date.
- The issuer checks that the supplied PKCS#8 PEM key matches the configured v3 public key before signing.
- The visible private-key field is cleared after successful use; no key is written to localStorage or sent over the network.
- The UI references the shared `license-v3.js` signing implementation. It is a lab-only page and is not packaged into the customer keygen APK.

## Version routing and migration
`license-version-router.js` routes DEYN2 only to the legacy verifier and DEYN3 only to the v3 verifier. A rejected DEYN3 code never falls back to DEYN2. See `LICENSING_V2_TO_V3_MIGRATION_PLAN.md` before any integration; the plan preserves old device IDs and license records and requires separate v3 storage.

## Key handling
The app receives only the raw public key. The issuer receives the PKCS#8 private key at runtime. Never commit, bundle, or share the private key.

## Migration warning
This v3 format is incompatible with DEYN2 and the legacy HMAC format. Do not replace existing verification until a customer reissue/migration process is implemented and tested. Never re-sign customer entitlements on-device.

## Test command
```sh
node --test security-lab/licensing-v3/test/*.test.js security-lab/licensing-v3/keygen-v3/test/*.test.js
```
These Node tests do not establish Android WebView compatibility, secure-storage behavior, app integration, or production readiness.
