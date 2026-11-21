import test from 'node:test';
import assert from 'node:assert/strict';
import { Identity, Session, makeOffer, parseOffer, PAIR_TTL_MS } from './session.js';
import { captureLocal, eventsAfter, applyBatch, markAcked, ensureSync } from './engine.js';

let n = 0; const uid = () => 'u' + (++n).toString(36) + Math.random().toString(36).slice(2, 6);
let clock = 1_800_000_000_000; const now = () => (clock += 500);
const tx = (type, amount) => ({ id: uid(), type, amount, note: '', ts: now() });
const hex32 = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
const canon = S => JSON.stringify([...S.customers].sort((a, b) => a.id < b.id ? -1 : 1).map(c => ({ ...c, tx: [...c.tx].sort((a, b) => a.id < b.id ? -1 : 1) })));

async function device(role, S) {
  const d = { did: hex32(), role, S: S || { customers: [], pending: [], trash: [], settings: {}, auth: {} }, identity: await Identity.create(), peers: {}, pairing: null, applied: 0 };
  d.licence = 'LIC:' + d.did + ':' + role;
  d.ctx = {
    did: d.did, identity: d.identity, licence: d.licence, now,
    verifyLicence: async (code, did) => { const m = /^LIC:([0-9a-f]{32}):(M|W)$/.exec(code || ''); return m && m[1] === did ? { role: m[2] } : null; },
    getPeer: id => d.peers[id] || null, savePeer: (id, rec) => { d.peers[id] = rec; ensureSync(d.S, d.did).peers[id] = ensureSync(d.S, d.did).peers[id] || { recv: 0, acked: 0 }; },
    get pairing() { return d.pairing; },
    sync: {
      prepare: async () => { captureLocal(d.S, d.did, now()); },
      recvFrom: p => (ensureSync(d.S, d.did).peers[p] || { recv: 0 }).recv,
      eventsAfter: (p, r) => eventsAfter(d.S, d.did, r),
      acked: (p, r) => markAcked(d.S, d.did, p, r),
      apply: async (p, role, evs) => { const r = applyBatch(d.S, d.did, p, role, evs, now()); if (r.ok) d.applied += r.applied; return r; }
    }
  };
  return d;
}
// in-memory link with fault injection + a wire log
function link(opts = {}) {
  const wire = []; let count = 0, A, B;
  const mk = (peer) => ({ send: s => {
      count += 1; wire.push(s);
      if (opts.cutAfter && count > opts.cutAfter) { A && A.onClose(); B && B.onClose(); return; }
      let out = s;
      if (opts.tamper === count) { const m = JSON.parse(s); if (m.d) { const u = Buffer.from(m.d, 'base64'); u[5] ^= 1; m.d = u.toString('base64'); out = JSON.stringify(m); } }
      const deliver = () => (peer() ? peer().feed(out) : null);
      Promise.resolve().then(deliver); if (opts.dup === count) Promise.resolve().then(deliver);
    }, close: () => { Promise.resolve().then(() => { const p = peer(); if (p) p.onClose(); }); } });
  const ta = mk(() => B), tb = mk(() => A);
  return { ta, tb, setA: s => { A = s; }, setB: s => { B = s; }, wire };
}
async function connect(init, resp, { offer, opts } = {}) {
  const L = link(opts); const si = new Session(L.ta, init.ctx, 'initiator'), sr = new Session(L.tb, resp.ctx, 'responder'); L.setA(si); L.setB(sr);
  const hs = await Promise.allSettled([si.handshakeInitiator({ offer }), sr.handshakeResponder()]);
  return { si, sr, L, hs };
}
async function fullSync(si, sr) { return Promise.allSettled([si.exchange(), sr.exchange()]); }
const ownerData = () => { const S = { customers: [], pending: [], trash: [], settings: { secretsetting: 'S' }, auth: { pw: { hash: 'PWHASH' } } }; for (let i = 0; i < 3; i++) { const c = { id: uid(), name: 'عميل-' + i, phone: '0555' + i, seg: 'daily', ceiling: 5000, payDay: null, tx: [tx('debt', 1000), tx('pay', 100)] }; S.customers.push(c); } return S; };

async function pairedPair() {
  const O = await device('M', ownerData()), W = await device('W');
  const { offer, text, state } = makeOffer({ did: O.did, idpub: O.identity.pub, ip: '192.168.1.20', port: 4747, now: now() }); O.pairing = state;
  const parsed = parseOffer(text); assert.ok(parsed);
  const c = await connect(W, O, { offer: parsed }); assert.ok(c.hs.every(h => h.status === 'fulfilled'), JSON.stringify(c.hs.map(h => h.reason && h.reason.message)));
  return { O, W, c, text };
}

