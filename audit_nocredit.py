import asyncio, re
from playwright.async_api import async_playwright
BASE = "https://sittaluvv.github.io/avant-loans-3d/"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        for name, url in [("home", BASE), ("apply", BASE + "apply/")]:
            for vp, (w, h) in {"desktop": (1440, 900), "phone": (390, 844)}.items():
                ctx = await b.new_context(viewport={"width": w, "height": h}); pg = await ctx.new_page()
                errs, bad, imgs = [], [], []
                pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
                pg.on("pageerror", lambda e: errs.append(str(e)))
                pg.on("response", lambda r: (r.status >= 400 and bad.append(f"{r.status} {r.url}")) or (r.url.endswith(".webp") and imgs.append(f"{r.status} {r.url.split('/')[-1]}")))
                await pg.goto(url, wait_until="networkidle")
                H = await pg.evaluate("document.body.scrollHeight")
                for y in range(0, H, 500): await pg.evaluate(f"scrollTo(0,{y})"); await pg.wait_for_timeout(50)
                await pg.wait_for_timeout(500)
                info = await pg.evaluate("""() => ({
                  text: /thridy|icons8|illustration credit|fluent emoji/i.test(document.body.innerText),
                  links: [...document.querySelectorAll('a')].filter(a => /thridy|icons8|fluentui/i.test(a.href)).length,
                  broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src.split('/').pop()),
                  overflow: document.documentElement.scrollWidth - innerWidth })""")
                print(name, vp, info, "webp:", sorted(set(imgs)), "errors:", errs, "bad:", bad)
                if name == "home" and vp == "desktop":
                    await pg.evaluate("scrollTo(0,0)"); await pg.wait_for_timeout(800)
                    await pg.screenshot(path="/workspace/avant-3d-shots/nocredit_home.png")
                    await pg.locator("footer").scroll_into_view_if_needed(); await pg.wait_for_timeout(300)
                    await pg.locator("footer").screenshot(path="/workspace/avant-3d-shots/nocredit_footer.png")
                await ctx.close()
        await b.close()
asyncio.run(main())
