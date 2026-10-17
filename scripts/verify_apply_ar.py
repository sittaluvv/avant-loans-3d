"""Arabic sub-labels on /apply: walk all steps at 1440 and 390, check Arabic lines, overflow, console errors,
English-only payload (POST intercepted, nothing reaches Telegram). Usage: BASE=... python verify_apply_ar.py"""
import asyncio, json, os, re
from playwright.async_api import async_playwright
from PIL import Image
BASE = os.environ.get("BASE", "http://localhost:4174/avant-loans-3d/")
SHOTS = "/workspace/avant-3d-shots"
WORKER = "https://avant-loans-telegram.sittaluvv.workers.dev/"
ARABIC = re.compile(r"[\u0600-\u06FF]")
fails = []
def check(ok, msg):
    print(("PASS " if ok else "FAIL ") + msg)
    if not ok: fails.append(msg)

if not os.path.exists("/tmp/test_id.jpg"):
    Image.new("RGB", (800, 500), (200, 200, 230)).save("/tmp/test_id.jpg", quality=80)

AR_AUDIT = """() => {
  const els = [...document.querySelectorAll('[lang=ar]')].filter(e => e.offsetParent)
  const fontOk = els.every(e => getComputedStyle(e).fontFamily.includes('IBM Plex Sans Arabic'))
  const dirOk = els.every(e => e.getAttribute('dir') === 'rtl')
  const clipped = els.filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 || r.left < -1 }).map(e => e.textContent)
  const ratio = els.map(e => parseFloat(getComputedStyle(e).fontSize) / parseFloat(getComputedStyle(e.parentElement).fontSize))
  const minPx = Math.min(...els.map(e => parseFloat(getComputedStyle(e).fontSize)))
  return { count: els.length, fontOk, dirOk, clipped, minRatio: Math.min(...ratio), maxRatio: Math.max(...ratio), minPx,
           overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }
}"""

async def audit(pg, tag, min_count):
    await pg.wait_for_timeout(350)
    a = await pg.evaluate(AR_AUDIT)
    check(a["count"] >= min_count and a["fontOk"] and a["dirOk"] and not a["clipped"] and a["overflow"] <= 0 and a["maxRatio"] <= 0.9 and a["minPx"] >= 10,
          f"[{tag}] {a['count']} Arabic lines, IBM Plex Arabic={a['fontOk']}, rtl={a['dirOk']}, clipped={a['clipped'][:2]}, overflow={a['overflow']}, size ratio {a['minRatio']:.2f}-{a['maxRatio']:.2f}, min {a['minPx']:.1f}px")

async def has_ar(pg, sel, tag):
    t = await pg.locator(sel).first.inner_text()
    check(bool(ARABIC.search(t)), f"[{tag}] Arabic in {sel}: {t.strip().splitlines()[-1][:60]}")

