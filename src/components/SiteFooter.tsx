import { Logo } from "./Logo"
import { COMPANY_LINE, COPYRIGHT, REGULATORY_LINE } from "../lib/legal"

/** Shared footer (home + apply): tagline, company + licence line with the regulatory note (small muted text), ©. */
export function SiteFooter() {
  return (
    <footer data-testid="site-footer" className="relative z-10 border-t border-[#3B2BBF]/10 bg-white px-5 py-12 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Logo className="h-11" />
        <p className="mt-3 max-w-sm text-sm text-slate-600">Simple, fast, and transparent personal loans.</p>
        <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 text-xs leading-relaxed text-slate-500 md:flex-row md:items-end md:justify-between md:gap-10">
          <p data-testid="company-line" className="max-w-3xl">
            <span className="font-medium text-slate-600">{COMPANY_LINE}</span> {REGULATORY_LINE}
          </p>
          <p className="flex-none">{COPYRIGHT}</p>
        </div>
      </div>
    </footer>
  )
}
