import { createHash, randomBytes, randomUUID } from "node:crypto";

const DEVICE_RE = /^[a-f0-9]{32}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_INVITE_MS = 7 * 24 * 60 * 60 * 1000;

const fail = (code) => {
  const error = new Error(code);
  error.code = code;
  throw error;
};

export function assertPlatformAdmin(claims) {
  if (claims?.platformAdmin !== true) fail("permission-denied");
  return true;
}

export async function assertVerifiedOwnerAccount(authAdmin, ownerUid, ownerEmail) {
  if (typeof ownerUid !== "string" || ownerUid.length < 6 ||
      typeof ownerEmail !== "string" || !EMAIL_RE.test(ownerEmail.trim())) {
    fail("invalid-argument");
  }
  const user = await authAdmin.getUser(ownerUid);
  if (user.emailVerified !== true || user.email?.toLowerCase() !== ownerEmail.trim().toLowerCase()) {
    fail("permission-denied");
  }
  return user;
}

export function hashInvitationSecret(secret) {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

function validDevice(deviceId) {
  return typeof deviceId === "string" && DEVICE_RE.test(deviceId);
}

function normalizeEmail(email) {
  if (typeof email !== "string") fail("invalid-argument");
  const value = email.trim().toLowerCase();
  if (!EMAIL_RE.test(value) || value.length > 254) fail("invalid-argument");
  return value;
}

function shopRef(db, shopId) {
  return db.collection("shops").doc(shopId);
}
function memberRef(db, shopId, uid) {
  return shopRef(db, shopId).collection("members").doc(uid);
}
function deviceRef(db, shopId, deviceId, uid) {
  return shopRef(db, shopId).collection("devices").doc(deviceId + "__" + uid);
}
function userShopRef(db, uid, shopId) {
  return db.collection("users").doc(uid).collection("shops").doc(shopId);
}

function assertActiveShop(shop, nowMs) {
  if (!shop || shop.status !== "active") fail("failed-precondition");
  if (shop.subscriptionExpiresAtMs !== null &&
      (!Number.isSafeInteger(shop.subscriptionExpiresAtMs) || nowMs >= shop.subscriptionExpiresAtMs)) {
    fail("permission-denied");
  }
}

function assertOwnerSession(claims, shop, member, device) {
  if (!claims || claims.memberRole !== "owner" ||
      claims.shopId !== shop.shopId ||
      claims.deviceId !== device?.deviceId ||
      claims.uid !== shop.ownerUid ||
      member?.uid !== claims.uid || member?.role !== "owner" || member?.status !== "active" ||
      device?.uid !== claims.uid || device?.deviceId !== claims.deviceId ||
      device?.role !== "owner" || device?.status !== "active") {
    fail("permission-denied");
  }
}

function sessionClaims(shopId, role, deviceId) {
  return { shopId, memberRole: role, deviceId };
}

/**
 * All database reads and writes that consume an invitation are in one
 * Firestore transaction. Custom-token creation happens after commit; if that
 * step fails, issueDeviceSession can mint a fresh session for the already
 * enrolled device without reusing the invitation.
 */
export function createMembershipService({ db, authAdmin, now = () => Date.now(), makeId = randomUUID, makeSecret = () => randomBytes(32).toString("base64url") }) {
  if (!db || !authAdmin) throw new TypeError("db_and_auth_required");

  async function createShop({ ownerUid, subscriptionExpiresAtMs = null }) {
    if (typeof ownerUid !== "string" || ownerUid.length < 6) fail("invalid-argument");
    const nowMs = now();
    if (subscriptionExpiresAtMs !== null &&
        (!Number.isSafeInteger(subscriptionExpiresAtMs) || subscriptionExpiresAtMs <= nowMs)) {
      fail("invalid-argument");
    }
    const shopId = makeId().replaceAll("-", "").slice(0, 24);
    const shop = {
      shopId, ownerUid, status: "active", subscriptionExpiresAtMs,
      createdAtMs: nowMs, updatedAtMs: nowMs, schemaVersion: 1
    };
    await db.runTransaction(async (tx) => {
      tx.create(shopRef(db, shopId), shop);
      tx.create(memberRef(db, shopId, ownerUid), {
        uid: ownerUid, shopId, role: "owner", status: "active", createdAtMs: nowMs
      });
      tx.create(userShopRef(db, ownerUid, shopId), {
        shopId, role: "owner", status: "active", createdAtMs: nowMs
      });
    });
    return { shopId, subscriptionExpiresAtMs };
  }

  async function enrollOwnerDevice({ uid, shopId, deviceId, authTime }) {
    if (!validDevice(deviceId) || typeof shopId !== "string") fail("invalid-argument");
    const nowMs = now();
    // Require a recent owner re-authentication before granting owner access
    // to a new installation. authTime is seconds from Firebase's verified token.
    if (!Number.isSafeInteger(authTime) || nowMs - authTime * 1000 > 10 * 60 * 1000 ||
        authTime * 1000 > nowMs + 60_000) fail("failed-precondition");

    await db.runTransaction(async (tx) => {
      const sRef = shopRef(db, shopId);
      const mRef = memberRef(db, shopId, uid);
      const dRef = deviceRef(db, shopId, deviceId, uid);
      const [sSnap, mSnap, dSnap] = await Promise.all([tx.get(sRef), tx.get(mRef), tx.get(dRef)]);
      const shop = sSnap.exists ? sSnap.data() : null;
      const member = mSnap.exists ? mSnap.data() : null;
      assertActiveShop(shop, nowMs);
      if (shop.ownerUid !== uid || !member || member.role !== "owner" || member.status !== "active") {
        fail("permission-denied");
      }
      if (dSnap.exists && dSnap.data().status !== "active") fail("permission-denied");
      if (!dSnap.exists) tx.create(dRef, {
        deviceId, uid, shopId, role: "owner", status: "active",
        approvedByUid: uid, createdAtMs: nowMs, recoveryEnrollment: true
      });
    });
    const customToken = await authAdmin.createCustomToken(uid, sessionClaims(shopId, "owner", deviceId));
    return { shopId, deviceId, role: "owner", customToken };
  }

  async function createWorkerInvitation({ claims, targetEmail, expiresInMs }) {
    const email = normalizeEmail(targetEmail);
    const lifetime = expiresInMs === undefined ? 24 * 60 * 60 * 1000 : expiresInMs;
    if (!Number.isSafeInteger(lifetime) || lifetime < 60_000 || lifetime > MAX_INVITE_MS) fail("invalid-argument");
    const nowMs = now();
    const shopId = claims?.shopId;
    const uid = claims?.uid;
    const deviceId = claims?.deviceId;
    if (typeof shopId !== "string" || typeof uid !== "string" || !validDevice(deviceId)) fail("permission-denied");
    const secret = makeSecret();
    if (typeof secret !== "string" || secret.length < 32) fail("internal");
    const invitationId = hashInvitationSecret(secret);
    const sRef = shopRef(db, shopId);
    await db.runTransaction(async (tx) => {
      const mRef = memberRef(db, shopId, uid);
      const dRef = deviceRef(db, shopId, deviceId, uid);
      const [sSnap, mSnap, dSnap] = await Promise.all([tx.get(sRef), tx.get(mRef), tx.get(dRef)]);
      const shop = sSnap.exists ? sSnap.data() : null;
      assertActiveShop(shop, nowMs);
      assertOwnerSession(claims, shop, mSnap.data(), dSnap.data());
      tx.create(sRef.collection("invitations").doc(invitationId), {
        shopId, targetEmail: email, role: "worker", status: "pending",
        createdByUid: uid, createdAtMs: nowMs, expiresAtMs: nowMs + lifetime
      });
    });
    return { invitationSecret: secret, expiresAtMs: nowMs + lifetime };
  }

  async function redeemWorkerInvitationForShop({ uid, email, emailVerified, shopId, invitationSecret, deviceId }) {
    if (!uid || !emailVerified) fail("permission-denied");
    if (typeof shopId !== "string" || !validDevice(deviceId) ||
        typeof invitationSecret !== "string" || invitationSecret.length < 32 ||
        invitationSecret.length > 256) fail("invalid-argument");
    const normalizedEmail = normalizeEmail(email);
    const invitationId = hashInvitationSecret(invitationSecret);
    const nowMs = now();
    await db.runTransaction(async (tx) => {
      const sRef = shopRef(db, shopId);
      const iRef = sRef.collection("invitations").doc(invitationId);
      const mRef = memberRef(db, shopId, uid);
      const dRef = deviceRef(db, shopId, deviceId, uid);
      const [sSnap, iSnap, mSnap, dSnap] = await Promise.all([
        tx.get(sRef), tx.get(iRef), tx.get(mRef), tx.get(dRef)
      ]);
      const shop = sSnap.exists ? sSnap.data() : null;
      const invite = iSnap.exists ? iSnap.data() : null;
      assertActiveShop(shop, nowMs);
      if (!invite || invite.status !== "pending" || invite.shopId !== shopId ||
          invite.role !== "worker" || invite.targetEmail !== normalizedEmail ||
          !Number.isSafeInteger(invite.expiresAtMs) || nowMs >= invite.expiresAtMs) {
        fail("permission-denied");
      }
      if (uid === shop.ownerUid) fail("failed-precondition");
      if (mSnap.exists && mSnap.data().status === "active" && mSnap.data().role !== "worker") {
        fail("failed-precondition");
      }
      if (dSnap.exists && dSnap.data().status !== "active") fail("permission-denied");
      if (!mSnap.exists) tx.create(mRef, {
        uid, shopId, role: "worker", status: "active", createdAtMs: nowMs,
        invitedByUid: invite.createdByUid
      });
      else tx.update(mRef, { role: "worker", status: "active" });
      if (!dSnap.exists) tx.create(dRef, {
        deviceId, uid, shopId, role: "worker", status: "active",
        approvedByUid: invite.createdByUid, createdAtMs: nowMs
      });
      tx.set(userShopRef(db, uid, shopId), {
        shopId, role: "worker", status: "active", createdAtMs: nowMs
      });
      tx.update(iRef, {
        status: "used", redeemedByUid: uid, redeemedDeviceId: deviceId,
        redeemedAtMs: nowMs
      });
    });
    const customToken = await authAdmin.createCustomToken(uid, sessionClaims(shopId, "worker", deviceId));
    return { shopId, deviceId, role: "worker", customToken };
  }

  async function issueDeviceSession({ uid, shopId, deviceId }) {
    if (!uid || typeof shopId !== "string" || !validDevice(deviceId)) fail("invalid-argument");
    const nowMs = now();
    const [sSnap, mSnap, dSnap] = await Promise.all([
      shopRef(db, shopId).get(),
      memberRef(db, shopId, uid).get(),
      deviceRef(db, shopId, deviceId, uid).get()
    ]);
    const shop = sSnap.exists ? sSnap.data() : null;
    const member = mSnap.exists ? mSnap.data() : null;
    const device = dSnap.exists ? dSnap.data() : null;
    assertActiveShop(shop, nowMs);
    if (!member || member.status !== "active" || !device || device.status !== "active" ||
        device.role !== member.role) fail("permission-denied");
    const customToken = await authAdmin.createCustomToken(uid, sessionClaims(shopId, member.role, deviceId));
    return { shopId, deviceId, role: member.role, customToken };
  }

  async function updateShopSubscription({ shopId, subscriptionExpiresAtMs, actorUid }) {
    if (typeof shopId !== "string" || typeof actorUid !== "string" || actorUid.length < 6) {
      fail("invalid-argument");
    }
    if (subscriptionExpiresAtMs !== null &&
        (!Number.isSafeInteger(subscriptionExpiresAtMs) || subscriptionExpiresAtMs <= 0)) {
      fail("invalid-argument");
    }
    const nowMs = now();
    const sRef = shopRef(db, shopId);
    const auditRef = sRef.collection("subscriptionAudit").doc(randomUUID());
    await db.runTransaction(async (tx) => {
      const sSnap = await tx.get(sRef);
      if (!sSnap.exists) fail("not-found");
      const previousExpiry = sSnap.data().subscriptionExpiresAtMs ?? null;
      tx.update(sRef, {
        subscriptionExpiresAtMs,
        updatedAtMs: nowMs,
        subscriptionUpdatedByUid: actorUid
      });
      tx.create(auditRef, {
        shopId, previousExpiryMs: previousExpiry,
        newExpiryMs: subscriptionExpiresAtMs,
        changedByUid: actorUid, changedAtMs: nowMs
      });
    });
    return { shopId, subscriptionExpiresAtMs };
  }

  async function revokeMember({ claims, targetUid }) {
    if (typeof targetUid !== "string" || targetUid.length < 6) fail("invalid-argument");
    const shopId = claims?.shopId;
    const uid = claims?.uid;
    const ownerDeviceId = claims?.deviceId;
    if (!shopId || !uid || !validDevice(ownerDeviceId)) fail("permission-denied");
    if (targetUid === uid) fail("failed-precondition");
    const nowMs = now();
    await db.runTransaction(async (tx) => {
      const sRef = shopRef(db, shopId);
      const ownerM = memberRef(db, shopId, uid);
      const ownerD = deviceRef(db, shopId, ownerDeviceId, uid);
      const targetM = memberRef(db, shopId, targetUid);
      const [sSnap, mSnap, dSnap, targetSnap] = await Promise.all([
        tx.get(sRef), tx.get(ownerM), tx.get(ownerD), tx.get(targetM)
      ]);
      const shop = sSnap.exists ? sSnap.data() : null;
      assertActiveShop(shop, nowMs);
      assertOwnerSession(claims, shop, mSnap.data(), dSnap.data());
      if (!targetSnap.exists) fail("not-found");
      if (targetSnap.data().role === "owner") fail("failed-precondition");
      tx.update(targetM, { status: "inactive", revokedAtMs: nowMs, revokedByUid: uid });
      tx.set(userShopRef(db, targetUid, shopId), {
        shopId, role: targetSnap.data().role, status: "inactive",
        revokedAtMs: nowMs, revokedByUid: uid
      }, { merge: true });
    });
    return { revoked: true };
  }

  async function revokeDevice({ claims, targetUid, targetDeviceId }) {
    if (typeof targetUid !== "string" || !validDevice(targetDeviceId)) fail("invalid-argument");
    const shopId = claims?.shopId;
    const uid = claims?.uid;
    const ownerDeviceId = claims?.deviceId;
    if (!shopId || !uid || !validDevice(ownerDeviceId)) fail("permission-denied");
    if (targetUid === uid && targetDeviceId === ownerDeviceId) fail("failed-precondition");
    const nowMs = now();
    await db.runTransaction(async (tx) => {
      const sRef = shopRef(db, shopId);
      const ownerM = memberRef(db, shopId, uid);
      const ownerD = deviceRef(db, shopId, ownerDeviceId, uid);
      const targetD = deviceRef(db, shopId, targetDeviceId, targetUid);
      const [sSnap, mSnap, dSnap, targetSnap] = await Promise.all([
        tx.get(sRef), tx.get(ownerM), tx.get(ownerD), tx.get(targetD)
      ]);
      const shop = sSnap.exists ? sSnap.data() : null;
      assertActiveShop(shop, nowMs);
      assertOwnerSession(claims, shop, mSnap.data(), dSnap.data());
      if (!targetSnap.exists) fail("not-found");
      tx.update(targetD, { status: "revoked", revokedAtMs: nowMs, revokedByUid: uid });
    });
    return { revoked: true };
  }

  return Object.freeze({
    createShop, enrollOwnerDevice, createWorkerInvitation,
    redeemWorkerInvitationForShop, issueDeviceSession, revokeDevice, revokeMember, updateShopSubscription
  });
}
