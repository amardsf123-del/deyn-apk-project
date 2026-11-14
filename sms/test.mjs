import fs from 'node:fs'; import vm from 'node:vm'; import assert from 'node:assert/strict';
const context={globalThis:{},Date,Map,Set,Math,Number,String,Array,Object,JSON,RegExp}; context.window=context.globalThis; vm.createContext(context); vm.runInContext(fs.readFileSync(new URL('./engine.js',import.meta.url),'utf8'),context); const C=context.globalThis.DeynSmsCore;
const c={id:'c1',name:'Ali',phone:'0555123456',payDay:null,tx:[{id:'d1',type:'debt',amount:1000,ts:1000,dueAt:100000},{id:'d2',type:'debt',amount:500,ts:2000,dueAt:200000},{id:'p1',type:'pay',amount:700,ts:3000}]};
assert.deepEqual(JSON.parse(JSON.stringify(C.ledger(c).map(x=>[x.debt.id,x.remaining]))),[['d1',300],['d2',500]]);
const a=C.allocatePayment(c,400); assert.equal(a[0].debtId,'d1'); assert.equal(a[0].amount,300); assert.equal(a[1].debtId,'d2'); assert.equal(a[1].amount,100);
const before=C.ledger(c)[0].dueAt; const ex=C.extendDebt(c,'d2',2,'weeks',999); assert.equal(ex.to,200000+14*86400000); assert.equal(c.tx[1].extensionHistory.length,1);
const now=Date.now(); const due=now-2*86400000; const S={settings:{sms:{enabled:true}},customers:[{id:'x',name:'A',phone:'0555123456',smsEnabled:true,honorific:'monsieur',smsLang:'ar',tx:[{id:'dx',type:'debt',amount:100,ts:now-4*86400000,dueAt:due}]}],smsLog:{}};
const q=C.buildQueue(S,now); assert.equal(q.length,4); assert.equal(q[0].phone,'+213555123456'); assert.equal(C.phone('213555123456'),'+213555123456'); assert.match(q[0].message,/السيد/); assert.equal(C.validateBeforeSend(S,q[0],now).ok,true);
S.customers[0].smsEnabled=false; assert.equal(C.validateBeforeSend(S,q[0],now).reason,'customer-disabled'); S.customers[0].smsEnabled=true; S.customers[0].tx[0].amount=150; assert.equal(C.validateBeforeSend(S,q[0],now).reason,'amount-changed');
console.log('SMS core: allocation, extension, queue, phone normalization, templates, send-time validation passed');
// Explicit FIFO allocation is stable; a later debt is credited by a payment remainder only when needed.
const mixed={id:'m',tx:[{id:'old',type:'debt',amount:100,ts:10,dueAt:1000},{id:'pay',type:'pay',amount:150,ts:20,allocations:[{debtId:'old',amount:100}]},{id:'new',type:'debt',amount:200,ts:21,dueAt:2000}]};
assert.equal(C.ledger(mixed)[0].debt.id,'new'); assert.equal(C.ledger(mixed)[0].remaining,150);
// Old overdue backlog gets one catch-up reminder, not four simultaneous messages.
const oldNow=new Date(2026,10,12,12,0,0).getTime();
const oldS={settings:{sms:{enabled:true}},customers:[{id:'old-c',name:'Old',phone:'0661123456',tx:[{id:'old-d',type:'debt',amount:50,ts:oldNow-40*86400000,dueAt:oldNow-30*86400000}]}],smsLog:{}};
const oldQ=C.buildQueue(oldS,oldNow); assert.equal(oldQ.length,1); assert.equal(oldQ[0].step,4);
oldS.smsLog[oldQ[0].eventKeys[0]]={status:'accepted_by_android'}; assert.equal(C.buildQueue(oldS,oldNow).length,0);
// A large backlog compresses its interval but remains sequential and inside the allowed hours.
const many={settings:{sms:{enabled:true,intervalMinutes:5}},customers:[],smsLog:{}};
for(let i=0;i<80;i++)many.customers.push({id:'c'+i,name:'C'+i,phone:'0555123456',tx:[{id:'d'+i,type:'debt',amount:10,ts:oldNow-20*86400000,dueAt:oldNow-18*86400000}]});
const mq=C.buildQueue(many,new Date(2026,10,12,8,0,0).getTime());
assert.equal(mq.length,80); assert.ok(mq.every((x,i)=>i===0||x.at>mq[i-1].at));
assert.ok(mq.every(x=>{const d=new Date(x.at);return d.getHours()>=9&&d.getHours()<22;}));
console.log('SMS edge cases: old ledger, overpayment credit, backlog catch-up, dedupe, queue window passed');
// Global/customer switches and same-window debt grouping.
const comboNow=new Date(2026,10,12,12,0,0).getTime();
const combo={settings:{sms:{enabled:true}},customers:[{id:'combo',name:'Combo',phone:'0770123456',smsEnabled:true,tx:[{id:'ca',type:'debt',amount:120,ts:comboNow-10*86400000,dueAt:comboNow-5*86400000},{id:'cb',type:'debt',amount:80,ts:comboNow-9*86400000,dueAt:comboNow-5*86400000}]}],smsLog:{}};
const cq=C.buildQueue(combo,comboNow); const catchup=cq.find(x=>x.at<=comboNow+1000); assert.ok(catchup); assert.equal(catchup.amount,200); assert.equal(catchup.debtIds.length,2);
combo.settings.sms.enabled=false; assert.equal(C.buildQueue(combo,comboNow).length,0); combo.settings.sms.enabled=true; combo.customers[0].smsEnabled=false; assert.equal(C.buildQueue(combo,comboNow).length,0);
// Legacy FIFO allocation is derived without mutating the historical ledger.
const legacy={tx:[{id:'l1',type:'debt',amount:900,ts:1},{id:'l2',type:'pay',amount:250,ts:2}]}; const beforeLegacy=JSON.stringify(legacy); assert.equal(C.ledger(legacy)[0].remaining,650); assert.equal(JSON.stringify(legacy),beforeLegacy);
// Monthly legacy due-date derivation uses the customer's existing pay-day, without rewriting old events.
const monthly={payDay:20,tx:[{id:'m1',type:'debt',amount:100,ts:new Date(2026,10,10).getTime()}]}; assert.ok(C.ledger(monthly)[0].dueAt>monthly.tx[0].ts); assert.equal(monthly.tx[0].dueAt,undefined);
console.log('SMS integration cases: global/per-customer controls, debt aggregation and legacy non-mutation passed');
// Extending a debt starts a new reminder cycle for that debt while preserving its old reminder history.
const extNow=new Date(2026,10,12,12,0,0).getTime();
const extState={settings:{sms:{enabled:true}},customers:[{id:'ext',name:'Extend',phone:'0555123456',tx:[{id:'ed',type:'debt',amount:400,ts:extNow-40*86400000,dueAt:extNow-30*86400000}]}],smsLog:{}};
const oldReminder=C.buildQueue(extState,extNow)[0]; extState.smsLog[oldReminder.eventKeys[0]]={status:'accepted_by_android'}; extState.smsLog[oldReminder.key]={status:'accepted_by_android'};
C.extendDebt(extState.customers[0],'ed',40,'days',extNow);
const afterExtend=C.buildQueue(extState,extNow); assert.equal(afterExtend.length,4); assert.ok(afterExtend.every(x=>x.id!==oldReminder.id));
console.log('SMS extension reschedule: a new due-date cycle is not blocked by old reminder keys');
// Different reminder stages that are both already due are combined into one SMS for the same customer.
const mixedStep={settings:{sms:{enabled:true}},customers:[{id:'mix',name:'Mix',phone:'0555123456',tx:[{id:'a',type:'debt',amount:100,ts:comboNow-10*86400000,dueAt:comboNow-2*86400000},{id:'b',type:'debt',amount:200,ts:comboNow-12*86400000,dueAt:comboNow-5*86400000}]}],smsLog:{}};
const mixQueue=C.buildQueue(mixedStep,comboNow).filter(x=>x.at<=comboNow+1000); assert.equal(mixQueue.length,1); assert.equal(mixQueue[0].amount,300); assert.equal(mixQueue[0].events.length,2);
console.log('SMS aggregation: overdue debts from different reminder stages are combined without suppression');

