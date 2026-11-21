// Verification of a signed time response (to be embedded in the app). Pure functions, no network.
// The app ships ONLY the time PUBLIC key (separate from the licence key).
const PREFIX = 'DEYN-TIME-V1\n';
const unb64u = s => { if (typeof s !== 'string' || !/^[A-Za-z0-9_-]+$/.test(s)) throw new Error('b64'); const b = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4); return Uint8Array.from(atob(b), c => c.charCodeAt(0)); };
export const MAX_RTT_MS = 10000;
export function newNonce() { const b = new Uint8Array(16); crypto.getRandomValues(b); let s = ''; for (const x of b) s += String.fromCharCode(x); return btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); }
// resp = {b,s}; ctx = {pubKeyB64, nonce, deviceId, rttMs}. rttMs is measured with a MONOTONIC clock (performance.now), not Date.
export async function verifyTimeResponse(resp, ctx) {
  const bad = reason => ({ ok: false, reason });
  try {
    if (!resp || typeof resp.b !== 'string' || typeof resp.s !== 'string') return bad('shape');
    if (!(ctx.rttMs >= 0) || ctx.rttMs > MAX_RTT_MS) return bad('rtt');
    const body = unb64u(resp.b), sig = unb64u(resp.s);
    if (sig.length !== 64) return bad('sig_len');
    const key = await crypto.subtle.importKey('raw', Uint8Array.from(atob(ctx.pubKeyB64), c => c.charCodeAt(0)), { name: 'Ed25519' }, false, ['verify']);
    const msg = new Uint8Array([...new TextEncoder().encode(PREFIX), ...body]);
    if (!await crypto.subtle.verify('Ed25519', key, sig, msg)) return bad('signature');
    const raw = new TextDecoder().decode(body), p = JSON.parse(raw);
    if (Object.keys(p).sort().join(',') !== 'd,k,n,t,v' || p.v !== 1 || p.k !== 'time' || !Number.isSafeInteger(p.t)) return bad('payload');
    if (JSON.stringify({ v: p.v, k: p.k, t: p.t, d: p.d, n: p.n }) !== raw) return bad('canonical');
    if (p.n !== ctx.nonce) return bad('nonce');          // replayed / swapped response
    if (p.d !== ctx.deviceId) return bad('device');
    return { ok: true, t: p.t };
  } catch (e) { return bad('error'); }
}
