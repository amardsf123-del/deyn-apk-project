import { issueLicense } from "../license-v3.js";

const PUBLIC_KEY = "GGV7VOrfbHEBHxS/wzJ7OeZsBc2Jx013mPZT5s4GML4=";
const DEVICE_ID_RE = /^[0-9a-f]{32}$/;
export const normalizeDeviceId = value => String(value || "").replace(/[\s-]/g, "").toLowerCase();
export const isDeviceIdValid = value => DEVICE_ID_RE.test(normalizeDeviceId(value));

// Selected date is inclusive; expiry is midnight UTC on the following day.
export function expiryDateToUtcMs(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("اختر تاريخ انتهاء صحيحاً أولاً");
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) throw new Error("تاريخ الانتهاء غير صحيح");
  const result = Date.UTC(y, m - 1, d + 1);
  if (!Number.isSafeInteger(result) || result <= Date.now()) throw new Error("تاريخ الانتهاء يجب أن يكون في المستقبل");
  return result;
}

async function checkPrivateKey(pem) {
  if (!globalThis.crypto?.subtle) throw new Error("هذا الجهاز لا يدعم التوقيع الآمن. حدّث Android System WebView.");
  const body = String(pem).trim().replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\s+/g, "");
  const bytes = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey("pkcs8", bytes(body), { name: "Ed25519" }, false, ["sign"]);
  const publicKey = await crypto.subtle.importKey("raw", bytes(PUBLIC_KEY), { name: "Ed25519" }, false, ["verify"]);
  const challenge = new TextEncoder().encode("DEYN-V3-KEY-CHECK");
  const signature = await crypto.subtle.sign("Ed25519", privateKey, challenge);
  if (!await crypto.subtle.verify("Ed25519", publicKey, signature, challenge)) throw new Error("مفتاح التوقيع لا يطابق تطبيق DEYN هذا");
}

if (typeof document !== "undefined") {
  const $ = id => document.getElementById(id);
  let tier = "1Y", role = "M", shown = "";
  const error = message => { $("err").textContent = message || ""; $("err").classList.toggle("show", !!message); };
  const clearResult = () => { shown = ""; $("res").hidden = true; $("code").textContent = ""; };
  const toast = message => { $("toast").textContent = message; $("toast").classList.add("show"); setTimeout(() => $("toast").classList.remove("show"), 2200); };
  const plugin = () => { try { return globalThis.Capacitor?.Plugins?.Clipboard || null; } catch { return null; } };
  async function readClip() { try { const p = plugin(); if (p?.read) return (await p.read()).value || ""; if (navigator.clipboard?.readText) return await navigator.clipboard.readText(); } catch {} return ""; }
  async function writeClip(value) { try { const p = plugin(); if (p?.write) { await p.write({ string: value }); return true; } if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(value); return true; } } catch {} try { const t = document.createElement("textarea"); t.value = value; document.body.appendChild(t); t.select(); const ok = document.execCommand("copy"); t.remove(); return ok; } catch { return false; } }
  function refresh() { $("expiryCard").hidden = tier === "LT"; $("gen").disabled = !isDeviceIdValid($("devId").value) || (tier !== "LT" && !$("expiryDate").value); }

  ["devId", "expiryDate"].forEach(id => $(id).addEventListener("input", () => { clearResult(); error(); refresh(); }));
  $("loadKey").onclick = () => $("keyFile").click();
  $("keyFile").onchange = event => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { $("privateKey").value = String(reader.result || ""); toast("تم تحميل المفتاح في هذه الجلسة فقط"); }; reader.onerror = () => error("تعذّرت قراءة الملف"); reader.readAsText(file); event.target.value = ""; };
  for (const [id, set] of [["tier", v => tier = v], ["role", v => role = v]]) $(id).onclick = event => { const b = event.target.closest("button[data-v]"); if (!b) return; $(id).querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); set(b.dataset.v); clearResult(); error(); refresh(); };
  $("paste").onclick = async () => { const value = await readClip(); if (value) { $("devId").value = normalizeDeviceId(value); clearResult(); refresh(); } else toast("الصق معرّف الجهاز يدوياً"); };
  $("gen").onclick = async () => {
    clearResult(); error();
    const deviceId = normalizeDeviceId($("devId").value), pem = $("privateKey").value.trim();
    if (!isDeviceIdValid(deviceId)) return error("معرّف الجهاز يجب أن يكون 32 خانة سداسية عشرية");
    if (!pem) return error("حمّل ملف مفتاح التوقيع الخاص أولاً");
    try {
      const expiryUtcMs = tier === "LT" ? null : expiryDateToUtcMs($("expiryDate").value);
      await checkPrivateKey(pem);
      $("gen").disabled = true;
      const code = await issueLicense({ privateKeyPkcs8: pem, deviceId, tier, role, expiryUtcMs });
      $("privateKey").value = ""; // clear the visible secret immediately after successful use
      shown = code; $("code").textContent = code;
      const expiry = tier === "LT" ? "مدى الحياة" : "حتى نهاية " + $("expiryDate").value + " UTC";
      $("meta").textContent = (role === "M" ? "المالك الرئيسي" : "العامل") + " • " + tier + " • " + expiry + " • " + deviceId;
      const message = "مرحباً، كود تفعيل DEYN لجهازك:\n" + code + "\nنوع الحساب: " + (role === "M" ? "المالك الرئيسي" : "العامل") + "\nالصلاحية: " + expiry;
      $("wa").href = "https://wa.me/?text=" + encodeURIComponent(message); $("res").hidden = false;
    } catch (e) { error(e?.message || "تعذّر إنشاء الكود"); }
    finally { refresh(); }
  };
  $("copy").onclick = async () => { const value = $("code").textContent.trim(); if (!value || value !== shown) return toast("أنشئ الكود أولاً"); toast(await writeClip(value) ? "تم نسخ الكود" : "اضغط مطولاً على الكود لنسخه"); };
  refresh();
}
