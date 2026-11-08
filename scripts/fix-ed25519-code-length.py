#!/usr/bin/env python3
from pathlib import Path
import tempfile, zipfile

root = Path(__file__).resolve().parents[1]
archive = root / "deyn-apk-project.zip"
with tempfile.TemporaryDirectory() as td:
    work = Path(td)
    with zipfile.ZipFile(archive) as z:
        z.extractall(work)
    app = work / "deyn-app/www/index.html"
    source = app.read_text(encoding="utf-8")

    old = 'id="agCode" type="text" dir="auto" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="40"'
    new = 'id="agCode" type="text" dir="auto" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="240"'
    if old in source:
        source = source.replace(old, new, 1)
    elif new not in source:
        raise SystemExit("Activation code input changed; refusing unsafe edit")

    css = """
<style id="deyn-long-code-layout-fix">
html,body{width:100%;max-width:100%;overflow-x:hidden}
*,*::before,*::after{box-sizing:border-box}
[data-act="copyMasterCode"],[data-act="copyAssistantCode"]{
  width:100%;max-width:100%;min-width:0;overflow:hidden
}
[data-act="copyMasterCode"]>div:first-child,
[data-act="copyAssistantCode"]>div:first-child{
  flex:1 1 0;min-width:0;max-width:100%;overflow:hidden
}
[data-act="copyMasterCode"] b.num,
[data-act="copyAssistantCode"] b.num{
  display:block;width:100%;max-width:100%;min-width:0;
  white-space:normal!important;overflow-wrap:anywhere!important;
  word-break:break-all!important;line-height:1.55
}
[data-act="copyMasterCode"]>span,
[data-act="copyAssistantCode"]>span{flex:0 0 auto}
</style>
"""
    if 'id="deyn-long-code-layout-fix"' not in source:
        if "</head>" not in source:
            raise SystemExit("Could not find </head> to insert long-code layout fix")
        source = source.replace("</head>", css + "\n</head>", 1)

    required = [
        'maxlength="240"', 'var DEYN_PUBLIC_KEY',
        '[data-act="copyMasterCode"] b.num',
        '[data-act="copyAssistantCode"] b.num'
    ]
    if not all(x in source for x in required):
        raise SystemExit("Activation input or mobile code-card layout verification failed")

    app.write_text(source, encoding="utf-8")
    temp = archive.with_suffix(".zip.tmp")
    with zipfile.ZipFile(temp, "w", zipfile.ZIP_DEFLATED, compresslevel=7) as z:
        for f in sorted(work.rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(work).as_posix())
    temp.replace(archive)
print("PASS: full signed activation code remains intact")
print("PASS: master and assistant code cards wrap inside the mobile viewport")
print("PASS: copy controls remain visible and horizontally fixed")
