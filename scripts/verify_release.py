"""Release check: hero photo (no video), LCP, contrast, currency (mocked /geo), apply trims + employment logic.
Usage: BASE=https://sittaluvv.github.io/avant-loans-3d/ python verify_release.py   (no real Telegram send: POST is intercepted)"""
import asyncio, json, os, io
from playwright.async_api import async_playwright
from PIL import Image
BASE = os.environ.get("BASE", "http://localhost:4173/avant-loans-3d/")
SHOTS = "/workspace/avant-3d-shots"
VIEWS = {"desktop": {"width": 1440, "height": 900}, "phone": {"width": 390, "height": 844}}
R = {}

def lum(p):
    def c(v):
        v /= 255; return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * c(p[0]) + 0.7152 * c(p[1]) + 0.0722 * c(p[2])

async def ctx(b, view, country="US", mobile=False):
    c = await b.new_context(viewport=VIEWS[view], device_scale_factor=2 if view == "phone" else 1, is_mobile=view == "phone", has_touch=view == "phone")
    async def geo(route):
        await route.fulfill(status=200, content_type="application/json", headers={"Access-Control-Allow-Origin": "*"}, body=json.dumps({"country": country}))
    await c.route("**/geo", geo)
    return c

def watch(pg, errs):
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))

async def overflow(pg):
    return await pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")

async def hero(b, view):
    c = await ctx(b, view); pg = await c.new_page(); errs = []; watch(pg, errs)
    await pg.goto(BASE, wait_until="networkidle")
    # still photo hero: no <video>, photo decoded, LCP = the photo
    await pg.wait_for_function("(() => { const i = document.querySelector('[data-testid=hero-photo]'); return i && i.complete && i.naturalWidth > 0 })()", timeout=20000)
    info = await pg.evaluate("""(() => { const i = document.querySelector('[data-testid=hero-photo]');
      return { videos: document.querySelectorAll('video').length, src: i.currentSrc.split('/').pop(), natural: [i.naturalWidth, i.naturalHeight],
               kenburns: getComputedStyle(i).animationName } })()""")
    info["lcp"] = await pg.evaluate("""() => new Promise(r => { let v = 0, el = ''; new PerformanceObserver(l => { for (const e of l.getEntries()) { v = e.startTime; el = e.element ? (e.element.dataset.testid || e.element.tagName) : e.url } }).observe({type: 'largest-contentful-paint', buffered: true}); setTimeout(() => r({ms: Math.round(v), el}), 800) })""")
    # contrast: hide text, sample the background under each text block at both ends of the slow zoom
    worst = {}
    for scale in [1.0, 1.045]:
        await pg.evaluate(f"(() => {{ const i = document.querySelector('[data-testid=hero-photo]'); i.style.animation = 'none'; i.style.transform = 'scale({scale})' }})()")
        await pg.wait_for_timeout(250)
        boxes = await pg.evaluate("""(() => { const sec = document.querySelector('section[aria-labelledby=hero-title]');
          const els = { h1: sec.querySelector('h1'), h1_accent: sec.querySelector('h1 span'), sub: sec.querySelector('h1 + p'), link: sec.querySelector('a[href="#loan-types"]') };
          const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d');
          const rgba = c => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] };
          const out = {}; for (const [k, e] of Object.entries(els)) { const r = e.getBoundingClientRect(); out[k] = [r.x, r.y, r.width, r.height, rgba(getComputedStyle(e).color)] }
          sec.querySelector('.max-w-xl').style.visibility = 'hidden'; return out })()""")
        img = Image.open(io.BytesIO(await pg.screenshot())).convert("RGB"); sc = img.width / VIEWS[view]["width"]
        await pg.evaluate("document.querySelector('section[aria-labelledby=hero-title] .max-w-xl').style.visibility = ''")
        for k, (x, y, w, h, col) in boxes.items():
            crop = img.crop((int(x * sc), int(y * sc), int((x + w) * sc), int((y + h) * sc)))
            px = sorted(list(crop.tobytes()[i:i+3] for i in range(0, crop.width*crop.height*3, 3)), key=lum); bg = px[int(len(px) * 0.98)]  # 98th percentile brightest pixel
            a = col[3]  # canvas-normalised [r, g, b, alpha]
            fg = tuple(col[i] * a + bg[i] * (1 - a) for i in range(3))
            cr = (lum(fg) + 0.05) / (lum(bg) + 0.05)
            if k not in worst or cr < worst[k][0]: worst[k] = (round(cr, 2), scale)
    await pg.evaluate("(() => { const i = document.querySelector('[data-testid=hero-photo]'); i.style.animation = ''; i.style.transform = '' })()"); await pg.wait_for_timeout(300)
    await pg.screenshot(path=f"{SHOTS}/hero_photo_{view}.png")
    foot = pg.locator("[data-testid=site-footer]"); await foot.scroll_into_view_if_needed(); await pg.wait_for_timeout(300)
    if view == "desktop": await foot.screenshot(path=f"{SHOTS}/footer_license.png")
    footer_text = await foot.inner_text()
    R[f"footer_{view}"] = {"company_line": await pg.locator("[data-testid=company-line]").inner_text(), "has_notice": "subject to regulatory approval by the Central Bank of the UAE / SAMA" in footer_text, "has_copyright": "©" in footer_text,
        "page_mentions_demo": await pg.evaluate("/\\bdemo\\b|not a real/i.test(document.body.innerText)")}
    R[f"hero_{view}"] = {**info, "contrast_worst(ratio,scale)": worst, "overflow": await overflow(pg), "errors": errs}
    await c.close()

