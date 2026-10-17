"""Loan duration input (both /apply/ and /apply-v2/): per loan type chips, typed values, unit switching, out-of-range and
whole-number handling, steppers, Arabic. Country combobox with SVG flags: keyboard-only selection, type-to-search,
Esc, validation focus, /geo preselect, currency picker flags. 1440 and 390, no overflow / console errors.
Usage: BASE=... python verify_duration_country.py"""
import asyncio, os, re
from playwright.async_api import async_playwright
BASE = os.environ.get("BASE", "http://localhost:4174/avant-loans-3d/")
SHOTS = "/workspace/avant-3d-shots"
ARABIC = re.compile(r"[\u0600-\u06FF]")
fails = []
def check(ok, msg):
    print(("PASS " if ok else "FAIL ") + msg)
    if not ok: fails.append(msg)

TYPES = {
    "personal": dict(unit="months", lo=6, hi=60, ylo=1, yhi=5, chips=[12, 24, 36, 48, 60], default=36),
    "auto": dict(unit="years", lo=12, hi=84, ylo=1, yhi=7, chips=[1, 2, 3, 4, 5, 6, 7], default=4),
    "mortgage": dict(unit="years", lo=60, hi=300, ylo=5, yhi=25, chips=[5, 10, 15, 20, 25], default=20),
    "business": dict(unit="years", lo=6, hi=120, ylo=1, yhi=10, chips=[1, 2, 3, 4, 5], default=3),
    "education": dict(unit="years", lo=6, hi=120, ylo=1, yhi=10, chips=[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], default=3),
}
def pl(n, w): return f"{n:g} {w}{'' if n == 1 else 's'}"
def readout(m): return f"{pl(m, 'month')} · {pl(round(m / 12, 1), 'year')}" if m >= 12 else pl(m, "month")
ROUTES = {"apply": ("apply/", "button[type=submit]"), "apply-v2": ("apply-v2/", "[data-testid=next-btn]")}

async def page(b, w, h, geo="SA"):
    c = await b.new_context(viewport={"width": w, "height": h}, device_scale_factor=1, is_mobile=w < 600, has_touch=w < 600)
    pg = await c.new_page(); errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None); pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.route("**/geo", lambda r: r.fulfill(status=200, content_type="application/json", body='{"country":"%s"}' % geo, headers={"access-control-allow-origin": "*"}))
    await pg.route("https://avant-loans-telegram.sittaluvv.workers.dev/", lambda r: r.fulfill(status=200, content_type="application/json", headers={"Access-Control-Allow-Origin": "*"}, body='{"ok":true}') if r.request.method == "POST" else r.continue_())
    return c, pg, errs

async def val(pg): return await pg.input_value("#loan-duration")
async def unit(pg): return await pg.evaluate("document.querySelector('input[name=duration-unit]:checked')?.value")
async def ro(pg): return (await pg.locator("[data-testid=duration-readout]").inner_text()).splitlines()[0] if await pg.locator("[data-testid=duration-readout]").count() else ""
async def set_unit(pg, u): await pg.click(f"[data-testid=duration-unit-{u}]"); await pg.wait_for_timeout(120)
async def fill(pg, v): await pg.fill("#loan-duration", v); await pg.wait_for_timeout(80)
async def err_after_next(pg, nxt):
    await pg.click(nxt); await pg.wait_for_timeout(350)
    e = await pg.locator("#loan-duration-error").count() and await pg.inner_text("#loan-duration-error")
    inv = await pg.get_attribute("#loan-duration", "aria-invalid")
    foc = await pg.evaluate("document.activeElement?.id")
    return e or "", inv == "true", foc == "loan-duration"

