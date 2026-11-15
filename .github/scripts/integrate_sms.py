#!/usr/bin/env python3
"""Integrate the DEYN SMS engine/runtime, Backup/Restore/Clock/Notif completion runtime, and complete French localization into the real Capacitor source archive."""
from pathlib import Path
import re, sys

if len(sys.argv) != 4:
    raise SystemExit('usage: integrate_sms.py <extracted-source-dir> <sms-engine.js> <DeynSmsPlugin.java>')
root = Path(sys.argv[1]).resolve()
engine_file = Path(sys.argv[2]).resolve()
plugin_file = Path(sys.argv[3]).resolve()
repo = Path(__file__).resolve().parents[2]
runtime_file = repo / 'sms' / 'runtime.js'
completion_file = repo / 'sms' / 'completion.js'
i18n_file = repo / 'sms' / 'i18n.js'
backup_plugin_file = repo / 'DeynBackupPlugin.java'
notif_plugin_file = repo / 'DeynNotifPlugin.java'

app = root / 'deyn-app'
html = app / 'www' / 'index.html'
prep = app / 'scripts' / 'prepare-android.sh'
for p in (html, prep, engine_file, plugin_file, runtime_file, completion_file, i18n_file, backup_plugin_file, notif_plugin_file):
    if not p.is_file():
        raise SystemExit(f'Required integration input missing: {p}')

source = html.read_text(encoding='utf-8')
engine = engine_file.read_text(encoding='utf-8')
runtime = runtime_file.read_text(encoding='utf-8')
completion = completion_file.read_text(encoding='utf-8')
i18n = i18n_file.read_text(encoding='utf-8')

script = '\n<script id="deyn-sms-bundle">\n/* DEYN_SMS_ENGINE_V1 */\n' + engine + '\n' + runtime + '\n</script>\n'
i18n_script = '\n<script id="deyn-i18n-bundle">\n/* DEYN_I18N_RUNTIME_V1 */\n' + i18n + '\n' + completion + '\n</script>\n'

# If already integrated, strip previous injected script blocks so re-running updates cleanly.
source = re.sub(r'\n?<script(?:\s+id="deyn-sms-bundle")?>\s*/\*\s*DEYN_SMS_ENGINE_V1\s*\*/[\s\S]*?</script>\n?', '', source)
source = re.sub(r'\n?<script(?:\s+id="deyn-i18n-bundle")?>\s*/\*\s*DEYN_I18N_RUNTIME_V1\s*\*/[\s\S]*?</script>\n?', '', source)

# 1. Show the individual due date and any extensions in the customer's debt ledger.
due_anchor = '<small class="num">${dateStr(t.ts)} ${timeStr(t.ts)}</small>'
due_replacement = """<small class="num">${dateStr(t.ts)} ${timeStr(t.ts)}${t.type === 'debt' ? (() => { const dueAt = Number(t.dueAt) || window.DeynSmsCore.getDebtDueDate(c, t, Date.now()); return dueAt ? ' • الاستحقاق ' + dateStr(dueAt) + (Array.isArray(t.extensionHistory) && t.extensionHistory.length ? ' • تمديد ' + t.extensionHistory.length : '') : ''; })() : ''}</small>"""
if due_replacement not in source:
    if source.count(due_anchor) != 1:
        raise SystemExit('Could not locate the unique debt transaction date label')
    source = source.replace(due_anchor, due_replacement, 1)


# 1b. Enforce strict M/W license role separation directly in index.html (disable manual role switching in both directions).
old_switch_act = """  switchDeviceRole: () => {
    if (!S.auth) S.auth = {};
    if (isWorkerDevice()) {
      if (window.DEYN_LIC && window.DEYN_LIC.role === 'W') { toast('هذا الجهاز مرخّص كجهاز عامل ولا يمكن تحويله إلى وضع المالك 🔒', 'err'); return; }
      // Owner password is verified against a salted PBKDF2 hash (no factory/master password exists).
      openSwitchToOwnerModal();
      return;
    } else {
      S.auth.deviceRole = 'worker';
      persist();
      renderAll();
      closeModal();
      openSettings();
      toast('تم تفعيل وضع العامل (تسجيل وتسديد فقط • الحذف مقفل 🔒)');
    }
  },"""
