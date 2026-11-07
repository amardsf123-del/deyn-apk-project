import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { verifyTrustedTimeResponse } from "../client/verify-trusted-time.js";

const base64url = bytes => Buffer.from(bytes).toString("base64url");

test("accepts a valid signed time response", async () => {
  const keys = await webcrypto.subtle.generateKey(
    { name: "Ed25519" },
    true,
    ["sign", "verify"]
  );
  const publicRaw = new Uint8Array(await webcrypto.subtle.exportKey("raw", keys.publicKey));
  const publicKeyBase64 = Buffer.from(publicRaw).toString("base64");
  const nonce = "client_nonce_0123456789_abcdef";
  const payload = {
    v: 1,
    purpose: "DEYN_TRUSTED_TIME",
    issuedAtMs: 1800000000000,
    expiresAtMs: 1800000300000,
    nonce
  };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const signature = await webcrypto.subtle.sign("Ed25519", keys.privateKey, bytes);
  const result = await verifyTrustedTimeResponse({
    payload: base64url(bytes),
    signature: base64url(signature)
  }, nonce, publicKeyBase64, webcrypto.subtle);
  assert.equal(result.trustedTimeMs, payload.issuedAtMs);
  assert.equal(result.nonce, nonce);
});

test("rejects a response signed for a different nonce", async () => {
  const keys = await webcrypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const publicRaw = new Uint8Array(await webcrypto.subtle.exportKey("raw", keys.publicKey));
  const payload = {
    v: 1, purpose: "DEYN_TRUSTED_TIME",
    issuedAtMs: 1800000000000, expiresAtMs: 1800000300000,
    nonce: "original_nonce_0123456789"
  };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const signature = await webcrypto.subtle.sign("Ed25519", keys.privateKey, bytes);
  await assert.rejects(
    verifyTrustedTimeResponse({
      payload: base64url(bytes),
      signature: base64url(signature)
    }, "different_nonce_0123456789", Buffer.from(publicRaw).toString("base64"), webcrypto.subtle),
    { message: "TIME_NONCE_MISMATCH" }
  );
});

test("rejects a modified signature", async () => {
  const keys = await webcrypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const publicRaw = new Uint8Array(await webcrypto.subtle.exportKey("raw", keys.publicKey));
  const nonce = "valid_nonce_0123456789_abcdef";
  const payload = {
    v: 1, purpose: "DEYN_TRUSTED_TIME",
    issuedAtMs: 1800000000000, expiresAtMs: 1800000300000, nonce
  };
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const signature = new Uint8Array(await webcrypto.subtle.sign("Ed25519", keys.privateKey, bytes));
  signature[0] ^= 1;
  await assert.rejects(
    verifyTrustedTimeResponse({
      payload: base64url(bytes),
      signature: base64url(signature)
    }, nonce, Buffer.from(publicRaw).toString("base64"), webcrypto.subtle),
    { message: "INVALID_TIME_SIGNATURE" }
  );
});
