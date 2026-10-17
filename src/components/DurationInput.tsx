import { Minus, Plus } from "lucide-react"
import { Ar } from "../i18n/Ar"
import { durationBounds, durationReadout, durationRule, type ApplicationState } from "../lib/application"

/**
 * Loan duration typed by the customer: number box with -/+ steppers, Months | Years segmented toggle,
 * quick-pick chips per loan type, allowed-range helper, live read-out and inline error (English + Arabic).
 * Shared by /apply/ and /apply-v2/ (all rules live in lib/application.ts).
 */
export function DurationInput({ app, size = "md" }: { app: ApplicationState; size?: "md" | "lg" }) {
  const { loanType, data, durationUnit: unit, months, durationErr, setDuration, setDurationUnit, stepDuration, pickDurationChip } = app
  const off = !loanType
  const rule = durationRule(loanType)
  const b = durationBounds(loanType, unit)
  const v = data["duration-value"] ?? ""
  const helper = `Allowed: ${b.min}–${b.max} ${unit}`
  const lg = size === "lg"
  const h = lg ? "h-14" : "h-12"
  const stepBtn = `flex ${h} ${lg ? "w-14" : "w-12"} flex-none items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#3B2BBF] transition-colors hover:border-[#3B2BBF]/50 hover:bg-[#F3F0FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF] disabled:opacity-40`
  return (
    <div data-testid="duration" className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button type="button" data-testid="duration-minus" aria-label={`Decrease loan duration by one ${unit === "years" ? "year" : "month"}`} disabled={off || Number(v) <= b.min} onClick={() => stepDuration(-1)} className={stepBtn}><Minus aria-hidden className="h-4 w-4" /></button>
          <div className="relative min-w-0 flex-1">
            <input id="loan-duration" name="loan-duration" inputMode="numeric" pattern="[0-9]*" autoComplete="off" disabled={off}
              aria-describedby={`loan-duration-help${durationErr ? " loan-duration-error" : ""}`} aria-label={`Loan duration in ${unit}`}
              value={v} onChange={(e) => setDuration(e.target.value)} placeholder={off ? "—" : String(rule.default)}
              className={`${h} w-full rounded-2xl border border-slate-200 bg-white pr-[4.6rem] pl-4 font-display ${lg ? "text-xl" : "text-lg"} font-bold tabular-nums text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,.04)] transition-[border-color,box-shadow] placeholder:font-normal placeholder:text-slate-400 hover:border-[#3B2BBF]/35 focus:border-[#3B2BBF] focus:ring-4 focus:ring-[#3B2BBF]/15 focus:outline-none aria-[invalid=true]:border-rose-400 aria-[invalid=true]:ring-rose-200 disabled:bg-slate-50 disabled:opacity-60`} />
            <span aria-hidden className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-sm font-semibold text-slate-500">{unit}</span>
          </div>
          <button type="button" data-testid="duration-plus" aria-label={`Increase loan duration by one ${unit === "years" ? "year" : "month"}`} disabled={off || Number(v) >= b.max} onClick={() => stepDuration(1)} className={stepBtn}><Plus aria-hidden className="h-4 w-4" /></button>
        </div>
        <div role="radiogroup" aria-label="Duration unit" className={`grid w-full grid-cols-2 rounded-2xl bg-[#3B2BBF]/[.07] p-1 sm:w-auto ${off ? "opacity-50" : ""}`}>
          {(["months", "years"] as const).map((u) => {
            const on = unit === u
            const label = u === "months" ? "Months" : "Years"
            return (
              <label key={u} data-testid={`duration-unit-${u}`} className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl px-4 py-1.5 text-center text-sm font-semibold leading-tight transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-1 has-[:focus-visible]:outline-[#3B2BBF] ${on ? "bg-white text-[#3B2BBF] shadow-[0_6px_16px_-8px_rgba(59,43,191,.6)]" : "text-slate-600 hover:text-slate-900"}`}>
                <input type="radio" name="duration-unit" value={u} checked={on} disabled={off} onChange={() => setDurationUnit(u)} className="sr-only" />
                {label}<Ar en={label} className="text-center !text-[11px]" />
              </label>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <p id="loan-duration-help" className="text-xs text-slate-500">{off ? "Select a loan type first" : helper}<Ar en={off ? "Select a loan type first" : helper} /></p>
        {!off && months > 0 && !durationErr && (
          <p data-testid="duration-readout" aria-live="polite" className="rounded-full bg-[#3B2BBF]/[.07] px-3 py-1 text-xs font-semibold tabular-nums text-[#3B2BBF]">
            {durationReadout(months)}<Ar en={durationReadout(months)} className="text-center !text-[#3B2BBF]/80" />
          </p>
        )}
      </div>
      {durationErr && <p id="loan-duration-error" role="alert" className="text-sm font-medium text-rose-700">{durationErr}<Ar en={durationErr} className="!text-rose-700/80" /></p>}

      {!off && (
        <div role="group" aria-label="Common terms" className="flex flex-wrap gap-2">
          {rule.chips.map((c) => {
            const text = `${c} ${rule.unit === "years" ? (c === 1 ? "year" : "years") : "months"}`
            const on = unit === rule.unit && Number(v) === c
            return (
              <button key={c} type="button" data-testid={`duration-chip-${c}`} aria-pressed={on} onClick={() => pickDurationChip(c)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold leading-tight tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF] ${on ? "border-[#3B2BBF] bg-[#3B2BBF] text-white" : "border-slate-200 bg-white text-slate-700 hover:border-[#3B2BBF]/45 hover:text-[#3B2BBF]"}`}>
                {text}<Ar en={text} className={`text-center !text-[11px] ${on ? "!text-white/85" : ""}`} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
