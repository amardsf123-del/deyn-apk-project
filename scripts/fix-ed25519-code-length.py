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
        app.write_text(source, encoding="utf-8")
    elif new not in source:
        raise SystemExit("Activation code input changed; refusing unsafe edit")
    if 'maxlength="240"' not in source or 'var DEYN_PUBLIC_KEY' not in source:
        raise SystemExit("Ed25519 activation input validation failed")
    temp = archive.with_suffix(".zip.tmp")
    with zipfile.ZipFile(temp, "w", zipfile.ZIP_DEFLATED, compresslevel=7) as z:
        for f in sorted(work.rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(work).as_posix())
    temp.replace(archive)
print("PASS: activation input accepts the complete DEYN3 signed code")
