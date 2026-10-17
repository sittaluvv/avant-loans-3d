import { motion, useReducedMotion } from "motion/react"
import { Quote, Star, Info } from "lucide-react"
import { reviews, REVIEWS_ARE_SAMPLES, type LoanKind } from "../data/reviews"

const chip: Record<LoanKind, string> = {
  Mortgage: "bg-[#3B2BBF]/10 text-[#3B2BBF]",
  Personal: "bg-violet-100 text-violet-700",
  Auto: "bg-sky-100 text-sky-700",
  Business: "bg-amber-100 text-amber-800",
  Education: "bg-emerald-100 text-emerald-700",
}
const avatar = ["from-[#5B4DFF] to-[#3B2BBF]", "from-[#2F6BFF] to-[#3B2BBF]", "from-[#7C6CFF] to-[#4F46E5]"]
const initials = (n: string) => n.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase()

export function Reviews() {
  const reduced = useReducedMotion()
  return (
    <section id="reviews" aria-labelledby="reviews-title" className="relative scroll-mt-24 overflow-hidden px-5 py-16 sm:px-8 sm:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-10 mx-auto h-72 max-w-4xl rounded-full bg-[#3B2BBF]/[.07] blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <div className="text-center">
          {REVIEWS_ARE_SAMPLES && (
            <p className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
              <Info aria-hidden className="h-3.5 w-3.5" />
              Sample reviews — replace with real customer feedback
            </p>
          )}
          <h2 id="reviews-title" className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            What borrowers could say
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Illustrative feedback showing the experience we're designing for. These are not real customer reviews.
          </p>
        </div>

        <motion.ul
          initial={reduced ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
          className="-mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pt-2 pb-6 [scrollbar-width:none] sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden"
          aria-label="Sample reviews (swipe to see more on phones)"
        >
          {reviews.map((r, i) => (
            <motion.li
              key={r.name + r.city}
              variants={{
                hidden: { opacity: 0, y: 22, rotateX: 8 },
                show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
              }}
              className="w-[84%] flex-none snap-center sm:w-auto"
              style={{ transformPerspective: 900 }}
            >
              <figure className="glass-light relative flex h-full flex-col rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-1">
                <Quote aria-hidden className="absolute top-5 right-5 h-8 w-8 text-[#3B2BBF]/10" />
                <div className="flex items-center gap-0.5" role="img" aria-label={`${r.rating} out of 5 stars (sample)`}>
                  {Array.from({ length: 5 }, (_, s) => (
                    <Star key={s} aria-hidden className={`h-4 w-4 ${s < r.rating ? "fill-[#F5C451] text-[#F5C451]" : "fill-slate-200 text-slate-200"}`} />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-slate-700">“{r.quote}”</blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span aria-hidden className={`flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gradient-to-br ${avatar[i % 3]} font-display text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(59,43,191,.7)]`}>
                    {initials(r.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-slate-900">{r.name}</span>
                    <span className="block text-sm text-slate-500">{r.city}</span>
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${chip[r.loan]}`}>{r.loan}</span>
                </figcaption>
              </figure>
            </motion.li>
          ))}
        </motion.ul>
        <p className="text-center text-xs text-slate-500 sm:hidden" aria-hidden>Swipe to see more →</p>
      </div>
    </section>
  )
}
