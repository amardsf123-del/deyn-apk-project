#!/usr/bin/env python3
"""Apply DEYN optional app-lock and factory-password recovery to the real PRO_4 source."""
from pathlib import Path
import re
import sys

if len(sys.argv) != 2:
    raise SystemExit("usage: integrate_password_security.py <deyn-app/www/index.html>")

path = Path(sys.argv[1])
source = path.read_text(encoding="utf-8")

def replace_once(old: str, new: str, label: str) -> None:
    global source
    count = source.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one anchor, found {count}")
    source = source.replace(old, new, 1)

old_settings = '''    \x3c!-- إدارة كلمة المرور -->
    <div class="row-set">
      <div>
        <b>كلمة المرور الرئيسية</b>
        <small>تعيين كلمة المرور أو تغييرها (الاسترجاع بكود موقّع من الدعم)</small>
      </div>
      <button type="button" class="btn sm" data-act="resetPassModal" style="height:34px;font-size:12px;padding:0 14px;background:#f0fdf4;color:var(--em);border:1.5px solid var(--em);font-weight:700;border-radius:10px">إدارة كلمة المرور</button>
    </div>'''
new_settings = '''    \${S.auth && S.auth.pw ? \`
    <div class="row-set">
      <div>
        <b>كلمة المرور الشخصية</b>
        <small>تغيير كلمة مرور قفل التطبيق أو استعادتها بكلمة سر المصنع</small>
      </div>
      <button type="button" class="btn sm" data-act="resetPassModal" style="height:34px;font-size:12px;padding:0 14px;background:#f0fdf4;color:var(--em);border:1.5px solid var(--em);font-weight:700;border-radius:10px">إدارة كلمة المرور</button>
    </div>
    \` : ''}'''
replace_once(old_settings, new_settings, "optional password settings row")

old_toggle = '''  if (k === 'appLockEnabled') {
    if (isWorkerDevice()) { e.target.checked = !!S.settings.appLockEnabled; return toast('عذراً، قفل التطبيق خاص بصاحب المحل فقط 🔒', 'err'); }
    if (e.target.checked && !(S.auth && S.auth.pw)) { e.target.checked = false; toast('عيّن كلمة مرور المالك أولاً ثم فعّل القفل', 'err'); return openSetPasswordModal(false); }
  }'''
new_toggle = '''  if (k === 'appLockEnabled') {
    if (isWorkerDevice()) { e.target.checked = !!S.settings.appLockEnabled; return toast('عذراً، قفل التطبيق خاص بصاحب المحل فقط 🔒', 'err'); }
    if (e.target.checked && !(S.auth && S.auth.pw)) {
      e.target.checked = false;
      toast('أنشئ كلمة مرورك الشخصية لتفعيل قفل التطبيق', 'err');
      return openSetPasswordModal(false, false, true);
    }
  }'''
replace_once(old_toggle, new_toggle, "optional lock activation")

old_migrate = '''async function authMigrate() {
  if (!S.auth) S.auth = {};
  const a = S.auth;
  if (a.pw) {
    let ch = false;
    if ('masterPass' in a) { delete a.masterPass; ch = true; }
    if (a.pwMustSet) { delete a.pwMustSet; ch = true; }
    return ch;
  }
  if ('masterPass' in a) {
    const legacy = a.masterPass;
    if (typeof legacy !== 'string' || !legacy || (await pwSha256Hex(legacy)) === LEGACY_DEFAULT_SHA256) {
      delete a.masterPass; a.pwMustSet = true; return true;
    }
    a.pw = await pwMake(legacy.trim()); // custom password chosen by the owner: keep it working, now hashed
    delete a.masterPass; delete a.pwMustSet; a.pwMigrated = Date.now();
    return true;
  }
  if (!a.pwMustSet) { a.pwMustSet = true; return true; }
  return false;
}'''
new_migrate = '''async function authMigrate() {
  if (!S.auth) S.auth = {};
  const a = S.auth;
  let changed = false;
  if (a.pw) {
    if ('masterPass' in a) { delete a.masterPass; changed = true; }
    if ('pwMustSet' in a) { delete a.pwMustSet; changed = true; }
    return changed;
  }
  if ('masterPass' in a) {
    const legacy = a.masterPass;
    if (typeof legacy !== 'string' || !legacy || (await pwSha256Hex(legacy)) === LEGACY_DEFAULT_SHA256) {
      delete a.masterPass;
      changed = true;
    } else {
      a.pw = await pwMake(legacy.trim());
      delete a.masterPass;
      a.pwMigrated = Date.now();
      changed = true;
    }
  }
  if ('pwMustSet' in a) { delete a.pwMustSet; changed = true; }
  return changed;
}'''
replace_once(old_migrate, new_migrate, "non-mandatory first-run password migration")

