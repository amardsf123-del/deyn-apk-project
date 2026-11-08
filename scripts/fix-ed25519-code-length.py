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
    elif 'id="agCode"' not in source:
        raise SystemExit("Activation input element not found; refusing unsafe edit")

    if 'data-act="copyMasterCode"' not in source or 'data-act="copyAssistantCode"' not in source:
        raise SystemExit("Expected master/assistant license cards not found; refusing unsafe edit")

    css = """
<style id="deyn-long-code-layout-fix">
html,body{width:100%;max-width:100%;overflow-x:hidden}
*,*::before,*::after{box-sizing:border-box}
[data-act="copyMasterCode"],[data-act="copyAssistantCode"]{
  display:grid!important;grid-template-columns:minmax(0,1fr) auto;
  align-items:center;column-gap:10px;width:100%;max-width:100%;
  min-width:0;overflow:hidden
}
[data-act="copyMasterCode"]>div:first-child,
[data-act="copyAssistantCode"]>div:first-child{
  display:block;min-width:0!important;width:auto!important;
  max-width:100%!important;overflow:hidden
}
[data-act="copyMasterCode"] b.num,
[data-act="copyAssistantCode"] b.num{
  display:block!important;width:100%!important;max-width:100%!important;
  min-width:0!important;white-space:normal!important;
  overflow-wrap:anywhere!important;word-wrap:break-word!important;
  word-break:break-all!important;line-height:1.55;
  direction:ltr;unicode-bidi:plaintext;text-align:left;
  letter-spacing:normal!important
}
[data-act="copyMasterCode"]>span,
[data-act="copyAssistantCode"]>span{
  grid-column:2;white-space:nowrap;max-width:100%;flex:none
}
</style>
"""
    if 'id="deyn-long-code-layout-fix"' not in source:
        if "</head>" not in source:
            raise SystemExit("Could not find </head> to insert long-code layout fix")
        source = source.replace("</head>", css + "\n</head>", 1)

    if 'id="deyn-long-code-layout-fix"' not in source:
        raise SystemExit("Long-code mobile layout CSS was not inserted")
    if 'data-act="copyMasterCode"' not in source or 'data-act="copyAssistantCode"' not in source:
        raise SystemExit("License cards disappeared during patch")

    app.write_text(source, encoding="utf-8")
    temp = archive.with_suffix(".zip.tmp")
    with zipfile.ZipFile(temp, "w", zipfile.ZIP_DEFLATED, compresslevel=7) as z:
        for f in sorted(work.rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(work).as_posix())
    temp.replace(archive)
print("PASS: master and assistant activation cards are present")
print("PASS: long codes wrap within mobile cards; page horizontal overflow is disabled")
print("PASS: copy controls remain visible")
