"""Loan-type routing check: homepage cards -> /apply/?type=, generic Apply -> picker modal, direct /apply/ requires a choice, Change works.
Usage: BASE=https://sittaluvv.github.io/avant-loans-3d/ python verify_loan_routing.py"""
import asyncio, json, os
from playwright.async_api import async_playwright
BASE = os.environ.get("BASE", "http://localhost:4173/avant-loans-3d/")
SHOTS = "/workspace/avant-3d-shots"
VIEWS = {"desktop": {"width": 1440, "height": 900}, "phone": {"width": 390, "height": 844}}
LABEL = {"personal": "Personal Loan", "auto": "Auto Loan", "mortgage": "Mortgage", "business": "Business Loan", "education": "Education Loan"}
R = {}

async def new_ctx(b, view):
    c = await b.new_context(viewport=VIEWS[view], device_scale_factor=2 if view == "phone" else 1, is_mobile=view == "phone", has_touch=view == "phone")
    await c.route("**/geo", lambda r: r.fulfill(status=200, content_type="application/json", headers={"Access-Control-Allow-Origin": "*"}, body='{"country":"SA"}'))
    return c

async def run(b, view):
    c = await new_ctx(b, view); pg = await c.new_page(); errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None); pg.on("pageerror", lambda e: errs.append(str(e)))
    ovf = lambda: pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    out = {"cards": {}}
    for slug in LABEL:
        await pg.goto(BASE, wait_until="networkidle")
        await pg.locator(f"[data-testid=card-{slug}]").click(); await pg.wait_for_url(f"**/apply/?type={slug}"); await pg.wait_for_timeout(500)
        chip = await pg.locator("[data-testid=loan-type-chip]").inner_text() if await pg.locator("[data-testid=loan-type-chip]").count() else None
        out["cards"][slug] = {"url_ok": pg.url.endswith(f"?type={slug}"), "chip": (chip or "").replace("\n", " "), "chip_ok": bool(chip) and LABEL[slug] in chip,
                              "selector_hidden": await pg.locator("#loan-type-0").count() == 0, "amount_hint": await pg.locator("#loan-amount-hint").inner_text()}
        if slug == "personal" and view == "desktop":
            await pg.screenshot(path=f"{SHOTS}/apply_preselected.png")
    out["apply_overflow"] = await ovf()
    # Change works
    await pg.locator("[data-testid=loan-type-change]").click(); await pg.wait_for_timeout(300)
    selector_back = await pg.locator("#loan-type-0").count() == 1
    await pg.click("label[for=loan-type-0]"); await pg.wait_for_timeout(400)   # Mortgage
    chip2 = await pg.locator("[data-testid=loan-type-chip]").inner_text()
    out["change"] = {"selector_reopened": selector_back, "chip_after": chip2.replace("\n", " "), "url": pg.url.split("/")[-1], "hint": await pg.locator("#loan-amount-hint").inner_text(),
                     "range_hint": await pg.locator("label[for=loan-amount] + p, #g-loan-amount").first.inner_text() if await pg.locator("label[for=loan-amount] + p").count() else None}
    # invalid type -> normal behaviour
    await pg.goto(BASE + "apply/?type=yacht", wait_until="networkidle"); await pg.wait_for_timeout(300)
    out["invalid_type_shows_selector"] = await pg.locator("#loan-type-0").count() == 1 and await pg.locator("[data-testid=loan-type-chip]").count() == 0
    # direct /apply/: must choose
    await pg.goto(BASE + "apply/", wait_until="networkidle"); await pg.wait_for_timeout(300)
    prompt = "Choose a loan type to continue" in await pg.locator("body").inner_text()
    await pg.click("button[type=submit]"); await pg.wait_for_timeout(500)
    out["direct"] = {"selector_shown": await pg.locator("#loan-type-0").count() == 1, "prompt": prompt,
                     "error_after_continue": await pg.locator("#loan-type-error").count() == 1, "still_step1": await pg.locator("#first-name").count() == 1}
    # Hero Apply -> modal
    await pg.goto(BASE, wait_until="networkidle"); await pg.wait_for_timeout(500)
    await pg.locator("[data-testid=hero-apply]").click(); await pg.wait_for_timeout(500)
    opened = await pg.evaluate("document.querySelector('[data-testid=loan-picker]').open")
    focus_in = await pg.evaluate("document.querySelector('[data-testid=loan-picker]').contains(document.activeElement)")
    for _ in range(8): await pg.keyboard.press("Tab")
    focus_trapped = await pg.evaluate("document.querySelector('[data-testid=loan-picker]').contains(document.activeElement) || document.activeElement === document.body")
    await pg.wait_for_timeout(200); await pg.screenshot(path=f"{SHOTS}/loan_modal_{view}.png")
    modal_ovf = await ovf()
    await pg.keyboard.press("Escape"); await pg.wait_for_timeout(300)
    esc_closed = not await pg.evaluate("document.querySelector('[data-testid=loan-picker]').open")
    # CTA panel + header Apply also open the modal; close button works
    await pg.locator("[data-testid=cta-apply]").click(); await pg.wait_for_timeout(400)
    cta_opens = await pg.evaluate("document.querySelector('[data-testid=loan-picker]').open")
    await pg.locator("[data-testid=loan-picker] button[aria-label=Close]").click(); await pg.wait_for_timeout(300)
    close_btn = not await pg.evaluate("document.querySelector('[data-testid=loan-picker]').open")
    await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(300)
    await pg.locator("[data-testid=header-apply]").click(); await pg.wait_for_timeout(400)
    header_opens = await pg.evaluate("document.querySelector('[data-testid=loan-picker]').open")
    await pg.locator("[data-testid=loan-picker] a[data-slug=business]").click(); await pg.wait_for_url("**/apply/?type=business"); await pg.wait_for_timeout(500)
    picked_chip = await pg.locator("[data-testid=loan-type-chip]").inner_text()
    out["modal"] = {"hero_opens": opened, "focus_moves_in": focus_in, "focus_stays_in_after_8_tabs": focus_trapped, "esc_closes": esc_closed, "cta_opens": cta_opens,
                    "close_button": close_btn, "header_opens": header_opens, "pick_business_lands": pg.url.split("/")[-1], "chip": picked_chip.replace("\n", " "), "overflow_open": modal_ovf}
    out["errors"] = errs
    R[view] = out; await c.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        for v in VIEWS: await run(b, v)
        await b.close()
    print(json.dumps(R, indent=1, ensure_ascii=False))
asyncio.run(main())
