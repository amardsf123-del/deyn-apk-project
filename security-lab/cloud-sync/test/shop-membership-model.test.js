import test from "node:test";
import assert from "node:assert/strict";
import { ROLES, createShopRecord, authorizeShopRequest, validateDeviceRegistration, publicShopStatus } from "../shop-membership-model.js";

const now = 1_800_000_000_000;
const shop = createShopRecord({
  shopId: "shop_12345678", ownerUid: "owner_uid_123",
  subscriptionExpiresAtMs: now + 86_400_000, nowMs: now
});
const ownerDevice = { shopId: shop.shopId, uid: shop.ownerUid, deviceId: "a".repeat(32), status: "active" };
const ownerMember = { shopId: shop.shopId, uid: shop.ownerUid, role: ROLES.OWNER, status: "active" };
const ownerClaims = { uid: shop.ownerUid, shopId: shop.shopId, memberRole: ROLES.OWNER, deviceId: ownerDevice.deviceId };
const base = { claims: ownerClaims, shop, member: ownerMember, device: ownerDevice, requiredAction: "read", nowMs: now };

test("creates canonical shop record with one shared subscription expiry", () => {
  assert.equal(shop.subscriptionExpiresAtMs, now + 86_400_000);
  assert.equal(shop.schemaVersion, 1);
});
test("rejects invalid shop identifiers and already-expired subscription", () => {
  assert.throws(() => createShopRecord({ shopId: "bad", ownerUid: "owner_uid_123", subscriptionExpiresAtMs: now + 1000, nowMs: now }), /invalid_shop_id/);
  assert.throws(() => createShopRecord({ shopId: "shop_12345678", ownerUid: "owner_uid_123", subscriptionExpiresAtMs: now, nowMs: now }), /invalid_subscription_expiry/);
});
test("owner can read and manage shop members", () => {
  assert.equal(authorizeShopRequest({ ...base, requiredAction: "read" }).allowed, true);
  assert.equal(authorizeShopRequest({ ...base, requiredAction: "manageMembers" }).allowed, true);
});
test("worker can read and append business activity but cannot manage shop", () => {
  const member = { shopId: shop.shopId, uid: "worker_uid_123", role: ROLES.WORKER, status: "active" };
  const device = { shopId: shop.shopId, uid: member.uid, deviceId: "b".repeat(32), status: "active" };
  const claims = { uid: member.uid, shopId: shop.shopId, memberRole: ROLES.WORKER, deviceId: device.deviceId };
  const context = { claims, shop, member, device, nowMs: now };
  for (const action of ["read", "createCustomer", "addDebt", "addPayment"]) assert.equal(authorizeShopRequest({ ...context, requiredAction: action }).allowed, true, action);
  for (const action of ["editCustomer", "archiveCustomer", "manageMembers", "registerDevice", "ownerRecovery"]) assert.equal(authorizeShopRequest({ ...context, requiredAction: action }).allowed, false, action);
});
test("client cannot elevate worker by changing its claimed role", () => {
  const worker = { shopId: shop.shopId, uid: "worker_uid_123", role: ROLES.WORKER, status: "active" };
  const device = { shopId: shop.shopId, uid: worker.uid, deviceId: "c".repeat(32), status: "active" };
  const claims = { uid: worker.uid, shopId: shop.shopId, memberRole: ROLES.OWNER, deviceId: device.deviceId };
  assert.equal(authorizeShopRequest({ claims, shop, member: worker, device, requiredAction: "editCustomer", nowMs: now }).reason, "claims_mismatch");
});
test("rejects cross-shop member, device, and forged token identity", () => {
  assert.equal(authorizeShopRequest({ ...base, member: { ...ownerMember, shopId: "shop_other_123" } }).reason, "not_a_shop_member");
  assert.equal(authorizeShopRequest({ ...base, device: { ...ownerDevice, shopId: "shop_other_123" } }).reason, "device_not_registered");
  assert.equal(authorizeShopRequest({ ...base, claims: { ...ownerClaims, uid: "someone_else_123" } }).reason, "not_a_shop_member");
});
test("blocks expired, suspended, and inactive memberships/devices", () => {
  assert.equal(authorizeShopRequest({ ...base, nowMs: shop.subscriptionExpiresAtMs }).reason, "subscription_expired");
  assert.equal(authorizeShopRequest({ ...base, shop: { ...shop, status: "suspended" } }).reason, "shop_inactive");
  assert.equal(authorizeShopRequest({ ...base, member: { ...ownerMember, status: "revoked" } }).reason, "membership_inactive");
  assert.equal(authorizeShopRequest({ ...base, device: { ...ownerDevice, status: "revoked" } }).reason, "device_inactive");
});
const approver = {
  claims: ownerClaims,
  member: ownerMember,
  device: ownerDevice
};

