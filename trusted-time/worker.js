// DEYN trusted-time signer (Cloudflare Worker). STATELESS: no KV, no database, no user data stored.
// Secret (never in git):  wrangler secret put TIME_SIGNING_KEY   -> PKCS#8 private key, base64 (NOT the licence key)
// Var:                    ALLOWED_ORIGIN (default https://localhost, the Capacitor Android WebView origin)
const PREFIX = 'DEYN-TIME-V1\n';
const enc = new TextEncoder();
const b64u = u8 => { let s = ''; for (const x of u8) s += String.fromCharCode(x); return btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const keyCache = new Map();   // keyed by the secret itself so a rotated secret is picked up immediately
function signingKey(env) {
  const k = env.TIME_SIGNING_KEY;
  if (!keyCache.has(k)) keyCache.set(k, crypto.subtle.importKey('pkcs8', unb64(k), { name: 'Ed25519' }, false, ['sign']));
  return keyCache.get(k);
}
function respond(status, obj, origin) {
  return new Response(obj === null ? null : JSON.stringify(obj), { status, headers: {
    'content-type': 'application/json', 'cache-control': 'no-store',
    'access-control-allow-origin': origin, 'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type', 'vary': 'Origin' } });
}
export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || 'https://localhost';
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return respond(204, null, origin);
    if (url.pathname !== '/v1/time') return respond(404, { error: 'not_found' }, origin);
    if (request.method !== 'POST') return respond(405, { error: 'method' }, origin);
    if (!env.TIME_SIGNING_KEY) return respond(500, { error: 'not_configured' }, origin);
    const len = parseInt(request.headers.get('content-length') || '0', 10);
    if (len > 256) return respond(413, { error: 'too_large' }, origin);
    let req;
    try { req = JSON.parse(await request.text()); } catch (e) { return respond(400, { error: 'json' }, origin); }
    if (!req || typeof req.n !== 'string' || !/^[A-Za-z0-9_-]{22}$/.test(req.n) || typeof req.d !== 'string' || !/^[0-9a-f]{32}$/.test(req.d))
      return respond(400, { error: 'bad_request' }, origin);
    const payload = { v: 1, k: 'time', t: Date.now(), d: req.d, n: req.n };
    const body = enc.encode(JSON.stringify(payload));
    const msg = new Uint8Array(PREFIX.length + body.length); msg.set(enc.encode(PREFIX)); msg.set(body, PREFIX.length);
    const sig = new Uint8Array(await crypto.subtle.sign('Ed25519', await signingKey(env), msg));
    return respond(200, { b: b64u(body), s: b64u(sig) }, origin);
  }
};
