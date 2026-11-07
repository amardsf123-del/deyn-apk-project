import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import worker from "../src/index.js";

const decodeBase64Url = value => Buffer.from(
  value.replace(/-/g, "+").replace(/_/g, "/"),
  "base64"
);

test("returns a verifiable signed time payload bound to the request nonce", async () => {
  const keys = await webcrypto.subtle.generateKey(
    { name: "Ed25519" },
    true,
    ["sign", "verify"]
  );
  const privateDer = new Uint8Array(
    await webcrypto.subtle.exportKey("pkcs8", keys.privateKey)
  );
  const privateKeySecret = Buffer.from(privateDer).toString("base64");
  const nonce = "test_nonce_0123456789_abcdef";
  const request = new Request("https://worker.test/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nonce })
  });

  const response = await worker.fetch(request, {
    TIME_SIGNING_PRIVATE_KEY_PKCS8_B64: privateKeySecret
  });
  assert.equal(response.status, 200);

  const result = await response.json();
  const payloadBytes = decodeBase64Url(result.payload);
  const signature = decodeBase64Url(result.signature);
  assert.equal(
    await webcrypto.subtle.verify("Ed25519", keys.publicKey, signature, payloadBytes),
    true
  );

  const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
  assert.equal(payload.purpose, "DEYN_TRUSTED_TIME");
  assert.equal(payload.nonce, nonce);
  assert.equal(payload.expiresAtMs - payload.issuedAtMs, 300000);
});

test("rejects a malformed nonce", async () => {
  const request = new Request("https://worker.test/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nonce: "short" })
  });
  const response = await worker.fetch(request, {});
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: "invalid_nonce" });
});

test("does not issue a token when the signing secret is missing", async () => {
  const request = new Request("https://worker.test/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ nonce: "valid_nonce_0123456789_abcdef" })
  });
  const response = await worker.fetch(request, {});
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "service_not_configured" });
});
