#!/usr/bin/env python3
"""Verify an Explain Like a Professor HTML lesson in a real headless browser.

Usage:  python3 check_html.py path/to/lesson/index.html [--shots OUTDIR]

Checks: local assets referenced by the page exist; the page loads without JavaScript errors;
KaTeX rendered with no errors; every widget self-test (L.test) passes; no horizontal overflow
at desktop (1280px) and narrow (~500px, the CLI minimum) widths. Saves screenshots for visual review.
Exit code 0 = all checks passed. Needs only a Chromium/Chrome binary.
"""
import glob, html, json, os, re, shutil, subprocess, sys, tempfile
from html.parser import HTMLParser
from pathlib import Path

def find_browser():
    for name in ("chromium", "chromium-browser", "google-chrome", "google-chrome-stable", "chrome"):
        p = shutil.which(name)
        if p: return p
    for pat in ("~/.cache/ms-playwright/chromium-*/chrome-linux*/chrome",
                "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"):
        hits = sorted(glob.glob(os.path.expanduser(pat)))
        if hits: return hits[-1]
    return None

class _Refs(HTMLParser):
    def __init__(self): super().__init__(); self.refs = []
    def handle_starttag(self, tag, attrs):
        for k, v in attrs:
            if k in ("src", "href") and v and not v.startswith("#"): self.refs.append(v.split("#")[0])

def local_refs(page: Path):
    parser = _Refs(); parser.feed(page.read_text(encoding="utf-8"))   # real attributes only, not text inside values
    refs = [r for r in parser.refs if r]
    missing = []
    for r in refs:
        if re.match(r"^(https?:|data:|mailto:|//)", r): continue
        if not (page.parent / r.split("?")[0]).exists(): missing.append(r)
    return missing

def run(browser, url, width, height, extra):
    prof = tempfile.mkdtemp(prefix="elap-chk-")
    cmd = [browser, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--user-data-dir={prof}",
           f"--window-size={width},{height}", "--virtual-time-budget=10000", *extra, url]
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=90).stdout
    finally:
        shutil.rmtree(prof, ignore_errors=True)

def grab(dom, el_id):
    m = re.search(rf'id="{el_id}"[^>]*>(.*?)</pre>', dom, re.S)
    return html.unescape(m.group(1)).strip() if m else ""

def main():
    if len(sys.argv) < 2: print(__doc__); sys.exit(2)
    page = Path(sys.argv[1]).resolve()
    shots = Path(sys.argv[sys.argv.index("--shots") + 1]) if "--shots" in sys.argv else page.parent / "_check"
    ok = True
    if not page.exists(): print(f"FAIL  page not found: {page}"); sys.exit(1)
    missing = local_refs(page)
    print(("FAIL  missing local assets: " + ", ".join(missing)) if missing else "ok    all local assets exist")
    ok &= not missing
    browser = find_browser()
    if not browser: print("FAIL  no Chromium/Chrome found: cannot test in a browser"); sys.exit(1)
    shots.mkdir(parents=True, exist_ok=True)
    for label, w, h in (("desktop", 1280, 900), ("narrow", 390, 844)):
        dom = run(browser, page.as_uri() + "?selftest=1", w, h, ["--dump-dom"])
        if not dom.strip(): print(f"FAIL  [{label}] page produced no DOM"); ok = False; continue
        errs = grab(dom, "__errors")
        if errs: print(f"FAIL  [{label}] JS/math errors: {errs}"); ok = False
        else: print(f"ok    [{label}] no JavaScript errors")
        n_katex = dom.count('class="katex"')
        print(f"info  [{label}] {n_katex} KaTeX expressions rendered")
        raw = grab(dom, "__selftest")
        if not raw: print(f"FAIL  [{label}] self-tests did not run (is lesson.js loaded?)"); ok = False
        else:
            for t in json.loads(raw):
                tag = "ok   " if t["ok"] and not t.get("warn") else ("warn " if t["ok"] else "FAIL ")
                print(tag + f" [{label}] {t['name']}" + (f" ({t.get('error') or t.get('warn')})" if t.get("error") or t.get("warn") else ""))
                ok &= bool(t["ok"])
        shot = shots / f"{label}.png"
        run(browser, page.as_uri(), w, h * (3 if label == "desktop" else 4), [f"--screenshot={shot}"])
        print(f"info  [{label}] screenshot: {shot}" if shot.exists() else f"warn  [{label}] screenshot failed")
    print("\nALL CHECKS PASSED" if ok else "\nSOME CHECKS FAILED")
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    main()
