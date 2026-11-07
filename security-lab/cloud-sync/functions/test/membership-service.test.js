import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { assertPlatformAdmin, createMembershipService, hashInvitationSecret } from "../membership-service.js";

const projectId = "demo-deyn-sync";
const app = initializeApp({ projectId }, "deyn-membership-tests");
const db = getFirestore(app);
let clock = 1_800_000_000_000;
let tokenNumber = 0;
const authAdmin = {
  async createCustomToken(uid, claims) {
    tokenNumber++;
    return `test-token-${uid}-${claims.memberRole}-${claims.deviceId}`;
  }
};
const service = createMembershipService({
  db, authAdmin, now: () => clock,
  makeId: () => "11111111-2222-4333-8444-555555555555",
  makeSecret: () => "S".repeat(48)
});
const ownerDevice = "a".repeat(32);
const workerDevice = "b".repeat(32);
const shopId = "111111112222433384445555";

before(async () => {
  process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
});
after(async () => {
  await deleteApp(app);
});

async function clearShop() {
  const ref = db.collection("shops").doc(shopId);
  const collections = ["members", "devices", "invitations", "subscriptionAudit"];
  for (const name of collections) {
    const snap = await ref.collection(name).get();
    const batch = db.batch();
    for (const item of snap.docs) batch.delete(item.ref);
    await batch.commit();
  }
  await ref.delete().catch(() => {});
  await db.collection("users").doc("owner-uid-0001").collection("shops").doc(shopId).delete().catch(() => {});
  await db.collection("users").doc("worker-uid-0002").collection("shops").doc(shopId).delete().catch(() => {});
}

async function setupShop() {
  await service.createShop({ ownerUid: "owner-uid-0001" });
  return service.enrollOwnerDevice({
    uid: "owner-uid-0001", shopId, deviceId: ownerDevice,
    authTime: Math.floor(clock / 1000)
  });
}

test("shop provisioning creates owner membership, then owner enrolls their own device", async () => {
  await clearShop();
  const result = await service.createShop({ ownerUid: "owner-uid-0001" });
  assert.equal(result.shopId, shopId);
  assert.equal("customToken" in result, false);
  const shop = await db.collection("shops").doc(shopId).get();
  const member = await shop.ref.collection("members").doc("owner-uid-0001").get();
  const deviceBeforeOwnerLogin = await shop.ref.collection("devices")
    .doc(ownerDevice + "__owner-uid-0001").get();
  assert.equal(shop.data().ownerUid, "owner-uid-0001");
  assert.equal(member.data().role, "owner");
  assert.equal(deviceBeforeOwnerLogin.exists, false);
  const session = await service.enrollOwnerDevice({
    uid: "owner-uid-0001", shopId, deviceId: ownerDevice,
    authTime: Math.floor(clock / 1000)
  });
  assert.match(session.customToken, /^test-token-owner-uid-0001-owner-/);
  const pointer = await db.collection("users").doc("owner-uid-0001")
    .collection("shops").doc(shopId).get();
  assert.equal(pointer.data().role, "owner");
  assert.equal(pointer.data().status, "active");
});

test("owner recovery registers a second physical device without cloning IDs", async () => {
  await clearShop();
  await setupShop();
  const result = await service.enrollOwnerDevice({
    uid: "owner-uid-0001", shopId, deviceId: workerDevice,
    authTime: Math.floor(clock / 1000)
  });
  assert.equal(result.role, "owner");
  const snap = await db.collection("shops").doc(shopId).collection("devices").get();
  assert.equal(snap.size, 2);
});

