import { useMemo, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Check, ChevronDown, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react"
import houseImg from "../assets/3d/fluent-house.webp"
import carImg from "../assets/3d/fluent-car.webp"
import moneyBagImg from "../assets/3d/fluent-money-bag.webp"
import briefcaseImg from "../assets/3d/fluent-briefcase.webp"
import gradCapImg from "../assets/3d/fluent-grad-cap.webp"
import { submitApplication, isLive } from "../lib/submit"

/*
 * Demo form: answers stay in memory until submit.
 * When VITE_TELEGRAM_API_URL is set, submit POSTs a summary to the Worker
 * (which holds Telegram secrets). No bot token in the client.
 */

const COUNTRIES = ["United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman", "Jordan", "Egypt", "Lebanon", "United Kingdom", "United States", "Other"]

const LOAN_TYPES = [
  { id: "Mortgage", img: houseImg, hint: "Buy or refinance a home" },
  { id: "Personal", img: moneyBagImg, hint: "Flexible use of funds" },
  { id: "Auto/Car", img: carImg, hint: "Finance a vehicle" },
  { id: "Business", img: briefcaseImg, hint: "Grow or start a company" },
  { id: "Education", img: gradCapImg, hint: "School or training costs" },
] as const

const AMOUNT_RANGE: Record<string, { min: number; max: number; step: number; default: number }> = {
  Mortgage: { min: 50000, max: 2000000, step: 5000, default: 350000 },
  Personal: { min: 1000, max: 75000, step: 500, default: 15000 },
  "Auto/Car": { min: 3000, max: 150000, step: 500, default: 25000 },
  Business: { min: 5000, max: 500000, step: 1000, default: 50000 },
  Education: { min: 1000, max: 100000, step: 500, default: 20000 },
}

const DURATIONS: Record<string, string[]> = {
  Mortgage: ["10 years", "15 years", "20 years", "25 years", "30 years"],
  Personal: ["12 months", "24 months", "36 months", "48 months", "60 months"],
  "Auto/Car": ["24 months", "36 months", "48 months", "60 months", "72 months"],
  Business: ["12 months", "24 months", "36 months", "48 months", "60 months"],
  Education: ["12 months", "24 months", "36 months", "48 months", "60 months"],
}

type Data = Record<string, string>
const fmt = new Intl.NumberFormat("en-US")

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 shadow-[0_1px_2px_rgba(15,23,42,.04)] transition-[border-color,box-shadow] " +
  "hover:border-[#3B2BBF]/35 focus:border-[#3B2BBF] focus:outline-none focus:ring-4 focus:ring-[#3B2BBF]/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF] " +
  "aria-[invalid=true]:border-rose-400 aria-[invalid=true]:ring-rose-200 [color-scheme:light]"

function Row({ label, htmlFor, children, hint, groupId, optional }: { label: string; htmlFor?: string; children: ReactNode; hint?: string; groupId?: string; optional?: boolean }) {
  return (
    <div className="grid gap-2 border-t border-slate-100 py-5 first:border-t-0 md:grid-cols-[200px_1fr] md:gap-8">
      <div className="md:pt-3">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-[15px] font-semibold text-slate-800">{label}{!optional && <span aria-hidden className="text-[#3B2BBF]"> *</span>}</label>
        ) : (
          <p id={groupId} className="text-[15px] font-semibold text-slate-800">{label}{!optional && <span aria-hidden className="text-[#3B2BBF]"> *</span>}</p>
        )}
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  )
}

function Field({ id, label, data, set, type = "text", optional, ...rest }: {
  id: string; label: string; data: Data; set: (k: string, v: string) => void; type?: string; optional?: boolean
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">{label}</label>
      <input id={id} name={id} type={type} placeholder={label + (optional ? " (optional)" : "")} required={!optional}
        value={data[id] ?? ""} onChange={(e) => set(id, e.target.value)} className={inputCls} {...rest} />
    </div>
  )
}

function Select({ id, label, options, data, set, placeholder }: { id: string; label: string; options: string[]; data: Data; set: (k: string, v: string) => void; placeholder: string }) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">{label}</label>
      <select id={id} name={id} required value={data[id] ?? ""} onChange={(e) => set(id, e.target.value)}
        className={`${inputCls} appearance-none pr-10 ${data[id] ? "" : "text-slate-400"}`}>
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o} className="bg-white text-slate-900">{o}</option>)}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

