# Backup format and restore safety review

Status: design review only. No production application code, backup behavior, Settings reset, trash behavior, or APK has been changed.

## 1. Current behavior verified in source

The Settings action labelled **حفظ ملف JSON** calls `backup()`. The function serializes the entire in-memory state object:

```js
new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' })
```

It downloads a file named `deyn-backup-YYYYMMDD.json`.

There is no JSON import/file-picker/restore handler in the inspected app source. The existing `restoreTrash` action is an in-app trash restore operation, not a backup-file importer.

The state object contains, at minimum, these top-level areas observed in source: `seq`, `settings`, `pending`, `customers`, `trash`, `auth`, `customSegs`, `deletedSegs`, `guaranteed`, and `map`. Some of these are user/business data, some are preferences, and some are local authorization/activation state. The current full-object backup includes all enumerable fields present in `S`, including fields not listed here.

## 2. What the current backup may contain

- Customer names and phone numbers.
- Customer classifications, credit ceilings, payment days, and transaction histories.
- Pending tickets, amounts, notes, and timestamps.
- Trash records, including deleted customers/tickets and bulk snapshots used by the existing restore-from-trash feature.
- App settings and custom classifications.
- Authentication data under `S.auth`, including the locally stored master password when set, device role, license role, master/assistant activation codes, and displayed expiry metadata.
- Sequence counters and other application state.

The source uses `S.auth.masterPass` and falls back to the chosen factory password `fcb1899` when it is absent. The current backup serializes the full object, so it can include a user-set master password and activation codes. Treat the JSON file as highly sensitive: anyone who obtains it may learn private customer data and potentially sensitive local account/activation details.

**Important:** this review does not change or remove `fcb1899`, authentication behavior, owner/worker behavior, or the existing backup. The owner has explicitly chosen to retain the factory password behavior.

## 3. Preserve the current behavior until a restore design is approved

Keep unchanged for now:
- The current full JSON backup action.
- Demo/sample data on a genuinely fresh install.
- Settings > حذف البيانات, which archives customer and pending-ticket data in a bulk trash record before emptying those arrays.
- Existing restore-from-trash behavior, including bulk restore.
- All auth, role, activation, and license fields in the live app state.

Do not silently turn the current backup into a customer-data-only export. That would risk losing data the owner expects to preserve. If a reduced report/export is ever wanted, it should be a separately named feature and must not be confused with a full backup.

## 4. Safe future backup envelope (proposal, not implemented)

A future versioned backup could wrap a complete snapshot without changing its contents:

```json
{
  "format": "DEYN_BACKUP",
  "formatVersion": 1,
  "appDataKey": "deyn.v1",
  "createdAt": "ISO-8601 timestamp",
  "data": { "complete application state": "preserved exactly" },
  "integrity": {
    "algorithm": "SHA-256",
    "digest": "hex digest of canonical data"
  }
}
```

This is a proposal only. A checksum detects accidental corruption; it is not encryption and does not prove who created the file. If the format is introduced, canonicalization and exact supported JSON types must be specified and tested before release. The existing unwrapped JSON format should remain readable by any approved migration path.

## 5. Restore must not be added as a blind JSON assignment

Before any restore feature is implemented, it needs all of these safeguards:

1. Read and parse the selected file without changing live app state.
2. Recognize supported legacy and versioned formats explicitly.
3. Validate the full schema, types, required arrays, customer records, transaction records, pending tickets, trash entries, and supported state fields.
4. Reject malformed, truncated, unsupported, or internally inconsistent files with a clear Arabic explanation.
5. Show a preview: customer count, transaction count, pending-ticket count, trash count, backup date (if trustworthy), and whether the file contains auth/activation fields.
6. Require an explicit owner confirmation for replacement. Do not silently merge records or overwrite the current data.
7. Preserve current device-bound activation, local password, role, and license metadata by default. A backup from another phone must not transfer a license or change device identity.
8. Do not discard `trash` or bulk snapshots. They are needed for the current restore-from-trash behavior.
9. Write to a temporary key, read it back, validate it and verify its digest before switching the active data pointer.
10. Keep the pre-restore state available for rollback until the new state has been loaded and verified successfully.
11. Never call `seed()` as a fallback when a restore fails or existing storage is damaged.
12. Never automatically upload backup files to a server.

A future restore may need separate, carefully named choices such as replace current records versus merge. Do not add those choices until duplicate customer IDs, transaction IDs, sequence counters, trash collisions, and merge semantics are specified and tested.

## 6. Privacy and file handling

- Warn users that the current JSON backup contains customer data and may contain password/activation details.
- Recommend storing it in a private location and not sharing it in WhatsApp groups or public cloud links.
- Do not claim the file is encrypted: the current backup is plain JSON.
- If encryption is later added, the key-management and forgotten-password recovery path must be designed first. Do not encrypt backups with an undocumented fixed key embedded in the APK.
- Do not log backup contents or customer details.

## 7. Test cases required before a restore implementation

At minimum:
- Full backup round-trip preserves every customer, transaction, pending ticket, trash entry, bulk trash snapshot, settings, and unknown forward-compatible fields.
- Intentional Settings reset state (empty `customers` and `pending`, bulk trash present) remains valid and restorable.
- A backup with empty arrays and no trash is also valid.
- Existing local password, role, device identity, and license fields are not overwritten by a foreign backup.
- Malformed JSON, missing required arrays, wrong field types, duplicate IDs, invalid transaction amounts/types, and unsupported format versions are rejected without touching current data.
- A failed temporary write or failed digest verification leaves the current state intact.
- Repeated restore attempts do not duplicate records.
- Restore does not seed demo data on error.
- Trash restore continues to work after a successful restore.
- Large backup files and Android WebView file-picker/download behavior are tested on the target phone.

## 8. Current decision

No production changes are authorized by this review. The next safe step is to define and test a read-only backup validator and preview against real schema examples, then separately design restore semantics. The existing backup button and trash restore remain untouched until those tests and a device test pass.
