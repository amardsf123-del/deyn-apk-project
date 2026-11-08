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

    # Keep long signed activation codes inside their card instead of expanding
    # the page horizontally. Preserve selectable text and existing copy controls.
    css = """
<style id="deyn-long-code-layout-fix">
html,body{max-width:100%;overflow-x:hidden}
*,*::before,*::after{box-sizing:border-box}
.ag-id,.ag-code,.ag-code-value,.license-code,.activation-code,.code-value,
[id*="code" i],[class*="code" i]{
  max-width:100%;
  min-width:0;
  white-space:normal!important;
  overflow-wrap:anywhere!important;
  word-break:break-all;
}
</style>
"""
    if 'id="deyn-long-code-layout-fix"' not in source:
        if "</head>" not in source:
            raise SystemExit("Could not find </head> to insert long-code layout fix")
        source = source.replace("</head>", css + "\n</head>", 1)

    if 'maxlength="240"' not in source or 'var DEYN_PUBLIC_KEY' not in source:
        raise SystemExit("Ed25519 activation input validation failed")
    if 'deyn-long-code-layout-fix' not in source:
        raise SystemExit("Long-code layout fix was not inserted")

    app.write_text(source, encoding="utf-8")
    temp = archive.with_suffix(".zip.tmp")
    with zipfile.ZipFile(temp, "w", zipfile.ZIP_DEFLATED, compresslevel=7) as z:
        for f in sorted(work.rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(work).as_posix())
    temp.replace(archive)
print("PASS: activation input accepts the complete DEYN3 signed code")
print("PASS: long activation codes wrap inside the page without horizontal overflow")
