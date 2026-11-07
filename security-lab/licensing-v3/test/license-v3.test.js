import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import {
  createDeviceId,
  issueLicense,
  verifyLicense
} from "../license-v3.js";

const pairPromise = webcrypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
const exportedPromise = pairPromise.then(async pair => ({
  pair,
  privateKeyPkcs8: new Uint8Array(await webcrypto.subtle.exportKey("pkcs8", pair.privateKey)),
  publicKeyRaw: new Uint8Array(await webcrypto.subtle.exportKey("raw", pair.publicKey))
}));
const now = Date.UTC(2026, 10, 7, 12, 0, 0);
const expiry = Date.UTC(2027, 10, 7, 0, 0, 0);

test("creates a 128-bit random device identifier", () => {
  const id = createDeviceId(webcrypto);
  assert.match(id, /^[0-9a-f]{32}$/);
  assert.notEqual(id, createDeviceId(webcrypto));
});

test("issues and verifies a fixed-expiry owner license", async () => {
  const { privateKeyPkcs8, publicKeyRaw } = await exportedPromise;
  const deviceId = "a1".repeat(16);
  const code = await issueLicense({
    privateKeyPkcs8, deviceId, tier: "1Y", role: "M",
    expiryUtcMs: expiry, cryptoImpl: webcrypto
  });
  const result = await verifyLicense({
    code, publicKeyRaw, expectedDeviceId: deviceId,
    trustedNowUtcMs: now, cryptoImpl: webcrypto
  });
  assert.equal(result.tier, "1Y");
  assert.equal(result.role, "M");
  assert.equal(result.expiryUtcMs, expiry);
});

test("rejects the same signed code on another device", async () => {
  const { privateKeyPkcs8, publicKeyRaw } = await exportedPromise;
  const code = await issueLicense({
    privateKeyPkcs8, deviceId: "a1".repeat(16), tier: "2Y",
    role: "W", expiryUtcMs: expiry, cryptoImpl: webcrypto
  });
  assert.equal(await verifyLicense({
    code, publicKeyRaw, expectedDeviceId: "b2".repeat(16),
    trustedNowUtcMs: now, cryptoImpl: webcrypto
  }), null);
});

test("rejects a license at and after its exact expiry instant", async () => {
  const { privateKeyPkcs8, publicKeyRaw } = await exportedPromise;
  const code = await issueLicense({
    privateKeyPkcs8, deviceId: "c3".repeat(16), tier: "1Y",
    role: "M", expiryUtcMs: expiry, cryptoImpl: webcrypto
  });
  assert.equal(await verifyLicense({
    code, publicKeyRaw, expectedDeviceId: "c3".repeat(16),
    trustedNowUtcMs: expiry, cryptoImpl: webcrypto
  }), null);
});

test("lifetime license has no expiry and verifies", async () => {
  const { privateKeyPkcs8, publicKeyRaw } = await exportedPromise;
  const code = await issueLicense({
    privateKeyPkcs8, deviceId: "d4".repeat(16), tier: "LT",
    role: "M", expiryUtcMs: null, cryptoImpl: webcrypto
  });
  const result = await verifyLicense({
    code, publicKeyRaw, expectedDeviceId: "d4".repeat(16),
    trustedNowUtcMs: now + 50 * 365 * 86400000, cryptoImpl: webcrypto
  });
  assert.equal(result.tier, "LT");
  assert.equal(result.expiryUtcMs, null);
});

test("rejects altered signature and wrong public key", async () => {
  const { privateKeyPkcs8, publicKeyRaw } = await exportedPromise;
  const other = await webcrypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const otherRaw = new Uint8Array(await webcrypto.subtle.exportKey("raw", other.publicKey));
  const code = await issueLicense({
    privateKeyPkcs8, deviceId: "e5".repeat(16), tier: "1Y",
    role: "M", expiryUtcMs: expiry, cryptoImpl: webcrypto
  });
  const [body, sig] = code.slice(6).split(".");
  const altered = sig.slice(0, -1) + (sig.endsWith("A") ? "B" : "A");
  assert.equal(await verifyLicense({
    code: "DEYN3-" + body + "." + altered, publicKeyRaw,
    expectedDeviceId: "e5".repeat(16), trustedNowUtcMs: now, cryptoImpl: webcrypto
  }), null);
  assert.equal(await verifyLicense({
    code, publicKeyRaw: otherRaw, expectedDeviceId: "e5".repeat(16),
    trustedNowUtcMs: now, cryptoImpl: webcrypto
  }), null);
});

test("refuses missing trusted time, malformed IDs, and invalid issuance fields", async () => {
  const { privateKeyPkcs8, publicKeyRaw } = await exportedPromise;
  await assert.rejects(issueLicense({
    privateKeyPkcs8, deviceId: "12345678", tier: "1Y", role: "M",
    expiryUtcMs: expiry, cryptoImpl: webcrypto
  }));
  await assert.rejects(issueLicense({
    privateKeyPkcs8, deviceId: "f6".repeat(16), tier: "1Y", role: "M",
    expiryUtcMs: null, cryptoImpl: webcrypto
  }));
  const code = await issueLicense({
    privateKeyPkcs8, deviceId: "f6".repeat(16), tier: "1Y", role: "M",
    expiryUtcMs: expiry, cryptoImpl: webcrypto
  });
  assert.equal(await verifyLicense({
    code, publicKeyRaw, expectedDeviceId: "f6".repeat(16),
    trustedNowUtcMs: null, cryptoImpl: webcrypto
  }), null);
});

test("rejects legacy DEYN2 codes and non-canonical or extended payloads", async () => {
  const { privateKeyPkcs8, publicKeyRaw } = await exportedPromise;
  const code = await issueLicense({
    privateKeyPkcs8, deviceId: "12".repeat(16), tier: "1Y", role: "M",
    expiryUtcMs: expiry, cryptoImpl: webcrypto
  });
  assert.equal(await verifyLicense({
    code: "DEYN2-" + code.slice(6), publicKeyRaw,
    expectedDeviceId: "12".repeat(16), trustedNowUtcMs: now, cryptoImpl: webcrypto
  }), null);
});

test("accepts PKCS8 PEM private key and standard base64 public key inputs", async () => {
  const { pair } = await exportedPromise;
  const privateDer = new Uint8Array(await webcrypto.subtle.exportKey("pkcs8", pair.privateKey));
  const publicRaw = new Uint8Array(await webcrypto.subtle.exportKey("raw", pair.publicKey));
  const toB64 = bytes => Buffer.from(bytes).toString("base64");
  const pem = "-----BEGIN PRIVATE KEY-----\\n" +
    toB64(privateDer).match(/.{1,64}/g).join("\n") +
    "\\n-----END PRIVATE KEY-----";
  const code = await issueLicense({
    privateKeyPkcs8: pem, deviceId: "ab".repeat(16), tier: "1Y",
    role: "M", expiryUtcMs: expiry, cryptoImpl: webcrypto
  });
  const verified = await verifyLicense({
    code, publicKeyRaw: toB64(publicRaw), expectedDeviceId: "ab".repeat(16),
    trustedNowUtcMs: now, cryptoImpl: webcrypto
  });
  assert.equal(verified.deviceId, "ab".repeat(16));
});
