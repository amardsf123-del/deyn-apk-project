import test from 'node:test';
import assert from 'node:assert/strict';
import { captureLocal, eventsAfter, applyBatch, checkEvent, markAcked, ensureSync, resnapshot, pendingCount, MAX_EVENTS_PER_BATCH, isPristineDemo, discardPristineDemo, demoFingerprint } from './engine.js';

let n = 0; const uid = () => 'id' + (++n).toString(36) + Math.random().toString(36).slice(2, 6);
let clock = 1_800_000_000_000; const now = () => (clock += 1000);
const tx = (type, amount, extra = {}) => ({ id: uid(), type, amount, note: '', ts: now(), ...extra });
const mk = () => ({ customers: [], pending: [], trash: [], seq: 1, settings: { dialect: true }, auth: { pw: { hash: 'SECRET' } } });
const bal = c => c.tx.reduce((a, t) => a + (t.type === 'debt' ? t.amount : -t.amount), 0);
const canon = S => JSON.stringify({ c: [...S.customers].sort((a, b) => a.id < b.id ? -1 : 1).map(c => ({ ...c, tx: [...c.tx].sort((a, b) => a.id < b.id ? -1 : 1) })), p: [...S.pending].sort((a, b) => a.id < b.id ? -1 : 1), t: [...(S.trash || [])].filter(x => x.type === 'customer').map(x => ({ id: x.data.id, n: x.data.tx.length })).sort((a, b) => a.id < b.id ? -1 : 1) });
const OWNER = 'o'.repeat(32), WORK = 'w'.repeat(32);
// one direction of a sync round: sender -> receiver
function push(from, fromId, to, toId, toRole_of_sender, opts = {}) {
  captureLocal(from, fromId, now());
  const peer = ensureSync(to, toId).peers[fromId] || { recv: 0 };
  const evs = eventsAfter(from, fromId, peer.recv);
  const res = applyBatch(to, toId, fromId, toRole_of_sender, evs, now());
  if (res.ok) markAcked(from, fromId, toId, res.newRecv);
  return { res, evs };
}
function round(O, W) { const a = push(W, WORK, O, OWNER, 'W'); const b = push(O, OWNER, W, WORK, 'M'); return { a, b }; }
const seedOwner = () => { const O = mk(); for (let i = 0; i < 3; i++) { const c = { id: uid(), name: 'C' + i, phone: '055' + i, seg: 'daily', ceiling: 5000, payDay: null, tx: [] }; c.tx.push(tx('debt', 1000 * (i + 1)), tx('pay', 200)); O.customers.push(c); } O.pending.unshift({ id: uid(), no: 1, amount: 50, tape: '50', tag: 't', ts: now() }); return O; };

