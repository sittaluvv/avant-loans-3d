import { motion, useReducedMotion } from "motion/react"
import { LightHeader } from "./components/LightHeader"
import { HeroVideo } from "./components/HeroVideo"
import { APPLY_URL } from "./components/Header"
import { WhyUs } from "./components/WhyUs"
import { LoanTypePicker, pickerLinkProps } from "./components/LoanTypePicker"
import { applyUrlFor, loanTypeById } from "./lib/loanTypes"
import { BiLabel } from "./i18n/Ar"
import { AR } from "./i18n/ar"
import { SiteFooter } from "./components/SiteFooter"
import { formatMoney, formatNumber, loanRange, useCurrency } from "./lib/currency"
import houseImg from "./assets/3d/fluent-house.webp"
import carImg from "./assets/3d/fluent-car.webp"
import moneyBag from "./assets/3d/fluent-money-bag.webp"
import briefcase from "./assets/3d/fluent-briefcase.webp"
import gradCap from "./assets/3d/fluent-grad-cap.webp"

const loanTypes = [
  { title: "Mortgage", key: "Mortgage", desc: "Buy or refinance a home", img: houseImg, alt: "3D house icon" },
  { title: "Auto", key: "Auto/Car", desc: "Finance a vehicle", img: carImg, alt: "3D car icon" },
  { title: "Personal", key: "Personal", desc: "Flexible everyday funds", img: moneyBag, alt: "3D money bag icon" },
  { title: "Business", key: "Business", desc: "Grow your company", img: briefcase, alt: "3D briefcase icon" },
  { title: "Education", key: "Education", desc: "School and training", img: gradCap, alt: "3D graduation cap icon" },
]

const AR_APPLY = AR["Apply"]

const steps = [
  { n: "01", t: "Choose a loan", d: "Pick mortgage, auto, personal, business or education." },
  { n: "02", t: "Tell us about you", d: "Complete a short online form and choose WhatsApp or email for contact." },
  { n: "03", t: "We contact you", d: "Our team reviews every enquiry and contacts you by WhatsApp or email." },
]

/** "SAR 4,000 – 281,000" for a loan type, in the visitor's currency. */
function AmountRange({ type }: { type: string }) {
  const { code } = useCurrency()
  const r = loanRange(type, code)
  return (
    <p data-testid="card-range" className="mt-3 rounded-full bg-[#3B2BBF]/[.06] px-3 py-1 text-xs font-semibold tabular-nums text-[#3B2BBF]">
      {formatMoney(r.min, code)} – {formatNumber(r.max)}
    </p>
  )
}

export default function App() {
  const reduced = useReducedMotion()
  return (
    <div className="min-h-svh overflow-x-hidden bg-[linear-gradient(180deg,#F3F0FF_0%,#F3F0FF_12%,#FFFFFF_40%,#FFFFFF_100%)] text-slate-900 antialiased">
      <a href={APPLY_URL} className="sr-only z-[60] rounded-full bg-[#3B2BBF] px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4">
        Skip to application
      </a>
      <LightHeader overlay />
      <LoanTypePicker />

      <main>
        {/* HERO: original boardroom handshake video */}
        <HeroVideo />

        {/* LOAN TYPES */}
        <section id="loan-types" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Pick the loan that fits
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">
              Five products, one short application. Choose a type to start.
            </p>
            <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {loanTypes.map((l, i) => (
                <motion.li
                  key={l.title}
                  initial={reduced ? false : { opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-8% 0px" }}
                  transition={{ delay: i * 0.06, duration: 0.45 }}
                >
                  <a
                    href={applyUrlFor(APPLY_URL, loanTypeById(l.key)?.slug ?? "personal")}
                    data-testid={`card-${loanTypeById(l.key)?.slug}`}
                    className="glass-light group flex h-full flex-col items-center rounded-3xl p-5 text-center transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF]"
                  >
                    <img src={l.img} alt={l.alt} width={256} height={256} className="h-20 w-20 object-contain drop-shadow-md transition-transform group-hover:scale-110 sm:h-24 sm:w-24" loading="lazy" />
                    <h3 className="mt-4 font-display text-lg font-bold text-slate-900">{l.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{l.desc}</p>
                    <AmountRange type={l.key} />
                    <span className="mt-auto pt-4 text-sm font-semibold text-[#3B2BBF]"><span className="inline-flex flex-col items-center leading-tight"><span>Apply →</span><span lang="ar" dir="rtl" className="ar-sub block text-center">{AR_APPLY}</span></span></span>
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>
        </section>

        {/* HOW */}
        <section id="how" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">How it works</h2>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((s) => (
                <li key={s.n} className="rounded-3xl border border-slate-200/80 bg-white/80 p-6">
                  <span className="font-display text-sm font-extrabold text-[#3B2BBF]">{s.n}</span>
                  <h3 className="mt-2 font-display text-xl font-bold text-slate-900">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* WHY US (honest feature list) */}
        <WhyUs />

        {/* FINAL CTA */}
        <section aria-label="Apply" className="px-5 pb-20 sm:px-8">
          <div className="mx-auto max-w-4xl rounded-[28px] bg-gradient-to-br from-[#4B3BDF] to-[#2A1D9E] px-6 py-10 text-center text-white shadow-[0_30px_60px_-30px_rgba(59,43,191,.8)] sm:px-12">
            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Ready to move forward?</h2>
            <p className="mx-auto mt-2 max-w-lg text-white/80">Apply online in a few short steps.</p>
            <a
              {...pickerLinkProps}
              data-testid="cta-apply"
              className="mt-6 inline-flex rounded-full bg-white px-8 py-2.5 text-base font-semibold text-[#3B2BBF] hover:bg-[#F3F0FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <BiLabel en="Apply for Loan" arClass="!text-[#3B2BBF]/80" />
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
