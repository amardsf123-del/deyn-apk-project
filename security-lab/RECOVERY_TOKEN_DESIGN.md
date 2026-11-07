# DEYN one-time recovery token design

## Purpose

A recovery token is for restoring a lost or corrupted activation/time-anchor record on the **same licensed device**. It is not a password reset, a new license, an expiry extension, a role change, or a debt-data reset.

## Required signed payload

The token issuer signs a canonical payload containing:

- `v`: protocol version.
- `purpose`: exactly `DEYN_ACTIVATION_RECOVERY`.
- `deviceId`: the full device identifier bound to the existing license.
- `licenseId`: stable identifier of the existing signed license.
- `tier`: exactly the tier already on the license.
- `role`: exactly the role already on the license.
- `licenseExpiresAtMs`: exact expiry already present in the signed license; lifetime is represented consistently as null.
- `trustedTimeMs`: a fresh trusted timestamp obtained from the signed time service, not the keygen phone's unverified local clock.
- `issuedAtMs` and `tokenExpiresAtMs`: token validity window, no more than 24 hours.
- `nonce`: cryptographically random one-time token identifier.

## App acceptance checks

The app must verify the signature first, then require all of the following:

1. Purpose and version match exactly.
2. Device ID, license ID, tier, role, and expiry exactly match the currently installed signed license.
3. Trusted time is valid and is not earlier than any still-trusted secure time anchor.
4. Token is not expired and is not issued in the future beyond a small documented clock-skew allowance.
5. Token nonce/hash has never been consumed on this installation.
6. The token is recorded as consumed in secure storage **before** restoring the anchor, so a crash/retry cannot reuse it.
7. Only the time anchor / activation metadata may be restored. Do not rewrite the license expiry, role, tier, debt data, or customer records.

## Issuer checks

The owner/key generator must first verify the original license signature and device binding, then obtain a fresh signed trusted-time response and confirm the original license has not expired. It must refuse recovery if the original license is expired. It signs a token for that exact license only.

## Important limitation

A one-use token cannot be guaranteed one-use across a full device data wipe if the consumed-token ledger is stored only on that device. A stronger guarantee requires server-side redemption tracking or a secure hardware-backed monotonic store. Until such a service exists, describe it as one-use per intact secure installation, not globally one-use.

## Not implemented

No recovery token is currently generated or accepted by either DEYN app. This document is a protocol design only. It depends on the production license private key being recovered, the trusted-time service being deployed, and an app-side secure-storage migration being implemented and tested.
