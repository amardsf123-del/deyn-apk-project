"""
Integration test: the REAL app (index.html with the integrated SMS engine/runtime) running in Chromium against a recording
mock of the native `DeynSms` Capacitor plugin. It verifies exactly what JavaScript hands to the native scheduler
(items, ids, timestamps, messages, window, force flag) for every business rule in the SMS-reminder spec.
It does NOT prove native delivery (see tests/android-sim for the native state machine, and the manual device checklist).
"""
import json, sys, re
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent))
from harness import *

R = Results()
site = Site()
env = Env(site)

BRIDGE = r"""
(function(){
  const calls=[]; window.__smsCalls=calls; window.__smsSent={items:[]}; window.__smsPerm='granted';
  const P={
    checkPermissions:async()=>({sms:window.__smsPerm}),
    requestPermissions:async()=>({sms:window.__smsPerm}),
    getSent:async()=>window.__smsSent,
    schedule:async(a)=>{calls.push({m:'schedule',a:JSON.parse(JSON.stringify(a))});return {count:(a.items||[]).length,active:(a.items||[]).length};},
    send:async(a)=>{calls.push({m:'send',a});return {status:'sent_to_network',partsTotal:1,partsSent:1,partsFailed:0,sent:true,accepted:true};},
    release:async(a)=>{calls.push({m:'release',a});return {released:true,requeued:false};},
    getDiagnostics:async()=>({now:Date.now(),sdk:34,permissionSendSms:true,timezone:'Africa/Algiers',utcOffsetMinutes:60,windowEndMinutes:1320,
      nextSendAt:0,lastScheduleAt:Date.now(),lastScheduleCount:1,sweeperState:'ENQUEUED',simState:5,airplaneMode:false,ignoringBatteryOptimizations:false,
      queue:[{ref:'ab12cd34',to:'+213•••456',at:Date.now()+3600000,status:'queued',attempts:0,workState:'ENQUEUED',pendingJobAt:Date.now()+3600000,pendingJobReason:'scheduled'}]})
  };
  const iv=setInterval(()=>{ if(window.Capacitor&&window.Capacitor.Plugins){ window.Capacitor.Plugins.DeynSms=P; clearInterval(iv);} },1);
  if(window.Capacitor&&window.Capacitor.Plugins) window.Capacitor.Plugins.DeynSms=P;
})();
"""
env.ctx.add_init_script(BRIDGE)

DAY = 86400000
def boot():
    pg = env.new_app(); dev = env.dev_id(pg)
    env.activate(pg, env.license(dev, "LT", "M"))
    assert env.started(pg), env.gate_err(pg)
    pg.wait_for_timeout(1500)
    pg.evaluate("(()=>{try{S.auth.pwMustSet=false;}catch(e){} for(let i=0;i<5;i++){try{closeModal()}catch(e){}}})()"); pg.wait_for_timeout(400)
    return pg

def setup(pg, customers, cfg=None, lang='ar'):
    pg.evaluate("""([customers,cfg,lang])=>{
        S.customers=customers; S.smsLog={}; S.smsQueueMeta={};
        S.settings=S.settings||{}; S.settings.sms=Object.assign({enabled:true},cfg||{});
        window.__smsCalls.length=0; window.__smsSent={items:[]};
        if(DEYN_I18N.lang!==lang){ DEYN_I18N.set(lang,true); }
        requireOwner=()=>true;
        persist();
    }""", [customers, cfg, lang])
    pg.wait_for_timeout(700)

def last_schedule(pg):
    return pg.evaluate("(()=>{const c=window.__smsCalls.filter(x=>x.m==='schedule');return c.length?c[c.length-1].a:null})()")
def schedules(pg): return pg.evaluate("window.__smsCalls.filter(x=>x.m==='schedule').map(x=>x.a)")
def due_items(s, horizon=60000):
    n = s.get('__now') or 0
    return s['items']
def now_ms(pg): return pg.evaluate("Date.now()")

