import asyncio, json
from playwright.async_api import async_playwright
URL = "https://sittaluvv.github.io/avant-loans-3d/"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox", "--autoplay-policy=no-user-gesture-required"])
        for vp, (w, h) in {"desktop": (1440, 900), "phone": (390, 844)}.items():
            ctx = await b.new_context(viewport={"width": w, "height": h}); pg = await ctx.new_page()
            errs = []
            pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
            pg.on("pageerror", lambda e: errs.append(str(e)))
            await pg.add_init_script("""new PerformanceObserver(l=>{for(const e of l.getEntries()) window.__lcp={t:e.startTime,el:(e.element&&(e.element.tagName+' '+(e.element.currentSrc||e.element.src||'').split('/').pop()))||e.url}}).observe({type:'largest-contentful-paint',buffered:true})""")
            await pg.goto(URL, wait_until="networkidle")
            await pg.wait_for_timeout(800)
            t1 = await pg.evaluate("(() => { const v=document.querySelector('video'); return v ? {rs:v.readyState, t:v.currentTime, paused:v.paused, src:v.currentSrc.split('/').pop(), loop:v.loop, muted:v.muted, op:getComputedStyle(v).opacity} : null })()")
            await pg.wait_for_timeout(1500)
            t2 = await pg.evaluate("document.querySelector('video').currentTime")
            info = await pg.evaluate("""() => {
              const h=document.querySelector('#hero-title'); const hs=getComputedStyle(h);
              const hdr=document.querySelector('header'); const logo=hdr.querySelector('img');
              return { h1: h.textContent, h1color: hs.color, logo: logo.src.split('/').pop(),
                applyHrefs: [...document.querySelectorAll('a')].filter(a=>/Apply for Loan/.test(a.textContent)).map(a=>a.getAttribute('href')),
                overflow: document.documentElement.scrollWidth - innerWidth, lcp: window.__lcp }
            }""")
            # contrast sample: pixel luminance behind the headline (screenshot region)
            box = await pg.locator("#hero-title").bounding_box()
            await pg.screenshot(path=f"/workspace/avant-3d-shots/hero_video_{vp}.png")
            from PIL import Image
            im = Image.open(f"/workspace/avant-3d-shots/hero_video_{vp}.png").convert("RGB")
            # sample background just left of/under text lines (box edges)
            pts = [(int(box["x"]+box["width"]*f), int(box["y"]+box["height"]*g)) for f in (0.02, 0.5, 0.98) for g in (0.02, 0.98)]
            def lum(c):
                ch = [((v/255)/12.92 if v/255 <= 0.03928 else (((v/255)+0.055)/1.055)**2.4) for v in c]
                return 0.2126*ch[0]+0.7152*ch[1]+0.0722*ch[2]
            bgL = max(lum(im.getpixel(p)) for p in pts if p[0] < im.width and p[1] < im.height)
            contrast = round((1.0+0.05)/(bgL+0.05), 1)
            # scroll: header turns light
            await pg.evaluate("scrollTo(0, 700)"); await pg.wait_for_timeout(500)
            logo2 = await pg.evaluate("document.querySelector('header img').src.split('/').pop()")
            print(vp, json.dumps({"video": t1, "t_after_1.5s": round(t2, 2), "advanced": t2 > t1["t"], **info, "worst_case_contrast_white_text": contrast, "logo_after_scroll": logo2, "errors": errs}))
            await ctx.close()
        # reduced motion -> poster only
        ctx = await b.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce"); pg = await ctx.new_page()
        await pg.goto(URL, wait_until="networkidle")
        print("reduced-motion: video elements =", await pg.locator("video").count(), "| poster img present =", await pg.locator("section img[fetchpriority=high]").count())
        await b.close()
asyncio.run(main())