test('initial full sync = union, not replacement; worker converges to owner data', () => {
  const O = seedOwner(), W = mk(); W.customers.push({ id: uid(), name: 'LOCAL-W', phone: '1', seg: 'daily', ceiling: 1, payDay: null, tx: [tx('debt', 5)] });
  const { a, b } = round(O, W); assert.ok(a.res.ok && b.res.ok);
  round(O, W);
  assert.equal(canon(O), canon(W)); assert.equal(O.customers.length, 4);
  assert.ok(O.customers.some(c => c.name === 'LOCAL-W'), 'worker customer reached the owner');
});
test('later syncs send ONLY new events', () => {
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  const c = W.customers[0]; c.tx.push(tx('debt', 777));
  const r = push(W, WORK, O, OWNER, 'W'); assert.equal(r.evs.length, 1); assert.equal(r.evs[0].k, 'tx');
  const again = push(W, WORK, O, OWNER, 'W'); assert.equal(again.evs.length, 0);
  assert.equal(O.customers.find(x => x.id === c.id).tx.length, c.tx.length);
});
test('duplicate / re-delivered batches never duplicate a transaction', () => {
  const O = seedOwner(), W = mk(); round(O, W);
  W.customers[0].tx.push(tx('pay', 50)); captureLocal(W, WORK, now());
  const evs = eventsAfter(W, WORK, 0);
  const before = O.customers.find(c => c.id === W.customers[0].id).tx.length;
  const r1 = applyBatch(O, OWNER, WORK, 'W', evs, now()); const r2 = applyBatch(O, OWNER, WORK, 'W', evs, now());
  assert.ok(r1.ok && r2.ok && r2.applied === 0);
  assert.equal(O.customers.find(c => c.id === W.customers[0].id).tx.length, before + 1, 'applied exactly once');
});
test('concurrent transactions on the same customer are both kept; balances converge', () => {
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  const cid = O.customers[0].id;
  O.customers[0].tx.push(tx('debt', 111)); W.customers.find(c => c.id === cid).tx.push(tx('debt', 222), tx('pay', 33));
  round(O, W); round(O, W);
  const bo = bal(O.customers.find(c => c.id === cid)), bw = bal(W.customers.find(c => c.id === cid));
  assert.equal(bo, bw); assert.equal(canon(O), canon(W));
});
test('conflicting edits of the same field: deterministic last-writer-wins, loser recorded, both phones agree', () => {
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  const cid = O.customers[0].id;
  W.customers.find(c => c.id === cid).phone = 'W-PHONE'; O.customers[0].phone = 'O-PHONE';
  O.customers[0].ceiling = 9999;                                   // different field: no conflict
  round(O, W); round(O, W);
  const po = O.customers.find(c => c.id === cid), pw = W.customers.find(c => c.id === cid);
  assert.equal(po.phone, pw.phone); assert.equal(po.ceiling, 9999); assert.equal(pw.ceiling, 9999);
  assert.ok(O.sync.conflicts.length + W.sync.conflicts.length >= 1, 'losing value kept in conflicts log');
  const lost = [...O.sync.conflicts, ...W.sync.conflicts].map(c => c.lost);
  assert.ok(lost.includes('W-PHONE') || lost.includes('O-PHONE'));
});
test('worker cannot edit/archive customers, delete tickets or inject bad transactions (receiver enforces)', () => {
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  const forge = (ev) => { const s = ensureSync(W, WORK); const e = { id: WORK + ':' + (s.peers.__x = (s.peers.__x || 1000) + 1), s: 0, h: '000000000000001.00000.' + WORK, ...ev }; return e; };
  const attempt = (body) => { const W2 = JSON.parse(JSON.stringify(W)); const sy = ensureSync(W2, WORK); sy.log = []; sy.seq = ensureSync(O, OWNER).peers[WORK].recv; sy.seq += 1; const ev = { id: WORK + ':' + sy.seq, s: sy.seq, h: '999999999999999.00000.' + WORK, ...body }; sy.log.push(ev); return applyBatch(O, OWNER, WORK, 'W', eventsAfter(W2, WORK, ensureSync(O, OWNER).peers[WORK].recv), now()); };
  const cid = O.customers[0].id;
  const snapshot = canon(O);
  for (const [name, body] of [['rename', { k: 'cf', cid, f: { name: 'HACK' } }], ['ceiling', { k: 'cf', cid, f: { ceiling: 1e9 } }], ['ceiling when not blocked', { k: 'cf', cid, f: { ceiling: 6000 } }], ['unblock a customer that is not blocked', { k: 'cf', cid, f: { seg: 'salaried' } }], ['archive', { k: 'cst', cid, st: 'archived' }], ['del ticket', { k: 'tkx', tid: O.pending[0].id, why: 'archived' }],
    ['negative tx', { k: 'tx', cid, tx: tx('pay', -5) }], ['bad type', { k: 'tx', cid, tx: tx('refund', 5) }], ['unknown kind', { k: 'wipe' }], ['tx field injection', { k: 'cf', cid, f: { tx: [] } }]]) {
    const r = attempt(body); const q0 = (O.sync.quarantine || []).length; assert.equal(canon(O), snapshot, name + ' must not change anything'); if (r.ok) assert.ok(r.quarantined.length === 1, name + ' quarantined ' + JSON.stringify(r)); else assert.ok(['rejected', 'gap'].includes(r.reason), name + ' got ' + JSON.stringify(r));
  }
  const ok = attempt({ k: 'cf', cid, f: { seg: 'black' } }); assert.ok(ok.ok && ok.applied === 1, 'worker may block a customer (existing UI power)');
});
test('a rejected batch is atomic: valid events in the same batch are NOT applied either', () => {
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  const cid = O.customers[0].id, before = canon(O), recv = ensureSync(O, OWNER).peers[WORK].recv;
  W.customers.find(c => c.id === cid).tx.push(tx('debt', 10)); captureLocal(W, WORK, now());
  const sy = ensureSync(W, WORK); sy.seq += 1; sy.log.push({ id: WORK + ':' + sy.seq, s: sy.seq, h: '999999999999999.00000.' + WORK, k: 'tx', cid, tx: { id: 'bad', type: 'pay', amount: -5, ts: 1 } });
  const r = applyBatch(O, OWNER, WORK, 'W', eventsAfter(W, WORK, recv), now());
  assert.equal(r.ok, false); assert.equal(canon(O), before); assert.equal(ensureSync(O, OWNER).peers[WORK].recv, recv);
});
test('gap in sequence is refused (cursor does not advance)', () => {
  const O = seedOwner(), W = mk(); captureLocal(O, OWNER, now());
  const evs = eventsAfter(O, OWNER, 0).slice(2);
  const r = applyBatch(W, WORK, OWNER, 'M', evs, now()); assert.equal(r.reason, 'gap'); assert.equal(W.customers.length, 0);
});
test('owner archives a customer; worker had added a transaction offline: nothing lost, both end identical', () => {
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  const c = O.customers[0]; W.customers.find(x => x.id === c.id).tx.push(tx('debt', 400));
  O.customers = O.customers.filter(x => x.id !== c.id); O.trash.unshift({ id: uid(), type: 'customer', data: c, deletedAt: now() });
  round(O, W); round(O, W);
  assert.equal(W.customers.some(x => x.id === c.id), false); assert.equal(O.customers.some(x => x.id === c.id), false);
  const tO = O.trash.find(t => t.data.id === c.id).data, tW = W.trash.find(t => t.data.id === c.id).data;
  assert.ok(tO.tx.some(t => t.amount === 400) && tW.tx.some(t => t.amount === 400));
  assert.equal(canon(O), canon(W));
});
test('wipe / clear-all on one phone is NOT propagated and nothing is deleted on the other', () => {
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  O.customers = []; O.pending = [];
  const r = round(O, W); round(O, W);
  assert.equal(W.customers.length, 3); assert.equal(W.pending.length, 1); assert.ok(O.sync.diverged);
});
test('ticket assigned to a customer (consumed) disappears on the other phone; ticket archive by worker is refused', () => {
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  const t = O.pending[0]; const c = O.customers[0];
  c.tx.push(tx('debt', t.amount, { ts: t.ts, tape: t.tape })); O.pending = O.pending.filter(x => x.id !== t.id);
  round(O, W); round(O, W);
  assert.equal(W.pending.length, 0); assert.ok(W.customers.find(x => x.id === c.id).tx.some(x => x.tape === t.tape));
});
test('settings, passwords and licences are never part of any event', () => {
  const O = seedOwner(), W = mk(); O.settings.secretFlag = 'x'; O.auth.pw = { hash: 'SECRET' }; round(O, W);
  const all = JSON.stringify(ensureSync(O, OWNER).log); assert.ok(!all.includes('SECRET') && !all.includes('secretFlag') && !all.includes('dialect'));
});
test('interrupted transfer: partial progress is kept, resume sends only what is missing, result identical', () => {
  const O = mk(); const c = { id: uid(), name: 'Big', phone: '1', seg: 'daily', ceiling: 1, payDay: null, tx: [] };
  for (let i = 0; i < 500; i++) c.tx.push(tx('debt', i + 1)); O.customers.push(c);
  const W = mk(); captureLocal(O, OWNER, now());
  let evs = eventsAfter(O, OWNER, 0); assert.ok(evs.length > MAX_EVENTS_PER_BATCH);
  const first = evs.slice(0, MAX_EVENTS_PER_BATCH); assert.ok(applyBatch(W, WORK, OWNER, 'M', first, now()).ok);     // link dies after batch 1
  const recv = ensureSync(W, WORK).peers[OWNER].recv; assert.equal(recv, MAX_EVENTS_PER_BATCH);
  const rest = eventsAfter(O, OWNER, recv); assert.equal(rest.length, evs.length - MAX_EVENTS_PER_BATCH);
  for (let i = 0; i < rest.length; i += MAX_EVENTS_PER_BATCH) assert.ok(applyBatch(W, WORK, OWNER, 'M', rest.slice(i, i + MAX_EVENTS_PER_BATCH), now()).ok);
  assert.equal(canon(O), canon(W)); assert.equal(W.customers[0].tx.length, 500);
});
test('pristine demo data is discarded on the joining phone; edited data is merged instead', () => {
  const W = mk(); W.customers.push({ id: uid(), name: 'demo', phone: '', seg: 'daily', ceiling: 1, payDay: null, tx: [tx('debt', 1)] }); W.demoFp = demoFingerprint(W);
  assert.ok(isPristineDemo(W)); assert.ok(discardPristineDemo(W, WORK)); assert.equal(W.customers.length, 0);
  const W2 = mk(); W2.customers.push({ id: uid(), name: 'demo', phone: '', seg: 'daily', ceiling: 1, payDay: null, tx: [] }); W2.demoFp = demoFingerprint(W2); W2.customers[0].tx.push(tx('debt', 9));
  assert.equal(isPristineDemo(W2), false);
});
test('FUZZ: 300 random operations on both phones with random sync timing always converge with no lost or duplicated transaction', () => {
  let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  const all = new Set(); const addId = id => all.add(id);
  for (const c of O.customers) for (const t of c.tx) addId(t.id);
  for (let i = 0; i < 300; i++) {
    const side = rnd() < 0.5 ? O : W; const isO = side === O;
    const r = rnd();
    if (r < 0.45 && side.customers.length) { const c = side.customers[Math.floor(rnd() * side.customers.length)]; const t = tx(rnd() < 0.6 ? 'debt' : 'pay', 1 + Math.floor(rnd() * 500)); c.tx.push(t); addId(t.id); }
    else if (r < 0.6) { const c = { id: uid(), name: 'N' + i, phone: '', seg: 'daily', ceiling: 100, payDay: null, tx: [] }; side.customers.push(c); }
    else if (r < 0.75 && isO && side.customers.length) { side.customers[Math.floor(rnd() * side.customers.length)].phone = (isO ? 'O' : 'W') + i; }
    else if (r < 0.82 && isO && side.customers.length > 2) { const c = side.customers.pop(); side.trash.unshift({ id: uid(), type: 'customer', data: c, deletedAt: now() }); }
    else if (r < 0.9) { side.pending.unshift({ id: uid(), no: i, amount: 5, tape: 'x' + i, tag: 'g', ts: now() }); }
    if (rnd() < 0.2) { rnd() < 0.5 ? push(W, WORK, O, OWNER, 'W') : push(O, OWNER, W, WORK, 'M'); }
  }
  for (let k = 0; k < 4; k++) round(O, W);
  assert.equal(canon(O), canon(W));
  const txIds = S => S.customers.concat(S.trash.filter(t => t.type === 'customer').map(t => t.data)).flatMap(c => c.tx.map(t => t.id));
  for (const S of [O, W]) { const ids = txIds(S); assert.equal(new Set(ids).size, ids.length, 'no duplicate tx'); for (const id of all) { /* every tx created on either side must exist */ } }
  const idsO = new Set(txIds(O)); for (const id of all) assert.ok(idsO.has(id), 'no transaction lost: ' + id);
  assert.equal(pendingCount(O, OWNER, WORK), 0);
});