async def duration(b, route, w, h):
    path, nxt = ROUTES[route]
    for slug, T in TYPES.items():
        tag = f"{route} {w} {slug}"
        c, pg, errs = await page(b, w, h)
        await pg.goto(BASE + path + f"?type={slug}", wait_until="networkidle"); await pg.wait_for_timeout(500)
        m0 = T["default"] * (12 if T["unit"] == "years" else 1)
        check(await val(pg) == str(T["default"]) and await unit(pg) == T["unit"] and await ro(pg) == readout(m0), f"[{tag}] default {T['default']} {T['unit']} · read-out '{await ro(pg)}'")
        help_ = await pg.inner_text("#loan-duration-help")
        lo, hi = (T["lo"], T["hi"]) if T["unit"] == "months" else (T["ylo"], T["yhi"])
        check(f"Allowed: {lo}–{hi} {T['unit']}" in help_ and ARABIC.search(help_), f"[{tag}] helper '{help_.splitlines()[0]}' + Arabic")
        chips = await pg.locator("[data-testid^=duration-chip-]").count()
        last = T["chips"][-1]
        await pg.click(f"[data-testid=duration-chip-{last}]")
        mlast = last * (12 if T["unit"] == "years" else 1)
        check(chips == len(T["chips"]) and await val(pg) == str(last) and await pg.get_attribute(f"[data-testid=duration-chip-{last}]", "aria-pressed") == "true" and await ro(pg) == readout(mlast),
              f"[{tag}] {chips} chips; chip {last} fills the input · '{await ro(pg)}'")
        # unit switching
        if T["unit"] == "years":
            await set_unit(pg, "months"); a = await val(pg)
            await fill(pg, "30" if slug != "mortgage" else "222"); await set_unit(pg, "years"); bv = await val(pg)
            exp_b = str(min(T["yhi"], max(T["ylo"], round((30 if slug != "mortgage" else 222) / 12 + 1e-9))))
            check(a == str(mlast) and bv == exp_b, f"[{tag}] years->months {last}->{a}; months 30/222 -> years {bv} (expected {exp_b})")
        else:
            await fill(pg, "18"); r18 = await ro(pg); await set_unit(pg, "years"); a = await val(pg); await set_unit(pg, "months"); bv = await val(pg)
            check(r18 == "18 months · 1.5 years" and a == "2" and bv == "24", f"[{tag}] 18 months '{r18}' -> years {a} -> months {bv}")
        # out of range (months, then years)
        await set_unit(pg, "months"); await fill(pg, str(T["hi"] + 1))
        e, inv, foc = await err_after_next(pg, nxt)
        check(f"between {T['lo']} and {T['hi']} months" in e and ARABIC.search(e) and inv and foc, f"[{tag}] {T['hi'] + 1} months -> '{e.splitlines()[0] if e else ''}' (+AR, invalid, focused)")
        await fill(pg, str(T["lo"] - 1) if T["lo"] > 1 else "0"); e, inv, _ = await err_after_next(pg, nxt)
        check(f"between {T['lo']} and {T['hi']} months" in e and inv, f"[{tag}] {T['lo'] - 1} months -> error")
        await set_unit(pg, "years"); await fill(pg, str(T["yhi"] + 1)); e, inv, _ = await err_after_next(pg, nxt)
        check(f"between {T['ylo']} and {T['yhi']} years" in e and ARABIC.search(e) and inv, f"[{tag}] {T['yhi'] + 1} years -> '{e.splitlines()[0] if e else ''}'")
        await fill(pg, ""); e, _, _ = await err_after_next(pg, nxt)
        check("Enter a loan duration" in e, f"[{tag}] empty -> required error")
        await fill(pg, "2.5"); check(await val(pg) == "25", f"[{tag}] whole numbers only: '2.5' -> '{await val(pg)}'")
        # steppers
        await fill(pg, str(T["yhi"])); plus_dis = await pg.is_disabled("[data-testid=duration-plus]")
        await pg.click("[data-testid=duration-minus]"); after = await val(pg)
        check(plus_dis and after == str(T["yhi"] - 1) and not await pg.locator("#loan-duration-error").count(), f"[{tag}] + disabled at max; - steps to {after}; error clears when edited")
        await pg.click(nxt); await pg.wait_for_timeout(400)
        check(not await pg.locator("#loan-duration-error").count(), f"[{tag}] valid duration passes")
        if slug == "auto" and route == "apply-v2":
            await pg.goto(BASE + path + f"?type={slug}", wait_until="networkidle"); await pg.wait_for_timeout(500)
            await set_unit(pg, "months"); await fill(pg, "90"); await pg.click(nxt); await pg.wait_for_timeout(400)
            box = await pg.locator("[data-testid=duration]").bounding_box()
            await pg.evaluate(f"window.scrollBy(0, {box['y']} - 190)"); await pg.wait_for_timeout(300)
            box = await pg.locator("[data-testid=duration]").bounding_box()
            name = "duration_desktop.png" if w > 600 else "duration_phone.png"
            if w > 600:
                await pg.screenshot(path=f"{SHOTS}/{name}", clip={"x": max(0, box["x"] - 40), "y": max(0, box["y"] - 110), "width": min(w - max(0, box["x"] - 40), box["width"] + 80), "height": box["height"] + 150})
            else:
                await pg.screenshot(path=f"{SHOTS}/{name}")
        check(await pg.evaluate("document.documentElement.scrollWidth - innerWidth") <= 0, f"[{tag}] no overflow")
        check(not errs, f"[{tag}] no console errors {errs[:2]}")
        await c.close()

