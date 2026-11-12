import fs from 'node:fs'; import vm from 'node:vm'; import assert from 'node:assert/strict';
const context={globalThis:{},Date,Map,Set,Math,Number,String,Array,Object,JSON}; context.window=context.globalThis; vm.createContext(context); vm.runInContext(fs.readFileSync(new URL('./engine.js',import.meta.url),'utf8'),context); const C=context.globalThis.DeynSmsCore;
const c={id:'c1',name:'Ali',phone:'0555123456',payDay:null,tx:[{id:'d1',type:'debt',amount:1000,ts:1000,dueAt:100000},{id:'d2',type:'debt',amount:500,ts:2000,dueAt:200000},{id:'p1',type:'pay',amount:700,ts:3000}]};
assert.deepEqual(JSON.parse(JSON.stringify(C.ledger(c).map(x=>[x.debt.id,x.remaining]))),[['d1',300],['d2',500]]);
const a=C.allocatePayment(c,400); assert.equal(a[0].debtId,'d1'); assert.equal(a[0].amount,300); assert.equal(a[1].debtId,'d2'); assert.equal(a[1].amount,100);
const before=C.ledger(c)[0].dueAt; const ex=C.extendDebt(c,'d2',2,'weeks',999); assert.equal(ex.to,200000+14*86400000); assert.equal(c.tx[1].extensionHistory.length,1);
const now=Date.now(); const due=now-2*86400000; const S={settings:{sms:{enabled:true}},customers:[{id:'x',name:'A',phone:'0555123456',smsEnabled:true,honorific:'monsieur',smsLang:'ar',tx:[{id:'dx',type:'debt',amount:100,ts:now-4*86400000,dueAt:due}]}],smsLog:{}};
const q=C.buildQueue(S,now); assert.equal(q.length,4); assert.equal(q[0].phone,'+213555123456'); assert.match(q[0].message,/السيد/); assert.equal(C.validateBeforeSend(S,q[0],now).ok,true);
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
