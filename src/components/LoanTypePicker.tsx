import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import { APPLY_URL } from "./Header"
import { LOAN_TYPE_LIST, OPEN_PICKER_EVENT, applyUrlFor } from "../lib/loanTypes"
import { Ar } from "../i18n/Ar"
import { loanRange, formatMoney, formatNumber, useCurrency } from "../lib/currency"

/**
 * "Choose your loan type" modal (desktop) / bottom sheet (phone).
 * Native <dialog>.showModal(): background is inert (focus stays inside), Esc closes. Animations are motion-safe only.
 */
/** showRanges=false hides the plain-text amount ranges (homepage v2 shows no amounts). */
export function LoanTypePicker({ showRanges = true }: { showRanges?: boolean } = {}) {
  const ref = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const [open, setOpen] = useState(false)
  const { code } = useCurrency()

  useEffect(() => {
    const on = () => {
      opener.current = document.activeElement as HTMLElement | null
      const d = ref.current
      if (d && !d.open) { d.showModal(); setOpen(true); requestAnimationFrame(() => d.querySelector<HTMLElement>("a[data-slug]")?.focus()) }
    }
    window.addEventListener(OPEN_PICKER_EVENT, on)
    return () => window.removeEventListener(OPEN_PICKER_EVENT, on)
  }, [])

  const close = () => ref.current?.close()

  return (
    <dialog
      ref={ref}
      aria-labelledby="loan-picker-title"
      data-testid="loan-picker"
      onClose={() => { setOpen(false); opener.current?.focus?.() }}
      onCancel={() => setOpen(false)}
      onClick={(e) => { if (e.target === ref.current) close() }} // click on the backdrop
      className="loan-picker m-0 mt-auto w-full max-w-none rounded-t-[28px] border-0 bg-white p-0 text-slate-900 shadow-[0_-20px_60px_-20px_rgba(26,20,70,.45)] backdrop:bg-[#120d33]/55 backdrop:backdrop-blur-sm sm:m-auto sm:w-[min(92vw,880px)] sm:rounded-[28px] sm:shadow-[0_40px_90px_-30px_rgba(26,20,70,.6)]"
    >
      {open && <style>{"html{overflow:hidden}"}</style>}
      <div data-lenis-prevent className="max-h-[88svh] overflow-y-auto px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-h-[86vh] sm:px-8 sm:pt-7 sm:pb-8">
        <div aria-hidden className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="loan-picker-title" className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Choose your loan type<Ar en="Choose your loan type" className="mt-0.5 text-[0.55em] font-medium tracking-normal" /></h2>
            <p className="mt-1 text-sm text-slate-600">Pick one to start your application. You can change it later.</p>
          </div>
          <button type="button" onClick={close} aria-label="Close"
            className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:border-[#3B2BBF]/40 hover:text-[#3B2BBF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF]">
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-3 lg:grid-cols-5">
          {LOAN_TYPE_LIST.map((t, i) => {
            const r = loanRange(t.id, code)
            return (
              <li key={t.slug} className={i === LOAN_TYPE_LIST.length - 1 ? "col-span-2 sm:col-span-1" : ""}>
                <a href={applyUrlFor(APPLY_URL, t.slug)} data-slug={t.slug}
                  className="group flex h-full flex-col items-center gap-1.5 rounded-2xl border border-slate-200 bg-white p-4 text-center transition-all hover:-translate-y-0.5 hover:border-[#3B2BBF]/40 hover:shadow-[0_16px_36px_-18px_rgba(59,43,191,.8)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                  <img src={t.img} alt="" width={256} height={256} className="h-14 w-14 object-contain drop-shadow-md transition-transform group-hover:scale-110 motion-reduce:transition-none sm:h-16 sm:w-16" />
                  <span className="font-display text-sm font-semibold text-slate-900">{t.label}<Ar en={t.label} className="text-center" /></span>
                  <span className="text-xs leading-snug text-slate-500">{t.hint}</span>
                  {showRanges && <span className="mt-1 text-[11px] font-semibold tabular-nums text-[#3B2BBF]">{formatMoney(r.min, code)} – {formatNumber(r.max)}</span>}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </dialog>
  )
}

/** Props for any generic Apply link: real href (no-JS fallback) but opens the picker. */
export const pickerLinkProps = {
  href: APPLY_URL,
  "aria-haspopup": "dialog" as const,
  onClick: (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    window.dispatchEvent(new Event(OPEN_PICKER_EVENT))
  },
}
