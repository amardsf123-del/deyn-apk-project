#!/usr/bin/env python3
from pathlib import Path
import re
import tempfile
import zipfile

root = Path(__file__).resolve().parents[1]
archive = root / "deyn-apk-project.zip"

runtime_patch = r"""
<script>/* DEYN_DEVICE_ID_32_CHAR_RUNTIME_FIX */
(function(){
 function fixDeviceIdField(){
   const el=document.getElementById('devId');
   if(!el)return;
   el.setAttribute('maxlength','32');
   el.maxLength=32;
   el.setAttribute('inputmode','text');
   el.autocapitalize='characters';
   if(!el.dataset.deyn32Bound){
     el.dataset.deyn32Bound='1';
     el.addEventListener('input',function(){
       const clean=this.value.replace(/[^0-9a-f]/gi,'').slice(0,32).toLowerCase();
       if(this.value!==clean)this.value=clean;
     });
   }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',fixDeviceIdField);
 else fixDeviceIdField();
 const observer=new MutationObserver(fixDeviceIdField);
 observer.observe(document.documentElement,{childList:true,subtree:true});
})();
</script>
"""

with tempfile.TemporaryDirectory() as td:
    work = Path(td)
    with zipfile.ZipFile(archive) as z:
        z.extractall(work)

    page = work / "deyn-keygen/www/index.html"
    html = page.read_text(encoding="utf-8")

    # Replace any previous broad runtime patch with a precise #devId-only fix.
    old_script = re.search(
        r'<script>/\* DEYN_DEVICE_ID_32_CHAR_RUNTIME_FIX \*/[\s\S]*?</script>',
        html
    )
    if old_script:
        html = html[:old_script.start()] + runtime_patch + html[old_script.end():]
    else:
        if "</body>" not in html.lower():
            raise SystemExit("Keygen page has no closing body tag")
        pos = html.lower().rfind("</body>")
        html = html[:pos] + runtime_patch + "\n" + html[pos:]

    # Keep the private key available in the current session after successful generation.
    # Fix result visibility: CSS requires .show; toggling only the hidden attribute is insufficient.
    old_clear_result = "function clear(){shown='';$('res').hidden=true;$('code').textContent='';}"
    new_clear_result = "function clear(){shown='';$('res').hidden=true;$('res').classList.remove('show');$('code').textContent='';}"
    if old_clear_result in html:
        html = html.replace(old_clear_result, new_clear_result, 1)
    if "$('res').hidden=false;" in html and "$('res').classList.add('show')" not in html:
        html = html.replace("$('res').hidden=false;", "$('res').hidden=false;$('res').classList.add('show');", 1)
    old_clear = "$('privateKey').value='';shown=code;"
    if old_clear in html:
        html = html.replace(old_clear, "shown=code;", 1)
    elif "shown=code;" not in html:
        raise SystemExit("Could not locate Keygen success handler")

    page.write_text(html, encoding="utf-8")

    verify = page.read_text(encoding="utf-8")
    if "DEYN_DEVICE_ID_32_CHAR_RUNTIME_FIX" not in verify or "el.maxLength=32" not in verify:
        raise SystemExit("Keygen 32-character device ID fix verification failed")
    if "$('privateKey').value='';shown=code;" in verify:
        raise SystemExit("Private key is still cleared after generation")

    temp = archive.with_suffix(".zip.tmp")
    with zipfile.ZipFile(temp, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in sorted(work.rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(work).as_posix())
    temp.replace(archive)

print("PASS: precise 32-character device ID fix; private key retained after generation")
