/* EXPERIMENTAL ONLY — not integrated into DEYN. Local-clock expiry is temporary and must not ship. */
(function (root) {
  'use strict';
  var PUBLIC_KEY_B64 = 'GGV7VOrfbHEBHxS/wzJ7OeZsBc2Jx013mPZT5s4GML4=';
  var encoder = new TextEncoder();
  function bytesFromB64(s) {
    var bin = atob(s), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function b64url(bytes) {
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }
  function fromB64url(s) {
    if (!/^[A-Za-z0-9_-]+$/.test(s)) throw new Error('ترميز الكود غير صحيح');
    var b = s.replace(/-/g, '+').replace(/_/g, '/');
    while (b.length % 4) b += '=';
    return bytesFromB64(b);
  }
  function pemBytes(pem) {
    var clean = String(pem || '').replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s+/g, '');
    if (!clean || !/^[A-Za-z0-9+/=]+$/.test(clean)) throw new Error('صيغة المفتاح الخاص PKCS#8 غير صحيحة');
    return bytesFromB64(clean);
  }
  function canonical(p) {
    return JSON.stringify({v:p.v,did:p.did,tier:p.tier,role:p.role,exp:p.exp,nonce:p.nonce});
  }
  function randomNonce() {
    var b = new Uint8Array(16); crypto.getRandomValues(b); return b64url(b);
  }
  async function publicKey() {
    return crypto.subtle.importKey('raw', bytesFromB64(PUBLIC_KEY_B64), {name:'Ed25519'}, false, ['verify']);
  }
  async function privateKey(pem) {
    return crypto.subtle.importKey('pkcs8', pemBytes(pem), {name:'Ed25519'}, false, ['sign']);
  }
  function normalizeDeviceId(id) { return String(id || '').replace(/\s+/g,'').toUpperCase(); }
  function parse(code) {
    var s = String(code || '').trim().replace(/[\u200e\u200f\u202a-\u202e\s]/g,'');
    var m = /^DEYN2-([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(s);
    if (!m) return null;
    try {
      var p = JSON.parse(new TextDecoder().decode(fromB64url(m[1])));
      if (!p || p.v !== 2 || typeof p.did !== 'string' || !['1Y','2Y','LT'].includes(p.tier) || !['M','W'].includes(p.role) || typeof p.nonce !== 'string') return null;
      if (!(p.exp === null || (Number.isSafeInteger(p.exp) && p.exp > 0))) return null;
      return {payload:p, payloadBytes:fromB64url(m[1]), signature:fromB64url(m[2]), code:s};
    } catch (_) { return null; }
  }
  async function verify(code, deviceId, now) {
    var parsed = parse(code); if (!parsed || parsed.signature.length !== 64) return null;
    if (parsed.payload.did !== normalizeDeviceId(deviceId)) return null;
    if (parsed.payload.tier === 'LT' && parsed.payload.exp !== null) return null;
    if (parsed.payload.tier !== 'LT' && parsed.payload.exp === null) return null;
    if (parsed.payload.exp !== null && (now || Date.now()) > parsed.payload.exp) return null;
    var ok = await crypto.subtle.verify({name:'Ed25519'}, await publicKey(), parsed.signature, parsed.payloadBytes);
    return ok ? parsed.payload : null;
  }
  async function checkPrivateKey(pem) {
    var key = await privateKey(pem);
    var challenge = encoder.encode('DEYN-KEY-CHECK-v2-' + randomNonce());
    var sig = await crypto.subtle.sign({name:'Ed25519'}, key, challenge);
    var ok = await crypto.subtle.verify({name:'Ed25519'}, await publicKey(), sig, challenge);
    if (!ok) throw new Error('المفتاح الخاص لا يطابق المفتاح العام المدمج في التطبيق');
    return true;
  }
  async function createLicense(options, pem) {
    var did = normalizeDeviceId(options && options.deviceId);
    if (!/^[A-F0-9]{32}$/.test(did)) throw new Error('معرّف الجهاز يجب أن يكون 32 خانة سداسية عشرية');
    var tier = options.tier, role = options.role, exp = null;
    if (!['1Y','2Y','LT'].includes(tier) || !['M','W'].includes(role)) throw new Error('نوع الترخيص غير صحيح');
    if (tier !== 'LT') {
      var date = String(options.expiryDate || '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('اختر تاريخ انتهاء صحيحاً');
      var parts = date.split('-').map(Number);
      var end = new Date(parts[0], parts[1]-1, parts[2], 23, 59, 59, 999);
      if (end.getFullYear() !== parts[0] || end.getMonth() !== parts[1]-1 || end.getDate() !== parts[2] || end.getTime() <= Date.now()) throw new Error('تاريخ الانتهاء يجب أن يكون تاريخاً مستقبلياً صحيحاً');
      exp = end.getTime();
    }
    var payload = {v:2,did:did,tier:tier,role:role,exp:exp,nonce:randomNonce()};
    var bytes = encoder.encode(canonical(payload));
    var sig = await crypto.subtle.sign({name:'Ed25519'}, await privateKey(pem), bytes);
    var code = 'DEYN2-' + b64url(bytes) + '.' + b64url(new Uint8Array(sig));
    if (!(await verify(code, did, Date.now()))) throw new Error('فشل التحقق من الكود المُنشأ');
    return {code:code,payload:payload};
  }
  root.DeynLicenseV2Prototype = {publicKeyBase64:PUBLIC_KEY_B64,normalizeDeviceId:normalizeDeviceId,parse:parse,verify:verify,checkPrivateKey:checkPrivateKey,createLicense:createLicense};
})(typeof window !== 'undefined' ? window : globalThis);
