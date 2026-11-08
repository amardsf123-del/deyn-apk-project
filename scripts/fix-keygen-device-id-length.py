#!/usr/bin/env python3
from pathlib import Path
import tempfile
import zipfile

root = Path(__file__).resolve().parents[1]
archive = root / "deyn-apk-project.zip"

runtime_patch = r"""
<script>
(function(){
 function fixDeviceIdField(){
   const fields=[...document.querySelectorAll('input,textarea')];
   for(const el of fields){
     const labels=[...(el.labels||[])].map(x=>x.innerText||'').join(' ');
     const nearby=((el.getAttribute('placeholder')||'')+' '+(el.getAttribute('aria-label')||'')+' '+(el.id||'')+' '+(el.name||'')+' '+labels).toLowerCase();
     const parent=(el.parentElement?.innerText||'').slice(0,180).toLowerCase();
     if(/device.?id|device|معرف الجهاز|معرّف الجهاز/.test(nearby+' '+parent)){
       el.maxLength=32;
       el.removeAttribute('maxlength');
       el.maxLength=32;
       el.addEventListener('input',function(){
         const clean=this.value.toUpperCase().replace(/[^0-9A-F]/g,'').slice(0,32);
         if(this.value!==clean)this.value=clean;
       });
     }
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
    marker = "DEYN_DEVICE_ID_32_CHAR_RUNTIME_FIX"
    if marker not in html:
        # Insert before the closing body tag so it runs after the page markup.
        runtime_patch = runtime_patch.replace("<script>", "<script>/* " + marker + " */", 1)
        if "</body>" not in html.lower():
            raise SystemExit("Keygen page has no closing body tag; cannot safely inject device ID fix")
        pos = html.lower().rfind("</body>")
        html = html[:pos] + runtime_patch + "\n" + html[pos:]
        page.write_text(html, encoding="utf-8")

    # Verify the injected runtime fix is present before allowing the build.
    verify = page.read_text(encoding="utf-8")
    if marker not in verify or "el.maxLength=32" not in verify:
        raise SystemExit("Keygen 32-character device ID runtime fix verification failed")

    temp = archive.with_suffix(".zip.tmp")
    with zipfile.ZipFile(temp, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in sorted(work.rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(work).as_posix())
    temp.replace(archive)

print("PASS: injected Keygen runtime fix for 32-character hexadecimal device IDs")
