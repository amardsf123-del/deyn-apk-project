# Shop membership and device authorization prototype

This is a policy prototype, not a deployed Firebase Function and not integrated
into the Android application.

## Authority boundary
- Authentication identity must come from a Firebase ID token verified by Firebase Admin SDK.
- Shop, member, and device records must be fetched from the trusted database.
- Never trust client-submitted role, subscription expiry, owner UID, or device status.
- The trusted server issues custom claims only after validating those records.
- Protected requests re-check membership, device registration, status, and shop-wide expiry.

## Suggested Firestore structure
- shops/{shopId}: ownerUid, status, subscriptionExpiresAtMs, schemaVersion.
- shops/{shopId}/members/{uid}: uid, role (owner/worker), status.
- shops/{shopId}/devices/{deviceId}__{uid}: deviceId, uid, role, status, approvedByUid, createdAt. The composite key allows one physical phone to have separate owner and worker sign-in enrollments without overwriting either.
- shops/{shopId}/customers/{customerId}: profile, revision, archivedAt.
- shops/{shopId}/ledger/{eventId}: immutable debt/payment event.

Subscription expiry belongs to the shop, not one phone. Each physical phone
keeps its own independent 128-bit device ID while referring to the same shop.

## Recovery policy
A worker phone stays a worker phone by default. Worker enrollment requires a
pending invitation tied to the exact shop and worker UID, plus approval from a
verified owner session backed by the owner's active member and device records.
Invitations expire and cannot be reused as proof of owner authority. Full owner
access on a replacement phone requires the owner to authenticate as the same
primary owner account and register that account on the phone. If the owner
signs in on the worker's already-enrolled phone, the physical device ID stays
the same; a separate device enrollment keyed by device ID plus owner UID is
created, so the worker enrollment is preserved. No device ID is cloned from
the owner's old phone. A shop ID,
local-storage edit, or client-side role change is insufficient. This prototype
does not let an arbitrary worker UID become the primary owner UID.

## Integration gates
1. Implement trusted server functions to create shops, invite workers,
   approve/register devices, issue/revoke claims, and perform owner recovery.
2. Bind every operation to verified UID and server-fetched records.
3. Add Firebase Emulator tests for forged claims, revoked devices, cross-shop
   access, expired subscriptions, worker restrictions, and owner recovery.
4. Integrate native Android persistence/sync; this file does not provide it.
5. Test two phones, offline queue/retry, restart, 500+ customers, owner phone
   loss, and subscription expiry before production release.
