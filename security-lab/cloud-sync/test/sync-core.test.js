import test from "node:test";
import assert from "node:assert/strict";
import {
  authorize, validateLedgerEvent, mergeLedgerEvents,
  calculateBalance, updateCustomerProfile, summarizeCustomerBalances
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

test("analytics summarize 500 customers and more without losing totals", () => {
  const events = [];
  for (let i = 0; i < 600; i++) {
    events.push({
      eventId: "debt-" + i, shopId: "shop-1", customerId: "customer-" + i,
      kind: "debt", amountDzd: 1000 + i, createdAtMs: 1000 + i,
      deviceId: "device-owner", actorUid: "uid-owner"
    });
    events.push({
      eventId: "payment-" + i, shopId: "shop-1", customerId: "customer-" + i,
      kind: "payment", amountDzd: 250, createdAtMs: 2000 + i,
      deviceId: "device-worker", actorUid: "uid-worker"
    });
  }
  const summaries = summarizeCustomerBalances(events);
  assert.equal(summaries.size, 600);
  assert.equal(summaries.get("customer-0").balanceDzd, 750);
  assert.equal(summaries.get("customer-599").balanceDzd, 1349);
  const totals = [...summaries.values()].reduce((acc, item) => {
    acc.debt += item.debtDzd;
    acc.paid += item.paidDzd;
    acc.balance += item.balanceDzd;
    return acc;
  }, { debt: 0, paid: 0, balance: 0 });
  assert.equal(totals.balance, totals.debt - totals.paid);
});

test("analytics do not count duplicate synced events twice", () => {
  const summaries = summarizeCustomerBalances([debt, payment, debt, payment]);
  assert.equal(summaries.get("cust-1").debtDzd, 1200);
  assert.equal(summaries.get("cust-1").paidDzd, 300);
  assert.equal(summaries.get("cust-1").balanceDzd, 900);
});
