/*
 * Shared application logic for /apply/ and /apply-v2/ (one source of truth: fields, rules, validation, snapshot, submit).
 * The two routes only differ in presentation. Answers stay in memory until submit; submit POSTs to the Worker
 * (which holds the Telegram secrets) when VITE_TELEGRAM_API_URL is set. No bot token in the client.
 */
import { useEffect, useRef, useState } from "react"
import { currencyInfo, formatMoney, loanRange, toUsd, useCurrency, useGeoCountry, type CurrencyCode } from "./currency"
import { loanTypeById, loanTypeBySlug } from "./loanTypes"
import { submitApplication, isLive } from "./submit"
import { checkIdFile, type IdFiles, type IdSide } from "../components/IdUpload"
import houseImg from "../assets/3d/fluent-house.webp"
import carImg from "../assets/3d/fluent-car.webp"
import moneyBagImg from "../assets/3d/fluent-money-bag.webp"
import briefcaseImg from "../assets/3d/fluent-briefcase.webp"
import gradCapImg from "../assets/3d/fluent-grad-cap.webp"

export type Data = Record<string, string>

/* Per-field error copy (shown as text under the field, not colour alone). Keyed by input name/id. */
const REQUIRED_MSG: Record<string, string> = {
  "first-name": "Enter your first name", "last-name": "Enter your last name", street: "Enter your street address",
  city: "Enter your city", region: "Enter your region", postal: "Enter your postal or zip code", country: "Choose your country",
  "birth-date": "Enter your birth date", email: "Enter your email address", marital: "Choose your marital status",
  employment: "Choose your employment status", employer: "Enter your employer's name", "own-business-name": "Enter your business name",
  "annual-income": "Enter your gross annual income", "pay-frequency": "Choose how often you are paid", purpose: "Choose what the loan is for",
  "vehicle-make": "Enter the vehicle make", "vehicle-model": "Enter the vehicle model", "vehicle-year": "Enter the vehicle year",
  "business-name": "Enter the registered business name", "school-name": "Enter the school or program name",
  "id-type": "Choose your ID type", "id-number": "Enter your ID number", "id-expiry": "Enter your ID expiry date",
  "whatsapp-number": "Enter your WhatsApp number", "contact-email": "Enter your email address",
  consent: "Tick the box to confirm and continue", "loan-amount": "Enter a loan amount",
}
const FORMAT_MSG: Record<string, string> = {
  "vehicle-year": "Use a 4-digit year, e.g. 2022", "id-number": "Use 4–30 letters, numbers or dashes",
  "annual-income": "Use numbers only, e.g. 85,000", "other-income": "Use numbers only, e.g. 500",
  "whatsapp-number": "Digits only, without the country code", postal: "Check your postal or zip code",
}
function fieldMessage(el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string {
  const key = el.name || el.id
  const v = el.validity
  if (v.valueMissing) return REQUIRED_MSG[key] ?? (el.tagName === "SELECT" ? "Choose an option" : "Fill in this field")
  if (v.typeMismatch && (el as HTMLInputElement).type === "email") return "Enter a valid email, like name@example.com"
  if (v.patternMismatch) return FORMAT_MSG[key] ?? (el.title || "Check the format")
  const min = (el as HTMLInputElement).min, max = (el as HTMLInputElement).max
  if (key === "id-expiry" && v.rangeUnderflow) return "This ID has expired. Use a valid, unexpired ID"
  if (key === "birth-date" && (v.rangeUnderflow || v.rangeOverflow)) return "Check your birth date: applicants must be 18 or older"
  if (v.rangeUnderflow) return `Enter ${min} or more`
  if (v.rangeOverflow) return `Enter ${max} or less`
  if (v.badInput) return "Enter a valid value"
  return REQUIRED_MSG[key] ?? "Check this field"
}

export const COUNTRIES = ["United Arab Emirates", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman", "Jordan", "Egypt", "Lebanon", "United Kingdom", "United States", "Other"]
/** Lower-case ISO codes for the flags ("Other" has a globe). Also maps /geo (upper-case) back to a country. */
export const COUNTRY_ISO: Record<string, string> = {
  "United Arab Emirates": "ae", "Saudi Arabia": "sa", Qatar: "qa", Kuwait: "kw", Bahrain: "bh", Oman: "om",
  Jordan: "jo", Egypt: "eg", Lebanon: "lb", "United Kingdom": "gb", "United States": "us", Other: "",
}
export const countryFromIso = (cc?: string) => Object.keys(COUNTRY_ISO).find((k) => COUNTRY_ISO[k] && COUNTRY_ISO[k] === (cc || "").toLowerCase())
export const MARITAL = ["Single", "Married", "Divorced", "Widowed", "Separated"]
export const PAY_FREQUENCIES = ["Monthly", "Twice a month", "Every two weeks", "Weekly", "Irregular"]

export const LOAN_TYPES = [
  { id: "Mortgage", img: houseImg, hint: "Buy or refinance a home" },
  { id: "Personal", img: moneyBagImg, hint: "Flexible use of funds" },
  { id: "Auto/Car", img: carImg, hint: "Finance a vehicle" },
  { id: "Business", img: briefcaseImg, hint: "Grow or start a company" },
  { id: "Education", img: gradCapImg, hint: "School or training costs" },
] as const
export const loanImg = (id?: string) => LOAN_TYPES.find((t) => t.id === id)?.img

/* ---------- Loan duration: typed by the customer (whole months or whole years), validated in months ---------- */
export type DurationUnit = "months" | "years"
export type DurationRule = { min: number; max: number; unit: DurationUnit; chips: number[]; default: number }
/** min/max in MONTHS; chips + default are in the rule's own unit. */
export const DURATION_RULES: Record<string, DurationRule> = {
  Personal: { min: 6, max: 60, unit: "months", chips: [12, 24, 36, 48, 60], default: 36 },
  "Auto/Car": { min: 12, max: 84, unit: "years", chips: [1, 2, 3, 4, 5, 6, 7], default: 4 },
  Mortgage: { min: 60, max: 300, unit: "years", chips: [5, 10, 15, 20, 25], default: 20 },
  Business: { min: 6, max: 120, unit: "years", chips: [1, 2, 3, 4, 5], default: 3 },
  Education: { min: 6, max: 120, unit: "years", chips: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], default: 3 },
}
export const durationRule = (loanType?: string) => DURATION_RULES[loanType || ""] ?? DURATION_RULES.Personal
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`
const yearsOf = (m: number) => Math.round((m / 12) * 10) / 10
/** Allowed range in a unit: years use whole years inside the month limits (e.g. Personal 1–5 years). */
export function durationBounds(loanType: string, unit: DurationUnit) {
  const r = durationRule(loanType)
  return unit === "months" ? { min: r.min, max: r.max } : { min: Math.max(1, Math.ceil(r.min / 12)), max: Math.floor(r.max / 12) }
}
/** Months entered, or 0 when the box is empty / not a whole number. */
export function durationMonths(d: Data) {
  const v = (d["duration-value"] ?? "").trim()
  if (!/^\d+$/.test(v)) return 0
  return Number(v) * (d["duration-unit"] === "years" ? 12 : 1)
}
/** "36 months (3 years)" / "18 months (1.5 years)" / "8 months": the summary, review and Telegram text. */
export function durationText(months: number) {
  if (!months) return ""
  return months >= 12 ? `${plural(months, "month")} (${plural(yearsOf(months), "year")})` : plural(months, "month")
}
/** "36 months · 3 years": the live read-out under the input. */
export const durationReadout = (months: number) => (months >= 12 ? `${plural(months, "month")} · ${plural(yearsOf(months), "year")}` : months ? plural(months, "month") : "")
export function durationError(d: Data): string {
  const lt = d["loan-type"]; if (!lt) return ""
  const unit = (d["duration-unit"] as DurationUnit) || durationRule(lt).unit
  const v = (d["duration-value"] ?? "").trim()
  const b = durationBounds(lt, unit)
  const range = `${b.min} and ${b.max} ${unit}`
  if (!v) return `Enter a loan duration between ${range}.`
  if (!/^\d+$/.test(v)) return `Use whole ${unit} only (between ${range}).`
  const m = durationMonths(d), r = durationRule(lt)
  if (m < r.min || m > r.max) return `Enter a loan duration between ${range}.`
  return ""
}

/** Per-loan-type purpose options (field "purpose") and the heading they sit under. */
export const PURPOSES: Record<string, { label: string; options: string[] }> = {
  Mortgage: { label: "Loan Purpose", options: ["Buy a home", "Refinance", "Home equity", "Build a home"] },
  "Auto/Car": { label: "Use of Funds", options: ["Buy new vehicle", "Buy used vehicle", "Refinance auto loan"] },
  Business: { label: "Use of Funds", options: ["Working capital", "Equipment", "Expansion", "Start-up costs"] },
  Education: { label: "Use of Funds", options: ["Tuition", "Living expenses", "Both tuition and living"] },
  Personal: { label: "Use of Funds", options: ["Debt consolidation", "Home improvement", "Medical", "Travel", "Other"] },
}

export const loanDetailsLabel = (loanType: string) => ({
  Mortgage: "Mortgage Details",
  Personal: "Loan Details",
  "Auto/Car": "Auto Loan Details",
  Business: "Business Loan Details",
  Education: "Education Loan Details",
}[loanType] || "Loan Details")

/** Dialling codes for the WhatsApp number (default follows the visitor's currency). */
/** WhatsApp country codes (value = code). Flags are flag-icons SVGs (see components/Flag.tsx). */
export const DIAL_CODES = [
  { code: "+966", name: "Saudi Arabia", iso: "sa" }, { code: "+971", name: "United Arab Emirates", iso: "ae" },
  { code: "+974", name: "Qatar", iso: "qa" }, { code: "+965", name: "Kuwait", iso: "kw" }, { code: "+973", name: "Bahrain", iso: "bh" },
  { code: "+968", name: "Oman", iso: "om" }, { code: "+1", name: "United States", iso: "us" }, { code: "+44", name: "United Kingdom", iso: "gb" },
  { code: "+91", name: "India", iso: "in" }, { code: "+20", name: "Egypt", iso: "eg" },
] as const
export const DIAL_BY_CURRENCY: Record<string, string> = { SAR: "+966", AED: "+971", QAR: "+974", KWD: "+965", BHD: "+973", OMR: "+968", USD: "+1" }
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const BIRTH_MAX = "2008-10-17"
export const BIRTH_MIN = "1906-01-01"

/** "WhatsApp (+966 50 123 4567)" / "Email (name@example.com)": review card + top of the Telegram message. */
export function preferredContactOf(d: Data) {
  if (d["contact-method"] === "WhatsApp") return `WhatsApp (${d["whatsapp-dial"] || ""} ${(d["whatsapp-number"] || "").trim()})`
  if (d["contact-method"] === "Email") return `Email (${(d["contact-email"] || "").trim()})`
  return ""
}

export const EMPLOYMENT = ["Employed full-time", "Employed part-time", "Self-employed", "Retired", "Not currently employed"]
/** Which work fields each employment status needs; everything else is cleared so it is never submitted. */
export const EMP_FIELDS = { employed: ["employer", "job-title", "years-employed"], self: ["own-business-name", "years-in-business"], none: [] as string[] }
export const empKindOf = (v?: string): keyof typeof EMP_FIELDS =>
  v === "Self-employed" ? "self" : v === "Employed full-time" || v === "Employed part-time" ? "employed" : "none"

export function money(v?: string) {
  const n = Number(String(v ?? "").replace(/[^\d.]/g, ""))
  return Number.isFinite(n) ? n : 0
}

/** Exactly what is sent (fields + Telegram summary are built from this). */
export function buildSnapshot(data: Data, currency: CurrencyCode): Data {
  const amountNum = money(data["loan-amount"])
  const { "duration-value": _v, "duration-unit": _u, ...rest } = data
  void _v; void _u
  return {
    ...rest,
    "loan-duration": durationText(durationMonths(data)),
    "loan-amount": amountNum ? formatMoney(amountNum, currency) : data["loan-amount"],
    "loan-currency": currency,
    preferredContact: preferredContactOf(data),
    ...Object.fromEntries((["annual-income", "other-income"] as const)
      .filter((k) => (data[k] ?? "").trim()).map((k) => [k, `${currency} ${data[k].trim()}`])),
    "loan-amount-usd": amountNum ? formatMoney(toUsd(amountNum, currency), "USD") : "",
  }
}

/** Which extra (non-native) checks a screen needs. */
export type ScreenChecks = { loanType?: boolean; id?: boolean; contact?: boolean }

export function useApplication() {
  const [data, setData] = useState<Data>({})
  const [done, setDone] = useState(false)
  const [delivered, setDelivered] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const clearFieldError = (k: string) => setFieldErrors((f) => { if (!(k in f)) return f; const n = { ...f }; delete n[k]; return n })
  const { code: currency } = useCurrency()
  const set = (k: string, v: string) => {
    document.getElementById(k)?.removeAttribute("aria-invalid") // clear the red state as soon as the field is edited
    clearFieldError(k)
    setError("")
    setData((d) => ({ ...d, [k]: v }))
  }

  // Country: preselect from the /geo IP lookup when the field is still empty (the visitor can change it).
  const geo = useGeoCountry()
  useEffect(() => {
    const c = countryFromIso(geo)
    if (c) setData((d) => (d.country ? d : { ...d, country: c }))
  }, [geo])

  const [contactError, setContactError] = useState("")
  const chooseContact = (m: "WhatsApp" | "Email") => {
    setContactError("")
    setData((d) => ({
      ...d,
      "contact-method": m,
      ...(m === "WhatsApp"
        ? { "whatsapp-dial": d["whatsapp-dial"] || DIAL_BY_CURRENCY[currency] || "+966", "whatsapp-number": d["whatsapp-number"] ?? (d.mobile || "").replace(/^\+\d{1,3}\s*/, "") }
        : { "contact-email": d["contact-email"] ?? d.email ?? "" }),
    }))
  }

  const empKind = empKindOf(data.employment)
  const setEmployment = (v: string) => { clearFieldError("employment"); setData((d) => {
    const keep = new Set(EMP_FIELDS[empKindOf(v)])
    const next: Data = { ...d, employment: v }
    for (const k of [...EMP_FIELDS.employed, ...EMP_FIELDS.self]) if (!keep.has(k)) delete next[k]
    return next
  }) }

  const [idFiles, setIdFiles] = useState<IdFiles>({})
  const [idErrors, setIdErrors] = useState<Partial<Record<IdSide, string>>>({})
  const setIdFile = (side: IdSide, f?: File) => {
    if (f) {
      const err = checkIdFile(f)
      if (err) { setIdErrors((e) => ({ ...e, [side]: err })); return }
    }
    setIdErrors((e) => ({ ...e, [side]: undefined }))
    setIdFiles((cur) => ({ ...cur, [side]: f }))
  }
  const todayIso = new Date().toISOString().slice(0, 10)

  const loanType = data["loan-type"] || ""
  const range = loanRange(loanType || "Personal", currency)
  const durationUnit = (data["duration-unit"] as DurationUnit) || durationRule(loanType).unit
  const months = durationMonths(data)
  const [durationErr, setDurationErr] = useState("")
  const setDuration = (raw: string) => {
    document.getElementById("loan-duration")?.removeAttribute("aria-invalid"); setDurationErr(""); setError("")
    setData((d) => ({ ...d, "duration-value": raw.replace(/[^\d]/g, "").slice(0, 3), "duration-unit": d["duration-unit"] || durationRule(d["loan-type"]).unit }))
  }
  /** Switch unit and convert: months -> nearest whole year (clamped to the year range); years -> x12. */
  const setDurationUnit = (unit: DurationUnit) => {
    document.getElementById("loan-duration")?.removeAttribute("aria-invalid"); setDurationErr("")
    setData((d) => {
      const from = (d["duration-unit"] as DurationUnit) || durationRule(d["loan-type"]).unit
      if (from === unit) return d
      const m = durationMonths(d)
      let v = d["duration-value"] ?? ""
      if (m) {
        if (unit === "years") { const b = durationBounds(d["loan-type"] || "", "years"); v = String(Math.min(b.max, Math.max(b.min, Math.round(m / 12)))) }
        else v = String(m)
      }
      return { ...d, "duration-value": v, "duration-unit": unit }
    })
  }
  const stepDuration = (delta: number) => {
    const b = durationBounds(loanType, durationUnit)
    const cur = Number(data["duration-value"] || 0)
    const nextV = Math.min(b.max, Math.max(b.min, (cur || (delta > 0 ? b.min - 1 : b.min + 1)) + delta))
    setDuration(String(nextV))
  }
  const pickDurationChip = (v: number) => {
    document.getElementById("loan-duration")?.removeAttribute("aria-invalid"); setDurationErr(""); setError("")
    setData((d) => ({ ...d, "duration-value": String(v), "duration-unit": durationRule(d["loan-type"]).unit }))
  }
  const amountNum = money(data["loan-amount"])

  const pickLoanType = (id: string) => {
    for (const k of ["loan-duration", "loan-amount"]) document.getElementById(k)?.removeAttribute("aria-invalid") // auto-filled below
    setDurationErr("")
    const r = loanRange(id, currency)
    const dr = durationRule(id)
    setData((prev) => {
      // keep a typed duration that is still valid for the new type (and still whole in its unit), else the type's default
      const keep = !durationError({ ...prev, "loan-type": id }) && prev["duration-value"]
      return {
        ...prev,
        "loan-type": id,
        "loan-amount": prev["loan-amount"] && money(prev["loan-amount"]) >= r.min && money(prev["loan-amount"]) <= r.max
          ? prev["loan-amount"]
          : String(r.default),
        "duration-value": keep ? prev["duration-value"] : String(dr.default),
        "duration-unit": keep ? prev["duration-unit"] : dr.unit,
      }
    })
  }

  // ?type=<slug> from the homepage: preselect and collapse the loan-type selector to a chip ("Personal Loan · Change").
  const [typeLocked, setTypeLocked] = useState(false)
  const [loanTypeError, setLoanTypeError] = useState("")
  const cameWithType = useRef(false)
  useEffect(() => {
    const t = loanTypeBySlug(new URLSearchParams(window.location.search).get("type"))
    if (t) { cameWithType.current = true; pickLoanType(t.id); setTypeLocked(true) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const chooseLoanType = (id: string) => {
    pickLoanType(id); setLoanTypeError("")
    // the loan type was the missing field: drop the "complete the highlighted field" banner too (re-checked on Continue)
    if (!document.querySelector('[aria-invalid="true"]:not([name="loan-type"])')) setError("")
    const slug = loanTypeById(id)?.slug
    if (slug) { const u = new URL(window.location.href); u.searchParams.set("type", slug); window.history.replaceState(null, "", u) }
    if (cameWithType.current) setTypeLocked(true)
  }

  // Currency switched: convert the entered amount via USD, snap to the new step, clamp to the new limits.
  const prevCurrency = useRef(currency)
  useEffect(() => {
    const from = prevCurrency.current
    prevCurrency.current = currency
    if (from === currency) return
    setData((prev) => {
      const n = money(prev["loan-amount"])
      if (!n || !prev["loan-type"]) return prev
      const r = loanRange(prev["loan-type"], currency)
      const usd = toUsd(n, from)
      const conv = usd * currencyInfo(currency).perUsd
      const target = n === loanRange(prev["loan-type"], from).default
        ? r.default // untouched default -> the new currency's clean default
        : Math.min(r.max, Math.max(r.min, Math.round(conv / r.step) * r.step))
      return { ...prev, "loan-amount": String(target) }
    })
  }, [currency])

  const setAmount = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "")
    if (!digits) { set("loan-amount", ""); return }
    const n = Math.min(range.max, Math.max(0, Number(digits)))
    set("loan-amount", String(n))
  }

  /** Validate the inputs inside `root` (the current step/screen) plus the screen's extra checks. Focuses the first problem. */
  const validate = (root: HTMLElement, checks: ScreenChecks) => {
    const els = [...root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea")]
    els.forEach((el) => el.removeAttribute("aria-invalid"))
    const bad = els.filter((el) => !el.checkValidity())
    if (checks.loanType) setLoanTypeError(data["loan-type"] ? "" : "Choose a loan type to continue.")
    // amount range check (only where the amount field is on screen)
    if (data["loan-type"] && (amountNum < range.min || amountNum > range.max)) {
      const el = root.querySelector<HTMLInputElement>("#loan-amount")
      if (el) { el.setAttribute("aria-invalid", "true"); bad.push(el) }
    }
    // loan duration (only where the duration field is on screen): whole number inside the type's month limits
    const durEl = root.querySelector<HTMLInputElement>("#loan-duration")
    if (durEl && data["loan-type"]) {
      const msg = durationError(data)
      setDurationErr(msg)
      if (msg) { durEl.setAttribute("aria-invalid", "true"); bad.unshift(durEl) }
    }
    // ID documents: front always, back unless passport
    if (checks.id) {
      const errs: Partial<Record<IdSide, string>> = {}
      if (!idFiles.front) errs.front = data["id-type"] === "Passport" ? "Please upload your passport photo page." : "Please upload the front of your ID."
      if (!idFiles.back && data["id-type"] && data["id-type"] !== "Passport") errs.back = "Please upload the back of your ID."
      setIdErrors(errs)
      for (const side of ["front", "back"] as IdSide[]) {
        const el = root.querySelector<HTMLInputElement>(`#id-${side}`)
        if (errs[side] && el) { el.setAttribute("aria-invalid", "true"); bad.push(el) }
      }
    }
    if (checks.contact) {
      if (!data["contact-method"]) {
        setContactError("Please choose how we should contact you: WhatsApp or Email.")
        const el = root.querySelector<HTMLInputElement>("#contact-method-0"); if (el) bad.push(el)
      } else setContactError("")
      if (data["contact-method"] === "Email") {
        const el = root.querySelector<HTMLInputElement>("#contact-email")
        if (el && !EMAIL_RE.test(el.value.trim()) && !bad.includes(el)) bad.push(el)
      }
    }
    bad.forEach((el) => el.setAttribute("aria-invalid", "true"))
    // Per-field text (C2): one message per field name. Duration, ID files and contact method keep their own messages.
    const fe: Record<string, string> = {}
    for (const el of bad) {
      const key = el.name || el.id
      if (!key || key in fe || key === "loan-duration" || key === "contact-method" || key === "loan-type" || (el as HTMLInputElement).type === "file") continue
      fe[key] = key === "loan-amount" && el.validity.valid && data["loan-type"]
        ? `Enter an amount between ${formatMoney(range.min, currency)} and ${formatMoney(range.max, currency)}`
        : fieldMessage(el)
    }
    setFieldErrors(fe)
    const count = new Set(bad.map((el) => el.name || el.id)).size
    if (bad.length) {
      setError(`Please complete ${count === 1 ? "the highlighted field" : `the ${count} highlighted fields`} to continue.`)
      const first = bad[0] as HTMLInputElement
      if (first.dataset.proxy) document.getElementById(first.dataset.proxy)?.focus() // custom widget (country combobox)
      else if (first.type === "file") first.closest("[data-id-section]")?.scrollIntoView({ block: "center" })
      else first.focus() // the per-field message under it says what to fix
      return false
    }
    setError(""); setFieldErrors({})
    return true
  }

  /** Send the application. Returns true when the success screen should show. */
  const submit = async () => {
    if (sending) return false
    setSending(true); setError("")
    const result = await submitApplication(buildSnapshot(data, currency), idFiles)
    setSending(false)
    if (isLive && !result.delivered) {
      setError(result.error ? `Could not deliver the application: ${result.error}` : "Could not deliver the application. Please try again.")
      return false
    }
    setDelivered(result.delivered)
    setData({}); setIdFiles({}); setIdErrors({}); setContactError(""); setDone(true)
    return true
  }
  const restart = () => { setDone(false); setDelivered(false) }

  return {
    data, setData, set, currency, error, setError, fieldErrors, clearFieldError, sending, done, delivered, submit, restart,
    contactError, chooseContact, empKind, setEmployment,
    idFiles, idErrors, setIdFile, todayIso,
    loanType, range, amountNum, months, durationUnit, durationErr, setDuration, setDurationUnit, stepDuration, pickDurationChip, chooseLoanType, typeLocked, setTypeLocked, loanTypeError, setAmount,
    validate,
  }
}
export type ApplicationState = ReturnType<typeof useApplication>

/** Success / not-sent copy shared by both routes. */
export const SUCCESS_COPY = {
  title: (delivered: boolean) => (delivered ? "Thank you. Your enquiry was received." : "Nothing was sent."),
  body: (delivered: boolean) => (delivered
    ? "Our team will contact you using your preferred contact method to discuss your request. Submitting is not a loan offer or approval."
    : "Submission is not connected on this build, so your answers were not sent, saved or shared, and they have been cleared from this page."),
}
