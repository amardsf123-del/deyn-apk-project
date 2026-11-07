# Trusted platform administrator bootstrap

This script is an operations-only utility. It is not exposed as an app endpoint and must never be run from the customer APK.

Use a trusted computer/environment with Firebase Admin credentials from the Firebase project owner. Never upload the service-account JSON to GitHub, ChatGPT, or the app.

After independently checking the Firebase UID and verified email, run:

```bash
export FIREBASE_PROJECT_ID="your-firebase-project-id"
export GOOGLE_APPLICATION_CREDENTIALS="/secure/path/service-account.json"
export DEYN_CONFIRM_ADMIN_CHANGE="YES"
node scripts/set-platform-admin.js grant "FIREBASE_UID" "verified-admin@example.com"
```

To revoke the platform admin role, use `revoke` instead of `grant`. The script preserves other custom claims and only adds/removes `platformAdmin`.

The platform admin account is the DEYN vendor/operator account, not the shop owner account. It can provision a shop for a customer's verified Firebase account after payment approval. The shop owner then signs in on their own phone, discovers the shop in their private user-shop index, and enrolls that phone. The operator does not receive the customer's owner session token.

Do not grant `platformAdmin` to customers, workers, or shared accounts. Protect the service-account credential and revoke the claim when the operator no longer needs it.
