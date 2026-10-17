/*
 * Application submit hook.
 *
 * DEMO-SAFE BY DEFAULT: if VITE_TELEGRAM_API_URL is not set at build time,
 * this never touches the network — it returns { delivered: false } and the UI
 * shows the "nothing was sent" demo success state.
 *
 * Once Ronald provides a backend URL (a Cloudflare Worker / serverless function
 * that holds the Telegram bot token as a secret — see server/telegram-worker.js),
 * set VITE_TELEGRAM_API_URL and rebuild. The token is NEVER in client code.
 */
export const API_URL: string = (import.meta.env.VITE_TELEGRAM_API_URL ?? "").trim()
export const isLive = API_URL.length > 0

export type Application = Record<string, string>

export interface SubmitResult {
  delivered: boolean
  error?: string
}

/** Human-friendly labels + grouping for the Telegram message and summary. */
export const FIELD_GROUPS: { title: string; fields: [string, string][] }[] = [
  { title: "Applicant", fields: [["first-name", "First name"], ["last-name", "Last name"], ["email", "Email"], ["birth-date", "Birth date"], ["marital", "Marital status"], ["dependents", "Dependents"], ["residency", "Residency"], ["second-applicant", "Second applicant"]] },
  { title: "Address", fields: [["street", "Street"], ["street-2", "Street line 2"], ["city", "City"], ["region", "Region"], ["postal", "Postal / ZIP"], ["country", "Country"]] },
  { title: "Employment & income", fields: [["employment", "Employment"], ["employer", "Employer"], ["job-title", "Job title"], ["years-employed", "Years employed"], ["annual-income", "Gross annual income"], ["other-income", "Other monthly income"], ["monthly-debts", "Monthly debts"], ["pay-frequency", "Pay frequency"]] },
  { title: "Mortgage loan details", fields: [["purpose", "Purpose"], ["property-type", "Property type"], ["property-city", "Property city"], ["property-country", "Property country"], ["property-value", "Property value"], ["down-payment", "Down payment"], ["term", "Preferred term"]] },
]

export function buildSummaryText(data: Application): string {
  const ts = new Date().toISOString()
  const lines: string[] = ["Avant Loans Middle East — demo application", `Submitted: ${ts}`, ""]
  for (const g of FIELD_GROUPS) {
    const rows = g.fields.filter(([k]) => (data[k] ?? "").trim() !== "")
    if (!rows.length) continue
    lines.push(`== ${g.title} ==`)
    for (const [k, label] of rows) lines.push(`${label}: ${data[k]}`)
    lines.push("")
  }
  return lines.join("\n").trim()
}

export async function submitApplication(data: Application): Promise<SubmitResult> {
  if (!isLive) return { delivered: false } // demo mode: no network at all

  const payload = {
    source: "avant-loans-3d",
    submittedAt: new Date().toISOString(),
    summary: buildSummaryText(data),
    fields: data,
  }
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return { delivered: false, error: `Server responded ${res.status}` }
    return { delivered: true }
  } catch (e) {
    return { delivered: false, error: e instanceof Error ? e.message : "Network error" }
  }
}
