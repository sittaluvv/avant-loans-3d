"""/apply-v2/ preview: every screen and branch at 1440, 1024 and 390, intercepted submit (nothing reaches Telegram),
payload equal to /apply's for the same answers, Enter to continue, Edit links, timeline, validation, contrast,
/v2/ homepage links. Usage: BASE=... python verify_apply_v2.py"""
import asyncio, io, json, os, re
from playwright.async_api import async_playwright
from PIL import Image
BASE = os.environ.get("BASE", "http://localhost:4174/avant-loans-3d/")
SHOTS = "/workspace/avant-3d-shots"
WORKER = "https://avant-loans-telegram.sittaluvv.workers.dev/"
ARABIC = re.compile(r"[\u0600-\u06FF]")
VIEWS = {"1440": (1440, 900), "1024": (1024, 768), "390": (390, 844)}
fails = []
def check(ok, msg):
    print(("PASS " if ok else "FAIL ") + msg)
    if not ok: fails.append(msg)
if not os.path.exists("/tmp/test_id.jpg"):
    Image.new("RGB", (800, 500), (200, 200, 230)).save("/tmp/test_id.jpg", quality=80)

MARITAL = ["Single", "Married", "Divorced", "Widowed", "Separated"]
PAY = ["Monthly", "Twice a month", "Every two weeks", "Weekly", "Irregular"]
# loan type card index (Mortgage, Personal, Auto/Car, Business, Education)
RUNS = {
    "A": dict(slug=None, card=1, emp=0, work={"employer": "Najd Horizon Trading Co.", "job-title": "Analyst"}, extra={}, idt=2, contact="WhatsApp", marital=1, pay=0, dur="36 months (3 years)"),
    "B": dict(slug="auto", card=2, emp=2, work={"own-business-name": "Desert Rose Studio", "years-in-business": "4"}, extra={"vehicle-make": "Toyota", "vehicle-model": "Camry", "vehicle-year": "2024"}, idt=0, contact="Email", marital=0, pay=1, dur="60 months (5 years)", dur_do=("years", "5")),
    "C": dict(slug="mortgage", card=0, emp=1, work={"employer": "Gulf Clinics"}, extra={}, idt=1, contact="WhatsApp", marital=2, pay=2, dur="222 months (18.5 years)", dur_do=("months", "222")),
    "D": dict(slug="business", card=3, emp=3, work={}, extra={"business-name": "Najd Logistics LLC"}, idt=2, contact="Email", marital=3, pay=3, dur="60 months (5 years)", dur_do=("chip", "5")),
    "E": dict(slug="education", card=4, emp=4, work={}, extra={"school-name": "King Saud University"}, idt=0, contact="WhatsApp", marital=4, pay=4, dur="84 months (7 years)", dur_do=("years", "7")),
}
BASIC = {"first-name": "Test", "last-name": "Applicant", "birth-date": "1990-01-01", "email": "test@example.com"}
ADDR = {"street": "1 King Fahd Rd", "city": "Riyadh", "region": "Riyadh", "postal": "12345"}
IDV = {"id-number": "1098765432", "id-expiry": "2030-01-01"}

async def do_dur(pg, R):
    """Typed / chip duration (identical actions on both routes)."""
    a = R.get("dur_do")
    if not a: return
    if a[0] == "chip": await pg.click(f"[data-testid=duration-chip-{a[1]}]"); return
    await pg.click(f"[data-testid=duration-unit-{a[0]}]"); await pg.fill("#loan-duration", a[1]); await pg.wait_for_timeout(100)

def parse(buf):
    body = buf.decode("utf8", "ignore"); i = body.find('{"'); j = body.find("\r\n------", i)
    return json.loads(body[i:j])

async def new_page(b, view, reduced=False):
    w, h = VIEWS[view]
    c = await b.new_context(viewport={"width": w, "height": h}, device_scale_factor=1, is_mobile=w < 600, has_touch=w < 600, reduced_motion="reduce" if reduced else "no-preference")
    pg = await c.new_page(); errs = []; sent = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.route("**/geo", lambda r: r.fulfill(status=200, content_type="application/json", body='{"country":"SA"}', headers={"access-control-allow-origin": "*"}))
    async def post(route):
        if route.request.method == "POST":
            sent.append(route.request.post_data_buffer or b"")
            await route.fulfill(status=200, content_type="application/json", headers={"Access-Control-Allow-Origin": "*"}, body='{"ok":true}')
        else: await route.continue_()
    await pg.route(WORKER, post)
    return c, pg, errs, sent

