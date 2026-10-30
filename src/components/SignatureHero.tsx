import { motion, useReducedMotion, useSpring, useTransform } from "motion/react"
import { useEffect } from "react"
import { BiLabel } from "../i18n/Ar"
import { pickerLinkProps } from "./LoanTypePicker"
import { formatMoney, loanRange, useCurrency } from "../lib/currency"
import { setCalc, useCalc } from "../lib/calcStore"
import { ILLUSTRATIVE, TENURES, monthly } from "./LoanInfo"
import { tr } from "../i18n/lang"

/** Signature home moment: a soft glass orb whose size, glow and number react to the loan amount slider. */
export function SignatureHero() {
  const reduced = useReducedMotion()
  const { code } = useCurrency()
  const r = loanRange("Personal", code)
  const c = useCalc()
  const a = Math.min(Math.max(c.amt ?? r.default, r.min), r.max)
  const n = TENURES[c.ti]
  const m = monthly(a, ILLUSTRATIVE.aprPct, n)
  const p = (a - r.min) / (r.max - r.min || 1)
  const spring = useSpring(p, { stiffness: 120, damping: 18 })
  useEffect(() => { spring.set(p) }, [p, spring])
  const scale = useTransform(spring, [0, 1], [0.82, 1.08])
  const glow = useTransform(spring, [0, 1], [0.35, 0.85])
  const live = useSpring(m, { stiffness: 140, damping: 22 })
  useEffect(() => { live.set(m) }, [m, live])
  const monthTxt = useTransform(live, (v) => formatMoney(Math.round(v), code))

  return (
    <section aria-labelledby="hero-title" className="dark-surface relative isolate overflow-hidden bg-[#120d33] text-white">
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(70%_55%_at_70%_30%,rgba(98,78,255,.55),transparent_70%),radial-gradient(50%_40%_at_10%_90%,rgba(59,43,191,.5),transparent_70%),linear-gradient(180deg,#120d33,#1a1446)]" />
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 pt-24 pb-16 sm:px-8 sm:pt-28 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pt-32 lg:pb-24">
        <div className="order-2 lg:order-1">
          <p className="text-xs font-semibold tracking-[.18em] text-[#C9D6FF] uppercase">Dubai · Meydan</p>
          <motion.h1 id="hero-title" initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="mt-3 font-display text-[clamp(2.2rem,8vw,3.9rem)] font-extrabold leading-[1.05] tracking-tight">Personal loans, made calm.</motion.h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/80 sm:text-lg">Slide to explore an illustrative monthly payment, then apply in about 5 minutes. Our team contacts you by WhatsApp or email.</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a {...pickerLinkProps} data-testid="hero-apply" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-8 py-2.5 text-base font-semibold text-[#3B2BBF] shadow-[0_16px_40px_-12px_rgba(10,6,40,.9)] transition-transform hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              <BiLabel en="Apply for Loan" />
            </a>
            <a href="#calculator" className="inline-flex min-h-11 items-center text-sm font-semibold text-white/90 underline-offset-4 hover:underline">Full calculator</a>
          </div>
        </div>

        <div className="order-1 flex flex-col items-center lg:order-2" style={{ perspective: 900 }}>
          <motion.div aria-hidden style={{ scale, opacity: glow }} className="pointer-events-none absolute h-72 w-72 rounded-full bg-[#7B6BFF] blur-[70px] sm:h-96 sm:w-96" />
          <motion.div style={{ scale }} className="relative">
            <div className="orb-float glass-orb flex aspect-square w-[min(64vw,340px)] flex-col items-center justify-center rounded-full border border-white/25 text-center">
              <span className="text-[13px] font-medium text-white/70">{tr("How much do you need?")}</span>
              <span className="mt-1 font-display text-[clamp(1.9rem,9vw,2.9rem)] font-extrabold tabular-nums tracking-tight" data-no-i18n>{formatMoney(a, code)}</span>
              <span className="mt-3 rounded-full bg-white/12 px-3 py-1 text-sm font-semibold tabular-nums text-[#E4E9FF]"><motion.span data-no-i18n>{monthTxt}</motion.span> <span>{tr("per month · illustrative")}</span></span>
              <span className="mt-1 text-xs text-white/60">{tr("over")} <span data-no-i18n className="tabular-nums">{n}</span> {tr("months")}</span>
            </div>
          </motion.div>
          <div className="relative mt-6 w-full max-w-sm">
            <label htmlFor="hero-amt" className="sr-only">{tr("Amount")}</label>
            <input id="hero-amt" data-testid="hero-amount" type="range" min={r.min} max={r.max} step={r.step} value={a}
              onChange={(e) => setCalc({ amt: +e.target.value })} className="hero-range" style={{ ["--p" as string]: `${p * 100}%` }} />
            <div className="flex justify-between gap-2" role="group" aria-label={tr("Tenure")}>
              {[12, 24, 36, 60].map((t) => (
                <button key={t} type="button" onClick={() => setCalc({ ti: TENURES.indexOf(t) })} aria-pressed={n === t}
                  className={`min-h-11 flex-1 rounded-full text-sm font-semibold tabular-nums transition-colors ${n === t ? "bg-white text-[#3B2BBF]" : "bg-white/10 text-white/85 hover:bg-white/20"}`}>
                  {t}<span className="ms-1 text-xs font-medium opacity-70">{tr("mo")}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-center text-[11px] text-white/55">{tr("Illustrative figures only. Not a loan offer.")}</p>
          </div>
        </div>
      </div>
      <svg aria-hidden viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px h-8 w-full text-[#F3F0FF] sm:h-12"><path d="M0 60V30C240 0 480 0 720 18S1200 52 1440 24V60Z" fill="currentColor" /></svg>
    </section>
  )
}
