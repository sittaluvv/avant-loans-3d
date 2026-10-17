import { APPLY_URL, BASE } from "./Header"
import { Logo } from "./Logo"

/** Light sticky header matching the clean white marketing homepage. */
export function LightHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8 sm:py-4">
        <a href={BASE} aria-label="Avant Loans Middle East home" className="rounded-lg">
          <Logo className="h-10 sm:h-12" onDark={false} />
        </a>
        <nav aria-label="Main" className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a href="#benefits" className="hover:text-slate-900">Why Avant</a>
          <a href="#how" className="hover:text-slate-900">How it works</a>
          <a href={APPLY_URL} className="hover:text-slate-900">Apply</a>
        </nav>
        <a href={APPLY_URL}
          className="rounded-lg bg-[#0D5BFF] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0A4ACC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5BFF]">
          Apply for Loan
        </a>
      </div>
    </header>
  )
}
