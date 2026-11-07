# DEYN read-only backup validator prototype

Status: isolated lab prototype. It does not add restore, write app storage, change the current backup button, or alter production data.

## Supported inputs
- **Legacy**: current raw full-state JSON. Requires `customers` and `pending` arrays; if `trash` exists it must be an array. All other fields remain intact.
- **Versioned v1**: `DEYN_BACKUP` envelope, version 1, app key `deyn.v1`, parseable creation date, complete `data`, and SHA-256 digest over canonical JSON.

## Preview
Returns customer, pending-ticket, and trash counts, plus flags for auth/settings presence. It does not guess transaction counts because every transaction schema variant has not yet been verified.

## Safety boundaries
- Read-only; no localStorage or app-state writes.
- Empty active arrays are valid, including intentional Settings reset.
- Bulk trash and unknown fields are preserved.
- No auth/password/license/role fields are stripped or overwritten.
- SHA-256 detects accidental changes; it is not encryption or proof of trusted origin.
- No restore, merge, replacement, or upload.

Run with `node --test test/backup-validator.test.js`. This Node prototype is not Android WebView validation.
