# DEYN SMS reminders

The app's actual source is stored in `deyn-apk-project.zip`. The GitHub Actions integration script injects this SMS engine/runtime into `deyn-app/www/index.html` at build time, then installs and registers `DeynSmsPlugin.java` in the real Capacitor Android project.

## Behavior

- SMS is disabled until the owner explicitly enables it and grants Android's `SEND_SMS` permission.
- Only the owner device sends reminders. The worker device never runs the sender.
- Existing customer debt events are kept unchanged. Payments that predate this feature are allocated FIFO in memory only; new payments record explicit debt allocations.
- New debts can have their own due date. If an older debt has no explicit due date but the customer has a monthly pay day, its first due date is derived from that existing setting. Daily customers without a due date are not sent automatic reminders until the merchant sets one.
- A partial payment can optionally extend one selected debt by days, weeks or months. The original due date and each extension are retained in the transaction history.
- Reminder intervals default to days 1, 4, 8 and 15, at 10:00, 11:00, 16:00 and 10:00. The sender runs between 09:00 and 22:00, with a sequential queue and an adaptive gap for large backlogs.
- Multiple eligible debts for one customer are combined into a reminder where their reminder window matches. A stale backlog produces one catch-up reminder rather than a burst of four historical messages.
- Arabic is the automatic language because the current DEYN UI is Arabic-only; French is an explicit per-customer choice. Honorifics are selected by the merchant and are never inferred.
- The store name placeholder is populated only if a real store profile name exists. The current source has no store-name profile field, so the app does not invent or duplicate one.
- The SMS history records **accepted by Android**, not confirmed delivery. Carrier delivery receipts are not currently available in the app.

## Platform constraints

WorkManager schedules messages while the app is closed. The native worker rechecks the 09:00–22:00 window and a persistent shop-wide send gap immediately before dispatch, so delayed jobs do not all burst together after Doze or a reboot. Android may still defer work because of battery restrictions, device shutdown or lack of cellular service. SMS requires a working SIM/subscription and carrier credit; internet access is not required. The Android SMS API's successful return is not proof that the recipient received the message. The native ID claim is at-most-once: in the rare crash window after a durable claim but before the API result is stored, a message may be skipped rather than risk a duplicate.

The owner phone is the single sender to prevent two-phone duplicate messages. Each background job also checks that its exact phone/message/time payload is still the active queue snapshot; app edits and successful syncs invalidate stale jobs. Offline changes made on the worker phone cannot reach an owner phone that is powered off; the owner receives them only when the local Wi-Fi sync runs again. Therefore no offline two-device design can guarantee knowledge of a payment that has not yet synchronized to the owner device.

## Tests

Run `node sms/test.mjs` for deterministic debt allocation, extension, queue ordering, catch-up, phone normalization, templates, duplicate suppression and send-time validation tests. The GitHub Actions workflow additionally runs the existing DEYN browser/security/sync suites and builds an unsigned debug APK.
