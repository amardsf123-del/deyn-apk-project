/* DEYN data migration prototype — isolated lab only.
 * Does not import into the app and never deletes or overwrites deyn.v1.
 */
(function (root) {
  'use strict';
  const OLD_KEY = 'deyn.v1';
  const NEW_KEY = 'deyn.v2';
  const META_KEY = 'deyn.migration.v2';

  function stable(value) {
    if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
    if (value && typeof value === 'object') {
      return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}';
    }
    return JSON.stringify(value);
  }

  function validateLegacy(raw) {
    if (typeof raw !== 'string' || raw.length === 0) throw new Error('LEGACY_MISSING');
    let data;
    try { data = JSON.parse(raw); } catch (_) { throw new Error('LEGACY_MALFORMED'); }
    if (!data || typeof data !== 'object' || Array.isArray(data) ||
        !Array.isArray(data.customers) || !Array.isArray(data.pending)) {
      throw new Error('LEGACY_SCHEMA_INVALID');
    }
    return data;
  }

  async function digest(text, cryptoApi) {
    const bytes = new TextEncoder().encode(text);
    const hash = await cryptoApi.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
  }

  async function migrate(storage, cryptoApi) {
    if (!storage || typeof storage.getItem !== 'function' ||
        typeof storage.setItem !== 'function' || !cryptoApi || !cryptoApi.subtle) {
      throw new Error('MIGRATION_CAPABILITY_MISSING');
    }

    const oldRaw = storage.getItem(OLD_KEY);
    const oldData = validateLegacy(oldRaw);
    const canonical = stable(oldData);
    const checksum = await digest(canonical, cryptoApi);

    const existing = storage.getItem(NEW_KEY);
    if (existing !== null) {
      let envelope;
      try { envelope = JSON.parse(existing); } catch (_) { throw new Error('NEW_RECORD_UNREADABLE'); }
      if (envelope && envelope.schemaVersion === 2 &&
          envelope.sourceKey === OLD_KEY && envelope.checksum === checksum &&
          stable(envelope.data) === canonical) {
        return { status: 'already-migrated', checksum };
      }
      throw new Error('NEW_RECORD_CONFLICT');
    }

    const envelope = {
      schemaVersion: 2,
      sourceKey: OLD_KEY,
      migratedAt: null, // no phone-clock timestamp is trusted here
      checksum,
      data: oldData
    };
    const encoded = JSON.stringify(envelope);

    // Preserve old data; only create the new key.
    storage.setItem(NEW_KEY, encoded);
    const readBack = storage.getItem(NEW_KEY);
    if (typeof readBack !== 'string') throw new Error('NEW_RECORD_READBACK_MISSING');

    let verified;
    try { verified = JSON.parse(readBack); } catch (_) { throw new Error('NEW_RECORD_READBACK_INVALID'); }
    if (!verified || verified.schemaVersion !== 2 ||
        verified.sourceKey !== OLD_KEY || verified.checksum !== checksum ||
        stable(verified.data) !== canonical ||
        await digest(stable(verified.data), cryptoApi) !== checksum) {
      throw new Error('NEW_RECORD_VERIFICATION_FAILED');
    }

    const summary = {
      schemaVersion: 2,
      checksum,
      customerCount: oldData.customers.length,
      pendingCount: oldData.pending.length,
      trashCount: Array.isArray(oldData.trash) ? oldData.trash.length : 0
    };
    storage.setItem(META_KEY, JSON.stringify({ status: 'verified', ...summary }));
    return { status: 'migrated-and-verified', ...summary };
  }

  const api = { OLD_KEY, NEW_KEY, META_KEY, stable, validateLegacy, migrate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DEYNMigrationPrototype = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
