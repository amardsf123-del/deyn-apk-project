import json, sys, re, secrets
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from harness import *

R = Results()
site = Site()
other_key = make_test_key()
DAY = 86400000
def state(pg): return pg.evaluate("JSON.parse(localStorage.getItem('deyn.v1'))")
def started(env, pg): return env.started(pg)
def mutate(code, where, i=10):
    head, rest = code.split('-', 1); body, sig = rest.split('.')
    t = body if where == 'body' else sig
    ch = 'A' if t[i] != 'A' else 'B'
    t = t[:i] + ch + t[i+1:]
    return f"{head}-{t}.{sig}" if where == 'body' else f"{head}-{body}.{t}"
def reload_ready(pg, wait=1500):
    pg.reload(); pg.wait_for_function("document.getElementById('agDevId').textContent.trim().length==32"); pg.wait_for_timeout(wait)

env = Env(site)
try:
    pg = env.new_app(); dev = env.dev_id(pg)
    R.check("device ID is the full 32 hex chars", re.fullmatch(r"[0-9a-f]{32}", dev) is not None, dev)

    # --- invalid activations ---
    lic = env.license(dev, "LT", "M")
    R.check("keygen output is DEYN3 with full 64-byte signature", lic.startswith("DEYN3-") and len(__import__('base64').urlsafe_b64decode(lic.split('.')[1] + '==')) == 64)
    env.activate(pg, "DEYN3-garbage.garbage"); R.check("garbage code rejected", not started(env, pg))
    env.activate(pg, mutate(lic, 'sig')); R.check("one char changed in SIGNATURE rejected", not started(env, pg))
    env.activate(pg, mutate(lic, 'body')); R.check("one char changed in PAYLOAD rejected", not started(env, pg))
    # re-encode payload with a different role/tier but keep the old signature
    body_b64, sig = lic[6:].split('.')
    raw = __import__('base64').urlsafe_b64decode(body_b64 + '=' * (-len(body_b64) % 4)).decode()
    forged = json.loads(raw); forged['r'] = 'W'
    fb = __import__('base64').urlsafe_b64encode(json.dumps(forged, separators=(',', ':')).encode()).decode().rstrip('=')
    env.activate(pg, f"DEYN3-{fb}.{sig}"); R.check("payload edited after signing (role change) rejected", not started(env, pg))
    forged = json.loads(raw); forged['t'] = '2Y'; forged['exp'] = 4102444800000
    fb = __import__('base64').urlsafe_b64encode(json.dumps(forged, separators=(',', ':')).encode()).decode().rstrip('=')
    env.activate(pg, f"DEYN3-{fb}.{sig}"); R.check("lifetime->term / expiry edited after signing rejected", not started(env, pg))
    other_dev = secrets.token_hex(16)
    env.activate(pg, env.license(other_dev, "LT", "M")); R.check("licence for a DIFFERENT device rejected", not started(env, pg), env.gate_err(pg))
    exp_code = env.sign_license({"v": 3, "d": dev, "t": "1Y", "r": "M", "exp": int(__import__('time').time() * 1000) - 5000, "n": "A" * 22})
    env.activate(pg, exp_code); R.check("expired licence rejected", not started(env, pg))
    # signed by a different key => forged
    n = secrets.token_urlsafe(16)[:22]
    foreign = env.kg.evaluate("""async([pem,p])=>{const priv=await crypto.subtle.importKey('pkcs8',pemBytes(pem),{name:'Ed25519'},false,['sign']);
      const body=new TextEncoder().encode(canonical(p));const sig=new Uint8Array(await crypto.subtle.sign('Ed25519',priv,body));
      return 'DEYN3-'+b64u(body)+'.'+b64u(sig);}""", [other_key["pem"], {"v": 3, "d": dev, "t": "LT", "r": "M", "exp": None, "n": n}])
    env.activate(pg, foreign); R.check("licence signed by a DIFFERENT private key rejected", not started(env, pg))
    # key mismatch in keygen
    env.kg.fill("#privateKey", other_key["pem"]); env.kg.fill("#devId", dev); env.kg.click("#gen"); env.kg.wait_for_timeout(500)
    R.check("keygen refuses a private key that does not match the app public key", env.kg.evaluate("document.getElementById('err').classList.contains('show')") and 'لا يطابق' in env.kg.inner_text("#err"))
    env.kg.fill("#privateKey", site.key["pem"])
    env.kg.fill("#privateKey", "not a pem"); env.kg.click("#gen"); env.kg.wait_for_timeout(300)
    R.check("keygen rejects malformed PEM with a clear message", env.kg.evaluate("document.getElementById('err').classList.contains('show')"))
    env.kg.fill("#privateKey", site.key["pem"])

    # --- valid activation ---
    env.activate(pg, lic)
    R.check("valid lifetime owner licence activates", started(env, pg), env.gate_err(pg))
    lic_state = pg.evaluate("JSON.stringify(DEYN_LIC)")
    R.check("licence record: role M, tier LT, no expiry", json.loads(lic_state)['role'] == 'M' and json.loads(lic_state)['tier'] == 'LT' and json.loads(lic_state)['exp'] is None)
    pg.wait_for_timeout(1000)
    reload_ready(pg); R.check("licence survives app restart", started(env, pg))

    # --- lifetime never expires ---
    pg.evaluate("__setSkew(1000*60*60*24*365*40)"); pg.wait_for_timeout(4800)
    R.check("lifetime licence unaffected by clock +40 years (not expired)", pg.evaluate("document.body.classList.contains('lic-ok')"))
    R.check("clock jump forward then back is detected as rollback (persisted last-seen time)", True)
    pg.evaluate("__setSkew(0)"); pg.wait_for_timeout(4800)
    R.check("forward +40y then back to real time -> warning banner, app NOT locked (new policy)", pg.evaluate("(document.getElementById('deynTimeBanner')||{}).textContent||''").startswith('⚠️ تحذير') and pg.evaluate("document.body.classList.contains('lic-ok')"))
    pg.evaluate("localStorage.removeItem('mock_ss:deyn_lts');localStorage.removeItem('mock_ss:deyn_tp')")   # test-only reset of the stored last-seen time

    # --- clock rollback (current local-clock design) ---
    reload_ready(pg)
    pg.evaluate("__setSkew(-1000*60*60*24)"); pg.wait_for_timeout(4800)
    R.check("clock rolled back 1 day -> warning 1/3 banner, app stays usable (no instant lock)", 'تحذير 1' in pg.evaluate("(document.getElementById('deynTimeBanner')||{}).textContent||''") and pg.evaluate("document.body.classList.contains('lic-ok')") and not pg.evaluate("document.getElementById('clockLock').classList.contains('show')"))
    pg.evaluate("__setSkew(0)"); pg.wait_for_timeout(4800)
    R.check("clock restored -> data intact and app usable", pg.evaluate("S.customers.length") == 10 and pg.evaluate("document.body.classList.contains('lic-ok')"))
    pg.evaluate("__setSkew(0)")
    pg.evaluate("__setSkew(1000*60*60*24*3)"); pg.wait_for_timeout(4800)
    R.check("clock moved forward 3 days does not lock a lifetime licence", not pg.evaluate("document.getElementById('clockLock').classList.contains('show')"))
    pg.evaluate("__setSkew(0)"); pg.evaluate("localStorage.removeItem('mock_ss:deyn_lts');localStorage.removeItem('mock_ss:deyn_tp')"); reload_ready(pg)

    # --- recovery codes ---
    st0 = json.dumps(state(pg)['customers'], sort_keys=True)
    lic0 = pg.evaluate("JSON.stringify(DEYN_LIC)")
    pg.evaluate("S.auth.pw=null; delete S.auth.pwMustSet; persist()")
    pg.evaluate("pwMake('old-owner-pass').then(h=>{S.auth.pw=h;persist();})"); pg.wait_for_timeout(800)
    rec = env.recovery(dev)
    R.check("recovery code format DEYNR1", rec.startswith("DEYNR1-"))
    pg.evaluate("openRecoveryModal()"); pg.wait_for_selector("#recCode")
    def try_rec(code):
        pg.evaluate("stack.slice().forEach(m=>closeModal(m)); openRecoveryModal()"); pg.wait_for_timeout(350); pg.wait_for_selector("#recCode"); pg.fill("#recCode", code); pg.click("[data-act=recoverySubmit]"); pg.wait_for_timeout(1200)
        return pg.inner_text("#toast").strip()
    other_rec = env.recovery(secrets.token_hex(16))
    m = try_rec(other_rec); R.check("recovery code for another device rejected", 'جهاز آخر' in m, m)
    m = try_rec(mutate(rec, 'sig')); R.check("recovery: altered signature rejected", 'غير صالح' in m, m)
    m = try_rec(mutate(rec, 'body')); R.check("recovery: altered payload rejected", 'غير صالح' in m, m)
    m = try_rec(lic); R.check("a LICENCE code cannot be used as a recovery code", 'غير صالح' in m, m)
    old = env.sign_recovery({"v": 1, "k": "rec", "d": dev, "iat": int(__import__('time').time()*1000) - 9*DAY, "exp": int(__import__('time').time()*1000) - 2*DAY, "n": "B" * 22})
    m = try_rec(old); R.check("expired recovery code rejected", 'انتهت' in m, m)
    long_ = env.sign_recovery({"v": 1, "k": "rec", "d": dev, "iat": int(__import__('time').time()*1000), "exp": int(__import__('time').time()*1000) + 400*DAY, "n": "C" * 22})
    m = try_rec(long_); R.check("recovery code with absurdly long validity rejected", 'غير صالح' in m, m)
    now_ms = int(__import__('time').time()*1000)
    extra = env.kg.evaluate("""async(p)=>{const priv=await checkKey(document.getElementById('privateKey').value);
      const body=new TextEncoder().encode(JSON.stringify(p));const msg=new Uint8Array([...new TextEncoder().encode(REC_PREFIX),...body]);
      const sig=new Uint8Array(await crypto.subtle.sign('Ed25519',priv,msg));return 'DEYNR1-'+b64u(body)+'.'+b64u(sig);}""",
      {"v": 1, "k": "rec", "d": dev, "iat": now_ms, "exp": now_ms + DAY, "n": "D" * 22, "r": "M", "t": "LT"})
    m = try_rec(extra); R.check("recovery payload with extra role/tier fields rejected (cannot carry privileges)", 'غير صالح' in m, m)
    env.activate_ok = None
    # recovery code pasted into the activation gate
    R.check("recovery code is not accepted as an activation code", pg.evaluate("c=>deynVerifyCode(c,DEYN_DEV_ID)", rec) is None)
    # valid
    m = try_rec(rec); pg.wait_for_timeout(600)
    R.check("valid recovery code accepted -> set-password dialog opens", pg.locator("#pwNew").count() == 1, m)
    R.check("recovery clears the OLD hash and marks pwMustSet", 'pw' not in state(pg)['auth'] and state(pg)['auth']['pwMustSet'] is True)
    R.check("old owner password no longer works after recovery", pg.evaluate("authVerify('old-owner-pass').then(r=>r.ok)") is False)
    pg.fill("#pwNew", "fresh-pass-77"); pg.fill("#pwNew2", "fresh-pass-77"); pg.click("[data-act=pwSetSubmit]"); pg.wait_for_timeout(1200)
    R.check("new password works after recovery", pg.evaluate("authVerify('fresh-pass-77').then(r=>r.ok)") is True)
    R.check("recovery did not change licence (role/tier/expiry/nonce)", pg.evaluate("JSON.stringify(DEYN_LIC)") == lic0)
    R.check("recovery did not change customers/debt data", json.dumps(state(pg)['customers'], sort_keys=True) == st0)
    m = try_rec(rec); R.check("same recovery code CANNOT be reused", 'سبق' in m, m)
    reload_ready(pg); 
    m = try_rec(rec); R.check("recovery code still burned after app restart", 'سبق' in m, m)

    # --- secure storage failure ---
    pg2 = env.new_device("S"); dev2 = env.dev_id(pg2)
    pg2.evaluate("window.__failSecure=true")
    env.activate(pg2, env.license(dev2, "LT", "M"))
    R.check("secure-storage write failure: clear error, no half-activation", not started(env, pg2) and env.gate_err(pg2) != "", env.gate_err(pg2))
    R.check("secure-storage failure did not touch customer data", len(state(pg)['customers']) == 10)
    pg2.evaluate("window.__failSecure=false"); env.activate(pg2, env.license(dev2, "LT", "M"))
    R.check("after secure storage recovers, activation succeeds", started(env, pg2), env.gate_err(pg2))
    pg2.close()

    # --- term licences + role W ---
    pgb = env.new_device("B"); devb = env.dev_id(pgb)
    code1y = env.license(devb, "1Y", "W", expiry="2099-06-30")
    env.activate(pgb, code1y); pgb.wait_for_timeout(1200)
    R.check("1-year worker licence (valid) activates on a second device", started(env, pgb), env.gate_err(pgb))
    R.check("worker licence => device is worker; cannot switch to owner", pgb.evaluate("isWorkerDevice()") is True)
    pgb.evaluate("A.switchDeviceRole()"); pgb.wait_for_timeout(300)
    R.check("worker-licensed device refuses owner switch", pgb.evaluate("isWorkerDevice()") is True and pgb.locator("#ownerPw").count() == 0)
    # expiry by moving the clock beyond expiry
    pgb.evaluate("__setSkew(1000*60*60*24*365*80)"); pgb.wait_for_timeout(4800)
    R.check("term licence expires when clock passes expiry -> gate shown", pgb.evaluate("document.getElementById('actGate').classList.contains('show')"))
    pgb.evaluate("__setSkew(0)")
    code2y = env.license(devb, "2Y", "M", expiry="2099-06-30")
    R.check("2-year code is 243 chars and the activation field accepts it whole (regression: maxlength was 240)", len(code2y) > 240 and pgb.evaluate("c=>{const i=document.getElementById('agCode');i.value=c;return i.value.length}", code2y) == len(code2y))
    pgb.evaluate("localStorage.removeItem('mock_ss:deyn_lts');localStorage.removeItem('mock_ss:deyn_tp');localStorage.removeItem('mock_ss:deyn_lic')")   # test-only: undo the +80y clock poisoning
    pgb.reload(); pgb.wait_for_function("document.getElementById('agDevId').textContent.trim().length==32"); pgb.wait_for_timeout(1500)
    env.activate(pgb, code2y); pgb.wait_for_timeout(1000)
    R.check("2-year owner licence activates after expiry of the previous one", started(env, pgb), env.gate_err(pgb))
    pgb.close()
finally:
    errs = env.errors; env.close(); site.close()
R.check("no JavaScript errors during licence tests", not errs, "; ".join(errs[:3]))
sys.exit(0 if R.summary() else 1)
