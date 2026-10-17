/* Presentation-only building blocks for /apply-v2/ (no business logic here: see lib/application.ts). */
import type { ReactNode } from "react"
import { Check } from "lucide-react"
import { Ar } from "../i18n/Ar"
import { AR } from "../i18n/ar"
import { formatMoney } from "../lib/currency"
import type { ApplicationState } from "../lib/application"

const clearGroup = (name: string) => document.querySelectorAll(`[name="${name}"]`).forEach((el) => el.removeAttribute("aria-invalid"))
const optAr = (label: string, optional?: boolean) => AR[label] && (optional ? `${AR[label]} ${AR["(optional)"]}` : AR[label])

export const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF]"
const boxCls =
  "peer h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 pt-5 pb-1.5 text-[15px] text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,.04)] transition-[border-color,box-shadow] " +
  "hover:border-[#3B2BBF]/35 focus:border-[#3B2BBF] focus:ring-4 focus:ring-[#3B2BBF]/15 focus:outline-none aria-[invalid=true]:border-rose-400 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-rose-100 [color-scheme:light]"

/** Floating-label input: the label sits in the box and lifts on focus / when filled. Arabic line + hint below. */
export function FloatInput({ id, label, value, onChange, optional, type = "text", prefix, hint, noAr, className = "", ...rest }: {
  id: string; label: string; value: string; onChange: (v: string) => void; optional?: boolean; type?: string; prefix?: string; hint?: string; noAr?: boolean; className?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "prefix">) {
  const lifted = type === "date" || !!prefix
  const up = "top-2 translate-y-0 text-xs"
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="relative">
        {prefix && <span aria-hidden className="pointer-events-none absolute bottom-[0.5rem] left-4 text-[15px] font-semibold text-slate-500">{prefix}</span>}
        <input id={id} name={id} type={type} placeholder=" " required={!optional} value={value} onChange={(e) => onChange(e.target.value)}
          aria-describedby={hint ? `${id}-hint` : undefined} className={`${boxCls} ${prefix ? "pl-[3.7rem] tabular-nums" : ""}`} {...rest} />
        <label htmlFor={id} className={`pointer-events-none absolute left-4 max-w-[calc(100%-2rem)] truncate font-medium text-slate-500 transition-all duration-150 peer-focus:text-[#3B2BBF] peer-aria-[invalid=true]:text-rose-700 ${
          lifted ? up : "top-1/2 -translate-y-1/2 text-[15px] peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs"}`}>
          {label}{optional ? <span className="font-normal"> (optional)</span> : <span aria-hidden className="text-[#3B2BBF]"> *</span>}
        </label>
      </div>
      {!noAr && <Ar text={optAr(label, optional)} className="mt-1 px-1 text-[12.5px]" />}
      {hint && <p id={`${id}-hint`} className="mt-0.5 px-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

/** Group heading (English + Arabic) used inside a screen. */
export function GroupLabel({ id, label, optional, children }: { id?: string; label: string; optional?: boolean; children?: ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <p id={id} className="font-display text-[15px] font-bold text-slate-900">{label}{!optional && <span aria-hidden className="text-[#3B2BBF]"> *</span>}<Ar en={label} className="!font-sans text-[12.5px] font-medium" /></p>
      {children}
    </div>
  )
}

export type CardOption = { value: string; title?: string; sub?: string; img?: string; icon?: ReactNode }
/** Selectable option cards (radio group) with 3D icons. */
export function OptionCards({ name, options, value, onChange, labelledBy, cols = "sm:grid-cols-2", layout = "row", invalid, testid }: {
  name: string; options: CardOption[]; value?: string; onChange: (v: string) => void; labelledBy: string; cols?: string; layout?: "row" | "stack" | "stack-sm"; invalid?: boolean; testid?: string
}) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className={`grid grid-cols-1 gap-3 ${cols}`}>
      {options.map((o, i) => {
        const on = value === o.value
        const id = `${name}-${i}`
        return (
          <label key={o.value} htmlFor={id} data-testid={testid ? `${testid}-${i}` : undefined}
            className={`group relative flex cursor-pointer items-center gap-3.5 rounded-2xl border p-3.5 text-left transition-all duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#3B2BBF] has-[[aria-invalid=true]]:border-rose-400 motion-reduce:transition-none ${layout === "stack" ? "flex-col justify-center text-center sm:min-h-[150px]" : layout === "stack-sm" ? "min-h-[76px] sm:min-h-[150px] sm:flex-col sm:justify-center sm:text-center" : "min-h-[76px]"} ${
              on ? "border-[#3B2BBF] bg-[linear-gradient(180deg,#F6F4FF,#EEEAFF)] shadow-[0_18px_40px_-22px_rgba(59,43,191,.85)] ring-1 ring-[#3B2BBF]/30" : invalid ? "border-rose-300 bg-rose-50/40" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-[#3B2BBF]/40 hover:shadow-[0_14px_30px_-22px_rgba(59,43,191,.7)] motion-reduce:hover:translate-y-0"}`}>
            <input id={id} type="radio" name={name} value={o.value} checked={on} required={i === 0} onChange={() => { clearGroup(name); onChange(o.value) }} onClick={() => { if (on) onChange(o.value) }} className="sr-only" />
            {o.img
              ? <span aria-hidden className={`flex flex-none items-center justify-center rounded-2xl ${on ? "bg-white" : "bg-[#F3F0FF]"} ${layout === "stack" ? "h-16 w-16" : layout === "stack-sm" ? "h-12 w-12 sm:h-16 sm:w-16" : "h-12 w-12"} transition-colors`}>
                  <img src={o.img} alt="" width={256} height={256} className={`object-contain drop-shadow-[0_8px_10px_rgba(59,43,191,.25)] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 motion-reduce:transition-none ${layout === "stack" ? "h-12 w-12" : layout === "stack-sm" ? "h-9 w-9 sm:h-12 sm:w-12" : "h-9 w-9"}`} />
                </span>
              : o.icon}
            <span className="min-w-0 flex-1 leading-snug">
              <span className={`block font-display text-[15px] font-semibold ${on ? "text-[#3B2BBF]" : "text-slate-900"}`}>{o.title ?? o.value}</span>
              <Ar en={o.value} className={layout === "stack" ? "text-center" : layout === "stack-sm" ? "sm:text-center" : ""} />
              {o.sub && <span className="mt-0.5 block text-xs text-slate-500">{o.sub}</span>}
            </span>
            <span aria-hidden className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border transition-colors ${layout === "stack" ? "absolute top-3 right-3" : layout === "stack-sm" ? "sm:absolute sm:top-3 sm:right-3" : ""} ${on ? "border-[#3B2BBF] bg-[#3B2BBF] text-white" : "border-slate-300 bg-white"}`}>
              {on && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
          </label>
        )
      })}
    </div>
  )
}

/** Segmented / pill chips (radio group) for short option lists. */
export function ChipGroup({ name, options, value, onChange, labelledBy }: { name: string; options: string[]; value?: string; onChange: (v: string) => void; labelledBy: string }) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className="flex flex-wrap gap-2">
      {options.map((o, i) => {
        const on = value === o
        const id = `${name}-${i}`
        return (
          <label key={o} htmlFor={id}
            className={`flex min-h-[48px] cursor-pointer flex-col justify-center rounded-2xl border px-4 py-2 text-[15px] leading-tight font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#3B2BBF] has-[[aria-invalid=true]]:border-rose-400 has-[[aria-invalid=true]]:bg-rose-50/40 ${
              on ? "border-[#3B2BBF] bg-[#3B2BBF] text-white shadow-[0_12px_26px_-14px_rgba(59,43,191,.9)]" : "border-slate-200 bg-white text-slate-700 hover:border-[#3B2BBF]/45 hover:text-[#3B2BBF]"}`}>
            <input id={id} type="radio" name={name} value={o} checked={on} required={i === 0} onChange={() => { clearGroup(name); onChange(o) }} className="sr-only" />
            {o}<Ar en={o} className={`!text-[11.5px] ${on ? "!text-white/85" : ""}`} />
          </label>
        )
      })}
    </div>
  )
}

const fmt = new Intl.NumberFormat("en-US")
/** Amount: big input with the currency, plus a styled slider (same ids / limits as /apply). */
export function AmountField({ app }: { app: ApplicationState }) {
  const { loanType, range, amountNum, currency, setAmount, set } = app
  const val = amountNum || range.default
  const pct = Math.max(0, Math.min(100, ((val - range.min) / (range.max - range.min)) * 100))
  return (
    <div className="grid gap-3">
      <div className="relative">
        <span aria-hidden data-testid="amount-prefix" className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 font-display text-base font-bold text-[#3B2BBF]">{currency}</span>
        <input id="loan-amount" name="loan-amount" inputMode="numeric" required disabled={!loanType} aria-describedby="loan-amount-hint"
          aria-label="Loan Amount" min={range.min} max={range.max} value={amountNum ? fmt.format(amountNum) : ""} onChange={(e) => setAmount(e.target.value)}
          placeholder={loanType ? fmt.format(range.default) : "—"}
          className="h-16 w-full rounded-2xl border border-slate-200 bg-white pr-4 pl-[4.6rem] font-display text-[26px] font-extrabold tracking-tight tabular-nums text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,.04)] transition-[border-color,box-shadow] placeholder:text-slate-300 hover:border-[#3B2BBF]/35 focus:border-[#3B2BBF] focus:ring-4 focus:ring-[#3B2BBF]/15 focus:outline-none aria-[invalid=true]:border-rose-400 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-rose-100 disabled:opacity-50" />
      </div>
      {loanType && (
        <div>
          <input id="loan-amount-range" type="range" min={range.min} max={range.max} step={range.step} value={val}
            onChange={(e) => set("loan-amount", e.target.value)} aria-label="Adjust loan amount" aria-valuetext={formatMoney(val, currency)}
            className="range-v2 w-full" style={{ "--p": `${pct}%` } as React.CSSProperties} />
          <div className="mt-1 flex justify-between text-xs font-medium tabular-nums text-slate-500"><span>{formatMoney(range.min, currency)}</span><span>{formatMoney(range.max, currency)}</span></div>
        </div>
      )}
      <p id="loan-amount-hint" className="text-xs text-slate-500">{loanType ? `Asking for ${formatMoney(amountNum || range.default, currency)}` : "Pick a loan type to set amount limits."}</p>
    </div>
  )
}
