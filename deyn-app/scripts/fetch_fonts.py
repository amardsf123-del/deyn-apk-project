#!/usr/bin/env python3
"""ينزّل خطوط Alexandria و Plus Jakarta Sans محلياً ليشتغل التطبيق بنفس الشكل بدون انترنت.
شغّله مرة واحدة وأنت متصل:  python3 scripts/fetch_fonts.py"""
import re, os, urllib.request
CSS_URL = "https://fonts.googleapis.com/css2?family=Alexandria:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36"
out = os.path.join(os.path.dirname(__file__), "..", "www", "fonts")
os.makedirs(out, exist_ok=True)
css = urllib.request.urlopen(urllib.request.Request(CSS_URL, headers={"User-Agent": UA})).read().decode()
n = 0
def grab(m):
    global n
    n += 1; name = f"f{n}.woff2"
    open(os.path.join(out, name), "wb").write(urllib.request.urlopen(m.group(1)).read())
    return f"url({name})"
open(os.path.join(out, "fonts.css"), "w", encoding="utf-8").write(re.sub(r"url\((https://[^)]+)\)", grab, css))
print(f"✔ تم تنزيل {n} ملف خط إلى www/fonts")