new_switch_act = """  switchDeviceRole: () => {
    toast('نوع الترخيص (M أو W) يحدد صلاحيات الجهاز ولا يمكن تغيير الدور من داخل التطبيق 🔒', 'err');
    return false;
  },"""
if old_switch_act in source:
    source = source.replace(old_switch_act, new_switch_act, 1)

old_is_worker = """function isWorkerDevice() {
  if (window.DEYN_LIC && window.DEYN_LIC.role === 'W') return true;
  return !!(S && S.auth && S.auth.deviceRole === 'worker');
}"""
new_is_worker = """function isWorkerDevice() {
  if (window.DEYN_LIC && (window.DEYN_LIC.role === 'M' || window.DEYN_LIC.role === 'W')) return window.DEYN_LIC.role === 'W';
  return !!(S && S.auth && S.auth.licRole === 'W');
}"""
if old_is_worker in source:
    source = source.replace(old_is_worker, new_is_worker, 1)

old_switch_modals = """function openSwitchToOwnerModal() {
  if (!(S.auth && S.auth.pw)) {
    toast('لا توجد كلمة مرور للمالك بعد. استخدم كود الاسترداد لتعيين واحدة', 'err');
    return openRecoveryModal();
  }
  openModal(() => `${sheetHead('تفعيل وضع المالك')}
    <div class="sub">أدخل كلمة مرور المالك لتفعيل الصلاحيات الكاملة:</div>
    <input class="inp" id="ownerPw" type="password" placeholder="••••••••" autocomplete="off">
    <button class="btn pri block" data-act="ownerSwitchSubmit" data-primary style="margin-top:16px">تفعيل وضع المالك</button>
    <button type="button" data-act="openRecovery" style="width:100%;background:transparent;border:none;color:#64748b;font-size:12px;margin-top:12px;cursor:pointer;text-decoration:underline">نسيت كلمة المرور؟</button>`);
}
async function submitSwitchToOwner() {
  const inp = lastById('ownerPw');
  if (!inp || PW_BUSY) return;
  if (window.DEYN_LIC && window.DEYN_LIC.role === 'W') return toast('هذا الجهاز مرخّص كجهاز عامل ولا يمكن تحويله إلى وضع المالك 🔒', 'err');
  PW_BUSY = true;
  try {
    const r = await authVerify(inp.value);
    if (!r.ok) return toast(pwFailMsg(r), 'err');
    S.auth.deviceRole = 'master';
    persist(); renderAll();
    stack.slice().forEach(m => closeModal(m));
    openSettings();
    toast('تم تفعيل وضع المالك بنجاح (صلاحيات كاملة) 👑');
  } finally { PW_BUSY = false; }
}"""
new_switch_modals = """function openSwitchToOwnerModal() {
  toast('نوع الترخيص (M أو W) يحدد صلاحيات الجهاز ولا يمكن تغيير الدور من داخل التطبيق 🔒', 'err');
  return false;
}
async function submitSwitchToOwner() {
  toast('نوع الترخيص (M أو W) يحدد صلاحيات الجهاز ولا يمكن تحويله يدوياً 🔒', 'err');
  return false;
}"""
if old_switch_modals in source:
    source = source.replace(old_switch_modals, new_switch_modals, 1)

source = source.replace("'ownerSwitchSubmit','switchDeviceRole',", "")