async def run(b, w, h, name):
    c = await b.new_context(viewport={"width": w, "height": h}, device_scale_factor=2, is_mobile=w < 600, has_touch=w < 600)
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
    await pg.goto(BASE + "apply/", wait_until="networkidle"); await pg.wait_for_timeout(500)
    await audit(pg, f"{name} step1 empty", 25)
    await has_ar(pg, "h1", name)
    # validation messages (step 1)
    await pg.click("button[type=submit]"); await pg.wait_for_timeout(500)
    await has_ar(pg, "#loan-type-error", name); await has_ar(pg, "p[role=alert].rounded-xl", name)
    await pg.click("label[for=loan-type-1]"); await pg.wait_for_timeout(300)
    for k, v in {"first-name": "Test", "last-name": "Applicant", "street": "1 King Fahd Rd", "city": "Riyadh", "region": "Riyadh", "postal": "12345", "birth-date": "1990-01-01", "email": "test@example.com"}.items():
        await pg.fill(f"#{k}", v)
    await pg.click("[data-testid=country-combobox]"); await pg.click("[role=option]:has-text('Saudi Arabia')"); await pg.select_option("#marital", "Married")
    check(await pg.input_value("#marital") == "Married", f"[{name}] select values stay English")
    await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(300)
    if name == "1440":
        await pg.screenshot(path=f"{SHOTS}/apply_ar_step1.png", full_page=True)
    else:
        await pg.screenshot(path=f"{SHOTS}/apply_ar_phone.png", full_page=True)
    await pg.click("button[type=submit]"); await pg.wait_for_timeout(700)
    # step 2
    await pg.click("label[for=employment-0]"); await pg.wait_for_timeout(450)
    await audit(pg, f"{name} step2", 19)
    gone = await pg.evaluate("!document.getElementById('monthly-debts') && !/Monthly Debt|Car, cards, other loans|الالتزامات الشهرية/.test(document.body.innerText)")
    check(gone, f"[{name}] Monthly Debt Payments field removed")
    sec = await pg.evaluate("(() => { const a = document.getElementById('g-emp').closest('fieldset').getBoundingClientRect(); return [a.y + scrollY, a.height] })()")
    await pg.evaluate(f"window.scrollTo(0, {sec[0]} - 140)"); await pg.wait_for_timeout(300)
    await pg.screenshot(path=f"{SHOTS}/apply_no_debt{'' if name == '1440' else '_phone'}.png", full_page=True)
    await pg.fill("#employer", "Najd Horizon Trading Co."); await pg.fill("#annual-income", "180000")
    await pg.select_option("#pay-frequency", "Monthly")
    if name == "390":
        await pg.evaluate("window.scrollTo(0,0)"); await pg.screenshot(path=f"{SHOTS}/apply_ar_phone_step2.png", full_page=True)
    await pg.click("button[type=submit]"); await pg.wait_for_timeout(700)
    # step 3
    await pg.click("label[for=purpose-0]"); await pg.click("label[for=id-type-2]")
    await pg.fill("#id-number", "1098765432"); await pg.fill("#id-expiry", "2030-01-01")
    await pg.click("button[type=submit]"); await pg.wait_for_timeout(500)   # errors: uploads + contact
    await has_ar(pg, "#id-front-error", name); await has_ar(pg, "#contact-error", name)
    await pg.set_input_files("#id-front", "/tmp/test_id.jpg"); await pg.set_input_files("#id-back", "/tmp/test_id.jpg")
    await pg.click("[data-testid=contact-WhatsApp]"); await pg.wait_for_timeout(400)
    await pg.fill("#whatsapp-number", "50 123 4567"); await pg.check("#consent", force=True); await pg.wait_for_timeout(300)
    await audit(pg, f"{name} step3", 30)
    await has_ar(pg, "[data-testid=submit-notice]", name)
    await has_ar(pg, "button[type=submit]", name)
    await pg.evaluate("window.scrollTo(0,0)"); await pg.wait_for_timeout(300)
    if name == "1440": await pg.screenshot(path=f"{SHOTS}/apply_ar_step3.png", full_page=True)
    else:  # css scale keeps the stitched capture under Chrome's ~8192px limit (taller captures repeat)
        await pg.screenshot(path=f"{SHOTS}/apply_ar_phone_step3.png", full_page=True, scale="css")
    await pg.click("button[type=submit]"); await pg.wait_for_timeout(1500)
    check(bool(sent), f"[{name}] submit intercepted (no Telegram send)")
    body = sent[0].decode("utf8", "ignore") if sent else ""
    i = body.find('{"'); j = body.find("\r\n------", i); p = json.loads(body[i:j]) if body else {}
    check(not ARABIC.search(json.dumps(p, ensure_ascii=False)), f"[{name}] Telegram payload English only")
    check("monthly-debts" not in p.get("fields", {}) and not re.search(r"monthly debt|debts:", p.get("summary", ""), re.I), f"[{name}] no monthly debts in payload or Telegram summary")
    print("   summary employment lines:", [l for l in p.get("summary", "").splitlines() if "income" in l.lower() or "Pay" in l])
    await has_ar(pg, "[role=status] h2", name)
    await audit(pg, f"{name} success", 3)
    if name == "1440": await pg.screenshot(path=f"{SHOTS}/apply_ar_success.png")
    # preselected chip + Change
    await pg.goto(BASE + "apply/?type=mortgage", wait_until="networkidle"); await pg.wait_for_timeout(400)
    await has_ar(pg, "[data-testid=loan-type-chip]", name)
    # loan-type modal on the homepage
    await pg.goto(BASE, wait_until="networkidle"); await pg.click("[data-testid=hero-apply]"); await pg.wait_for_timeout(500)
    await has_ar(pg, "dialog[open]", name)
    await audit(pg, f"{name} modal", 6)
    if name == "390": await pg.screenshot(path=f"{SHOTS}/loan_modal_ar_phone.png")
    check(not errs, f"[{name}] no console errors {errs[:3]}")
    await c.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        await run(b, 1440, 900, "1440")
        await run(b, 390, 844, "390")
        await b.close()
    print("\nRESULT:", "ALL PASS" if not fails else f"{len(fails)} FAIL")
    raise SystemExit(1 if fails else 0)
asyncio.run(main())
