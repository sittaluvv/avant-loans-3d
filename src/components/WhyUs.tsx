import { motion, useReducedMotion } from "motion/react"
import moneyBag from "../assets/3d/fluent-money-bag.webp"
import creditCard from "../assets/3d/fluent-credit-card.webp"
import speech from "../assets/3d/fluent-speech-balloon.webp"
import locked from "../assets/3d/fluent-locked.webp"
import coin from "../assets/3d/fluent-coin.webp"
import city from "../assets/3d/fluent-cityscape.webp"

/** Honest feature list: facts about the site/service only (no ratings, statistics, rates, times or guarantees). */
const FEATURES = [
  { title: "Loans for every need", body: "Personal, Auto, Mortgage, Business and Education loans, all from one application.", img: moneyBag },
  { title: "Simple online application", body: "Apply online in a few short steps, on your phone or computer.", img: creditCard },
  { title: "WhatsApp or email, your choice", body: "Tell us how you prefer to be contacted and our team will reach you there.", img: speech },
  { title: "Secure ID upload", body: "Your ID is sent over an encrypted connection only to our team and is never stored on this website.", img: locked },
  { title: "Your local currency", body: "See amounts in SAR, AED, QAR, KWD, BHD, OMR or USD.", img: coin },
  { title: "Based in Dubai, serving the Gulf", body: "A Dubai-based team focused on customers across the GCC.", img: city },
]

export function WhyUs() {
  const reduced = useReducedMotion()
  return (
    <section id="why-us" aria-labelledby="why-us-title" className="relative scroll-mt-24 overflow-hidden px-5 py-16 sm:px-8 sm:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-10 mx-auto h-72 max-w-4xl rounded-full bg-[#3B2BBF]/[.07] blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <div className="text-center">
          <h2 id="why-us-title" className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Why choose Avant Middle East
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">A straightforward way to ask about a loan, built for the Gulf.</p>
        </div>
        <motion.ul
          initial={reduced ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
        >
          {FEATURES.map((f) => (
            <motion.li
              key={f.title}
              variants={{ hidden: { opacity: 0, y: 22, rotateX: 8 }, show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } } }}
              style={{ transformPerspective: 900 }}
            >
              <div className="glass-light flex h-full items-start gap-4 rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-1">
                <img src={f.img} alt="" width={256} height={256} loading="lazy" className="h-16 w-16 flex-none object-contain drop-shadow-md" />
                <div>
                  <h3 className="font-display text-lg font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.body}</p>
                </div>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}
