# DEYN trusted-time service design

## Protocol

1. The app creates a cryptographically random nonce for each check.
2. It POSTs the nonce to the configured HTTPS Worker endpoint.
3. The Worker returns a short-lived payload signed with a dedicated Ed25519 time-service key.
4. The app verifies the signature using the embedded time-service public key.
5. The app checks the exact nonce, purpose, issue time, expiry, and reasonable future skew.
6. Only then may it update the locally stored trusted-time anchor.

## Failure handling

- No network / timeout / 5xx: verification unavailable; do not classify as tampering by itself.
- Invalid signature / wrong nonce / malformed payload: reject response and record a security event.
- Signed time earlier than a previously verified anchor beyond the approved tolerance: enter the staged warning policy; preserve all data.
- Successful valid response: update trusted anchor and reset only the relevant unresolved verification state.

## Key management

The Worker time-signing key is independent from the DEYN license-signing key. The private key exists only as a Worker secret and an offline owner backup. The app receives only the public key.

## Not yet implemented

The app-side verifier, secure anchor persistence, warning/grace state machine, one-time recovery token, deployment, and target-device tests are not complete. The Worker template alone does not provide protection until all these parts are implemented and verified.