async def currency(b, view):
    out = {}
    for cc, want in [("SA", "SAR"), ("AE", "AED"), ("KW", "KWD"), ("US", "USD")]:
        c = await ctx(b, view, cc); pg = await c.new_page(); errs = []; watch(pg, errs)
        await pg.goto(BASE, wait_until="networkidle"); await pg.wait_for_timeout(500)
        btn = (await pg.locator("[data-testid=currency-button]").inner_text()).strip()
        card = await pg.locator("[data-testid=card-range]").nth(2).inner_text()
        await pg.goto(BASE + "apply/", wait_until="networkidle"); await pg.wait_for_timeout(400)
        await pg.click("label[for=loan-type-1]")
        pre = await pg.locator("[data-testid=amount-prefix]").inner_text()
        hint = await pg.locator("#loan-amount-hint").inner_text()
        out[cc] = {"want": want, "button": btn.replace("\n", " "), "personal_card": card, "apply_prefix": pre, "hint": hint, "ok": want in btn and want in card and pre == want, "errors": errs}
        await c.close()
    # manual choice persists and overrides geo
    c = await ctx(b, view, "SA"); pg = await c.new_page(); errs = []; watch(pg, errs)
    await pg.goto(BASE, wait_until="networkidle"); await pg.wait_for_timeout(400)
    await pg.click("[data-testid=currency-button]"); await pg.wait_for_timeout(250)
    await pg.screenshot(path=f"{SHOTS}/currency_{view}.png")
    await pg.click("[role=option]:has-text('QAR')"); await pg.reload(wait_until="networkidle"); await pg.wait_for_timeout(500)
    after = (await pg.locator("[data-testid=currency-button]").inner_text()).replace("\n", " ")
    await pg.goto(BASE + "apply/", wait_until="networkidle"); await pg.wait_for_timeout(300)
    after_apply = (await pg.locator("[data-testid=currency-button]").inner_text()).replace("\n", " ")
    out["manual_QAR_after_reload_with_geo_SA"] = {"home": after, "apply": after_apply, "ok": "QAR" in after and "QAR" in after_apply, "overflow": await overflow(pg), "errors": errs}
    R[f"currency_{view}"] = out; await c.close()

async def fill_step0(pg):
    await pg.click("label[for=loan-type-1]")
    for k, v in {"first-name": "Test", "last-name": "Applicant", "street": "1 Demo St", "city": "Riyadh", "region": "Riyadh", "postal": "12345", "birth-date": "1990-01-01", "email": "test@example.com"}.items():
        await pg.fill(f"#{k}", v)
    await pg.select_option("#country", index=1); await pg.select_option("#marital", "Single")