// An uncertain native dispatch remains suppressed to avoid accidental duplicate texts.
const uncertainState={settings:{sms:{enabled:true}},customers:[{id:'u',name:'U',phone:'0555123456',tx:[{id:'ud',type:'debt',amount:10,ts:comboNow-10*86400000,dueAt:comboNow-5*86400000}]}],smsLog:{}};const uq=C.buildQueue(uncertainState,comboNow)[0];uncertainState.smsLog[uq.eventKeys[0]]={status:'dispatch_uncertain'};assert.equal(C.buildQueue(uncertainState,comboNow).filter(x=>x.at<=comboNow+1000).length,0);console.log('SMS uncertain dispatch: duplicate suppression remains active');

// Corrupt/partial stored settings fall back to safe defaults rather than silently disabling the queue.
const safe=C.config({days:[],times:[],start:'00:00',end:'23:59',intervalMinutes:999});assert.deepEqual(JSON.parse(JSON.stringify(safe.days)),[1,4,8,15]);assert.deepEqual(JSON.parse(JSON.stringify(safe.times)),['10:00','11:00','16:00','10:00']);assert.equal(safe.start,'09:00');assert.equal(safe.end,'22:00');assert.equal(safe.intervalMinutes,60);console.log('SMS settings recovery: malformed stored configuration falls back safely');

