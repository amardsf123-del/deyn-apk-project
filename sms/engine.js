/* DEYN SMS core: deterministic debt allocation, per-debt due dates, reminders and queue planning. */
(function (root) {
  'use strict';
  const DAY = 86400000;
  const DEFAULTS = Object.freeze({ enabled:false, days:[1,4,8,15], times:['10:00','11:00','16:00','10:00'], start:'09:00', end:'22:00', intervalMinutes:5, tplAr:'السلام عليكم {title} {name}، نذكّركم بأن عليكم مبلغ {amount} دج مستحق منذ {date}. نرجو التسوية عند الإمكان. شكرًا لكم 😊', tplFr:'Bonjour {title} {name}, nous vous rappelons que votre solde de {amount} DA est dû depuis le {date}. Merci de régulariser dès que possible 😊', storeName:'' });
  const clone = x => JSON.parse(JSON.stringify(x));
  function stableHash(value) { let a=2166136261,b=0x9e3779b9; const s=String(value); for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b^c,2246822519);}return (a>>>0).toString(36)+(b>>>0).toString(36); }
  const validDate = n => Number.isFinite(Number(n)) && Number(n) > 0;
  const localAt = (base, hhmm) => { const [h,m] = String(hhmm||'09:00').split(':').map(Number); const d = new Date(base); d.setHours(h||0,m||0,0,0); return d.getTime(); };
  const parseTime = s => { const m=/^(\d{2}):(\d{2})$/.exec(String(s||'')); return m && +m[1]<24 && +m[2]<60 ? [+m[1],+m[2]] : null; };
  function config(raw) {
    const c=Object.assign({},DEFAULTS,raw||{});
    const days=Array.isArray(c.days)&&c.days.length===4?c.days.map(Number):[];
    c.days=days.length===4&&days.every((x,i)=>Number.isInteger(x)&&x>=1&&x<=90&&(i===0||x>days[i-1]))?days:DEFAULTS.days.slice();
    const times=Array.isArray(c.times)&&c.times.length===4?c.times.slice():[];
    c.times=times.length===4&&times.every(x=>!!parseTime(x))?times:DEFAULTS.times.slice();
    c.start='09:00';
    if (!parseTime(c.end)||c.end<='09:00'||c.end>'22:00') c.end=DEFAULTS.end;
    c.intervalMinutes=Math.max(1,Math.min(60,Number(c.intervalMinutes)||5));
    if(typeof c.tplAr!=='string'||!c.tplAr.trim()||c.tplAr.length>500)c.tplAr=DEFAULTS.tplAr;
    if(typeof c.tplFr!=='string'||!c.tplFr.trim()||c.tplFr.length>500)c.tplFr=DEFAULTS.tplFr;
    c.storeName=String(c.storeName||'').trim().slice(0,80);
    return c;
  }
  function nextMonthlyDue(ts, day) {
    if (!day || day<1 || day>31) return null;
    const d=new Date(ts), y=d.getFullYear(), m=d.getMonth();
    let due=new Date(y,m,Math.min(day,new Date(y,m+1,0).getDate()),23,59,59,999).getTime();
    if (due < ts) { const nm=m+1; due=new Date(y,nm,Math.min(day,new Date(y,nm+1,0).getDate()),23,59,59,999).getTime(); }
    return due;
  }
  function ledger(c) {
    const debts=(c.tx||[]).filter(t=>t.type==='debt').slice().sort((a,b)=>(a.ts-b.ts)||String(a.id).localeCompare(String(b.id)));
    const left=new Map(debts.map(d=>[d.id,Number(d.amount)||0]));
    const pays=(c.tx||[]).filter(t=>t.type==='pay').slice().sort((a,b)=>(a.ts-b.ts)||String(a.id).localeCompare(String(b.id)));
    for (const p of pays) {
      let remaining=Number(p.amount)||0;
      const alloc=Array.isArray(p.allocations)?p.allocations:null;
      if (alloc) {
        for (const a of alloc) { if (!left.has(a.debtId)) continue; const use=Math.min(left.get(a.debtId),Math.max(0,Number(a.amount)||0),remaining); left.set(a.debtId,Math.max(0,left.get(a.debtId)-use)); remaining-=use; if(remaining<=0) break; }
        // If a payment exceeds the old balance, its remainder is a credit against debts added in the same operation/later.
        for (const d of debts) { if (remaining<=0) break; if (Number(d.ts)<Number(p.ts)) continue; const have=left.get(d.id)||0; const use=Math.min(have,remaining); left.set(d.id,have-use); remaining-=use; }
      } else {
        // Legacy payments remain immutable; derive FIFO coverage only in memory.
        for (const d of debts) { if (remaining<=0) break; const have=left.get(d.id)||0; const use=Math.min(have,remaining); left.set(d.id,have-use); remaining-=use; }
      }
    }
    return debts.map(d=>{
      const original=validDate(d.originalDueAt)?Number(d.originalDueAt):(validDate(d.dueAt)?Number(d.dueAt):(c.payDay?nextMonthlyDue(Number(d.ts)||Date.now(),Number(c.payDay)):null));
      return { debt:d, remaining:Math.max(0,Math.round((left.get(d.id)||0)*100)/100), dueAt:validDate(d.dueAt)?Number(d.dueAt):original, originalDueAt:original };
    }).filter(x=>x.remaining>0);
  }
  function allocatePayment(c, amount) {
    let remaining=Math.max(0,Number(amount)||0); const allocations=[];
    for(const item of ledger(c)) { if(remaining<=0) break; const n=Math.min(item.remaining,remaining); if(n>0){allocations.push({debtId:item.debt.id,amount:Math.round(n*100)/100}); remaining-=n;} }
    return allocations;
  }
  function extendDebt(c,debtId,amount,unit,now) {
    const item=ledger(c).find(x=>x.debt.id===debtId); if(!item) throw new Error('الدين المحدد غير موجود أو تمت تسويته');
    const base=item.dueAt || Number(now||Date.now());
    const n=Math.max(1,Math.min(365,Number(amount)||0));
    const delta=unit==='months'?0:unit==='weeks'?n*7:n;
    let next;
    if(unit==='months') { const d=new Date(base); const day=d.getDate(); d.setDate(1); d.setMonth(d.getMonth()+n); d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate())); next=d.getTime(); }
    else next=base+delta*DAY;
    const d=item.debt; d.originalDueAt=d.originalDueAt||item.originalDueAt||base; d.dueAt=next; d.extensionHistory=Array.isArray(d.extensionHistory)?d.extensionHistory:[];
    d.extensionHistory.push({at:Number(now||Date.now()),from:base,to:next,amount:n,unit});
    return {from:base,to:next,debtId};
  }
  const dateLabel = ts => { const d=new Date(ts); return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear(); };
  const phone = raw => { let s=String(raw||'').replace(/[^\d+]/g,''); if(s.startsWith('00'))s='+'+s.slice(2); if(/^213[567]\d{8}$/.test(s))s='+'+s; if(/^0[567]\d{8}$/.test(s))s='+213'+s.slice(1); return /^\+\d{9,15}$/.test(s)?s:null; };
  function render(tpl, vars) { return String(tpl||'').replace(/\{(title|name|amount|date|store)\}/g,(_,k)=>String(vars[k]??'')); }
  function buildQueue(S, now) {
    const cfg=config(S.settings&&S.settings.sms||S.settings&&S.settings.smsConfig);
    if(!cfg.enabled || !Array.isArray(S.customers)) return [];
    const pending=[];
    for(const c of S.customers) {
      if(c.smsEnabled===false || c.smsOptOut===true || !phone(c.phone)) continue;
      const lang=c.smsLang==='fr'?'fr':'ar';
      const title=c.honorific==='madame'?(lang==='fr'?'Madame':'السيدة'):c.honorific==='monsieur'?(lang==='fr'?'Monsieur':'السيد'):'';
      const items=ledger(c);
      const events=[];
      for(const x of items) {
        if(!x.dueAt) continue;
        const dueDate=new Date(x.dueAt), nowDate=new Date(now);
        const overdueDays=Math.max(0,Math.floor((Date.UTC(nowDate.getFullYear(),nowDate.getMonth(),nowDate.getDate())-Date.UTC(dueDate.getFullYear(),dueDate.getMonth(),dueDate.getDate()))/DAY));
        let latestPast=-1;
        // Select by the actual configured local reminder timestamp, not elapsed 24-hour blocks.
        // A due date stored at 23:59 must still trigger at 14:15 the following calendar day.
        for(let i=0;i<cfg.days.length;i++) if(localAt(x.dueAt+cfg.days[i]*DAY,cfg.times[i])<=now) latestPast=i;
        for(let i=0;i<cfg.days.length;i++) {
          const reminderAt=localAt(x.dueAt+cfg.days[i]*DAY,cfg.times[i]);
          const key=`${c.id}|${x.debt.id}|${i+1}|${Math.floor(x.dueAt)}`;
          if(S.smsLog&&S.smsLog[key]) continue;
          if(reminderAt<=now && i!==latestPast) continue; // one catch-up reminder only; never flood old backlog
          events.push({key,cid:c.id,debtId:x.debt.id,step:i+1,reminderAt,remaining:x.remaining,dueAt:x.dueAt});
        }
      }
      // Group all due debts for this customer and reminder step into one SMS; no other debt is suppressed.
      const groups=new Map();
      for(const e of events){ const bucket=e.reminderAt<=now?'due-now':String(e.reminderAt); const a=groups.get(bucket)||[]; a.push(e); groups.set(bucket,a); }
      for(const [bucket,es] of groups) {
        const debtIds=[...new Set(es.map(x=>x.debtId))].sort();
        const dueSignature=es.map(x=>`${x.debtId}:${x.step}:${Math.floor(x.dueAt)}`).sort().join(',');
        const key=`${c.id}|${bucket}|${stableHash(dueSignature)}`;
        if(S.smsLog&&S.smsLog[key]) continue;
        const amount=es.reduce((a,x)=>a+x.remaining,0);
        const due=Math.min(...es.map(x=>x.dueAt));
        const tpl=lang==='fr'?cfg.tplFr:cfg.tplAr;
        const storeName=cfg.storeName||(S.profile&&S.profile.storeName)||'';
        let message=render(tpl,{title,name:c.name,amount:Math.round(amount).toLocaleString('en-US'),date:dateLabel(due),store:storeName});
        if(storeName&&!tpl.includes('{store}')) message+='\\n'+storeName;
        pending.push({id:key,key,eventKeys:es.map(x=>x.key),events:es.map(x=>({debtId:x.debtId,step:x.step,dueAt:x.dueAt,key:x.key})),cid:c.id,debtIds,step:es[0].step,phone:phone(c.phone),message,amount,dueAt:due,reminderAt:Math.min(...es.map(x=>x.reminderAt)),overdueDays:Math.max(0,...es.map(x=>Math.max(0,Math.floor((now-x.dueAt)/DAY))))});
      }
    }
    pending.sort((a,b)=>(b.overdueDays-a.overdueDays)||(a.dueAt-b.dueAt)||a.cid.localeCompare(b.cid));
    // One ordered queue for the whole shop, with a configurable minimum gap and a strict sending window.
    const start=parseTime('09:00'), end=parseTime(cfg.end); const startMin=start[0]*60+start[1], endMin=end[0]*60+end[1];
    const effectiveGap=Math.min(cfg.intervalMinutes,Math.max(1,Math.floor((endMin-startMin)/Math.max(1,pending.length))));
    let cursor=now, out=[];
    for(const item of pending) {
      const d=new Date(cursor), mins=d.getHours()*60+d.getMinutes();
      if(mins<startMin) cursor=localAt(cursor,cfg.start);
      else if(mins>endMin) { d.setDate(d.getDate()+1); cursor=localAt(d,cfg.start); }
      if(item.reminderAt>cursor) cursor=item.reminderAt;
      const atDate=new Date(cursor), m=atDate.getHours()*60+atDate.getMinutes();
      if(m>endMin) { atDate.setDate(atDate.getDate()+1); cursor=localAt(atDate,cfg.start); }
      item.at=Math.max(cursor,item.reminderAt); item.gapMinutes=effectiveGap; if(item.at>cursor) cursor=item.at; out.push(item); cursor+=effectiveGap*60000;
    }
    return out;
  }
  function validateBeforeSend(S,item,now) {
    const cfg=config(S.settings&&S.settings.sms||S.settings&&S.settings.smsConfig);
    if(!cfg.enabled) return {ok:false,reason:'global-disabled'};
    const c=(S.customers||[]).find(x=>x.id===item.cid); if(!c) return {ok:false,reason:'customer-missing'};
    if(c.smsEnabled===false||c.smsOptOut===true) return {ok:false,reason:'customer-disabled'};
    const to=phone(c.phone); if(!to||to!==item.phone) return {ok:false,reason:'phone-changed'};
    const open=ledger(c).filter(x=>item.debtIds.includes(x.debt.id)); if(!open.length) return {ok:false,reason:'debt-settled'};
    const byId=new Map(open.map(x=>[x.debt.id,x]));
    const dueEvents=(item.events||[]).filter(ev=>{const x=byId.get(ev.debtId);return x&&x.dueAt===ev.dueAt&&now>=localAt(ev.dueAt+cfg.days[ev.step-1]*DAY,cfg.times[ev.step-1])&&!(S.smsLog&&S.smsLog[ev.key]);});
    const dueIds=new Set(dueEvents.map(x=>x.debtId));const due=open.filter(x=>dueIds.has(x.debt.id));
    if(!due.length) return {ok:false,reason:'not-due'};
    if(S.smsLog&&S.smsLog[item.key]) return {ok:false,reason:'duplicate'};
    const amount=due.reduce((a,x)=>a+x.remaining,0);
    if(Number.isFinite(Number(item.amount))&&Math.abs(amount-Number(item.amount))>0.01)return {ok:false,reason:'amount-changed'};
    return {ok:true,customer:c,items:due,amount};
  }
  root.DeynSmsCore={DEFAULTS,config,ledger,allocatePayment,extendDebt,buildQueue,validateBeforeSend,phone,nextMonthlyDue,dateLabel};
})(typeof window!=='undefined'?window:globalThis);
