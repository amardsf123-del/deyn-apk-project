// Pure outbox helpers. A native durable storage adapter must persist this state.
// This module intentionally does not use localStorage or pretend memory is durable.

import { validateLedgerEvent } from "./sync-core.js";

export function enqueueOutbox(queue, rawEvent) {
  if (!Array.isArray(queue)) throw new TypeError("queue must be an array");
  const event = validateLedgerEvent(rawEvent);
  const existing = queue.find((item) => item.event.eventId === event.eventId);
  if (existing) {
    const same = Object.keys(event).every((key) => existing.event[key] === event[key]) &&
      Object.keys(existing.event).every((key) => event[key] === existing.event[key]);
    if (!same) throw new Error("outbox event ID collision");
    return queue;
  }
  return [...queue, { event, attempts: 0, state: "pending", lastError: null }]
    .sort((a, b) => a.event.createdAtMs - b.event.createdAtMs ||
      a.event.eventId.localeCompare(b.event.eventId));
}

export function getRetryBatch(queue, limit = 50) {
  if (!Array.isArray(queue)) throw new TypeError("queue must be an array");
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) {
    throw new RangeError("limit must be between 1 and 500");
  }
  return queue.filter((item) => item.state === "pending").slice(0, limit);
}

export function markAttempt(queue, eventIds, errorMessage = null) {
  const ids = new Set(eventIds);
  return queue.map((item) => ids.has(item.event.eventId)
    ? { ...item, attempts: item.attempts + 1, lastError: errorMessage }
    : item);
}

export function acknowledgeOutbox(queue, acceptedEventIds) {
  const accepted = new Set(acceptedEventIds);
  return queue.filter((item) => !accepted.has(item.event.eventId));
}
