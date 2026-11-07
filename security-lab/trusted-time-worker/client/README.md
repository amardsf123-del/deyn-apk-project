# App-side trusted-time verifier prototype

Import `verifyTrustedTimeResponse` after receiving the Worker JSON response. Supply the exact nonce generated for that request and the matching 32-byte Ed25519 public key encoded as base64.

The verifier checks the signature before parsing/trusting the timestamp, checks token purpose and version, binds the response to the request nonce, and validates the fixed five-minute signed validity window.

It intentionally does **not** compare the signed timestamp to the phone's current clock. The signed server time is the source of truth; comparing it to an incorrect local clock would reject valid time responses. The app must compare it against a previously verified secure anchor using the separately agreed rollback/warning state machine.

This module is not integrated into DEYN and has not been tested in the phone's Android WebView. Production must fail closed if Ed25519 is unsupported; do not fall back to the old HMAC secret.
