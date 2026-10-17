import { useEffect, useRef } from "react"
import { motion, useReducedMotion } from "motion/react"
import Lenis from "lenis"
import { ArrowRight, BadgeCheck, ClipboardList, MessageCircle, ShieldCheck } from "lucide-react"
import { LightHeader } from "../components/LightHeader"
import { LoanTypePicker, pickerLinkPropsFor } from "../components/LoanTypePicker"
import { SiteFooter } from "../components/SiteFooter"
import { WhyUs } from "../components/WhyUs"
import { APPLY_V2_URL } from "../components/Header"
import { LOAN_TYPE_LIST, applyUrlFor } from "../lib/loanTypes"
import { COMPANY_LINE } from "../lib/legal"
import { BiLabel } from "../i18n/Ar"
import { Hero3D } from "./Hero3D"
import { Faq } from "./Faq"
import { ContactOptions } from "./ContactOptions"
import { StickyApply } from "./StickyApply"

const pickerLinkProps = pickerLinkPropsFor(APPLY_V2_URL)
const NAV: [string, string][] = [["#loan-types", "Loans"], ["#how", "How it works"], ["#why-us", "Why us"], ["#faq", "FAQ"]]

const STEPS = [
  { icon: ClipboardList, title: "Choose your loan", body: "Pick personal, auto, mortgage, business or education, then fill in a short online form." },
  { icon: ShieldCheck, title: "Share your details and ID", body: "Add your details and upload your ID over an encrypted connection. It is not stored on this website." },
  { icon: MessageCircle, title: "We contact you", body: "Our team reviews every enquiry and contacts you by WhatsApp or email, whichever you choose." },
]

/** Smooth scroll (Lenis, MIT). Off for reduced motion; overlays opt out with data-lenis-prevent. */
function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const lenis = new Lenis({ autoRaf: true, lerp: 0.12 })
    // In-page anchors: land the section just below the sticky header (scroll-margin is ignored to avoid double offsets).
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null
      const id = a?.getAttribute("href")?.slice(1)
      const el = id ? document.getElementById(id) : null
      if (!el) return
      e.preventDefault()
      const header = document.querySelector("header")?.getBoundingClientRect().height ?? 72
      const y = el.getBoundingClientRect().top + window.scrollY - header - 12
      lenis.scrollTo(Math.max(0, y), { onComplete: () => { history.replaceState(null, "", `#${id}`); (el as HTMLElement).focus?.({ preventScroll: true }) } })
    }
    document.addEventListener("click", onClick)
    return () => { document.removeEventListener("click", onClick); lenis.destroy() }
  }, [enabled])
}

