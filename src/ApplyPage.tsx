import { ArrowLeft } from "lucide-react"
import { BASE } from "./components/Header"
import { Logo } from "./components/Logo"
import { MortgageForm } from "./components/MortgageForm"
import { CurrencySelect } from "./components/CurrencySelect"
import { SiteFooter } from "./components/SiteFooter"

export default function ApplyPage() {
  return (
    <div className="min-h-svh overflow-x-hidden bg-[linear-gradient(180deg,#F3F0FF_0%,#FFFFFF_45%,#FFFFFF_100%)] text-slate-900 antialiased">
      <a href="#main" className="sr-only z-[60] rounded-full bg-[#3B2BBF] px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4">
        Skip to form
      </a>
      <div aria-hidden className="pointer-events-none fixed -top-24 right-[-10%] h-80 w-80 rounded-full bg-[#3B2BBF]/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none fixed top-64 left-[-10%] h-64 w-64 rounded-full bg-[#F5C451]/15 blur-3xl" />

      <header className="sticky top-0 z-50 border-b border-[#3B2BBF]/10 bg-white/75 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8 sm:py-3.5">
          <a href={BASE} aria-label="Avant Loans Middle East home" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF]">
            <Logo className="h-8 min-[400px]:h-9 sm:h-11 lg:h-12" onDark={false} />
          </a>
          <div className="flex flex-none items-center gap-3">
            <CurrencySelect />
            <a
              href={BASE}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#3B2BBF]/25 bg-white px-3 py-2 text-sm sm:px-4 font-semibold text-[#3B2BBF] transition-colors hover:bg-[#3B2BBF]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF]"
            >
              <ArrowLeft aria-hidden className="h-4 w-4" /> <span className="sm:hidden">Home</span><span className="hidden sm:inline">Back to home</span>
            </a>
          </div>
        </div>
      </header>

      <main id="main" className="relative z-10 mx-auto max-w-4xl px-4 pt-6 pb-20 sm:px-6 sm:pt-10">
        <MortgageForm />
      </main>

      <SiteFooter />
    </div>
  )
}
