import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { formatMoney, formatNumber, toUsd } from "../lib/currency"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Check, ChevronDown, ShieldCheck, ArrowLeft, Loader2, Mail, MessageCircle, Phone } from "lucide-react"
import { SUBMIT_NOTICE } from "../lib/legal"
import { loanTypeById } from "../lib/loanTypes"
import { IdUploads, IdPrivacyNote, ID_TYPES } from "./IdUpload"
import { Ar } from "../i18n/Ar"
import { DurationInput } from "./DurationInput"
import { DialCodeCombobox } from "./DialCodeCombobox"
import { CountryCombobox } from "./CountryCombobox"
import { AR, ar as ar_ } from "../i18n/ar"
import { FloatInput } from "../apply/fields"
import { FieldError, FieldErrorsContext, describedBy, errId, useFieldError } from "./FieldError"

/* Presentation for /apply/. All business logic (fields, rules, validation, snapshot, submit) is in lib/application.ts,
 * shared with /apply-v2/. */
import {
  useApplication, preferredContactOf, loanDetailsLabel, loanImg, SUCCESS_COPY,
  MARITAL, PURPOSES, durationText, durationReadout, PAY_FREQUENCIES, LOAN_TYPES, EMPLOYMENT, BIRTH_MAX, BIRTH_MIN, type Data,
} from "../lib/application"
export { preferredContactOf }

const fmt = new Intl.NumberFormat("en-US")

/* H1: rest border slate-500 #62748e (4.76:1), focus accent #3B2BBF (9.2:1). C2: invalid border rose-600 #e7000b (≈4.6:1). */
const inputCls =
  "w-full rounded-xl border border-[#62748e] bg-white px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,.04)] transition-[border-color,box-shadow] " +
  "hover:border-[#3B2BBF] focus:border-[#3B2BBF] focus:outline-none focus:ring-2 focus:ring-[#3B2BBF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF] " +
  "aria-[invalid=true]:border-[#e7000b] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-[#e7000b]/25 aria-[invalid=true]:focus:ring-[#e7000b] [color-scheme:light]"

function Row({ label, htmlFor, children, hint, groupId, optional }: { label: string; htmlFor?: string; children: ReactNode; hint?: string; groupId?: string; optional?: boolean }) {
  return (
    <div className="grid gap-2 border-t border-slate-100 py-5 first:border-t-0 md:grid-cols-[200px_1fr] md:gap-8">
      <div className="md:pt-3">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="block text-[15px] font-semibold text-slate-800">{label}{!optional && <span aria-hidden className="text-[#3B2BBF]"> *</span>}<Ar en={label} /></label>
        ) : (
          <p id={groupId} className="text-[15px] font-semibold text-slate-800">{label}{!optional && <span aria-hidden className="text-[#3B2BBF]"> *</span>}<Ar en={label} /></p>
        )}
        {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      </div>
      <div className="grid gap-3">{children}</div>
    </div>
  )
}

/** C1: persistent floating label (shared FloatInput from /apply-v2) instead of a placeholder-only label. Error text below (C2). */
function Field({ id, label, data, set, type = "text", optional, noAr, prefix, hint, ...rest }: {
  id: string; label: string; data: Data; set: (k: string, v: string) => void; type?: string; optional?: boolean; noAr?: boolean; prefix?: string; hint?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type" | "prefix">) {
  return <FloatInput id={id} label={label} type={type} optional={optional} noAr={noAr} prefix={prefix} hint={hint}
    value={data[id] ?? ""} onChange={(v) => set(id, v)} {...rest} />
}

function Select({ id, label, options, data, set, placeholder, caption }: { id: string; label: string; options: string[]; data: Data; set: (k: string, v: string) => void; placeholder: string; caption?: boolean }) {
  const err = useFieldError(id)
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">{label}</label>
      <select id={id} name={id} required value={data[id] ?? ""} onChange={(e) => set(id, e.target.value)} aria-describedby={describedBy(err && errId(id))}
        className={`${inputCls} appearance-none pr-10 ${data[id] ? "" : "text-slate-500"}`}>
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => <option key={o} value={o} className="bg-white text-slate-900">{o}</option>)}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-[1.55rem] right-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
      {/* Arabic of what the box shows: the chosen option, else the placeholder (Country: its label) */}
      <FieldError id={id} />
      <Ar en={data[id] || (caption ? label : placeholder)} className="mt-1 px-1" />
    </div>
  )
}