async def overflow(pg): return await pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
async def screen(pg): return await pg.evaluate("Number(document.querySelector('[data-screen]')?.dataset.screen ?? -1)")
async def wait_screen(pg, n):
    try: await pg.wait_for_function(f"document.querySelector('[data-screen]')?.dataset.screen === '{n}' && document.querySelectorAll('[data-screen]').length === 1", timeout=4000)
    except Exception: pass
    await pg.wait_for_timeout(380)
async def tall_shot(pg, path, w, h):
    hh = await pg.evaluate("document.documentElement.scrollHeight")
    await pg.set_viewport_size({"width": w, "height": hh}); await pg.wait_for_timeout(350)
    await pg.screenshot(path=path); await pg.set_viewport_size({"width": w, "height": h}); await pg.wait_for_timeout(200)

CONTRAST_JS = """(sel) => { const all = [...document.querySelectorAll(sel)].filter(e => e.offsetParent && e.getBoundingClientRect().width > 4); all[0]?.scrollIntoView({ block: 'center', behavior: 'instant' }); return all.filter(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth }).slice(0, 8).map(e => {
  const r = e.getBoundingClientRect(); const c = document.createElement('canvas').getContext('2d'); c.fillStyle = getComputedStyle(e).color; c.fillRect(0,0,1,1)
  return { text: e.textContent.trim().slice(0, 30), x: r.x, y: r.y, w: r.width, h: r.height, rgba: [...c.getImageData(0,0,1,1).data], fs: parseFloat(getComputedStyle(e).fontSize), fw: getComputedStyle(e).fontWeight }
}) }"""
def lum(c):
    def ch(v):
        v /= 255; return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2])
async def contrast(pg, sel, tag, minimum=4.5):
    items = await pg.evaluate(CONTRAST_JS, sel); await pg.wait_for_timeout(250)
    items = await pg.evaluate(CONTRAST_JS, sel)
    if not items: check(False, f"[{tag}] contrast: nothing matched {sel}"); return
    await pg.add_style_tag(content="*, *::placeholder { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; caret-color: transparent !important }")
    await pg.wait_for_timeout(120)
    img = Image.open(io.BytesIO(await pg.screenshot())).convert("RGB")
    await pg.evaluate("document.head.lastElementChild.remove()")
    worst, worst_t = 99, ""
    for it in items:
        box = img.crop((max(0, int(it["x"])), max(0, int(it["y"])), int(it["x"] + it["w"]), int(it["y"] + it["h"])))
        px = list(box.get_flattened_data()) if box.width and box.height else [(255, 255, 255)]
        fr, fg, fb, fa = it["rgba"]; a = fa / 255
        light_text = lum((fr, fg, fb)) > 0.4
        bgs = sorted(px, key=lum)
        bg = bgs[min(len(bgs) - 1, int(len(bgs) * (0.92 if light_text else 0.08)))]  # worst-case background pixel under the text
        fgc = tuple(f * a + g * (1 - a) for f, g in zip((fr, fg, fb), bg))
        L1, L2 = sorted([lum(fgc), lum(bg)], reverse=True)
        cr = (L1 + 0.05) / (L2 + 0.05)
        if cr < worst: worst, worst_t = cr, it["text"][:24]
    check(worst >= minimum, f"[{tag}] contrast {sel[:46]} worst {worst:.2f}:1 over {len(items)} items (>= {minimum}) {worst_t}")
    return worst

