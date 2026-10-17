/**
 * Cloudflare Worker: receives the Avant Loans application JSON from the
 * GitHub Pages site and forwards it to Telegram via the Bot API.
 *
 * Secrets (set with wrangler, NEVER commit them):
 *   wrangler secret put TELEGRAM_BOT_TOKEN   # from @BotFather
 *   wrangler secret put TELEGRAM_CHAT_ID     # numeric chat/user/group id
 * Plain var (wrangler.toml):
 *   ALLOWED_ORIGIN = "https://sittaluvv.github.io"
 *
 * Deploy:
 *   cd server && npx wrangler deploy
 * Then rebuild the site with:
 *   VITE_TELEGRAM_API_URL=https://<worker>.workers.dev npm run build
 */

const CORS = (origin, allowed) => ({
  "Access-Control-Allow-Origin": origin && origin === allowed ? origin : "null",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
})

function formatTelegram(body) {
  if (typeof body.summary === "string" && body.summary.trim()) return body.summary.slice(0, 3900)
  const f = body.fields || {}
  const lines = [
    "Avant Loans Middle East — demo application",
    `Submitted: ${body.submittedAt || new Date().toISOString()}`,
    "",
    "== Applicant ==",
    `Name: ${f["first-name"] || ""} ${f["last-name"] || ""}`.trim(),
    `Email: ${f.email || ""}`,
    `Birth date: ${f["birth-date"] || ""}`,
    `Marital: ${f.marital || ""} | Dependents: ${f.dependents || ""}`,
    `Residency: ${f.residency || ""} | Second applicant: ${f["second-applicant"] || ""}`,
    "",
    "== Address ==",
    [f.street, f["street-2"], f.city, f.region, f.postal, f.country].filter(Boolean).join(", "),
    "",
    "== Employment & income ==",
    `${f.employment || ""} at ${f.employer || ""} (${f["job-title"] || ""})`,
    `Years: ${f["years-employed"] || ""} | Gross annual: ${f["annual-income"] || ""}`,
    `Other monthly: ${f["other-income"] || "0"} | Debts: ${f["monthly-debts"] || ""} | Pay: ${f["pay-frequency"] || ""}`,
    "",
    "== Mortgage loan details ==",
    `Purpose: ${f.purpose || ""} | Type: ${f["property-type"] || ""}`,
    `Location: ${f["property-city"] || ""}, ${f["property-country"] || ""}`,
    `Value: ${f["property-value"] || ""} | Down: ${f["down-payment"] || ""} | Term: ${f.term || ""}`,
  ]
  return lines.join("\n").slice(0, 3900)
}

export default {
  async fetch(request, env) {
    const allowed = env.ALLOWED_ORIGIN || "https://sittaluvv.github.io"
    const origin = request.headers.get("Origin") || ""
    const headers = { ...CORS(origin, allowed), "Content-Type": "application/json" }

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers })
    if (request.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers })
    if (origin && origin !== allowed) return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers })
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return new Response(JSON.stringify({ error: "Telegram secrets not configured" }), { status: 503, headers })
    }

    let body
    try { body = await request.json() } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers })
    }
    if (!body || typeof body !== "object" || !body.fields) {
      return new Response(JSON.stringify({ error: "Expected { fields, summary? }" }), { status: 400, headers })
    }

    const text = formatTelegram(body)
    const tg = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
        disable_web_page_preview: true,
      }),
    })
    const tgJson = await tg.json().catch(() => ({}))
    if (!tg.ok || !tgJson.ok) {
      return new Response(JSON.stringify({ error: "Telegram rejected the message", detail: tgJson.description || tg.status }), { status: 502, headers })
    }
    return new Response(JSON.stringify({ ok: true, message_id: tgJson.result && tgJson.result.message_id }), { status: 200, headers })
  },
}
