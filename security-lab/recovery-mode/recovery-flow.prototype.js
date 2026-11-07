 'use strict';

/**
 * DEYN recovery-mode decision prototype.
 * Pure controller: no DOM, Blob, download, network, or writes to storage.
 * A UI may offer raw export only after an explicit user action.
 */
function inspectStartupStorage(storage, key, validate) {
  if (!storage || typeof storage.getItem !== 'function') {
    return { mode: 'blocked', reason: 'storage_unavailable', raw: null };
  }

  let raw;
  try {
    raw = storage.getItem(key);
  } catch (_) {
    return { mode: 'blocked', reason: 'read_failed', raw: null };
  }

  if (raw === null) return { mode: 'new_install', reason: 'key_absent', raw: null };
  if (typeof raw !== 'string') {
    return { mode: 'recovery', reason: 'unexpected_value_type', raw };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (_) {
    return { mode: 'recovery', reason: 'malformed_json', raw };
  }

  let valid = false;
  try {
    valid = Boolean(validate(parsed));
  } catch (_) {
    valid = false;
  }
  if (!valid) return { mode: 'recovery', reason: 'invalid_schema', raw };

  return { mode: 'normal', reason: 'valid_existing_data', raw, data: parsed };
}

function createRecoverySession(startup) {
  if (!startup || startup.mode !== 'recovery') {
    throw new Error('Recovery session requires recovery mode');
  }
  let exported = false;
  return Object.freeze({
    mode: 'recovery',
    reason: startup.reason,
    canStartApp: false,
    canSeedDemoData: false,
    canWriteMainRecord: false,
    canImportBackup: false,
    getExportState() { return exported ? 'requested' : 'not_requested'; },
    requestRawExport() {
      if (typeof startup.raw !== 'string') {
        throw new Error('Raw storage value is unavailable for export');
      }
      exported = true;
      // Return the exact original string; do not parse, normalize, or rewrite it.
      return startup.raw;
    }
  });
}

module.exports = { inspectStartupStorage, createRecoverySession };
