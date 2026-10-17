import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { Zap, Smartphone, Sparkles, ShieldCheck, Clock, Gauge, Lock, UserRound, Briefcase, Home } from "lucide-react"
import { Magnetic } from "./components/Magnetic"
import { TiltCard } from "./components/TiltCard"
import { Timeline } from "./components/Timeline"
import { Header, APPLY_URL } from "./components/Header"
import { Footer } from "./components/Footer"
import { Backdrop } from "./components/Backdrop"
import { CssCard } from "./components/CssCard"

const HeroScene = lazy(() => import("./components/HeroScene"))

function hasWebGL() {
  try {
    const c = document.createElement("canvas")
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")))
  } catch { return false }
}

function Hero() {
  const reduced = !!useReducedMotion()
  const wrap = useRef<HTMLElement>(null)
  const [active, setActive] = useState(true)
  const [gl, setGl] = useState<boolean | null>(null)
  useEffect(() => { setGl(hasWebGL()) }, [])
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0 })
    io.observe(el)
    const vis = () => setActive(!document.hidden && el.getBoundingClientRect().bottom > 0)
    document.addEventListener("visibilitychange", vis)
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", vis) }
  }, [])
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end start"] })
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -120])
  const textO = useTransform(scrollYProgress, [0, 0.8], [1, reduced ? 1 : 0])

  const headline = "Move forward with a personal loan."
  return (
    <section ref={wrap} id="top" className="relative overflow-hidden pt-20 md:min-h-[100svh] md:pt-24">
      <div aria-hidden className="gridfloor absolute inset-x-0 bottom-0 h-[55%] [transform:perspective(600px)_rotateX(60deg)] origin-bottom opacity-70" />
      <div className="relative h-[46svh] min-h-[300px] md:absolute md:inset-0 md:left-[40%] md:h-auto">
        {gl === false ? <CssCard animate={!reduced} /> : gl && (
          <Suspense fallback={<CssCard animate={false} />}>
            <HeroScene reduced={reduced} active={active} />
          </Suspense>
        )}
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden md:block md:bg-gradient-to-r md:from-abyss md:via-abyss/40 md:to-transparent" />
      <motion.div style={{ y: textY, opacity: textO }} className="relative mx-auto -mt-6 flex max-w-6xl flex-col px-5 pb-16 sm:px-8 md:mt-0 md:min-h-[calc(100svh-6rem)] md:justify-center md:pb-24">
        <div className="max-w-[600px]">
          <motion.p initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
            className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs text-mist sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-glow shadow-[0_0_10px_2px_rgba(143,211,255,.9)]" />
            No impact on your credit score to check
          </motion.p>
          <h1 className="display-xl chrome-text text-[clamp(2.35rem,5.6vw,4.7rem)]">
            {headline.split(" ").map((w, i) => (
              <motion.span key={i} className="inline-block pr-[0.22em]"
                initial={reduced ? false : { opacity: 0, y: 50, rotateX: -70, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.9, ease: [0.2, 0.7, 0.2, 1] }}
                style={{ transformOrigin: "50% 100%" }}>
                {w}
              </motion.span>
            ))}
          </h1>
          <motion.p initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-6 max-w-md text-lg leading-relaxed text-mist sm:text-xl">
            Simple, fast, and transparent. Check your options in minutes, then manage everything from your phone.
          </motion.p>
          <motion.div initial={reduced ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.6 }}
            className="mt-9 flex flex-wrap items-center gap-4">
            <Magnetic href={APPLY_URL} className="bg-electric px-8 py-4 text-lg text-white shadow-[0_10px_50px_-6px_rgba(13,91,255,1)] hover:bg-ion">
              Apply for Loan
            </Magnetic>
            <Magnetic href="#how" strength={0.2} className="glass px-7 py-4 text-frost hover:border-ion/50">
              See how it works
            </Magnetic>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

const benefits = [
  { icon: Zap, title: "Fast decisions", body: "Get a decision in minutes and funds as soon as the next business day.", stat: "Minutes" },
  { icon: Smartphone, title: "Easy to manage", body: "Track payments and manage your loan from your phone.", stat: "One app" },
  { icon: Sparkles, title: "Use it your way", body: "Home improvements, debt consolidation, or unexpected expenses.", stat: "Your call" },
]