// Group IDs stay compact even when one customer has a large number of debt events.
const bulk={settings:{sms:{enabled:true}},customers:[{id:'bulk',name:'Bulk',phone:'0555123456',tx:Array.from({length:250},(_,i)=>({id:'debt-'+i,type:'debt',amount:1,ts:comboNow-20*86400000,dueAt:comboNow-10*86400000}))}],smsLog:{}};const bulkQ=C.buildQueue(bulk,comboNow);assert.ok(bulkQ.every(x=>x.id.length<100));console.log('SMS queue IDs: large grouped reminders keep compact idempotency keys');

// Explicit per-customer opt-out remains effective independently of the global switch.
const opted={settings:{sms:{enabled:true}},customers:[{id:'opt',name:'Opt',phone:'0555123456',smsEnabled:true,smsOptOut:true,tx:[{id:'od',type:'debt',amount:100,ts:comboNow-10*86400000,dueAt:comboNow-5*86400000}]}],smsLog:{}};assert.equal(C.buildQueue(opted,comboNow).length,0);console.log('SMS opt-out: explicit customer opt-out overrides an enabled global setting');

// A debt due at the end of yesterday must trigger at the configured time today (not wait 24 elapsed hours).
const exactDue=new Date(2026,10,11,23,59,59,999).getTime();
const exactNow=new Date(2026,10,12,14,15,0).getTime();
const exactState={settings:{sms:{enabled:true,days:[1,4,8,15],times:['14:15','11:00','16:00','10:00']}},customers:[{id:'exact',name:'Exact',phone:'0555123456',tx:[{id:'exact-debt',type:'debt',amount:75,ts:exactDue-3*86400000,dueAt:exactDue}]}],smsLog:{}};
const exactQueue=C.buildQueue(exactState,exactNow);const exactReminder=exactQueue.find(x=>x.step===1);assert.ok(exactReminder);assert.equal(exactReminder.at,exactNow);assert.equal(C.validateBeforeSend(exactState,exactReminder,exactNow).ok,true);
console.log('Calendar-time regression: day-1 reminder at 14:15 fires despite dueAt being stored at 23:59');
const named={settings:{sms:{enabled:true,storeName:'محل الأمانة'}},customers:[{id:'named',name:'Test',phone:'0555123456',tx:[{id:'nd',type:'debt',amount:30,ts:exactDue-3*86400000,dueAt:exactDue}]}],smsLog:{}};
assert.match(C.buildQueue(named,exactNow)[0].message,/محل الأمانة/);
console.log('Store name regression: configured merchant name is inserted into reminder template');

// The default Arabic reminder and dedicated test stay within one Unicode SMS segment for typical values.
assert.ok(C.DEFAULTS.tplAr.length < 70, 'compact default Arabic template should fit a single Unicode segment before variable expansion');
assert.ok(C.testMessage('12/11/2026').length <= 70, 'Arabic test SMS must fit one Unicode segment');
assert.match(C.testMessage('12/11/2026'), /اختبار SMS ناجح/);
console.log('SMS delivery regression: short default template and single-part test message passed');

const oldDefaultAr='السلام عليكم {title} {name}، نذكّركم بأن عليكم مبلغ {amount} دج مستحق منذ {date}. نرجو التسوية عند الإمكان. شكرًا لكم 😊';
const oldDefaultFr='Bonjour {title} {name}, nous vous rappelons que votre solde de {amount} DA est dû depuis le {date}. Merci de régulariser dès que possible 😊';
const migrated=C.config({tplAr:oldDefaultAr,tplFr:oldDefaultFr});
assert.equal(migrated.tplAr,C.DEFAULTS.tplAr,'existing installs migrate the shipped Arabic default to the compact template');
assert.equal(migrated.tplFr,C.DEFAULTS.tplFr,'existing installs migrate the shipped French default to the compact template');
assert.equal(C.config({tplAr:'قالب مخصص'}).tplAr,'قالب مخصص','owner custom templates must not be overwritten');
const sampleReminder=C.DEFAULTS.tplAr.replace('{title}','السيد').replace('{name}','علي').replace('{amount}','1,000').replace('{date}','12/11/2026');
assert.ok(sampleReminder.length<=70,'typical Arabic reminder must fit one Unicode SMS segment');
console.log('SMS template migration: old defaults upgraded, custom templates preserved, typical reminder is one part');

