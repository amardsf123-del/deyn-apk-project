'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { inspectStartupStorage, createRecoverySession } = require('../recovery-flow.prototype');

const valid = value => value && Array.isArray(value.customers) && Array.isArray(value.pending);
const store = raw => ({ getItem: key => key === 'deyn.v1' ? raw : null });

test('truly absent key is the only case that permits new-install flow', () => {
  const result = inspectStartupStorage(store(null), 'deyn.v1', valid);
  assert.equal(result.mode, 'new_install');
  assert.equal(result.reason, 'key_absent');
});

test('valid existing record enters normal mode without rewriting it', () => {
  const raw = JSON.stringify({ customers: [], pending: [], auth: { password: 'fcb1899' }, extra: { keep: true } });
  const result = inspectStartupStorage(store(raw), 'deyn.v1', valid);
  assert.equal(result.mode, 'normal');
  assert.equal(result.raw, raw);
  assert.equal(result.data.extra.keep, true);
});

test('malformed JSON enters recovery and preserves exact raw string', () => {
  const raw = '{ "customers": [broken,  }\\n';
  const result = inspectStartupStorage(store(raw), 'deyn.v1', valid);
  assert.equal(result.mode, 'recovery');
  assert.equal(result.reason, 'malformed_json');
  assert.equal(result.raw, raw);
});

test('valid JSON with invalid schema enters recovery', () => {
  const raw = JSON.stringify({ customers: {}, pending: [] });
  const result = inspectStartupStorage(store(raw), 'deyn.v1', valid);
  assert.equal(result.mode, 'recovery');
  assert.equal(result.reason, 'invalid_schema');
  assert.equal(result.raw, raw);
});

test('storage read exception is blocked, never mistaken for a new install', () => {
  const brokenStorage = { getItem() { throw new Error('denied'); } };
  const result = inspectStartupStorage(brokenStorage, 'deyn.v1', valid);
  assert.equal(result.mode, 'blocked');
  assert.equal(result.reason, 'read_failed');
});

test('recovery session blocks app, seed, writes, and unvalidated import', () => {
  const raw = 'not-json';
  const startup = inspectStartupStorage(store(raw), 'deyn.v1', valid);
  const session = createRecoverySession(startup);
  assert.equal(session.canStartApp, false);
  assert.equal(session.canSeedDemoData, false);
  assert.equal(session.canWriteMainRecord, false);
  assert.equal(session.canImportBackup, false);
});

test('raw export is available only on explicit request and is byte-for-byte unchanged', () => {
  const raw = '{\\n  "damaged": true,  \\n  "tail": "x"\\n}\\n';
  const startup = inspectStartupStorage(store(raw), 'deyn.v1', valid);
  const session = createRecoverySession(startup);
  assert.equal(session.getExportState(), 'not_requested');
  assert.equal(session.requestRawExport(), raw);
  assert.equal(session.getExportState(), 'requested');
});

test('cannot create a recovery session for valid or absent data', () => {
  assert.throws(() => createRecoverySession({ mode: 'normal' }));
  assert.throws(() => createRecoverySession({ mode: 'new_install' }));
});

test('non-string stored value is recovery, not an empty install', () => {
  const result = inspectStartupStorage({ getItem: () => 17 }, 'deyn.v1', valid);
  assert.equal(result.mode, 'recovery');
  assert.equal(result.reason, 'unexpected_value_type');
});
