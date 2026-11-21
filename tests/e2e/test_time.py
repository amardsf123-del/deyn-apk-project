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
