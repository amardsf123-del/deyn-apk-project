const decodeBase64Url = value => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
};

/**
 * Verify a signed Worker response. The caller must generate a fresh,
 * cryptographically random nonce for every request and pass the exact value.
 * Returns the signed server timestamp only after all checks pass.
 *
 * publicKeyRawBase64 is the 32-byte Ed25519 public key, base64 encoded.
 */
export async function verifyTrustedTimeResponse(
  response,
  expectedNonce,
  publicKeyRawBase64,
  subtle = globalThis.crypto?.subtle
) {
  if (!response || typeof response.payload !== "string" ||
      typeof response.signature !== "string" ||
      typeof expectedNonce !== "string" || !expectedNonce ||
      typeof publicKeyRawBase64 !== "string" || !subtle) {
    throw new Error("INVALID_TIME_RESPONSE");
  }

  let payloadBytes;
  let signature;
  let publicKeyBytes;
  try {
    payloadBytes = decodeBase64Url(response.payload);
    signature = decodeBase64Url(response.signature);
    publicKeyBytes = Uint8Array.from(
      atob(publicKeyRawBase64),
      char => char.charCodeAt(0)
    );
  } catch {
    throw new Error("INVALID_TIME_ENCODING");
  }

  if (publicKeyBytes.length !== 32 || signature.length !== 64) {
    throw new Error("INVALID_TIME_KEY_OR_SIGNATURE_LENGTH");
  }

  let publicKey;
  try {
    publicKey = await subtle.importKey(
      "raw",
      publicKeyBytes,
      { name: "Ed25519" },
      false,
      ["verify"]
    );
  } catch {
    throw new Error("ED25519_UNAVAILABLE_OR_INVALID_KEY");
  }

  const valid = await subtle.verify(
    "Ed25519",
    publicKey,
    signature,
    payloadBytes
  );
  if (!valid) throw new Error("INVALID_TIME_SIGNATURE");

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch {
    throw new Error("INVALID_TIME_PAYLOAD");
  }

  if (payload.v !== 1 || payload.purpose !== "DEYN_TRUSTED_TIME") {
    throw new Error("WRONG_TIME_TOKEN_PURPOSE");
  }
  if (payload.nonce !== expectedNonce) {
    throw new Error("TIME_NONCE_MISMATCH");
  }
  if (!Number.isSafeInteger(payload.issuedAtMs) ||
      !Number.isSafeInteger(payload.expiresAtMs) ||
      payload.expiresAtMs <= payload.issuedAtMs ||
      payload.expiresAtMs - payload.issuedAtMs !== 300000) {
    throw new Error("INVALID_TIME_RANGE");
  }

  return Object.freeze({
    trustedTimeMs: payload.issuedAtMs,
    tokenExpiresAtMs: payload.expiresAtMs,
    nonce: payload.nonce
  });
}
