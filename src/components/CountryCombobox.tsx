import { useEffect, useId, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { Flag } from "./Flag"
import { Ar } from "../i18n/Ar"
import { COUNTRIES, COUNTRY_ISO } from "../lib/application"

/**
 * Country picker with SVG flags (a native <select> cannot show images). WAI-ARIA "select-only combobox":
 * focusable combobox + listbox with aria-activedescendant; Up/Down/Home/End/PageUp/PageDown, Enter/Space/Tab to pick,
 * Esc to close, type letters to jump (type-to-search). A hidden required input (#country) carries the value for the
 * shared validation; focusing it moves focus to the combobox.
 * floating: label sits inside the box (apply-v2); otherwise the label is visually hidden like the other /apply fields.
 */
export function CountryCombobox({ value, onChange, label = "Country", floating = false }: { value: string; onChange: (v: string) => void; label?: string; floating?: boolean }) {
  const id = useId()
  const box = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const proxy = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(Math.max(0, COUNTRIES.indexOf(value)))
  const [invalid, setInvalid] = useState(false)
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

  const choose = (i: number) => {
    typed.current = { text: "", at: 0 }
    onChange(COUNTRIES[i]); setActive(i); setOpen(false)
    proxy.current?.removeAttribute("aria-invalid"); setInvalid(false)
  }
  const openAt = (i: number) => { setActive(i); setOpen(true) }
  const typeahead = (ch: string) => {
    const now = Date.now()
    const t = typed.current
    t.text = now - t.at > 700 ? ch : t.text + ch; t.at = now
    const q = t.text.toLowerCase()
    const same = q.split("").every((c) => c === q[0]) // repeated letter cycles through matches
    const start = same && open ? active + 1 : 0
    const order = [...COUNTRIES.keys()].map((k) => (k + start) % COUNTRIES.length)
    const hit = order.find((k) => COUNTRIES[k].toLowerCase().startsWith(same ? q[0] : q))
      ?? order.find((k) => COUNTRIES[k].toLowerCase().includes(q))
    if (hit !== undefined) { setActive(hit); if (!open) setOpen(true) }
  }
  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key, n = COUNTRIES.length
    // any navigation/selection key ends the current type-to-search word (like a native select)
    const isChar = k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey
    if (!isChar) typed.current = { text: "", at: 0 }
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(k)) { e.preventDefault(); openAt(Math.max(0, COUNTRIES.indexOf(value))) }
      else if (k === "Home") { e.preventDefault(); openAt(0) }
      else if (k === "End") { e.preventDefault(); openAt(n - 1) }
      else if (k.length === 1 && /\S/.test(k) && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); typeahead(k) }
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
    else if (k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); typeahead(k) }
  }

  const iso = COUNTRY_ISO[value]
  const labelId = `${id}-label`
  return (
    <div className="relative">
      <span id={labelId} className={floating ? "sr-only" : "sr-only"}>{label}</span>
      <input ref={proxy} id="country" name="country" required value={value} onChange={() => {}} tabIndex={-1} aria-hidden data-proxy="country-combobox"
        onFocus={() => box.current?.focus()} className="pointer-events-none absolute bottom-0 left-4 h-px w-px opacity-0" />
      <div ref={box} id="country-combobox" role="combobox" tabIndex={0} data-testid="country-combobox"
        aria-labelledby={labelId} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined} aria-required="true" aria-invalid={invalid || undefined}
        onKeyDown={onKey} onClick={() => (open ? setOpen(false) : openAt(Math.max(0, COUNTRIES.indexOf(value))))}
        className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 text-[15px] shadow-[0_1px_2px_rgba(15,23,42,.04)] transition-[border-color,box-shadow] select-none hover:border-[#3B2BBF]/35 focus:border-[#3B2BBF] focus:ring-4 focus:ring-[#3B2BBF]/15 focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF] ${floating ? "h-14 rounded-2xl" : "py-3"} ${invalid ? "border-rose-400 ring-rose-200" : open ? "border-[#3B2BBF] ring-4 ring-[#3B2BBF]/15" : "border-slate-200"}`}>
        {value ? <Flag iso={iso} /> : null}
        <span className="min-w-0 flex-1">
          {floating && <span className={`block font-medium transition-all ${value ? "text-xs text-[#3B2BBF]" : "text-[15px] text-slate-500"}`}>{label}<span aria-hidden className="text-[#3B2BBF]"> *</span></span>}
          {value ? <span data-testid="country-value" className="block truncate text-slate-900">{value}</span> : !floating && <span className="block text-slate-400">{label}</span>}
        </span>
        <ChevronDown aria-hidden className={`h-4 w-4 flex-none text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </div>
      <Ar en={value || label} className="mt-1 px-1 text-[13px]" />
      {open && (
        <ul ref={list} id={`${id}-list`} role="listbox" aria-labelledby={labelId} data-testid="country-list" data-lenis-prevent
          className="absolute inset-x-0 z-[60] mt-1.5 max-h-[min(19rem,52svh)] overflow-y-auto overscroll-contain rounded-2xl border border-[#3B2BBF]/10 bg-white p-1.5 shadow-[0_24px_60px_-20px_rgba(26,20,70,.45)]"
          style={{ top: floating ? "3.5rem" : "3.1rem" }}>
          {COUNTRIES.map((c, i) => {
            const sel = c === value
            return (
              <li key={c} id={`${id}-opt-${i}`} data-i={i} role="option" aria-selected={sel}
                onPointerMove={(e) => onHover(e, i)} onPointerDown={(e) => e.preventDefault()} onClick={() => choose(i)}
                className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] ${i === active ? "bg-[#3B2BBF]/[.08]" : ""} ${sel ? "font-semibold text-[#3B2BBF]" : "text-slate-800"}`}>
                <Flag iso={COUNTRY_ISO[c]} />
                <span className="min-w-0 flex-1">{c}<Ar en={c} className="!text-[11px]" /></span>
                {sel && <Check aria-hidden className="h-4 w-4 flex-none text-[#3B2BBF]" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
