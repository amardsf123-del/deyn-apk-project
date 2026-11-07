# Shop membership and device authorization model

This is the data model used by the isolated, emulator-tested Cloud Functions prototype. It is not deployed and is not integrated into the Android application.

## Authority boundary

- Authentication identity comes from a Firebase ID token verified by Firebase.
- Shop, member and device records are fetched from the trusted database.
- Never trust client-submitted role, subscription expiry, owner UID, or device status.
- The trusted server issues a custom token only after validating those records.
- Protected requests re-check membership, device registration, status, and shop-wide expiry.
- The ordinary Firebase user custom claims are global to a UID. Device-specific claims are placed in each minted custom-token session.

## Firestore structure

- `shops/{shopId}`: `ownerUid`, `status`, `subscriptionExpiresAtMs`, `maxDevices` (currently 2 physical phones), `schemaVersion`, creation/update timestamps.
- `shops/{shopId}/members/{uid}`: `uid`, `role` (owner/worker), `status`.
- `shops/{shopId}/devices/{deviceId}__{uid}`: `deviceId`, `uid`, `role`, `status`, `approvedByUid`, creation timestamp. The composite key allows one physical phone to have separate owner and worker sign-in enrollments without overwriting either.
- `shops/{shopId}/invitations/{secretHash}`: email-bound worker invitation, expiry, status and redemption metadata. The raw secret is never stored.
- `shops/{shopId}/customers/{customerId}`: strict profile schema, revision, archive timestamp.
- `shops/{shopId}/ledger/{eventId}`: immutable debt/payment event with integer centime amount.
- `shops/{shopId}/subscriptionAudit/{auditId}`: append-only subscription expiry changes, actor and timestamp.
- `users/{uid}/shops/{shopId}`: private shop discovery pointer; the user can read only their own index and clients cannot write it.

Subscription expiry belongs to the shop, not one phone. Each physical phone keeps its own independent 128-bit device ID while referring to the same shop. Owner and worker enrollment records for one phone share the same device ID and count as one physical device toward the current two-device limit.

## Provisioning and recovery

A verified platform administrator provisions a shop after purchase approval for a verified customer Firebase UID/email. The operator does not receive the customer's owner session token. The customer signs in on their own phone, reads their shop ID from their private user-shop index, and registers that phone using recent re-authentication.

Worker enrollment requires a pending invitation tied to the exact shop and verified worker email. Invitation consumption, worker member creation, device enrollment and user-shop index update occur in one Firestore transaction. Concurrent attempts/replays fail. Owner can revoke a device or deactivate a worker; deactivation revokes all that worker's device records and updates their shop pointer.

If the owner signs in on the worker's already-enrolled phone, the physical device ID stays the same; a separate owner enrollment keyed by device ID plus owner UID is created, so the worker enrollment is preserved. This is allowed under the two-physical-device limit because it is the same phone. No device ID is cloned from the owner's old phone.

Only the platform administrator can renew or change the shop subscription. Each change writes a subscription audit record. A shop ID, local-storage edit, or client-side role change is insufficient to grant owner access or extend expiry.

## Integration gates

1. Create and configure the real Firebase project, Authentication, Firestore and App Check.
2. Deploy the tested functions and Firestore rules only after the platform admin and customer provisioning flow is reviewed.
3. Integrate native Android Firebase auth, custom-token session sign-in and persistent Firestore.
4. Migrate only owner-confirmed real data; exclude demo seed, trash, auth and licensing fields.
5. Test two phones, device cap, owner recovery, invitation replay, offline queue/retry, force-stop/restart, 500+ customers, owner phone loss, revocation and subscription expiry before release.
