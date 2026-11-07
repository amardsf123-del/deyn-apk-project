# DEYN v2 compatibility notes

Checked 2026-11-07.

## Ed25519 in Android WebView
MDN Browser Compatibility Data lists Web Crypto Ed25519 support beginning with Chrome 137, with Android Chrome and Android WebView inheriting the Chrome support entry. This does not prove the user's installed Android System WebView is new enough. DEYN must detect support at runtime and be tested on the actual Android 13 phone before adopting the WebCrypto-only implementation.

Reference: https://github.com/mdn/browser-compat-data/blob/main/api/SubtleCrypto.json
Chrome guidance: https://developer.chrome.com/docs/modern-web-guidance/guides/security/digital-signatures

## Trusted-time backend option
Cloudflare Workers documents Web Crypto Ed25519 sign/verify support. A Worker can therefore issue a signed time response that the app verifies with an embedded public key. This is a plausible backend option, but it still requires an owner-controlled Cloudflare account, deployment, secret configuration, endpoint, and operational testing. No backend has been deployed or configured yet.

Reference: https://developers.cloudflare.com/workers/runtime-apis/web-crypto/

## Required implementation behavior
- Fail closed for license activation if Ed25519 verification is unavailable; do not silently fall back to the old shared HMAC secret.
- Keep debt data untouched if trusted-time verification fails.
- Distinguish network unavailability from invalid signatures and suspicious clock rollback.
- Test offline launch, online activation, reconnect, reboot, timezone change, WebView update, and server outage on the target phone.