test('a quarantined worker edit never blocks later legitimate worker events (cursor advances)', () => {
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  const cid = O.customers[0].id;
  W.customers.find(c => c.id === cid).name = 'TAMPERED'; W.customers.find(c => c.id === cid).tx.push(tx('debt', 123));
  round(O, W); round(O, W);
  assert.notEqual(O.customers.find(c => c.id === cid).name, 'TAMPERED');
  assert.ok(O.customers.find(c => c.id === cid).tx.some(t => t.amount === 123), 'legit tx after the forbidden edit still arrives');
  assert.ok(O.sync.quarantine.some(q => q.reason === 'worker-cannot-edit-customer'));
  assert.equal(W.customers.find(c => c.id === cid).name, O.customers.find(c => c.id === cid).name, 'worker is corrected back to the owner value');
  assert.equal(canon(O), canon(W));
});
test('worker that archives a customer locally is corrected back to active by the owner', () => {
  const O = seedOwner(), W = mk(); round(O, W); round(O, W);
  const c = W.customers[0]; W.customers = W.customers.filter(x => x.id !== c.id); W.trash.unshift({ id: uid(), type: 'customer', data: c, deletedAt: now() });
  round(O, W); round(O, W); round(O, W);
  assert.ok(O.customers.some(x => x.id === c.id) && W.customers.some(x => x.id === c.id)); assert.equal(canon(O), canon(W));
});

