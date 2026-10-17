"""Render the v2 R3F hero scene in Chromium and save a transparent poster (src/assets/v2/hero-3d-poster.webp)."""
import sys, asyncio
from playwright.async_api import async_playwright
from PIL import Image
URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4174/avant-loans-3d/v2/"
OUT = "src/assets/v2/hero-3d-poster.webp"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        pg = await b.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=2)
        await pg.route("**/geo", lambda r: r.fulfill(status=200, content_type="application/json", body='{"country":"AE"}', headers={"access-control-allow-origin": "*"}))
        errs = []
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        await pg.goto(URL, wait_until="networkidle")
        await pg.wait_for_selector('[data-testid=hero-3d][data-state="3d"]', timeout=30000)
        await pg.wait_for_timeout(2500)
        await pg.mouse.move(720, 450)
        bb0 = await pg.locator("[data-testid=hero-3d]").bounding_box()
        await pg.evaluate("window.scrollTo(0,0)")
        await pg.add_style_tag(content="""
          html,body,*{background:transparent!important;background-image:none!important;box-shadow:none!important}
          *{visibility:hidden!important} [data-testid=hero-3d] canvas{visibility:visible!important}
          [data-testid=hero-3d] > div{opacity:1!important}""")
        await pg.wait_for_timeout(300)
        bb = await pg.locator("[data-testid=hero-3d]").bounding_box()
        await pg.screenshot(path="/tmp/v2_poster_raw.png", omit_background=True, clip=bb)
        im = Image.open("/tmp/v2_poster_raw.png").convert("RGBA")
        print("raw", im.size, "errors", errs)
        if im.size[0] > 1100: im = im.resize((1100, round(1100 * im.size[1] / im.size[0])), Image.LANCZOS)
        im.save(OUT, "WEBP", quality=84, method=6)
        print("saved", OUT, im.size)
        await b.close()
asyncio.run(main())
