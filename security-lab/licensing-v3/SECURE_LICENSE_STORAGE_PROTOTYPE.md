# Fail-closed secure license storage prototype

This adapter is isolated under `security-lab`; it is not wired into DEYN's current `DeynStore` and does not modify customer storage.

## Contract
- Requires the native plugin and `getPlatform()`; accepts Android only.
- Uses a dedicated `deyn_v3_` namespace.
- Reads and writes only through the native plugin.
- Requires `set()` to return literal `true`, then reads the value back and compares it exactly.
- Any plugin, platform, write, or readback error rejects the operation. There is deliberately no localStorage fallback.

## Important limitation
This is a policy adapter and mock-tested contract, not proof that the installed plugin is hardware-backed. The current project declares `capacitor-secure-storage-plugin ^0.11.0`, has no lockfile in the inspected archive, and its upstream Android implementation can fall back if AndroidKeyStore initialization fails. Confirm the exact resolved package and its runtime behavior on the target Android 13 phone before using this adapter for real licenses.

Do not migrate the complete customer debt database into this plugin. Keep customer-data backup/migration separate from small activation metadata. Do not call plugin `clear()`.

## Tests
```sh
node --test security-lab/licensing-v3/secure-license-store.test.js
```