test('debt extension (dueAt & extensionHistory) syncs across devices via txf without duplicating the debt', () => {
  const O = { customers: [{ id: 'c1', name: 'Ali', phone: '0550', seg: 'salaried', ceiling: 30000, payDay: 10, tx: [{ id: 'd1', type: 'debt', amount: 5000, ts: 1000, dueAt: 2000 }] }], pending: [], trash: [] };
  const W = { customers: [], pending: [], trash: [] };
  ensureSync(O, 'O'); ensureSync(W, 'W');
  // Initial sync O -> W
  captureLocal(O, 'O', 1000);
  let r1 = applyBatch(W, 'W', 'O', 'M', eventsAfter(O, 'O', 0), 1001);
  assert.equal(r1.ok, true);
  assert.equal(W.customers[0].tx[0].dueAt, 2000);

  // Now O extends the debt (mutates existing transaction d1)
  O.customers[0].tx[0].originalDueAt = 2000;
  O.customers[0].tx[0].dueAt = 9000;
  O.customers[0].tx[0].extensionHistory = [{ at: 3000, from: 2000, to: 9000, amount: 7, unit: 'days' }];
  captureLocal(O, 'O', 3000);
  const evs = eventsAfter(O, 'O', r1.newRecv);
  assert.equal(evs.length, 1);
  assert.equal(evs[0].k, 'txf');

  let r2 = applyBatch(W, 'W', 'O', 'M', evs, 3001);
  assert.equal(r2.ok, true);
  assert.equal(W.customers[0].tx.length, 1);
  assert.equal(W.customers[0].tx[0].dueAt, 9000);
  assert.equal(W.customers[0].tx[0].originalDueAt, 2000);
  assert.equal(W.customers[0].tx[0].extensionHistory.length, 1);
});