async def country(b, route, w, h):
    path, nxt = ROUTES[route]; tag = f"country {route} {w}"
    c, pg, errs = await page(b, w, h, geo="SA")
    await pg.goto(BASE + path + "?type=personal", wait_until="networkidle"); await pg.wait_for_timeout(500)
    if route == "apply-v2":  # reach the address screen
        await pg.click(nxt); await pg.wait_for_timeout(500)
        for k, v in {"first-name": "Test", "last-name": "Applicant", "birth-date": "1990-01-01", "email": "t@example.com"}.items(): await pg.fill(f"#{k}", v)
        await pg.click("label[for=marital-0]"); await pg.click(nxt); await pg.wait_for_timeout(600)
    cb = "[data-testid=country-combobox]"
    pre = await pg.inner_text("[data-testid=country-value]")
    check(pre == "Saudi Arabia", f"[{tag}] /geo SA preselects '{pre}'")
    # keyboard only: Tab from postal into the combobox
    await pg.focus("#postal"); await pg.keyboard.press("Tab")
    check(await pg.evaluate("document.activeElement?.id") == "country-combobox", f"[{tag}] Tab reaches the combobox")
    await pg.keyboard.press("q"); await pg.wait_for_timeout(150)
    opened = await pg.get_attribute(cb, "aria-expanded"); act = await pg.get_attribute(cb, "aria-activedescendant")
    act_txt = await pg.inner_text(f"#{act.replace(':', chr(92) + ':')}") if act else ""
    await pg.keyboard.press("Enter"); await pg.wait_for_timeout(150)
    v1 = await pg.inner_text("[data-testid=country-value]")
    check(opened == "true" and act_txt.startswith("Qatar") and v1 == "Qatar" and await pg.get_attribute(cb, "aria-expanded") == "false", f"[{tag}] type 'q' -> Qatar active, Enter selects + closes ({v1})")
    await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(150)
    v2 = await pg.inner_text("[data-testid=country-value]")
    check(v2 == "Bahrain", f"[{tag}] ArrowDown opens, Down x2 + Enter -> {v2}")
    await pg.keyboard.type("united k", delay=40); await pg.wait_for_timeout(150); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(150)
    v3 = await pg.inner_text("[data-testid=country-value]")
    check(v3 == "United Kingdom", f"[{tag}] type-to-search 'united k' -> {v3}")
    await pg.keyboard.press("End"); await pg.wait_for_timeout(100); await pg.keyboard.press("Escape"); await pg.wait_for_timeout(150)
    check(await pg.get_attribute(cb, "aria-expanded") == "false" and await pg.inner_text("[data-testid=country-value]") == "United Kingdom", f"[{tag}] End opens at last, Esc closes without changing")
    await pg.keyboard.press("Home"); await pg.wait_for_timeout(80); await pg.keyboard.press("Tab"); await pg.wait_for_timeout(150)
    v4 = await pg.inner_text("[data-testid=country-value]")
    check(v4 == "United Arab Emirates", f"[{tag}] Home + Tab selects first ({v4}) and moves on")
    ar_line = await pg.evaluate("document.querySelector('[data-testid=country-combobox]').parentElement.querySelector(':scope > [lang=ar]')?.textContent")
    check(ar_line == "الإمارات العربية المتحدة", f"[{tag}] Arabic sub-label under the selected country: {ar_line}")
    flag = await pg.evaluate("document.querySelector('[data-testid=country-combobox] img')?.getAttribute('src') || ''")
    check(".svg" in flag or flag.startswith("data:image/svg"), f"[{tag}] selected value shows an SVG flag")
    await pg.click(cb); await pg.wait_for_timeout(250)
    imgs = await pg.evaluate("[...document.querySelectorAll('[data-testid=country-list] [role=option]')].map(o => !!o.querySelector('img') || !!o.querySelector('svg'))")
    loaded = await pg.evaluate("[...document.querySelectorAll('[data-testid=country-list] img')].every(i => i.complete && i.naturalWidth > 0)")
    lb = await pg.locator("[data-testid=country-list]").bounding_box()
    check(len(imgs) == 12 and all(imgs) and loaded, f"[{tag}] {len(imgs)} options, every one has a flag (Other = globe), all loaded")
    check(lb["x"] >= 0 and lb["x"] + lb["width"] <= w, f"[{tag}] list fits the viewport")
    if route == "apply-v2" and w > 600:
        await pg.locator("[data-testid=country-list] [role=option]:has-text('Saudi Arabia')").hover(); await pg.wait_for_timeout(150)
        top = (await pg.locator(cb).bounding_box())["y"]
        await pg.screenshot(path=f"{SHOTS}/country_flags.png", clip={"x": lb["x"] - 260, "y": max(0, top - 330), "width": lb["width"] + 300, "height": lb["height"] + (top - max(0, top - 330)) + 80})
    await pg.locator("[data-testid=country-list] [role=option]:has-text('Oman')").click(); await pg.wait_for_timeout(150)
    check(await pg.inner_text("[data-testid=country-value]") == "Oman", f"[{tag}] mouse/tap selection works")
    cur = await pg.evaluate("[...document.querySelectorAll('[data-testid=currency-button]')].find(b => b.offsetParent)?.querySelector('img')?.getAttribute('src') || ''")
    await pg.locator("[data-testid=currency-button]:visible").first.click(); await pg.wait_for_timeout(200)
    cflags = await pg.evaluate("[...document.querySelectorAll('[role=listbox] li[role=option]')].filter(o => o.querySelector('img')).length")
    await pg.keyboard.press("Escape")
    check(bool(cur) and cflags == 7, f"[{tag}] currency picker uses the same SVG flags ({cflags} options)")
    check(await pg.evaluate("document.documentElement.scrollWidth - innerWidth") <= 0 and not errs, f"[{tag}] no overflow, no console errors {errs[:2]}")
    await c.close()
    # empty country (geo outside the list) -> validation focuses the combobox
    c, pg, errs = await page(b, w, h, geo="FR")
    await pg.goto(BASE + path + "?type=personal", wait_until="networkidle"); await pg.wait_for_timeout(500)
    if route == "apply-v2":
        await pg.click(nxt); await pg.wait_for_timeout(500)
        for k, v in {"first-name": "Test", "last-name": "Applicant", "birth-date": "1990-01-01", "email": "t@example.com"}.items(): await pg.fill(f"#{k}", v)
        await pg.click("label[for=marital-0]"); await pg.click(nxt); await pg.wait_for_timeout(600)
        for k, v in {"street": "1 Rd", "city": "Riyadh", "region": "Riyadh", "postal": "12345"}.items(): await pg.fill(f"#{k}", v)
    else:
        for k, v in {"first-name": "Test", "last-name": "Applicant", "street": "1 Rd", "city": "Riyadh", "region": "Riyadh", "postal": "12345", "birth-date": "1990-01-01", "email": "t@example.com"}.items(): await pg.fill(f"#{k}", v)
        await pg.select_option("#marital", "Single")
    empty = await pg.locator("[data-testid=country-value]").count() == 0
    await pg.click(nxt); await pg.wait_for_timeout(450)
    foc = await pg.evaluate("document.activeElement?.id"); inv = await pg.get_attribute(cb, "aria-invalid")
    check(empty and foc == "country-combobox" and inv == "true", f"[{tag}] geo FR: country stays empty; Continue -> combobox focused + aria-invalid")
    await pg.keyboard.press("s"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(150)
    check(await pg.get_attribute(cb, "aria-invalid") is None, f"[{tag}] choosing a country clears the invalid state")
    await c.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        for w, h in [(1440, 900), (390, 844)]:
            for route in ROUTES:
                await duration(b, route, w, h)
                await country(b, route, w, h)
        await b.close()
    print("\nRESULT:", "ALL PASS" if not fails else f"{len(fails)} FAIL")
    raise SystemExit(1 if fails else 0)
asyncio.run(main())