test("owner invitation is hashed in storage and redeemed once by verified target email", async () => {
  await clearShop();
  await setupShop();
  const claims = { uid: "owner-uid-0001", shopId, memberRole: "owner", deviceId: ownerDevice };
  const invitation = await service.createWorkerInvitation({
    claims, targetEmail: "Worker@Example.com"
  });
  assert.equal(invitation.invitationSecret, "S".repeat(48));
  const invitationDoc = await db.collection("shops").doc(shopId)
    .collection("invitations").doc(hashInvitationSecret(invitation.invitationSecret)).get();
  assert.equal(invitationDoc.data().targetEmail, "worker@example.com");
  assert.equal(invitationDoc.data().status, "pending");
  const redeemed = await service.redeemWorkerInvitationForShop({
    uid: "worker-uid-0002", email: "worker@example.com", emailVerified: true,
    shopId, invitationSecret: invitation.invitationSecret, deviceId: workerDevice
  });
  assert.equal(redeemed.role, "worker");
  const workerShopPointer = await db.collection("users").doc("worker-uid-0002")
    .collection("shops").doc(shopId).get();
  assert.equal(workerShopPointer.data().role, "worker");
  assert.equal(workerShopPointer.data().status, "active");
  const used = await invitationDoc.ref.get();
  assert.equal(used.data().status, "used");
  await assert.rejects(
    service.redeemWorkerInvitationForShop({
      uid: "worker-uid-0002", email: "worker@example.com", emailVerified: true,
      shopId, invitationSecret: invitation.invitationSecret, deviceId: workerDevice
    }),
    /permission-denied/
  );
});

test("invitation cannot be redeemed by another email or unverified account", async () => {
  await clearShop();
  await setupShop();
  const invitation = await service.createWorkerInvitation({
    claims: { uid: "owner-uid-0001", shopId, memberRole: "owner", deviceId: ownerDevice },
    targetEmail: "worker@example.com"
  });
  await assert.rejects(service.redeemWorkerInvitationForShop({
    uid: "worker-uid-0002", email: "attacker@example.com", emailVerified: true,
    shopId, invitationSecret: invitation.invitationSecret, deviceId: workerDevice
  }), /permission-denied/);
  await assert.rejects(service.redeemWorkerInvitationForShop({
    uid: "worker-uid-0002", email: "worker@example.com", emailVerified: false,
    shopId, invitationSecret: invitation.invitationSecret, deviceId: workerDevice
  }), /permission-denied/);
});

test("expired subscription prevents invitation creation and new enrollment", async () => {
  await clearShop();
  await setupShop();
  await db.collection("shops").doc(shopId).update({ subscriptionExpiresAtMs: clock - 1 });
  await assert.rejects(service.createWorkerInvitation({
    claims: { uid: "owner-uid-0001", shopId, memberRole: "owner", deviceId: ownerDevice },
    targetEmail: "worker@example.com"
  }), /permission-denied/);
});

test("recent owner authentication is required for owner recovery", async () => {
  await clearShop();
  await setupShop();
  await assert.rejects(service.enrollOwnerDevice({
    uid: "owner-uid-0001", shopId, deviceId: workerDevice,
    authTime: Math.floor((clock - 20 * 60 * 1000) / 1000)
  }), /failed-precondition/);
});

test("worker cannot issue owner session for an unregistered or different device", async () => {
  await clearShop();
  await setupShop();
  const invitation = await service.createWorkerInvitation({
    claims: { uid: "owner-uid-0001", shopId, memberRole: "owner", deviceId: ownerDevice },
    targetEmail: "worker@example.com"
  });
  await service.redeemWorkerInvitationForShop({
    uid: "worker-uid-0002", email: "worker@example.com", emailVerified: true,
    shopId, invitationSecret: invitation.invitationSecret, deviceId: workerDevice
  });
  const session = await service.issueDeviceSession({
    uid: "worker-uid-0002", shopId, deviceId: workerDevice
  });
  assert.equal(session.role, "worker");
  await assert.rejects(service.issueDeviceSession({
    uid: "worker-uid-0002", shopId, deviceId: ownerDevice
  }), /permission-denied/);
});

test("revoked device cannot obtain another session", async () => {
  await clearShop();
  await setupShop();
  await service.enrollOwnerDevice({
    uid: "owner-uid-0001", shopId, deviceId: workerDevice,
    authTime: Math.floor(clock / 1000)
  });
  await service.revokeDevice({
    claims: { uid: "owner-uid-0001", shopId, memberRole: "owner", deviceId: ownerDevice },
    targetUid: "owner-uid-0001", targetDeviceId: workerDevice
  });
  await assert.rejects(service.issueDeviceSession({
    uid: "owner-uid-0001", shopId, deviceId: workerDevice
  }), /permission-denied/);
});

