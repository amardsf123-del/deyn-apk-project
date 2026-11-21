import json, sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from harness import *

R = Results(); site = Site()
env = Env(site, vault=True)
def ls(pg, k): return pg.evaluate("k=>localStorage.getItem(k)", k)
def balances(pg): return pg.evaluate("S.customers.map(c=>[c.name,bal(c),c.tx.length])")
def boot(pg, wait=1800):
    pg.reload(); pg.wait_for_timeout(wait + 800)
def flush(pg): pg.evaluate("deynFlush()")
def activate(pg_dev=None):
    pg = env.new_app(); dev = env.dev_id(pg); env.activate(pg, env.license(dev, "LT", "M")); pg.wait_for_timeout(2000); flush(pg); return pg, dev
try:
    # ---------- A. legacy (plaintext) data first, vault switched off ----------
    env.ctx.add_init_script("if(localStorage.getItem('__phase1'))localStorage.setItem('__vault_off','1')")
    pg = env.new_app(); pg.evaluate("localStorage.setItem('__phase1','1');localStorage.setItem('__vault_off','1')")
    dev = env.dev_id(pg); env.activate(pg, env.license(dev, "LT", "M")); pg.wait_for_timeout(2000)
    R.check("vault unavailable: app works in plaintext mode, nothing lost", pg.evaluate("window.DEYN_VAULT_STATUS") == 'unavailable' and ls(pg, 'deyn.v1') is not None and len(balances(pg)) == 10)
    pg.evaluate("A.newCust()"); pg.wait_for_selector("#fName"); pg.fill("#fName", "زبون قديم"); pg.fill("#fPhone", "0555 99 88 77"); pg.click("[data-act=saveCust]"); pg.wait_for_timeout(700)
    legacy_raw = ls(pg, 'deyn.v1'); legacy_bal = balances(pg)
    R.check("legacy plaintext DB holds readable names (baseline for migration)", 'زبون قديم' in legacy_raw)

    # ---------- B. enable vault: migration ----------
    pg.evaluate("localStorage.removeItem('__vault_off');localStorage.removeItem('__phase1')"); boot(pg); flush(pg)
    R.check("migration: app reports vault ON", pg.evaluate("window.DEYN_VAULT_STATUS") == 'on')
    R.check("migration: data identical after migration", balances(pg) == legacy_bal)
    R.check("migration: encrypted slot written and verified", ls(pg, 'deyn.v2.a') is not None)
    R.check("migration: legacy DB NOT deleted on first migrated boot", ls(pg, 'deyn.v1') == legacy_raw)
    c = ls(pg, 'deyn.v2.a'); 
    R.check("ciphertext does not contain customer names or JSON keys", all(x not in c for x in ['زبون قديم', 'customers', 'كمال', 'masterCode']))
    boot(pg); flush(pg)
    R.check("2nd boot: still on, legacy still kept (needs one verified boot first)", ls(pg, 'deyn.v1') is not None and balances(pg) == legacy_bal)
    boot(pg); flush(pg)
    R.check("3rd boot: legacy plaintext removed only after verified encrypted copy", ls(pg, 'deyn.v1') is None and balances(pg) == legacy_bal)
    R.check("no plaintext customer data left anywhere in localStorage", all('زبون قديم' not in (ls(pg, k) or '') for k in pg.evaluate("Object.keys(localStorage)")))

    # ---------- C. persistence ----------
    pg.evaluate("A.newCust()"); pg.wait_for_selector("#fName"); pg.fill("#fName", "زبون مشفّر"); pg.fill("#fPhone", "0555 11 22 33"); pg.click("[data-act=saveCust]"); pg.wait_for_timeout(700); flush(pg)
    snap = balances(pg); boot(pg)
    R.check("edit persists across app restart (encrypted)", balances(pg) == snap and any(n == "زبون مشفّر" for n, *_ in snap))
    for i in range(40): pg.evaluate("S.settings.t=%d; persist()" % i)
    flush(pg); boot(pg)
    R.check("40 rapid saves coalesce; last value wins; no error", pg.evaluate("S.settings.t") == 39)
    R.check("write counter strictly increasing & two alternating slots used", ls(pg, 'deyn.v2.a') and ls(pg, 'deyn.v2.b') and abs(json.loads(ls(pg, 'deyn.v2.a'))['n'] - json.loads(ls(pg, 'deyn.v2.b'))['n']) == 1)
    R.check("AAD binding: ciphertext cannot be decrypted under a different context", pg.evaluate("""async()=>{const p=Capacitor.Plugins.DeynVault;const e=await p.encrypt({data:btoa('x'),aad:'A'});try{await p.decrypt({iv:e.iv,data:e.data,aad:'B'});return false}catch(x){return true}}"""))
    R.check("IV unique per encryption", pg.evaluate("""async()=>{const p=Capacitor.Plugins.DeynVault;const s=new Set();for(let i=0;i<30;i++)s.add((await p.encrypt({data:btoa('x'),aad:'A'})).iv);return s.size===30}"""))

    # ---------- D. damage handling ----------
    good = balances(pg)
    newest = 'deyn.v2.a' if json.loads(ls(pg, 'deyn.v2.a'))['n'] > json.loads(ls(pg, 'deyn.v2.b'))['n'] else 'deyn.v2.b'
    other = 'deyn.v2.b' if newest == 'deyn.v2.a' else 'deyn.v2.a'
    rec = json.loads(ls(pg, newest)); ct = rec['ct']; rec['ct'] = ('A' if ct[5] != 'A' else 'B').join([ct[:5], ct[6:]])
    pg.evaluate("([k,v])=>localStorage.setItem(k,v)", [newest, json.dumps(rec)]); boot(pg)
    R.check("tampered newest copy detected (GCM) and last good copy used", pg.evaluate("document.body.classList.contains('lic-ok')") and len(balances(pg)) >= 10 and pg.locator("#deynExportRaw").count() == 0)
    flush(pg); boot(pg)
    # corrupt both
    for k in ['deyn.v2.a', 'deyn.v2.b']:
        r = json.loads(ls(pg, k)); r['ct'] = r['ct'][:-6] + 'AAAAAA'; pg.evaluate("([k,v])=>localStorage.setItem(k,v)", [k, json.dumps(r)])
    before_a, before_b = ls(pg, 'deyn.v2.a'), ls(pg, 'deyn.v2.b'); boot(pg)
    R.check("both copies damaged: rescue screen, no demo reseed, bytes untouched", pg.locator("#deynExportRaw").count() == 1 and ls(pg, 'deyn.v2.a') == before_a and ls(pg, 'deyn.v2.b') == before_b)
    # key loss (keystore key wiped / app data restored on another phone)
    pg.evaluate("([k,v])=>localStorage.setItem(k,v)", ['deyn.v2.a', before_a]); pg.evaluate("([k,v])=>localStorage.setItem(k,v)", ['deyn.v2.b', before_b])
    pg.evaluate("localStorage.removeItem('mock_vault_key')"); boot(pg)
    R.check("lost Keystore key: rescue screen (not silent reset), ciphertext preserved", pg.locator("#deynExportRaw").count() == 1 and ls(pg, 'deyn.v2.a') == before_a)
    pg.close()

    # ---------- E. migration failure keeps legacy ----------
    env2 = None