# 2. Ensure dialect(d) delegates to DEYN_I18N.dialectFr(d) when French is active.
dialect_anchor = "function dialect(d) {\n  d = round2(d);\n  if (!(d > 0)) return '';"
dialect_replacement = "function dialect(d) {\n  d = round2(d);\n  if (!(d > 0)) return '';\n  if (typeof DEYN_I18N !== 'undefined' && DEYN_I18N.lang === 'fr' && typeof DEYN_I18N.dialectFr === 'function') return DEYN_I18N.dialectFr(d);"
if 'DEYN_I18N.dialectFr(d)' not in source and dialect_anchor in source:
    source = source.replace(dialect_anchor, dialect_replacement, 1)

# 3. Ensure Trash modal date uses DEYN_I18N.locale instead of hardcoded 'ar-DZ'.
trash_date_old = "const dateStr = new Date(item.deletedAt).toLocaleDateString('ar-DZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });"
trash_date_new = "const dateStr = new Date(item.deletedAt).toLocaleDateString(typeof DEYN_I18N !== 'undefined' ? DEYN_I18N.locale : 'ar-DZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });"
if trash_date_old in source:
    source = source.replace(trash_date_old, trash_date_new, 1)

# 4. Ensure PDF export and statement(c) use DEYN_I18N in index.html directly as well.
pdf_write_old = "win.document.write(html);"
pdf_write_new = "win.document.write(typeof DEYN_I18N !== 'undefined' ? DEYN_I18N.html(html) : html);"
if pdf_write_old in source:
    source = source.replace(pdf_write_old, pdf_write_new, 1)
pdf_blob_old = "const blob = new Blob([html], { type: 'text/html' });"
pdf_blob_new = "const blob = new Blob([typeof DEYN_I18N !== 'undefined' ? DEYN_I18N.html(html) : html], { type: 'text/html' });"
if pdf_blob_old in source:
    source = source.replace(pdf_blob_old, pdf_blob_new, 1)

stmt_old = "c.ceiling > 0 ? `السقف المسموح: ${fmt(c.ceiling)} دج` : '', 'شكرًا على ثقتكم 🤝'].filter(Boolean).join('\\n');"
stmt_new = "c.ceiling > 0 ? `السقف المسموح: ${fmt(c.ceiling)} دج` : '', 'شكرًا على ثقتكم 🤝'].filter(Boolean).map(l => typeof DEYN_I18N !== 'undefined' ? DEYN_I18N.tr(l) : l).join('\\n');"
if stmt_old in source:
    source = source.replace(stmt_old, stmt_new, 1)

# 5. Add the SMS settings entry beside the existing settings controls.
anchor = '    <div class="row-set">\n      <div>\n        <b>قفل التطبيق بكلمة المرور</b>'
insert = '''    <div class="row-set" style="background:#f0fdf4;border:1px solid rgba(6,80,67,.15);border-radius:14px;padding:12px;margin:10px 0">
      <div><b>تذكيرات SMS للزبائن</b><small>إعداد الجدولة والقوالب والسجل — الإرسال من هاتف المالك فقط</small></div>
      <button type="button" class="btn sm" data-act="smsSettings" style="height:36px;background:#065043;color:#fff;border:0">إعدادات SMS</button>
    </div>

'''
if 'data-act="smsSettings"' not in source:
    if source.count(anchor) != 1:
        raise SystemExit('Could not locate the unique settings insertion point')
    source = source.replace(anchor, insert + anchor, 1)

# 6. Stabilize bottom sheets on small Android viewports.
style_marker = '<style id="deyn-sms-layout-fix-v2">'
if style_marker not in source:
    style = '''<style id="deyn-sms-layout-fix-v2">
.ovl{overflow:hidden;align-items:flex-end;overscroll-behavior:contain}
.sheet{box-sizing:border-box;min-height:0;height:auto;max-height:calc(100dvh - env(safe-area-inset-top) - 8px);overflow-x:hidden;overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable;-webkit-overflow-scrolling:touch;flex:0 1 auto}
.code-card{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;min-width:0;max-width:100%;overflow:hidden}
.code-card__body,.code-card__value{min-width:0;max-width:100%;overflow-wrap:anywhere;word-break:break-word}
#modalRoot,.ovl,.sheet{min-width:0;max-width:100%}
</style>'''
    source = source.replace('</head>', style + '\n</head>', 1)

