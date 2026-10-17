import json, sys
from playwright.sync_api import sync_playwright
URL=sys.argv[1] if len(sys.argv)>1 else "http://localhost:4180/avant-loans-3d/apply/"
OUT=sys.argv[2] if len(sys.argv)>2 else "/workspace/avant-3d-shots"
res={}
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,vp,mob in [("desktop",{"width":1440,"height":900},False),("phone",{"width":390,"height":844},True)]:
        ctx=b.new_context(viewport=vp,device_scale_factor=2 if mob else 1,is_mobile=mob,has_touch=mob,locale="en-US")
        pg=ctx.new_page(); cons=[]; fails=[]; reqs=[]
        pg.on("console",lambda m: cons.append(f"{m.type}: {m.text}") if m.type in("error","warning") else None)
        pg.on("pageerror",lambda e: cons.append(f"pageerror: {e}"))
        pg.on("response",lambda r: fails.append(f"{r.status} {r.url}") if r.status>=400 else None)
        pg.goto(URL,wait_until="networkidle"); pg.wait_for_timeout(800)
        pg.screenshot(path=f"{OUT}/apply_{name}_fold.png")
        pg.screenshot(path=f"{OUT}/apply_{name}_step1_full.png",full_page=True)
        pg.on("request",lambda r: reqs.append(r.method+" "+r.url))
        info=pg.evaluate("()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,title:document.title,unlabeled:[...document.querySelectorAll('input,select')].filter(i=>!i.labels?.length&&!i.getAttribute('aria-label')).map(i=>i.id||i.name)})")
        # try next with empty -> should block
        pg.click("text=Next Page"); pg.wait_for_timeout(500)
        info["blocked_empty"]=pg.locator("[role=alert]").count()==1 and pg.locator("#first-name").count()==1
        info["alert"]=pg.locator("[role=alert]").inner_text() if pg.locator("[role=alert]").count() else None
        if name=="phone": pg.screenshot(path=f"{OUT}/apply_phone_errors.png")
        f=pg.fill
        f("#first-name","Ann"); f("#last-name","Lee"); f("#street","1 Palm St"); f("#city","Dubai"); f("#region","Dubai"); f("#postal","00000")
        pg.select_option("#country","United Arab Emirates"); f("#birth-date","1990-05-04"); f("#email","ann@example.com")
        pg.select_option("#marital","Married"); f("#dependents","2"); pg.click("text=Tenant"); pg.click("label[for=second-applicant-1]")
        pg.click("text=Next Page"); pg.wait_for_timeout(700)
        info["step2"]=pg.locator("#employer").count()==1
        pg.click("text=Employed full-time"); f("#employer","Acme"); f("#job-title","Engineer"); f("#years-employed","4"); f("#annual-income","85000")
        pg.select_option("#pay-frequency","Monthly")
        if name=="desktop": pg.screenshot(path=f"{OUT}/apply_desktop_step2.png",full_page=True)
        pg.click("text=Next Page"); pg.wait_for_timeout(700)
        info["step3"]=pg.locator("#property-value").count()==1
        pg.click("text=Buy a home"); pg.select_option("#property-type","Villa"); f("#property-city","Dubai"); pg.select_option("#property-country","United Arab Emirates")
        f("#property-value","500000"); f("#down-payment","100000"); pg.click("text=25 years")
        info["ltv"]=pg.locator("text=Loan-to-value").locator("xpath=..").inner_text()
        # back keeps data?
        pg.click("text=Back"); pg.wait_for_timeout(600); info["back_keeps"]=pg.input_value("#employer"); pg.click("text=Next Page"); pg.wait_for_timeout(600)
        info["value_kept"]=pg.input_value("#property-value")
        pg.check("#consent")
        if name=="desktop": pg.screenshot(path=f"{OUT}/apply_desktop_step3.png",full_page=True)
        pg.click("text=Submit Demo Application"); pg.wait_for_timeout(900)
        info["success"]=pg.locator("[role=status]").inner_text()[:80] if pg.locator("[role=status]").count() else None
        pg.screenshot(path=f"{OUT}/apply_{name}_success.png")
        info.update(console=cons,failed=fails,requests_during_form=[r for r in reqs if "/assets/" not in r and "fonts" not in r],url=pg.url)
        res[name]=info; ctx.close()
    b.close()
print(json.dumps(res,indent=1))
