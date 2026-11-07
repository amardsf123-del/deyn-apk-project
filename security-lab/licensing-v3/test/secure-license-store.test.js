import test from "node:test";
import assert from "node:assert/strict";
import { createSecureLicenseStore } from "../secure-license-store.js";

function mockPlugin(overrides = {}) {
  const values = new Map();
  return {
    values,
    async getPlatform() { return "android"; },
    async get({ key }) { return { value: values.has(key) ? values.get(key) : null }; },
    async set({ key, value }) { values.set(key, value); return true; },
    ...overrides
  };
}

test("writes v3 secrets only to namespaced native storage and verifies readback", async () => {
  const plugin = mockPlugin();
  const store = createSecureLicenseStore(plugin);
  assert.equal(await store.set("device_id", "a".repeat(32)), true);
  assert.equal(await store.get("device_id"), "a".repeat(32));
  assert.equal(plugin.values.has("deyn_v3_device_id"), true);
});

test("fails closed when the plugin is missing or not Android", async () => {
  assert.throws(() => createSecureLicenseStore(null), /unavailable/);
  const store = createSecureLicenseStore(mockPlugin({ async getPlatform() { return "web"; } }));
  await assert.rejects(store.get("device_id"), /Android/);
});

test("does not accept a failed write or an unverifiable readback", async () => {
  const failedWrite = createSecureLicenseStore(mockPlugin({ async set() { return false; } }));
  await assert.rejects(failedWrite.set("lic", "value"), /did not confirm/);
  const wrongReadback = createSecureLicenseStore(mockPlugin({
    async set() { return true; },
    async get() { return { value: "different" }; }
  }));
  await assert.rejects(wrongReadback.set("lic", "expected"), /read-after-write/);
});

test("rejects invalid keys and non-string native values", async () => {
  const store = createSecureLicenseStore(mockPlugin());
  await assert.rejects(store.get("../lic"), /Invalid secure storage key/);
  const malformed = createSecureLicenseStore(mockPlugin({ async get() { return { value: 123 }; } }));
  await assert.rejects(malformed.get("lic"), /non-string/);
});

test("never falls back to browser localStorage", async () => {
  let localStorageTouched = false;
  const original = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { localStorageTouched = true; throw new Error("must not access"); } });
  try {
    const store = createSecureLicenseStore(mockPlugin({ async getPlatform() { throw new Error("native storage failed"); } }));
    await assert.rejects(store.get("lic"), /native storage failed/);
    assert.equal(localStorageTouched, false);
  } finally {
    if (original === undefined) delete globalThis.localStorage;
    else Object.defineProperty(globalThis, "localStorage", { configurable: true, value: original });
  }
});
