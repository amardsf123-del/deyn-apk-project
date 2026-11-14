/* DEYN_COMPLETION_RUNTIME_V2 */
/* Implements verified fixes for:
   1. Strict M/W license role separation: DEYN3 license alone determines device role; manual role switching (M->W or W->M) is completely disabled.
   2. Automatic external JSON backup (SAF via DeynBackupPlugin): full state fingerprint (customers, debts/payments, pending, trash, categories, guaranteed, settings, smsLog, notifLog, seq), strict external-write verification before updating lastAutoBackupHash, clear failure reporting, and retry support.
   3. Backup Restore: automatic fallback from corrupt/unreadable deyn-auto-backup.json to deyn-auto-backup.prev.json, atomic validation before state mutation, stripping of passwords/roles/licenses, device-bound DEYN3 license verification, and verified storage flush before announcing success.
   4. Clock protection: Android SystemClock.elapsedRealtime() monotonic anchor integration + timezone-shift immunity + interactive warning banner ("لاحقاً" / "حسناً") + clearing warnings only upon genuine time verification.
   5. Persistent notification history log (Read/Unread) + automatic cancellation/updating of scheduled WorkManager notifications when debts are paid or modified.
   6. French UI button layout fix ("Gérer le mot de passe" wrapping) & large DZD amount display protection.
*/
(function () {
  'use strict';

  const isFr = () => typeof DEYN_I18N !== 'undefined' && DEYN_I18N.lang === 'fr';
  const tr = s => (typeof DEYN_I18N !== 'undefined' && typeof DEYN_I18N.tr === 'function') ? DEYN_I18N.tr(s) : s;
  const escHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ============================================================================
  // 6. UI & CSS FIXES (French button wrapping + Large DZD amount display)
  // ============================================================================
  function injectCompletionStyles() {
    if (document.getElementById('deyn-completion-styles-v2')) return;
    const st = document.createElement('style');
    st.id = 'deyn-completion-styles-v2';
    st.textContent = [
      '.row-set{align-items:center;gap:12px}',
      '.row-set > div:first-child{flex:1 1 0;min-width:0}',
      '.row-set .btn.sm{height:auto!important;min-height:36px;padding:6px 12px!important;white-space:normal!important;text-align:center;line-height:1.3;max-width:46%;flex:0 1 auto;word-break:break-word;overflow-wrap:anywhere}',
      '.amount,.hx-amt,.v-amt,.hero-bal .v{flex-wrap:wrap;max-width:100%;overflow-wrap:anywhere;word-break:break-word}',
      '.c-bal b,.rk-amt .num,.ds-v .num,.kp-v .num{overflow-wrap:anywhere;word-break:break-all}',
      '.ag-restore-link{margin-top:8px;font-size:12.5px;font-weight:600;color:#065043;opacity:0.86;text-decoration:underline;background:transparent;border:0;padding:4px 10px;cursor:pointer;z-index:2;position:relative}',
      '.ag-restore-link:active{opacity:1;transform:scale(0.98)}',
      '.notif-tabs{display:flex;gap:6px;margin:8px 0 12px}',
      '.notif-item.unread{border-inline-start:4px solid #065043;background:#f0fdf4}',
      '.notif-item.read{opacity:0.82;background:#f8fafc}',
      '#deynTimeBanner{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}',
      '#deynTimeBanner .tb-actions{display:flex;gap:6px;margin-inline-start:auto}',
      '#deynTimeBanner .tb-btn{background:rgba(255,255,255,0.2);color:#fff;border:1px solid rgba(255,255,255,0.45);border-radius:8px;padding:3px 10px;font-size:11.5px;font-weight:700;cursor:pointer}'
    ].join('\n');
    document.head.appendChild(st);
  }
  injectCompletionStyles();

  // ============================================================================
  // 1. STRICT M/W ROLE ENFORCEMENT (License role alone determines device role)
  // ============================================================================
  window.isWorkerDevice = function () {
    if (window.DEYN_LIC && (window.DEYN_LIC.role === 'M' || window.DEYN_LIC.role === 'W')) {
      return window.DEYN_LIC.role === 'W';
    }
    return !!(typeof S !== 'undefined' && S && S.auth && S.auth.licRole === 'W');
  };

  window.applyLicenseRole = function () {
    var L = window.DEYN_LIC;
    if (!L || typeof S === 'undefined' || !S) return;
    if (!S.auth) S.auth = {};
    S.auth.licRole = L.role === 'W' ? 'W' : 'M';
    S.auth.deviceRole = L.role === 'W' ? 'worker' : 'master';
    if (L.role === 'M') S.auth.masterCode = L.code;
    else if (L.role === 'W') S.auth.assistantCode = L.code;
    if (L.exp) {
      var d = new Date(L.exp - 3600000);
      S.auth.expiry = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
    } else {
      S.auth.expiry = 'مدى الحياة';
    }
  };

  // Completely disable manual in-app role switching in both directions (M->W and W->M).
  // Changing a device's role requires activating a new DEYN3 license issued by deyn-keygen.
  const blockRoleSwitch = function () {
    toast(tr('نوع الترخيص (M أو W) يحدد صلاحيات الجهاز ولا يمكن تغيير الدور من داخل التطبيق 🔒'), 'err');
    return false;
  };
  window.openSwitchToOwnerModal = blockRoleSwitch;
  window.submitSwitchToOwner = async function () { return blockRoleSwitch(); };
  if (typeof A === 'object' && A) {
    A.switchDeviceRole = blockRoleSwitch;
    A.ownerSwitchSubmit = blockRoleSwitch;
  }
  if (typeof READONLY_OK !== 'undefined' && READONLY_OK && typeof READONLY_OK.delete === 'function') {
    READONLY_OK.delete('switchDeviceRole');
    READONLY_OK.delete('ownerSwitchSubmit');
  }

  // ============================================================================
  // 4. CLOCK PROTECTION COMPLETION (Monotonic Anchor + Timezone Immunity + Actions)
  // ============================================================================
  let LAST_TZ_OFFSET = new Date().getTimezoneOffset();
  let DISMISSED_EPISODE_WARN = 0;
  let NATIVE_MONO_OFFSET_MS = null; // wallMs - elapsedRealtimeMs anchored when clock is healthy

  function getMonotonicNowMs() {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now();
    }
    return 0;
  }

  // Refresh native Android SystemClock.elapsedRealtime() anchor when available
  async function syncNativeMonotonicClock() {
    try {
      const bp = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.DeynBackup) || null;
      if (bp && typeof bp.getMonotonicTime === 'function') {
        const r = await bp.getMonotonicTime();
        if (r && Number.isFinite(r.elapsedRealtimeMs) && r.elapsedRealtimeMs > 0) {
          const wallNow = Date.now();
          if (NATIVE_MONO_OFFSET_MS === null && DEYN_TP && DEYN_TP.status === 'OK') {
            NATIVE_MONO_OFFSET_MS = wallNow - r.elapsedRealtimeMs;
          }
          return r.elapsedRealtimeMs;
        }
      }
    } catch (e) {}
    return null;
  }

  const origEvaluate = window.evaluate;
  window.evaluate = function (prev, obs, opts = {}) {
    const tol = opts.tolerance ?? (typeof TOLERANCE_MS !== 'undefined' ? TOLERANCE_MS : 5 * 60 * 1000);
    const grace = opts.grace ?? (typeof GRACE_MS !== 'undefined' ? GRACE_MS : 48 * 3600 * 1000);
    const afterGrace = opts.afterGrace ?? 'READ_ONLY';

    const sIn = { ...(prev || {}) };
    const now = obs.now;
    let effectiveObs = { ...obs };
    const perfNow = getMonotonicNowMs();

    // Anchor lastValidWall and lastValidPerf ONLY when status is OK (no active episode) and no abnormal forward/backward jump occurred
    if (!sIn.episode) {
      if (sIn.lastSeen === 0 || (now >= sIn.lastSeen - tol && (now - sIn.lastSeen) <= Math.max(tol, 15 * 60 * 1000))) {
        sIn.lastValidWall = now;
        sIn.lastValidPerf = perfNow;
      } else if (!sIn.lastValidWall && sIn.lastSeen > 0) {
        sIn.lastValidWall = sIn.lastSeen;
        sIn.lastValidPerf = perfNow;
      }
    }

    // When offline (obs.trusted == null):
    // 1) If the user explicitly clicked "حسناً" (allowMonotonicRecovery: true) AND restored the clock to match
    //    the pre-tamper monotonic timeline (lastValidWall + elapsed monotonic time within tolerance), supply that reference.
    if (sIn.episode && effectiveObs.trusted == null && opts.allowMonotonicRecovery && sIn.lastValidWall && Number.isFinite(sIn.lastValidPerf)) {
      const elapsedMs = Math.max(0, perfNow - sIn.lastValidPerf);
      const expectedReal = sIn.lastValidWall + elapsedMs;
      if (Math.abs(now - expectedReal) <= tol) {
        effectiveObs.trusted = expectedReal;
      }
    }

    const res = origEvaluate(sIn, effectiveObs, { tolerance: tol, grace, afterGrace });
    if (sIn.lastValidWall) {
      res.state.lastValidWall = res.status === 'OK' ? now : sIn.lastValidWall;
      res.state.lastValidPerf = res.status === 'OK' ? perfNow : sIn.lastValidPerf;
    }
    return res;
  };

  // Interactive banner with "لاحقاً" (Later) and "حسناً" (OK / Verify now) buttons
  window.deynBanner = function (txt, kind) {
    var el = document.getElementById('deynTimeBanner');
    if (!txt) {
      if (el) el.remove();
      return;
    }
    var warnKey = (DEYN_TP && DEYN_TP.status) + ':' + (DEYN_TP && DEYN_TP.state && DEYN_TP.state.warnings);
    if (kind === 'w' && DISMISSED_EPISODE_WARN === warnKey) {
      if (el) el.remove();
      return;
    }
    if (!el) {
      el = document.createElement('div');
      el.id = 'deynTimeBanner';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:100003;padding:8px 12px;font:700 12px/1.6 system-ui,sans-serif;direction:' + (isFr() ? 'ltr' : 'rtl') + ';color:#fff;background:' + (kind === 'ro' ? '#b91c1c' : '#b45309') + ';display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap';
    const displayTxt = isFr() ? tr(txt) : txt;
    el.innerHTML = `<span id="deynTimeBannerText" style="flex:1;min-width:180px">${escHtml(displayTxt)}</span>` +
      `<div class="tb-actions" style="display:flex;gap:6px">` +
      `<button type="button" class="tb-btn" id="deynTbLater">${escHtml(tr('لاحقاً'))}</button>` +
      `<button type="button" class="tb-btn" id="deynTbOk" style="background:#fff;color:#0f172a;border-color:#fff">${escHtml(tr('حسناً'))}</button>` +
      `</div>`;
    const btnLater = document.getElementById('deynTbLater');
    const btnOk = document.getElementById('deynTbOk');
    if (btnLater) {
      btnLater.onclick = function () {
        if (DEYN_TP && DEYN_TP.status !== 'READ_ONLY') {
          DISMISSED_EPISODE_WARN = warnKey;
          el.remove();
        } else {
          toast(tr('انتهت مهلة الـ 48 ساعة، يرجى ضبط الساعة والضغط على حسناً للتحقق'), 'warn');
        }
      };
    }
    if (btnOk) {
      btnOk.onclick = async function () {
        DISMISSED_EPISODE_WARN = 0;
        await window.deynVerifyClockFixed();
      };
    }
  };

  window.deynVerifyClockFixed = async function () {
    const gotRemote = await deynFetchTrustedTime();
    if (!gotRemote && DEYN_TP && DEYN_TP.state) {
      const res = window.evaluate(DEYN_TP.state, { now: Date.now(), trusted: deynTrustedObs() }, { allowMonotonicRecovery: true });
      DEYN_TP.state = res.state;
      DEYN_TP.status = res.status;
      DEYN_TP.graceLeftMs = res.graceLeftMs;
      DEYN_TP.warningNo = res.warningNo || DEYN_TP.warningNo;
      DEYN_LAST = res.state.lastSeen;
      deynTpUi(res);
      await DeynStore.set('tp', JSON.stringify(res.state)).catch(() => {});
    }
    if (DEYN_TP && DEYN_TP.status === 'OK') {
      toast(tr('تم التحقق من صحة الساعة وإزالة التحذير بنجاح ✅'), 'ok');
      return true;
    }
    toast(tr('الساعة لا تزال غير مطابقة للوقت الحقيقي أو يلزم الاتصال بالإنترنت للتحقق'), 'warn');
    return false;
  };

  const origClockTick = window.deynClockTick;
  window.deynClockTick = function (force) {
    if (!DEYN_TP || !DEYN_TP.state) return true;
    const curTz = new Date().getTimezoneOffset();
    if (curTz !== LAST_TZ_OFFSET) {
      LAST_TZ_OFFSET = curTz;
    }
    const prevWarn = DEYN_TP.state.warnings;
    const r = origClockTick(force);
    if (DEYN_TP.state.warnings !== prevWarn) {
      DISMISSED_EPISODE_WARN = 0;
    }
    return r;
  };

  // ============================================================================
  // 2 & 3. AUTOMATIC EXTERNAL BACKUP & LICENSE-BOUND JSON RESTORE
  // ============================================================================
  const backupPlug = () => (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.DeynBackup) || null;
  const BACKUP_FORMAT = 'DEYN-BACKUP-V2';
  let autoBackupTimer = null;
  let autoBackupRetryTimer = null;
  let lastAutoBackupHash = '';
  let lastAutoBackupStatus = { ok: false, reason: 'not_run' };

  function buildBackupEnvelope() {
    if (typeof S === 'undefined' || !S || !Array.isArray(S.customers) || !Array.isArray(S.pending)) return null;
    const cleanState = JSON.parse(JSON.stringify(S));
    // Strip sensitive credentials, license tokens, and role elevation fields so JSON can NEVER transfer privileges or secrets
    if (cleanState.auth) {
      delete cleanState.auth.masterPass;
      delete cleanState.auth.masterCode;
      delete cleanState.auth.assistantCode;
      delete cleanState.auth.pw;
      delete cleanState.auth.pwFail;
      delete cleanState.auth.pwMustSet;
      delete cleanState.auth.pwMigrated;
      delete cleanState.auth.licRole;
      delete cleanState.auth.deviceRole;
    }
    delete cleanState.sync;
    return {
      format: BACKUP_FORMAT,
      version: 2,
      appVersion: '1.0.0',
      exportedAt: Date.now(),
      deviceId: String(window.DEYN_DEV_ID || ''),
      summary: {
        customersCount: cleanState.customers.length,
        pendingCount: cleanState.pending.length,
        trashCount: Array.isArray(cleanState.trash) ? cleanState.trash.length : 0
      },
      data: cleanState
    };
  }

  /**
   * Computes a comprehensive deterministic fingerprint covering ALL merchant data fields:
   * customers (and all their transactions/extensions), pending tickets, trash/archive,
   * customSegs, deletedSegs, guaranteed flags, settings, smsLog, notifLog, and seq.
   */
  function computeBackupFingerprint(data) {
    if (!data || typeof data !== 'object') return '';
    return JSON.stringify({
      seq: data.seq || 0,
      customers: data.customers || [],
      pending: data.pending || [],
      trash: data.trash || [],
      customSegs: data.customSegs || {},
      deletedSegs: data.deletedSegs || [],
      guaranteed: data.guaranteed || {},
      settings: data.settings || {},
      smsLog: data.smsLog || {},
      notifLog: data.notifLog || {}
    });
  }

  function validateBackupPayload(rawText) {
    if (typeof rawText !== 'string' || !rawText.trim()) {
      return { ok: false, reason: 'ملف النسخة الاحتياطية فارغ أو غير صالح' };
    }
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      return { ok: false, reason: 'ملف JSON تالف ولا يمكن قراءته' };
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, reason: 'بنية ملف النسخة الاحتياطية غير متوافقة' };
    }
    const isEnvelope = parsed.format === BACKUP_FORMAT || (parsed.version === 2 && parsed.data && typeof parsed.data === 'object');
    const stateObj = isEnvelope ? parsed.data : parsed;
    const metaDevId = isEnvelope && typeof parsed.deviceId === 'string'
      ? parsed.deviceId
      : (parsed.__backupMeta && typeof parsed.__backupMeta.deviceId === 'string' ? parsed.__backupMeta.deviceId : '');
    const originDeviceId = metaDevId ? metaDevId.trim().toLowerCase() : null;

    if (!stateObj || typeof stateObj !== 'object' || !Array.isArray(stateObj.customers) || !Array.isArray(stateObj.pending)) {
      return { ok: false, reason: 'ملف النسخة الاحتياطية لا يحتوي على سجلات الزبائن والتذاكر المطلوبة' };
    }

    const seenCustIds = new Set();
    const seenTxIds = new Set();
    for (let i = 0; i < stateObj.customers.length; i++) {
      const c = stateObj.customers[i];
      if (!c || typeof c !== 'object' || typeof c.id !== 'string' || !c.id.trim() || typeof c.name !== 'string' || !c.name.trim()) {
        return { ok: false, reason: `بيانات الزبون رقم ${i + 1} في الملف تالفة أو ناقصة` };
      }
      if (seenCustIds.has(c.id)) {
        return { ok: false, reason: 'ملف النسخة الاحتياطية يحتوي على معرفات زبائن مكررة' };
      }
      seenCustIds.add(c.id);
      if (c.tx !== undefined && !Array.isArray(c.tx)) {
        return { ok: false, reason: `سجل عمليات الزبون «${c.name}» غير صالح` };
      }
      for (const tx of (c.tx || [])) {
        if (!tx || typeof tx !== 'object' || typeof tx.id !== 'string' || !tx.id.trim() || !['debt', 'pay'].includes(tx.type) || !Number.isFinite(Number(tx.amount)) || Number(tx.amount) < 0) {
          return { ok: false, reason: `عملية مالية تالفة في حساب «${c.name}»` };
        }
        if (seenTxIds.has(tx.id)) {
          return { ok: false, reason: 'ملف النسخة الاحتياطية يحتوي على معرفات عمليات مكررة' };
        }
        seenTxIds.add(tx.id);
      }
    }
    for (let i = 0; i < stateObj.pending.length; i++) {
      const p = stateObj.pending[i];
      if (!p || typeof p !== 'object' || typeof p.id !== 'string' || !p.id.trim() || !Number.isFinite(Number(p.amount)) || Number(p.amount) < 0) {
        return { ok: false, reason: `بيانات التذكرة المعلقة رقم ${i + 1} تالفة` };
      }
    }
    if (stateObj.trash !== undefined && !Array.isArray(stateObj.trash)) {
      return { ok: false, reason: 'سجل سلة المهملات في النسخة الاحتياطية غير صالح' };
    }

    return {
      ok: true,
      originDeviceId,
      stateObj: JSON.parse(JSON.stringify(stateObj)),
      customersCount: stateObj.customers.length,
      pendingCount: stateObj.pending.length
    };
  }

  function scheduleAutoBackupRetry(delayMs = 15000) {
    clearTimeout(autoBackupRetryTimer);
    autoBackupRetryTimer = setTimeout(() => {
      runAutoBackupNow();
    }, delayMs);
  }

  /**
   * Executes an automatic external backup to the user-selected Android SAF folder.
   * NEVER reports success or updates lastAutoBackupHash unless DeynBackupPlugin confirms
   * the external file was atomically written, synced, and verified.
   */
  async function runAutoBackupNow(opts = {}) {
    try {
      const env = buildBackupEnvelope();
      if (!env) {
        lastAutoBackupStatus = { ok: false, reason: 'no_state', retryable: true };
        return lastAutoBackupStatus;
      }
      const fingerprint = computeBackupFingerprint(env.data);
      if (!opts.force && fingerprint === lastAutoBackupHash && lastAutoBackupStatus.ok) {
        return { ok: true, skipped: true, at: lastAutoBackupStatus.at };
      }

      const jsonStr = JSON.stringify(env, null, 2);
      window.__deynLastAutoBackupJson = jsonStr;

      const bp = backupPlug();
      if (!bp || typeof bp.writeAutoBackup !== 'function') {
        // Native Android SAF plugin is unavailable: return explicit failure, do NOT update lastAutoBackupHash
        lastAutoBackupStatus = { ok: false, reason: 'plugin_unavailable', retryable: true };
        return lastAutoBackupStatus;
      }

      const res = await bp.writeAutoBackup({ data: jsonStr });
      if (res && res.ok === true) {
        clearTimeout(autoBackupRetryTimer);
        lastAutoBackupHash = fingerprint;
        lastAutoBackupStatus = {
          ok: true,
          at: res.at || Date.now(),
          seq: res.seq || 0,
          bytes: res.bytes || jsonStr.length
        };
        if (S && S.settings) S.settings.lastAutoBackupAt = lastAutoBackupStatus.at;
        return lastAutoBackupStatus;
      }

      // External write did not succeed (no_folder, permission_lost, or write_error):
      // Do NOT update lastAutoBackupHash, preserve retry capability, and surface appropriate warning
      const reason = (res && res.reason) || 'write_error';
      lastAutoBackupStatus = {
        ok: false,
        reason,
        error: (res && res.error) || '',
        retryable: true
      };
      if (reason === 'write_error') {
        toast(tr('تعذّر تحديث النسخة الاحتياطية الخارجية (تحقق من مساحة الهاتف أو المجلد). آخر نسخة سليمة محفوظة ⚠️'), 'warn');
        scheduleAutoBackupRetry(15000);
      } else if (reason === 'permission_lost') {
        toast(tr('فُقد إذن الوصول إلى مجلد النسخ الاحتياطي الخارجي — يرجى إعادة اختيار المجلد من الإعدادات ⚠️'), 'warn');
      }
      return lastAutoBackupStatus;
    } catch (e) {
      const errMsg = String((e && e.message) || e);
      lastAutoBackupStatus = { ok: false, reason: 'exception', error: errMsg, retryable: true };
      scheduleAutoBackupRetry(15000);
      return lastAutoBackupStatus;
    }
  }

  function scheduleAutoBackup() {
    clearTimeout(autoBackupTimer);
    autoBackupTimer = setTimeout(() => { runAutoBackupNow(); }, 350);
  }

  /**
   * Reads and validates the external SAF auto-backup.
   * Tries the primary file ("deyn-auto-backup.json") first; if reading fails OR its JSON content is corrupt/invalid,
   * automatically falls back to the previous backup ("deyn-auto-backup.prev.json") and validates it.
   */
  async function readValidatedAutoBackupFromSaf() {
    const bp = backupPlug();
    if (!bp || typeof bp.readAutoBackup !== 'function') {
      return { ok: false, reason: 'إضافة النسخ الاحتياطي لأندرويد غير متاحة في هذه البيئة' };
    }
    // 1. Try primary backup first (note: DeynBackupPlugin.readAutoBackup already falls back to .prev.json if main is unreadable/corrupt at JSON level)
    let primaryErr = '';
    try {
      const r1 = await bp.readAutoBackup({ preferPrev: false });
      if (r1 && r1.data) {
        const v1 = validateBackupPayload(r1.data);
        if (v1.ok) {
          return Object.assign({}, v1, {
            rawText: r1.data,
            source: r1.source || 'deyn-auto-backup.json',
            fallbackUsed: !!r1.fallbackUsed
          });
        }
        primaryErr = v1.reason;
      }
    } catch (e) {
      primaryErr = String((e && e.message) || e);
    }

    // 2. If primary failed deep schema validation in validateBackupPayload, explicitly request .prev.json
    try {
      const r2 = await bp.readAutoBackup({ preferPrev: true });
      if (r2 && r2.data) {
        const v2 = validateBackupPayload(r2.data);
        if (v2.ok) {
          return Object.assign({}, v2, {
            rawText: r2.data,
            source: r2.source || 'deyn-auto-backup.prev.json',
            fallbackUsed: true
          });
        }
        return { ok: false, reason: v2.reason };
      }
    } catch (e2) {
      return { ok: false, reason: primaryErr || String((e2 && e2.message) || e2) };
    }
    return { ok: false, reason: primaryErr || 'لم يتم العثور على نسخة احتياطية صالحة في المجلد المختار' };
  }

  const origBackupFn = window.backup;
  window.backup = function () {
    try {
      const env = buildBackupEnvelope();
      if (!env) return origBackupFn();
      const payload = Object.assign({}, env.data, {
        __backupMeta: {
          format: BACKUP_FORMAT,
          version: 2,
          deviceId: env.deviceId,
          exportedAt: env.exportedAt
        }
      });
      const b = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      const d = new Date();
      a.download = `deyn-backup-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
    } catch (e) {
      toast(tr('تعذّر تحميل النسخة'), 'err');
    }
  };
  if (typeof A === 'object' && A) A.backup = window.backup;

  /**
   * Atomically applies a validated backup payload ONLY after cryptographic DEYN3 license verification succeeds.
   * Never imports passwords, licenses, or M/W role fields from JSON, and verifies durable storage persistence
   * (including awaiting DeynVault flush) before declaring success.
   */
  async function applyVerifiedRestore(validated, verifiedLic) {
    if (!validated || !validated.ok || !verifiedLic || !verifiedLic.role) {
      throw new Error(tr('بيانات الاستعادة أو الترخيص غير صالحة'));
    }
    const previousSnapshot = (typeof S !== 'undefined' && S) ? JSON.parse(JSON.stringify(S)) : null;
    const previousLic = window.DEYN_LIC || null;
    try {
      const incoming = JSON.parse(JSON.stringify(validated.stateObj));
      // Strip any auth/role/password/license fields that might exist inside incoming stateObj
      delete incoming.auth;
      delete incoming.sync;

      const preservedAuth = (typeof S !== 'undefined' && S && S.auth) ? JSON.parse(JSON.stringify(S.auth)) : {
        phone: '0555 12 34 56',
        pwMustSet: true,
        maxDevices: 2
      };
      const cleanIncomingSettings = (incoming.settings && typeof incoming.settings === 'object' && !Array.isArray(incoming.settings))
        ? Object.assign({}, incoming.settings)
        : {};
      // Never allow imported settings to enable appLock if the current device has no password set
      if (!preservedAuth.pw) {
        delete cleanIncomingSettings.appLockEnabled;
      }
      const preservedSettings = Object.assign(
        { dialect: true, sound: true, notifs: true, assistantStatsLocked: true },
        (typeof S !== 'undefined' && S && S.settings) || {},
        cleanIncomingSettings
      );

      const nextState = {
        seq: Number.isInteger(incoming.seq) && incoming.seq > 0
          ? incoming.seq
          : (Math.max(0, ...incoming.pending.map(t => Number(t.no) || 0)) + 1),
        settings: preservedSettings,
        auth: preservedAuth,
        customers: incoming.customers,
        pending: incoming.pending,
        trash: Array.isArray(incoming.trash) ? incoming.trash : [],
        customSegs: (incoming.customSegs && typeof incoming.customSegs === 'object' && !Array.isArray(incoming.customSegs)) ? incoming.customSegs : {},
        deletedSegs: Array.isArray(incoming.deletedSegs) ? incoming.deletedSegs : [],
        guaranteed: (incoming.guaranteed && typeof incoming.guaranteed === 'object' && !Array.isArray(incoming.guaranteed)) ? incoming.guaranteed : {},
        smsLog: (incoming.smsLog && typeof incoming.smsLog === 'object' && !Array.isArray(incoming.smsLog)) ? incoming.smsLog : {},
        notifLog: (incoming.notifLog && typeof incoming.notifLog === 'object' && !Array.isArray(incoming.notifLog)) ? incoming.notifLog : {}
      };

      // Bind the verified license role strictly from the cryptographic DEYN3 token
      window.DEYN_LIC = verifiedLic;
      DEYN_LIC = verifiedLic;
      S = nextState;
      window.applyLicenseRole();
      if (typeof DeynSyncLib !== 'undefined' && DEYN_DEV_ID) {
        DeynSyncLib.ensureSync(S, DEYN_DEV_ID);
        DeynSyncLib.resnapshot(S, DEYN_DEV_ID);
      }

      if (!window.persist()) {
        throw new Error(tr('تعذّر حفظ البيانات المستعادة في التخزين المحلي'));
      }
      if (typeof deynFlush === 'function') {
        await deynFlush();
      }
      if (typeof storageBlocked !== 'undefined' && storageBlocked) {
        throw new Error(tr('فشل التحقق من حفظ البيانات المشفرة'));
      }
      renderAll();
      return true;
    } catch (err) {
      if (previousSnapshot) {
        S = previousSnapshot;
        window.DEYN_LIC = previousLic;
        DEYN_LIC = previousLic;
        try { origPersistForBackup(); } catch (e) {}
      }
      throw err;
    }
  }

  function pickJsonFileText() {
    return new Promise((resolve) => {
      let input = document.getElementById('deynRestoreFileInput');
      if (input) input.remove();
      input = document.createElement('input');
      input.type = 'file';
      input.id = 'deynRestoreFileInput';
      input.accept = '.json,application/json';
      input.style.display = 'none';
      document.body.appendChild(input);
      input.onchange = () => {
        const f = input.files && input.files[0];
        if (!f) { resolve(null); return; }
        const reader = new FileReader();
        reader.onload = () => resolve({ name: f.name, text: String(reader.result || '') });
        reader.onerror = () => resolve({ name: f.name, error: 'read_error' });
        reader.readAsText(f);
      };
      input.click();
    });
  }

  let pendingRestoreValidated = null;
  let pendingRestoreFromGate = false;

  async function openRestoreJsonFlow(fromGate, preloadedText, opts = {}) {
    let v = null;
    if (opts && opts.useSafAuto) {
      const safRes = await readValidatedAutoBackupFromSaf();
      if (!safRes.ok) {
        const msg = tr(safRes.reason || 'تعذّرت قراءة النسخة التلقائية من المجلد');
        return fromGate ? agToast(msg) : toast(msg, 'err');
      }
      v = safRes;
      if (safRes.fallbackUsed) {
        toast(tr('تم التحول تلقائياً إلى النسخة الاحتياطية السابقة السليمة (.prev.json) بسبب تعذّر قراءة النسخة الرئيسية ⚠️'), 'warn');
      }
    } else {
      let rawText = preloadedText || null;
      if (!rawText) {
        const picked = await pickJsonFileText();
        if (!picked) return;
        if (picked.error) {
          const msg = tr('تعذّرت قراءة ملف JSON المختار');
          return fromGate ? agToast(msg) : toast(msg, 'err');
        }
        rawText = picked.text;
      }
      v = validateBackupPayload(rawText);
      if (!v.ok) {
        const msg = tr(v.reason);
        return fromGate ? agToast(msg) : toast(msg, 'err');
      }
    }

    pendingRestoreValidated = v;
    pendingRestoreFromGate = !!fromGate;

    const currentLic = (!fromGate && window.DEYN_LIC) ? window.DEYN_LIC : await deynLoadLicense();
    const prefilledCode = (currentLic && currentLic.code) ? currentLic.code : '';
    const isDifferentDevice = v.originDeviceId && DEYN_DEV_ID && v.originDeviceId !== DEYN_DEV_ID;

    const modal = openModal(() => `${sheetHead(tr('استعادة نسخة JSON'))}
      <div class="sub" style="line-height:1.75;margin-bottom:10px">
        ${escHtml(tr('تم التحقق من سلامة ملف النسخة الاحتياطية:'))}
        <b>${v.customersCount}</b> ${escHtml(tr('زبائن'))} • <b>${v.pendingCount}</b> ${escHtml(tr('تذكرة'))}.
      </div>
      ${isDifferentDevice ? `<div class="note w" style="margin-bottom:10px;line-height:1.6">${escHtml(tr('تنبيه: هذه النسخة مأخوذة من جهاز آخر. لإتمام الاستعادة على هذا الهاتف، أدخل كود التفعيل الصالح لمعرّف هذا الجهاز الصادر من مولّد الأكواد.'))}</div>` : `<div class="sub" style="margin-bottom:10px">${escHtml(tr('لإتمام الاستعادة بأمان، أدخل كود التفعيل الخاص بهذا الجهاز:'))}</div>`}
      <label class="lbl">${escHtml(tr('معرّف الجهاز'))}</label>
      <div class="num" style="direction:ltr;word-break:break-all;font-size:12.5px;background:#f1f5f9;border-radius:10px;padding:8px 10px">${escHtml(String(DEYN_DEV_ID || ''))}</div>
      <label class="lbl" for="restoreLicInput" style="margin-top:10px">${escHtml(tr('كود التفعيل'))} *</label>
      <input class="inp" id="restoreLicInput" type="text" dir="ltr" style="text-align:left" value="${escHtml(prefilledCode)}" placeholder="DEYN3-..." autocomplete="off" spellcheck="false">
      <div class="two" style="margin-top:16px">
        <button type="button" class="btn" data-act="closeTop">${escHtml(tr('إلغاء'))}</button>
        <button type="button" class="btn pri" data-act="confirmRestoreJson" data-primary>${escHtml(tr('تأكيد الاستعادة'))}</button>
      </div>`);
    modal.wrap.style.zIndex = '100002';
  }

  async function confirmRestoreJson() {
    if (!pendingRestoreValidated) return;
    const inp = lastById('restoreLicInput');
    const code = inp ? inp.value.trim() : '';
    if (!code) {
      toast(tr('أدخل كود التفعيل للتحقق من أحقية الاستعادة'), 'err');
      return;
    }
    if (!DEYN_DEV_ID) {
      DEYN_DEV_ID = await deynGetDeviceId();
    }
    const verified = await deynVerifyCode(code, DEYN_DEV_ID);
    if (!verified) {
      toast(tr('كود التفعيل غير صالح لهذا الجهاز أو انتهت صلاحيته — تم رفض الاستعادة'), 'err');
      return;
    }

    try {
      await DeynStore.set('lic', JSON.stringify({ code: verified.code }));
      let used = [];
      try { used = JSON.parse((await DeynStore.get('used')) || '[]'); if (!Array.isArray(used)) used = []; } catch (e) { used = []; }
      if (used.indexOf(verified.code) < 0) {
        used.push(verified.code);
        await DeynStore.set('used', JSON.stringify(used));
      }

      if (pendingRestoreFromGate && !DEYN_STARTED) {
        DEYN_LIC = verified;
        window.DEYN_LIC = verified;
        agStartApp();
        await new Promise(r => setTimeout(r, 350));
      }

      await applyVerifiedRestore(pendingRestoreValidated, verified);
      pendingRestoreValidated = null;
      closeModal();
      toast(tr('تمت استعادة النسخة الاحتياطية بنجاح ✅'), 'ok');
    } catch (e) {
      toast(tr('فشلت عملية الاستعادة وبقيت بياناتك الحالية محمية:') + ' ' + (e.message || e), 'err');
    }
  }

  function injectActivationGateRestoreLink() {
    const foot = document.querySelector('#actGate .ag-foot');
    if (!foot || document.getElementById('agRestoreJsonBtn')) return;
    const note = foot.querySelector('.ag-note');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'agRestoreJsonBtn';
    btn.className = 'ag-restore-link';
    btn.textContent = tr('استعادة نسخة JSON');
    btn.onclick = () => openRestoreJsonFlow(true, null);
    if (note && note.parentNode) note.after(btn);
    else foot.appendChild(btn);
  }
  injectActivationGateRestoreLink();

  async function selectSafBackupFolder() {
    if (!requireOwner('إعداد النسخ الاحتياطي التلقائي')) return false;
    const bp = backupPlug();
    if (!bp || typeof bp.selectBackupFolder !== 'function') {
      toast(tr('اختيار مجلد النسخ الاحتياطي الخارجي يتطلب تشغيل التطبيق على نظام أندرويد ⚠️'), 'err');
      return false;
    }
    try {
      const r = await bp.selectBackupFolder();
      if (r && r.configured) {
        const writeRes = await runAutoBackupNow({ force: true });
        if (writeRes && writeRes.ok) {
          toast(tr('تم ربط مجلد النسخ الاحتياطي التلقائي وحفظ النسخة بنجاح ✅'), 'ok');
          stack.forEach(m => m.refresh && m.refresh());
          return true;
        }
        toast(tr('تم اختيار المجلد لكن تعذّرت كتابة النسخة الاحتياطية الأولى ⚠️'), 'warn');
        return false;
      }
    } catch (e) {
      toast(tr('لم يتم اختيار مجلد النسخ الاحتياطي'), 'warn');
    }
    return false;
  }

  // ============================================================================
  // 5 & 6. PERSISTENT NOTIFICATION LOG (READ/UNREAD) & NATIVE ANDROID NOTIFICATIONS
  // ============================================================================
  const notifPlug = () => (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.DeynNotif) || null;
  let notifFilter = 'all';
  let notifScheduleTimer = null;

  function ensureNotifLog() {
    if (typeof S === 'undefined' || !S) return {};
    if (!S.notifLog || typeof S.notifLog !== 'object' || Array.isArray(S.notifLog)) {
      S.notifLog = {};
    }
    return S.notifLog;
  }

  // Synchronize active alerts into S.notifLog and remove obsolete unread alerts when debts are paid or modified
  function syncAlertsToLog() {
    if (typeof S === 'undefined' || !S || !Array.isArray(S.customers)) return [];
    const log = ensureNotifLog();
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const activeAlerts = getAlertedCustomers();
    const activeKeySet = new Set();
    let changed = false;

    for (const item of activeAlerts) {
      const c = item.customer;
      const b = item.balance;
      let eventType = 'due_today';
      let eventKey = `today|${c.id}|${ym}|${item.pi ? item.pi.day : 0}`;
      let body = '';

      if (item.isOverdue) {
        eventType = 'overdue';
        eventKey = `overdue|${c.id}|${ym}|${item.pi ? item.pi.day : 0}`;
        body = `⚠️ متأخر بـ ${item.pi.diff} ${item.pi.diff <= 2 ? (item.pi.diff === 1 ? 'يوم' : 'يومين') : 'أيام'} (موعده يوم ${item.pi.day}) — ${fmt(b)} دج`;
      } else if (item.isOverCeil) {
        eventType = 'over_ceiling';
        eventKey = `ceil|${c.id}|${Math.round(b)}|${Math.round(c.ceiling)}`;
        body = `🚨 تجاوز سقف الدين (${fmt(b)} / ${fmt(c.ceiling)} دج)`;
      } else if (item.isToday) {
        eventType = 'due_today';
        eventKey = `today|${c.id}|${ym}|${item.pi ? item.pi.day : 0}`;
        body = `🕒 موعد السداد اليوم (يوم ${item.pi.day}) — ${fmt(b)} دج`;
      }

      activeKeySet.add(eventKey);
      if (!log[eventKey]) {
        log[eventKey] = {
          key: eventKey,
          cid: c.id,
          customerName: c.name,
          type: eventType,
          balance: b,
          body,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          read: false,
          notifiedNative: false
        };
        changed = true;
      } else {
        if (log[eventKey].customerName !== c.name || log[eventKey].balance !== b || log[eventKey].body !== body) {
          log[eventKey].customerName = c.name;
          log[eventKey].balance = b;
          log[eventKey].body = body;
          log[eventKey].updatedAt = Date.now();
          changed = true;
        }
      }
    }

    // If a customer paid off their debt or their payDay/ceiling changed so an unread alert is no longer active, remove the stale unread alert
    const existingCustIds = new Set((S.customers || []).map(c => c.id));
    for (const k of Object.keys(log)) {
      const entry = log[k];
      if (!entry) continue;
      if (!existingCustIds.has(entry.cid) || (!activeKeySet.has(k) && !entry.read)) {
        delete log[k];
        changed = true;
      }
    }

    if (changed) {
      try { origPersistForBackup(); } catch (e) {}
    }
    return Object.values(log).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  async function dispatchAndScheduleNativeNotifications() {
    if (typeof S === 'undefined' || !S || !S.settings) return;
    const np = notifPlug();
    if (!S.settings.notifs) {
      // If notifications are turned off, clear scheduled WorkManager notifications
      if (np && typeof np.schedule === 'function') {
        try { await np.schedule({ items: [] }); } catch (e) {}
      }
      return;
    }

    const entries = syncAlertsToLog();
    if (!np) return;

    try {
      const perm = await np.checkPermissions();
      if (!perm || perm.notifications !== 'granted') return;

      let dirty = false;
      for (const entry of entries) {
        if (!entry.notifiedNative && !entry.read) {
          const r = await np.notifyNow({
            key: entry.key,
            title: `DEYN — ${entry.customerName}`,
            body: isFr() ? tr(entry.body) : entry.body,
            force: false
          });
          if (r && (r.posted || r.duplicate)) {
            entry.notifiedNative = true;
            dirty = true;
          }
        }
      }
      if (dirty) {
        try { origPersistForBackup(); } catch (e) {}
      }

      // Schedule next-day overdue notifications (at 09:00 the day after each customer's payDay) via WorkManager.
      // Passing only customers who currently have bal(c) > 0 automatically cancels any previously scheduled notification
      // for customers who paid off or modified their debt!
      const now = new Date();
      const scheduledItems = [];
      for (const c of (S.customers || [])) {
        const b = bal(c);
        if (!c.payDay || b <= 0) continue;
        for (let mOffset = 0; mOffset < 2; mOffset++) {
          const y = now.getFullYear(), m = now.getMonth() + mOffset;
          const dim = new Date(y, m + 1, 0).getDate();
          const payDayClamped = Math.min(c.payDay, dim);
          const nextDayNineAm = new Date(y, m, payDayClamped + 1, 9, 0, 0, 0).getTime();
          if (nextDayNineAm > Date.now()) {
            const targetDate = new Date(y, m, 1);
            const ym = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
            const key = `overdue|${c.id}|${ym}|${c.payDay}`;
            const bodyAr = `⚠️ متأخر بـ 1 يوم (موعده يوم ${c.payDay}) — ${fmt(b)} دج`;
            scheduledItems.push({
              key,
              title: `DEYN — ${c.name}`,
              body: isFr() ? tr(bodyAr) : bodyAr,
              at: nextDayNineAm
            });
            break;
          }
        }
      }
      await np.schedule({ items: scheduledItems });
    } catch (e) {
      console.warn('Native notification sync warning:', e);
    }
  }

  function scheduleNotifRefresh() {
    clearTimeout(notifScheduleTimer);
    notifScheduleTimer = setTimeout(() => {
      window.updateBellBadge();
      dispatchAndScheduleNativeNotifications();
    }, 120);
  }

  // Hook persist() so every successful merchant data change updates both the external auto-backup and the notification schedule
  const origPersistForBackup = window.persist;
  window.persist = function () {
    const ok = origPersistForBackup.apply(this, arguments);
    if (ok) {
      scheduleAutoBackup();
      scheduleNotifRefresh();
    }
    return ok;
  };

  window.updateBellBadge = function () {
    const badge = document.getElementById('bellBadge');
    if (!badge || typeof S === 'undefined' || !S) return;
    const all = syncAlertsToLog();
    const unreadCount = all.filter(x => !x.read).length;
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  };

  window.openNotifsModal = function () {
    const m = openModal(() => {
      const entries = syncAlertsToLog();
      const unreadCount = entries.filter(x => !x.read).length;
      const filteredEntries = notifFilter === 'unread'
        ? entries.filter(x => !x.read)
        : (notifFilter === 'read' ? entries.filter(x => x.read) : entries);

      return `${sheetHead(tr('التنبيهات والمواعيد'), unreadCount ? `<span class="num">${unreadCount}</span> ${tr('غير مقروء')}` : tr('لا توجد تنبيهات جديدة'))}
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;flex-wrap:wrap">
          <div class="chips" style="margin:0;padding:0">
            <button type="button" class="chip ${notifFilter === 'all' ? 'on' : ''}" data-act="setNotifFilter" data-f="all">${tr('الكل')} <small>${entries.length}</small></button>
            <button type="button" class="chip ${notifFilter === 'unread' ? 'on' : ''}" data-act="setNotifFilter" data-f="unread">${tr('غير مقروء')} <small>${unreadCount}</small></button>
            <button type="button" class="chip ${notifFilter === 'read' ? 'on' : ''}" data-act="setNotifFilter" data-f="read">${tr('مقروء')} <small>${entries.length - unreadCount}</small></button>
          </div>
          ${unreadCount > 0 ? `<button type="button" class="btn sm soft" data-act="markAllNotifsRead" style="height:32px;font-size:11.5px;padding:0 10px">${tr('تحديد الكل كمقروء')}</button>` : ''}
        </div>
        ${!filteredEntries.length ? `
          <div class="empty-st" style="padding:32px 16px">
            <b style="font-size:15px;color:var(--ink);display:block;margin-bottom:6px">${tr('لا توجد تنبيهات في هذا القسم')}</b>
            <span style="color:var(--mute);font-size:12.5px">${tr('جميع الزبائن ملتزمون بمواعيد السداد وسقوف الديون المحددة.')}</span>
          </div>
        ` : `
          <div style="max-height:60vh;overflow-y:auto;padding-bottom:12px;margin-top:10px">
            ${filteredEntries.map(item => `
              <div class="nt notif-item ${item.read ? 'read' : 'unread'}" style="display:flex;align-items:center;gap:10px">
                <button type="button" data-act="openNotifCust" data-cid="${escHtml(item.cid)}" data-nkey="${escHtml(item.key)}" style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;text-align:inherit">
                  <div class="av ${item.type === 'overdue' ? 'd' : (item.type === 'over_ceiling' ? 'o' : '')}">${escHtml((item.customerName || '؟').trim()[0])}</div>
                  <div class="nt-m">
                    <div class="nt-r">
                      <b>${escHtml(item.customerName)}</b>
                      <span class=" badge" style="font-size:10px;background:${item.read ? '#e2e8f0' : '#dcfce7'};color:${item.read ? '#475569' : '#166534'}">${tr(item.read ? 'مقروء' : 'جديد')}</span>
                    </div>
                    <div style="font-size:12px;color:var(--ink);margin-top:4px">${escHtml(tr(item.body))}</div>
                    <small class="num" style="color:var(--mute);font-size:10.5px">${dateStr(item.createdAt)} ${timeStr(item.createdAt)}</small>
                  </div>
                </button>
                <button type="button" class="btn sm" data-act="toggleNotifRead" data-nkey="${escHtml(item.key)}" style="height:30px;font-size:11px;padding:0 8px">${tr(item.read ? 'غير مقروء' : 'مقروء ✓')}</button>
              </div>
            `).join('')}
          </div>
        `}`;
    }, { refresh: () => m.paint() });
    return m;
  };

  const origCheckSmartNotifs = window.checkSmartNotifs;
  window.checkSmartNotifs = function () {
    if (origCheckSmartNotifs) origCheckSmartNotifs();
    window.updateBellBadge();
    dispatchAndScheduleNativeNotifications();
  };

  // ============================================================================
  // SETTINGS INJECTION (Restore JSON + SAF Folder Selection)
  // ============================================================================
  function decorateSettingsSheet(sheet) {
    if (!sheet) return;
    const backupBtn = sheet.querySelector('[data-act="backup"]');
    if (backupBtn && !sheet.querySelector('[data-act="restoreJsonSettings"]')) {
      const restoreBtn = document.createElement('button');
      restoreBtn.type = 'button';
      restoreBtn.className = 'btn block';
      restoreBtn.dataset.act = 'restoreJsonSettings';
      restoreBtn.style.cssText = 'background:#fff;color:#065043;border:1.5px solid #065043;border-radius:14px;height:48px;font-size:14.5px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px';
      restoreBtn.innerHTML = `<span>📂</span><span>${escHtml(tr('استعادة نسخة JSON'))}</span>`;
      backupBtn.after(restoreBtn);

      const safBtn = document.createElement('button');
      safBtn.type = 'button';
      safBtn.className = 'btn sm block';
      safBtn.dataset.act = 'selectBackupFolder';
      safBtn.style.cssText = 'background:#f8fafc;color:#065043;border:1px dashed #065043;border-radius:12px;height:40px;font-size:12.5px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px';
      safBtn.innerHTML = `<span>🛡️</span><span>${escHtml(tr('تحديد مجلد النسخ الاحتياطي التلقائي (خارج التطبيق)'))}</span>`;
      restoreBtn.after(safBtn);
    }
    if (typeof DEYN_I18N !== 'undefined' && typeof DEYN_I18N.translateRoot === 'function') {
      DEYN_I18N.translateRoot(sheet);
    }
  }

  const origOpenSettings = window.openSettings;
  window.openSettings = function () {
    const ret = origOpenSettings.apply(this, arguments);
    const m = ret || (typeof stack !== 'undefined' && stack.length ? stack[stack.length - 1] : null);
    const sheet = (m && m.wrap && m.wrap.querySelector('.sheet')) || document.querySelector('#modalRoot .ovl:last-child .sheet');
    decorateSettingsSheet(sheet);
    if (m && typeof m.paint === 'function' && !m.paint.__completionWrapped) {
      const origPaint = m.paint;
      m.paint = function () {
        const r = origPaint.apply(this, arguments);
        decorateSettingsSheet((m.wrap && m.wrap.querySelector('.sheet')) || document.querySelector('#modalRoot .ovl:last-child .sheet'));
        return r;
      };
      m.paint.__completionWrapped = true;
    }
    return m;
  };
  if (typeof A === 'object' && A) {
    A.settings = window.openSettings;
    A.notifs = window.openNotifsModal;
    A.restoreJsonSettings = () => openRestoreJsonFlow(false, null);
    A.restoreSafAutoBackup = () => openRestoreJsonFlow(false, null, { useSafAuto: true });
    A.confirmRestoreJson = () => confirmRestoreJson();
    A.selectBackupFolder = () => selectSafBackupFolder();
    A.setNotifFilter = d => { notifFilter = (d && d.f) || 'all'; stack.forEach(m => m.refresh && m.refresh()); };
    A.markAllNotifsRead = () => {
      const log = ensureNotifLog();
      Object.values(log).forEach(x => { x.read = true; });
      persist();
      window.updateBellBadge();
      stack.forEach(m => m.refresh && m.refresh());
    };
    A.toggleNotifRead = d => {
      const log = ensureNotifLog();
      if (d && d.nkey && log[d.nkey]) {
        log[d.nkey].read = !log[d.nkey].read;
        persist();
        window.updateBellBadge();
        stack.forEach(m => m.refresh && m.refresh());
      }
    };
    const origOpenNotifCust = A.openNotifCust;
    A.openNotifCust = d => {
      const log = ensureNotifLog();
      if (d && d.nkey && log[d.nkey]) {
        log[d.nkey].read = true;
        persist();
        window.updateBellBadge();
      } else if (d && d.cid) {
        Object.values(log).forEach(x => { if (x.cid === d.cid) x.read = true; });
        persist();
        window.updateBellBadge();
      }
      if (origOpenNotifCust) origOpenNotifCust(d);
    };
  }
  if (typeof READONLY_OK !== 'undefined' && READONLY_OK && typeof READONLY_OK.add === 'function') {
    ['setNotifFilter', 'markAllNotifsRead', 'toggleNotifRead', 'selectBackupFolder', 'restoreJsonSettings', 'restoreSafAutoBackup', 'confirmRestoreJson'].forEach(k => READONLY_OK.add(k));
  }

  // Expose programmatic APIs for testing and verification
  window.DeynBackupRuntime = {
    buildBackupEnvelope,
    computeBackupFingerprint,
    validateBackupPayload,
    runAutoBackupNow,
    readValidatedAutoBackupFromSaf,
    applyVerifiedRestore,
    openRestoreJsonFlow,
    confirmRestoreJson,
    getLastStatus: () => Object.assign({}, lastAutoBackupStatus)
  };
  window.DeynNotifRuntime = {
    syncAlertsToLog,
    dispatchAndScheduleNativeNotifications
  };

  setTimeout(() => {
    injectActivationGateRestoreLink();
    syncNativeMonotonicClock();
    if (typeof S !== 'undefined' && S) {
      window.applyLicenseRole();
      window.updateBellBadge();
      dispatchAndScheduleNativeNotifications();
      scheduleAutoBackup();
    }
  }, 400);
})();