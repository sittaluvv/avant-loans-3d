import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import { Check, ChevronDown } from "lucide-react"
import { Flag } from "./Flag"
import { Ar } from "../i18n/Ar"
import { describedBy, errId, useFieldError } from "./FieldError"

export type FlagOption = { value: string; label: string; iso: string; hint?: string }

/**
 * Shared WAI-ARIA "select-only combobox" with SVG flags (a native <select> cannot show images). Used by the country
 * field and the WhatsApp country-code picker. Focusable combobox + listbox with aria-activedescendant;
 * Up/Down/Home/End/PageUp/PageDown, Enter/Space/Tab to pick, Esc to close, type letters or digits to jump.
 * A hidden required input (#<name>) carries the value for the shared validation; focusing it focuses the combobox.
 */
export function FlagCombobox({ name, options, value, onChange, label, testid, trigger, className = "", listClassName = "inset-x-0", listTop = "3.1rem", below }: {
  name: string; options: FlagOption[]; value: string; onChange: (v: string) => void; label: string; testid: string
  /** visible content of the closed box (defaults to flag + label) */
  trigger?: (o: FlagOption | undefined, open: boolean) => ReactNode
  className?: string; listClassName?: string; listTop?: string; below?: ReactNode
}) {
  const id = useId()
  const box = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const proxy = useRef<HTMLInputElement>(null)
  const idx = options.findIndex((o) => o.value === value)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(Math.max(0, idx))
  const [invalid, setInvalid] = useState(false)
  const fieldErr = useFieldError(name)
  const typed = useRef({ text: "", at: 0 })
  // Chrome fires synthetic pointermoves when the list opens under a still cursor: only a real move (new coords) may hover-select
  const ptr = useRef<{ x: number; y: number } | null>(null)
  useEffect(() => { if (!open) ptr.current = null }, [open])
  const onHover = (e: React.PointerEvent, i: number) => {
    const p = ptr.current; ptr.current = { x: e.clientX, y: e.clientY }
    if (p && (p.x !== e.clientX || p.y !== e.clientY) && active !== i) setActive(i)
  }
  // mirror the validator's aria-invalid (set on the hidden input) onto the visible combobox
  useEffect(() => {
    const el = proxy.current; if (!el) return
    const mo = new MutationObserver(() => setInvalid(el.getAttribute("aria-invalid") === "true"))
    mo.observe(el, { attributes: true, attributeFilter: ["aria-invalid"] })
    return () => mo.disconnect()
  }, [])
  useEffect(() => {
    if (!open) return
    const off = (e: PointerEvent) => { if (!box.current?.parentElement?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("pointerdown", off)
    return () => document.removeEventListener("pointerdown", off)
  }, [open])
  useEffect(() => { if (open) list.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" }) }, [open, active])

  const n = options.length
  const choose = (i: number) => {
    typed.current = { text: "", at: 0 }
    onChange(options[i].value); setActive(i); setOpen(false)
    proxy.current?.removeAttribute("aria-invalid"); setInvalid(false)
  }
  const openAt = (i: number) => { setActive(i); setOpen(true) }
  const typeahead = (ch: string) => {
    const now = Date.now(), t = typed.current
    t.text = now - t.at > 700 ? ch : t.text + ch; t.at = now
    const q = t.text.toLowerCase()
    const same = q.length > 1 && q.split("").every((c) => c === q[0]) // repeated letter cycles through matches
    const start = (same || q.length === 1) && open ? active + 1 : 0
    const order = [...options.keys()].map((k) => (k + start) % n)
    const hay = (o: FlagOption) => o.label.toLowerCase()
    const digits = q.replace(/^\+/, "")
    const hit = order.find((k) => hay(options[k]).startsWith(same ? q[0] : q))
      ?? (/^\+?\d+$/.test(q) ? order.find((k) => options[k].value.replace(/^\+/, "").startsWith(digits)) : undefined)
      ?? order.find((k) => hay(options[k]).includes(q))
    if (hit !== undefined) { setActive(hit); if (!open) setOpen(true) }
  }
  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key
    const isChar = k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey
    if (!isChar) typed.current = { text: "", at: 0 } // navigation/selection ends the type-to-search word
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(k)) { e.preventDefault(); openAt(Math.max(0, idx)) }
      else if (k === "Home") { e.preventDefault(); openAt(0) }
      else if (k === "End") { e.preventDefault(); openAt(n - 1) }
      else if (isChar && /\S/.test(k)) { e.preventDefault(); typeahead(k) }
      return
    }
    if (k === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(n - 1, a + 1)) }
    else if (k === "ArrowUp") { e.preventDefault(); if (e.altKey) choose(active); else setActive((a) => Math.max(0, a - 1)) }
    else if (k === "Home") { e.preventDefault(); setActive(0) }
    else if (k === "End") { e.preventDefault(); setActive(n - 1) }
    else if (k === "PageDown") { e.preventDefault(); setActive((a) => Math.min(n - 1, a + 5)) }
    else if (k === "PageUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 5)) }
    else if (k === "Enter" || (k === " " && Date.now() - typed.current.at > 700)) { e.preventDefault(); e.stopPropagation(); choose(active) }
    else if (k === "Escape") { e.preventDefault(); e.stopPropagation(); setOpen(false) }
    else if (k === "Tab") { choose(active) }
    else if (isChar) { e.preventDefault(); typeahead(k) }
  }

  const cur = idx >= 0 ? options[idx] : undefined
  const labelId = `${id}-label`
  return (
    <div className="relative">
      <span id={labelId} className="sr-only">{label}</span>
      <input ref={proxy} id={name} name={name} required value={value} onChange={() => {}} tabIndex={-1} aria-hidden data-proxy={`${name}-combobox`}
        onFocus={() => box.current?.focus()} className="pointer-events-none absolute bottom-0 left-4 h-px w-px opacity-0" />
      <div ref={box} id={`${name}-combobox`} role="combobox" tabIndex={0} data-testid={`${testid}-combobox`}
        aria-labelledby={labelId} aria-describedby={describedBy(fieldErr && errId(name))} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined} aria-required="true" aria-invalid={invalid || undefined}
        onKeyDown={onKey} onClick={() => (open ? setOpen(false) : openAt(Math.max(0, idx)))}
        className={`flex w-full cursor-pointer items-center gap-3 border bg-white text-[15px] shadow-[0_1px_2px_rgba(15,23,42,.04)] transition-[border-color,box-shadow] select-none hover:border-[#3B2BBF] focus:border-[#3B2BBF] focus:ring-2 focus:ring-[#3B2BBF] focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF] ${className} ${invalid ? "border-[#e7000b] ring-2 ring-[#e7000b]/25" : open ? "border-[#3B2BBF] ring-2 ring-[#3B2BBF]" : "border-[#62748e]"}`}>
        {trigger ? trigger(cur, open) : (<>{cur ? <Flag iso={cur.iso} /> : null}<span className="min-w-0 flex-1 truncate text-slate-900">{cur?.label}</span></>)}
        <ChevronDown aria-hidden className={`h-4 w-4 flex-none text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>
      {below}
      {open && (
        <ul ref={list} id={`${id}-list`} role="listbox" aria-labelledby={labelId} data-testid={`${testid}-list`} data-lenis-prevent
          className={`absolute z-[60] mt-1.5 max-h-[min(19rem,52svh)] overflow-y-auto overscroll-contain rounded-2xl border border-[#3B2BBF]/10 bg-white p-1.5 shadow-[0_24px_60px_-20px_rgba(26,20,70,.45)] ${listClassName}`}
          style={{ top: listTop }}>
          {options.map((o, i) => {
            const sel = o.value === value
            return (
              <li key={o.value} id={`${id}-opt-${i}`} data-i={i} role="option" aria-selected={sel}
                onPointerMove={(e) => onHover(e, i)} onPointerDown={(e) => e.preventDefault()} onClick={() => choose(i)}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-[15px] ${i === active ? "bg-[#3B2BBF]/[.12] ring-2 ring-inset ring-[#3B2BBF]" : ""} ${sel ? "font-semibold text-[#3B2BBF]" : "text-slate-800"}`}>
                <Flag iso={o.iso} />
                <span className="min-w-0 flex-1">{o.label}<Ar en={o.label} /></span>
                {o.hint && <span className="flex-none tabular-nums text-slate-500">{o.hint}</span>}
                {sel && <Check aria-hidden className="h-4 w-4 flex-none text-[#3B2BBF]" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
