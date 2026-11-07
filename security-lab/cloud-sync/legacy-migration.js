// Pure migration adapter for the existing DEYN localStorage data model.
// It deliberately maps active customers and their tx[] only. Pending tickets,
// trash snapshots, passwords, license records and settings are never returned.

const DEVICE_RE = /^[a-f0-9]{32}$/;

export function toCentimes(amount, { allowZero = false } = {}) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new TypeError("amount must be a finite number");
  }
  if (amount < 0 || (!allowZero && amount === 0)) {
    throw new RangeError("amount must be positive");
  }
  const centimes = Math.round(amount * 100);
  if (!Number.isSafeInteger(centimes) || (!allowZero && centimes <= 0)) {
    throw new RangeError("amount is outside the supported centime range");
  }
  if (Math.abs(amount * 100 - centimes) > 1e-7) {
    throw new RangeError("amount has more than two decimal places");
  }
  return centimes;
}

function requiredText(value, name) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(name + " is required");
  }
  return value.trim();
}

function safeLegacyId(value, name) {
  const id = requiredText(value, name);
  if (id.length > 180 || id.includes("/")) throw new TypeError(name + " is invalid");
  return id;
}

export function mapLegacyCustomer({
  customer, shopId, deviceId, actorUid, nowMs = Date.now(),
  confirmedRealData = false
}) {
  if (confirmedRealData !== true) {
    throw new Error("explicit_real_data_confirmation_required");
  }
  if (!customer || typeof customer !== "object") throw new TypeError("customer is required");
  if (!DEVICE_RE.test(deviceId || "")) throw new TypeError("deviceId must be 128-bit lowercase hex");
  const id = safeLegacyId(customer.id, "customer.id");
  const name = requiredText(customer.name, "customer.name");
  requiredText(shopId, "shopId");
  requiredText(actorUid, "actorUid");
  if (!Array.isArray(customer.tx)) throw new TypeError("customer.tx must be an array");
  if (!Number.isSafeInteger(nowMs) || nowMs <= 0) throw new TypeError("nowMs is invalid");

  const ceiling = customer.ceiling === undefined || customer.ceiling === null
    ? 0 : customer.ceiling;
  const creditCeilingCentimes = toCentimes(ceiling, { allowZero: true });
  const payDay = customer.payDay === undefined ? null : customer.payDay;
  if (payDay !== null && (!Number.isInteger(payDay) || payDay < 1 || payDay > 31)) {
    throw new TypeError("customer.payDay is invalid");
  }

  const profile = Object.freeze({
    id,
    shopId,
    name,
    phone: typeof customer.phone === "string" ? customer.phone : "",
    segment: typeof customer.seg === "string" ? customer.seg : "daily",
    creditCeilingCentimes,
    payDay,
    revision: 1,
    archivedAt: null,
    createdAtMs: nowMs
  });

  const seen = new Set();
  const ledgerEvents = customer.tx.map((tx) => {
    if (!tx || typeof tx !== "object") throw new TypeError("transaction is invalid");
    const txId = safeLegacyId(tx.id, "transaction.id");
    if (seen.has(txId)) throw new Error("duplicate_legacy_transaction_id");
    seen.add(txId);
    const kind = tx.type === "debt" ? "debt" : tx.type === "pay" ? "payment" : null;
    if (!kind) throw new TypeError("transaction type must be debt or pay");
    if (!Number.isSafeInteger(tx.ts) || tx.ts <= 0) throw new TypeError("transaction timestamp is invalid");
    const eventId = "legacy_" + deviceId + "_" + encodeURIComponent(id) + "_" + encodeURIComponent(txId);
    return Object.freeze({
      eventId,
      shopId,
      customerId: id,
      kind,
      amountCentimes: toCentimes(tx.amount),
      note: typeof tx.note === "string" ? tx.note.slice(0, 1000) : "",
      createdAtMs: tx.ts,
      deviceId,
      actorUid
    });
  });

  return Object.freeze({ customer: profile, ledgerEvents: Object.freeze(ledgerEvents) });
}

export function mapLegacyDataset({
  data, shopId, deviceId, actorUid, nowMs = Date.now(),
  confirmedRealData = false
}) {
  if (confirmedRealData !== true) throw new Error("explicit_real_data_confirmation_required");
  if (!data || typeof data !== "object" || !Array.isArray(data.customers)) {
    throw new TypeError("legacy data must contain customers");
  }
  const customerIds = new Set();
  const customers = [];
  const ledgerEvents = [];
  for (const customer of data.customers) {
    const mapped = mapLegacyCustomer({
      customer, shopId, deviceId, actorUid, nowMs, confirmedRealData: true
    });
    if (customerIds.has(mapped.customer.id)) throw new Error("duplicate_customer_id");
    customerIds.add(mapped.customer.id);
    customers.push(mapped.customer);
    ledgerEvents.push(...mapped.ledgerEvents);
  }
  // Intentionally do not copy data.pending, data.trash, data.auth,
  // data.settings, licensing values, or any other local-only fields.
  return Object.freeze({
    customers: Object.freeze(customers),
    ledgerEvents: Object.freeze(ledgerEvents)
  });
}