async def dial_checks(pg, tag, w, shot=False, view=""):
    """WhatsApp country code: SVG-flag combobox, keyboard only (type digits, Esc, Home + Enter), flags loaded, fits viewport."""
    cb = "[data-testid=dial-combobox]"
    check(await pg.input_value("#whatsapp-dial") == "+966" and await pg.inner_text("[data-testid=dial-value]") == "+966", f"[{tag}] dial prefilled +966 (SAR)")
    check(await pg.evaluate("!!document.querySelector('[data-testid=dial-combobox] img[src*=\"sa\"], [data-testid=dial-combobox] img')"), f"[{tag}] dial shows an SVG flag")
    check(await pg.locator("select#whatsapp-dial").count() == 0, f"[{tag}] no native emoji <select> left")
    await pg.focus(cb); await pg.keyboard.type("971", delay=40); await pg.wait_for_timeout(200)
    act = await pg.get_attribute(cb, "aria-activedescendant"); exp = await pg.get_attribute(cb, "aria-expanded")
    act_txt = await pg.evaluate("(id) => document.getElementById(id)?.innerText || ''", act or "")
    n = await pg.locator("[data-testid=dial-list] [role=option]").count()
    loaded = await pg.evaluate("[...document.querySelectorAll('[data-testid=dial-list] img')].every(i => i.complete && i.naturalWidth > 0) && document.querySelectorAll('[data-testid=dial-list] img').length")
    lb = await pg.locator("[data-testid=dial-list]").bounding_box()
    check(exp == "true" and act_txt.startswith("United Arab Emirates") and n == 10 and loaded == 10, f"[{tag}] dial: type '971' opens + activates UAE; 10 options, 10 SVG flags loaded")
    check(lb["x"] >= 0 and lb["x"] + lb["width"] <= w, f"[{tag}] dial list fits the viewport ({lb['x']:.0f}-{lb['x'] + lb['width']:.0f} of {w})")
    if shot:
        await pg.wait_for_timeout(150)
        top = (await pg.locator(cb).bounding_box())["y"]
        if view == "390":
            await pg.screenshot(path=f"{SHOTS}/phone_code_flags_390.png", clip={"x": 0, "y": max(0, top - 70), "width": w, "height": lb["height"] + (top - max(0, top - 70)) + 70})
        else:
            await pg.screenshot(path=f"{SHOTS}/phone_code_flags.png", clip={"x": max(0, lb["x"] - 40), "y": max(0, top - 90), "width": min(w, lb["width"] + 440), "height": lb["height"] + (top - max(0, top - 90)) + 70})
    await pg.keyboard.press("Enter"); await pg.wait_for_timeout(150)
    check(await pg.inner_text("[data-testid=dial-value]") == "+971" and await pg.input_value("#whatsapp-dial") == "+971" and await pg.get_attribute(cb, "aria-expanded") == "false", f"[{tag}] Enter selects +971 and closes")
    await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("Escape"); await pg.wait_for_timeout(120)
    check(await pg.get_attribute(cb, "aria-expanded") == "false" and await pg.inner_text("[data-testid=dial-value]") == "+971", f"[{tag}] Esc closes without changing")
    await pg.keyboard.press("ArrowDown"); await pg.keyboard.press("Home"); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(150)
    check(await pg.input_value("#whatsapp-dial") == "+966", f"[{tag}] Home + Enter -> +966 (back to the default, so payload parity holds)")

