/*
 * Currency config — the ONE place for rates, rounding and loan limits.
 * GCC currencies are pegged to USD, so a fixed table (USD base) is used; no live FX calls.
 */
import { useSyncExternalStore } from "react"

export type CurrencyCode = "SAR" | "AED" | "QAR" | "KWD" | "BHD" | "OMR" | "USD"

export const CURRENCIES: { code: CurrencyCode; country: string; flag: string; perUsd: number; unit: number }[] = [
  { code: "SAR", country: "Saudi Arabia", flag: "🇸🇦", perUsd: 3.75, unit: 1000 },
  { code: "AED", country: "UAE", flag: "🇦🇪", perUsd: 3.6725, unit: 1000 },
  { code: "QAR", country: "Qatar", flag: "🇶🇦", perUsd: 3.64, unit: 1000 },
  { code: "KWD", country: "Kuwait", flag: "🇰🇼", perUsd: 0.307, unit: 100 },
  { code: "BHD", country: "Bahrain", flag: "🇧🇭", perUsd: 0.376, unit: 100 },
  { code: "OMR", country: "Oman", flag: "🇴🇲", perUsd: 0.3845, unit: 100 },
  { code: "USD", country: "Other / international", flag: "🇺🇸", perUsd: 1, unit: 1000 },
]
export const DEFAULT_CURRENCY: CurrencyCode = "USD"

/** ISO country (Cloudflare request.cf.country) -> currency. Anything else -> USD. */
export const COUNTRY_CURRENCY: Record<string, CurrencyCode> = { SA: "SAR", AE: "AED", QA: "QAR", KW: "KWD", BH: "BHD", OM: "OMR" }

/** Loan limits in USD (base). Converted + rounded per currency at runtime. */
export const LOAN_RANGES_USD: Record<string, { min: number; max: number; step: number; default: number }> = {
  Mortgage: { min: 50000, max: 2000000, step: 5000, default: 350000 },
  Personal: { min: 1000, max: 75000, step: 500, default: 15000 },
  "Auto/Car": { min: 3000, max: 150000, step: 500, default: 25000 },
  Business: { min: 5000, max: 500000, step: 1000, default: 50000 },
  Education: { min: 1000, max: 100000, step: 500, default: 20000 },
}

export const currencyInfo = (c: CurrencyCode) => CURRENCIES.find((x) => x.code === c) ?? CURRENCIES[CURRENCIES.length - 1]
const isCode = (v: unknown): v is CurrencyCode => CURRENCIES.some((c) => c.code === v)

/** USD -> currency, rounded to the currency's unit (1,000 or 100). USD values are kept as-is (already round). */
export function fromUsd(usd: number, c: CurrencyCode) {
  const { perUsd, unit } = currencyInfo(c)
  if (perUsd === 1) return usd
  return Math.max(unit, Math.round((usd * perUsd) / unit) * unit)
}
export const toUsd = (amount: number, c: CurrencyCode) => Math.round(amount / currencyInfo(c).perUsd)

export function loanRange(type: string, c: CurrencyCode) {
  const r = LOAN_RANGES_USD[type] ?? LOAN_RANGES_USD.Personal
  const { unit, perUsd } = currencyInfo(c)
  const step = perUsd === 1 ? r.step : Math.max(unit, Math.round((r.step * perUsd) / unit) * unit)
  return { min: fromUsd(r.min, c), max: fromUsd(r.max, c), step, default: fromUsd(r.default, c) }
}

const fmtCache = new Map<string, Intl.NumberFormat>()
/** "SAR 150,000" (en locale, currency code shown, no decimals). */
export function formatMoney(n: number, c: CurrencyCode) {
  let f = fmtCache.get(c)
  if (!f) { f = new Intl.NumberFormat("en", { style: "currency", currency: c, currencyDisplay: "code", maximumFractionDigits: 0 }); fmtCache.set(c, f) }
  return f.format(n).replace(/\u00a0/g, " ")
}
export const formatNumber = (n: number) => new Intl.NumberFormat("en").format(n)

/* ---------- store: manual choice (localStorage) > /geo (Worker) > navigator.language region > USD ---------- */
const KEY = "avant-currency"
type State = { code: CurrencyCode; source: "manual" | "geo" | "locale" | "default" }
let state: State = { code: DEFAULT_CURRENCY, source: "default" }
const subs = new Set<() => void>()
const emit = (s: State) => { state = s; subs.forEach((f) => f()) }

function localeGuess(): CurrencyCode | null {
  for (const l of navigator.languages?.length ? navigator.languages : [navigator.language]) {
    const region = (() => { try { return new Intl.Locale(l).maximize().region } catch { return l.split("-")[1] } })()
    if (region && COUNTRY_CURRENCY[region.toUpperCase()]) return COUNTRY_CURRENCY[region.toUpperCase()]
  }
  return null
}

let started = false
export function initCurrency() {
  if (started || typeof window === "undefined") return
  started = true
  let saved: string | null = null
  try { saved = localStorage.getItem(KEY) } catch { /* private mode */ }
  if (isCode(saved)) { emit({ code: saved, source: "manual" }); return }
  const fallback = () => { const g = localeGuess(); if (state.source !== "manual") emit(g ? { code: g, source: "locale" } : { code: DEFAULT_CURRENCY, source: "default" }) }
  const api = import.meta.env.VITE_TELEGRAM_API_URL as string | undefined
  if (!api) { fallback(); return }
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 3500)
  fetch(`${api.replace(/\/$/, "")}/geo`, { signal: ctl.signal })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((j: { country?: string | null }) => {
      if (state.source === "manual") return
      const cc = (j.country || "").toUpperCase()
      emit({ code: COUNTRY_CURRENCY[cc] ?? DEFAULT_CURRENCY, source: "geo" })
    })
    .catch(fallback)
    .finally(() => clearTimeout(t))
}

export function setCurrency(code: CurrencyCode) {
  try { localStorage.setItem(KEY, code) } catch { /* ignore */ }
  emit({ code, source: "manual" })
}

export function useCurrency() {
  const s = useSyncExternalStore((f) => { subs.add(f); initCurrency(); return () => subs.delete(f) }, () => state, () => state)
  return s
}
