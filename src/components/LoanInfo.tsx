import { useState } from "react"
import { Check, ShieldCheck } from "lucide-react"
import { Ar, BiLabel } from "../i18n/Ar"
import { pickerLinkProps } from "./LoanTypePicker"
import { formatMoney, loanRange, useCurrency } from "../lib/currency"
import { REGULATORY_LINE } from "../lib/legal"

/** Illustrative enquiry figures only — Avant placeholders, NOT an offer. Edit here. */
export const ILLUSTRATIVE = { aprPct: 12, processingFeePct: 1.5 }
const TENURES = [6, 12, 18, 24, 36, 48, 60]

function monthly(p: number, aprPct: number, n: number) {
  const r = aprPct / 100 / 12
  return r === 0 ? p / n : (p * r) / (1 - Math.pow(1 + r, -n))
}

const Note = () => (
  <p className="mt-3 text-xs leading-relaxed text-slate-600">
    Illustrative figures for enquiry purposes only — not a loan offer. Actual rate, fees and approval depend on review. {REGULATORY_LINE}
    <Ar en="Illustrative figures only. Not a loan offer." />
  </p>
)

export function LoanCalculator() {
  const { code } = useCurrency()
  const r = loanRange("Personal", code)
  const [amt, setAmt] = useState(r.default)
  const [ti, setTi] = useState(3)
  const a = Math.min(Math.max(amt, r.min), r.max)
  const n = TENURES[ti]
  const m = monthly(a, ILLUSTRATIVE.aprPct, n)
  const total = m * n
  const interest = total - a
  const fee = (a * ILLUSTRATIVE.processingFeePct) / 100
  const f = (v: number) => formatMoney(Math.round(v), code)
  const row = (k: string, v: string, strong = false) => (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <dt className="text-sm text-slate-600">{k}<Ar en={k} /></dt>
      <dd className={`tabular-nums ${strong ? "text-lg font-bold text-[#3B2BBF]" : "font-semibold text-slate-900"}`}>{v}</dd>
    </div>
  )
  return (
    <section id="calculator" aria-labelledby="calc-h" className="scroll-mt-24 px-5 py-16 sm:px-8">
      <div className="mx-auto grid max-w-5xl gap-6 rounded-[28px] border border-slate-300 bg-white p-6 shadow-sm sm:p-10 md:grid-cols-2">
        <div>
          <h2 id="calc-h" className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Loan calculator<Ar en="Loan calculator" /></h2>
          <label className="mt-6 block text-sm font-semibold" htmlFor="calc-amt">Loan amount<Ar en="Loan amount" /></label>
          <div className="mt-1 text-xl font-bold tabular-nums text-[#3B2BBF]">{f(a)}</div>
          <input id="calc-amt" type="range" min={r.min} max={r.max} step={r.step} value={a} onChange={(e) => setAmt(+e.target.value)} className="mt-2 h-11 w-full accent-[#3B2BBF]" />
          <label className="mt-4 block text-sm font-semibold" htmlFor="calc-ten">Tenure<Ar en="Tenure" /></label>
          <div className="mt-1 text-xl font-bold tabular-nums text-[#3B2BBF]">{n} months</div>
          <input id="calc-ten" type="range" min={0} max={TENURES.length - 1} step={1} value={ti} onChange={(e) => setTi(+e.target.value)} className="mt-2 h-11 w-full accent-[#3B2BBF]" aria-valuetext={`${n} months`} />
        </div>
        <div>
          <dl className="divide-y divide-slate-200" aria-live="polite">
            {row("Monthly payment", f(m), true)}
            {row("Principal", f(a))}
            {row("Interest", f(interest))}
            {row("Total payable", f(total))}
            {row("Processing fee (one-time)", f(fee))}
          </dl>
          <p className="mt-2 text-xs text-slate-600">Assumes an illustrative {ILLUSTRATIVE.aprPct}% APR (reducing balance) and {ILLUSTRATIVE.processingFeePct}% processing fee.</p>
          <a {...pickerLinkProps} className="mt-5 inline-flex min-h-11 items-center rounded-full bg-[#3B2BBF] px-7 py-2.5 font-semibold text-white hover:bg-[#2A1D9E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF]">
            <BiLabel en="Apply for Loan" arClass="!text-white/85" />
          </a>
          <Note />
        </div>
      </div>
    </section>
  )
}