const rise = (reduced: boolean | null, delay = 0) => ({
  initial: reduced ? false : { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-8% 0px" },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
})

export default function V2App() {
  const reduced = useReducedMotion()
  useSmoothScroll(!reduced)
  const heroCta = useRef<HTMLAnchorElement>(null)
  const finalCta = useRef<HTMLElement>(null)

  return (
    <div className="min-h-svh overflow-x-clip bg-white text-slate-900 antialiased">
      <a href="#loan-types" className="sr-only z-[60] rounded-full bg-[#3B2BBF] px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4">Skip to loan types</a>
      <LightHeader links={NAV} applyUrl={APPLY_V2_URL} />
      <LoanTypePicker showRanges={false} applyUrl={APPLY_V2_URL} />

      <main>
        {/* HERO */}
        <section aria-labelledby="v2-hero-title" className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#F3F0FF_0%,#F7F5FF_55%,#FFFFFF_100%)]">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_80%_20%,rgba(47,107,255,.10),transparent_60%),radial-gradient(40%_40%_at_10%_80%,rgba(59,43,191,.08),transparent_60%)]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[.35] [background-image:linear-gradient(rgba(59,43,191,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(59,43,191,.07)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(70%_60%_at_50%_30%,#000,transparent)]" />
          <div className="mx-auto grid max-w-6xl items-center gap-6 px-5 pt-10 pb-14 sm:px-8 sm:pt-14 md:pb-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pt-16">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#3B2BBF]/15 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#3B2BBF] shadow-sm backdrop-blur sm:text-sm">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#2F6BFF]" /> Avant Middle East · Dubai
              </p>
              <h1 id="v2-hero-title" className="mt-5 font-display text-[clamp(2.5rem,5.4vw,4.4rem)] font-extrabold leading-[1.03] tracking-[-0.03em] text-slate-900">
                Move forward with a{" "}
                <span className="bg-gradient-to-r from-[#3B2BBF] via-[#4B3BDF] to-[#2F6BFF] bg-clip-text text-transparent">personal loan</span>
              </h1>
              <p lang="ar" dir="rtl" className="mt-3 text-left font-['IBM_Plex_Sans_Arabic'] text-lg font-medium text-[#3B2BBF]/75">
                تمويل شخصي بخطوات بسيطة
              </p>
              <p className="mt-4 max-w-lg text-lg leading-relaxed text-slate-600">
                Personal, auto, mortgage, business and education loans for the Gulf. Apply online in a few short steps and our team will contact you by WhatsApp or email.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <a ref={heroCta} {...pickerLinkProps} data-testid="hero-apply"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#3B2BBF] px-8 py-3 text-base font-semibold text-white shadow-[0_18px_40px_-14px_rgba(59,43,191,.9)] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#2f22a0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF] motion-reduce:hover:translate-y-0">
                  <BiLabel en="Apply now" arClass="!text-white/85" /> <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a href="#how" className="text-sm font-semibold text-[#3B2BBF] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF]">How it works</a>
              </div>
              <p data-testid="hero-licence" className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
                <BadgeCheck aria-hidden className="mt-0.5 h-4 w-4 flex-none text-[#3B2BBF]" /> {COMPANY_LINE.replace(/\.$/, "")}
              </p>
              <div className="mt-7">
                <p className="text-xs font-semibold tracking-[0.14em] text-slate-400 uppercase">Or start with</p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {LOAN_TYPE_LIST.map((t) => (
                    <li key={t.slug}>
                      <a href={applyUrlFor(APPLY_V2_URL, t.slug)} data-testid={`chip-${t.slug}`}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pr-3.5 pl-1.5 text-sm font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,.05)] transition-all hover:-translate-y-0.5 hover:border-[#3B2BBF]/40 hover:text-[#3B2BBF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF] motion-reduce:hover:translate-y-0">
                        <img src={t.img} alt="" width={256} height={256} className="h-7 w-7 object-contain" />
                        {t.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
              <Hero3D />
            </div>
          </div>
        </section>

        {/* LOAN TYPES */}
        <section id="loan-types" tabIndex={-1} aria-labelledby="v2-loans-title" className="outline-none scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <motion.div {...rise(reduced)} className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold tracking-[0.14em] text-[#2F6BFF] uppercase">Loans</p>
                <h2 id="v2-loans-title" className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">A loan for what's next</h2>
              </div>
              <p className="max-w-md text-slate-600">Choose a product to start. Each one opens the application with your choice already selected.</p>
            </motion.div>
            <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
              {LOAN_TYPE_LIST.map((t, i) => (
                <motion.li key={t.slug} {...rise(reduced, i * 0.05)} className={i === LOAN_TYPE_LIST.length - 1 ? "col-span-2 md:col-span-1" : ""}>
                  <a href={applyUrlFor(APPLY_V2_URL, t.slug)} data-testid={`card-${t.slug}`}
                    className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#3B2BBF]/10 bg-gradient-to-b from-white to-[#F7F5FF] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#3B2BBF]/30 hover:shadow-[0_28px_60px_-34px_rgba(59,43,191,.75)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF] motion-reduce:hover:translate-y-0 sm:p-6">
                    <span aria-hidden className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-[#2F6BFF]/10 blur-2xl transition-opacity group-hover:opacity-100 sm:opacity-60" />
                    <img src={t.img} alt="" width={256} height={256} loading="lazy" className="relative h-16 w-16 object-contain drop-shadow-[0_12px_14px_rgba(59,43,191,.25)] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 sm:h-20 sm:w-20" />
                    <h3 className="relative mt-5 font-display text-lg font-bold text-slate-900">{t.label}</h3>
                    <p className="relative mt-1 text-sm text-slate-600">{t.hint}</p>
                    <span className="relative mt-auto inline-flex items-center gap-1 pt-5 text-sm font-semibold text-[#3B2BBF]">
                      Start <ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" tabIndex={-1} aria-labelledby="v2-how-title" className="outline-none scroll-mt-24 bg-[#F7F5FF] px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <motion.div {...rise(reduced)} className="text-center">
              <p className="text-sm font-semibold tracking-[0.14em] text-[#2F6BFF] uppercase">How it works</p>
              <h2 id="v2-how-title" className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Three clear steps</h2>
            </motion.div>
            <ol className="relative mt-12 grid gap-5 md:grid-cols-3 md:gap-6">
              <span aria-hidden className="absolute top-9 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-[#3B2BBF]/0 via-[#3B2BBF]/30 to-[#3B2BBF]/0 md:block" />
              {STEPS.map((s, i) => (
                <motion.li key={s.title} {...rise(reduced, i * 0.08)} className="relative rounded-3xl border border-[#3B2BBF]/10 bg-white p-6 shadow-[0_24px_60px_-44px_rgba(59,43,191,.6)] sm:p-7">
                  <div className="flex items-center gap-4">
                    <span className="relative flex h-[72px] w-[72px] flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-[#4B3BDF] to-[#2F6BFF] text-white shadow-[0_18px_30px_-14px_rgba(59,43,191,.9)]">
                      <s.icon aria-hidden className="h-7 w-7" />
                      <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white font-display text-xs font-extrabold text-[#3B2BBF] shadow ring-1 ring-[#3B2BBF]/15">{i + 1}</span>
                    </span>
                    <h3 className="font-display text-xl font-bold text-slate-900">{s.title}</h3>
                  </div>
                  <p className="mt-4 leading-relaxed text-slate-600">{s.body}</p>
                </motion.li>
              ))}
            </ol>
            <motion.div {...rise(reduced, 0.1)} className="mt-10 flex justify-center">
              <a {...pickerLinkProps} data-testid="how-apply" className="inline-flex items-center gap-2 rounded-full bg-[#3B2BBF] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_14px_34px_-14px_rgba(59,43,191,.9)] hover:bg-[#2f22a0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF]">
                Start your application <ArrowRight aria-hidden className="h-4 w-4" />
              </a>
            </motion.div>
          </div>
        </section>

        {/* WHY US (honest) */}
        <WhyUs />

        {/* FAQ */}
        <section id="faq" tabIndex={-1} aria-labelledby="v2-faq-title" className="outline-none scroll-mt-24 px-5 pb-16 sm:px-8 sm:pb-24">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
            <motion.div {...rise(reduced)}>
              <p className="text-sm font-semibold tracking-[0.14em] text-[#2F6BFF] uppercase">FAQ</p>
              <h2 id="v2-faq-title" className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Questions, answered</h2>
              <p className="mt-3 max-w-sm text-slate-600">Straight answers about applying, documents, currencies and how we get in touch.</p>
              <div className="mt-6"><ContactOptions /></div>
            </motion.div>
            <motion.div {...rise(reduced, 0.08)}><Faq /></motion.div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section ref={finalCta} aria-labelledby="v2-cta-title" className="px-5 pb-20 sm:px-8 sm:pb-24">
          <motion.div {...rise(reduced)} className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-[#1a1446] px-6 py-12 text-white sm:px-14 sm:py-16">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_80%_at_90%_10%,rgba(47,107,255,.45),transparent_60%),radial-gradient(50%_70%_at_0%_100%,rgba(75,59,223,.55),transparent_60%)]" />
            <div className="relative grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 id="v2-cta-title" className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Ready when you are</h2>
                <p className="mt-3 max-w-lg text-white/80">Choose your loan type and send your enquiry online. Our team will review it and contact you by WhatsApp or email.</p>
                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <a {...pickerLinkProps} data-testid="cta-apply" className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-base font-semibold text-[#3B2BBF] hover:bg-[#F3F0FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                    <BiLabel en="Apply now" arClass="!text-[#3B2BBF]/80" /> <ArrowRight aria-hidden className="h-4 w-4" />
                  </a>
                  <ContactOptions dark />
                </div>
              </div>
              <div aria-hidden className="relative hidden h-44 md:block">
                {LOAN_TYPE_LIST.slice(0, 4).map((t, i) => (
                  <img key={t.slug} src={t.img} alt="" width={256} height={256} loading="lazy"
                    className="absolute h-24 w-24 object-contain drop-shadow-[0_18px_20px_rgba(0,0,0,.35)]"
                    style={{ left: `${[8, 38, 64, 30][i]}%`, top: `${[30, 0, 32, 58][i]}%`, transform: `rotate(${[-10, 6, 12, -4][i]}deg)` }} />
                ))}
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <SiteFooter />
      <div aria-hidden className="h-20 sm:hidden" />
      <StickyApply heroCta={heroCta} finalCta={finalCta} />
    </div>
  )
}
