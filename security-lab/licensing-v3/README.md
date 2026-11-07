# DEYN v3 signed-license prototype

Status: isolated prototype only. It is not integrated into either app and must not be issued to customers yet.

## Wire format and claims

- Prefix: `DEYN3-`
- Body and signature are base64url separated by a dot.
- Ed25519 signs the exact canonical JSON bytes.
- Claims are fixed and ordered: `v,d,t,r,exp,n`.
- Device binding is a cryptographically random 128-bit identifier (32 hexadecimal characters).
- Tiers: `1Y`, `2Y`, `LT`.
- Roles: `M` (master/owner), `W` (worker).
- `exp` is an exact UTC Unix timestamp in milliseconds, signed into the payload. For lifetime tier only, it is null.
- A signed code is rejected at the expiry instant (`trustedNowUtcMs >= exp`).
- Verification requires an externally authenticated trusted timestamp; it deliberately refuses to use the device clock as the trust source.
- Unknown fields and non-canonical JSON are rejected.

## Key handling

The app receives only the raw public key. The issuer receives the PKCS#8 private key at runtime. The caller must keep the private key in memory only, clear the input after use, and never persist or bundle it.

## Migration warning

This v3 format is deliberately incompatible with DEYN2 and the legacy HMAC format. Do not replace existing verification until a customer reissue/migration process is implemented and tested. Never re-sign customer entitlements on-device.

## Test command

```sh
node --test security-lab/licensing-v3/test/*.test.js
```

These Node tests do not establish Android System WebView compatibility, secure-storage behavior, app integration, or production readiness.