# 7. Restore the French language option and the complete translation runtime.
if 'id="agLang"' not in source:
    gate = '<div id="actGate"'
    if source.count(gate) != 1:
        raise SystemExit('Could not locate the unique activation gate for language toggle')
    gate_line_end = source.find('>', source.find(gate))
    source = source[:gate_line_end + 1] + '\n  <button type="button" id="agLang" style="position:absolute;top:calc(10px + env(safe-area-inset-top));left:12px;z-index:20;background:#fff;border:1.5px solid #065043;color:#065043;border-radius:10px;padding:6px 12px;font:700 12px sans-serif;cursor:pointer">Français</button>' + source[gate_line_end + 1:]

if 'data-i18n-setting="language"' not in source:
    lang_anchor = '    <div class="row-set">\n      <div>\n        <b>قفل التطبيق بكلمة المرور</b>'
    lang_row = '''    <div class="row-set" data-i18n-setting="language">
      <div><b>اللغة / Langue</b><small>العربية • Français</small></div>
      <div style="display:flex;gap:6px">
        <button type="button" class="btn sm" data-act="setLang" data-l="ar" onclick="DEYN_I18N.set('ar')" style="height:34px;font-size:12px;padding:0 12px;font-weight:700;border-radius:10px">ع</button>
        <button type="button" class="btn sm" data-act="setLang" data-l="fr" onclick="DEYN_I18N.set('fr')" style="height:34px;font-size:12px;padding:0 12px;font-weight:700;border-radius:10px">FR</button>
      </div>
    </div>

'''
    if source.count(lang_anchor) != 1:
        raise SystemExit('Could not locate the unique settings anchor for language selector')
    source = source.replace(lang_anchor, lang_row + lang_anchor, 1)

source = source.replace('grid-template-columns:repeat(4,1fr);gap:7px;margin-top:8px', 'grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px')
if '</body>' not in source:
    raise SystemExit('Missing closing body tag')
idx = source.rfind('</body>')
source = source[:idx] + script + i18n_script + source[idx:]
html.write_text(source, encoding='utf-8')

# 8. Native plugins (DeynSmsPlugin, DeynBackupPlugin, DeynNotifPlugin), permissions, BroadcastReceivers and WorkManager dependency in prepare-android.sh.
native = app / 'native'
native.mkdir(exist_ok=True)
(native / 'DeynSmsPlugin.java').write_text(plugin_file.read_text(encoding='utf-8'), encoding='utf-8')
(native / 'DeynBackupPlugin.java').write_text(backup_plugin_file.read_text(encoding='utf-8'), encoding='utf-8')
(native / 'DeynNotifPlugin.java').write_text(notif_plugin_file.read_text(encoding='utf-8'), encoding='utf-8')

s = prep.read_text(encoding='utf-8')
for cls_name in ('DeynSmsPlugin.class', 'DeynBackupPlugin.class', 'DeynNotifPlugin.class'):
    if cls_name not in s:
        old = 'registerPlugin(DeynSyncPlugin.class);'
        if s.count(old) != 1:
            raise SystemExit(f'Could not locate Capacitor plugin registration point for {cls_name}')
        s = s.replace(old, old + f'\n        registerPlugin({cls_name});', 1)

# Ensure all required permissions including POST_NOTIFICATIONS, SEND_SMS, RECEIVE_BOOT_COMPLETED are injected
s = re.sub(
    r'for P in ACCESS_NETWORK_STATE ACCESS_WIFI_STATE CAMERA[^;]*; do',
    'for P in ACCESS_NETWORK_STATE ACCESS_WIFI_STATE CAMERA SEND_SMS RECEIVE_BOOT_COMPLETED POST_NOTIFICATIONS; do',
    s
)

