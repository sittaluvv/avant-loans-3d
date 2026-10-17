# Cloudflare deploy status

## Current blocker (2026-10-17)
`wrangler whoami` works (account `ec51c3f3c30807a40b08f8f72961a4bd`).
Deploy fails with Cloudflare API error **10034**:

> You need to verify your email address to use Workers.

Ronald must open the Cloudflare verification email for
`ronalddelagarzaaldaco@gmail.com` (or resend from the dashboard:
https://developers.cloudflare.com/fundamentals/setup/account/verify-email-address/)
and confirm. Then:

```bash
cd /workspace/avant-3d/server && ./deploy.sh
# copy the printed *.workers.dev URL, then:
cd /workspace/avant-3d
VITE_TELEGRAM_API_URL=https://avant-loans-telegram.<subdomain>.workers.dev npm run build
./scripts/publish-pages.sh
```

## Already verified locally (not public)
`wrangler dev --local` with `.dev.vars`:
- POST from Origin `https://sittaluvv.github.io` → HTTP 200 `{ok:true,"message_id":…}` and a real Telegram message
- POST from Origin `https://evil.example` → HTTP 403 `{error:"Origin not allowed"}`
- Secrets stay out of client code

## Secrets
Stored only in `server/.dev.vars` (gitignored) and, once deploy succeeds,
as Worker secrets via `wrangler secret put` (stdin). Never in Vite / git.
