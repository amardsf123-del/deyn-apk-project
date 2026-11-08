#!/usr/bin/env python3
"""Fix long activation-code cards in the DEYN web bundle inside deyn-apk-project.zip.

The wrapping div is a flex item with min-width:auto. Its unbroken base64url
child therefore sets a very large min-content width and expands .sheet.
Give both cards explicit layout classes, allow the body/value to shrink and
wrap, and keep the copy control non-shrinking. The raw code and copy handler
are deliberately left untouched.
"""
import re
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "deyn-apk-project.zip"
APP_REL = Path("deyn-app/www/index.html")
MARK = 'id="deyn-code-card-layout"'

CSS = '''<style id="deyn-code-card-layout">
/* Long activation codes: constrain the flex body, wrap the value, preserve the copy control. */
.code-card{cursor:pointer;background:#f0fdf4;border:1.5px dashed var(--em);border-radius:14px;padding:11px 13px;
  display:flex;align-items:center;justify-content:space-between;gap:10px;transition:background .15s;
  width:100%;max-width:100%;min-width:0;box-sizing:border-box}
.code-card__body{flex:1 1 0;min-width:0;max-width:100%}
.code-card .code-card__value{display:block;width:100%;max-width:100%;min-width:0;
  font-size:14px;font-weight:800;color:var(--em);letter-spacing:.05em;
  white-space:normal;overflow-wrap:anywhere;word-break:break-all}
.code-card .code-card__body small{display:block;max-width:100%;font-size:11px;color:var(--mute);margin-top:2px;overflow-wrap:anywhere}
.code-card__btn{flex:none;white-space:nowrap}
</style>'''

CARD_PATTERN = r'''<div data-act="{kind}" style="cursor:pointer;[^"]*" title="اضغط لنسخ الكود">\s*
          <div>\s*
            <b class="num" style="font-size:14px;font-weight:800;color:var\(--em\);letter-spacing:\.05em">(.*?)</b>\s*
            <small style="display:block;font-size:11px;color:var\(--mute\);margin-top:2px">(.*?)</small>\s*
          </div>\s*
          <span class="btn sm" style="([^"]*)">(.*?)</span>\s*
        </div>'''

def patch_card(source: str, kind: str):
    pattern = re.compile(CARD_PATTERN.format(kind=re.escape(kind)), re.S)
    def replace(match):
        return (
            f'<div class="code-card" data-act="{kind}" title="اضغط لنسخ الكود">\\n'
            '          <div class="code-card__body">\\n'
            f'            <b class="num code-card__value">{match.group(1)}</b>\\n'
            f'            <small>{match.group(2)}</small>\\n'
            '          </div>\\n'
            f'          <span class="btn sm code-card__btn" style="{match.group(3)}">{match.group(4)}</span>\\n'
            '        </div>'
        )
    return pattern.subn(replace, source, count=1)

def main():
    if not ARCHIVE.is_file():
        raise SystemExit(f"ERROR: archive not found: {ARCHIVE}")
    with tempfile.TemporaryDirectory() as td:
        work = Path(td)
        with zipfile.ZipFile(ARCHIVE) as zf:
            zf.extractall(work)
        app = work / APP_REL
        if not app.is_file():
            raise SystemExit(f"ERROR: app HTML not found in archive: {APP_REL}")
        source = app.read_text(encoding="utf-8")
        source, old_removed = re.subn(
            r'\\n?<style id="deyn-long-code-layout-fix">.*?</style>\\n?',
            '\\n', source, flags=re.S
        )
        if MARK in source:
            if (source.count('class="code-card" data-act="copyMasterCode"') != 1 or
                source.count('class="code-card" data-act="copyAssistantCode"') != 1):
                raise SystemExit("ERROR: layout marker exists but card markup is incomplete")
            print("PASS: activation code cards already patched")
        else:
            source, n_master = patch_card(source, "copyMasterCode")
            source, n_assistant = patch_card(source, "copyAssistantCode")
            if n_master != 1 or n_assistant != 1:
                raise SystemExit(f"ERROR: expected exactly one card of each type (master={n_master}, assistant={n_assistant}); archive not modified")
            if "</head>" not in source:
                raise SystemExit("ERROR: </head> not found; archive not modified")
            source = source.replace("</head>", CSS + "\\n</head>", 1)
            print(f"PASS: patched master and assistant cards; removed old CSS blocks={old_removed}")
        for required in (
            MARK,
            'class="code-card" data-act="copyMasterCode"',
            'class="code-card" data-act="copyAssistantCode"',
            "overflow-wrap:anywhere",
            ".code-card__body{flex:1 1 0;min-width:0",
            ".code-card__btn{flex:none",
        ):
            if required not in source:
                raise SystemExit(f"ERROR: post-patch verification failed: {required}")
        app.write_text(source, encoding="utf-8", newline="\\n")
        temp_archive = ARCHIVE.with_suffix(".zip.tmp")
        with zipfile.ZipFile(temp_archive, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
            for path in sorted(work.rglob("*")):
                if path.is_file():
                    zf.write(path, path.relative_to(work).as_posix())
        temp_archive.replace(ARCHIVE)
    print("PASS: code value wraps inside its card")
    print("PASS: copy button remains non-shrinking")
    print("PASS: activation code text and copy handler were not modified")

if __name__ == "__main__":
    main()