function Radios({ name, options, data, set, labelledBy, cols = 1 }: { name: string; options: string[]; data: Data; set: (k: string, v: string) => void; labelledBy: string; cols?: number }) {
  const err = useFieldError(name)
  return (<div>
    <div role="radiogroup" aria-labelledby={labelledBy} aria-describedby={describedBy(err && errId(name))} className={`grid gap-2.5 ${cols === 2 ? "sm:grid-cols-2" : ""}`}>
      {options.map((o, i) => {
        const id = `${name}-${i}`
        const on = data[name] === o
        return (
          <label key={o} htmlFor={id}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-[15px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#3B2BBF] has-[[aria-invalid=true]]:border-[#e7000b] ${on ? "border-[#3B2BBF] bg-[#3B2BBF]/[.06] text-slate-900 shadow-[0_8px_24px_-16px_rgba(59,43,191,.7)]" : "border-[#62748e] bg-white text-slate-700 hover:border-[#3B2BBF] hover:text-slate-900"}`}>
            <input id={id} type="radio" name={name} value={o} checked={on} required={i === 0} onChange={() => set(name, o)} className="peer sr-only" />
            <span aria-hidden className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border ${on ? "border-[#3B2BBF] bg-[#3B2BBF]" : "border-[#62748e] bg-white"}`}>
              {on && <span className="h-2 w-2 rounded-full bg-white" />}
            </span>
            <span className="min-w-0">{o}<Ar en={o} /></span>
          </label>
        )
      })}
    </div>
    <FieldError id={name} />
  </div>)
}

export function MortgageForm() {
  const reduced = useReducedMotion()
  const [step, setStep] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const app = useApplication()
  const [clip, setClip] = useState(true) // contact panel: clip only while expanding, so the code list can overflow
  const contactMethod = app.data["contact-method"]
  useEffect(() => { setClip(true); const t = setTimeout(() => setClip(false), 320); return () => clearTimeout(t) }, [contactMethod])
  const {
    data, set, currency, error, setError, sending, done, delivered, contactError, chooseContact, empKind, setEmployment,
    idFiles, idErrors, setIdFile, todayIso, loanType, range, months, amountNum, chooseLoanType, typeLocked, setTypeLocked, loanTypeError, setAmount,
  } = app
  const amountErr = app.fieldErrors["loan-amount"]
  const validate = () => app.validate(formRef.current!, { loanType: step === 0, id: step === 2, contact: step === 2 })
  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" })
  const next = () => { if (validate()) { setStep((s) => s + 1); scrollTop() } }
  const back = () => { setError(""); setStep((s) => s - 1); scrollTop() }

  const stepLabels = useMemo(() => ["Personal Details", "Employment & Income", loanDetailsLabel(loanType)] as const, [loanType])

  if (done) {
    return (
      <motion.div ref={topRef} role="status" initial={reduced ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-light scroll-mt-28 rounded-[28px] p-8 text-center sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#059669] text-white shadow-[0_12px_32px_-8px_rgba(5,150,105,.7)]"><Check aria-hidden className="h-8 w-8" /></div>
        <h2 className="mt-6 font-display text-2xl font-extrabold text-slate-900 sm:text-3xl">
          {SUCCESS_COPY.title(delivered)}
          <Ar en={SUCCESS_COPY.title(delivered)} className="mt-1 text-center text-[max(0.62em,14px)] font-medium" />
        </h2>
        <p className="mx-auto mt-4 max-w-lg leading-relaxed text-slate-600">
          {SUCCESS_COPY.body(delivered)}
          <Ar en={SUCCESS_COPY.body(delivered)} className="mt-2 text-center" />
        </p>
        <button type="button" onClick={() => { app.restart(); setStep(0) }}
          className="mt-8 rounded-full border border-[#3B2BBF]/30 px-6 py-3 text-sm font-semibold text-[#3B2BBF] hover:bg-[#3B2BBF]/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF]">Start a new enquiry<Ar en="Start a new enquiry" className="text-center" /></button>
      </motion.div>
    )
  }

  return (
    <FieldErrorsContext.Provider value={app.fieldErrors}>
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
                <p className={`mt-3 hidden items-start gap-2 text-sm sm:flex ${state === "todo" ? "text-slate-600" : "font-semibold text-slate-900"}`}>
                  <span className={`font-display tabular-nums ${state === "current" ? "text-[#3B2BBF]" : ""}`}>{state === "done" ? <Check aria-label="completed" className="inline h-4 w-4 text-[#047857]" /> : `0${i + 1}.`}</span>
                  <span className="min-w-0">{s}<Ar en={s} /></span>
                </p>
                <span className="sr-only sm:hidden">{`0${i + 1}. ${s}${state === "done" ? " (completed)" : ""}`}</span>
              </li>
            )
          })}
        </ol>
        <p aria-hidden className="mt-3 flex items-start justify-between gap-3 text-sm sm:hidden">
          <span><span className="font-display font-bold text-[#3B2BBF]">0{step + 1}.</span> <span className="font-semibold text-slate-900">{stepLabels[step]}</span><Ar en={stepLabels[step]} className="ps-6" /></span>
          <span className="flex-none text-right text-slate-500">Step {step + 1} of 3<Ar en={`Step ${step + 1} of 3`} className="text-right" /></span>
        </p>
      </nav>

      <form ref={formRef} noValidate onSubmit={async (e) => {
        e.preventDefault()
        if (step < 2) { next(); return }
        if (!validate() || sending) return
        if (await app.submit()) scrollTop()
      }} className="glass-light rounded-[28px] p-5 sm:p-10">
        <h1 className="font-display text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold leading-tight tracking-tight text-slate-900">Online Loan Application Form<Ar en="Online Loan Application Form" className="mt-1 text-[max(0.5em,14px)] font-medium tracking-normal" /></h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-slate-600">
          Please fill in our application form. All fields marked <span className="text-[#3B2BBF]">*</span> are required so our team can review your enquiry.
          <Ar en="Please fill in our application form. All fields marked * are required so our team can review your enquiry." className="mt-1" />
        </p>
        <div className="mt-6 h-px bg-gradient-to-r from-[#3B2BBF]/30 via-slate-200 to-transparent" />

        <p className="sr-only" aria-live="polite">Step {step + 1} of 3: {stepLabels[step]}</p>
        <AnimatePresence mode="wait" initial={false}>
          <motion.fieldset key={step}
            initial={reduced ? false : { opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={reduced ? undefined : { opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }} className="mt-2 min-w-0">
            <legend className="sr-only">{stepLabels[step]}</legend>

            {step === 0 && (<>
              <Row label="Loan Type" groupId="g-loan-type" hint={loanType ? "Choose the product you want" : "Choose a loan type to continue"}>
                {typeLocked && loanType ? (
                  <div data-testid="loan-type-chip" className="inline-flex w-fit items-center gap-2.5 rounded-[22px] border border-[#3B2BBF]/25 bg-[#3B2BBF]/[.06] py-1.5 pr-1.5 pl-2 text-sm">
                    <img src={loanImg(loanType)} alt="" width={256} height={256} className="h-7 w-7 object-contain" />
                    <span className="font-semibold leading-tight text-[#3B2BBF]">{loanTypeById(loanType)?.label ?? loanType}<Ar en={loanType} /></span>
                    <span aria-hidden className="text-slate-500">·</span>
                    <button type="button" data-testid="loan-type-change" onClick={() => setTypeLocked(false)} aria-label={`Change loan type (currently ${loanTypeById(loanType)?.label ?? loanType})`}
                      className="inline-flex min-h-11 flex-col items-center justify-center rounded-full bg-white px-3.5 py-1 text-sm font-semibold leading-tight text-[#3B2BBF] shadow-sm ring-1 ring-[#3B2BBF]/20 hover:bg-[#F3F0FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF]">Change<Ar en="Change" className="text-center" /></button>
                  </div>
                ) : (<>
                <div role="radiogroup" aria-describedby={loanTypeError ? "loan-type-error" : undefined} aria-labelledby="g-loan-type" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {LOAN_TYPES.map((t, i) => {
                    const on = loanType === t.id
                    const id = `loan-type-${i}`
                    return (
                      <label key={t.id} htmlFor={id}
                        className={`relative flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border p-4 text-center transition-all has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#3B2BBF] ${on ? "border-[#3B2BBF] bg-[#3B2BBF]/[.07] ring-2 ring-[#3B2BBF]/25 shadow-[0_16px_36px_-18px_rgba(59,43,191,.8)]" : loanTypeError ? "border-[#e7000b] bg-rose-50/40" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-[#3B2BBF]/40"}`}>
                        <input id={id} type="radio" name="loan-type" value={t.id} checked={on} required={i === 0}
                          onChange={() => chooseLoanType(t.id)} className="sr-only" />
                        <img src={t.img} alt="" width={256} height={256} className="h-14 w-14 object-contain drop-shadow-md sm:h-16 sm:w-16" />
                        <span className={`font-display text-sm font-semibold ${on ? "text-[#3B2BBF]" : "text-slate-800"}`}>{t.id}<Ar en={t.id} className="text-center" /></span>
                        <span className="text-xs leading-snug text-slate-500">{t.hint}</span>
                        {on && <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#3B2BBF] text-white"><Check aria-hidden className="h-3 w-3" /></span>}
                      </label>
                    )
                  })}
                </div>
                {loanTypeError && <p id="loan-type-error" role="alert" className="text-sm font-medium text-rose-700">{loanTypeError}<Ar en={loanTypeError} className="!text-rose-700/80" /></p>}
                </>)}
              </Row>

              <Row label="Loan Amount" htmlFor="loan-amount" hint={loanType ? `${currency} · ${formatNumber(range.min)} – ${formatNumber(range.max)}` : "Select a loan type first"}>
                <div className="relative">
                  <span aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-display text-sm font-semibold text-slate-600" data-testid="amount-prefix">{currency}</span>
                  <input id="loan-amount" name="loan-amount" inputMode="numeric" required
                    disabled={!loanType}
                    aria-describedby={describedBy(amountErr && errId("loan-amount"), "loan-amount-hint")}
                    min={range.min} max={range.max}
                    value={amountNum ? fmt.format(amountNum) : ""}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={loanType ? fmt.format(range.default) : "—"}
                    className={`${inputCls} pl-[3.75rem] tabular-nums disabled:opacity-50`} />
                </div>
                <FieldError id="loan-amount" className="-mt-1.5" />
                {loanType && (
                  <input id="loan-amount-range" type="range" min={range.min} max={range.max} step={range.step}
                    value={amountNum || range.default}
                    onChange={(e) => set("loan-amount", e.target.value)}
                    aria-label="Adjust loan amount" aria-valuetext={formatMoney(amountNum || range.default, currency)}
                    className="range-v2 w-full" style={{ "--p": `${Math.max(0, Math.min(100, (((amountNum || range.default) - range.min) / (range.max - range.min)) * 100))}%` } as React.CSSProperties} />
                )}
                <p id="loan-amount-hint" className="text-xs text-slate-500">
                  {loanType ? `Asking for ${formatMoney(amountNum || range.default, currency)}` : "Pick a loan type to set amount limits."}
                </p>
              </Row>

              <Row label="Loan Duration" htmlFor="loan-duration" hint="How long you want to repay">
                <DurationInput app={app} />
              </Row>

              <div className="my-2 h-px bg-slate-100" />

              <Row label="Your Name" groupId="g-name">
                <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
                  <Field id="first-name" label="First name" autoComplete="given-name" data={data} set={set} />
                  <Field id="last-name" label="Last name" autoComplete="family-name" data={data} set={set} />
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
                  <div className="min-w-0"><CountryCombobox floating value={data.country ?? ""} onChange={(v) => set("country", v)} /><FieldError id="country" /></div>
                </div>
              </Row>
              <Row label="Birth Date" groupId="g-birth-date" hint="MM/DD/YYYY">
                <Field noAr id="birth-date" label="Birth Date" type="date" autoComplete="bday" max={BIRTH_MAX} min={BIRTH_MIN} data={data} set={set} />
              </Row>
              <Row label="Email" groupId="g-email">
                <Field noAr id="email" label="Email address" hint="name@example.com" type="email" autoComplete="email" inputMode="email" data={data} set={set} />
              </Row>
              <Row label="Marital Status" htmlFor="marital">
                <Select id="marital" label="Marital Status" placeholder="Select…" options={MARITAL} data={data} set={set} />
              </Row>
            </>)}

            {step === 1 && (<>
              <Row label="Employment Status" groupId="g-emp">
                <Radios name="employment" labelledBy="g-emp" cols={2} options={EMPLOYMENT} data={data} set={(_, v) => setEmployment(v)} />
              </Row>
              <AnimatePresence initial={false} mode="wait">
                {empKind !== "none" && (
                  <motion.div key={empKind} data-testid={`emp-${empKind}`}
                    initial={reduced ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                    exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
                    className="overflow-hidden border-t border-slate-100">
                    {empKind === "employed" ? (
                      <Row label="Employer" groupId="g-employer" hint="Where you work now">
                        <Field id="employer" label="Employer name" autoComplete="organization" data={data} set={set} />
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field id="job-title" label="Job title" autoComplete="organization-title" optional data={data} set={set} />
                          <Field id="years-employed" label="Years with employer" type="number" min={0} max={60} step="0.5" inputMode="decimal" optional data={data} set={set} />
                        </div>
                      </Row>
                    ) : (
                      <Row label="Your Business" groupId="g-own-business" hint="The business you run">
                        <Field id="own-business-name" label="Business name" autoComplete="organization" data={data} set={set} />
                        <Field id="years-in-business" label="Years in business" type="number" min={0} max={60} step="0.5" inputMode="decimal" optional data={data} set={set} />
                      </Row>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              <Row label="Gross Annual Income" groupId="g-annual-income" hint={`Before tax, in ${currency}`}>
                <Field noAr id="annual-income" label="Annual income" prefix={currency} hint="e.g. 85,000" inputMode="numeric" pattern="[0-9,.\s]+" data={data} set={set} />
              </Row>
              <Row label="Other Monthly Income" groupId="g-other-income" hint={`Rental, investments, etc. · ${currency}`}>
                <Field noAr id="other-income" label="Monthly income" prefix={currency} hint="e.g. 500" inputMode="numeric" pattern="[0-9,.\s]+" optional data={data} set={set} />
              </Row>
              <Row label="Pay Frequency" htmlFor="pay-frequency">
                <Select id="pay-frequency" label="Pay Frequency" placeholder="Select…" options={PAY_FREQUENCIES} data={data} set={set} />
              </Row>
            </>)}

            {step === 2 && (<>
              {loanType && (
                <div className="mb-2 rounded-2xl border border-[#3B2BBF]/20 bg-[#3B2BBF]/[.05] p-4 text-sm text-slate-600">
                  <span className="font-display font-bold text-[#3B2BBF]">{loanTypeById(loanType)?.label ?? loanType}</span>
                  {" · "}
                  <span className="tabular-nums">{formatMoney(amountNum || 0, currency)}</span>
                  {" · "}
                  <span>{durationText(months) || "—"}</span>
                  <Ar text={[AR[loanType], months && ar_(durationReadout(months))].filter(Boolean).join(" · ")} />
                </div>
              )}

              {loanType === "Mortgage" && (<>
                <Row label="Loan Purpose" groupId="g-purpose">
                  <Radios name="purpose" labelledBy="g-purpose" cols={2} options={PURPOSES["Mortgage"].options} data={data} set={set} />
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
                  <Radios name="purpose" labelledBy="g-purpose" cols={2} options={PURPOSES["Auto/Car"].options} data={data} set={set} />
                </Row>
              </>)}

              {loanType === "Business" && (<>
                <Row label="Business Name" groupId="g-business-name">
                  <Field id="business-name" label="Registered business name" data={data} set={set} />
                </Row>
                <Row label="Use of Funds" groupId="g-purpose">
                  <Radios name="purpose" labelledBy="g-purpose" cols={2} options={PURPOSES["Business"].options} data={data} set={set} />
                </Row>
              </>)}

              {loanType === "Education" && (<>
                <Row label="School / Program" groupId="g-school-name">
                  <Field id="school-name" label="School or program name" data={data} set={set} />
                </Row>
                <Row label="Use of Funds" groupId="g-purpose">
                  <Radios name="purpose" labelledBy="g-purpose" cols={2} options={PURPOSES["Education"].options} data={data} set={set} />
                </Row>
              </>)}

              {loanType === "Personal" && (<>
                <Row label="Use of Funds" groupId="g-purpose">
                  <Radios name="purpose" labelledBy="g-purpose" cols={2} options={PURPOSES["Personal"].options} data={data} set={set} />
                </Row>
              </>)}

              {!loanType && (
                <p className="py-6 text-slate-500">Go back to step 1 and choose a loan type.<Ar en="Go back to step 1 and choose a loan type." /></p>
              )}

              <div data-id-section className="border-t border-slate-100 pt-5">
                <h2 className="font-display text-lg font-bold text-slate-900">Identity verification<Ar en="Identity verification" /></h2>
                <p className="mt-1 text-sm text-slate-600">Choose your ID type and upload a clear photo or scan.<Ar en="Choose your ID type and upload a clear photo or scan." /></p>
              </div>
              <Row label="ID type" groupId="g-id-type">
                <Radios name="id-type" options={[...ID_TYPES]} data={data} set={set} labelledBy="g-id-type" />
              </Row>
              <Row label="ID number" groupId="g-id-number" hint="As shown on the document">
                <Field noAr id="id-number" label="ID number" data={data} set={set} autoComplete="off" spellCheck={false} maxLength={30} pattern="[A-Za-z0-9\- ]{4,30}" title="4–30 letters, numbers or dashes" />
              </Row>
              <Row label="Expiry date" groupId="g-id-expiry" hint="Must be a valid, unexpired ID">
                <Field noAr id="id-expiry" label="Expiry date" type="date" data={data} set={set} min={todayIso} max="2060-12-31" />
              </Row>
              <Row label="Upload ID" groupId="g-id-upload" hint={data["id-type"] === "Passport" ? "Photo page required; back optional" : "Front and back required"}>
                <IdUploads idType={data["id-type"] || ""} files={idFiles} errors={idErrors} setFile={setIdFile} />
                <IdPrivacyNote />
              </Row>

              <Row label="Notes" htmlFor="notes" hint="Anything else we should know" optional>
                <div>
                  <label htmlFor="notes" className="sr-only">Notes</label>
                  <textarea id="notes" name="notes" rows={3}
                    value={data.notes ?? ""} onChange={(e) => set("notes", e.target.value)}
                    placeholder="Optional notes"
                    className={inputCls + " min-h-[96px] resize-y"} />
                </div>
              </Row>

              <Row label="How should we contact you?" groupId="g-contact" hint="Choose one">
                <div role="radiogroup" aria-labelledby="g-contact" aria-describedby={contactError ? "contact-error" : undefined} className="grid grid-cols-2 gap-3 sm:max-w-md">
                  {([["WhatsApp", "Chat on WhatsApp"], ["Email", "Reply by email"]] as const).map(([m, sub], i) => {
                    const on = data["contact-method"] === m
                    return (
                      <label key={m} htmlFor={`contact-method-${i}`} data-testid={`contact-${m}`}
                        className={`relative flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border p-4 text-center transition-all has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#3B2BBF] ${on ? "border-[#3B2BBF] bg-[#3B2BBF]/[.07] ring-2 ring-[#3B2BBF]/25 shadow-[0_16px_36px_-18px_rgba(59,43,191,.8)]" : contactError ? "border-[#e7000b] bg-white" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-[#3B2BBF]/40"}`}>
                        <input id={`contact-method-${i}`} type="radio" name="contact-method" value={m} checked={on} required={i === 0}
                          onChange={() => chooseContact(m)} className="sr-only" />
                        {m === "WhatsApp" ? (
                          <span aria-hidden className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-[0_10px_24px_-10px_rgba(37,211,102,.9)]">
                            <MessageCircle className="h-7 w-7" strokeWidth={2.2} /><Phone className="absolute h-3 w-3" strokeWidth={3} fill="currentColor" />
                          </span>
                        ) : (
                          <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3B2BBF] text-white shadow-[0_10px_24px_-10px_rgba(59,43,191,.9)]"><Mail className="h-6 w-6" strokeWidth={2.2} /></span>
                        )}
                        <span className={`font-display text-sm font-semibold ${on ? "text-[#3B2BBF]" : "text-slate-800"}`}>{m}<Ar en={m} className="text-center" /></span>
                        <span className="text-xs leading-snug text-slate-500">{sub}</span>
                        {on && <span className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#3B2BBF] text-white"><Check aria-hidden className="h-3 w-3" /></span>}
                      </label>
                    )
                  })}
                </div>
                {contactError && <p id="contact-error" role="alert" className="text-sm font-medium text-rose-700">{contactError}<Ar en={contactError} className="!text-rose-700/80" /></p>}
                <AnimatePresence initial={false} mode="wait">
                  {data["contact-method"] && (
                    <motion.div key={data["contact-method"]}
                      initial={reduced ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }} onAnimationComplete={() => setClip(false)}
                      className={clip ? "overflow-hidden" : "overflow-visible"}>
                      {data["contact-method"] === "WhatsApp" ? (
                        <div className="grid gap-2 pt-1">
                          <label htmlFor="whatsapp-number" className="text-sm font-medium text-slate-700">Is this your WhatsApp number? <span className="font-normal text-slate-500">Edit if needed.</span><Ar en="Is this your WhatsApp number? Edit if needed." /></label>
                          <div className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] gap-2 sm:max-w-md">
                  <DialCodeCombobox size="md" value={data["whatsapp-dial"] ?? "+966"} onChange={(v) => set("whatsapp-dial", v)} />
                            <input id="whatsapp-number" name="whatsapp-number" type="tel" inputMode="tel" autoComplete="tel-national" required
                              pattern="[0-9][0-9 ]{5,15}" title="Digits only, without the country code"
                              placeholder="50 123 4567" value={data["whatsapp-number"] ?? ""} onChange={(e) => set("whatsapp-number", e.target.value.replace(/[^\d ]/g, ""))}
                              aria-describedby={describedBy(app.fieldErrors["whatsapp-number"] && errId("whatsapp-number"))}
                              className={inputCls + " tabular-nums"} />
                          </div>
                          <FieldError id="whatsapp-number" className="!mt-0" />
                        </div>
                      ) : (
                        <div className="grid gap-2 pt-1 sm:max-w-md">
                          <label htmlFor="contact-email" className="text-sm font-medium text-slate-700">We’ll email you at <span className="font-normal text-slate-500">(edit if needed)</span><Ar en="We’ll email you at (edit if needed)" /></label>
                          <input id="contact-email" name="contact-email" type="email" inputMode="email" autoComplete="email" required
                            placeholder="name@example.com" value={data["contact-email"] ?? ""} onChange={(e) => set("contact-email", e.target.value)} className={inputCls}
                            aria-describedby={describedBy(app.fieldErrors["contact-email"] && errId("contact-email"))} />
                          <FieldError id="contact-email" className="!mt-0" />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Row>

              <Row label="Review" groupId="g-review" optional>
                <dl data-testid="review-summary" className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 rounded-2xl border border-[#3B2BBF]/15 bg-[#3B2BBF]/[.03] p-4 text-sm">
                  {([
                    ["Loan", [data["loan-type"], durationText(months)].filter(Boolean).join(" · ")],
                    ["Amount", amountNum ? `${formatMoney(amountNum, currency)}${currency !== "USD" ? ` (≈ ${formatMoney(toUsd(amountNum, currency), "USD")})` : ""}` : ""],
                    ["Applicant", [data["first-name"], data["last-name"]].filter(Boolean).join(" ")],
                    ["Preferred contact", preferredContactOf(data) || "Not chosen yet"],
                  ] as const).map(([k, v]) => (
                    <div key={k} className="contents"><dt className="text-slate-500">{k}<Ar en={k} /></dt><dd className={`min-w-0 break-words font-semibold ${k === "Preferred contact" ? "text-[#3B2BBF]" : "text-slate-900"}`}>{v || "—"}</dd></div>
                  ))}
                </dl>
              </Row>

              <Row label="Consent" groupId="g-consent">
                <label htmlFor="consent" className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-slate-600">
                  <input id="consent" name="consent" type="checkbox" required checked={data.consent === "yes"} onChange={(e) => set("consent", e.target.checked ? "yes" : "")}
                    aria-describedby={describedBy(app.fieldErrors.consent && errId("consent"))}
                    className="mt-0.5 h-5 w-5 flex-none accent-[#3B2BBF]" />
                  <span>I confirm the details are accurate and agree that Avant Middle East may contact me about this enquiry.<Ar en="I confirm the details are accurate and agree that Avant Middle East may contact me about this enquiry." className="mt-1" /></span>
                </label>
                <FieldError id="consent" className="!mt-0" />
              </Row>
            </>)}
          </motion.fieldset>
        </AnimatePresence>

        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}<Ar en={error} className="!text-rose-800/80" /></p>}

        {step === 2 && (
          <p data-testid="submit-notice" className="mt-8 text-center text-xs leading-relaxed text-slate-500 sm:text-[13px]">{SUBMIT_NOTICE}<Ar en="SUBMIT_NOTICE" className="mx-auto mt-1 max-w-2xl text-center" /></p>
        )}
        <div className={`${step === 2 ? "mt-5" : "mt-8"} flex flex-col-reverse gap-3 sm:flex-row sm:items-center ${step === 0 ? "sm:justify-center" : "sm:justify-between"}`}>
          {step > 0 && (
            <button type="button" onClick={back} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 font-semibold text-slate-700 hover:border-[#3B2BBF] hover:text-[#3B2BBF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF]">
              <ArrowLeft aria-hidden className="h-4 w-4" /> <span className="leading-tight">Back<Ar en="Back" className="text-center" /></span>
            </button>
          )}
          <button type="submit" disabled={sending} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3B2BBF] px-10 py-3.5 font-semibold text-white shadow-[0_16px_40px_-14px_rgba(59,43,191,.85)] transition-colors hover:bg-[#2f22a0] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B2BBF] disabled:opacity-70">
            {sending ? <><Loader2 aria-hidden className="h-4 w-4 animate-spin" /> <span className="leading-tight">Sending…<Ar en="Sending…" className="text-center !text-white/85" /></span></>
              : <span className="leading-tight">{step < 2 ? "Next Page" : "Submit Enquiry"}<Ar en={step < 2 ? "Next Page" : "Submit Enquiry"} className="text-center !text-white/85" /></span>}
          </button>
        </div>
        <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-slate-500 sm:text-sm">
          <ShieldCheck aria-hidden className="h-4 w-4 flex-none text-[#047857]" />
          <span>{"Your details are sent over an encrypted connection."}<Ar en="Your details are sent over an encrypted connection." className="text-center" /></span>
        </p>
      </form>
    </div>
    </FieldErrorsContext.Provider>
  )
}
