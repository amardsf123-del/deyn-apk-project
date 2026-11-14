# PRO_4_SOURCE_BUNDLE_2.md — حزمة الأكواد النصية الكاملة للنسخة PRO 4 (الجزء 2 من 3)

- **عدد الملفات في هذه الحزمة**: `31` ملفًا (من أصل `67` ملفًا نصيًا وبرمجيًا في `PRO 4`)
- **إجمالي الحجم الأصلي للملفات في هذه الحزمة**: `360,033` بايت
- **تنبيه**: جميع الملفات أدناه مدرجة بمحتواها الحرفي الكامل دون أي اختصار أو تعديل، ومفصولة بوضوح بمسارها الأصلي.

================================================================================
## [1/31] FILE: `.github/scripts/integrate_sms.py`

- **المسار الأصلي**: `.github/scripts/integrate_sms.py`
- **الحجم**: `17,303` بايت | **الأسطر**: `263` | **SHA-256**: `1b09492d86d71b5dadceee13d3e87133c673528edd23800ded4dcb6b521da40a`

```python
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
due_replacement = """<small class="num">${dateStr(t.ts)} ${timeStr(t.ts)}${t.type === 'debt' ? (() => { const dueAt = Number(t.dueAt) || (c.payDay ? window.DeynSmsCore.nextMonthlyDue(t.ts, c.payDay) : null); return dueAt ? ' • الاستحقاق ' + dateStr(dueAt) + (Array.isArray(t.extensionHistory) && t.extensionHistory.length ? ' • تمديد ' + t.extensionHistory.length : '') : ''; })() : ''}</small>"""
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
```

================================================================================
## [2/31] FILE: `.github/workflows/build-deyn.yml`

- **المسار الأصلي**: `.github/workflows/build-deyn.yml`
- **الحجم**: `1,875` بايت | **الأسطر**: `60` | **SHA-256**: `2aa5f2ad11ad20e2ad29d06f779a68653c77f9f405f9ba4d40595968590641f0`

```yaml
name: Build DEYN APKs

on:
  workflow_dispatch:
  push:
    branches: [main, sms-integration-files, fix/sms-and-fr-complete-2026, sms-professional-2026]
    paths:
      - 'deyn-apk-project.zip'
      - '.github/build-now.txt'
      - '.github/scripts/integrate_sms.py'
      - 'sms/**'
      - 'DeynSmsPlugin.java'
      - 'DeynBackupPlugin.java'
      - 'DeynNotifPlugin.java'

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        app: [deyn-app, deyn-keygen]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Extract and verify project archive
        run: |
          set -euo pipefail
          test -s deyn-apk-project.zip
          unzip -q deyn-apk-project.zip -d source
          if [ "${{ matrix.app }}" = "deyn-app" ] && [ -f .github/scripts/integrate_sms.py ]; then
            python3 .github/scripts/integrate_sms.py source sms/engine.js DeynSmsPlugin.java
            node sms/test.mjs | tee test-results-sms.log
          fi
      - name: Build APK
        working-directory: source/${{ matrix.app }}
        run: |
          npm install
          python3 scripts/fetch_fonts.py
          npx cap add android
          bash scripts/prepare-android.sh
          npx cap sync android
          cd android
          ./gradlew assembleDebug
      - name: Upload debug APK for testing only
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.app }}-debug-apk
          path: source/${{ matrix.app }}/android/app/build/outputs/apk/debug/*.apk
          if-no-files-found: error
          retention-days: 14
```

================================================================================
## [3/31] FILE: `.github/workflows/build-sms-test.yml`

- **المسار الأصلي**: `.github/workflows/build-sms-test.yml`
- **الحجم**: `5,104` بايت | **الأسطر**: `126` | **SHA-256**: `e2d1c6adde8ecf900fd9249c5ff24ea4040bde86bb2c421fcd12d5ace945b8f7`

```yaml
name: DEYN SMS professional integration and Android test build

on:
  push:
    branches: [sms-integration-files, sms-professional-2026, fix/sms-and-fr-complete-2026]
    paths:
      - '.github/workflows/build-sms-test.yml'
      - '.github/scripts/integrate_sms.py'
      - 'sms/**'
      - 'DeynSmsPlugin.java'
      - 'DeynBackupPlugin.java'
      - 'DeynNotifPlugin.java'
      - 'deyn-apk-project.zip'
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: deyn-sms-${{ github.ref }}
  cancel-in-progress: true

defaults:
  run:
    shell: bash

jobs:
  build-debug:
    runs-on: ubuntu-latest
    timeout-minutes: 50
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Extract the real DEYN project archive
        run: |
          set -euo pipefail
          test -s deyn-apk-project.zip
          test -s sms/engine.js
          test -s sms/runtime.js
          test -s sms/completion.js
          test -s DeynSmsPlugin.java
          test -s DeynBackupPlugin.java
          test -s DeynNotifPlugin.java
          mkdir source
          unzip -q deyn-apk-project.zip -d source
          test -s source/deyn-app/www/index.html
      - name: Integrate the SMS & Completion features into the real app source
        run: python3 .github/scripts/integrate_sms.py source sms/engine.js DeynSmsPlugin.java
      - name: Verify every integrated JavaScript block
        run: |
          python3 - <<'PY'
          from pathlib import Path
          import re, subprocess, tempfile
          html = Path('source/deyn-app/www/index.html').read_text(encoding='utf-8')
          scripts = re.findall(r'<script(?:\s[^>]*)?>([\s\S]*?)</script\s*>', html, re.I)
          if len(scripts) < 2 or 'DEYN_SMS_ENGINE_V1' not in html or 'DEYN_SMS_RUNTIME_V1' not in html or 'DEYN_COMPLETION_RUNTIME_V2' not in html:
              raise SystemExit('SMS/Completion runtime was not integrated into the actual app HTML')
          for i, script in enumerate(scripts):
              if script.strip():
                  p = Path(tempfile.gettempdir()) / f'deyn-inline-{i}.js'
                  p.write_text(script, encoding='utf-8')
                  subprocess.run(['node', '--check', str(p)], check=True)
          print(f'Checked {len(scripts)} inline script blocks')
          PY
      - name: Run SMS engine unit and edge-case tests
        run: node sms/test.mjs | tee -a test-results.log
      - name: Install Chromium for DEYN browser security tests
        run: |
          python3 -m pip install --disable-pip-version-check playwright opencv-python-headless numpy
          python3 -m playwright install --with-deps chromium
      - name: Run existing DEYN security, storage, time and sync suites
        working-directory: source
        run: |
          set -euo pipefail
          node trusted-time/test.mjs | tee -a ../test-results.log
          node sync/test_engine.mjs | tee -a ../test-results.log
          node sync/test_session.mjs | tee -a ../test-results.log
          for test_file in tests/e2e/test_*.py; do
            echo "===== Running ${test_file} =====" | tee -a ../test-results.log
            python3 "${test_file}" | tee -a ../test-results.log
          done
      - name: Upload reviewable test results log
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: deyn-test-results-log
          path: test-results.log
          if-no-files-found: warn
          retention-days: 14
      - name: Install Capacitor and Android dependencies
        working-directory: source/deyn-app
        run: |
          npm install
          python3 scripts/fetch_fonts.py
          npx cap add android
          bash scripts/prepare-android.sh
          npx cap sync android
          for CLS in DeynVaultPlugin.class DeynSyncPlugin.class DeynSmsPlugin.class DeynBackupPlugin.class DeynNotifPlugin.class; do
            grep -q "$CLS" scripts/prepare-android.sh
          done
          for PERM in SEND_SMS RECEIVE_BOOT_COMPLETED POST_NOTIFICATIONS; do
            grep -q "$PERM" android/app/src/main/AndroidManifest.xml
          done
          grep -q 'androidx.work:work-runtime' android/app/build.gradle
          for SRC in DeynVaultPlugin.java DeynSyncPlugin.java DeynSmsPlugin.java DeynBackupPlugin.java DeynNotifPlugin.java; do
            test -s "android/app/src/main/java/com/deyn/app/$SRC"
          done
      - name: Build debug APK for testing (debug signing)
        working-directory: source/deyn-app/android
        run: ./gradlew --no-daemon assembleDebug
      - name: Upload APK for owner testing only
        uses: actions/upload-artifact@v4
        with:
          name: deyn-sms-professional-debug-apk
          path: source/deyn-app/android/app/build/outputs/apk/debug/*.apk
          if-no-files-found: error
          retention-days: 14
```

================================================================================
## [4/31] FILE: `.github/workflows/export-deyn-labs.yml`

- **المسار الأصلي**: `.github/workflows/export-deyn-labs.yml`
- **الحجم**: `1,402` بايت | **الأسطر**: `52` | **SHA-256**: `1db4c5fc0d62242f0e0dfbf174d57474737f8796736b711a88c56c1efb7e2b83`

```yaml
name: Export DEYN lab branches for review

on:
  workflow_dispatch:
  push:
    branches: [main]
    paths:
      - ".github/workflows/export-deyn-labs.yml"

permissions:
  contents: read

jobs:
  export:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout all branches
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Package review-safe branch archives
        shell: bash
        run: |
          set -euo pipefail
          for branch in security-v2-lab cloud-sync-lab ouisync-poc; do
            git worktree add "/tmp/$branch" "origin/$branch"
            (cd "/tmp/$branch" && zip -qr "$GITHUB_WORKSPACE/DEYN-$branch.zip" . \
              -x '*.pem' '*.key' '.env' '.env.*' '*private*key*' '*secret*')
            git worktree remove "/tmp/$branch"
          done

      - name: Upload security lab
        uses: actions/upload-artifact@v4
        with:
          name: DEYN-security-v2-lab
          path: DEYN-security-v2-lab.zip
          retention-days: 7

      - name: Upload cloud sync lab
        uses: actions/upload-artifact@v4
        with:
          name: DEYN-cloud-sync-lab
          path: DEYN-cloud-sync-lab.zip
          retention-days: 7

      - name: Upload local sync POC
        uses: actions/upload-artifact@v4
        with:
          name: DEYN-ouisync-poc
          path: DEYN-ouisync-poc.zip
          retention-days: 7
```

================================================================================
## [5/31] FILE: `DeynSmsPlugin.java`

- **المسار الأصلي**: `DeynSmsPlugin.java`
- **الحجم**: `43,549` بايت | **الأسطر**: `896` | **SHA-256**: `eab4f4e6a1d8f64de29b20adda25ba21ba46e2f1778ccfbac376085f7a334f7b`

```java
package com.deyn.app;

import android.Manifest;
import android.app.Activity;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.telephony.SmsManager;
import android.telephony.SmsMessage;
import android.telephony.SubscriptionManager;
import androidx.annotation.NonNull;
import androidx.work.Data;
import androidx.work.ExistingWorkPolicy;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import org.json.JSONArray;
import org.json.JSONObject;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@CapacitorPlugin(name = "DeynSms", permissions = {
    @Permission(strings = { Manifest.permission.SEND_SMS }, alias = "sms")
})
public class DeynSmsPlugin extends Plugin {
    public static final String PREFS = "deyn_sms";
    public static final String SENT = "sent_ids";
    public static final String CLAIMED = "claimed_ids";
    public static final String PARTIAL = "partial_ids";
    public static final String FAILED = "failed_ids";
    public static final String TRACKED = "tracked_ids";
    public static final String ACTIVE = "active_ids";
    public static final String ACTIVE_PAYLOADS = "active_payloads";
    public static final String ACTIVE_QUEUE_JSON = "active_queue_json";
    public static final String NEXT_SEND_AT = "next_send_at";
    public static final String TAG = "deyn_sms_queue";

    public static final String STATUS_ATTEMPTING = "attempting";
    public static final String STATUS_ACCEPTED = "accepted_by_android";
    public static final String STATUS_SENT_TO_NETWORK = "sent_to_network";
    public static final String STATUS_DELIVERED = "delivered";
    public static final String STATUS_PARTIAL_FAILURE = "partial_failure";
    public static final String STATUS_FAILED = "failed";
    public static final String STATUS_DISPATCH_UNCERTAIN = "dispatch_uncertain";

    public static final String ACTION_SMS_SENT = "com.deyn.app.SMS_SENT";
    public static final String ACTION_SMS_DELIVERED = "com.deyn.app.SMS_DELIVERED";

    private static final String STATUS_PREFIX = "status_";
    private static final String PHONE_PREFIX = "phone_";
    private static final String ATTEMPT_AT_PREFIX = "attempt_at_";
    private static final String ACCEPTED_AT_PREFIX = "accepted_at_";
    private static final String SENT_AT_PREFIX = "sent_at_";
    private static final String DELIVERED_AT_PREFIX = "delivered_at_";
    private static final String PARTS_TOTAL_PREFIX = "parts_total_";
    private static final String PARTS_SENT_SET_PREFIX = "parts_sent_set_";
    private static final String PARTS_FAILED_SET_PREFIX = "parts_failed_set_";
    private static final String PARTS_DELIVERED_SET_PREFIX = "parts_delivered_set_";
    private static final String LAST_ERROR_PREFIX = "last_error_";

    private static final long WAIT_FOR_RADIO_MS = 20000L;
    private static final long STALE_INFLIGHT_MS = 180000L;
    private static final Object LOCK = new Object();
    private static final ExecutorService SEND_EXECUTOR = Executors.newSingleThreadExecutor();
    private static volatile boolean dynamicReceiverRegistered = false;

    @Override
    public void load() {
        super.load();
        ensureDynamicReceiver(getContext());
    }

    private static void ensureDynamicReceiver(Context context) {
        if (context == null || dynamicReceiverRegistered) return;
        synchronized (LOCK) {
            if (dynamicReceiverRegistered) return;
            try {
                Context appCtx = context.getApplicationContext() != null ? context.getApplicationContext() : context;
                IntentFilter filter = new IntentFilter();
                filter.addAction(ACTION_SMS_SENT);
                filter.addAction(ACTION_SMS_DELIVERED);
                SmsStatusReceiver receiver = new SmsStatusReceiver();
                if (Build.VERSION.SDK_INT >= 33) {
                    appCtx.registerReceiver(receiver, filter, Context.RECEIVER_NOT_EXPORTED);
                } else {
                    appCtx.registerReceiver(receiver, filter);
                }
                dynamicReceiverRegistered = true;
            } catch (Exception ignored) {
                // Static AndroidManifest registration remains active as primary receiver.
            }
        }
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        call.resolve(permissionState());
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (getPermissionState("sms") == PermissionState.GRANTED) {
            call.resolve(permissionState());
            return;
        }
        requestPermissionForAlias("sms", call, "permissionCallback");
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        call.resolve(permissionState());
    }

    private JSObject permissionState() {
        JSObject out = new JSObject();
        out.put("sms", getPermissionState("sms") == PermissionState.GRANTED ? "granted" : "denied");
        return out;
    }

    @PluginMethod
    public void send(PluginCall call) {
        if (getPermissionState("sms") != PermissionState.GRANTED) {
            call.reject("SMS permission not granted");
            return;
        }
        final String id = call.getString("id");
        final String phone = call.getString("phone");
        final String message = call.getString("message");
        final long timeoutMs = Math.max(1000L, Math.min(30000L, call.getLong("timeoutMs", WAIT_FOR_RADIO_MS)));
        if (id == null || id.trim().isEmpty() || phone == null || phone.trim().isEmpty() || message == null || message.trim().isEmpty()) {
            call.reject("Missing SMS id, phone or message");
            return;
        }
        final Context context = getContext();
        ensureDynamicReceiver(context);
        SEND_EXECUTOR.execute(() -> {
            try {
                DispatchResult dispatched = dispatchOnce(context, id.trim(), phone.trim(), message, false, 0L, 0);
                if (!dispatched.dispatched) {
                    JSObject snap = buildItemSnapshot(prefs(context), id.trim());
                    snap.put("duplicate", true);
                    call.resolve(snap);
                    return;
                }
                JSObject outcome = awaitDispatchOutcome(context, id.trim(), timeoutMs);
                outcome.put("duplicate", false);
                call.resolve(outcome);
            } catch (Exception e) {
                call.reject("SMS send failed: " + e.getClass().getSimpleName() + (e.getMessage() != null ? " (" + e.getMessage() + ")" : ""));
            }
        });
    }

    /** Replace the authoritative scheduled queue and persist its snapshot for reboot recovery. */
    @PluginMethod
    public void schedule(PluginCall call) {
        try {
            Context context = getContext();
            ensureDynamicReceiver(context);
            JSArray items = call.getArray("items", new JSArray());
            Set<String> active = new HashSet<>();
            Set<String> activePayloads = new HashSet<>();
            JSONArray persistedQueue = new JSONArray();
            Set<String> previousActive;
            synchronized (LOCK) {
                previousActive = new HashSet<>(prefs(context).getStringSet(ACTIVE, new HashSet<>()));
            }
            for (int i = 0; i < items.length(); i++) {
                JSONObject item = items.getJSONObject(i);
                String id = item.optString("id", "").trim();
                String phone = item.optString("phone", "").trim();
                String message = item.optString("message", "");
                long at = item.optLong("at", 0L);
                int gap = Math.max(1, Math.min(60, item.optInt("gapMinutes", 5)));
                if (!id.isEmpty() && !phone.isEmpty() && !message.trim().isEmpty() && at > 0) {
                    active.add(id);
                    activePayloads.add(payloadKey(id, phone, message, at));
                    JSONObject clean = new JSONObject();
                    clean.put("id", id);
                    clean.put("phone", phone);
                    clean.put("message", message);
                    clean.put("at", at);
                    clean.put("gapMinutes", gap);
                    persistedQueue.put(clean);
                }
            }
            synchronized (LOCK) {
                SharedPreferences.Editor ed = prefs(context).edit()
                    .putStringSet(ACTIVE, active)
                    .putStringSet(ACTIVE_PAYLOADS, activePayloads)
                    .putString(ACTIVE_QUEUE_JSON, persistedQueue.toString());
                if (!ed.commit()) {
                    throw new IllegalStateException("Could not persist active queue");
                }
            }
            WorkManager wm = WorkManager.getInstance(context);
            for (String oldId : previousActive) {
                if (!active.contains(oldId)) {
                    wm.cancelUniqueWork("deyn_sms_" + oldId);
                    wm.cancelUniqueWork("deyn_sms_deferred_" + oldId);
                }
            }
            long now = System.currentTimeMillis();
            int queued = enqueueQueueItems(context, wm, persistedQueue, active, now, ExistingWorkPolicy.REPLACE);
            JSObject out = new JSObject();
            out.put("count", queued);
            out.put("replacedActiveItems", true);
            call.resolve(out);
        } catch (Exception e) {
            call.reject("SMS scheduling failed: " + e.getClass().getSimpleName());
        }
    }

    @PluginMethod
    public void getSent(PluginCall call) {
        Context context = getContext();
        synchronized (LOCK) {
            reconcileStaleInFlightLocked(prefs(context), System.currentTimeMillis());
            SharedPreferences sp = prefs(context);
            Set<String> sentIds = new HashSet<>(sp.getStringSet(SENT, new HashSet<>()));
            Set<String> tracked = new HashSet<>(sp.getStringSet(TRACKED, new HashSet<>()));
            tracked.addAll(sentIds);
            tracked.addAll(sp.getStringSet(CLAIMED, new HashSet<>()));
            tracked.addAll(sp.getStringSet(PARTIAL, new HashSet<>()));
            tracked.addAll(sp.getStringSet(FAILED, new HashSet<>()));

            JSArray ids = new JSArray();
            JSArray items = new JSArray();
            JSArray uncertain = new JSArray();
            JSArray failed = new JSArray();

            for (String id : sentIds) {
                ids.put(id);
            }
            for (String id : tracked) {
                JSObject item = buildItemSnapshot(sp, id);
                items.put(item);
                String st = item.getString("status");
                if (STATUS_DISPATCH_UNCERTAIN.equals(st) || STATUS_PARTIAL_FAILURE.equals(st)) {
                    uncertain.put(item);
                }
                if (STATUS_FAILED.equals(st) || STATUS_PARTIAL_FAILURE.equals(st)) {
                    failed.put(item);
                }
            }
            JSObject out = new JSObject();
            out.put("ids", ids);
            out.put("items", items);
            out.put("uncertain", uncertain);
            out.put("failed", failed);
            call.resolve(out);
        }
    }

    static int enqueueQueueItems(Context context, WorkManager wm, JSONArray queue, Set<String> active, long now, ExistingWorkPolicy policy) throws Exception {
        int queued = 0;
        for (int i = 0; i < queue.length(); i++) {
            JSONObject item = queue.getJSONObject(i);
            String id = item.getString("id");
            if (!active.contains(id) || isTerminalOrInFlight(context, id)) continue;
            long at = item.getLong("at");
            long delay = Math.max(0L, at - now);
            int gap = Math.max(1, Math.min(60, item.optInt("gapMinutes", 5)));
            Data data = new Data.Builder()
                .putString("id", id)
                .putString("phone", item.getString("phone"))
                .putString("message", item.getString("message"))
                .putLong("at", at)
                .putInt("gap", gap)
                .build();
            OneTimeWorkRequest request = new OneTimeWorkRequest.Builder(SmsWorker.class)
                .setInitialDelay(delay, TimeUnit.MILLISECONDS)
                .setInputData(data)
                .addTag(TAG)
                .build();
            wm.enqueueUniqueWork("deyn_sms_" + id, policy, request);
            if (policy == ExistingWorkPolicy.REPLACE) {
                wm.cancelUniqueWork("deyn_sms_deferred_" + id);
            }
            queued++;
        }
        return queued;
    }

    public static int rescheduleActiveQueue(Context context) {
        if (context == null) return 0;
        synchronized (LOCK) {
            try {
                SharedPreferences sp = prefs(context);
                reconcileStaleInFlightLocked(sp, System.currentTimeMillis());
                String raw = sp.getString(ACTIVE_QUEUE_JSON, "[]");
                Set<String> active = new HashSet<>(sp.getStringSet(ACTIVE, new HashSet<>()));
                if (active.isEmpty() || raw == null || raw.isEmpty()) return 0;
                JSONArray queue = new JSONArray(raw);
                WorkManager wm = WorkManager.getInstance(context);
                return enqueueQueueItems(context, wm, queue, active, System.currentTimeMillis(), ExistingWorkPolicy.KEEP);
            } catch (Exception e) {
                return 0;
            }
        }
    }

    static String payloadKey(String id, String phone, String message, long at) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(message.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte b : digest) hex.append(String.format(Locale.ROOT, "%02x", b & 0xff));
            return id + "\n" + phone + "\n" + at + "\n" + hex;
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static boolean isTerminalOrInFlight(Context c, String id) {
        synchronized (LOCK) {
            SharedPreferences sp = prefs(c);
            reconcileStaleInFlightLocked(sp, System.currentTimeMillis());
            if (sp.getStringSet(SENT, new HashSet<>()).contains(id)) return true;
            if (sp.getStringSet(PARTIAL, new HashSet<>()).contains(id)) return true;
            if (sp.getStringSet(CLAIMED, new HashSet<>()).contains(id)) return true;
            String st = sp.getString(STATUS_PREFIX + id, "");
            return STATUS_SENT_TO_NETWORK.equals(st)
                || STATUS_DELIVERED.equals(st)
                || STATUS_PARTIAL_FAILURE.equals(st)
                || STATUS_DISPATCH_UNCERTAIN.equals(st);
        }
    }

    private static void reconcileStaleInFlightLocked(SharedPreferences sp, long now) {
        Set<String> claimed = new HashSet<>(sp.getStringSet(CLAIMED, new HashSet<>()));
        if (claimed.isEmpty()) return;
        boolean dirty = false;
        SharedPreferences.Editor ed = sp.edit();
        for (String id : new HashSet<>(claimed)) {
            String st = sp.getString(STATUS_PREFIX + id, STATUS_ATTEMPTING);
            long attemptAt = sp.getLong(ATTEMPT_AT_PREFIX + id, 0L);
            long acceptedAt = sp.getLong(ACCEPTED_AT_PREFIX + id, attemptAt);
            long ref = Math.max(attemptAt, acceptedAt);
            if ((STATUS_ATTEMPTING.equals(st) || STATUS_ACCEPTED.equals(st)) && ref > 0L && (now - ref) > STALE_INFLIGHT_MS) {
                int total = sp.getInt(PARTS_TOTAL_PREFIX + id, 1);
                Set<String> sentParts = new HashSet<>(sp.getStringSet(PARTS_SENT_SET_PREFIX + id, new HashSet<>()));
                Set<String> failedParts = new HashSet<>(sp.getStringSet(PARTS_FAILED_SET_PREFIX + id, new HashSet<>()));
                if (!sentParts.isEmpty() && !failedParts.isEmpty()) {
                    ed.putString(STATUS_PREFIX + id, STATUS_PARTIAL_FAILURE);
                    Set<String> partial = new HashSet<>(sp.getStringSet(PARTIAL, new HashSet<>()));
                    partial.add(id);
                    ed.putStringSet(PARTIAL, partial);
                    claimed.remove(id);
                    dirty = true;
                } else {
                    ed.putString(STATUS_PREFIX + id, STATUS_DISPATCH_UNCERTAIN);
                    dirty = true;
                }
            }
        }
        if (dirty) {
            ed.putStringSet(CLAIMED, claimed).commit();
        }
    }

    private static SmsManager resolveSmsManager(Context c) {
        SmsManager manager = null;
        try {
            int subId = SmsManager.getDefaultSmsSubscriptionId();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                SmsManager base = c.getSystemService(SmsManager.class);
                if (base != null) {
                    manager = (subId != SubscriptionManager.INVALID_SUBSCRIPTION_ID)
                        ? base.createForSubscriptionId(subId)
                        : base;
                }
            } else if (subId != SubscriptionManager.INVALID_SUBSCRIPTION_ID) {
                manager = SmsManager.getSmsManagerForSubscriptionId(subId);
            }
        } catch (Throwable ignored) {}
        if (manager == null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                manager = c.getSystemService(SmsManager.class);
            }
            if (manager == null) {
                manager = SmsManager.getDefault();
            }
        }
        return manager;
    }

    /** Deterministic fallback splitter matching GSM-7 (160/153) and UCS-2 (70/67) limits if divideMessage returns empty. */
    public static ArrayList<String> splitMessageFallback(String message) {
        ArrayList<String> out = new ArrayList<>();
        if (message == null || message.isEmpty()) return out;
        boolean ucs2 = false;
        for (int i = 0; i < message.length(); i++) {
            char ch = message.charAt(i);
            if (ch > 0x7F) {
                ucs2 = true;
                break;
            }
        }
        int singleLimit = ucs2 ? 70 : 160;
        int multiLimit = ucs2 ? 67 : 153;
        if (message.length() <= singleLimit) {
            out.add(message);
            return out;
        }
        int idx = 0;
        int len = message.length();
        while (idx < len) {
            int end = Math.min(len, idx + multiLimit);
            if (end < len && Character.isHighSurrogate(message.charAt(end - 1)) && Character.isLowSurrogate(message.charAt(end))) {
                end--;
            }
            if (end <= idx) end = Math.min(len, idx + multiLimit);
            out.add(message.substring(idx, end));
            idx = end;
        }
        return out;
    }

    private static int requestCodeFor(String id, int partIndex, String kind) {
        String key = id + "#" + partIndex + "#" + kind;
        return (key.hashCode() & 0x7fffffff);
    }

    private static PendingIntent buildPartBroadcastIntent(Context c, String action, String id, int partIndex, int totalParts, long attemptAt) {
        Intent intent = new Intent(c, SmsStatusReceiver.class)
            .setAction(action)
            .setPackage(c.getPackageName())
            .putExtra("id", id)
            .putExtra("partIndex", partIndex)
            .putExtra("totalParts", totalParts)
            .putExtra("attemptAt", attemptAt);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            flags |= PendingIntent.FLAG_MUTABLE;
        }
        return PendingIntent.getBroadcast(c, requestCodeFor(id, partIndex, action), intent, flags);
    }

    public static final class DispatchResult {
        public final boolean dispatched;
        public final int totalParts;
        public final String status;
        public DispatchResult(boolean dispatched, int totalParts, String status) {
            this.dispatched = dispatched;
            this.totalParts = totalParts;
            this.status = status;
        }
    }

    /**
     * Dispatches an SMS (single-part or multi-part) with per-part PendingIntents.
     * Does NOT mark the message as sent in SENT until SmsStatusReceiver confirms RESULT_OK for every part.
     */
    public static DispatchResult dispatchOnce(Context c, String id, String phone, String message, boolean requireActive, long scheduledAt, int gapMinutes) {
        synchronized (LOCK) {
            SharedPreferences sp = prefs(c);
            reconcileStaleInFlightLocked(sp, System.currentTimeMillis());
            Set<String> sent = new HashSet<>(sp.getStringSet(SENT, new HashSet<>()));
            Set<String> claimed = new HashSet<>(sp.getStringSet(CLAIMED, new HashSet<>()));
            Set<String> partial = new HashSet<>(sp.getStringSet(PARTIAL, new HashSet<>()));
            Set<String> failed = new HashSet<>(sp.getStringSet(FAILED, new HashSet<>()));
            Set<String> tracked = new HashSet<>(sp.getStringSet(TRACKED, new HashSet<>()));

            if (requireActive) {
                String payload = payloadKey(id, phone, message, scheduledAt);
                if (!sp.getStringSet(ACTIVE, new HashSet<>()).contains(id) || !sp.getStringSet(ACTIVE_PAYLOADS, new HashSet<>()).contains(payload)) {
                    return new DispatchResult(false, 0, "inactive");
                }
            }
            if (sent.contains(id)) {
                return new DispatchResult(false, sp.getInt(PARTS_TOTAL_PREFIX + id, 1), sp.getString(STATUS_PREFIX + id, STATUS_SENT_TO_NETWORK));
            }
            if (partial.contains(id)) {
                return new DispatchResult(false, sp.getInt(PARTS_TOTAL_PREFIX + id, 1), STATUS_PARTIAL_FAILURE);
            }
            if (claimed.contains(id)) {
                if (requireActive && gapMinutes > 0) {
                    sp.edit().putLong(NEXT_SEND_AT, Math.max(sp.getLong(NEXT_SEND_AT, 0L), System.currentTimeMillis() + gapMinutes * 60000L)).commit();
                }
                return new DispatchResult(false, sp.getInt(PARTS_TOTAL_PREFIX + id, 1), sp.getString(STATUS_PREFIX + id, STATUS_ACCEPTED));
            }

            SmsManager manager = resolveSmsManager(c);
            if (manager == null) {
                throw new IllegalStateException("SMS service unavailable");
            }
            ArrayList<String> parts = manager.divideMessage(message);
            if (parts == null || parts.isEmpty()) {
                parts = splitMessageFallback(message);
            }
            if (parts.isEmpty()) {
                throw new IllegalArgumentException("Empty SMS parts");
            }
            int totalParts = parts.size();
            long attemptAt = System.currentTimeMillis();

            claimed.add(id);
            failed.remove(id);
            tracked.add(id);

            SharedPreferences.Editor preEdit = sp.edit()
                .putStringSet(CLAIMED, claimed)
                .putStringSet(FAILED, failed)
                .putStringSet(TRACKED, tracked)
                .putString(STATUS_PREFIX + id, STATUS_ATTEMPTING)
                .putString(PHONE_PREFIX + id, phone)
                .putLong(ATTEMPT_AT_PREFIX + id, attemptAt)
                .putInt(PARTS_TOTAL_PREFIX + id, totalParts)
                .putStringSet(PARTS_SENT_SET_PREFIX + id, new HashSet<>())
                .putStringSet(PARTS_FAILED_SET_PREFIX + id, new HashSet<>())
                .putStringSet(PARTS_DELIVERED_SET_PREFIX + id, new HashSet<>())
                .remove(LAST_ERROR_PREFIX + id);
            if (!preEdit.commit()) {
                throw new IllegalStateException("Could not persist SMS attempt state");
            }

            ArrayList<PendingIntent> sentIntents = new ArrayList<>(totalParts);
            ArrayList<PendingIntent> deliveryIntents = new ArrayList<>(totalParts);
            for (int i = 0; i < totalParts; i++) {
                sentIntents.add(buildPartBroadcastIntent(c, ACTION_SMS_SENT, id, i, totalParts, attemptAt));
                deliveryIntents.add(buildPartBroadcastIntent(c, ACTION_SMS_DELIVERED, id, i, totalParts, attemptAt));
            }

            try {
                if (totalParts == 1) {
                    manager.sendTextMessage(phone, null, parts.get(0), sentIntents.get(0), deliveryIntents.get(0));
                } else {
                    manager.sendMultipartTextMessage(phone, null, parts, sentIntents, deliveryIntents);
                }
            } catch (Exception e) {
                // Synchronous API rejection: release claim and record failure so retry is possible.
                claimed.remove(id);
                failed.add(id);
                sp.edit()
                    .putStringSet(CLAIMED, claimed)
                    .putStringSet(FAILED, failed)
                    .putString(STATUS_PREFIX + id, STATUS_FAILED)
                    .putString(LAST_ERROR_PREFIX + id, e.getClass().getSimpleName() + (e.getMessage() != null ? ": " + e.getMessage() : ""))
                    .commit();
                throw e;
            }

            long acceptedAt = System.currentTimeMillis();
            String currentStatus = sp.getString(STATUS_PREFIX + id, STATUS_ATTEMPTING);
            SharedPreferences.Editor postEdit = sp.edit().putLong(ACCEPTED_AT_PREFIX + id, acceptedAt);
            if (STATUS_ATTEMPTING.equals(currentStatus)) {
                postEdit.putString(STATUS_PREFIX + id, STATUS_ACCEPTED);
                currentStatus = STATUS_ACCEPTED;
            }
            if (requireActive && gapMinutes > 0) {
                postEdit.putLong(NEXT_SEND_AT, acceptedAt + gapMinutes * 60000L);
            }
            if (!postEdit.commit()) {
                throw new IllegalStateException("Could not persist SMS acceptance timestamp");
            }
            return new DispatchResult(true, totalParts, currentStatus);
        }
    }

    public static JSObject awaitDispatchOutcome(Context c, String id, long timeoutMs) {
        long deadline = System.currentTimeMillis() + Math.max(0L, timeoutMs);
        synchronized (LOCK) {
            while (true) {
                SharedPreferences sp = prefs(c);
                String st = sp.getString(STATUS_PREFIX + id, STATUS_ATTEMPTING);
                if (STATUS_SENT_TO_NETWORK.equals(st) || STATUS_DELIVERED.equals(st) || STATUS_PARTIAL_FAILURE.equals(st) || STATUS_FAILED.equals(st)) {
                    return buildItemSnapshot(sp, id);
                }
                long remaining = deadline - System.currentTimeMillis();
                if (remaining <= 0L) {
                    return buildItemSnapshot(sp, id);
                }
                try {
                    LOCK.wait(Math.min(remaining, 250L));
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return buildItemSnapshot(prefs(c), id);
                }
            }
        }
    }

    static JSObject buildItemSnapshot(SharedPreferences sp, String id) {
        String st = sp.getString(STATUS_PREFIX + id, sp.getStringSet(SENT, new HashSet<>()).contains(id) ? STATUS_SENT_TO_NETWORK : STATUS_DISPATCH_UNCERTAIN);
        int partsTotal = Math.max(1, sp.getInt(PARTS_TOTAL_PREFIX + id, 1));
        Set<String> sentParts = sp.getStringSet(PARTS_SENT_SET_PREFIX + id, new HashSet<>());
        Set<String> failedParts = sp.getStringSet(PARTS_FAILED_SET_PREFIX + id, new HashSet<>());
        Set<String> deliveredParts = sp.getStringSet(PARTS_DELIVERED_SET_PREFIX + id, new HashSet<>());
        int partsSent = sentParts != null ? sentParts.size() : 0;
        int partsFailed = failedParts != null ? failedParts.size() : 0;
        int partsDelivered = deliveredParts != null ? deliveredParts.size() : 0;
        if ((STATUS_SENT_TO_NETWORK.equals(st) || STATUS_DELIVERED.equals(st)) && partsSent == 0) {
            partsSent = partsTotal;
        }
        boolean isSentToNetwork = STATUS_SENT_TO_NETWORK.equals(st) || STATUS_DELIVERED.equals(st);
        boolean isAccepted = isSentToNetwork || STATUS_ACCEPTED.equals(st) || STATUS_PARTIAL_FAILURE.equals(st);
        boolean isDelivered = STATUS_DELIVERED.equals(st);

        JSObject item = new JSObject();
        item.put("id", id);
        item.put("phone", sp.getString(PHONE_PREFIX + id, ""));
        item.put("status", st);
        item.put("sent", isSentToNetwork);
        item.put("accepted", isAccepted);
        item.put("delivered", isDelivered);
        item.put("partsTotal", partsTotal);
        item.put("partsSent", partsSent);
        item.put("partsFailed", partsFailed);
        item.put("partsDelivered", partsDelivered);
        item.put("attemptAt", sp.getLong(ATTEMPT_AT_PREFIX + id, 0L));
        item.put("acceptedAt", sp.getLong(ACCEPTED_AT_PREFIX + id, 0L));
        item.put("sentAt", sp.getLong(SENT_AT_PREFIX + id, 0L));
        item.put("deliveredAt", sp.getLong(DELIVERED_AT_PREFIX + id, 0L));
        String err = sp.getString(LAST_ERROR_PREFIX + id, "");
        if (err != null && !err.isEmpty()) {
            item.put("error", err);
        }
        return item;
    }

    /** Record the result of sending a single SMS part from SmsStatusReceiver. */
    public static void handlePartSent(Context context, String id, int partIndex, int totalParts, int resultCode, int errorCode) {
        if (context == null || id == null || id.isEmpty()) return;
        synchronized (LOCK) {
            SharedPreferences sp = prefs(context);
            int expectedTotal = Math.max(1, totalParts > 0 ? totalParts : sp.getInt(PARTS_TOTAL_PREFIX + id, 1));
            int validIndex = Math.max(0, partIndex);
            Set<String> sentParts = new HashSet<>(sp.getStringSet(PARTS_SENT_SET_PREFIX + id, new HashSet<>()));
            Set<String> failedParts = new HashSet<>(sp.getStringSet(PARTS_FAILED_SET_PREFIX + id, new HashSet<>()));
            Set<String> sentIds = new HashSet<>(sp.getStringSet(SENT, new HashSet<>()));
            Set<String> claimedIds = new HashSet<>(sp.getStringSet(CLAIMED, new HashSet<>()));
            Set<String> partialIds = new HashSet<>(sp.getStringSet(PARTIAL, new HashSet<>()));
            Set<String> failedIds = new HashSet<>(sp.getStringSet(FAILED, new HashSet<>()));
            Set<String> trackedIds = new HashSet<>(sp.getStringSet(TRACKED, new HashSet<>()));
            trackedIds.add(id);

            String partKey = String.valueOf(validIndex);
            SharedPreferences.Editor ed = sp.edit()
                .putInt(PARTS_TOTAL_PREFIX + id, expectedTotal)
                .putStringSet(TRACKED, trackedIds);

            if (resultCode == Activity.RESULT_OK) {
                sentParts.add(partKey);
                failedParts.remove(partKey);
            } else {
                failedParts.add(partKey);
                String errDesc = "part=" + (validIndex + 1) + "/" + expectedTotal + ",resultCode=" + resultCode + (errorCode != -1 ? ",errorCode=" + errorCode : "");
                ed.putString(LAST_ERROR_PREFIX + id, errDesc);
            }

            ed.putStringSet(PARTS_SENT_SET_PREFIX + id, sentParts);
            ed.putStringSet(PARTS_FAILED_SET_PREFIX + id, failedParts);

            if (sentParts.size() + failedParts.size() >= expectedTotal) {
                long now = System.currentTimeMillis();
                claimedIds.remove(id);
                ed.putStringSet(CLAIMED, claimedIds);

                if (failedParts.isEmpty() && sentParts.size() >= expectedTotal) {
                    // Every part confirmed sent to the network.
                    String curStatus = sp.getString(STATUS_PREFIX + id, STATUS_ACCEPTED);
                    if (!STATUS_DELIVERED.equals(curStatus)) {
                        ed.putString(STATUS_PREFIX + id, STATUS_SENT_TO_NETWORK);
                    }
                    ed.putLong(SENT_AT_PREFIX + id, now);
                    sentIds.add(id);
                    partialIds.remove(id);
                    failedIds.remove(id);
                    ed.putStringSet(SENT, sentIds).putStringSet(PARTIAL, partialIds).putStringSet(FAILED, failedIds);
                } else if (!sentParts.isEmpty()) {
                    // Partial failure: some parts reached the network, at least one part failed.
                    // Never record as full success in SENT.
                    ed.putString(STATUS_PREFIX + id, STATUS_PARTIAL_FAILURE);
                    sentIds.remove(id);
                    partialIds.add(id);
                    failedIds.remove(id);
                    ed.putStringSet(SENT, sentIds).putStringSet(PARTIAL, partialIds).putStringSet(FAILED, failedIds);
                } else {
                    // Complete failure: 0 parts sent. Release claim so WorkManager or manual action can retry.
                    ed.putString(STATUS_PREFIX + id, STATUS_FAILED);
                    sentIds.remove(id);
                    partialIds.remove(id);
                    failedIds.add(id);
                    ed.putStringSet(SENT, sentIds).putStringSet(PARTIAL, partialIds).putStringSet(FAILED, failedIds);
                }
            }
            ed.commit();
            LOCK.notifyAll();
        }
    }

    /** Record carrier delivery confirmation for a single SMS part from SmsStatusReceiver. */
    public static void handlePartDelivered(Context context, String id, int partIndex, int totalParts, int resultCode, byte[] pdu, String format) {
        if (context == null || id == null || id.isEmpty()) return;
        if (resultCode != Activity.RESULT_OK) return;
        if (pdu != null && pdu.length > 0) {
            try {
                SmsMessage msg = (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && format != null && !format.isEmpty())
                    ? SmsMessage.createFromPdu(pdu, format)
                    : SmsMessage.createFromPdu(pdu);
                if (msg != null) {
                    int tpStatus = msg.getStatus();
                    // TP-Status >= 64 (0x40) indicates permanent failure in 3GPP TS 23.040
                    if (tpStatus >= 64) return;
                }
            } catch (Throwable ignored) {}
        }
        synchronized (LOCK) {
            SharedPreferences sp = prefs(context);
            int expectedTotal = Math.max(1, totalParts > 0 ? totalParts : sp.getInt(PARTS_TOTAL_PREFIX + id, 1));
            int validIndex = Math.max(0, partIndex);
            Set<String> deliveredParts = new HashSet<>(sp.getStringSet(PARTS_DELIVERED_SET_PREFIX + id, new HashSet<>()));
            Set<String> sentParts = new HashSet<>(sp.getStringSet(PARTS_SENT_SET_PREFIX + id, new HashSet<>()));
            Set<String> failedParts = new HashSet<>(sp.getStringSet(PARTS_FAILED_SET_PREFIX + id, new HashSet<>()));
            Set<String> sentIds = new HashSet<>(sp.getStringSet(SENT, new HashSet<>()));
            Set<String> claimedIds = new HashSet<>(sp.getStringSet(CLAIMED, new HashSet<>()));
            Set<String> trackedIds = new HashSet<>(sp.getStringSet(TRACKED, new HashSet<>()));
            trackedIds.add(id);

            String partKey = String.valueOf(validIndex);
            deliveredParts.add(partKey);
            sentParts.add(partKey);

            SharedPreferences.Editor ed = sp.edit()
                .putStringSet(TRACKED, trackedIds)
                .putStringSet(PARTS_DELIVERED_SET_PREFIX + id, deliveredParts)
                .putStringSet(PARTS_SENT_SET_PREFIX + id, sentParts);

            if (deliveredParts.size() >= expectedTotal && failedParts.isEmpty()) {
                long now = System.currentTimeMillis();
                ed.putString(STATUS_PREFIX + id, STATUS_DELIVERED)
                    .putLong(DELIVERED_AT_PREFIX + id, now);
                if (sp.getLong(SENT_AT_PREFIX + id, 0L) <= 0L) {
                    ed.putLong(SENT_AT_PREFIX + id, now);
                }
                sentIds.add(id);
                claimedIds.remove(id);
                ed.putStringSet(SENT, sentIds).putStringSet(CLAIMED, claimedIds);
            }
            ed.commit();
            LOCK.notifyAll();
        }
    }

    public static class SmsStatusReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (context == null || intent == null) return;
            String action = intent.getAction();
            String id = intent.getStringExtra("id");
            if (id == null || id.isEmpty()) return;
            int partIndex = intent.getIntExtra("partIndex", 0);
            int totalParts = intent.getIntExtra("totalParts", 1);
            int resultCode = getResultCode();
            if (ACTION_SMS_SENT.equals(action)) {
                int errorCode = intent.getIntExtra("errorCode", -1);
                handlePartSent(context.getApplicationContext() != null ? context.getApplicationContext() : context, id, partIndex, totalParts, resultCode, errorCode);
            } else if (ACTION_SMS_DELIVERED.equals(action)) {
                byte[] pdu = intent.getByteArrayExtra("pdu");
                String format = intent.getStringExtra("format");
                handlePartDelivered(context.getApplicationContext() != null ? context.getApplicationContext() : context, id, partIndex, totalParts, resultCode, pdu, format);
            }
        }
    }

    public static class SmsBootReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (context == null || intent == null) return;
            String action = intent.getAction();
            if (Intent.ACTION_BOOT_COMPLETED.equals(action) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
                rescheduleActiveQueue(context.getApplicationContext() != null ? context.getApplicationContext() : context);
            }
        }
    }

    private static void enqueueDeferred(Context context, Data original, String id, long deferUntil) {
        Data data = new Data.Builder()
            .putString("id", original.getString("id"))
            .putString("phone", original.getString("phone"))
            .putString("message", original.getString("message"))
            .putLong("at", original.getLong("at", 0L))
            .putInt("gap", original.getInt("gap", 5))
            .build();
        long delay = Math.max(0L, deferUntil - System.currentTimeMillis());
        OneTimeWorkRequest request = new OneTimeWorkRequest.Builder(SmsWorker.class)
            .setInitialDelay(delay, TimeUnit.MILLISECONDS)
            .setInputData(data)
            .addTag(TAG)
            .build();
        // Canonical per-ID deferred work name prevents duplicate deferred jobs for the same reminder ID.
        String unique = "deyn_sms_deferred_" + id;
        WorkManager.getInstance(context).enqueueUniqueWork(unique, ExistingWorkPolicy.REPLACE, request);
    }

    public static class SmsWorker extends androidx.work.Worker {
        public SmsWorker(@NonNull Context context, @NonNull androidx.work.WorkerParameters params) {
            super(context, params);
        }

        @NonNull
        @Override
        public Result doWork() {
            Context context = getApplicationContext();
            ensureDynamicReceiver(context);
            if (context.checkSelfPermission(Manifest.permission.SEND_SMS) != PackageManager.PERMISSION_GRANTED) {
                return Result.failure();
            }
            String id = getInputData().getString("id");
            String phone = getInputData().getString("phone");
            String message = getInputData().getString("message");
            long at = getInputData().getLong("at", 0L);
            int gap = Math.max(1, Math.min(60, getInputData().getInt("gap", 5)));
            if (id == null || phone == null || message == null || at <= 0) {
                return Result.failure();
            }

            DispatchResult dispatchResult;
            synchronized (LOCK) {
                SharedPreferences sp = prefs(context);
                reconcileStaleInFlightLocked(sp, System.currentTimeMillis());
                Set<String> active = new HashSet<>(sp.getStringSet(ACTIVE, new HashSet<>()));
                if (!active.contains(id) || isTerminalOrInFlight(context, id)) {
                    return Result.success();
                }
                long now = System.currentTimeMillis();
                Calendar cal = Calendar.getInstance();
                int minutes = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE);
                long deferUntil = 0L;
                if (minutes < 9 * 60) {
                    cal.set(Calendar.HOUR_OF_DAY, 9);
                    cal.set(Calendar.MINUTE, 0);
                    cal.set(Calendar.SECOND, 0);
                    cal.set(Calendar.MILLISECOND, 0);
                    deferUntil = cal.getTimeInMillis();
                } else if (minutes > 22 * 60) {
                    cal.add(Calendar.DAY_OF_MONTH, 1);
                    cal.set(Calendar.HOUR_OF_DAY, 9);
                    cal.set(Calendar.MINUTE, 0);
                    cal.set(Calendar.SECOND, 0);
                    cal.set(Calendar.MILLISECOND, 0);
                    deferUntil = cal.getTimeInMillis();
                }
                long next = sp.getLong(NEXT_SEND_AT, 0L);
                if (deferUntil == 0L && next > now) {
                    deferUntil = next;
                }
                if (deferUntil > now) {
                    enqueueDeferred(context, getInputData(), id, deferUntil);
                    return Result.success();
                }
                try {
                    dispatchResult = dispatchOnce(context, id, phone, message, true, at, gap);
                } catch (Exception e) {
                    return getRunAttemptCount() < 5 ? Result.retry() : Result.failure();
                }
            }

            if (!dispatchResult.dispatched) {
                return Result.success();
            }
            JSObject outcome = awaitDispatchOutcome(context, id, WAIT_FOR_RADIO_MS);
            String finalStatus = outcome.getString("status");
            if (STATUS_FAILED.equals(finalStatus)) {
                return getRunAttemptCount() < 5 ? Result.retry() : Result.failure();
            }
            return Result.success();
        }
    }
}
```

================================================================================
## [6/31] FILE: `PRO_4_HANDOFF.md`

- **المسار الأصلي**: `PRO_4_HANDOFF.md`
- **الحجم**: `7,004` بايت | **الأسطر**: `56` | **SHA-256**: `1d3174b14dc1b3467d2a4e50f0dd240c0258b833d3b19e51ad6395f504ece554`

```markdown
# PRO_4_HANDOFF.md — وثيقة التسليم والمراجعة التقنية الشاملة للنسخة PRO 4

- **النسخة المرجعية السابقة**: `PRO 3` (`amardsf123-del/deyn-apk-project`, فرع `sms-integration-files`, Commit `0e45321690e20f19ad8a1e54d32a89e69eab068f`)
- **اسم النسخة الجديدة**: `PRO 4` (داخل المجلد الرئيسي `PRO_4`)
- **تاريخ الإعداد**: 14 نوفمبر 2026
- **المفتاح العام المعتمد (`DEYN_PUBLIC_KEY` / Ed25519)**: `uM8GgGamY++GH9e2PTTkluRlzqEVdbnj+MLh4uFYr/Y=`

---

## 1. نتائج التحقق من الملاحظات الثلاث (ما ثبت خطؤه مقابل ما كان سليمًا)

### أولًا: حماية الساعة (`NATIVE_MONO_OFFSET_MS` و`getMonotonicNowMs()`)
- **الحكم**: **ثبت وجود خلل حقيقي في النسخة السابقة**.
- **الدليل البرمجي**:
  - في `sms/completion.js`، كان المتغير `NATIVE_MONO_OFFSET_MS` يُحسب داخل `syncNativeMonotonicClock()` عند استدعاء `DeynBackupPlugin.getMonotonicTime()` (`SystemClock.elapsedRealtime()`) ولكنه **لم يكن يُستخدم إطلاقًا** داخل `window.evaluate()`.
  - كانت الدالة `getMonotonicNowMs()` تعتمد على `performance.now()` فقط، وهو مؤقت يعود إلى `0` عند إغلاق التطبيق وإعادة فتحه.
- **الإصلاح المنفذ في PRO 4**:
  - ربط `getMonotonicNowMs()` مباشرةً بساعة نظام أندرويد الرتيبة `SystemClock.elapsedRealtime()` (`LAST_NATIVE_ELAPSED_MS + (performance.now() - LAST_NATIVE_SYNC_PERF)`).
  - حفظ `lastValidMono` و`lastValidMonoKind` (`'os'` أو `'perf'`) في حالة الساعة بحيث يكشف النظام تقديم الساعة للأمام أو إرجاعها للخلف عبر إغلاق التطبيق وإعادة فتحه ضمن نفس دورة تشغيل الهاتف، ويتحقق بدقة عند ضغط «حسناً».

### ثانيًا: مزامنة تمديد الديون (`captureLocal` و`Core.extendDebt` و`dueAt` و`extensionHistory`)
- **الحكم**: **ثبت وجود خلل حقيقي 100%**.
- **الدليل البرمجي**:
  - في `sync/engine.js`، كانت `buildSnap(S)` و`captureLocal(S, did, now)` تخزنان `snap.tx[t.id] = 1` فقط عند إنشاء المعاملة.
  - عند استدعاء `Core.extendDebt(c, debtId, ...)` لتعديل معاملة دين موجودة (`dueAt`, `originalDueAt`, `extensionHistory`)، كانت `captureLocal` تجد `snap.tx[t.id]` موجودًا (`1`) فتتجاهل التعديل ولا تصدر أي حدث مزامنة!
- **الإصلاح المنفذ في PRO 4**:
  - إضافة دالة `txExtHash(t)` في `sync/engine.js` لحساب بصمة `(dueAt, originalDueAt, extensionHistory)` لكل معاملة دين.
  - تعديل `buildSnap(S)` و`captureLocal(S, did, now)` لإصدار حدث مزامنة جديد من نوع `txf` (`{ k: 'txf', cid, tid, dueAt, originalDueAt, extensionHistory }`) فور تغير بصمة التمديد لأي معاملة موجودة، مع الحفاظ على التوافق التام مع البيانات القديمة (`snap.tx[t.id] === 1`).
  - إضافة التحقق من `txf` في `checkEvent()` وتطبيقه في `applyOne()` باستخدام الساعات المنطقية `HLC` ودمج `extensionHistory` دون تكرار.

### ثالثًا: صلاحيات العامل (`checkEvent` وحدود الفئات والسقف الائتماني)
- **الحكم**: **ثبت وجود ثغرة جزئية في قيود `cf` و`cust+` عند استقبال أحداث مباشرة من العامل**.
- **الدليل البرمجي**:
  - في `sync/engine.js` داخل `checkEvent()`, كان السطر الخاص بـ `cust+` يفحص `validCust(ev.c)` فقط دون فحص أن العامل (`W`) لا يرسل معاملات `tx` مضمّنة داخل `cust+` أو فئة مجهولة أو سقفًا يتجاوز `100000`.
  - وفي `cf` عندما يكون الزبون محظورًا (`cur.seg === 'black'`)، كان العامل يستطيع إرسال أي نص عشوائي كفئة `seg` أو رفع السقف إلى `100000` بغض النظر عن سقف الفئة.
- **الإصلاح المنفذ في PRO 4**:
  - تشديد `checkEvent()` لحدث `cust+` عند `senderRole === 'W'`: منع وجود عناصر في `ev.c.tx`، والتحقق من أن `ev.c.seg` ضمن فئات المتجر المعروفة (`salaried`, `youth`, `daily`, `black`, أو `S.customSegs`)، وأن `0 <= ev.c.ceiling <= 100000`.
  - تشديد `checkEvent()` لحدث `cf` عند `senderRole === 'W'`: حصر فك الحظر في الفئات النشطة المعروفة فقط (ليس نصًا عشوائيًا)، وتقييد السقف الجديد بسقف الفئة المستهدفة (`Math.max(segCeiling, 10000)`).

---

## 2. بنية المشروع وطريقة عمله والعلاقات بين مكوناته

- **`deyn-app/www/index.html`**: واجهة التطبيق الرئيسية (HTML/CSS/JS) ومدمج بها:
  - محرك المزامنة `DeynSyncLib` (المولَّد من `sync/*.js` عبر `tools/embed_sync.py`).
  - آلة حماية الساعة (المطابقة لـ `trusted-time/time-policy.js` و`trusted-time/client.js`).
  - نظام التفعيل والتراخيص `DEYN3` وكود الاسترداد `DEYNR1` وتشفير كلمة المرور `PBKDF2-SHA256`.
  - حزمة SMS والترجمة الفرنسية والتكميل (`sms/engine.js` + `sms/runtime.js` + `sms/i18n.js` + `sms/completion.js`) المدمجة عبر `.github/scripts/integrate_sms.py`.
- **`deyn-app/native/`** (ونسخها الجذرية):
  - `DeynVaultPlugin.java`: خزنة `AES-256-GCM` بمفاتيح Android Keystore وتخزين ثنائي الخانة (`deyn.v2.a` / `deyn.v2.b`).
  - `DeynSyncPlugin.java`: مآخذ TCP المحلية + `NsdManager` (`_deyn._tcp.`) للمزامنة بين أجهزة التاجر عبر Wi-Fi / Hotspot.
  - `DeynSmsPlugin.java`: إرسال SMS متعدد الأجزاء وتتبع حالة كل جزء عبر `PendingIntent` و`SmsStatusReceiver` وجدولة `WorkManager`.
  - `DeynBackupPlugin.java`: النسخ الاحتياطي التلقائي الخارجي عبر SAF (`ACTION_OPEN_DOCUMENT_TREE`) بالكتابة الذرية والسقوط التلقائي إلى `.prev.json` + ساعة `SystemClock.elapsedRealtime()`.
  - `DeynNotifPlugin.java`: إشعارات أندرويد المجدولة (`WorkManager`) وقناة `deyn_overdue_alerts` مع إلغاء المهام فور تسديد الدين.
- **`deyn-keygen/www/index.html`**: مولّد التراخيص المستقل `DEYN3` (`M`/`W`, `1Y`/`2Y`/`LT`) وأكواد استرداد كلمة المرور `DEYNR1`.
- **`.github/workflows/`**: مسارات بناء APK والاختبارات التلقائية في GitHub Actions.
```

================================================================================
## [7/31] FILE: `PRO_4_SHA256.txt`

- **المسار الأصلي**: `PRO_4_SHA256.txt`
- **الحجم**: `11,653` بايت | **الأسطر**: `111` | **SHA-256**: `e2866235b1aa96d748e46e634e391087d4645c3cf91c992a5e3b55549432e525`

```text
bac598de0c28e5ffe88ad8de5a37666a5e2c798e7b29ce50d46d787530291bbf  .github/build-now.txt
1b09492d86d71b5dadceee13d3e87133c673528edd23800ded4dcb6b521da40a  .github/scripts/integrate_sms.py
2aa5f2ad11ad20e2ad29d06f779a68653c77f9f405f9ba4d40595968590641f0  .github/workflows/build-deyn.yml
efcf5d9ca12dc83a1ad4b1ba11879d422fbf15e76c6862d74a718120c4334cfd  .github/workflows/build-sms-apk.yml
e2d1c6adde8ecf900fd9249c5ff24ea4040bde86bb2c421fcd12d5ace945b8f7  .github/workflows/build-sms-test.yml
1db4c5fc0d62242f0e0dfbf174d57474737f8796736b711a88c56c1efb7e2b83  .github/workflows/export-deyn-labs.yml
35dd8c16925b2465f61ff4991a59f36f8f544f9d5f35237b09d3f0e34ab607cb  .github/workflows/inspect-deyn.yml
7c3f895c32a706f52a4d403d95f7e780e5e387ce5d30bb4e1f9304e49729de9c  .github/workflows/inspect-sms-source.yml
bf8509112ca73cb21149d2e8b4a5aaea6aec4e4bcd9ba10fd81d79826b1adbeb  DeynBackupPlugin.java
ac4aab77652a34ad68f5a4038b983913161395f610731373a6e3500fc02a1530  DeynNotifPlugin.java
eab4f4e6a1d8f64de29b20adda25ba21ba46e2f1778ccfbac376085f7a334f7b  DeynSmsPlugin.java
1d3174b14dc1b3467d2a4e50f0dd240c0258b833d3b19e51ad6395f504ece554  PRO_4_HANDOFF.md
ed0f54f51c0233111a75e0a503ad6dbf3d6522a4fe5338858769174e0fa224ca  PRO_4_TEST_REPORT.md
465ecd6091275882522421d90bfe2860fc2bd960c7d2e1c2a2c1bf57f36fb984  README.md
58c7a2026091333eb50589cec3bfaaa6d693059ed91400991725cd5a27fe8401  deyn-app/android-res/drawable/splash.png
44cc3246d167bd718fb61feaba493850ff95255c1ddbb8854c0e4c0534832f96  deyn-app/android-res/mipmap-anydpi-v26/ic_launcher.xml
44cc3246d167bd718fb61feaba493850ff95255c1ddbb8854c0e4c0534832f96  deyn-app/android-res/mipmap-anydpi-v26/ic_launcher_round.xml
d1b316a015775d8c5430eaacb0a11c7d4a6a613f1a3655861f525df8dfb6d08b  deyn-app/android-res/mipmap-hdpi/ic_launcher.png
04d57cc17cd4a3648fa5b4a68215130220bf9fc619755a1a8ef35f80e036fbed  deyn-app/android-res/mipmap-hdpi/ic_launcher_background.png
0992f7521d5735aebb7e01a0a42d0f5fd2beef3bf2de52247f2e50b0980c700c  deyn-app/android-res/mipmap-hdpi/ic_launcher_foreground.png
d5f41adfb7d1c7061388e30911cd6e02de4102ff9b95fba861ff45d1f0663668  deyn-app/android-res/mipmap-hdpi/ic_launcher_round.png
42939f7b45d09bc5e397772f22cf6077712aee1c29d42bc53a3307d3626907fb  deyn-app/android-res/mipmap-mdpi/ic_launcher.png
91b468c9f2c74cc2ec09ec861e6331aece8a7bab688b0e6ae56c7c31cc8ef5e7  deyn-app/android-res/mipmap-mdpi/ic_launcher_background.png
67e996d0c73fbb43ff49026a50a93c464446276f0653b57993ca455bf4927a63  deyn-app/android-res/mipmap-mdpi/ic_launcher_foreground.png
6103ca51b132618be7d4cf2ac1045360ffdeee28b5dba62284c8c3a138fc8067  deyn-app/android-res/mipmap-mdpi/ic_launcher_round.png
2564f08385df43f7a163d5ca882af09e1bf691817641089313e2e7bf4773662d  deyn-app/android-res/mipmap-xhdpi/ic_launcher.png
7d598dc6f83b4be2c6a76d5065bf1f907db6e5b479204462a49005b2ccdf2e92  deyn-app/android-res/mipmap-xhdpi/ic_launcher_background.png
b978e457fbd592df6153b642c36f0461b46d5338b1707a847ebd33d42bac3fcd  deyn-app/android-res/mipmap-xhdpi/ic_launcher_foreground.png
860b05aa572524c7d14c1b0550a44b82f497014699bbd214662f3d562503f278  deyn-app/android-res/mipmap-xhdpi/ic_launcher_round.png
3dcf83dcf51e16a1d151caf545560f7e54cbbbc1b7591c86ac9d4ea8c40fc6c1  deyn-app/android-res/mipmap-xxhdpi/ic_launcher.png
bc0a0ade04ac6ed55924b809b66ae90fc3ccfa1e55e1b62f57221665d52eef5d  deyn-app/android-res/mipmap-xxhdpi/ic_launcher_background.png
897216d0992a9c83ff1564b4746e58dfb9722d4922f352874c17c32e3299dba0  deyn-app/android-res/mipmap-xxhdpi/ic_launcher_foreground.png
865d26fa5b6a65b72ca72f2181f5f587dd50ca9cffa71651a734668218f60d51  deyn-app/android-res/mipmap-xxhdpi/ic_launcher_round.png
0ea3f7cb418adb1ce810cc518ed60b582dcd91d6259f54b940e40b4410cfc899  deyn-app/android-res/mipmap-xxxhdpi/ic_launcher.png
0470ec0516285272e5f4a8a8dea023de5072a057d8c98b6aeabceadc45ff05e8  deyn-app/android-res/mipmap-xxxhdpi/ic_launcher_background.png
39f0d4b52f359deca984040725f98ee28cdbe4f28b3d2f826240a0230f741ac4  deyn-app/android-res/mipmap-xxxhdpi/ic_launcher_foreground.png
2f3aaca8447a3876bb494719e29a470c9b8d48526a51025d4a21d568c6419a9b  deyn-app/android-res/mipmap-xxxhdpi/ic_launcher_round.png
917ded69578fb28865d1e29bc520826a9d2d9cd05e7bdf694d4f9ea438cabaf6  deyn-app/capacitor.config.json
91dbbef04dd889f37dedefabf91866fc804fa89598248222843aac5896ff842e  deyn-app/icon-1024.png
9095f818be480db89f57251efefc1a3d3c4de89ab7ceaa4fe8856097c0f7c148  deyn-app/icon-512.png
bf8509112ca73cb21149d2e8b4a5aaea6aec4e4bcd9ba10fd81d79826b1adbeb  deyn-app/native/DeynBackupPlugin.java
ac4aab77652a34ad68f5a4038b983913161395f610731373a6e3500fc02a1530  deyn-app/native/DeynNotifPlugin.java
eab4f4e6a1d8f64de29b20adda25ba21ba46e2f1778ccfbac376085f7a334f7b  deyn-app/native/DeynSmsPlugin.java
6d3a160fcaeb642bd827372fca832c5373766c4820d53bb7207491c60cdde740  deyn-app/native/DeynSyncPlugin.java
edfc8004511de7c9746594456e8efcaa3f2fe5f4e2a3c75fe42c25e413622bfe  deyn-app/native/DeynVaultPlugin.java
311768ced7459b35070ffe3a426bfa200119f5c5d722c1d5322b41b6580575e2  deyn-app/package.json
e43149a70cf52069897d18200b8dd0c20f056970422e966444109e9241a487a2  deyn-app/scripts/fetch_fonts.py
7e794d8155d0bfd6ec35c08af47835cf0de918619c17ec2fe218edddd6a8d3f7  deyn-app/scripts/prepare-android.sh
ba51e7135b662fe638fae7d55491a2d41964dc87bd22d681c0a293c46fd26f4e  deyn-app/www/fonts/fonts.css
569df2e14a52770a49a15e8f9ed41c14dbe19e4ffce8eb7cb0e60ffbb2268f27  deyn-app/www/index.html
37b622de7cbad148e4c9dfc76e7505f2170d4d08bb96a847d856d60888187b76  deyn-keygen/android-res/drawable/splash.png
44cc3246d167bd718fb61feaba493850ff95255c1ddbb8854c0e4c0534832f96  deyn-keygen/android-res/mipmap-anydpi-v26/ic_launcher.xml
44cc3246d167bd718fb61feaba493850ff95255c1ddbb8854c0e4c0534832f96  deyn-keygen/android-res/mipmap-anydpi-v26/ic_launcher_round.xml
593f2e14a3d4d37fcf1f899e1bb412fe874dc401106ea8ec8f2a4ab24a25d04a  deyn-keygen/android-res/mipmap-hdpi/ic_launcher.png
4d4c257162cdfbf4bfb102918e2c7dc821d54d63d36e5bbd71cc80810531aca5  deyn-keygen/android-res/mipmap-hdpi/ic_launcher_background.png
929b1be17d4bf2fb12de8152c37f4f52b3d5c82a3698a194c8038cb6e301cc5c  deyn-keygen/android-res/mipmap-hdpi/ic_launcher_foreground.png
3a7ef02a4b4b765cf8296dea80cff492ae5a347ebeeb4ea4edf2abc9c9f37475  deyn-keygen/android-res/mipmap-hdpi/ic_launcher_round.png
99c5b510b02a4b7bf0c60821b730df98c35aee66b458b5ab76e45e2ff8c6e1f2  deyn-keygen/android-res/mipmap-mdpi/ic_launcher.png
14a304a9d48e3e6cd86cff864b94175aa74e4ec8e892ad382b083ca254ba9c9e  deyn-keygen/android-res/mipmap-mdpi/ic_launcher_background.png
cd64acf56c6d6e5b17c15466a387632810802a316c169f12e509d972bc925be7  deyn-keygen/android-res/mipmap-mdpi/ic_launcher_foreground.png
d128c1eeb74464951cf77701e842e37fb04e5a8c39264463ed47ce925007ad28  deyn-keygen/android-res/mipmap-mdpi/ic_launcher_round.png
d32c3e0a7f0028dc85a22a82b7d868ddcb685e6b6708dd2c01142c451c3a8787  deyn-keygen/android-res/mipmap-xhdpi/ic_launcher.png
03a94446b08e5c59273b5846cc34d98790821ec9bfe84d60dbc8bdeca8c01819  deyn-keygen/android-res/mipmap-xhdpi/ic_launcher_background.png
b9132b0247f6e936b677b83d227bae58fe22bb1ed38f53a8d480545e3feca74b  deyn-keygen/android-res/mipmap-xhdpi/ic_launcher_foreground.png
12db3bceb2dcb064a2ae8eda7016c45056c8ff9c6ac54bd91bb46aa884560cdd  deyn-keygen/android-res/mipmap-xhdpi/ic_launcher_round.png
13f345394220d0fe1d25f4f36c26f0a97df4e03843d88c9607b30a2fe7a1d287  deyn-keygen/android-res/mipmap-xxhdpi/ic_launcher.png
d7a75bdd73fcc716f2a03e7b94dac7cdb3e49b2a57345e8b9546671dc91b5535  deyn-keygen/android-res/mipmap-xxhdpi/ic_launcher_background.png
a158caedbfcab1f7ce753498fb0dd679211ce4f9e954965eb33b1ce717d1f312  deyn-keygen/android-res/mipmap-xxhdpi/ic_launcher_foreground.png
52aabbc7c24755521b56a40033ac63e09c81127fafaeb6ba77572fef32d9d787  deyn-keygen/android-res/mipmap-xxhdpi/ic_launcher_round.png
c0cc211197c55bf366d1697ca6bbda0cb9632e75633633d653f3f9e0c5270d2b  deyn-keygen/android-res/mipmap-xxxhdpi/ic_launcher.png
60df35c7ff80ce6881fd8b8eaf425b7d1275f5d0171281810d1ffdaf5ded9f2b  deyn-keygen/android-res/mipmap-xxxhdpi/ic_launcher_background.png
e2ff5c3b051c9d88c43943d6ee635bc2962aaf438a905678ed55d6b32d8dc533  deyn-keygen/android-res/mipmap-xxxhdpi/ic_launcher_foreground.png
9d2507cb3ac116b93f5927f7119c8c9d4464ce126295ed2528971941007146c3  deyn-keygen/android-res/mipmap-xxxhdpi/ic_launcher_round.png
78f4ad82a2b9f3e7157b5e22c7af602c3e2c0c4fbce2638cb563fad738517aeb  deyn-keygen/capacitor.config.json
96e64f0093dcd24b6698a75b7d4134c8c8e8dc41a94b46555426d41e2d72c341  deyn-keygen/icon-512.png
22e328b733e5060576deb85acfba20cb8cdb3030624e3c7f34b8f1e452b5d110  deyn-keygen/package.json
e43149a70cf52069897d18200b8dd0c20f056970422e966444109e9241a487a2  deyn-keygen/scripts/fetch_fonts.py
585bb6096dcc2221f11c461184a6541d28bd566028b5c5f1c42a32ff3ecb25fb  deyn-keygen/scripts/prepare-android.sh
ba51e7135b662fe638fae7d55491a2d41964dc87bd22d681c0a293c46fd26f4e  deyn-keygen/www/fonts/fonts.css
b07dfae0418a0c11fbf8b5990c0e5f603ea7f2f6a85e3c3b8039fd17628861a4  deyn-keygen/www/index.html
ef99e190b54a541dead3cd1a5994ae53522c11809ec20d73cd25757be7f957e7  docs/DESIGN_VAULT_SYNC.md
0e81bdba5a0a1c48371fd94e2a4e01f9d83e1f815c03f14793823840ba9de829  sms/JavaPluginTests.java
193c6fac9bd81a7a599787fb19b8a8228a41bc33d6ed89684b3071d1657c87f8  sms/README.md
67802d37c9303bddf898f0ad3de3ffa2a7e34585a8174ca24ffef66ff6037a6d  sms/completion.js
d0e7705a9fb151fe4aea7debbcbf5c8debf824942e805cf6c82870f73dde7d06  sms/e2e_comprehensive_test.py
86a911a084a39802ce2374cbef46fdbcce23905d4c656c6918ec17e08a5d5dc3  sms/engine.js
53579deeb25c770978c69e8343bbc01387d426b0cf57d82462636743f06768b3  sms/i18n.js
9207ceba0ddef2aa0c428832b277840797e854b6a908d260043de65460db5e7a  sms/runtime.js
0ae5dcb3da0853f355785f65592b6b90fcba618c0de0da89aec6361209b664c9  sms/test.mjs
a07de1fd784913b9bdc6054e1b64bbbe2a0833eeb8fa1d2d56cda355dd8b880c  sync/app-glue.js
8498219df949c93f0dd7e16558c370f6c1632e87cb3ffe07d52a33a5846ff9cd  sync/engine.js
48e847860dd4f0907ce91e346dbb00a4a12213163ad3d80a953c343eb9a11979  sync/package.json
fc7cc3eaece7a1aa0e654315bff2964d2139b7a2a64174819fe2a85ea4ffb374  sync/qr.js
e8b3ecc1fe8d4409fda993ad40e1e9ae520d13358e3d103333c13ea8355f7ff4  sync/qr_check.mjs
3c3d7e008c19cdf887cbc86e374b9eb6cd8be1319a9f3f91436f5b0bce573683  sync/session.js
a4c0626ffc11087e3b51f82facd9fed8f7fc799d930a5353a7896ae9e6b420b6  sync/test_engine.mjs
26813e7f8cfa39ad740e6b19c0a620e4d4f43fc077b55d9afd2ec9dae45b5e95  sync/test_session.mjs
71864a844b17432270cf57cd1d8772387a372bd47d3c221380bc231d9e5d3c81  tests/e2e/harness.py
69c986f8d4b0546cfb6b81c70a90224fec2a6495e9aa8ed452c0085449de01a1  tests/e2e/test_auth.py
b98feaf33352602b9d52f5b957a09c7af23dc12e354d7fa74e8aa79374a1dab3  tests/e2e/test_license.py
005652de6f161e09e9ff45f1b5182f88f9e40d9aed1671e35b9fe226f52091a9  tests/e2e/test_storage_layout_static.py
5c3ca9032aa3d4fe620435ec98bea3608a19ab0ba8ed063e2bea29d19d5ccc6d  tests/e2e/test_sync_e2e.py
c5284ca598f4222c28bf33dd9994cb6e983fb02eb28eb7a470d9200e11e9b4ab  tests/e2e/test_time.py
f11f0e5c8a17fa236e20ad2af3d367f965aafe3070d43331c81782cbe309d96a  tests/e2e/test_vault.py
26188d59820edaace107d56eb7ec1a8deec44d145a7f07b04cf41faab8ff8258  tools/embed_sync.py
bca85b9f6d407bac8e502c3656bfbdf64387282e8b926dc649c609be210343de  trusted-time/client.js
48e847860dd4f0907ce91e346dbb00a4a12213163ad3d80a953c343eb9a11979  trusted-time/package.json
e111ed208f7314578a167e55959c7d4f542bdd0e7862c18dd6b6fc0f796b8cad  trusted-time/test.mjs
465506225f9bfebf433e8ad5f5eb08273369acc6fc153d724be323e34a2815e7  trusted-time/time-policy.js
96d913d706066bdc1f9be4f4862675b741f0f05292bd3ca33c6583d67d0853b8  trusted-time/worker.js
08241adb9189f1668b04db91fb027c60ef6dd4491c9abf5f6aa28b464c044b25  PRO_4_FILE_INDEX.md
```

================================================================================
## [8/31] FILE: `PRO_4_TEST_REPORT.md`

- **المسار الأصلي**: `PRO_4_TEST_REPORT.md`
- **الحجم**: `4,440` بايت | **الأسطر**: `22` | **SHA-256**: `ed0f54f51c0233111a75e0a503ad6dbf3d6522a4fe5338858769174e0fa224ca`

```markdown
# PRO_4_TEST_REPORT.md — تقرير الاختبارات الفعلية للنسخة PRO 4

- **تاريخ التنفيذ**: 14 نوفمبر 2026
- **المسؤولية والصدق**: جميع النتائج المذكورة أدناه ناتجة عن تشغيل فعلي بعد تطبيق إصلاحات `PRO 4`.

## أولًا: الاختبارات التي تم تشغيلها ونجحت فعليًا (0 فشل)

| # | الاختبار / الحزمة | الأداة والبيئة | عدد الحالات | النتيجة | ما تم إثباته عمليًا |
|---|---|---|---|---|---|
| 1 | `sync/test_engine.mjs` | `Node.js v18.20.4` | **19 / 19** | **PASS** | المزامنة الأولية (Union)، التغييرات اللاحقة فقط، العمل دون إنترنت ثم الاستئناف، **انتقال تمديد الدين (`dueAt`, `originalDueAt`, `extensionHistory`) عبر `txf` دون تكرار**، ومنع العامل من تجاوز حدود الفئات والسقف في `cf` و`cust+`، واختبار Fuzz لـ 300 عملية عشوائية |
| 2 | `sync/test_session.mjs` | `Node.js v18.20.4` | **16 / 16** | **PASS** | الإقران بـ `DEYNPAIR1`، تشفير `X25519` + `Ed25519` + `AES-256-GCM`، **منع وصول تاجر لبيانات تاجر آخر أو انضمام غريب**، مقاومة العبث والتكرار، وانقطاع الاتصال واستئنافه |
| 3 | `trusted-time/test.mjs` | `Node.js v18.20.4` | **18 / 18** | **PASS** | التحقق من توقيع الوقت `Ed25519`، رفض الإعادة، تحذيرات الساعة 1-3، مهلة 48 ساعة، `READ_ONLY` دون حذف بيانات، وإصلاح `lastSeen` |
| 4 | `sms/test.mjs` | `Node.js v18.20.4` | **14 / 14** | **PASS** | توزيع التسديدات، تمديد الدين، منع التكرار، الرسائل العربية من 3 أجزاء، الفشل الجزئي والكلي |
| 5 | `sms/JavaPluginTests.java` | `javac 17.0.21` + `java -ea` (JVM 17) | **5 إضافات / 3 حزم اختبار** | **PASS** | ترجمة الإضافات الخمس بـ 0 أخطاء؛ الكتابة الذرية SAF والسقوط إلى `.prev.json` عند تلف النسخة الرئيسية؛ ساعة `elapsedRealtimeMs`؛ إلغاء إشعار الدين المسدد في `NotifWorker`؛ وتتبع أجزاء SMS |
| 6 | `sms/e2e_comprehensive_test.py` | `Chromium 156` + `Selenium WebDriver` | **12 / 12** | **PASS** | تفعيل `M`/`W`، منع تحويل الدور اليدوي، قفل `PBKDF2` واسترداد `DEYNR1`، مزامنة Wi-Fi، النسخ الاحتياطي التلقائي والاستعادة مع السقوط لـ `.prev.json`، حماية الساعة وزرَي «لاحقاً»/«حسناً»، الإشعارات مقروء/غير مقروء وإلغاؤها عند التسديد، وواجهة الفرنسية و`Gérer le mot de passe` |
| 7 | فحص قواعد JavaScript والفحص الأمني الثابت | `Python 3.11` + `node --check` | **100%** | **PASS** | سلامة جميع مقاطع `<script>` في `deyn-app` و`deyn-keygen`، وخلو المشروع من أي مفاتيح خاصة أو كلمات سر مصنعية |

## ثانيًا: الاختبارات التي تعذّر تشغيلها محليًا في بيئة الحاوية المعزولة

1. **بناء ملف APK الفعلي (`./gradlew assembleDebug`)**: لم يُنفَّذ محليًا لعدم توفر Android SDK (`android.jar`, `aapt2`, `d8`) واتصال الإنترنت لتحميل حزم Gradle في الحاوية. يجب تشغيله عبر GitHub Actions (`Build DEYN APKs` أو `DEYN SMS manual Android build`).
2. **حزمة `tests/e2e/test_*.py` عبر مكتبة `playwright`**: مكتبة البايثون `playwright` غير مثبتة في الحاوية (تمت تغطية سيناريوهاتها عبر `sms/e2e_comprehensive_test.py` على `Chromium 156 + Selenium`، وتعمل `tests/e2e/test_*.py` تلقائيًا في GitHub Actions).
3. **الاختبار الميداني على هاتف Android حقيقي**: اختيار مجلد SAF من النظام وحذف التطبيق وإعادة تثبيته، واستلام إشعارات `WorkManager` في الساعة 09:00 والهاتف مغلق، وإرسال SMS على الشبكات الجزائرية، والمزامنة عبر Hotspot بين هاتفين ماديين.
```

================================================================================
## [9/31] FILE: `deyn-app/android-res/mipmap-anydpi-v26/ic_launcher_round.xml`

- **المسار الأصلي**: `deyn-app/android-res/mipmap-anydpi-v26/ic_launcher_round.xml`
- **الحجم**: `266` بايت | **الأسطر**: `5` | **SHA-256**: `44cc3246d167bd718fb61feaba493850ff95255c1ddbb8854c0e4c0534832f96`

```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

================================================================================
## [10/31] FILE: `deyn-app/capacitor.config.json`

- **المسار الأصلي**: `deyn-app/capacitor.config.json`
- **الحجم**: `189` بايت | **الأسطر**: `8` | **SHA-256**: `917ded69578fb28865d1e29bc520826a9d2d9cd05e7bdf694d4f9ea438cabaf6`

```json
{
  "appId": "com.deyn.app",
  "appName": "DEYN",
  "webDir": "www",
  "backgroundColor": "#065043",
  "server": { "androidScheme": "https" },
  "android": { "allowMixedContent": false }
}
```

================================================================================
## [11/31] FILE: `deyn-app/native/DeynBackupPlugin.java`

- **المسار الأصلي**: `deyn-app/native/DeynBackupPlugin.java`
- **الحجم**: `18,158` بايت | **الأسطر**: `408` | **SHA-256**: `bf8509112ca73cb21149d2e8b4a5aaea6aec4e4bcd9ba10fd81d79826b1adbeb`

```java
package com.deyn.app;

import android.app.Activity;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.ParcelFileDescriptor;
import android.os.SystemClock;
import android.provider.DocumentsContract;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Native Android Storage Access Framework (SAF) Auto-Backup & Restore Plugin for DEYN.
 *
 * Responsibilities:
 * 1. Allows the merchant to select a persistent folder outside app-private storage via ACTION_OPEN_DOCUMENT_TREE.
 *    Note on Android SAF persistence:
 *    - Files written to the user-selected shared folder survive app restarts, app data clearing, and app uninstallation.
 *    - Persistable URI permissions survive device reboots. If the app is uninstalled and reinstalled, the backup files
 *      remain intact in the user's shared folder and can be restored by picking the file or re-selecting the folder.
 * 2. Serializes all backup writes on a single background thread so rapid consecutive edits never collide.
 * 3. Uses a safe atomic write protocol:
 *    a) Validate incoming JSON structure before writing.
 *    b) Write bytes to a temporary file ("deyn-auto-backup.tmp.json") and fsync file descriptor.
 *    c) Read back and validate the temporary file to verify complete write integrity.
 *    d) If a valid previous main backup ("deyn-auto-backup.json") exists, copy it to "deyn-auto-backup.prev.json".
 *    e) Write and fsync the verified payload to "deyn-auto-backup.json" and validate read-back.
 *    f) Delete the temporary file.
 * 4. During readAutoBackup, validates "deyn-auto-backup.json" structure first; if missing, unreadable, or corrupted,
 *    automatically falls back to "deyn-auto-backup.prev.json" and validates it before returning.
 * 5. Provides OS monotonic uptime clock (SystemClock.elapsedRealtime()) so clock-tamper protection can detect
 *    both forward and backward wall-clock jumps during the device uptime session.
 */
@CapacitorPlugin(name = "DeynBackup")
public class DeynBackupPlugin extends Plugin {
    static final String PREFS = "deyn_backup_native";
    static final String KEY_TREE_URI = "tree_uri";
    static final String KEY_LAST_OK_AT = "last_ok_at";
    static final String KEY_LAST_ERR = "last_err";
    static final String KEY_SEQ = "backup_seq";

    public static final String MAIN_FILE = "deyn-auto-backup.json";
    public static final String PREV_FILE = "deyn-auto-backup.prev.json";
    public static final String TEMP_FILE = "deyn-auto-backup.tmp.json";

    private static final Object WRITE_LOCK = new Object();
    private static final ExecutorService WRITE_EXEC = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "deyn-saf-backup");
        t.setDaemon(true);
        return t;
    });
    private static volatile String pendingPayload = null;

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /**
     * Validates that raw bytes represent a well-formed UTF-8 DEYN backup JSON containing customers and pending arrays.
     */
    public static boolean isValidBackupBytes(byte[] bytes) {
        if (bytes == null || bytes.length < 20) return false;
        try {
            String text = new String(bytes, StandardCharsets.UTF_8).trim();
            if (!text.startsWith("{") || !text.endsWith("}")) return false;
            JSONObject parsed = new JSONObject(text);
            JSONObject dataObj = parsed.optJSONObject("data");
            JSONObject target = dataObj != null ? dataObj : parsed;
            JSONArray customers = target.optJSONArray("customers");
            JSONArray pending = target.optJSONArray("pending");
            return customers != null && pending != null;
        } catch (Exception e) {
            return false;
        }
    }

    private static boolean hasValidTreeUri(Context c) {
        String uriStr = prefs(c).getString(KEY_TREE_URI, "");
        if (uriStr == null || uriStr.isEmpty()) return false;
        try {
            Uri treeUri = Uri.parse(uriStr);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                for (android.content.UriPermission p : c.getContentResolver().getPersistedUriPermissions()) {
                    if (p.getUri().equals(treeUri) && p.isWritePermission() && p.isReadPermission()) {
                        return true;
                    }
                }
            }
            Uri docUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, DocumentsContract.getTreeDocumentId(treeUri));
            return docUri != null;
        } catch (Exception e) {
            return false;
        }
    }

    @PluginMethod
    public void getMonotonicTime(PluginCall call) {
        JSObject out = new JSObject();
        out.put("elapsedRealtimeMs", SystemClock.elapsedRealtime());
        out.put("wallTimeMs", System.currentTimeMillis());
        call.resolve(out);
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        Context c = getContext();
        SharedPreferences sp = prefs(c);
        String uriStr = sp.getString(KEY_TREE_URI, "");
        boolean valid = hasValidTreeUri(c);
        JSObject out = new JSObject();
        out.put("configured", uriStr != null && !uriStr.isEmpty());
        out.put("accessible", valid);
        out.put("treeUri", uriStr != null ? uriStr : "");
        out.put("lastBackupAt", sp.getLong(KEY_LAST_OK_AT, 0L));
        out.put("lastError", sp.getString(KEY_LAST_ERR, ""));
        out.put("seq", sp.getLong(KEY_SEQ, 0L));
        out.put("elapsedRealtimeMs", SystemClock.elapsedRealtime());
        call.resolve(out);
    }

    @PluginMethod
    public void selectBackupFolder(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION
            | Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
            | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION
        );
        startActivityForResult(call, intent, "handleFolderSelection");
    }

    @ActivityCallback
    private void handleFolderSelection(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            call.reject("Folder selection cancelled");
            return;
        }
        Uri treeUri = result.getData().getData();
        int takeFlags = Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION;
        try {
            getContext().getContentResolver().takePersistableUriPermission(treeUri, takeFlags);
        } catch (Exception e) {
            call.reject("Failed to persist folder permission: " + e.getMessage());
            return;
        }
        prefs(getContext()).edit()
            .putString(KEY_TREE_URI, treeUri.toString())
            .putString(KEY_LAST_ERR, "")
            .commit();

        JSObject out = new JSObject();
        out.put("configured", true);
        out.put("accessible", true);
        out.put("treeUri", treeUri.toString());
        call.resolve(out);
    }

    @PluginMethod
    public void writeAutoBackup(PluginCall call) {
        final String data = call.getString("data");
        if (data == null || data.trim().isEmpty()) {
            JSObject out = new JSObject();
            out.put("ok", false);
            out.put("reason", "empty_payload");
            call.resolve(out);
            return;
        }
        final Context context = getContext().getApplicationContext();
        String uriStr = prefs(context).getString(KEY_TREE_URI, "");
        if (uriStr == null || uriStr.isEmpty()) {
            JSObject out = new JSObject();
            out.put("ok", false);
            out.put("reason", "no_folder");
            call.resolve(out);
            return;
        }
        if (!hasValidTreeUri(context)) {
            JSObject out = new JSObject();
            out.put("ok", false);
            out.put("reason", "permission_lost");
            call.resolve(out);
            return;
        }
        pendingPayload = data;
        WRITE_EXEC.execute(() -> {
            String snap = pendingPayload;
            if (snap == null) {
                JSObject out = new JSObject();
                out.put("ok", true);
                out.put("coalesced", true);
                call.resolve(out);
                return;
            }
            pendingPayload = null;
            JSObject res = writeSafelyToTree(context, snap);
            call.resolve(res);
        });
    }

    public static JSObject writeSafelyToTree(Context context, String jsonText) {
        synchronized (WRITE_LOCK) {
            SharedPreferences sp = prefs(context);
            String uriStr = sp.getString(KEY_TREE_URI, "");
            JSObject out = new JSObject();
            if (uriStr == null || uriStr.isEmpty()) {
                out.put("ok", false);
                out.put("reason", "no_folder");
                return out;
            }
            try {
                byte[] bytes = jsonText != null ? jsonText.getBytes(StandardCharsets.UTF_8) : null;
                if (!isValidBackupBytes(bytes)) {
                    throw new IllegalArgumentException("Invalid JSON backup structure");
                }
                Uri treeUri = Uri.parse(uriStr);
                ContentResolver cr = context.getContentResolver();
                Uri rootDocUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, DocumentsContract.getTreeDocumentId(treeUri));

                // 1. Write to temporary file first and fsync
                Uri tmpUri = findOrCreateDocument(cr, treeUri, rootDocUri, TEMP_FILE, "application/json");
                if (tmpUri == null) throw new IllegalStateException("Could not create temporary backup file");
                writeAndSyncUri(cr, tmpUri, bytes);

                // 2. Verify read-back and JSON validity of temporary file before touching the main backup file
                byte[] readBack = readUriBytes(cr, tmpUri);
                if (readBack == null || readBack.length != bytes.length || !isValidBackupBytes(readBack)) {
                    throw new IllegalStateException("Temporary backup verification mismatch");
                }

                // 3. Copy previous main backup into .prev.json ONLY if the previous main backup is itself valid
                Uri mainUri = findChildDocument(cr, treeUri, rootDocUri, MAIN_FILE);
                if (mainUri != null) {
                    byte[] prevBytes = readUriBytes(cr, mainUri);
                    if (isValidBackupBytes(prevBytes)) {
                        Uri prevUri = findOrCreateDocument(cr, treeUri, rootDocUri, PREV_FILE, "application/json");
                        if (prevUri != null) {
                            writeAndSyncUri(cr, prevUri, prevBytes);
                        }
                    }
                }

                // 4. Write verified bytes to main backup file ("deyn-auto-backup.json") and fsync
                if (mainUri == null) {
                    mainUri = findOrCreateDocument(cr, treeUri, rootDocUri, MAIN_FILE, "application/json");
                }
                if (mainUri == null) throw new IllegalStateException("Could not create main backup file");
                writeAndSyncUri(cr, mainUri, bytes);

                // 5. Verify main backup file read-back and validity
                byte[] mainReadBack = readUriBytes(cr, mainUri);
                if (mainReadBack == null || mainReadBack.length != bytes.length || !isValidBackupBytes(mainReadBack)) {
                    throw new IllegalStateException("Main backup verification mismatch");
                }

                // 6. Clean up temporary file
                try {
                    DocumentsContract.deleteDocument(cr, tmpUri);
                } catch (Exception ignored) {}

                long now = System.currentTimeMillis();
                long seq = sp.getLong(KEY_SEQ, 0L) + 1L;
                sp.edit()
                    .putLong(KEY_LAST_OK_AT, now)
                    .putLong(KEY_SEQ, seq)
                    .putString(KEY_LAST_ERR, "")
                    .commit();

                out.put("ok", true);
                out.put("at", now);
                out.put("seq", seq);
                out.put("bytes", bytes.length);
                return out;
            } catch (Exception e) {
                String msg = e.getClass().getSimpleName() + (e.getMessage() != null ? ": " + e.getMessage() : "");
                sp.edit().putString(KEY_LAST_ERR, msg).commit();
                out.put("ok", false);
                out.put("reason", "write_error");
                out.put("error", msg);
                return out;
            }
        }
    }

    @PluginMethod
    public void readAutoBackup(PluginCall call) {
        Context context = getContext();
        String uriStr = prefs(context).getString(KEY_TREE_URI, "");
        if (uriStr == null || uriStr.isEmpty()) {
            call.reject("No backup folder configured");
            return;
        }
        boolean preferPrev = Boolean.TRUE.equals(call.getBoolean("preferPrev", false));
        try {
            Uri treeUri = Uri.parse(uriStr);
            ContentResolver cr = context.getContentResolver();
            Uri rootDocUri = DocumentsContract.buildDocumentUriUsingTree(treeUri, DocumentsContract.getTreeDocumentId(treeUri));

            byte[] chosenBytes = null;
            String chosenSource = null;
            boolean fallbackUsed = false;

            if (!preferPrev) {
                Uri mainUri = findChildDocument(cr, treeUri, rootDocUri, MAIN_FILE);
                byte[] mainBytes = mainUri != null ? readUriBytes(cr, mainUri) : null;
                if (isValidBackupBytes(mainBytes)) {
                    chosenBytes = mainBytes;
                    chosenSource = MAIN_FILE;
                } else {
                    fallbackUsed = true;
                }
            } else {
                fallbackUsed = true;
            }

            if (chosenBytes == null) {
                Uri prevUri = findChildDocument(cr, treeUri, rootDocUri, PREV_FILE);
                byte[] prevBytes = prevUri != null ? readUriBytes(cr, prevUri) : null;
                if (isValidBackupBytes(prevBytes)) {
                    chosenBytes = prevBytes;
                    chosenSource = PREV_FILE;
                }
            }

            if (chosenBytes == null) {
                call.reject("No valid auto-backup file found in the selected folder");
                return;
            }

            JSObject out = new JSObject();
            out.put("ok", true);
            out.put("data", new String(chosenBytes, StandardCharsets.UTF_8));
            out.put("source", chosenSource);
            out.put("fallbackUsed", fallbackUsed);
            call.resolve(out);
        } catch (Exception e) {
            call.reject("Failed to read auto-backup: " + e.getMessage());
        }
    }

    private static Uri findChildDocument(ContentResolver cr, Uri treeUri, Uri parentDocUri, String displayName) {
        Uri childrenUri = DocumentsContract.buildChildDocumentsUriUsingTree(treeUri, DocumentsContract.getDocumentId(parentDocUri));
        String[] proj = new String[] { DocumentsContract.Document.COLUMN_DOCUMENT_ID, DocumentsContract.Document.COLUMN_DISPLAY_NAME };
        try (Cursor c = cr.query(childrenUri, proj, null, null, null)) {
            if (c != null) {
                while (c.moveToNext()) {
                    String docId = c.getString(0);
                    String name = c.getString(1);
                    if (displayName.equals(name)) {
                        return DocumentsContract.buildDocumentUriUsingTree(treeUri, docId);
                    }
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    private static Uri findOrCreateDocument(ContentResolver cr, Uri treeUri, Uri parentDocUri, String displayName, String mimeType) throws Exception {
        Uri existing = findChildDocument(cr, treeUri, parentDocUri, displayName);
        if (existing != null) return existing;
        return DocumentsContract.createDocument(cr, parentDocUri, mimeType, displayName);
    }

    private static void writeAndSyncUri(ContentResolver cr, Uri docUri, byte[] bytes) throws Exception {
        try (ParcelFileDescriptor pfd = cr.openFileDescriptor(docUri, "wt")) {
            if (pfd == null) throw new IllegalStateException("openFileDescriptor returned null");
            try (FileOutputStream fos = new FileOutputStream(pfd.getFileDescriptor())) {
                fos.write(bytes);
                fos.flush();
                pfd.getFileDescriptor().sync();
            }
        }
    }

    private static byte[] readUriBytes(ContentResolver cr, Uri docUri) {
        try (InputStream in = cr.openInputStream(docUri)) {
            if (in == null) return null;
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int r;
            while ((r = in.read(buf)) != -1) {
                bos.write(buf, 0, r);
            }
            return bos.toByteArray();
        } catch (Exception e) {
            return null;
        }
    }
}
```

================================================================================
## [12/31] FILE: `deyn-app/native/DeynNotifPlugin.java`

- **المسار الأصلي**: `deyn-app/native/DeynNotifPlugin.java`
- **الحجم**: `15,024` بايت | **الأسطر**: `353` | **SHA-256**: `ac4aab77652a34ad68f5a4038b983913161395f610731373a6e3500fc02a1530`

```java
package com.deyn.app;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.work.Data;
import androidx.work.ExistingWorkPolicy;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Native Android Notification & Background Overdue Debt Alert Plugin for DEYN.
 *
 * Responsibilities:
 * 1. Creates and maintains Android NotificationChannel ("deyn_overdue_alerts") on Android 8.0+ (API 26+).
 * 2. Checks and requests POST_NOTIFICATIONS runtime permission on Android 13+ (API 33+).
 * 3. Deduplicates notifications by unique event key in SharedPreferences so the same overdue event
 *    never triggers duplicate system notifications.
 * 4. Schedules next-day overdue debt notifications via WorkManager so notifications fire even if the app is closed.
 * 5. Cancels stale WorkManager jobs when a debt is paid, extended, or modified, and verifies inside NotifWorker
 *    that the notification key is still in ACTIVE_KEYS before posting to the system tray.
 * 6. Reschedules pending notifications after device reboot via NotifBootReceiver.
 */
@CapacitorPlugin(
    name = "DeynNotif",
    permissions = {
        @Permission(alias = "notifications", strings = { "android.permission.POST_NOTIFICATIONS" })
    }
)
public class DeynNotifPlugin extends Plugin {
    public static final String CHANNEL_ID = "deyn_overdue_alerts";
    public static final String CHANNEL_NAME = "تنبيهات الديون المستحقة — DEYN";
    public static final String WORK_TAG = "deyn_notif_work";
    static final String PREFS = "deyn_notif_native";
    static final String FIRED_KEYS = "fired_keys";
    static final String ACTIVE_KEYS = "active_keys";
    static final String SCHEDULED_JSON = "scheduled_items";
    private static final Object LOCK = new Object();

    @Override
    public void load() {
        super.load();
        ensureChannel(getContext());
    }

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static void ensureChannel(Context context) {
        if (context == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
                );
                ch.setDescription("تنبيهات حلول مواعيد السداد والديون المتأخرة وتجاوز السقف");
                ch.enableVibration(true);
                nm.createNotificationChannel(ch);
            }
        }
    }

    public static boolean hasNotificationPermission(Context c) {
        if (c == null) return false;
        if (Build.VERSION.SDK_INT >= 33) {
            return c.checkSelfPermission("android.permission.POST_NOTIFICATIONS") == PackageManager.PERMISSION_GRANTED;
        }
        return NotificationManagerCompat.from(c).areNotificationsEnabled();
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject out = new JSObject();
        out.put("notifications", hasNotificationPermission(getContext()) ? "granted" : "prompt");
        call.resolve(out);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33) {
            if (getPermissionState("notifications") == PermissionState.GRANTED) {
                checkPermissions(call);
            } else {
                requestPermissionForAlias("notifications", call, "notifPermCallback");
            }
        } else {
            ensureChannel(getContext());
            checkPermissions(call);
        }
    }

    @PermissionCallback
    private void notifPermCallback(PluginCall call) {
        ensureChannel(getContext());
        checkPermissions(call);
    }

    @PluginMethod
    public void notifyNow(PluginCall call) {
        String key = call.getString("key");
        String title = call.getString("title", "DEYN");
        String body = call.getString("body", "");
        boolean force = Boolean.TRUE.equals(call.getBoolean("force", false));
        if (key == null || key.trim().isEmpty() || body == null || body.trim().isEmpty()) {
            call.reject("Missing notification key or body");
            return;
        }
        boolean posted = postOnce(getContext(), key.trim(), title, body, force);
        JSObject out = new JSObject();
        out.put("posted", posted);
        out.put("duplicate", !posted && wasFired(getContext(), key.trim()));
        call.resolve(out);
    }

    /**
     * Replaces the scheduled notification queue.
     * Any previously scheduled notification whose debt was paid or modified is cancelled in WorkManager
     * and removed from ACTIVE_KEYS so it will never fire when the app is closed.
     */
    @PluginMethod
    public void schedule(PluginCall call) {
        try {
            Context context = getContext();
            ensureChannel(context);
            JSArray items = call.getArray("items", new JSArray());
            JSONArray persisted = new JSONArray();
            Set<String> newActiveKeys = new HashSet<>();
            Set<String> previousActiveKeys;

            synchronized (LOCK) {
                SharedPreferences sp = prefs(context);
                previousActiveKeys = new HashSet<>(sp.getStringSet(ACTIVE_KEYS, new HashSet<>()));
                for (int i = 0; i < items.length(); i++) {
                    JSONObject item = items.getJSONObject(i);
                    String key = item.optString("key", "").trim();
                    String title = item.optString("title", "DEYN").trim();
                    String body = item.optString("body", "").trim();
                    long at = item.optLong("at", 0L);
                    if (!key.isEmpty() && !body.isEmpty() && at > 0L) {
                        JSONObject clean = new JSONObject();
                        clean.put("key", key);
                        clean.put("title", title);
                        clean.put("body", body);
                        clean.put("at", at);
                        persisted.put(clean);
                        newActiveKeys.add(key);
                    }
                }
                sp.edit()
                    .putString(SCHEDULED_JSON, persisted.toString())
                    .putStringSet(ACTIVE_KEYS, newActiveKeys)
                    .commit();
            }

            WorkManager wm = WorkManager.getInstance(context);
            wm.cancelAllWorkByTag(WORK_TAG);
            int cancelledCount = 0;
            for (String oldKey : previousActiveKeys) {
                if (!newActiveKeys.contains(oldKey)) {
                    wm.cancelUniqueWork("deyn_notif_" + oldKey);
                    cancelledCount++;
                }
            }

            int count = enqueueScheduledNotifications(context, persisted, ExistingWorkPolicy.REPLACE);
            JSObject out = new JSObject();
            out.put("count", count);
            out.put("scheduled", count);
            out.put("cancelled", cancelledCount);
            call.resolve(out);
        } catch (Exception e) {
            call.reject("Notification schedule failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getFired(PluginCall call) {
        synchronized (LOCK) {
            Set<String> fired = new HashSet<>(prefs(getContext()).getStringSet(FIRED_KEYS, new HashSet<>()));
            JSArray arr = new JSArray();
            for (String k : fired) arr.put(k);
            JSObject out = new JSObject();
            out.put("keys", arr);
            call.resolve(out);
        }
    }

    public static boolean wasFired(Context c, String key) {
        synchronized (LOCK) {
            return prefs(c).getStringSet(FIRED_KEYS, new HashSet<>()).contains(key);
        }
    }

    public static boolean isKeyActive(Context c, String key) {
        synchronized (LOCK) {
            return prefs(c).getStringSet(ACTIVE_KEYS, new HashSet<>()).contains(key);
        }
    }

    public static boolean postOnce(Context context, String key, String title, String body, boolean force) {
        if (context == null || key == null || key.isEmpty()) return false;
        synchronized (LOCK) {
            if (!hasNotificationPermission(context)) return false;
            SharedPreferences sp = prefs(context);
            Set<String> fired = new HashSet<>(sp.getStringSet(FIRED_KEYS, new HashSet<>()));
            if (!force && fired.contains(key)) {
                return false;
            }
            ensureChannel(context);
            try {
                Intent launchIntent = context.getPackageManager() != null
                    ? context.getPackageManager().getLaunchIntentForPackage(context.getPackageName())
                    : null;
                if (launchIntent == null) {
                    launchIntent = new Intent();
                }
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                launchIntent.putExtra("notif_key", key);
                int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    piFlags |= PendingIntent.FLAG_IMMUTABLE;
                }
                PendingIntent contentIntent = PendingIntent.getActivity(
                    context,
                    (key.hashCode() & 0x7fffffff),
                    launchIntent,
                    piFlags
                );
                int smallIcon = (context.getApplicationInfo() != null && context.getApplicationInfo().icon != 0)
                    ? context.getApplicationInfo().icon
                    : android.R.drawable.ic_dialog_info;
                NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                    .setSmallIcon(smallIcon)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setAutoCancel(true)
                    .setContentIntent(contentIntent);
                NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) {
                    nm.notify((key.hashCode() & 0x7fffffff), builder.build());
                }
                fired.add(key);
                sp.edit().putStringSet(FIRED_KEYS, fired).commit();
                return true;
            } catch (Exception e) {
                return false;
            }
        }
    }

    public static int enqueueScheduledNotifications(Context context, JSONArray items, ExistingWorkPolicy policy) throws Exception {
        WorkManager wm = WorkManager.getInstance(context);
        long now = System.currentTimeMillis();
        int queued = 0;
        for (int i = 0; i < items.length(); i++) {
            JSONObject item = items.getJSONObject(i);
            String key = item.getString("key");
            if (wasFired(context, key)) continue;
            long at = item.getLong("at");
            long delay = Math.max(0L, at - now);
            Data data = new Data.Builder()
                .putString("key", key)
                .putString("title", item.optString("title", "DEYN"))
                .putString("body", item.getString("body"))
                .build();
            OneTimeWorkRequest req = new OneTimeWorkRequest.Builder(NotifWorker.class)
                .setInitialDelay(delay, TimeUnit.MILLISECONDS)
                .setInputData(data)
                .addTag(WORK_TAG)
                .build();
            wm.enqueueUniqueWork("deyn_notif_" + key, policy, req);
            queued++;
        }
        return queued;
    }

    public static int rescheduleOnBoot(Context context) {
        if (context == null) return 0;
        synchronized (LOCK) {
            try {
                String raw = prefs(context).getString(SCHEDULED_JSON, "[]");
                if (raw == null || raw.isEmpty()) return 0;
                JSONArray arr = new JSONArray(raw);
                return enqueueScheduledNotifications(context, arr, ExistingWorkPolicy.KEEP);
            } catch (Exception e) {
                return 0;
            }
        }
    }

    public static class NotifBootReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (context == null || intent == null) return;
            String action = intent.getAction();
            if (Intent.ACTION_BOOT_COMPLETED.equals(action) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
                rescheduleOnBoot(context.getApplicationContext() != null ? context.getApplicationContext() : context);
            }
        }
    }

    public static class NotifWorker extends androidx.work.Worker {
        public NotifWorker(@NonNull Context context, @NonNull androidx.work.WorkerParameters params) {
            super(context, params);
        }

        @NonNull
        @Override
        public Result doWork() {
            Context context = getApplicationContext();
            String key = getInputData().getString("key");
            String title = getInputData().getString("title");
            String body = getInputData().getString("body");
            if (key == null || body == null) return Result.failure();
            // Verify the notification is still active (was not cancelled by payment or debt modification)
            if (!isKeyActive(context, key)) {
                return Result.success();
            }
            postOnce(context, key, title != null ? title : "DEYN", body, false);
            return Result.success();
        }
    }
}
```

================================================================================
## [13/31] FILE: `deyn-app/package.json`

- **المسار الأصلي**: `deyn-app/package.json`
- **الحجم**: `672` بايت | **الأسطر**: `22` | **SHA-256**: `311768ced7459b35070ffe3a426bfa200119f5c5d722c1d5322b41b6580575e2`

```json
{
  "name": "deyn-app",
  "version": "1.0.0",
  "private": true,
  "description": "DEYN",
  "scripts": {
    "fonts": "python3 scripts/fetch_fonts.py",
    "android:add": "npx cap add android && bash scripts/prepare-android.sh && npx cap sync android",
    "android:sync": "bash scripts/prepare-android.sh && npx cap sync android",
    "android:apk": "cd android && ./gradlew assembleDebug"
  },
  "dependencies": {
    "@capacitor/android": "^7.0.0",
    "@capacitor/clipboard": "^7.0.0",
    "@capacitor/core": "^7.0.0",
    "@capacitor/device": "^7.0.0",
    "capacitor-secure-storage-plugin": "^0.11.0"
  },
  "devDependencies": {
    "@capacitor/cli": "^7.0.0"
  }
}
```

================================================================================
## [14/31] FILE: `deyn-app/scripts/prepare-android.sh`

- **المسار الأصلي**: `deyn-app/scripts/prepare-android.sh`
- **الحجم**: `4,152` بايت | **الأسطر**: `61` | **SHA-256**: `7e794d8155d0bfd6ec35c08af47835cf0de918619c17ec2fe218edddd6a8d3f7`

```bash
#!/usr/bin/env bash
# يُشغَّل بعد: npx cap add android   (وبعد كل إعادة مزامنة)
set -euo pipefail
cd "$(dirname "$0")/.."
RES=android/app/src/main/res
MAN=android/app/src/main/AndroidManifest.xml
[ -d "$RES" ] || { echo "شغّل 'npx cap add android' أولاً"; exit 1; }

# 1) الأيقونات (أيقونة عادية + دائرية + تكيفية)
rm -f $RES/mipmap-*/ic_launcher*.png $RES/mipmap-anydpi-v26/ic_launcher*.xml
cp -r android-res/mipmap-* $RES/

# 2) شاشة البداية: نفس الصورة في كل الكثافات الموجودة
find $RES -name "splash.png" -exec cp android-res/drawable/splash.png {} \;

# 3) منع النسخ الاحتياطي التلقائي لبيانات الترخيص + منع http غير مشفّر
if ! grep -q 'android:allowBackup="false"' "$MAN"; then
  sed -i 's/android:allowBackup="true"/android:allowBackup="false"/' "$MAN"
fi
if ! grep -q 'usesCleartextTraffic' "$MAN"; then
  sed -i '0,/<application/s//<application android:usesCleartextTraffic="false"/' "$MAN"
fi

# 4) إضافات Capacitor الأصلية (DeynVault = Keystore، DeynSync = مقابس TCP للمزامنة) + تسجيلها في MainActivity
JAVA=android/app/src/main/java/com/deyn/app
mkdir -p "$JAVA"
cp native/*.java "$JAVA/"
cat > "$JAVA/MainActivity.java" <<'JAVA_EOF'
package com.deyn.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DeynVaultPlugin.class);
        registerPlugin(DeynSyncPlugin.class);
        registerPlugin(DeynNotifPlugin.class);
        registerPlugin(DeynBackupPlugin.class);
        registerPlugin(DeynSmsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
JAVA_EOF

# 5) صلاحيات الشبكة المحلية والكاميرا لمسح QR (تُضاف مرة واحدة)
MANIFEST=android/app/src/main/AndroidManifest.xml
for P in ACCESS_NETWORK_STATE ACCESS_WIFI_STATE CAMERA SEND_SMS RECEIVE_BOOT_COMPLETED POST_NOTIFICATIONS; do
  grep -q "android.permission.$P" "$MANIFEST" || sed -i "s#<application#<uses-permission android:name=\"android.permission.$P\" />\n    <application#" "$MANIFEST"
done
if ! grep -q 'DeynSmsPlugin\$SmsStatusReceiver' "$MANIFEST"; then
  sed -i 's#</application>#    <receiver android:name="com.deyn.app.DeynSmsPlugin$SmsStatusReceiver" android:exported="false">\n            <intent-filter>\n                <action android:name="com.deyn.app.SMS_SENT" />\n                <action android:name="com.deyn.app.SMS_DELIVERED" />\n            </intent-filter>\n        </receiver>\n        <receiver android:name="com.deyn.app.DeynSmsPlugin$SmsBootReceiver" android:exported="true">\n            <intent-filter>\n                <action android:name="android.intent.action.BOOT_COMPLETED" />\n                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />\n            </intent-filter>\n        </receiver>\n        <receiver android:name="com.deyn.app.DeynNotifPlugin$NotifBootReceiver" android:exported="true">\n            <intent-filter>\n                <action android:name="android.intent.action.BOOT_COMPLETED" />\n                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />\n            </intent-filter>\n        </receiver>\n    </application>#' "$MANIFEST"
elif ! grep -q 'DeynNotifPlugin\$NotifBootReceiver' "$MANIFEST"; then
  sed -i 's#</application>#    <receiver android:name="com.deyn.app.DeynNotifPlugin$NotifBootReceiver" android:exported="true">\n            <intent-filter>\n                <action android:name="android.intent.action.BOOT_COMPLETED" />\n                <action android:name="android.intent.action.MY_PACKAGE_REPLACED" />\n            </intent-filter>\n        </receiver>\n    </application>#' "$MANIFEST"
fi
GRADLE=android/app/build.gradle
if ! grep -q 'androidx.work:work-runtime' "$GRADLE"; then
  sed -i '/dependencies[[:space:]]*{/a\    implementation "androidx.work:work-runtime:2.9.0"' "$GRADLE"
fi
echo "✔ تم تجهيز مشروع أندرويد"
```

================================================================================
## [15/31] FILE: `deyn-keygen/android-res/mipmap-anydpi-v26/ic_launcher_round.xml`

- **المسار الأصلي**: `deyn-keygen/android-res/mipmap-anydpi-v26/ic_launcher_round.xml`
- **الحجم**: `266` بايت | **الأسطر**: `5` | **SHA-256**: `44cc3246d167bd718fb61feaba493850ff95255c1ddbb8854c0e4c0534832f96`

```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

================================================================================
## [16/31] FILE: `deyn-keygen/package.json`

- **المسار الأصلي**: `deyn-keygen/package.json`
- **الحجم**: `682` بايت | **الأسطر**: `22` | **SHA-256**: `22e328b733e5060576deb85acfba20cb8cdb3030624e3c7f34b8f1e452b5d110`

```json
{
  "name": "deyn-keygen",
  "version": "1.0.0",
  "private": true,
  "description": "DEYN Keygen",
  "scripts": {
    "fonts": "python3 scripts/fetch_fonts.py",
    "android:add": "npx cap add android && bash scripts/prepare-android.sh && npx cap sync android",
    "android:sync": "bash scripts/prepare-android.sh && npx cap sync android",
    "android:apk": "cd android && ./gradlew assembleDebug"
  },
  "dependencies": {
    "@capacitor/android": "^7.0.0",
    "@capacitor/clipboard": "^7.0.0",
    "@capacitor/core": "^7.0.0",
    "@capacitor/device": "^7.0.0",
    "capacitor-secure-storage-plugin": "^0.11.0"
  },
  "devDependencies": {
    "@capacitor/cli": "^7.0.0"
  }
}
```

================================================================================
## [17/31] FILE: `deyn-keygen/scripts/fetch_fonts.py`

- **المسار الأصلي**: `deyn-keygen/scripts/fetch_fonts.py`
- **الحجم**: `1,074` بايت | **الأسطر**: `17` | **SHA-256**: `e43149a70cf52069897d18200b8dd0c20f056970422e966444109e9241a487a2`

```python
#!/usr/bin/env python3
"""ينزّل خطوط Alexandria و Plus Jakarta Sans محلياً ليشتغل التطبيق بنفس الشكل بدون انترنت.
شغّله مرة واحدة وأنت متصل:  python3 scripts/fetch_fonts.py"""
import re, os, urllib.request
CSS_URL = "https://fonts.googleapis.com/css2?family=Alexandria:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36"
out = os.path.join(os.path.dirname(__file__), "..", "www", "fonts")
os.makedirs(out, exist_ok=True)
css = urllib.request.urlopen(urllib.request.Request(CSS_URL, headers={"User-Agent": UA})).read().decode()
n = 0
def grab(m):
    global n
    n += 1; name = f"f{n}.woff2"
    open(os.path.join(out, name), "wb").write(urllib.request.urlopen(m.group(1)).read())
    return f"url({name})"
open(os.path.join(out, "fonts.css"), "w", encoding="utf-8").write(re.sub(r"url\((https://[^)]+)\)", grab, css))
print(f"✔ تم تنزيل {n} ملف خط إلى www/fonts")
```

================================================================================
## [18/31] FILE: `deyn-keygen/www/fonts/fonts.css`

- **المسار الأصلي**: `deyn-keygen/www/fonts/fonts.css`
- **الحجم**: `92` بايت | **الأسطر**: `1` | **SHA-256**: `ba51e7135b662fe638fae7d55491a2d41964dc87bd22d681c0a293c46fd26f4e`

```css
/* يُستبدل بالخطوط المحلية عند تشغيل scripts/fetch_fonts.py */
```

================================================================================
## [19/31] FILE: `deyn-keygen/www/index.html`

- **المسار الأصلي**: `deyn-keygen/www/index.html`
- **الحجم**: `18,454` بايت | **الأسطر**: `186` | **SHA-256**: `b07dfae0418a0c11fbf8b5990c0e5f603ea7f2f6a85e3c3b8039fd17628861a4`

```html
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#065043">
<title>DEYN Keygen</title>
<link rel="stylesheet" href="fonts/fonts.css">
<style>
:root{--em:#065043;--sea:#206258;--bg:#eef5f3;--line:#e2e8f0;--ink:#0f172a;--mute:#5d726c;--tint:#d6efe5;--danger:#b91c1c;--danger-bg:#fbeaea}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{margin:0;height:100%;background:var(--bg);color:var(--ink);font-family:'Alexandria','Segoe UI',Tahoma,sans-serif;-webkit-text-size-adjust:100%;overscroll-behavior:none}
button,input{font-family:inherit;color:inherit}
button{border:0;background:none;padding:0;cursor:pointer}
.app{height:100vh;height:100dvh;display:flex;flex-direction:column;overflow-y:auto;-webkit-overflow-scrolling:touch;padding-left:env(safe-area-inset-left);padding-right:env(safe-area-inset-right)}
.top{position:relative;flex:none;color:#fff;text-align:center;padding:calc(env(safe-area-inset-top) + clamp(16px,3.5dvh,34px)) 20px clamp(38px,6.5dvh,60px);background:linear-gradient(160deg,#0a5f4e 0%,#043a30 100%);border-radius:0 0 44px 44px;box-shadow:0 8px 24px rgba(6,80,67,.22)}
.top .logo{width:clamp(46px,8dvh,64px);height:clamp(46px,8dvh,64px);border-radius:16px;background:rgba(255,255,255,.14);display:grid;place-items:center;margin:0 auto 8px}
.top h1{margin:0;font:800 clamp(26px,4.6dvh,36px)/1.1 'Plus Jakarta Sans','Alexandria',sans-serif;letter-spacing:.02em;direction:ltr}
.top p{margin:6px 0 0;color:#d4efe5;font-weight:600;font-size:clamp(13px,2dvh,16px)}
.wrap{width:100%;max-width:34rem;margin:16px auto 0;padding:0 clamp(14px,4.5vw,24px) calc(24px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:14px}
.card{background:rgba(255,255,255,.96);border-radius:24px;box-shadow:0 10px 26px rgba(6,80,67,.10);border:1px solid rgba(6,80,67,.05);padding:14px}
.lab{display:block;font-size:13px;font-weight:700;color:var(--mute);margin:0 4px 10px}
.row{display:flex;align-items:center;gap:10px}
.inp{flex:1;min-width:0;height:54px;border:1.5px solid var(--line);border-radius:16px;padding:0 14px;font:700 18px 'Plus Jakarta Sans','Alexandria',sans-serif;letter-spacing:.04em;text-transform:uppercase;direction:ltr;text-align:center;background:#fff;transition:border-color .15s,box-shadow .15s}
.inp::placeholder{font:500 14px 'Alexandria',sans-serif;letter-spacing:0;text-transform:none;color:#94a3b8}
.inp:focus{outline:none;border-color:var(--sea);box-shadow:0 0 0 3px rgba(32,98,88,.12)}
.pill{flex:none;display:inline-flex;align-items:center;gap:6px;height:54px;padding:0 16px;border-radius:16px;background:var(--tint);color:var(--em);font-weight:700;font-size:15px;transition:transform .1s,background .15s}
.pill:active{transform:scale(.95);background:#c3e6d8}
.pill svg{width:20px;height:20px}
.seg{display:grid;gap:6px;background:#e6efec;border-radius:18px;padding:5px}
.seg.c3{grid-template-columns:repeat(3,1fr)}
.seg.c2{grid-template-columns:repeat(2,1fr)}
.seg button{min-height:52px;border-radius:14px;font-weight:700;font-size:clamp(12.5px,3.4vw,15px);color:var(--mute);line-height:1.35;padding:6px 4px;transition:background .15s,color .15s,box-shadow .15s}
.seg button small{display:block;font-weight:500;font-size:11px;opacity:.85}
.seg button.on{background:#fff;color:var(--em);box-shadow:0 2px 8px rgba(6,80,67,.16)}
.go{height:62px;border-radius:999px;background:linear-gradient(180deg,#0b6a57 0%,#065043 58%,#04382f 100%);color:#fff;font:700 21px 'Alexandria',sans-serif;display:flex;align-items:center;justify-content:center;gap:12px;box-shadow:0 12px 22px rgba(6,80,67,.28),0 1px 0 rgba(255,255,255,.2) inset;transition:transform .1s,opacity .15s}
.go:active{transform:scale(.98)}
.go:disabled{opacity:.45}
.err{display:none;padding:10px 14px;border-radius:14px;background:var(--danger-bg);color:var(--danger);font-weight:700;font-size:13.5px;text-align:center;line-height:1.6}
.err.show{display:block}
.res{display:none;text-align:center}
.res.show{display:block}
.res .meta{font-size:13px;font-weight:600;color:var(--mute);margin-bottom:8px}
.code{display:block;margin:4px 0 14px;padding:16px 8px;border-radius:18px;background:#f0fdf4;border:1.5px dashed var(--em);font:800 clamp(18px,5.6vw,26px)/1.3 'Plus Jakarta Sans','Alexandria',sans-serif;letter-spacing:.03em;color:var(--em);direction:ltr;user-select:all;-webkit-user-select:all;word-break:break-all}
.acts{display:grid;gap:10px}
.btn2{height:54px;border-radius:16px;font-weight:700;font-size:16px;display:flex;align-items:center;justify-content:center;gap:10px;text-decoration:none;transition:transform .1s}
.btn2:active{transform:scale(.97)}
.copy{background:var(--tint);color:var(--em)}
.wa{background:#128c7e;color:#fff;box-shadow:0 6px 14px rgba(18,140,126,.28)}
.btn2 svg{width:22px;height:22px}
#toast{position:fixed;left:50%;bottom:calc(22px + env(safe-area-inset-bottom));transform:translate(-50%,16px);max-width:calc(100% - 32px);background:var(--em);color:#fff;padding:12px 20px;border-radius:16px;font-size:14px;font-weight:600;box-shadow:0 8px 22px rgba(0,0,0,.25);opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;z-index:50;text-align:center}
#toast.show{opacity:1;transform:translate(-50%,0)}
</style>
</head>
<body>
<div class="app">
  <div class="top">
    <div class="logo"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4.5"/><path d="M11.2 11.8L20 3m-3 3l3 3m-6-0l2 2"/></svg></div>
    <h1>DEYN Keygen</h1>
    <p>مولّد أكواد التفعيل</p>
  </div>

  <div class="wrap">
    <div class="card"><label class="lab" for="privateKey">مفتاح التوقيع الخاص (لصاحب التطبيق فقط)</label><textarea class="inp" id="privateKey" style="height:100px;padding:12px;text-align:left;font-size:12px;resize:vertical" placeholder="حمّل ملف المفتاح بصيغة PEM"></textarea><input id="keyFile" type="file" accept=".pem,.txt,text/plain" hidden><button class="pill" id="loadKey" type="button" style="width:100%;margin-top:8px">تحميل ملف المفتاح من الهاتف</button><p style="font-size:11px;color:var(--mute);line-height:1.8;margin:8px 4px 0">المفتاح لا يُحفظ ولا يُرسل. هذه النسخة لصاحب التطبيق فقط، ولا تُرسلها للعملاء.</p></div>
    <div class="card">
      <label class="lab" for="devId">معرّف الجهاز</label>
      <div class="row">
        <button type="button" class="pill" id="paste"><svg viewBox="0 0 24 24" fill="none" stroke="#065043" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="13" rx="3"/><path d="M16 8V6a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h1"/></svg><span>لصق</span></button>
        <input class="inp" id="devId" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="40" placeholder="32 خانة سداسية عشرية">
      </div>
    </div>

    <div class="card">
      <span class="lab">مدة الترخيص</span>
      <div class="seg c3" id="tierSeg">
        <button type="button" data-v="1Y" class="on">عام واحد<small>1 Year</small></button>
        <button type="button" data-v="2Y">عامين<small>2 Years</small></button>
        <button type="button" data-v="LT">مدى الحياة<small>Lifetime</small></button>
      </div>
    </div>

    <div class="card" id="expiryCard"><label class="lab" for="expiryDate">آخر يوم صالح للتفعيل</label><input class="inp" id="expiryDate" type="date" style="text-transform:none"><p style="font-size:11px;color:var(--mute);line-height:1.8;margin:8px 4px 0">ينتهي عند منتصف الليل بعد هذا التاريخ بتوقيت الجزائر.</p></div>

    <div class="card">
      <span class="lab">نوع الحساب</span>
      <div class="seg c2" id="roleSeg">
        <button type="button" data-v="M" class="on">المالك الرئيسي<small>Master</small></button>
        <button type="button" data-v="W">العامل<small>Worker</small></button>
      </div>
    </div>

    <div class="err" id="err" role="alert"></div>
    <button type="button" class="go" id="gen" disabled>توليد كود التفعيل</button>
    <button type="button" class="go" id="genRec" disabled style="margin-top:10px;background:#fff;color:#075447;border:1.5px solid #075447;box-shadow:none">توليد كود استرداد كلمة المرور (7 أيام • مرة واحدة)</button>

    <div class="card res" id="res">
      <div class="meta" id="meta"></div>
      <b class="code" id="code" dir="ltr"></b>
      <div class="acts">
        <button type="button" class="btn2 copy" id="copy"><svg viewBox="0 0 24 24" fill="none" stroke="#065043" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="13" rx="3"/><path d="M16 8V6a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h1"/></svg><span>نسخ الكود</span></button>
        <a class="btn2 wa" id="wa" href="#" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.200zm4.5-6.1c-.2-.1-1.500-.7-1.700-.8-.2-.1-.4-.1-.6.100l-.8 1c-.1.200-.3.200-.5.100-.7-.3-1.600-.9-2.500-2-.2-.3-.5-.7-.7-1.100-.1-.2 0-.4.100-.5l.4-.5c.1-.1.100-.3.200-.4 0-.1 0-.3 0-.4l-.8-1.800c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.300-.7.700-1 1.500-.9 2.400.2 1.200.8 2.200 1.500 3 1.300 1.600 2.800 2.600 4.700 3.200.6.200 1.100.2 1.600.1.600-.1 1.500-.6 1.700-1.200.2-.6.200-1.100.1-1.200 0-.1-.2-.2-.4-.3z"/></svg><span>إرسال عبر واتساب</span></a>
      </div>
    </div>
  </div>
</div>
<div id="toast" role="status" aria-live="polite"></div>

<script>
const PUBLIC_KEY='uM8GgGamY++GH9e2PTTkluRlzqEVdbnj+MLh4uFYr/Y=';
const $=id=>document.getElementById(id);let tier='1Y',role='M',shown='';
const b64u=b=>{let s='';for(const x of b)s+=String.fromCharCode(x);return btoa(s).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');};
function pemBytes(pem){
 const text=String(pem||'').replace(/^\uFEFF/,'').trim();
 const match=text.match(/-----BEGIN PRIVATE KEY-----([\s\S]*?)-----END PRIVATE KEY-----/);
 if(!match)throw Error('ملف المفتاح غير صالح. اختر ملف DEYN_PRIVATE.pem وليس ملف ZIP أو المفتاح العام');
 const body=match[1].replace(/[\s\uFEFF\u200B-\u200D\u2060]/g,'');
 if(/[^\x00-\x7F]/.test(body))throw Error('ملف PEM يحتوي على أحرف غير صالحة. أعد اختيار ملف DEYN_PRIVATE.pem الأصلي');
 if(!/^[A-Za-z0-9+/]+={0,2}$/.test(body)||body.length%4!==0)throw Error('محتوى المفتاح غير مكتمل أو ليس بصيغة PEM صحيحة');
 try{return Uint8Array.from(atob(body),c=>c.charCodeAt(0));}
 catch(e){throw Error('تعذّر قراءة ترميز المفتاح. اختر ملف DEYN_PRIVATE.pem الأصلي من ZArchiver');}
}
const b64=s=>{try{return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}catch(e){throw Error('بيانات المفتاح العام داخل التطبيق غير صالحة');}};
function normId(v){return String(v||'').replace(/[\s-]/g,'').toLowerCase();}
function validId(v){return /^[0-9a-f]{32}$/.test(normId(v));}
function expiryMs(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('اختر تاريخ الانتهاء أولاً');const [y,m,d]=value.split('-').map(Number);const check=new Date(Date.UTC(y,m-1,d));if(check.getUTCFullYear()!==y||check.getUTCMonth()!==m-1||check.getUTCDate()!==d)throw Error('تاريخ غير صحيح');const result=Date.UTC(y,m-1,d+1)-3600000;if(result<=Date.now())throw Error('اختر تاريخاً مستقبلياً');return result;}
function canonical(p){return JSON.stringify({v:p.v,d:p.d,t:p.t,r:p.r,exp:p.exp,n:p.n});}
function error(m){$('err').textContent=m||'';$('err').classList.toggle('show',!!m);}
function refresh(){$('expiryCard').hidden=tier==='LT';$('gen').disabled=!validId($('devId').value)||!$('privateKey').value.trim()||(tier!=='LT'&&!$('expiryDate').value);}
function toast(m){$('toast').textContent=m;$('toast').classList.add('show');setTimeout(()=>$('toast').classList.remove('show'),2200);}
async function checkKey(pem){if(!crypto.subtle)throw Error('WebCrypto غير متاح في هذا الجهاز');const body=pem.trim().replace('-----BEGIN PRIVATE KEY-----','').replace('-----END PRIVATE KEY-----','').replace(/\s+/g,'');const priv=await crypto.subtle.importKey('pkcs8',pemBytes(pem),{name:'Ed25519'},false,['sign']);const pub=await crypto.subtle.importKey('raw',b64(PUBLIC_KEY),{name:'Ed25519'},false,['verify']);const msg=new TextEncoder().encode('DEYN-V3-KEY-CHECK');const sig=await crypto.subtle.sign('Ed25519',priv,msg);if(!await crypto.subtle.verify('Ed25519',pub,sig,msg))throw Error('ملف المفتاح الخاص لا يطابق هذا الإصدار من DEYN');return priv;}
async function issue(priv,id,exp){const n=new Uint8Array(16);crypto.getRandomValues(n);const p={v:3,d:id,t:tier,r:role,exp,n:b64u(n)};const body=new TextEncoder().encode(canonical(p));const sig=new Uint8Array(await crypto.subtle.sign('Ed25519',priv,body));return 'DEYN3-'+b64u(body)+'.'+b64u(sig);}
function clear(){shown='';$('res').hidden=true;$('res').classList.remove('show');$('code').textContent='';}
['devId','expiryDate','privateKey'].forEach(id=>$(id).addEventListener('input',()=>{clear();error('');refresh();}));
$('loadKey').onclick=()=>$('keyFile').click();$('keyFile').onchange=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{$('privateKey').value=String(r.result||'');toast('تم تحميل المفتاح في هذه الجلسة فقط');refresh();};r.onerror=()=>error('تعذّرت قراءة ملف المفتاح');r.readAsText(f);e.target.value='';};
for(const [id,set] of [['tierSeg',v=>tier=v],['roleSeg',v=>role=v]])$(id).onclick=e=>{const b=e.target.closest('button[data-v]');if(!b)return;$(id).querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));set(b.dataset.v);clear();error('');refresh();};
$('paste').onclick=async()=>{try{const t=await navigator.clipboard.readText();$('devId').value=normId(t);clear();refresh();}catch(e){$('devId').focus();toast('الصق معرّف الجهاز في الخانة');}};
$('gen').onclick=async()=>{clear();error('');$('gen').disabled=true;try{const id=normId($('devId').value);if(!validId(id))throw Error('معرّف الجهاز يجب أن يكون 32 خانة سداسية عشرية');const pem=$('privateKey').value.trim();if(!pem)throw Error('حمّل ملف المفتاح الخاص أولاً');const exp=tier==='LT'?null:expiryMs($('expiryDate').value);const priv=await checkKey(pem);const code=await issue(priv,id,exp);shown=code;$('code').textContent=code;const expiry=tier==='LT'?'مدى الحياة':'حتى نهاية يوم '+$('expiryDate').value+' بتوقيت الجزائر';$('meta').textContent=(role==='M'?'المالك الرئيسي':'العامل')+' • '+tier+' • '+expiry+' • '+id;const msg='مرحباً، كود تفعيل DEYN لجهازك:\n'+code+'\nنوع الحساب: '+(role==='M'?'المالك الرئيسي':'العامل')+'\nالصلاحية: '+expiry;$('wa').href='https://wa.me/?text='+encodeURIComponent(msg);$('res').hidden=false;$('res').classList.add('show');}catch(e){error(e.message||'تعذّر إنشاء الكود');}finally{refresh();}};
$('copy').onclick=async()=>{const v=$('code').textContent.trim();if(!v||v!==shown)return toast('أنشئ الكود أولاً');try{await navigator.clipboard.writeText(v);toast('تم نسخ الكود');}catch(e){toast('اضغط مطولاً على الكود لنسخه');}};
const REC_PREFIX='DEYN-RECOVERY-V1\n';
function recCanonical(p){return JSON.stringify({v:p.v,k:p.k,d:p.d,iat:p.iat,exp:p.exp,n:p.n});}
async function issueRecovery(priv,id){const n=new Uint8Array(16);crypto.getRandomValues(n);const iat=Date.now();const p={v:1,k:'rec',d:id,iat,exp:iat+7*864e5,n:b64u(n)};const body=new TextEncoder().encode(recCanonical(p));const msg=new Uint8Array([...new TextEncoder().encode(REC_PREFIX),...body]);const sig=new Uint8Array(await crypto.subtle.sign('Ed25519',priv,msg));return 'DEYNR1-'+b64u(body)+'.'+b64u(sig);}
const _refreshBase=refresh;
refresh=function(){_refreshBase();$('genRec').disabled=!validId($('devId').value)||!$('privateKey').value.trim();};
$('genRec').onclick=async()=>{clear();error('');$('genRec').disabled=true;try{const id=normId($('devId').value);if(!validId(id))throw Error('معرّف الجهاز يجب أن يكون 32 خانة سداسية عشرية');const pem=$('privateKey').value.trim();if(!pem)throw Error('حمّل ملف المفتاح الخاص أولاً');const priv=await checkKey(pem);const code=await issueRecovery(priv,id);shown=code;$('code').textContent=code;$('meta').textContent='كود استرداد كلمة المرور • صالح 7 أيام • مرة واحدة • '+id;const msg='مرحباً، كود استرداد كلمة المرور في DEYN لجهازك (صالح 7 أيام ولمرة واحدة):\n'+code;$('wa').href='https://wa.me/?text='+encodeURIComponent(msg);$('res').hidden=false;$('res').classList.add('show');}catch(e){error(e.message||'تعذّر إنشاء الكود');}finally{refresh();}};
refresh();

</script>







<script>/* DEYN_DEVICE_ID_32_CHAR_RUNTIME_FIX */
(function(){
 function fixDeviceIdField(){
   const el=document.getElementById('devId');
   if(!el)return;
   el.setAttribute('maxlength','32');
   el.maxLength=32;
   el.setAttribute('inputmode','text');
   el.autocapitalize='characters';
   if(!el.dataset.deyn32Bound){
     el.dataset.deyn32Bound='1';
     el.addEventListener('input',function(){
       const clean=this.value.replace(/[^0-9a-f]/gi,'').slice(0,32).toLowerCase();
       if(this.value!==clean)this.value=clean;
     });
   }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fixDeviceIdField);
 else fixDeviceIdField();
 const observer=new MutationObserver(fixDeviceIdField);
 observer.observe(document.documentElement,{childList:true,subtree:true});
})();
</script>







</body>
</html>
```

================================================================================
## [20/31] FILE: `docs/DESIGN_VAULT_SYNC.md`

- **المسار الأصلي**: `docs/DESIGN_VAULT_SYNC.md`
- **الحجم**: `8,138` بايت | **الأسطر**: `74` | **SHA-256**: `ef99e190b54a541dead3cd1a5994ae53522c11809ec20d73cd25757be7f957e7`

````markdown
# تصميم: تشفير البيانات والمزامنة المحلية (قبل التنفيذ)

## 1) التشفير (AES-256-GCM + Android Keystore)
- **المفتاح** يُولَّد داخل Android Keystore (AES-256، غير قابل للتصدير، لكل تثبيت). **لا يصل إلى JavaScript إطلاقًا.**
- إضافة Capacitor أصلية `DeynVault` تعرض: `status()`، `encrypt({data})`، `decrypt({iv,data})`. الـIV يولّده Keystore عشوائيًا لكل عملية.
- التخزين: `deyn.v2` = `{v:2, iv, ct, n}` حيث `n` عدّاد كتابة (يكشف الرجوع لنسخة أقدم)، و`aad` ثابت `"DEYN-DATA-V2"`.
- غياب الإضافة (متصفح/Keystore معطوب): لا نفقد بيانات. يستمر التطبيق بالتخزين القديم مع تحذير ظاهر `vault=unavailable`.
- الكتابة غير متزامنة (الإضافة أصلية): `persist()` يضع الحالة في طابور تسلسلي؛ آخر حالة هي التي تُكتب؛ تفريغ فوري عند `pagehide`. **خطر:** إغلاق قسري قبل اكتمال الكتابة قد يفقد آخر تعديل (ملي ثانية). لذلك نُبقي النسخة السابقة سليمة دائمًا (كتابة بديلة A/B).

### مخطط الترحيل
```
deyn.v1 (نص واضح)
   │ 1. قراءة + التحقق من البنية
   ▼
 تشفير → deyn.v2.B (نسخة جديدة)      [v1 لا يُمس]
   │ 2. فك التشفير + مقارنة SHA-256 مع الأصل
   ▼
 نجح؟ ──لا──► نبقى على v1 + تحذير (لا خسارة)
   │ نعم: deyn.v2 ← B، علم migrated=1 (v1 ما زال موجودًا)
   ▼
 3. الإقلاع التالي: فك v2 ناجح + نفس عدد الزبائن/العمليات؟
   │ نعم: حذف v1 (وهنا فقط)
   ▼ لا: نبقى على v1 ونرفض v2
```
### مخاطر فقدان البيانات
| الخطر | المعالجة |
|---|---|
| فشل Keystore أو تغيّر المفتاح (مسح بيانات/استعادة نسخة هاتف) | لا يمكن فك v2: شاشة إنقاذ، v1 باقٍ إن لم يُحذف، ويمكن الاسترجاع من نسخة احتياطية مصدَّرة |
| إغلاق أثناء الكتابة | كتابة A/B: لا نستبدل الأخيرة السليمة قبل التحقق من الجديدة |
| تلف الـciphertext | GCM يكشف التلاعب؛ نرجع للنسخة الأخرى A/B؛ وإلا شاشة إنقاذ |
| رجوع لنسخة أقدم | العدّاد `n` أقل من المسجَّل في التخزين الآمن ← تحذير |
| حذف v1 مبكرًا | لا يحدث إلا بعد إقلاعين ناجحين |
**ما لا يحميه التشفير:** هاتف مفتوح القفل، أو برنامج خبيث بصلاحية root.

## 2) المزامنة المحلية
### النقل
WebView لا يستطيع فتح خادم TCP، و`http` صريح ممنوع (مختلط مع https://localhost). لذلك إضافة أصلية `DeynSync` تفعل شيئًا واحدًا: مقبس TCP خام (خادم على المالك أو أي طرف، وعميل على الآخر) يمرّر **إطارات مشفّرة** إلى JS. كل التشفير والبروتوكول في JS (قابل للاختبار). لا نعتمد Bluetooth: مداه وسرعته أسوأ، وWi-Fi Direct يغيّر شبكة الهاتف ويقطع الإنترنت. نستخدم الشبكة المحلية (راوتر المحل) ويُرسَل IP:port داخل QR.

### الاقتران (QR)
المالك يعرض QR: `{v,ip,port,did,idpub(Ed25519),secret(16B عشوائي، لمرة واحدة، 5 دقائق)}`. العامل يمسحه، ويتصل، ثم:
1. كل طرف يولّد زوج X25519 مؤقتًا.
2. رسالة Hello من كل طرف: `{did, idpub, epub}` موقّعة بمفتاح هوية Ed25519 للجهاز (يُولَّد مرة ويُحفظ في Keystore/التخزين الآمن).
3. المفتاح المشترك = HKDF-SHA256(X25519(e_a,e_b) ‖ secret QR، info = transcript hash). السر في QR يمنع هاتفًا غريبًا من الاقتران.
4. بعد الاقتران يُحفظ `idpub` للطرف الآخر (pinned) مع الدور المعتمد. الاتصالات اللاحقة تتطلب توقيعًا من idpub المخزّن + X25519 مؤقت جديد (سرية أمامية)، بلا QR.
5. تشفير الإطارات AES-256-GCM بعدّاد تسلسلي (يمنع إعادة الإرسال داخل الجلسة).

### نموذج البيانات (لا استبدال لقاعدة البيانات)
| الكيان | قاعدة الدمج |
|---|---|
| عملية مالية (tx دين/تسديد/تصحيح) | **غير قابلة للتغيير**: اتحاد بحسب المعرّف الفريد (UUID). لا تعارض ممكن. |
| تذكرة معلّقة | اتحاد بالمعرّف، مع شاهد حذف (tombstone) |
| زبون (حقول الاسم/الهاتف/السقف…) | آخر تعديل يفوز بحقل حقل (HLC ثم معرّف الجهاز للكسر) |
| أرشفة/سلة المهملات | حالة بشاهد: الأرشفة تغلب الاسترجاع الأقدم؛ لا محو لسجل مالي |
| إعدادات/كلمة المرور/الترخيص | **لا تُزامَن أبدًا** |
- **المؤشرات:** لكل زوج أجهزة `cursor` = آخر HLC معروف؛ الدلتا = كل ما غيّره الجهاز بعد المؤشر. أول مزامنة = مؤشر 0 (كاملة، لكنها اتحاد لا استبدال).
- **اكتشاف التغيير دون لمس مواضع التعديل الحالية:** لقطة بصمات `{id→hash}` تُقارَن عند المزامنة؛ ما اختلف يُختَم بـHLC ويدخل الدلتا.
- **الاستكمال بعد الانقطاع:** المؤشر لا يتقدّم إلا بعد إقرار (ACK) الطرف الآخر بعد تطبيق الدفعة ذريًا؛ الدفعات idempotent، فإعادة الإرسال آمنة.
- **الصلاحيات (يفرضها المستقبِل لا المرسِل):** دور الطرف الآخر مأخوذ من ترخيصه الموقّع المخزّن عند الاقتران لا من ادّعائه. من العامل يُقبل فقط: إضافة عمليات دين/تسديد، وزبائن جدد، وتذاكر. يُرفض: تعديل/أرشفة زبون، سلة المهملات، حذف عمليات، أي تغيير إعدادات. (يطابق `requireOwner` الحالي.)
- **READ_ONLY** (انتهاء مهلة الوقت): لا يُقبل أي حدث وارد ولا يُنشأ صادر.
- **الحالة:** آخر نجاح، عدد الأحداث، آخر خطأ؛ إعادة محاولة بتراجع أسّي؛ الأحداث تُخزَّن محليًا حتى عودة الاتصال.

### مخاطر المزامنة
| الخطر | المعالجة |
|---|---|
| تكرار عملية | معرّف UUID فريد + اتحاد |
| فقد عملية عند التعارض | العمليات المالية لا تتعارض (غير قابلة للتعديل)؛ تعارض حقول الزبون يحفظ الخاسر في سجل `conflicts` |
| هاتف غريب | سر QR + توقيع هوية + pinning |
| عامل يرفع صلاحياته | تحقق المستقبِل من الدور الموقّع |
| ساعة هاتف خاطئة تفسد الترتيب | HLC (يتقدّم دائمًا) لا الوقت الخام |
| قطع في منتصف الدفعة | تطبيق ذري + ACK |

## 3) ما يمكن ولا يمكن التحقق منه
- **يُختبر هنا:** كل منطق JS (تشفير، ترحيل، دمج، بروتوكول، QR، سياسة الوقت) مع بدائل محاكاة.
- **لا يُختبر هنا ويحتاج أجهزة:** Android Keystore، مقابس TCP الأصلية، مسح QR بالكاميرا، إعادة تشغيل الهاتف، شبكة Wi-Fi فعلية. كود Java مكتوب لكن **غير مترجم** (لا `javac`).
````

================================================================================
## [21/31] FILE: `sms/JavaPluginTests.java`

- **المسار الأصلي**: `sms/JavaPluginTests.java`
- **الحجم**: `7,526` بايت | **الأسطر**: `114` | **SHA-256**: `0e81bdba5a0a1c48371fd94e2a4e01f9d83e1f815c03f14793823840ba9de829`

```java
package com.deyn.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import androidx.work.Data;
import androidx.work.WorkerParameters;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import org.json.JSONObject;

public class JavaPluginTests {
    public static void main(String[] args) throws Exception {
        Context ctx = new Context();
        File safDir = new File("/tmp/java_verify/saf_tree");
        if (safDir.exists()) {
            for (File f : safDir.listFiles()) f.delete();
        }
        safDir.mkdirs();

        // 1. Test DeynBackupPlugin: no_folder check, atomic write, .prev.json rotation, and automatic fallback when main file is corrupted (>20 bytes)
        DeynBackupPlugin backup = new DeynBackupPlugin();
        String json1 = "{\"format\":\"DEYN-BACKUP-V2\",\"version\":2,\"data\":{\"customers\":[{\"id\":\"c1\",\"name\":\"أحمد\"}],\"pending\":[]}}";
        PluginCall writeNoFolder = new PluginCall().put("data", json1);
        backup.writeAutoBackup(writeNoFolder);
        assert writeNoFolder.resolved != null && !writeNoFolder.resolved.optBoolean("ok")
            && "no_folder".equals(writeNoFolder.resolved.optString("reason")) : "Expected no_folder before SAF selection";

        SharedPreferences.MEM.put("tree_uri", "content://tree/deyn");
        PluginCall write1 = new PluginCall().put("data", json1);
        backup.writeAutoBackup(write1);
        Thread.sleep(200);
        assert write1.resolved != null && write1.resolved.optBoolean("ok") : "First atomic backup write failed";

        String json2 = "{\"format\":\"DEYN-BACKUP-V2\",\"version\":2,\"data\":{\"customers\":[{\"id\":\"c1\",\"name\":\"أحمد\"},{\"id\":\"c2\",\"name\":\"سعيد\"}],\"pending\":[]}}";
        PluginCall write2 = new PluginCall().put("data", json2);
        backup.writeAutoBackup(write2);
        Thread.sleep(200);
        assert write2.resolved != null && write2.resolved.optBoolean("ok") : "Second atomic backup write failed";

        File mainFile = new File(safDir, "deyn-auto-backup.json");
        File prevFile = new File(safDir, "deyn-auto-backup.prev.json");
        assert mainFile.isFile() && prevFile.isFile() : "Both main and prev backup files must exist";

        // Simulate external corruption of deyn-auto-backup.json with >20 bytes of corrupt text
        Files.write(mainFile.toPath(), "{CORRUPT_MAIN_FILE_LONGER_THAN_20_BYTES_1234567890}".getBytes(StandardCharsets.UTF_8));
        PluginCall readFallback = new PluginCall();
        backup.readAutoBackup(readFallback);
        assert readFallback.resolved != null && readFallback.resolved.optBoolean("ok") : "readAutoBackup should succeed via fallback";
        assert readFallback.resolved.optBoolean("fallbackUsed") : "Expected fallbackUsed = true when main is corrupt";
        assert "deyn-auto-backup.prev.json".equals(readFallback.resolved.optString("source")) : "Expected source = deyn-auto-backup.prev.json";
        assert json1.equals(readFallback.resolved.optString("data")) : "Expected previous valid backup content";

        // Verify monotonic clock method
        PluginCall monoCall = new PluginCall();
        backup.getMonotonicTime(monoCall);
        assert monoCall.resolved != null && monoCall.resolved.optLong("elapsedRealtimeMs") > 0L : "Expected elapsedRealtimeMs > 0";
        System.out.println("PASS: DeynBackupPlugin atomic write, corrupt main -> .prev.json fallback, and monotonic clock verified.");

        // 2. Test DeynNotifPlugin: deduplication, scheduling, and cancellation of paid/modified debts in NotifWorker
        DeynNotifPlugin notif = new DeynNotifPlugin();
        String nKey = "overdue|c1|2026-11|10";
        assert DeynNotifPlugin.postOnce(ctx, nKey, "DEYN — أحمد", "متأخر بـ 1 يوم", false) : "First post should succeed";
        assert !DeynNotifPlugin.postOnce(ctx, nKey, "DEYN — أحمد", "متأخر بـ 1 يوم", false) : "Duplicate post must be suppressed";

        // Schedule notification for c2, then re-schedule empty list (simulating c2 paid off debt) -> NotifWorker must NOT fire c2!
        JSArray schedArr = new JSArray();
        JSONObject item = new JSONObject();
        item.put("key", "overdue|c2|2026-11|15");
        item.put("title", "DEYN — سعيد");
        item.put("body", "متأخر بـ 1 يوم");
        item.put("at", System.currentTimeMillis() + 3600_000L);
        schedArr.put(item);
        PluginCall sched1 = new PluginCall().put("items", schedArr);
        notif.schedule(sched1);
        assert DeynNotifPlugin.isKeyActive(ctx, "overdue|c2|2026-11|15") : "c2 key should be active after schedule";

        // Now c2 pays off debt -> schedule called with empty items
        PluginCall sched2 = new PluginCall().put("items", new JSArray());
        notif.schedule(sched2);
        assert !DeynNotifPlugin.isKeyActive(ctx, "overdue|c2|2026-11|15") : "c2 key must be inactive after debt paid";
        assert sched2.resolved.optInt("cancelled") == 1 : "Expected 1 cancelled notification";

        // If NotifWorker runs for c2 after c2 paid off debt, it must NOT post the notification
        Data workerData = new Data.Builder()
            .putString("key", "overdue|c2|2026-11|15")
            .putString("title", "DEYN — سعيد")
            .putString("body", "متأخر بـ 1 يوم")
            .build();
        DeynNotifPlugin.NotifWorker worker = new DeynNotifPlugin.NotifWorker(ctx, new WorkerParameters(workerData));
        worker.doWork();
        assert !DeynNotifPlugin.wasFired(ctx, "overdue|c2|2026-11|15") : "Cancelled notification must NOT fire in NotifWorker";
        System.out.println("PASS: DeynNotifPlugin deduplication, schedule update, and paid-debt cancellation in NotifWorker verified.");

        // 3. Test DeynSmsPlugin multipart division and per-part BroadcastReceiver state machine
        String longAr = "السلام عليكم أحمد، تذكير ودي من محل الأمانة بخصوص الرصيد المتبقي 14500 دج المستحق يوم 10/11/2026، بارك الله فيكم وشكرًا لتعاملكم الطيب معنا.";
        DeynSmsPlugin.DispatchResult dr = DeynSmsPlugin.dispatchOnce(ctx, "msg-test-1", "+213550123456", longAr, false, 0L, 1);
        assert dr.dispatched && dr.totalParts >= 2 : "Expected multipart dispatch";
        DeynSmsPlugin.SmsStatusReceiver smsReceiver = new DeynSmsPlugin.SmsStatusReceiver();
        long att = SharedPreferences.MEM.get("attempt_at_msg-test-1") instanceof Long ? (Long) SharedPreferences.MEM.get("attempt_at_msg-test-1") : 0L;
        for (int p = 0; p < dr.totalParts; p++) {
            Intent sentIntent = new Intent(DeynSmsPlugin.ACTION_SMS_SENT).putExtra("id", "msg-test-1").putExtra("partIndex", p).putExtra("partsTotal", dr.totalParts).putExtra("attemptAt", att);
            smsReceiver.setResultCode(android.app.Activity.RESULT_OK);
            smsReceiver.onReceive(ctx, sentIntent);
        }
        JSObject snapSent = DeynSmsPlugin.buildItemSnapshot(ctx.getSharedPreferences("deyn_sms_native", 0), "msg-test-1");
        assert "sent_to_network".equals(snapSent.optString("status")) : "Expected sent_to_network";
        System.out.println("PASS: DeynSmsPlugin multipart division and per-part BroadcastReceiver state machine verified.");
    }
}
```

================================================================================
## [22/31] FILE: `sms/README.md`

- **المسار الأصلي**: `sms/README.md`
- **الحجم**: `2,867` بايت | **الأسطر**: `24` | **SHA-256**: `193c6fac9bd81a7a599787fb19b8a8228a41bc33d6ed89684b3071d1657c87f8`

```markdown
# DEYN SMS reminders & Complete French Localization

The app's actual source is stored in `deyn-apk-project.zip` (and updated idempotently by `.github/scripts/integrate_sms.py`).

## Fixed SMS Architecture (Per-Part Tracking & Delivery States)

- **Per-Part `PendingIntent` + `BroadcastReceiver` (`DeynSmsPlugin$SmsStatusReceiver`)**:
  - Single-part messages use `SmsManager.sendTextMessage(...)` and multi-part messages use `SmsManager.sendMultipartTextMessage(...)` with a dedicated `sentIntent` (`com.deyn.app.SMS_SENT`) and `deliveryIntent` (`com.deyn.app.SMS_DELIVERED`) for **every individual segment**.
  - Dual-SIM devices resolve the active default SMS subscription via `SmsManager.getDefaultSmsSubscriptionId()` / `createForSubscriptionId(subId)` so multipart UDH concatenation references stay consistent across all parts.
- **Strict State Separation (Never Prematurely Marked Sent)**:
  - `attempting`: Dispatch attempt durably recorded before invoking Android API.
  - `accepted_by_android`: Android `SmsManager` accepted the API call; awaiting radio confirmation for all parts (`sent = false`).
  - `sent_to_network`: Every part (`partsSent == partsTotal && partsFailed == 0`) received `Activity.RESULT_OK` from the cellular radio (`sent = true`).
  - `delivered`: Carrier delivery receipt (`ACTION_SMS_DELIVERED` PDU status `0`) confirmed for all parts (`delivered = true`).
  - `partial_failure`: At least one part succeeded and at least one part failed (`partsSent > 0 && partsFailed > 0`). Explicitly flagged as partial failure (`sent = false`), never as full success.
  - `failed`: Zero parts reached the network (`partsSent == 0 && partsFailed > 0`). Claim is released so `WorkManager` or manual retry can re-send cleanly without duplication.
  - `dispatch_uncertain`: Stale in-flight claim after an unexpected process termination; suppressed from automatic re-sending to prevent duplicates.
- **Reboot Survival (`DeynSmsPlugin$SmsBootReceiver`)**:
  - Persists `active_queue_json` in `SharedPreferences` and listens for `BOOT_COMPLETED` and `MY_PACKAGE_REPLACED` to restore pending scheduled reminders in `WorkManager` using canonical unique work names (`deyn_sms_<id>` and `deyn_sms_deferred_<id>`).

## Complete French Localization & Centimes (`sms/i18n.js`)

- Translates all static and dynamic screens, modals, placeholders, toasts, customer statements, and printable PDF exports into professional French with zero remaining Arabic UI text when `Français` is active.
- Restores the Centimes feature in French mode (`Affichage des montants en centimes`) via `DEYN_I18N.dialectFr` and `DEYN_I18N.arDialectToFr` (`500 centimes`, `1 000 centimes`, ..., `200 000 centimes`, `1 million de centimes`, `1 million et demi de centimes`, etc.) across the Quick Calculator tiles, main display, customer cards, statistics, modals, trash, and PDF ledger.
```

================================================================================
## [23/31] FILE: `sms/engine.js`

- **المسار الأصلي**: `sms/engine.js`
- **الحجم**: `19,981` بايت | **الأسطر**: `312` | **SHA-256**: `86a911a084a39802ce2374cbef46fdbcce23905d4c656c6918ec17e08a5d5dc3`

```javascript
/* DEYN SMS core: deterministic debt allocation, per-debt due dates, multipart encoding analysis, reminders, queue planning and per-part status reconciliation. */
(function (root) {
  'use strict';
  const DAY = 86400000;
  const DEFAULTS = Object.freeze({ enabled:false, days:[1,4,8,15], times:['10:00','11:00','16:00','10:00'], start:'09:00', end:'22:00', intervalMinutes:5, tplAr:'السلام عليكم {title} {name}، عليكم {amount} دج منذ {date}. شكرا.', tplFr:'Bonjour {title} {name}, solde de {amount} DA dû depuis le {date}. Merci.', storeName:'' });
  const clone = x => JSON.parse(JSON.stringify(x));
  function stableHash(value) { let a=2166136261,b=0x9e3779b9; const s=String(value); for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b^c,2246822519);}return (a>>>0).toString(36)+(b>>>0).toString(36); }
  const validDate = n => Number.isFinite(Number(n)) && Number(n) > 0;
  const localAt = (base, hhmm) => { const [h,m] = String(hhmm||'09:00').split(':').map(Number); const d = new Date(base); d.setHours(h||0,m||0,0,0); return d.getTime(); };
  const parseTime = s => { const m=/^(\d{2}):(\d{2})$/.exec(String(s||'')); return m && +m[1]<24 && +m[2]<60 ? [+m[1],+m[2]] : null; };

  // GSM 03.38 basic 7-bit character set and 2-septet extension characters
  const GSM7_BASIC = new Set(Array.from('@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'));
  const GSM7_EXT = new Set(Array.from('|^€{}[~]\\'));

  function normalizeSmsText(raw, lang) {
    let s = String(raw ?? '')
      .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
      .replace(/[\u00A0\u202F]/g, ' ')
      .replace(/\r\n?/g, '\n');
    if (lang === 'fr') {
      s = s.replace(/[’‘]/g, "'").replace(/[“”«»]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...');
    }
    return s.split('\n').map(line => line.replace(/[ \t]{2,}/g, ' ').trim()).filter((line, idx, arr) => line.length > 0 || (idx > 0 && idx < arr.length - 1)).join('\n').trim();
  }

  function analyzeMessage(rawText) {
    const text = String(rawText ?? '');
    if (!text) {
      return { text: '', encoding: 'GSM-7', units: 0, singleLimit: 160, multiLimit: 153, partsCount: 0, parts: [] };
    }
    let isGsm7 = true;
    let gsmSeptets = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (GSM7_BASIC.has(ch)) gsmSeptets += 1;
      else if (GSM7_EXT.has(ch)) gsmSeptets += 2;
      else { isGsm7 = false; break; }
    }
    if (isGsm7) {
      const singleLimit = 160, multiLimit = 153;
      if (gsmSeptets <= singleLimit) {
        return { text, encoding: 'GSM-7', units: gsmSeptets, singleLimit, multiLimit, partsCount: 1, parts: [text] };
      }
      const parts = [];
      let cur = '', curUnits = 0;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const w = GSM7_EXT.has(ch) ? 2 : 1;
        if (curUnits + w > multiLimit && cur.length > 0) {
          parts.push(cur);
          cur = ch;
          curUnits = w;
        } else {
          cur += ch;
          curUnits += w;
        }
      }
      if (cur.length > 0) parts.push(cur);
      return { text, encoding: 'GSM-7', units: gsmSeptets, singleLimit, multiLimit, partsCount: parts.length, parts };
    }

    // UCS-2 / UTF-16 encoding (70 code units for a single SMS, 67 code units per part for multipart SMS)
    const singleLimit = 70, multiLimit = 67;
    const units = text.length;
    if (units <= singleLimit) {
      return { text, encoding: 'UCS-2', units, singleLimit, multiLimit, partsCount: 1, parts: [text] };
    }
    const parts = [];
    let idx = 0;
    while (idx < units) {
      let end = Math.min(units, idx + multiLimit);
      if (end < units) {
        const hi = text.charCodeAt(end - 1), lo = text.charCodeAt(end);
        if (hi >= 0xD800 && hi <= 0xDBFF && lo >= 0xDC00 && lo <= 0xDFFF) {
          end -= 1;
        }
      }
      if (end <= idx) end = Math.min(units, idx + multiLimit);
      parts.push(text.slice(idx, end));
      idx = end;
    }
    return { text, encoding: 'UCS-2', units, singleLimit, multiLimit, partsCount: parts.length, parts };
  }

  function config(raw) {
    const c=Object.assign({},DEFAULTS,raw||{});
    // Migrate only the exact shipped defaults from the previous release; preserve owner-edited templates.
    const OLD_DEFAULT_AR='السلام عليكم {title} {name}، نذكّركم بأن عليكم مبلغ {amount} دج مستحق منذ {date}. نرجو التسوية عند الإمكان. شكرًا لكم 😊';
    const OLD_DEFAULT_FR='Bonjour {title} {name}, nous vous rappelons que votre solde de {amount} DA est dû depuis le {date}. Merci de régulariser dès que possible 😊';
    if(c.tplAr===OLD_DEFAULT_AR)c.tplAr=DEFAULTS.tplAr;
    if(c.tplFr===OLD_DEFAULT_FR)c.tplFr=DEFAULTS.tplFr;
    const days=Array.isArray(c.days)&&c.days.length===4?c.days.map(Number):[];
    c.days=days.length===4&&days.every((x,i)=>Number.isInteger(x)&&x>=1&&x<=90&&(i===0||x>days[i-1]))?days:DEFAULTS.days.slice();
    const times=Array.isArray(c.times)&&c.times.length===4?c.times.slice():[];
    c.times=times.length===4&&times.every(x=>!!parseTime(x))?times:DEFAULTS.times.slice();
    c.start='09:00';
    if (!parseTime(c.end)||c.end<='09:00'||c.end>'22:00') c.end=DEFAULTS.end;
    c.intervalMinutes=Math.max(1,Math.min(60,Number(c.intervalMinutes)||5));
    if(typeof c.tplAr!=='string'||!c.tplAr.trim()||c.tplAr.length>500)c.tplAr=DEFAULTS.tplAr;
    if(typeof c.tplFr!=='string'||!c.tplFr.trim()||c.tplFr.length>500)c.tplFr=DEFAULTS.tplFr;
    c.storeName=String(c.storeName||'').trim().slice(0,80);
    return c;
  }
  function nextMonthlyDue(ts, day) {
    if (!day || day<1 || day>31) return null;
    const d=new Date(ts), y=d.getFullYear(), m=d.getMonth();
    let due=new Date(y,m,Math.min(day,new Date(y,m+1,0).getDate()),23,59,59,999).getTime();
    if (due < ts) { const nm=m+1; due=new Date(y,nm,Math.min(day,new Date(y,nm+1,0).getDate()),23,59,59,999).getTime(); }
    return due;
  }
  function ledger(c) {
    const debts=(c.tx||[]).filter(t=>t.type==='debt').slice().sort((a,b)=>(a.ts-b.ts)||String(a.id).localeCompare(String(b.id)));
    const left=new Map(debts.map(d=>[d.id,Number(d.amount)||0]));
    const pays=(c.tx||[]).filter(t=>t.type==='pay').slice().sort((a,b)=>(a.ts-b.ts)||String(a.id).localeCompare(String(b.id)));
    for (const p of pays) {
      let remaining=Number(p.amount)||0;
      const alloc=Array.isArray(p.allocations)?p.allocations:null;
      if (alloc) {
        for (const a of alloc) { if (!left.has(a.debtId)) continue; const use=Math.min(left.get(a.debtId),Math.max(0,Number(a.amount)||0),remaining); left.set(a.debtId,Math.max(0,left.get(a.debtId)-use)); remaining-=use; if(remaining<=0) break; }
        // If a payment exceeds the old balance, its remainder is a credit against debts added in the same operation/later.
        for (const d of debts) { if (remaining<=0) break; if (Number(d.ts)<Number(p.ts)) continue; const have=left.get(d.id)||0; const use=Math.min(have,remaining); left.set(d.id,have-use); remaining-=use; }
      } else {
        // Legacy payments remain immutable; derive FIFO coverage only in memory.
        for (const d of debts) { if (remaining<=0) break; const have=left.get(d.id)||0; const use=Math.min(have,remaining); left.set(d.id,have-use); remaining-=use; }
      }
    }
    return debts.map(d=>{
      const original=validDate(d.originalDueAt)?Number(d.originalDueAt):(validDate(d.dueAt)?Number(d.dueAt):(c.payDay?nextMonthlyDue(Number(d.ts)||Date.now(),Number(c.payDay)):null));
      return { debt:d, remaining:Math.max(0,Math.round((left.get(d.id)||0)*100)/100), dueAt:validDate(d.dueAt)?Number(d.dueAt):original, originalDueAt:original };
    }).filter(x=>x.remaining>0);
  }
  function allocatePayment(c, amount) {
    let remaining=Math.max(0,Number(amount)||0); const allocations=[];
    for(const item of ledger(c)) { if(remaining<=0) break; const n=Math.min(item.remaining,remaining); if(n>0){allocations.push({debtId:item.debt.id,amount:Math.round(n*100)/100}); remaining-=n;} }
    return allocations;
  }
  function extendDebt(c,debtId,amount,unit,now) {
    const item=ledger(c).find(x=>x.debt.id===debtId); if(!item) throw new Error('الدين المحدد غير موجود أو تمت تسويته');
    const base=item.dueAt || Number(now||Date.now());
    const n=Math.max(1,Math.min(365,Number(amount)||0));
    const delta=unit==='months'?0:unit==='weeks'?n*7:n;
    let next;
    if(unit==='months') { const d=new Date(base); const day=d.getDate(); d.setDate(1); d.setMonth(d.getMonth()+n); d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate())); next=d.getTime(); }
    else next=base+delta*DAY;
    const d=item.debt; d.originalDueAt=d.originalDueAt||item.originalDueAt||base; d.dueAt=next; d.extensionHistory=Array.isArray(d.extensionHistory)?d.extensionHistory:[];
    d.extensionHistory.push({at:Number(now||Date.now()),from:base,to:next,amount:n,unit});
    return {from:base,to:next,debtId};
  }
  const dateLabel = ts => { const d=new Date(ts); return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear(); };
  const phone = raw => { let s=String(raw||'').replace(/[^\d+]/g,''); if(s.startsWith('00'))s='+'+s.slice(2); if(/^213[567]\d{8}$/.test(s))s='+'+s; if(/^0[567]\d{8}$/.test(s))s='+213'+s.slice(1); return /^\+\d{9,15}$/.test(s)?s:null; };
  function render(tpl, vars, lang) {
    const out = String(tpl||'').replace(/\{(title|name|amount|date|store)\}/g,(_,k)=>String(vars[k]??'')).replace(/\s{2,}/g,' ').trim();
    return normalizeSmsText(out, lang);
  }
  function testMessage(date, customText) {
    if (typeof customText === 'string' && customText.trim()) return normalizeSmsText(customText.trim());
    return `DEYN: اختبار SMS ناجح - ${String(date||'')}`.trim();
  }

  function isLogBlocking(entry) {
    if (!entry) return false;
    if (typeof entry === 'object') {
      if (entry.status === 'failed') return false;
      return true;
    }
    return true;
  }

  /**
   * Reconciles a native per-part status report with an existing smsLog record.
   * Ensures a multi-part SMS is marked sent_to_network/delivered ONLY when all parts succeed,
   * and marks partial_failure when at least one part fails after another part succeeded.
   */
  function reconcileStatus(existing, report, meta) {
    const prev = (existing && typeof existing === 'object') ? Object.assign({}, existing) : {};
    const m = meta || {};
    const partsTotal = Math.max(1, Number(report && report.partsTotal) || Number(prev.partsTotal) || 1);
    let partsSent = Number.isFinite(Number(report && report.partsSent)) ? Number(report.partsSent) : (Number(prev.partsSent) || 0);
    let partsFailed = Number.isFinite(Number(report && report.partsFailed)) ? Number(report.partsFailed) : (Number(prev.partsFailed) || 0);
    let partsDelivered = Number.isFinite(Number(report && report.partsDelivered)) ? Number(report.partsDelivered) : (Number(prev.partsDelivered) || 0);

    let rawStatus = String((report && report.status) || prev.status || 'accepted_by_android');
    if (partsFailed > 0 && partsSent > 0) {
      rawStatus = 'partial_failure';
    } else if (partsFailed > 0 && partsSent === 0) {
      rawStatus = 'failed';
    } else if (partsDelivered >= partsTotal && partsFailed === 0) {
      rawStatus = 'delivered';
      partsSent = Math.max(partsSent, partsTotal);
    } else if (partsSent >= partsTotal && partsFailed === 0 && (rawStatus === 'accepted_by_android' || rawStatus === 'attempting' || rawStatus === 'sent_to_network')) {
      rawStatus = 'sent_to_network';
    } else if ((rawStatus === 'sent_to_network' || rawStatus === 'delivered') && partsSent < partsTotal && partsFailed === 0 && report && report.partsSent === undefined) {
      partsSent = partsTotal;
    }

    // Never downgrade a confirmed terminal delivery/network state back to accepted_by_android
    if (prev.status === 'delivered' && (rawStatus === 'accepted_by_android' || rawStatus === 'sent_to_network' || rawStatus === 'attempting')) {
      rawStatus = 'delivered';
    } else if (prev.status === 'sent_to_network' && (rawStatus === 'accepted_by_android' || rawStatus === 'attempting')) {
      rawStatus = 'sent_to_network';
    }

    const now = Date.now();
    const attemptAt = Number(report && report.attemptAt) || Number(prev.attemptAt) || Number(report && report.acceptedAt) || now;
    const acceptedAt = Number(report && report.acceptedAt) || Number(prev.acceptedAt) || attemptAt;
    const sentAt = Number(report && report.sentAt) || Number(prev.sentAt) || ((rawStatus === 'sent_to_network' || rawStatus === 'delivered') ? now : 0);
    const deliveredAt = Number(report && report.deliveredAt) || Number(prev.deliveredAt) || (rawStatus === 'delivered' ? now : 0);
    const at = deliveredAt || sentAt || acceptedAt || attemptAt || now;
    const sent = (rawStatus === 'sent_to_network' || rawStatus === 'delivered') && partsSent >= partsTotal && partsFailed === 0;
    const accepted = sent || rawStatus === 'accepted_by_android' || rawStatus === 'partial_failure';
    const delivered = rawStatus === 'delivered' && sent;

    const out = Object.assign({}, prev, {
      at,
      attemptAt,
      acceptedAt,
      sentAt,
      deliveredAt,
      status: rawStatus,
      sent,
      accepted,
      delivered,
      partsTotal,
      partsSent,
      partsFailed,
      partsDelivered,
      customerName: m.customerName || prev.customerName || '',
      phone: (report && report.phone) || m.phone || prev.phone || ''
    });
    if (report && report.error) out.error = String(report.error);
    return out;
  }

  function buildQueue(S, now) {
    const cfg=config(S.settings&&S.settings.sms||S.settings&&S.settings.smsConfig);
    if(!cfg.enabled || !Array.isArray(S.customers)) return [];
    const pending=[];
    for(const c of S.customers) {
      if(c.smsEnabled===false || c.smsOptOut===true || !phone(c.phone)) continue;
      const lang=c.smsLang==='fr'?'fr':'ar';
      const title=c.honorific==='madame'?(lang==='fr'?'Madame':'السيدة'):c.honorific==='monsieur'?(lang==='fr'?'Monsieur':'السيد'):'';
      const items=ledger(c);
      const events=[];
      for(const x of items) {
        if(!x.dueAt) continue;
        const dueDate=new Date(x.dueAt), nowDate=new Date(now);
        const overdueDays=Math.max(0,Math.floor((Date.UTC(nowDate.getFullYear(),nowDate.getMonth(),nowDate.getDate())-Date.UTC(dueDate.getFullYear(),dueDate.getMonth(),dueDate.getDate()))/DAY));
        let latestPast=-1;
        // Select by the actual configured local reminder timestamp, not elapsed 24-hour blocks.
        // A due date stored at 23:59 must still trigger at 14:15 the following calendar day.
        for(let i=0;i<cfg.days.length;i++) if(localAt(x.dueAt+cfg.days[i]*DAY,cfg.times[i])<=now) latestPast=i;
        for(let i=0;i<cfg.days.length;i++) {
          const reminderAt=localAt(x.dueAt+cfg.days[i]*DAY,cfg.times[i]);
          const key=`${c.id}|${x.debt.id}|${i+1}|${Math.floor(x.dueAt)}`;
          if(S.smsLog&&isLogBlocking(S.smsLog[key])) continue;
          if(reminderAt<=now && i!==latestPast) continue; // one catch-up reminder only; never flood old backlog
          events.push({key,cid:c.id,debtId:x.debt.id,step:i+1,reminderAt,remaining:x.remaining,dueAt:x.dueAt});
        }
      }
      // Group all due debts for this customer and reminder step into one SMS; no other debt is suppressed.
      const groups=new Map();
      for(const e of events){ const bucket=e.reminderAt<=now?'due-now':String(e.reminderAt); const a=groups.get(bucket)||[]; a.push(e); groups.set(bucket,a); }
      for(const [bucket,es] of groups) {
        const debtIds=[...new Set(es.map(x=>x.debtId))].sort();
        const dueSignature=es.map(x=>`${x.debtId}:${x.step}:${Math.floor(x.dueAt)}`).sort().join(',');
        const key=`${c.id}|${bucket}|${stableHash(dueSignature)}`;
        if(S.smsLog&&isLogBlocking(S.smsLog[key])) continue;
        const amount=es.reduce((a,x)=>a+x.remaining,0);
        const due=Math.min(...es.map(x=>x.dueAt));
        const tpl=lang==='fr'?cfg.tplFr:cfg.tplAr;
        const storeName=cfg.storeName||(S.profile&&S.profile.storeName)||'';
        let message=render(tpl,{title,name:c.name,amount:Math.round(amount).toLocaleString('en-US'),date:dateLabel(due),store:storeName},lang);
        if(storeName&&!tpl.includes('{store}')) message=normalizeSmsText(message+'\n'+storeName,lang);
        const analysis=analyzeMessage(message);
        pending.push({id:key,key,eventKeys:es.map(x=>x.key),events:es.map(x=>({debtId:x.debtId,step:x.step,dueAt:x.dueAt,key:x.key})),cid:c.id,debtIds,step:es[0].step,phone:phone(c.phone),message,encoding:analysis.encoding,partsCount:analysis.partsCount,parts:analysis.parts,amount,dueAt:due,reminderAt:Math.min(...es.map(x=>x.reminderAt)),overdueDays:Math.max(0,...es.map(x=>Math.max(0,Math.floor((now-x.dueAt)/DAY))))});
      }
    }
    pending.sort((a,b)=>(b.overdueDays-a.overdueDays)||(a.dueAt-b.dueAt)||a.cid.localeCompare(b.cid));
    // One ordered queue for the whole shop, with a configurable minimum gap and a strict sending window.
    const start=parseTime('09:00'), end=parseTime(cfg.end); const startMin=start[0]*60+start[1], endMin=end[0]*60+end[1];
    const effectiveGap=Math.min(cfg.intervalMinutes,Math.max(1,Math.floor((endMin-startMin)/Math.max(1,pending.length))));
    let cursor=now, out=[];
    for(const item of pending) {
      const d=new Date(cursor), mins=d.getHours()*60+d.getMinutes();
      if(mins<startMin) cursor=localAt(cursor,cfg.start);
      else if(mins>endMin) { d.setDate(d.getDate()+1); cursor=localAt(d,cfg.start); }
      if(item.reminderAt>cursor) cursor=item.reminderAt;
      const atDate=new Date(cursor), m=atDate.getHours()*60+atDate.getMinutes();
      if(m>endMin) { atDate.setDate(atDate.getDate()+1); cursor=localAt(atDate,cfg.start); }
      item.at=Math.max(cursor,item.reminderAt); item.gapMinutes=effectiveGap; if(item.at>cursor) cursor=item.at; out.push(item); cursor+=effectiveGap*60000;
    }
    return out;
  }
  function validateBeforeSend(S,item,now) {
    const cfg=config(S.settings&&S.settings.sms||S.settings&&S.settings.smsConfig);
    if(!cfg.enabled) return {ok:false,reason:'global-disabled'};
    const c=(S.customers||[]).find(x=>x.id===item.cid); if(!c) return {ok:false,reason:'customer-missing'};
    if(c.smsEnabled===false||c.smsOptOut===true) return {ok:false,reason:'customer-disabled'};
    const to=phone(c.phone); if(!to||to!==item.phone) return {ok:false,reason:'phone-changed'};
    const open=ledger(c).filter(x=>item.debtIds.includes(x.debt.id)); if(!open.length) return {ok:false,reason:'debt-settled'};
    const byId=new Map(open.map(x=>[x.debt.id,x]));
    const dueEvents=(item.events||[]).filter(ev=>{const x=byId.get(ev.debtId);return x&&x.dueAt===ev.dueAt&&now>=localAt(ev.dueAt+cfg.days[ev.step-1]*DAY,cfg.times[ev.step-1])&&!(S.smsLog&&isLogBlocking(S.smsLog[ev.key]));});
    const dueIds=new Set(dueEvents.map(x=>x.debtId));const due=open.filter(x=>dueIds.has(x.debt.id));
    if(!due.length) return {ok:false,reason:'not-due'};
    if(S.smsLog&&isLogBlocking(S.smsLog[item.key])) return {ok:false,reason:'duplicate'};
    const amount=due.reduce((a,x)=>a+x.remaining,0);
    if(Number.isFinite(Number(item.amount))&&Math.abs(amount-Number(item.amount))>0.01)return {ok:false,reason:'amount-changed'};
    return {ok:true,customer:c,items:due,amount};
  }
  root.DeynSmsCore={DEFAULTS,config,ledger,allocatePayment,extendDebt,buildQueue,validateBeforeSend,phone,nextMonthlyDue,dateLabel,testMessage,normalizeSmsText,analyzeMessage,reconcileStatus,isLogBlocking};
})(typeof window!=='undefined'?window:globalThis);
```

================================================================================
## [24/31] FILE: `sms/i18n.js`

- **المسار الأصلي**: `sms/i18n.js`
- **الحجم**: `86,748` بايت | **الأسطر**: `1,133` | **SHA-256**: `53579deeb25c770978c69e8343bbc01387d426b0cf57d82462636743f06768b3`

```javascript
const DEYN_FR_DICT = {
  "({} زبائن)": "({} clients)",
  "(⚠️ متأخر {} يوم)": "(⚠️ en retard de {} jour(s))",
  "*DEYN — كشف حساب*": "*DEYN — Relevé de compte*",
  "*الباقي عليك: {} دج*": "*Reste à payer : {} DA*",
  "+ إضافة فئة جديدة": "+ Ajouter une catégorie",
  "+ السلعة الجديدة:": "+ Nouvel article :",
  "+ زبون": "+ Client",
  "+ زبون جديد": "+ Nouveau client",
  "+ فئة جديدة": "+ Nouvelle catégorie",
  "- المبلغ المسدد:": "- Montant payé :",
  "0 دج": "0 DA",
  "0 دج (اختياري)": "0 DA (optionnel)",
  "0 زبائن": "0 client",
  "CHECK — آخر العمليات": "CHECK — Dernières opérations",
  "DEYN — تسيير الديون بكل سهولة": "DEYN — Gérez vos dettes en toute simplicité",
  "DEYN • الإصدار 1.0.0": "DEYN • Version 1.0.0",
  "DEYN: اختبار SMS ناجح - {}": "DEYN : Test SMS réussi - {}",
  "MU: المبلغ ثم × ثم نسبة الربح ثم MU": "MU : montant, puis ×, puis marge, puis MU",
  "{} • {} دج • {}": "{} • {} DA • {}",
  "{} • الاستحقاق {} • تمديد {}": "{} • Échéance {} • Prolongation {}",
  "{} • الاستحقاق {}": "{} • Échéance {}",
  "• الاستحقاق {}": "• Échéance {}",
  "• تمديد {}": "• Prolongation {}",
  "الاستحقاق": "Échéance",
  "تمديد": "Prolongation",
  "{} دج": "{} DA",
  "{} دج (دفع زائد)": "{} DA (trop-perçu)",
  "{} دج {}": "{} DA {}",
  "{} زبائن": "{} clients",
  "{} زبائن متأخرون": "{} client(s) en retard",
  "{} زبائن و {} تذاكر معلقة": "{} client(s) et {} ticket(s) en attente",
  "{} زبون": "{} client(s)",
  "{} زبون • تسديد في موعده": "{} client(s) • paiement à l'échéance",
  "{} عليه {} دج. سيُنقل حسابه إلى سلة المهملات ويمكنك استرجاعه في أي وقت.": "{} doit {} DA. Son compte sera déplacé vers la corbeille et vous pourrez le restaurer à tout moment.",
  "{} عنصر محذوف": "{} élément(s) supprimé(s)",
  "· ترحيل فوري للمبالغ إلى الزبائن": "· Transfert immédiat des montants aux clients",
  "؟": "?",
  "آخر العمليات:": "Dernières opérations :",
  "آخر خطأ:": "Dernière erreur :",
  "آخر نجاح: {} • بانتظار الإرسال: {}{}": "Dernier succès : {} • en attente d'envoi : {}{}",
  "آلة حاسبة": "Calculatrice",
  "أدخل المبلغ المسدد أو سلعة جديدة": "Saisissez le montant payé ou un nouvel article",
  "أدخل رقم هاتف صحيحًا": "Saisissez un numéro de téléphone valide",
  "أدخل كلمة المرور الحالية ثم الجديدة.": "Saisissez le mot de passe actuel puis le nouveau.",
  "أدخل كلمة المرور...": "Saisissez le mot de passe...",
  "أدخل كلمة مرور المالك لتفعيل الصلاحيات الكاملة:": "Saisissez le mot de passe du propriétaire pour activer les droits complets :",
  "أدخل مبلغ التسديد أولاً قبل تمديد الموعد": "Saisissez d'abord le montant payé avant de prolonger l'échéance",
  "أدخل مبلغًا أكبر من صفر": "Saisissez un montant supérieur à zéro",
  "أدخل مبلغًا صحيحًا": "Saisissez un montant valide",
  "أرسل معرّف هذا الجهاز إلى الدعم الفني ليصدر لك كود استرداد موقّع. الكود صالح لهذا الجهاز فقط ولمرة واحدة، ولا يغيّر ترخيصك ولا دورك ولا بياناتك.": "Envoyez l'identifiant de cet appareil au support technique pour obtenir un code de récupération signé. Le code est valable pour cet appareil uniquement et une seule fois, et ne modifie ni votre licence, ni votre rôle, ni vos données.",
  "أسابيع": "Semaines",
  "أشهر": "Mois",
  "أصوات النقر": "Sons des touches",
  "أمين سعدون": "Amine Saadoun",
  "أوراق نقدية": "Billets de banque",
  "أي زبون أو تذكرة أو بيانات تحذفها ستجدها هنا لاسترجاعها أو حذفها نهائياً.": "Tout client, ticket ou donnée que vous supprimez se trouve ici pour être restauré ou supprimé définitivement.",
  "أيام": "jours",
  "إجمالي الأموال المسددة (السيولة المحصلة)": "Total des sommes payées (trésorerie encaissée)",
  "إجمالي الديون المتأخرة:": "Total des dettes en retard :",
  "إجمالي ديون المنضبطين:": "Total des dettes des clients ponctuels :",
  "إدارة كلمة المرور": "Gérer le mot de passe",
  "إدارة وتعديل الفئات": "Gérer et modifier les catégories",
  "إدارة وحذف الفئات": "Gérer et supprimer les catégories",
  "إذا تركته فارغًا فلن تُرسل تذكيرات تلقائية لهذا الدين حتى تحدد موعدًا. الزبائن ذوو يوم السداد الشهري يحصلون على الموعد التالي تلقائيًا.": "Si laissé vide, aucun rappel automatique ne sera envoyé pour cette dette tant qu'une échéance n'est pas définie. Les clients ayant un jour de paie mensuel reçoivent automatiquement la prochaine échéance.",
  "إذا حُدد اليوم يُنبهك التطبيق عند اقتراب أو تأخر موعد السداد.": "Si un jour est défini, l'application vous alerte à l'approche ou en cas de retard de l'échéance.",
  "إذن SMS غير ممنوح": "Permission SMS non accordée",
  "إرسال رسالة تجريبية": "Envoyer un SMS de test",
  "إستعادة": "Restaurer",
  "إضافة زبون جديد": "Ajouter un nouveau client",
  "إضافة فئات جديدة": "Ajouter des catégories",
  "إضافة فئة زبائن جديدة": "Ajouter une catégorie de clients",
  "إعداد الجدولة والقوالب والسجل — الإرسال من هاتف المالك فقط": "Planification, modèles et historique — envoi depuis le téléphone du propriétaire uniquement",
  "إعدادات SMS": "Paramètres SMS",
  "إعدادات الرسائل النصية": "Paramètres des SMS",
  "إعدادات رسائل SMS": "Paramètres des SMS",
  "إظهار رمز QR لاقتران هاتف العامل": "Afficher le QR pour associer le téléphone de l'employé",
  "إغلاق": "Fermer",
  "إقران هاتف جديد": "Associer un nouveau téléphone",
  "إلغاء": "Annuler",
  "إلغاء الاقتران": "Dissocier",
  "ابحث بالاسم أو الهاتف": "Rechercher par nom ou téléphone",
  "ابحث بالاسم أو الهاتف...": "Rechercher par nom ou téléphone...",
  "ابدأ بإدخال المبلغ": "Saisissez un montant",
  "اختبار الإرسال": "Tester l'envoi",
  "اختر الفئة التي تريد نقل الزبون إليها لتمكينه من أخذ الدين مجددًا:": "Choisissez la catégorie vers laquelle transférer le client pour qu'il puisse reprendre une dette :",
  "اختياري": "optionnel",
  "ادخل كود التفعيل من عند الموزع": "Saisissez le code d'activation fourni par le distributeur",
  "استرجاع الحسابات أو البيانات المحذوفة خطأً": "Restaurer les comptes ou données supprimés par erreur",
  "استرجاع كلمة المرور": "Récupérer le mot de passe",
  "اسم الزبون": "Nom du client",
  "اسم الزبون *": "Nom du client *",
  "اسم الفئة الجديدة": "Nom de la nouvelle catégorie",
  "اسم المحل أو التاجر الذي يظهر للزبون": "Nom du magasin ou du commerçant affiché au client",
  "اسم المحل في الرسالة": "Nom du magasin dans le SMS",
  "اضغط على أي زبون للانتقال مباشرة إلى ملفه وكشف حسابه:": "Touchez un client pour ouvrir directement sa fiche et son relevé :",
  "اضغط على عملية لاستعمال نتيجتها": "Touchez une opération pour utiliser son résultat",
  "اضغط لنسخ الكود": "Touchez pour copier le code",
  "اقتران": "Associer",
  "اكتب اسم أو لقب الزبون": "Nom ou surnom du client",
  "اكتب اسم الفئة": "Saisissez le nom de la catégorie",
  "الأجهزة المصرح بها للمتجر:": "Appareils autorisés pour le magasin :",
  "الأجهزة المصرح بها ورخصة المتجر": "Appareils autorisés et licence du magasin",
  "الأيام الافتراضية: 1 و4 و8 و15، ويمكن تغييرها.": "Jours par défaut : 1, 4, 8 et 15 (modifiables).",
  "الأيقونة أو الرمز": "Icône ou symbole",
  "الإحصائيات": "Statistiques",
  "الإحصائيات وخزينة الديون": "Statistiques et trésorerie des dettes",
  "الإرسال متاح داخل تطبيق أندرويد فقط": "L'envoi est disponible uniquement dans l'application Android",
  "الإعدادات": "Paramètres",
  "الافتراضي 09:00–22:00. تُرتّب الرسائل حسب أقدم دين متأخر وتُرسل بالتتابع لتجنب الإرسال الجماعي.": "Par défaut 09:00–22:00. Les SMS sont triés par dette en retard la plus ancienne et envoyés séquentiellement.",
  "الاقتران يتم من هاتف العامل فقط": "L'association se fait uniquement depuis le téléphone de l'employé",
  "الباقي": "Reste",
  "التاريخ: {}": "Date : {}",
  "التخزين الآمن غير متاح": "Stockage sécurisé indisponible",
  "التذاكر المعلقة (دين غير مرحل)": "Tickets en attente (dette non transférée)",
  "التصنيف": "Catégorie",
  "التنبيهات": "Alertes",
  "التنبيهات والإشعارات الذكية": "Alertes et notifications intelligentes",
  "التنبيهات والمواعيد": "Alertes et échéances",
  "التنقل": "Navigation",
  "الحذف التام": "Suppression définitive",
  "الحساب بالسنتيم بالعامية": "Affichage des montants en centimes",
  "الحمد لله، لا يوجد أي زبون متأخر عن موعد السداد ✅": "Aucun client en retard sur son échéance, Dieu merci ✅",
  "الدين الحالي": "Dette actuelle",
  "الدين القديم:": "Ancienne dette :",
  "الدين المحدد غير موجود أو تمت تسويته": "La dette sélectionnée est introuvable ou déjà soldée",
  "الدين المراد تمديده": "Dette à prolonger",
  "الديون المضمونة": "Dettes garanties",
  "الراتب بعد": "Paie dans",
  "الرمز صالح 5 دقائق ولاستخدام واحد": "Code valable 5 minutes et à usage unique",
  "الزبائن المتأخرون عن موعد السداد": "Clients en retard sur leur échéance",
  "الزبائن المديونون": "Clients débiteurs",
  "الزبائن المنضبطون في وقتهم": "Clients qui paient à temps",
  "الزبون «{}» في القائمة السوداء حالياً. هل تريد رفع الحظر عنه وترحيل تذكرة #{} ({} دج) لحسابه؟": "Le client « {} » est actuellement sur liste noire. Lever le blocage et transférer le ticket #{} ({} DA) à son compte ?",
  "الزبون: {}": "Client : {}",
  "الساعة {}": "Heure {}",
  "السقف": "Plafond",
  "السقف المسموح: {} دج": "Plafond autorisé : {} DA",
  "السلام عليكم، أريد تفعيل رخصة تطبيق DEYN لمعرف جهازي.": "Bonjour, je souhaite activer la licence de l'application DEYN pour l'identifiant de mon appareil.",
  "السماح بإرسال تذكيرات SMS لهذا الزبون": "Autoriser l'envoi de rappels SMS à ce client",
  "السماح له بأخذ دين جديد ونقله للزبائن النشطين": "L'autoriser à reprendre une dette et le transférer aux clients actifs",
  "السيد": "Monsieur",
  "السيد / Monsieur": "Monsieur",
  "السيدة": "Madame",
  "السيدة / Madame": "Madame",
  "الصفحة 1 من 1": "Page 1 sur 1",
  "الصق الكود يدوياً بالضغط المطوّل داخل الخانة": "Collez le code manuellement par appui long dans le champ",
  "العامل هو من يبدأ الاتصال": "C'est l'employé qui lance la connexion",
  "العربية": "Arabe",
  "العربية • Français": "Français • Arabe",
  "العناصر المحفوظة مؤقتاً:": "Éléments conservés temporairement :",
  "الفاصل بين الرسائل (بالدقائق)": "Intervalle entre les SMS (en minutes)",
  "القائمة السوداء": "Liste noire",
  "القالب العربي": "Modèle arabe",
  "القالب الفرنسي": "Modèle français",
  "القالب طويل جدًا — الحد الأقصى 500 حرف لكل لغة": "Le modèle est trop long — maximum 500 caractères par langue",
  "الكل": "Tous",
  "اللغة / Langue": "Langue",
  "اللقب": "Civilité",
  "المبلغ (دج)": "Montant (DA)",
  "المبلغ المديون به (من الكراس القديم إن وجد)": "Montant dû (de l'ancien carnet, le cas échéant)",
  "المبلغ المسجّل": "Montant enregistré",
  "المبلغ المسدد (دج)": "Montant payé (DA)",
  "المبلغ المسدد أكبر من مجموع الدين الحالي والسلعة الجديدة": "Le montant payé dépasse le total de la dette actuelle et du nouvel article",
  "المبلغ المسدد أكبر من مجموع الدين والسلعة": "Le montant payé dépasse le total de la dette et de l'article",
  "المتأخرون ({})": "En retard ({})",
  "المتغيرات: {title} اللقب، {name} الاسم، {amount} المبلغ، {date} تاريخ الاستحقاق، {store} اسم المحل إن كان موجودًا في ملف المتجر. الإعداد الحالي لا يحتوي على اسم متجر، لذلك لن يُضاف اسم غير موجود. الرسائل الطويلة قد تُحسب عدة وحدات SMS حسب شركة الاتصالات.": "Variables : {title} civilité, {name} nom, {amount} montant, {date} date d'échéance, {store} nom du magasin. Les messages longs peuvent compter pour plusieurs unités SMS selon l'opérateur.",
  "المدة": "Durée",
  "المزامنة بين الهاتفين": "Synchronisation entre les deux téléphones",
  "المزامنة تتم تلقائيًا عند اتصال هاتف العامل": "La synchronisation se fait automatiquement lorsque le téléphone de l'employé se connecte",
  "المزامنة غير متاحة على هذا الجهاز": "La synchronisation n'est pas disponible sur cet appareil",
  "المزامنة غير متاحة في هذا الإصدار/الجهاز.": "La synchronisation n'est pas disponible dans cette version/sur cet appareil.",
  "المنضبطون ({})": "Ponctuels ({})",
  "النوع:": "Type :",
  "الهاتف": "Téléphone",
  "الوحدة": "Unité",
  "الوسم: {}": "Étiquette : {}",
  "اليوم {}": "Jour {}",
  "اليوم موعد السداد المحدد ({} في الشهر)": "Aujourd'hui est le jour de paiement prévu (le {} du mois)",
  "انتهت صلاحية الرمز": "Le code a expiré",
  "انتهت صلاحية كود الاسترداد": "Le code de récupération a expiré",
  "انتهت مدة الترخيص — أدخل كود تفعيل جديد": "La licence a expiré — saisissez un nouveau code d'activation",
  "انقر لتعديل الملاحظة": "Touchez pour modifier la note",
  "بداية الإرسال (ثابتة)": "Début d'envoi (fixe)",
  "بداية الإرسال ثابتة 09:00": "Début d'envoi fixe à 09:00",
  "بدون رقم": "Sans numéro",
  "بدون سقف أقصى": "Sans plafond maximal",
  "بدون لقب": "Sans titre",
  "بدون وسم": "Sans étiquette",
  "بطالة / عمال يوميون": "Sans emploi / journaliers",
  "بيانات هذا الهاتف تجريبية": "Les données de ce téléphone sont des données de démonstration",
  "تأكيد": "Confirmer",
  "تأكيد الدين": "Confirmer la dette",
  "تأكيد العملية": "Confirmer l'opération",
  "تأكيد رغم تجاوز السقف": "Confirmer malgré le dépassement du plafond",
  "تأكيد كلمة المرور *": "Confirmer le mot de passe *",
  "تأكيد كلمة المرور غير مطابق": "La confirmation du mot de passe ne correspond pas",
  "تاريخ النسخة:": "Date de la copie :",
  "تتم عبر شبكة Wi-Fi المحلية فقط ومشفّرة من طرف إلى طرف، دون خادم سحابي. يعمل التطبيق دون إنترنت دائمًا، وتُرسل التغييرات عند توفر الاتصال.": "Elle se fait uniquement via le Wi-Fi local, chiffrée de bout en bout, sans serveur cloud. L'application fonctionne toujours sans internet et les modifications sont envoyées dès que la connexion est disponible.",
  "تحذير: ديون حرجة تحتاج تدخلاً": "Attention : dettes critiques nécessitant une intervention",
  "تحقق من الأيام والساعات والفاصل الزمني": "Vérifiez les jours, les heures et l'intervalle",
  "تحقق من مدة التمديد": "Vérifiez la durée de prolongation",
  "تحقق وتعيين كلمة مرور جديدة": "Vérifier et définir un nouveau mot de passe",
  "تذكرة": "Ticket",
  "تذكرة #{}": "Ticket #{}",
  "تذكرة #{} —": "Ticket #{} —",
  "تذكرة معلقة #{} ({} دج)": "Ticket en attente #{} ({} DA)",
  "تذكيرات SMS للزبائن": "Rappels SMS aux clients",
  "تراجع": "Annuler",
  "ترتيب جميع المديونين تنازلياً": "Classement de tous les débiteurs par ordre décroissant",
  "ترحيل للزبون": "Transférer au client",
  "ترسل الرسائل من شريحة هاتف المالك فقط. يجب توفر رصيد SMS وشبكة الهاتف. قبول أندرويد للرسالة لا يعني تأكيد وصولها إلى هاتف الزبون.": "Les SMS sont envoyés uniquement depuis la carte SIM du propriétaire. Un crédit SMS et le réseau mobile sont requis. L'acceptation par Android ne garantit pas la réception par le client.",
  "تسجيل دين جديد": "Enregistrer une nouvelle dette",
  "تسجيل ديون وتسديد فقط • الحذف مقفل 🔒": "Enregistrement de dettes et paiements uniquement • suppression verrouillée 🔒",
  "تسديد": "Paiement",
  "تسديد دفعة مع سلعة جديدة": "Paiement avec un nouvel article",
  "تسديد دين": "Payer une dette",
  "تسيير الديون بكل سهولة": "Gérez vos dettes en toute simplicité",
  "تصفير شامل": "Remise à zéro totale",
  "تصنيف الزبون *": "Catégorie du client *",
  "تطبيق DEYN مقفل": "Application DEYN verrouillée",
  "تطبيق DEYN — تسيير الديون بكل سهولة وبدون إنترنت": "Application DEYN — gérez vos dettes simplement et sans internet",
  "تطبيق آمن ويشتغل بدون انترنت": "Application sécurisée qui fonctionne sans internet",
  "تعديل إعدادات الرسائل": "Modifier les paramètres SMS",
  "تعديل البيانات": "Modifier les données",
  "تعديل بيانات الزبائن": "Modifier les données des clients",
  "تعديل بيانات الزبون": "Modifier les données du client",
  "تعديل ملاحظة التذكرة": "Modifier la note du ticket",
  "تعذر إرسال الاختبار:": "Échec de l'envoi du test :",
  "تعذر إرسال الاختبار: {}": "Échec de l'envoi du test : {}",
  "تعذّر إتمام التفعيل الآمن": "Impossible de terminer l'activation sécurisée",
  "تعذّر إنشاء ملف الإنقاذ. لا تمسح بيانات التطبيق.": "Impossible de créer le fichier de secours. N'effacez pas les données de l'application.",
  "تعذّر الاقتران — تأكد من الشبكة ومن أن الرمز لم ينتهِ": "Association impossible — vérifiez le réseau et que le code n'a pas expiré",
  "تعذّر التحقق من حفظ بيانات الترخيص": "Impossible de vérifier l'enregistrement de la licence",
  "تعذّر النسخ": "Copie impossible",
  "تعذّر النسخ — اضغط مطولاً على المعرّف": "Copie impossible — appuyez longuement sur l'identifiant",
  "تعذّر النسخ — اضغط مطولاً على المعرّف لنسخه": "Copie impossible — appuyez longuement sur l'identifiant pour le copier",
  "تعذّر تحميل النسخة": "Impossible de charger la copie",
  "تعذّر تشغيل الحماية الآمنة:": "Impossible de démarrer la protection sécurisée :",
  "تعذّر تشغيل الحماية الآمنة: {}": "Impossible de démarrer la protection sécurisée : {}",
  "تعذّر حفظ آخر تغيير. أوقفنا الاستخدام حتى لا تواصل إدخال بيانات قد لا تُحفظ.": "Impossible d'enregistrer la dernière modification. Nous avons arrêté l'utilisation pour éviter de saisir des données qui pourraient ne pas être sauvegardées.",
  "تعذّر حفظ سجل الاسترداد — لم يُستعمل الكود": "Impossible d'enregistrer le registre de récupération — le code n'a pas été utilisé",
  "تعذّر حفظ كلمة المرور بأمان": "Impossible d'enregistrer le mot de passe en toute sécurité",
  "تعذّر قراءة بيانات DEYN بشكل سليم. لم نستبدلها بالبيانات التجريبية ولم نحذفها.": "Impossible de lire correctement les données DEYN. Nous ne les avons ni remplacées par des données de démonstration ni supprimées.",
  "تعذّر مسح الرمز:": "Échec du scan :",
  "تعذّر مسح الرمز: {}": "Échec du scan : {}",
  "تعذّرت المزامنة": "Échec de la synchronisation",
  "تعذّرت المزامنة:": "Échec de la synchronisation :",
  "تعذّرت المزامنة: {}": "Échec de la synchronisation : {}",
  "تعذّرت المزامنة: {} — ستُعاد المحاولة تلقائيًا": "Échec de la synchronisation : {} — nouvelle tentative automatique",
  "تعذّرت قراءة سجل الاسترداد بأمان": "Impossible de lire le registre de récupération en toute sécurité",
  "تعذّرت قراءة سجل التفعيل بأمان": "Impossible de lire le registre d'activation en toute sécurité",
  "تعيين كلمة المرور أو تغييرها (الاسترجاع بكود موقّع من الدعم)": "Définir ou changer le mot de passe (récupération par code signé du support)",
  "تعيين كلمة مرور المالك": "Définir le mot de passe du propriétaire",
  "تغيير كلمة المرور": "Changer le mot de passe",
  "تفاصيل السلعة أو الملاحظة": "Détails de l'article ou note",
  "تفريغ السلة نهائياً": "Vider la corbeille définitivement",
  "تفريغ سلة المهملات": "Vider la corbeille",
  "تفريغ نهائي": "Vider définitivement",
  "تفعيل": "Activer",
  "تفعيل DEYN": "Activer DEYN",
  "تفعيل الرسائل النصية": "Activer les rappels SMS",
  "تفعيل وضع المالك": "Activer le mode propriétaire",
  "تلقائي (عربي)": "Automatique (Arabe)",
  "تم إرسال رسالة الاختبار إلى الشبكة بنجاح": "SMS de test envoyé au réseau mobile avec succès",
  "تم إرسال رسالة الاختبار وتأكيد تسليمها إلى الهاتف": "SMS de test envoyé et livraison confirmée sur le téléphone",
  "تم إيقاف SMS لأن إذن الرسائل غير متاح": "SMS désactivés car la permission d'envoi n'est pas accordée",
  "تم إيقاف التفعيل بسبب تغيير غير طبيعي في ساعة الجهاز": "Activation suspendue à cause d'un changement anormal de l'horloge de l'appareil",
  "تم إيقاف جميع رسائل SMS مؤقتًا": "Tous les rappels SMS ont été temporairement désactivés",
  "تم استخدام الرمز ✅": "Code utilisé ✅",
  "تم استرجاع آخر نسخة سليمة من بياناتك بعد اكتشاف تلف في النسخة الأحدث ⚠️": "La dernière copie saine de vos données a été restaurée après détection d'un dommage dans la plus récente ⚠️",
  "تم الاقتران والمزامنة بنجاح ✅": "Association et synchronisation réussies ✅",
  "تم التحقق من كود الاسترداد ✅ عيّن كلمة مرور جديدة": "Code de récupération vérifié ✅ Définissez un nouveau mot de passe",
  "تم الترحيل إلى {} — تجاوز السقف": "Transféré à {} — plafond dépassé",
  "تم التسديد ورُفع الحظر عن {} وأصبح بإمكانه أخذ الدين بنجاح ✅": "Paiement effectué et blocage levé pour {} : il peut de nouveau prendre une dette ✅",
  "تم الحذف التام نهائياً": "Suppression définitive effectuée",
  "تم الحفظ — تذكرة #{} ({} دج)": "Enregistré — ticket #{} ({} DA)",
  "تم ترحيل {} دج إلى {}": "{} DA transférés à {}",
  "تم تسديد {} دج وإضافة سلعة بـ {} دج — الباقي {} دج": "{} DA payés et article de {} DA ajouté — reste {} DA",
  "تم تسديد {} دج — الباقي {} دج": "{} DA payés — reste {} DA",
  "تم تعيين كلمة المرور الجديدة بنجاح 🔒": "Nouveau mot de passe défini avec succès 🔒",
  "تم تفريغ سلة المهملات نهائياً": "Corbeille vidée définitivement",
  "تم تفعيل SMS للزبائن الذين لديهم أرقام هاتف": "SMS activés pour les clients disposant d'un numéro de téléphone",
  "تم تفعيل وضع العامل (تسجيل وتسديد فقط • الحذف مقفل 🔒)": "Mode employé activé (enregistrement et paiement uniquement • suppression verrouillée 🔒)",
  "تم تفعيل وضع المالك بنجاح (صلاحيات كاملة) 👑": "Mode propriétaire activé (droits complets) 👑",
  "تم حذف البيانات ونقلها لسلة المهملات (يمكنك استرجاعها) ✅": "Données supprimées et déplacées vers la corbeille (vous pouvez les restaurer) ✅",
  "تم حذف فئة «{}» بنجاح": "Catégorie « {} » supprimée avec succès",
  "تم حفظ إعدادات SMS بنجاح": "Paramètres SMS enregistrés avec succès",
  "تم حفظ التعديلات": "Modifications enregistrées",
  "تم حفظ ملاحظة التذكرة": "Note du ticket enregistrée",
  "تم رصد إرجاع وقت الهاتف. يرجى ضبط الساعة الحقيقية لمتابعة العمل.": "Un retour en arrière de l'horloge du téléphone a été détecté. Réglez l'heure réelle pour continuer.",
  "تم رفع الحظر عن {} وترحيل {} دج لحسابه بنجاح ✅": "Blocage levé pour {} et {} DA transférés à son compte ✅",
  "تم رفع الحظر عن {} ونقله إلى «{}» بنجاح ✅": "Blocage levé pour {} et client transféré vers « {} » ✅",
  "تم مسح البيانات": "Données effacées",
  "تم مسح الذاكرة": "Mémoire effacée",
  "تم نسخ {} بنجاح 📋": "{} copié avec succès 📋",
  "تم نسخ كشف الحساب": "Relevé de compte copié",
  "تم نسخ معرّف الجهاز بنجاح": "Identifiant de l'appareil copié avec succès",
  "تم نسخ معرّف الجهاز 📋": "Identifiant de l'appareil copié 📋",
  "تم نقل التذكرة إلى سلة المهملات": "Ticket déplacé vers la corbeille",
  "تم نقل الزبون إلى سلة المهملات (يمكنك استرجاعه)": "Client déplacé vers la corbeille (vous pouvez le restaurer)",
  "تمت إستعادة التذكرة بنجاح ✅": "Ticket restauré avec succès ✅",
  "تمت إستعادة الزبون «{}» بنجاح ✅": "Client « {} » restauré avec succès ✅",
  "تمت إستعادة جميع البيانات بنجاح ✅": "Toutes les données ont été restaurées ✅",
  "تمت إضافة {} بنجاح": "{} ajouté avec succès",
  "تمت إضافة {} دج على {}": "{} DA ajoutés à {}",
  "تمت إضافة {} مع رصيد سابق {} دج": "{} ajouté avec un solde antérieur de {} DA",
  "تمت إضافة سلعة بـ {} دج — الدين الحالي {} دج": "Article de {} DA ajouté — dette actuelle {} DA",
  "تمت إضافة فئة «{}»": "Catégorie « {} » ajoutée",
  "تمت الإضافة — الزبون تجاوز السقف": "Ajouté — le client a dépassé le plafond",
  "تمت المزامنة بنجاح ✅": "Synchronisation réussie ✅",
  "تمت المزامنة ✅": "Synchronisation terminée ✅",
  "تمت المزامنة ✅ (أُرسل": "Synchronisation terminée ✅ (envoyés",
  "تمت المزامنة ✅ (أُرسل {} • استُلم {})": "Synchronisation terminée ✅ (envoyés {} • reçus {})",
  "تمديد موعد دين بعد هذه الدفعة (اختياري)": "Prolonger l'échéance d'une dette après ce paiement (optionnel)",
  "تموين": "Courses",
  "تموين الشهر": "Courses du mois",
  "تموين كبير": "Grosses courses",
  "تنبيه تلقائي بمواعيد السداد وتجاوز السقف": "Alerte automatique sur les échéances et les dépassements de plafond",
  "تنبيه نشط": "Alerte active",
  "تنبيه: تشفير البيانات غير متاح على هذا الجهاز، تعمل بياناتك دون تشفير ⚠️": "Attention : le chiffrement des données n'est pas disponible sur cet appareil, vos données ne sont pas chiffrées ⚠️",
  "توجد {} زبائن مسجلين في فئة «{}». سيتم نقلهم تلقائياً إلى الفئة المتبقية.": "{} client(s) sont enregistrés dans la catégorie « {} ». Ils seront transférés automatiquement vers la catégorie restante.",
  "توزيع الديون على فئات المتجر": "Répartition des dettes par catégorie du magasin",
  "توزيع الفئات ({})": "Répartition par catégorie ({})",
  "توقّف مؤقت لحماية بياناتك": "Arrêt temporaire pour protéger vos données",
  "ثانية": "seconde",
  "جاري": "Compte courant",
  "جارٍ الاقتران…": "Association en cours…",
  "جدول التذكير بعد الاستحقاق": "Calendrier des rappels après l'échéance",
  "جرّب اسمًا آخر أو أضف زبونًا جديدًا.": "Essayez un autre nom ou ajoutez un nouveau client.",
  "جميع الزبائن ملتزمون بمواعيد السداد وسقوف الديون المحددة.": "Tous les clients respectent les échéances et les plafonds de dette fixés.",
  "جهازان فقط 🔒": "2 appareils maximum 🔒",
  "حالة الإرسال غير مؤكدة — لم نعد المحاولة لتجنب التكرار": "État d'envoi incertain — non renvoyé pour éviter les doublons",
  "حذف": "Supprimer",
  "حذف البيانات": "Supprimer les données",
  "حذف التذاكر": "Supprimer les tickets",
  "حذف التذكرة": "Supprimer le ticket",
  "حذف الزبائن": "Supprimer les clients",
  "حذف الزبون": "Supprimer le client",
  "حذف الفئات": "Supprimer les catégories",
  "حذف الفئة": "Supprimer la catégorie",
  "حذف تام": "Suppression définitive",
  "حذف تام نهائياً": "Suppression définitive",
  "حذف فئة «{}»": "Supprimer la catégorie « {} »",
  "حذف وتصفير البيانات": "Supprimer et remettre à zéro les données",
  "حساب بدون ديون": "Compte sans dettes",
  "حساب سريع": "Calcul rapide",
  "حساب محظور (القائمة السوداء)": "Compte bloqué (liste noire)",
  "حساب محظور — لا يمكن إضافة دين جديد": "Compte bloqué — impossible d'ajouter une nouvelle dette",
  "حفظ": "Enregistrer",
  "حفظ الإعدادات": "Enregistrer les paramètres",
  "حفظ التعديلات": "Enregistrer les modifications",
  "حفظ الزبون": "Enregistrer le client",
  "حفظ الفئات": "Enregistrer les catégories",
  "حفظ الفئة": "Enregistrer la catégorie",
  "حفظ الملاحظة": "Enregistrer la note",
  "حفظ كلمة المرور": "Enregistrer le mot de passe",
  "حفظ ملف JSON": "Enregistrer en JSON",
  "حفظ ملف PDF": "Enregistrer en PDF",
  "حفظ نسخة إنقاذ من البيانات الموجودة": "Enregistrer une copie de secours des données existantes",
  "حليب وخبز": "Lait et pain",
  "حمزة بلقاسم": "Hamza Belkacem",
  "خبز وحليب": "Pain et lait",
  "خديجة لعروسي": "Khadidja Laroussi",
  "خزينة الديون الكلية في السوق": "Trésorerie totale des dettes sur le marché",
  "خضر وفواكه": "Fruits et légumes",
  "خطأ غير معروف": "Erreur inconnue",
  "دج": "DA",
  "دج{}": "DA{}",
  "دعم فني وتفعيل": "Assistance et activation",
  "دفتر الزبائن": "Carnet des clients",
  "دفتر حسابات مفرغ بالكامل": "Carnet de comptes entièrement vidé",
  "دقيقة": "minute",
  "دين": "Dette",
  "دين سابق من الكراس القديم": "Dette antérieure de l'ancien carnet",
  "دين سريع": "Dette rapide",
  "دين متبقي: {} دج ({})": "Dette restante : {} DA ({})",
  "دين معلق": "Dette en attente",
  "ديون متأخرة عن موعدها": "Dettes en retard sur leur échéance",
  "ديون مضمونة": "Dettes garanties",
  "ديون معلقة": "Dettes en attente",
  "ربط هاتف المالك بهاتف العامل عبر Wi-Fi المحلي دون إنترنت": "Reliez le téléphone du propriétaire à celui de l'employé via le Wi-Fi local, sans internet",
  "رسالة الاختبار تجاوزت حد الرسالة الواحدة": "Le SMS de test dépasse la limite d'un segment",
  "رسالة الاختبار سبق إرسالها": "Ce SMS de test a déjà été envoyé",
  "رسالة تجريبية": "SMS de test",
  "رشيد قرين": "Rachid Guerine",
  "رفع الحظر عن الزبون": "Lever le blocage du client",
  "رفع الحظر عن الزبون بعد التسديد": "Lever le blocage du client après paiement",
  "رفع الحظر والترحيل": "Lever le blocage et transférer",
  "رفع الحظر وترحيل التذكرة": "Lever le blocage et transférer le ticket",
  "رفع الحظر وتغيير الفئات": "Lever le blocage et changer de catégorie",
  "رقم الهاتف (اختياري)": "Numéro de téléphone (optionnel)",
  "رقم الهاتف الذي تريد إرسال الاختبار إليه": "Numéro de téléphone pour l'envoi du test",
  "رمز الاقتران (امسح QR من هاتف المالك أو الصقه هنا)": "Code d'association (scannez le QR du propriétaire ou collez-le ici)",
  "رمز الاقتران غير صالح": "Code d'association invalide",
  "زبائن هذه الفئة يسددون في موعدهم تلقائياً": "Les clients de cette catégorie paient automatiquement à l'échéance",
  "زبون": "client",
  "زيادة دين": "Augmenter la dette",
  "زيت وسميد": "Huile et semoule",
  "ساعة": "heures",
  "ساعة. صحّح ساعة الجهاز أو اتصل بالإنترنت.": "heure(s). Corrigez l'horloge de l'appareil ou connectez-vous à internet.",
  "سجائر ومشروبات": "Cigarettes et boissons",
  "سجل التفعيل غير صالح": "Le registre d'activation est invalide",
  "سجل الرسائل": "Historique des SMS",
  "سجل العمليات": "Historique des opérations",
  "سجل رسائل SMS": "Historique des SMS",
  "سجّل مبلغًا من «دين سريع» ثم اضغط حفظ، وسيظهر هنا حتى ترحّله إلى زبون.": "Saisissez un montant dans « Dette rapide » puis touchez Enregistrer ; il restera ici jusqu'à son transfert à un client.",
  "سدّد كامل": "Tout payer",
  "سفيان مرابط": "Sofiane Merabet",
  "سقف الدين الأقصى (اختياري)": "Plafond de dette maximal (optionnel)",
  "سقف الدين التلقائي لهذه الفئة (دج)": "Plafond de dette automatique de cette catégorie (DA)",
  "سقف تلقائي: {} دج": "Plafond automatique : {} DA",
  "سلة المهملات": "Corbeille",
  "سلة المهملات فارغة": "La corbeille est vide",
  "سلعة جديدة: {}": "Nouvel article : {}",
  "سلعة مأخوذة مع التسديد": "Article pris avec le paiement",
  "سيتم استبدال البيانات التجريبية ببيانات هاتف المالك. هل تريد المتابعة؟": "Les données de démonstration seront remplacées par celles du téléphone du propriétaire. Continuer ?",
  "سيتم حذف جميع العناصر الموجودة في سلة المهملات نهائياً وبلا رجعة. هل أنت متأكد؟": "Tous les éléments de la corbeille seront supprimés définitivement et sans retour. Êtes-vous sûr ?",
  "سيتم حذف كل الزبائن والتذاكر والسجلات. لا يمكن التراجع.": "Tous les clients, tickets et enregistrements seront supprimés. Action irréversible.",
  "سيتم مسح هذا العنصر نهائياً ولن يمكنك استرجاعه أبداً. هل تريد المتابعة؟": "Cet élément sera effacé définitivement et ne pourra jamais être restauré. Continuer ?",
  "سيتم نقل تذكرة #{} ({} دج) إلى سلة المهملات.": "Le ticket #{} ({} DA) sera déplacé vers la corbeille.",
  "سير ديونك بطريقة سهلة وذكية": "Gérez vos dettes de façon simple et intelligente",
  "سيولة آمنة ومستقرة جداً": "Trésorerie sûre et très stable",
  "سيولة مقبولة • يلزم متابعة المتأخرين": "Trésorerie correcte • suivre les retardataires",
  "سيُنقل حساب {} إلى سلة المهملات.": "Le compte de {} sera déplacé vers la corbeille.",
  "شكرًا على ثقتكم 🤝": "Merci de votre confiance 🤝",
  "شهارة": "Salariés (paie mensuelle)",
  "صافي الدين المتبقي الجديد:": "Nouvelle dette nette restante :",
  "صلاحيات كاملة • صالح لغاية: {}": "Droits complets • valable jusqu'au : {}",
  "طلب كلمة المرور عند فتح التطبيق لحماية الخصوصية": "Demander le mot de passe à l'ouverture pour protéger la confidentialité",
  "ع": "AR",
  "عبد الحق شريف": "Abdelhak Chérif",
  "عدد الزبائن المديونين": "Nombre de clients débiteurs",
  "عذراً، {} خاصة بصاحب المحل فقط 🔒": "Désolé, « {} » est réservé au propriétaire 🔒",
  "عذراً، تعديل بيانات الزبائن متاح لصاحب المحل فقط 🔒": "Désolé, la modification des clients est réservée au propriétaire 🔒",
  "عذراً، قفل التطبيق خاص بصاحب المحل فقط 🔒": "Désolé, le verrouillage de l'application est réservé au propriétaire 🔒",
  "عرض / تعديل القالب العربي": "Afficher / modifier le modèle arabe",
  "على هاتفك أو طباعتها مباشرة على الورق.": "sur votre téléphone ou l'imprimer directement sur papier.",
  "عمي مراد": "Ammi Mourad",
  "عند التفعيل، يتم تمكين كل الزبائن الذين لديهم رقم هاتف. يمكنك تعطيل أي زبون بشكل فردي.": "À l'activation, tous les clients ayant un numéro de téléphone sont activés. Vous pouvez désactiver chaque client individuellement.",
  "عنوان المالك غير معروف: أعد الاقتران بمسح رمز QR": "Adresse du propriétaire inconnue : réassociez en scannant le QR",
  "عيّن كلمة مرور المالك أولاً ثم فعّل القفل": "Définissez d'abord le mot de passe du propriétaire puis activez le verrouillage",
  "غير محدد": "Non défini",
  "فارغة": "vide",
  "فتح التطبيق 🔓": "Ouvrir l'application 🔓",
  "فترة الإرسال والتوزيع": "Plage horaire et cadence d'envoi",
  "فشل إرسال رسالة الاختبار إلى الشبكة": "Échec de l'envoi du SMS de test au réseau",
  "فشل جزئي في إرسال الاختبار ({}/{})": "Échec partiel de l'envoi du test ({}/{})",
  "قبل": "il y a",
  "قبل {} دقيقة": "il y a {} minute(s)",
  "قبل {} ساعة": "il y a {} heure(s)",
  "قبل {} يوم": "il y a {} jour(s)",
  "قبل أندرويد إرسال اختبار قصير (رسالة واحدة)": "Android a accepté l'envoi du SMS de test",
  "قبل أندرويد الإرسال": "Envoi accepté par Android",
  "قبل لحظات": "il y a un instant",
  "قَبِل أندرويد طلب الإرسال وبانتظار تأكيد الشبكة": "Demande acceptée par Android, en attente de confirmation réseau",
  "قطع نقدية": "Pièces de monnaie",
  "قفل التطبيق بكلمة المرور": "Verrouiller l'application par mot de passe",
  "قوالب الرسائل القابلة للتعديل": "Modèles de SMS personnalisables",
  "كامل الدين": "Toute la dette",
  "كبار الديون ({})": "Plus grosses dettes ({})",
  "كراس حسابات ورقي مقروء (PDF)": "Carnet de comptes papier lisible (PDF)",
  "كراس ديون المتجر — DEYN": "Carnet de dettes du magasin — DEYN",
  "كراس ديون المتجر — DEYN — {}": "Carnet de dettes du magasin — DEYN — {}",
  "كل من يحمل ديناً في المحل مرتبين من أعلى قيمة إلى الأقل:": "Tous ceux qui ont une dette au magasin, classés du montant le plus élevé au plus faible :",
  "كلمة المرور الجديدة * ({} أحرف أو أرقام على الأقل)": "Nouveau mot de passe * (au moins {} caractères)",
  "كلمة المرور الجديدة يجب أن تتكون من {} أحرف أو أرقام على الأقل": "Le nouveau mot de passe doit comporter au moins {} caractères",
  "كلمة المرور الحالية *": "Mot de passe actuel *",
  "كلمة المرور الرئيسية": "Mot de passe principal",
  "كلمة المرور تحمي وضع المالك وقفل التطبيق. لا توجد كلمة مرور افتراضية ولا يمكن لأحد تجاوزها.": "Le mot de passe protège le mode propriétaire et le verrouillage de l'application. Il n'existe aucun mot de passe par défaut et personne ne peut le contourner.",
  "كلمة المرور غير صحيحة ❌": "Mot de passe incorrect ❌",
  "كمال بوعزيز": "Kamel Bouaziz",
  "كود الاسترداد *": "Code de récupération *",
  "كود الاسترداد غير صالح": "Code de récupération invalide",
  "كود التفعيل": "Code d'activation",
  "كود التفعيل غير صالح لهذا الجهاز أو انتهت صلاحيته": "Code d'activation invalide pour cet appareil ou expiré",
  "كود الهاتف الرئيسي (صاحب المحل):": "Code du téléphone principal (propriétaire) :",
  "كود هاتف العامل": "Code du téléphone employé",
  "كود هاتف العامل:": "Code du téléphone employé :",
  "كود هاتف صاحب المحل (الرئيسي)": "Code du téléphone du propriétaire (principal)",
  "لأي استفسار، مساعدة أو تفعيل رخصة المتجر:": "Pour toute question, aide ou activation de la licence du magasin :",
  "لا تحذف التطبيق، ولا تمسح بياناته أو ذاكرته المؤقتة، ولا تضغط على إعادة التصفير.": "Ne désinstallez pas l'application, n'effacez ni ses données ni son cache, et ne touchez pas à la réinitialisation.",
  "لا توجد تنبيهات": "Aucune alerte",
  "لا توجد تنبيهات حالياً": "Aucune alerte pour le moment",
  "لا توجد ديون مسجلة حالياً": "Aucune dette enregistrée pour le moment",
  "لا توجد ديون مسجلة حالياً، الحمد لله.": "Aucune dette enregistrée pour le moment, Dieu merci.",
  "لا توجد ديون معلقة": "Aucune dette en attente",
  "لا توجد رسائل في السجل بعد": "Aucun SMS dans l'historique pour le moment",
  "لا توجد سجلات كافية حالياً": "Pas assez d'enregistrements pour le moment",
  "لا توجد عمليات بعد": "Aucune opération pour l'instant",
  "لا توجد فئات مطابقة": "Aucune catégorie correspondante",
  "لا توجد كلمة مرور للمالك بعد. استخدم كود الاسترداد لتعيين واحدة": "Aucun mot de passe propriétaire pour l'instant. Utilisez le code de récupération pour en définir un",
  "لا جذر لعدد سالب": "Pas de racine d'un nombre négatif",
  "لا شيء للتراجع": "Rien à annuler",
  "لا يمكن القسمة على صفر": "Division par zéro impossible",
  "لا يمكنه أخذ دين جديد حتى يُرفع الحظر": "Il ne peut pas prendre de nouvelle dette tant que le blocage n'est pas levé",
  "لا يوجد اتصال Wi-Fi محلي. اتصل بنفس شبكة الواي فاي ثم أعد المحاولة": "Pas de connexion Wi-Fi locale. Connectez-vous au même réseau Wi-Fi puis réessayez",
  "لا يوجد دين على هذا الزبون": "Ce client n'a aucune dette",
  "لا يوجد زبائن مسجلون في هذه الفئة": "Aucun client enregistré dans cette catégorie",
  "لا يوجد زبون بهذا الاسم": "Aucun client portant ce nom",
  "لا يوجد زبون مطابق": "Aucun client correspondant",
  "لا يوجد هاتف مالك مقترن": "Aucun téléphone propriétaire associé",
  "لا يوجد هاتف مقترن بعد.": "Aucun téléphone associé pour l'instant.",
  "لاحقاً": "Plus tard",
  "لحماية سجلات وديون متجرك من التطفل، يرجى إدخال كلمة المرور:": "Pour protéger les registres et dettes de votre magasin, saisissez le mot de passe :",
  "لصق": "Coller",
  "لصق كود التفعيل": "Coller le code d'activation",
  "لغة الرسالة": "Langue du SMS",
  "للتواصل معنا": "Nous contacter",
  "لم تنجح بعد": "Aucun succès pour l'instant",
  "لم يتم منح إذن إرسال الرسائل، بقيت الميزة متوقفة": "Permission SMS refusée, la fonctionnalité reste désactivée",
  "لن يتمكن هذا الهاتف من المزامنة بعد الآن. لن تُحذف أي بيانات من أي هاتف.": "Ce téléphone ne pourra plus se synchroniser. Aucune donnée ne sera supprimée d'aucun téléphone.",
  "ليجان (الشباب)": "Jeunes (Lidjan)",
  "مؤشر الأمان": "Indice de sécurité",
  "مؤشر الاستقرار وصحة التحصيل:": "Indice de stabilité et de santé du recouvrement :",
  "مبلغ التسديد أكبر من مجموع الدين والسلعة الجديدة": "Le montant payé dépasse le total de la dette et du nouvel article",
  "مبلغ الدين الحالي": "Montant de la dette actuelle",
  "متأخر عن موعد السداد بـ 2 يومين (كان يوم {})": "En retard sur l'échéance de 2 jours (c'était le {})",
  "متأخر عن موعد السداد بـ {} {} (كان يوم {})": "En retard sur l'échéance de {1} {2} (c'était le {3})",
  "متابعة": "Continuer",
  "مثال: 27 (اختياري)": "Exemple : 27 (optionnel)",
  "مثال: بنائين، عائلة، تجار جملة...": "Exemple : maçons, famille, grossistes...",
  "مثال: جاري": "Exemple : courant",
  "مثال: خبز وحليب": "Exemple : pain et lait",
  "مثال: دفعة من الحساب، أو تفاصيل السلعة المأخوذة...": "Exemple : acompte, ou détails de l'article pris...",
  "مثال: زيت وسكر، أو قهوة وحليب...": "Exemple : huile et sucre, ou café et lait...",
  "مثال: محل الأمانة": "Exemple : Magasin El Amana",
  "مجموع الديون في السوق": "Total des dettes sur le marché",
  "مجموع ما استرجعه المحل من الزبائن": "Total récupéré par le magasin auprès des clients",
  "محاولات كثيرة خاطئة. انتظر {} ثانية ⏳": "Trop de tentatives incorrectes. Patientez {} seconde(s) ⏳",
  "محظور": "Bloqué",
  "مدى الحياة": "À vie",
  "مراد زروقي": "Mourad Zerouki",
  "مراسلة عبر واتساب (الدعم الفني)": "Écrire sur WhatsApp (assistance technique)",
  "مرحباً بك مجدداً في DEYN 🔓": "Bon retour dans DEYN 🔓",
  "مزامنة الآن": "Synchroniser maintenant",
  "مسح الكل": "Tout effacer",
  "مسح كل البيانات": "Effacer toutes les données",
  "مشروبات": "Boissons",
  "معاينة كراس الديون الورقي:": "Aperçu du carnet de dettes papier :",
  "معرّف الجهاز": "Identifiant de l'appareil",
  "ملاحظة (اختياري)": "Note (optionnel)",
  "ملاحظة أو تفاصيل السلعة للتذكرة (تُحفظ في حساب الزبون):": "Note ou détails de l'article pour le ticket (enregistrés dans le compte du client) :",
  "ملف الإنقاذ قد يحتوي بيانات خاصة وكلمات مرور قديمة. احتفظ به في مكان آمن ولا ترسله قبل مراجعته.": "Le fichier de secours peut contenir des données privées et d'anciens mots de passe. Gardez-le en lieu sûr et ne l'envoyez pas avant de l'avoir vérifié.",
  "من 3: تم اكتشاف تغيير غير طبيعي في ساعة الجهاز. صحّح التاريخ والوقت.": "sur 3 : un changement anormal de l'horloge a été détecté. Corrigez la date et l'heure.",
  "مواد تنظيف وسكر": "Produits d'entretien et sucre",
  "مواد غذائية": "Produits alimentaires",
  "موعد استحقاق السلعة الجديدة (اختياري)": "Date d'échéance du nouvel article (optionnel)",
  "موعد استحقاق هذا الدين (اختياري)": "Date d'échéance de cette dette (optionnel)",
  "موعد السداد": "Date de paiement",
  "موعد السداد يوم {} من الشهر": "Échéance le {} de chaque mois",
  "موعده {}": "Échéance : {}",
  "ميزة SMS غير متاحة في هذه النسخة": "La fonction SMS n'est pas disponible dans cette version",
  "نادية بن عيسى": "Nadia Ben Aïssa",
  "نسخ": "Copier",
  "نسخ المعرّف": "Copier l'identifiant",
  "نسخ معرّف الجهاز": "Copier l'identifiant de l'appareil",
  "نسخ 📋": "Copier 📋",
  "نسخة ورقية منظمة لجميع الحسابات والديون": "Copie papier organisée de tous les comptes et dettes",
  "نسيت كلمة المرور؟": "Mot de passe oublié ?",
  "نسيت كلمة المرور؟ استخدم كود الاسترداد": "Mot de passe oublié ? Utilisez le code de récupération",
  "نقرة خفيفة عند كل ضغطة": "Léger clic à chaque appui",
  "نقل إلى المهملات": "Mettre à la corbeille",
  "نهاية الإرسال (حتى 22:00)": "Fin d'envoi (jusqu'à 22:00)",
  "هاتف العامل": "Téléphone de l'employé",
  "هاتف المالك": "Téléphone du propriétaire",
  "هاتف المالك الرئيسي + هاتف العامل المساعد": "Téléphone principal du propriétaire + téléphone de l'employé",
  "هذا الجهاز لا يدعم التحقق الآمن": "Cet appareil ne prend pas en charge la vérification sécurisée",
  "هذا الجهاز لا يدعم التحقق الآمن من Ed25519": "Cet appareil ne prend pas en charge la vérification sécurisée Ed25519",
  "هذا الجهاز مرخّص كجهاز عامل ولا يمكن تحويله إلى وضع المالك 🔒": "Cet appareil est licencié comme appareil employé et ne peut pas passer en mode propriétaire 🔒",
  "هذا الدين سيتم تسويته بالكامل بهذه الدفعة، اختر دينًا سيبقى منه رصيد": "Cette dette sera entièrement soldée par ce paiement ; choisissez une dette ayant un solde restant",
  "هذا الكود سبق استعماله": "Ce code a déjà été utilisé",
  "هذا الكود مخصص لجهاز آخر": "Ce code est destiné à un autre appareil",
  "هذه العملية": "Cette opération",
  "هل أنت متأكد من حذف جميع البيانات؟ ستُنقل كل الحسابات والتذاكر الحالية إلى سلة المهملات، ويمكنك استرجاعها بضغطة زر إن أردت.": "Voulez-vous vraiment supprimer toutes les données ? Tous les comptes et tickets actuels seront déplacés vers la corbeille et vous pourrez les restaurer en un clic.",
  "هل أنت متأكد من حذف فئة «{}»؟": "Voulez-vous vraiment supprimer la catégorie « {} » ?",
  "وسم": "Étiquette",
  "وضع القراءة فقط": "Mode lecture seule",
  "وضع القراءة فقط 🔒": "Mode lecture seule 🔒",
  "وضع القراءة فقط: لا يمكن إرسال SMS": "Mode lecture seule : impossible d'envoyer des SMS",
  "وضع القراءة فقط: لا يمكن الإضافة أو التعديل أو الحذف حاليًا 🔒": "Lecture seule : ajout, modification et suppression impossibles pour le moment 🔒",
  "وضع القراءة فقط: لا يمكن تغيير إعدادات SMS": "Mode lecture seule : impossible de modifier les paramètres SMS",
  "ونص": "et demi",
  "ياسين دحماني": "Yacine Dahmani",
  "يرجى كتابة اسم أو لقب الزبون": "Veuillez saisir le nom ou le surnom du client",
  "يعرض السجل قبول أندرويد أو حالة إرسال غير مؤكدة؛ ولا يثبت وصول الرسالة إلى هاتف الزبون.": "L'historique indique l'acceptation par Android ou un état incertain ; cela ne garantit pas la réception par le client.",
  "يقترب موعد السداد (بعد 2 يومين)": "L'échéance approche (dans 2 jours)",
  "يقترب موعد السداد (بعد {} {})": "L'échéance approche (dans {1} {2})",
  "يميز السجل بين قبول أندرويد، ونجاح إرسال كل الأجزاء للشبكة، وتأكيد التسليم، والفشل الجزئي أو الكلي.": "L'historique distingue l'acceptation par Android, l'envoi complet au réseau, la confirmation de livraison et l'échec partiel ou total.",
  "يمكنك حذف أي فئة لا تستعملها في محلك:": "Vous pouvez supprimer toute catégorie que vous n'utilisez pas dans votre magasin :",
  "يمكنك حفظ هذه النسخة كملف": "Vous pouvez enregistrer cette copie dans un fichier",
  "ينتهي بعد": "Expire dans",
  "ينتهي بعد {} ثانية": "Expire dans {} seconde(s)",
  "يُضاف هذا الاسم تلقائيًا مكان {store} في القالب العربي والفرنسي.": "Ce nom remplace automatiquement {store} dans les modèles arabe et français.",
  "يُمدد الدين الذي تختاره فقط، مع الاحتفاظ بتاريخ الموعد السابق وسجل التمديد.": "Seule la dette choisie est prolongée, tout en conservant l'ancienne échéance et l'historique.",
  "يوم": "jour",
  "يوم {} في الشهر": "Le {} de chaque mois",
  "يوم {} في الشهر (⚠️ متأخر {} يوم)": "Le {} de chaque mois (⚠️ en retard de {} jour(s))",
  "يوم الراتب اليوم": "Jour de paie aujourd'hui",
  "يوم السداد المتوقع في الشهر (اختياري)": "Jour de paiement prévu dans le mois (optionnel)",
  "يومين": "2 jours",
  "— الدين الحالي": "— Dette actuelle",
  "— ستُعاد المحاولة تلقائيًا": "— Nouvelle tentative automatique",
  "• {} {} {}{} دج{}": "• {} {} {}{} DA{}",
  "• استُلم": "• reçus",
  "⚙️ إدارة الفئات": "⚙️ Gérer les catégories",
  "⚠️ اقترب من السقف — بقي {} دج": "⚠️ Proche du plafond — il reste {} DA",
  "⚠️ الدين الجديد ({} دج) يتجاوز السقف ({} دج)": "⚠️ La nouvelle dette ({} DA) dépasse le plafond ({} DA)",
  "⚠️ انتهت مهلة تصحيح الساعة (لم يُفعَّل القفل بعد). صحّح تاريخ الجهاز.": "⚠️ Le délai de correction de l'horloge est écoulé (verrouillage pas encore activé). Corrigez la date de l'appareil.",
  "⚠️ تجاوز السقف بـ {} دج": "⚠️ Plafond dépassé de {} DA",
  "⚠️ تحذير": "⚠️ Avertissement",
  "⚠️ تحذير {} من 3: تم اكتشاف تغيير غير طبيعي في ساعة الجهاز. صحّح التاريخ والوقت.": "⚠️ Avertissement {} sur 3 : un changement anormal de l'horloge a été détecté. Corrigez la date et l'heure.",
  "⚠️ تعذّر حفظ حالة الوقت بأمان": "⚠️ Impossible d'enregistrer l'état de l'horloge en toute sécurité",
  "⚠️ تم تجاهل {} تعديلًا من هاتف العامل لتجاوزه الصلاحيات.": "⚠️ {} modification(s) du téléphone de l'employé ignorée(s) car dépassant ses droits.",
  "⚠️ متأخر 2 يومين": "⚠️ En retard de 2 jours",
  "⚠️ متأخر {} {}": "⚠️ En retard de {1} {2}",
  "⚠️ متأخر {} يوم": "⚠️ En retard de {} jour(s)",
  "⚠️ متأخر بـ 2 يومين (موعده يوم {})": "⚠️ En retard de 2 jours (échéance le {})",
  "⚠️ متأخر بـ {} {} (موعده يوم {})": "⚠️ En retard de {1} {2} (échéance le {3})",
  "⚠️ مهلة التصحيح: متبقٍ نحو": "⚠️ Délai de correction : il reste environ",
  "⚠️ مهلة التصحيح: متبقٍ نحو {} ساعة. صحّح ساعة الجهاز أو اتصل بالإنترنت.": "⚠️ Délai de correction : il reste environ {} heure(s). Corrigez l'horloge de l'appareil ou connectez-vous à internet.",
  "⚠️ يتجاوز السقف ({} دج) بـ {} دج": "⚠️ Dépasse le plafond ({} DA) de {} DA",
  "✅ سدد مؤخراً {} دج": "✅ A payé récemment {} DA",
  "✅ مصفّى بالكامل": "✅ Entièrement soldé",
  "✅ ملتزم بالموعد": "✅ Respecte l'échéance",
  "✏️ ملاحظة": "✏️ Note",
  "➕ زيادة دين": "➕ Augmenter la dette",
  "💰 تسديد دين": "💰 Payer une dette",
  "💼 الراتب بعد {} يوم — وقت التحصيل": "💼 Paie dans {} jour(s) — moment de l'encaissement",
  "💼 {} — وقت التحصيل": "💼 {} — moment de l'encaissement",
  "📅 {} — وقت التحصيل": "📅 {} — moment de l'encaissement",
  "📷 مسح QR": "📷 Scanner le QR",
  "🔄 المزامنة": "🔄 Synchroniser",
  "🔒 وضع القراءة فقط: انتهت المهلة. يمكنك عرض البيانات وتصدير نسخة احتياطية. صحّح الساعة واتصل بالإنترنت.": "🔒 Lecture seule : le délai est écoulé. Vous pouvez consulter les données et exporter une sauvegarde. Corrigez l'horloge et connectez-vous à internet.",
  "🔓 رفع الحظر": "🔓 Lever le blocage",
  "🕒 موعد السداد اليوم (يوم {})": "🕒 Échéance aujourd'hui (le {})",
  "🕒 موعده اليوم": "🕒 Échéance aujourd'hui",
  "🖨️ طباعة / حفظ كـ PDF": "🖨️ Imprimer / enregistrer en PDF",
  "🗑️ حذف البيانات": "🗑️ Supprimer les données",
  "🗑️ سلة المهملات": "🗑️ Corbeille",
  "🚨 تجاوز سقف الدين": "🚨 Plafond de dette dépassé",
  "🚨 تجاوز سقف الدين ({} / {} دج)": "🚨 Plafond de dette dépassé ({} / {} DA)",
  "🚨 فوق السقف": "🚨 Au-dessus du plafond",
  "🚫 القائمة السوداء (محظورون من الدين)": "🚫 Liste noire (clients bloqués)",
  "🚫 حساب محظور — لا دين جديد حتى تسديد {} دج": "🚫 Compte bloqué — pas de nouvelle dette avant paiement de {} DA",
  "🚫 حساب محظور — لا يقبل دينًا جديدًا": "🚫 Compte bloqué — n'accepte pas de nouvelle dette",
  "🛍️ سلعة جديدة أخذها الآن (دين جديد يُضاف)": "🛍️ Nouvel article pris maintenant (nouvelle dette ajoutée)",
  "نوع الترخيص (M أو W) يحدد صلاحيات الجهاز ولا يمكن تغيير الدور من داخل التطبيق 🔒": "Le type de licence (M ou W) détermine le rôle de l'appareil et ne peut pas être modifié dans l'application 🔒",
  "لاحقًا": "Plus tard",
  "حسناً": "OK",
  "حسنًا": "OK",
  "انتهت مهلة الـ 48 ساعة، يرجى ضبط الساعة والضغط على حسناً للتحقق": "Le délai de 48 heures est écoulé, veuillez régler l'horloge et appuyer sur OK pour vérifier",
  "تم التحقق من صحة الساعة وإزالة التحذير بنجاح ✅": "Horloge vérifiée et avertissement supprimé avec succès ✅",
  "الساعة لا تزال غير مطابقة للوقت الحقيقي أو يلزم الاتصال بالإنترنت للتحقق": "L'horloge ne correspond toujours pas à l'heure réelle ou une connexion internet est requise pour vérifier",
  "ملف النسخة الاحتياطية فارغ أو غير صالح": "Le fichier de sauvegarde est vide ou invalide",
  "ملف JSON تالف ولا يمكن قراءته": "Le fichier JSON est corrompu et illisible",
  "بنية ملف النسخة الاحتياطية غير متوافقة": "La structure du fichier de sauvegarde est incompatible",
  "ملف النسخة الاحتياطية لا يحتوي على سجلات الزبائن والتذاكر المطلوبة": "Le fichier de sauvegarde ne contient pas les registres clients et tickets requis",
  "بيانات الزبون رقم {} في الملف تالفة أو ناقصة": "Les données du client n° {} dans le fichier sont corrompues ou incomplètes",
  "ملف النسخة الاحتياطية يحتوي على معرفات زبائن مكررة": "Le fichier de sauvegarde contient des identifiants clients en double",
  "سجل عمليات الزبون «{}» غير صالح": "L'historique des opérations du client « {} » est invalide",
  "عملية مالية تالفة في حساب «{}»": "Opération financière corrompue dans le compte « {} »",
  "ملف النسخة الاحتياطية يحتوي على معرفات عمليات مكررة": "Le fichier de sauvegarde contient des identifiants d'opérations en double",
  "بيانات التذكرة المعلقة رقم {} تالفة": "Les données du ticket en attente n° {} sont corrompues",
  "سجل سلة المهملات في النسخة الاحتياطية غير صالح": "Le registre de la corbeille dans la sauvegarde est invalide",
  "تعذّر تحديث النسخة الاحتياطية الخارجية (تحقق من مساحة الهاتف أو المجلد). آخر نسخة سليمة محفوظة ⚠️": "Impossible de mettre à jour la sauvegarde externe (vérifiez l'espace ou le dossier). La dernière sauvegarde valide est préservée ⚠️",
  "بيانات الاستعادة أو الترخيص غير صالحة": "Les données de restauration ou la licence sont invalides",
  "تعذّر حفظ البيانات المستعادة في التخزين المحلي": "Impossible d'enregistrer les données restaurées dans le stockage local",
  "تعذّرت قراءة ملف JSON المختار": "Impossible de lire le fichier JSON sélectionné",
  "استعادة نسخة JSON": "Restaurer une sauvegarde JSON",
  "تم التحقق من سلامة ملف النسخة الاحتياطية:": "Intégrité du fichier de sauvegarde vérifiée :",
  "زبائن": "clients",
  "تنبيه: هذه النسخة مأخوذة من جهاز آخر. لإتمام الاستعادة على هذا الهاتف، أدخل كود التفعيل الصالح لمعرّف هذا الجهاز الصادر من مولّد الأكواد.": "Attention : cette sauvegarde provient d'un autre appareil. Pour restaurer sur ce téléphone, saisissez un code d'activation valide pour l'identifiant de cet appareil.",
  "لإتمام الاستعادة بأمان، أدخل كود التفعيل الخاص بهذا الجهاز:": "Pour terminer la restauration en toute sécurité, saisissez le code d'activation de cet appareil :",
  "تأكيد الاستعادة": "Confirmer la restauration",
  "أدخل كود التفعيل للتحقق من أحقية الاستعادة": "Saisissez le code d'activation pour autoriser la restauration",
  "كود التفعيل غير صالح لهذا الجهاز أو انتهت صلاحيته — تم رفض الاستعادة": "Code d'activation invalide pour cet appareil ou expiré — restauration refusée",
  "تمت استعادة النسخة الاحتياطية بنجاح ✅": "Sauvegarde restaurée avec succès ✅",
  "فشلت عملية الاستعادة وبقيت بياناتك الحالية محمية:": "Échec de la restauration, vos données actuelles restent protégées :",
  "إعداد النسخ الاحتياطي التلقائي": "Configuration de la sauvegarde automatique",
  "تم تفعيل الحفظ التلقائي المحلي؛ اختيار مجلد خارجي متاح داخل تطبيق أندرويد": "Sauvegarde automatique locale activée ; le choix d'un dossier externe est disponible dans l'application Android",
  "تم ربط مجلد النسخ الاحتياطي التلقائي وحفظ النسخة بنجاح ✅": "Dossier de sauvegarde automatique lié et sauvegarde enregistrée avec succès ✅",
  "لم يتم اختيار مجلد النسخ الاحتياطي": "Aucun dossier de sauvegarde sélectionné",
  "تحديد مجلد النسخ الاحتياطي التلقائي (خارج التطبيق)": "Choisir le dossier de sauvegarde auto (hors application)",
  "⚠️ متأخر بـ {} يوم (موعده يوم {}) — {} دج": "⚠️ En retard de {} jour(s) (échéance le {}) — {} DA",
  "⚠️ متأخر بـ {} يومين (موعده يوم {}) — {} دج": "⚠️ En retard de 2 jours (échéance le {}) — {} DA",
  "⚠️ متأخر بـ {} أيام (موعده يوم {}) — {} دج": "⚠️ En retard de {} jours (échéance le {}) — {} DA",
  "🕒 موعد السداد اليوم (يوم {}) — {} دج": "🕒 Échéance aujourd'hui (le {}) — {} DA",
  "غير مقروء": "Non lu",
  "مقروء": "Lu",
  "مقروء ✓": "Lu ✓",
  "جديد": "Nouveau",
  "تحديد الكل كمقروء": "Tout marquer comme lu",
  "لا توجد تنبيهات جديدة": "Aucune nouvelle alerte",
  "لا توجد تنبيهات في هذا القسم": "Aucune alerte dans cette section",
  "فُقد إذن الوصول إلى مجلد النسخ الاحتياطي الخارجي — يرجى إعادة اختيار المجلد من الإعدادات ⚠️": "Autorisation d'accès au dossier de sauvegarde externe perdue — veuillez resélectionner le dossier dans les paramètres ⚠️",
  "إضافة النسخ الاحتياطي لأندرويد غير متاحة في هذه البيئة": "Le module de sauvegarde Android n'est pas disponible dans cet environnement",
  "لم يتم العثور على نسخة احتياطية صالحة في المجلد المختار": "Aucune sauvegarde valide trouvée dans le dossier sélectionné",
  "فشل التحقق من حفظ البيانات المشفرة": "Échec de la vérification de l'enregistrement des données chiffrées",
  "تعذّرت قراءة النسخة التلقائية من المجلد": "Impossible de lire la sauvegarde automatique depuis le dossier",
  "تم التحول تلقائياً إلى النسخة الاحتياطية السابقة السليمة (.prev.json) بسبب تعذّر قراءة النسخة الرئيسية ⚠️": "Basculement automatique vers la sauvegarde précédente valide (.prev.json) car la sauvegarde principale est illisible ⚠️",
  "اختيار مجلد النسخ الاحتياطي الخارجي يتطلب تشغيل التطبيق على نظام أندرويد ⚠️": "Le choix d'un dossier de sauvegarde externe nécessite l'application Android ⚠️",
  "تم اختيار المجلد لكن تعذّرت كتابة النسخة الاحتياطية الأولى ⚠️": "Dossier sélectionné mais impossible d'écrire la première sauvegarde ⚠️"
};

/* ============ Interface language (Arabic default, French optional) + French Centimes Engine ============ */
const DEYN_I18N = (() => {
  const AR = /[\u0600-\u06FF]/;
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let lang = 'ar';
  try { lang = localStorage.getItem('deyn.lang') === 'fr' ? 'fr' : 'ar'; } catch (e) {}
  const exact = new Map(), pats = [];
  let statics = null, built = false;
  const cache = new Map();
  const norm = s => s.replace(/\s+/g, ' ').trim();

  /**
   * Formats a Dinar amount (1 DA = 100 centimes) in natural Algerian French centimes phrasing.
   * Examples:
   *   5 DA     -> "500 centimes"
   *   10 DA    -> "1 000 centimes"
   *   345 DA   -> "34 500 centimes"
   *   10000 DA -> "1 million de centimes"
   *   15000 DA -> "1 million et demi de centimes"
   *   14250 DA -> "1 million et 425 000 centimes"
   */
  function dialectFr(d) {
    const num = Math.round((Number(d) + Number.EPSILON) * 100) / 100;
    if (!(num > 0)) return '';
    const centimes = Math.round(num * 100);
    if (centimes <= 0) return '';
    const fmtC = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
    const millions = Math.floor(centimes / 1000000);
    const rem = centimes % 1000000;
    if (millions >= 1) {
      const mStr = millions === 1 ? '1 million' : `${fmtC(millions)} millions`;
      if (rem === 0) return `${mStr} de centimes`;
      if (rem === 500000) return `${mStr} et demi de centimes`;
      return `${mStr} et ${fmtC(rem)} centimes`;
    }
    return `${fmtC(centimes)} centimes`;
  }

  /**
   * Parses any Arabic dialect amount string produced by dialect(d) back into Dinars
   * and converts it into natural French centimes via dialectFr(da).
   */
  const DORO_DA = { 'عشرين دورو': 1, 'ربعين دورو': 2, 'ستين دورو': 3, 'ثمانين دورو': 4 };
  function parseArBase5(part) {
    const s = part.trim();
    if (!s) return null;
    if (s === 'ميادورو') return 5;
    if (s === 'تلاث ميادورو') return 15;
    if (s === 'خمس ميادورو') return 25;
    if (s === 'ألف') return 10;
    if (s === 'ألف ونص') return 15;
    if (s === 'ألفين') return 20;
    if (s === 'ألفين ونص') return 25;
    let m = /^(\d+)\s*(?:آلاف|ألف)(\s+ونص)?$/.exec(s);
    if (m) return Number(m[1]) * 10 + (m[2] ? 5 : 0);
    return null;
  }
  function parseArMillions(part) {
    const s = part.trim();
    if (s === 'مليون') return 10000;
    if (s === 'زوج ملاين') return 20000;
    const m = /^(\d+)\s*(?:ملاين|مليون)$/.exec(s);
    if (m) return Number(m[1]) * 10000;
    return null;
  }
  function arDialectToFr(rawStr) {
    const s = norm(rawStr);
    if (!s) return null;
    if (DORO_DA[s]) return dialectFr(DORO_DA[s]);
    let remDoro = 0;
    let main = s;
    for (const [k, v] of Object.entries(DORO_DA)) {
      if (main.endsWith(' و' + k)) {
        remDoro = v;
        main = main.slice(0, -(' و' + k).length).trim();
        break;
      }
    }
    const b5 = parseArBase5(main);
    if (b5 !== null) return dialectFr(b5 + remDoro);
    if (main.endsWith(' ونص')) {
      const mPart = main.slice(0, -' ونص'.length).trim();
      const mVal = parseArMillions(mPart);
      if (mVal !== null) return dialectFr(mVal + 5000 + remDoro);
    }
    const mDirect = parseArMillions(main);
    if (mDirect !== null) return dialectFr(mDirect + remDoro);
    const wIdx = main.indexOf(' و');
    if (wIdx > 0) {
      const mVal = parseArMillions(main.slice(0, wIdx));
      const tVal = parseArBase5(main.slice(wIdx + 2));
      if (mVal !== null && tVal !== null) return dialectFr(mVal + tVal + remDoro);
    }
    return null;
  }

  function ensureBuilt() {
    if (built) return;
    built = true;
    for (const k of Object.keys(DEYN_FR_DICT)) {
      const v = DEYN_FR_DICT[k];
      if (k.indexOf('{}') >= 0) {
        pats.push({
          re: new RegExp('^' + k.split('{}').map(esc).join('([\\s\\S]*?)') + '$'),
          v,
          n: (k.match(/[\u0600-\u06FF]/g) || []).length,
          len: k.length
        });
      } else {
        exact.set(k, v);
      }
    }
    pats.sort((a, b) => (b.n - a.n) || (b.len - a.len));
    statics = Array.from(exact.keys())
      .filter(k => k.length >= 2)
      .sort((a, b) => b.length - a.length)
      .map(k => ({ re: new RegExp('(?<![\\u0600-\\u06FF])' + esc(k) + '(?![\\u0600-\\u06FF])', 'g'), v: exact.get(k) }));
  }

  function fill(v, groups) {
    let c = 0;
    return v.replace(/\{(\d*)\}/g, (m, i) => {
      const g = groups[i ? +i - 1 : c++];
      return g === undefined ? '' : tr(g);
    });
  }

  const LET = {
    'ا': 'A', 'أ': 'A', 'إ': 'A', 'آ': 'A', 'ٱ': 'A', 'ب': 'B', 'پ': 'P', 'ت': 'T', 'ث': 'Th',
    'ج': 'J', 'چ': 'Ch', 'ح': 'H', 'خ': 'Kh', 'د': 'D', 'ذ': 'Dh', 'ر': 'R', 'ز': 'Z', 'س': 'S',
    'ش': 'Ch', 'ص': 'S', 'ض': 'D', 'ط': 'T', 'ظ': 'Z', 'ع': 'A', 'غ': 'Gh', 'ف': 'F', 'ڤ': 'V',
    'ق': 'Q', 'ك': 'K', 'گ': 'G', 'ل': 'L', 'م': 'M', 'ن': 'N', 'ه': 'H', 'و': 'W', 'ي': 'Y',
    'ى': 'Y', 'ة': 'A', 'ؤ': 'W', 'ئ': 'Y', 'ء': "'"
  };

  function core(t) {
    ensureBuilt();
    const dialFr = arDialectToFr(t);
    if (dialFr) return dialFr;
    if (exact.has(t)) return exact.get(t);
    if (t.length === 1 && LET[t]) return LET[t];
    const k = t.search(AR), rest = k > 0 ? t.slice(k) : null;
    if (rest && exact.has(rest)) return t.slice(0, k) + exact.get(rest);
    if (rest) {
      const restDial = arDialectToFr(rest);
      if (restDial) return t.slice(0, k) + restDial;
    }
    for (const p of pats) {
      let m = p.re.exec(t);
      if (m) return fill(p.v, m.slice(1));
      if (rest) {
        m = p.re.exec(rest);
        if (m) return t.slice(0, k) + fill(p.v, m.slice(1));
      }
    }
    // Check parenthesized dialect inside a string, e.g. "14 250 DA (مليون و425 ألف)"
    let out = t.replace(/\(([^()]*[\u0600-\u06FF][^()]*)\)/g, (full, inner) => {
      const conv = arDialectToFr(inner) || (exact.has(inner.trim()) ? exact.get(inner.trim()) : null);
      return conv ? '(' + conv + ')' : full;
    });
    for (const s of statics) {
      s.re.lastIndex = 0;
      if (s.re.test(out)) {
        s.re.lastIndex = 0;
        out = out.replace(s.re, s.v);
      }
    }
    return out;
  }

  function tr(text) {
    if (lang !== 'fr' || typeof text !== 'string' || !AR.test(text)) return text;
    ensureBuilt();
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
    const key = norm(m[2]);
    let r = cache.get(key);
    if (r === undefined) {
      r = core(key);
      if (cache.size > 4000) cache.clear();
      cache.set(key, r);
    }
    return m[1] + r + m[3];
  }

  const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
  function node(n) {
    if (!n || lang !== 'fr') return;
    if (n.nodeType === 3) {
      const p = n.parentNode;
      if (p && (p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE' || p.id === 'smsTplAr')) return;
      const v = n.nodeValue;
      if (AR.test(v)) {
        const t = tr(v);
        if (t !== v) n.nodeValue = t;
      }
      return;
    }
    if (n.nodeType !== 1 || n.nodeName === 'SCRIPT' || n.nodeName === 'STYLE') return;
    for (const a of ATTRS) {
      const v = n.getAttribute(a);
      if (v && AR.test(v)) {
        const t = tr(v);
        if (t !== v) n.setAttribute(a, t);
      }
    }
    if (n.nodeName === 'INPUT' && n.type !== 'password' && n.value && AR.test(n.value) && !n.dataset.i18nValDone) {
      ensureBuilt();
      const k = norm(n.value);
      if (exact.has(k)) {
        n.value = exact.get(k);
        n.dataset.i18nValDone = '1';
      }
    }
    for (let c = n.firstChild; c; c = c.nextSibling) node(c);
  }

  function html(s) {
    if (lang !== 'fr' || typeof s !== 'string') return s;
    ensureBuilt();
    return s
      .replace(/>([^<]*[\u0600-\u06FF][^<]*)</g, (m, t) => '>' + tr(t) + '<')
      .replace(/(placeholder|title|aria-label|alt)="([^"]*)"/g, (m, a, v) => a + '="' + tr(v) + '"')
      .replace(/<html[^>]*>/i, '<html lang="fr" dir="ltr">')
      .replace(/dir="rtl"/g, 'dir="ltr"')
      .replace(/direction:\s*rtl/g, 'direction: ltr');
  }

  function installRuntimeHooks() {
    if (typeof window === 'undefined') return;
    // 1. Hook dialect() so all centimes displays work natively in French without hiding them
    if (typeof window.dialect === 'function' && !window.dialect.__i18nWrapped) {
      const origDialect = window.dialect;
      const wrappedDialect = function (d) {
        if (lang === 'fr') return dialectFr(d);
        return origDialect.apply(this, arguments);
      };
      wrappedDialect.__i18nWrapped = true;
      window.dialect = wrappedDialect;
    }
    // 2. Hook toast(), agToast(), deynBanner() so notifications are always translated synchronously
    if (typeof window.toast === 'function' && !window.toast.__i18nWrapped) {
      const origToast = window.toast;
      const wrappedToast = function (m, k) {
        return origToast.call(this, lang === 'fr' ? tr(String(m ?? '')) : m, k);
      };
      wrappedToast.__i18nWrapped = true;
      window.toast = wrappedToast;
    }
    if (typeof window.agToast === 'function' && !window.agToast.__i18nWrapped) {
      const origAgToast = window.agToast;
      const wrappedAgToast = function (m) {
        return origAgToast.call(this, lang === 'fr' ? tr(String(m ?? '')) : m);
      };
      wrappedAgToast.__i18nWrapped = true;
      window.agToast = wrappedAgToast;
    }
    if (typeof window.deynBanner === 'function' && !window.deynBanner.__i18nWrapped) {
      const origBanner = window.deynBanner;
      const wrappedBanner = function (txt, kind) {
        return origBanner.call(this, lang === 'fr' && txt ? tr(String(txt)) : txt, kind);
      };
      wrappedBanner.__i18nWrapped = true;
      window.deynBanner = wrappedBanner;
    }
    // 3. Hook openModal() so every modal's paint() and mount() synchronously translates its DOM
    if (typeof window.openModal === 'function' && !window.openModal.__i18nWrapped) {
      const origOpenModal = window.openModal;
      const wrappedOpenModal = function (render, opts) {
        const m = origOpenModal.call(this, render, opts);
        if (m && m.wrap && lang === 'fr') {
          node(m.wrap);
          if (typeof m.paint === 'function' && !m.paint.__i18nWrapped) {
            const origPaint = m.paint;
            m.paint = function () {
              const r = origPaint.apply(this, arguments);
              if (lang === 'fr') node(m.wrap);
              return r;
            };
            m.paint.__i18nWrapped = true;
          }
        }
        return m;
      };
      wrappedOpenModal.__i18nWrapped = true;
      window.openModal = wrappedOpenModal;
    }
    // 4. Hook statement() so WhatsApp and copied statements are translated in French mode
    if (typeof window.statement === 'function' && !window.statement.__i18nWrapped) {
      const origStatement = window.statement;
      const wrappedStatement = function (c) {
        const s = origStatement.apply(this, arguments);
        if (lang !== 'fr' || typeof s !== 'string') return s;
        return s.split('\n').map(line => tr(line)).join('\n');
      };
      wrappedStatement.__i18nWrapped = true;
      window.statement = wrappedStatement;
    }
    // 5. Hook exportPdfLedger() so both window.open and Blob fallback export French HTML in French mode
    if (typeof window.exportPdfLedger === 'function' && !window.exportPdfLedger.__i18nWrapped) {
      const origExportPdf = window.exportPdfLedger;
      const wrappedExportPdf = function () {
        if (lang !== 'fr') return origExportPdf.apply(this, arguments);
        const origOpen = window.open;
        const origBlob = window.Blob;
        try {
          window.open = function () {
            const w = origOpen.apply(this, arguments);
            if (w && w.document && typeof w.document.write === 'function') {
              const origWrite = w.document.write.bind(w.document);
              w.document.write = function (content) {
                return origWrite(html(String(content ?? '')));
              };
            }
            return w;
          };
          window.Blob = function (parts, options) {
            if (Array.isArray(parts) && options && options.type === 'text/html') {
              parts = parts.map(p => typeof p === 'string' ? html(p) : p);
            }
            return new origBlob(parts, options);
          };
          return origExportPdf.apply(this, arguments);
        } finally {
          window.open = origOpen;
          window.Blob = origBlob;
        }
      };
      wrappedExportPdf.__i18nWrapped = true;
      window.exportPdfLedger = wrappedExportPdf;
      if (typeof window.A === 'object' && window.A) window.A.exportPdf = wrappedExportPdf;
    }
    // 6. Hook renderDisplay, renderPending, renderLedger, renderStats, updateMM so synchronous DOM updates are translated immediately
    for (const fnName of ['renderDisplay', 'renderPending', 'renderLedger', 'renderStats', 'updateMM', 'buildTiles']) {
      if (typeof window[fnName] === 'function' && !window[fnName].__i18nWrapped) {
        const origFn = window[fnName];
        const wrappedFn = function () {
          const r = origFn.apply(this, arguments);
          if (lang === 'fr' && document && document.body) node(document.body);
          return r;
        };
        wrappedFn.__i18nWrapped = true;
        window[fnName] = wrappedFn;
      }
    }
    if (typeof window.A === 'object' && window.A && !window.A.setLang) {
      window.A.setLang = d => set(d && d.l);
    }
    if (typeof window.READONLY_OK !== 'undefined' && window.READONLY_OK && typeof window.READONLY_OK.add === 'function') {
      window.READONLY_OK.add('setLang');
    }
  }

  function start() {
    ensureBuilt();
    installRuntimeHooks();
    if (lang !== 'fr') return;
    document.documentElement.lang = 'fr';
    document.documentElement.dir = 'ltr';
    if (document.title && AR.test(document.title)) document.title = tr(document.title);
    document.body.classList.add('fr');
    if (!document.getElementById('deyn-fr-rtl-ltr-style')) {
      const st = document.createElement('style');
      st.id = 'deyn-fr-rtl-ltr-style';
      st.textContent = [
        'html,body{direction:ltr!important}',
        'body.fr *{direction:ltr!important}',
        'body.fr [style*="text-align:right"]{text-align:left!important}',
        'body.fr .nt,body.fr .pick,body.fr .cmp th,body.fr .cmp td,body.fr .tape.empty{text-align:left!important}',
        'body.fr .modesw .thumb{right:auto!important;left:4px!important}',
        'body.fr .modesw[data-mode=calc] .thumb{transform:translateX(100%)!important}',
        'body.fr .sw i::after{right:auto!important;left:3px!important}',
        'body.fr .sw input:checked+i::after{transform:translateX(20px)!important}',
        'body.fr .rk-go,body.fr .nt-go{transform:scaleX(-1);display:inline-block}',
        'body.fr .tile .t-tag{font-size:8.5px;padding:1px 5px;max-width:96%;overflow:hidden;text-overflow:ellipsis}',
        'body.no-dial .hx-dial,body.no-dial .kp-d,body.no-dial .rk-d,body.no-dial .ds-d,body.no-dial .dial,body.no-dial #dial,body.no-dial .t-tag,body.no-dial .pill:not(.bk){display:none!important}'
      ].join('');
      document.head.appendChild(st);
    }
    if (typeof window.buildTiles === 'function' && typeof window.S !== 'undefined' && window.S) {
      try { window.buildTiles(); window.renderAll(); } catch (e) {}
    }
    node(document.body);
    new MutationObserver(ms => {
      for (const m of ms) {
        if (m.type === 'childList') m.addedNodes.forEach(node);
        else if (m.type === 'characterData') node(m.target);
        else if (m.type === 'attributes') node(m.target);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  function set(l, noReload) {
    lang = l === 'fr' ? 'fr' : 'ar';
    cache.clear();
    try { localStorage.setItem('deyn.lang', lang); } catch (e) {}
    if (noReload) {
      if (lang === 'fr') start();
      else {
        document.documentElement.lang = 'ar';
        document.documentElement.dir = 'rtl';
        document.body.classList.remove('fr');
      }
      return;
    }
    location.reload();
  }

  return {
    tr,
    html,
    start,
    set,
    translateRoot: node,
    dialectFr,
    arDialectToFr,
    get lang() { return lang; },
    get locale() { return lang === 'fr' ? 'fr-FR' : 'ar-DZ'; }
  };
})();
(function () {
  var b = document.getElementById('agLang');
  if (b) {
    b.textContent = DEYN_I18N.lang === 'fr' ? 'AR' : 'Français';
    b.setAttribute('aria-label', DEYN_I18N.lang === 'fr' ? 'Arabe' : 'Français');
    b.onclick = function () { DEYN_I18N.set(DEYN_I18N.lang === 'fr' ? 'ar' : 'fr'); };
  }
  DEYN_I18N.start();
})();
```

================================================================================
## [25/31] FILE: `sms/runtime.js`

- **المسار الأصلي**: `sms/runtime.js`
- **الحجم**: `29,097` بايت | **الأسطر**: `321` | **SHA-256**: `9207ceba0ddef2aa0c428832b277840797e854b6a908d260043de65460db5e7a`

```javascript
/* DEYN_SMS_RUNTIME_V1 */
/* DEYN SMS UI/runtime bridge. Loaded after the existing DEYN app script. */
(function () {
  'use strict';
  const Core=window.DeynSmsCore;
  const plug=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.DeynSms;
  const cfg=()=>{ S.settings=S.settings||{}; S.settings.sms=Core.config(S.settings.sms); return S.settings.sms; };
  const escSms=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isFr=()=>typeof DEYN_I18N!=='undefined'&&DEYN_I18N.lang==='fr';
  const tr=s=>(typeof DEYN_I18N!=='undefined'&&typeof DEYN_I18N.tr==='function')?DEYN_I18N.tr(s):s;
  const fmtDate=ts=>ts?Core.dateLabel(ts):tr('غير محدد');
  const isoDate=ts=>{if(!ts)return '';const d=new Date(ts);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const fromDate=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s||'')))return null;const [y,m,d]=s.split('-').map(Number);const v=new Date(y,m-1,d,23,59,59,999).getTime();return Number.isFinite(v)?v:null;};
  let syncTimer=null, syncBusy=false;

  function smsSegmentSummary(text) {
    const info = Core.analyzeMessage ? Core.analyzeMessage(text) : { encoding: 'UCS-2', units: String(text||'').length, partsCount: Math.ceil(String(text||'').length / 67) || 1 };
    if (isFr()) {
      return `Encodage : ${info.encoding} • ${info.units} caractères • ${info.partsCount} partie(s) SMS`;
    }
    return `الترميز: ${info.encoding} • ${info.units} حرف • ${info.partsCount} جزء SMS`;
  }

  function updateTplCounters() {
    const arEl = lastById('smsTplAr'), frEl = lastById('smsTplFr');
    const arInfo = lastById('smsTplArInfo'), frInfo = lastById('smsTplFrInfo');
    if (arEl && arInfo) arInfo.textContent = smsSegmentSummary(arEl.value);
    if (frEl && frInfo) frInfo.textContent = smsSegmentSummary(frEl.value);
  }

  function smsStatusLabel(rec) {
    const st = rec && rec.status || 'accepted_by_android';
    const pt = Math.max(1, Number(rec && rec.partsTotal) || 1);
    const ps = Number.isFinite(Number(rec && rec.partsSent)) ? Number(rec.partsSent) : (st === 'sent_to_network' || st === 'delivered' ? pt : 0);
    const pf = Number(rec && rec.partsFailed) || 0;
    const partsBadge = pt > 1 ? (isFr() ? ` (${ps}/${pt} parties)` : ` (${ps}/${pt} أجزاء)`) : '';
    if (st === 'delivered') {
      return isFr() ? `Livré au destinataire${partsBadge}` : `تم تأكيد التسليم إلى هاتف المستلم${partsBadge}`;
    }
    if (st === 'sent_to_network') {
      return isFr() ? `Envoyé au réseau mobile${partsBadge}` : `تم الإرسال إلى الشبكة بنجاح${partsBadge}`;
    }
    if (st === 'partial_failure') {
      return isFr()
        ? `Échec partiel : ${ps} sur ${pt} partie(s) envoyée(s), ${pf} en échec`
        : `فشل جزئي — أُرسل ${ps} من ${pt} أجزاء فقط (${pf} فشل)`;
    }
    if (st === 'failed') {
      return isFr() ? `Échec d'envoi au réseau — nouvelle tentative programmée` : `فشل الإرسال إلى الشبكة — ستُعاد المحاولة`;
    }
    if (st === 'attempting') {
      return isFr() ? `Tentative d'envoi en cours...` : `جاري محاولة الإرسال...`;
    }
    if (st === 'dispatch_uncertain') {
      return isFr()
        ? `État d'envoi incertain — non renvoyé pour éviter les doublons`
        : `حالة الإرسال غير مؤكدة — لم نعد المحاولة لتجنب التكرار`;
    }
    return isFr()
      ? `Accepté par Android (en attente de confirmation réseau${partsBadge})`
      : `قَبِل أندرويد طلب الإرسال (بانتظار تأكيد الشبكة${partsBadge})`;
  }

  function smsOpenSettings(){
    if(deynReadOnly&&deynReadOnly()){toast('وضع القراءة فقط: لا يمكن تغيير إعدادات SMS','err');return;}
    if(!requireOwner('إعدادات الرسائل النصية'))return;
    const c=cfg();
    const hideArByDefault = isFr();
    openModal(()=>`${sheetHead('إعدادات رسائل SMS')}
      <div class="sub" style="line-height:1.8">ترسل الرسائل من شريحة هاتف المالك فقط. يجب توفر رصيد SMS وشبكة الهاتف. قبول أندرويد للرسالة لا يعني تأكيد وصولها إلى هاتف الزبون.</div>
      <div class="row-set" style="margin-top:10px"><div><b>تفعيل الرسائل النصية</b><small>عند التفعيل، يتم تمكين كل الزبائن الذين لديهم رقم هاتف. يمكنك تعطيل أي زبون بشكل فردي.</small></div><label class="sw"><input type="checkbox" id="smsGlobal" ${c.enabled?'checked':''}><i></i></label></div>
      <div style="border-top:1px solid var(--line);padding-top:12px;margin-top:10px">
        <b style="font-size:13px">جدول التذكير بعد الاستحقاق</b>
        <div class="sub">الأيام الافتراضية: 1 و4 و8 و15، ويمكن تغييرها.</div>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px">${c.days.map((d,i)=>`<label style="font-size:11px;color:var(--mute)">اليوم ${i+1}<input class="inp num" id="smsDay${i}" type="number" min="1" max="90" value="${d}" style="margin-top:4px;padding:8px 5px;height:40px;text-align:center"></label>`).join('')}</div>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px">${c.times.map((t,i)=>`<label style="font-size:11px;color:var(--mute)">الساعة ${i+1}<input class="inp num" id="smsTime${i}" type="time" value="${t}" style="margin-top:4px;padding:6px 2px;height:40px;text-align:center"></label>`).join('')}</div>
      </div>
      <div style="border-top:1px solid var(--line);padding-top:12px;margin-top:12px">
        <b style="font-size:13px">فترة الإرسال والتوزيع</b>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><label class="lbl">بداية الإرسال (ثابتة)<div class="inp num" aria-label="بداية الإرسال ثابتة 09:00" style="direction:ltr;display:flex;align-items:center;justify-content:center;cursor:default;pointer-events:none;opacity:.8">09:00</div></label><label class="lbl">نهاية الإرسال (حتى 22:00)<input class="inp num" id="smsEnd" type="time" min="09:00" max="22:00" value="${c.end}" style="direction:ltr"></label></div>
        <label class="lbl">الفاصل بين الرسائل (بالدقائق)<input class="inp num" id="smsGap" type="number" min="1" max="60" value="${c.intervalMinutes}" style="direction:ltr"></label>
        <div class="sub">الافتراضي 09:00–22:00. تُرتّب الرسائل حسب أقدم دين متأخر وتُرسل بالتتابع لتجنب الإرسال الجماعي.</div>
      </div>
      <div style="border-top:1px solid var(--line);padding-top:12px;margin-top:12px">
        <b style="font-size:13px">اسم المحل في الرسالة</b>
        <label class="lbl">اسم المحل أو التاجر الذي يظهر للزبون</label>
        <input class="inp" id="smsStoreName" type="text" maxlength="80" value="${escSms(c.storeName||'')}" placeholder="مثال: محل الأمانة">
        <div class="sub">يُضاف هذا الاسم تلقائيًا مكان {store} في القالب العربي والفرنسي.</div>
      </div>
      <div style="border-top:1px solid var(--line);padding-top:12px;margin-top:12px">
        <b style="font-size:13px">قوالب الرسائل القابلة للتعديل</b>
        ${hideArByDefault ? `<button type="button" class="btn sm soft" data-act="smsToggleArTpl" style="margin-top:8px;height:32px;font-size:12px">عرض / تعديل القالب العربي</button>` : ''}
        <div id="smsTplArWrap" ${hideArByDefault ? 'hidden' : ''}>
          <label class="lbl">القالب العربي</label>
          <textarea class="inp" id="smsTplAr" maxlength="500" rows="4" style="height:auto;line-height:1.8">${escSms(c.tplAr)}</textarea>
          <div class="sub num" id="smsTplArInfo" style="font-size:11px;margin-top:2px">${escSms(smsSegmentSummary(c.tplAr))}</div>
        </div>
        <label class="lbl">القالب الفرنسي</label>
        <textarea class="inp" id="smsTplFr" maxlength="500" rows="4" style="height:auto;line-height:1.8;direction:ltr;text-align:left">${escSms(c.tplFr)}</textarea>
        <div class="sub num" id="smsTplFrInfo" style="font-size:11px;margin-top:2px">${escSms(smsSegmentSummary(c.tplFr))}</div>
        <div class="sub">المتغيرات: {title} اللقب، {name} الاسم، {amount} المبلغ، {date} تاريخ الاستحقاق، {store} اسم المحل إن كان موجودًا في ملف المتجر. الإعداد الحالي لا يحتوي على اسم متجر، لذلك لن يُضاف اسم غير موجود. الرسائل الطويلة قد تُحسب عدة وحدات SMS حسب شركة الاتصالات.</div>
      </div>
      <div style="border-top:1px solid var(--line);padding-top:12px;margin-top:12px">
        <b style="font-size:13px">اختبار الإرسال</b><label class="lbl">رقم الهاتف الذي تريد إرسال الاختبار إليه</label><input class="inp num" id="smsTestPhone" type="tel" placeholder="0555 12 34 56" style="direction:ltr;text-align:right">
        <button class="btn block" data-act="smsTest" style="margin-top:8px">إرسال رسالة تجريبية</button>
      </div>
      <div class="two" style="margin-top:14px"><button class="btn" data-act="smsHistory">سجل الرسائل</button><button class="btn pri" data-act="smsSaveSettings" data-primary>حفظ الإعدادات</button></div>`,
      {refresh:()=>{}, mount:()=>{ updateTplCounters(); }});
  }
  async function smsPermission(){const p=plug();if(!p)throw new Error(tr('ميزة SMS غير متاحة في هذه النسخة'));const s=await p.checkPermissions();if(s&&s.sms==='granted')return true;const r=await p.requestPermissions();return !!(r&&r.sms==='granted');}
  async function smsToggleGlobal(el){
    if(deynReadOnly&&deynReadOnly()){el.checked=!el.checked;return toast('وضع القراءة فقط','err');}
    if(!requireOwner('تفعيل الرسائل النصية')){el.checked=false;return;}
    if(el.checked){
      const ok=await smsPermission().catch(e=>{toast(e.message,'err');return false;});
      if(!ok){el.checked=false;toast('لم يتم منح إذن إرسال الرسائل، بقيت الميزة متوقفة','err');return;}
      cfg().enabled=true;
      // The agreed global re-enable behavior: enable every customer with a valid phone.
      (S.customers||[]).forEach(c=>{if(Core.phone(c.phone)){c.smsEnabled=true;c.smsOptOut=false;}});
      toast('تم تفعيل SMS للزبائن الذين لديهم أرقام هاتف');
    }else{cfg().enabled=false;toast('تم إيقاف جميع رسائل SMS مؤقتًا');}
    persist();smsScheduleSoon();
  }
  function smsSaveSettings(){
    if(deynReadOnly&&deynReadOnly())return toast('وضع القراءة فقط','err');
    if(!requireOwner('تعديل إعدادات الرسائل'))return;
    const c=cfg();
    const days=[0,1,2,3].map(i=>Number(lastById('smsDay'+i)?.value));
    const times=[0,1,2,3].map(i=>lastById('smsTime'+i)?.value||'');
    const start='09:00',end=lastById('smsEnd')?.value||'';
    const gap=Number(lastById('smsGap')?.value||5);
    if(days.some(x=>!Number.isInteger(x)||x<1||x>90)||new Set(days).size!==4||days.some((x,i)=>i>0&&x<=days[i-1])||times.some(x=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(x))||!/^09:00$/.test(start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(end)||end>'22:00'||end<='09:00'||!Number.isInteger(gap)||gap<1||gap>60)return toast('تحقق من الأيام والساعات والفاصل الزمني','err');
    c.days=days;c.times=times;c.start=start;c.end=end;c.intervalMinutes=gap;
    c.storeName=(lastById('smsStoreName')?.value||'').trim().slice(0,80);c.tplAr=lastById('smsTplAr')?.value.trim()||Core.DEFAULTS.tplAr;c.tplFr=lastById('smsTplFr')?.value.trim()||Core.DEFAULTS.tplFr;if(c.tplAr.length>500||c.tplFr.length>500)return toast('القالب طويل جدًا — الحد الأقصى 500 حرف لكل لغة','err');
    persist();smsScheduleSoon();closeModal();toast('تم حفظ إعدادات SMS بنجاح');
  }
  async function smsTest(){
    if(deynReadOnly&&deynReadOnly())return toast('وضع القراءة فقط: لا يمكن إرسال SMS','err');
    const p=plug();if(!p)return toast('الإرسال متاح داخل تطبيق أندرويد فقط','err');
    const to=Core.phone(lastById('smsTestPhone')?.value);if(!to)return toast('أدخل رقم هاتف صحيحًا','err');
    try{
      if(!(await smsPermission()))return toast('إذن SMS غير ممنوح','err');
      const nowLabel=Core.dateLabel(Date.now());
      const message=isFr()?`DEYN : Test SMS réussi - ${nowLabel}`:Core.testMessage(nowLabel);
      const testId='test-'+Date.now();
      const r=await p.send({id:testId,phone:to,message});
      if(!S.smsLog)S.smsLog={};
      const rec=Core.reconcileStatus(S.smsLog[testId],r||{status:'accepted_by_android'},{customerName:isFr()?'Test SMS':'رسالة تجريبية',phone:to});
      S.smsLog[testId]=rec;
      persist();
      if(rec.status==='delivered'){
        toast('تم إرسال رسالة الاختبار وتأكيد تسليمها إلى الهاتف','ok');
      }else if(rec.status==='sent_to_network'){
        toast('تم إرسال رسالة الاختبار إلى الشبكة بنجاح','ok');
      }else if(rec.status==='partial_failure'){
        toast(`فشل جزئي في إرسال الاختبار (${rec.partsSent}/${rec.partsTotal})`,'err');
      }else if(rec.status==='failed'){
        toast('فشل إرسال رسالة الاختبار إلى الشبكة','err');
      }else if(r&&r.duplicate){
        toast('رسالة الاختبار سبق إرسالها','warn');
      }else{
        toast('قَبِل أندرويد طلب الإرسال وبانتظار تأكيد الشبكة','warn');
      }
    }catch(e){toast(tr('تعذر إرسال الاختبار:')+' '+(e.message||e),'err');}
  }
  function smsHistory(){
    const validStatuses=new Set(['attempting','accepted_by_android','sent_to_network','delivered','partial_failure','failed','dispatch_uncertain']);
    const rows=Object.entries(S.smsLog||{}).filter(([k,v])=>v&&validStatuses.has(v.status)&&!v.internal).sort((a,b)=>(Number((b[1]&&b[1].at)||b[1])||0)-(Number((a[1]&&a[1].at)||a[1])||0)).slice(0,60);
    openModal(()=>`${sheetHead('سجل رسائل SMS')}<div class="sub">يميز السجل بين قبول أندرويد، ونجاح إرسال كل الأجزاء للشبكة، وتأكيد التسليم، والفشل الجزئي أو الكلي.</div>${rows.length?rows.map(([k,v])=>{
      const isBad = v&&['dispatch_uncertain','partial_failure','failed'].includes(v.status);
      const isPending = v&&['attempting','accepted_by_android'].includes(v.status);
      const icon = v&&v.status==='delivered'?'✓✓':(v&&v.status==='sent_to_network'?'✓':(isPending?'⏳':(v&&v.status==='failed'?'✕':'!')));
      const cls = isBad ? 'debt' : 'pay';
      return `<div class="tx"><div class="tx-ic ${cls}">${icon}</div><div class="tx-m"><b>${escSms(v&&v.customerName||k)}</b><small>${escSms(smsStatusLabel(v))} • ${escSms(fmtDate(Number(v&&v.at)||Number(v)||0))}</small></div><div class="tx-a"><small class="num">${escSms(v&&v.phone||'')}</small></div></div>`;
    }).join(''):'<div class="empty-st" style="padding:22px">لا توجد رسائل في السجل بعد</div>'}`);
  }
  function smsScheduleSoon(){clearTimeout(syncTimer);syncTimer=setTimeout(()=>{if(syncBusy){smsScheduleSoon();return;}smsSchedule();},100);}
  async function smsSchedule(){
    const p=plug();if(!p||syncBusy||!S)return;
    syncBusy=true;
    try{
      if(isWorkerDevice()||!cfg().enabled){await p.schedule({items:[]});if(S.smsQueueMeta&&Object.keys(S.smsQueueMeta).length){S.smsQueueMeta={};try{originalPersist();if(typeof deynFlush==='function')await deynFlush();}catch(e){console.warn('SMS queue metadata cleanup',e);}}return;}
      const permission=await p.checkPermissions();
      if(!permission||permission.sms!=='granted'){cfg().enabled=false;await p.schedule({items:[]});persist();toast('تم إيقاف SMS لأن إذن الرسائل غير متاح','err');return;}
      if(!S.smsLog)S.smsLog={};if(!S.smsQueueMeta)S.smsQueueMeta={};
      const metaBefore=JSON.stringify(S.smsQueueMeta);let changed=false;
      try{
        const sent=await p.getSent();
        const rawItems=(sent&&sent.items)||((sent&&sent.ids)||[]).map(id=>({id,acceptedAt:Date.now(),status:'sent_to_network',sent:true,partsTotal:1,partsSent:1,partsFailed:0}));
        const uncertain=(sent&&sent.uncertain)||[];
        const failed=(sent&&sent.failed)||[];
        const byId=new Map();
        for(const item of rawItems.concat(uncertain,failed)){
          if(item&&item.id)byId.set(item.id,item);
        }
        for(const [id,item] of byId){
          if(!id)continue;
          if(id.startsWith('test-')){
            if(S.smsLog[id]){
              const nextRec=Core.reconcileStatus(S.smsLog[id],item,{customerName:S.smsLog[id].customerName,phone:S.smsLog[id].phone});
              if(JSON.stringify(nextRec)!==JSON.stringify(S.smsLog[id])){S.smsLog[id]=nextRec;changed=true;}
            }
            continue;
          }
          const prev=S.smsLog[id];
          const meta=S.smsQueueMeta[id]||(prev&&{eventKeys:prev.eventKeys,customerName:prev.customerName,phone:prev.phone})||{};
          const rec=Core.reconcileStatus(prev,item,meta);
          if(Array.isArray(meta.eventKeys))rec.eventKeys=meta.eventKeys;
          if(!prev||JSON.stringify(prev)!==JSON.stringify(rec)){
            S.smsLog[id]=rec;
            for(const k of meta.eventKeys||[]){
              if(rec.status==='failed'){
                delete S.smsLog[k];
              }else{
                S.smsLog[k]=Object.assign({},rec,{internal:true});
              }
            }
            changed=true;
          }
          if(['sent_to_network','delivered','partial_failure','dispatch_uncertain'].includes(rec.status)){
            delete S.smsQueueMeta[id];
          }
        }
      }catch(e){console.warn('SMS history sync',e);}
      const now=Date.now();const queue=Core.buildQueue(S,now);
      const active=new Set(queue.map(x=>x.id));
      for(const id of Object.keys(S.smsQueueMeta)){
        const existing=S.smsLog[id];
        if(!active.has(id)&&(!existing||!['attempting','accepted_by_android'].includes(existing.status)))delete S.smsQueueMeta[id];
      }
      for(const item of queue){S.smsQueueMeta[item.id]={eventKeys:item.eventKeys,customerName:((S.customers||[]).find(c=>c.id===item.cid)||{}).name||'',phone:item.phone};}
      const metaChanged=metaBefore!==JSON.stringify(S.smsQueueMeta);let durable=true;if(changed||queue.length||metaChanged){try{const saved=originalPersist();if(saved===false)durable=false;else if(typeof deynFlush==='function')await deynFlush();}catch(e){durable=false;console.warn('SMS state flush failed',e);}}
      if(!durable){await p.schedule({items:[]});return;}
      const items=queue.filter(x=>!Core.isLogBlocking(S.smsLog[x.id])&&(x.at>now||Core.validateBeforeSend(S,x,now).ok)).map(x=>({id:x.id,phone:x.phone,message:x.message,at:x.at,gapMinutes:x.gapMinutes}));
      await p.schedule({items});
    }catch(e){console.warn('SMS queue update failed',e);}
    finally{syncBusy=false;}
  }
  function smsExtendHtml(c){
    const rows=Core.ledger(c);
    if(!rows.length)return '';
    return `<div style="background:#f7faf9;border:1px solid var(--line);border-radius:14px;padding:12px;margin-top:12px"><label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700"><input id="mExtendEnabled" type="checkbox" style="width:18px;height:18px"> تمديد موعد دين بعد هذه الدفعة (اختياري)</label><div class="sub">يُمدد الدين الذي تختاره فقط، مع الاحتفاظ بتاريخ الموعد السابق وسجل التمديد.</div><label class="lbl">الدين المراد تمديده</label><select class="inp" id="mExtendDebt">${rows.map(x=>`<option value="${escSms(x.debt.id)}">${escSms(x.debt.note||'دين')} • ${fmt(x.remaining)} دج • ${fmtDate(x.dueAt)}</option>`).join('')}</select><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><label class="lbl">المدة<input class="inp num" id="mExtendValue" type="number" min="1" max="365" value="7" style="direction:ltr"></label><label class="lbl">الوحدة<select class="inp" id="mExtendUnit"><option value="days">أيام</option><option value="weeks">أسابيع</option><option value="months">أشهر</option></select></label></div></div>`;
  }
  // Extend the existing customer form with owner-only contact preferences.
  const originalOpenCustForm=openCustForm;
  openCustForm=function(id,seg){
    originalOpenCustForm(id,seg);
    if(isWorkerDevice())return;
    const c=id?cust(id):null;
    const sheet=document.querySelector('#modalRoot .ovl:last-child .sheet');
    if(!sheet||sheet.querySelector('#fSmsLang'))return;
    const anchor=sheet.querySelector('#fPhone');
    const block=document.createElement('div');
    block.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><label class="lbl">اللقب<select class="inp" id="fHonorific"><option value="" ${!c?.honorific?'selected':''}>بدون لقب</option><option value="monsieur" ${c?.honorific==='monsieur'?'selected':''}>السيد / Monsieur</option><option value="madame" ${c?.honorific==='madame'?'selected':''}>السيدة / Madame</option></select></label><label class="lbl">لغة الرسالة<select class="inp" id="fSmsLang"><option value="auto" ${!c?.smsLang||c?.smsLang==='auto'?'selected':''}>تلقائي (عربي)</option><option value="ar" ${c?.smsLang==='ar'?'selected':''}>العربية</option><option value="fr" ${c?.smsLang==='fr'?'selected':''}>Français</option></select></label></div><label style="display:flex;align-items:center;gap:8px;font-size:12px;margin:8px 0"><input id="fSmsEnabled" type="checkbox" style="width:18px;height:18px" ${(!c||(!c.smsOptOut&&c.smsEnabled!==false))?'checked':''} ${c?.smsOptOut?'data-user-touched="1"':''}> السماح بإرسال تذكيرات SMS لهذا الزبون</label>`;
    anchor?.after(block);
    if(typeof DEYN_I18N!=='undefined'&&typeof DEYN_I18N.translateRoot==='function')DEYN_I18N.translateRoot(block);
  };
  const originalSaveCust=saveCust;
  saveCust=function(){
    if(isWorkerDevice())return originalSaveCust();
    const editId=CF&&CF.id?CF.id:null, beforeCount=(S.customers||[]).length;
    const phoneVal=lastById('fPhone')?.value.trim()||'';
    const honorific=lastById('fHonorific')?.value||'';const smsLang=lastById('fSmsLang')?.value||'auto';const hasPhone=!!Core.phone(phoneVal);const smsChecked=!!lastById('fSmsEnabled')?.checked;const smsOptOut=hasPhone?!smsChecked:!!(cust(editId||'')||{}).smsOptOut;const smsEnabled=hasPhone&&!smsOptOut;
    const activeModal=stack[stack.length-1];originalSaveCust();
    if(activeModal&&stack.includes(activeModal))return;
    const updated=editId?cust(editId):((S.customers||[]).length>beforeCount?S.customers[S.customers.length-1]:null);
    if(updated){updated.honorific=honorific;updated.smsLang=smsLang;updated.smsEnabled=smsEnabled;updated.smsOptOut=smsOptOut;persist();smsScheduleSoon();}
  };
  const originalOpenMoney=openMoney;
  openMoney=function(cid,kind){
    originalOpenMoney(cid,kind);
    const c=cust(cid),sheet=document.querySelector('#modalRoot .ovl:last-child .sheet');if(!c||!sheet)return;
    if(kind==='debt'&&!sheet.querySelector('#mDueAt')){const label=document.createElement('div');const due=Core.nextMonthlyDue(Date.now(),c.payDay);label.innerHTML=`<label class="lbl" for="mDueAt">موعد استحقاق هذا الدين (اختياري)</label><input class="inp" id="mDueAt" type="date" value="${isoDate(due)}"><div class="sub">إذا تركته فارغًا فلن تُرسل تذكيرات تلقائية لهذا الدين حتى تحدد موعدًا. الزبائن ذوو يوم السداد الشهري يحصلون على الموعد التالي تلقائيًا.</div>`;sheet.querySelector('#mNote')?.before(label);}
    if(kind==='pay'&&!sheet.querySelector('#mNewDueAt')){const due=Core.nextMonthlyDue(Date.now(),c.payDay);const box=document.createElement('div');box.innerHTML=`<label class="lbl">موعد استحقاق السلعة الجديدة (اختياري)</label><input class="inp" id="mNewDueAt" type="date" value="${isoDate(due)}">`;sheet.querySelector('#mNewDebt')?.after(box);}
    if(kind==='pay'&&!sheet.querySelector('#mExtendEnabled'))sheet.querySelector('#mNote')?.before(Object.assign(document.createElement('div'),{innerHTML:smsExtendHtml(c)}));
    if(typeof DEYN_I18N!=='undefined'&&typeof DEYN_I18N.translateRoot==='function')DEYN_I18N.translateRoot(sheet);
  };
  const originalConfirmMoney=confirmMoney;
  confirmMoney=function(){
    const c=MM&&cust(MM.cid);if(!c)return originalConfirmMoney();
    const kind=MM.kind;const amount=round2(parseAmt(lastById('mAmt')?.value||'0'));
    let extension=null;
    if(kind==='pay'&&lastById('mExtendEnabled')?.checked){
      const extra=round2(parseAmt(lastById('mNewDebt')?.value||'0'));
      if(!(amount>0))return toast('أدخل مبلغ التسديد أولاً قبل تمديد الموعد','err');
      if(amount>bal(c)+extra+0.001)return toast('مبلغ التسديد أكبر من مجموع الدين والسلعة الجديدة','err');
      const debtId=lastById('mExtendDebt')?.value,n=Number(lastById('mExtendValue')?.value),unit=lastById('mExtendUnit')?.value;
      if(!debtId||!Number.isInteger(n)||n<1||n>365||!['days','weeks','months'].includes(unit))return toast('تحقق من مدة التمديد','err');
      const target=Core.ledger(c).find(x=>x.debt.id===debtId);const used=Core.allocatePayment(c,amount).filter(x=>x.debtId===debtId).reduce((a,x)=>a+x.amount,0);
      if(!target||target.remaining-used<=0.001)return toast('هذا الدين سيتم تسويته بالكامل بهذه الدفعة، اختر دينًا سيبقى منه رصيد','err');
      try{extension=Core.extendDebt(c,debtId,n,unit,Date.now());}catch(e){return toast(tr(e.message),'err');}
    }
    const oldAddTx=addTx;
    addTx=function(customer,type,amt,note,extra){
      if(type==='pay')return oldAddTx(customer,type,amt,note,Object.assign({},extra||{},{allocations:Core.allocatePayment(customer,amt)}));
      if(type==='debt'){const due=fromDate(lastById(kind==='pay'?'mNewDueAt':'mDueAt')?.value);return oldAddTx(customer,type,amt,note,Object.assign({},extra||{},due?{dueAt:due}:{}));}
      return oldAddTx(customer,type,amt,note,extra);
    };
    try{originalConfirmMoney();}finally{addTx=oldAddTx;}
    if(extension){const log=c.tx.find(t=>t.type==='debt'&&t.id===extension.debtId);if(log){log.dueAt=extension.to;persist();}}
    smsScheduleSoon();
  };
  // Persisted app changes always rebuild/cancel the native queue. This prevents stale scheduled work after edits/payments.
  const originalPersist=persist;
  persist=function(){const r=originalPersist.apply(this,arguments);smsScheduleSoon();return r;};
  const guard=fn=>function(){if(deynReadOnly&&deynReadOnly()){toast('وضع القراءة فقط 🔒','err');return;}return fn.apply(this,arguments);};
  A.smsSettings=guard(smsOpenSettings);A.smsSaveSettings=guard(smsSaveSettings);A.smsTest=guard(smsTest);A.smsHistory=smsHistory;A.saveCust=guard(saveCust);A.mmok=guard(confirmMoney);
  A.smsToggleArTpl=()=>{const w=lastById('smsTplArWrap');if(w)w.hidden=!w.hidden;};
  if(typeof READONLY_OK!=='undefined'&&READONLY_OK&&typeof READONLY_OK.add==='function'){READONLY_OK.add('smsHistory');}
  document.addEventListener('change',e=>{if(e.target&&e.target.id==='smsGlobal')smsToggleGlobal(e.target);});
  document.addEventListener('change',e=>{if(e.target&&e.target.id==='fSmsEnabled')e.target.dataset.userTouched='1';});
  document.addEventListener('input',e=>{
    if(e.target&&(e.target.id==='smsTplAr'||e.target.id==='smsTplFr'))updateTplCounters();
    if(e.target&&e.target.id==='fPhone'&&cfg().enabled){const cb=lastById('fSmsEnabled');const c=CF&&CF.id?cust(CF.id):null;if(cb&&!cb.dataset.userTouched&&!c?.smsOptOut&&Core.phone(e.target.value))cb.checked=true;}
  });

  document.addEventListener('DOMContentLoaded',smsScheduleSoon);
  window.addEventListener('pageshow',smsScheduleSoon);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)smsScheduleSoon();});
  setTimeout(smsScheduleSoon,1200);
})();
```

================================================================================
## [26/31] FILE: `sms/test.mjs`

- **المسار الأصلي**: `sms/test.mjs`
- **الحجم**: `16,176` بايت | **الأسطر**: `143` | **SHA-256**: `0ae5dcb3da0853f355785f65592b6b90fcba618c0de0da89aec6361209b664c9`

```javascript
import fs from 'node:fs'; import vm from 'node:vm'; import assert from 'node:assert/strict';
const context={globalThis:{},Date,Map,Set,Math,Number,String,Array,Object,JSON,RegExp}; context.window=context.globalThis; vm.createContext(context); vm.runInContext(fs.readFileSync(new URL('./engine.js',import.meta.url),'utf8'),context); const C=context.globalThis.DeynSmsCore;
const c={id:'c1',name:'Ali',phone:'0555123456',payDay:null,tx:[{id:'d1',type:'debt',amount:1000,ts:1000,dueAt:100000},{id:'d2',type:'debt',amount:500,ts:2000,dueAt:200000},{id:'p1',type:'pay',amount:700,ts:3000}]};
assert.deepEqual(JSON.parse(JSON.stringify(C.ledger(c).map(x=>[x.debt.id,x.remaining]))),[['d1',300],['d2',500]]);
const a=C.allocatePayment(c,400); assert.equal(a[0].debtId,'d1'); assert.equal(a[0].amount,300); assert.equal(a[1].debtId,'d2'); assert.equal(a[1].amount,100);
const before=C.ledger(c)[0].dueAt; const ex=C.extendDebt(c,'d2',2,'weeks',999); assert.equal(ex.to,200000+14*86400000); assert.equal(c.tx[1].extensionHistory.length,1);
const now=Date.now(); const due=now-2*86400000; const S={settings:{sms:{enabled:true}},customers:[{id:'x',name:'A',phone:'0555123456',smsEnabled:true,honorific:'monsieur',smsLang:'ar',tx:[{id:'dx',type:'debt',amount:100,ts:now-4*86400000,dueAt:due}]}],smsLog:{}};
const q=C.buildQueue(S,now); assert.equal(q.length,4); assert.equal(q[0].phone,'+213555123456'); assert.equal(C.phone('213555123456'),'+213555123456'); assert.match(q[0].message,/السيد/); assert.equal(C.validateBeforeSend(S,q[0],now).ok,true);
S.customers[0].smsEnabled=false; assert.equal(C.validateBeforeSend(S,q[0],now).reason,'customer-disabled'); S.customers[0].smsEnabled=true; S.customers[0].tx[0].amount=150; assert.equal(C.validateBeforeSend(S,q[0],now).reason,'amount-changed');
console.log('SMS core: allocation, extension, queue, phone normalization, templates, send-time validation passed');
// Explicit FIFO allocation is stable; a later debt is credited by a payment remainder only when needed.
const mixed={id:'m',tx:[{id:'old',type:'debt',amount:100,ts:10,dueAt:1000},{id:'pay',type:'pay',amount:150,ts:20,allocations:[{debtId:'old',amount:100}]},{id:'new',type:'debt',amount:200,ts:21,dueAt:2000}]};
assert.equal(C.ledger(mixed)[0].debt.id,'new'); assert.equal(C.ledger(mixed)[0].remaining,150);
// Old overdue backlog gets one catch-up reminder, not four simultaneous messages.
const oldNow=new Date(2026,10,12,12,0,0).getTime();
const oldS={settings:{sms:{enabled:true}},customers:[{id:'old-c',name:'Old',phone:'0661123456',tx:[{id:'old-d',type:'debt',amount:50,ts:oldNow-40*86400000,dueAt:oldNow-30*86400000}]}],smsLog:{}};
const oldQ=C.buildQueue(oldS,oldNow); assert.equal(oldQ.length,1); assert.equal(oldQ[0].step,4);
oldS.smsLog[oldQ[0].eventKeys[0]]={status:'accepted_by_android'}; assert.equal(C.buildQueue(oldS,oldNow).length,0);
// A large backlog compresses its interval but remains sequential and inside the allowed hours.
const many={settings:{sms:{enabled:true,intervalMinutes:5}},customers:[],smsLog:{}};
for(let i=0;i<80;i++)many.customers.push({id:'c'+i,name:'C'+i,phone:'0555123456',tx:[{id:'d'+i,type:'debt',amount:10,ts:oldNow-20*86400000,dueAt:oldNow-18*86400000}]});
const mq=C.buildQueue(many,new Date(2026,10,12,8,0,0).getTime());
assert.equal(mq.length,80); assert.ok(mq.every((x,i)=>i===0||x.at>mq[i-1].at));
assert.ok(mq.every(x=>{const d=new Date(x.at);return d.getHours()>=9&&d.getHours()<22;}));
console.log('SMS edge cases: old ledger, overpayment credit, backlog catch-up, dedupe, queue window passed');
// Global/customer switches and same-window debt grouping.
const comboNow=new Date(2026,10,12,12,0,0).getTime();
const combo={settings:{sms:{enabled:true}},customers:[{id:'combo',name:'Combo',phone:'0770123456',smsEnabled:true,tx:[{id:'ca',type:'debt',amount:120,ts:comboNow-10*86400000,dueAt:comboNow-5*86400000},{id:'cb',type:'debt',amount:80,ts:comboNow-9*86400000,dueAt:comboNow-5*86400000}]}],smsLog:{}};
const cq=C.buildQueue(combo,comboNow); const catchup=cq.find(x=>x.at<=comboNow+1000); assert.ok(catchup); assert.equal(catchup.amount,200); assert.equal(catchup.debtIds.length,2);
combo.settings.sms.enabled=false; assert.equal(C.buildQueue(combo,comboNow).length,0); combo.settings.sms.enabled=true; combo.customers[0].smsEnabled=false; assert.equal(C.buildQueue(combo,comboNow).length,0);
// Legacy FIFO allocation is derived without mutating the historical ledger.
const legacy={tx:[{id:'l1',type:'debt',amount:900,ts:1},{id:'l2',type:'pay',amount:250,ts:2}]}; const beforeLegacy=JSON.stringify(legacy); assert.equal(C.ledger(legacy)[0].remaining,650); assert.equal(JSON.stringify(legacy),beforeLegacy);
// Monthly legacy due-date derivation uses the customer's existing pay-day, without rewriting old events.
const monthly={payDay:20,tx:[{id:'m1',type:'debt',amount:100,ts:new Date(2026,10,10).getTime()}]}; assert.ok(C.ledger(monthly)[0].dueAt>monthly.tx[0].ts); assert.equal(monthly.tx[0].dueAt,undefined);
console.log('SMS integration cases: global/per-customer controls, debt aggregation and legacy non-mutation passed');
// Extending a debt starts a new reminder cycle for that debt while preserving its old reminder history.
const extNow=new Date(2026,10,12,12,0,0).getTime();
const extState={settings:{sms:{enabled:true}},customers:[{id:'ext',name:'Extend',phone:'0555123456',tx:[{id:'ed',type:'debt',amount:400,ts:extNow-40*86400000,dueAt:extNow-30*86400000}]}],smsLog:{}};
const oldReminder=C.buildQueue(extState,extNow)[0]; extState.smsLog[oldReminder.eventKeys[0]]={status:'accepted_by_android'}; extState.smsLog[oldReminder.key]={status:'accepted_by_android'};
C.extendDebt(extState.customers[0],'ed',40,'days',extNow);
const afterExtend=C.buildQueue(extState,extNow); assert.equal(afterExtend.length,4); assert.ok(afterExtend.every(x=>x.id!==oldReminder.id));
console.log('SMS extension reschedule: a new due-date cycle is not blocked by old reminder keys');
// Different reminder stages that are both already due are combined into one SMS for the same customer.
const mixedStep={settings:{sms:{enabled:true}},customers:[{id:'mix',name:'Mix',phone:'0555123456',tx:[{id:'a',type:'debt',amount:100,ts:comboNow-10*86400000,dueAt:comboNow-2*86400000},{id:'b',type:'debt',amount:200,ts:comboNow-12*86400000,dueAt:comboNow-5*86400000}]}],smsLog:{}};
const mixQueue=C.buildQueue(mixedStep,comboNow).filter(x=>x.at<=comboNow+1000); assert.equal(mixQueue.length,1); assert.equal(mixQueue[0].amount,300); assert.equal(mixQueue[0].events.length,2);
console.log('SMS aggregation: overdue debts from different reminder stages are combined without suppression');

// An uncertain native dispatch remains suppressed to avoid accidental duplicate texts.
const uncertainState={settings:{sms:{enabled:true}},customers:[{id:'u',name:'U',phone:'0555123456',tx:[{id:'ud',type:'debt',amount:10,ts:comboNow-10*86400000,dueAt:comboNow-5*86400000}]}],smsLog:{}};const uq=C.buildQueue(uncertainState,comboNow)[0];uncertainState.smsLog[uq.eventKeys[0]]={status:'dispatch_uncertain'};assert.equal(C.buildQueue(uncertainState,comboNow).filter(x=>x.at<=comboNow+1000).length,0);console.log('SMS uncertain dispatch: duplicate suppression remains active');

// Corrupt/partial stored settings fall back to safe defaults rather than silently disabling the queue.
const safe=C.config({days:[],times:[],start:'00:00',end:'23:59',intervalMinutes:999});assert.deepEqual(JSON.parse(JSON.stringify(safe.days)),[1,4,8,15]);assert.deepEqual(JSON.parse(JSON.stringify(safe.times)),['10:00','11:00','16:00','10:00']);assert.equal(safe.start,'09:00');assert.equal(safe.end,'22:00');assert.equal(safe.intervalMinutes,60);console.log('SMS settings recovery: malformed stored configuration falls back safely');

// Group IDs stay compact even when one customer has a large number of debt events.
const bulk={settings:{sms:{enabled:true}},customers:[{id:'bulk',name:'Bulk',phone:'0555123456',tx:Array.from({length:250},(_,i)=>({id:'debt-'+i,type:'debt',amount:1,ts:comboNow-20*86400000,dueAt:comboNow-10*86400000}))}],smsLog:{}};const bulkQ=C.buildQueue(bulk,comboNow);assert.ok(bulkQ.every(x=>x.id.length<100));console.log('SMS queue IDs: large grouped reminders keep compact idempotency keys');

// Explicit per-customer opt-out remains effective independently of the global switch.
const opted={settings:{sms:{enabled:true}},customers:[{id:'opt',name:'Opt',phone:'0555123456',smsEnabled:true,smsOptOut:true,tx:[{id:'od',type:'debt',amount:100,ts:comboNow-10*86400000,dueAt:comboNow-5*86400000}]}],smsLog:{}};assert.equal(C.buildQueue(opted,comboNow).length,0);console.log('SMS opt-out: explicit customer opt-out overrides an enabled global setting');

// A debt due at the end of yesterday must trigger at the configured time today (not wait 24 elapsed hours).
const exactDue=new Date(2026,10,11,23,59,59,999).getTime();
const exactNow=new Date(2026,10,12,14,15,0).getTime();
const exactState={settings:{sms:{enabled:true,days:[1,4,8,15],times:['14:15','11:00','16:00','10:00']}},customers:[{id:'exact',name:'Exact',phone:'0555123456',tx:[{id:'exact-debt',type:'debt',amount:75,ts:exactDue-3*86400000,dueAt:exactDue}]}],smsLog:{}};
const exactQueue=C.buildQueue(exactState,exactNow);const exactReminder=exactQueue.find(x=>x.step===1);assert.ok(exactReminder);assert.equal(exactReminder.at,exactNow);assert.equal(C.validateBeforeSend(exactState,exactReminder,exactNow).ok,true);
console.log('Calendar-time regression: day-1 reminder at 14:15 fires despite dueAt being stored at 23:59');
const named={settings:{sms:{enabled:true,storeName:'محل الأمانة'}},customers:[{id:'named',name:'Test',phone:'0555123456',tx:[{id:'nd',type:'debt',amount:30,ts:exactDue-3*86400000,dueAt:exactDue}]}],smsLog:{}};
assert.match(C.buildQueue(named,exactNow)[0].message,/محل الأمانة/);
console.log('Store name regression: configured merchant name is inserted into reminder template');

// The default Arabic reminder and dedicated test stay within one Unicode SMS segment for typical values.
assert.ok(C.DEFAULTS.tplAr.length < 70, 'compact default Arabic template should fit a single Unicode segment before variable expansion');
assert.ok(C.testMessage('12/11/2026').length <= 70, 'Arabic test SMS must fit one Unicode segment');
assert.match(C.testMessage('12/11/2026'), /اختبار SMS ناجح/);
console.log('SMS delivery regression: short default template and single-part test message passed');

const oldDefaultAr='السلام عليكم {title} {name}، نذكّركم بأن عليكم مبلغ {amount} دج مستحق منذ {date}. نرجو التسوية عند الإمكان. شكرًا لكم 😊';
const oldDefaultFr='Bonjour {title} {name}, nous vous rappelons que votre solde de {amount} DA est dû depuis le {date}. Merci de régulariser dès que possible 😊';
const migrated=C.config({tplAr:oldDefaultAr,tplFr:oldDefaultFr});
assert.equal(migrated.tplAr,C.DEFAULTS.tplAr,'existing installs migrate the shipped Arabic default to the compact template');
assert.equal(migrated.tplFr,C.DEFAULTS.tplFr,'existing installs migrate the shipped French default to the compact template');
assert.equal(C.config({tplAr:'قالب مخصص'}).tplAr,'قالب مخصص','owner custom templates must not be overwritten');
const sampleReminder=C.DEFAULTS.tplAr.replace('{title}','السيد').replace('{name}','علي').replace('{amount}','1,000').replace('{date}','12/11/2026');
assert.ok(sampleReminder.length<=70,'typical Arabic reminder must fit one Unicode SMS segment');
console.log('SMS template migration: old defaults upgraded, custom templates preserved, typical reminder is one part');

// ============================================================================
// NEW TESTS: Long multi-part Arabic SMS segmentation & per-part result tracking
// ============================================================================
const longCustomArTpl = 'السلام عليكم ورحمة الله وبركاته {title} {name}، نحيطكم علماً بأن رصيد دينكم الحالي في {store} قد بلغ {amount} دج وهو مستحق السداد منذ تاريخ {date}. نرجو منكم التكرم بتسوية الوضعية في أقرب وقت ممكن وشكراً جزيلاً لثقتكم وتعاونكم الدائم معنا.';
const longState = {
  settings: { sms: { enabled: true, tplAr: longCustomArTpl, storeName: 'سوبرماركت الأمانة والوفاء' } },
  customers: [{ id: 'long-cust', name: 'عبد الرحمان بن بوزيد', phone: '0555987654', honorific: 'monsieur', smsLang: 'ar', tx: [{ id: 'ld1', type: 'debt', amount: 14250, ts: exactDue - 5 * 86400000, dueAt: exactDue }] }],
  smsLog: {}
};
const longQueue = C.buildQueue(longState, exactNow);
assert.ok(longQueue.length >= 1, 'long Arabic reminder should be queued');
const longItem = longQueue[0];
assert.equal(longItem.encoding, 'UCS-2', 'Arabic message must use UCS-2 encoding');
assert.ok(longItem.partsCount >= 3, `expected at least 3 UCS-2 segments for long custom Arabic message, got ${longItem.partsCount}`);
assert.equal(longItem.parts.length, longItem.partsCount, 'parts array length must match partsCount');
assert.equal(longItem.parts.join(''), longItem.message, 'concatenating all parts must reconstruct the exact original Arabic message without any lost character');
assert.ok(longItem.parts.every(p => p.length <= 67), 'every UCS-2 multipart segment must be <= 67 UTF-16 code units');

// Verify status lifecycle: attempting -> accepted_by_android -> partial_failure vs sent_to_network -> delivered
const meta = { customerName: 'عبد الرحمان بن بوزيد', phone: longItem.phone };
const stAttempting = C.reconcileStatus(null, { status: 'attempting', partsTotal: longItem.partsCount, partsSent: 0, partsFailed: 0 }, meta);
assert.equal(stAttempting.status, 'attempting');
assert.equal(stAttempting.sent, false);

const stAccepted = C.reconcileStatus(stAttempting, { status: 'accepted_by_android', partsTotal: longItem.partsCount, partsSent: 0, partsFailed: 0 }, meta);
assert.equal(stAccepted.status, 'accepted_by_android');
assert.equal(stAccepted.sent, false, 'accepted_by_android alone must NOT mark sent=true');

// Partial failure: 2 of 3 parts sent, 1 part failed -> MUST NOT be recorded as full success!
const stPartial = C.reconcileStatus(stAccepted, {
  status: 'sent_to_network', // even if caller passed sent_to_network erroneously
  partsTotal: 3,
  partsSent: 2,
  partsFailed: 1
}, meta);
assert.equal(stPartial.status, 'partial_failure', 'failure of 1 part in a 3-part SMS must be recorded as partial_failure');
assert.equal(stPartial.sent, false, 'partial_failure must NEVER set sent=true');
assert.equal(stPartial.partsSent, 2);
assert.equal(stPartial.partsFailed, 1);

// Complete failure: 0 of 3 parts sent -> recorded as failed and does NOT block retry in buildQueue
const stFailed = C.reconcileStatus(stAccepted, { status: 'failed', partsTotal: 3, partsSent: 0, partsFailed: 3 }, meta);
assert.equal(stFailed.status, 'failed');
assert.equal(stFailed.sent, false);
assert.equal(C.isLogBlocking(stFailed), false, 'a completely failed SMS (0 parts sent) must allow retry');

// Full multi-part network success: 3 of 3 parts sent, 0 failed -> sent_to_network (sent=true)
const stAllSent = C.reconcileStatus(stAccepted, { status: 'sent_to_network', partsTotal: 3, partsSent: 3, partsFailed: 0 }, meta);
assert.equal(stAllSent.status, 'sent_to_network');
assert.equal(stAllSent.sent, true, 'all 3 parts confirmed sent to network sets sent=true');
assert.equal(stAllSent.delivered, false);

// Full multi-part carrier delivery confirmation: 3 of 3 parts delivered -> delivered (sent=true, delivered=true)
const stDelivered = C.reconcileStatus(stAllSent, { status: 'delivered', partsTotal: 3, partsSent: 3, partsFailed: 0, partsDelivered: 3 }, meta);
assert.equal(stDelivered.status, 'delivered');
assert.equal(stDelivered.sent, true);
assert.equal(stDelivered.delivered, true);
console.log('SMS multipart & per-part status verification: 3-part Arabic segmentation, partial failure rejection, retry on full failure, and network/delivery confirmation passed');
```

================================================================================
## [27/31] FILE: `sync/session.js`

- **المسار الأصلي**: `sync/session.js`
- **الحجم**: `13,521` بايت | **الأسطر**: `162` | **SHA-256**: `3c3d7e008c19cdf887cbc86e374b9eb6cd8be1319a9f3f91436f5b0bce573683`

```javascript
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
```

================================================================================
## [28/31] FILE: `tests/e2e/test_auth.py`

- **المسار الأصلي**: `tests/e2e/test_auth.py`
- **الحجم**: `11,498` بايت | **الأسطر**: `142` | **SHA-256**: `69c986f8d4b0546cfb6b81c70a90224fec2a6495e9aa8ed452c0085449de01a1`

```python
import json, sys, time
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from harness import *

R = Results()
site = Site()
LEGACY_DEFAULT = "fc" + "b1899"   # built at runtime only so this test file is not itself a source of the literal in the app

def state(pg): return pg.evaluate("JSON.parse(localStorage.getItem('deyn.v1'))")
def set_state(pg, fn_js): pg.evaluate("(()=>{const s=JSON.parse(localStorage.getItem('deyn.v1'));"+fn_js+";localStorage.setItem('deyn.v1',JSON.stringify(s));})()")
def balances(pg): return pg.evaluate("S.customers.map(c=>[c.name,bal(c),c.tx.length])")
def toast(pg): return pg.inner_text("#toast").strip()

def boot_owner(env):
    pg = env.new_app(); dev = env.dev_id(pg)
    env.activate(pg, env.license(dev, "LT", "M"))
    assert env.started(pg), env.gate_err(pg)
    pg.wait_for_timeout(1200)
    return pg, dev

env = Env(site)
try:
    # ---------- fresh install ----------
    pg, dev = boot_owner(env)
    st = state(pg)
    R.check("fresh install: no plaintext/default password stored", 'masterPass' not in st['auth'] and LEGACY_DEFAULT not in json.dumps(st))
    R.check("fresh install: owner is asked to set a password (pwMustSet)", st['auth'].get('pwMustSet') is True and 'pw' not in st['auth'])
    R.check("fresh install: set-password prompt appears", pg.locator("#pwNew").count() == 1)
    seed_balances = balances(pg)
    R.check("demo data still present (10 customers)", len(seed_balances) == 10)

    # set password: mismatch / short / ok
    pg.fill("#pwNew", "abc"); pg.fill("#pwNew2", "abc"); pg.click("[data-act=pwSetSubmit]"); pg.wait_for_timeout(300)
    R.check("password shorter than 8 rejected", 'pw' not in state(pg)['auth'])
    pg.fill("#pwNew", "abcdefg"); pg.fill("#pwNew2", "abcdefg"); pg.click("[data-act=pwSetSubmit]"); pg.wait_for_timeout(300)
    R.check("7-character password rejected (minimum is 8)", 'pw' not in state(pg)['auth'])
    pg.fill("#pwNew", "owner-pass-1"); pg.fill("#pwNew2", "owner-pass-2"); pg.click("[data-act=pwSetSubmit]"); pg.wait_for_timeout(300)
    R.check("mismatched confirmation rejected", 'pw' not in state(pg)['auth'])
    pg.fill("#pwNew", "owner-pass-1"); pg.fill("#pwNew2", "owner-pass-1"); pg.click("[data-act=pwSetSubmit]"); pg.wait_for_timeout(900)
    a = state(pg)['auth']
    R.check("hash stored: PBKDF2-SHA256, 310000 iter, salt+hash present", a['pw']['alg'] == 'PBKDF2-SHA256' and a['pw']['iter'] == 310000 and len(a['pw']['salt']) >= 22 and len(a['pw']['hash']) >= 40)
    R.check("password not stored in clear anywhere in app state", 'owner-pass-1' not in json.dumps(state(pg)))
    R.check("pwMustSet cleared after set", 'pwMustSet' not in a)

    # enable lock, restart, unlock tests
    pg.evaluate("S.settings.appLockEnabled=true; persist();")
    pg.reload(); pg.wait_for_function("document.body.classList.contains('lic-ok')"); pg.wait_for_timeout(1500)
    R.check("lock overlay shown after restart", pg.evaluate("getComputedStyle(document.getElementById('appLockOverlay')).display") == 'flex')
    pg.fill("#appLockPassInput", LEGACY_DEFAULT); pg.click("[data-act=unlockApp]"); pg.wait_for_timeout(900)
    R.check("old factory password does NOT unlock", pg.evaluate("getComputedStyle(document.getElementById('appLockOverlay')).display") == 'flex')
    pg.fill("#appLockPassInput", "owner-pass-1"); pg.click("[data-act=unlockApp]"); pg.wait_for_timeout(900)
    R.check("correct password unlocks", pg.evaluate("getComputedStyle(document.getElementById('appLockOverlay')).display") == 'none')
    R.check("data identical after restart", balances(pg) == seed_balances)

    # throttling
    pg.reload(); pg.wait_for_function("document.body.classList.contains('lic-ok')"); pg.wait_for_timeout(1500)
    for i in range(5):
        pg.fill("#appLockPassInput", f"wrong{i}"); pg.click("[data-act=unlockApp]"); pg.wait_for_timeout(450)
    pg.fill("#appLockPassInput", "owner-pass-1"); pg.click("[data-act=unlockApp]"); pg.wait_for_timeout(700)
    R.check("brute-force throttle: correct password refused during cooldown", pg.evaluate("getComputedStyle(document.getElementById('appLockOverlay')).display") == 'flex' and state(pg)['auth'].get('pwFail', {}).get('n', 0) >= 5)
    set_state(pg, "delete s.auth.pwFail")  # test shortcut to skip waiting
    pg.reload(); pg.wait_for_function("document.body.classList.contains('lic-ok')"); pg.wait_for_timeout(1500)

    # ---------- legacy migration: DEFAULT factory password ----------
    pg.evaluate("localStorage.setItem('__noop','1')")
    set_state(pg, "delete s.auth.pw; s.auth.masterPass='%s'; delete s.auth.pwMustSet; s.settings.appLockEnabled=true" % LEGACY_DEFAULT)
    before = balances(pg)
    pg.reload(); pg.wait_for_function("document.body.classList.contains('lic-ok')"); pg.wait_for_timeout(1800)
    st = state(pg)
    R.check("legacy default password: plaintext removed", 'masterPass' not in st['auth'] and LEGACY_DEFAULT not in json.dumps(st))
    R.check("legacy default password: NOT carried over as a valid hash; owner must set new", 'pw' not in st['auth'] and st['auth']['pwMustSet'] is True)
    R.check("legacy default: owner still gets in (no lockout), data intact", pg.evaluate("getComputedStyle(document.getElementById('appLockOverlay')).display") == 'none' and balances(pg) == before)
    R.check("legacy default: set-password prompt shown", pg.locator("#pwNew").count() == 1)
    pg.click("[data-act=pwLater]"); pg.wait_for_timeout(400)
    R.check("'later' leaves app usable", pg.evaluate("document.body.classList.contains('lic-ok')"))

    # ---------- legacy migration: CUSTOM password ----------
    set_state(pg, "delete s.auth.pw; delete s.auth.pwMustSet; s.auth.masterPass='my-shop-pw'; s.settings.appLockEnabled=true")
    pg.reload(); pg.wait_for_function("document.body.classList.contains('lic-ok')"); pg.wait_for_timeout(1800)
    st = state(pg)
    R.check("custom legacy password migrated to hash, plaintext gone", 'pw' in st['auth'] and 'masterPass' not in st['auth'] and 'my-shop-pw' not in json.dumps(st))
    R.check("custom legacy: lock shown (owner not bypassed)", pg.evaluate("getComputedStyle(document.getElementById('appLockOverlay')).display") == 'flex')
    pg.fill("#appLockPassInput", LEGACY_DEFAULT); pg.click("[data-act=unlockApp]"); pg.wait_for_timeout(700)
    R.check("custom legacy: factory password rejected", pg.evaluate("getComputedStyle(document.getElementById('appLockOverlay')).display") == 'flex')
    pg.fill("#appLockPassInput", "my-shop-pw"); pg.click("[data-act=unlockApp]"); pg.wait_for_timeout(900)
    R.check("custom legacy: existing owner password still works after migration", pg.evaluate("getComputedStyle(document.getElementById('appLockOverlay')).display") == 'none')
    R.check("custom legacy: debt data preserved", balances(pg) == before)
    salt1 = state(pg)['auth']['pw']['salt']
    set_state(pg, "delete s.auth.pw; s.auth.masterPass='my-shop-pw'")
    pg.reload(); pg.wait_for_function("document.body.classList.contains('lic-ok')"); pg.wait_for_timeout(1800)
    R.check("salt is random per hash", state(pg)['auth']['pw']['salt'] != salt1)
    # forgot-password dialog must be reachable from the lock screen (was hidden behind it)
    pg.click("[data-act=forgotPassPrompt]"); pg.wait_for_selector("#recCode")
    R.check("recovery dialog is clickable above the lock overlay", pg.evaluate("(()=>{const r=document.querySelector('[data-act=recoverySubmit]').getBoundingClientRect();const e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!e&&!!e.closest('[data-act=recoverySubmit]');})()"))
    pg.evaluate("stack.slice().forEach(m=>closeModal(m))")
    pg.fill("#appLockPassInput", "my-shop-pw"); pg.click("[data-act=unlockApp]"); pg.wait_for_timeout(1200)

    # ---------- change password flow ----------
    pg.evaluate("S.settings.appLockEnabled=false; persist();")
    pg.evaluate("A.resetPassModal()"); pg.wait_for_selector("#pwCur"); 
    pg.fill("#pwCur", LEGACY_DEFAULT); pg.fill("#pwNew", "another-pass"); pg.fill("#pwNew2", "another-pass"); pg.click("[data-act=pwSetSubmit]"); pg.wait_for_timeout(900)
    R.check("change password: factory password is not accepted as 'current'", 'my-shop-pw' != 'x' and pg.locator("#pwCur").count() == 1)
    pg.fill("#pwCur", "my-shop-pw"); pg.click("[data-act=pwSetSubmit]"); pg.wait_for_timeout(1200)
    R.check("change password: works with correct current password", pg.evaluate("authVerify('another-pass').then(r=>r.ok)") is True)

    # ---------- manual role switching disabled (M/W strictly governed by DEYN3 license) ----------
    pg.evaluate("A.switchDeviceRole()"); pg.wait_for_timeout(300)
    R.check("owner cannot manually switch device role to worker inside the app", pg.evaluate("isWorkerDevice()") is False and pg.locator("#ownerPw").count() == 0)

    # ---------- worker permission enforcement (activated via genuine W license) ----------
    w_lic = env.license(dev, "LT", "W")
    pg.evaluate("async c => { const p = await deynVerifyCode(c, DEYN_DEV_ID); window.DEYN_LIC = p; DEYN_LIC = p; applyLicenseRole(); persist(); renderAll(); }", w_lic)
    pg.wait_for_timeout(300)
    R.check("worker license sets device strictly to worker mode", pg.evaluate("isWorkerDevice()") is True)
    pg.evaluate("A.switchDeviceRole()"); pg.wait_for_timeout(200)
    R.check("worker cannot switch device role to owner", pg.evaluate("isWorkerDevice()") is True and pg.locator("#ownerPw").count() == 0)
    n_before = pg.evaluate("S.customers.length")
    owner_only = ["wipe", "resetPassModal", "clearData", "purgeTrash", "manageSegsModal", "newSegPrompt"]
    for act in owner_only:
        pg.evaluate("document.querySelectorAll('.ovl').forEach(o=>o.remove())")
        stack_before = pg.evaluate("stack.length")
        pg.evaluate(f"try{{A.{act}()}}catch(e){{}}"); pg.wait_for_timeout(200)
        opened = pg.evaluate("stack.length") > stack_before
        R.check(f"worker cannot run owner action '{act}' (no dialog opens)", not opened, toast(pg))
        pg.evaluate("stack.slice().forEach(m=>closeModal(m))")
    for act, arg in [("delCust", "{id:S.customers[0].id}"), ("editCust", "{id:S.customers[0].id}"), ("delTicket", "{id:S.pending[0].id}")]:
        pg.evaluate("stack.slice().forEach(m=>closeModal(m))")
        sb = pg.evaluate("stack.length"); pg.evaluate(f"try{{A.{act}({arg})}}catch(e){{}}"); pg.wait_for_timeout(200)
        R.check(f"worker cannot run owner action '{act}'", pg.evaluate("stack.length") <= sb)
    # app-lock toggle by worker via the settings switch
    pg.evaluate("openSettings()"); pg.wait_for_timeout(400)
    pg.evaluate("(()=>{const c=document.querySelector('[data-ch=appLockEnabled]');c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));})()")
    R.check("worker cannot enable app lock", state(pg)['settings'].get('appLockEnabled') in (False, None))
    # worker with forged state tries to call verifyMasterPass directly
    pg.evaluate("PW_CTX={hasPw:false,viaRecovery:false}; try{A.pwSetSubmit()}catch(e){}"); pg.wait_for_timeout(300)
    R.check("worker cannot set owner password through pwSetSubmit", state(pg)['auth']['pw'] is not None and pg.evaluate("authVerify('another-pass').then(r=>r.ok)") is True)
    R.check("customer count unchanged by worker attempts", pg.evaluate("S.customers.length") == n_before)
    pg.close()
finally:
    errs = env.errors; env.close(); site.close()
R.check("no JavaScript errors during auth tests", not errs, "; ".join(errs[:3]))
sys.exit(0 if R.summary() else 1)
```

================================================================================
## [29/31] FILE: `tests/e2e/test_time.py`

- **المسار الأصلي**: `tests/e2e/test_time.py`
- **الحجم**: `8,368` بايت | **الأسطر**: `108` | **SHA-256**: `c5284ca598f4222c28bf33dd9994cb6e983fb02eb28eb7a470d9200e11e9b4ab`

```python
import json, sys, time
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from harness import *
R = Results()
H = 3600_000
ts = TimeServer('*')
site = Site(time_pub=ts.key['pub'])
env = Env(site); ts.attach(env.ctx, "live")
def tp(pg): return pg.evaluate("({s:DEYN_TP.status,w:DEYN_TP.state.warnings,e:DEYN_TP.state.episode,g:DEYN_TP.state.graceStart,last:DEYN_TP.state.lastSeen})")
def banner(pg): return pg.evaluate("(document.getElementById('deynTimeBanner')||{}).textContent||''")
def tick(pg, wait=0): pg.evaluate("deynClockTick(true)"); pg.wait_for_timeout(wait)
def fetch_trusted(pg): return pg.evaluate("deynFetchTrustedTime()")
def fin(pg): return pg.evaluate("JSON.stringify(S.customers)+JSON.stringify(S.pending)+JSON.stringify(S.trash||[])")
try:
    pg = env.new_app(); dev = env.dev_id(pg)
    env.activate(pg, env.license(dev, "LT", "M")); pg.wait_for_timeout(2500)
    R.check("normal: status OK and no banner", tp(pg)['s'] == 'OK' and banner(pg) == '')
    R.check("signed time fetched from the REAL worker and verified in the browser", fetch_trusted(pg) is True and pg.evaluate("DEYN_TRUSTED!==null"))

    # --- offline is not a violation ---
    ts.mode = "offline"; pg.evaluate("DEYN_TRUSTED=null")
    R.check("offline (fetch fails): not a violation, no banner, app usable", fetch_trusted(pg) is False and tp(pg)['s'] == 'OK' and banner(pg) == '' and pg.evaluate("document.body.classList.contains('lic-ok')"))
    ts.mode = "replay"
    ts.mode = "live"; ok = fetch_trusted(pg); ts.mode = "replay"
    R.check("replayed old response rejected (nonce mismatch), status unchanged", fetch_trusted(pg) is False and tp(pg)['s'] == 'OK')
    ts.mode = "live"

    # --- three warnings, grace, READ_ONLY ---
    seen = []
    for k in range(3):
        pg.evaluate("__setSkew(%d)" % (2 * H)); fetch_trusted(pg); tick(pg)
        seen.append((tp(pg)['w'], tp(pg)['s'], banner(pg)[:12]))
        pg.evaluate("__setSkew(0)"); fetch_trusted(pg); tick(pg)
        assert tp(pg)['s'] == 'OK', tp(pg)
    R.check("3 separate clock episodes -> warning 1, 2, 3 (3rd opens the 48h grace)", [x[0] for x in seen] == [1, 2, 3] and [x[1] for x in seen] == ['WARN', 'WARN', 'GRACE'], str(seen))
    R.check("warning banner is shown with the warning number", '1 من 3' in seen[0][2] + banner(pg) or 'تحذير 1' in seen[0][2], seen[0][2])
    # 4th episode inside / after grace
    pg.evaluate("__setSkew(%d)" % (2 * H)); fetch_trusted(pg); tick(pg)
    R.check("clock still wrong during grace -> GRACE with remaining hours", tp(pg)['s'] == 'GRACE' and 'مهلة' in banner(pg), banner(pg))
    before = fin(pg)
    ts.set_offset(49 * H); pg.evaluate("__setSkew(%d)" % (51 * H)); fetch_trusted(pg); tick(pg)
    R.check("48h after the 3rd warning and still wrong -> READ_ONLY", tp(pg)['s'] == 'READ_ONLY' and 'القراءة فقط' in banner(pg), str(tp(pg)))

    # --- READ_ONLY enforcement ---
    n0 = pg.evaluate("S.customers.length")
    for act, arg in [("newCust", "{}"), ("saveCust", "{}"), ("pay", "{id:S.customers[0].id}"), ("debt", "{id:S.customers[0].id}"), ("delCust", "{id:S.customers[0].id}"), ("editCust", "{id:S.customers[0].id}"),
                     ("delTicket", "{id:S.pending[0].id}"), ("wipe", "{}"), ("clearData", "{}"), ("restoreTrash", "{id:'x'}"), ("mmok", "{}"), ("pick", "{id:S.customers[0].id}"), ("saveTicketTag", "{}"), ("confirmOk", "{}")]:
        pg.evaluate("stack.slice().forEach(m=>closeModal(m))"); sb = pg.evaluate("stack.length")
        pg.evaluate(f"try{{A.{act}({arg})}}catch(e){{}}"); pg.wait_for_timeout(120)
        R.check(f"READ_ONLY blocks '{act}'", pg.evaluate("stack.length") <= sb and fin(pg) == before)
    R.check("READ_ONLY: no financial data changed, nothing deleted", fin(pg) == before and pg.evaluate("S.customers.length") == n0)
    # direct write through the settings 'guaranteed' switch
    pg.evaluate("openSettings()"); pg.wait_for_timeout(300); pg.evaluate("stack.slice().forEach(m=>closeModal(m))")
    # viewing and export still work
    pg.evaluate("stack.slice().forEach(m=>closeModal(m))")
    pg.evaluate("A.open({id:S.customers[0].id})"); pg.wait_for_timeout(400)
    R.check("READ_ONLY: customer statement can still be opened", pg.evaluate("stack.length") >= 1)
    pg.evaluate("stack.slice().forEach(m=>closeModal(m))")
    bk = pg.evaluate("""new Promise(res=>{const o=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{URL.createObjectURL=o;res(t)});return 'blob:x'};try{backup()}catch(e){res('ERR '+e)}})""")
    R.check("READ_ONLY: backup export still works and contains every customer", len(json.loads(bk)['customers']) == n0)
    R.check("READ_ONLY: licence untouched", pg.evaluate("window.DEYN_LIC!==null && DEYN_LIC.tier==='LT'"))
    R.check("READ_ONLY: owner password dialogs still reachable (no lockout from recovery)", pg.evaluate("typeof A.openRecovery==='function'") and pg.evaluate("(()=>{A.openRecovery();return stack.length>0})()"))
    pg.evaluate("stack.slice().forEach(m=>closeModal(m))")
    # persists across restart: rolling the clock back does not clear it
    pg.evaluate("__setSkew(0)"); ts.mode = "offline"; pg.reload(); pg.wait_for_timeout(3000)
    R.check("READ_ONLY survives restart and an offline clock rollback", tp(pg)['s'] == 'READ_ONLY')
    # --- recovery by signed time ---
    ts.mode = "live"; ts.set_offset(0); pg.evaluate("__setSkew(0)"); fetch_trusted(pg); tick(pg)
    R.check("correct clock + verified signed time -> back to OK and writable", tp(pg)['s'] == 'OK' and banner(pg) == '')
    pg.evaluate("A.newCust()"); pg.wait_for_timeout(300)
    R.check("writes allowed again after recovery", pg.evaluate("stack.length") >= 1)
    pg.evaluate("stack.slice().forEach(m=>closeModal(m))")

    # --- forward-only licence expiry (no signed time involved) ---
    ts.mode = "offline"
    pgb = env.new_device("T2"); devb = env.dev_id(pgb)
    now_ms = pgb.evaluate("Date.now()")
    code = env.sign_license({"v": 3, "d": devb, "t": "1Y", "r": "M", "exp": now_ms + 90_000, "n": "T" * 22})
    env.activate(pgb, code); pgb.wait_for_timeout(1500)
    R.check("short term licence active", env.started(pgb))
    pgb.evaluate("__setSkew(120000)"); pgb.wait_for_timeout(4800)
    R.check("term licence expires when the clock passes expiry", pgb.evaluate("document.getElementById('actGate').classList.contains('show')"))
    pgb.evaluate("__setSkew(0)"); pgb.reload(); pgb.wait_for_function("document.getElementById('agDevId').textContent.trim().length==32"); pgb.wait_for_timeout(2500)
    R.check("rolling the phone clock back does NOT revive an expired licence", pgb.evaluate("document.getElementById('actGate').classList.contains('show')") and not env.started(pgb))
    R.check("re-entering the same expired code is refused", (env.activate(pgb, code) or True) and not env.started(pgb))
    pgb.close()
finally:
    errs = env.errors; env.close(); site.close(); ts.close()

# ---- production configuration: enforcement OFF until the service is deployed ----
site = Site(enforce=False); env = Env(site)
try:
    pg = env.new_app(); dev = env.dev_id(pg); env.activate(pg, env.license(dev, "LT", "M")); pg.wait_for_timeout(2500)
    R.check("shipped config has enforce=false and an empty time URL (no lockout risk before deployment)", pg.evaluate("DEYN_TIME_CFG.enforce===false && DEYN_TIME_CFG.url===''"))
    pg.evaluate("DEYN_TP.state.warnings=3;DEYN_TP.state.episode=true;DEYN_TP.state.graceStart=Date.now()-72*3600*1000;deynClockTick(true)")
    pg.evaluate("__setSkew(-3600000)"); pg.evaluate("deynClockTick(true)")
    R.check("enforce=false: READ_ONLY is reported but writing stays allowed", pg.evaluate("DEYN_TP.status")=='READ_ONLY' and pg.evaluate("deynReadOnly()") is False and pg.evaluate("(()=>{A.newCust();return stack.length>0})()"))
    pg.evaluate("__setSkew(0)")
finally:
    errs += env.errors; env.close(); site.close()
# embedded code identical to the unit-tested modules
import re
app = (ROOT / "deyn-app/www/index.html").read_text(encoding="utf8")
pol = re.sub(r"^export ", "", (ROOT / "trusted-time/time-policy.js").read_text(encoding="utf8"), flags=re.M)
core = pol.split("\n", 1)[1]
R.check("policy code embedded in the app is byte-identical to the unit-tested module", core.strip() in app)
R.check("no JavaScript errors in time tests", not errs, "; ".join(errs[:3]))
sys.exit(0 if R.summary() else 1)
```

================================================================================
## [30/31] FILE: `trusted-time/client.js`

- **المسار الأصلي**: `trusted-time/client.js`
- **الحجم**: `2,073` بايت | **الأسطر**: `25` | **SHA-256**: `bca85b9f6d407bac8e502c3656bfbdf64387282e8b926dc649c609be210343de`

```javascript
// Verification of a signed time response (to be embedded in the app). Pure functions, no network.
// The app ships ONLY the time PUBLIC key (separate from the licence key).
const PREFIX = 'DEYN-TIME-V1\n';
const unb64u = s => { if (typeof s !== 'string' || !/^[A-Za-z0-9_-]+$/.test(s)) throw new Error('b64'); const b = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - s.length % 4) % 4); return Uint8Array.from(atob(b), c => c.charCodeAt(0)); };
export const MAX_RTT_MS = 10000;
export function newNonce() { const b = new Uint8Array(16); crypto.getRandomValues(b); let s = ''; for (const x of b) s += String.fromCharCode(x); return btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); }
// resp = {b,s}; ctx = {pubKeyB64, nonce, deviceId, rttMs}. rttMs is measured with a MONOTONIC clock (performance.now), not Date.
export async function verifyTimeResponse(resp, ctx) {
  const bad = reason => ({ ok: false, reason });
  try {
    if (!resp || typeof resp.b !== 'string' || typeof resp.s !== 'string') return bad('shape');
    if (!(ctx.rttMs >= 0) || ctx.rttMs > MAX_RTT_MS) return bad('rtt');
    const body = unb64u(resp.b), sig = unb64u(resp.s);
    if (sig.length !== 64) return bad('sig_len');
    const key = await crypto.subtle.importKey('raw', Uint8Array.from(atob(ctx.pubKeyB64), c => c.charCodeAt(0)), { name: 'Ed25519' }, false, ['verify']);
    const msg = new Uint8Array([...new TextEncoder().encode(PREFIX), ...body]);
    if (!await crypto.subtle.verify('Ed25519', key, sig, msg)) return bad('signature');
    const raw = new TextDecoder().decode(body), p = JSON.parse(raw);
    if (Object.keys(p).sort().join(',') !== 'd,k,n,t,v' || p.v !== 1 || p.k !== 'time' || !Number.isSafeInteger(p.t)) return bad('payload');
    if (JSON.stringify({ v: p.v, k: p.k, t: p.t, d: p.d, n: p.n }) !== raw) return bad('canonical');
    if (p.n !== ctx.nonce) return bad('nonce');          // replayed / swapped response
    if (p.d !== ctx.deviceId) return bad('device');
    return { ok: true, t: p.t };
  } catch (e) { return bad('error'); }
}
```

================================================================================
## [31/31] FILE: `trusted-time/worker.js`

- **المسار الأصلي**: `trusted-time/worker.js`
- **الحجم**: `2,681` بايت | **الأسطر**: `40` | **SHA-256**: `96d913d706066bdc1f9be4f4862675b741f0f05292bd3ca33c6583d67d0853b8`

```javascript
// DEYN trusted-time signer (Cloudflare Worker). STATELESS: no KV, no database, no user data stored.
// Secret (never in git):  wrangler secret put TIME_SIGNING_KEY   -> PKCS#8 private key, base64 (NOT the licence key)
// Var:                    ALLOWED_ORIGIN (default https://localhost, the Capacitor Android WebView origin)
const PREFIX = 'DEYN-TIME-V1\n';
const enc = new TextEncoder();
const b64u = u8 => { let s = ''; for (const x of u8) s += String.fromCharCode(x); return btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const keyCache = new Map();   // keyed by the secret itself so a rotated secret is picked up immediately
function signingKey(env) {
  const k = env.TIME_SIGNING_KEY;
  if (!keyCache.has(k)) keyCache.set(k, crypto.subtle.importKey('pkcs8', unb64(k), { name: 'Ed25519' }, false, ['sign']));
  return keyCache.get(k);
}
function respond(status, obj, origin) {
  return new Response(obj === null ? null : JSON.stringify(obj), { status, headers: {
    'content-type': 'application/json', 'cache-control': 'no-store',
    'access-control-allow-origin': origin, 'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type', 'vary': 'Origin' } });
}
export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || 'https://localhost';
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return respond(204, null, origin);
    if (url.pathname !== '/v1/time') return respond(404, { error: 'not_found' }, origin);
    if (request.method !== 'POST') return respond(405, { error: 'method' }, origin);
    if (!env.TIME_SIGNING_KEY) return respond(500, { error: 'not_configured' }, origin);
    const len = parseInt(request.headers.get('content-length') || '0', 10);
    if (len > 256) return respond(413, { error: 'too_large' }, origin);
    let req;
    try { req = JSON.parse(await request.text()); } catch (e) { return respond(400, { error: 'json' }, origin); }
    if (!req || typeof req.n !== 'string' || !/^[A-Za-z0-9_-]{22}$/.test(req.n) || typeof req.d !== 'string' || !/^[0-9a-f]{32}$/.test(req.d))
      return respond(400, { error: 'bad_request' }, origin);
    const payload = { v: 1, k: 'time', t: Date.now(), d: req.d, n: req.n };
    const body = enc.encode(JSON.stringify(payload));
    const msg = new Uint8Array(PREFIX.length + body.length); msg.set(enc.encode(PREFIX)); msg.set(body, PREFIX.length);
    const sig = new Uint8Array(await crypto.subtle.sign('Ed25519', await signingKey(env), msg));
    return respond(200, { b: b64u(body), s: b64u(sig) }, origin);
  }
};
```

================================================================================
## قائمة الملفات المدرجة في `PRO_4_SOURCE_BUNDLE_2.md` (31 ملفًا)

| # | المسار الأصلي للملف | الحجم (بايت) | SHA-256 (أول 16 خانة) |
|---|---|---|---|
| 1 | `.github/scripts/integrate_sms.py` | 17,303 | `1b09492d86d71b5d` |
| 2 | `.github/workflows/build-deyn.yml` | 1,875 | `2aa5f2ad11ad20e2` |
| 3 | `.github/workflows/build-sms-test.yml` | 5,104 | `e2d1c6adde8ecf90` |
| 4 | `.github/workflows/export-deyn-labs.yml` | 1,402 | `1db4c5fc0d62242f` |
| 5 | `DeynSmsPlugin.java` | 43,549 | `eab4f4e6a1d8f64d` |
| 6 | `PRO_4_HANDOFF.md` | 7,004 | `1d3174b14dc1b346` |
| 7 | `PRO_4_SHA256.txt` | 11,653 | `e2866235b1aa96d7` |
| 8 | `PRO_4_TEST_REPORT.md` | 4,440 | `ed0f54f51c023311` |
| 9 | `deyn-app/android-res/mipmap-anydpi-v26/ic_launcher_round.xml` | 266 | `44cc3246d167bd71` |
| 10 | `deyn-app/capacitor.config.json` | 189 | `917ded69578fb288` |
| 11 | `deyn-app/native/DeynBackupPlugin.java` | 18,158 | `bf8509112ca73cb2` |
| 12 | `deyn-app/native/DeynNotifPlugin.java` | 15,024 | `ac4aab77652a34ad` |
| 13 | `deyn-app/package.json` | 672 | `311768ced7459b35` |
| 14 | `deyn-app/scripts/prepare-android.sh` | 4,152 | `7e794d8155d0bfd6` |
| 15 | `deyn-keygen/android-res/mipmap-anydpi-v26/ic_launcher_round.xml` | 266 | `44cc3246d167bd71` |
| 16 | `deyn-keygen/package.json` | 682 | `22e328b733e50605` |
| 17 | `deyn-keygen/scripts/fetch_fonts.py` | 1,074 | `e43149a70cf52069` |
| 18 | `deyn-keygen/www/fonts/fonts.css` | 92 | `ba51e7135b662fe6` |
| 19 | `deyn-keygen/www/index.html` | 18,454 | `b07dfae0418a0c11` |
| 20 | `docs/DESIGN_VAULT_SYNC.md` | 8,138 | `ef99e190b54a541d` |
| 21 | `sms/JavaPluginTests.java` | 7,526 | `0e81bdba5a0a1c48` |
| 22 | `sms/README.md` | 2,867 | `193c6fac9bd81a7a` |
| 23 | `sms/engine.js` | 19,981 | `86a911a084a39802` |
| 24 | `sms/i18n.js` | 86,748 | `53579deeb25c7709` |
| 25 | `sms/runtime.js` | 29,097 | `9207ceba0ddef2aa` |
| 26 | `sms/test.mjs` | 16,176 | `0ae5dcb3da0853f3` |
| 27 | `sync/session.js` | 13,521 | `3c3d7e008c19cdf8` |
| 28 | `tests/e2e/test_auth.py` | 11,498 | `69c986f8d4b0546c` |
| 29 | `tests/e2e/test_time.py` | 8,368 | `c5284ca598f4222c` |
| 30 | `trusted-time/client.js` | 2,073 | `bca85b9f6d407bac` |
| 31 | `trusted-time/worker.js` | 2,681 | `96d913d706066bdc` |