// ============================================================================
// NEW TESTS: Long multi-part Arabic SMS segmentation & per-part result tracking
// ============================================================================
const longCustomArTpl = 'السلام عليكم ورحمة الله وبركاته {title} {name}، نحيطكم علماً بأن رصيد دينكم الحالي في {store} قد بلغ {amount} دج وهو مستحق السداد منذ تاريخ {date}. نرجو منكم التكرم بتسوية الوضعية في أقرب وقت ممكن وشكراً جزيلاً لثقتكم وتعاونكم الدائم معنا.';
const longState = {
  settings: { sms: { enabled: true, tplAr: longCustomArTpl, storeName: 'سوبرماركت الأمانة والوفاء' } },
  customers: [{ id: 'long-cust', name: 'عبد الرحمان بن بوزيد', phone: '0555987654', honorific: 'monsieur', smsLang: 'ar', tx: [{ id: 'ld1', type: 'debt', amount: 14250, ts: exactDue - 5 * 86400000, dueAt: exactDue }] }],
  smsLog: {}
};
const longQueue = C.buildQueue(longState, exactNow);
assert.ok(longQueue.length >= 1, 'long Arabic reminder should be queued');
const longItem = longQueue[0];
assert.equal(longItem.encoding, 'UCS-2', 'Arabic message must use UCS-2 encoding');
assert.ok(longItem.partsCount >= 3, `expected at least 3 UCS-2 segments for long custom Arabic message, got ${longItem.partsCount}`);
assert.equal(longItem.parts.length, longItem.partsCount, 'parts array length must match partsCount');
assert.equal(longItem.parts.join(''), longItem.message, 'concatenating all parts must reconstruct the exact original Arabic message without any lost character');
assert.ok(longItem.parts.every(p => p.length <= 67), 'every UCS-2 multipart segment must be <= 67 UTF-16 code units');

// Verify status lifecycle: attempting -> accepted_by_android -> partial_failure vs sent_to_network -> delivered
const meta = { customerName: 'عبد الرحمان بن بوزيد', phone: longItem.phone };
const stAttempting = C.reconcileStatus(null, { status: 'attempting', partsTotal: longItem.partsCount, partsSent: 0, partsFailed: 0 }, meta);
assert.equal(stAttempting.status, 'attempting');
assert.equal(stAttempting.sent, false);

const stAccepted = C.reconcileStatus(stAttempting, { status: 'accepted_by_android', partsTotal: longItem.partsCount, partsSent: 0, partsFailed: 0 }, meta);
assert.equal(stAccepted.status, 'accepted_by_android');
assert.equal(stAccepted.sent, false, 'accepted_by_android alone must NOT mark sent=true');

// Partial failure: 2 of 3 parts sent, 1 part failed -> MUST NOT be recorded as full success!
const stPartial = C.reconcileStatus(stAccepted, {
  status: 'sent_to_network', // even if caller passed sent_to_network erroneously
  partsTotal: 3,
  partsSent: 2,
  partsFailed: 1
}, meta);
assert.equal(stPartial.status, 'partial_failure', 'failure of 1 part in a 3-part SMS must be recorded as partial_failure');
assert.equal(stPartial.sent, false, 'partial_failure must NEVER set sent=true');
assert.equal(stPartial.partsSent, 2);
assert.equal(stPartial.partsFailed, 1);

// Complete failure: 0 of 3 parts sent -> recorded as failed and does NOT block retry in buildQueue
const stFailed = C.reconcileStatus(stAccepted, { status: 'failed', partsTotal: 3, partsSent: 0, partsFailed: 3 }, meta);
assert.equal(stFailed.status, 'failed');
assert.equal(stFailed.sent, false);
assert.equal(C.isLogBlocking(stFailed), false, 'a completely failed SMS (0 parts sent) must allow retry');

