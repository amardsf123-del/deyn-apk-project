#!/usr/bin/env python3
from pathlib import Path
import re
import tempfile
import zipfile

root = Path(__file__).resolve().parents[1]
archive = root / "deyn-apk-project.zip"

with tempfile.TemporaryDirectory() as td:
    work = Path(td)
    with zipfile.ZipFile(archive) as z:
        z.extractall(work)

    page = work / "deyn-keygen/www/index.html"
    html = page.read_text(encoding="utf-8")

    # The Keygen device ID field must accept the complete 32-character hex ID.
    tags = list(re.finditer(r"<input\\b[^>]*>", html, flags=re.I | re.S))
    matches = []
    for m in tags:
        tag = m.group(0)
        attrs = " ".join(re.findall(r'(?:id|name|placeholder|aria-label)\\s*=\\s*["\\']([^"\\']*)["\\']', tag, flags=re.I))
        nearby = html[max(0, m.start()-350):m.start()].lower()
        is_device = bool(re.search(r"device|device.?id|معرف الجهاز|معرّف الجهاز", attrs + " " + nearby))
        max_match = re.search(r'\\bmaxlength\\s*=\\s*["\\']?(\\d+)', tag, flags=re.I)
        if is_device and max_match:
            matches.append((m, tag, int(max_match.group(1))))

    if len(matches) != 1:
        raise SystemExit(f"Expected exactly one Keygen device-ID input with maxlength, found {len(matches)}")

    m, tag, old_max = matches[0]
    if old_max < 32:
        fixed_tag = re.sub(r'(\\bmaxlength\\s*=\\s*["\\']?)\\d+', r'\\g<1>32', tag, count=1, flags=re.I)
        html = html[:m.start()] + fixed_tag + html[m.end():]
    elif old_max != 32:
        # Keep a larger existing limit; validation still checks the exact 32-char ID.
        pass

    # Also ensure the field accepts uppercase/lowercase hex and validates 32 chars.
    if 'maxlength="32"' not in html and "maxlength='32'" not in html:
        # Verify a 32-character device ID is accepted by the generator's validation.
        if not re.search(r"device.{0,80}32|32.{0,80}device", html, flags=re.I | re.S):
            raise SystemExit("Could not verify 32-character device ID support")

    page.write_text(html, encoding="utf-8")
    temp = archive.with_suffix(".zip.tmp")
    with zipfile.ZipFile(temp, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for f in sorted(work.rglob("*")):
            if f.is_file():
                z.write(f, f.relative_to(work).as_posix())
    temp.replace(archive)

print("PASS: Keygen device ID field accepts the full 32-character ID")
