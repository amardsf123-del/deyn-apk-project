
/* ============ Local sync glue: owner phone listens, worker phone connects (Wi-Fi LAN, no cloud) ============ */
const SYNC = { identity: null, pairing: null, listening: false, ip: null, port: null, running: false, timer: null, backoff: 45000, conns: {}, hooked: false, msg: '' };
const syNative = () => { try { return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.DeynSync) || null; } catch (e) { return null; } };
const syState = () => DeynSyncLib.ensureSync(S, DEYN_DEV_ID);
async function syIdentity() {
  if (SYNC.identity) return SYNC.identity;
  let raw = null; try { raw = await DeynStore.get('syncid'); } catch (e) { raw = null; }
  if (raw) SYNC.identity = DeynSyncLib.Identity.fromJson(raw);
  else { SYNC.identity = await DeynSyncLib.Identity.create(); await DeynStore.set('syncid', SYNC.identity.toJson()); }
  return SYNC.identity;
}
function syCtx() {
  return {
    did: DEYN_DEV_ID, identity: SYNC.identity, licence: DEYN_LIC && DEYN_LIC.code, now: () => Date.now(),
    verifyLicence: async (code, did) => { const p = await deynVerifyCode(code, did); return p ? { role: p.role } : null; },
    getPeer: id => { const p = syState().peers[id]; return p && p.idpub ? p : null; },
    savePeer: (id, rec) => { const sy = syState(); sy.peers[id] = Object.assign(sy.peers[id] || { recv: 0, acked: 0 }, rec); persist(); },
    get pairing() { return SYNC.pairing; },
    sync: {
      prepare: async () => { DeynSyncLib.captureLocal(S, DEYN_DEV_ID, Date.now()); persist(); },
      recvFrom: p => ((syState().peers[p] || {}).recv || 0),
      eventsAfter: (p, r) => DeynSyncLib.eventsAfter(S, DEYN_DEV_ID, r),
      acked: (p, r) => { DeynSyncLib.markAcked(S, DEYN_DEV_ID, p, r); persist(); },
      apply: async (p, role, evs) => {
        if (deynReadOnly()) return { ok: false, reason: 'read-only' };
        const r = DeynSyncLib.applyBatch(S, DEYN_DEV_ID, p, role, evs, Date.now());
        if (r.ok) { if (!persist()) return { ok: false, reason: 'storage' }; await deynFlush(); renderAll(); }   // durable BEFORE the acknowledgement is sent
        return r;
      }
    }
  };
}
const syTransport = connId => ({ send: s => syNative().send({ connId, data: s }), close: () => { try { syNative().close({ connId }); } catch (e) {} } });
function syNote(did, ok, msg) {
  const p = syState().peers[did]; if (!p) return;
  p.lastTry = Date.now(); if (ok) { p.lastSuccess = Date.now(); delete p.lastError; } else p.lastError = String(msg || 'error').slice(0, 120);
  persist();
}
async function syHook() {
  const pl = syNative(); if (!pl || SYNC.hooked) return; SYNC.hooked = true;
  pl.addListener('frame', e => { const s = SYNC.conns[e.connId]; if (s) s.feed(e.data); });
  pl.addListener('closed', e => { const s = SYNC.conns[e.connId]; if (s) s.onClose(); delete SYNC.conns[e.connId]; });
  pl.addListener('accepted', e => {                                    // owner side: a phone connected to us
    const sess = new DeynSyncLib.Session(syTransport(e.connId), syCtx(), 'responder'); SYNC.conns[e.connId] = sess;
    (async () => {
      try { await sess.handshakeResponder(); await sess.exchange(); syNote(sess.peerDid, true); SYNC.msg = 'تمت المزامنة بنجاح ✅'; }
      catch (err) { if (sess.peerDid) syNote(sess.peerDid, false, err.message); SYNC.msg = 'تعذّرت المزامنة: ' + err.message; }
      finally { try { pl.close({ connId: e.connId }); } catch (x) {} delete SYNC.conns[e.connId]; syRefreshUi(); }
    })();
  });
}
async function syStartServer() {
  const pl = syNative(); if (!pl) throw new Error('المزامنة غير متاحة على هذا الجهاز');
  await syIdentity(); await syHook();
  if (SYNC.listening) return;
  const r = await pl.listen({ port: 47821 }); SYNC.port = r.port; SYNC.ip = r.ip; SYNC.listening = true;
}
async function syConnect(peerDid, offer) {
  const pl = syNative(); if (!pl) throw new Error('المزامنة غير متاحة على هذا الجهاز');
  if (SYNC.running) return false; SYNC.running = true;
  let connId = null, sess = null;
  try {
    await syIdentity(); await syHook();
    const target = offer ? { ip: offer.ip, port: offer.port } : syState().peers[peerDid];
    if (!target || !target.ip) throw new Error('عنوان المالك غير معروف: أعد الاقتران بمسح رمز QR');
    const c = await pl.connect({ ip: target.ip, port: target.port }); connId = c.connId;
    sess = new DeynSyncLib.Session(syTransport(connId), syCtx(), 'initiator'); SYNC.conns[connId] = sess;
    await sess.handshakeInitiator({ offer: offer || null });
    if (offer) { const p = syState().peers[sess.peerDid]; p.ip = offer.ip; p.port = offer.port; }
    const res = await sess.exchange(); syNote(sess.peerDid, true);
    SYNC.msg = 'تمت المزامنة ✅ (أُرسل ' + res.sent + ' • استُلم ' + res.received + ')'; SYNC.backoff = 45000; return true;
  } catch (err) {
    const did = (sess && sess.peerDid) || peerDid; if (did && syState().peers[did]) syNote(did, false, err.message);
    SYNC.msg = 'تعذّرت المزامنة: ' + err.message + ' — ستُعاد المحاولة تلقائيًا'; SYNC.backoff = Math.min(SYNC.backoff * 2, 300000); return false;
  } finally { if (connId) { try { pl.close({ connId }); } catch (x) {} delete SYNC.conns[connId]; } SYNC.running = false; syRefreshUi(); }
}
function syPeers() { const sy = syState(); return Object.keys(sy.peers).filter(id => sy.peers[id].idpub).map(id => Object.assign({ did: id }, sy.peers[id])); }
function syLoop() {
  clearTimeout(SYNC.timer);
  SYNC.timer = setTimeout(async () => {
    try { if (S && !deynReadOnly() && isWorkerDevice() && !document.hidden) { const m = syPeers().find(p => p.role === 'M'); if (m) await syConnect(m.did, null); } } catch (e) { console.warn('sync loop', e); }
    syLoop();
  }, SYNC.backoff);
}
let SYDEB = null;
function sySchedule() { if (!S || !syPeers().length || !isWorkerDevice()) return; clearTimeout(SYDEB); SYDEB = setTimeout(() => { const m = syPeers().find(p => p.role === 'M'); if (m) syConnect(m.did, null); }, 4000); }
async function syInit() {                                              // called once after the app has started
  try { DeynSyncLib.ensureSync(S, DEYN_DEV_ID); if (!syNative()) return; await syIdentity(); await syHook(); if (!isWorkerDevice() && syPeers().length) await syStartServer(); syLoop(); } catch (e) { console.warn('sync init failed', e); }
}
// ---- UI ----
const syAgo = t => { if (!t) return 'لم تنجح بعد'; const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'قبل لحظات' : m < 60 ? 'قبل ' + m + ' دقيقة' : m < 1440 ? 'قبل ' + Math.round(m / 60) + ' ساعة' : 'قبل ' + Math.round(m / 1440) + ' يوم'; };
function syRefreshUi() { if (document.getElementById('syncBody')) { const b = document.getElementById('syncBody'); b.innerHTML = syBodyHtml(); } }
function syBodyHtml() {
  const owner = !isWorkerDevice(), peers = syPeers(), sy = syState();
  const rows = peers.map(p => { const pend = DeynSyncLib.pendingCount(S, DEYN_DEV_ID, p.did); return `<div class="row-set"><div><b>${p.role === 'W' ? 'هاتف العامل' : 'هاتف المالك'} ••${esc(p.did.slice(-4))}</b><small>آخر نجاح: ${syAgo(p.lastSuccess)} • بانتظار الإرسال: ${pend}${p.lastError ? '<br>آخر خطأ: ' + esc(p.lastError) : ''}</small></div>${owner ? `<button type="button" class="btn sm" data-act="syncUnpair" data-id="${esc(p.did)}" style="height:34px;font-size:12px;padding:0 12px">إلغاء</button>` : ''}</div>`; }).join('');
  const quarantined = (sy.quarantine || []).length;
  let h = rows || '<div class="sub">لا يوجد هاتف مقترن بعد.</div>';
  if (quarantined) h += `<div class="sub" style="color:#b45309">⚠️ تم تجاهل ${quarantined} تعديلًا من هاتف العامل لتجاوزه الصلاحيات.</div>`;
  if (SYNC.msg) h += `<div class="sub" id="syncMsg">${esc(SYNC.msg)}</div>`;
  if (owner) {
    h += `<button type="button" class="btn pri block" data-act="syncPairShow" style="margin-top:12px">إظهار رمز QR لاقتران هاتف العامل</button><div id="syncQr"></div>`;
  } else {
    h += `<label class="lbl" for="syncOffer" style="margin-top:12px">رمز الاقتران (امسح QR من هاتف المالك أو الصقه هنا)</label>
      <textarea class="inp" id="syncOffer" rows="3" style="direction:ltr;text-align:left;height:auto" placeholder="DEYNPAIR1:..." spellcheck="false" autocomplete="off"></textarea>
      <div style="display:flex;gap:8px;margin-top:8px"><button type="button" class="btn pri" data-act="syncPairStart" style="flex:1">اقتران</button>${(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BarcodeScanner) ? '<button type="button" class="btn" data-act="syncScan" style="flex:1">📷 مسح QR</button>' : ''}</div>`;
    if (peers.length) h += `<button type="button" class="btn block" data-act="syncNow" style="margin-top:10px">مزامنة الآن</button>`;
  }
  if (owner && peers.length) h += `<button type="button" class="btn block" data-act="syncNow" style="margin-top:8px" disabled title="العامل هو من يبدأ الاتصال">المزامنة تتم تلقائيًا عند اتصال هاتف العامل</button>`;
  return h;
}
function openSyncModal() {
  openModal(() => `${sheetHead('المزامنة بين الهاتفين')}<div class="sub">تتم عبر شبكة Wi-Fi المحلية فقط ومشفّرة من طرف إلى طرف، دون خادم سحابي. يعمل التطبيق دون إنترنت دائمًا، وتُرسل التغييرات عند توفر الاتصال.</div><div id="syncBody">${syBodyHtml()}</div>`);
  if (!syNative()) { const b = document.getElementById('syncBody'); if (b) b.insertAdjacentHTML('afterbegin', '<div class="sub" style="color:#b91c1c">المزامنة غير متاحة في هذا الإصدار/الجهاز.</div>'); }
}
let SYQR_TIMER = null;
async function syPairShow() {
  if (!requireOwner('إقران هاتف جديد')) return;
  try {
    await syStartServer();
    if (!SYNC.ip) throw new Error('لا يوجد اتصال Wi-Fi محلي. اتصل بنفس شبكة الواي فاي ثم أعد المحاولة');
    const idn = await syIdentity();
    const o = DeynSyncLib.makeOffer({ did: DEYN_DEV_ID, idpub: idn.pub, ip: SYNC.ip, port: SYNC.port, now: Date.now() }); SYNC.pairing = o.state;
    const box = lastById('syncQr'); if (!box) return;
    box.innerHTML = `<div style="background:#fff;padding:8px;border-radius:12px;margin-top:12px;max-width:320px;margin-inline:auto">${DeynSyncLib.qrSvg(o.text, 4)}</div>
      <div class="sub" id="syncQrTimer" style="text-align:center">الرمز صالح 5 دقائق ولاستخدام واحد</div>
      <textarea class="inp" id="syncOfferText" rows="3" readonly style="direction:ltr;text-align:left;height:auto;font-size:11px">${esc(o.text)}</textarea>`;
    clearInterval(SYQR_TIMER); SYQR_TIMER = setInterval(() => { const t = document.getElementById('syncQrTimer'); if (!t) { clearInterval(SYQR_TIMER); return; } const left = Math.max(0, Math.round((SYNC.pairing.expiresAt - Date.now()) / 1000)); t.textContent = SYNC.pairing.used ? 'تم استخدام الرمز ✅' : left ? 'ينتهي بعد ' + left + ' ثانية' : 'انتهت صلاحية الرمز'; if (!left || SYNC.pairing.used) { clearInterval(SYQR_TIMER); syRefreshUi(); } }, 1000);
  } catch (e) { toast(e.message, 'err'); }
}
async function syPairStart() {
  const inp = lastById('syncOffer'); if (!inp) return;
  const offer = DeynSyncLib.parseOffer(inp.value);
  if (!offer) return toast('رمز الاقتران غير صالح', 'err');
  if (!isWorkerDevice()) return toast('الاقتران يتم من هاتف العامل فقط', 'err');
  const go = async () => { toast('جارٍ الاقتران…'); const ok = await syConnect(offer.did, offer); toast(ok ? 'تم الاقتران والمزامنة بنجاح ✅' : 'تعذّر الاقتران — تأكد من الشبكة ومن أن الرمز لم ينتهِ', ok ? 'ok' : 'err'); if (ok) syLoop(); syRefreshUi(); };
  if (DeynSyncLib.isPristineDemo(S)) return confirmBox({ title: 'بيانات هذا الهاتف تجريبية', msg: 'سيتم استبدال البيانات التجريبية ببيانات هاتف المالك. هل تريد المتابعة؟', ok: 'متابعة', onOk: () => { DeynSyncLib.discardPristineDemo(S, DEYN_DEV_ID); persist(); renderAll(); go(); } });
  go();
}
async function syScan() { try { const r = await window.Capacitor.Plugins.BarcodeScanner.scan(); const v = r && r.barcodes && r.barcodes[0] && r.barcodes[0].rawValue; if (v) { const i = lastById('syncOffer'); if (i) i.value = v; syPairStart(); } } catch (e) { toast('تعذّر مسح الرمز: ' + e.message, 'err'); } }
function syNow() { const m = syPeers().find(p => p.role === 'M'); if (!m) return toast('لا يوجد هاتف مالك مقترن', 'err'); syConnect(m.did, null).then(ok => { toast(ok ? 'تمت المزامنة ✅' : 'تعذّرت المزامنة', ok ? 'ok' : 'err'); }); }
function syUnpair(id) { if (!requireOwner('إلغاء الاقتران')) return; confirmBox({ title: 'إلغاء الاقتران', msg: 'لن يتمكن هذا الهاتف من المزامنة بعد الآن. لن تُحذف أي بيانات من أي هاتف.', ok: 'إلغاء الاقتران', danger: true, onOk: () => { const sy = syState(); delete sy.peers[id]; persist(); syRefreshUi(); } }); }
