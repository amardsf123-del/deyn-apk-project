#!/usr/bin/env python3
"""DEYN due-date fix (v1).

Usage:  python3 apply_due_fix.py <integrated index.html> [output.html]

Makes the debt due date, the SMS reminder queue and the on-screen "late by N days" status use the SAME rule,
and adds a "next month" checkbox next to the due-date field (only when the customer's pay day already passed this month).
Idempotent. Fails loudly if an anchor is missing, so it can never silently half-apply.
Run it AFTER integrate_sms.py in the build workflow.
"""
import sys, re
src = sys.argv[1]; dst = sys.argv[2] if len(sys.argv) > 2 else src
t = open(src, encoding='utf-8').read()
MARK = 'DEYN_DUE_FIX_V1'
if MARK in t:
    print('already applied'); open(dst, 'w', encoding='utf-8').write(t); sys.exit(0)

def must_replace(text, old, new, label):
    n = text.count(old)
    if n != 1:
        sys.exit(f'ANCHOR ERROR [{label}]: expected exactly 1 match, found {n}')
    return text.replace(old, new, 1)

# ---------- 1) engine: shared due-date rules + payStatus ----------
ENGINE = r"""
  /* DEYN_DUE_FIX_V1: one rule for "when is this debt due / how late is it", shared by the screen and the SMS queue. */
  const dayDiff = (a, b) => { const A=new Date(a), B=new Date(b); return Math.round((Date.UTC(A.getFullYear(),A.getMonth(),A.getDate())-Date.UTC(B.getFullYear(),B.getMonth(),B.getDate()))/DAY); };
  const monthDueAt = (y, m, day) => new Date(y, m, Math.min(day, new Date(y, m + 1, 0).getDate()), 23, 59, 59, 999).getTime();
  const unitWord = n => n === 1 ? 'يوم' : (n === 2 ? 'يومين' : 'أيام');
  /* Choices for a customer with a monthly pay day. passed=true means this month's pay day is already behind us. */
  function dueChoice(payDay, now) {
    const day = Math.floor(Number(payDay));
    if (!(day >= 1 && day <= 31)) return null;
    const n = new Date(now || Date.now()), y = n.getFullYear(), m = n.getMonth();
    const thisMonth = monthDueAt(y, m, day), nextMonth = monthDueAt(y, m + 1, day);
    const rel = dayDiff(thisMonth, n.getTime());           // <0 passed, 0 today, >0 days left
    const passed = rel < 0;
    return { day, passed, thisMonth, nextMonth, defaultAt: passed ? nextMonth : thisMonth, lateDays: passed ? -rel : 0, daysLeft: passed ? 0 : rel };
  }
  /* Status shown on the customer card/list. Uses the earliest due date among the customer's OPEN debts (same dueAt as the SMS queue). */
  function payStatus(c, now) {
    if (!c || !c.payDay) return null;
    const open = ledger(c).filter(x => validDate(x.dueAt));
    if (!open.length) return null;
    const due = Math.min(...open.map(x => Number(x.dueAt)));
    const rel = dayDiff(due, now || Date.now()), dd = new Date(due).getDate();
    if (rel === 0) return { status: 'today', diff: 0, day: dd, dueAt: due, label: `اليوم موعد السداد المحدد (${dd} في الشهر)` };
    if (rel > 0) return { status: rel <= 5 ? 'soon' : 'future', diff: rel, day: dd, dueAt: due,
      label: rel <= 5 ? `يقترب موعد السداد (بعد ${rel} ${unitWord(rel)})` : `موعد السداد يوم ${dd} من الشهر` };
    const late = -rel;
    return { status: 'overdue', diff: late, day: dd, dueAt: due, label: `متأخر عن موعد السداد بـ ${late} ${unitWord(late)} (كان يوم ${dd})` };
  }
"""
EXPORT_OLD = "root.DeynSmsCore={DEFAULTS,config,ledger,allocatePayment,extendDebt,buildQueue,validateBeforeSend,phone,nextMonthlyDue,dateLabel,testMessage,normalizeSmsText,analyzeMessage,reconcileStatus,isLogBlocking,resolveSmsLang,setGlobalEnabled,applyDueFallback,diagnose};"
EXPORT_NEW = "root.DeynSmsCore={DEFAULTS,config,ledger,allocatePayment,extendDebt,buildQueue,validateBeforeSend,phone,nextMonthlyDue,dateLabel,testMessage,normalizeSmsText,analyzeMessage,reconcileStatus,isLogBlocking,resolveSmsLang,setGlobalEnabled,applyDueFallback,diagnose,dueChoice,payStatus,dayDiff,unitWord};"
# keep the engine's own function order: the new helpers go right before the export line
t = must_replace(t, "  " + EXPORT_OLD if ("  " + EXPORT_OLD) in t else EXPORT_OLD, ENGINE + "  " + EXPORT_NEW if ("  " + EXPORT_OLD) in t else ENGINE + EXPORT_NEW, 'engine export')

# ---------- 2) screen status uses the shared rule ----------
t = must_replace(t,
  "function payInfo(c) {\n  if (!c.payDay || bal(c) <= 0) return null;\n",
  "function payInfo(c) {\n  if (!c.payDay || bal(c) <= 0) return null;\n"
  "  try { const _ps = window.DeynSmsCore && window.DeynSmsCore.payStatus && window.DeynSmsCore.payStatus(c, Date.now()); if (_ps) return _ps; } catch (e) {}\n",
  'payInfo')

