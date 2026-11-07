# DEYN cloud sync — isolated prototype

**Status: architecture + emulator-tested backend prototype. Not deployed and not connected to the app or a live Firebase project.**

This branch deliberately does not change `main`, the current APK, the DEYN2 license path, demo data, Settings reset, owner password, or existing owner/worker screens.

## Chosen direction

Use Firebase Authentication + Cloud Firestore, with one `shopId` for each shop and a separate device identity for every physical phone. The owner phone and worker phone must never share or clone a device ID. Both devices belong to the same shop and subscription, while each device has its own enrollment and role.

- Owner: full shop permissions.
- Worker: read customers, create customers, add debt and payment entries; cannot edit/archive customer profiles or change/delete ledger entries.
- Owner can edit/archive customer profiles, but debt/payment history remains append-only; corrections should use compensating entries.
- Owner recovery on another phone requires the primary owner to sign in again and pass recent authentication. It does not clone the old device ID or erase the worker's enrollment on that phone.
- Subscription expiry belongs to the shop subscription, not a single device.
- Customer balances are derived from immutable debt/payment events, with every DZD amount stored as integer centimes.
- Event IDs are unique and idempotent; reusing an ID with different content is rejected. Legacy transaction IDs are deterministically namespaced by device and customer.
- Customer profile edits use revisions to reject stale overwrites.
- No arbitrary fixed customer-count ceiling is introduced.

## Implemented isolated backend

The `functions/` package now contains Firebase callable backend prototypes, and `legacy-migration.js` maps the existing `deyn.v1` local data model into safe cloud records. Migration requires explicit real-data confirmation and excludes pending tickets, trash/demo snapshots, local passwords, license records, and settings.

- Provision a shop and initial owner device enrollment only through a trusted platform administrator after purchase/activation approval; ordinary users cannot create themselves an unlimited subscription.
- Register another owner device after recent owner re-authentication.
- Create expiring, email-bound, single-use worker invitations.
- Redeem an invitation using one Firestore transaction that consumes the invite and registers the worker membership/device.
- Mint device-specific Firebase custom-token sessions after checking authoritative records.
- Revoke one device or deactivate a worker membership.

**Important identity detail:** Firebase user-level custom claims are global to a UID. A user may use several physical phones, so storing one device ID in global user claims would break multi-device sessions. The prototype uses a Firebase custom token with per-session claims (`shopId`, `memberRole`, `deviceId`) after server-side validation.

App Check is enforced on callable endpoints. Worker invitations require a verified email. The invitation secret is returned once; only its SHA-256 hash is stored. Concurrent redemption attempts are tested to ensure only one succeeds.

## Automated verification

Latest passing workflow: [42382365427](https://github.com/amardsf123-del/deyn-apk-project/actions/runs/42382365427).

| Test group | Passed | Failed |
|---|---:|---:|
| Existing security and sync logic + legacy migration | 116 | 0 |
| Firestore Security Rules emulator | 15 | 0 |
| Backend membership transactions | 13 | 0 |
| Capacitor 8 bridge dependency resolution | passed | 0 |\n| **Total tests** | **144** | **0** |

Rules tests cover worker permissions, owner profile revisions/archive, append-only ledger, forged role, cross-shop isolation, expired subscriptions, protected shop/invitation metadata, invalid timestamps and device mismatches.

Backend tests cover shop creation, second owner device enrollment, email-bound invitation, single-use and concurrent redemption, expiry, forged owner session, worker deactivation, device revocation, and session issuance.

These tests run against Firebase Emulator, not a deployed project. They validate the tested cases, not production account configuration or Android integration.

## Offline behavior

The intended Android app must keep a local working copy, queue writes while disconnected, and reconcile when online. The current DEYN app is a Capacitor/WebView app, so the exact native Firestore bridge and persistence behavior must be selected and verified on the actual Android WebView/device. Do not assume browser IndexedDB persistence is equivalent to native Android persistence.

Offline changes are provisional until the backend accepts them. The UI must distinguish **saved on this phone / waiting to sync** from **synced to the shop account**. The app must not present offline role checks as server authorization.

## Still required before a real shop is connected

1. Create a Firebase project owned by the business, enable Authentication + Firestore, configure App Check, and set the required deployment region/billing.
2. Review and deploy the callable backend and Firestore rules using the user's own Firebase project; no project credentials are present in this repo.
3. Integrate the client sign-in-with-custom-token flow and native Firestore persistence/bridge into the actual DEYN app.
4. Migrate existing local DEYN data without deleting/replacing legacy keys. Preserve demo data and Settings reset; never upload demo records as a real shop.
5. Test two actual phones, offline writes, force-stop/restart, reconnect/retries, simultaneous profile edits, backups, owner-phone loss and subscription expiry.
6. Test 500+ real-shaped customers on target phones and verify search/analytics responsiveness.
7. Only then build and test a release APK. Never commit service-account keys, signing keys or secrets.

## Current limitations

There is no live Firebase project, deployed backend, sync endpoint, or app integration. No real customer data is transmitted. Subscription payment/renewal administration and account deletion are not implemented. The outbox helper is still in-memory logic; durable offline storage requires a native adapter. The app-side Capacitor 8 upgrade and native Firebase plugin build/runtime tests are still pending. The recovered app uses Capacitor 7. An isolated dependency-resolution check now tests the maintained Capacitor 8 Firebase plugin set with the matching secure-storage version; this is not yet an Android runtime test. The app source on `main` remains unchanged.
