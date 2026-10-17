import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"
import { pickerLinkProps } from "../components/LoanTypePicker"

/** Phone-only bottom bar that appears once the hero CTA has scrolled away (hidden again near the final CTA). */
export function StickyApply({ heroCta, finalCta }: { heroCta: React.RefObject<HTMLElement | null>; finalCta: React.RefObject<HTMLElement | null> }) {
  const [heroGone, setHeroGone] = useState(false)
  const [finalVisible, setFinalVisible] = useState(false)
  useEffect(() => {
    const a = heroCta.current, b = finalCta.current
    const io1 = new IntersectionObserver(([e]) => setHeroGone(!e.isIntersecting && e.boundingClientRect.top < 0))
    const io2 = new IntersectionObserver(([e]) => setFinalVisible(e.isIntersecting))
    if (a) io1.observe(a); if (b) io2.observe(b)
    return () => { io1.disconnect(); io2.disconnect() }
  }, [heroCta, finalCta])
  const show = heroGone && !finalVisible
  return (
    <div data-testid="sticky-apply" data-visible={show} aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#3B2BBF]/10 bg-white/90 px-4 pt-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_30px_-18px_rgba(26,20,70,.45)] backdrop-blur-md transition-transform duration-300 motion-reduce:transition-none sm:hidden ${show ? "translate-y-0" : "translate-y-full"}`}>
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 text-xs leading-snug text-slate-600"><span className="block font-semibold text-slate-900">Ready to apply?</span>Personal, auto, mortgage and more</p>
        <a {...pickerLinkProps} tabIndex={show ? 0 : -1} data-testid="sticky-apply-btn"
          className="inline-flex flex-none items-center gap-1.5 rounded-full bg-[#3B2BBF] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(59,43,191,.9)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF]">
          Apply now <ArrowRight aria-hidden className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}
