/* DEYN SMS core: deterministic debt allocation, per-debt due dates, multipart encoding analysis, reminders, queue planning and per-part status reconciliation. */
(function (root) {
  'use strict';
  const DAY = 86400000;
  const DEFAULTS = Object.freeze({ enabled:false, days:[1,4,8,15], times:['10:00','11:00','16:00','10:00'], start:'09:00', end:'22:00', intervalMinutes:5, tplAr:'السلام عليكم {title} {name}، عليكم {amount} دج منذ {date}. شكرا.', tplFr:'Bonjour {title} {name}, solde de {amount} DA dû depuis le {date}. Merci.', storeName:'' });
  const clone = x => JSON.parse(JSON.stringify(x));
  function stableHash(value) { let a=2166136261,b=0x9e3779b9; const s=String(value); for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b^c,2246822519);}return (a>>>0).toString(36)+(b>>>0).toString(36); }
  const validDate = n => Number.isFinite(Number(n)) && Number(n) > 0;
  const localAt = (base, hhmm) => { const [h,m] = String(hhmm||'09:00').split(':').map(Number); const d = new Date(base); d.setHours(h||0,m||0,0,0); return d.getTime(); };
  const parseTime = s => { const m=/^(\d{2}):(\d{2})$/.exec(String(s||'')); return m && +m[1]<24 && +m[2]<60 ? [+m[1],+m[2]] : null; };

  // GSM 03.38 basic 7-bit character set and 2-septet extension characters
  const GSM7_BASIC = new Set(Array.from('@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà'));
  const GSM7_EXT = new Set(Array.from('|^€{}[~]\\'));

  function normalizeSmsText(raw, lang) {
    let s = String(raw ?? '')
      .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
      .replace(/[\u00A0\u202F]/g, ' ')
      .replace(/\r\n?/g, '\n');
    if (lang === 'fr') {
      s = s.replace(/[’‘]/g, "'").replace(/[“”«»]/g, '"').replace(/[–—]/g, '-').replace(/…/g, '...');
    }
    return s.split('\n').map(line => line.replace(/[ \t]{2,}/g, ' ').trim()).filter((line, idx, arr) => line.length > 0 || (idx > 0 && idx < arr.length - 1)).join('\n').trim();
  }

  function analyzeMessage(rawText) {
    const text = String(rawText ?? '');
    if (!text) {
      return { text: '', encoding: 'GSM-7', units: 0, singleLimit: 160, multiLimit: 153, partsCount: 0, parts: [] };
    }
    let isGsm7 = true;
    let gsmSeptets = 0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (GSM7_BASIC.has(ch)) gsmSeptets += 1;
      else if (GSM7_EXT.has(ch)) gsmSeptets += 2;
      else { isGsm7 = false; break; }
    }
    if (isGsm7) {
      const singleLimit = 160, multiLimit = 153;
      if (gsmSeptets <= singleLimit) {
        return { text, encoding: 'GSM-7', units: gsmSeptets, singleLimit, multiLimit, partsCount: 1, parts: [text] };
      }
      const parts = [];
      let cur = '', curUnits = 0;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const w = GSM7_EXT.has(ch) ? 2 : 1;
        if (curUnits + w > multiLimit && cur.length > 0) {
          parts.push(cur);
          cur = ch;
          curUnits = w;
        } else {
          cur += ch;
          curUnits += w;
        }
      }
      if (cur.length > 0) parts.push(cur);
      return { text, encoding: 'GSM-7', units: gsmSeptets, singleLimit, multiLimit, partsCount: parts.length, parts };
    }

    // UCS-2 / UTF-16 encoding (70 code units for a single SMS, 67 code units per part for multipart SMS)
    const singleLimit = 70, multiLimit = 67;
    const units = text.length;
    if (units <= singleLimit) {
      return { text, encoding: 'UCS-2', units, singleLimit, multiLimit, partsCount: 1, parts: [text] };
    }
    const parts = [];
    let idx = 0;
    while (idx < units) {
      let end = Math.min(units, idx + multiLimit);
      if (end < units) {
        const hi = text.charCodeAt(end - 1), lo = text.charCodeAt(end);
        if (hi >= 0xD800 && hi <= 0xDBFF && lo >= 0xDC00 && lo <= 0xDFFF) {
          end -= 1;
        }
      }
      if (end <= idx) end = Math.min(units, idx + multiLimit);
      parts.push(text.slice(idx, end));
      idx = end;
    }
    return { text, encoding: 'UCS-2', units, singleLimit, multiLimit, partsCount: parts.length, parts };
  }

  function config(raw) {
    const c=Object.assign({},DEFAULTS,raw||{});
    // Migrate only the exact shipped defaults from the previous release; preserve owner-edited templates.
    const OLD_DEFAULT_AR='السلام عليكم {title} {name}، نذكّركم بأن عليكم مبلغ {amount} دج مستحق منذ {date}. نرجو التسوية عند الإمكان. شكرًا لكم 😊';
    const OLD_DEFAULT_FR='Bonjour {title} {name}, nous vous rappelons que votre solde de {amount} DA est dû depuis le {date}. Merci de régulariser dès que possible 😊';
    if(c.tplAr===OLD_DEFAULT_AR)c.tplAr=DEFAULTS.tplAr;
    if(c.tplFr===OLD_DEFAULT_FR)c.tplFr=DEFAULTS.tplFr;
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
    const n=Number(day);
    if (!Number.isInteger(n) || n<1 || n>31 || !validDate(ts)) return null;
    const d=new Date(Number(ts)), y=d.getFullYear(), m=d.getMonth();
    let due=new Date(y,m,Math.min(n,new Date(y,m+1,0).getDate()),23,59,59,999).getTime();
    if (due < Number(ts)) { const nm=m+1; due=new Date(y,nm,Math.min(n,new Date(y,nm+1,0).getDate()),23,59,59,999).getTime(); }
    return due;
  }
  // Resolve the customer's configured pay day within the calendar month of the reference date.
  // For debt records, the reference date is the transaction timestamp so the derived due date
  // remains stable across later months and never shifts merely because the app is reopened.
  function customerDueDate(c, referenceDate) {
    const day=Number(c&&c.payDay);
    if(!Number.isInteger(day)||day<1||day>31) return null;
    const ts=Number.isFinite(Number(now))?Number(now):Date.now();
    const current=new Date(ts);
    const year=current.getFullYear(), month=current.getMonth();
    const lastDay=new Date(year,month+1,0).getDate();
    return new Date(year,month,Math.min(day,lastDay),23,59,59,999).getTime();
  }
  // Fixed per-debt dates always win. Only debts without a stored date (or explicitly
  // marked as following the customer's monthly pay day) use the shared monthly rule.
  function getDebtDueDate(c, debt, now) {
    const d=debt||{};
    if(validDate(d.dueAt)) return Number(d.dueAt);
    if(validDate(d.originalDueAt)) return Number(d.originalDueAt);
    if(d.dueDateMode==='monthly' || c&&c.payDay) return customerDueDate(c,validDate(d.ts)?Number(d.ts):now);
    return null;
  }
  function calendarDayDifference(fromTs, toTs) {
    if(!validDate(fromTs)||!Number.isFinite(Number(toTs))) return 0;
    const from=new Date(Number(fromTs)), to=new Date(Number(toTs));
    const a=Date.UTC(from.getFullYear(),from.getMonth(),from.getDate());
    const b=Date.UTC(to.getFullYear(),to.getMonth(),to.getDate());
    return Math.round((b-a)/DAY);
  }
  function reminderTimestamp(dueAt, daysAfter, hhmm) {
    if(!validDate(dueAt)||!Number.isInteger(Number(daysAfter))||Number(daysAfter)<1) return null;
    const match=parseTime(hhmm);
    if(!match) return null;
    const d=new Date(Number(dueAt));
    d.setDate(d.getDate()+Number(daysAfter));
    d.setHours(match[0],match[1],0,0);
    return d.getTime();
  }
  function ledger(c, now) {
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
      const dueAt=getDebtDueDate(c,d,now);
      const original=validDate(d.originalDueAt)?Number(d.originalDueAt):(validDate(d.dueAt)?Number(d.dueAt):dueAt);
      return { debt:d, remaining:Math.max(0,Math.round((left.get(d.id)||0)*100)/100), dueAt, originalDueAt:original };
    }).filter(x=>x.remaining>0);
  }
  function customerPayInfo(c, now) {
    const ts=Number.isFinite(Number(now))?Number(now):Date.now();
    const open=ledger(c,ts).filter(x=>x.remaining>0&&validDate(x.dueAt));
    if(!open.length) return null;
    // Show the earliest outstanding due date: the most overdue debt wins;
    // otherwise show the nearest upcoming fixed or monthly due date.
    const dueAt=Math.min(...open.map(x=>Number(x.dueAt)));
    const dueDate=new Date(dueAt);
    const diff=calendarDayDifference(ts,dueAt)*-1;
    const day=dueDate.getDate();
    if(diff>0) {
      return {status:'overdue',diff,day,dueAt,label:`متأخر عن موعد السداد بـ ${diff} ${diff<=2?(diff===1?'يوم':'يومين'):'أيام'} (كان يوم ${day})`};
    }
    if(diff===0) return {status:'today',diff:0,day,dueAt,label:`اليوم موعد السداد المحدد (${day} في الشهر)`};
    const ahead=Math.abs(diff);
    return {status:ahead<=5?'soon':'future',diff:ahead,day,dueAt,label:ahead<=5?`يقترب موعد السداد (بعد ${ahead} ${ahead<=2?(ahead===1?'يوم':'يومين'):'أيام'})`:`موعد السداد يوم ${day} من الشهر`};
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
  function render(tpl, vars, lang) {
    const out = String(tpl||'').replace(/\{(title|name|amount|date|store)\}/g,(_,k)=>String(vars[k]??'')).replace(/\s{2,}/g,' ').trim();
    return normalizeSmsText(out, lang);
  }
  function testMessage(date, customText) {
    if (typeof customText === 'string' && customText.trim()) return normalizeSmsText(customText.trim());
    return `DEYN: اختبار SMS ناجح - ${String(date||'')}`.trim();
  }

  function isLogBlocking(entry) {
    if (!entry) return false;
    if (typeof entry === 'object') {
      if (entry.status === 'failed') return false;
      return true;
    }
    return true;
  }

  /**
   * Reconciles a native per-part status report with an existing smsLog record.
   * Ensures a multi-part SMS is marked sent_to_network/delivered ONLY when all parts succeed,
   * and marks partial_failure when at least one part fails after another part succeeded.
   */
  function reconcileStatus(existing, report, meta) {
    const prev = (existing && typeof existing === 'object') ? Object.assign({}, existing) : {};
    const m = meta || {};
    const partsTotal = Math.max(1, Number(report && report.partsTotal) || Number(prev.partsTotal) || 1);
    let partsSent = Number.isFinite(Number(report && report.partsSent)) ? Number(report.partsSent) : (Number(prev.partsSent) || 0);
    let partsFailed = Number.isFinite(Number(report && report.partsFailed)) ? Number(report.partsFailed) : (Number(prev.partsFailed) || 0);
    let partsDelivered = Number.isFinite(Number(report && report.partsDelivered)) ? Number(report.partsDelivered) : (Number(prev.partsDelivered) || 0);

    let rawStatus = String((report && report.status) || prev.status || 'accepted_by_android');
    if (partsFailed > 0 && partsSent > 0) {
      rawStatus = 'partial_failure';
    } else if (partsFailed > 0 && partsSent === 0) {
      rawStatus = 'failed';
    } else if (partsDelivered >= partsTotal && partsFailed === 0) {
      rawStatus = 'delivered';
      partsSent = Math.max(partsSent, partsTotal);
    } else if (partsSent >= partsTotal && partsFailed === 0 && (rawStatus === 'accepted_by_android' || rawStatus === 'attempting' || rawStatus === 'sent_to_network')) {
      rawStatus = 'sent_to_network';
    } else if ((rawStatus === 'sent_to_network' || rawStatus === 'delivered') && partsSent < partsTotal && partsFailed === 0 && report && report.partsSent === undefined) {
      partsSent = partsTotal;
    }

    // Never downgrade a confirmed terminal delivery/network state back to accepted_by_android
    if (prev.status === 'delivered' && (rawStatus === 'accepted_by_android' || rawStatus === 'sent_to_network' || rawStatus === 'attempting')) {
      rawStatus = 'delivered';
    } else if (prev.status === 'sent_to_network' && (rawStatus === 'accepted_by_android' || rawStatus === 'attempting')) {
      rawStatus = 'sent_to_network';
    }

    const now = Date.now();
    const attemptAt = Number(report && report.attemptAt) || Number(prev.attemptAt) || Number(report && report.acceptedAt) || now;
    const acceptedAt = Number(report && report.acceptedAt) || Number(prev.acceptedAt) || attemptAt;
    const sentAt = Number(report && report.sentAt) || Number(prev.sentAt) || ((rawStatus === 'sent_to_network' || rawStatus === 'delivered') ? now : 0);
    const deliveredAt = Number(report && report.deliveredAt) || Number(prev.deliveredAt) || (rawStatus === 'delivered' ? now : 0);
    const at = deliveredAt || sentAt || acceptedAt || attemptAt || now;
    const sent = (rawStatus === 'sent_to_network' || rawStatus === 'delivered') && partsSent >= partsTotal && partsFailed === 0;
    const accepted = sent || rawStatus === 'accepted_by_android' || rawStatus === 'partial_failure';
    const delivered = rawStatus === 'delivered' && sent;

    const out = Object.assign({}, prev, {
      at,
      attemptAt,
      acceptedAt,
      sentAt,
      deliveredAt,
      status: rawStatus,
      sent,
      accepted,
      delivered,
      partsTotal,
      partsSent,
      partsFailed,
      partsDelivered,
      customerName: m.customerName || prev.customerName || '',
      phone: (report && report.phone) || m.phone || prev.phone || ''
    });
    if (report && report.error) out.error = String(report.error);
    return out;
  }

  function resolveSmsLang(preference, appLanguage) {
    if (preference === 'fr') return 'fr';
    if (preference === 'ar') return 'ar';
    return appLanguage === 'fr' ? 'fr' : 'ar';
  }
  function setGlobalEnabled(S, enabled) {
    if (!S || typeof S !== 'object') throw new TypeError('SMS state is required');
    S.settings = S.settings || {};
    const c = config(S.settings.sms || S.settings.smsConfig);
    c.enabled = !!enabled;
    S.settings.sms = c;
    return c;
  }

  function buildQueue(S, now, appLanguage) {
    const cfg=config(S.settings&&S.settings.sms||S.settings&&S.settings.smsConfig);
    if(!cfg.enabled || !Array.isArray(S.customers)) return [];
    const pending=[];
    for(const c of S.customers) {
      if(c.smsEnabled===false || c.smsOptOut===true || !phone(c.phone)) continue;
      const lang=resolveSmsLang(c.smsLang, appLanguage || (S.settings && (S.settings.language || S.settings.lang)) || 'ar');
      const title=c.honorific==='madame'?(lang==='fr'?'Madame':'السيدة'):c.honorific==='monsieur'?(lang==='fr'?'Monsieur':'السيد'):'';
      const items=ledger(c,now);
      const events=[];
      for(const x of items) {
        if(!x.dueAt) continue;
        const overdueDays=Math.max(0,calendarDayDifference(x.dueAt,now));
        let latestPast=-1;
        // Select by the actual configured local reminder timestamp, not elapsed 24-hour blocks.
        // A due date stored at 23:59 must still trigger at 14:15 the following calendar day.
        for(let i=0;i<cfg.days.length;i++) if(localAt(x.dueAt+cfg.days[i]*DAY,cfg.times[i])<=now) latestPast=i;
        for(let i=0;i<cfg.days.length;i++) {
          const reminderAt=reminderTimestamp(x.dueAt,cfg.days[i],cfg.times[i]);
          const key=`${c.id}|${x.debt.id}|${i+1}|${Math.floor(x.dueAt)}`;
          if(S.smsLog&&isLogBlocking(S.smsLog[key])) continue;
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
        // Keep an event group's id unchanged as its reminder moves from future to overdue.
        const key=`${c.id}|${stableHash(dueSignature)}`;
        if(S.smsLog&&isLogBlocking(S.smsLog[key])) continue;
        const amount=es.reduce((a,x)=>a+x.remaining,0);
        const due=Math.min(...es.map(x=>x.dueAt));
        const tpl=lang==='fr'?cfg.tplFr:cfg.tplAr;
        const storeName=cfg.storeName||(S.profile&&S.profile.storeName)||'';
        let message=render(tpl,{title,name:c.name,amount:Math.round(amount).toLocaleString('en-US'),date:dateLabel(due),store:storeName},lang);
        if(storeName&&!tpl.includes('{store}')) message=normalizeSmsText(message+'\n'+storeName,lang);
        const analysis=analyzeMessage(message);
        pending.push({id:key,key,eventKeys:es.map(x=>x.key),events:es.map(x=>({debtId:x.debtId,step:x.step,dueAt:x.dueAt,key:x.key})),cid:c.id,debtIds,step:es[0].step,phone:phone(c.phone),message,encoding:analysis.encoding,partsCount:analysis.partsCount,parts:analysis.parts,amount,dueAt:due,reminderAt:Math.min(...es.map(x=>x.reminderAt)),overdueDays:Math.max(0,...es.map(x=>Math.max(0,Math.floor((now-x.dueAt)/DAY))))});
      }
    }
    pending.sort((a,b)=>(b.overdueDays-a.overdueDays)||(a.dueAt-b.dueAt)||a.cid.localeCompare(b.cid));
    // One ordered queue for the whole shop, with a configurable minimum gap and a strict sending window.
    const start=parseTime('09:00'), end=parseTime(cfg.end); const startMin=start[0]*60+start[1], endMin=end[0]*60+end[1];
    const effectiveGap=Math.min(cfg.intervalMinutes,Math.max(1,Math.floor((endMin-startMin)/Math.max(1,pending.length))));
    // Use a stable day anchor rather than the current millisecond. Runtime rescheduling on every persist
    // must not change the native payload timestamp and cancel the same reminder repeatedly.
    let cursor=localAt(now,cfg.start), out=[];
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
    const open=ledger(c,now).filter(x=>item.debtIds.includes(x.debt.id)); if(!open.length) return {ok:false,reason:'debt-settled'};
    const byId=new Map(open.map(x=>[x.debt.id,x]));
    const dueEvents=(item.events||[]).filter(ev=>{const x=byId.get(ev.debtId);return x&&x.dueAt===ev.dueAt&&now>=reminderTimestamp(ev.dueAt,cfg.days[ev.step-1],cfg.times[ev.step-1])&&!(S.smsLog&&isLogBlocking(S.smsLog[ev.key]));});
    const dueIds=new Set(dueEvents.map(x=>x.debtId));const due=open.filter(x=>dueIds.has(x.debt.id));
    if(!due.length) return {ok:false,reason:'not-due'};
    if(S.smsLog&&isLogBlocking(S.smsLog[item.key])) return {ok:false,reason:'duplicate'};
    const amount=due.reduce((a,x)=>a+x.remaining,0);
    if(Number.isFinite(Number(item.amount))&&Math.abs(amount-Number(item.amount))>0.01)return {ok:false,reason:'amount-changed'};
    return {ok:true,customer:c,items:due,amount};
  }
  root.DeynSmsCore={DEFAULTS,config,ledger,allocatePayment,extendDebt,buildQueue,validateBeforeSend,phone,nextMonthlyDue,customerDueDate,getDebtDueDate,customerPayInfo,reminderTimestamp,dateLabel,testMessage,normalizeSmsText,analyzeMessage,reconcileStatus,isLogBlocking,resolveSmsLang,setGlobalEnabled};
})(typeof window!=='undefined'?window:globalThis);