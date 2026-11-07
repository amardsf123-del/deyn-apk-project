#!/usr/bin/env python3
from pathlib import Path
import re, subprocess, tempfile, zipfile

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "deyn-apk-project.zip"
if not ARCHIVE.is_file():
    raise SystemExit("Missing deyn-apk-project.zip")

with tempfile.TemporaryDirectory() as td:
    work = Path(td) / "src"
    work.mkdir()
    with zipfile.ZipFile(ARCHIVE) as z:
        z.extractall(work)
    html = work / "deyn-app/www/index.html"
    s = html.read_text(encoding="utf-8")

    old_uid = "const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);"
    new_uid = """let uidFallbackCounter = 0;
const uid = () => {
  try {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16); window.crypto.getRandomValues(bytes);
      return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {}
  uidFallbackCounter += 1;
  return 'legacy-' + Date.now().toString(36) + '-' + uidFallbackCounter.toString(36) + '-' + Math.random().toString(36).slice(2);
};"""
    if old_uid in s:
        s = s.replace(old_uid, new_uid, 1)
    elif "let uidFallbackCounter = 0;" not in s:
        raise SystemExit("UID source changed; refusing patch")

    old_store = """const KEY = 'deyn.v1';
let S;
function load() { try { const r = localStorage.getItem(KEY); if (r) { const o = JSON.parse(r); if (o && Array.isArray(o.customers) && Array.isArray(o.pending)) return o; } } catch (e) {} return null; }
function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
"""
    new_store = r"""const KEY = 'deyn.v1';
let S;
let storageBlocked = false;
function readStoredState() {
  let raw;
  try { raw = localStorage.getItem(KEY); }
  catch (error) { return { status: 'unavailable', raw: null, error }; }
  if (raw === null) return { status: 'missing', raw: null };
  try {
    const value = JSON.parse(raw);
    if (value && Array.isArray(value.customers) && Array.isArray(value.pending)) return { status: 'valid', value, raw };
    return { status: 'corrupt', raw, error: new Error('Invalid DEYN data structure') };
  } catch (error) { return { status: 'corrupt', raw, error }; }
}
function showStorageRecovery(state, writeFailure) {
  storageBlocked = true;
  const canExport = typeof state.raw === 'string';
  document.body.innerHTML = '<main style="min-height:100vh;display:grid;place-items:center;padding:22px;background:#f4f7f6;font-family:system-ui,sans-serif;color:#18332e;direction:rtl">' +
    '<section style="width:min(100%,520px);background:#fff;border:1px solid #d9e5e1;border-radius:20px;padding:24px;box-shadow:0 12px 40px #163b3014">' +
    '<div style="font-size:30px;margin-bottom:10px">⚠️</div><h2 style="margin:0 0 12px;font-size:21px">توقّف مؤقت لحماية بياناتك</h2>' +
    '<p style="line-height:1.9;margin:0 0 12px">' + (writeFailure ? 'تعذّر حفظ آخر تغيير. أوقفنا الاستخدام حتى لا تواصل إدخال بيانات قد لا تُحفظ.' : 'تعذّر قراءة بيانات DEYN بشكل سليم. لم نستبدلها بالبيانات التجريبية ولم نحذفها.') + '</p>' +
    '<p style="line-height:1.9;color:#8a4b16;margin:0 0 18px">لا تحذف التطبيق، ولا تمسح بياناته أو ذاكرته المؤقتة، ولا تضغط على إعادة التصفير.</p>' +
    (canExport ? '<button id="deynExportRaw" style="width:100%;padding:14px;border:0;border-radius:12px;background:#075447;color:white;font-weight:700;font-size:15px">حفظ نسخة إنقاذ من البيانات الموجودة</button>' : '') +
    '<p style="font-size:12px;color:#667873;line-height:1.8;margin:14px 0 0">ملف الإنقاذ قد يحتوي بيانات خاصة وكلمات مرور قديمة. احتفظ به في مكان آمن ولا ترسله قبل مراجعته.</p></section></main>';
  const btn = document.getElementById('deynExportRaw');
  if (btn) btn.addEventListener('click', () => {
    try {
      const blob = new Blob([state.raw], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'deyn-emergency-recovery.txt'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 3000);
    } catch (e) { alert('تعذّر إنشاء ملف الإنقاذ. لا تمسح بيانات التطبيق.'); }
  });
}
function persist() {
  if (storageBlocked) return false;
  try {
    const serialized = JSON.stringify(S);
    localStorage.setItem(KEY, serialized);
    if (localStorage.getItem(KEY) !== serialized) throw new Error('Storage read-back mismatch');
    return true;
  } catch (error) {
    showStorageRecovery({ raw: (() => { try { return localStorage.getItem(KEY); } catch (e) { return null; } })(), error }, true);
    return false;
  }
}
"""
    if old_store in s:
        s = s.replace(old_store, new_store, 1)
    elif "function readStoredState()" not in s:
        raise SystemExit("Storage source changed; refusing patch")

    old_backup = """function backup() {
  try {
    const b = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
"""
    new_backup = """function backup() {
  try {
    const safeBackup = JSON.parse(JSON.stringify(S));
    if (safeBackup.auth) {
      delete safeBackup.auth.masterPass;
      delete safeBackup.auth.masterCode;
      delete safeBackup.auth.assistantCode;
    }
    const b = new Blob([JSON.stringify(safeBackup, null, 2)], { type: 'application/json' });
"""
    if old_backup in s:
        s = s.replace(old_backup, new_backup, 1)
    elif "delete safeBackup.auth.masterPass;" not in s:
        raise SystemExit("Backup source changed; refusing patch")

    old_init = """function init() {
  S = load() || seed();
  S.settings = Object.assign({ dialect: true, sound: true, notifs: true, assistantStatsLocked: true }, S.settings);
"""
    new_init = """function init() {
  const stored = readStoredState();
  if (stored.status === 'corrupt' || stored.status === 'unavailable') {
    showStorageRecovery(stored, false);
    return;
  }
  S = stored.status === 'valid' ? stored.value : seed();
  S.settings = Object.assign({ dialect: true, sound: true, notifs: true, assistantStatsLocked: true }, S.settings);
"""
    if old_init in s:
        s = s.replace(old_init, new_init, 1)
    elif "const stored = readStoredState();" not in s:
        raise SystemExit("Init source changed; refusing patch")

    old_end = "  buildTiles(); renderAll(); persist(); checkSmartNotifs(); checkAppLock();"
    new_end = "  buildTiles(); renderAll(); if (!persist()) return; checkSmartNotifs(); checkAppLock();"
    if old_end in s:
        s = s.replace(old_end, new_end, 1)
    elif "if (!persist()) return; checkSmartNotifs();" not in s:
        raise SystemExit("Init completion changed; refusing patch")

    html.write_text(s, encoding="utf-8")
    match = re.search(r"<script>([\s\S]*?)</script>", s)
    if not match:
        raise SystemExit("Could not locate application script")
    with tempfile.NamedTemporaryFile("w", suffix=".js", encoding="utf-8") as f:
        f.write(match.group(1)); f.flush()
        subprocess.run(["node", "--check", f.name], check=True)

    required = ["stored.status === 'corrupt' || stored.status === 'unavailable'",
                "localStorage.getItem(KEY) !== serialized",
                "delete safeBackup.auth.masterPass;",
                "delete safeBackup.auth.masterCode;",
                "delete safeBackup.auth.assistantCode;",
                "window.crypto.getRandomValues(bytes)"]
    if not all(x in s for x in required):
        raise SystemExit("Post-patch assertions failed")

    tmpzip = ARCHIVE.with_suffix(".zip.tmp")
    with zipfile.ZipFile(tmpzip, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=7) as z:
        for file in sorted(work.rglob("*")):
            if file.is_file():
                z.write(file, file.relative_to(work).as_posix())
    tmpzip.replace(ARCHIVE)

print("PASS: DEYN source syntax and storage-safety assertions")
