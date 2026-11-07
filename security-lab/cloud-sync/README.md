# DEYN cloud sync — isolated prototype

**Status: design + unit-test prototype only. Not connected to the app or a live Firebase project.**

This branch deliberately does not change `main`, the current APK, the DEYN2 license path, demo data, Settings reset, owner password, or existing owner/worker screens.

## Chosen direction

Use Firebase Authentication + Cloud Firestore, with one `shopId` for each shop and a separate device identity for every phone. The owner phone and worker phone must never share or clone a device ID. Both devices belong to the same shop and subscription, while each device has its own activation record and role.

- Owner device: full shop permissions.
- Worker device: read customers, create customers, add debt and payment entries; cannot edit/archive customers or change/delete ledger entries.\n- Owner can edit customer profiles and archive customers, but debt/payment history remains append-only for auditability; corrections should be represented by new compensating entries rather than erasing history.
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

- `sync-core.js`: pure logic for role permissions, event validation/deduplication, balance calculation, customer analytics, and revision-checked profile updates.\n- `sync-outbox.js`: offline queue prototype with idempotent enqueue, retry batches, attempt tracking, and removal only after backend acknowledgement. It is in-memory test logic only; a native durable storage adapter is still required.
- `test/sync-core.test.js`: Node tests for those invariants.
- `firestore.rules`: draft tenant-isolation and role rules. It is not deployed and requires emulator/security-rules tests plus review.
  
## Required before connecting a real store

1. Create a Firebase project under the owner's control and enable Authentication + Firestore.
2. Decide the sign-in/enrollment UX and implement a trusted backend that issues custom claims (`shopId`, `role`) only after validating the owner-issued device invitation. The client must never be allowed to assign itself owner role.
3. Test Firestore rules in the Firebase Emulator Suite, including cross-shop access, forged roles, worker delete/edit attempts, and unauthenticated access.
4. Integrate the native Android Firestore SDK through a maintained Capacitor plugin/bridge; verify offline writes survive app force-stop/restart and sync exactly once.
5. Migrate existing local DEYN data without deleting or replacing legacy keys. Preserve demo data and the existing Settings reset behavior. Never upload sample/demo records as a real shop.
6. Test two physical phones, airplane-mode edits, reconnects, simultaneous profile edits, repeated sync, app restarts, 500+ customers, backups, and owner-phone loss.
7. Only then prepare a release APK. No live credentials, service-account JSON, private signing keys, or API secrets belong in Git or in the APK.

## Current result

The isolated tests cover the pure merge and permission rules, including a 600-customer analytics fixture and duplicate-event handling. The summary routine aggregates debt, payments, balances, and counts in one pass after deduplication; this is a logic-scale test, not an Android performance benchmark. They do not prove Firestore deployment, authentication, Android offline persistence, or integration with the existing app. The app source has not been modified and no cloud data is being transmitted.