finally:
    errs = env.errors; env.close()
# fresh environment for failure-path tests
env = Env(site, vault=True)
try:
    pg = env.new_app(); pg.evaluate("localStorage.setItem('__vault_off','1')"); dev = env.dev_id(pg)
    env.activate(pg, env.license(dev, "LT", "M")); pg.wait_for_timeout(2000)
    base = balances(pg); raw = ls(pg, 'deyn.v1')
    pg.evaluate("localStorage.removeItem('__vault_off');localStorage.setItem('__vault_failw','1')"); boot(pg)
    R.check("migration failure (encrypt error): legacy DB untouched and app still works", ls(pg, 'deyn.v1') == raw and balances(pg) == base and ls(pg, 'deyn.v2.a') is None and ls(pg, 'deyn.v2.b') is None and pg.evaluate("window.DEYN_VAULT_STATUS") == 'migration-failed')
    pg.evaluate("localStorage.removeItem('__vault_failw')"); boot(pg); flush(pg)
    R.check("after the fault clears, migration succeeds on next boot", pg.evaluate("window.DEYN_VAULT_STATUS") == 'on' and balances(pg) == base)
    # write failure mid-session
    pg.evaluate("localStorage.setItem('__vault_failw','1')")
    pg.evaluate("S.customers[0].name='NOT-SAVED'; persist();"); pg.wait_for_timeout(1200)
    R.check("write failure mid-session: user is stopped with the safety screen", 'توقّف مؤقت لحماية بياناتك' in pg.inner_text("body"))
    pg.evaluate("localStorage.removeItem('__vault_failw')"); boot(pg)
    R.check("after write failure, previous good copy loads (failed edit not half-saved)", 'NOT-SAVED' not in json.dumps(balances(pg), ensure_ascii=False) and balances(pg) == base)
    pg.close()
finally:
    errs += env.errors; env.close(); site.close()
R.check("no JavaScript errors in vault tests", not errs, "; ".join(errs[:3]))
sys.exit(0 if R.summary() else 1)
