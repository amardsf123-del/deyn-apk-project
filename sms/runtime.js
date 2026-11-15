/* DEYN_SMS_RUNTIME_V1 */
/* DEYN SMS UI/runtime bridge. Loaded after the existing DEYN app script. */
(function () {
  'use strict';
  const Core=window.DeynSmsCore;
  const plug=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.DeynSms;
  const cfg=()=>{ S.settings=S.settings||{}; S.settings.sms=Core.config(S.settings.sms); return S.settings.sms; };
  const escSms=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const isFr=()=>typeof DEYN_I18N!=='undefined'&&DEYN_I18N.lang==='fr';
  const tr=s=>(typeof DEYN_I18N!=='undefined'&&typeof DEYN_I18N.tr==='function')?DEYN_I18N.tr(s):s;
  const fmtDate=ts=>ts?Core.dateLabel(ts):tr('غير محدد');
  const isoDate=ts=>{if(!ts)return '';const d=new Date(ts);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const fromDate=s=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(s||'')))return null;const [y,m,d]=s.split('-').map(Number);const v=new Date(y,m-1,d,23,59,59,999).getTime();return Number.isFinite(v)?v:null;};
  let syncTimer=null, syncBusy=false;
  // Replace the legacy UI-only pay-day calculation with the same due-date engine used by SMS.
  payInfo=function(c){ return Core.customerPayInfo(c,Date.now()); };

  function smsSegmentSummary(text) {
    const info = Core.analyzeMessage ? Core.analyzeMessage(text) : { encoding: 'UCS-2', units: String(text||'').length, partsCount: Math.ceil(String(text||'').length / 67) || 1 };
    if (isFr()) {
      return `Encodage : ${info.encoding} • ${info.units} caractères • ${info.partsCount} partie(s) SMS`;
    }
    return `الترميز: ${info.encoding} • ${info.units} حرف • ${info.partsCount} جزء SMS`;
  }

  function updateTplCounters() {
    const arEl = lastById('smsTplAr'), frEl = lastById('smsTplFr');
    const arInfo = lastById('smsTplArInfo'), frInfo = lastById('smsTplFrInfo');
    if (arEl && arInfo) arInfo.textContent = smsSegmentSummary(arEl.value);
    if (frEl && frInfo) frInfo.textContent = smsSegmentSummary(frEl.value);
  }

  function smsStatusLabel(rec) {
    const st = rec && rec.status || 'accepted_by_android';
    const pt = Math.max(1, Number(rec && rec.partsTotal) || 1);
    const ps = Number.isFinite(Number(rec && rec.partsSent)) ? Number(rec.partsSent) : (st === 'sent_to_network' || st === 'delivered' ? pt : 0);
    const pf = Number(rec && rec.partsFailed) || 0;
    const partsBadge = pt > 1 ? (isFr() ? ` (${ps}/${pt} parties)` : ` (${ps}/${pt} أجزاء)`) : '';
    if (st === 'delivered') {
      return isFr() ? `Livré au destinataire${partsBadge}` : `تم تأكيد التسليم إلى هاتف المستلم${partsBadge}`;
    }
    if (st === 'sent_to_network') {
      return isFr() ? `Envoyé au réseau mobile${partsBadge}` : `تم الإرسال إلى الشبكة بنجاح${partsBadge}`;
    }
    if (st === 'partial_failure') {
      return isFr()
        ? `Échec partiel : ${ps} sur ${pt} partie(s) envoyée(s), ${pf} en échec`
        : `فشل جزئي — أُرسل ${ps} من ${pt} أجزاء فقط (${pf} فشل)`;
    }
    if (st === 'failed') {
      return isFr() ? `Échec d'envoi au réseau — nouvelle tentative programmée` : `فشل الإرسال إلى الشبكة — ستُعاد المحاولة`;
    }
    if (st === 'attempting') {
      return isFr() ? `Tentative d'envoi en cours...` : `جاري محاولة الإرسال...`;
    }
    if (st === 'dispatch_uncertain') {
      return isFr()
        ? `État d'envoi incertain — non renvoyé pour éviter les doublons`
        : `حالة الإرسال غير مؤكدة — لم نعد المحاولة لتجنب التكرار`;
    }
    return isFr()
      ? `Accepté par Android (en attente de confirmation réseau${partsBadge})`
      : `قَبِل أندرويد طلب الإرسال (بانتظار تأكيد الشبكة${partsBadge})`;
  }

  function smsOpenSettings(){
    if(deynReadOnly&&deynReadOnly()){toast('وضع القراءة فقط: لا يمكن تغيير إعدادات SMS','err');return;}
    if(!requireOwner('إعدادات الرسائل النصية'))return;
    const c=cfg();
    const hideArByDefault = isFr();
    openModal(()=>`${sheetHead('إعدادات رسائل SMS')}
      <div class="sub" style="line-height:1.8">ترسل الرسائل من شريحة هاتف المالك فقط. يجب توفر رصيد SMS وشبكة الهاتف. قبول أندرويد للرسالة لا يعني تأكيد وصولها إلى هاتف الزبون.</div>
      <div class="row-set" style="margin-top:10px"><div><b>تفعيل الرسائل النصية</b><small>عند التفعيل، تستأنف التذكيرات للزبائن المسموح لهم فقط. إيقاف الزبون بشكل فردي يبقى محفوظًا.</small></div><label class="sw"><input type="checkbox" id="smsGlobal" ${c.enabled?'checked':''}><i></i></label></div>
      <div style="border-top:1px solid var(--line);padding-top:12px;margin-top:10px">
        <b style="font-size:13px">جدول التذكير بعد الاستحقاق</b>
        <div class="sub">الأيام الافتراضية: 1 و4 و8 و15، ويمكن تغييرها.</div>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px">${c.days.map((d,i)=>`<label style="font-size:11px;color:var(--mute)">اليوم ${i+1}<input class="inp num" id="smsDay${i}" type="number" min="1" max="90" value="${d}" style="margin-top:4px;padding:8px 5px;height:40px;text-align:center"></label>`).join('')}</div>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px">${c.times.map((t,i)=>`<label style="font-size:11px;color:var(--mute)">وقت التذكير ${i+1}<input class="inp num" id="smsTime${i}" type="time" min="09:00" max="${c.end}" value="${t}" style="margin-top:4px;padding:6px 2px;height:40px;text-align:center"></label>`).join('')}</div>
      </div>
      <div style="border-top:1px solid var(--line);padding-top:12px;margin-top:12px">
        <b style="font-size:13px">فترة الإرسال والتوزيع</b>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px"><label class="lbl">بداية الإرسال (ثابتة)<div class="inp num" aria-label="بداية الإرسال ثابتة 09:00" style="direction:ltr;display:flex;align-items:center;justify-content:center;cursor:default;pointer-events:none;opacity:.8">09:00</div></label><label class="lbl">نهاية الإرسال (حتى 22:00)<input class="inp num" id="smsEnd" type="time" min="09:00" max="22:00" value="${c.end}" style="direction:ltr"></label></div>
        <label class="lbl">الفاصل بين الرسائل (بالدقائق)<input class="inp num" id="smsGap" type="number" min="1" max="60" value="${c.intervalMinutes}" style="direction:ltr"></label>
        <div class="sub">الافتراضي 09:00–22:00. تُرتّب الرسائل حسب أقدم دين متأخر وتُرسل بالتتابع لتجنب الإرسال الجماعي.</div>
      </div>
      <div style="border-top:1px solid var(--line);padding-top:12px;margin-top:12px">
        <b style="font-size:13px">اسم المحل في الرسالة</b>
        <label class="lbl">اسم المحل أو التاجر الذي يظهر للزبون</label>
        <input class="inp" id="smsStoreName" type="text" maxlength="80" value="${escSms(c.storeName||'')}" placeholder="مثال: محل الأمانة">
        <div class="sub">يُضاف هذا الاسم تلقائيًا مكان {store} في القالب العربي والفرنسي.</div>
      </div>
      <div style="border-top:1px solid var(--line);padding-top:12px;margin-top:12px">
        <b style="font-size:13px">قوالب الرسائل القابلة للتعديل</b>
        ${hideArByDefault ? `<button type="button" class="btn sm soft" data-act="smsToggleArTpl" style="margin-top:8px;height:32px;font-size:12px">عرض / تعديل القالب العربي</button>` : ''}
        <div id="smsTplArWrap" ${hideArByDefault ? 'hidden' : ''}>
          <label class="lbl">القالب العربي</label>
          <textarea class="inp" id="smsTplAr" maxlength="500" rows="4" style="height:auto;line-height:1.8">${escSms(c.tplAr)}</textarea>
          <div class="sub num" id="smsTplArInfo" style="font-size:11px;margin-top:2px">${escSms(smsSegmentSummary(c.tplAr))}</div>
        </div>
        <label class="lbl">القالب الفرنسي</label>
        <textarea class="inp" id="smsTplFr" maxlength="500" rows="4" style="height:auto;line-height:1.8;direction:ltr;text-align:left">${escSms(c.tplFr)}</textarea>
        <div class="sub num" id="smsTplFrInfo" style="font-size:11px;margin-top:2px">${escSms(smsSegmentSummary(c.tplFr))}</div>
        <div class="sub">المتغيرات: {title} اللقب، {name} الاسم، {amount} المبلغ، {date} تاريخ الاستحقاق، {store} اسم المحل إن كان موجودًا في ملف المتجر. الإعداد الحالي لا يحتوي على اسم متجر، لذلك لن يُضاف اسم غير موجود. الرسائل الطويلة قد تُحسب عدة وحدات SMS حسب شركة الاتصالات.</div>
      </div>
      <div style="border-top:1px solid var(--line);padding-top:12px;margin-top:12px">
        <b style="font-size:13px">اختبار الإرسال</b><label class="lbl">رقم الهاتف الذي تريد إرسال الاختبار إليه</label><input class="inp num" id="smsTestPhone" type="tel" placeholder="0555 12 34 56" style="direction:ltr;text-align:right">
        <button class="btn block" data-act="smsTest" style="margin-top:8px">إرسال رسالة تجريبية</button>
      </div>
      <div class="two" style="margin-top:14px"><button class="btn" data-act="smsHistory">سجل الرسائل</button><button class="btn pri" data-act="smsSaveSettings" data-primary>حفظ الإعدادات</button></div>`,
      {refresh:()=>{}, mount:()=>{ updateTplCounters(); }});
  }
  async function smsPermission(){const p=plug();if(!p)throw new Error(tr('ميزة SMS غير متاحة في هذه النسخة'));const s=await p.checkPermissions();if(s&&s.sms==='granted')return true;const r=await p.requestPermissions();return !!(r&&r.sms==='granted');}
  async function smsToggleGlobal(el){
    if(deynReadOnly&&deynReadOnly()){el.checked=!el.checked;return toast('وضع القراءة فقط','err');}
    if(!requireOwner('تفعيل الرسائل النصية')){el.checked=false;return;}
    if(el.checked){
      const ok=await smsPermission().catch(e=>{toast(e.message,'err');return false;});
      if(!ok){el.checked=false;toast('لم يتم منح إذن إرسال الرسائل، بقيت الميزة متوقفة','err');return;}
      Core.setGlobalEnabled(S,true);
      toast('تم تفعيل SMS العام دون تغيير إيقاف أي زبون بشكل فردي');
    }else{Core.setGlobalEnabled(S,false);toast('تم إيقاف جميع رسائل SMS مؤقتًا');}
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
    if(times.some(x=>x<'09:00'||x>end))return toast('يجب أن يكون وقت كل تذكير بين 09:00 ووقت نهاية الإرسال','err');
    c.days=days;c.times=times;c.start=start;c.end=end;c.intervalMinutes=gap;
    c.storeName=(lastById('smsStoreName')?.value||'').trim().slice(0,80);c.tplAr=lastById('smsTplAr')?.value.trim()||Core.DEFAULTS.tplAr;c.tplFr=lastById('smsTplFr')?.value.trim()||Core.DEFAULTS.tplFr;if(c.tplAr.length>500||c.tplFr.length>500)return toast('القالب طويل جدًا — الحد الأقصى 500 حرف لكل لغة','err');
    persist();smsScheduleSoon();closeModal();toast('تم حفظ إعدادات SMS بنجاح');
  }
  async function smsTest(){
    if(deynReadOnly&&deynReadOnly())return toast('وضع القراءة فقط: لا يمكن إرسال SMS','err');
    const p=plug();if(!p)return toast('الإرسال متاح داخل تطبيق أندرويد فقط','err');
    const to=Core.phone(lastById('smsTestPhone')?.value);if(!to)return toast('أدخل رقم هاتف صحيحًا','err');
    try{
      if(!(await smsPermission()))return toast('إذن SMS غير ممنوح','err');
      const nowLabel=Core.dateLabel(Date.now());
      const message=isFr()?`DEYN : Test SMS réussi - ${nowLabel}`:Core.testMessage(nowLabel);
      const testId='test-'+Date.now();
      const r=await p.send({id:testId,phone:to,message});
      if(!S.smsLog)S.smsLog={};
      const rec=Core.reconcileStatus(S.smsLog[testId],r||{status:'accepted_by_android'},{customerName:isFr()?'Test SMS':'رسالة تجريبية',phone:to});
      S.smsLog[testId]=rec;
      persist();
      if(rec.status==='delivered'){
        toast('تم إرسال رسالة الاختبار وتأكيد تسليمها إلى الهاتف','ok');
      }else if(rec.status==='sent_to_network'){
        toast('تم إرسال رسالة الاختبار إلى الشبكة بنجاح','ok');
      }else if(rec.status==='partial_failure'){
        toast(`فشل جزئي في إرسال الاختبار (${rec.partsSent}/${rec.partsTotal})`,'err');
      }else if(rec.status==='failed'){
        toast('فشل إرسال رسالة الاختبار إلى الشبكة','err');
      }else if(r&&r.duplicate){
        toast('رسالة الاختبار سبق إرسالها','warn');
      }else{
        toast('قَبِل أندرويد طلب الإرسال وبانتظار تأكيد الشبكة','warn');
      }
    }catch(e){toast(tr('تعذر إرسال الاختبار:')+' '+(e.message||e),'err');}
  }
  function smsHistory(){
    const validStatuses=new Set(['attempting','accepted_by_android','sent_to_network','delivered','partial_failure','failed','dispatch_uncertain']);
    const rows=Object.entries(S.smsLog||{}).filter(([k,v])=>v&&validStatuses.has(v.status)&&!v.internal).sort((a,b)=>(Number((b[1]&&b[1].at)||b[1])||0)-(Number((a[1]&&a[1].at)||a[1])||0)).slice(0,60);
    openModal(()=>`${sheetHead('سجل رسائل SMS')}<div class="sub">يميز السجل بين قبول أندرويد، ونجاح إرسال كل الأجزاء للشبكة، وتأكيد التسليم، والفشل الجزئي أو الكلي.</div>${rows.length?rows.map(([k,v])=>{
      const isBad = v&&['dispatch_uncertain','partial_failure','failed'].includes(v.status);
      const isPending = v&&['attempting','accepted_by_android'].includes(v.status);
      const icon = v&&v.status==='delivered'?'✓✓':(v&&v.status==='sent_to_network'?'✓':(isPending?'⏳':(v&&v.status==='failed'?'✕':'!')));
      const cls = isBad ? 'debt' : 'pay';
      return `<div class="tx"><div class="tx-ic ${cls}">${icon}</div><div class="tx-m"><b>${escSms(v&&v.customerName||k)}</b><small>${escSms(smsStatusLabel(v))} • ${escSms(fmtDate(Number(v&&v.at)||Number(v)||0))}</small></div><div class="tx-a"><small class="num">${escSms(v&&v.phone||'')}</small></div></div>`;
    }).join(''):'<div class="empty-st" style="padding:22px">لا توجد رسائل في السجل بعد</div>'}`);
  }
  function smsScheduleSoon(){clearTimeout(syncTimer);syncTimer=setTimeout(()=>{if(syncBusy){smsScheduleSoon();return;}smsSchedule();},100);}
  async function smsSchedule(){
    const p=plug();if(!p||syncBusy||!S)return;
    syncBusy=true;
    try{
      if(isWorkerDevice()||!cfg().enabled){await p.schedule({items:[]});if(S.smsQueueMeta&&Object.keys(S.smsQueueMeta).length){S.smsQueueMeta={};try{originalPersist();if(typeof deynFlush==='function')await deynFlush();}catch(e){console.warn('SMS queue metadata cleanup',e);}}return;}
      const permission=await p.checkPermissions();
      if(!permission||permission.sms!=='granted'){
        // Keep the global preference and the persisted WorkManager queue. A revoked permission
        // must pause sends, not erase scheduled reminders; the native worker retries after grant.
        toast('إذن SMS غير متاح حاليًا. لم نحذف جدول التذكيرات؛ سيُستأنف بعد منح الإذن.','warn');
        return;
      }
      if(!S.smsLog)S.smsLog={};if(!S.smsQueueMeta)S.smsQueueMeta={};
      const metaBefore=JSON.stringify(S.smsQueueMeta);let changed=false;
      try{
        const sent=await p.getSent();
        const rawItems=(sent&&sent.items)||((sent&&sent.ids)||[]).map(id=>({id,acceptedAt:Date.now(),status:'sent_to_network',sent:true,partsTotal:1,partsSent:1,partsFailed:0}));
        const uncertain=(sent&&sent.uncertain)||[];
        const failed=(sent&&sent.failed)||[];
        const byId=new Map();
        for(const item of rawItems.concat(uncertain,failed)){
          if(item&&item.id)byId.set(item.id,item);
        }
        for(const [id,item] of byId){
          if(!id)continue;
          if(id.startsWith('test-')){
            if(S.smsLog[id]){
              const nextRec=Core.reconcileStatus(S.smsLog[id],item,{customerName:S.smsLog[id].customerName,phone:S.smsLog[id].phone});
              if(JSON.stringify(nextRec)!==JSON.stringify(S.smsLog[id])){S.smsLog[id]=nextRec;changed=true;}
            }
            continue;
          }
          const prev=S.smsLog[id];
          const meta=S.smsQueueMeta[id]||(prev&&{eventKeys:prev.eventKeys,customerName:prev.customerName,phone:prev.phone})||{};
          const rec=Core.reconcileStatus(prev,item,meta);
          if(Array.isArray(meta.eventKeys))rec.eventKeys=meta.eventKeys;
          if(!prev||JSON.stringify(prev)!==JSON.stringify(rec)){
            S.smsLog[id]=rec;
            for(const k of meta.eventKeys||[]){
              if(rec.status==='failed'){
                delete S.smsLog[k];
              }else{
                S.smsLog[k]=Object.assign({},rec,{internal:true});
              }
            }
            changed=true;
          }
          if(['sent_to_network','delivered','partial_failure','dispatch_uncertain'].includes(rec.status)){
            delete S.smsQueueMeta[id];
          }
        }
      }catch(e){console.warn('SMS history sync',e);}
      const now=Date.now();const queue=Core.buildQueue(S,now,isFr()?'fr':'ar');
      const active=new Set(queue.map(x=>x.id));
      for(const id of Object.keys(S.smsQueueMeta)){
        const existing=S.smsLog[id];
        if(!active.has(id)&&(!existing||!['attempting','accepted_by_android'].includes(existing.status)))delete S.smsQueueMeta[id];
      }
      for(const item of queue){S.smsQueueMeta[item.id]={eventKeys:item.eventKeys,customerName:((S.customers||[]).find(c=>c.id===item.cid)||{}).name||'',phone:item.phone};}
      const metaChanged=metaBefore!==JSON.stringify(S.smsQueueMeta);let durable=true;if(changed||queue.length||metaChanged){try{const saved=originalPersist();if(saved===false)durable=false;else if(typeof deynFlush==='function')await deynFlush();}catch(e){durable=false;console.warn('SMS state flush failed',e);}}
      if(!durable){await p.schedule({items:[]});return;}
      const items=queue.filter(x=>!Core.isLogBlocking(S.smsLog[x.id])&&(x.at>now||Core.validateBeforeSend(S,x,now).ok)).map(x=>({id:x.id,phone:x.phone,message:x.message,at:x.at,gapMinutes:x.gapMinutes}));
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
  openCustForm=function(id,seg){
    originalOpenCustForm(id,seg);
    if(isWorkerDevice())return;
    const c=id?cust(id):null;
    const sheet=document.querySelector('#modalRoot .ovl:last-child .sheet');
    if(!sheet||sheet.querySelector('#fSmsLang'))return;
    const anchor=sheet.querySelector('#fPhone');
    const block=document.createElement('div');
    block.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><label class="lbl">اللقب<select class="inp" id="fHonorific"><option value="" ${!c?.honorific?'selected':''}>بدون لقب</option><option value="monsieur" ${c?.honorific==='monsieur'?'selected':''}>السيد / Monsieur</option><option value="madame" ${c?.honorific==='madame'?'selected':''}>السيدة / Madame</option></select></label><label class="lbl">لغة الرسالة<select class="inp" id="fSmsLang"><option value="auto" ${!c?.smsLang||c?.smsLang==='auto'?'selected':''}>تلقائي حسب لغة التطبيق</option><option value="ar" ${c?.smsLang==='ar'?'selected':''}>العربية</option><option value="fr" ${c?.smsLang==='fr'?'selected':''}>Français</option></select></label></div><label style="display:flex;align-items:center;gap:8px;font-size:12px;margin:8px 0"><input id="fSmsEnabled" type="checkbox" style="width:18px;height:18px" ${(!c||(!c.smsOptOut&&c.smsEnabled!==false))?'checked':''} ${c?.smsOptOut?'data-user-touched="1"':''}> السماح بإرسال تذكيرات SMS لهذا الزبون</label>`;
    anchor?.after(block);
    if(typeof DEYN_I18N!=='undefined'&&typeof DEYN_I18N.translateRoot==='function')DEYN_I18N.translateRoot(block);
  };
  const originalSaveCust=saveCust;
  saveCust=function(){
    if(isWorkerDevice())return originalSaveCust();
    const editId=CF&&CF.id?CF.id:null, beforeCount=(S.customers||[]).length;
    const phoneVal=lastById('fPhone')?.value.trim()||'';
    const honorific=lastById('fHonorific')?.value||'';const smsLang=lastById('fSmsLang')?.value||'auto';const hasPhone=!!Core.phone(phoneVal);const smsChecked=!!lastById('fSmsEnabled')?.checked;const smsOptOut=hasPhone?!smsChecked:!!(cust(editId||'')||{}).smsOptOut;const smsEnabled=hasPhone&&!smsOptOut;
    const activeModal=stack[stack.length-1];originalSaveCust();
    if(activeModal&&stack.includes(activeModal))return;
    const updated=editId?cust(editId):((S.customers||[]).length>beforeCount?S.customers[S.customers.length-1]:null);
    if(updated){updated.honorific=honorific;updated.smsLang=smsLang;updated.smsEnabled=smsEnabled;updated.smsOptOut=smsOptOut;persist();smsScheduleSoon();}
  };
  const originalOpenMoney=openMoney;
  openMoney=function(cid,kind){
    originalOpenMoney(cid,kind);
    const c=cust(cid),sheet=document.querySelector('#modalRoot .ovl:last-child .sheet');if(!c||!sheet)return;
    if(kind==='debt'&&!sheet.querySelector('#mDueAt')){const label=document.createElement('div');const due=Core.customerDueDate(c,Date.now());label.innerHTML=`<label class="lbl" for="mDueAt">موعد استحقاق هذا الدين (اختياري)</label><input class="inp" id="mDueAt" type="date" data-auto-payday="${c.payDay&&due?'true':'false'}" value="${isoDate(due)}"><div class="sub">يُستخدم يوم السداد الشهري الحالي تلقائيًا. إذا غيّرت التاريخ يدويًا فسيُحفظ كتاريخ ثابت لهذا الدين.</div>`;sheet.querySelector('#mNote')?.before(label);}
    if(kind==='pay'&&!sheet.querySelector('#mNewDueAt')){const due=Core.customerDueDate(c,Date.now());const box=document.createElement('div');box.innerHTML=`<label class="lbl">موعد استحقاق السلعة الجديدة (اختياري)</label><input class="inp" id="mNewDueAt" type="date" data-auto-payday="${c.payDay&&due?'true':'false'}" value="${isoDate(due)}">`;sheet.querySelector('#mNewDebt')?.after(box);}
    if(kind==='pay'&&!sheet.querySelector('#mExtendEnabled'))sheet.querySelector('#mNote')?.before(Object.assign(document.createElement('div'),{innerHTML:smsExtendHtml(c)}));
    if(typeof DEYN_I18N!=='undefined'&&typeof DEYN_I18N.translateRoot==='function')DEYN_I18N.translateRoot(sheet);
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
      try{extension=Core.extendDebt(c,debtId,n,unit,Date.now());}catch(e){return toast(tr(e.message),'err');}
    }
    const oldAddTx=addTx;
    const dueMetadata=(customer,fieldId)=>{
      const field=lastById(fieldId),due=fromDate(field?.value);
      if(!due)return {};
      const expected=Core.customerDueDate(customer,Date.now());
      const followsMonthlyPayDay=!!(customer.payDay&&field?.dataset.autoPayday==='true'&&expected&&isoDate(expected)===field.value);
      return followsMonthlyPayDay?{dueDateMode:'monthly'}:{dueAt:due,dueDateMode:'fixed'};
    };
    addTx=function(customer,type,amt,note,extra){
      if(type==='pay')return oldAddTx(customer,type,amt,note,Object.assign({},extra||{},{allocations:Core.allocatePayment(customer,amt)}));
      if(type==='debt'){const fieldId=kind==='pay'?'mNewDueAt':'mDueAt';return oldAddTx(customer,type,amt,note,Object.assign({},extra||{},dueMetadata(customer,fieldId)));}
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
  A.smsToggleArTpl=()=>{const w=lastById('smsTplArWrap');if(w)w.hidden=!w.hidden;};
  if(typeof READONLY_OK!=='undefined'&&READONLY_OK&&typeof READONLY_OK.add==='function'){READONLY_OK.add('smsHistory');}
  document.addEventListener('change',e=>{if(e.target&&e.target.id==='smsGlobal')smsToggleGlobal(e.target);});
  document.addEventListener('change',e=>{if(e.target&&(e.target.id==='mDueAt'||e.target.id==='mNewDueAt'))e.target.dataset.autoPayday='false';});
  document.addEventListener('change',e=>{if(e.target&&e.target.id==='fSmsEnabled')e.target.dataset.userTouched='1';});
  document.addEventListener('input',e=>{
    if(e.target&&(e.target.id==='smsTplAr'||e.target.id==='smsTplFr'))updateTplCounters();
    if(e.target&&e.target.id==='fPhone'&&cfg().enabled){const cb=lastById('fSmsEnabled');const c=CF&&CF.id?cust(CF.id):null;if(cb&&!cb.dataset.userTouched&&!c?.smsOptOut&&Core.phone(e.target.value))cb.checked=true;}
  });

  document.addEventListener('DOMContentLoaded',smsScheduleSoon);
  window.addEventListener('pageshow',smsScheduleSoon);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)smsScheduleSoon();});
  setTimeout(smsScheduleSoon,1200);
})();