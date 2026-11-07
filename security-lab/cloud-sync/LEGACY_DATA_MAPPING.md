# Legacy DEYN local-data migration contract

This document is based on the recovered current app source. It is a migration plan only; the source on `main` is not modified.

## Existing local model observed

- Main business data is stored as JSON under localStorage key `deyn.v1`.
- The active dataset contains `customers` and `pending` tickets, plus other app-only state.
- A customer contains `id`, `name`, `phone`, `seg`, `ceiling`, `payDay`, and `tx[]`.
- A transaction in `tx[]` contains `id`, `type` (`debt` or `pay`), `amount`, `note`, and `ts`.
- `pending` entries are calculation tickets. They become a debt only when the merchant assigns/transfers them to a customer; therefore pending tickets are not uploaded as ledger entries.
- `trash` may contain deleted customers, deleted tickets, and a full bulk-reset snapshot.
- `auth` contains local password / activation / device-limit state. It is never cloud data.
- The app seeds sample customers and tickets on a fresh install. Its Settings clear-data action moves the active dataset to a local `bulk` trash item and empties active customers and pending tickets.
- Existing transaction IDs are short values generated from `Math.random()` and the current time; they are not strong globally unique IDs.

## Cloud mapping

| Existing field | Cloud representation |
|---|---|
| customer `id` | Firestore customer document ID; preserved |
| `name`, `phone`, `seg` | customer profile fields |
| `ceiling` (DZD decimal) | `creditCeilingCentimes` integer |
| `payDay` | `payDay` |
| customer profile revision | starts at 1 |
| tx `type=debt` | ledger `kind=debt` |
| tx `type=pay` | ledger `kind=payment` |
| tx `amount` (DZD decimal) | `amountCentimes` integer, rounded only to the existing two-decimal precision |
| tx `note` | ledger `note` |
| tx `ts` | ledger `createdAtMs` |
| old tx `id` | deterministic `legacy_{deviceId}_{customerId}_{txId}` event ID |

All money is represented in the cloud as integer centimes to avoid floating-point balance errors. Display conversion is `DZD = centimes / 100`.

## Data that must never be uploaded

- `auth`, including the factory recovery password `fcb1899`, local app passwords, activation codes, and device limits.
- Licensing records, device ID derivation state, clock records, private keys, or signing secrets.
- `settings`, app lock state, theme/sound preferences, or local UI preferences.
- Pending calculator tickets that have not been transferred to a customer.
- `trash`, especially a `bulk` snapshot containing the seeded demo customers and tickets.

The migration helper returns only active customer profiles and their transaction ledger events. It requires an explicit `confirmedRealData: true` flag; without that confirmation it refuses to run. It never reads or serializes the full localStorage object.

## Demo-data safety

The new installation's sample records are for product demonstrations and must remain available locally. They must not silently become a shop's real cloud records.

The first cloud-enrollment UI must show the number of active customers and transactions that will be uploaded and require the owner to confirm that the active records are real shop data. The owner should use the existing Settings reset behavior before enabling sync when the active data is still sample data. The local trash and its demo snapshot remain local and are not uploaded.

No automatic cloud migration runs at app startup. A server acknowledgement is required before any migration item is marked complete, and local records are never deleted merely because an upload was attempted.

## Deletion and restore behavior

Cloud customer deletion is a soft archive: set `archivedAt` and increment `revision`. The customer profile and append-only ledger remain available to the owner for audit/history. Restoring an archived customer sets `archivedAt: null` with the next revision. Permanently emptying local trash must not erase the cloud ledger.

If an old local restore operation generates a new customer ID because the old ID is already in use, the cloud migration must not silently attach old ledger events to the new ID. It must either restore the original identity after a conflict check or require an explicit owner-led data-recovery action.

## Test requirements before migration is enabled

1. Fresh install with demo data: migration blocked until explicit owner confirmation; no demo records uploaded by default.
2. Existing merchant data: all active customers and all tx entries mapped once.
3. Repeated migration/retry: deterministic event IDs prevent duplicate debts/payments.
4. Decimal amounts such as 12.34 DZD become exactly 1234 centimes.
5. Pending tickets, trash, passwords, license records and settings are absent from the upload payload.
6. Interrupted upload: retry only unacknowledged events; do not delete local data.
7. Reset/restore and customer archive: history remains intact on the cloud.
8. A worker device can never initiate the first shop migration or upload a different shop's data.
