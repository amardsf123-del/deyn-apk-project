/**
 * DEYN shop membership and device authorization model.
 * Backend policy prototype only; not a deployed Firebase function.
 * claims must come from a verified Firebase ID token and records must be
 * fetched from the trusted database, never accepted from client input.
 */
export const ROLES = Object.freeze({ OWNER: "owner", WORKER: "worker" });
const ID_RE = /^[A-Za-z0-9_-]{8,128}$/;
const UID_RE = /^[A-Za-z0-9:_-]{6,128}$/;
const DEVICE_RE = /^[a-f0-9]{32}$/;

export function isValidShopId(value) {
  return typeof value === "string" && ID_RE.test(value);
}
export function isValidDeviceId(value) {
  return typeof value === "string" && DEVICE_RE.test(value);
}

export function createShopRecord({ shopId, ownerUid, subscriptionExpiresAtMs, nowMs }) {
  if (!isValidShopId(shopId)) throw new TypeError("invalid_shop_id");
  if (typeof ownerUid !== "string" || !UID_RE.test(ownerUid)) throw new TypeError("invalid_owner_uid");
  if (!Number.isSafeInteger(nowMs) || nowMs <= 0) throw new TypeError("invalid_now");
  if (subscriptionExpiresAtMs !== null &&
      (!Number.isSafeInteger(subscriptionExpiresAtMs) || subscriptionExpiresAtMs <= nowMs)) {
    throw new TypeError("invalid_subscription_expiry");
  }
  return Object.freeze({
    shopId, ownerUid, status: "active", subscriptionExpiresAtMs,
    createdAtMs: nowMs, updatedAtMs: nowMs, schemaVersion: 1
  });
}

export function authorizeShopRequest({ claims, shop, member, device, requiredAction, nowMs }) {
  const deny = (reason) => ({ allowed: false, reason });
  if (!claims || typeof claims.uid !== "string" || !UID_RE.test(claims.uid)) return deny("unauthenticated");
  if (!shop || !isValidShopId(shop.shopId)) return deny("shop_not_found");
  if (!member || member.uid !== claims.uid || member.shopId !== shop.shopId) return deny("not_a_shop_member");
  if (member.status !== "active") return deny("membership_inactive");
  if (!device || device.shopId !== shop.shopId || device.uid !== claims.uid) return deny("device_not_registered");
  if (device.status !== "active") return deny("device_inactive");
  if (!isValidDeviceId(device.deviceId)) return deny("invalid_device");
  if (claims.shopId !== shop.shopId || claims.memberRole !== member.role ||
      claims.deviceId !== device.deviceId) return deny("claims_mismatch");
  if (shop.status !== "active") return deny("shop_inactive");
  if (!Number.isSafeInteger(nowMs) || nowMs <= 0) return deny("invalid_server_time");
  if (shop.subscriptionExpiresAtMs !== null &&
      (!Number.isSafeInteger(shop.subscriptionExpiresAtMs) || nowMs >= shop.subscriptionExpiresAtMs)) {
    return deny("subscription_expired");
  }

  const ownerActions = new Set([
    "read", "createCustomer", "addDebt", "addPayment",
    "editCustomer", "archiveCustomer", "manageMembers", "registerDevice", "ownerRecovery"
  ]);
  const workerActions = new Set(["read", "createCustomer", "addDebt", "addPayment"]);
  if (member.role === ROLES.OWNER && ownerActions.has(requiredAction)) {
    return { allowed: true, role: ROLES.OWNER, shopId: shop.shopId };
  }
  if (member.role === ROLES.WORKER && workerActions.has(requiredAction)) {
    return { allowed: true, role: ROLES.WORKER, shopId: shop.shopId };
  }
  return deny("permission_denied");
}

export function validateDeviceRegistration({
  deviceId, uid, shopId, role, shop, nowMs,
  approverClaims, approverMember, approverDevice, invitation = null
}) {
  if (!isValidDeviceId(deviceId)) return { valid: false, reason: "invalid_device_id" };
  if (typeof uid !== "string" || !UID_RE.test(uid)) return { valid: false, reason: "invalid_uid" };
  if (!isValidShopId(shopId) || shop?.shopId !== shopId || shop?.status !== "active") {
    return { valid: false, reason: "invalid_shop" };
  }
  if (![ROLES.OWNER, ROLES.WORKER].includes(role)) return { valid: false, reason: "invalid_role" };
  const approverIsOwner =
    approverClaims?.uid === shop.ownerUid &&
    approverClaims?.shopId === shopId &&
    approverClaims?.memberRole === ROLES.OWNER &&
    approverClaims?.deviceId === approverDevice?.deviceId &&
    approverMember?.uid === shop.ownerUid &&
    approverMember?.shopId === shopId &&
    approverMember?.role === ROLES.OWNER &&
    approverMember?.status === "active" &&
    approverDevice?.uid === shop.ownerUid &&
    approverDevice?.shopId === shopId &&
    approverDevice?.status === "active" &&
    isValidDeviceId(approverDevice?.deviceId);
  if (!approverIsOwner) return { valid: false, reason: "verified_owner_approval_required" };
  if (role === ROLES.OWNER && uid !== shop.ownerUid) {
    return { valid: false, reason: "only_primary_owner_uid_can_be_owner" };
  }
  if (role === ROLES.WORKER) {
    if (!invitation || invitation.shopId !== shopId || invitation.targetUid !== uid ||
        invitation.role !== ROLES.WORKER || invitation.status !== "pending" ||
        !Number.isSafeInteger(nowMs) || !Number.isSafeInteger(invitation.expiresAtMs) ||
        nowMs >= invitation.expiresAtMs) {
      return { valid: false, reason: "valid_worker_invitation_required" };
    }
  }
  return {
    valid: true,
    record: Object.freeze({
      deviceId, uid, shopId, role, status: "active",
      approvedByUid: approverClaims.uid, createdAtServer: true
    })
  };
}

/**
 * Pure transition used inside a trusted Firestore transaction.
 * The caller must atomically read the invitation, verify the owner, write the
 * device record, and persist this returned used invitation. A client-side
 * call alone cannot make an invitation single-use.
 */
export function consumeWorkerInvitation({ invitation, shopId, uid, deviceId, nowMs }) {
  if (!invitation || invitation.status !== "pending") {
    return { accepted: false, reason: "invitation_not_pending" };
  }
  if (invitation.shopId !== shopId || invitation.targetUid !== uid ||
      invitation.role !== ROLES.WORKER) {
    return { accepted: false, reason: "invitation_target_mismatch" };
  }
  if (!Number.isSafeInteger(nowMs) || !Number.isSafeInteger(invitation.expiresAtMs) ||
      nowMs >= invitation.expiresAtMs) {
    return { accepted: false, reason: "invitation_expired" };
  }
  if (!isValidDeviceId(deviceId)) return { accepted: false, reason: "invalid_device_id" };
  return {
    accepted: true,
    invitation: Object.freeze({
      ...invitation,
      status: "used",
      redeemedByUid: uid,
      redeemedDeviceId: deviceId,
      redeemedAtMs: nowMs
    })
  };
}

export function publicShopStatus(shop, serverNowMs) {
  if (!shop || !Number.isSafeInteger(serverNowMs)) return { status: "unavailable" };
  const expired = shop.subscriptionExpiresAtMs !== null &&
    serverNowMs >= shop.subscriptionExpiresAtMs;
  return {
    shopId: shop.shopId,
    status: shop.status === "active" && !expired ? "active" : "suspended",
    subscriptionExpiresAtMs: shop.subscriptionExpiresAtMs,
    schemaVersion: shop.schemaVersion
  };
}
