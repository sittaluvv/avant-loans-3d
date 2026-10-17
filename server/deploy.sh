#!/usr/bin/env bash
# Deploys the Telegram Worker and prints only the public URL.
# Requires: Cloudflare auth (wrangler login OR CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID)
#           and server/.dev.vars with TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
set -euo pipefail
cd "$(dirname "$0")"
test -f .dev.vars || { echo "Missing .dev.vars"; exit 1; }
# shellcheck disable=SC1091
set -a; source .dev.vars; set +a
test -n "${TELEGRAM_BOT_TOKEN:-}" || { echo "TELEGRAM_BOT_TOKEN empty"; exit 1; }
test -n "${TELEGRAM_CHAT_ID:-}" || { echo "TELEGRAM_CHAT_ID empty"; exit 1; }

npx wrangler whoami >/dev/null

# Secrets via stdin (non-interactive). Never echo the token.
printf '%s' "$TELEGRAM_BOT_TOKEN" | npx wrangler secret put TELEGRAM_BOT_TOKEN
printf '%s' "$TELEGRAM_CHAT_ID" | npx wrangler secret put TELEGRAM_CHAT_ID

npx wrangler deploy
echo
echo "Next: rebuild the site pointing at this Worker:"
echo "  cd /workspace/avant-3d"
echo "  VITE_TELEGRAM_API_URL=https://avant-loans-telegram.<account>.workers.dev npm run build"
echo "  ./scripts/publish-pages.sh"
