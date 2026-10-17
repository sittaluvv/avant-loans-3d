import { useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Check, ChevronDown, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react"
import { submitApplication, isLive } from "../lib/submit"

/*
 * DEMO ONLY. This form has no action/method, never calls fetch/XHR, and keeps
 * answers in memory only. They are cleared when the demo is "submitted".
 */

const STEPS = ["Personal Details", "Employment & Income", "Mortgage Loan Details"] as const
const COUNTRIES = ["United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman", "Jordan", "Egypt", "Lebanon", "United Kingdom", "United States", "Other"]

type Data = Record<string, string>

const inputCls =
  "w-full rounded-xl border border-white/15 bg-abyss/60 px-4 py-3 text-[15px] text-frost placeholder:text-mist/55 transition-[border-color,box-shadow] " +
  "hover:border-white/25 focus:border-ion focus:outline-none focus:ring-4 focus:ring-electric/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow " +
  "aria-[invalid=true]:border-rose-400/70 [color-scheme:dark]"

function Row({ label, htmlFor, children, hint, groupId }: { label: string; htmlFor?: string; children: ReactNode; hint?: string; groupId?: string }) {
  return (
    <div className="grid gap-2 border-t border-white/[.06] py-5 first:border-t-0 md:grid-cols-[200px_1fr] md:gap-8">
      <div className="md:pt-3">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-[15px] font-medium text-frost">{label} <span aria-hidden className="text-glow">*</span></label>
        ) : (
          <p id={groupId} className="text-[15px] font-medium text-frost">{label} <span aria-hidden className="text-glow">*</span></p>
        )}
        {hint && <p className="mt-1 text-xs text-mist/80">{hint}</p>}
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
        className={`${inputCls} appearance-none pr-10 ${data[id] ? "" : "text-mist/55"}`}>
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o} className="bg-navy text-frost">{o}</option>)}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-mist" />
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
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-[15px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-glow has-[[aria-invalid=true]]:border-rose-400/70 ${on ? "border-ion/70 bg-electric/15 text-frost" : "border-white/12 bg-abyss/40 text-mist hover:border-white/25 hover:text-frost"}`}>
            <input id={id} type="radio" name={name} value={o} checked={on} required={i === 0} onChange={() => set(name, o)} className="peer sr-only" />
            <span aria-hidden className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border ${on ? "border-ion bg-electric" : "border-white/30"}`}>
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

  const validate = () => {
    const f = formRef.current!
    const els = [...f.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select")]
    els.forEach((el) => el.removeAttribute("aria-invalid"))
    const bad = els.filter((el) => !el.checkValidity())
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

  const value = money(data["property-value"]), down = money(data["down-payment"])
  const loan = Math.max(value - down, 0)
  const ltv = value > 0 ? Math.round((loan / value) * 100) : 0

  if (done) {
    return (
      <motion.div ref={topRef} role="status" initial={reduced ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass edge-glow scroll-mt-28 rounded-[28px] p-8 text-center sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-electric shadow-[0_0_40px_rgba(13,91,255,.9)]"><Check aria-hidden className="h-8 w-8" /></div>
        <h2 className="mt-6 font-display text-2xl font-semibold sm:text-3xl">
          {delivered ? "Application delivered." : "Demo complete. Nothing was sent."}
        </h2>
        <p className="mx-auto mt-4 max-w-lg leading-relaxed text-mist">
          {delivered
            ? "Your answers were forwarded to Avant Loans Middle East via Telegram. This is still a design demo: no real lender reviewed them, and no loan was created."
            : "In a real product, this is where your mortgage application would be submitted. This is a demo, so your answers were not sent, saved or shared anywhere, and they have been cleared from this page."}
        </p>
        <button type="button" onClick={() => { setDone(false); setDelivered(false); setStep(0) }}
          className="mt-8 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold hover:border-ion">Start a new demo application</button>
      </motion.div>
    )
  }

  return (
    <div ref={topRef} className="scroll-mt-28">
      {/* Stepper */}
      <nav aria-label="Application progress" className="mb-8">
        <ol className="grid grid-cols-3 gap-2">
          {STEPS.map((s, i) => {
            const state = i < step ? "done" : i === step ? "current" : "todo"
            return (
              <li key={s} aria-current={state === "current" ? "step" : undefined} className="min-w-0">
                <div className="h-1 overflow-hidden rounded-full bg-white/10">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-electric to-glow shadow-[0_0_14px_rgba(13,91,255,.9)]"
                    initial={false} animate={{ width: state === "todo" ? "0%" : "100%" }} transition={{ duration: reduced ? 0 : 0.5 }} />
                </div>
                <p className={`mt-3 hidden items-center gap-2 text-sm sm:flex ${state === "todo" ? "text-mist/60" : "text-frost"}`}>
                  <span className={`font-display tabular-nums ${state === "current" ? "text-glow" : ""}`}>{state === "done" ? <Check aria-label="completed" className="inline h-4 w-4 text-glow" /> : `0${i + 1}.`}</span>
                  <span>{s}</span>
                </p>
                <span className="sr-only sm:hidden">{`0${i + 1}. ${s}${state === "done" ? " (completed)" : ""}`}</span>
              </li>
            )
          })}
        </ol>
        <p aria-hidden className="mt-3 flex items-center justify-between text-sm sm:hidden">
          <span><span className="font-display text-glow">0{step + 1}.</span> <span className="text-frost">{STEPS[step]}</span></span>
          <span className="text-mist">Step {step + 1} of 3</span>
        </p>
      </nav>

      <form ref={formRef} noValidate onSubmit={async (e) => {
        e.preventDefault()
        if (step < 2) { next(); return }
        if (!validate() || sending) return
        setSending(true); setError("")
        const snapshot = { ...data }
        const result = await submitApplication(snapshot)
        setSending(false)
        if (isLive && !result.delivered) {
          setError(result.error ? `Could not deliver the application: ${result.error}` : "Could not deliver the application. Please try again.")
          return
        }
        setDelivered(result.delivered)
        setData({}); setDone(true); scrollTop()
      }} className="glass edge-glow rounded-[28px] p-5 sm:p-10">
        <h1 className="font-display text-[clamp(1.6rem,4vw,2.4rem)] font-semibold leading-tight tracking-tight">Online Mortgage Application Form</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-mist">
          Please fill in our Mortgage Application Form. All fields marked <span className="text-glow">*</span> are required to prepare a complete and accurate mortgage loan offer.
          <span className="mt-2 block text-sm text-amber-100/90">Demo only: nothing you enter here is sent or stored.</span>
        </p>
        <div className="mt-6 h-px bg-gradient-to-r from-ion/50 via-white/10 to-transparent" />

        <p className="sr-only" aria-live="polite">Step {step + 1} of 3: {STEPS[step]}</p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.fieldset key={step}
            initial={reduced ? false : { opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={reduced ? undefined : { opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }} className="mt-2 min-w-0">
            <legend className="sr-only">{STEPS[step]}</legend>

            {step === 0 && (<>
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
              <Row label="Loan Purpose" groupId="g-purpose">
                <Radios name="purpose" labelledBy="g-purpose" cols={2} options={["Buy a home", "Refinance", "Home equity", "Build a home"]} data={data} set={set} />
              </Row>
              <Row label="Property Type" htmlFor="property-type">
                <Select id="property-type" label="Property Type" placeholder="Select…" options={["Apartment", "Villa", "Townhouse", "Land / plot", "Other"]} data={data} set={set} />
              </Row>
              <Row label="Property Location" groupId="g-ploc">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id="property-city" label="City" data={data} set={set} />
                  <Select id="property-country" label="Property country" placeholder="Country" options={COUNTRIES} data={data} set={set} />
                </div>
              </Row>
              <Row label="Property Value & Down Payment" groupId="g-money" hint="Estimates are fine, in USD">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field id="property-value" label="Estimated property value" inputMode="numeric" pattern="[0-9,.\s]+" data={data} set={set} />
                  <Field id="down-payment" label="Down payment" inputMode="numeric" pattern="[0-9,.\s]+" data={data} set={set} />
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-ion/25 bg-electric/[.07] p-4" aria-live="polite">
                  <div><p className="text-xs text-mist">Loan amount</p><p className="font-display text-xl tabular-nums">${loan.toLocaleString("en-US")}</p></div>
                  <div><p className="text-xs text-mist">Loan-to-value</p><p className="font-display text-xl tabular-nums">{ltv}%</p></div>
                </div>
              </Row>
              <Row label="Preferred Term" groupId="g-term">
                <Radios name="term" labelledBy="g-term" cols={2} options={["10 years", "15 years", "20 years", "25 years"]} data={data} set={set} />
              </Row>
              <Row label="Consent" groupId="g-consent">
                <label htmlFor="consent" className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-mist">
                  <input id="consent" name="consent" type="checkbox" required checked={data.consent === "yes"} onChange={(e) => set("consent", e.target.checked ? "yes" : "")}
                    className="mt-0.5 h-5 w-5 flex-none accent-electric" />
                  <span>I confirm the details are accurate and I understand this is a <strong className="text-frost">demo</strong>: no real mortgage is offered and nothing is sent.</span>
                </label>
              </Row>
            </>)}
          </motion.fieldset>
        </AnimatePresence>

        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p>}

        <div className={`mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center ${step === 0 ? "sm:justify-center" : "sm:justify-between"}`}>
          {step > 0 && (
            <button type="button" onClick={back} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-3.5 font-semibold text-frost hover:border-ion">
              <ArrowLeft aria-hidden className="h-4 w-4" /> Back
            </button>
          )}
          <button type="submit" disabled={sending} className="inline-flex items-center justify-center gap-2 rounded-full bg-electric px-10 py-3.5 font-semibold text-white shadow-[0_10px_40px_-8px_rgba(13,91,255,.95)] transition-colors hover:bg-ion disabled:opacity-70">
            {sending ? <><Loader2 aria-hidden className="h-4 w-4 animate-spin" /> Sending…</> : step < 2 ? "Next Page" : "Submit Demo Application"}
          </button>
        </div>
        <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-mist sm:text-sm">
          <ShieldCheck aria-hidden className="h-4 w-4 flex-none text-glow" />
          {isLive
            ? "Demo form. On submit, a summary is sent to Avant via Telegram. No real loan is created."
            : "Demo form. No data is sent, stored or shared."}
        </p>
      </form>
    </div>
  )
}
