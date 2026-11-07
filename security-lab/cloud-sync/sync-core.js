// DEYN cloud-sync protocol prototype.
// This module is deliberately isolated from the production app.
// Ledger entries are immutable and idempotent; customer profile edits use revisions.

const ROLES = new Set(["owner", "worker"]);
const ACTIONS = new Set([
  "read", "createCustomer", "addDebt", "addPayment",
  "editCustomer", "deleteCustomer", "editLedgerEntry", "deleteLedgerEntry"
]);

const WORKER_ACTIONS = new Set(["read", "createCustomer", "addDebt", "addPayment"]);

export function authorize(role, action) {
  if (!ROLES.has(role) || !ACTIONS.has(action)) return false;
  if (role === "owner") return true;
  return WORKER_ACTIONS.has(action);
}

export function validateLedgerEvent(event) {
  if (!event || typeof event !== "object") throw new TypeError("event must be an object");
  const requiredStrings = ["eventId", "shopId", "customerId", "deviceId", "actorUid"];
  for (const key of requiredStrings) {
    if (typeof event[key] !== "string" || event[key].trim() === "") {
      throw new TypeError(key + " is required");
    }
  }
  if (!["debt", "payment"].includes(event.kind)) {
    throw new TypeError("kind must be debt or payment");
  }
  if (!Number.isSafeInteger(event.amountDzd) || event.amountDzd <= 0) {
    throw new TypeError("amountDzd must be a positive safe integer");
  }
  if (!Number.isSafeInteger(event.createdAtMs) || event.createdAtMs <= 0) {
    throw new TypeError("createdAtMs must be a positive safe integer");
  }
  return Object.freeze({
    eventId: event.eventId,
    shopId: event.shopId,
    customerId: event.customerId,
    kind: event.kind,
    amountDzd: event.amountDzd,
    createdAtMs: event.createdAtMs,
    deviceId: event.deviceId,
    actorUid: event.actorUid
  });
}

function sameEvent(a, b) {
  return Object.keys(a).every((key) => a[key] === b[key]) &&
    Object.keys(b).every((key) => b[key] === a[key]);
}

// Repeated delivery of the same event is harmless. Reusing an ID for
// different content is a hard conflict, never silently overwritten.
export function mergeLedgerEvents(...eventLists) {
  const byId = new Map();
  for (const list of eventLists) {
    if (!Array.isArray(list)) throw new TypeError("each event list must be an array");
    for (const raw of list) {
      const event = validateLedgerEvent(raw);
      const existing = byId.get(event.eventId);
      if (existing && !sameEvent(existing, event)) {
        throw new Error("ledger event ID collision: " + event.eventId);
      }
      byId.set(event.eventId, event);
    }
  }
  return [...byId.values()].sort((a, b) =>
    a.createdAtMs - b.createdAtMs || a.eventId.localeCompare(b.eventId)
  );
}

export function calculateBalance(events, customerId) {
  const merged = mergeLedgerEvents(events);
  return merged.reduce((balance, event) => {
    if (event.customerId !== customerId) return balance;
    return balance + (event.kind === "debt" ? event.amountDzd : -event.amountDzd);
  }, 0);
}

// Profile changes are owner-only and compare revisions to prevent one phone
// silently overwriting a newer edit made on another phone.
export function updateCustomerProfile(current, patch, role, expectedRevision) {
  if (!authorize(role, "editCustomer")) throw new Error("permission denied");
  if (!current || !Number.isSafeInteger(current.revision) || current.revision < 0) {
    throw new TypeError("current customer revision is invalid");
  }
  if (expectedRevision !== current.revision) {
    throw new Error("customer profile conflict: refresh before editing");
  }
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    throw new TypeError("patch must be an object");
  }
  const forbidden = new Set(["id", "shopId", "revision", "createdAtMs"]);
  for (const key of Object.keys(patch)) {
    if (forbidden.has(key)) throw new TypeError("field cannot be changed: " + key);
  }
  return Object.freeze({ ...current, ...patch, revision: current.revision + 1 });
}

export function summarizeCustomerBalances(events) {
  const merged = mergeLedgerEvents(events);
  const summaries = new Map();
  for (const event of merged) {
    let item = summaries.get(event.customerId);
    if (!item) {
      item = { customerId: event.customerId, debtDzd: 0, paidDzd: 0, balanceDzd: 0, debtCount: 0, paymentCount: 0 };
      summaries.set(event.customerId, item);
    }
    if (event.kind === "debt") {
      item.debtDzd += event.amountDzd;
      item.debtCount += 1;
    } else {
      item.paidDzd += event.amountDzd;
      item.paymentCount += 1;
    }
    item.balanceDzd = item.debtDzd - item.paidDzd;
  }
  return summaries;
}