test("concurrent redemption can consume one invitation only once", async () => {
  await clearShop();
  await setupShop();
  const invitation = await service.createWorkerInvitation({
    claims: { uid: "owner-uid-0001", shopId, memberRole: "owner", deviceId: ownerDevice },
    targetEmail: "worker@example.com"
  });
  const attempts = await Promise.allSettled([
    service.redeemWorkerInvitationForShop({
      uid: "worker-uid-0002", email: "worker@example.com", emailVerified: true,
      shopId, invitationSecret: invitation.invitationSecret, deviceId: workerDevice
    }),
    service.redeemWorkerInvitationForShop({
      uid: "worker-uid-0002", email: "worker@example.com", emailVerified: true,
      shopId, invitationSecret: invitation.invitationSecret, deviceId: "c".repeat(32)
    })
  ]);
  assert.equal(attempts.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(attempts.filter((x) => x.status === "rejected").length, 1);
  const invite = await db.collection("shops").doc(shopId)
    .collection("invitations").doc(hashInvitationSecret(invitation.invitationSecret)).get();
  assert.equal(invite.data().status, "used");
});

test("expired worker invitation cannot be redeemed", async () => {
  await clearShop();
  await setupShop();
  const invitation = await service.createWorkerInvitation({
    claims: { uid: "owner-uid-0001", shopId, memberRole: "owner", deviceId: ownerDevice },
    targetEmail: "worker@example.com", expiresInMs: 60_000
  });
  clock += 60_001;
  await assert.rejects(service.redeemWorkerInvitationForShop({
    uid: "worker-uid-0002", email: "worker@example.com", emailVerified: true,
    shopId, invitationSecret: invitation.invitationSecret, deviceId: workerDevice
  }), /permission-denied/);
  clock -= 60_001;
});

test("forged owner claims cannot create worker invitations", async () => {
  await clearShop();
  await setupShop();
  await assert.rejects(service.createWorkerInvitation({
    claims: { uid: "worker-uid-0002", shopId, memberRole: "owner", deviceId: ownerDevice },
    targetEmail: "attacker@example.com"
  }), /permission-denied/);
});

test("owner can deactivate a worker membership and block future sessions", async () => {
  await clearShop();
  await setupShop();
  const invitation = await service.createWorkerInvitation({
    claims: { uid: "owner-uid-0001", shopId, memberRole: "owner", deviceId: ownerDevice },
    targetEmail: "worker@example.com"
  });
  await service.redeemWorkerInvitationForShop({
    uid: "worker-uid-0002", email: "worker@example.com", emailVerified: true,
    shopId, invitationSecret: invitation.invitationSecret, deviceId: workerDevice
  });
  await service.revokeMember({
    claims: { uid: "owner-uid-0001", shopId, memberRole: "owner", deviceId: ownerDevice },
    targetUid: "worker-uid-0002"
  });
  const workerShopPointer = await db.collection("users").doc("worker-uid-0002")
    .collection("shops").doc(shopId).get();
  assert.equal(workerShopPointer.data().status, "inactive");
  await assert.rejects(service.issueDeviceSession({
    uid: "worker-uid-0002", shopId, deviceId: workerDevice
  }), /permission-denied/);
  await assert.rejects(service.revokeMember({
    claims: { uid: "owner-uid-0001", shopId, memberRole: "owner", deviceId: ownerDevice },
    targetUid: "owner-uid-0001"
  }), /failed-precondition/);
});

test("only a trusted platform administrator can provision new shops", () => {
  assert.equal(assertPlatformAdmin({ platformAdmin: true }), true);
  assert.throws(() => assertPlatformAdmin({}), /permission-denied/);
  assert.throws(() => assertPlatformAdmin({ platformAdmin: "true" }), /permission-denied/);
});

test("trusted subscription renewal updates shop expiry and writes an audit record", async () => {
  await clearShop();
  await setupShop();
  const nextExpiry = clock + 365 * 24 * 60 * 60 * 1000;
  const result = await service.updateShopSubscription({
    shopId, subscriptionExpiresAtMs: nextExpiry, actorUid: "platform-admin-1"
  });
  assert.equal(result.subscriptionExpiresAtMs, nextExpiry);
  const shop = await db.collection("shops").doc(shopId).get();
  assert.equal(shop.data().subscriptionExpiresAtMs, nextExpiry);
  const audit = await shop.ref.collection("subscriptionAudit").get();
  assert.equal(audit.size, 1);
  assert.equal(audit.docs[0].data().previousExpiryMs, null);
  assert.equal(audit.docs[0].data().newExpiryMs, nextExpiry);
});
