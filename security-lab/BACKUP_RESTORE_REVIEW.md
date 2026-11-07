# Backup and recovery path review

**Source-only review. No app changes.**

## What currently exists
- Settings includes a button labelled `حفظ ملف JSON`.
- Its handler serializes the entire in-memory `S` object with `JSON.stringify(S, null, 2)` and downloads a file named `deyn-backup-YYYYMMDD.json`.
- This is an export-only function. The inspected source has no matching JSON file picker/import/restore handler.
- The exported object includes the `auth` object when present. In the current app, `auth` can contain `masterPass`, master/assistant activation codes, role and other account fields.
- Therefore this JSON file may contain sensitive account/activation information as well as customer names, phone numbers, balances and transaction histories. It must be treated as confidential.

## Risks and gaps
1. A downloaded backup is not encrypted by the app.
2. The backup includes sensitive auth fields and should not be sent to GitHub, WhatsApp groups, or public cloud links.
3. There is no in-app restore/import path in the inspected source.
4. Export success is not verified by reading the downloaded file back or checking its integrity.
5. A backup from another device could overwrite device-specific role/activation/auth data if a naive full-object restore were later added.
6. Browser download APIs can fail or be blocked; the current function catches exceptions but does not show a verified backup receipt.

## Recommended safe design (not implemented)
### Export
- Show a clear warning that the file contains private customer and account data.
- Offer a full-data backup that preserves all business records and unknown fields.
- Prefer a separate, explicit choice for including device/account auth data; default should be to exclude device-bound activation secrets and password material.
- Never upload backup automatically.
- After generating the Blob, calculate SHA-256 and show a short integrity fingerprint and record counts. Only say saved after a reliable completion signal; if the browser cannot confirm the download, tell the owner to verify the file in Downloads.

### Restore
- Add a separate import screen with file picker and preview before applying.
- Parse and validate the full file in memory first.
- Require an explicit confirmation that explains current local data will be replaced or merged; do not silently merge by customer name or phone because duplicates and identity collisions are possible.
- Preserve current local `auth`, license, device binding, and role unless the owner explicitly performs a separately authorized device migration. Never import a foreign `masterPass` or activation code by default.
- Write restored data to a temporary key, read back, verify checksum and counts, then switch the active data pointer only after verification.
- Keep old local data until the owner confirms the restored database is correct. Provide a rollback path.
- Never import data into the active store if the app is in a malformed-storage recovery state without first preserving/exporting the raw original bytes.

## Startup recovery UI required
If `deyn.v1` exists but cannot be parsed or validated:
- Stop normal app initialization and all automatic persistence.
- Display a recovery screen, not demo data.
- Offer a way to export the raw stored value without altering it.
- Explain that the file is a damaged-data recovery copy and may require technical repair.
- Do not show sample customers or allow normal write operations until recovery is completed.
- Do not delete the raw value after export.

## Decisions still required before coding
- Should backup include sensitive account/password fields, or only business/customer records?
- Should restore replace all business records or support a carefully designed merge?
- Should the first recovery release support only exporting damaged raw data, with restore handled by a later tested version?

Until these decisions and device tests are complete, do not add a restore button or change the existing export function.
