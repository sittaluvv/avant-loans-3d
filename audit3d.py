import json, sys
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else "http://localhost:4180/avant-loans-3d/"
OUT=sys.argv[2] if len(sys.argv)>2 else "/workspace/avant-3d-shots"
res={}
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    for name,vp,mob,rm in [("desktop",{"width":1440,"height":900},False,"no-preference"),("phone",{"width":390,"height":844},True,"no-preference"),("phone_reduced",{"width":390,"height":844},True,"reduce")]:
        ctx=b.new_context(viewport=vp,device_scale_factor=2 if mob else 1,is_mobile=mob,has_touch=mob,reduced_motion=rm)
        pg=ctx.new_page(); cons=[]; fails=[]; posts=[]
        pg.on("console",lambda m: cons.append(f"{m.type}: {m.text}") if m.type in("error","warning") else None)
        pg.on("pageerror",lambda e: cons.append(f"pageerror: {e}"))
        pg.on("requestfailed",lambda r: fails.append(f"{r.url} {r.failure}"))
        pg.on("response",lambda r: fails.append(f"{r.status} {r.url}") if r.status>=400 else None)
        pg.goto(URL,wait_until="networkidle"); pg.wait_for_timeout(3500)
        info=pg.evaluate("()=>({canvas:!!document.querySelector('canvas'),sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,h:document.documentElement.scrollHeight,title:document.title,unlabeled:[...document.querySelectorAll('input,select')].filter(i=>!i.labels?.length&&!i.getAttribute('aria-label')).map(i=>i.id),noalt:[...document.images].filter(i=>!i.hasAttribute('alt')).length,over:[...document.querySelectorAll('main *, header *, footer *')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>document.documentElement.clientWidth+1&&!e.closest('[class*=marquee]')&&!e.closest('section[aria-label]')}).map(e=>e.tagName+'.'+String(e.className).slice(0,50)).slice(0,10)})")
        if name!="phone_reduced":
            pg.screenshot(path=f"{OUT}/{name}_fold.png")
        # scroll through to trigger in-view animations
        h=info["h"]; y=0
        while y<h:
            pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(250); y+=vp["height"]//2
        pg.wait_for_timeout(1200)
        if name=="desktop":
            pg.evaluate("document.getElementById('how').scrollIntoView()"); pg.wait_for_timeout(1200); pg.screenshot(path=f"{OUT}/desktop_how.png")
            pg.evaluate("document.getElementById('benefits').scrollIntoView()"); pg.wait_for_timeout(1200); pg.screenshot(path=f"{OUT}/desktop_benefits.png")
        pg.evaluate("window.scrollTo(0,0)"); pg.wait_for_timeout(800)
        pg.screenshot(path=f"{OUT}/{name}_full.png",full_page=True)
        # form test
        pg.on("request",lambda r: posts.append(r.method+" "+r.url))
        pg.evaluate("document.getElementById('apply').scrollIntoView()"); pg.wait_for_timeout(600)
        for i,v in [("#first-name","Ann"),("#last-name","Lee"),("#email","a@b.co"),("#phone","5551234"),("#zip","12345")]: pg.fill(i,v)
        pg.check("#agree"); pg.click("button[type=submit]"); pg.wait_for_timeout(1200)
        st=pg.locator("[role=status]").count()
        if name=="phone": pg.screenshot(path=f"{OUT}/phone_form_done.png")
        info.update(console=cons,failed=fails,form_requests=[r for r in posts if "/assets/" not in r],status_shown=st,url_after=pg.url,firstname_after=pg.input_value("#first-name"))
        res[name]=info; ctx.close()
    b.close()
print(json.dumps(res,indent=1))
