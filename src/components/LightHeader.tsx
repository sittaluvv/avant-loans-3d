import { APPLY_URL, BASE } from "./Header"
import { Logo } from "./Logo"

export function LightHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#3B2BBF]/10 bg-white/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8 sm:py-3.5">
        <a href={BASE} aria-label="Avant Loans Middle East home" className="rounded-lg">
          <Logo className="h-9 sm:h-11 lg:h-12" onDark={false} />
        </a>
        <nav aria-label="Main" className="hidden items-center gap-8 text-sm font-semibold text-slate-600 md:flex">
          <a href="#loan-types" className="hover:text-[#3B2BBF]">Loans</a>
          <a href="#benefits" className="hover:text-[#3B2BBF]">Why Avant</a>
          <a href="#how" className="hover:text-[#3B2BBF]">How it works</a>
          <a href={APPLY_URL} className="hover:text-[#3B2BBF]">Apply</a>
        </nav>
        <a
          href={APPLY_URL}
          className="rounded-full bg-[#3B2BBF] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_-12px_rgba(59,43,191,.8)] transition-colors hover:bg-[#2f22a0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF]"
        >
          Apply for Loan
        </a>
      </div>
    </header>
  )
}
