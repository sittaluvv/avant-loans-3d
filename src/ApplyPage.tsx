import { Header } from "./components/Header"
import { Footer } from "./components/Footer"
import { Backdrop } from "./components/Backdrop"
import { MortgageForm } from "./components/MortgageForm"

export default function ApplyPage() {
  return (
    <div className="min-h-svh bg-abyss text-frost">
      <a href="#main" className="sr-only z-[60] rounded-full bg-electric px-4 py-2 focus:not-sr-only focus:fixed focus:top-4 focus:left-4">Skip to form</a>
      <Backdrop />
      <Header onApplyPage />
      <main id="main" className="relative z-10 mx-auto max-w-4xl px-4 pt-28 pb-20 sm:px-6 sm:pt-32">
        <div role="note" className="mb-8 rounded-2xl border border-amber-300/30 bg-amber-300/[.06] px-5 py-4 text-sm leading-relaxed text-amber-100/90">
          <strong className="font-semibold text-amber-100">Demo site.</strong> Avant Loans Middle East is a design concept. No real loans are offered. On submit, a summary is sent to Avant via Telegram for this demo — no loan is created.
        </div>
        <MortgageForm />
      </main>
      <Footer />
    </div>
  )
}
