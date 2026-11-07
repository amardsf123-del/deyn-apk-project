# Data migration prototype

**Lab-only prototype. Not integrated into DEYN. Never run against a customer's live storage.**

This prototype tests the core non-destructive copy rule:
- Read and validate `deyn.v1`.
- Create a versioned `deyn.v2` envelope containing the complete original object.
- Calculate SHA-256 over a canonical representation.
- Read back and verify the new record.
- Keep `deyn.v1` byte-for-byte; never delete or overwrite it.
- Reject malformed source data and conflicting destination records.
- Avoid using the phone clock as a trusted migration timestamp.

Run tests from this folder:
```sh
node --test test/data-migration.test.js
```

Limitations:
- Uses a simulated in-memory storage adapter, not Android localStorage/Capacitor.
- Does not implement backup export/import or recovery UI.
- Does not migrate activation metadata or touch licensing.
- The app still expects the legacy top-level data object. A future integration would require a carefully tested compatibility reader before switching the active key.
- Does not attempt to detect whether data is a demo seed; the current app does not store a reliable explicit seed marker.
- Does not touch `fcb1899`, role switching, or the visible owner/worker toggle.