replace_once('''function ensurePasswordSet() {
  if (S && S.auth && S.auth.pwMustSet && !S.auth.pw && !isWorkerDevice() && !stack.length) setTimeout(() => openSetPasswordModal(true, false), 450);
}
''', '', "first-run password prompt removal")
replace_once('authMigrate().then(changed => { if (changed && !persist()) return; checkAppLock(); ensurePasswordSet(); })',
             'authMigrate().then(changed => { if (changed && !persist()) return; checkAppLock(); })',
             "startup no longer forces password setup")

source, seed_flags = re.subn(r'^[ \t]*pwMustSet: true,\n', '', source, flags=re.M)
if seed_flags < 1:
    raise SystemExit("initial auth seed: expected at least one legacy pwMustSet flag")

replace_once("PW_CTX = { hasPw, viaRecovery: !!viaRecovery };",
             "PW_CTX = { hasPw, viaRecovery: !!viaRecovery, enableLockAfterSet: !!enableLockAfterSet };",
             "password modal context")
replace_once("function openSetPasswordModal(initial, viaRecovery) {",
             "function openSetPasswordModal(initial, viaRecovery, enableLockAfterSet) {",
             "password modal signature")
replace_once("'كلمة المرور تحمي وضع المالك وقفل التطبيق. لا توجد كلمة مرور افتراضية ولا يمكن لأحد تجاوزها.'",
             "'هذه كلمة مرور شخصية لقفل التطبيق فقط، ولا تمنح أو تغيّر أي صلاحيات.'",
             "personal password explanation")
replace_once("S.auth.pw = await pwMake(pass);\n    delete S.auth.pwMustSet; delete S.auth.masterPass; delete S.auth.pwFail;\n    if (!persist()) return;",
             "S.auth.pw = await pwMake(pass);\n    delete S.auth.pwMustSet; delete S.auth.masterPass; delete S.auth.pwFail;\n    if (ctx.enableLockAfterSet) { if (!S.settings) S.settings = {}; S.settings.appLockEnabled = true; }\n    if (!persist()) return;\n    if (ctx.enableLockAfterSet) stack.forEach(m => m.refresh && m.refresh());",
             "save password and activate requested lock")

recovery_start = source.find("/* ---- Signed recovery code:")
recovery_end = source.find("/* ============ Smart Alerts & Notification Bell", recovery_start)
if recovery_start < 0 or recovery_end < 0 or recovery_end <= recovery_start:
    raise SystemExit("factory recovery replacement: signed recovery block not found")
