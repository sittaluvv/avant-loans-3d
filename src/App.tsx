import { motion, useReducedMotion } from "motion/react"
import { LightHeader } from "./components/LightHeader"
import { HeroVideo } from "./components/HeroVideo"
import { APPLY_URL } from "./components/Header"
import { Logo } from "./components/Logo"
import { Reviews } from "./components/Reviews"
import houseImg from "./assets/3d/fluent-house.webp"
import carImg from "./assets/3d/fluent-car.webp"
import moneyBag from "./assets/3d/fluent-money-bag.webp"
import briefcase from "./assets/3d/fluent-briefcase.webp"
import gradCap from "./assets/3d/fluent-grad-cap.webp"
import moneyWings from "./assets/3d/fluent-money-wings.webp"
import chartUp from "./assets/3d/fluent-chart-up.webp"
import shield from "./assets/3d/fluent-shield.webp"
import bank from "./assets/3d/fluent-bank.webp"

const loanTypes = [
  { title: "Mortgage", desc: "Buy or refinance a home", img: houseImg, alt: "3D house icon" },
  { title: "Auto", desc: "Finance a vehicle", img: carImg, alt: "3D car icon" },
  { title: "Personal", desc: "Flexible everyday funds", img: moneyBag, alt: "3D money bag icon" },
  { title: "Business", desc: "Grow your company", img: briefcase, alt: "3D briefcase icon" },
  { title: "Education", desc: "School and training", img: gradCap, alt: "3D graduation cap icon" },
]

const benefits = [
  { title: "Fast approval", desc: "Decisions in minutes, not days.", img: moneyWings, alt: "3D money with wings icon" },
  { title: "Low rates", desc: "Competitive APR options you can compare.", img: chartUp, alt: "3D chart trending up icon" },
  { title: "Secure", desc: "Bank-grade privacy practices on every step.", img: shield, alt: "3D shield icon" },
  { title: "Trusted", desc: "Clear terms with no surprise fees in the demo flow.", img: bank, alt: "3D bank icon" },
]

const steps = [
  { n: "01", t: "Choose a loan", d: "Pick mortgage, auto, personal, business or education." },
  { n: "02", t: "Tell us about you", d: "A short form — checking options won’t hit your credit score." },
  { n: "03", t: "Get a decision", d: "See your options fast. This demo sends a summary to Avant via Telegram." },
]

export default function App() {
  const reduced = useReducedMotion()
  return (
    <div className="min-h-svh overflow-x-hidden bg-[linear-gradient(180deg,#F3F0FF_0%,#F3F0FF_12%,#FFFFFF_40%,#FFFFFF_100%)] text-slate-900 antialiased">
      <a href={APPLY_URL} className="sr-only z-[60] rounded-full bg-[#3B2BBF] px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4">
        Skip to application
      </a>
      <LightHeader overlay />

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
              Five products, one short demo application. Choose a type to start.
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
                    href={APPLY_URL}
                    className="glass-light group flex h-full flex-col items-center rounded-3xl p-5 text-center transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF]"
                  >
                    <img src={l.img} alt={l.alt} width={256} height={256} className="h-20 w-20 object-contain drop-shadow-md transition-transform group-hover:scale-110 sm:h-24 sm:w-24" loading="lazy" />
                    <h3 className="mt-4 font-display text-lg font-bold text-slate-900">{l.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{l.desc}</p>
                    <span className="mt-4 text-sm font-semibold text-[#3B2BBF]">Apply →</span>
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>
        </section>

        {/* BENEFITS */}
        <section id="benefits" className="scroll-mt-24 bg-white/60 px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Built to feel effortless
            </h2>
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((b, i) => (
                <motion.li
                  key={b.title}
                  initial={reduced ? false : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.45 }}
                  className="rounded-3xl border border-[#3B2BBF]/10 bg-white p-6 shadow-[0_20px_50px_-36px_rgba(59,43,191,.45)]"
                >
                  <img src={b.img} alt={b.alt} width={256} height={256} className="h-16 w-16 object-contain" loading="lazy" />
                  <h3 className="mt-4 font-display text-lg font-bold text-slate-900">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{b.desc}</p>
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

        {/* REVIEWS (sample data in src/data/reviews.ts) */}
        <Reviews />

        {/* FINAL CTA */}
        <section aria-label="Apply" className="px-5 pb-20 sm:px-8">
          <div className="mx-auto max-w-4xl rounded-[28px] bg-gradient-to-br from-[#4B3BDF] to-[#2A1D9E] px-6 py-10 text-center text-white shadow-[0_30px_60px_-30px_rgba(59,43,191,.8)] sm:px-12">
            <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Ready to move forward?</h2>
            <p className="mx-auto mt-2 max-w-lg text-white/80">Try the short demo application. It takes about three minutes.</p>
            <a
              href={APPLY_URL}
              className="mt-6 inline-flex rounded-full bg-white px-8 py-3.5 text-base font-semibold text-[#3B2BBF] hover:bg-[#F3F0FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Apply for Loan
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#3B2BBF]/10 bg-white px-5 py-12 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <Logo className="h-11" onDark={false} />
            <p className="mt-3 max-w-sm text-sm text-slate-600">Simple, fast, and transparent personal loans. A design concept.</p>
          </div>
          <div className="max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950/85">
            <p className="font-semibold text-amber-950">Important: this is a demo website.</p>
            <p className="mt-2">
              Avant Loans Middle East is not a real lender and is not affiliated with any real lender. No loans are offered here.
              The application form is for demonstration; submitting it does not create a real application.
            </p>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-6xl text-xs text-slate-500">
          © 2026 Avant Loans Middle East. Demo site. Not affiliated with any real lender.
        </p>
      </footer>
    </div>
  )
}
