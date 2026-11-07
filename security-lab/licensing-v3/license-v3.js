// DEYN v3 signed-license format prototype.
// Browser/Node WebCrypto only. No private key is embedded or persisted here.
const encoder = new TextEncoder();
const VERSION = 3;
const CODE_PREFIX = "DEYN3-";
const DEVICE_ID_RE = /^[0-9a-f]{32}$/i;
const TIERS = new Set(["1Y", "2Y", "LT"]);
const ROLES = new Set(["M", "W"]);

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const b64 = typeof btoa === "function"
    ? btoa(binary)
    : Buffer.from(bytes).toString("base64");
  return b64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function decodeBase64(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) throw new Error("Invalid base64 key material");
  const b64 = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  if (typeof atob === "function") {
    const binary = atob(b64);
    return Uint8Array.from(binary, c => c.charCodeAt(0));
  }
  return new Uint8Array(Buffer.from(b64, "base64"));
}

function base64UrlToBytes(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error("Invalid base64url data");
  }
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  if (typeof atob === "function") {
    const binary = atob(padded);
    return Uint8Array.from(binary, c => c.charCodeAt(0));
  }
  return new Uint8Array(Buffer.from(padded, "base64"));
}

function decodePrivateKeyInput(value) {
  if (typeof value !== "string") return new Uint8Array(value);
  const pem = value.trim();
  const match = /^-----BEGIN PRIVATE KEY-----([\s\S]+?)-----END PRIVATE KEY-----$/.exec(pem);
  return decodeBase64(match ? match[1] : pem);
}

function canonicalPayload(payload) {
  // Fixed field order is part of the wire format; unknown fields are rejected.
  return JSON.stringify({
    v: payload.v,
    d: payload.d,
    t: payload.t,
    r: payload.r,
    exp: payload.exp,
    n: payload.n
  });
}

function validatePayload(p) {
  if (!p || typeof p !== "object" || Array.isArray(p)) return false;
  const keys = Object.keys(p).sort().join(",");
  if (keys !== "d,exp,n,r,t,v") return false;
  if (p.v !== VERSION || typeof p.d !== "string" || !DEVICE_ID_RE.test(p.d)) return false;
  if (!TIERS.has(p.t) || !ROLES.has(p.r)) return false;
  if (p.t === "LT") {
    if (p.exp !== null) return false;
  } else if (!Number.isSafeInteger(p.exp) || p.exp <= 0) {
    return false;
  }
  return typeof p.n === "string" && /^[A-Za-z0-9_-]{22,86}$/.test(p.n);
}

function getCrypto(cryptoImpl) {
  const c = cryptoImpl || globalThis.crypto;
  if (!c || !c.subtle || typeof c.getRandomValues !== "function") {
    throw new Error("WebCrypto unavailable");
  }
  return c;
}

export function createDeviceId(cryptoImpl) {
  const c = getCrypto(cryptoImpl);
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}

export async function issueLicense({
  privateKeyPkcs8,
  deviceId,
  tier,
  role,
  expiryUtcMs = null,
  cryptoImpl
}) {
  const c = getCrypto(cryptoImpl);
  if (!DEVICE_ID_RE.test(String(deviceId || ""))) throw new Error("Device ID must be 128-bit hex");
  if (!TIERS.has(tier) || !ROLES.has(role)) throw new Error("Unsupported tier or role");
  if (tier === "LT" ? expiryUtcMs !== null : (!Number.isSafeInteger(expiryUtcMs) || expiryUtcMs <= 0)) {
    throw new Error("Expiry must be a fixed UTC timestamp; LT must use null");
  }
  const pkcs8 = decodePrivateKeyInput(privateKeyPkcs8);
  const key = await c.subtle.importKey("pkcs8", pkcs8, { name: "Ed25519" }, false, ["sign"]);
  const nonce = new Uint8Array(16);
  c.getRandomValues(nonce);
  const payload = {
    v: VERSION,
    d: deviceId.toLowerCase(),
    t: tier,
    r: role,
    exp: expiryUtcMs,
    n: bytesToBase64Url(nonce)
  };
  if (!validatePayload(payload)) throw new Error("Invalid license payload");
  const body = encoder.encode(canonicalPayload(payload));
  const signature = new Uint8Array(await c.subtle.sign("Ed25519", key, body));
  return CODE_PREFIX + bytesToBase64Url(body) + "." + bytesToBase64Url(signature);
}

export async function verifyLicense({
  code,
  publicKeyRaw,
  expectedDeviceId,
  trustedNowUtcMs,
  cryptoImpl
}) {
  try {
    const c = getCrypto(cryptoImpl);
    if (typeof code !== "string" || !code.startsWith(CODE_PREFIX)) return null;
    if (!DEVICE_ID_RE.test(String(expectedDeviceId || ""))) return null;
    if (!Number.isSafeInteger(trustedNowUtcMs) || trustedNowUtcMs <= 0) return null;
    const match = /^DEYN3-([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(code);
    if (!match) return null;
    const body = base64UrlToBytes(match[1]);
    const signature = base64UrlToBytes(match[2]);
    const payload = JSON.parse(new TextDecoder().decode(body));
    if (!validatePayload(payload)) return null;
    if (canonicalPayload(payload) !== new TextDecoder().decode(body)) return null;
    if (payload.d !== expectedDeviceId.toLowerCase()) return null;
    if (payload.t !== "LT" && trustedNowUtcMs >= payload.exp) return null;
    const raw = typeof publicKeyRaw === "string" ? decodeBase64(publicKeyRaw) : new Uint8Array(publicKeyRaw);
    const key = await c.subtle.importKey("raw", raw, { name: "Ed25519" }, false, ["verify"]);
    const valid = await c.subtle.verify("Ed25519", key, signature, body);
    if (!valid) return null;
    return Object.freeze({
      version: payload.v,
      deviceId: payload.d,
      tier: payload.t,
      role: payload.r,
      expiryUtcMs: payload.exp,
      nonce: payload.n
    });
  } catch {
    return null;
  }
}

export const LICENSE_V3 = Object.freeze({
  version: VERSION,
  prefix: CODE_PREFIX,
  deviceIdBits: 128,
  tiers: Object.freeze(["1Y", "2Y", "LT"]),
  roles: Object.freeze(["M", "W"])
});
