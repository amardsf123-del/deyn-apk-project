import json, re, subprocess, sys, tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from harness import *

R = Results()
ROOT = Path(__file__).resolve().parents[2]
LEGACY = "fc" + "b1899"
# ---------------- static scans of the real shipped sources ----------------
files = [ROOT/"deyn-app/www/index.html", ROOT/"deyn-keygen/www/index.html"]
for f in files:
    t = f.read_text(encoding="utf8")
    R.check(f"{f.parent.parent.name}: no factory password literal", LEGACY not in t)
    R.check(f"{f.parent.parent.name}: no embedded offline signing secret", "DEYN_OFFLINE_SECRET" not in t)
    R.check(f"{f.parent.parent.name}: no PKCS#8 Ed25519 private key material", not re.search(r"MC4CAQAwBQYDK2VwBCIEI[A-Za-z0-9+/]{40,}", t) and not re.search(r"-----BEGIN PRIVATE KEY-----\s*[A-Za-z0-9+/]{40,}", t))
    js = re.findall(r"<script>([\s\S]*?)</script>", t)
    ok = True
    for i, block in enumerate(js):
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf8") as tf: tf.write(block)
        ok &= subprocess.run(["node", "--check", tf.name], capture_output=True).returncode == 0
    R.check(f"{f.parent.parent.name}: all script blocks parse", ok)
pk_app = re.search(r"DEYN_PUBLIC_KEY\s*=\s*'([^']+)'", files[0].read_text(encoding="utf8")).group(1)
pk_kg = re.search(r"PUBLIC_KEY\s*=\s*'([^']+)'", files[1].read_text(encoding="utf8")).group(1)
R.check("app and keygen embed the same public key (32 bytes)", pk_app == pk_kg and len(__import__('base64').b64decode(pk_app)) == 32)
pem_files = [p for p in ROOT.rglob("*") if p.is_file() and p.suffix.lower() in (".pem", ".key", ".jks", ".keystore", ".p12") and "node_modules" not in p.parts]
R.check("no key/keystore files anywhere in the project tree", not pem_files, str(pem_files))
leaks = []
for p in ROOT.rglob("*"):
    if p.is_file() and p.suffix in (".py", ".js", ".json", ".yml", ".yaml", ".md", ".html", ".txt", ".sh") and "node_modules" not in p.parts and p.name != "test_storage_layout_static.py":
        try: t = p.read_text(encoding="utf8")
        except Exception: continue
        if re.search(r"-----BEGIN (?:ENCRYPTED |EC |RSA )?PRIVATE KEY-----\s*[A-Za-z0-9+/]{40,}", t): leaks.append(str(p))
R.check("no PEM private key bodies in any text file", not leaks, str(leaks))
cap = json.loads((ROOT/"deyn-app/capacitor.config.json").read_text())
R.check("capacitor uses https scheme and no mixed content", cap["server"]["androidScheme"] == "https" and cap["android"]["allowMixedContent"] is False)