# ---------- 3) debt form: due date + "next month" checkbox ----------
CTRL = r"""  /* DEYN_DUE_FIX_V1 UI: due-date field with a "next month" checkbox (shown only when this month's pay day already passed). */
  function dueControl(c,id,labelText,anchor,where){
    const ch=Core.dueChoice(c&&c.payDay,Date.now()); if(!ch||!anchor)return false;
    const dm=ts=>{const d=new Date(ts);return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0');};
    const wrap=document.createElement('div'); wrap.className='sms-due'; wrap.setAttribute('data-sms-due',id);
    wrap.innerHTML=`<label class="lbl" for="${id}">${labelText}</label><div style="display:flex;gap:8px;align-items:center"><input class="inp" id="${id}" type="date" value="${isoDate(ch.defaultAt)}" style="flex:1;min-width:0">`+
      (ch.passed?`<label style="display:flex;align-items:center;gap:6px;flex:none;border:1px solid var(--line);border-radius:12px;padding:0 12px;height:48px;font-size:13px;font-weight:700;white-space:nowrap;background:#fff"><input type="checkbox" id="${id}Next" checked style="width:18px;height:18px;accent-color:var(--em)"><span>الشهر القادم</span></label>`:'')+
      `</div><div class="sub" id="${id}Hint" style="margin-top:6px"></div>`;
    const inp=wrap.querySelector('#'+id),cb=wrap.querySelector('#'+id+'Next'),hint=wrap.querySelector('#'+id+'Hint');
    const render=()=>{
      const due=fromDate(inp.value); let msg='';
      if(!due){msg='بلا موعد استحقاق: يُحسب الموعد تلقائيًا من يوم السداد.';}
      else{
        const rel=Core.dayDiff(due,Date.now());
        if(cb&&due===ch.nextMonth)msg=`يوم السداد ${ch.day} فات هذا الشهر، فسيُحسب الدين على الشهر القادم (${dm(due)}) ولن يظهر متأخرًا.`;
        else if(rel<0)msg=`سيُحسب الدين متأخرًا بـ ${-rel} ${Core.unitWord(-rel)} (كان الموعد ${dm(due)}).`;
        else if(rel===0)msg=`الموعد اليوم (${dm(due)}).`;
        else msg=`بقي ${rel} ${Core.unitWord(rel)} على موعد السداد (${dm(due)}).`;
      }
      hint.textContent=tr(msg);
    };
    inp.addEventListener('input',()=>{ if(cb){const due=fromDate(inp.value);cb.checked=(due===ch.nextMonth);} render(); });
    inp.addEventListener('change',()=>{ if(cb){const due=fromDate(inp.value);cb.checked=(due===ch.nextMonth);} render(); });
    if(cb)cb.addEventListener('change',()=>{inp.value=isoDate(cb.checked?ch.nextMonth:ch.thisMonth);render();});
    anchor[where==='after'?'after':'before'](wrap); render(); return true;
  }
  window.__deynDueControl=dueControl;
"""
t = must_replace(t, "  const originalOpenMoney=openMoney;\n", CTRL + "  const originalOpenMoney=openMoney;\n", 'dueControl insertion')
t = must_replace(t,
  "    if(kind==='debt'&&!sheet.querySelector('#mDueAt')){",
  "    if(kind==='debt'&&c.payDay&&!sheet.querySelector('#mDueAt'))dueControl(c,'mDueAt','موعد استحقاق هذا الدين (اختياري)',sheet.querySelector('#mNote'),'before');\n"
  "    if(kind==='pay'&&c.payDay&&!sheet.querySelector('#mNewDueAt'))dueControl(c,'mNewDueAt','موعد استحقاق السلعة الجديدة (اختياري)',sheet.querySelector('#mNewDebt'),'after');\n"
  "    if(kind==='debt'&&!sheet.querySelector('#mDueAt')){",
  'form hook')

# ---------- 4) French entries for the new texts ----------
FR = '''const DEYN_FR_DICT = {
  "الشهر القادم": "Mois prochain",
  "بلا موعد استحقاق: يُحسب الموعد تلقائيًا من يوم السداد.": "Sans échéance : elle est calculée automatiquement à partir du jour de paiement.",
  "يوم السداد {} فات هذا الشهر، فسيُحسب الدين على الشهر القادم ({}) ولن يظهر متأخرًا.": "Le jour de paiement ({1}) est déjà passé ce mois-ci : la dette sera due le mois prochain ({2}) et ne sera pas en retard.",
  "سيُحسب الدين متأخرًا بـ 2 يومين (كان الموعد {}).": "La dette sera en retard de 2 jours (échéance : {}).",
  "سيُحسب الدين متأخرًا بـ {} {} (كان الموعد {}).": "La dette sera en retard de {1} {2} (échéance : {3}).",
  "الموعد اليوم ({}).": "Échéance aujourd'hui ({}).",
  "بقي 2 يومين على موعد السداد ({}).": "Il reste 2 jours avant l'échéance ({}).",
  "بقي {} {} على موعد السداد ({}).": "Il reste {1} {2} avant l'échéance ({3}).",
'''
t = must_replace(t, "const DEYN_FR_DICT = {\n", FR, 'fr dict')

open(dst, 'w', encoding='utf-8').write(t)
print('applied OK ->', dst)
