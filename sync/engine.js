// DEYN sync engine: append-only event log + deterministic merge. Pure JS (no DOM, no network, no crypto) so it is unit-testable.
// Rules: financial transactions are immutable and merged by union on their unique id; customer fields are last-writer-wins per field (hybrid
// logical clock, loser kept in S.sync.conflicts); archive/restore and ticket removal are state events; nothing ever replaces a whole database;
// a wipe / bulk delete is never propagated; settings, passwords and licences are never synchronised.
export const MAX_EVENTS_PER_BATCH = 200;
const FIELD_MAX = 2000;
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const clone = v => JSON.parse(JSON.stringify(v));
const jstr = v => JSON.stringify(v === undefined ? null : v);

// ---- hybrid logical clock (string form sorts lexicographically) ----
export const hlcStr = (l, c, did) => String(l).padStart(15, '0') + '.' + String(c).padStart(5, '0') + '.' + did;
export function hlcTick(sy, now) {
  if (now > sy.hlc.l) { sy.hlc.l = now; sy.hlc.c = 0; } else sy.hlc.c += 1;
  return hlcStr(sy.hlc.l, sy.hlc.c, sy.did);
}
export function hlcRecv(sy, remote, now) {
  const m = /^(\d{15})\.(\d{5})\./.exec(remote); if (!m) return;
  const rl = Number(m[1]), rc = Number(m[2]);
  const l = Math.max(sy.hlc.l, rl, now);
  sy.hlc.c = (l === sy.hlc.l && l === rl) ? Math.max(sy.hlc.c, rc) + 1 : (l === sy.hlc.l ? sy.hlc.c + 1 : (l === rl ? rc + 1 : 0));
  sy.hlc.l = l;
}

export function ensureSync(S, did) {
  if (!isObj(S.sync) || S.sync.did !== did) {
    const keep = isObj(S.sync) ? S.sync : {};
    S.sync = { did, hlc: keep.hlc || { l: 0, c: 0 }, seq: keep.seq || 0, log: keep.log || [], snap: keep.snap || null, peers: keep.peers || {}, fh: keep.fh || {}, sh: keep.sh || {}, orphans: keep.orphans || [], conflicts: keep.conflicts || [], quarantine: keep.quarantine || [], diverged: keep.diverged || false };
  }
  return S.sync;
}
const custBase = c => { const o = {}; for (const k of Object.keys(c)) if (k !== 'tx') o[k] = c[k]; return o; };
const txExtHash = t => jstr({ dueAt: t.dueAt ?? null, originalDueAt: t.originalDueAt ?? null, extensionHistory: Array.isArray(t.extensionHistory) ? t.extensionHistory : null });
const trashCust = S => (S.trash || []).filter(t => t && t.type === 'customer' && t.data && t.data.id);
const trashTkt = S => (S.trash || []).filter(t => t && t.type === 'ticket' && t.data && t.data.id);

