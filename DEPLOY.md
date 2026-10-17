# Avant Loans 3D — build & redeploy

Site root: `/workspace/avant-3d`
Live URL: https://sittaluvv.github.io/avant-loans-3d/
Apply form: https://sittaluvv.github.io/avant-loans-3d/apply/

## Local preview
```bash
cd /workspace/avant-3d
npm run build
npx vite preview --port 4180
# open http://localhost:4180/avant-loans-3d/ and …/apply/
```

## Redeploy GitHub Pages (gh-pages branch = built files)
```bash
cd /workspace/avant-3d
npm run build
# optional Telegram endpoint (leave unset for pure demo):
# VITE_TELEGRAM_API_URL=https://avant-loans-telegram.<account>.workers.dev npm run build
git checkout --orphan gh-pages-tmp
rm -rf ./* ./.[!.]* 2>/dev/null || true
# safer: use the publish script below
```

Preferred:
```bash
cd /workspace/avant-3d
npm run build
./scripts/publish-pages.sh
```

## Telegram (optional)
See `server/README.md`. Needs Ronald's bot token + chat id. Without
`VITE_TELEGRAM_API_URL`, the form stays offline and shows "Nothing was sent."

The old demo at `avant-loans-demo` (ronalddelagarzaaldaco-droid) is untouched.


## Telegram Worker (live)
URL: `https://avant-loans-telegram.sittaluvv.workers.dev`
Secrets on the Worker (not in git): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
CORS: `https://sittaluvv.github.io` only

Redeploy site with delivery enabled:
```bash
cd /workspace/avant-3d
VITE_TELEGRAM_API_URL=https://avant-loans-telegram.sittaluvv.workers.dev npm run build
./scripts/publish-pages.sh
```

Redeploy Worker after code changes:
```bash
cd /workspace/avant-3d/server && ./deploy.sh
```
