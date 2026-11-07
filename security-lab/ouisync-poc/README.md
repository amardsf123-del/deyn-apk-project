# DEYN Ouisync local-network POC

**Status: isolated experiment only. Not integrated into DEYN and not approved for customer use.**

This project tests whether the official Ouisync Kotlin/Android bindings can be embedded in a separate Android app and used for local-network peer discovery without a cloud account.

## Why this POC exists

- DEYN's core app must remain fully offline and independent of Ouisync.
- Optional two-phone sync must not require Firebase or a monthly hosted service.
- The production source and APK are not changed by this experiment.
- This experiment lives on the `ouisync-poc` branch, based on `cloud-sync-lab`.

## Upstream and license

- Upstream: https://github.com/equalitie/ouisync
- Kotlin bindings: https://docs.ouisync.net/kotlin/
- License: MPL-2.0. Commercial use is permitted under the license; modifications to MPL-covered files must be made available under MPL when distributed. Preserve notices and review exact obligations before release.
- Pinned Kotlin artifact version: `0.10.0-0`, published upstream artifact version `0.10.0-0` and Kotlin binding revision `0` at the inspected upstream source revision.
- Maven coordinates:
  - `ie.equalit.ouinet:ouisync-session:0.10.0-0`
  - `ie.equalit.ouinet:ouisync-service:0.10.0-0`

## Local-only configuration in this POC

- QUIC listeners bind to local interfaces.
- Local discovery is enabled.
- DHT is disabled.
- Peer Exchange (PEX) is disabled.
- UPnP/port forwarding is disabled.
- No Firebase, Cloud Functions, relay account, or DEYN customer data is configured.

This aims to test same-LAN peer discovery. A successful Gradle build does **not** prove that two physical phones can discover each other with router WAN disconnected. That requires a real-device test.

## Test procedure

1. Build and install the debug APK on two Android phones.
2. Connect both phones to the same Wi-Fi router.
3. Disconnect the router's internet/WAN while keeping Wi-Fi running.
4. On phone A, press **إنشاء محل تجريبي**.
5. Long-press the generated share token to copy it; transfer it to phone B.
6. Paste the token on phone B and press **الانضمام إلى المحل**.
7. Press **إرسال عملية اختبار** on each phone.
8. Press **تحديث حالة المزامنة** on both phones and compare event-file counts.
9. Force-stop and restart each app, then verify repository persistence and synchronization.

## Important security and product limitations

1. Ouisync synchronizes files, not DEYN business-ledger semantics. A production adapter must encode each debt/payment as a unique immutable event file and validate it before importing it into DEYN's local database.
2. This POC shares a **write** token so both devices can add test files. It does not implement DEYN owner/worker authorization. Ouisync access modes are repository-level (blind/read/write), not per-operation business roles. A write token is not proof that a peer is an authorized owner or worker.
3. Do not sync the SQLite database file itself while both phones can write. Use immutable event files with unique IDs and a deterministic import/idempotency layer.
4. No background/foreground service integration, durable DEYN outbox, migration, conflict UI, device binding, subscription checks, or production recovery flow is included.
5. Upstream currently describes the Android app as beta. Treat this as an experimental dependency; test battery, app lifecycle, Android permissions, and low-memory behavior.
6. This sample has not yet been tested on physical phones. Build success is only a compile/package check.
7. APK size and ABI coverage must be reviewed; Ouisync includes native Rust libraries and may increase APK size.

## Acceptance gates before DEYN integration

- Dependency resolution and Android debug build succeed.
- Two physical phones discover each other with router WAN disconnected.
- Both directions transfer unique event files reliably.
- Force-stop and restart preserve repository and events.
- Simultaneous writes do not overwrite or duplicate event files.
- No internet/DHT/PEX/UPnP traffic is needed for the LAN-only test.
- Worker cannot modify owner-only profile fields through the DEYN adapter.
- Malformed, duplicate, wrong-shop, and unauthorized events are rejected before import.
- APK size, battery, thermal and Android-version behavior are acceptable.

Until all gates pass, keep this as a lab-only POC and do not merge into `main`.
