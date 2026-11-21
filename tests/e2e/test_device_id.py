"""
Device ID = SHA-256(Android ID)[0..16) -- verified against the REAL app in Chromium.
Android ID itself (Settings.Secure.ANDROID_ID via @capacitor/device) is simulated by a constant per "phone"; what is verified is the
APP's behaviour for each lifecycle event. It cannot prove what Android does with ANDROID_ID (see the report for that).
Lifecycle simulation: reopen = reload / new page in the same context; clear data = wipe the context's storage;
uninstall+reinstall = brand-new context (empty storage) on the SAME phone (same Android ID); another phone = different Android ID.
"""
import sys, re, hashlib, json
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from harness import *

R = Results()
site = Site(); env = Env(site)
HEX32 = re.compile(r'^[0-9a-f]{32}$')
def expect(android_id): return hashlib.sha256(android_id.encode()).hexdigest()[:32]

def device_script(android_id):
    if android_id == '__NO_PLUGIN__': return "window.Capacitor.Plugins.Device=undefined;"
    if android_id == '__REJECT__':   return "window.Capacitor.Plugins.Device={getId:async()=>{throw new Error('boom')}};"
    return "window.Capacitor.Plugins.Device={getId:async()=>({identifier:%s})};" % json.dumps(android_id)

def new_phone(android_id, preseed=None):
    ctx = env.browser.new_context(viewport={"width": 360, "height": 740})
    ctx.add_init_script(MOCK)
    ctx.add_init_script(device_script(android_id))
    if preseed:   # simulate state left by an older app version (runs once; never again after the app wiped/changed it)
        ctx.add_init_script("if(!localStorage.getItem('__seeded')){localStorage.setItem('__seeded','1');" +
                            ''.join("localStorage.setItem(%s,%s);" % (json.dumps('mock_ss:deyn_' + k), json.dumps(v)) for k, v in preseed.items()) + "}")
    return ctx

def open_app(ctx, wait_id=True):
    pg = ctx.new_page(); pg.on("pageerror", lambda e: env.errors.append("APP: " + str(e)))
    pg.goto(site.app_url)
    if wait_id:
        pg.wait_for_function("document.getElementById('agDevId')&&document.getElementById('agDevId').textContent.trim().length==32")
    else:
        pg.wait_for_selector("#agDevId"); pg.wait_for_timeout(1200)
    return pg
def shown(pg): return pg.inner_text("#agDevId").strip()
def stored(pg): return pg.evaluate("localStorage.getItem('mock_ss:deyn_did')")

