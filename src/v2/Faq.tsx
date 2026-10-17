import { useId, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Plus } from "lucide-react"
import { REGULATORY_LINE } from "../lib/legal"

/** Honest, generic answers only (no invented criteria, times, rates or guarantees). */
export const FAQS: { q: string; a: string }[] = [
  { q: "Who can apply?", a: "Anyone in the Gulf region can send an enquiry through the online form. Eligibility depends on the loan type and your circumstances, and our team will explain the requirements when they contact you." },
  { q: "What documents do I need?", a: "To start, a valid ID: passport, resident card (for example Emirates ID or Iqama) or national ID. Upload the front, plus the back for ID cards. Depending on the loan, our team may ask for further documents, such as proof of income, and will tell you exactly what is needed." },
  { q: "Which currencies can I use?", a: "Amounts are shown in your local currency: SAR, AED, QAR, KWD, BHD or OMR, or USD. We pick one based on your region, and you can change it at any time from the header." },
  { q: "How will you contact me?", a: "You choose WhatsApp or email at the end of the form and confirm the number or address. Our team uses it to get in touch about your enquiry." },
  { q: "Is my ID kept secure?", a: "Your ID is sent over an encrypted connection only to our team, and only when you submit. It is not stored on this website." },
  { q: "Is submitting the form a loan offer?", a: `No. Submitting is an enquiry, not a loan offer or approval. ${REGULATORY_LINE}` },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)
  const reduced = useReducedMotion()
  const base = useId()
  return (
    <div className="divide-y divide-[#3B2BBF]/10 rounded-3xl border border-[#3B2BBF]/10 bg-white shadow-[0_24px_60px_-40px_rgba(59,43,191,.45)]">
      {FAQS.map((f, i) => {
        const isOpen = open === i
        const bid = `${base}-b${i}`, pid = `${base}-p${i}`
        return (
          <div key={f.q}>
            <h3>
              <button id={bid} type="button" aria-expanded={isOpen} aria-controls={pid} onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 px-5 py-5 text-left font-display text-base font-semibold text-slate-900 transition-colors hover:text-[#3B2BBF] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#3B2BBF] sm:px-7 sm:text-lg">
                {f.q}
                <span aria-hidden className={`flex h-8 w-8 flex-none items-center justify-center rounded-full border transition-all duration-300 ${isOpen ? "rotate-45 border-[#3B2BBF] bg-[#3B2BBF] text-white" : "border-slate-200 text-slate-500"}`}>
                  <Plus className="h-4 w-4" />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div id={pid} role="region" aria-labelledby={bid}
                  initial={reduced ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }} className="overflow-hidden">
                  <p className="max-w-3xl px-5 pb-6 text-[15px] leading-relaxed text-slate-600 sm:px-7">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
