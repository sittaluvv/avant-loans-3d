import sys, asyncio
from playwright.async_api import async_playwright
URL = sys.argv[1]; TAG = sys.argv[2] if len(sys.argv) > 2 else ""
async def run(p, w, h, name):
    b = await p.chromium.launch(args=["--host-resolver-rules=MAP avant-loans-telegram.sittaluvv.workers.dev 172.67.152.254"])
    pg = await b.new_page(viewport={"width": w, "height": h})
    errs, posts = [], []
    pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("request", lambda r: r.method == "POST" and posts.append(r.url))
    await pg.goto(URL, wait_until="networkidle")
    ov = lambda: pg.evaluate("document.documentElement.scrollWidth - innerWidth")
    res = {"overflow": [await ov()]}
    res["bg"] = await pg.evaluate("getComputedStyle(document.querySelector('div.min-h-svh')).backgroundImage.slice(0,60)")
    res["homeLink"] = await pg.locator("header a:has-text('Back to home')").count()
    # step 1
    for sel, v in [("#first-name","Test"),("#last-name","Walkthrough"),("#email","test@example.com"),("#phone","+971500000000")]:
        if await pg.locator(sel).count(): await pg.fill(sel, v)
    # fill remaining required step1 fields generically
    async def fill_required():
        for el in await pg.locator("form input[required]:visible, form select[required]:visible, form textarea[required]:visible").all():
            t = await el.get_attribute("type") or ""; tag = await el.evaluate("e=>e.tagName")
            if tag == "SELECT":
                if not await el.input_value():
                    opts = await el.locator("option").all()
                    for o in opts:
                        v = await o.get_attribute("value")
                        if v: await el.select_option(v); break
            elif t in ("radio",):
                nm = await el.get_attribute("name")
                if not await pg.locator(f"input[name='{nm}']:checked").count():
                    i = await el.get_attribute("id"); await pg.click(f"label[for='{i}']")
            elif t == "checkbox": pass
            elif not await el.input_value() and (await el.get_attribute("inputmode") or "") in ("numeric","decimal"):
                await el.fill("2" if t == "number" else "50000")
            elif not await el.input_value():
                await el.fill({"email":"test@example.com","tel":"+971500000000","date":"1990-01-01","number":"2"}.get(t,"Test 123"))
    async def required_radios():
        names = await pg.evaluate("[...new Set([...document.querySelectorAll('form input[type=radio]')].map(e=>e.name))]")
        for nm in names:
            if nm == "loan-type": continue
            if not await pg.locator(f"input[name='{nm}']:checked").count():
                i = await pg.locator(f"input[name='{nm}']").first.get_attribute("id")
                if i: await pg.click(f"label[for='{i}']")
    await pg.click("label[for='loan-type-1']"); await pg.wait_for_timeout(300)
    res["selBorder"] = await pg.evaluate("getComputedStyle(document.querySelector(\"label[for='loan-type-1']\")).borderColor")
    res["icons"] = await pg.locator("label[for^='loan-type-'] img").count()
    await pg.fill("#loan-amount", "15000")
    await pg.select_option("#loan-duration", index=3)
    await required_radios(); await fill_required()
    res["overflow"].append(await ov())
    await pg.locator("label[for='loan-type-0']").scroll_into_view_if_needed(); await pg.wait_for_timeout(400)
    await pg.screenshot(path=f"/workspace/avant-3d-shots/apply_match_{name}.png", full_page=False)
    await pg.click("form button[type=submit]"); await pg.wait_for_timeout(600)
    res["step2"] = await pg.locator("li[aria-current=step]").inner_text(); res["overflow"].append(await ov())
    await pg.screenshot(path=f"/workspace/avant-3d-shots/apply_match_{name}_step2_full.png", full_page=True)
    await required_radios(); await fill_required()
    await pg.screenshot(path=f"/tmp/{name}_s2filled.png", full_page=True)
    res["invalid2"] = await pg.evaluate("[...document.querySelectorAll('form [aria-invalid=true], form :invalid')].map(e=>e.id||e.name)")
    await pg.click("form button[type=submit]"); await pg.wait_for_timeout(600)
    res["step3"] = await pg.locator("li[aria-current=step]").inner_text()
    await required_radios(); await fill_required()
    res["overflow"].append(await ov())
    res["step3Current"] = await pg.locator("li[aria-current=step]").inner_text()
    await pg.screenshot(path=f"/workspace/avant-3d-shots/apply_match_{name}_step3_full.png", full_page=True)
    res["submitVisible"] = await pg.locator("form button[type=submit]").is_visible()
    res["errors"] = errs; res["posts"] = posts
    print(name, res); await b.close()
async def main():
    async with async_playwright() as p:
        await run(p, 1440, 900, "desktop"); await run(p, 390, 844, "phone")
asyncio.run(main())
