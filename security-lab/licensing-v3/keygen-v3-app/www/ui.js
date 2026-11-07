import { issueLicense } from "./license-v3.js";

const PUBLIC_KEY = "GGV7VOrfbHEBHxS/wzJ7OeZsBc2Jx013mPZT5s4GML4=";
const DEVICE_ID_RE = /^[0-9a-f]{32}$/;
const normalizeDeviceId = value => String(value || "").replace(/[\s-]/g, "").toLowerCase();
const isDeviceIdValid = value => DEVICE_ID_RE.test(normalizeDeviceId(value));
function expiryDateToUtcMs(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("اختر تاريخ انتهاء صحيحاً");
  const [y,m,d] = value.split("-").map(Number), date = new Date(Date.UTC(y,m-1,d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m-1 || date.getUTCDate() !== d) throw new Error("تاريخ غير صحيح");
  const result = Date.UTC(y,m-1,d+1);
  if (!Number.isSafeInteger(result) || result <= Date.now()) throw new Error("التاريخ يجب أن يكون في المستقبل");
  return result;
}
async function checkPrivateKey(pem) {
  if (!globalThis.crypto?.subtle) throw new Error("Ed25519 غير مدعوم في WebView هذا الهاتف");
  const body = String(pem).trim().replace("-----BEGIN PRIVATE KEY-----","").replace("-----END PRIVATE KEY-----","").replace(/\s+/g,"");
  const bytes = v => Uint8Array.from(atob(v), c => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey("pkcs8",bytes(body),{name:"Ed25519"},false,["sign"]);
  const publicKey = await crypto.subtle.importKey("raw",bytes(PUBLIC_KEY),{name:"Ed25519"},false,["verify"]);
  const challenge = new TextEncoder().encode("DEYN-V3-KEY-CHECK");
  const signature = await crypto.subtle.sign("Ed25519",privateKey,challenge);
  if (!await crypto.subtle.verify("Ed25519",publicKey,signature,challenge)) throw new Error("المفتاح لا يطابق نسخة DEYN");
}
if (typeof document !== "undefined") {
  const $ = id => document.getElementById(id);
  let tier="1Y", role="M", shown="";
  const error = m => { $("err").textContent=m||""; $("err").classList.toggle("show",!!m); };
  const toast = m => { $("toast").textContent=m; $("toast").classList.add("show"); setTimeout(()=>$("toast").classList.remove("show"),2200); };
  const plugin = () => { try { return globalThis.Capacitor?.Plugins?.Clipboard || null; } catch { return null; } };
  async function readClip(){try{const p=plugin();if(p?.read)return(await p.read()).value||"";if(navigator.clipboard?.readText)return await navigator.clipboard.readText();}catch{}return "";}
  async function writeClip(v){try{const p=plugin();if(p?.write){await p.write({string:v});return true;}if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(v);return true;}}catch{}try{const t=document.createElement("textarea");t.value=v;document.body.appendChild(t);t.select();const ok=document.execCommand("copy");t.remove();return ok;}catch{return false;}}
  function clear(){shown="";$("res").hidden=true;$("code").textContent="";}
  function refresh(){$("expiryCard").hidden=tier==="LT";$("gen").disabled=!isDeviceIdValid($("devId").value)||(tier!=="LT"&&!$("expiryDate").value);}
  ["devId","expiryDate"].forEach(id=>$(id).addEventListener("input",()=>{clear();error();refresh();}));
  $("loadKey").onclick=()=>$("keyFile").click();
  $("keyFile").onchange=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{$("privateKey").value=String(r.result||"");toast("حُمّل المفتاح في هذه الجلسة");};r.onerror=()=>error("تعذرت قراءة الملف");r.readAsText(f);e.target.value="";};
  for(const [id,set] of [["tier",v=>tier=v],["role",v=>role=v]])$(id).onclick=e=>{const b=e.target.closest("button[data-v]");if(!b)return;$(id).querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b));set(b.dataset.v);clear();error();refresh();};
  $("paste").onclick=async()=>{const v=await readClip();if(v){$("devId").value=normalizeDeviceId(v);clear();refresh();}else toast("الصق المعرّف يدوياً");};
  $("gen").onclick=async()=>{clear();error();const deviceId=normalizeDeviceId($("devId").value),pem=$("privateKey").value.trim();if(!isDeviceIdValid(deviceId))return error("المعرّف يجب أن يكون 32 خانة hex");if(!pem)return error("حمّل ملف المفتاح أولاً");try{const expiryUtcMs=tier==="LT"?null:expiryDateToUtcMs($("expiryDate").value);await checkPrivateKey(pem);$("gen").disabled=true;const code=await issueLicense({privateKeyPkcs8:pem,deviceId,tier,role,expiryUtcMs});$("privateKey").value="";shown=code;$("code").textContent=code;const expiry=tier==="LT"?"مدى الحياة":"حتى "+$("expiryDate").value+" UTC";$("meta").textContent=(role==="M"?"المالك الرئيسي":"العامل")+" • "+tier+" • "+expiry+" • "+deviceId;const msg="كود تفعيل DEYN الاختباري:\n"+code+"\n"+expiry;$("wa").href="https://wa.me/?text="+encodeURIComponent(msg);$("res").hidden=false;}catch(e){error(e?.message||"فشل التوليد");}finally{refresh();}};
  $("copy").onclick=async()=>{const v=$("code").textContent.trim();if(!v||v!==shown)return toast("أنشئ الكود أولاً");toast(await writeClip(v)?"تم النسخ":"اضغط مطولاً على الكود لنسخه");};
  refresh();
}