// ---- snapshot: what we already turned into events ----
export function buildSnap(S) {
  const snap = { cs: {}, tx: {}, tk: {} };
  for (const c of S.customers) { snap.cs[c.id] = { a: 1, f: Object.fromEntries(Object.entries(custBase(c)).map(([k, v]) => [k, jstr(v)])) }; for (const t of c.tx || []) snap.tx[t.id] = txExtHash(t); }
  for (const it of trashCust(S)) { const d = it.data; snap.cs[d.id] = { a: 0, f: Object.fromEntries(Object.entries(custBase(d)).map(([k, v]) => [k, jstr(v)])) }; for (const t of d.tx || []) snap.tx[t.id] = txExtHash(t); }
  for (const t of S.pending) snap.tk[t.id] = { tag: jstr(t.tag) };
  return snap;
}
function push(sy, now, body) {
  sy.seq += 1; const h = hlcTick(sy, now);
  const ev = Object.assign({ id: sy.did + ':' + sy.seq, s: sy.seq, h }, body);
  sy.log.push(ev); return ev;
}
// Turn local changes since the last snapshot into log events. Call before every sync.
export function captureLocal(S, did, now) {
  const sy = ensureSync(S, did);
  if (!sy.snap) { sy.snap = { cs: {}, tx: {}, tk: {} }; }
  const snap = sy.snap, seenTx = new Set(Object.keys(snap.tx));
  const emitTx = (cid, c) => {
    for (const t of c.tx || []) {
      const hVal = txExtHash(t);
      if (!snap.tx[t.id]) {
        push(sy, now, { k: 'tx', cid, tx: clone(t) });
        snap.tx[t.id] = hVal;
        if (t.dueAt || (Array.isArray(t.extensionHistory) && t.extensionHistory.length)) {
          sy.fh['tx:' + cid + '.' + t.id] = sy.log[sy.log.length - 1].h;
        }
      } else if (snap.tx[t.id] !== hVal && (snap.tx[t.id] !== 1 || t.dueAt || (Array.isArray(t.extensionHistory) && t.extensionHistory.length))) {
        const ev = push(sy, now, {
          k: 'txf',
          cid,
          tid: t.id,
          dueAt: t.dueAt ?? null,
          originalDueAt: t.originalDueAt ?? null,
          extensionHistory: clone(Array.isArray(t.extensionHistory) ? t.extensionHistory : [])
        });
        sy.fh['tx:' + cid + '.' + t.id] = ev.h;
        snap.tx[t.id] = hVal;
      }
    }
  };
  for (const c of S.customers) {
    const prev = snap.cs[c.id];
    if (!prev) { push(sy, now, { k: 'cust+', c: clone(custBase(c)) }); snap.cs[c.id] = { a: 1, f: Object.fromEntries(Object.entries(custBase(c)).map(([k, v]) => [k, jstr(v)])) }; const h0 = sy.log[sy.log.length - 1].h; sy.sh[c.id] = h0; for (const k of Object.keys(custBase(c))) sy.fh[c.id + '.' + k] = h0; }
    else {
      if (prev.a === 0) { const ev = push(sy, now, { k: 'cst', cid: c.id, st: 'active' }); sy.sh[c.id] = ev.h; prev.a = 1; }
      const changed = {}; const cur = custBase(c);
      for (const k of Object.keys(cur)) { const j = jstr(cur[k]); if (prev.f[k] !== j) { changed[k] = clone(cur[k]); prev.f[k] = j; } }
      if (Object.keys(changed).length) { const ev = push(sy, now, { k: 'cf', cid: c.id, f: changed }); for (const k of Object.keys(changed)) sy.fh[c.id + '.' + k] = ev.h; }
    }
    emitTx(c.id, c);
  }
  for (const it of trashCust(S)) {
    const d = it.data, prev = snap.cs[d.id];
    if (!prev) { push(sy, now, { k: 'cust+', c: clone(custBase(d)) }); snap.cs[d.id] = { a: 1, f: Object.fromEntries(Object.entries(custBase(d)).map(([k, v]) => [k, jstr(v)])) }; }
    emitTx(d.id, d);
    if (snap.cs[d.id].a !== 0) { const ev = push(sy, now, { k: 'cst', cid: d.id, st: 'archived', at: it.deletedAt || now }); sy.sh[d.id] = ev.h; snap.cs[d.id].a = 0; }
  }
  // customers that vanished with no trash record (wipe/clear): never propagated
  const present = new Set([...S.customers.map(c => c.id), ...trashCust(S).map(t => t.data.id)]);
  for (const id of Object.keys(snap.cs)) if (!present.has(id)) { sy.diverged = true; delete snap.cs[id]; }
  // tickets
  const txSig = new Set(); for (const c of S.customers) for (const t of c.tx || []) if (t.tape) txSig.add(t.tape + '|' + t.ts);
  for (const t of S.pending) {
    const prev = snap.tk[t.id];
    if (!prev) { push(sy, now, { k: 'tk+', t: clone(t) }); snap.tk[t.id] = { tag: jstr(t.tag) }; }
    else if (prev.tag !== jstr(t.tag)) { const ev = push(sy, now, { k: 'tkf', tid: t.id, f: { tag: t.tag } }); sy.fh['t:' + t.id + '.tag'] = ev.h; prev.tag = jstr(t.tag); }
  }
  const pend = new Set(S.pending.map(t => t.id)), arch = new Set(trashTkt(S).map(x => x.data.id));
  const tkSrc = {}; for (const t of trashTkt(S)) tkSrc[t.data.id] = t.data;
  for (const id of Object.keys(snap.tk)) if (!pend.has(id)) {
    if (arch.has(id)) push(sy, now, { k: 'tkx', tid: id, why: 'archived' });
    else { /* consumed only if a transaction carrying its signature exists (assignment); otherwise it is a wipe: ignore */
      const sig = sy._lastTk && sy._lastTk[id]; if (sig && txSig.has(sig)) push(sy, now, { k: 'tkx', tid: id, why: 'consumed', sig }); else sy.diverged = true; }
    delete snap.tk[id];
  }
  sy._lastTk = Object.fromEntries(S.pending.map(t => [t.id, t.tape + '|' + t.ts]));
  return sy;
}
// Rebuild the snapshot from the current state (after applying remote events, so they are not re-emitted).
export function resnapshot(S, did) { const sy = ensureSync(S, did); sy.snap = buildSnap(S); sy._lastTk = Object.fromEntries(S.pending.map(t => [t.id, t.tape + '|' + t.ts])); }
export const eventsAfter = (S, did, peerRecv) => ensureSync(S, did).log.filter(e => e.s > peerRecv);

