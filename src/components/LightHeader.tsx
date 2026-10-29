import { useEffect, useId, useRef, useState } from "react"
import { Menu, X } from "lucide-react"
import { APPLY_URL, BASE } from "./Header"
import { Logo } from "./Logo"
import { BiLabel } from "../i18n/Ar"
import { pickerLinkPropsFor } from "./LoanTypePicker"
import { CurrencySelect } from "./CurrencySelect"

/** overlay: header floats over the dark hero video (white logo/nav) and turns light after scrolling. */
export function LightHeader({ overlay = false, links, applyUrl = APPLY_URL }: { overlay?: boolean; links?: [string, string][]; applyUrl?: string }) {
  const pickerLinkProps = pickerLinkPropsFor(applyUrl)
  const [scrolled, setScrolled] = useState(!overlay)
  useEffect(() => {
    if (!overlay) return
    const on = () => setScrolled(window.scrollY > 24)
    on(); window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [overlay])
  const dark = overlay && !scrolled
  const navLinks = links ?? [["#loan-types", "Loans"], ["#how", "How it works"], ["#why-us", "Why us"], [APPLY_URL, "Apply"]]
  const linkProps = (href: string) => (href === APPLY_URL ? pickerLinkProps : { href })
  // 640-1023px: the nav collapses into a "Menu" disclosure (the full nav does not fit beside currency + Apply)
  const [menu, setMenu] = useState(false)
  const menuId = useId(), menuBtn = useRef<HTMLButtonElement>(null), wrap = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!menu) return
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { setMenu(false); menuBtn.current?.focus() } }
    const off = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setMenu(false) }
    const wide = () => { if (window.innerWidth >= 1024) setMenu(false) }
    document.addEventListener("keydown", key); document.addEventListener("pointerdown", off); window.addEventListener("resize", wide)
    return () => { document.removeEventListener("keydown", key); document.removeEventListener("pointerdown", off); window.removeEventListener("resize", wide) }
  }, [menu])
  return (
    <header
      className={`${overlay ? "fixed inset-x-0" : "sticky"} top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300 ${
        dark ? "border-white/10 bg-gradient-to-b from-[#120d33]/60 to-transparent" : "border-[#3B2BBF]/10 bg-white/85 shadow-[0_8px_30px_-24px_rgba(59,43,191,.5)] backdrop-blur-md"
      }`}
    >
      <div ref={wrap} className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8 sm:py-3.5 lg:gap-6">
        <a href={BASE} aria-label="Avant Loans Middle East home" className="inline-flex min-h-11 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">
          <Logo className="h-9 sm:h-11 lg:h-12" variant={dark ? "white" : "color"} />
        </a>
        <nav aria-label="Main" className={`hidden min-w-0 items-center gap-6 text-sm font-semibold whitespace-nowrap lg:flex xl:gap-8 ${dark ? "text-white/85" : "text-slate-600"}`}>
          {navLinks.map(([href, label]) => (
            <a key={label} {...linkProps(href)} className={`inline-flex min-h-11 items-center rounded px-2 -mx-2 focus-visible:outline-2 focus-visible:outline-offset-0 ${dark ? "hover:text-white focus-visible:outline-white" : "hover:text-[#3B2BBF] focus-visible:outline-[#3B2BBF]"}`}>{label}</a>
          ))}
        </nav>
        <div className="flex flex-none items-center gap-3">
        <CurrencySelect dark={dark} />
        <a
          {...pickerLinkProps}
          data-testid="header-apply"
          className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-4 py-2.5 sm:px-5 sm:py-1.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
            dark ? "bg-white text-[#3B2BBF] hover:bg-[#F3F0FF] focus-visible:outline-white" : "bg-[#3B2BBF] text-white shadow-[0_10px_28px_-12px_rgba(59,43,191,.8)] hover:bg-[#2f22a0] focus-visible:outline-[#3B2BBF]"
          }`}
        >
          {/* phone: single line; a stacked Arabic line would make the header ~9px taller */}<span className="sm:hidden">Apply</span><span className="hidden sm:inline"><BiLabel en="Apply for Loan" arClass={dark ? "!text-[#3B2BBF]/80" : "!text-white/85"} /></span>
        </a>
        <button ref={menuBtn} type="button" data-testid="header-menu-button" aria-expanded={menu} aria-controls={menuId} onClick={() => setMenu((m) => !m)}
          className={`hidden h-11 w-11 items-center justify-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:inline-flex lg:hidden ${
            dark ? "border-white/30 bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white" : "border-[#3B2BBF]/20 bg-white text-[#3B2BBF] hover:bg-[#3B2BBF]/5 focus-visible:outline-[#3B2BBF]"}`}>
          {menu ? <X aria-hidden className="h-5 w-5" /> : <Menu aria-hidden className="h-5 w-5" />}<span className="sr-only">Menu</span>
        </button>
        </div>
        {menu && (
          <nav id={menuId} aria-label="Main menu" data-testid="header-menu-panel"
            className="absolute top-full right-5 mt-2 w-56 rounded-2xl border border-[#3B2BBF]/10 bg-white p-2 text-[15px] font-semibold text-slate-700 shadow-[0_24px_60px_-20px_rgba(26,20,70,.45)] sm:right-8 lg:hidden">
            {navLinks.map(([href, label]) => (
              <a key={label} {...linkProps(href)} onClick={(e) => { setMenu(false); (linkProps(href) as { onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void }).onClick?.(e) }}
                className="flex min-h-11 items-center rounded-xl px-3 py-2.5 hover:bg-[#3B2BBF]/[.06] hover:text-[#3B2BBF] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#3B2BBF]">{label}</a>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}
