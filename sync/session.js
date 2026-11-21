// DEYN sync session: pairing + mutually authenticated, end-to-end encrypted channel + resumable event exchange.
// Transport-agnostic: a transport is {send(string), close()} plus the caller feeding received strings into session.feed(str).
// Crypto: X25519 (ephemeral, forward secrecy), Ed25519 device identity signatures, HKDF-SHA256, AES-256-GCM with strict frame counters.
import { MAX_EVENTS_PER_BATCH } from './engine.js';
const enc = new TextEncoder(), dec = new TextDecoder();
export const b64 = u8 => { let s = ''; for (const x of u8) s += String.fromCharCode(x); return btoa(s); };
export const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const b64u = u8 => b64(u8).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const unb64u = s => unb64(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4));
const cat = (...a) => { const n = a.reduce((x, y) => x + y.length, 0), o = new Uint8Array(n); let p = 0; for (const x of a) { o.set(x, p); p += x.length; } return o; };
const sha256 = async u8 => new Uint8Array(await crypto.subtle.digest('SHA-256', u8));
const ctEq = (a, b) => { if (a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i]; return d === 0; };
export const PAIR_TTL_MS = 5 * 60 * 1000, MAX_FRAME = 1 << 20;

export class Identity {
  constructor(pub, priv) { this.pub = pub; this.priv = priv; }              // raw public (b64) + PKCS#8 private (b64)
  static async create() { const k = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']); return new Identity(b64(new Uint8Array(await crypto.subtle.exportKey('raw', k.publicKey))), b64(new Uint8Array(await crypto.subtle.exportKey('pkcs8', k.privateKey)))); }
  static fromJson(j) { const o = JSON.parse(j); return new Identity(o.pub, o.priv); }
  toJson() { return JSON.stringify({ pub: this.pub, priv: this.priv }); }
  async sign(bytes) { const k = await crypto.subtle.importKey('pkcs8', unb64(this.priv), { name: 'Ed25519' }, false, ['sign']); return b64(new Uint8Array(await crypto.subtle.sign('Ed25519', k, bytes))); }
}
async function verifySig(pubB64, sigB64, bytes) { try { const k = await crypto.subtle.importKey('raw', unb64(pubB64), { name: 'Ed25519' }, false, ['verify']); return await crypto.subtle.verify('Ed25519', k, unb64(sigB64), bytes); } catch (e) { return false; } }
async function hmac(secret, text) { const k = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); return new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(text))); }
async function newEph() { const k = await crypto.subtle.generateKey({ name: 'X25519' }, true, ['deriveBits']); return { priv: k.privateKey, pub: b64(new Uint8Array(await crypto.subtle.exportKey('raw', k.publicKey))) }; }
async function dh(priv, peerPubB64) { const pk = await crypto.subtle.importKey('raw', unb64(peerPubB64), { name: 'X25519' }, false, []); return new Uint8Array(await crypto.subtle.deriveBits({ name: 'X25519', public: pk }, priv, 256)); }
async function hkdf(ikm, salt, info) { const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']); return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode(info) }, k, 512)); }
const aesKey = raw => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
const nonceOf = c => { const n = new Uint8Array(12); new DataView(n.buffer).setBigUint64(4, BigInt(c)); return n; };

// ---------- pairing offer (shown as QR by the OWNER phone) ----------
export function makeOffer({ did, idpub, ip, port, now }) {
  const secret = crypto.getRandomValues(new Uint8Array(16));
  const offer = { v: 1, did, idpub, ip, port, s: b64u(secret) };
  return { offer, text: 'DEYNPAIR1:' + b64u(enc.encode(JSON.stringify(offer))), state: { secret, expiresAt: now + PAIR_TTL_MS, attemptsLeft: 3, used: false } };
}
export function parseOffer(text) {
  const m = /^DEYNPAIR1:([A-Za-z0-9_-]+)$/.exec(String(text || '').trim()); if (!m) return null;
  try { const o = JSON.parse(dec.decode(unb64u(m[1]))); if (o.v !== 1 || !/^[0-9a-f]{32}$/.test(o.did) || typeof o.idpub !== 'string' || typeof o.ip !== 'string' || !Number.isInteger(o.port) || typeof o.s !== 'string') return null; return Object.assign(o, { secret: unb64u(o.s) }); } catch (e) { return null; }
}
const transcript = (h1, h2) => enc.encode(['DEYN-HS-V1', h1.mode, h1.did, h1.epub, h1.n1, h2.did, h2.epub, h2.n2].join('|'));

// A secure session over any transport. role: 'initiator' | 'responder'
export class Session {
  constructor(transport, ctx, role) { this.t = transport; this.ctx = ctx; this.role = role; this.q = []; this.waiters = []; this.closed = false; this.sendC = 0; this.recvC = 0; this.keys = null; this.stage = 'hs'; this.fail = null; }
  _wake() { while (this.waiters.length && this.q.length) this.waiters.shift().resolve(this.q.shift()); }
  _die(reason) { if (this.closed) return; this.closed = true; this.fail = reason; for (const w of this.waiters) w.reject(new Error(reason)); this.waiters = []; try { this.t.close(); } catch (e) {} }
  onClose() { this._die(this.fail || 'closed'); }
  next() { if (this.q.length) return Promise.resolve(this.q.shift()); if (this.closed) return Promise.reject(new Error(this.fail || 'closed')); return new Promise((resolve, reject) => this.waiters.push({ resolve, reject })); }
  async feed(str) {                                                    // call for every frame received from the transport
    if (this.closed) return;
    try {
      if (str.length > MAX_FRAME) throw new Error('frame too large');
      const m = JSON.parse(str);
      if (this.stage === 'hs') { this.q.push(m); this._wake(); return; }
      if (m.t !== 'e' || m.c !== this.recvC || typeof m.d !== 'string') throw new Error('bad frame counter');          // replay / reorder / drop => abort
      const dir = this.role === 'initiator' ? 'r2i' : 'i2r';
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonceOf(m.c), additionalData: enc.encode('DEYN-FRAME-V1|' + dir) }, this.keys.rx, unb64(m.d));   // GCM tag => tamper => throws
      this.recvC += 1; this.q.push(JSON.parse(dec.decode(pt))); this._wake();
    } catch (e) { this._die('decrypt/frame error'); }
  }
  async send(obj) {
    if (this.closed) throw new Error('closed');
    if (this.stage === 'hs') return this.t.send(JSON.stringify(obj));
    const dir = this.role === 'initiator' ? 'i2r' : 'r2i', c = this.sendC++;
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonceOf(c), additionalData: enc.encode('DEYN-FRAME-V1|' + dir) }, this.keys.tx, enc.encode(JSON.stringify(obj))));
    this.t.send(JSON.stringify({ t: 'e', c, d: b64(ct) }));
  }
  async _keys(shared, h1, h2, secret) {
    const th = await sha256(transcript(h1, h2));
    const okm = await hkdf(cat(shared, secret || new Uint8Array(0)), th, 'DEYN-SYNC-KEYS-V1');
    const a = await aesKey(okm.slice(0, 32)), b = await aesKey(okm.slice(32, 64));
    this.keys = this.role === 'initiator' ? { tx: a, rx: b } : { tx: b, rx: a };
  }
  // ----- handshake: initiator (the phone that scanned the QR, or reconnecting) -----
  async handshakeInitiator(o) { try { return await this._hsI(o); } catch (e) { this._die(e.message); throw e; } }
  async handshakeResponder() { try { return await this._hsR(); } catch (e) { this._die(e.message); throw e; } }
  async _hsI({ offer }) {
    const ctx = this.ctx, mode = offer ? 'pair' : 'known', eph = await newEph();
    const h1 = { t: 'h1', v: 1, mode, did: ctx.did, epub: eph.pub, n1: b64u(crypto.getRandomValues(new Uint8Array(16))), idpub: ctx.identity.pub, lic: ctx.licence };
    if (offer) h1.proof = b64(await hmac(offer.secret, ['DEYN-PAIR-V1', h1.did, h1.epub, h1.n1, h1.idpub, h1.lic].join('|')));
    await this.send(h1);
    const h2 = await this.next(); if (h2.t !== 'h2' || h2.v !== 1) throw new Error('bad h2');
    let peerRec;
    if (offer) {
      if (h2.did !== offer.did || h2.idpub !== offer.idpub) throw new Error('responder identity differs from QR');
      const lic = await ctx.verifyLicence(h2.lic, h2.did); if (!lic || lic.role !== 'M') throw new Error('responder is not a licensed owner device');
      peerRec = { idpub: h2.idpub, role: 'M' };
    } else {
      peerRec = ctx.getPeer(h2.did); if (!peerRec || peerRec.idpub !== h2.idpub) throw new Error('unknown or changed peer identity');
    }
    const tr = transcript(h1, h2);
    if (!await verifySig(peerRec.idpub, h2.sig, cat(tr, enc.encode('|R')))) throw new Error('responder signature invalid');
    await this.send({ t: 'h3', sig: await ctx.identity.sign(cat(tr, enc.encode('|I'))) });
    this.peerDid = h2.did; this.peerRec = peerRec; this.pairing = !!offer;
    await this._keys(await dh(eph.priv, h2.epub), h1, h2, offer ? offer.secret : null);
    this.stage = 'enc';
    if (offer) ctx.savePeer(h2.did, Object.assign({ pairedAt: ctx.now() }, peerRec));
    return this.peerDid;
  }
  async _hsR() {
    const ctx = this.ctx, h1 = await this.next(); if (h1.t !== 'h1' || h1.v !== 1 || !/^[0-9a-f]{32}$/.test(h1.did) || typeof h1.epub !== 'string' || typeof h1.n1 !== 'string') throw new Error('bad h1');
    let peerRec, secret = null;
    if (h1.mode === 'pair') {
      const p = ctx.pairing; if (!p || p.used || ctx.now() > p.expiresAt || p.attemptsLeft <= 0) throw new Error('no valid pairing offer');
      const want = await hmac(p.secret, ['DEYN-PAIR-V1', h1.did, h1.epub, h1.n1, h1.idpub, h1.lic].join('|'));
      if (!h1.proof || !ctEq(want, unb64(h1.proof))) { p.attemptsLeft -= 1; throw new Error('pairing proof invalid'); }
      p.used = true;                                                    // single use: consumed by the first valid attempt
      const lic = await ctx.verifyLicence(h1.lic, h1.did); if (!lic) throw new Error('initiator licence invalid');
      peerRec = { idpub: h1.idpub, role: 'W' };                          // the OWNER decides the role of a newly paired phone; nothing the peer claims changes it
      secret = p.secret;
    } else if (h1.mode === 'known') {
      peerRec = ctx.getPeer(h1.did); if (!peerRec || peerRec.idpub !== h1.idpub) throw new Error('unknown peer');
    } else throw new Error('bad mode');
    const eph = await newEph();
    const h2 = { t: 'h2', v: 1, did: ctx.did, epub: eph.pub, n2: b64u(crypto.getRandomValues(new Uint8Array(16))), idpub: ctx.identity.pub, lic: ctx.licence };
    const tr = transcript(h1, h2); h2.sig = await ctx.identity.sign(cat(tr, enc.encode('|R')));
    await this.send(h2);
    const h3 = await this.next(); if (h3.t !== 'h3' || !await verifySig(peerRec.idpub, h3.sig, cat(tr, enc.encode('|I')))) throw new Error('initiator signature invalid');
    this.peerDid = h1.did; this.peerRec = peerRec; this.pairing = h1.mode === 'pair';
    await this._keys(await dh(eph.priv, h1.epub), h1, h2, secret);
    this.stage = 'enc';
    if (h1.mode === 'pair') ctx.savePeer(h1.did, Object.assign({ pairedAt: ctx.now() }, peerRec));
    return this.peerDid;
  }
  // ----- resumable exchange. initiator sends first, then receives; responder the opposite (deadlock-free) -----
  async _sendEvents(sy) {
    const peerRecv = (await this.next()); if (peerRecv.m !== 'state') throw new Error('expected state');
    const evs = sy.eventsAfter(this.peerDid, peerRecv.recv);
    if (!evs.length) { await this.send({ m: 'events', events: [], more: false }); const a = await this.next(); if (a.m !== 'ack') throw new Error('expected ack'); return 0; }
    let sent = 0;
    for (let i = 0; i < evs.length; i += MAX_EVENTS_PER_BATCH) {
      const chunk = evs.slice(i, i + MAX_EVENTS_PER_BATCH), more = i + MAX_EVENTS_PER_BATCH < evs.length;
      await this.send({ m: 'events', events: chunk, more });
      const a = await this.next(); if (a.m === 'err') throw new Error('peer refused: ' + a.reason); if (a.m !== 'ack') throw new Error('expected ack');
      sy.acked(this.peerDid, a.recv); sent += chunk.length;
    }
    return sent;
  }
  async _recvEvents(sy) {
    await this.send({ m: 'state', recv: sy.recvFrom(this.peerDid) });
    let got = 0;
    for (;;) {
      const m = await this.next(); if (m.m !== 'events' || !Array.isArray(m.events)) throw new Error('expected events');
      const r = await sy.apply(this.peerDid, this.peerRec.role, m.events);        // durable before we acknowledge
      if (!r.ok) { await this.send({ m: 'err', reason: r.reason || 'refused' }); throw new Error('batch refused: ' + (r.reason || '')); }
      got += r.applied; await this.send({ m: 'ack', recv: r.newRecv });
      if (!m.more) return got;
    }
  }
  async exchange() { try { return await this._exchange(); } catch (e) { this._die(e.message); throw e; } }
  async _exchange() {
    const sy = this.ctx.sync; await sy.prepare();
    const res = { sent: 0, received: 0 };
    if (this.role === 'initiator') { res.sent = await this._sendEvents2(sy); res.received = await this._recvEvents2(sy); }
    else { res.received = await this._recvEvents2(sy); res.sent = await this._sendEvents2(sy); }
    await this.send({ m: 'done' }); const d = await this.next(); if (d.m !== 'done') throw new Error('expected done');
    return res;
  }
  // wrappers keeping the (state -> events -> ack) pairing symmetric: the SENDER first announces nothing; the RECEIVER announces its cursor.
  async _recvEvents2(sy) { return this._recvEvents(sy); }
  async _sendEvents2(sy) { return this._sendEvents(sy); }
}
