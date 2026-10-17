import { useEffect, useState } from "react"
import { APPLY_URL, BASE } from "./Header"
import { Logo } from "./Logo"
import { pickerLinkProps } from "./LoanTypePicker"
import { CurrencySelect } from "./CurrencySelect"

/** overlay: header floats over the dark hero video (white logo/nav) and turns light after scrolling. */
export function LightHeader({ overlay = false, links }: { overlay?: boolean; links?: [string, string][] }) {
  const [scrolled, setScrolled] = useState(!overlay)
  useEffect(() => {
    if (!overlay) return
    const on = () => setScrolled(window.scrollY > 24)
    on(); window.addEventListener("scroll", on, { passive: true })
    return () => window.removeEventListener("scroll", on)
  }, [overlay])
  const dark = overlay && !scrolled
  return (
    <header
      className={`${overlay ? "fixed inset-x-0" : "sticky"} top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300 ${
        dark ? "border-white/10 bg-gradient-to-b from-[#120d33]/60 to-transparent" : "border-[#3B2BBF]/10 bg-white/85 shadow-[0_8px_30px_-24px_rgba(59,43,191,.5)] backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8 sm:py-3.5">
        <a href={BASE} aria-label="Avant Loans Middle East home" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">
          <Logo className="h-9 sm:h-11 lg:h-12" variant={dark ? "white" : "color"} />
        </a>
        <nav aria-label="Main" className={`hidden items-center gap-8 text-sm font-semibold md:flex ${dark ? "text-white/85" : "text-slate-600"}`}>
          {(links ?? [["#loan-types", "Loans"], ["#how", "How it works"], ["#why-us", "Why us"], [APPLY_URL, "Apply"]]).map(([href, label]) => (
            <a key={label} {...(href === APPLY_URL ? pickerLinkProps : { href })} className={dark ? "hover:text-white" : "hover:text-[#3B2BBF]"}>{label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
        <CurrencySelect dark={dark} />
        <a
          {...pickerLinkProps}
          data-testid="header-apply"
          className={`whitespace-nowrap rounded-full px-4 py-2.5 sm:px-5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
            dark ? "bg-white text-[#3B2BBF] hover:bg-[#F3F0FF] focus-visible:outline-white" : "bg-[#3B2BBF] text-white shadow-[0_10px_28px_-12px_rgba(59,43,191,.8)] hover:bg-[#2f22a0] focus-visible:outline-[#3B2BBF]"
          }`}
        >
          <span className="sm:hidden">Apply</span><span className="hidden sm:inline">Apply for Loan</span>
        </a>
        </div>
      </div>
    </header>
  )
}