async def v2_flow(b, view, key, shots=False, reduced=False):
    R = RUNS[key]; w, h = VIEWS[view]
    c, pg, errs, sent = await new_page(b, view, reduced)
    tag = f"v2 {view} {key}"
    await pg.goto(BASE + "apply-v2/" + (f"?type={R['slug']}" if R["slug"] else ""), wait_until="networkidle"); await wait_screen(pg, 0)
    # screen 0: loan
    if R["slug"]:
        check(await pg.locator("[data-testid=loan-type-chip]").count() == 1, f"[{tag}] ?type={R['slug']} preselected as a chip")
        await pg.click("[data-testid=loan-type-change]"); await pg.wait_for_timeout(300)
        check(await pg.locator("label[for=loan-type-0]").count() == 1, f"[{tag}] Change reopens the loan-type cards")
        await pg.click(f"label[for=loan-type-{R['card']}]"); await pg.wait_for_timeout(300)
        check(await pg.locator("[data-testid=loan-type-chip]").count() == 1, f"[{tag}] picking again collapses to the chip")
    else:
        await pg.click("[data-testid=next-btn]"); await pg.wait_for_timeout(350)
        err = await pg.locator("#loan-type-error").count() and await pg.inner_text("#loan-type-error")
        check(bool(err) and bool(ARABIC.search(err)) and await screen(pg) == 0, f"[{tag}] no loan type -> inline error (EN+AR), stays on step 1")
        await pg.click(f"label[for=loan-type-{R['card']}]"); await pg.wait_for_timeout(350)
        check(not await pg.locator("text=highlighted field").count(), f"[{tag}] picking a loan type clears the error banner")
    await do_dur(pg, R)
    check(await pg.locator("[data-testid=duration-readout]").count() == 1, f"[{tag}] duration read-out shown")
    if shots and key == "A":
        await pg.wait_for_timeout(700); await tall_shot(pg, f"{SHOTS}/applyv2_step1.png", w, h)
    if view == "390" and key == "A":
        await tall_shot(pg, f"{SHOTS}/applyv2_phone.png", w, h)
        bar = await pg.evaluate("(() => { const r = document.querySelector('[data-testid=nav-bar]').getBoundingClientRect(); return [getComputedStyle(document.querySelector('[data-testid=nav-bar]')).position, Math.round(r.bottom), innerHeight] })()")
        check(bar[0] == "fixed" and abs(bar[1] - bar[2]) <= 1, f"[{tag}] sticky bottom Next/Back bar {bar}")
        top = await pg.inner_text("[data-testid=mobile-step]")
        check("Step 1 of 8" in top, f"[{tag}] compact top bar shows '{top.splitlines()[0]}'")
        tgt = await pg.evaluate("[...document.querySelectorAll('[data-screen] label, [data-screen] button, [data-testid=nav-bar] button')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect().height).filter(h => h < 40).length")
        check(tgt == 0, f"[{tag}] tap targets >= 40px tall (small ones: {tgt})")
    await pg.click("[data-testid=next-btn]"); await wait_screen(pg, 1)
    check(await screen(pg) == 1, f"[{tag}] loan -> about you")
    # screen 1: about you (validation first on run A)
    if key == "A":
        await pg.click("[data-testid=next-btn]"); await pg.wait_for_timeout(400)
        alert = await pg.locator("[role=alert]").count() and await pg.inner_text("[role=alert] >> nth=-1")
        focused = await pg.evaluate("document.activeElement?.id")
        check(await screen(pg) == 1 and bool(alert) and bool(ARABIC.search(alert)) and focused == "first-name", f"[{tag}] empty Continue -> alert (EN+AR) in aria-live, focus on first field ({focused})")
    for k, v in BASIC.items(): await pg.fill(f"#{k}", v)
    await pg.click(f"label[for=marital-{R['marital']}]")
    if key == "A":  # Enter continues
        await pg.focus("#email"); await pg.keyboard.press("Enter"); await wait_screen(pg, 2)
        check(await screen(pg) == 2, f"[{tag}] Enter in a field continues to the next screen")
    else:
        await pg.click("[data-testid=next-btn]"); await wait_screen(pg, 2)
    # screen 2: address (country preselected from /geo)
    for k, v in ADDR.items(): await pg.fill(f"#{k}", v)
    cv = await pg.locator("[data-testid=country-value]").inner_text()
    check(cv.strip() == "Saudi Arabia", f"[{tag}] country preselected from /geo: {cv.strip()}")
    await pg.click("[data-testid=next-btn]"); await wait_screen(pg, 3)
    # screen 3: work
    if key == "B":  # self-employed then switch to retired and back: business fields cleared
        await pg.click("label[for=employment-0]"); await pg.wait_for_timeout(400)
        check(await pg.locator("[data-testid=emp-employed]").count() == 1, f"[{tag}] employed -> employer fields")
    await pg.click(f"label[for=employment-{R['emp']}]"); await pg.wait_for_timeout(450)
    kind = "employed" if R["emp"] < 2 else "self" if R["emp"] == 2 else "none"
    check((await pg.locator(f"[data-testid=emp-{kind}]").count() == 1) if kind != "none" else (await pg.locator("#employer, #own-business-name").count() == 0), f"[{tag}] employment {R['emp']} -> {kind} fields")
    if kind != "none":
        await pg.click("[data-testid=next-btn]"); await pg.wait_for_timeout(400)
        check(await screen(pg) == 3, f"[{tag}] required work field empty -> blocked")
    for k, v in R["work"].items(): await pg.fill(f"#{k}", v)
    await pg.click("[data-testid=next-btn]"); await wait_screen(pg, 4)
    # screen 4: income
    await pg.fill("#annual-income", "180000"); await pg.click(f"label[for=pay-frequency-{R['pay']}]")
    await pg.click("[data-testid=next-btn]"); await wait_screen(pg, 5)
    # screen 5: details
    for k, v in R["extra"].items(): await pg.fill(f"#{k}", v)
    await pg.click("label[for=purpose-0]")
    await pg.click("[data-testid=next-btn]"); await wait_screen(pg, 6)
    check(await screen(pg) == 6, f"[{tag}] details -> identity")
    # screen 6: identity
    await pg.click(f"label[for=id-type-{R['idt']}]")
    for k, v in IDV.items(): await pg.fill(f"#{k}", v)
    await pg.click("[data-testid=next-btn]"); await pg.wait_for_timeout(400)
    fe = await pg.locator("#id-front-error").count() and await pg.inner_text("#id-front-error")
    check(bool(fe) and bool(ARABIC.search(fe)) and await screen(pg) == 6, f"[{tag}] missing ID upload -> error (EN+AR)")
    await pg.set_input_files("#id-front", "/tmp/test_id.jpg")
    if R["idt"] != 0:
        await pg.click("[data-testid=next-btn]"); await pg.wait_for_timeout(400)
        check(await pg.locator("#id-back-error").count() == 1, f"[{tag}] non-passport needs the back")
        await pg.set_input_files("#id-back", "/tmp/test_id.jpg")
    else:
        check(await pg.locator("#id-back-error").count() == 0, f"[{tag}] passport: back optional")
    await pg.wait_for_timeout(500)
    check(await pg.locator(".id-scan").count() >= 1 and await pg.locator("[data-testid=id-front-preview]").count() == 1, f"[{tag}] preview with scan line")
    if shots and key == "A":
        await pg.wait_for_timeout(1400); await tall_shot(pg, f"{SHOTS}/applyv2_id.png", w, h)
    await pg.click("[data-testid=next-btn]"); await wait_screen(pg, 7)
    check(await screen(pg) == 7, f"[{tag}] identity -> review")
    # screen 7: review
    rv = await pg.inner_text("[data-testid=review-summary]")
    check(R["dur"] in rv and "Applicant" in rv and "Riyadh" in rv, f"[{tag}] review card grouped, shows '{R['dur']}'")
    await pg.click("[data-testid=edit-1]"); await wait_screen(pg, 1)
    lab = await pg.inner_text("[data-testid=next-btn]")
    check(await screen(pg) == 1 and "Save & review" in lab, f"[{tag}] Edit -> back to About you with 'Save & review'")
    await pg.click("[data-testid=next-btn]"); await wait_screen(pg, 7)
    check(await screen(pg) == 7, f"[{tag}] Save & review returns to review")
    if view != "390" and key == "A":  # timeline: back to step 1 then forward to review (validated)
        await pg.click("[data-testid=timeline-0]"); await wait_screen(pg, 0)
        await pg.click("[data-testid=timeline-7]"); await wait_screen(pg, 7)
        check(await screen(pg) == 7, f"[{tag}] timeline jumps back and forward")
    # Enter on review must not submit
    await pg.click("[data-testid=next-btn]"); await pg.wait_for_timeout(400)
    ce = await pg.locator("#contact-error").count() and await pg.inner_text("#contact-error")
    check(bool(ce) and not sent, f"[{tag}] no contact method -> error, nothing sent")
    await pg.click(f"[data-testid=contact-{R['contact']}]"); await pg.wait_for_timeout(350)
    if R["contact"] == "WhatsApp":
        await dial_checks(pg, tag, w, shot=(key == "A" and view in ("390", "1440")), view=view)
        await pg.fill("#whatsapp-number", "50 123 4567"); await pg.focus("#whatsapp-number")
    else:
        check(await pg.input_value("#contact-email") == "test@example.com", f"[{tag}] email prefilled from About you"); await pg.focus("#contact-email")
    await pg.keyboard.press("Enter"); await pg.wait_for_timeout(400)
    check(not sent and await screen(pg) == 7, f"[{tag}] Enter on review does not submit")
    await pg.check("#consent", force=True)
    if view == "1440":
        await contrast(pg, "[data-screen] .text-slate-500, [data-screen] .text-slate-600", f"{tag} card muted text")
        await contrast(pg, "aside dt, aside .text-white\\/75", f"{tag} journey panel muted text")
        await contrast(pg, "aside .ar-sub", f"{tag} journey panel Arabic")
        await contrast(pg, "[data-testid=next-btn] > span", f"{tag} primary button")
    if view == "390":
        await contrast(pg, "header .ar-sub, [data-testid=mobile-step]", f"{tag} top bar")
    if shots and key == "A":
        await tall_shot(pg, f"{SHOTS}/applyv2_review.png", w, h)
    await pg.click("[data-testid=next-btn]"); await pg.wait_for_timeout(1700)
    check(len(sent) == 1, f"[{tag}] submit intercepted once (no Telegram send)")
    p = parse(sent[0]) if sent else {}
    f = p.get("fields", {})
    check(f.get("loan-duration") == R["dur"] and f"Loan duration: {R['dur']}" in p.get("summary", ""), f"[{tag}] payload duration '{f.get('loan-duration')}'")
    check(not ARABIC.search(json.dumps(p, ensure_ascii=False)), f"[{tag}] payload English only")
    check("duration-value" not in f and "duration-unit" not in f and "monthly-debts" not in f, f"[{tag}] no raw duration keys / debts in payload")
    if key == "B": check("employer" not in f and f.get("own-business-name") == "Desert Rose Studio", f"[{tag}] employer fields cleared after switching to self-employed")
    s = await pg.locator("[data-testid=success]").count() and await pg.inner_text("[data-testid=success]")
    check(bool(s) and bool(ARABIC.search(s)), f"[{tag}] success screen with Arabic")
    if shots and key == "A":
        await pg.wait_for_timeout(300); await pg.screenshot(path=f"{SHOTS}/applyv2_success.png")
    check(await overflow(pg) <= 0, f"[{tag}] no horizontal overflow")
    check(not errs, f"[{tag}] no console errors {errs[:3]}")
    await c.close()
    return p