// ---- validation & permissions (enforced by the RECEIVER from the pinned role of the sender) ----
const okStr = (v, n = FIELD_MAX) => typeof v === 'string' && v.length <= n;
const okNum = v => typeof v === 'number' && Number.isFinite(v);
function validTx(t) { return isObj(t) && okStr(t.id, 64) && (t.type === 'debt' || t.type === 'pay') && okNum(t.amount) && t.amount > 0 && t.amount < 1e12 && okNum(t.ts) && (t.note === undefined || okStr(t.note)); }
function validCust(c) { return isObj(c) && okStr(c.id, 64) && okStr(c.name, 200) && JSON.stringify(c).length < 20000; }
export function checkEvent(ev, senderRole, S, did) {
  const bad = r => ({ ok: false, reason: r });
  if (!isObj(ev) || !okStr(ev.id, 100) || !Number.isSafeInteger(ev.s) || !okStr(ev.h, 80) || !/^\d{15}\.\d{5}\./.test(ev.h)) return bad('shape');
  const hasC = id => S.customers.some(c => c.id === id) || trashCust(S).some(t => t.data.id === id);
  const W = senderRole === 'W';
  switch (ev.k) {
    case 'tx': {
      if (!validTx(ev.tx) || !okStr(ev.cid, 64)) return bad('tx-shape');
      if (W && ev.tx.type === 'debt') {
        const cur = S.customers.find(c => c.id === ev.cid);
        const unblockedInBatch = Array.isArray(S.__batchUnblockedCids) && S.__batchUnblockedCids.includes(ev.cid);
        if (cur && cur.seg === 'black' && !unblockedInBatch) return bad('worker-debt-to-blocked');
      }
      return { ok: true };
    }
    case 'txf':
      if (!okStr(ev.cid, 64) || !okStr(ev.tid, 64)) return bad('txf-shape');
      if (ev.dueAt !== null && ev.dueAt !== undefined && !okNum(ev.dueAt)) return bad('txf-shape');
      if (ev.originalDueAt !== null && ev.originalDueAt !== undefined && !okNum(ev.originalDueAt)) return bad('txf-shape');
      if (ev.extensionHistory !== undefined && (!Array.isArray(ev.extensionHistory) || ev.extensionHistory.length > 200)) return bad('txf-shape');
      return { ok: true };
    case 'cust+': {
      if (!validCust(ev.c)) return bad('cust-shape');
      if (W) {
        const segDefaults = { salaried: 30000, youth: 3000, daily: 5000, black: 0 };
        const customSegs = (S && S.customSegs) || {};
        const validSegs = new Set([...Object.keys(segDefaults), ...Object.keys(customSegs)]);
        if (ev.c.seg !== undefined && !validSegs.has(ev.c.seg)) return bad('worker-invalid-segment');
        if (ev.c.ceiling !== undefined && (!okNum(ev.c.ceiling) || ev.c.ceiling < 0 || ev.c.ceiling > 100000)) return bad('worker-invalid-ceiling');
        if (Array.isArray(ev.c.tx) && ev.c.tx.length > 0) return bad('worker-cust-with-tx');
      }
      return { ok: true };
    }
    case 'cf': if (!isObj(ev.f) || !okStr(ev.cid, 64) || JSON.stringify(ev.f).length > 20000) return bad('cf-shape');
      if ('tx' in ev.f || 'id' in ev.f) return bad('cf-forbidden-field');
      // same power the worker UI already has: auto-block / unblock-by-assignment change only segment and ceiling; name, phone, pay day stay owner-only
      if (W) {
        const cur = S.customers.find(c => c.id === ev.cid);
        if (!cur || !Object.keys(ev.f).every(k => k === 'seg' || k === 'ceiling')) return bad('worker-cannot-edit-customer');
        const segDefaults = { salaried: 30000, youth: 3000, daily: 5000, black: 0 };
        const customSegs = (S && S.customSegs) || {};
        const validActiveSegs = new Set([...Object.keys(segDefaults).filter(k => k !== 'black'), ...Object.keys(customSegs).filter(k => k !== 'black')]);
        if ('seg' in ev.f && !(ev.f.seg === 'black' || (cur.seg === 'black' && validActiveSegs.has(ev.f.seg)))) return bad('worker-cannot-edit-customer');
        if ('ceiling' in ev.f) {
          if (!(cur.ceiling === 0 && okNum(ev.f.ceiling) && ev.f.ceiling >= 0 && ev.f.ceiling <= 100000)) return bad('worker-cannot-edit-customer');
          const targetSeg = ('seg' in ev.f) ? ev.f.seg : cur.seg;
          const segObj = customSegs[targetSeg];
          const maxAllowed = segObj && okNum(segObj.ceiling) ? Math.max(segObj.ceiling, 10000) : Math.max(segDefaults[targetSeg] || 10000, 10000);
          if (ev.f.ceiling > maxAllowed) return bad('worker-cannot-edit-customer');
        }
      }
      return { ok: true };
    case 'cst': if (W) return bad('worker-cannot-archive'); if (!okStr(ev.cid, 64) || (ev.st !== 'archived' && ev.st !== 'active')) return bad('cst-shape'); return { ok: true };
    case 'tk+': if (!isObj(ev.t) || !okStr(ev.t.id, 64) || !okNum(ev.t.amount) || ev.t.amount < 0) return bad('tk-shape'); return { ok: true };
    case 'tkf': if (!isObj(ev.f) || !okStr(ev.tid, 64) || Object.keys(ev.f).some(k => k !== 'tag') || !okStr(ev.f.tag, 500)) return bad('tkf-shape'); return { ok: true };
    case 'tkx': {
      if (!okStr(ev.tid, 64) || (ev.why !== 'archived' && ev.why !== 'consumed')) return bad('tkx-shape');
      if (W && ev.why === 'archived') return bad('worker-cannot-delete-ticket');
      if (W && ev.why === 'consumed') {
        const targetTkt = S.pending.find(t => t.id === ev.tid);
        if (targetTkt) {
          const expectedSig = targetTkt.tape + '|' + targetTkt.ts;
          const batchHasTx = Array.isArray(S.__batchTxSigs) && S.__batchTxSigs.includes(expectedSig);
          const stateHasTx = S.customers.some(c => (c.tx || []).some(t => t.tape && (t.tape + '|' + t.ts) === expectedSig));
          if (!batchHasTx && !stateHasTx) return bad('worker-tkx-unproven');
        } else if (!okStr(ev.sig, 200)) {
          return bad('worker-tkx-unproven');
        }
      }
      return { ok: true };
    }
    default: return bad('unknown-kind');
  }
}
function findCust(S, id) { const c = S.customers.find(x => x.id === id); if (c) return { c, where: 'active' }; const t = trashCust(S).find(x => x.data.id === id); return t ? { c: t.data, where: 'trash', item: t } : null; }
function recordConflict(sy, rec) { sy.conflicts.push(rec); if (sy.conflicts.length > 200) sy.conflicts.shift(); }
function applyOne(S, sy, ev, now) {
  switch (ev.k) {
    case 'tx': {
      const f = findCust(S, ev.cid); if (!f) { sy.orphans.push(ev); return 'orphan'; }
      if (f.c.tx.some(t => t.id === ev.tx.id)) return 'dup';
      f.c.tx.push(clone(ev.tx)); return 'applied';
    }
    case 'txf': {
      const f = findCust(S, ev.cid); if (!f) { sy.orphans.push(ev); return 'orphan'; }
      const t = (f.c.tx || []).find(x => x.id === ev.tid);
      if (!t) { sy.orphans.push(ev); return 'orphan'; }
      const key = 'tx:' + ev.cid + '.' + ev.tid, cur = sy.fh[key] || '';
      if (ev.h > cur) {
        if (ev.originalDueAt !== undefined && ev.originalDueAt !== null) t.originalDueAt = ev.originalDueAt;
        if (ev.dueAt !== undefined && ev.dueAt !== null) t.dueAt = ev.dueAt;
        if (Array.isArray(ev.extensionHistory)) {
          const existing = Array.isArray(t.extensionHistory) ? t.extensionHistory : [];
          const seen = new Set(existing.map(x => `${x.at}|${x.from}|${x.to}`));
          for (const item of ev.extensionHistory) {
            const sig = `${item.at}|${item.from}|${item.to}`;
            if (!seen.has(sig)) { existing.push(clone(item)); seen.add(sig); }
          }
          existing.sort((a, b) => (a.at || 0) - (b.at || 0));
          t.extensionHistory = existing;
        }
        sy.fh[key] = ev.h;
        return 'applied';
      }
      return 'dup';
    }
    case 'cust+': {
      const f = findCust(S, ev.c.id);
      if (!f) { const c = clone(ev.c); c.tx = []; S.customers.push(c); sy.sh[c.id] = sy.sh[c.id] || ev.h; for (const k of Object.keys(ev.c)) sy.fh[c.id + '.' + k] = ev.h; return 'applied'; }
      return applyOne(S, sy, { k: 'cf', cid: ev.c.id, f: custBase(ev.c), h: ev.h, id: ev.id, s: ev.s }, now);
    }
    case 'cf': {
      const f = findCust(S, ev.cid); if (!f) { sy.orphans.push(ev); return 'orphan'; }
      let any = false;
      for (const [k, v] of Object.entries(ev.f)) {
        const key = ev.cid + '.' + k, cur = sy.fh[key] || '';
        if (ev.h > cur) { if (jstr(f.c[k]) !== jstr(v)) { if (cur && sy.fh[key] && f.c[k] !== undefined) recordConflict(sy, { cid: ev.cid, field: k, lost: f.c[k], by: ev.h, at: now }); f.c[k] = clone(v); any = true; } sy.fh[key] = ev.h; }
        else if (jstr(f.c[k]) !== jstr(v)) recordConflict(sy, { cid: ev.cid, field: k, lost: v, by: cur, at: now });
      }
      return any ? 'applied' : 'dup';
    }
    case 'cst': {
      const cur = sy.sh[ev.cid] || ''; if (ev.h <= cur) return 'dup';
      const f = findCust(S, ev.cid); if (!f) { sy.orphans.push(ev); return 'orphan'; }
      sy.sh[ev.cid] = ev.h;
      if (ev.st === 'archived' && f.where === 'active') {
        S.customers = S.customers.filter(c => c.id !== ev.cid);
        S.trash = S.trash || []; S.trash.unshift({ id: 'sync-' + ev.id, type: 'customer', data: f.c, deletedAt: ev.at || now, title: f.c.name, synced: true }); return 'applied';
      }
      if (ev.st === 'active' && f.where === 'trash') { S.trash = S.trash.filter(t => t !== f.item); S.customers.push(f.c); return 'applied'; }
      return 'dup';
    }
    case 'tk+': { if (S.pending.some(t => t.id === ev.t.id) || trashTkt(S).some(t => t.data.id === ev.t.id) || (sy.gone && sy.gone[ev.t.id])) return 'dup'; S.pending.unshift(clone(ev.t)); sy.fh['t:' + ev.t.id + '.tag'] = ev.h; return 'applied'; }
    case 'tkf': {
      const t = S.pending.find(x => x.id === ev.tid); if (!t) return 'dup';
      const key = 't:' + ev.tid + '.tag', cur = sy.fh[key] || '';
      if (ev.h > cur) { if (t.tag !== ev.f.tag && cur) recordConflict(sy, { tid: ev.tid, field: 'tag', lost: t.tag, by: ev.h, at: now }); t.tag = ev.f.tag; sy.fh[key] = ev.h; return 'applied'; }
      if (t.tag !== ev.f.tag) recordConflict(sy, { tid: ev.tid, field: 'tag', lost: ev.f.tag, by: cur, at: now }); return 'dup';
    }
    case 'tkx': {
      sy.gone = sy.gone || {}; sy.gone[ev.tid] = 1;
      const t = S.pending.find(x => x.id === ev.tid); if (!t) return 'dup';
      S.pending = S.pending.filter(x => x.id !== ev.tid);
      if (ev.why === 'archived') { S.trash = S.trash || []; S.trash.unshift({ id: 'sync-' + ev.id, type: 'ticket', data: t, deletedAt: now, synced: true }); }
      return 'applied';
    }
  }
  return 'dup';
}
// Apply a contiguous batch from a peer. Caller supplies the sender's pinned role. Returns {applied, dup, rejected, newRecv}.
// Validation first: if ANY event is rejected the whole batch is refused and nothing is applied.
export function applyBatch(S, did, peerId, senderRole, events, now) {
  const sy = ensureSync(S, did);
  captureLocal(S, did, now);          // flush local changes into the log first, so the snapshot rebuild below can never swallow them
  const peer = sy.peers[peerId] || (sy.peers[peerId] = { recv: 0, acked: 0 });
  const rejected = [];                     // structural problems: refuse the whole batch (tampering / corruption)
  const quarantined = [];                  // permission problems: skip these, keep the rest, advance the cursor
  let expect = peer.recv + 1;
  const fresh = [];
  S.__batchTxSigs = [];
  S.__batchUnblockedCids = [];
  for (const preEv of events) {
    if (preEv && preEv.k === 'tx' && preEv.tx && preEv.tx.tape && preEv.tx.ts) {
      S.__batchTxSigs.push(preEv.tx.tape + '|' + preEv.tx.ts);
    }
    if (preEv && preEv.k === 'cf' && preEv.f && preEv.f.seg && preEv.f.seg !== 'black') {
      S.__batchUnblockedCids.push(preEv.cid);
    }
  }
  try {
  for (const ev of events) {
    if (!Number.isSafeInteger(ev && ev.s)) { rejected.push({ id: ev && ev.id, reason: 'shape' }); continue; }
    if (ev.s <= peer.recv) continue;                                   // already applied: duplicate delivery
    if (ev.s !== expect) { return { ok: false, reason: 'gap', expected: expect, applied: 0, rejected }; }
    if (ev.id !== peerId + ':' + ev.s) { rejected.push({ id: ev.id, reason: 'id-mismatch' }); expect += 1; continue; }
    const chk = checkEvent(ev, senderRole, S, did);
    if (!chk.ok) { if (String(chk.reason).startsWith('worker-')) quarantined.push({ ev, reason: chk.reason }); else rejected.push({ id: ev.id, reason: chk.reason }); }
    else fresh.push(ev);
    expect += 1;
  }
  if (rejected.length) return { ok: false, reason: 'rejected', rejected, applied: 0 };
  const lastSeq = expect - 1;
  for (const q of quarantined) { sy.quarantine = sy.quarantine || []; sy.quarantine.push({ id: q.ev.id, k: q.ev.k, reason: q.reason, at: now }); if (sy.quarantine.length > 100) sy.quarantine.shift(); }
  let applied = 0, dup = 0; const now2 = now;
  for (const ev of fresh) { hlcRecv(sy, ev.h, now2); const r = applyOne(S, sy, ev, now2); if (r === 'applied') applied++; else if (r === 'dup') dup++; }
  // retry orphans whose customer may now exist
  const orph = sy.orphans; sy.orphans = [];
  for (const ev of orph) { const r = applyOne(S, sy, ev, now2); if (r === 'applied') applied++; }
  // A refused worker edit must not leave the two phones permanently different: the receiver answers with a corrective event carrying its own
  // (authoritative) values. The correction is stamped after the refused edit, so last-writer-wins makes the worker adopt it.
  for (const q of quarantined) {
    const ev = q.ev, f = findCust(S, ev.cid);
    if (ev.k === 'cf' && f) { const vals = {}; for (const k of Object.keys(ev.f)) if (k !== 'tx' && k !== 'id') vals[k] = clone(f.c[k] === undefined ? null : f.c[k]); const e2 = push(sy, now, { k: 'cf', cid: ev.cid, f: vals }); for (const k of Object.keys(vals)) sy.fh[ev.cid + '.' + k] = e2.h; }
    else if (ev.k === 'cst' && f) { const want = f.where === 'active' ? 'active' : 'archived'; if (want !== ev.st) { const e2 = push(sy, now, { k: 'cst', cid: ev.cid, st: want, at: now }); sy.sh[ev.cid] = e2.h; } }
  }
  if (lastSeq > peer.recv) peer.recv = lastSeq;
  resnapshot(S, did);
  return { ok: true, applied, dup, rejected: [], quarantined: quarantined.map(q => ({ id: q.ev.id, reason: q.reason })), newRecv: peer.recv };
  } finally { delete S.__batchTxSigs; delete S.__batchUnblockedCids; }
}
export const markAcked = (S, did, peerId, recv) => { const p = ensureSync(S, did).peers[peerId]; if (p && recv > p.acked) p.acked = Math.min(recv, ensureSync(S, did).seq); };
export const pendingCount = (S, did, peerId) => { const sy = ensureSync(S, did); const p = sy.peers[peerId] || { acked: 0 }; return sy.log.filter(e => e.s > p.acked).length; };

// A phone whose data is still the untouched demo set must adopt the owner's data instead of merging 10 demo customers into the real ledger.
export const demoFingerprint = S => { const str = JSON.stringify([S.customers, S.pending]); let h = 5381; for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0; return String(h) + ':' + str.length; };
export const isPristineDemo = S => !!S.demoFp && S.demoFp === demoFingerprint(S) && !(S.sync && S.sync.snap);
export function discardPristineDemo(S, did) { if (!isPristineDemo(S)) return false; S.customers = []; S.pending = []; S.trash = []; delete S.demoFp; ensureSync(S, did); resnapshot(S, did); return true; }
