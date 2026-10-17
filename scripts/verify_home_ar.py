"""Arabic line on homepage Apply buttons (/ and /v2/): presence, header/sticky height, overflow, console errors, screenshots.
Usage: BASE=... python verify_home_ar.py   (BASELINE=<url> optionally compares header height)"""
import asyncio, os, re
from playwright.async_api import async_playwright
BASE = os.environ.get("BASE", "http://localhost:4174/avant-loans-3d/")
BASELINE = os.environ.get("BASELINE")
SHOTS = "/workspace/avant-3d-shots"
AR = re.compile(r"[\u0600-\u06FF]")
fails = []
def check(ok, msg):
    print(("PASS " if ok else "FAIL ") + msg)
    if not ok: fails.append(msg)

async def page(b, w, h, url):
    c = await b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2, is_mobile=w < 600, has_touch=w < 600)
    pg = await c.new_page(); errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.route("**/geo", lambda r: r.fulfill(status=200, content_type="application/json", body='{"country":"AE"}', headers={"access-control-allow-origin": "*"}))
    await pg.goto(url, wait_until="networkidle"); await pg.wait_for_timeout(900)
    return c, pg, errs

HDR = "Math.round(document.querySelector('header').getBoundingClientRect().height)"

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        for path, name in [("", "home"), ("v2/", "v2")]:
            for w, h in [(1440, 900), (1024, 768), (390, 844)]:
                c, pg, errs = await page(b, w, h, BASE + path)
                tag = f"{name} {w}"
                btns = ["[data-testid=header-apply]", "[data-testid=hero-apply]", "[data-testid=cta-apply]"] + (["[data-testid=sticky-apply-btn]"] if name == "v2" else ["[data-testid=card-personal]"])
                if w < 640: btns.remove("[data-testid=header-apply]")  # single-line on phone by design
                for s in btns:
                    t = await pg.locator(s).first.text_content()
                    check(bool(AR.search(t or "")), f"[{tag}] Arabic on {s}: {' '.join((t or '').split())[:40]}")
                # nothing else on the page got Arabic (except v2's hero accent line + the closed modal)
                extra = await pg.evaluate("""[...document.querySelectorAll('[lang=ar]')].filter(e => !e.closest('dialog') && !e.closest('a') && !e.closest('button')).map(e => e.textContent)""")
                allowed = ["تمويل شخصي بخطوات بسيطة"] if name == "v2" else []
                check([x for x in extra if x not in allowed] == [], f"[{tag}] no Arabic outside Apply buttons {extra}")
                nonapply = await pg.evaluate("""[...document.querySelectorAll('a [lang=ar], button [lang=ar]')].filter(e => !e.closest('dialog')).map(e => e.closest('a,button')).filter(a => !/Apply/.test(a.textContent)).map(a => a.textContent.trim().slice(0,30))""")
                check(not nonapply, f"[{tag}] Arabic only inside Apply buttons {nonapply}")
                hh = await pg.evaluate(HDR)
                if BASELINE:
                    c0, p0, _ = await page(b, w, h, BASELINE + path); h0 = await p0.evaluate(HDR); await c0.close()
                    check(hh - h0 <= 6, f"[{tag}] header height {h0}px -> {hh}px")
                else: print(f"[{tag}] header {hh}px")
                ov = await pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                check(ov <= 0, f"[{tag}] no horizontal overflow ({ov})")
                # header Apply text not wrapped/clipped
                fit = await pg.evaluate("(() => { const a = document.querySelector('[data-testid=header-apply]'); return a.scrollWidth <= a.clientWidth + 1 })()")
                check(fit, f"[{tag}] header Apply fits")
                if name == "home" and w == 1440: await pg.screenshot(path=f"{SHOTS}/home_ar_hero.png")
                if name == "v2" and w == 1440: await pg.screenshot(path=f"{SHOTS}/v2_ar_hero.png")
                if name == "home" and w == 390: await pg.screenshot(path=f"{SHOTS}/home_ar_phone.png")
                if name == "v2" and w == 390:
                    await pg.evaluate("window.scrollTo(0, 1400)"); await pg.wait_for_timeout(800)
                    sh = await pg.evaluate("Math.round(document.querySelector('[data-testid=sticky-apply]').getBoundingClientRect().height)")
                    check(sh <= 76 and await pg.get_attribute("[data-testid=sticky-apply]", "data-visible") == "true", f"[{tag}] sticky bar visible, height {sh}px")
                    await pg.screenshot(path=f"{SHOTS}/v2_ar_phone.png")
                    await pg.click("[data-testid=sticky-apply-btn]"); await pg.wait_for_timeout(500)
                    check(await pg.evaluate("!!document.querySelector('dialog[open]')"), f"[{tag}] sticky Apply still opens picker")
                if w == 1440:
                    await pg.evaluate("window.scrollTo(0,0)"); await pg.click("[data-testid=hero-apply]"); await pg.wait_for_timeout(500)
                    check(await pg.evaluate("!!document.querySelector('dialog[open]')"), f"[{tag}] hero Apply still opens picker")
                check(not errs, f"[{tag}] no console errors {errs[:2]}")
                await c.close()
        await b.close()
    print("\nRESULT:", "ALL PASS" if not fails else f"{len(fails)} FAIL")
    raise SystemExit(1 if fails else 0)
asyncio.run(main())
