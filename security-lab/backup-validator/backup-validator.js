const REQUIRED_ARRAYS = ['customers', 'pending'];
function isRecord(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
function canonicalize(v) {
  if (v === null || typeof v === 'string' || typeof v === 'boolean') return JSON.stringify(v);
  if (typeof v === 'number') { if (!Number.isFinite(v)) throw new TypeError('Non-finite number'); return JSON.stringify(v); }
  if (Array.isArray(v)) return '[' + v.map(canonicalize).join(',') + ']';
  if (!isRecord(v)) throw new TypeError('Unsupported JSON value');
  return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canonicalize(v[k])).join(',') + '}';
}
async function sha256Hex(v, cryptoProvider = globalThis.crypto) {
  if (!cryptoProvider?.subtle) throw new Error('SHA-256 unavailable');
  const bytes = new TextEncoder().encode(canonicalize(v));
  const digest = await cryptoProvider.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}
function validateDataShape(data) {
  if (!isRecord(data)) return { ok: false, reason: 'data_not_object' };
  for (const key of REQUIRED_ARRAYS) if (!Array.isArray(data[key])) return { ok: false, reason: `missing_or_invalid_${key}` };
  if (Object.hasOwn(data, 'trash') && !Array.isArray(data.trash)) return { ok: false, reason: 'invalid_trash' };
  return { ok: true };
}
function makePreview(data, format, createdAt = null) {
  return { format, createdAt, customers: data.customers.length, pendingTickets: data.pending.length,
    trashEntries: Array.isArray(data.trash) ? data.trash.length : null,
    containsAuth: Object.hasOwn(data, 'auth'), containsSettings: Object.hasOwn(data, 'settings'), preservesUnknownFields: true };
}
async function validateBackupText(text, cryptoProvider = globalThis.crypto) {
  if (typeof text !== 'string' || text.length === 0) return { ok: false, reason: 'empty_file' };
  let parsed; try { parsed = JSON.parse(text); } catch { return { ok: false, reason: 'invalid_json' }; }
  if (!isRecord(parsed)) return { ok: false, reason: 'root_not_object' };
  if (!Object.hasOwn(parsed, 'format')) {
    const s = validateDataShape(parsed); if (!s.ok) return s;
    return { ok: true, format: 'legacy', data: parsed, preview: makePreview(parsed, 'legacy') };
  }
  if (parsed.format !== 'DEYN_BACKUP') return { ok: false, reason: 'unsupported_format' };
  if (parsed.formatVersion !== 1) return { ok: false, reason: 'unsupported_version' };
  if (parsed.appDataKey !== 'deyn.v1') return { ok: false, reason: 'wrong_app_data_key' };
  if (typeof parsed.createdAt !== 'string' || !Number.isFinite(Date.parse(parsed.createdAt))) return { ok: false, reason: 'invalid_created_at' };
  const s = validateDataShape(parsed.data); if (!s.ok) return s;
  if (!isRecord(parsed.integrity) || parsed.integrity.algorithm !== 'SHA-256' || typeof parsed.integrity.digest !== 'string' || !/^[a-f0-9]{64}$/.test(parsed.integrity.digest)) return { ok: false, reason: 'invalid_integrity_metadata' };
  let actual; try { actual = await sha256Hex(parsed.data, cryptoProvider); } catch { return { ok: false, reason: 'digest_unavailable' }; }
  if (actual !== parsed.integrity.digest) return { ok: false, reason: 'digest_mismatch' };
  return { ok: true, format: 'versioned-v1', data: parsed.data, preview: makePreview(parsed.data, 'versioned-v1', parsed.createdAt) };
}
export { canonicalize, sha256Hex, validateBackupText };
