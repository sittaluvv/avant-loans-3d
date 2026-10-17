import { useEffect, useRef, useState, type ReactNode } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowLeft, ArrowRight, Check, Loader2, Pencil, ShieldCheck } from "lucide-react"
import { BASE } from "../components/Header"
import { Logo } from "../components/Logo"
import { CurrencySelect } from "../components/CurrencySelect"
import { DurationInput } from "../components/DurationInput"
import { DialCodeCombobox } from "../components/DialCodeCombobox"
import { CountryCombobox } from "../components/CountryCombobox"
import { ID_TYPES } from "../components/IdUpload"
import { Ar } from "../i18n/Ar"
import { AR } from "../i18n/ar"
import { formatMoney, toUsd } from "../lib/currency"
import { COMPANY_LINE, REGULATORY_LINE, SUBMIT_NOTICE } from "../lib/legal"
import { loanTypeById } from "../lib/loanTypes"
import {
  useApplication, preferredContactOf, loanDetailsLabel, loanImg, durationText, durationReadout, SUCCESS_COPY,
  MARITAL, PAY_FREQUENCIES, LOAN_TYPES, EMPLOYMENT, PURPOSES, BIRTH_MAX, BIRTH_MIN, type ScreenChecks,
} from "../lib/application"
import { AmountField, ChipGroup, FloatInput, GroupLabel, OptionCards, focusRing } from "./fields"
import { IdDropzones, PrivacyNoteV2 } from "./IdDropzone"
import officeImg from "../assets/3d/fluent-office-building.webp"
import hourglassImg from "../assets/3d/fluent-hourglass.webp"
import rocketImg from "../assets/3d/fluent-rocket.webp"
import beachImg from "../assets/3d/fluent-beach.webp"
import magnifierImg from "../assets/3d/fluent-magnifier.webp"
import globeImg from "../assets/3d/fluent-globe.webp"
import cityImg from "../assets/3d/fluent-cityscape.webp"
import idCardImg from "../assets/3d/fluent-id-card.webp"
import balloonImg from "../assets/3d/fluent-speech-balloon.webp"
import emailImg from "../assets/3d/fluent-e-mail.webp"
import checkImg from "../assets/3d/fluent-check-mark.webp"
import memoImg from "../assets/3d/fluent-memo.webp"

const EMP_IMG = [officeImg, hourglassImg, rocketImg, beachImg, magnifierImg]
const ID_IMG = [globeImg, cityImg, idCardImg]
const DETAILS = 5, REVIEW = 7

type Screen = { short: string; title: string; sub: string; checks?: ScreenChecks }
const screensFor = (loanType: string): Screen[] => [
  { short: "Loan", title: "Your loan", sub: "Choose the product, amount and how long you want to repay.", checks: { loanType: true } },
  { short: "About you", title: "About you", sub: "Tell us who is applying." },
  { short: "Address", title: "Where you live", sub: "Your current home address." },
  { short: "Work", title: "Your work", sub: "Your employment status today." },
  { short: "Income", title: "Your income", sub: "Before tax, in your selected currency." },
  { short: "Details", title: loanDetailsLabel(loanType), sub: "A few details about this loan." },
  { short: "Identity", title: "Identity verification", sub: "Choose your ID type and upload a clear photo or scan.", checks: { id: true } },
  { short: "Review", title: "Review & send", sub: "Check your answers, choose how we contact you, then send.", checks: { contact: true } },
]

/** Progress ring (desktop card header). */
function Ring({ value, label }: { value: number; label: string }) {
  const r = 22, c = 2 * Math.PI * r
  return (
    <div className="relative h-14 w-14 flex-none" role="img" aria-label={label}>
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#3B2BBF" strokeOpacity=".12" strokeWidth="5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke="url(#ringg)" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value)} className="transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none" />
        <defs><linearGradient id="ringg" x1="0" x2="1"><stop offset="0" stopColor="#3B2BBF" /><stop offset="1" stopColor="#2F6BFF" /></linearGradient></defs>
      </svg>
      <span aria-hidden className="absolute inset-0 flex items-center justify-center font-display text-sm font-extrabold tabular-nums text-[#3B2BBF]">{Math.round(value * 100)}%</span>
    </div>
  )
}