test('worker cannot bypass segment/ceiling bounds via direct cf or cust+ events', () => {
  const O = { customers: [{ id: 'c1', name: 'Blk', phone: '0550', seg: 'black', ceiling: 0, tx: [] }], pending: [], trash: [] };
  ensureSync(O, 'O');
  const rBadSeg = checkEvent({ id: 'W:1', s: 1, h: '170000000000000.00001.W', k: 'cf', cid: 'c1', f: { seg: 'arbitrary_hacked_seg', ceiling: 5000 } }, 'W', O, 'O');
  assert.equal(rBadSeg.ok, false);
  const rBadCeil = checkEvent({ id: 'W:2', s: 2, h: '170000000000001.00001.W', k: 'cf', cid: 'c1', f: { seg: 'youth', ceiling: 99999 } }, 'W', O, 'O');
  assert.equal(rBadCeil.ok, false);
  const rCustWithTx = checkEvent({ id: 'W:3', s: 3, h: '170000000000002.00001.W', k: 'cust+', c: { id: 'c2', name: 'X', seg: 'daily', ceiling: 5000, tx: [{ id: 't1', type: 'debt', amount: 100, ts: 1 }] } }, 'W', O, 'O');
  assert.equal(rCustWithTx.ok, false);
  const rValidUnblock = checkEvent({ id: 'W:4', s: 4, h: '170000000000003.00001.W', k: 'cf', cid: 'c1', f: { seg: 'salaried', ceiling: 30000 } }, 'W', O, 'O');
  assert.equal(rValidUnblock.ok, true);
});

test('worker cannot delete ticket via tkx(consumed) without a proven matching tx', () => {
  const O = {
    customers: [{ id: 'c1', name: 'Ali', phone: '0550', seg: 'salaried', ceiling: 30000, tx: [] }],
    pending: [{ id: 'tk1', no: 1, amount: 1200, tape: '500 + 700', ts: 5000, tag: 'زيت' }],
    trash: []
  };
  ensureSync(O, 'O');
  // Worker sends tkx(consumed) WITHOUT any matching tx -> must be quarantined and ticket tk1 must survive!
  const fakeTkx = { id: 'W:1', s: 1, h: '170000000000000.00001.W', k: 'tkx', tid: 'tk1', why: 'consumed' };
  const r1 = applyBatch(O, 'O', 'W', 'W', [fakeTkx], 6000);
  assert.equal(r1.ok, true);
  assert.equal(r1.quarantined.length, 1);
  assert.equal(r1.quarantined[0].reason, 'worker-tkx-unproven');
  assert.equal(O.pending.length, 1);
});

test('worker cannot add new debt to a blocked (black) customer directly', () => {
  const O = {
    customers: [{ id: 'c_blk', name: 'Blk', phone: '0550', seg: 'black', ceiling: 0, tx: [] }],
    pending: [],
    trash: []
  };
  ensureSync(O, 'O');
  const debtToBlocked = {
    id: 'W:1', s: 1, h: '170000000000000.00001.W', k: 'tx', cid: 'c_blk',
    tx: { id: 'tx_bad', type: 'debt', amount: 500, ts: 6000 }
  };
  const r = applyBatch(O, 'O', 'W', 'W', [debtToBlocked], 6001);
  assert.equal(r.ok, true);
  assert.equal(r.quarantined.length, 1);
  assert.equal(r.quarantined[0].reason, 'worker-debt-to-blocked');
  assert.equal(O.customers[0].tx.length, 0);
});