def cust(cid='c1', name='Ali', phone='0555123456', txs=None, **extra):
    d = dict(id=cid, name=name, phone=phone, tx=txs or [])
    d.update(extra); return d

try:
    pg = boot()
    n = now_ms(pg)
    due_past = pg.evaluate("(()=>{const d=new Date(Date.now()-3*86400000);d.setHours(23,59,59,999);return d.getTime()})()")
    debt = lambda amt, **k: dict(id='d1', type='debt', amount=amt, ts=n-10*DAY, dueAt=due_past, note='x', **k)

    # 1. scheduled reminder is created and handed to the native scheduler with the correct data -----------------------
    setup(pg, [cust(txs=[debt(5000)])])
    s = last_schedule(pg)
    R.check("1 reminders are handed to the native scheduler: 1 due now + 3 later steps", s and len(s['items']) == 4 and len([i for i in s['items'] if i['at'] <= n + DAY]) >= 1, json.dumps(s)[:200])
    it = s['items'][0] if s and s['items'] else {}
    R.check("1 recipient is the normalized customer number", it.get('phone') in ('+213555123456', '0555123456'), str(it.get('phone')))
    R.check("1 message carries the real remaining balance", '5,000' in it.get('message', ''), it.get('message', ''))
    R.check("1 native scheduler is told the merchant's sending-window end", s.get('windowEndMinutes') == 22 * 60, str(s.get('windowEndMinutes')))

    # 2. routine saves: same id / same timestamp / force only once -----------------------------------------------------
    pg.evaluate("persist()"); pg.wait_for_timeout(500); pg.evaluate("persist()"); pg.wait_for_timeout(500)
    ss = schedules(pg)
    runs = [json.dumps([[i['id'], i['at'], i['message']] for i in a['items']]) for a in ss]
    R.check("2 routine saves hand over identical ids/timestamps/messages every time (no churn)", len(set(runs)) == 1 and len(runs) >= 2, str(len(set(runs))))
    R.check("2 force is requested only on the first real scheduling run; routine saves never force", [a.get('force') for a in ss][1:] == [False] * (len(ss) - 1) and len(ss) >= 3, str([a.get('force') for a in ss]))
    pg.evaluate("window.__smsCalls.length=0; A.smsRescheduleNow()"); pg.wait_for_timeout(600)
    R.check("2 'reschedule now' (and first run after launch) asks native to force-restore every job", last_schedule(pg).get('force') is True)

    # 3. full payment before the reminder: queue becomes empty -------------------------------------------------------
    pg.evaluate("""()=>{const c=S.customers[0];c.tx.push({id:'p1',type:'pay',amount:5000,ts:Date.now(),note:''});persist();}""")
    pg.wait_for_timeout(700)
    R.check("3 full payment cancels the reminder (empty item list sent to native)", last_schedule(pg)['items'] == [])

    # 4. partial payment: message shows the updated remaining balance ----------------------------------------------
    setup(pg, [cust(txs=[debt(5000)])])
    pg.evaluate("""()=>{const c=S.customers[0];c.tx.push({id:'p2',type:'pay',amount:2000,ts:Date.now(),note:''});persist();}""")
    pg.wait_for_timeout(700)
    s = last_schedule(pg)
    R.check("4 partial payment updates the balance in the next message (3,000 not 5,000)", s['items'] and '3,000' in s['items'][0]['message'] and '5,000' not in s['items'][0]['message'], json.dumps(s)[:240])

    # 5. per-customer opt-out ------------------------------------------------------------------------------------------
    setup(pg, [cust(txs=[debt(5000)], smsOptOut=True)])
    R.check("5 opted-out customer: nothing scheduled", last_schedule(pg)['items'] == [])

    # 6. global OFF then ON never re-enables an opted-out customer ---------------------------------------------------
    setup(pg, [cust('c1', 'Ali', '0555123456', [debt(5000)], smsOptOut=True), cust('c2', 'Omar', '0666123456', [dict(id='d2', type='debt', amount=700, ts=n-10*DAY, dueAt=due_past)])])
    pg.evaluate("DeynSmsCore.setGlobalEnabled(S,false);persist()"); pg.wait_for_timeout(600)
    R.check("6 global OFF: queue is emptied", last_schedule(pg)['items'] == [])
    pg.evaluate("DeynSmsCore.setGlobalEnabled(S,true);persist()"); pg.wait_for_timeout(600)
    s = last_schedule(pg)
    flags = pg.evaluate("S.customers.map(c=>[c.id,c.smsOptOut===true])")
    R.check("6 global ON again: only the non-opted-out customer is scheduled", s['items'] and all(i['id'].startswith('c2|') for i in s['items']) and '700' in s['items'][0]['message'], json.dumps(s)[:200])
    R.check("6 individual opt-out flag untouched by the global switch", flags == [['c1', True], ['c2', False]], str(flags))

    # 7. worker device never sends ------------------------------------------------------------------------------------
    setup(pg, [cust(txs=[debt(5000)])])
    pg.evaluate("window.__origW=isWorkerDevice; isWorkerDevice=()=>true; window.__smsCalls.length=0; persist()"); pg.wait_for_timeout(700)
    R.check("7 secondary (worker) device hands an EMPTY queue to native", last_schedule(pg)['items'] == [])
    pg.evaluate("isWorkerDevice=window.__origW")

    # 8. debt without due date: skipped by default, scheduled when the merchant sets default due days ------------------
    nodue = dict(id='d9', type='debt', amount=1200, ts=n - 6 * DAY, note='y')
    setup(pg, [cust(txs=[nodue])])
    R.check("8 debt with no due date and no pay day yields no reminder by default", last_schedule(pg)['items'] == [])
    diag = pg.evaluate("DeynSmsCore.diagnose(S,Date.now(),'ar')")
    R.check("8 diagnostics explain it: 1 debt without due date", diag['debtsWithoutDueDate'] == 1 and diag['queue'] == 0, json.dumps(diag)[:200])
    setup(pg, [cust(txs=[nodue])], cfg={'defaultDueDays': 3})
    s = last_schedule(pg)
    R.check("8 with defaultDueDays=3 the same debt enters the reminder schedule", s['items'] and '1,200' in s['items'][0]['message'], json.dumps(s)[:200])

    # 9. language: automatic follows the app, explicit customer language wins ---------------------------------------
    setup(pg, [cust(txs=[debt(5000)])], lang='fr')
    s = last_schedule(pg)
    R.check("9 automatic language follows the app (French)", s['items'] and 'Bonjour' in s['items'][0]['message'], json.dumps(s)[:240])
    setup(pg, [cust(txs=[debt(5000)], smsLang='ar')], lang='fr')
    s = last_schedule(pg)
    R.check("9 explicit Arabic on the customer overrides French app language", s['items'] and 'السلام' in s['items'][0]['message'], json.dumps(s)[:240])
    setup(pg, [cust(txs=[debt(5000)], smsLang='fr')], lang='ar')
    s = last_schedule(pg)
    R.check("9 explicit French on the customer overrides Arabic app language", s['items'] and 'Bonjour' in s['items'][0]['message'], json.dumps(s)[:240])

    # 10. several overdue debts are consolidated into ONE message -----------------------------------------------------
    d1 = dict(id='da', type='debt', amount=1000, ts=n - 12 * DAY, dueAt=due_past, note='a'); d2 = dict(id='db', type='debt', amount=2500, ts=n - 11 * DAY, dueAt=due_past, note='b')
    setup(pg, [cust(txs=[d1, d2])])
    s = last_schedule(pg)
    R.check("10 two overdue debts -> ONE consolidated SMS with the total (not two messages)", s['items'] and len([i for i in s['items'] if '3,500' in i['message']]) >= 1 and not any('1,000' in i['message'] or '2,500' in i['message'] for i in s['items']), json.dumps(s)[:240])

    # 11. permission missing: queue is NOT erased, no spam ---------------------------------------------------------------
    setup(pg, [cust(txs=[debt(5000)])])
    pg.evaluate("window.__smsPerm='denied'; window.__smsCalls.length=0; persist()"); pg.wait_for_timeout(700)
    R.check("11 permission denied: JS does not wipe the native queue", not any(c['items'] == [] for c in schedules(pg)))
    pg.evaluate("window.__smsPerm='granted'; persist()"); pg.wait_for_timeout(700)
    R.check("11 permission granted: scheduling resumes with the same reminder", last_schedule(pg) and len(last_schedule(pg)['items']) >= 1)

    # 12. one customer's problem does not block another ------------------------------------------------------------
    setup(pg, [cust('c1', 'Ali', '0555123456', [debt(5000)]), cust('c2', 'Bad', '12', [dict(id='dx', type='debt', amount=100, ts=n-9*DAY, dueAt=due_past)]), cust('c3', 'Sam', '0770123456', [dict(id='dy', type='debt', amount=300, ts=n-9*DAY, dueAt=due_past)])])
    s = last_schedule(pg)
    R.check("12 an invalid phone for one customer does not block the others", {i['id'].split('|')[0] for i in s['items']} == {'c1', 'c3'}, json.dumps(sorted({i['id'].split('|')[0] for i in s['items']})))

    # 13. native-reported failure: exhausted stays blocked + manual retry button calls release --------------------------
    setup(pg, [cust(txs=[debt(5000)])])
    qid = last_schedule(pg)['items'][0]['id']
    pg.evaluate("""(id)=>{window.__smsSent={items:[{id,status:'failed',partsTotal:1,partsSent:0,partsFailed:1,attempts:6,exhausted:true,error:'part=1/1,resultCode=4'}]};persist();}""", qid)
    pg.wait_for_timeout(800)
    s = last_schedule(pg)
    R.check("13 an exhausted failure is NOT silently re-queued (its id is out of the queue)", qid not in [i['id'] for i in s['items']], json.dumps(s)[:200])
    pg.evaluate("A.smsHistory()"); pg.wait_for_timeout(300)
    R.check("13 history offers a manual Retry for it", pg.locator("[data-act=smsRetry]").count() == 1)
    pg.evaluate("window.__smsSent={items:[]}")
    pg.click("[data-act=smsRetry]"); pg.wait_for_timeout(900)
    rel = pg.evaluate("window.__smsCalls.filter(x=>x.m==='release')")
    R.check("13 Retry calls native release(id) and re-queues the reminder", len(rel) == 1 and rel[0]['a']['id'] == qid and qid in [i['id'] for i in last_schedule(pg)['items']], json.dumps(rel)[:160] + json.dumps(last_schedule(pg))[:160])

    # 14. diagnostics screen renders, hides private data, and is fully French in French mode -------------------------------
    setup(pg, [cust('c1', 'Ali', '0555123456', [debt(5000)])], lang='fr')
    pg.evaluate("A.smsDiag()"); pg.wait_for_timeout(1200)
    txt = pg.evaluate("(()=>{const m=[...document.querySelectorAll('.sheet')].pop();return m?m.innerText:''})()")
    R.check("14 diagnostics modal opens and lists the native queue", 'ab12cd34' in txt, txt[:200])
    R.check("14 diagnostics contain no customer name or message body", 'Ali' not in txt and 'Bonjour' not in txt)
    arabic = re.findall(r'[\u0600-\u06FF]+', txt)
    R.check("14 diagnostics are fully French in French mode (no Arabic left)", not arabic, str(arabic[:8]))
    pg.evaluate("closeModal()")

    R.check("no JavaScript errors during the whole run", not env.errors, str(env.errors[:3]))
finally:
    env.close(); site.close()

R.summary()
sys.exit(0 if all(ok for _, ok, _ in R.rows) else 1)