async def classic_flow(b, key):
    """Same answers on /apply (1440) -> payload to compare."""
    R = RUNS[key]; c, pg, errs, sent = await new_page(b, "1440")
    await pg.goto(BASE + "apply/" + (f"?type={R['slug']}" if R["slug"] else ""), wait_until="networkidle"); await pg.wait_for_timeout(500)
    if not R["slug"]: await pg.click(f"label[for=loan-type-{R['card']}]")
    await pg.wait_for_timeout(200); await do_dur(pg, R)
    for k, v in {**BASIC, **ADDR}.items(): await pg.fill(f"#{k}", v)
    await pg.select_option("#marital", MARITAL[R["marital"]])
    await pg.click("button[type=submit]"); await pg.wait_for_timeout(700)
    await pg.click(f"label[for=employment-{R['emp']}]"); await pg.wait_for_timeout(450)
    for k, v in R["work"].items(): await pg.fill(f"#{k}", v)
    await pg.fill("#annual-income", "180000"); await pg.select_option("#pay-frequency", PAY[R["pay"]])
    await pg.click("button[type=submit]"); await pg.wait_for_timeout(700)
    for k, v in R["extra"].items(): await pg.fill(f"#{k}", v)
    await pg.click("label[for=purpose-0]"); await pg.click(f"label[for=id-type-{R['idt']}]")
    for k, v in IDV.items(): await pg.fill(f"#{k}", v)
    await pg.set_input_files("#id-front", "/tmp/test_id.jpg")
    if R["idt"] != 0: await pg.set_input_files("#id-back", "/tmp/test_id.jpg")
    await pg.click(f"[data-testid=contact-{R['contact']}]"); await pg.wait_for_timeout(350)
    if R["contact"] == "WhatsApp": await pg.fill("#whatsapp-number", "50 123 4567")
    await pg.check("#consent", force=True); await pg.click("button[type=submit]"); await pg.wait_for_timeout(1500)
    check(len(sent) == 1 and not errs, f"[apply 1440 {key}] /apply submit intercepted, no errors {errs[:2]}")
    await c.close()
    return parse(sent[0]) if sent else {}

