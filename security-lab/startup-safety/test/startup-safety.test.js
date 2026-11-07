const test = require('node:test');
const assert = require('node:assert/strict');
const { boot, persist, KEY } = require('../startup-safety.prototype.js');

class Store {
  constructor(raw = null) { this.raw = raw; this.writes = 0; }
  getItem(k) { assert.equal(k, KEY); return this.raw; }
  setItem(k, v) { assert.equal(k, KEY); this.raw = String(v); this.writes++; }
}
const seed = () => ({ customers: [], pending: [], auth: { masterPass: 'fcb1899' } });

test('new install seeds once and can persist', () => {
  const s = new Store(null);
  const result = boot(s, seed);
  assert.equal(result.status, 'new-install-seeded');
  assert.equal(result.canPersist, true);
  assert.equal(result.data.auth.masterPass, 'fcb1899');
  persist(s, result.data, result);
  assert.equal(s.writes, 1);
});

test('valid existing data loads without seeding or immediate write', () => {
  const raw = JSON.stringify({ customers: [{ id: 'x' }], pending: [], auth: { role: 'worker' }, extra: 42 });
  const s = new Store(raw);
  let seeded = false;
  const result = boot(s, () => { seeded = true; return seed(); });
  assert.equal(result.status, 'existing-valid-data');
  assert.equal(seeded, false);
  assert.equal(s.writes, 0);
  assert.equal(result.data.extra, 42);
  assert.equal(result.data.auth.role, 'worker');
});

test('malformed existing JSON is preserved and blocks all writes', () => {
  const raw = '{ broken JSON with customer data';
  const s = new Store(raw);
  const result = boot(s, seed);
  assert.equal(result.status, 'malformed-json');
  assert.equal(result.canPersist, false);
  assert.equal(s.raw, raw);
  assert.throws(() => persist(s, seed(), result), /PERSIST_BLOCKED_UNSAFE_STARTUP/);
  assert.equal(s.writes, 0);
  assert.equal(s.raw, raw);
});

test('existing invalid schema is not replaced with demo seed', () => {
  const raw = JSON.stringify({ customers: 'bad', pending: [] });
  const s = new Store(raw);
  const result = boot(s, seed);
  assert.equal(result.status, 'invalid-schema');
  assert.equal(result.canPersist, false);
  assert.equal(s.raw, raw);
  assert.equal(s.writes, 0);
});

test('non-string existing storage value blocks seed and writes', () => {
  const s = new Store(17);
  const result = boot(s, seed);
  assert.equal(result.status, 'invalid-storage-value');
  assert.equal(result.canPersist, false);
  assert.equal(s.writes, 0);
});

test('seed factory returning invalid structure is rejected', () => {
  const s = new Store(null);
  assert.throws(() => boot(s, () => ({ customers: [], pending: 'bad' })), /SEED_SCHEMA_INVALID/);
  assert.equal(s.writes, 0);
});

test('valid owner auth data and unknown nested fields are retained', () => {
  const original = { customers: [{ id: 'c', tx: [{ id: 't', amount: 300 }] }], pending: [], auth: { masterPass: 'fcb1899', role: 'owner' }, future: { x: [1, 2] } };
  const s = new Store(JSON.stringify(original));
  const result = boot(s, seed);
  assert.deepEqual(result.data, original);
  assert.equal(result.data.auth.masterPass, 'fcb1899');
  assert.equal(result.data.future.x[1], 2);
});
