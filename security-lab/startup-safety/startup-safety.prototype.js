/* DEYN startup data safety guard — isolated lab prototype only.
 * This is not wired into index.html and must not be used on live customer data yet.
 */
(function (root) {
  'use strict';
  const KEY = 'deyn.v1';

  function inspect(raw) {
    if (raw === null || raw === undefined) {
      return { status: 'new-install', data: null, rawPreserved: true };
    }
    if (typeof raw !== 'string') {
      return { status: 'invalid-storage-value', data: null, rawPreserved: true };
    }
    let data;
    try { data = JSON.parse(raw); }
    catch (_) { return { status: 'malformed-json', data: null, rawPreserved: true }; }

    if (!data || typeof data !== 'object' || Array.isArray(data) ||
        !Array.isArray(data.customers) || !Array.isArray(data.pending)) {
      return { status: 'invalid-schema', data: null, rawPreserved: true };
    }
    return { status: 'existing-valid-data', data, rawPreserved: true };
  }

  function boot(storage, seedFactory) {
    if (!storage || typeof storage.getItem !== 'function' ||
        typeof storage.setItem !== 'function' || typeof seedFactory !== 'function') {
      throw new Error('STARTUP_CAPABILITY_MISSING');
    }
    const raw = storage.getItem(KEY);
    const result = inspect(raw);

    if (result.status === 'new-install') {
      const seeded = seedFactory();
      if (!seeded || !Array.isArray(seeded.customers) || !Array.isArray(seeded.pending)) {
        throw new Error('SEED_SCHEMA_INVALID');
      }
      return { status: 'new-install-seeded', data: seeded, canPersist: true, sourceRaw: null };
    }

    if (result.status !== 'existing-valid-data') {
      // Critical: do not seed, write, clear, or "repair" an existing invalid value.
      return { status: result.status, data: null, canPersist: false, sourceRaw: raw };
    }

    return { status: 'existing-valid-data', data: result.data, canPersist: true, sourceRaw: raw };
  }

  function persist(storage, state, bootResult) {
    if (!bootResult || bootResult.canPersist !== true || !state) {
      throw new Error('PERSIST_BLOCKED_UNSAFE_STARTUP');
    }
    storage.setItem(KEY, JSON.stringify(state));
    return true;
  }

  const api = { KEY, inspect, boot, persist };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.DEYNStartupSafetyPrototype = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
