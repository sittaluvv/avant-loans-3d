# Telegram delivery for Avant Loans applications

The GitHub Pages site is static. This Cloudflare Worker is the only place that
holds the bot token. The browser posts JSON to the Worker; the Worker calls
Telegram `sendMessage`.

## What Ronald needs to provide
1. A Telegram bot token from [@BotFather](https://t.me/BotFather) (`123456:ABC...`).
2. The chat id where messages should land (his user id, or a group/channel id).
   Tip: message the bot, then open `https://api.telegram.org/bot<TOKEN>/getUpdates`
   and look for `"chat":{"id": ...}`.

Do **not** put either value in the Vite app or commit them.

## Deploy the Worker
```bash
cd /workspace/avant-3d/server
npx wrangler login          # once, in a browser
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler deploy
```
Copy the printed `*.workers.dev` URL.

## Point the site at it and redeploy Pages
```bash
cd /workspace/avant-3d
VITE_TELEGRAM_API_URL=https://avant-loans-telegram.<account>.workers.dev npm run build
# then push dist/ to gh-pages (see ../DEPLOY.md)
```

## Request shape the Worker expects
```json
{
  "source": "avant-loans-3d",
  "submittedAt": "2026-10-17T07:00:00.000Z",
  "summary": "plain multi-line text",
  "fields": { "first-name": "...", "email": "...", "...": "..." }
}
```

CORS allows only `https://sittaluvv.github.io`. Local preview will get 403 unless
you temporarily set `ALLOWED_ORIGIN` to `http://localhost:4180` (or leave Origin
empty — curl works).

## Safety
- Without `VITE_TELEGRAM_API_URL`, the form stays fully offline and shows the
  "Demo complete. Nothing was sent." screen.
- With it set, a successful Telegram delivery shows a "Delivered to Telegram"
  screen; a failure shows an error and keeps the form data so the user can retry.