export default function ApplyV2() {
  const reduced = useReducedMotion()
  const app = useApplication()
  const {
    data, set, currency, error, setError, sending, done, delivered, contactError, chooseContact, empKind, setEmployment,
    idFiles, idErrors, setIdFile, todayIso, loanType, amountNum, months, chooseLoanType, typeLocked, setTypeLocked, loanTypeError,
  } = app
  const [screen, setScreen] = useState(0)
  const [dir, setDir] = useState(1)
  const [maxReached, setMaxReached] = useState(0)
  const [returnToReview, setReturnToReview] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const headRef = useRef<HTMLHeadingElement>(null)
  const moved = useRef(false)
  const screens = screensFor(loanType)
  const S = screens[screen]
  const typeLabel = loanTypeById(loanType)?.label ?? loanType

  const purposeOk = !loanType || PURPOSES[loanType]?.options.includes(data.purpose || "")
  /** Never skip past the details screen while its purpose no longer fits the (changed) loan type. */
  const guard = (target: number) => (target > DETAILS && !purposeOk ? DETAILS : target)
  const go = (target: number) => {
    setDir(target > screen ? 1 : -1); setError(""); moved.current = true
    setScreen(target); setMaxReached((m) => Math.max(m, target))
    if (target === REVIEW) setReturnToReview(false)
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })
  }
  const valid = () => app.validate(formRef.current!, S.checks ?? {})
  const next = () => { if (valid()) go(guard(returnToReview ? REVIEW : screen + 1)) }
  const back = () => go(screen - 1)
  const jump = (i: number) => {
    if (i === screen) return
    if (i < screen) { go(i); return }
    if (i <= maxReached && valid()) go(guard(i))
  }
  const edit = (i: number) => { setReturnToReview(true); go(i) }

  // focus the new screen's heading after a step change (not on first load)
  useEffect(() => {
    if (!moved.current) return
    const t = setTimeout(() => headRef.current?.focus({ preventScroll: true }), reduced ? 0 : 320)
    return () => clearTimeout(t)
  }, [screen, done, reduced])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (screen < REVIEW) { next(); return }
    if (!valid() || sending) return
    if (await app.submit()) { moved.current = true; window.scrollTo({ top: 0 }) }
  }
  // Enter continues (radio cards and checkboxes too); on the review screen Enter never submits by accident.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter" || e.defaultPrevented || e.nativeEvent.isComposing) return
    const t = e.target as HTMLElement
    if (t.tagName === "TEXTAREA" || t.tagName === "BUTTON" || t.tagName === "A") return
    if (t.getAttribute("role") === "combobox") return
    e.preventDefault()
    if (screen < REVIEW) next()
  }
  const restart = () => { app.restart(); setScreen(0); setMaxReached(0); moved.current = true }

  const contactShort = data["contact-method"] ? preferredContactOf(data) : ""
  const summary: [string, ReactNode][] = [
    ["Amount", amountNum ? formatMoney(amountNum, currency) : null],
    ["Term", months ? durationReadout(months) : null],
    ["Contact", contactShort || null],
  ]

  /* ---------------- journey panel (desktop) ---------------- */
  const panel = (
    <aside aria-label="Your application" className="journey sticky top-0 hidden h-svh flex-col overflow-hidden text-white lg:flex">
      <div aria-hidden className="journey-mesh" /><div aria-hidden className="journey-grain" />
      <div className="relative z-10 flex h-full flex-col overflow-y-auto px-8 py-7 [scrollbar-width:none] xl:px-10">
        <a href={`${BASE}v2/`} aria-label="Avant Loans Middle East home" className="w-fit rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <Logo variant="white" className="h-10 xl:h-11" />
        </a>
        <p className="mt-7 text-xs font-semibold tracking-[0.16em] text-white/75 uppercase">Loan application<Ar en="Loan application" className="!text-white/70 tracking-normal normal-case" /></p>

        <nav aria-label="Application steps" className="mt-4">
          <ol className="relative grid gap-1">
            <span aria-hidden className="absolute top-4 bottom-4 left-[15px] w-px bg-white/15" />
            {screens.map((s, i) => {
              const state = done || i < screen ? "done" : i === screen ? "current" : "todo"
              const can = !done && i !== screen && (i < screen || i <= maxReached)
              return (
                <li key={s.short} className="relative">
                  <button type="button" disabled={!can} onClick={() => jump(i)} aria-current={state === "current" ? "step" : undefined}
                    data-testid={`timeline-${i}`}
                    className={`group flex w-full items-center gap-3 rounded-xl py-1.5 pr-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white ${can ? "cursor-pointer hover:bg-white/[.06]" : "cursor-default"}`}>
                    <span aria-hidden className={`relative z-10 flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-bold tabular-nums transition-all duration-300 ${
                      state === "done" ? "bg-[#34D399] text-[#0b3b2c]" : state === "current" ? "bg-white text-[#3B2BBF] shadow-[0_0_0_5px_rgba(255,255,255,.14)]" : "border border-white/30 bg-[#1d1670] text-white/75"}`}>
                      {state === "done" ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                    </span>
                    <span className={`min-w-0 text-sm leading-tight ${state === "current" ? "font-bold text-white" : state === "done" ? "font-medium text-white/90" : "text-white/75"}`}>
                      {s.short}<Ar en={s.short} inline className="ml-2 !text-[11px] !text-white/70" />
                      <span className="sr-only">{state === "done" ? " (completed)" : state === "current" ? " (current step)" : ""}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <div className="mt-6 rounded-3xl border border-white/15 bg-white/[.07] p-5 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 flex-none">
              <AnimatePresence mode="wait" initial={false}>
                <motion.img key={done ? "done" : loanType || "none"} src={done ? checkImg : loanImg(loanType) ?? memoImg} alt="" width={256} height={256}
                  initial={reduced ? false : { opacity: 0, scale: 0.6, rotate: -12 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={reduced ? undefined : { opacity: 0, scale: 0.6 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="float-tilt h-16 w-16 object-contain drop-shadow-[0_16px_18px_rgba(0,0,0,.35)]" />
              </AnimatePresence>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white/75">Your summary<Ar en="Your summary" className="!text-white/70" /></p>
              <p data-testid="panel-type" className="truncate font-display text-lg font-bold">{done ? "Enquiry sent" : typeLabel || "Choose a loan type"}</p>
              <Ar en={done ? "Enquiry sent" : typeLabel || "Choose your loan type"} className="!text-white/70" />
            </div>
          </div>
          {!done && <dl data-testid="live-summary" className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 border-t border-white/10 pt-4 text-sm">
            {summary.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-white/75">{k}<Ar en={k} inline className="ml-1.5 !text-[10.5px] !text-white/70" /></dt>
                <dd data-testid={`sum-${k.toLowerCase().replace(/\s/g, "-")}`} className="min-w-0 truncate text-right font-semibold tabular-nums">{v ?? <span className="font-normal text-white/60">—</span>}</dd>
              </div>
            ))}
          </dl>}
        </div>

        <p className="mt-auto pt-6 text-[11px] leading-relaxed text-white/70"><span className="font-semibold text-white/85">{COMPANY_LINE}</span> {REGULATORY_LINE}</p>
      </div>
    </aside>
  )

  /* ---------------- screens ---------------- */
  const loanTypeOptions = LOAN_TYPES.map((t) => ({ value: t.id, title: loanTypeById(t.id)?.label ?? t.id, sub: t.hint, img: t.img }))
  const body: ReactNode[] = [
    /* 0 loan */ <>
      <section>
        <GroupLabel id="g-loan-type" label="Loan Type" />
        {typeLocked && loanType ? (
          <div data-testid="loan-type-chip" className="flex items-center gap-3 rounded-2xl border border-[#3B2BBF]/25 bg-[linear-gradient(180deg,#F6F4FF,#EEEAFF)] p-3 pr-3">
            <img src={loanImg(loanType)} alt="" width={256} height={256} className="h-12 w-12 object-contain drop-shadow-md" />
            <span className="min-w-0 flex-1 font-display font-bold leading-tight text-[#3B2BBF]">{typeLabel}<Ar en={loanType} /></span>
            <button type="button" data-testid="loan-type-change" onClick={() => setTypeLocked(false)} aria-label={`Change loan type (currently ${typeLabel})`}
              className={`rounded-full bg-white px-4 py-2 text-sm font-semibold leading-tight text-[#3B2BBF] shadow-sm ring-1 ring-[#3B2BBF]/20 hover:bg-[#F3F0FF] ${focusRing}`}>Change<Ar en="Change" className="text-center" /></button>
          </div>
        ) : (<>
          <OptionCards name="loan-type" labelledBy="g-loan-type" options={loanTypeOptions} value={loanType} onChange={chooseLoanType} cols="grid-cols-2 sm:grid-cols-3" layout="stack" invalid={!!loanTypeError} />
          {loanTypeError && <p id="loan-type-error" role="alert" className="mt-2 text-sm font-medium text-rose-700">{loanTypeError}<Ar en={loanTypeError} className="!text-rose-700/80" /></p>}
        </>)}
      </section>
      <section><GroupLabel label="Loan Amount" /><AmountField app={app} /></section>
      <section><GroupLabel label="Loan Duration"><span className="text-xs text-slate-500">How long you want to repay</span></GroupLabel><DurationInput app={app} size="lg" /></section>
    </>,
    /* 1 about */ <>
      <div className="grid gap-4 sm:grid-cols-2">
        <FloatInput id="first-name" label="First name" autoComplete="given-name" value={data["first-name"] ?? ""} onChange={(v) => set("first-name", v)} />
        <FloatInput id="last-name" label="Last name" autoComplete="family-name" value={data["last-name"] ?? ""} onChange={(v) => set("last-name", v)} />
        <FloatInput id="birth-date" label="Birth Date" type="date" autoComplete="bday" max={BIRTH_MAX} min={BIRTH_MIN} value={data["birth-date"] ?? ""} onChange={(v) => set("birth-date", v)} />
        <FloatInput id="email" label="Email" type="email" inputMode="email" autoComplete="email" value={data.email ?? ""} onChange={(v) => set("email", v)} hint="name@example.com" />
      </div>
      <section><GroupLabel id="g-marital" label="Marital Status" /><ChipGroup name="marital" labelledBy="g-marital" options={MARITAL} value={data.marital} onChange={(v) => set("marital", v)} /></section>
    </>,
    /* 2 address */ <>
      <FloatInput id="street" label="Street Address" autoComplete="address-line1" value={data.street ?? ""} onChange={(v) => set("street", v)} />
      <FloatInput id="street-2" label="Street Address Line 2" optional autoComplete="address-line2" value={data["street-2"] ?? ""} onChange={(v) => set("street-2", v)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FloatInput id="city" label="City" autoComplete="address-level2" value={data.city ?? ""} onChange={(v) => set("city", v)} />
        <FloatInput id="region" label="Region" autoComplete="address-level1" value={data.region ?? ""} onChange={(v) => set("region", v)} />
        <FloatInput id="postal" label="Postal / Zip Code" autoComplete="postal-code" maxLength={12} value={data.postal ?? ""} onChange={(v) => set("postal", v)} />
        <CountryCombobox floating value={data.country ?? ""} onChange={(v) => set("country", v)} />
      </div>
    </>,
    /* 3 work */ <>
      <section>
        <GroupLabel id="g-emp" label="Employment Status" />
        <OptionCards name="employment" labelledBy="g-emp" testid="emp-card" options={EMPLOYMENT.map((e, i) => ({ value: e, img: EMP_IMG[i] }))} value={data.employment} onChange={setEmployment} />
      </section>
      <AnimatePresence initial={false} mode="wait">
        {empKind !== "none" && (
          <motion.section key={empKind} data-testid={`emp-${empKind}`} initial={reduced ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }} className="-m-1 overflow-hidden p-1">
            {empKind === "employed" ? (<>
              <GroupLabel id="g-employer" label="Employer" />
              <div className="grid gap-4 sm:grid-cols-2">
                <FloatInput className="sm:col-span-2" id="employer" label="Employer name" autoComplete="organization" value={data.employer ?? ""} onChange={(v) => set("employer", v)} />
                <FloatInput id="job-title" label="Job title" optional autoComplete="organization-title" value={data["job-title"] ?? ""} onChange={(v) => set("job-title", v)} />
                <FloatInput id="years-employed" label="Years with employer" optional type="number" min={0} max={60} step="0.5" inputMode="decimal" value={data["years-employed"] ?? ""} onChange={(v) => set("years-employed", v)} />
              </div>
            </>) : (<>
              <GroupLabel id="g-own-business" label="Your Business" />
              <div className="grid gap-4 sm:grid-cols-2">
                <FloatInput id="own-business-name" label="Business name" autoComplete="organization" value={data["own-business-name"] ?? ""} onChange={(v) => set("own-business-name", v)} />
                <FloatInput id="years-in-business" label="Years in business" optional type="number" min={0} max={60} step="0.5" inputMode="decimal" value={data["years-in-business"] ?? ""} onChange={(v) => set("years-in-business", v)} />
              </div>
            </>)}
          </motion.section>
        )}
      </AnimatePresence>
    </>,
    /* 4 income */ <>
      <div className="grid gap-4 sm:grid-cols-2">
        <FloatInput id="annual-income" label="Gross Annual Income" prefix={currency} inputMode="numeric" pattern="[0-9,.\s]+" value={data["annual-income"] ?? ""} onChange={(v) => set("annual-income", v)} hint={`Before tax, e.g. 85,000`} />
        <FloatInput id="other-income" label="Other Monthly Income" prefix={currency} optional inputMode="numeric" pattern="[0-9,.\s]+" value={data["other-income"] ?? ""} onChange={(v) => set("other-income", v)} hint="Rental, investments, etc." />
      </div>
      <section><GroupLabel id="g-pay" label="Pay Frequency" /><ChipGroup name="pay-frequency" labelledBy="g-pay" options={PAY_FREQUENCIES} value={data["pay-frequency"]} onChange={(v) => set("pay-frequency", v)} /></section>
    </>,
    /* 5 details */ <>
      {loanType === "Auto/Car" && (
        <section><GroupLabel label="Vehicle" />
          <div className="grid gap-4 sm:grid-cols-3">
            <FloatInput id="vehicle-make" label="Make" value={data["vehicle-make"] ?? ""} onChange={(v) => set("vehicle-make", v)} />
            <FloatInput id="vehicle-model" label="Model" value={data["vehicle-model"] ?? ""} onChange={(v) => set("vehicle-model", v)} />
            <FloatInput id="vehicle-year" label="Year" inputMode="numeric" pattern="[0-9]{4}" value={data["vehicle-year"] ?? ""} onChange={(v) => set("vehicle-year", v)} />
          </div>
        </section>
      )}
      {loanType === "Business" && <FloatInput id="business-name" label="Registered business name" value={data["business-name"] ?? ""} onChange={(v) => set("business-name", v)} />}
      {loanType === "Education" && <FloatInput id="school-name" label="School or program name" value={data["school-name"] ?? ""} onChange={(v) => set("school-name", v)} />}
      {PURPOSES[loanType] ? (
        <section><GroupLabel id="g-purpose" label={PURPOSES[loanType].label} /><ChipGroup name="purpose" labelledBy="g-purpose" options={PURPOSES[loanType].options} value={data.purpose} onChange={(v) => set("purpose", v)} /></section>
      ) : <p className="text-slate-500">Go back to step 1 and choose a loan type.<Ar en="Go back to step 1 and choose a loan type." /></p>}
      <div>
        <div className="relative">
          <textarea id="notes" name="notes" rows={3} placeholder=" " value={data.notes ?? ""} onChange={(e) => set("notes", e.target.value)}
            className="peer min-h-[112px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 pt-7 pb-2 text-[15px] text-slate-900 transition-[border-color,box-shadow] hover:border-[#3B2BBF]/35 focus:border-[#3B2BBF] focus:ring-4 focus:ring-[#3B2BBF]/15 focus:outline-none" />
          <label htmlFor="notes" className="pointer-events-none absolute top-2.5 left-4 text-xs font-medium text-slate-500 peer-focus:text-[#3B2BBF]">Notes <span className="font-normal">(optional)</span></label>
        </div>
        <Ar text={`${AR.Notes} ${AR["(optional)"]}`} className="mt-1 px-1 text-[12.5px]" />
        <p className="mt-0.5 px-1 text-xs text-slate-500">Anything else we should know</p>
      </div>
    </>,
    /* 6 identity */ <>
      <section data-id-section>
        <GroupLabel id="g-id-type" label="ID type" />
        <OptionCards name="id-type" labelledBy="g-id-type" cols="sm:grid-cols-3" layout="stack-sm" testid="id-card"
          options={ID_TYPES.map((t, i) => { const [title, sub] = t.split(" ("); return { value: t, title, sub: sub ? `(${sub}` : undefined, img: ID_IMG[i] } })}
          value={data["id-type"]} onChange={(v) => set("id-type", v)} />
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        <FloatInput id="id-number" label="ID number" autoComplete="off" spellCheck={false} maxLength={30} pattern="[A-Za-z0-9\- ]{4,30}" title="4–30 letters, numbers or dashes" hint="As shown on the document" value={data["id-number"] ?? ""} onChange={(v) => set("id-number", v)} />
        <FloatInput id="id-expiry" label="Expiry date" type="date" min={todayIso} max="2060-12-31" hint="Must be a valid, unexpired ID" value={data["id-expiry"] ?? ""} onChange={(v) => set("id-expiry", v)} />
      </div>
      <section data-id-section>
        <GroupLabel label="Upload ID"><span className="text-xs text-slate-500">{data["id-type"] === "Passport" ? "Photo page required; back optional" : "Front and back required"}</span></GroupLabel>
        <IdDropzones idType={data["id-type"] || ""} files={idFiles} errors={idErrors} setFile={setIdFile} />
        <div className="mt-4"><PrivacyNoteV2 /></div>
      </section>
    </>,
    /* 7 review */ <ReviewScreen app={app} screens={screens} edit={edit} contactError={contactError} chooseContact={chooseContact} />,
  ]

  const nextLabel = screen === REVIEW ? "Submit Enquiry" : returnToReview ? "Save & review" : "Continue"
  const progress = done ? 1 : screen / screens.length

  return (
    <div className="min-h-svh bg-[#F6F4FF] text-slate-900 antialiased lg:grid lg:grid-cols-[minmax(320px,26rem)_1fr] xl:grid-cols-[28rem_1fr]">
      <a href="#main" className="sr-only z-[80] rounded-full bg-[#3B2BBF] px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4">Skip to form</a>
      {panel}

      {/* phone / tablet compact top bar */}
      <header className="journey sticky top-0 z-50 overflow-hidden text-white lg:hidden">
        <div aria-hidden className="journey-mesh" />
        <div className="relative z-10 px-4 pt-3 pb-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <a href={`${BASE}v2/`} aria-label="Avant Loans Middle East home" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"><Logo variant="white" className="h-8" /></a>
            <CurrencySelect dark />
          </div>
          <div className="mt-2.5 flex items-end justify-between gap-3">
            <p className="min-w-0 text-sm font-bold leading-tight">{done ? "Enquiry sent" : S.short}{!done && <Ar en={S.short} inline className="ml-2 !text-[11px] !text-white/75" />}</p>
            <p data-testid="mobile-step" className="flex-none text-xs font-semibold tabular-nums text-white/85">{done ? "" : `Step ${screen + 1} of ${screens.length}`}{!done && <Ar en={`Step ${screen + 1} of ${screens.length}`} inline className="ml-1.5 !text-[10.5px] !text-white/75" />}</p>
          </div>
          <div aria-hidden className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-[#8FB0FF] to-white" initial={false} animate={{ width: `${Math.max(6, (done ? 1 : (screen + 1) / screens.length) * 100)}%` }} transition={{ duration: reduced ? 0 : 0.45 }} />
          </div>
        </div>
      </header>

      <main id="main" className="relative min-w-0 px-3 pt-4 pb-32 sm:px-6 lg:px-10 lg:pt-8 lg:pb-12 xl:px-16">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_60%_at_70%_0%,rgba(47,107,255,.10),transparent_70%)]" />
        <div className="relative mx-auto mb-5 hidden max-w-[760px] items-center justify-between lg:flex">
          <p className="text-sm font-medium text-slate-600">Preview · Online Loan Application Form</p>
          <div className="flex items-center gap-3">
            <CurrencySelect />
            <a href={`${BASE}v2/`} className={`inline-flex items-center gap-1.5 rounded-full border border-[#3B2BBF]/25 bg-white px-4 py-2 text-sm font-semibold text-[#3B2BBF] hover:bg-[#3B2BBF]/5 ${focusRing}`}><ArrowLeft aria-hidden className="h-4 w-4" /> Back to home</a>
          </div>
        </div>

        <h1 className="sr-only">Online Loan Application Form</h1>
        <div className="relative mx-auto max-w-[760px] rounded-[30px] border border-white bg-white/95 shadow-[0_40px_90px_-50px_rgba(26,20,70,.55),0_1px_0_rgba(255,255,255,.9)_inset] ring-1 ring-[#3B2BBF]/[.06]">
          {done ? (
            <Success delivered={delivered} onRestart={restart} headRef={headRef} reduced={!!reduced} />
          ) : (
            <form ref={formRef} noValidate onSubmit={onSubmit} onKeyDown={onKeyDown} className="p-5 sm:p-9 lg:p-10">
              <div className="flex items-start gap-4">
                <div className="hidden sm:block"><Ring value={progress} label={`${Math.round(progress * 100)}% complete`} /></div>
                <div className="min-w-0 flex-1">
                  <p className="hidden text-xs font-semibold tracking-wide text-[#3B2BBF] uppercase sm:block">Step {screen + 1} of {screens.length}<Ar en={`Step ${screen + 1} of ${screens.length}`} inline className="ml-2 tracking-normal normal-case" /></p>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div key={screen} initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
                      <h2 ref={headRef} tabIndex={-1} className="font-display sm:mt-1 text-[clamp(1.5rem,3.2vw,2.1rem)] leading-tight font-extrabold tracking-tight text-slate-900 outline-none">{S.title}<Ar en={S.title} className="mt-0.5 !text-[0.5em] font-medium tracking-normal" /></h2>
                      <p className="mt-1.5 text-[15px] text-slate-600">{S.sub}<Ar en={S.sub} className="mt-0.5" /></p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
              <p className="sr-only" aria-live="polite">{`Step ${screen + 1} of ${screens.length}: ${S.title}`}</p>
              <div className="mt-6 h-px bg-gradient-to-r from-[#3B2BBF]/25 via-slate-200 to-transparent" />

              <AnimatePresence mode="wait" initial={false} custom={dir}>
                <motion.fieldset key={screen} custom={dir} data-screen={screen}
                  initial={reduced ? false : { opacity: 0, x: 36 * dir }} animate={{ opacity: 1, x: 0 }} exit={reduced ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, x: -36 * dir }}
                  transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }} className="mt-6 grid min-w-0 gap-7">
                  <legend className="sr-only">{S.title}</legend>
                  {body[screen]}
                </motion.fieldset>
              </AnimatePresence>

              <div aria-live="assertive">{error && <p role="alert" className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}<Ar en={error} className="!text-rose-800/80" /></p>}</div>
              {screen === REVIEW && <p data-testid="submit-notice" className="mt-6 text-center text-xs leading-relaxed text-slate-500 sm:text-[13px]">{SUBMIT_NOTICE}<Ar en="SUBMIT_NOTICE" className="mx-auto mt-1 max-w-2xl text-center" /></p>}

              {/* phone: sticky bottom bar; desktop: inline at the end of the card */}
              <div data-testid="nav-bar" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#3B2BBF]/10 bg-white/95 px-3 pt-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-[0_-14px_34px_-20px_rgba(26,20,70,.45)] backdrop-blur-md lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
                <div className="mx-auto flex max-w-[760px] items-center gap-3">
                  {screen > 0 && (
                    <button type="button" onClick={back} data-testid="back-btn" className={`inline-flex h-14 flex-none items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 font-semibold text-slate-700 hover:border-[#3B2BBF] hover:text-[#3B2BBF] ${focusRing}`}>
                      <ArrowLeft aria-hidden className="h-4 w-4" /><span className="leading-tight">Back<Ar en="Back" className="text-center" /></span>
                    </button>
                  )}
                  <button type="submit" disabled={sending} data-testid="next-btn" className={`group inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#3B2BBF,#4B3BDF_55%,#2F6BFF)] px-6 font-semibold text-white shadow-[0_18px_40px_-16px_rgba(59,43,191,.95)] transition-[filter,transform] hover:brightness-110 active:scale-[.99] disabled:opacity-70 lg:ml-auto lg:max-w-[18rem] ${focusRing}`}>
                    {sending ? <><Loader2 aria-hidden className="h-4 w-4 animate-spin" /><span className="leading-tight">Sending…<Ar en="Sending…" className="text-center !text-white/85" /></span></>
                      : <><span className="leading-tight">{nextLabel}<Ar en={nextLabel} className="text-center !text-white/85" /></span><ArrowRight aria-hidden className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" /></>}
                  </button>
                </div>
              </div>
              <p className="mt-6 hidden items-center justify-center gap-2 text-center text-xs text-slate-500 lg:flex"><ShieldCheck aria-hidden className="h-4 w-4 flex-none text-emerald-600" /><span>Your details are sent over an encrypted connection.<Ar en="Your details are sent over an encrypted connection." className="text-center" /></span></p>
            </form>
          )}
        </div>
        <p className="relative mx-auto mt-6 max-w-[760px] px-2 text-[11px] leading-relaxed text-slate-500 lg:hidden"><span className="font-semibold text-slate-600">{COMPANY_LINE}</span> {REGULATORY_LINE}</p>
      </main>
    </div>
  )
}

/* ---------------- review ---------------- */
function ReviewScreen({ app, screens, edit, contactError, chooseContact }: {
  app: ReturnType<typeof useApplication>; screens: Screen[]; edit: (i: number) => void; contactError: string; chooseContact: (m: "WhatsApp" | "Email") => void
}) {
  const [clip, setClip] = useState(true) // contact panel: clip only while expanding, so the code list can overflow
  const contactMethod = app.data["contact-method"]
  useEffect(() => { setClip(true); const t = setTimeout(() => setClip(false), 320); return () => clearTimeout(t) }, [contactMethod])
  const { data, set, currency, amountNum, months, idFiles } = app
  const d = (k: string) => (data[k] ?? "").trim()
  const join = (...xs: string[]) => xs.filter(Boolean).join(", ")
  const sections: [number, [string, string][]][] = [
    [0, [["Loan type", loanTypeById(data["loan-type"])?.label ?? d("loan-type")], ["Amount", amountNum ? `${formatMoney(amountNum, currency)}${currency !== "USD" ? ` (≈ ${formatMoney(toUsd(amountNum, currency), "USD")})` : ""}` : ""], ["Loan Duration", durationText(months)]]],
    [1, [["Name", join(d("first-name")) + (d("last-name") ? ` ${d("last-name")}` : "")], ["Birth date", d("birth-date")], ["Email", d("email")], ["Marital status", d("marital")]]],
    [2, [["Address", join(d("street"), d("street-2"), d("city"), d("region"), d("postal"))], ["Country", d("country")]]],
    [3, [["Employment", d("employment")], ...(d("employer") ? [["Employer", join(d("employer"), d("job-title"), d("years-employed") && `${d("years-employed")} yrs`)] as [string, string]] : []), ...(d("own-business-name") ? [["Your Business", join(d("own-business-name"), d("years-in-business") && `${d("years-in-business")} yrs`)] as [string, string]] : [])]],
    [4, [["Annual income", d("annual-income") && `${currency} ${d("annual-income")}`], ["Other monthly income", d("other-income") ? `${currency} ${d("other-income")}` : "None"], ["Pay frequency", d("pay-frequency")]]],
    [5, [["Purpose", d("purpose")], ...(d("vehicle-make") ? [["Vehicle", join(d("vehicle-make"), d("vehicle-model"), d("vehicle-year"))] as [string, string]] : []), ...(d("business-name") ? [["Business name", d("business-name")] as [string, string]] : []), ...(d("school-name") ? [["School / Program", d("school-name")] as [string, string]] : []), ...(d("notes") ? [["Notes", d("notes")] as [string, string]] : [])]],
    [6, [["ID type", (d("id-type").split(" (")[0])], ["ID number", d("id-number")], ["Expiry date", d("id-expiry")], ["Documents", [idFiles.front && "front", idFiles.back && "back"].filter(Boolean).join(" + ") + " attached"]]],
  ]
  return (<>
    <div data-testid="review-summary" className="grid gap-3 sm:grid-cols-2">
      {sections.map(([i, rows]) => (
        <section key={i} aria-labelledby={`rv-${i}`} className="min-w-0 rounded-2xl border border-[#3B2BBF]/12 bg-[linear-gradient(180deg,#FBFAFF,#F5F3FF)] p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 id={`rv-${i}`} className="font-display text-sm font-bold text-[#3B2BBF]">{screens[i].short}<Ar en={screens[i].short} className="!font-sans !text-[11px] font-medium" /></h3>
            <button type="button" onClick={() => edit(i)} data-testid={`edit-${i}`} aria-label={`Edit ${screens[i].title}`}
              className={`inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold leading-tight text-[#3B2BBF] ring-1 ring-[#3B2BBF]/20 hover:bg-[#F3F0FF] ${focusRing}`}>
              <Pencil aria-hidden className="h-3 w-3" /><span>Edit<Ar en="Edit" className="text-center !text-[10.5px]" /></span>
            </button>
          </div>
          <dl className="mt-2 grid gap-1.5 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] gap-2">
                <dt className="text-slate-600">{k}<Ar en={k} className="!text-[10.5px]" /></dt>
                <dd className="min-w-0 font-semibold break-words text-slate-900">{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>

    <section>
      <GroupLabel id="g-contact" label="How should we contact you?"><span className="text-xs text-slate-500">Choose one</span></GroupLabel>
      <div role="radiogroup" aria-labelledby="g-contact" aria-describedby={contactError ? "contact-error" : undefined} className="grid grid-cols-2 gap-3">
        {([["WhatsApp", "Chat on WhatsApp", balloonImg], ["Email", "Reply by email", emailImg]] as const).map(([m, sub, img], i) => {
          const on = data["contact-method"] === m
          return (
            <label key={m} htmlFor={`contact-method-${i}`} data-testid={`contact-${m}`}
              className={`relative flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border p-4 text-center transition-all has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#3B2BBF] ${on ? "border-[#3B2BBF] bg-[linear-gradient(180deg,#F6F4FF,#EEEAFF)] ring-1 ring-[#3B2BBF]/30 shadow-[0_18px_40px_-22px_rgba(59,43,191,.85)]" : contactError ? "border-rose-300 bg-rose-50/40" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-[#3B2BBF]/40 motion-reduce:hover:translate-y-0"}`}>
              <input id={`contact-method-${i}`} type="radio" name="contact-method" value={m} checked={on} required={i === 0} onChange={() => chooseContact(m)} className="sr-only" />
              <span aria-hidden className="relative">
                <img src={img} alt="" width={256} height={256} className="h-12 w-12 object-contain drop-shadow-[0_8px_10px_rgba(59,43,191,.25)]" />
                {m === "WhatsApp" && <span className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-white bg-[#25D366]" />}
              </span>
              <span className={`font-display text-[15px] font-semibold ${on ? "text-[#3B2BBF]" : "text-slate-900"}`}>{m}<Ar en={m} className="text-center" /></span>
              <span className="text-xs text-slate-500">{sub}<Ar en={sub} className="text-center !text-[10.5px]" /></span>
              {on && <span aria-hidden className="absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#3B2BBF] text-white"><Check className="h-3 w-3" strokeWidth={3} /></span>}
            </label>
          )
        })}
      </div>
      {contactError && <p id="contact-error" role="alert" className="mt-2 text-sm font-medium text-rose-700">{contactError}<Ar en={contactError} className="!text-rose-700/80" /></p>}
      <AnimatePresence initial={false} mode="wait">
        {data["contact-method"] && (
          <motion.div key={data["contact-method"]} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} onAnimationComplete={() => setClip(false)}
            className={`-mx-1 px-1 ${clip ? "overflow-hidden" : "overflow-visible"}`}>
            {data["contact-method"] === "WhatsApp" ? (
              <div className="grid gap-2 pt-4">
                <label htmlFor="whatsapp-number" className="text-sm font-medium text-slate-700">Is this your WhatsApp number? <span className="font-normal text-slate-500">Edit if needed.</span><Ar en="Is this your WhatsApp number? Edit if needed." /></label>
                <div className="grid grid-cols-[minmax(0,8rem)_minmax(0,1fr)] gap-2">
                  <DialCodeCombobox size="lg" value={data["whatsapp-dial"] ?? "+966"} onChange={(v) => set("whatsapp-dial", v)} />
                  <input id="whatsapp-number" name="whatsapp-number" type="tel" inputMode="tel" autoComplete="tel-national" required pattern="[0-9][0-9 ]{5,15}" title="Digits only, without the country code"
                    placeholder="50 123 4567" value={data["whatsapp-number"] ?? ""} onChange={(e) => set("whatsapp-number", e.target.value.replace(/[^\d ]/g, ""))}
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[15px] tabular-nums placeholder:text-slate-400 focus:border-[#3B2BBF] focus:ring-4 focus:ring-[#3B2BBF]/15 focus:outline-none aria-[invalid=true]:border-rose-400" />
                </div>
              </div>
            ) : (
              <div className="grid gap-2 pt-4">
                <label htmlFor="contact-email" className="text-sm font-medium text-slate-700">We’ll email you at <span className="font-normal text-slate-500">(edit if needed)</span><Ar en="We’ll email you at (edit if needed)" /></label>
                <input id="contact-email" name="contact-email" type="email" inputMode="email" autoComplete="email" required placeholder="name@example.com" value={data["contact-email"] ?? ""} onChange={(e) => set("contact-email", e.target.value)}
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[15px] placeholder:text-slate-400 focus:border-[#3B2BBF] focus:ring-4 focus:ring-[#3B2BBF]/15 focus:outline-none aria-[invalid=true]:border-rose-400" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>

    <label htmlFor="consent" className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-600 has-[:checked]:border-[#3B2BBF]/40 has-[:checked]:bg-[#F6F4FF] has-[[aria-invalid=true]]:border-rose-400 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[#3B2BBF]">
      <input id="consent" name="consent" type="checkbox" required checked={data.consent === "yes"} onChange={(e) => set("consent", e.target.checked ? "yes" : "")} className="mt-0.5 h-5 w-5 flex-none accent-[#3B2BBF]" />
      <span>I confirm the details are accurate and agree that Avant Middle East may contact me about this enquiry.<Ar en="I confirm the details are accurate and agree that Avant Middle East may contact me about this enquiry." className="mt-1" /></span>
    </label>
  </>)
}

/* ---------------- success ---------------- */
const BURST = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * Math.PI * 2, r = 70 + (i % 3) * 26
  return { x: Math.round(Math.cos(a) * r), y: Math.round(Math.sin(a) * r * 0.8), c: ["#3B2BBF", "#2F6BFF", "#F5C451", "#34D399", "#A5B4FF"][i % 5], d: (i % 4) * 40, rot: i * 37 }
})
function Success({ delivered, onRestart, headRef, reduced }: { delivered: boolean; onRestart: () => void; headRef: React.RefObject<HTMLHeadingElement | null>; reduced: boolean }) {
  return (
    <div role="status" data-testid="success" className="relative overflow-hidden px-6 py-12 text-center sm:px-12 sm:py-16">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(50%_70%_at_50%_0%,rgba(52,211,153,.18),transparent_70%)]" />
      <div className="relative mx-auto h-28 w-28">
        {!reduced && delivered && BURST.map((p, i) => (
          <span key={i} aria-hidden className="confetti" style={{ "--x": `${p.x}px`, "--y": `${p.y}px`, "--r": `${p.rot}deg`, background: p.c, animationDelay: `${p.d}ms` } as React.CSSProperties} />
        ))}
        <motion.img src={delivered ? checkImg : memoImg} alt="" width={256} height={256} initial={reduced ? false : { scale: 0.3, rotate: -20, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 14 }} className="float-tilt relative h-28 w-28 object-contain drop-shadow-[0_22px_24px_rgba(16,120,80,.35)]" />
      </div>
      <h2 ref={headRef} tabIndex={-1} className="relative mt-7 font-display text-2xl font-extrabold text-slate-900 outline-none sm:text-3xl">{SUCCESS_COPY.title(delivered)}<Ar en={SUCCESS_COPY.title(delivered)} className="mt-1 text-center !text-[0.6em] font-medium" /></h2>
      <p className="relative mx-auto mt-4 max-w-lg leading-relaxed text-slate-600">{SUCCESS_COPY.body(delivered)}<Ar en={SUCCESS_COPY.body(delivered)} className="mt-2 text-center" /></p>
      <button type="button" onClick={onRestart} className={`relative mt-8 rounded-full border border-[#3B2BBF]/30 px-6 py-3 text-sm font-semibold text-[#3B2BBF] hover:bg-[#3B2BBF]/5 ${focusRing}`}>Start a new enquiry<Ar en="Start a new enquiry" className="text-center" /></button>
    </div>
  )
}
