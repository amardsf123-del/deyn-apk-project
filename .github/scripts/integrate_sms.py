#!/usr/bin/env python3
"""Integrate the DEYN SMS engine/runtime into the real Capacitor source archive."""
from pathlib import Path
import re, sys

if len(sys.argv) != 4:
    raise SystemExit('usage: integrate_sms.py <extracted-source-dir> <sms-engine.js> <DeynSmsPlugin.java>')
root = Path(sys.argv[1]).resolve()
engine_file = Path(sys.argv[2]).resolve()
plugin_file = Path(sys.argv[3]).resolve()
repo = Path(__file__).resolve().parents[2]
runtime_file = repo / 'sms' / 'runtime.js'
i18n_file = repo / 'sms' / 'i18n.js'
app = root / 'deyn-app'
html = app / 'www' / 'index.html'
prep = app / 'scripts' / 'prepare-android.sh'
for p in (html, prep, engine_file, plugin_file, runtime_file, i18n_file):
    if not p.is_file(): raise SystemExit(f'Required integration input missing: {p}')
source = html.read_text(encoding='utf-8')
if 'DEYN_SMS_RUNTIME_V1' in source:
    raise SystemExit('SMS runtime already integrated; refusing duplicate insertion')
# Show the individual due date and any extensions in the customer's debt ledger.
due_anchor = '<small class="num">${dateStr(t.ts)} ${timeStr(t.ts)}</small>'
due_replacement = """<small class="num">${dateStr(t.ts)} ${timeStr(t.ts)}${t.type === 'debt' ? (() => { const dueAt = Number(t.dueAt) || (c.payDay ? window.DeynSmsCore.nextMonthlyDue(t.ts, c.payDay) : null); return dueAt ? ' • الاستحقاق ' + dateStr(dueAt) + (Array.isArray(t.extensionHistory) && t.extensionHistory.length ? ' • تمديد ' + t.extensionHistory.length : '') : ''; })() : ''}</small>"""
if source.count(due_anchor) != 1: raise SystemExit('Could not locate the unique debt transaction date label')
source = source.replace(due_anchor, due_replacement, 1)
# Add the settings entry beside the existing settings controls.
anchor = '    <div class="row-set">\n      <div>\n        <b>قفل التطبيق بكلمة المرور</b>'
insert = '''    <div class="row-set" style="background:#f0fdf4;border:1px solid rgba(6,80,67,.15);border-radius:14px;padding:12px;margin:10px 0">
      <div><b>تذكيرات SMS للزبائن</b><small>إعداد الجدولة والقوالب والسجل — الإرسال من هاتف المالك فقط</small></div>
      <button type="button" class="btn sm" data-act="smsSettings" style="height:36px;background:#065043;color:#fff;border:0">إعدادات SMS</button>
    </div>

'''
if source.count(anchor) != 1: raise SystemExit('Could not locate the unique settings insertion point')
source = source.replace(anchor, insert + anchor, 1)
engine = engine_file.read_text(encoding='utf-8')
runtime = runtime_file.read_text(encoding='utf-8')
i18n = i18n_file.read_text(encoding='utf-8')
script = '\n<script>\n/* DEYN_SMS_ENGINE_V1 */\n' + engine + '\n' + runtime + '\n</script>\n'
# Load localization after the app markup/scripts so the observer also translates dynamic screens.\ni18n_script = '\n<script>\n/* DEYN_I18N_RUNTIME_V1 */\n' + i18n + '\n</script>\n'
# Stabilize bottom sheets on small Android viewports and prevent long code cards/time inputs from widening the page.
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
# Restore the French language option and the complete translation runtime from DEYN-preview.html.
# The activation-gate toggle is available before/after activation; the settings row is persistent.
if 'id="agLang"' not in source:
    gate = '<div id="actGate"'
    if source.count(gate) != 1: raise SystemExit('Could not locate the unique activation gate for language toggle')
    source = source.replace(gate, gate + '\n  <button type="button" id="agLang" style="position:absolute;top:calc(10px + env(safe-area-inset-top));left:12px;z-index:20;background:#fff;border:1.5px solid #065043;color:#065043;border-radius:10px;padding:6px 12px;font:700 12px sans-serif;cursor:pointer">Français</button>', 1)
