import test from "node:test";
import assert from "node:assert/strict";
import { mapLegacyCustomer, mapLegacyDataset, toCentimes } from "../legacy-migration.js";

const deviceId = "a".repeat(32);
const baseCustomer = {
  id: "cust123",
  name: "Ali",
  phone: "0555123456",
  seg: "salaried",
  ceiling: 1250.75,
  payDay: 28,
  tx: [
    { id: "txdebt1", type: "debt", amount: 12.34, note: "مواد غذائية", ts: 1700000000000 },
    { id: "txpay01", type: "pay", amount: 2.5, note: "", ts: 1700000100000 }
  ]
};

test("DZD decimal amounts convert exactly to integer centimes", () => {
  assert.equal(toCentimes(12.34), 1234);
  assert.equal(toCentimes(2.5), 250);
  assert.equal(toCentimes(0, { allowZero: true }), 0);
  assert.throws(() => toCentimes(0), /positive/);
  assert.throws(() => toCentimes(1.234), /two decimal places/);
});

test("legacy customer maps profile and immutable debt/payment ledger events", () => {
  const result = mapLegacyCustomer({
    customer: baseCustomer, shopId: "shop-1", deviceId, actorUid: "owner-uid",
    nowMs: 1800000000000, confirmedRealData: true
  });
  assert.equal(result.customer.creditCeilingCentimes, 125075);
  assert.equal(result.customer.revision, 1);
  assert.equal(result.ledgerEvents.length, 2);
  assert.equal(result.ledgerEvents[0].kind, "debt");
  assert.equal(result.ledgerEvents[0].amountCentimes, 1234);
  assert.equal(result.ledgerEvents[0].note, "مواد غذائية");
  assert.equal(result.ledgerEvents[1].kind, "payment");
  assert.equal(result.ledgerEvents[1].amountCentimes, 250);
});

test("legacy event IDs are stable across repeated migration and namespaced by device", () => {
  const first = mapLegacyCustomer({
    customer: baseCustomer, shopId: "shop-1", deviceId, actorUid: "owner-uid",
    confirmedRealData: true
  });
  const second = mapLegacyCustomer({
    customer: baseCustomer, shopId: "shop-1", deviceId, actorUid: "owner-uid",
    confirmedRealData: true
  });
  assert.deepEqual(first.ledgerEvents.map(x => x.eventId), second.ledgerEvents.map(x => x.eventId));
  assert.notEqual(first.ledgerEvents[0].eventId,
    mapLegacyCustomer({
      customer: baseCustomer, shopId: "shop-1", deviceId: "b".repeat(32),
      actorUid: "owner-uid", confirmedRealData: true
    }).ledgerEvents[0].eventId);
});

test("migration refuses to run without explicit real-data confirmation", () => {
  assert.throws(() => mapLegacyDataset({
    data: { customers: [baseCustomer] }, shopId: "shop-1", deviceId,
    actorUid: "owner-uid"
  }), /explicit_real_data_confirmation_required/);
});

test("migration excludes pending tickets, trash, passwords, settings and license data", () => {
  const result = mapLegacyDataset({
    data: {
      customers: [baseCustomer],
      pending: [{ id: "ticket", amount: 999 }],
      trash: [{ type: "bulk", data: { customers: [baseCustomer] } }],
      auth: { masterPass: "do-not-upload" },
      settings: { sound: true },
      license: "secret"
    },
    shopId: "shop-1", deviceId, actorUid: "owner-uid",
    confirmedRealData: true
  });
  assert.equal(result.customers.length, 1);
  assert.equal(result.ledgerEvents.length, 2);
  assert.equal("pending" in result, false);
  assert.equal("trash" in result, false);
  assert.equal("auth" in result, false);
  assert.equal("settings" in result, false);
});

test("migration rejects unknown transaction kinds, duplicate IDs and unsafe amounts", () => {
  assert.throws(() => mapLegacyCustomer({
    customer: { ...baseCustomer, tx: [{ id: "x", type: "adjust", amount: 2, ts: 1 }] },
    shopId: "shop-1", deviceId, actorUid: "owner-uid", confirmedRealData: true
  }), /type/);
  assert.throws(() => mapLegacyCustomer({
    customer: { ...baseCustomer, tx: [
      { id: "same", type: "debt", amount: 2, ts: 1 },
      { id: "same", type: "pay", amount: 1, ts: 2 }
    ] },
    shopId: "shop-1", deviceId, actorUid: "owner-uid", confirmedRealData: true
  }), /duplicate_legacy_transaction_id/);
  assert.throws(() => mapLegacyCustomer({
    customer: { ...baseCustomer, tx: [{ id: "x", type: "debt", amount: -2, ts: 1 }] },
    shopId: "shop-1", deviceId, actorUid: "owner-uid", confirmedRealData: true
  }), /positive/);
});

test("migration does not accept a weak or malformed device ID", () => {
  assert.throws(() => mapLegacyCustomer({
    customer: baseCustomer, shopId: "shop-1", deviceId: "1234",
    actorUid: "owner-uid", confirmedRealData: true
  }), /128-bit/);
});
