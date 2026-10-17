"""Playwright walkthrough of the ID step. Pass --submit to send ONE real test (desktop only)."""
import asyncio, sys, json
from playwright.async_api import async_playwright
URL = "https://sittaluvv.github.io/avant-loans-3d/apply/"
SUBMIT = "--submit" in sys.argv
D = "/tmp/idtest/"
async def run(b, vp, w, h, do_submit):
    ctx = await b.new_context(viewport={"width": w, "height": h}); pg = await ctx.new_page()
    errs, posts, res = [], [], {}
    pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("request", lambda r: r.method == "POST" and posts.append(r.url))
    await pg.goto(URL, wait_until="networkidle")
    ov = lambda: pg.evaluate("document.documentElement.scrollWidth - innerWidth")
    async def radios():
        for nm in await pg.evaluate("[...new Set([...document.querySelectorAll('form input[type=radio]')].map(e=>e.name))]"):
            if nm == "loan-type": continue
            if not await pg.locator(f"input[name='{nm}']:checked").count():
                i = await pg.locator(f"input[name='{nm}']").first.get_attribute("id"); await pg.click(f"label[for='{i}']")
    async def fill():
        for el in await pg.locator("form input[required]:visible, form select[required]:visible").all():
            t = await el.get_attribute("type") or ""; tag = await el.evaluate("e=>e.tagName")
            if tag == "SELECT":
                if not await el.input_value():
                    for o in await el.locator("option").all():
                        v = await o.get_attribute("value")
                        if v: await el.select_option(v); break
            elif t in ("radio", "checkbox", "file"): pass
            elif not await el.input_value():
                im = await el.get_attribute("inputmode") or ""
                v = "2" if t == "number" else "50000" if im in ("numeric", "decimal") else {"email": "test@example.com", "tel": "+971500000000", "date": "1990-01-01"}.get(t, "TEST 1")
                await el.fill(v)
    nxt = lambda: pg.click("form button[type=submit]")
    # step 1
    await pg.click("label[for='loan-type-1']"); await pg.fill("#loan-amount", "15000"); await pg.select_option("#loan-duration", index=3)
    await pg.fill("#first-name", "TEST"); await pg.fill("#last-name", "Applicant")
    await radios(); await fill(); await nxt(); await pg.wait_for_timeout(500)
    await radios(); await fill(); await nxt(); await pg.wait_for_timeout(500)
    res["step"] = await pg.locator("li[aria-current=step]").inner_text()
    # step 3 — choose National ID explicitly, then the rest
    await pg.click("label[for='id-type-2']")
    await pg.fill("#id-number", "TEST-0000-0000"); await pg.fill("#id-expiry", "2030-12-31")
    await radios(); await fill()
    await pg.fill("#notes", "TEST submission with FAKE ID images (E2E check). Please ignore.")
    await pg.check("#consent")
    # submit without files -> validation, no network
    n0 = len(posts); await nxt(); await pg.wait_for_timeout(500)
    res["noFileErrors"] = await pg.locator("[data-id-section] ~ div [role=alert], #id-front-error, #id-back-error").all_inner_texts()
    res["postedWithoutFiles"] = len(posts) > n0
    # wrong type
    await pg.set_input_files("#id-front", D + "notes.txt"); await pg.wait_for_timeout(200)
    res["typeError"] = await pg.locator("#id-front-error").inner_text()
    # good files
    await pg.set_input_files("#id-front", D + "TEST-fake-id-front.png")
    await pg.set_input_files("#id-back", D + "TEST-fake-id-back.jpg"); await pg.wait_for_timeout(400)
    res["previews"] = await pg.locator("[data-testid$='-preview'] img").count()
    # remove + re-add back
    await pg.locator("[data-testid='id-back-preview'] button:has-text('Remove')").click()
    res["afterRemove"] = await pg.locator("[data-testid$='-preview']").count()
    await pg.set_input_files("#id-back", D + "TEST-fake-id-back.jpg"); await pg.wait_for_timeout(300)
    # passport makes back optional (label check), then back to National ID
    await pg.click("label[for='id-type-0']"); res["passportBackLabel"] = await pg.locator("text=Back of ID").locator("..").inner_text()
    await pg.click("label[for='id-type-2']")
    res["overflow"] = await ov()
    sec = await pg.evaluate("""() => { const a = document.querySelector('[data-id-section]').getBoundingClientRect();
        const n = [...document.querySelectorAll('p')].find(p => p.textContent.includes('Privacy:')).getBoundingClientRect();
        return {x: 0, y: a.top + scrollY - 12, width: innerWidth, height: n.bottom - a.top + 28} }""")
    await pg.screenshot(path=f"/workspace/avant-3d-shots/id_step_{vp}.png", clip=sec, full_page=True)
    if do_submit:
        async with pg.expect_response(lambda r: "workers.dev" in r.url and r.request.method == "POST", timeout=60000) as ri:
            await nxt()
        r = await ri.value
        res["worker"] = (r.status, await r.text())
        await pg.wait_for_timeout(1500)
        res["successUI"] = await pg.locator("[role=status] h2").inner_text()
    res["posts"] = posts; res["errors"] = errs
    print(vp, json.dumps(res, ensure_ascii=False)); await ctx.close()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome",
            args=["--no-sandbox", "--host-resolver-rules=MAP avant-loans-telegram.sittaluvv.workers.dev 172.67.152.254"])
        await run(b, "phone", 390, 844, False)
        await run(b, "desktop", 1440, 900, SUBMIT)
        await b.close()
asyncio.run(main())