test('QR offer round-trips and rejects garbage', () => {
  const o = makeOffer({ did: hex32(), idpub: 'AAAA', ip: '10.0.0.5', port: 4000, now: 1 }); const p = parseOffer(o.text);
  assert.equal(p.port, 4000); assert.equal(p.ip, '10.0.0.5'); assert.equal(parseOffer('DEYNPAIR1:@@@'), null); assert.equal(parseOffer('hello'), null); assert.equal(parseOffer(null), null);
});
test('pairing: both phones pin each other; owner records the new phone as WORKER; worker records owner as MASTER', async () => {
  const { O, W } = await pairedPair();
  assert.equal(O.peers[W.did].role, 'W'); assert.equal(W.peers[O.did].role, 'M');
  assert.equal(O.peers[W.did].idpub, W.identity.pub); assert.equal(W.peers[O.did].idpub, O.identity.pub);
});
test('initial full sync over the encrypted channel; worker ends with the owner data; no settings/password leave the owner', async () => {
  const { O, W, c } = await pairedPair();
  const r = await fullSync(c.si, c.sr); assert.ok(r.every(x => x.status === 'fulfilled'), JSON.stringify(r.map(x => x.reason && x.reason.message)));
  assert.equal(canon(O.S), canon(W.S)); assert.equal(W.S.customers.length, 3);
  assert.ok(!JSON.stringify(W.S).includes('PWHASH') && !JSON.stringify(W.S).includes('secretsetting'));
});
test('eavesdropper sees no plaintext: names, amounts and JSON keys never appear on the wire after the handshake', async () => {
  const { O, W, c } = await pairedPair(); await fullSync(c.si, c.sr);
  const post = c.L.wire.filter(s => JSON.parse(s).t === 'e').join('');
  assert.ok(post.length > 500); for (const needle of ['عميل', 'customers', 'amount', '0555', 'debt']) assert.ok(!post.includes(needle), needle);
  const hs = c.L.wire.filter(s => JSON.parse(s).t !== 'e').join(''); assert.ok(!hs.includes('"s":'), 'QR secret never sent');
});
test('incremental sync afterwards (known peers, no QR): only new events travel; both directions', async () => {
  const { O, W, c } = await pairedPair(); await fullSync(c.si, c.sr);
  W.S.customers[0].tx.push(tx('debt', 321)); O.S.customers[1].tx.push(tx('pay', 55));
  const c2 = await connect(W, O, {}); assert.ok(c2.hs.every(h => h.status === 'fulfilled'), JSON.stringify(c2.hs.map(h => h.reason && h.reason.message)));
  const r = await fullSync(c2.si, c2.sr); const out = r.map(x => x.value);
  assert.equal(out[0].sent, 1); assert.equal(out[0].received, 1); assert.equal(canon(O.S), canon(W.S));
  const c3 = await connect(W, O, {}); const r3 = (await fullSync(c3.si, c3.sr)).map(x => x.value); assert.deepEqual([r3[0].sent, r3[0].received], [0, 0]);
});
test('wrong QR secret: responder refuses, nothing paired; 3 failures burn the offer even for the right secret', async () => {
  const O = await device('M', ownerData()), W = await device('W');
  const { offer, state } = makeOffer({ did: O.did, idpub: O.identity.pub, ip: 'x', port: 1, now: now() }); O.pairing = state;
  const wrong = { ...offer, secret: crypto.getRandomValues(new Uint8Array(16)) };
  for (let i = 0; i < 3; i++) { const c = await connect(W, O, { offer: wrong }); assert.ok(c.hs.some(h => h.status === 'rejected')); }
  assert.deepEqual(Object.keys(O.peers), []);
  const good = await connect(W, O, { offer: { ...offer, secret: state.secret } }); assert.ok(good.hs.some(h => h.status === 'rejected'), 'offer burned after 3 bad attempts');
});
test('the offer is single-use and expires', async () => {
  const O = await device('M', ownerData()), W = await device('W'), W2 = await device('W');
  const { offer, state } = makeOffer({ did: O.did, idpub: O.identity.pub, ip: 'x', port: 1, now: now() }); O.pairing = state;
  const ok = await connect(W, O, { offer: { ...offer, secret: state.secret } }); assert.ok(ok.hs.every(h => h.status === 'fulfilled'));
  const again = await connect(W2, O, { offer: { ...offer, secret: state.secret } }); assert.ok(again.hs.some(h => h.status === 'rejected'), 'a second phone cannot reuse the QR');
  const O2 = await device('M'); const f = makeOffer({ did: O2.did, idpub: O2.identity.pub, ip: 'x', port: 1, now: now() }); f.state.expiresAt = now() - 1; O2.pairing = f.state;
  const late = await connect(await device('W'), O2, { offer: { ...f.offer, secret: f.state.secret } }); assert.ok(late.hs.some(h => h.status === 'rejected'), 'expired');
});
test('a stranger that never paired cannot connect in "known" mode', async () => {
  const { O } = await pairedPair(); const stranger = await device('W');
  const c = await connect(stranger, O, {}); assert.ok(c.hs.some(h => h.status === 'rejected')); assert.equal(Object.keys(ensureSync(O.S, O.did).peers).length, 1);
});
test('impostor presenting a paired device id with its OWN key is rejected (identity pinned)', async () => {
  const { O, W } = await pairedPair(); const evil = await device('W'); evil.did = W.did; evil.ctx.did = W.did; evil.licence = 'LIC:' + W.did + ':W'; evil.ctx.licence = evil.licence;
  evil.peers[O.did] = { idpub: O.identity.pub, role: 'M' };
  const c = await connect(evil, O, {}); assert.ok(c.hs.some(h => h.status === 'rejected'));
});
test('a phone whose licence is worker-only cannot act as the OWNER during pairing', async () => {
  const fakeOwner = await device('W', ownerData()), W = await device('W');
  const { offer, state } = makeOffer({ did: fakeOwner.did, idpub: fakeOwner.identity.pub, ip: 'x', port: 1, now: now() }); fakeOwner.pairing = state;
  const c = await connect(W, fakeOwner, { offer: { ...offer, secret: state.secret } }); assert.ok(c.hs.some(h => h.status === 'rejected' && /owner/.test(h.reason.message)));
});
test('QR identity mismatch (attacker answers at the scanned address with another key) is detected by the scanner', async () => {
  const O = await device('M'), attacker = await device('M'), W = await device('W');
  const { offer } = makeOffer({ did: O.did, idpub: O.identity.pub, ip: 'x', port: 1, now: now() });
  const fp = makeOffer({ did: attacker.did, idpub: attacker.identity.pub, ip: 'x', port: 1, now: now() }); attacker.pairing = { secret: offer.secret, expiresAt: now() + 1e6, attemptsLeft: 3, used: false };
  const c = await connect(W, attacker, { offer }); assert.ok(c.hs.some(h => h.status === 'rejected'));
});
test('tampered ciphertext aborts the session and changes nothing', async () => {
  const { O, W, c } = await pairedPair(); const before = canon(W.S);
  const c2 = await connect(W, O, { opts: { tamper: 8 } }); const r = await fullSync(c2.si, c2.sr);
  assert.ok(r.some(x => x.status === 'rejected')); assert.equal(canon(W.S), before);
});
test('replayed (duplicated) frame aborts the session', async () => {
  const { O, W } = await pairedPair(); const c2 = await connect(W, O, { opts: { dup: 7 } }); const r = await fullSync(c2.si, c2.sr);
  assert.ok(r.some(x => x.status === 'rejected'));
});
test('connection cut mid-transfer: nothing lost or duplicated, resume completes from the saved cursor', async () => {
  const O = await device('M'), W = await device('W');
  const big = { id: uid(), name: 'Big', phone: '1', seg: 'daily', ceiling: 1, payDay: null, tx: [] }; for (let i = 0; i < 700; i++) big.tx.push(tx('debt', i + 1)); O.S.customers.push(big);
  const { offer, state } = makeOffer({ did: O.did, idpub: O.identity.pub, ip: 'x', port: 1, now: now() }); O.pairing = state;
  const c = await connect(W, O, { offer: { ...offer, secret: state.secret }, opts: { cutAfter: 10 } });
  const r1 = await Promise.allSettled([c.si.exchange(), c.sr.exchange()]); assert.ok(r1.some(x => x.status === 'rejected'), 'first attempt interrupted');
  const mid = W.S.customers.length ? W.S.customers[0].tx.length : 0; assert.ok(mid < 700);
  let tries = 0; for (; tries < 5 && canon(O.S) !== canon(W.S); tries++) { const cc = await connect(W, O, {}); await fullSync(cc.si, cc.sr); }
  assert.equal(canon(O.S), canon(W.S)); assert.equal(W.S.customers.find(x => x.id === big.id).tx.length, 700);
  const ids = W.S.customers.flatMap(x => x.tx.map(t => t.id)); assert.equal(new Set(ids).size, ids.length);
});
test('worker that sends forbidden edits through the secure channel: owner quarantines them, legit data still syncs', async () => {
  const { O, W, c } = await pairedPair(); await fullSync(c.si, c.sr);
  const cust = W.S.customers[0]; cust.name = 'WORKER-RENAME'; cust.tx.push(tx('debt', 77));
  const c2 = await connect(W, O, {}); const r = await fullSync(c2.si, c2.sr); assert.ok(r.every(x => x.status === 'fulfilled'));
  const oc = O.S.customers.find(x => x.id === cust.id); assert.notEqual(oc.name, 'WORKER-RENAME'); assert.ok(oc.tx.some(t => t.amount === 77));
  assert.ok(ensureSync(O.S, O.did).quarantine.length >= 1);
});
test('offline accumulation: events pile up while disconnected and flow once the link returns', async () => {
  const { O, W, c } = await pairedPair(); await fullSync(c.si, c.sr);
  for (let i = 0; i < 25; i++) W.S.customers[i % 3].tx.push(tx('debt', 10 + i));
  assert.ok(true); const c2 = await connect(W, O, {}); await fullSync(c2.si, c2.sr);
  assert.equal(canon(O.S), canon(W.S)); assert.equal(O.S.customers.reduce((a, x) => a + x.tx.length, 0), 6 + 25);
});