async def apply_flow(b, view):
    c = await ctx(b, view, "SA"); pg = await c.new_page(); errs = []; watch(pg, errs); sent = []
    async def post(route):
        if route.request.method == "POST":
            sent.append(route.request.post_data_buffer or b"")
            await route.fulfill(status=200, content_type="application/json", headers={"Access-Control-Allow-Origin": "*"}, body='{"ok":true}')
        else:
            await route.continue_()
    await pg.route("https://avant-loans-telegram.sittaluvv.workers.dev/", post)
    await pg.goto(BASE + "apply/", wait_until="networkidle"); await pg.wait_for_timeout(400)
    removed = await pg.evaluate("['dependents','residency','second-applicant'].map(n => !!document.querySelector(`[name=${n}]`)).concat(/Dependents|Residency Status|Second Applicant/.test(document.body.innerText))")
    await fill_step0(pg)
    # screenshot the trimmed applicant section (name -> marital)
    top = await pg.locator("label[for=first-name], #g-name").first.bounding_box(); bot = await pg.locator("#marital").bounding_box()
    await pg.evaluate(f"window.scrollTo(0, {top['y']} + window.scrollY - 120)"); await pg.wait_for_timeout(300)
    top = await pg.locator("#g-name").bounding_box(); bot = await pg.locator("#marital").bounding_box()
    W = VIEWS[view]["width"]
    await pg.screenshot(path=f"{SHOTS}/apply_trimmed_{view}.png", clip={"x": 0, "y": max(0, top["y"] - 40), "width": W, "height": min(VIEWS[view]["height"], bot["y"] + bot["height"] + 60 - max(0, top["y"] - 40))})
    await pg.click("button[type=submit]"); await pg.wait_for_timeout(700)
    step1 = await pg.locator("#g-emp").count() == 1
    emp = {}
    for i, label in enumerate(["Employed full-time", "Employed part-time", "Self-employed", "Retired", "Not currently employed"]):
        await pg.click(f"label[for=employment-{i}]"); await pg.wait_for_timeout(450)
        vis = {k: await pg.locator(f"#{k}").count() for k in ["employer", "job-title", "years-employed", "own-business-name", "years-in-business"]}
        # validation: fill only income fields, try to advance with employer fields empty
        await pg.fill("#annual-income", "120000"); await pg.select_option("#pay-frequency", "Monthly")
        await pg.click("button[type=submit]"); await pg.wait_for_timeout(500)
        blocked = await pg.locator("#g-emp").count() == 1
        invalid = await pg.evaluate("[...document.querySelectorAll('[aria-invalid=true]')].map(e => e.id)")
        emp[label] = {"fields_present": [k for k, v in vis.items() if v], "advanced_with_empty_work_fields": not blocked, "invalid": invalid}
        if not blocked:  # went to step 2 -> go back
            await pg.locator("button:has-text('Back'), button:has-text('Previous')").first.click(); await pg.wait_for_timeout(600)
        if label == "Employed full-time":
            await pg.evaluate("window.scrollTo(0, 0)"); el = pg.locator("#g-emp"); await el.scroll_into_view_if_needed()
            if view == "desktop": await pg.screenshot(path=f"{SHOTS}/employment_employed.png")
            else: await pg.screenshot(path=f"{SHOTS}/employment_phone.png")
        if label == "Retired" and view == "desktop":
            await pg.locator("#g-emp").scroll_into_view_if_needed(); await pg.screenshot(path=f"{SHOTS}/employment_retired.png")
    # Self-employed with business name advances
    await pg.click("label[for=employment-2]"); await pg.wait_for_timeout(400); await pg.fill("#own-business-name", "Demo Trading"); await pg.wait_for_timeout(100)
    # switch to Retired: business fields must be cleared; then employed path for final submit
    await pg.click("label[for=employment-0]"); await pg.wait_for_timeout(400)
    await pg.fill("#employer", "Demo Co"); await pg.fill("#job-title", "Analyst"); await pg.fill("#years-employed", "3")
    await pg.click("label[for=employment-3]"); await pg.wait_for_timeout(450)  # Retired -> clears employer fields
    await pg.click("button[type=submit]"); await pg.wait_for_timeout(700)
    step2 = await pg.locator("#id-number").count() == 1
    # step 2
    for i in range(6):
        if await pg.locator(f"label[for=purpose-{i}]").count(): await pg.click("label[for=purpose-0]"); break
    await pg.click("label[for=id-type-0]"); await pg.fill("#id-number", "TEST12345"); await pg.fill("#id-expiry", "2030-01-01")
    await pg.set_input_files("#id-front", "/tmp/test_id.jpg"); await pg.wait_for_timeout(300)
    await pg.check("#consent", force=True)
    # contact preference: required
    await pg.click("button[type=submit]"); await pg.wait_for_timeout(500)
    contact_err = await pg.locator("#contact-error").count() == 1 and not sent
    await pg.click("[data-testid=contact-Email]"); await pg.wait_for_timeout(400)
    email_prefill = await pg.input_value("#contact-email")
    await pg.fill("#contact-email", "not-an-email"); await pg.click("button[type=submit]"); await pg.wait_for_timeout(400)
    bad_email_blocked = not sent
    await pg.click("[data-testid=contact-WhatsApp]"); await pg.wait_for_timeout(400)
    dial_prefill = await pg.input_value("#whatsapp-dial")
    await pg.click("button[type=submit]"); await pg.wait_for_timeout(400)
    empty_wa_blocked = not sent
    await pg.fill("#whatsapp-number", "50 123 4567"); await pg.wait_for_timeout(200)
    await pg.locator("#g-contact").scroll_into_view_if_needed(); await pg.evaluate("window.scrollBy(0, -90)"); await pg.wait_for_timeout(300)
    await pg.screenshot(path=f"{SHOTS}/contact_pref_{view}.png")
    review = await pg.locator("[data-testid=review-summary]").inner_text()
    notice = pg.locator("[data-testid=submit-notice]"); await notice.scroll_into_view_if_needed(); await pg.wait_for_timeout(300)
    nb = await notice.bounding_box(); sb = await pg.locator("button[type=submit]").bounding_box()
    if view == "desktop":
        await pg.screenshot(path=f"{SHOTS}/submit_notice.png", clip={"x": 0, "y": max(0, nb["y"] - 160), "width": VIEWS[view]["width"], "height": sb["y"] + sb["height"] + 40 - max(0, nb["y"] - 160)})
    R[f"notice_{view}"] = {"text": await notice.inner_text(), "above_submit": nb["y"] + nb["height"] <= sb["y"], "apply_mentions_demo": await pg.evaluate("/\\bdemo\\b|not a real/i.test(document.body.innerText)")}
    await pg.click("button[type=submit]"); await pg.wait_for_timeout(1500)
    body = sent[0].decode("utf8", "ignore") if sent else ""
    summ = ""
    if body:
        i = body.find('{"'); j = body.find("\r\n------", i); p = json.loads(body[i:j]); summ = p.get("summary", ""); fields = p.get("fields", {})
    R[f"apply_{view}"] = {"removed_fields_absent": not any(removed), "reached_step2_employment": step1, "employment": emp, "reached_final_step": step2,
        "submitted(intercepted)": bool(sent), "summary_has_removed_fields": any(w in summ for w in ["Dependents", "Residency", "Second applicant"]),
        "summary_employment_lines": [l for l in summ.splitlines() if any(w in l for w in ["Employ", "Business", "Years", "Job"])],
        "contact": {"none_chosen_error": contact_err, "email_prefill": email_prefill, "invalid_email_blocked": bad_email_blocked, "whatsapp_dial_prefill": dial_prefill,
                    "empty_whatsapp_blocked": empty_wa_blocked, "review_summary": review.replace("\n", " | "), "payload_preferredContact": (fields if body else {}).get("preferredContact"),
                    "telegram_top_lines": summ.splitlines()[:3]},
        "summary_amount_lines": [l for l in summ.splitlines() if "amount" in l.lower() or "USD" in l],
        "retired_has_employer_fields": any(k in (fields if body else {}) for k in ["employer", "job-title", "years-employed", "own-business-name"]),
        "overflow": await overflow(pg), "errors": errs}
    await c.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox", "--autoplay-policy=no-user-gesture-required"])
        for v in VIEWS:
            await hero(b, v)
            if os.environ.get("ONLY") != "hero": await currency(b, v); await apply_flow(b, v)
        await b.close()
    print(json.dumps(R, indent=1, ensure_ascii=False))
asyncio.run(main())
