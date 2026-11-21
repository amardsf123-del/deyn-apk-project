import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import worker from './worker.js';
import { verifyTimeResponse, newNonce } from './client.js';
import { initialState, evaluate, TOLERANCE_MS, GRACE_MS } from './time-policy.js';

const kp = generateKeyPairSync('ed25519');                               // TEST key only, generated per run, never stored
const priv = kp.privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64');
const pub = Buffer.from(kp.publicKey.export({ format: 'jwk' }).x, 'base64url').toString('base64');
const env = { TIME_SIGNING_KEY: priv };
const dev = 'a'.repeat(32);
const call = async (body, init = {}) => worker.fetch(new Request('https://t.example/v1/time', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), ...init }), env);

test('valid signed time verifies and is close to server clock', async () => {
  const n = newNonce(); const before = Date.now();
  const r = await call({ n, d: dev }); assert.equal(r.status, 200);
  const v = await verifyTimeResponse(await r.json(), { pubKeyB64: pub, nonce: n, deviceId: dev, rttMs: 120 });
  assert.ok(v.ok); assert.ok(Math.abs(v.t - before) < 5000);
});
test('replayed response (old nonce) rejected', async () => {
  const n1 = newNonce(); const old = await (await call({ n: n1, d: dev })).json();
  const v = await verifyTimeResponse(old, { pubKeyB64: pub, nonce: newNonce(), deviceId: dev, rttMs: 50 });
  assert.deepEqual([v.ok, v.reason], [false, 'nonce']);
});
test('response for another device rejected', async () => {
  const n = newNonce(); const r = await (await call({ n, d: 'b'.repeat(32) })).json();
  const v = await verifyTimeResponse(r, { pubKeyB64: pub, nonce: n, deviceId: dev, rttMs: 50 });
  assert.equal(v.reason, 'device');
});
test('altered time or altered signature rejected', async () => {
  const n = newNonce(); const r = await (await call({ n, d: dev })).json();
  const body = JSON.parse(Buffer.from(r.b, 'base64url').toString()); body.t += 3600000;
  const forged = { b: Buffer.from(JSON.stringify(body)).toString('base64url'), s: r.s };
  assert.equal((await verifyTimeResponse(forged, { pubKeyB64: pub, nonce: n, deviceId: dev, rttMs: 50 })).reason, 'signature');
  const s2 = Buffer.from(r.s, 'base64url'); s2[0] ^= 1;
  assert.equal((await verifyTimeResponse({ b: r.b, s: s2.toString('base64url') }, { pubKeyB64: pub, nonce: n, deviceId: dev, rttMs: 50 })).reason, 'signature');
});
test('response signed by a different key rejected', async () => {
  const k2 = generateKeyPairSync('ed25519'); const e2 = { TIME_SIGNING_KEY: k2.privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64') };
  const n = newNonce(); const r = await (await worker.fetch(new Request('https://t/v1/time', { method: 'POST', body: JSON.stringify({ n, d: dev }) }), e2)).json();
  assert.equal((await verifyTimeResponse(r, { pubKeyB64: pub, nonce: n, deviceId: dev, rttMs: 50 })).reason, 'signature');
});
test('slow round trip (possible delayed relay) rejected', async () => {
  const n = newNonce(); const r = await (await call({ n, d: dev })).json();
  assert.equal((await verifyTimeResponse(r, { pubKeyB64: pub, nonce: n, deviceId: dev, rttMs: 60000 })).reason, 'rtt');
});
test('worker input validation', async () => {
  assert.equal((await call({ n: 'x', d: dev })).status, 400);
  assert.equal((await call({ n: newNonce(), d: 'zz' })).status, 400);
  assert.equal((await call('not json')).status, 400);
  assert.equal((await worker.fetch(new Request('https://t/v1/time'), env)).status, 405);
  assert.equal((await worker.fetch(new Request('https://t/other', { method: 'POST' }), env)).status, 404);
  assert.equal((await call({ n: newNonce(), d: dev }, { headers: { 'content-length': '9999' } })).status, 413);
  assert.equal((await worker.fetch(new Request('https://t/v1/time', { method: 'POST', body: '{}' }), {})).status, 500);
});
test('response contains no secret and CORS is limited to the app origin', async () => {
  const r = await call({ n: newNonce(), d: dev }); const txt = await r.clone().text();
  assert.ok(!txt.includes(priv)); assert.equal(r.headers.get('access-control-allow-origin'), 'https://localhost'); assert.equal(r.headers.get('cache-control'), 'no-store');
});
test('signing latency is far below the 10ms Free-plan CPU cap (Node, indicative only)', async () => {
  const t0 = process.hrtime.bigint(); for (let i = 0; i < 50; i++) await call({ n: newNonce(), d: dev });
  const ms = Number(process.hrtime.bigint() - t0) / 1e6 / 50; console.log('avg ms/request', ms.toFixed(2)); assert.ok(ms < 10);
});

// ---- policy: 3 warnings, 48h grace, then policy ----
const T = 1_800_000_000_000, H = 3600_000;
test('normal operation stays OK', () => { let s = initialState(); for (let i = 0; i < 5; i++) { const r = evaluate(s, { now: T + i * H, trusted: T + i * H }); s = r.state; assert.equal(r.status, 'OK'); } });
test('small drift (<5min) never triggers anything', () => { const r = evaluate(initialState(), { now: T, trusted: T + 2 * 60000 }); assert.equal(r.status, 'OK'); });
test('3 separate episodes -> warnings 1,2,3 then grace starts on the 3rd', () => {
  let s = initialState(); const seen = [];
  for (let k = 0; k < 3; k++) {
    let r = evaluate(s, { now: T + k * 24 * H - 2 * H, trusted: T + k * 24 * H }); s = r.state; seen.push([r.warningNo, r.status]);   // clock behind truth by 2h
    r = evaluate(s, { now: T + k * 24 * H + H, trusted: T + k * 24 * H + H }); s = r.state; assert.equal(r.status, 'OK');                // user fixes clock, verified online
  }
  assert.deepEqual(seen, [[1, 'WARN'], [2, 'WARN'], [3, 'GRACE']]);
});
test('grace lasts 48h then licence policy (READ_ONLY) applies; data never deleted', () => {
  let s = initialState(); s.warnings = 2;
  let r = evaluate(s, { now: T - 3 * H, trusted: T }); assert.equal(r.status, 'GRACE'); s = r.state;
  r = evaluate(s, { now: T + 47 * H - 3 * H, trusted: T + 47 * H }); assert.equal(r.status, 'GRACE'); assert.ok(r.graceLeftMs > 0 && r.graceLeftMs <= H); s = r.state;
  r = evaluate(s, { now: T + 49 * H - 3 * H, trusted: T + 49 * H }); assert.equal(r.status, 'READ_ONLY'); assert.ok(!('delete' in r));
});
test('verified correct clock during grace ends the episode', () => {
  let s = initialState(); s.warnings = 2; let r = evaluate(s, { now: T - 3 * H, trusted: T }); s = r.state;
  r = evaluate(s, { now: T + H, trusted: T + H }); assert.equal(r.status, 'OK'); assert.equal(r.state.graceStart, null);
});
test('offline rollback is detected from last seen time; offline cannot clear an episode', () => {
  let s = initialState(); let r = evaluate(s, { now: T, trusted: null }); s = r.state;
  r = evaluate(s, { now: T - 2 * H, trusted: null }); assert.equal(r.status, 'WARN'); assert.equal(r.warningNo, 1); s = r.state;
  r = evaluate(s, { now: T + H, trusted: null }); assert.equal(r.status, 'WARN');            // clock "fixed" but unprovable offline
});
test('grace is measured on a forward-only clock when offline (rolling the clock back does not extend it)', () => {
  let s = initialState(); s.warnings = 2; let r = evaluate(s, { now: T, trusted: T - 4 * H }); s = r.state;   // 3rd warning, grace starts
  r = evaluate(s, { now: T + 50 * H, trusted: null }); s = r.state; assert.equal(r.status, 'READ_ONLY');
  r = evaluate(s, { now: T + 1 * H, trusted: null }); assert.equal(r.status, 'READ_ONLY');                      // rolled back again: still expired
});

test('verified trusted time repairs a lastSeen poisoned by a wrong forward clock (no false rollback afterwards)', () => {
  let s = initialState(); s.lastSeen = T + 400 * 24 * H;                      // clock was once set +400 days
  let r = evaluate(s, { now: T, trusted: T });                                 // user fixed it, device is online
  assert.equal(r.state.lastSeen, T);
  r = evaluate(r.state, { now: T + H, trusted: null });
  assert.equal(r.status, 'OK');
});

test('after the 3 warnings are used, a new episode starts a fresh 48h grace (never stuck at WARN)', () => {
  let s = initialState(); s.warnings = 3;
  let r = evaluate(s, { now: T - 3 * H, trusted: T }); assert.equal(r.status, 'GRACE'); assert.equal(r.warningNo, 0);
  r = evaluate(r.state, { now: T + 50 * H - 3 * H, trusted: T + 50 * H }); assert.equal(r.status, 'READ_ONLY');
});
