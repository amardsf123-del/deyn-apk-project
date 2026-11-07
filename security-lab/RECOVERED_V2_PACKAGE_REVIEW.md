# Review of recovered DEYN v2 package

Date: 2026-11-07

## Recovery and verification performed

- Recovered the previously generated owner-only PKCS#8 private signing-key file from the user's Library. The key remains outside this repository and outside all APKs.
- Derived the Ed25519 public key from that private key with OpenSSL. It exactly matches the public key embedded in both v2 source files:
  `GGV7VOrfbHEBHxS/wzJ7OeZsBc2Jx013mPZT5s4GML4=`.
- Ran Node.js WebCrypto tests against the actual recovered private key and the app's verifier:
  - valid signature accepted;
  - different device ID rejected;
  - altered signature rejected.
- Parsed both app and key-generator inline JavaScript with `node --check`; both passed.
- Compared the recovered v2 app HTML against the earlier source archive. The visible application/features source is unchanged apart from the activation-code input and licensing/security implementation. The demo seed, Settings reset behavior, `fcb1899`, and existing owner/worker logic remain present in the source.

## Blocking findings — do not release this package yet

1. **Expiry is not signed.** The current v2 payload contains version, device ID, tier, role, and nonce, but no fixed expiry date. The app calculates the 1Y/2Y expiry from the phone's local clock during activation. This does not satisfy the agreed fixed signed expiry.
2. **Device ID is still only 32 bits.** The current format is eight hexadecimal characters (shown as `XXXX-XXXX`). It needs a migration-safe stronger identifier before customer distribution.
3. **Storage fallback is plaintext.** The v2 `DeynStore` falls back to ordinary localStorage for license/device/time records. This is weaker than the earlier obfuscated fallback and must be replaced with a fail-closed, tested native secure-storage path for sensitive activation state.
4. **Clock policy is incomplete.** This package still uses a two-minute rollback lock. It does not integrate the agreed three warning stages, 48-hour grace period, snooze behavior, incident debouncing, or lifetime exemption.
5. **Trusted time is not connected.** The separate signed-time Worker prototype is not deployed and no endpoint or Worker signing secret is configured.
6. **Recovery token is design-only.** No issuer, redemption tracking, or app-side one-time recovery flow is integrated.
7. **Legacy migration is unresolved.** The v2 verifier intentionally rejects the old HMAC code format. A controlled reissue/compatibility plan is required before any customer holding an old code is upgraded.
8. **Android WebView compatibility is unverified.** Node.js passing Ed25519 tests does not prove the installed Android System WebView on the target phone supports the required WebCrypto operations.
9. **Release signing is not ready.** A stable Android release keystore has not been provisioned and tested. Debug APKs are not distributable releases.

## Decision

The recovered v2 package is a useful intermediate security baseline and its signing key pair is valid, but it is **not a final protected release**. Keep it isolated from `main`. Do not generate or distribute a customer APK from it until the blockers above are resolved and the resulting APK is tested on a real Android device.

The private PEM, any derived private-key material, and all signing secrets must remain outside GitHub and outside the APKs.
