/**
 * DEYN Cloud Sync Backend — Cloudflare Workers + SQLite-backed Durable Objects
 *
 * Security & Multi-Tenant Architecture:
 * - Strictly 1 isolated Durable Object (with its own SQLite storage) per `merchantId`.
 * - Zero cross-merchant queries or shared tables.
 * - Owner bootstrap verifies the official Ed25519-signed DEYN3 licence (public key only — zero secrets).
 * - All debt/customer payloads are E2E encrypted client-side with a true 256-bit shared secret
 *   (HKDF-SHA256 + AES-256-GCM with AAD) exchanged directly between merchant devices during pairing;
 *   Cloudflare NEVER sees the encryption key or plaintext data.
 * - Every request is authenticated with the device's Ed25519 signature + anti-replay timestamp.
 * - Supports explicit Owner-only device revocation (/v1/sync/revoke).
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

// Public Ed25519 verification key for DEYN3 licences (public key only; matches app DEYN_PUBLIC_KEY)
const DEYN_LIC_PUBLIC_KEY_B64 = 'uM8GgGamY++GH9e2PTTkluRlzqEVdbnj+MLh4uFYr/Y=';

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64uToBytes(str) {
  const pad = '='.repeat((4 - (str.length % 4)) % 4);
  const b64 = (str + pad).replace(/-/g, '+').replace(/_/g, '/');
  return b64ToBytes(b64);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'content-type, x-deyn-merchant, x-deyn-device, x-deyn-ts, x-deyn-sig, x-deyn-idpub',
      'cache-control': 'no-store'
    }
  });
}

async function verifyEd25519(pubB64u, sigB64u, messageBytes) {
  try {
    const pubRaw = b64uToBytes(pubB64u);
    const sigRaw = b64uToBytes(sigB64u);
    if (pubRaw.length !== 32 || sigRaw.length !== 64) return false;
    const key = await crypto.subtle.importKey('raw', pubRaw, { name: 'Ed25519' }, false, ['verify']);
    return await crypto.subtle.verify('Ed25519', key, sigRaw, messageBytes);
  } catch {
    return false;
  }
}

async function verifyDeynOwnerLicence(code, expectedDeviceId, env) {
  try {
    const clean = String(code || '').replace(/[\s\u200e\u200f\u202a-\u202e]+/g, '');
    const m = /^DEYN3-([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(clean);
    if (!m) return null;
    const body = b64uToBytes(m[1]);
    const sig = b64uToBytes(m[2]);
    if (sig.length !== 64) return null;
    const raw = dec.decode(body);
    const p = JSON.parse(raw);
    if (!p || typeof p !== 'object' || Array.isArray(p)) return null;
    const keys = Object.keys(p).sort().join(',');
    if (keys !== 'd,exp,n,r,t,v' || p.v !== 3 || p.d !== expectedDeviceId || p.r !== 'M') return null;
    if (!['1Y', '2Y', 'LT'].includes(p.t)) return null;
    if (p.t !== 'LT' && (!Number.isSafeInteger(p.exp) || Date.now() >= p.exp)) return null;
    const canonical = JSON.stringify({ v: p.v, d: p.d, t: p.t, r: p.r, exp: p.exp, n: p.n });
    if (canonical !== raw) return null;
    const pubB64 = (env && env.DEYN_LIC_PUBLIC_KEY) || DEYN_LIC_PUBLIC_KEY_B64;
    const key = await crypto.subtle.importKey('raw', b64ToBytes(pubB64), { name: 'Ed25519' }, false, ['verify']);
    const ok = await crypto.subtle.verify('Ed25519', key, sig, body);
    return ok ? p : null;
  } catch {
    return null;
  }
}

export class MerchantSyncDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sql = state.storage.sql;
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS devices (
        device_id TEXT PRIMARY KEY,
        idpub TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('M', 'W')),
        registered_at INTEGER NOT NULL,
        revoked INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS batches (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id TEXT NOT NULL UNIQUE,
        sender_device TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        ciphertext TEXT NOT NULL,
        iv TEXT NOT NULL,
        event_count INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_batches_seq ON batches(seq);
    `);
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return json({ ok: true });

    const merchantId = request.headers.get('x-deyn-merchant') || '';
    const deviceId = request.headers.get('x-deyn-device') || '';
    const tsStr = request.headers.get('x-deyn-ts') || '';
    const sig = request.headers.get('x-deyn-sig') || '';
    const idpubHdr = request.headers.get('x-deyn-idpub') || '';

    if (!/^[A-Za-z0-9_-]{8,80}$/.test(merchantId) || !/^[0-9a-f]{32}$/.test(deviceId)) {
      return json({ ok: false, error: 'invalid_identity_headers' }, 400);
    }

    const ts = Number(tsStr);
    const maxSkew = Number(this.env.MAX_CLOCK_SKEW_SEC || 300) * 1000;
    if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > maxSkew) {
      return json({ ok: false, error: 'clock_skew_or_expired' }, 401);
    }

    const rawBody = request.method === 'POST' ? await request.text() : '';
    const maxBytes = Number(this.env.MAX_BATCH_BYTES || 262144);
    if (rawBody.length > maxBytes) {
      return json({ ok: false, error: 'payload_too_large' }, 413);
    }

    const existing = this.sql.exec(
      'SELECT device_id, idpub, role, revoked FROM devices WHERE device_id = ?',
      deviceId
    ).toArray();

    const canonical = [request.method, url.pathname, url.search, merchantId, deviceId, tsStr, rawBody].join('|');

    if (url.pathname === '/v1/sync/register' && request.method === 'POST') {
      let body;
      try { body = JSON.parse(rawBody || '{}'); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
      const role = body.role === 'M' ? 'M' : 'W';
      const targetDid = String(body.targetDeviceId || deviceId);
      const targetPub = String(body.targetIdpub || idpubHdr);
      if (!/^[0-9a-f]{32}$/.test(targetDid) || !targetPub) {
        return json({ ok: false, error: 'invalid_device_payload' }, 400);
      }

      const ownerRows = this.sql.exec("SELECT device_id, idpub FROM devices WHERE role = 'M' AND revoked = 0").toArray();
      if (ownerRows.length === 0) {
        // Bootstrap: first owner device MUST prove ownership with a valid Ed25519-signed DEYN3 Owner licence
        if (role !== 'M' || targetDid !== deviceId) {
          return json({ ok: false, error: 'owner_must_register_first' }, 403);
        }
        const lic = await verifyDeynOwnerLicence(body.licence, deviceId, this.env);
        if (!lic) {
          return json({ ok: false, error: 'invalid_owner_licence' }, 403);
        }
        if (!(await verifyEd25519(targetPub, sig, enc.encode(canonical)))) {
          return json({ ok: false, error: 'invalid_signature' }, 401);
        }
        this.sql.exec(
          'INSERT INTO devices (device_id, idpub, role, registered_at, revoked) VALUES (?, ?, ?, ?, 0)',
          deviceId, targetPub, 'M', Date.now()
        );
        return json({ ok: true, registered: deviceId, role: 'M' });
      }

      // Only the registered Owner can authorize additional worker devices
      const owner = ownerRows[0];
      if (owner.device_id !== deviceId) {
        return json({ ok: false, error: 'owner_only_registration' }, 403);
      }
      if (!(await verifyEd25519(owner.idpub, sig, enc.encode(canonical)))) {
        return json({ ok: false, error: 'invalid_signature' }, 401);
      }
      const assignRole = targetDid === owner.device_id ? 'M' : 'W';
      this.sql.exec(
        'INSERT INTO devices (device_id, idpub, role, registered_at, revoked) VALUES (?, ?, ?, ?, 0) ON CONFLICT(device_id) DO UPDATE SET idpub = excluded.idpub, role = excluded.role, revoked = 0',
        targetDid, targetPub, assignRole, Date.now()
      );
      return json({ ok: true, registered: targetDid, role: assignRole });
    }

    if (url.pathname === '/v1/sync/revoke' && request.method === 'POST') {
      const ownerRows = this.sql.exec("SELECT device_id, idpub FROM devices WHERE role = 'M' AND revoked = 0").toArray();
      if (!ownerRows.length || ownerRows[0].device_id !== deviceId) {
        return json({ ok: false, error: 'owner_only_revocation' }, 403);
      }
      if (!(await verifyEd25519(ownerRows[0].idpub, sig, enc.encode(canonical)))) {
        return json({ ok: false, error: 'invalid_signature' }, 401);
      }
      let body;
      try { body = JSON.parse(rawBody || '{}'); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
      const targetDid = String(body.targetDeviceId || '');
      if (!/^[0-9a-f]{32}$/.test(targetDid) || targetDid === ownerRows[0].device_id) {
        return json({ ok: false, error: 'invalid_revoke_target' }, 400);
      }
      this.sql.exec("UPDATE devices SET revoked = 1 WHERE device_id = ? AND role = 'W'", targetDid);
      return json({ ok: true, revoked: targetDid });
    }

    // All push/pull calls require a registered, non-revoked device in THIS merchant room
    if (!existing.length || existing[0].revoked) {
      return json({ ok: false, error: 'device_not_authorized' }, 403);
    }
    if (!(await verifyEd25519(existing[0].idpub, sig, enc.encode(canonical)))) {
      return json({ ok: false, error: 'invalid_signature' }, 401);
    }

    if (url.pathname === '/v1/sync/push' && request.method === 'POST') {
      let body;
      try { body = JSON.parse(rawBody || '{}'); } catch { return json({ ok: false, error: 'bad_json' }, 400); }
      const batchId = String(body.batchId || '').trim();
      const ciphertext = String(body.ciphertext || '');
      const iv = String(body.iv || '');
      const eventCount = Math.max(0, Math.min(500, Number(body.eventCount) || 0));
      if (!batchId || !ciphertext || !iv) {
        return json({ ok: false, error: 'missing_encrypted_batch_fields' }, 400);
      }
      const dup = this.sql.exec('SELECT seq FROM batches WHERE batch_id = ?', batchId).toArray();
      if (dup.length) {
        return json({ ok: true, seq: dup[0].seq, duplicate: true });
      }
      this.sql.exec(
        'INSERT INTO batches (batch_id, sender_device, created_at, ciphertext, iv, event_count) VALUES (?, ?, ?, ?, ?, ?)',
        batchId, deviceId, Date.now(), ciphertext, iv, eventCount
      );
      const row = this.sql.exec('SELECT seq FROM batches WHERE batch_id = ?', batchId).toArray()[0];
      return json({ ok: true, seq: row.seq, duplicate: false });
    }

    if (url.pathname === '/v1/sync/pull' && request.method === 'GET') {
      const afterSeq = Math.max(0, Number(url.searchParams.get('afterSeq') || '0') || 0);
      const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || '50') || 50));
      const rows = this.sql.exec(
        'SELECT seq, batch_id, sender_device, created_at, ciphertext, iv, event_count FROM batches WHERE seq > ? AND sender_device != ? ORDER BY seq ASC LIMIT ?',
        afterSeq, deviceId, limit
      ).toArray();
      const latest = this.sql.exec('SELECT COALESCE(MAX(seq), 0) AS max_seq FROM batches').toArray()[0];
      return json({
        ok: true,
        latestSeq: Number(latest?.max_seq || 0),
        batches: rows.map(r => ({
          seq: r.seq,
          batchId: r.batch_id,
          senderDevice: r.sender_device,
          createdAt: r.created_at,
          ciphertext: r.ciphertext,
          iv: r.iv,
          eventCount: r.event_count
        }))
      });
    }

    return json({ ok: false, error: 'not_found' }, 404);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return json({ ok: true });
    if (url.pathname === '/v1/health') {
      return json({ ok: true, service: 'deyn-cloud-sync', storage: 'durable-objects-sqlite', version: 'v2-e2ee' });
    }
    const merchantId = request.headers.get('x-deyn-merchant') || '';
    if (!/^[A-Za-z0-9_-]{8,80}$/.test(merchantId)) {
      return json({ ok: false, error: 'missing_or_invalid_merchant_id' }, 400);
    }
    const stub = env.MERCHANT_SYNC.get(env.MERCHANT_SYNC.idFromName(merchantId));
    return stub.fetch(request);
  }
};
