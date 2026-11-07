import test from "node:test";
import assert from "node:assert/strict";
import {
  enqueueOutbox, getRetryBatch, markAttempt, acknowledgeOutbox
} from "../sync-outbox.js";

const event = (id, time = 1000) => ({
  eventId: id, shopId: "shop-1", customerId: "cust-1",
  kind: "debt", amountDzd: 500, createdAtMs: time,
  deviceId: "device-1", actorUid: "uid-1"
});

test("outbox queues offline events in deterministic order", () => {
  let queue = [];
  queue = enqueueOutbox(queue, event("b", 2000));
  queue = enqueueOutbox(queue, event("a", 1000));
  assert.deepEqual(queue.map((item) => item.event.eventId), ["a", "b"]);
});

test("re-enqueue of identical event is idempotent", () => {
  let queue = enqueueOutbox([], event("a"));
  const same = enqueueOutbox(queue, event("a"));
  assert.equal(same.length, 1);
});

test("event ID collision with different payload is rejected", () => {
  const queue = enqueueOutbox([], event("a"));
  assert.throws(() => enqueueOutbox(queue, { ...event("a"), amountDzd: 999 }), /collision/);
});

test("retry batch only returns pending entries and respects batch size", () => {
  let queue = [];
  for (let i = 0; i < 4; i++) queue = enqueueOutbox(queue, event("e" + i, 1000 + i));
  assert.equal(getRetryBatch(queue, 2).length, 2);
  assert.throws(() => getRetryBatch(queue, 501), /between/);
});

test("failed attempts increment without deleting queued events", () => {
  let queue = enqueueOutbox([], event("a"));
  queue = markAttempt(queue, ["a"], "network unavailable");
  assert.equal(queue[0].attempts, 1);
  assert.equal(queue[0].lastError, "network unavailable");
  assert.equal(queue.length, 1);
});

test("only backend-acknowledged event IDs are removed", () => {
  let queue = enqueueOutbox([], event("a"));
  queue = enqueueOutbox(queue, event("b", 2000));
  const remaining = acknowledgeOutbox(queue, ["a"]);
  assert.deepEqual(remaining.map((item) => item.event.eventId), ["b"]);
});
