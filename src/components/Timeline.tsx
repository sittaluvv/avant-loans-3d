import { motion, useReducedMotion, useScroll, useSpring } from "motion/react"
import { useRef } from "react"
import { ClipboardList, BadgeCheck, Banknote } from "lucide-react"

const steps = [
  { icon: ClipboardList, title: "Apply online", body: "Fill out a short form in minutes. Checking your options won’t affect your credit score.", time: "About 5 minutes" },
  { icon: BadgeCheck, title: "Get a decision", body: "Receive a decision quickly so you know your options right away.", time: "Minutes, not days" },
  { icon: Banknote, title: "Get funded", body: "Once approved and signed, funds can be available as soon as the next business day.", time: "As soon as next business day" },
]

export function Timeline() {
  const ref = useRef<HTMLOListElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] })
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 25 })
  return (
    <ol ref={ref} className="relative mx-auto max-w-3xl">
      <div aria-hidden className="absolute top-2 bottom-2 left-[27px] w-px bg-white/10 md:left-1/2" />
      <motion.div aria-hidden style={{ scaleY: reduced ? 1 : fill }} className="absolute top-2 bottom-2 left-[27px] w-px origin-top bg-gradient-to-b from-glow via-ion to-electric shadow-[0_0_18px_2px_rgba(13,91,255,.7)] md:left-1/2" />
      {steps.map((s, i) => {
        const Icon = s.icon
        const right = i % 2 === 1
        return (
          <motion.li
            key={s.title}
            initial={reduced ? false : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-15% 0px" }}
            transition={{ duration: 0.7, ease: [0.2, 0.7, 0.2, 1] }}
            className={`relative mb-14 grid grid-cols-[56px_1fr] gap-5 last:mb-0 md:grid-cols-2 md:gap-16 ${right ? "md:[&>div:last-child]:col-start-2" : ""}`}
          >
            <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-ion/40 bg-navy shadow-[0_0_30px_-4px_rgba(13,91,255,.8)] md:absolute md:left-1/2 md:-translate-x-1/2">
              <span className="sr-only">Step {i + 1}</span>
              <Icon aria-hidden className="h-6 w-6 text-glow" />
            </div>
            <div className={`glass rounded-3xl p-6 md:p-7 ${right ? "md:text-left" : "md:col-start-1 md:text-right"}`}>
              <p className="font-display text-sm text-glow/90">Step {i + 1} <span className="text-mist/70">/ {s.time}</span></p>
              <h3 className="mt-2 font-display text-xl font-semibold md:text-2xl">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-mist">{s.body}</p>
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}