if 'data-i18n-setting="language"' not in source:
    lang_anchor = '    <div class="row-set">\n      <div>\n        <b>قفل التطبيق بكلمة المرور</b>'
    lang_row = '''    <div class="row-set" data-i18n-setting="language">
      <div><b>اللغة / Langue</b><small>العربية • Français</small></div>
      <div style="display:flex;gap:6px">
        <button type="button" class="btn sm" onclick="DEYN_I18N.set('ar')" style="height:34px;font-size:12px;padding:0 12px;font-weight:700;border-radius:10px">ع</button>
        <button type="button" class="btn sm" onclick="DEYN_I18N.set('fr')" style="height:34px;font-size:12px;padding:0 12px;font-weight:700;border-radius:10px">FR</button>
      </div>
    </div>

'''
    if source.count(lang_anchor) != 1: raise SystemExit('Could not locate the unique settings anchor for language selector')
    source = source.replace(lang_anchor, lang_row + lang_anchor, 1)
# Four narrow columns made Android time controls clip; two flexible columns keep every day and time visible.
source = source.replace('grid-template-columns:repeat(4,1fr);gap:7px;margin-top:8px', 'grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px')
source = source.replace('grid-template-columns:repeat(4,1fr);gap:7px;margin-top:8px', 'grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px')
i18n_script = '\n<script>\n/* DEYN_I18N_RUNTIME_V1 */\n' + i18n + '\n</script>\n'\nif '</body>' not in source: raise SystemExit('Missing closing body tag')
idx = source.rfind('</body>')
source = source[:idx] + script + i18n_script + source[idx:]
html.write_text(source, encoding='utf-8')
# Native plugin and permissions/dependency are applied by the project's Android preparation script.
native = app / 'native'
native.mkdir(exist_ok=True)
(native / 'DeynSmsPlugin.java').write_text(plugin_file.read_text(encoding='utf-8'), encoding='utf-8')
s = prep.read_text(encoding='utf-8')
if 'DeynSmsPlugin.class' not in s:
    old = 'registerPlugin(DeynSyncPlugin.class);'
    if s.count(old) != 1: raise SystemExit('Could not locate the unique Capacitor plugin registration point')
    s = s.replace(old, old + '\n        registerPlugin(DeynSmsPlugin.class);', 1)
if 'SEND_SMS' not in s:
    old = 'for P in ACCESS_NETWORK_STATE ACCESS_WIFI_STATE CAMERA; do'
    if s.count(old) != 1: raise SystemExit('Could not locate Android permission loop')
    s = s.replace(old, 'for P in ACCESS_NETWORK_STATE ACCESS_WIFI_STATE CAMERA SEND_SMS; do', 1)
if 'androidx.work:work-runtime' not in s:
    marker = 'echo "✔ تم تجهيز مشروع أندرويد"'
    if s.count(marker) != 1: raise SystemExit('Could not locate Android preparation completion marker')
    s = s.replace(marker, '''GRADLE=android/app/build.gradle
if ! grep -q 'androidx.work:work-runtime' "$GRADLE"; then
  sed -i '/dependencies[[:space:]]*{/a\\    implementation "androidx.work:work-runtime:2.9.0"' "$GRADLE"
fi
''' + marker, 1)
prep.write_text(s, encoding='utf-8')
# Structural assertions ensure no preview bridge was copied into the real application.
for marker in ('DEYN_SMS_ENGINE_V1','DEYN_SMS_RUNTIME_V1','DEYN_I18N_RUNTIME_V1','DEYN_FR_DICT','DEYN_I18N.start','id="agLang"','data-i18n-setting="language"','DeynSmsPlugin.class','SEND_SMS','work-runtime:2.9.0','smsSettings','الاستحقاق '):
    hay = source + s
    if marker not in hay: raise SystemExit(f'Integration verification failed: {marker}')
if 'PREVIEW ONLY' in engine or 'mock SMS' in engine: raise SystemExit('Preview bridge detected in SMS engine')
print('Integrated SMS engine/runtime, French localization, customer controls, debt extensions, native plugin, permissions and WorkManager.')
