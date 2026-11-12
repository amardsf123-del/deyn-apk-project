/* DEYN_SMS_RUNTIME_V1 */
/* DEYN SMS UI/runtime bridge. Loaded after the existing DEYN app script. */
(function () {
  'use strict';
  const Core=window.DeynSmsCore;
  const plug=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.DeynSms;
  const cfg=()=>{ S.settings=S.settings||{}; S.settings.sms=Core.config(S.settings.sms); return S.settings.sms; };
  const escSms=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate=ts=>ts?Core.dateLabel(ts):'غير محدد';
  const isoDate=ts=>{if(!ts)return '';const d=new Date(ts);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const fromDate=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s||'')))return null;const [y,m,d]=s.split('-').map(Number);const v=new Date(y,m-1,d,23,59,59,999).getTime();return Number.isFinite(v)?v:null;};
  let syncTimer=null, syncBusy=false;
  function smsOpenSettings(){
    if(deynReadOnly&&deynReadOnly()){toast('وضع القراءة فقط: لا يمكن تغيير إعدادات SMS','err');return;}
    if(!requireOwner('إعدادات الرسائل النصية'))return;
    const c=cfg();
    openModal(()=>`${sheetHead('إعدادات رسائل SMS')}
      <div class="sub" style="line-height:1.8">ترسل الرسائل من شريحة هاتف المالك فقط. يجب توفر رصيد SMS وشبكة الهاتف. قبول أندرويد للرسالة لا يعني تأكيد وصولها إلى هاتف الزبون.</div>
      <div class="row-set" style="margin-top:10px"><div><b>تفعيل الرسائل النصية</b><small>عند التفعيل، يتم تمكين كل الزبائن الذين لديهم رقم هاتف. يمكنك تعطيل أي زبون بشكل فردي.</small></div><label class="sw"><input type="checkbox" id="smsGlobal" ${c.enabled?'checked':''}><i></i></label></div>
      <div style="border-top:1px solid var(--line);padding-top:12px;margin-top:10px">
        <b style="font-size:13px">جدول التذكير بعد الاستحقاق</b>
        <div class="sub">الأيام الافتراضية: 1 و4 و8 و15، ويمكن تغييرها.</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:8px">${c.days.map((d,i)=>`<label style="font-size:11px;color:var(--mute)">اليوم ${i+1}<input class="inp num" id="smsDay${i}" type="number" min="1" max="90" value="${d}" style="margin-top:4px;padding:8px 5px;height:40px;text-align:center"></label>`).join('')}</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:8px">${c.times.map((t,i)=>`<label style="font-size:11px;color:var(--mute)">الساعة ${i+1}<input class="inp num" id="smsTime${i}" type="time" value="${t}" style="margin-top:4px;padding:6px 2px;height:40px;text-align:center"></label>`).join('')}</div>
      </div>
      <div style="border-top:1px solid var(--line);padding-top:12px;margin-top:12px">
        <b style="font-size:13px">فترة الإرسال والتوزيع</b>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><label class="lbl">بداية الإرسال (ثابتة)<input class="inp num" id="smsStart" type="time" value="09:00" disabled style="direction:ltr"></label><label class="lbl">نهاية الإرسال (حتى 22:00)<input class="inp num" id="smsEnd" type="time" min="09:00" max="22:00" value="${c.end}" style="direction:ltr"></label></div>
        <label class="lbl">الفاصل بين الرسائل (بالدقائق)<input class="inp num" id="smsGap" type="number" min="1" max="60" value="${c.intervalMinutes}" style="direction:ltr"></label>
        <div class="sub">الافتراضي 09:00–22:00. تُرتّب الرسائل حسب أقدم دين متأخر وتُرسل بالتتابع لتجنب الإرسال الجماعي.</div>
      </div>
      <div style="border-top:1px solid var(--line);padding-top:12px;margin-top:12px">
        <b style="font-size:13px">قوالب الرسائل القابلة للتعديل</b>
        <label class="lbl">القالب العربي</label><textarea class="inp" id="smsTplAr" maxlength="500" rows="4" style="height:auto;line-height:1.8">${escSms(c.tplAr)}</textarea>
        <label class="lbl">القالب الفرنسي</label><textarea class="inp" id="smsTplFr" maxlength="500" rows="4" style="height:auto;line-height:1.8;direction:ltr;text-align:left">${escSms(c.tplFr)}</textarea>
        <div class="sub">المتغيرات: {title} اللقب، {name} الاسم، {amount} المبلغ، {date} تاريخ الاستحقاق، {store} اسم المحل إن كان موجودًا في ملف المتجر. الإعداد الحالي لا يحتوي على اسم متجر، لذلك لن يُضاف اسم غير موجود. الرسائل الطويلة قد تُحسب عدة وحدات SMS حسب شركة الاتصالات.</div>
      </div>
      <div style="border-top:1px solid var(--line);padding-top:12px;margin-top:12px">
        <b style="font-size:13px">اختبار الإرسال</b><label class="lbl">رقم الهاتف الذي تريد إرسال الاختبار إليه</label><input class="inp num" id="smsTestPhone" type="tel" placeholder="0555 12 34 56" style="direction:ltr;text-align:right">
        <button class="btn block" data-act="smsTest" style="margin-top:8px">إرسال رسالة تجريبية</button>
      </div>
      <div class="two" style="margin-top:14px"><button class="btn" data-act="smsHistory">سجل الرسائل</button><button class="btn pri" data-act="smsSaveSettings" data-primary>حفظ الإعدادات</button></div>`,
      {refresh:()=>{}});
  }
  async function smsPermission(){const p=plug();if(!p)throw new Error('ميزة SMS غير متاحة في هذه النسخة');const s=await p.checkPermissions();if(s&&s.sms==='granted')return true;const r=await p.requestPermissions();return !!(r&&r.sms==='granted');}
  async function smsToggleGlobal(el){
    if(deynReadOnly&&deynReadOnly()){el.checked=!el.checked;return toast('وضع القراءة فقط','err');}
    if(!requireOwner('تفعيل الرسائل النصية')){el.checked=false;return;}
    if(el.checked){
      const ok=await smsPermission().catch(e=>{toast(e.message,'err');return false;});
      if(!ok){el.checked=false;toast('لم يتم منح إذن إرسال الرسائل، بقيت الميزة متوقفة','err');return;}
      cfg().enabled=true;
      // The agreed global re-enable behavior: enable every customer with a valid phone.
      (S.customers||[]).forEach(c=>{if(Core.phone(c.phone))c.smsEnabled=true;});
      toast('تم تفعيل SMS للزبائن الذين لديهم أرقام هاتف');
    }else{cfg().enabled=false;toast('تم إيقاف جميع رسائل SMS مؤقتًا');}
    persist();smsScheduleSoon();
  }
  function smsSaveSettings(){
    if(deynReadOnly&&deynReadOnly())return toast('وضع القراءة فقط','err');
    if(!requireOwner('تعديل إعدادات الرسائل'))return;
    const c=cfg();
    const days=[0,1,2,3].map(i=>Number(lastById('smsDay'+i)?.value));
    const times=[0,1,2,3].map(i=>lastById('smsTime'+i)?.value||'');
    const start='09:00',end=lastById('smsEnd')?.value||'';
    const gap=Number(lastById('smsGap')?.value||5);
    if(days.some(x=>!Number.isInteger(x)||x<1||x>90)||new Set(days).size!==4||days.some((x,i)=>i>0&&x<=days[i-1])||times.some(x=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(x))||!/^09:00$/.test(start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(end)||end>'22:00'||end<='09:00'||!Number.isInteger(gap)||gap<1||gap>60)return toast('تحقق من الأيام والساعات والفاصل الزمني','err');
    c.days=days;c.times=times;c.start=start;c.end=end;c.intervalMinutes=gap;
    c.tplAr=lastById('smsTplAr')?.value.trim()||Core.DEFAULTS.tplAr;c.tplFr=lastById('smsTplFr')?.value.trim()||Core.DEFAULTS.tplFr;if(c.tplAr.length>500||c.tplFr.length>500)return toast('القالب طويل جدًا — الحد الأقصى 500 حرف لكل لغة','err');
    persist();smsScheduleSoon();closeModal();toast('تم حفظ إعدادات SMS بنجاح');
  }
  async function smsTest(){
    if(deynReadOnly&&deynReadOnly())return toast('وضع القراءة فقط: لا يمكن إرسال SMS','err');
    const p=plug();if(!p)return toast('الإرسال متاح داخل تطبيق أندرويد فقط','err');
    const to=Core.phone(lastById('smsTestPhone')?.value);if(!to)return toast('أدخل رقم هاتف صحيحًا','err');
    try{if(!(await smsPermission()))return toast('إذن SMS غير ممنوح','err');const tpl=cfg().tplAr;const message=tpl.replace(/\{title\}/g,'').replace(/\{name\}/g,'اختبار').replace(/\{amount\}/g,'1,000').replace(/\{date\}/g,Core.dateLabel(Date.now())).replace(/\{store\}/g,'');const r=await p.send({id:'test-'+Date.now(),phone:to,message});toast(r&&r.sent?'قبل أندرويد إرسال الرسالة التجريبية':'الرسالة التجريبية سبق إرسالها','ok');}catch(e){toast('تعذر إرسال الاختبار: '+(e.message||e),'err');}
  }
  function smsHistory(){
    const rows=Object.entries(S.smsLog||{}).filter(([k,v])=>v&&v.status==='accepted_by_android'&&!v.internal).sort((a,b)=>(Number((b[1]&&b[1].at)||b[1])||0)-(Number((a[1]&&a[1].at)||a[1])||0)).slice(0,60);
    openModal(()=>`${sheetHead('سجل رسائل SMS')}<div class="sub">هذا السجل يوضح الرسائل التي قبلها أندرويد للإرسال، ولا يثبت وصولها إلى جهاز الزبون.</div>${rows.length?rows.map(([k,v])=>`<div class="tx"><div class="tx-ic pay">✓</div><div class="tx-m"><b>${escSms(v&&v.customerName||k)}</b><small>${escSms(v&&v.status==='accepted_by_android'?'قبل أندرويد الإرسال':'سجل إرسال')} • ${escSms(fmtDate(Number(v&&v.at)||Number(v)||0))}</small></div><div class="tx-a"><small>${escSms(v&&v.phone||'')}</small></div></div>`).join(''):'<div class="empty-st" style="padding:22px">لا توجد رسائل في السجل بعد</div>'}`);
  }
  function smsScheduleSoon(){clearTimeout(syncTimer);syncTimer=setTimeout(smsSchedule,350);}
  async function smsSchedule(){
    const p=plug();if(!p||syncBusy||!S)return;
    syncBusy=true;
    try{
      if(isWorkerDevice()||!cfg().enabled){await p.schedule({items:[]});if(S.smsQueueMeta)S.smsQueueMeta={};return;}
      const permission=await p.checkPermissions();
      if(!permission||permission.sms!=='granted'){cfg().enabled=false;await p.schedule({items:[]});persist();toast('تم إيقاف SMS لأن إذن الرسائل غير متاح','err');return;}
      if(!S.smsLog)S.smsLog={};if(!S.smsQueueMeta)S.smsQueueMeta={};
      let changed=false;
      try{const sent=await p.getSent();const sentItems=(sent&&sent.items)||((sent&&sent.ids)||[]).map(id=>({id,acceptedAt:Date.now()}));for(const item of sentItems){const id=item.id;if(!id||id.startsWith('test-')||S.smsLog[id])continue;const meta=S.smsQueueMeta[id]||{};const rec={at:Number(item.acceptedAt)||Date.now(),status:'accepted_by_android',customerName:meta.customerName||'',phone:meta.phone||''};S.smsLog[id]=rec;for(const k of meta.eventKeys||[])S.smsLog[k]=Object.assign({},rec,{internal:true});delete S.smsQueueMeta[id];changed=true;}}catch(e){console.warn('SMS history sync',e);}
      const now=Date.now();const queue=Core.buildQueue(S,now);
      const active=new Set(queue.map(x=>x.id));
      for(const id of Object.keys(S.smsQueueMeta))if(!active.has(id))delete S.smsQueueMeta[id];
      for(const item of queue){S.smsQueueMeta[item.id]={eventKeys:item.eventKeys,customerName:((S.customers||[]).find(c=>c.id===item.cid)||{}).name||'',phone:item.phone};}
      let durable=true;if(changed||queue.length){try{const saved=originalPersist();if(saved===false)durable=false;else if(typeof deynFlush==='function')await deynFlush();}catch(e){durable=false;console.warn('SMS state flush failed',e);}}
      const items=queue.filter(x=>!S.smsLog[x.id]&&(x.at>now||Core.validateBeforeSend(S,x,now).ok)).map(x=>({id:x.id,phone:x.phone,message:x.message,at:x.at,gapMinutes:x.gapMinutes}));
      await p.schedule({items});
    }catch(e){console.warn('SMS queue update failed',e);}
    finally{syncBusy=false;}
  }
  function smsExtendHtml(c){
    const rows=Core.ledger(c);
    if(!rows.length)return '';
    return `<div style="background:#f7faf9;border:1px solid var(--line);border-radius:14px;padding:12px;margin-top:12px"><label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700"><input id="mExtendEnabled" type="checkbox" style="width:18px;height:18px"> تمديد موعد دين بعد هذه الدفعة (اختياري)</label><div class="sub">يُمدد الدين الذي تختاره فقط، مع الاحتفاظ بتاريخ الموعد السابق وسجل التمديد.</div><label class="lbl">الدين المراد تمديده</label><select class="inp" id="mExtendDebt">${rows.map(x=>`<option value="${escSms(x.debt.id)}">${escSms(x.debt.note||'دين')} • ${fmt(x.remaining)} دج • ${fmtDate(x.dueAt)}</option>`).join('')}</select><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><label class="lbl">المدة<input class="inp num" id="mExtendValue" type="number" min="1" max="365" value="7" style="direction:ltr"></label><label class="lbl">الوحدة<select class="inp" id="mExtendUnit"><option value="days">أيام</option><option value="weeks">أسابيع</option><option value="months">أشهر</option></select></label></div></div>`;
  }
  // Extend the existing customer form with owner-only contact preferences.
  const originalOpenCustForm=openCustForm;
  openCustForm=function(id,seg){originalOpenCustForm(id,seg);if(isWorkerDevice())return;const c=id?cust(id):null;const sheet=document.querySelector('#modalRoot .ovl:last-child .sheet');if(!sheet||sheet.querySelector('#fSmsLang'))return;const anchor=sheet.querySelector('#fPhone');const block=document.createElement('div');block.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><label class="lbl">اللقب<select class="inp" id="fHonorific"><option value="" ${!c?.honorific?'selected':''}>بدون لقب</option><option value="monsieur" ${c?.honorific==='monsieur'?'selected':''}>السيد / Monsieur</option><option value="madame" ${c?.honorific==='madame'?'selected':''}>السيدة / Madame</option></select></label><label class="lbl">لغة الرسالة<select class="inp" id="fSmsLang"><option value="auto" ${!c?.smsLang||c?.smsLang==='auto'?'selected':''}>تلقائي (عربي)</option><option value="ar" ${c?.smsLang==='ar'?'selected':''}>العربية</option><option value="fr" ${c?.smsLang==='fr'?'selected':''}>Français</option></select></label></div><label style="display:flex;align-items:center;gap:8px;font-size:12px;margin:8px 0"><input id="fSmsEnabled" type="checkbox" style="width:18px;height:18px" ${(c?c.smsEnabled!==false:!!(lastById('fPhone')?.value))?'checked':''}> السماح بإرسال تذكيرات SMS لهذا الزبون</label>`;anchor?.after(block);};
  const originalSaveCust=saveCust;
  saveCust=function(){
    if(isWorkerDevice())return originalSaveCust();
    const editId=CF&&CF.id?CF.id:null, beforeCount=(S.customers||[]).length;
    const phoneVal=lastById('fPhone')?.value.trim()||'';
    const honorific=lastById('fHonorific')?.value||'';const smsLang=lastById('fSmsLang')?.value||'auto';const smsEnabled=!!lastById('fSmsEnabled')?.checked&&!!Core.phone(phoneVal);
    const activeModal=stack[stack.length-1];originalSaveCust();
    if(activeModal&&stack.includes(activeModal))return;
    const updated=editId?cust(editId):((S.customers||[]).length>beforeCount?S.customers[S.customers.length-1]:null);
    if(updated){updated.honorific=honorific;updated.smsLang=smsLang;updated.smsEnabled=smsEnabled;persist();smsScheduleSoon();}
  };
  const originalOpenMoney=openMoney;
  openMoney=function(cid,kind){
    originalOpenMoney(cid,kind);
    const c=cust(cid),sheet=document.querySelector('#modalRoot .ovl:last-child .sheet');if(!c||!sheet)return;
    if(kind==='debt'&&!sheet.querySelector('#mDueAt')){const label=document.createElement('div');const due=Core.nextMonthlyDue(Date.now(),c.payDay);label.innerHTML=`<label class="lbl" for="mDueAt">موعد استحقاق هذا الدين (اختياري)</label><input class="inp" id="mDueAt" type="date" value="${isoDate(due)}"><div class="sub">إذا تركته فارغًا فلن تُرسل تذكيرات تلقائية لهذا الدين حتى تحدد موعدًا. الزبائن ذوو يوم السداد الشهري يحصلون على الموعد التالي تلقائيًا.</div>`;sheet.querySelector('#mNote')?.before(label);}
    if(kind==='pay'&&!sheet.querySelector('#mNewDueAt')){const due=Core.nextMonthlyDue(Date.now(),c.payDay);const box=document.createElement('div');box.innerHTML=`<label class="lbl">موعد استحقاق السلعة الجديدة (اختياري)</label><input class="inp" id="mNewDueAt" type="date" value="${isoDate(due)}">`;sheet.querySelector('#mNewDebt')?.after(box);}
    if(kind==='pay'&&!sheet.querySelector('#mExtendEnabled'))sheet.querySelector('#mNote')?.before(Object.assign(document.createElement('div'),{innerHTML:smsExtendHtml(c)}));
  };
  const originalConfirmMoney=confirmMoney;
  confirmMoney=function(){
    const c=MM&&cust(MM.cid);if(!c)return originalConfirmMoney();
    const kind=MM.kind;const amount=round2(parseAmt(lastById('mAmt')?.value||'0'));
    let extension=null;
    if(kind==='pay'&&lastById('mExtendEnabled')?.checked){
      const extra=round2(parseAmt(lastById('mNewDebt')?.value||'0'));
      if(!(amount>0))return toast('أدخل مبلغ التسديد أولاً قبل تمديد الموعد','err');
      if(amount>bal(c)+extra+0.001)return toast('مبلغ التسديد أكبر من مجموع الدين والسلعة الجديدة','err');
      const debtId=lastById('mExtendDebt')?.value,n=Number(lastById('mExtendValue')?.value),unit=lastById('mExtendUnit')?.value;
      if(!debtId||!Number.isInteger(n)||n<1||n>365||!['days','weeks','months'].includes(unit))return toast('تحقق من مدة التمديد','err');
      const target=Core.ledger(c).find(x=>x.debt.id===debtId);const used=Core.allocatePayment(c,amount).filter(x=>x.debtId===debtId).reduce((a,x)=>a+x.amount,0);
      if(!target||target.remaining-used<=0.001)return toast('هذا الدين سيتم تسويته بالكامل بهذه الدفعة، اختر دينًا سيبقى منه رصيد','err');
      try{extension=Core.extendDebt(c,debtId,n,unit,Date.now());}catch(e){return toast(e.message,'err');}
    }
    const oldAddTx=addTx;
    addTx=function(customer,type,amt,note,extra){
      if(type==='pay')return oldAddTx(customer,type,amt,note,Object.assign({},extra||{},{allocations:Core.allocatePayment(customer,amt)}));
      if(type==='debt'){const due=fromDate(lastById(kind==='pay'?'mNewDueAt':'mDueAt')?.value);return oldAddTx(customer,type,amt,note,Object.assign({},extra||{},due?{dueAt:due}:{}));}
      return oldAddTx(customer,type,amt,note,extra);
    };
    try{originalConfirmMoney();}finally{addTx=oldAddTx;}
    if(extension){const log=c.tx.find(t=>t.type==='debt'&&t.id===extension.debtId);if(log){log.dueAt=extension.to;persist();}}
    smsScheduleSoon();
  };
  // Persisted app changes always rebuild/cancel the native queue. This prevents stale scheduled work after edits/payments.
  const originalPersist=persist;
  persist=function(){const r=originalPersist.apply(this,arguments);smsScheduleSoon();return r;};
  const guard=fn=>function(){if(deynReadOnly&&deynReadOnly()){toast('وضع القراءة فقط 🔒','err');return;}return fn.apply(this,arguments);};
  A.smsSettings=guard(smsOpenSettings);A.smsSaveSettings=guard(smsSaveSettings);A.smsTest=guard(smsTest);A.smsHistory=smsHistory;A.saveCust=guard(saveCust);A.mmok=guard(confirmMoney);
  document.addEventListener('change',e=>{if(e.target&&e.target.id==='smsGlobal')smsToggleGlobal(e.target);});
  document.addEventListener('change',e=>{if(e.target&&e.target.id==='fSmsEnabled')e.target.dataset.userTouched='1';});
  document.addEventListener('input',e=>{if(e.target&&e.target.id==='fPhone'&&cfg().enabled){const cb=lastById('fSmsEnabled');if(cb&&!cb.dataset.userTouched&&Core.phone(e.target.value))cb.checked=true;}});

  document.addEventListener('DOMContentLoaded',smsScheduleSoon);
  window.addEventListener('pageshow',smsScheduleSoon);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)smsScheduleSoon();});
  setTimeout(smsScheduleSoon,1200);
})();
