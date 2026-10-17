import asyncio
from playwright.async_api import async_playwright
URL = "https://sittaluvv.github.io/avant-loans-3d/"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        for vp, (w, h) in {"desktop": (1440, 900), "phone": (390, 844)}.items():
            ctx = await b.new_context(viewport={"width": w, "height": h}); pg = await ctx.new_page()
            errs = []
            pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
            pg.on("pageerror", lambda e: errs.append(str(e)))
            await pg.goto(URL, wait_until="networkidle")
            # scroll through whole page so whileInView reveals fire
            H = await pg.evaluate("document.body.scrollHeight")
            for y in range(0, H, 400): await pg.evaluate(f"scrollTo(0,{y})"); await pg.wait_for_timeout(60)
            sec = pg.locator("#reviews"); await sec.scroll_into_view_if_needed(); await pg.wait_for_timeout(1200)
            info = await pg.evaluate("""() => {
              const s = document.querySelector('#reviews'); const cards = s.querySelectorAll('figure');
              const ul = s.querySelector('ul');
              return { cards: cards.length,
                label: !![...s.querySelectorAll('p')].find(p => p.textContent.includes('Sample reviews — replace with real customer feedback')),
                stars: s.querySelectorAll('svg.fill-\\\\[\\\\#F5C451\\\\]').length,
                chips: [...s.querySelectorAll('figcaption > span:last-child')].map(c => c.textContent),
                visibleOpacity: [...s.querySelectorAll('li')].map(l => getComputedStyle(l).opacity).join(','),
                ulScrollable: ul.scrollWidth > ul.clientWidth,
                pageOverflow: document.documentElement.scrollWidth - innerWidth,
                navReviews: !!document.querySelector('header a[href="#reviews"]'),
                ratingClaims: /\\d(\\.\\d)?\\s*\\/\\s*5|trustpilot|google reviews/i.test(document.body.innerText) }
            }""")
            print(vp, info, "errors:", errs)
            if vp == "phone":
                await pg.evaluate("document.querySelector('#reviews ul').scrollBy({left: 700})"); await pg.wait_for_timeout(500)
                print("after swipe opacity:", await pg.evaluate("[...document.querySelectorAll('#reviews li')].map(l=>getComputedStyle(l).opacity).join(',')"),
                      "overflow:", await pg.evaluate("document.documentElement.scrollWidth - innerWidth"))
                await pg.evaluate("document.querySelector('#reviews ul').scrollTo({left: 0})"); await pg.wait_for_timeout(500)
            await sec.screenshot(path=f"/workspace/avant-3d-shots/reviews_{vp}.png")
            await ctx.close()
        await b.close()
asyncio.run(main())
