import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const [action, uid, expectedEmail] = process.argv.slice(2);
if (!["grant", "revoke"].includes(action) || !uid || !expectedEmail) {
  process.stderr.write("Usage: node scripts/set-platform-admin.js <grant|revoke> <firebase-uid> <verified-email>\n");
  process.exit(2);
}
if (process.env.DEYN_CONFIRM_ADMIN_CHANGE !== "YES") {
  process.stderr.write("Refusing: set DEYN_CONFIRM_ADMIN_CHANGE=YES after independently verifying the target account.\n");
  process.exit(2);
}
if (!process.env.FIREBASE_PROJECT_ID || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.stderr.write("FIREBASE_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS are required.\n");
  process.exit(2);
}

initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
const auth = getAuth();
const user = await auth.getUser(uid);
const email = String(expectedEmail).trim().toLowerCase();
if (!user.emailVerified || user.email?.toLowerCase() !== email) {
  process.stderr.write("Refusing: Firebase UID, verified email and supplied email do not match.\n");
  process.exit(3);
}
const claims = { ...(user.customClaims || {}) };
if (action === "grant") claims.platformAdmin = true;
else delete claims.platformAdmin;
await auth.setCustomUserClaims(uid, claims);
process.stdout.write(JSON.stringify({
  action,
  uid,
  email,
  platformAdmin: action === "grant"
}) + "\n");
