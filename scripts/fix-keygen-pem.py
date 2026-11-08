from pathlib import Path
import re
import tempfile
import zipfile

archive = Path("deyn-apk-project.zip")
if not archive.exists():
    raise SystemExit("deyn-apk-project.zip not found")

with tempfile.TemporaryDirectory() as td:
    root = Path(td)
    with zipfile.ZipFile(archive) as z:
        z.extractall(root)

    page = root / "deyn-keygen" / "www" / "index.html"
    html = page.read_text(encoding="utf-8")

    if "function pemBytes(pem)" in html:
        print("Keygen PEM decoder already patched; keeping existing fix")
        raise SystemExit(0)

    old = "const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));"
    new = r"""function pemBytes(pem){
 const text=String(pem||'').replace(/^\uFEFF/,'').trim();
 const match=text.match(/-----BEGIN PRIVATE KEY-----([\s\S]*?)-----END PRIVATE KEY-----/);
 if(!match)throw Error('ملف المفتاح غير صالح. اختر ملف DEYN_PRIVATE.pem وليس ملف ZIP أو المفتاح العام');
 const body=match[1].replace(/[\s\uFEFF\u200B-\u200D\u2060]/g,'');
 if(/[^\x00-\x7F]/.test(body))throw Error('ملف PEM يحتوي على أحرف غير صالحة. أعد اختيار ملف DEYN_PRIVATE.pem الأصلي');
 if(!/^[A-Za-z0-9+/]+={0,2}$/.test(body)||body.length%4!==0)throw Error('محتوى المفتاح غير مكتمل أو ليس بصيغة PEM صحيحة');
 try{return Uint8Array.from(atob(body),c=>c.charCodeAt(0));}
 catch(e){throw Error('تعذّر قراءة ترميز المفتاح. اختر ملف DEYN_PRIVATE.pem الأصلي من ZArchiver');}
}
const b64=s=>{try{return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}catch(e){throw Error('بيانات المفتاح العام داخل التطبيق غير صالحة');}};"""
    if old not in html:
        raise SystemExit("Could not find expected Base64 decoder in Keygen source")
    html = html.replace(old, new, 1)

    old_call = "b64(body),{name:'Ed25519'}"
    new_call = "pemBytes(pem),{name:'Ed25519'}"
    if old_call not in html:
        raise SystemExit("Could not find expected private-key import call")
    html = html.replace(old_call, new_call, 1)

    page.write_text(html, encoding="utf-8")
    temp_archive = archive.with_suffix(".tmp.zip")
    with zipfile.ZipFile(temp_archive, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for item in sorted(root.rglob("*")):
            if item.is_file():
                z.write(item, item.relative_to(root).as_posix())
    temp_archive.replace(archive)

print("Keygen PEM decoder patched successfully")
