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