factory_block = r'''/* ---- Factory recovery: resets ONLY the optional personal app-lock password. ----
   PBKDF2-SHA256 verifier with a per-release salt. The factory phrase itself is never stored.
   This client-side recovery is not a security boundary against a determined APK reverse engineer
   and must never be treated as licence, role, or permission authorization. */
const FACTORY_PW_SALT = 'lSvfYWtUlPTnbIk+Z1HRYQ==';
const FACTORY_PW_HASH = 'vHzSuX/bO3J9VWfsVsVprUiW7Zkqu3mo4TsWcHaIBXg=';
const FACTORY_PW_ITER = 1200000;
function factoryThrottleLeft() {
  const f = S && S.auth && S.auth.factoryFail;
  return f && f.until > Date.now() ? Math.ceil((f.until - Date.now()) / 1000) : 0;
}
async function verifyFactoryPassword(pass) {
  if (!window.crypto || !crypto.subtle) return { ok: false, msg: 'التحقق الآمن غير متاح على هذا الجهاز' };
  const wait = factoryThrottleLeft();
  if (wait) return { ok: false, wait };
  let ok = false;
  try {
    const derived = await pwDerive(String(pass || '').trim(), pwUnb64(FACTORY_PW_SALT), FACTORY_PW_ITER);
    ok = ctEq(derived, pwUnb64(FACTORY_PW_HASH));
  } catch (e) { ok = false; }
  if (ok) {
    if (S.auth && S.auth.factoryFail) { delete S.auth.factoryFail; persist(); }
    return { ok: true };
  }
  if (!S.auth) S.auth = {};
  const f = S.auth.factoryFail || { n: 0, until: 0 };
  f.n += 1;
  if (f.n >= 5) f.until = Date.now() + Math.min(600, 30 * (f.n - 4)) * 1000;
  S.auth.factoryFail = f;
  persist();
  return { ok: false, wait: factoryThrottleLeft() };
}
function openRecoveryModal() {
  const rm = openModal(() => \`\${sheetHead('استعادة كلمة المرور الشخصية')}
    <div class="sub">أدخل كلمة سر المصنع لإعادة تعيين كلمة المرور الشخصية المنسية. هذه العملية لا تغيّر الترخيص أو دور الجهاز أو صلاحياته أو بياناتك.</div>
    <label class="lbl" for="factoryPass">كلمة سر المصنع *</label>
    <input class="inp" id="factoryPass" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" style="direction:ltr;text-align:left" placeholder="كلمة سر المصنع">
    <button class="btn pri block" data-act="recoverySubmit" data-primary style="margin-top:16px">تحقق وتعيين كلمة مرور جديدة</button>\`);
  rm.wrap.style.zIndex = '100001';
}
async function submitRecovery() {
  const inp = lastById('factoryPass');
  if (!inp || PW_BUSY) return;
  PW_BUSY = true;
  try {
    const result = await verifyFactoryPassword(inp.value);
    if (!result.ok) {
      toast(result.wait ? \`محاولات كثيرة خاطئة. انتظر \${result.wait} ثانية ⏳\` : (result.msg || 'كلمة سر المصنع غير صحيحة ❌'), 'err');
      return;
    }
    const restoreLock = !!(S.settings && S.settings.appLockEnabled);
    if (!S.auth) S.auth = {};
    delete S.auth.pw;
    delete S.auth.masterPass;
    delete S.auth.pwFail;
    delete S.auth.pwMustSet;
    if (restoreLock) S.settings.appLockEnabled = false;
    if (!persist()) return;
    const ov = $('#appLockOverlay');
    if (ov) ov.style.display = 'none';
    stack.slice().forEach(m => closeModal(m));
    setTimeout(() => openSetPasswordModal(false, true, restoreLock), 250);
    toast('تم التحقق من كلمة سر المصنع. عيّن كلمة مرور شخصية جديدة.');
  } finally { PW_BUSY = false; }
}


'''
source = source[:recovery_start] + factory_block + source[recovery_end:]

old_check = '''function checkAppLock() {
  const overlay = $('#appLockOverlay');
  if (!overlay) return;
  if (S && S.settings && S.settings.appLockEnabled && S.auth && S.auth.pw) {'''
new_check = '''function checkAppLock() {
  const overlay = $('#appLockOverlay');
  if (!overlay) return;
  if (S && S.settings && S.settings.appLockEnabled && !(S.auth && S.auth.pw)) {
    S.settings.appLockEnabled = false;
    persist();
  }
  if (S && S.settings && S.settings.appLockEnabled && S.auth && S.auth.pw) {'''
replace_once(old_check, new_check, "lock state consistency")

if 'ensurePasswordSet();' in source or 'a.pwMustSet = true' in source or 'pwMustSet: true' in source:
    raise SystemExit("verification failed: a mandatory first-run password path remains")
if 'DEYNR1-' in source or 'id="recCode"' in source or 'id="factoryPass"' not in source:
    raise SystemExit("verification failed: factory recovery UI was not installed cleanly")
if 'TAYBEIAOMAR' in source or 'OMARFCB1899' in source or 'fcb1899' in source.lower():
    raise SystemExit("verification failed: a factory password appears in plaintext")
for marker in ('FACTORY_PW_HASH', 'FACTORY_PW_SALT', 'FACTORY_PW_ITER = 1200000',
               'verifyFactoryPassword', 'data-act="recoverySubmit"',
               'openSetPasswordModal(false, false, true)',
               'enableLockAfterSet: !!enableLockAfterSet',
               'S.settings.appLockEnabled = true',
               'كلمة مرور شخصية لقفل التطبيق فقط'):
    if marker not in source:
        raise SystemExit(f"verification failed: missing {marker}")

path.write_text(source, encoding="utf-8")
print("Applied optional app lock, removed first-run password prompt, and installed factory-password recovery.")
print(f"Removed legacy pwMustSet seed flag(s): {seed_flags}")
