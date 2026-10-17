import asyncio
from playwright.async_api import async_playwright
BASE = "https://sittaluvv.github.io/avant-loans-3d/"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        for page_name, url in [("home", BASE), ("apply", BASE + "apply/")]:
            for vp, (w, h) in {"desktop": (1440, 900), "phone": (390, 844)}.items():
                ctx = await b.new_context(viewport={"width": w, "height": h}); pg = await ctx.new_page()
                errs, bad = [], []
                pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
                pg.on("pageerror", lambda e: errs.append(str(e)))
                pg.on("response", lambda r: r.status >= 400 and bad.append(f"{r.status} {r.url}"))
                await pg.goto(url, wait_until="networkidle"); await pg.wait_for_timeout(800)
                info = await pg.evaluate("""() => {
                  const img = document.querySelector('header img[alt="Avant Loans Middle East"]');
                  const r = img.getBoundingClientRect();
                  return {src: img.currentSrc.split('/').pop(), complete: img.complete && img.naturalWidth > 0,
                          h: Math.round(r.height), w: Math.round(r.width),
                          icons: [...document.querySelectorAll('link[rel~=icon],link[rel=apple-touch-icon]')].map(l => l.getAttribute('href').split('/').pop()),
                          overflow: document.documentElement.scrollWidth - innerWidth}
                }""")
                fav = await pg.evaluate("Promise.all(['favicon.svg','favicon.png','apple-touch-icon.png','og-image.jpg'].map(f=>fetch('/avant-loans-3d/'+f).then(r=>f+':'+r.status)))")
                print(page_name, vp, info, fav, "errors:", errs, "bad:", bad)
                await pg.screenshot(path=f"/workspace/avant-3d-shots/logo_{page_name}{'' if vp=='desktop' else '_phone'}.png")
                await ctx.close()
        await b.close()
asyncio.run(main())