function Benefits() {
  const reduced = useReducedMotion()
  return (
    <section id="benefits" className="relative mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8 md:py-32">
      <h2 className="display-xl max-w-2xl text-[clamp(2rem,4.6vw,3.6rem)]">Built to feel effortless.</h2>
      <p className="mt-5 max-w-xl text-lg text-mist">Three reasons people pick a personal loan they can actually understand.</p>
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {benefits.map((b, i) => {
          const Icon = b.icon
          return (
            <motion.div key={b.title} initial={reduced ? false : { opacity: 0, y: 50, rotateX: 25 }} whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }} transition={{ delay: i * 0.12, duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}>
              <TiltCard className="p-7 sm:p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-electric to-deep shadow-[0_10px_30px_-5px_rgba(13,91,255,.9)]" style={{ transform: "translateZ(30px)" }}>
                  <Icon aria-hidden className="h-7 w-7 text-white" />
                </div>
                <p className="mt-10 font-display text-4xl font-semibold text-glow/90">{b.stat}</p>
                <h3 className="mt-3 font-display text-xl font-semibold">{b.title}</h3>
                <p className="mt-2 leading-relaxed text-mist">{b.body}</p>
              </TiltCard>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

function How() {
  return (
    <section id="how" className="relative scroll-mt-24 px-5 py-24 sm:px-8 md:py-32">
      <div className="mx-auto mb-16 max-w-6xl md:text-center">
        <h2 className="display-xl text-[clamp(2rem,4.6vw,3.6rem)]">How it works</h2>
        <p className="mt-5 text-lg text-mist md:mx-auto md:max-w-xl">Three simple steps. No impact on your credit score to check your options.</p>
      </div>
      <Timeline />
    </section>
  )
}

const trust = [
  { icon: ShieldCheck, text: "Soft check only: no impact on your credit score" },
  { icon: Clock, text: "Decisions in minutes" },
  { icon: Gauge, text: "Funds as soon as the next business day" },
  { icon: Smartphone, text: "Manage your loan from your phone" },
  { icon: Lock, text: "Demo form: nothing you type is ever sent" },
]

function TrustStrip() {
  const reduced = useReducedMotion()
  const row = [...trust, ...trust]
  return (
    <section aria-label="Why people trust the process" className="relative overflow-hidden border-y border-white/10 bg-navy/40 py-7">
      <div className={`flex w-max gap-12 ${reduced ? "flex-wrap justify-center w-auto px-6" : "animate-[marquee_38s_linear_infinite]"}`}>
        {(reduced ? trust : row).map((t, i) => {
          const Icon = t.icon
          return (
            <p key={i} aria-hidden={!reduced && i >= trust.length} className="flex items-center gap-3 whitespace-nowrap text-mist">
              <Icon aria-hidden className="h-5 w-5 text-glow" /> {t.text}
            </p>
          )
        })}
      </div>
      <style>{`@keyframes marquee{to{transform:translateX(-50%)}}`}</style>
    </section>
  )
}

const applySteps = [
  { icon: UserRound, n: "01", t: "Personal Details", d: "Name, address, birth date and household." },
  { icon: Briefcase, n: "02", t: "Employment & Income", d: "Where you work and what comes in each month." },
  { icon: Home, n: "03", t: "Mortgage Loan Details", d: "The property, your down payment and term." },
]

function Apply() {
  return (
    <section id="apply" className="relative mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8 md:py-32">
      <div className="glass edge-glow relative overflow-hidden rounded-[36px] p-7 sm:p-12">
        <div aria-hidden className="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-electric/30 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <h2 className="display-xl text-[clamp(2rem,4.6vw,3.6rem)]">Apply for a loan</h2>
            <p className="mt-5 max-w-md text-lg text-mist">It takes just a few minutes. No credit score impact to check your options.</p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Magnetic href={APPLY_URL} className="bg-electric px-8 py-4 text-lg text-white shadow-[0_10px_50px_-6px_rgba(13,91,255,1)] hover:bg-ion">
                Start your application
              </Magnetic>
            </div>
            <p className="mt-6 max-w-md rounded-2xl border border-amber-300/30 bg-amber-300/[.06] p-4 text-sm leading-relaxed text-amber-100/90">
              <strong className="font-semibold text-amber-100">Demo site.</strong> No real loans are offered, and the application form does not send, store or share any information.
            </p>
          </div>
          <ol className="grid gap-3">
            {applySteps.map((s) => {
              const Icon = s.icon
              return (
                <li key={s.n}>
                  <a href={APPLY_URL} className="group flex items-center gap-5 rounded-2xl border border-white/10 bg-abyss/40 p-5 transition-colors hover:border-ion/50 hover:bg-electric/10">
                    <span className="font-display text-sm text-glow tabular-nums">{s.n}.</span>
                    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-electric to-deep"><Icon aria-hidden className="h-5 w-5" /></span>
                    <span><span className="block font-display font-semibold">{s.t}</span><span className="block text-sm text-mist">{s.d}</span></span>
                  </a>
                </li>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}

export default function App() {
  return (
    <>
      <a href={APPLY_URL} className="sr-only z-[60] rounded-full bg-electric px-4 py-2 focus:not-sr-only focus:fixed focus:top-4 focus:left-4">Skip to application</a>
      <Backdrop />
      <Header />
      <main className="relative z-10">
        <Hero />
        <TrustStrip />
        <Benefits />
        <How />
        <Apply />
      </main>
      <Footer />
    </>
  )
}