function Radios({ name, options, data, set, labelledBy, cols = 1 }: { name: string; options: string[]; data: Data; set: (k: string, v: string) => void; labelledBy: string; cols?: number }) {
  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className={`grid gap-2.5 ${cols === 2 ? "sm:grid-cols-2" : ""}`}>
      {options.map((o, i) => {
        const id = `${name}-${i}`
        const on = data[name] === o
        return (
          <label key={o} htmlFor={id}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-[15px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#3B2BBF] has-[[aria-invalid=true]]:border-rose-400 ${on ? "border-[#3B2BBF] bg-[#3B2BBF]/[.06] text-slate-900 shadow-[0_8px_24px_-16px_rgba(59,43,191,.7)]" : "border-slate-200 bg-white text-slate-600 hover:border-[#3B2BBF]/40 hover:text-slate-900"}`}>
            <input id={id} type="radio" name={name} value={o} checked={on} required={i === 0} onChange={() => set(name, o)} className="peer sr-only" />
            <span aria-hidden className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border ${on ? "border-[#3B2BBF] bg-[#3B2BBF]" : "border-slate-300 bg-white"}`}>
              {on && <span className="h-2 w-2 rounded-full bg-white" />}
            </span>
            {o}
          </label>
        )
      })}
    </div>
  )
}

function money(v?: string) {
  const n = Number(String(v ?? "").replace(/[^\d.]/g, ""))
  return Number.isFinite(n) ? n : 0
}

export function MortgageForm() {
  const reduced = useReducedMotion()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<Data>({})
  const [done, setDone] = useState(false)
  const [delivered, setDelivered] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const formRef = useRef<HTMLFormElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const set = (k: string, v: string) => setData((d) => ({ ...d, [k]: v }))

  const loanType = data["loan-type"] || ""
  const range = AMOUNT_RANGE[loanType] || AMOUNT_RANGE.Personal
  const durations = DURATIONS[loanType] || DURATIONS.Personal
  const amountNum = money(data["loan-amount"])

  const pickLoanType = (id: string) => {
    const r = AMOUNT_RANGE[id]
    const durs = DURATIONS[id]
    setData((prev) => ({
      ...prev,
      "loan-type": id,
      "loan-amount": prev["loan-amount"] && money(prev["loan-amount"]) >= r.min && money(prev["loan-amount"]) <= r.max
        ? prev["loan-amount"]
        : String(r.default),
      "loan-duration": durs.includes(prev["loan-duration"] || "") ? prev["loan-duration"] : durs[Math.min(2, durs.length - 1)],
    }))
  }

  const setAmount = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "")
    if (!digits) { set("loan-amount", ""); return }
    const n = Math.min(range.max, Math.max(0, Number(digits)))
    set("loan-amount", String(n))
  }

  const validate = () => {
    const f = formRef.current!
    const els = [...f.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select")]
    els.forEach((el) => el.removeAttribute("aria-invalid"))
    const bad = els.filter((el) => !el.checkValidity())
    // amount range check
    if (data["loan-type"] && (amountNum < range.min || amountNum > range.max)) {
      const el = f.querySelector<HTMLInputElement>("#loan-amount")
      if (el) { el.setAttribute("aria-invalid", "true"); bad.push(el) }
    }
    bad.forEach((el) => el.setAttribute("aria-invalid", "true"))
    const count = new Set(bad.map((el) => el.name || el.id)).size
    if (bad.length) {
      setError(`Please complete ${count === 1 ? "the highlighted field" : `the ${count} highlighted fields`} to continue.`)
      bad[0].focus()
      ;(bad[0] as HTMLInputElement).reportValidity?.()
      return false
    }
    setError("")
    return true
  }
  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
  const next = () => { if (validate()) { setStep((s) => s + 1); scrollTop() } }
  const back = () => { setError(""); setStep((s) => s - 1); scrollTop() }

  const stepLabels = useMemo(() => {
    const third = {
      Mortgage: "Mortgage Details",
      Personal: "Loan Details",
      "Auto/Car": "Auto Loan Details",
      Business: "Business Loan Details",
      Education: "Education Loan Details",
    }[loanType] || "Loan Details"
    return ["Personal Details", "Employment & Income", third] as const
  }, [loanType])

  if (done) {
    return (
      <motion.div ref={topRef} role="status" initial={reduced ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-light scroll-mt-28 rounded-[28px] p-8 text-center sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#34D399] text-white shadow-[0_12px_32px_-8px_rgba(52,211,153,.8)]"><Check aria-hidden className="h-8 w-8" /></div>
        <h2 className="mt-6 font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
          {delivered ? "Application delivered." : "Demo complete. Nothing was sent."}
        </h2>
        <p className="mx-auto mt-4 max-w-lg leading-relaxed text-slate-600">
          {delivered
            ? "Your answers were forwarded to Avant Loans Middle East via Telegram. This is still a design demo: no real lender reviewed them, and no loan was created."
            : "In a real product, this is where your loan application would be submitted. This is a demo, so your answers were not sent, saved or shared anywhere, and they have been cleared from this page."}
        </p>
        <button type="button" onClick={() => { setDone(false); setDelivered(false); setStep(0) }}
          className="mt-8 rounded-full border border-[#3B2BBF]/30 px-6 py-3 text-sm font-semibold text-[#3B2BBF] hover:bg-[#3B2BBF]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF]">Start a new demo application</button>
      </motion.div>
    )
  }

  return (
    <div ref={topRef} className="scroll-mt-28">
      <nav aria-label="Application progress" className="mb-8">
        <ol className="grid grid-cols-3 gap-2">
          {stepLabels.map((s, i) => {
            const state = i < step ? "done" : i === step ? "current" : "todo"
            return (
              <li key={s} aria-current={state === "current" ? "step" : undefined} className="min-w-0">
                <div className="h-1.5 overflow-hidden rounded-full bg-[#3B2BBF]/10">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-[#3B2BBF] to-[#5B4DFF]"
                    initial={false} animate={{ width: state === "todo" ? "0%" : "100%" }} transition={{ duration: reduced ? 0 : 0.5 }} />
                </div>
                <p className={`mt-3 hidden items-center gap-2 text-sm sm:flex ${state === "todo" ? "text-slate-400" : "font-semibold text-slate-900"}`}>
                  <span className={`font-display tabular-nums ${state === "current" ? "text-[#3B2BBF]" : ""}`}>{state === "done" ? <Check aria-label="completed" className="inline h-4 w-4 text-[#34D399]" /> : `0${i + 1}.`}</span>
                  <span>{s}</span>
                </p>
                <span className="sr-only sm:hidden">{`0${i + 1}. ${s}${state === "done" ? " (completed)" : ""}`}</span>
              </li>
            )
          })}
        </ol>
        <p aria-hidden className="mt-3 flex items-center justify-between text-sm sm:hidden">
          <span><span className="font-display font-bold text-[#3B2BBF]">0{step + 1}.</span> <span className="font-semibold text-slate-900">{stepLabels[step]}</span></span>
          <span className="text-slate-500">Step {step + 1} of 3</span>
        </p>
      </nav>

      <form ref={formRef} noValidate onSubmit={async (e) => {
        e.preventDefault()
        if (step < 2) { next(); return }
        if (!validate() || sending) return
        setSending(true); setError("")
        const snapshot = {
          ...data,
          "loan-amount": amountNum ? `$${fmt.format(amountNum)}` : data["loan-amount"],
        }
        const result = await submitApplication(snapshot)
        setSending(false)
        if (isLive && !result.delivered) {
          setError(result.error ? `Could not deliver the application: ${result.error}` : "Could not deliver the application. Please try again.")
          return
        }
        setDelivered(result.delivered)
        setData({}); setDone(true); scrollTop()
      }} className="glass-light rounded-[28px] p-5 sm:p-10">
        <h1 className="font-display text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold leading-tight tracking-tight text-slate-900">Online Loan Application Form</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
          Please fill in our application form. All fields marked <span className="text-[#3B2BBF]">*</span> are required to prepare a complete and accurate loan offer.
          <span className="mt-3 block rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {isLive
              ? "Demo site — not a real lender. On submit, a summary is sent to Avant via Telegram. No real loan is created."
              : "Demo only: nothing you enter here is sent or stored."}
          </span>
        </p>
        <div className="mt-6 h-px bg-gradient-to-r from-[#3B2BBF]/30 via-slate-200 to-transparent" />

        <p className="sr-only" aria-live="polite">Step {step + 1} of 3: {stepLabels[step]}</p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.fieldset key={step}
            initial={reduced ? false : { opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={reduced ? undefined : { opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }} className="mt-2 min-w-0">
            <legend className="sr-only">{stepLabels[step]}</legend>

            {step === 0 && (<>
              <Row label="Loan Type" groupId="g-loan-type" hint="Choose the product you want">
                <div role="radiogroup" aria-labelledby="g-loan-type" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {LOAN_TYPES.map((t, i) => {
                    const on = loanType === t.id
                    const id = `loan-type-${i}`
                    return (
                      <label key={t.id} htmlFor={id}
                        className={`relative flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border p-4 text-center transition-all has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#3B2BBF] ${on ? "border-[#3B2BBF] bg-[#3B2BBF]/[.07] ring-2 ring-[#3B2BBF]/25 shadow-[0_16px_36px_-18px_rgba(59,43,191,.8)]" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-[#3B2BBF]/40"}`}>
                        <input id={id} type="radio" name="loan-type" value={t.id} checked={on} required={i === 0}
                          onChange={() => pickLoanType(t.id)} className="sr-only" />
                        <img src={t.img} alt="" width={256} height={256} className="h-14 w-14 object-contain drop-shadow-md sm:h-16 sm:w-16" />
                        <span className={`font-display text-sm font-semibold ${on ? "text-[#3B2BBF]" : "text-slate-800"}`}>{t.id}</span>
                        <span className="text-xs leading-snug text-slate-500">{t.hint}</span>
                        {on && <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#3B2BBF] text-white"><Check aria-hidden className="h-3 w-3" /></span>}
                      </label>
                    )
                  })}
                </div>
              </Row>

              <Row label="Loan Amount" htmlFor="loan-amount" hint={loanType ? `USD · ${fmt.format(range.min)} – ${fmt.format(range.max)}` : "Select a loan type first"}>
                <div className="relative">
                  <span aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-display font-semibold text-slate-400">$</span>
                  <input id="loan-amount" name="loan-amount" inputMode="numeric" required
                    disabled={!loanType}
                    aria-describedby="loan-amount-hint"
                    min={range.min} max={range.max}
                    value={amountNum ? fmt.format(amountNum) : ""}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={loanType ? fmt.format(range.default) : "—"}
                    className={`${inputCls} pl-8 tabular-nums disabled:opacity-50`} />
                </div>
                {loanType && (
                  <input id="loan-amount-range" type="range" min={range.min} max={range.max} step={range.step}
                    value={amountNum || range.default}
                    onChange={(e) => set("loan-amount", e.target.value)}
                    className="w-full accent-[#3B2BBF]" aria-label="Adjust loan amount" />
                )}
                <p id="loan-amount-hint" className="text-xs text-slate-500">
                  {loanType ? `Asking for $${fmt.format(amountNum || range.default)}` : "Pick a loan type to set amount limits."}
                </p>
              </Row>

              <Row label="Loan Duration" htmlFor="loan-duration" hint="How long you want to repay">
                <Select id="loan-duration" label="Loan Duration" placeholder={loanType ? "Select term…" : "Select a loan type first"}
                  options={durations} data={data} set={set} />
              </Row>

              <div className="my-2 h-px bg-slate-100" />

              <Row label="Your Name" groupId="g-name">
                <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
                  <Field id="first-name" label="First" autoComplete="given-name" data={data} set={set} />
                  <Field id="last-name" label="Last" autoComplete="family-name" data={data} set={set} />
                </div>
              </Row>
              <Row label="Home Address" groupId="g-addr">
                <Field id="street" label="Street Address" autoComplete="address-line1" data={data} set={set} />
                <Field id="street-2" label="Street Address Line 2" autoComplete="address-line2" optional data={data} set={set} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id="city" label="City" autoComplete="address-level2" data={data} set={set} />
                  <Field id="region" label="Region" autoComplete="address-level1" data={data} set={set} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id="postal" label="Postal / Zip Code" autoComplete="postal-code" maxLength={12} data={data} set={set} />
                  <Select id="country" label="Country" placeholder="Country" options={COUNTRIES} data={data} set={set} />
                </div>
              </Row>
              <Row label="Birth Date" htmlFor="birth-date" hint="MM/DD/YYYY">
                <Field id="birth-date" label="Birth Date" type="date" autoComplete="bday" max="2008-10-17" min="1906-01-01" data={data} set={set} />
              </Row>
              <Row label="Email" htmlFor="email">
                <Field id="email" label="name@example.com" type="email" autoComplete="email" inputMode="email" data={data} set={set} />
              </Row>
              <Row label="Marital Status" htmlFor="marital">
                <Select id="marital" label="Marital Status" placeholder="Select…" options={["Single", "Married", "Divorced", "Widowed", "Separated"]} data={data} set={set} />
              </Row>
              <Row label="How Many Dependents Do You Have?" htmlFor="dependents">
                <Field id="dependents" label="0" type="number" min={0} max={20} inputMode="numeric" data={data} set={set} />
              </Row>
              <Row label="Current Residency Status" groupId="g-res">
                <Radios name="residency" labelledBy="g-res" options={["Homeowner", "Tenant", "Living with parents/relatives"]} data={data} set={set} />
              </Row>
              <Row label="Is There a Second Applicant?" groupId="g-second">
                <Radios name="second-applicant" labelledBy="g-second" cols={2} options={["Yes", "No"]} data={data} set={set} />
              </Row>
            </>)}

            {step === 1 && (<>
              <Row label="Employment Status" groupId="g-emp">
                <Radios name="employment" labelledBy="g-emp" cols={2} options={["Employed full-time", "Employed part-time", "Self-employed", "Retired", "Not currently employed"]} data={data} set={set} />
              </Row>
              <Row label="Employer" groupId="g-employer" hint="Or your business name">
                <Field id="employer" label="Employer / business name" autoComplete="organization" data={data} set={set} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id="job-title" label="Job title" autoComplete="organization-title" data={data} set={set} />
                  <Field id="years-employed" label="Years with employer" type="number" min={0} max={60} step="0.5" inputMode="decimal" data={data} set={set} />
                </div>
              </Row>
              <Row label="Gross Annual Income" htmlFor="annual-income" hint="Before tax, in USD">
                <Field id="annual-income" label="e.g. 85,000" inputMode="numeric" pattern="[0-9,.\s]+" data={data} set={set} />
              </Row>
              <Row label="Other Monthly Income" htmlFor="other-income" hint="Rental, investments, etc.">
                <Field id="other-income" label="e.g. 500" inputMode="numeric" pattern="[0-9,.\s]+" optional data={data} set={set} />
              </Row>
              <Row label="Monthly Debt Payments" htmlFor="monthly-debts" hint="Car, cards, other loans">
                <Field id="monthly-debts" label="e.g. 650" inputMode="numeric" pattern="[0-9,.\s]+" data={data} set={set} />
              </Row>
              <Row label="Pay Frequency" htmlFor="pay-frequency">
                <Select id="pay-frequency" label="Pay Frequency" placeholder="Select…" options={["Monthly", "Twice a month", "Every two weeks", "Weekly", "Irregular"]} data={data} set={set} />
              </Row>
            </>)}

            {step === 2 && (<>
              {loanType && (
                <div className="mb-2 rounded-2xl border border-[#3B2BBF]/20 bg-[#3B2BBF]/[.05] p-4 text-sm text-slate-600">
                  <span className="font-display font-bold text-[#3B2BBF]">{loanType}</span>
                  {" · "}
                  <span className="tabular-nums">${fmt.format(amountNum || 0)}</span>
                  {" · "}
                  <span>{data["loan-duration"] || "—"}</span>
                </div>
              )}

              {loanType === "Mortgage" && (<>
                <Row label="Loan Purpose" groupId="g-purpose">
                  <Radios name="purpose" labelledBy="g-purpose" cols={2} options={["Buy a home", "Refinance", "Home equity", "Build a home"]} data={data} set={set} />
                </Row>
              </>)}

              {loanType === "Auto/Car" && (<>
                <Row label="Vehicle" groupId="g-vehicle">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field id="vehicle-make" label="Make" data={data} set={set} />
                    <Field id="vehicle-model" label="Model" data={data} set={set} />
                    <Field id="vehicle-year" label="Year" inputMode="numeric" pattern="[0-9]{4}" data={data} set={set} />
                  </div>
                </Row>
                <Row label="Use of Funds" groupId="g-purpose">
                  <Radios name="purpose" labelledBy="g-purpose" cols={2} options={["Buy new vehicle", "Buy used vehicle", "Refinance auto loan"]} data={data} set={set} />
                </Row>
              </>)}

              {loanType === "Business" && (<>
                <Row label="Business Name" htmlFor="business-name">
                  <Field id="business-name" label="Registered business name" data={data} set={set} />
                </Row>
                <Row label="Use of Funds" groupId="g-purpose">
                  <Radios name="purpose" labelledBy="g-purpose" cols={2} options={["Working capital", "Equipment", "Expansion", "Start-up costs"]} data={data} set={set} />
                </Row>
              </>)}

              {loanType === "Education" && (<>
                <Row label="School / Program" htmlFor="school-name">
                  <Field id="school-name" label="School or program name" data={data} set={set} />
                </Row>
                <Row label="Use of Funds" groupId="g-purpose">
                  <Radios name="purpose" labelledBy="g-purpose" cols={2} options={["Tuition", "Living expenses", "Both tuition and living"]} data={data} set={set} />
                </Row>
              </>)}

              {loanType === "Personal" && (<>
                <Row label="Use of Funds" groupId="g-purpose">
                  <Radios name="purpose" labelledBy="g-purpose" cols={2} options={["Debt consolidation", "Home improvement", "Medical", "Travel", "Other"]} data={data} set={set} />
                </Row>
              </>)}

              {!loanType && (
                <p className="py-6 text-slate-500">Go back to step 1 and choose a loan type.</p>
              )}

              <Row label="Notes" htmlFor="notes" hint="Anything else we should know" optional>
                <div>
                  <label htmlFor="notes" className="sr-only">Notes</label>
                  <textarea id="notes" name="notes" rows={3}
                    value={data.notes ?? ""} onChange={(e) => set("notes", e.target.value)}
                    placeholder="Optional notes"
                    className={inputCls + " min-h-[96px] resize-y"} />
                </div>
              </Row>

              <Row label="Consent" groupId="g-consent">
                <label htmlFor="consent" className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-slate-600">
                  <input id="consent" name="consent" type="checkbox" required checked={data.consent === "yes"} onChange={(e) => set("consent", e.target.checked ? "yes" : "")}
                    className="mt-0.5 h-5 w-5 flex-none accent-[#3B2BBF]" />
                  <span>I confirm the details are accurate and I understand this is a <strong className="text-slate-900">demo</strong>: no real loan is offered{isLive ? ", though a summary will be sent to Avant via Telegram" : ""}.</span>
                </label>
              </Row>
            </>)}
          </motion.fieldset>
        </AnimatePresence>

        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}

        <div className={`mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center ${step === 0 ? "sm:justify-center" : "sm:justify-between"}`}>
          {step > 0 && (
            <button type="button" onClick={back} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 font-semibold text-slate-700 hover:border-[#3B2BBF] hover:text-[#3B2BBF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF]">
              <ArrowLeft aria-hidden className="h-4 w-4" /> Back
            </button>
          )}
          <button type="submit" disabled={sending} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3B2BBF] px-10 py-3.5 font-semibold text-white shadow-[0_16px_40px_-14px_rgba(59,43,191,.85)] transition-colors hover:bg-[#2f22a0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF] disabled:opacity-70">
            {sending ? <><Loader2 aria-hidden className="h-4 w-4 animate-spin" /> Sending…</> : step < 2 ? "Next Page" : "Submit Demo Application"}
          </button>
        </div>
        <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-slate-500 sm:text-sm">
          <ShieldCheck aria-hidden className="h-4 w-4 flex-none text-[#34D399]" />
          {isLive
            ? "Demo form. On submit, a summary is sent to Avant via Telegram. No real loan is created."
            : "Demo form. No data is sent, stored or shared."}
        </p>
      </form>
    </div>
  )
}