// Full multi-part network success: 3 of 3 parts sent, 0 failed -> sent_to_network (sent=true)
const stAllSent = C.reconcileStatus(stAccepted, { status: 'sent_to_network', partsTotal: 3, partsSent: 3, partsFailed: 0 }, meta);
assert.equal(stAllSent.status, 'sent_to_network');
assert.equal(stAllSent.sent, true, 'all 3 parts confirmed sent to network sets sent=true');
assert.equal(stAllSent.delivered, false);

// Full multi-part carrier delivery confirmation: 3 of 3 parts delivered -> delivered (sent=true, delivered=true)
const stDelivered = C.reconcileStatus(stAllSent, { status: 'delivered', partsTotal: 3, partsSent: 3, partsFailed: 0, partsDelivered: 3 }, meta);
assert.equal(stDelivered.status, 'delivered');
assert.equal(stDelivered.sent, true);
assert.equal(stDelivered.delivered, true);
console.log('SMS multipart & per-part status verification: 3-part Arabic segmentation, partial failure rejection, retry on full failure, and network/delivery confirmation passed');

// Regression: "auto" customer language follows the current app language; explicit preferences win.
assert.equal(C.resolveSmsLang('auto', 'fr'), 'fr');
assert.equal(C.resolveSmsLang(undefined, 'fr'), 'fr');
assert.equal(C.resolveSmsLang('auto', 'ar'), 'ar');
assert.equal(C.resolveSmsLang('ar', 'fr'), 'ar');
assert.equal(C.resolveSmsLang('fr', 'ar'), 'fr');
const autoLangState = {
  settings: { sms: { enabled: true, tplFr: 'Bonjour {title} {name}, solde {amount} DA dû depuis {date}.', tplAr: 'السلام {name} {amount}' } },
  customers: [{ id: 'auto-fr', name: 'Ali', phone: '0555123456', smsLang: 'auto', honorific: 'monsieur',
    tx: [{ id: 'auto-debt', type: 'debt', amount: 50, ts: exactDue - 5 * 86400000, dueAt: exactDue }] }],
  smsLog: {}
};
const autoFrenchQueue = C.buildQueue(autoLangState, exactNow, 'fr');
assert.ok(autoFrenchQueue.length > 0);
assert.match(autoFrenchQueue[0].message, /^Bonjour Monsieur Ali/);
console.log('SMS auto-language regression: automatic language follows the active app language; explicit customer language takes priority');

// Regression: changing the global SMS switch must never rewrite a customer's explicit opt-out or enable flag.
const globalToggleState = { settings: { sms: { enabled: false } }, customers: [
  { id: 'opt-out', phone: '0555123456', smsEnabled: false, smsOptOut: true },
  { id: 'legacy-disabled', phone: '0555123457', smsEnabled: false, smsOptOut: false },
  { id: 'allowed', phone: '0555123458', smsEnabled: true, smsOptOut: false }
] };
const preferenceSnapshot = JSON.stringify(globalToggleState.customers);
C.setGlobalEnabled(globalToggleState, true);
assert.equal(globalToggleState.settings.sms.enabled, true);
assert.equal(JSON.stringify(globalToggleState.customers), preferenceSnapshot);
C.setGlobalEnabled(globalToggleState, false);
assert.equal(JSON.stringify(globalToggleState.customers), preferenceSnapshot);
console.log('SMS global-toggle regression: global enable/disable preserves all per-customer preferences');


// A repeated app-state persist later on the same local day must not change queued timestamps.
const stableLaterNow = exactNow + 60 * 60000;
const stableFirstPlan = C.buildQueue(exactState, exactNow);
const stableSecondPlan = C.buildQueue(exactState, stableLaterNow);
assert.deepEqual(
  JSON.parse(JSON.stringify(stableFirstPlan.map(x => [x.id, x.at]))),
  JSON.parse(JSON.stringify(stableSecondPlan.map(x => [x.id, x.at]))),
  'rescheduling the same queue later in the same day must keep stable native WorkManager timestamps'
);
console.log('SMS schedule stability regression: routine app persists do not move queued reminders within the same day');


// A reminder's native id must survive the exact moment its scheduled time becomes overdue.
const beforeReminderQueue = C.buildQueue(exactState, exactNow - 30 * 60000);
const afterReminderQueue = C.buildQueue(exactState, exactNow + 30 * 60000);
assert.equal(beforeReminderQueue.find(x => x.step === 1).id, afterReminderQueue.find(x => x.step === 1).id);
console.log('SMS idempotency regression: a queued reminder retains its id when the scheduled time passes');
