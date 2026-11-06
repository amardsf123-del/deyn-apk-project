# DEYN security audit — 2026-11-07

## Scope inspected
The uploaded `deyn-apk-project.zip` was extracted in GitHub Actions. The source contains two Capacitor apps:
- `deyn-app/www/index.html` (DEYN)
- `deyn-keygen/www/index.html` (license generator)

Both JavaScript bundles pass a JavaScript syntax parse check under Node.js 22. This is not an Android build or device test.

## Confirmed issues in the uploaded source
1. The same HMAC secret is embedded in both apps: `DEYN_OFFLINE_SECRET_ALGERIA_2026_FCB1899`. A user who extracts either APK can recover it and forge codes.
2. License signatures are truncated to 8 hexadecimal characters (32 bits), which is not a strong signature.
3. The app has a hard-coded factory password `fcb1899` in role switching, app unlock, and password reset paths.
4. A custom XOR + HMAC wrapper is used as a localStorage fallback. This is obfuscation, not secure encryption.
5. Device ID is truncated to 8 hex characters (32 bits), which is collision-prone.
6. Term licenses calculate expiry from the device's local activation time rather than a signed calendar expiry date.
7. Clock rollback immediately overlays a lock after a two-minute discrepancy. There are no agreed three warning stages, 48-hour grace, signed trusted-time tokens, or one-time device recovery tokens.
8. The initial auth seed includes the factory password and example master/assistant codes.

## Agreed v2 direction
- Ed25519 signatures; app embeds public key only.
- Key generator accepts the owner's private PKCS#8 PEM at runtime, checks it matches the app public key, and never stores or bundles it.
- Signed payload binds version, full device ID, role, tier, exact expiry timestamp/date, and a random nonce.
- Lifetime licenses have no term expiry.
- Time verification must use signed trusted-time responses, not an unsigned public clock endpoint.
- Three user-friendly warnings, then 48-hour grace; preserve debt data and license record.
- Device-bound, one-use recovery token restores the same license/time anchor and cannot extend expiry.
- Remove all factory/master bypass passwords without breaking existing owners' access.

## Blockers before a safe production integration
- The archive contains no Ed25519 private PEM, and no private key can be reconstructed from the public key. The key generator must not be tested with an unrelated key and then shipped.
- No trusted-time backend or backend signing key/configuration exists in the repository. An unsigned time API would not meet the agreed security requirement.
- The current project contains no generated Android platform folders; APK building is performed by GitHub Actions and still needs an actual build result.
- Real Android/WebView and data-migration testing remains necessary.

## Work completed in this audit step
- Extracted and inventoried the archive.
- Reviewed the activation, storage, clock, role-switching, password-reset, and key-generation code.
- Confirmed both current HTML JavaScript bundles parse.
- Built a separate Ed25519 v2 prototype and ran positive/negative tests with a temporary test key: valid device-bound license, wrong device, altered signature, expiry, lifetime license, and key mismatch. The temporary test key is not the production key and is not included in DEYN.

## Important status
The production app and key generator have NOT yet been switched to v2. No production APK has been built or security-tested. Do not distribute the current APKs as protected releases.