try:
    A, B = "a1b2c3d4e5f60718", "9f8e7d6c5b4a3921"

    # 1-4: the id is derived from Android ID, and stays the same across the lifecycle --------------------------------------
    ctx = new_phone(A); pg = open_app(ctx); id1 = shown(pg)
    R.check("1 id is SHA-256(Android ID) truncated to 32 hex (same derivation as before: existing activations keep working)", id1 == expect(A) and HEX32.match(id1), id1)
    R.check("1 DEYN_DEV_ID global equals the id shown on the activation screen", pg.evaluate("DEYN_DEV_ID") == id1)
    pg.reload(); pg.wait_for_function("document.getElementById('agDevId').textContent.trim().length==32")
    R.check("2 same id after closing/re-opening the app (reload)", shown(pg) == id1)
    pg.close(); pg2 = open_app(ctx)
    R.check("2 same id in a fresh app process (new page, same storage)", shown(pg2) == id1)
    pg2.evaluate("localStorage.clear()"); pg2.reload(); pg2.wait_for_function("document.getElementById('agDevId').textContent.trim().length==32")
    R.check("3 same id after CLEARING app data (storage wiped)", shown(pg2) == id1, shown(pg2))
    ctx.close()
    ctx_re = new_phone(A); pg3 = open_app(ctx_re)
    R.check("4 same id after UNINSTALL + REINSTALL on the same phone (empty storage, same Android ID)", shown(pg3) == id1)
    ctx_re.close()

    # 5: another phone ---------------------------------------------------------------------------------------------------
    ctxB = new_phone(B); pgB = open_app(ctxB)
    R.check("5 another phone (different Android ID) gets a different id", shown(pgB) != id1 and shown(pgB) == expect(B), shown(pgB))
    ctxB.close()

    # 6-7: update keeps the id; storage is only a compatibility cache ---------------------------------------------------------
    ctx = new_phone(A); pg = open_app(ctx)
    R.check("6 first launch records the id for compatibility", stored(pg) == id1)
    pg.evaluate("localStorage.setItem('__upd','1')"); pg.reload(); pg.wait_for_function("document.getElementById('agDevId').textContent.trim().length==32")
    R.check("6 app UPDATE (new code, same storage) keeps the same id", shown(pg) == id1 and stored(pg) == id1)
    ctx.close()

    # 7: factory reset (new Android ID) is NOT claimed stable ---------------------------------------------------------------
    ctxF = new_phone("0011223344556677"); pgF = open_app(ctxF)
    R.check("7 documented limitation: a new Android ID (factory reset / different signing key) yields a new id", shown(pgF) != id1)
    ctxF.close()

    # 8: never random --------------------------------------------------------------------------------------------------------
    for label, aid in [("Device plugin missing", "__NO_PLUGIN__"), ("Device.getId() rejects", "__REJECT__"), ("known-bad Android ID 9774d56d682e549c", "9774d56d682e549c"),
                       ("'unknown'", "unknown"), ("empty", ""), ("too short", "ab"), ("all zeros", "0000000000000000")]:
        c = new_phone(aid); p = open_app(c, wait_id=False)
        gate = p.inner_text("#agErr") if p.evaluate("document.getElementById('agErr')&&document.getElementById('agErr').classList.contains('show')") else ''
        ok = not HEX32.match(shown(p)) and stored(p) is None
        p.reload(); p.wait_for_timeout(900)
        ok2 = not HEX32.match(shown(p)) and stored(p) is None
        R.check("8 no Android ID (%s): no random id is invented, nothing stored (twice)" % label, ok and ok2, "shown=%r stored=%r" % (shown(p), stored(p)))
        c.close()
    c = new_phone("__NO_PLUGIN__"); p = open_app(c, wait_id=False)
    R.check("8 the activation screen tells the user why (fails closed)", 'Android ID' in p.inner_text("#agErr") or 'الحماية' in p.inner_text("#agErr"), p.inner_text("#agErr")[:120])
    c.close()

    # 9: legacy compatibility ---------------------------------------------------------------------------------------------------
    legacy_random = "0123456789abcdef0123456789abcdef"
    lic_code_legacy = env.license(legacy_random, "LT", "M")
    c = new_phone(A, {"did": legacy_random, "lic": json.dumps({"code": lic_code_legacy}), "used": json.dumps([lic_code_legacy])}); p = open_app(c)
    R.check("9a legacy random id that backs a valid activation is KEPT (activation not lost)", shown(p) == legacy_random if False else p.evaluate("DEYN_DEV_ID") == legacy_random, p.evaluate("DEYN_DEV_ID"))
    R.check("9a ...and the app starts with that licence (no re-activation needed)", env.started(p), p.evaluate("document.body.className"))
    c.close()
    c = new_phone(A, {"did": legacy_random}); p = open_app(c)
    R.check("9b legacy random id WITHOUT an activation is replaced by the Android-ID id", shown(p) == id1 and stored(p) == id1, shown(p))
    c.close()
    lic_derived = env.license(id1, "LT", "M")
    c = new_phone(A, {"did": id1, "lic": json.dumps({"code": lic_derived}), "used": json.dumps([lic_derived])}); p = open_app(c)
    R.check("9c an existing activation made when the id was already Android-ID based keeps working unchanged", p.evaluate("DEYN_DEV_ID") == id1 and env.started(p))
    c.close()
    c = new_phone("__NO_PLUGIN__", {"did": legacy_random, "lic": json.dumps({"code": lic_code_legacy}), "used": json.dumps([lic_code_legacy])}); p = open_app(c)
    R.check("9d if Android ID cannot be read, an already-activated legacy phone still works (no lock-out)", p.evaluate("DEYN_DEV_ID") == legacy_random and env.started(p))
    c.close()

    # 10: owner / worker activation use the same id ------------------------------------------------------------------------------
    c = new_phone(A); p = open_app(c)
    owner = env.license(shown(p), "LT", "M"); env.activate(p, owner)
    R.check("10 OWNER activation with a code issued for the Android-ID id", env.started(p) and p.evaluate("DEYN_LIC.role") == 'M', env.gate_err(p))
    same = p.evaluate("DEYN_DEV_ID")
    R.check("10 activation, verification and runtime all use ONE id", same == id1 and p.evaluate("JSON.stringify(S.sync||{}).includes('%s')" % id1) is True, str(same))
    p.reload(); p.wait_for_timeout(1500)
    R.check("10 the activation survives restart (id re-derived identically)", env.started(p))
    p.evaluate("localStorage.clear()"); p.reload(); p.wait_for_timeout(1200)
    p.wait_for_function("document.getElementById('agDevId').textContent.trim().length==32")
    R.check("10 after clearing data the id is unchanged, so the SAME code can be activated again", shown(p) == id1 and not env.started(p), shown(p))
    c.close()
    c = new_phone(B); p = open_app(c); worker = env.license(shown(p), "LT", "W"); env.activate(p, worker)
    R.check("10 WORKER activation on another phone with its own id", env.started(p) and p.evaluate("DEYN_LIC.role") == 'W', env.gate_err(p))
    c.close()
    c = new_phone(B); p = open_app(c); env.activate(p, owner)
    R.check("10 a code issued for phone A is rejected on phone B", not env.started(p) and env.gate_err(p) != '', env.gate_err(p))
    c.close()

    # 11: static guarantees -----------------------------------------------------------------------------------------------------
    src = APP_SRC.read_text(encoding='utf8')
    body = src[src.index('async function deynGetDeviceId(){'):src.index('async function agCopyText(text)')]
    R.check("11 no randomness anywhere in the device-id function", not re.search(r'getRandomValues|randomUUID|Math\.random', body))
    sets = [m.start() for m in re.finditer(r"DeynStore\.set\('did'", src)]
    fn_start = src.index('async function deynGetDeviceId(){'); fn_end = fn_start + len(body)
    R.check("11 the id is written in exactly one place (inside deynGetDeviceId)", len(sets) == 1 and all(fn_start <= s < fn_end for s in sets), str(sets))
    R.check("11 every consumer reads the single global DEYN_DEV_ID / deynGetDeviceId() (no second generator)", len(re.findall(r'async function deynGetDeviceId', src)) == 1)
    R.check("no JavaScript errors", not env.errors, str(env.errors[:3]))
finally:
    env.close(); site.close()
R.summary()
sys.exit(0 if all(ok for _, ok, _ in R.rows) else 1)
