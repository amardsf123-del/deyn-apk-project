import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalize, sha256Hex, validateBackupText } from '../backup-validator.js';
const cryptoProvider = globalThis.crypto;
const sample = {
  seq: 4, settings: { currency: 'DZD' },
  customers: [{ id: 'c1', name: 'Example', transactions: [{ amount: 1200 }] }],
  pending: [{ id: 'p1', amount: 500 }],
  trash: [{ type: 'bulk', customers: [{ id: 'c2' }], pending: [], seq: 2 }],
  auth: { masterPass: 'fcb1899', role: 'owner' }, futureField: { retained: true }
};
test('canonicalization ignores object key insertion order', () => assert.equal(canonicalize({ b: 2, a: 1 }), canonicalize({ a: 1, b: 2 })));
test('accepts legacy full-state backup and preserves all fields', async () => {
  const r = await validateBackupText(JSON.stringify(sample), cryptoProvider);
  assert.equal(r.ok, true); assert.equal(r.format, 'legacy'); assert.deepEqual(r.data, sample);
  assert.equal(r.preview.customers, 1); assert.equal(r.preview.pendingTickets, 1); assert.equal(r.preview.trashEntries, 1);
  assert.equal(r.preview.containsAuth, true); assert.equal(r.data.auth.masterPass, 'fcb1899');
  assert.deepEqual(r.data.futureField, { retained: true });
});
test('accepts intentional reset state with empty arrays and bulk trash', async () => {
  const r = await validateBackupText(JSON.stringify({ ...sample, customers: [], pending: [] }), cryptoProvider);
  assert.equal(r.ok, true); assert.equal(r.preview.customers, 0); assert.equal(r.preview.pendingTickets, 0);
});
test('accepts valid empty state without trash', async () => {
  const r = await validateBackupText(JSON.stringify({ customers: [], pending: [] }), cryptoProvider);
  assert.equal(r.ok, true); assert.equal(r.preview.trashEntries, null);
});
test('rejects malformed JSON and non-object roots', async () => {
  assert.equal((await validateBackupText('{', cryptoProvider)).reason, 'invalid_json');
  assert.equal((await validateBackupText('[]', cryptoProvider)).reason, 'root_not_object');
});
test('rejects missing or invalid required arrays', async () => {
  assert.equal((await validateBackupText(JSON.stringify({ customers: [] }), cryptoProvider)).reason, 'missing_or_invalid_pending');
  assert.equal((await validateBackupText(JSON.stringify({ customers: {}, pending: [] }), cryptoProvider)).reason, 'missing_or_invalid_customers');
});
test('rejects invalid trash type without mutating source', async () => {
  const bad = { customers: [], pending: [], trash: {} }; const raw = JSON.stringify(bad);
  assert.equal((await validateBackupText(raw, cryptoProvider)).reason, 'invalid_trash'); assert.equal(raw, JSON.stringify(bad));
});
test('accepts versioned envelope with matching SHA-256 digest', async () => {
  const e = { format: 'DEYN_BACKUP', formatVersion: 1, appDataKey: 'deyn.v1', createdAt: '2026-11-07T00:00:00.000Z', data: sample,
    integrity: { algorithm: 'SHA-256', digest: await sha256Hex(sample, cryptoProvider) } };
  const r = await validateBackupText(JSON.stringify(e), cryptoProvider); assert.equal(r.ok, true); assert.equal(r.format, 'versioned-v1'); assert.deepEqual(r.data, sample);
});
test('rejects tampered versioned data', async () => {
  const e = { format: 'DEYN_BACKUP', formatVersion: 1, appDataKey: 'deyn.v1', createdAt: '2026-11-07T00:00:00.000Z', data: sample,
    integrity: { algorithm: 'SHA-256', digest: await sha256Hex(sample, cryptoProvider) } };
  e.data.customers[0].name = 'Changed'; assert.equal((await validateBackupText(JSON.stringify(e), cryptoProvider)).reason, 'digest_mismatch');
});
test('rejects unsupported versions and wrong app key', async () => {
  const e = { format: 'DEYN_BACKUP', formatVersion: 1, appDataKey: 'deyn.v1', createdAt: '2026-11-07T00:00:00.000Z', data: sample,
    integrity: { algorithm: 'SHA-256', digest: '0'.repeat(64) } };
  assert.equal((await validateBackupText(JSON.stringify({ ...e, formatVersion: 2 }), cryptoProvider)).reason, 'unsupported_version');
  assert.equal((await validateBackupText(JSON.stringify({ ...e, appDataKey: 'other' }), cryptoProvider)).reason, 'wrong_app_data_key');
});
test('fails closed when SHA-256 is unavailable', async () => {
  const e = { format: 'DEYN_BACKUP', formatVersion: 1, appDataKey: 'deyn.v1', createdAt: '2026-11-07T00:00:00.000Z', data: sample,
    integrity: { algorithm: 'SHA-256', digest: '0'.repeat(64) } };
  assert.equal((await validateBackupText(JSON.stringify(e), {})).reason, 'digest_unavailable');
});
