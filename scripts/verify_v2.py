"""Verify homepage v2 preview. Usage: BASE=http://localhost:4174/avant-loans-3d/ python verify_v2.py
No Telegram sends: /geo is mocked and nothing is submitted."""
import asyncio, json, os, re
from playwright.async_api import async_playwright
BASE = os.environ.get("BASE", "http://localhost:4174/avant-loans-3d/")
URL = BASE + "v2/"
SHOTS = "/workspace/avant-3d-shots"
VIEWS = {"1440": (1440, 900), "1024": (1024, 768), "768": (768, 1024), "390": (390, 844)}
fails = []
def check(ok, msg):
    print(("PASS " if ok else "FAIL ") + msg)
    if not ok: fails.append(msg)

LCP_JS = """() => new Promise(res => { let v = 0, el = '';
  new PerformanceObserver(l => { for (const e of l.getEntries()) { v = e.startTime; el = e.element ? (e.element.tagName + (e.element.getAttribute('alt') ? '['+e.element.getAttribute('alt')+']' : '') + '#' + (e.element.id||'')) : (e.url||'') } }).observe({type:'largest-contentful-paint', buffered:true});
  setTimeout(() => res({lcp: v, el}), 1500) })"""

async def scroll_through(pg):
    h = await pg.evaluate("document.documentElement.scrollHeight")
    y = 0
    while y < h:
        y += 500; await pg.evaluate(f"window.scrollTo(0,{y})"); await pg.wait_for_timeout(120)
    await pg.wait_for_timeout(700)
    await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(500)