test("worker phone registration requires verified owner session and invitation", () => {
  const input = {
    deviceId: "d".repeat(32), uid: "worker_uid_123",
    shopId: shop.shopId, role: ROLES.WORKER, shop, nowMs: now,
    invitation: {
      shopId: shop.shopId, targetUid: "worker_uid_123",
      role: ROLES.WORKER, status: "pending", expiresAtMs: now + 60_000
    }
  };
  assert.equal(validateDeviceRegistration(input).reason, "verified_owner_approval_required");
  const accepted = validateDeviceRegistration({ ...input, ...{
    approverClaims: approver.claims, approverMember: approver.member,
    approverDevice: approver.device
  }});
  assert.equal(accepted.valid, true);
  assert.equal(accepted.record.deviceId, "d".repeat(32));
});

test("rejects forged owner UID without verified owner claims and records", () => {
  const result = validateDeviceRegistration({
    deviceId: "d".repeat(32), uid: "worker_uid_123", shopId: shop.shopId,
    role: ROLES.WORKER, shop, nowMs: now,
    invitation: { shopId: shop.shopId, targetUid: "worker_uid_123", role: ROLES.WORKER, status: "pending", expiresAtMs: now + 60_000 },
    approverClaims: { uid: shop.ownerUid },
    approverMember: ownerMember, approverDevice: ownerDevice
  });
  assert.equal(result.reason, "verified_owner_approval_required");
});

test("rejects expired or mismatched worker invitations", () => {
  const baseInput = {
    deviceId: "d".repeat(32), uid: "worker_uid_123", shopId: shop.shopId,
    role: ROLES.WORKER, shop, nowMs: now,
    approverClaims: approver.claims, approverMember: approver.member, approverDevice: approver.device
  };
  assert.equal(validateDeviceRegistration({
    ...baseInput, invitation: { shopId: shop.shopId, targetUid: "worker_uid_123", role: ROLES.WORKER, status: "pending", expiresAtMs: now }
  }).reason, "valid_worker_invitation_required");
  assert.equal(validateDeviceRegistration({
    ...baseInput, invitation: { shopId: shop.shopId, targetUid: "someone_else_123", role: ROLES.WORKER, status: "pending", expiresAtMs: now + 60_000 }
  }).reason, "valid_worker_invitation_required");
});

test("verified owner can enroll a replacement phone under the same owner account", () => {
  const result = validateDeviceRegistration({
    deviceId: "9".repeat(32), uid: shop.ownerUid, shopId: shop.shopId,
    role: ROLES.OWNER, shop, nowMs: now,
    approverClaims: ownerClaims, approverMember: ownerMember, approverDevice: ownerDevice
  });
  assert.equal(result.valid, true);
  assert.notEqual(result.record.deviceId, ownerDevice.deviceId);
});

test("owner can sign in on the worker phone without replacing the worker enrollment", () => {
  const workerPhoneId = "b".repeat(32);
  const workerEnrollment = {
    deviceId: workerPhoneId, uid: "worker_uid_123",
    shopId: shop.shopId, role: ROLES.WORKER
  };
  const ownerEnrollment = validateDeviceRegistration({
    deviceId: workerPhoneId, uid: shop.ownerUid, shopId: shop.shopId,
    role: ROLES.OWNER, shop, nowMs: now,
    approverClaims: ownerClaims, approverMember: ownerMember, approverDevice: ownerDevice
  });
  assert.equal(ownerEnrollment.valid, true);
  assert.equal(ownerEnrollment.record.deviceId, workerEnrollment.deviceId);
  assert.notEqual(ownerEnrollment.record.uid, workerEnrollment.uid);
  // Firestore stores these as separate records keyed by deviceId + UID.
});

test("worker cannot register as primary owner", () => {
  const result = validateDeviceRegistration({
    deviceId: "e".repeat(32), uid: "worker_uid_123", shopId: shop.shopId,
    role: ROLES.OWNER, shop, nowMs: now,
    approverClaims: ownerClaims, approverMember: ownerMember, approverDevice: ownerDevice
  });
  assert.equal(result.reason, "only_primary_owner_uid_can_be_owner");
});
test("two physical phones keep separate device IDs and share shop expiry", () => {
  const second = validateDeviceRegistration({
    deviceId: "f".repeat(32), uid: "worker_uid_123", shopId: shop.shopId,
    role: ROLES.WORKER, shop, nowMs: now,
    approverClaims: ownerClaims, approverMember: ownerMember, approverDevice: ownerDevice,
    invitation: { shopId: shop.shopId, targetUid: "worker_uid_123", role: ROLES.WORKER, status: "pending", expiresAtMs: now + 60_000 }
  }).record;
  assert.notEqual(second.deviceId, ownerDevice.deviceId);
  assert.equal(shop.subscriptionExpiresAtMs, now + 86_400_000);
});
test("public status uses server time and hides owner UID", () => {
  const active = publicShopStatus(shop, now);
  assert.equal(active.status, "active");
  assert.equal("ownerUid" in active, false);
  assert.equal(publicShopStatus(shop, shop.subscriptionExpiresAtMs).status, "suspended");
});