receiver_snippet = '''if ! grep -q 'DeynSmsPlugin\\$SmsStatusReceiver' "$MANIFEST"; then
  sed -i 's#</application>#    <receiver android:name="com.deyn.app.DeynSmsPlugin$SmsStatusReceiver" android:exported="false">\\n            <intent-filter>\\n                <action android:name="com.deyn.app.SMS_SENT" />\\n                <action android:name="com.deyn.app.SMS_DELIVERED" />\\n            </intent-filter>\\n        </receiver>\\n        <receiver android:name="com.deyn.app.DeynSmsPlugin$SmsBootReceiver" android:exported="true">\\n            <intent-filter>\\n                <action android:name="android.intent.action.BOOT_COMPLETED" />\\n                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />\\n            </intent-filter>\\n        </receiver>\\n        <receiver android:name="com.deyn.app.DeynNotifPlugin$NotifBootReceiver" android:exported="true">\\n            <intent-filter>\\n                <action android:name="android.intent.action.BOOT_COMPLETED" />\\n                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />\\n            </intent-filter>\\n        </receiver>\\n    </application>#' "$MANIFEST"
elif ! grep -q 'DeynNotifPlugin\\$NotifBootReceiver' "$MANIFEST"; then
  sed -i 's#</application>#    <receiver android:name="com.deyn.app.DeynNotifPlugin$NotifBootReceiver" android:exported="true">\\n            <intent-filter>\\n                <action android:name="android.intent.action.BOOT_COMPLETED" />\\n                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />\\n            </intent-filter>\\n        </receiver>\\n    </application>#' "$MANIFEST"
fi
'''

# Replace older receiver block if present, or insert before WorkManager/completion marker
s = re.sub(r'if ! grep -q \'DeynSmsPlugin\\\$SmsStatusReceiver\' "\$MANIFEST"; then[\s\S]*?fi\n', '', s)

if 'androidx.work:work-runtime' not in s:
    marker = 'echo "✔ تم تجهيز مشروع أندرويد"'
    if s.count(marker) != 1:
        raise SystemExit('Could not locate Android preparation completion marker')
    s = s.replace(marker, receiver_snippet + '''GRADLE=android/app/build.gradle
if ! grep -q 'androidx.work:work-runtime' "$GRADLE"; then
  sed -i '/dependencies[[:space:]]*{/a\\    implementation "androidx.work:work-runtime:2.9.0"' "$GRADLE"
fi
''' + marker, 1)
else:
    marker = 'GRADLE=android/app/build.gradle'
    s = s.replace(marker, receiver_snippet + marker, 1)

prep.write_text(s, encoding='utf-8')

# 9. Structural assertions ensure no preview bridge was copied into the real application.
for marker in (
    'DEYN_SMS_ENGINE_V1', 'DEYN_SMS_RUNTIME_V1', 'DEYN_I18N_RUNTIME_V1', 'DEYN_COMPLETION_RUNTIME_V2',
    'DEYN_FR_DICT', 'DEYN_I18N.start', 'id="agLang"', 'data-i18n-setting="language"',
    'DeynSmsPlugin.class', 'DeynBackupPlugin.class', 'DeynNotifPlugin.class',
    'SEND_SMS', 'RECEIVE_BOOT_COMPLETED', 'POST_NOTIFICATIONS', 'SmsStatusReceiver', 'NotifBootReceiver',
    'work-runtime:2.9.0', 'smsSettings', 'الاستحقاق ', 'dialectFr', 'restoreJsonSettings', 'agRestoreJsonBtn'
):
    hay = source + s
    if marker not in hay:
        raise SystemExit(f'Integration verification failed: {marker}')
if 'PREVIEW ONLY' in engine or 'mock SMS' in engine:
    raise SystemExit('Preview bridge detected in SMS engine')
print('Integrated SMS engine/runtime, Backup/Restore/Clock/Notif completion runtime, French localization + centimes, and native plugins.')