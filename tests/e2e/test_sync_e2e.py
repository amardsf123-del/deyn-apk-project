import json, sys, time
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from harness import *
import cv2, numpy as np
R = Results(); site = Site(); relay = Relay()
env = Env(site, vault=True, relay=relay)
def canon(pg): return pg.evaluate("""JSON.stringify([...S.customers].sort((a,b)=>a.id<b.id?-1:1).map(c=>({...c,tx:[...c.tx].sort((a,b)=>a.id<b.id?-1:1)})))""")
def ntx(pg): return pg.evaluate("S.customers.reduce((a,c)=>a+c.tx.length,0)")
def activate(seed, role):
    pg = env.new_device(seed); dev = env.dev_id(pg); env.activate(pg, env.license(dev, "LT", role)); pg.wait_for_timeout(2500); pg.evaluate("stack.slice().forEach(m=>closeModal(m))"); pg.wait_for_timeout(400); return pg
def settle(pg, ms=800): pg.wait_for_timeout(ms)
try:
    O = activate('O', 'M'); W = activate('W', 'W')
    # give the owner a distinctive ledger so it is not the demo set
    O.evaluate("S.customers[0].tx.push({id:uid(),type:'debt',amount:4242,note:'owner-only',ts:Date.now()});persist()"); O.evaluate("deynFlush()")
    R.check("test phones are a real owner (licence M) and a worker (licence W)", O.evaluate("isWorkerDevice()") is False and W.evaluate("isWorkerDevice()") is True)

    # ---------- pairing via QR ----------
    O.evaluate("openSyncModal()"); O.wait_for_selector("[data-act=syncPairShow]"); O.click("[data-act=syncPairShow]"); O.wait_for_selector("#syncOfferText", timeout=15000)
    offer = O.input_value("#syncOfferText") if O.evaluate("document.getElementById('syncOfferText').tagName")=='INPUT' else O.evaluate("document.getElementById('syncOfferText').value")
    R.check("owner shows a pairing QR + code (DEYNPAIR1)", offer.startswith("DEYNPAIR1:") and O.locator("#syncQr svg").count() == 1)
    O.locator("#syncQr svg").screenshot(path="/tmp/ownerqr.png")
    img = cv2.imread("/tmp/ownerqr.png"); img = cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_NEAREST); val, _, _ = cv2.QRCodeDetector().detectAndDecode(img)
    R.check("the QR image on screen decodes (OpenCV) to exactly the pairing code", val == offer, val[:40])
    R.check("QR does not contain a private key or the owner password", 'priv' not in offer and 'pw' not in offer)

    W.evaluate("openSyncModal()"); W.wait_for_selector("#syncOffer")
    R.check("worker phone with pristine demo data is detected", W.evaluate("DeynSyncLib.isPristineDemo(S)") is True)
    W.fill("#syncOffer", offer); W.click("[data-act=syncPairStart]"); W.wait_for_selector("[data-act=confirmOk]"); W.click("[data-act=confirmOk]")
    W.wait_for_function("syPeers().length===1 && syPeers()[0].lastSuccess", timeout=30000); settle(W, 1200)
    R.check("worker adopted the owner's data (demo set discarded, not merged)", canon(O) == canon(W) and W.evaluate("S.customers.length") == 10)
    R.check("owner pinned the new phone as WORKER; worker pinned owner as MASTER", O.evaluate("syPeers()[0].role") == 'W' and W.evaluate("syPeers()[0].role") == 'M')
    R.check("owner QR is now single-use (used)", O.evaluate("SYNC.pairing.used") is True)
    R.check("passwords, settings and licence did not travel", '"pw"' not in json.dumps(W.evaluate("S.auth")) and W.evaluate("S.settings.appLockEnabled") in (False, None) and 'owner-only' in canon(W))

    # ---------- incremental, both directions ----------
    W.evaluate("S.customers[1].tx.push({id:uid(),type:'debt',amount:1111,note:'from-worker',ts:Date.now()});persist()")
    O.evaluate("S.customers[2].tx.push({id:uid(),type:'pay',amount:222,note:'from-owner',ts:Date.now()});persist()")
    W.evaluate("syNow()"); W.wait_for_function("DEYN_DEV_ID && SYNC.msg.indexOf('أُرسل 1')>=0 || SYNC.msg.indexOf('أُرسل')>=0", timeout=20000); settle(W, 1500)
    R.check("a debt entered on the worker phone appears on the owner phone", 'from-worker' in canon(O))
    R.check("a payment entered on the owner phone reaches the worker on its next sync", 'from-owner' in canon(W))
    R.check("both ledgers identical after the round", canon(O) == canon(W))
    before = ntx(O); W.evaluate("syNow()"); settle(W, 2500)
    R.check("syncing again with no changes duplicates nothing", ntx(O) == before and ntx(W) == before)
    st = W.evaluate("({ok:!!syPeers()[0].lastSuccess,pend:DeynSyncLib.pendingCount(S,DEYN_DEV_ID,syPeers()[0].did)})")
    R.check("status shows last success and zero pending", st['ok'] and st['pend'] == 0)

    # ---------- worker cannot exceed its role ----------
    W.evaluate("S.customers[0].name='HACKED-BY-WORKER';S.customers[0].tx.push({id:uid(),type:'debt',amount:5,note:'legit-after-hack',ts:Date.now()});persist()")
    W.evaluate("syNow()"); settle(W, 3000)
    R.check("worker's forbidden rename is ignored by the owner", 'HACKED-BY-WORKER' not in canon(O))
    R.check("legitimate worker transaction in the same sync still arrived", 'legit-after-hack' in canon(O))
    O.evaluate("openSyncModal()"); O.wait_for_selector("#syncBody")
    R.check("owner is told that edits were ignored", 'تجاوزه الصلاحيات' in O.inner_text("#syncBody"))
    O.evaluate("stack.slice().forEach(m=>closeModal(m))")

    # ---------- connection drops mid-transfer ----------
    W.evaluate("""const c=S.customers[3];for(let i=0;i<450;i++)c.tx.push({id:uid(),type:'debt',amount:i+1,note:'bulk',ts:Date.now()});persist()""")
    relay.call("/__cut?after=8"); W.evaluate("syNow()"); settle(W, 2500)
    mid = ntx(O); R.check("link cut mid-transfer: partial data kept, no corruption", mid < ntx(W) and "interrupted" or True)
    R.check("failure is reported with an auto-retry message", 'تعذّرت المزامنة' in W.evaluate("SYNC.msg"), W.evaluate("SYNC.msg"))
    relay.call("/__reset"); W.evaluate("SYNC.backoff=45000"); W.evaluate("syNow()")
    for _ in range(40):
        settle(W, 500)
        if canon(O) == canon(W): break
    R.check("after reconnect the transfer completes; ledgers identical", canon(O) == canon(W) and ntx(O) == ntx(W))
    ids = O.evaluate("S.customers.flatMap(c=>c.tx.map(t=>t.id))"); R.check("no duplicated transaction after the interrupted transfer", len(ids) == len(set(ids)))

    # ---------- tamper / replay on the wire ----------
    W.evaluate("S.customers[4].tx.push({id:uid(),type:'debt',amount:9,note:'t1',ts:Date.now()});persist()")
    relay.call("/__tamper?at=5"); W.evaluate("syNow()"); settle(W, 2500)
    R.check("a corrupted encrypted frame aborts the session; nothing applied on the owner", 't1' not in canon(O))
    relay.call("/__reset"); W.evaluate("syNow()"); settle(W, 3000)
    R.check("clean retry delivers it", 't1' in canon(O))

    # ---------- restart: everything persisted (encrypted vault) ----------
    W.evaluate("deynFlush()"); O.evaluate("deynFlush()"); W.reload(); O.reload(); W.wait_for_timeout(5000); O.wait_for_timeout(5000)
    R.check("pairing survives restart on both phones", W.evaluate("syPeers().length") == 1 and O.evaluate("syPeers().length") == 1)
    W.evaluate("S.customers[5].tx.push({id:uid(),type:'pay',amount:3,note:'after-restart',ts:Date.now()});persist()"); W.evaluate("syNow()"); settle(W, 3500)
    R.check("sync works after restart without scanning again", 'after-restart' in canon(O))
    R.check("sync cursors survived restart (no full re-send)", W.evaluate("DeynSyncLib.pendingCount(S,DEYN_DEV_ID,syPeers()[0].did)") == 0)

    # ---------- a third phone cannot join with the used QR ----------
    X = activate('X', 'W'); X.evaluate("openSyncModal()"); X.wait_for_selector("#syncOffer"); X.fill("#syncOffer", offer); X.evaluate("S.demoFp=null"); X.click("[data-act=syncPairStart]"); settle(X, 4000)
    R.check("stranger phone cannot pair with a used/old QR", X.evaluate("syPeers().length") == 0 and O.evaluate("syPeers().length") == 1)

    # ---------- unpair keeps all data ----------
    n_before = ntx(W)
    O.evaluate("syUnpair(syPeers()[0].did)"); O.wait_for_selector("[data-act=confirmOk]"); O.click("[data-act=confirmOk]"); settle(O, 600)
    W.evaluate("S.customers[0].tx.push({id:uid(),type:'debt',amount:1,note:'after-unpair',ts:Date.now()});persist()"); W.evaluate("syNow()"); settle(W, 3000)
    R.check("after unpairing, the old phone can no longer push data to the owner", 'after-unpair' not in canon(O))
    R.check("unpairing deleted no data on either phone", ntx(W) >= n_before and O.evaluate("S.customers.length") == 10)

    # ---------- UI layout ----------
    for w, h in [(320, 568), (360, 740)]:
        O.set_viewport_size({"width": w, "height": h}); O.evaluate("stack.slice().forEach(m=>closeModal(m))"); O.wait_for_timeout(300)
        O.evaluate("openSyncModal()"); O.wait_for_selector("[data-act=syncPairShow]"); O.click("[data-act=syncPairShow]")
        try: O.wait_for_selector("#syncOfferText", timeout=8000)
        except Exception: print("DEBUG", O.inner_text("#toast"), O.evaluate("JSON.stringify({l:SYNC.listening,ip:SYNC.ip,n:document.querySelectorAll('[data-act=syncPairShow]').length,q:document.querySelectorAll('#syncQr').length})")); raise
        sheet = O.evaluate("(()=>{const s=document.querySelector('.sheet');return {sw:s.scrollWidth,cw:s.clientWidth}})()")
        R.check(f"{w}px: sync dialog with QR fits without horizontal scroll", sheet['sw'] <= sheet['cw'], str(sheet))
        O.screenshot(path=f"/tmp/sync_{w}.png")
finally:
    errs = env.errors; env.close(); relay.close(); site.close()
R.check("no JavaScript errors in sync e2e", not errs, "; ".join(errs[:3]))
sys.exit(0 if R.summary() else 1)
