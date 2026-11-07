# DEYN cloud-sync client integration plan

This is the implementation contract for integrating the isolated backend into the existing Capacitor app. It does not modify the app source or production APK.

## Current app compatibility findings

The recovered app package uses Capacitor 7:
- `@capacitor/core`, `@capacitor/android`, `@capacitor/device`, and `@capacitor/clipboard` are on the 7.x line.
- `capacitor-secure-storage-plugin` is currently declared as `^0.11.0`, which targets Capacitor 7.

The current Firestore plugin 8.x line requires Capacitor 8; the plugin's 7.x line supports Capacitor 7 but is marked deprecated. Therefore, do not simply add the latest plugin to the current app. A deliberate Capacitor 8 upgrade and native build verification is the preferred long-term path, but it must be tested in an isolated app branch because it changes the native runtime and secure-storage plugin version as well.

The current secure-storage plugin's release history identifies 0.11.x as its Capacitor 7 line and 0.13.x as its Capacitor 8 line. An isolated Capacitor 8 dependency-resolution check now installs the 8.6 Firebase plugins and secure-storage 0.13.0 together. The candidate bridge package reports zero npm audit vulnerabilities after pinning the transitive gRPC transport to a patched release. This is dependency validation only; it is not an Android build or runtime/offline test. The current app must not be upgraded in place until the complete Android build and license storage tests pass.

## Required client flow

### 1. First owner device / shop provisioning

1. Owner account is authenticated with Firebase Authentication and verified email.
2. The trusted platform administrator provisions the shop after purchase/license approval for the customer's verified Firebase UID and email. The operator receives only the shop ID; no owner session token is returned to the operator.
3. The owner signs into their own account on their phone and reads the shop ID from their private `users/{uid}/shops` index.
4. The owner app calls `enrollOwnerDevice` with that phone's 128-bit device ID after recent re-authentication.
5. Backend registers the device and returns a device-scoped Firebase custom token. The app signs in with it; session claims are `shopId`, `memberRole=owner`, and `deviceId`.

### 2. Worker phone

1. Owner creates a time-limited invitation for the worker's verified email.
2. Worker signs in with their own Firebase account and redeems the invitation on their phone.
3. Backend consumes the invitation and writes member + device + private user-shop index records in one transaction.
4. Backend returns a worker-scoped custom token; app signs in with it.
5. Worker may read customers, create customers, add debt and add payment only.

### 3. Owner recovery on worker phone

1. Owner signs into the primary owner Firebase account on that same physical phone and completes recent re-authentication.
2. App obtains that phone's own device ID (it remains unchanged).
3. Backend registers a separate owner enrollment for the same device ID + owner UID pair.
4. Backend returns a new owner-scoped custom token.
5. Worker enrollment on the phone remains intact. The user can later sign out of owner and return to worker access.

### 4. Normal session renewal / revocation

- At startup, app checks local enrollment and requests `issueDeviceSession` after authentication.
- If a device is revoked or the worker membership is deactivated, server rules deny further reads/writes even if an old token remains on the device.
- Client never writes member role, device status, subscription expiry, invitation status, or shop owner UID.
- Current prototype limit: two unique physical device IDs per shop. Owner and worker enrollments on the same physical phone share that phone's device ID and count once. Revoking a worker account revokes all of that worker's device enrollments.

## Data synchronization contract

- Customer profiles: `shops/{shopId}/customers/{customerId}`, revision-controlled.
- Debt/payment events: `shops/{shopId}/ledger/{eventId}`, append-only.
- All amounts: integer `amountCentimes`, not JavaScript decimal DZD values.
- Customer balance: calculated from unique ledger events; never trusted as a separately synced balance field.
- Customer deletion: soft archive only; never delete the ledger.
- Every new ledger event uses a cryptographically random ID. Migration of legacy transactions uses deterministic IDs namespaced by the device and customer.
- The app displays whether changes are local-only, waiting to sync, or confirmed by the backend.

## Offline and persistence requirements

The Android app must use a native Firestore SDK bridge with persistence enabled before any Firestore calls. Offline persistence must be verified on the actual Android build for:
- airplane mode,
- force-stop and restart,
- app update,
- reconnect and retry,
- duplicate sync,
- owner and worker sessions on one phone,
- two phones editing the same customer,
- subscription expiry while offline.

The Firestore native Android SDK supports local persistence and queues writes while offline. Web-only IndexedDB persistence is not accepted as the sole proof for this Capacitor app. Do not clear Firestore persistence during normal sign-out or app lock; that would erase cached data and pending writes.

See [LEGACY_DATA_MAPPING.md](./LEGACY_DATA_MAPPING.md) for the exact mapping from `deyn.v1`, centime conversion, stable migration IDs and fields that must never be uploaded.

## Local data and demo safety

The current app stores business data in `localStorage['deyn.v1']`. The migration helper maps only active customers and their `tx[]` entries. It deliberately excludes pending tickets, trash snapshots, auth/password fields, license records and settings.

The app must not automatically upload the seeded sample customers. First sync requires explicit owner confirmation after the existing Settings reset has been used when the active records are still demo data. Preserve the local demo content, the Settings reset behavior, and the factory password `fcb1899`; do not sync that password.

## Integration gates

1. Select and pin a Capacitor-compatible Firebase plugin set.
2. Upgrade Capacitor 7 to 8 in an isolated branch and update the compatible secure-storage plugin; do not change `main` yet.
3. Add Firebase Android configuration only after the owner creates their Firebase project.
4. Implement client Authentication custom-token sign-in and callable function invocations.
5. Implement native Firestore reads/listeners/writes with persistent offline cache.
6. Implement a durable local migration/outbox state, with server acknowledgements.
7. Integrate the migration helper and explicit demo-data confirmation.
8. Test all behaviors on two physical Android phones before producing a new APK.
