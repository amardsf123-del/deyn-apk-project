# DEYN cloud sync — isolated prototype

**Status: design + automated test prototype only. Not connected to the app or a live Firebase project.**

This branch deliberately does not change `main`, the current APK, the DEYN2 license path, demo data, Settings reset, owner password, or existing owner/worker screens.

## Chosen direction

Use Firebase Authentication + Cloud Firestore, with one `shopId` for each shop and a separate device identity for every phone. The owner phone and worker phone must never share or clone a device ID. Both devices belong to the same shop and subscription, while each device has its own activation record and role.

- Owner device: full shop permissions.
- Worker device: read customers, create customers, add debt and payment entries; cannot edit/archive customers or change/delete ledger entries.
- Owner can edit customer profiles and archive customers, but debt/payment history remains append-only for auditability; corrections should be represented by new compensating entries rather than erasing history.
- Owner recovery on the worker phone: a verified owner sign-in/elevation flow changes the permission session on that phone. It does not clone the owner's device ID or erase the worker's enrollment.
- Subscription expiry belongs to the shop subscription; per-device licenses reference the same shop subscription end date.
- Customer balances are derived from immutable debt/payment events, not by syncing a mutable balance field.
- Every event has a globally unique ID. Re-delivery is idempotent; reusing an ID with different content is rejected.
- Customer profile edits use a revision number; stale edits are rejected instead of silently overwriting another phone's newer edit.
- No fixed customer-count ceiling is introduced by this prototype.

## Offline behavior

The intended Android app must keep a local working copy, queue writes while disconnected, and reconcile when online. Firestore's native Android SDK supports persistent offline data and queues writes. The current DEYN app is a Capacitor/WebView app, so the exact native Firestore bridge and persistence behavior must be selected and verified on the actual Android WebView/device before app integration. Do not assume browser IndexedDB persistence is equivalent to native Android persistence.

Offline changes are provisional until the backend accepts them. The UI must distinguish **saved on this phone / waiting to sync** from **synced to the shop account**. Security rules are checked by the backend, not while offline; therefore the app must not present offline role checks as server authorization.

## Files

- `sync-core.js`: pure logic for role permissions, event validation/deduplication, balance calculation, customer analytics, and revision-checked profile updates.
- `sync-outbox.js`: offline queue prototype with idempotent enqueue, retry batches, attempt tracking, and removal only after backend acknowledgement. It is in-memory test logic only; a native durable storage adapter is still required.
- `shop-membership-model.js`: pure authorization and one-time worker invitation state-transition model. Real invitation redemption still needs a server-side Firestore transaction.
- `firestore.rules`: tenant-isolation and role rules draft.
- `emulator-tests/firestore.rules.test.js`: executable Firestore Emulator tests.
- `firebase.cloud-sync.json` (repository root): isolated emulator configuration.

## Automated verification

The GitHub Actions workflow now starts the Firebase Firestore Emulator and runs the security-rules tests in addition to the JavaScript unit tests.

Latest emulator verification:
- Workflow run: [42381131975](https://github.com/amardsf123-del/deyn-apk-project/actions/runs/42381131975)
- Firestore rules tests: **11 passed, 0 failed**
- Covered: worker read/create and ledger append; worker profile edit/delete denial; append-only ledger; owner revision checks; cross-shop isolation; forged owner-role rejection; unauthenticated access; expired subscription; invalid ledger amount and missing customer.

These tests execute against the emulator, not a deployed Firebase project. They validate the current draft rules for the tested cases only; they do not prove the backend invitation transaction, production account configuration, or Android integration.

## Required before connecting a real store

1. Create a Firebase project under the owner's control and enable Authentication + Firestore.
2. Implement a trusted backend that issues custom claims (`shopId`, `memberRole`, `deviceId`) only after validating owner-issued device invitations. The client must never be allowed to assign itself the owner role.
3. Redeem worker invitations and register devices in one server-side Firestore transaction, so two requests cannot redeem the same invitation.
4. Extend emulator tests for invitation redemption, device registration, archive behavior, and any additional customer fields before deployment.
5. Integrate the native Android Firestore SDK through a maintained Capacitor plugin/bridge; verify offline writes survive force-stop/restart and sync exactly once.
6. Migrate existing local DEYN data without deleting or replacing legacy keys. Preserve demo data and the existing Settings reset behavior. Never upload sample/demo records as a real shop.
7. Test two physical phones, airplane-mode edits, reconnects, simultaneous profile edits, repeated sync, app restarts, 500+ customers, backups, and owner-phone loss.
8. Only then prepare a release APK. No live credentials, service-account JSON, private signing keys, or API secrets belong in Git or in the APK.

## Current limitations

The isolated tests cover the pure merge and permission logic, including a 600-customer analytics fixture and duplicate-event handling. The summary routine aggregates debt, payments, balances, and counts in one pass after deduplication; this is a logic-scale test, not an Android performance benchmark.

There is no live Firebase project, no deployed backend, no live sync endpoint, and no integration into the current DEYN app. No customer data is being transmitted. The app source on `main` remains unchanged.