const ELIG = ["Age 21–60", "UAE or GCC resident with valid ID", "Regular monthly income (salaried or self-employed)", "Active mobile number and email"]
const DOCS = ["Emirates ID or national ID / passport", "Latest salary certificate or payslip", "Last 3 months' bank statements", "Proof of address (utility bill or tenancy)"]

export function Checklists({ compact = false }: { compact?: boolean }) {
  const list = (h: string, items: string[]) => (
    <div className="rounded-2xl border border-slate-300 bg-white p-5">
      <h3 className="font-display text-lg font-bold">{h}<Ar en={h} /></h3>
      <ul className="mt-3 space-y-2">
        {items.map((t) => (
          <li key={t} className="flex gap-2 text-sm text-slate-700"><Check aria-hidden className="mt-0.5 h-4 w-4 flex-none text-[#3B2BBF]" /><span>{t}<Ar en={t} /></span></li>
        ))}
      </ul>
    </div>
  )
  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${compact ? "" : "mx-auto max-w-5xl"}`}>
      {list("Who can apply", ELIG)}
      {list("Documents to keep ready", DOCS)}
      <p className="text-xs text-slate-600 sm:col-span-2">Typical requirements — our team will confirm exactly what is needed for your enquiry.<Ar en="Typical requirements — our team will confirm." /></p>
    </div>
  )
}

export function FeeTable() {
  const rows: [string, string][] = [
    ["Illustrative APR", `${ILLUSTRATIVE.aprPct}% per year (reducing balance)`],
    ["Processing fee", `${ILLUSTRATIVE.processingFeePct}% of loan amount, one-time`],
    ["Example", "AED 50,000 over 24 months ≈ AED 2,354/month · total ≈ AED 56,488 + AED 750 fee"],
    ["Late payment", "Confirmed in your agreement before signing"],
    ["Early settlement", "Allowed; any charge disclosed before signing"],
  ]
  return (
    <section aria-labelledby="fees-h" className="px-5 pb-16 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 id="fees-h" className="font-display text-2xl font-extrabold tracking-tight">Fees &amp; example<Ar en="Fees & example" /></h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-300 bg-white">
          <table className="w-full text-left text-sm">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k} className="border-b border-slate-200 last:border-0">
                  <th scope="row" className="w-1/3 bg-[#F3F0FF]/60 px-4 py-3 font-semibold text-slate-800">{k}<Ar en={k} /></th>
                  <td className="px-4 py-3 tabular-nums text-slate-700">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Note />
      </div>
    </section>
  )
}

export function SecureNote() {
  return (
    <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-600">
      <ShieldCheck aria-hidden className="h-4 w-4 flex-none text-[#3B2BBF]" />
      <span>Avant never asks for an upfront fee, OTP or card PIN to process an enquiry. Only trust contact from the phone and email listed here.<Ar en="Avant never asks for an upfront fee, OTP or card PIN." /></span>
    </p>
  )
}

export function ApplyEntry() {
  const pts = ["3 short steps", "About 5 minutes", "No obligation enquiry"]
  return (
    <section aria-label="Start your application" className="px-5 pt-10 sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 rounded-[24px] border border-[#3B2BBF]/20 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-xl font-bold">Start with your mobile number<Ar en="Start with your mobile number" /></p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            {pts.map((p) => <li key={p} className="flex items-center gap-1"><Check aria-hidden className="h-4 w-4 text-[#3B2BBF]" />{p}<Ar en={p} inline className="ms-1" /></li>)}
          </ul>
        </div>
        <a {...pickerLinkProps} className="inline-flex min-h-11 flex-none items-center rounded-full bg-[#3B2BBF] px-7 py-2.5 font-semibold text-white hover:bg-[#2A1D9E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF]">
          <BiLabel en="Apply for Loan" arClass="!text-white/85" />
        </a>
      </div>
    </section>
  )
}
