import { motion, useReducedMotion } from "motion/react"
import { Zap, Smartphone, Sparkles, ShieldCheck, Clock, Lock } from "lucide-react"
import { LightHeader } from "./components/LightHeader"
import { APPLY_URL } from "./components/Header"
import { TiltCard } from "./components/TiltCard"
import { Logo } from "./components/Logo"
import heroImg from "./assets/home/hero-3d.webp"
import benefitFast from "./assets/home/benefit-fast.webp"
import benefitManage from "./assets/home/benefit-manage.webp"
import benefitFlex from "./assets/home/benefit-flex.webp"

const benefits = [
  { img: benefitFast, icon: Zap, title: "Fast decisions", body: "Get a decision in minutes and funds as soon as the next business day." },
  { img: benefitManage, icon: Smartphone, title: "Easy to manage", body: "Track payments and manage your loan from your phone." },
  { img: benefitFlex, icon: Sparkles, title: "Use it your way", body: "Home improvements, debt consolidation, or unexpected expenses." },
]

const steps = [
  { n: "1", title: "Apply online", body: "Fill out a short form in minutes. Checking your options won’t affect your credit score." },
  { n: "2", title: "Get a decision", body: "Receive a decision quickly so you know your options right away." },
  { n: "3", title: "Get funded", body: "Once approved and signed, funds can be available as soon as the next business day." },
]

function Hero() {
  const reduced = useReducedMotion()
  return (
    <section className="bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-20">
        <div>
          <motion.h1
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="font-display text-[clamp(2.4rem,5.2vw,3.75rem)] font-semibold leading-[1.1] tracking-tight text-slate-900"
          >
            Move forward with a personal loan
          </motion.h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-slate-600">
            Simple, fast, and transparent. Check your options in minutes — no impact on your credit score.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href={APPLY_URL}
              className="inline-flex items-center justify-center rounded-lg bg-[#0D5BFF] px-8 py-3.5 text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(13,91,255,.7)] transition-colors hover:bg-[#0A4ACC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5BFF]"
            >
              Apply for Loan
            </a>
          </div>
          <p className="mt-3 text-sm text-slate-500">Checking options won’t affect your credit score.</p>
        </div>
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="relative overflow-hidden"
          style={{ perspective: 1200 }}
        >
          <div className="pointer-events-none absolute inset-2 rounded-[32px] bg-[#0D5BFF]/10 blur-2xl" aria-hidden />
          <TiltCard className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 shadow-[0_25px_60px_-30px_rgba(15,23,42,.35)]">
            <img
              src={heroImg}
              alt="3D illustration of an Avant credit card floating among gold coins"
              width={1200}
              height={800}
              className="aspect-[3/2] w-full object-cover"
              fetchPriority="high"
            />
          </TiltCard>
        </motion.div>
      </div>
    </section>
  )
}

function Benefits() {
  const reduced = useReducedMotion()
  return (
    <section id="benefits" className="scroll-mt-24 bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {benefits.map((b, i) => {
            const Icon = b.icon
            return (
              <motion.div
                key={b.title}
                initial={reduced ? false : { opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
              >
                <TiltCard className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-sm">
                  <img src={b.img} alt="" width={640} height={420} loading="lazy" className="aspect-[3/2] w-full object-cover" />
                  <div className="p-6 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#0D5BFF]/10 text-[#0D5BFF]">
                      <Icon aria-hidden className="h-5 w-5" />
                    </div>
                    <h2 className="font-display text-xl font-semibold text-slate-900">{b.title}</h2>
                    <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{b.body}</p>
                  </div>
                </TiltCard>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function How() {
  return (
    <section id="how" className="scroll-mt-24 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <h2 className="text-center font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">How it works</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-slate-600">Three simple steps. No impact on your credit score to check your options.</p>
        <ol className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="relative rounded-2xl border border-slate-200 bg-slate-50/80 p-6 text-center">
              <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#0D5BFF] font-display text-sm font-bold text-white shadow-[0_0_0_4px_white,0_0_0_5px_#0D5BFF33]">{s.n}</span>
              <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{s.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 text-center">
          <a href={APPLY_URL} className="inline-flex rounded-lg bg-[#0D5BFF] px-8 py-3.5 text-base font-semibold text-white hover:bg-[#0A4ACC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0D5BFF]">
            Apply for Loan
          </a>
        </div>
      </div>
    </section>
  )
}

function Trust() {
  const items = [
    { icon: ShieldCheck, t: "Soft check only — no impact on your credit score" },
    { icon: Clock, t: "Decisions in minutes" },
    { icon: Lock, t: "Demo form — no real lender affiliation" },
  ]
  return (
    <section aria-label="Trust" className="border-y border-slate-200 bg-white py-6">
      <ul className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 text-sm text-slate-600 sm:px-8">
        {items.map((i) => {
          const Icon = i.icon
          return (
            <li key={i.t} className="flex items-center gap-2">
              <Icon aria-hidden className="h-4 w-4 text-[#0D5BFF]" /> {i.t}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function LightFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 px-5 py-12 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:justify-between">
        <div>
          <Logo className="h-11" onDark={false} />
          <p className="mt-3 max-w-sm text-sm text-slate-600">Simple, fast, and transparent personal loans. A design concept.</p>
        </div>
        <div className="max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-950/80">
          <p className="font-semibold text-amber-950">Important: this is a demo website.</p>
          <p className="mt-2">Avant Loans Middle East is not a real lender and is not affiliated with any real lender. No loans are offered here. The application form is for demonstration; submitting it does not create a real application.</p>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-xs text-slate-500">© 2026 Avant Loans Middle East. Demo site. Not affiliated with any real lender.</p>
    </footer>
  )
}

export default function App() {
  return (
    <div className="min-h-svh overflow-x-hidden bg-white text-slate-900 antialiased">
      <a href={APPLY_URL} className="sr-only z-[60] rounded-lg bg-[#0D5BFF] px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4">Skip to application</a>
      <LightHeader />
      <main>
        <Hero />
        <Benefits />
        <Trust />
        <How />
      </main>
      <LightFooter />
    </div>
  )
}
