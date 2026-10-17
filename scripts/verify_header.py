"""Header spacing: every width 360..1920 (step 10) on /, /v2/, /apply/, /apply-v2/ -> visible header items
(logo, nav links, currency, Apply/Back, menu button, step text) must not overlap, keep >= 12px gaps, stay in the viewport.
Also checks the <lg "Menu" disclosure (aria-expanded, Esc closes, links reachable). Screenshots header_768/1024.png.
Usage: BASE=... python scripts/verify_header.py"""
import asyncio, json, os
from playwright.async_api import async_playwright
BASE = os.environ.get("BASE", "http://localhost:4174/avant-loans-3d/")
SHOTS = "/workspace/avant-3d-shots"
ROUTES = ["", "v2/", "apply/", "apply-v2/"]
GAP = 12
FAILS = []
def check(ok, msg):
    print(("PASS " if ok else "FAIL ") + msg)
    if not ok: FAILS.append(msg)

MEASURE = """(gap) => {
  const roots = [...document.querySelectorAll('header, [data-testid=apply-topbar], [data-testid=mobile-step]')].filter(r => { const b = r.getBoundingClientRect(); return b.height > 0 && b.width > 0 && getComputedStyle(r).visibility !== 'hidden' });
  const out = []
  for (const root of roots) {
    const items = [...root.querySelectorAll('a, button, [role=combobox], [data-hdr-item]')].filter(e => {
      if (e.closest('[role=listbox], [data-testid=header-menu-panel]')) return false
      const b = e.getBoundingClientRect(); const cs = getComputedStyle(e)
      return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[aria-hidden=true]') && e.getClientRects().length
    }).filter((e, _, arr) => !arr.some(o => o !== e && o.contains(e)))  // outermost only
    const rs = items.map(e => { const b = e.getBoundingClientRect(); return { t: (e.innerText || e.getAttribute('aria-label') || e.tagName).trim().split('\\n')[0].slice(0, 24), x: b.left, r: b.right, y: b.top, b: b.bottom } })
    for (const a of rs) {
      if (a.x < -0.5 || a.r > innerWidth + 0.5) out.push(`${a.t} outside viewport [${a.x.toFixed(0)},${a.r.toFixed(0)}]`)
    }
    for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
      const a = rs[i], c = rs[j]
      const vOverlap = Math.min(a.b, c.b) - Math.max(a.y, c.y) > 2
      if (!vOverlap) continue
      const hgap = Math.max(c.x - a.r, a.x - c.r)
      if (hgap < gap) out.push(`'${a.t}' vs '${c.t}' gap ${hgap.toFixed(1)}px`)
    }
  }
  return out
}"""

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        for route in ROUTES:
            c = await b.new_context(viewport={"width": 1440, "height": 900})
            await c.route("**/geo", lambda r: r.fulfill(status=200, content_type="application/json", headers={"Access-Control-Allow-Origin": "*"}, body='{"country":"SA"}'))
            pg = await c.new_page(); errs = []
            pg.on("pageerror", lambda e: errs.append(str(e)))
            await pg.goto(BASE + route, wait_until="networkidle"); await pg.wait_for_timeout(400)
            bad = {}
            for w in range(360, 1921, 10):
                await pg.set_viewport_size({"width": w, "height": 900}); await pg.wait_for_timeout(40)
                issues = await pg.evaluate(MEASURE, GAP)
                ov = await pg.evaluate("document.documentElement.scrollWidth - innerWidth")
                if ov > 0: issues.append(f"page overflow {ov}px")
                if issues: bad[w] = issues
            check(not bad, f"[{route or '/'}] header items spaced >= {GAP}px, inside viewport, 360-1920 " + (f"{len(bad)} widths: " + ", ".join(f"{w}:{v[0]}" for w, v in list(bad.items())[::3]) if bad else ""))
            # tablet menu disclosure (routes with the main nav)
            if route in ("", "v2/", "apply/"):
                await pg.set_viewport_size({"width": 768, "height": 900}); await pg.wait_for_timeout(150)
                mb = pg.locator("[data-testid=header-menu-button]")
                if await mb.count() and await mb.is_visible():
                    await mb.focus(); await pg.keyboard.press("Enter"); await pg.wait_for_timeout(200)
                    exp = await mb.get_attribute("aria-expanded"); links = await pg.locator("[data-testid=header-menu-panel] a").all_inner_texts()
                    await pg.keyboard.press("Tab"); first = await pg.evaluate("document.activeElement?.closest('[data-testid=header-menu-panel]') ? document.activeElement.innerText : ''")
                    await pg.keyboard.press("Escape"); await pg.wait_for_timeout(200)
                    closed = await mb.get_attribute("aria-expanded"); back = await pg.evaluate("document.activeElement?.dataset?.testid")
                    check(exp == "true" and len(links) >= 4 and first and closed == "false" and back == "header-menu-button", f"[{route or '/'}] 768 menu: opens ({links}), Tab into links ('{first.strip()}'), Esc closes + returns focus")
                else:
                    check(route == "apply/", f"[{route or '/'}] 768 has a menu button")
            if route == "":
                for w in (768, 1024):
                    await pg.set_viewport_size({"width": w, "height": 900}); await pg.evaluate("document.activeElement?.blur()"); await pg.mouse.move(5, 600); await pg.wait_for_timeout(250)
                    await pg.screenshot(path=f"{SHOTS}/header_{w}.png", clip={"x": 0, "y": 0, "width": w, "height": 110})
            check(not errs, f"[{route or '/'}] no page errors {errs[:2]}")
            await c.close()
        await b.close()
    print("RESULT:", "ALL PASS" if not FAILS else f"{len(FAILS)} FAIL")
    raise SystemExit(1 if FAILS else 0)
asyncio.run(main())
