import test from "node:test";
import assert from "node:assert/strict";
import { normalizeDeviceId, isDeviceIdValid, expiryDateToUtcMs } from "../ui.js";

test("normalizes separators and case in a 128-bit device ID", () => {
  assert.equal(normalizeDeviceId("AABB-CCDD EEFF00112233445566778899"), "aabbccddeeff00112233445566778899");
});
test("accepts only exactly 32 hexadecimal characters", () => {
  assert.equal(isDeviceIdValid("aabbccddeeff00112233445566778899"), true);
  assert.equal(isDeviceIdValid("1234-abcd"), false);
  assert.equal(isDeviceIdValid("z".repeat(32)), false);
});
test("selected expiry date remains valid through that UTC day", () => {
  assert.equal(expiryDateToUtcMs("2099-12-31"), Date.UTC(2100, 0, 1));
});
test("rejects malformed, impossible, and past expiry dates", () => {
  assert.throws(() => expiryDateToUtcMs("2099-02-29"), /غير صحيح/);
  assert.throws(() => expiryDateToUtcMs("31-12-2099"), /اختر تاريخ/);
  assert.throws(() => expiryDateToUtcMs("2000-01-01"), /المستقبل/);
});
