import test from "node:test";
import assert from "node:assert/strict";
import {
  authorize, validateLedgerEvent, mergeLedgerEvents,
  calculateBalance, updateCustomerProfile
} from "../sync-core.js";

const debt = {
  eventId: "evt-debt-1", shopId: "shop-1", customerId: "cust-1",
  kind: "debt", amountDzd: 1200, createdAtMs: 1000,
  deviceId: "device-owner", actorUid: "uid-owner"
};
const payment = {
  eventId: "evt-pay-1", shopId: "shop-1", customerId: "cust-1",
  kind: "payment", amountDzd: 300, createdAtMs: 2000,
  deviceId: "device-worker", actorUid: "uid-worker"
};

test("worker can read, add customers, debts and payments", () => {
  for (const action of ["read", "createCustomer", "addDebt", "addPayment"]) {
    assert.equal(authorize("worker", action), true);
  }
});

test("worker cannot edit/delete customers or ledger entries", () => {
  for (const action of ["editCustomer", "deleteCustomer", "editLedgerEntry", "deleteLedgerEntry"]) {
    assert.equal(authorize("worker", action), false);
  }
});

test("owner can perform all supported actions", () => {
  for (const action of [
    "read", "createCustomer", "addDebt", "addPayment",
    "editCustomer", "deleteCustomer", "editLedgerEntry", "deleteLedgerEntry"
  ]) assert.equal(authorize("owner", action), true);
});

test("unknown role and unknown action are denied", () => {
  assert.equal(authorize("admin", "read"), false);
  assert.equal(authorize("worker", "grantOwner"), false);
});

test("ledger event validates and normalizes only supported fields", () => {
  const event = validateLedgerEvent({ ...debt, ignored: "not persisted" });
  assert.equal(event.eventId, debt.eventId);
  assert.equal("ignored" in event, false);
  assert.throws(() => validateLedgerEvent({ ...debt, amountDzd: 0 }), /positive/);
  assert.throws(() => validateLedgerEvent({ ...debt, kind: "delete" }), /kind/);
});

test("sync merge is idempotent and deterministic across devices", () => {
  const first = mergeLedgerEvents([debt], [payment, debt]);
  const second = mergeLedgerEvents([payment], [debt]);
  assert.deepEqual(first, second);
  assert.equal(first.length, 2);
});

test("reusing an event ID with different content is rejected", () => {
  assert.throws(
    () => mergeLedgerEvents([debt], [{ ...debt, amountDzd: 9999 }]),
    /collision/
  );
});

test("customer balance is calculated from unique immutable events", () => {
  assert.equal(calculateBalance([debt, payment, debt], "cust-1"), 900);
  assert.equal(calculateBalance([debt, payment], "other-customer"), 0);
});

test("only owner can update customer profile", () => {
  const current = { id: "cust-1", shopId: "shop-1", name: "Ali", revision: 2, createdAtMs: 10 };
  assert.throws(() => updateCustomerProfile(current, { name: "Ahmed" }, "worker", 2), /permission/);
  const updated = updateCustomerProfile(current, { name: "Ahmed" }, "owner", 2);
  assert.equal(updated.name, "Ahmed");
  assert.equal(updated.revision, 3);
});

test("stale customer profile update is rejected rather than overwriting newer data", () => {
  const current = { id: "cust-1", shopId: "shop-1", name: "Ali", revision: 3, createdAtMs: 10 };
  assert.throws(() => updateCustomerProfile(current, { name: "Ahmed" }, "owner", 2), /conflict/);
});

test("identity and revision fields cannot be changed through a profile patch", () => {
  const current = { id: "cust-1", shopId: "shop-1", name: "Ali", revision: 1, createdAtMs: 10 };
  assert.throws(() => updateCustomerProfile(current, { shopId: "shop-2" }, "owner", 1), /cannot be changed/);
});
