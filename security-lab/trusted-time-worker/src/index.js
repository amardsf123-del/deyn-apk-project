const encoder = new TextEncoder();

function toBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store, no-cache, must-revalidate",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type"
    }
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers": "content-type",
          "access-control-max-age": "86400"
        }
      });
    }

    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const nonce = body && typeof body.nonce === "string" ? body.nonce : "";
    if (!/^[A-Za-z0-9_-]{20,128}$/.test(nonce)) {
      return json({ error: "invalid_nonce" }, 400);
    }

    const privateKeyB64 = env.TIME_SIGNING_PRIVATE_KEY_PKCS8_B64;
    if (!privateKeyB64) return json({ error: "service_not_configured" }, 503);

    try {
      const privateKey = await crypto.subtle.importKey(
        "pkcs8",
        fromBase64(privateKeyB64),
        { name: "Ed25519" },
        false,
        ["sign"]
      );

      const issuedAtMs = Date.now();
      const payload = {
        v: 1,
        purpose: "DEYN_TRUSTED_TIME",
        issuedAtMs,
        expiresAtMs: issuedAtMs + 5 * 60 * 1000,
        nonce
      };
      const payloadBytes = encoder.encode(JSON.stringify(payload));
      const signature = new Uint8Array(
        await crypto.subtle.sign("Ed25519", privateKey, payloadBytes)
      );

      return json({
        payload: toBase64Url(payloadBytes),
        signature: toBase64Url(signature)
      });
    } catch {
      return json({ error: "signing_failed" }, 503);
    }
  }
};
