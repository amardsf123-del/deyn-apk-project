# DEYN cloud sync — isolated prototype

**Status: architecture and backend prototype are emulator-tested. Nothing is deployed or connected to the DEYN APK.**

All work remains on `cloud-sync-lab`; `main`, the current APK, DEYN2 licensing, demo data, Settings reset, owner password `fcb1899`, and current owner/worker UI remain unchanged.

## Architecture and permissions

Firebase Authentication + Cloud Firestore, one `shopId` per shop, and one random 128-bit device ID per physical phone.

- Owner: read/create customers, add debt/payment, edit and archive customer profiles, manage workers and devices.
- Worker: read customers, create customers, add debt/payment only.
- Both roles: ledger is append-only; corrections must be represented as compensating entries, not edits/deletes.
- Customer deletion is a soft archive; debt history remains.
- Balances are derived from unique immutable events.
- All money is stored as integer `amountCentimes` (not floating-point DZD). The current app's DZD decimal amounts convert to centimes during migration.
- Profile revisions prevent stale edits from silently overwriting newer changes.
- Current shop limit: two unique physical device IDs. Owner and worker enrollment records on the same phone share one device ID and count as one physical device.

## Trusted backend now implemented in the lab

The `functions/` package uses Firebase Admin SDK 14.5 and Cloud Functions SDK 7.3.

1. **Shop provisioning:** only a verified platform administrator can provision a shop after payment approval, for a customer Firebase UID + verified email. The operation creates the shop, owner membership and a private `users/{uid}/shops/{shopId}` index. It does not register a phone or return the owner's token to the operator.
2. **Owner first phone:** owner signs into their own account, discovers their shop ID through their private shop index, then calls `enrollOwnerDevice`. The backend checks recent re-authentication and returns a per-device custom token.
3. **Worker invitation:** owner creates a hashed, email-bound, expiring, single-use secret. Worker redeems it while signed in with a verified email. One Firestore transaction consumes the invitation and creates member, device and user-shop index records.
4. **Owner recovery:** owner signs into their own account on the worker's phone and registers the same physical device ID under the owner UID. The worker enrollment remains separate. It counts as the same physical phone.
5. **Sessions and revocation:** backend mints custom tokens with per-session claims `shopId`, `memberRole`, `deviceId`. Owner can revoke a device or deactivate a worker; deactivation revokes all that worker's enrollments.
6. **Subscription administration:** only platform admin can update shop expiry; each change is written to a subscription audit subcollection. Clients cannot edit the shop record.
7. **Platform admin bootstrap:** guarded script in `functions/scripts/set-platform-admin.js`; requires a verified matching email, Firebase Admin credentials in a trusted environment and explicit confirmation. No credentials are in the repository.

Firebase user's ordinary custom claims are global to that UID, so they are not used for the device ID. Device-specific claims are issued in each Firebase custom token session. App Check is required on callable endpoints.

## Exact existing-app migration

The recovered current app uses `localStorage['deyn.v1']`:
- customer profiles have `id`, `name`, `phone`, `seg`, `ceiling`, `payDay`, and `tx[]`.
- transactions contain `id`, `type` (`debt` / `pay`), `amount`, `note`, and `ts`.
- pending tickets are not debts until assigned to a customer.
- trash can include deleted customers and a full bulk-reset snapshot.
- auth contains the factory password, local passwords and license/device state.

The new `legacy-migration.js` maps only active customer profiles and their `tx[]` records. It converts DZD decimals to integer centimes and creates stable event IDs namespaced by device + customer + old transaction ID. It requires explicit `confirmedRealData: true` and never includes pending tickets, trash/demo snapshots, auth/passwords, licenses or settings.

Read [LEGACY_DATA_MAPPING.md](./LEGACY_DATA_MAPPING.md) and [CLIENT_INTEGRATION_PLAN.md](./CLIENT_INTEGRATION_PLAN.md) for the complete migration and app-side contracts. No migration runs at startup. First sync must show record counts and require owner confirmation; sample demo records must never be uploaded automatically.

## Automated verification

Latest full CI run: [42384170169](https://github.com/amardsf123-del/deyn-apk-project/actions/runs/42384170169).

| Test group | Passed | Failed |
|---|---:|---:|
| Security, sync logic and legacy migration | 116 | 0 |
| Firestore Security Rules emulator | 18 | 0 |
| Membership/backend transaction tests | 17 | 0 |
| **Total** | **151** | **0** |

Coverage includes invitation race/replay, wrong and unverified email, owner identity verification, shop provisioning, owner recovery on worker phone, physical device cap, device/member revocation, subscription renewal audit, customer profile validation, centime arithmetic, demo-data exclusion, and 600-customer analytics.

The Capacitor 8 Firebase plugin + secure-storage dependency graph also resolves in CI. Its isolated package uses a patched gRPC transport override; the latest bridge-package npm audit reports zero vulnerabilities. The backend dependency tree currently reports six moderate transitive advisories with non-breaking fixes available; CI now runs `npm audit fix` before the audit and tests. This is separate from the test pass count.

These are emulator and dependency-resolution tests, not production deployment or Android physical-device tests.

## Capacitor and offline decision

The recovered app currently uses Capacitor 7 and secure-storage plugin 0.11.x. The maintained Firebase Capacitor plugin line is 8.x for Capacitor 8; the 7.x plugin line is deprecated. The isolated test resolves Firebase plugins 8.6.0 with Capacitor 8 and secure-storage 0.13.0. Do not upgrade the production app until a complete Android build and license-storage test passes.

Native Firestore Android persistence must be enabled before any Firestore calls and tested on two real phones, including airplane mode, force-stop/restart, retries, duplicate sync, owner recovery and subscription expiry. The current outbox helper remains in-memory logic; a durable native queue and app integration are still required.

## Deployment readiness

A manual workflow exists at `.github/workflows/deploy-deyn-cloud-sync.yml`. It requires GitHub Actions secrets:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

The workflow is manual only and requires typing `DEPLOY`. No Firebase project or credentials are currently configured. Do not run deployment until the customer Firebase project, Authentication, Firestore, App Check, billing/region, and Android app configuration have been created and reviewed.

Still pending: payment-provider integration, customer app custom-token sign-in, native Firestore bridge, durable offline outbox, app-side sync UI, actual data migration on a copy, Android builds and two-phone tests. No real customer data is being transmitted.
