# Secure Storage plugin review (source-level; not device-tested)

Date reviewed: 2026-11-07.

## Project dependency observed
The inspected `deyn-app/package.json` declares:
- `@capacitor/core`: `^7.0.0`
- `@capacitor/android`: `^7.0.0`
- `capacitor-secure-storage-plugin`: `^0.11.0`

There is no lockfile in the inspected app source archive. The range `^0.11.0` does not pin an exact resolved package artifact, so the actual installed version must be confirmed from the APK build's npm resolution/lockfile before integration.

## API compatibility with current calls
The published plugin API documents:
- `get({ key }) -> { value }`
- `set({ key, value })`
- `remove({ key })`
- `keys()`
- `clear()`
- `getPlatform()`

The DEYN wrapper's `get({key})` and `set({key,value})` call shape matches the documented methods. However, the app does not check the boolean success value returned by `set()`, and it catches errors then writes a custom localStorage fallback. Therefore it cannot currently prove that a secret was stored natively.

## Android implementation findings from upstream source/docs
The plugin documentation describes Android storage using AndroidKeyStore with SharedPreferences. Its Android source shows:
- Android API levels 18 and higher attempt an AndroidKeyStore RSA key pair and encrypt values before writing them to SharedPreferences.
- If AndroidKeyStore initialization fails, the helper falls back to an SDK16 implementation that stores Base64-encoded values in SharedPreferences.
- The source logs whether the key is hardware-backed; it does not make hardware-backed storage a guaranteed prerequisite for use.
- The plugin documentation says Android API below 18 uses simple Base64 storage. This is not relevant to the stated Android 13 target, but the source-level fallback after Keystore initialization failure remains relevant.

Consequently, the presence of this plugin does not by itself prove that every DEYN secret is protected by AndroidKeyStore on every device. DEYN must call `getPlatform()`, verify read-after-write, inspect failure behavior, and decide whether a software fallback is acceptable. For activation secrets, the safer policy is to fail closed if native secure storage cannot be confirmed, rather than silently fall back to localStorage.

## Version compatibility warning
The upstream repository's current README recommends plugin 0.12.0 for Capacitor 7, while DEYN's package range is `^0.11.0`. This is a version-alignment issue to resolve deliberately, not an automatic instruction to upgrade. Before changing it:
1. Inspect the exact 0.11.0 package artifact and its peer dependency metadata.
2. Confirm the actual resolved version in the build.
3. Review the 0.12.0 changelog and Android implementation.
4. Build and test on the target Android 13 device.
5. Verify migration and persistence across app restart, force-stop, update, and reinstall scenarios.

## Data migration consequence
Do not move the complete `deyn.v1` customer database into this plugin as a shortcut. The plugin is designed for string secrets; DEYN's main customer data record is a separate localStorage JSON record. Keep debt-data backup/migration separate from small activation metadata. Do not call plugin `clear()` because it would remove all plugin entries, including unrelated keys.

## What has NOT been done
- No dependency version was changed.
- No app source or APK was modified.
- No plugin was built or executed on the user's phone.
- No claim is made that the current APK uses hardware-backed encryption.
- No production storage migration was implemented.
