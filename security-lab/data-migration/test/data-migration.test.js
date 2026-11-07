const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const { migrate, OLD_KEY, NEW_KEY, META_KEY } = require('../data-migration.prototype.js');

class MemoryStorage {
  constructor(entries = {}) { this.map = new Map(Object.entries(entries)); this.failRead = false; this.failWriteKey = null; }
  getItem(k) { if (this.failRead && k === NEW_KEY) throw new Error('read failed'); return this.map.has(k) ? this.map.get(k) : null; }
  setItem(k, v) { if (this.failWriteKey === k) throw new Error('write failed'); this.map.set(k, String(v)); }
}

const sample = {
  seq: 19,
  settings: { dialect: true, custom: { theme: 'dark' } },
  customers: [{ id: 'c-1', name: 'عميل تجريبي', tx: [{ id: 't-1', type: 'debt', amount: 1250 }, { id: 't-2', type: 'pay', amount: 250 }] }],
  pending: [{ id: 'p-1', amount: 400 }],
  trash: [{ id: 'r-1', type: 'bulk', data: { customers: [{ id: 'c-old' }], pending: [] } }],
  auth: { role: 'owner', marker: 'preserve-exactly' },
  unknownFutureField: { keep: [1, 2, 3] }
};

test('migrates full object and preserves old record byte-for-byte', async () => {
  const oldRaw = JSON.stringify(sample, null, 2);
  const s = new MemoryStorage({ [OLD_KEY]: oldRaw });
  const result = await migrate(s, webcrypto);
  assert.equal(result.status, 'migrated-and-verified');
  assert.equal(s.getItem(OLD_KEY), oldRaw);
  const envelope = JSON.parse(s.getItem(NEW_KEY));
  assert.deepEqual(envelope.data, sample);
  assert.equal(envelope.data.auth.marker, 'preserve-exactly');
  assert.equal(JSON.parse(s.getItem(META_KEY)).customerCount, 1);
});

test('does not create v2 when old data is missing or malformed', async () => {
  for (const raw of [null, '{broken']) {
    const s = new MemoryStorage(raw === null ? {} : { [OLD_KEY]: raw });
    await assert.rejects(() => migrate(s, webcrypto));
    assert.equal(s.getItem(NEW_KEY), null);
  }
});

test('rejects invalid schema without replacing source', async () => {
  const raw = JSON.stringify({ customers: [], pending: 'not-array' });
  const s = new MemoryStorage({ [OLD_KEY]: raw });
  await assert.rejects(() => migrate(s, webcrypto), /LEGACY_SCHEMA_INVALID/);
  assert.equal(s.getItem(OLD_KEY), raw);
  assert.equal(s.getItem(NEW_KEY), null);
});

test('is idempotent when matching verified v2 already exists', async () => {
  const s = new MemoryStorage({ [OLD_KEY]: JSON.stringify(sample) });
  const first = await migrate(s, webcrypto);
  const second = await migrate(s, webcrypto);
  assert.equal(first.status, 'migrated-and-verified');
  assert.equal(second.status, 'already-migrated');
});

test('does not overwrite a conflicting v2 record', async () => {
  const s = new MemoryStorage({ [OLD_KEY]: JSON.stringify(sample), [NEW_KEY]: JSON.stringify({ schemaVersion: 2, data: { wrong: true } }) });
  const before = s.getItem(NEW_KEY);
  await assert.rejects(() => migrate(s, webcrypto), /NEW_RECORD_CONFLICT/);
  assert.equal(s.getItem(NEW_KEY), before);
  assert.ok(s.getItem(OLD_KEY));
});

test('keeps old record if v2 write fails', async () => {
  const raw = JSON.stringify(sample);
  const s = new MemoryStorage({ [OLD_KEY]: raw });
  s.failWriteKey = NEW_KEY;
  await assert.rejects(() => migrate(s, webcrypto));
  assert.equal(s.getItem(OLD_KEY), raw);
  assert.equal(s.getItem(NEW_KEY), null);
});

test('does not include a phone-clock timestamp in migration envelope', async () => {
  const s = new MemoryStorage({ [OLD_KEY]: JSON.stringify(sample) });
  await migrate(s, webcrypto);
  assert.equal(JSON.parse(s.getItem(NEW_KEY)).migratedAt, null);
});
