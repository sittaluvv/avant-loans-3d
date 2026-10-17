import { useEffect, useId, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { CURRENCIES, currencyInfo, setCurrency, useCurrency } from "../lib/currency"

/** Header currency picker (flag + code). `dark` = over the hero video. */
export function CurrencySelect({ dark = false }: { dark?: boolean }) {
  const { code } = useCurrency()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const id = useId()
  const cur = currencyInfo(code)

  useEffect(() => {
    if (!open) return
    const off = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("pointerdown", off)
    setActive(Math.max(0, CURRENCIES.findIndex((c) => c.code === code)))
    requestAnimationFrame(() => list.current?.focus())
    return () => document.removeEventListener("pointerdown", off)
  }, [open, code])

  const choose = (i: number) => { setCurrency(CURRENCIES[i].code); setOpen(false) }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % CURRENCIES.length) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + CURRENCIES.length) % CURRENCIES.length) }
    else if (e.key === "Home") { e.preventDefault(); setActive(0) }
    else if (e.key === "End") { e.preventDefault(); setActive(CURRENCIES.length - 1) }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(active) }
    else if (e.key === "Escape" || e.key === "Tab") { setOpen(false); (root.current?.querySelector("button") as HTMLButtonElement)?.focus() }
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        data-testid="currency-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={`Currency: ${cur.code} (${cur.country}). Change currency`}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-2 text-sm font-semibold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-3 ${
          dark ? "border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 focus-visible:outline-white" : "border-[#3B2BBF]/20 bg-white text-slate-800 hover:border-[#3B2BBF]/45 focus-visible:outline-[#3B2BBF]"
        }`}
      >
        <span aria-hidden className="text-base leading-none">{cur.flag}</span>
        <span>{cur.code}</span>
        <ChevronDown aria-hidden className={`h-3.5 w-3.5 opacity-70 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          tabIndex={-1}
          aria-label="Choose currency"
          aria-activedescendant={`${id}-opt-${active}`}
          onKeyDown={onKey}
          className="absolute right-0 z-[70] mt-2 w-[17rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-[#3B2BBF]/10 bg-white p-1.5 text-slate-800 shadow-[0_24px_60px_-20px_rgba(26,20,70,.45)] outline-none"
        >
          {CURRENCIES.map((c, i) => {
            const sel = c.code === code
            return (
              <li
                key={c.code}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={sel}
                onPointerEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${i === active ? "bg-[#3B2BBF]/[.07]" : ""}`}
              >
                <span aria-hidden className="text-lg leading-none">{c.flag}</span>
                <span className="font-semibold tabular-nums">{c.code}</span>
                <span className="min-w-0 flex-1 truncate text-slate-500">{c.country}</span>
                {sel && <Check aria-hidden className="h-4 w-4 flex-none text-[#3B2BBF]" />}
              </li>
            )
          })}
          <li role="presentation" className="px-3 pt-1.5 pb-1 text-[11px] leading-snug text-slate-400">Indicative amounts · fixed USD-peg rates</li>
        </ul>
      )}
    </div>
  )
}
