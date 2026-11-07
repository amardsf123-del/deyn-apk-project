# DEYN safe-start integration map

**Status:** source-mapped design only. No app source changed.

## Confirmed current startup order

The inspected `deyn-app/www/index.html` currently has this order:

1. `licenseBoot(init)` runs at the bottom of the script when the `coins` element exists.
2. `licenseBoot` stores `init` in `DEYN_START_FN`, prepares activation UI, runs clock initialization, and checks the license.
3. If the license is valid, `agStartApp()` calls `DEYN_START_FN()` once.
4. `init()` currently executes `S = load() || seed()`.
5. `init()` then fills settings/auth defaults, applies the license role, builds UI, renders, calls `persist()`, and runs notifications/app-lock checks.

The unsafe part is confirmed: `load()` returns null both when no key exists and when an existing value cannot be parsed/validated. Then `init()` seeds and persists. See `CRITICAL_DATA_PRESERVATION_FINDING.md`.

## Required safe order

The storage decision must happen before license UI/boot and before any normal initialization:

1. Perform a read-only inspection of `localStorage["deyn.v1"]`.
2. If the read throws or storage is unavailable: show storage-unavailable recovery state and stop.
3. If the key exists but is malformed, invalid-schema, or unexpected type: show damaged-data recovery state and stop.
4. If the key is valid: retain parsed object and raw string; continue to the existing license boot. Do not write during inspection.
5. If the key is genuinely absent: continue to existing license boot. Only after a valid activation starts the app may the normal new-install seed be created.
6. When `agStartApp()` invokes the start function, use the already-inspected result. Never repeat a lossy `load() || seed()` decision.
7. For existing valid data, initialize from the exact parsed object. For a genuinely absent key, call `seed()`.
8. Only after successful initialization and validation may normal persistence begin.

## Important license and role boundaries

- Do not bypass license validation to show the normal app.
- Damaged-data recovery/export is a separate restricted screen; it must not expose debt screens or normal app functions.
- Do not call `applyLicenseRole()` on damaged or unavailable state.
- Do not change activation records, license tier/role/expiry, or device binding during recovery.
- Do not change `fcb1899`, auth defaults, or existing owner/worker role behavior.
- Do not restore the removed owner/worker toggle button.

## Implementation approach when integration is authorized

- Add a small recovery view that is independent of normal app rendering.
- Run a storage inspection gate before `licenseBoot(init)`.
- Refactor `init()` to accept a pre-inspected startup result rather than calling `load() || seed()`.
- Ensure every app entry path (first launch, activation success, returning valid license) uses the same gate.
- Make `persist()` refuse writes unless startup state is `normal` and initialization completed.
- Keep the original raw damaged value in memory for explicit export only.
- Do not implement restore/import in the same change.
- Add a startup test harness and run it against the actual embedded source, then build and test on the Android 13 phone before any merge.

## Not done

No code was integrated into `deyn-app/www/index.html`; no APK was built; no production branch or existing customer data was changed. This map is not proof of a working recovery screen.
