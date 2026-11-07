'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { inspectStartupStorage } = require('../recovery-flow.prototype');

const isValidDeynState = value =>
  value && Array.isArray(value.customers) && Array.isArray(value.pending);

function storedObject(value) {
  const raw = JSON.stringify(value);
  return {
    raw,
    storage: { getItem: key => key === 'deyn.v1' ? raw : null }
  };
}

test('fresh install still qualifies for the existing first-run demo seed path', () => {
  const result = inspectStartupStorage({ getItem: () => null }, 'deyn.v1', isValidDeynState);
  assert.equal(result.mode, 'new_install');
});

test('valid demo data remains a normal valid existing record', () => {
  const { raw, storage } = storedObject({
    customers: [{ id: 'demo-1', name: 'مثال زبون', tx: [] }],
    pending: [{ id: 'ticket-1', amount: 1200 }],
    seq: 2,
    trash: []
  });
  const result = inspectStartupStorage(storage, 'deyn.v1', isValidDeynState);
  assert.equal(result.mode, 'normal');
  assert.equal(result.raw, raw);
  assert.equal(result.data.customers[0].name, 'مثال زبون');
});

test('intentional Settings reset with empty arrays is valid, not recovery or new install', () => {
  const { raw, storage } = storedObject({
    customers: [],
    pending: [],
    seq: 1,
    trash: [{ type: 'bulk', data: { customers: [{ id: 'old-1' }], pending: [], seq: 2 } }],
    auth: { password: 'fcb1899' },
    settings: { sound: true }
  });
  const result = inspectStartupStorage(storage, 'deyn.v1', isValidDeynState);
  assert.equal(result.mode, 'normal');
  assert.equal(result.reason, 'valid_existing_data');
  assert.deepEqual(result.data.customers, []);
  assert.deepEqual(result.data.pending, []);
  assert.equal(result.data.trash[0].type, 'bulk');
  assert.equal(result.data.auth.password, 'fcb1899');
  assert.equal(result.raw, raw);
});

test('empty arrays with no trash are still valid business state', () => {
  const { storage } = storedObject({ customers: [], pending: [], seq: 1 });
  const result = inspectStartupStorage(storage, 'deyn.v1', isValidDeynState);
  assert.equal(result.mode, 'normal');
});

test('damaged existing data still enters recovery rather than reseeding', () => {
  const raw = '{"customers": [broken';
  const result = inspectStartupStorage({ getItem: () => raw }, 'deyn.v1', isValidDeynState);
  assert.equal(result.mode, 'recovery');
  assert.equal(result.raw, raw);
});
