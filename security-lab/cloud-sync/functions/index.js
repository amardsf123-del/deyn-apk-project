import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { createMembershipService } from "./membership-service.js";

initializeApp();
const service = createMembershipService({
  db: getFirestore(),
  authAdmin: getAuth()
});

function mapError(error) {
  const allowed = new Set([
    "invalid-argument", "unauthenticated", "permission-denied",
    "failed-precondition", "not-found", "already-exists", "resource-exhausted"
  ]);
  const code = allowed.has(error?.code) ? error.code : "internal";
  return new HttpsError(code, code === "internal" ? "حدث خطأ داخلي" : error.message);
}
function wrap(handler) {
  return async (request) => {
    try {
      if (!request.auth) throw new HttpsError("unauthenticated", "sign-in-required");
      return await handler(request);
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      throw mapError(error);
    }
  };
}
const options = { region: "me-central1", enforceAppCheck: true };

export const createShop = onCall(options, wrap(async (request) => {
  if (request.auth.token.email_verified !== true) throw new HttpsError("permission-denied", "verified-email-required");
  return service.createShop({
    uid: request.auth.uid,
    deviceId: request.data?.deviceId,
    subscriptionExpiresAtMs: request.data?.subscriptionExpiresAtMs ?? null
  });
}));

export const enrollOwnerDevice = onCall(options, wrap(async (request) => {
  if (request.auth.token.email_verified !== true) throw new HttpsError("permission-denied", "verified-email-required");
  return service.enrollOwnerDevice({
    uid: request.auth.uid,
    shopId: request.data?.shopId,
    deviceId: request.data?.deviceId,
    authTime: request.auth.token.auth_time
  });
}));

export const createWorkerInvitation = onCall(options, wrap(async (request) => {
  return service.createWorkerInvitation({
    claims: { uid: request.auth.uid, ...request.auth.token },
    targetEmail: request.data?.targetEmail,
    expiresInMs: request.data?.expiresInMs
  });
}));

export const redeemWorkerInvitation = onCall(options, wrap(async (request) => {
  return service.redeemWorkerInvitationForShop({
    uid: request.auth.uid,
    email: request.auth.token.email,
    emailVerified: request.auth.token.email_verified === true,
    shopId: request.data?.shopId,
    invitationSecret: request.data?.invitationSecret,
    deviceId: request.data?.deviceId
  });
}));

export const issueDeviceSession = onCall(options, wrap(async (request) => {
  return service.issueDeviceSession({
    uid: request.auth.uid,
    shopId: request.data?.shopId,
    deviceId: request.data?.deviceId
  });
}));

export const revokeDevice = onCall(options, wrap(async (request) => {
  return service.revokeDevice({
    claims: { uid: request.auth.uid, ...request.auth.token },
    targetUid: request.data?.targetUid,
    targetDeviceId: request.data?.targetDeviceId
  });
}));

export const revokeWorkerMembership = onCall(options, wrap(async (request) => {
  return service.revokeMember({
    claims: { uid: request.auth.uid, ...request.auth.token },
    targetUid: request.data?.targetUid
  });
}));