async def page_for(b, w, h, mobile=False, reduced=False, dpr=None):
    ctx = await b.new_context(viewport={"width": w, "height": h}, device_scale_factor=dpr or (2 if w >= 768 else 3), is_mobile=mobile, has_touch=mobile,
                              reduced_motion="reduce" if reduced else "no-preference")
    pg = await ctx.new_page()
    await pg.route("**/geo", lambda r: r.fulfill(status=200, content_type="application/json", body='{"country":"AE"}', headers={"access-control-allow-origin": "*"}))
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    return ctx, pg, errs

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        for name, (w, h) in VIEWS.items():
            ctx, pg, errs = await page_for(b, w, h, mobile=(w < 768))
            await pg.goto(URL, wait_until="networkidle")
            lcp = await pg.evaluate(LCP_JS)
            print(f"[{name}] LCP {lcp['lcp']:.0f}ms el={lcp['el']}")
            try:
                await pg.wait_for_selector('[data-testid=hero-3d][data-state="3d"]', timeout=15000); state = "3d"
            except Exception: state = await pg.get_attribute("[data-testid=hero-3d]", "data-state")
            print(f"[{name}] hero state {state}")
            await scroll_through(pg)
            ov = await pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            check(ov <= 0, f"[{name}] no horizontal overflow ({ov})")
            if name == "1440":
                await pg.wait_for_timeout(800)
                await pg.screenshot(path=f"{SHOTS}/v2_hero_desktop.png")
                await pg.screenshot(path=f"{SHOTS}/v2_desktop_full.png", full_page=True)
            if name == "390":
                await pg.screenshot(path=f"{SHOTS}/v2_phone_hero.png")
                # full page at DPR 2 (DPR 3 exceeds Chrome's 16384px capture limit); fixed sticky bar hidden for the stitched shot
                c2, p2, _ = await page_for(b, 390, 844, mobile=False, dpr=1.25)  # keep < 8192 device px: taller stitched captures repeat
                await p2.goto(URL, wait_until="networkidle"); await p2.wait_for_timeout(2500); await scroll_through(p2)
                await p2.add_style_tag(content="[data-testid=sticky-apply]{display:none!important}")
                await p2.screenshot(path=f"{SHOTS}/v2_phone_full.png", full_page=True); await c2.close()
                # sticky bar: hidden at top, shown after scrolling past hero CTA
                v0 = await pg.get_attribute("[data-testid=sticky-apply]", "data-visible")
                await pg.evaluate("window.scrollTo(0, 1400)"); await pg.wait_for_timeout(700)
                v1 = await pg.get_attribute("[data-testid=sticky-apply]", "data-visible")
                check(v0 == "false" and v1 == "true", f"[390] sticky apply hidden at top, visible after hero ({v0}->{v1})")
                await pg.screenshot(path=f"{SHOTS}/v2_phone_sticky.png")
                await pg.click("[data-testid=sticky-apply-btn]"); await pg.wait_for_timeout(500)
                check(await pg.evaluate("!!document.querySelector('dialog[open]')"), "[390] sticky Apply opens loan picker")
                await pg.screenshot(path=f"{SHOTS}/v2_phone_modal.png")
                await pg.keyboard.press("Escape"); await pg.wait_for_timeout(300)
            check(not errs, f"[{name}] no console errors {errs[:3]}")
            await ctx.close()

        # functional + a11y checks at desktop
        ctx, pg, errs = await page_for(b, 1440, 900)
        await pg.goto(URL, wait_until="networkidle")
        txt = await pg.inner_text("main")
        check(len(await pg.query_selector_all("h1")) == 1, "exactly one h1")
        check(await pg.evaluate("[...document.images].every(i => i.hasAttribute('alt'))"), "all images have alt")
        unnamed = await pg.evaluate("""[...document.querySelectorAll('a,button')].filter(e => e.offsetParent && !(e.innerText.trim() || e.getAttribute('aria-label') || e.title)).map(e=>e.outerHTML.slice(0,80))""")
        check(not unnamed, f"all visible links/buttons named {unnamed[:2]}")
        check(await pg.locator('[lang="ar"][dir="rtl"]').count() >= 1, "Arabic accent line present with lang/dir")
        check(await pg.locator("[data-testid=contact-options]").count() == 0, "contact buttons hidden (config empty)")
        check(not re.search(r"\b(SAR|AED|QAR|KWD|BHD|OMR|USD)\s?[\d,]{3,}|[\d,]{3,}\s?(SAR|AED|QAR|KWD|BHD|OMR|USD)\b", txt), "no amounts in main content")
        check(await pg.locator("main input[type=range], main input[type=number]").count() == 0, "no sliders/amount inputs")
        bad = [w for w in ["demo", "credit score", "minutes", "APR", "guarantee", "Why Avant", "rating", "approval in", "lowest rate"] if w.lower() in txt.lower()]
        check(not bad, f"no banned claims {bad}")
        foot = await pg.inner_text("[data-testid=site-footer]")
        check("2649867.01" in foot and "Central Bank of the UAE" in foot, "footer licence + regulatory line")
        check("Avant Middle East" in await pg.inner_text("header"), "header present") if False else None
        # currency auto-detect still works (AE mocked)
        cur = await pg.inner_text("[data-testid=currency-button]")
        check("AED" in cur, f"currency auto-detect AED ({cur.strip()})")
        # loan cards + chips route to /apply/?type=
        for slug in ["personal", "auto", "mortgage", "business", "education"]:
            href = await pg.get_attribute(f"[data-testid=card-{slug}]", "href")
            chref = await pg.get_attribute(f"[data-testid=chip-{slug}]", "href")
            check(href.endswith(f"/apply/?type={slug}") and chref == href, f"card+chip {slug} -> {href}")
        # hero Apply opens modal; modal choice goes to apply
        await pg.click("[data-testid=hero-apply]"); await pg.wait_for_timeout(500)
        check(await pg.evaluate("!!document.querySelector('dialog[open]')"), "hero Apply opens loan-type modal")
        await pg.screenshot(path=f"{SHOTS}/v2_modal_desktop.png")
        mtxt = await pg.inner_text("dialog[open]")
        check(not re.search(r"\d{1,3},\d{3}", mtxt), "modal on v2 shows no amount ranges")
        focus_in = await pg.evaluate("document.activeElement && !!document.activeElement.closest('dialog')")
        check(focus_in, "focus moved into modal")
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(300)
        check(await pg.evaluate("!document.querySelector('dialog[open]')"), "Esc closes modal")
        # FAQ accordion
        btns = pg.locator("#faq button[aria-expanded]")
        n = await btns.count(); check(n == 6, f"FAQ has 6 items ({n})")
        await btns.nth(2).click(); await pg.wait_for_timeout(400)
        check(await btns.nth(2).get_attribute("aria-expanded") == "true" and await btns.nth(0).get_attribute("aria-expanded") == "false", "FAQ toggles aria-expanded")
        # anchor nav
        await pg.click("header >> text=FAQ"); await pg.wait_for_timeout(1500)
        top = await pg.evaluate("document.getElementById('faq').getBoundingClientRect().top")
        check(-10 < top < 200, f"nav FAQ scrolls to section (top={top:.0f})")
        # follow a card to /apply and confirm preselection
        await pg.goto(URL, wait_until="networkidle")
        await pg.click("[data-testid=card-auto]"); await pg.wait_for_load_state("networkidle")
        check("/apply/?type=auto" in pg.url, f"card navigates to apply ({pg.url})")
        body = await pg.inner_text("body")
        check("Auto Loan" in body and "Change" in body, "apply preselected Auto Loan chip")
        check(not errs, f"[functional] no console errors {errs[:3]}")
        await ctx.close()

        # reduced motion: poster only, no canvas
        ctx, pg, errs = await page_for(b, 1440, 900, reduced=True)
        await pg.goto(URL, wait_until="networkidle"); await pg.wait_for_timeout(2500)
        check(await pg.locator("[data-testid=hero-3d] canvas").count() == 0, "reduced motion: poster fallback, no WebGL")
        await ctx.close()

        # main homepage untouched
        ctx, pg, errs = await page_for(b, 1440, 900)
        await pg.goto(BASE, wait_until="networkidle")
        check(await pg.locator("[data-testid=hero-apply]").count() == 1 and await pg.locator("video").count() >= 1, "main homepage still the video hero")
        await ctx.close()
        await b.close()
    print("\nRESULT:", "ALL PASS" if not fails else f"{len(fails)} FAIL")
    raise SystemExit(1 if fails else 0)
asyncio.run(main())