def strip_ts(s): return "\n".join(l for l in s.splitlines() if not l.startswith("Submitted:"))

async def links(b):
    for view in ["1440", "390"]:
        c, pg, errs, _ = await new_page(b, view)
        await pg.goto(BASE + "v2/", wait_until="networkidle"); await pg.wait_for_timeout(600)
        cards = await pg.evaluate("[...document.querySelectorAll('[data-testid^=card-], [data-testid^=chip-]')].map(a => a.getAttribute('href'))")
        check(cards and all("/apply-v2/?type=" in h for h in cards), f"[links {view}] /v2/ loan cards + chips -> /apply-v2/?type= ({len(cards)})")
        modal = await pg.evaluate("[...document.querySelectorAll('dialog a[data-slug]')].map(a => a.getAttribute('href'))")
        check(modal and all("/apply-v2/?type=" in h for h in modal), f"[links {view}] /v2/ modal picks -> /apply-v2/")
        if view == "390":
            await pg.evaluate("window.scrollTo(0, 1400)"); await pg.wait_for_timeout(800)
            await pg.click("[data-testid=sticky-apply-btn]"); await pg.wait_for_timeout(600)
        else:
            await pg.click("[data-testid=hero-apply]"); await pg.wait_for_timeout(600)
        await pg.click("dialog[open] a[data-slug=personal]"); await pg.wait_for_load_state("networkidle"); await pg.wait_for_timeout(500)
        check("/apply-v2/?type=personal" in pg.url and await pg.locator("[data-testid=loan-type-chip]").count() == 1, f"[links {view}] {'sticky bar' if view == '390' else 'hero'} -> modal -> {pg.url.split('/avant-loans-3d')[-1]} with chip")
        await pg.goto(BASE, wait_until="networkidle"); await pg.wait_for_timeout(400)
        home = await pg.evaluate("[...document.querySelectorAll('a[href*=\"apply\"]')].map(a => a.getAttribute('href'))")
        check(home and all("apply-v2" not in h for h in home), f"[links {view}] current homepage still links /apply/ only")
        await pg.goto(BASE + "apply/", wait_until="networkidle")
        check(await pg.locator("h1:has-text('Online Loan Application Form')").is_visible(), f"[links {view}] /apply/ is still the classic form")
        check(not errs, f"[links {view}] no console errors {errs[:2]}")
        await c.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        only = os.environ.get("ONLY")
        payloads = {}
        for view in VIEWS:
            for key in RUNS:
                if only and only != key: continue
                payloads[(view, key)] = await v2_flow(b, view, key, shots=(view == "1440"), reduced=(view == "1024"))
        for key in (list(RUNS) if not only else [only]):
            cp = await classic_flow(b, key); vp = payloads.get(("1440", key), {})
            same_fields = cp.get("fields") == vp.get("fields")
            same_summary = strip_ts(cp.get("summary", "")) == strip_ts(vp.get("summary", ""))
            if not same_fields:
                a, z = cp.get("fields", {}), vp.get("fields", {})
                print("   diff:", {k: (a.get(k), z.get(k)) for k in set(a) | set(z) if a.get(k) != z.get(k)})
            check(same_fields and same_summary, f"[payload {key}] /apply-v2 fields + Telegram summary identical to /apply")
        if not only: await links(b)
        await b.close()
    print("\nRESULT:", "ALL PASS" if not fails else f"{len(fails)} FAIL")
    raise SystemExit(1 if fails else 0)
asyncio.run(main())
