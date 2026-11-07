import test from "node:test";
import assert from "node:assert/strict";
import { verifyLicenseByVersion } from "../license-version-router.js";

test("routes DEYN2 only to the legacy verifier", async () => {
  let v2 = 0, v3 = 0;
  const result = await verifyLicenseByVersion({
    code: " DEYN2-legacy ",
    verifyV2: async code => { v2++; return code; },
    verifyV3: async () => { v3++; return "wrong"; }
  });
  assert.equal(result, "DEYN2-legacy");
  assert.equal(v2, 1);
  assert.equal(v3, 0);
});

test("routes DEYN3 only to the v3 verifier", async () => {
  let v2 = 0, v3 = 0;
  const result = await verifyLicenseByVersion({
    code: "DEYN3-payload.signature",
    verifyV2: async () => { v2++; return "wrong"; },
    verifyV3: async code => { v3++; return code; }
  });
  assert.equal(result, "DEYN3-payload.signature");
  assert.equal(v2, 0);
  assert.equal(v3, 1);
});

test("a rejected DEYN3 code never falls back to DEYN2", async () => {
  let legacyCalled = false;
  const result = await verifyLicenseByVersion({
    code: "DEYN3-invalid",
    verifyV2: async () => { legacyCalled = true; return { accepted: true }; },
    verifyV3: async () => null
  });
  assert.equal(result, null);
  assert.equal(legacyCalled, false);
});

test("unknown prefixes and missing verifier callbacks fail closed", async () => {
  assert.equal(await verifyLicenseByVersion({ code: "DEYN4-unknown" }), null);
  assert.equal(await verifyLicenseByVersion({ code: "DEYN2-code" }), null);
  assert.equal(await verifyLicenseByVersion({ code: null }), null);
});