# ---------------- browser tests ----------------
site = Site(); env = Env(site)
def state(pg): return pg.evaluate("JSON.parse(localStorage.getItem('deyn.v1'))")
def ready(pg, w=1500): pg.reload(); pg.wait_for_timeout(w + 1200)
try:
    pg = env.new_app(); dev = env.dev_id(pg)
    env.activate(pg, env.license(dev, "2Y", "M", expiry="2099-06-30")); pg.wait_for_timeout(1500)
    # ---- persistence ----
    pg.evaluate("A.newCust()"); pg.wait_for_selector("#fName")
    pg.fill("#fName", "زبون اختبار"); pg.fill("#fPhone", "0555 00 11 22")
    pg.click("[data-act=saveCust]"); pg.wait_for_timeout(700)
    names = pg.evaluate("S.customers.map(c=>c.name)")
    R.check("add customer (UI flow)", "زبون اختبار" in names, str(names[:3]))
    snap = state(pg)
    ready(pg)
    R.check("data persists after closing/reopening the app", state(pg)['customers'] == snap['customers'] and len(state(pg)['customers']) == len(snap['customers']))
    uids = pg.evaluate("S.customers.flatMap(c=>c.tx.map(t=>t.id))")
    R.check("no duplicate transaction IDs", len(uids) == len(set(uids)))
    pg.evaluate("document.querySelectorAll('.ovl').forEach(o=>o.remove())")
    # ---- backup file excludes secrets ----
    pg.evaluate("pwMake('backup-test-pw').then(h=>{S.auth.pw=h;S.auth.masterCode='X';persist();})"); pg.wait_for_timeout(800)
    cap_js = """new Promise(res=>{const orig=URL.createObjectURL;URL.createObjectURL=b=>{b.text().then(t=>{URL.createObjectURL=orig;res(t)});return 'blob:x'};try{backup()}catch(e){res('ERR '+e)}})"""
    bk = pg.evaluate(cap_js)
    R.check("backup export is valid JSON with all customers", len(json.loads(bk)['customers']) == len(state(pg)['customers']))
    R.check("backup export contains no password hash/salt/plaintext", '"pw"' not in bk and 'salt' not in bk and 'backup-test-pw' not in bk and 'masterPass' not in bk)
    # ---- corrupt data ----
    raw = pg.evaluate("localStorage.getItem('deyn.v1')")
    pg.evaluate("localStorage.setItem('deyn.v1','{\"customers\":[ broken')"); ready(pg, 1800)
    R.check("corrupt data: app stops and shows rescue screen (does not silently reseed demo data)", pg.locator("#deynExportRaw").count() == 1)
    R.check("corrupt data: original bytes left untouched in storage", pg.evaluate("localStorage.getItem('deyn.v1')") == '{"customers":[ broken')
    pg.evaluate("localStorage.setItem('deyn.v1',JSON.stringify({customers:'x',pending:[]}))"); ready(pg, 1800)
    R.check("structurally invalid data detected as corrupt", pg.locator("#deynExportRaw").count() == 1)
    pg.evaluate("r=>localStorage.setItem('deyn.v1',r)", raw); ready(pg, 1800)
    R.check("valid data restored -> app starts normally again", pg.evaluate("document.body.classList.contains('lic-ok')") and pg.locator("#deynExportRaw").count() == 0)
    # ---- localStorage write failure ----
    pg.evaluate("Storage.prototype.setItem=function(k,v){if(k==='deyn.v1')throw new Error('quota');return Object.getPrototypeOf(this).constructor===Storage?0:0}")
    pg.evaluate("try{S.customers[0].name='X-fail';persist()}catch(e){}"); pg.wait_for_timeout(500)
    R.check("storage write failure: user is stopped with a clear Arabic screen (no silent loss)", 'توقّف مؤقت لحماية بياناتك' in pg.inner_text("body"))
    pg.close()

    # ---- layout on small screens ----
    for w, h in [(320, 568), (360, 740), (390, 844)]:
        ctx = env.browser.new_context(viewport={"width": w, "height": h}); ctx.add_init_script(MOCK)
        ctx.add_init_script("if(!localStorage.getItem('__devseed'))localStorage.setItem('__devseed','L%d')" % w)
        p = ctx.new_page(); p.on("pageerror", lambda e: env.errors.append(str(e)))
        p.goto(site.app_url); p.wait_for_function("document.getElementById('agDevId').textContent.trim().length==32")
        d = env.dev_id(p)
        ov = lambda: p.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
        R.check(f"{w}px: activation gate has no horizontal overflow", ov() <= 0)
        R.check(f"{w}px: device-id copy button visible", p.is_visible("#agCopy"))
        code = env.license(d, "2Y", "M", expiry="2099-06-30"); p.fill("#agCode", code)
        R.check(f"{w}px: 243-char code in input causes no page overflow", ov() <= 0)
        env.activate(p, code); p.wait_for_timeout(1500)
        p.evaluate("document.querySelectorAll('.ovl').forEach(o=>o.remove())")
        p.evaluate("A.pwLater&&A.pwLater()"); p.evaluate("stack.slice().forEach(m=>closeModal(m))"); p.wait_for_timeout(400)
        p.evaluate("openSettings()"); p.wait_for_timeout(500)
        sheet = p.evaluate("(()=>{const s=document.querySelector('.sheet');return {sw:s.scrollWidth,cw:s.clientWidth}})()")
        R.check(f"{w}px: settings sheet has no horizontal scroll with long code card", sheet['sw'] <= sheet['cw'], str(sheet))
        btn_ok = p.evaluate("(()=>{const b=document.querySelector('[data-act=copyMasterCode]');if(!b)return false;const r=b.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.width>20})()")
        R.check(f"{w}px: master-code copy button is on-screen", btn_ok)
        p.evaluate("stack.slice().forEach(m=>closeModal(m))"); p.wait_for_timeout(350)
        p.evaluate("openRecoveryModal()"); p.wait_for_timeout(500)
        sheet = p.evaluate("(()=>{const s=document.querySelector('.sheet');return {sw:s.scrollWidth,cw:s.clientWidth}})()")
        R.check(f"{w}px: recovery dialog (device id + long code) fits", sheet['sw'] <= sheet['cw'], str(sheet))
        p.fill("#recCode", "DEYNR1-" + "A" * 330)
        sheet = p.evaluate("(()=>{const s=document.querySelector('.sheet');return {sw:s.scrollWidth,cw:s.clientWidth}})()")
        R.check(f"{w}px: pasting a 337-char recovery code does not overflow", sheet['sw'] <= sheet['cw'], str(sheet))
        ctx.close()
finally:
    errs = env.errors; env.close(); site.close()
R.check("no JavaScript errors in storage/layout tests", not errs, "; ".join(errs[:3]))
sys.exit(0 if R.summary() else 1)
