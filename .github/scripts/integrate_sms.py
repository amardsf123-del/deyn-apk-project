#!/usr/bin/env python3
"""Apply the reviewed SMS feature to the real DEYN Capacitor source archive.
Never copies the PREVIEW mock bridge or its test licence into the app."""
from pathlib import Path
import subprocess, sys
root = Path(sys.argv[1]).resolve()
app = root / 'deyn-app'
html = app / 'www' / 'index.html'
patch_file = Path(sys.argv[2]).resolve()
plugin_src = Path(sys.argv[3]).resolve()
prep = app / 'scripts' / 'prepare-android.sh'
if not html.is_file() or not prep.is_file():
    raise SystemExit('Expected real deyn-app source was not found')
text = html.read_text(encoding='utf-8')
if 'SMS_DEFAULT_TPL' in text or 'smsRemind' in text:
    raise SystemExit('SMS markers already exist; refusing a duplicate integration')
p = patch_file.read_text(encoding='utf-8')
start = p.find('@@ -12,')
end = p.find('@@ -962,', start)
if start < 0 or end < 0:
    raise SystemExit('Unexpected SMS patch format; no source changed')
p = p[:start] + p[end:]  # omit PREVIEW-only mock Capacitor bridge
tmp_patch = app / '.sms-real.patch'
tmp_target = app / 'DEYN-preview.html'
try:
    tmp_target.write_text(text, encoding='utf-8')
    tmp_patch.write_text(p, encoding='utf-8')
    subprocess.run(['patch', '--batch', '--forward', '-p0', '-i', str(tmp_patch)], cwd=app, check=True)
    patched = tmp_target.read_text(encoding='utf-8')
finally:
    tmp_target.unlink(missing_ok=True)
    tmp_patch.unlink(missing_ok=True)
required = ['SMS_DEFAULT_TPL', 'smsRemind', 'smsSyncSchedule', 'smsConsentOk', 'smsTest', 'smsTpl']
if not all(x in patched for x in required):
    raise SystemExit('SMS patch did not apply all expected sections')
patched = patched.replace("await smsPlug().send({ phone: to, message: smsText({ name: 'محمد', payDay: 5, tx: [{ type: 'debt', amount: 1500 }] }, { day: 5 }) });", "await smsPlug().send({ id: 'test-' + Date.now(), phone: to, message: smsText({ name: 'محمد', payDay: 5, tx: [{ type: 'debt', amount: 1500 }] }, { day: 5 }) });")
patched = patched.replace("await p.send({ phone: to, message: smsText(c, pi) });", "await p.send({ id: key, phone: to, message: smsText(c, pi) });")
patched = patched.replace("let SMS_SYNC_T = null;\nfunction smsSyncSchedule() {\n  clearTimeout(SMS_SYNC_T);\n  SMS_SYNC_T = setTimeout(async () => {", "let SMS_SYNC_CHAIN = Promise.resolve();\nlet SMS_SYNC_REV = 0;\nfunction smsSyncSchedule() {\n  const revision = ++SMS_SYNC_REV;\n  SMS_SYNC_CHAIN = SMS_SYNC_CHAIN.then(async () => {\n    if (revision !== SMS_SYNC_REV) return;")
patched = patched.replace("    try { await p.schedule({ items }); } catch (e) { console.warn('SMS schedule failed', e); }\n  }, 1500);\n}", "    try { await p.schedule({ items }); } catch (e) { console.warn('SMS schedule failed', e); }\n  });\n}")
if 'SMS_SYNC_CHAIN' not in patched:
    raise SystemExit('Could not serialize SMS schedule updates')
html.write_text(patched, encoding='utf-8')
native = app / 'native'
native.mkdir(exist_ok=True)
(native / 'DeynSmsPlugin.java').write_text(plugin_src.read_text(encoding='utf-8'), encoding='utf-8')
s = prep.read_text(encoding='utf-8')
s = s.replace('registerPlugin(DeynSyncPlugin.class);', 'registerPlugin(DeynSyncPlugin.class);\n        registerPlugin(DeynSmsPlugin.class);')
s = s.replace('for P in ACCESS_NETWORK_STATE ACCESS_WIFI_STATE CAMERA; do', 'for P in ACCESS_NETWORK_STATE ACCESS_WIFI_STATE CAMERA SEND_SMS; do')
needle = 'echo "✔ تم تجهيز مشروع أندرويد"'
insert = '''# WorkManager for optional, revocable SMS reminders
GRADLE=android/app/build.gradle
if ! grep -q 'androidx.work:work-runtime' "$GRADLE"; then
  sed -i '/dependencies[[:space:]]*{/a\\    implementation "androidx.work:work-runtime:2.9.0"' "$GRADLE"
fi
'''
if needle not in s:
    raise SystemExit('Could not locate final marker in prepare-android.sh')
s = s.replace(needle, insert + needle)
prep.write_text(s, encoding='utf-8')
print('SMS integration applied to real source; preview mock bridge excluded.')
