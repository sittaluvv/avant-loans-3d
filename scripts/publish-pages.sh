#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
test -d dist || { echo "Run npm run build first"; exit 1; }
# Ensure SPA-ish 404 and apply index are present
test -f dist/apply/index.html
touch dist/.nojekyll
# Stage a clean worktree for gh-pages
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
cp -a dist/. "$WORK/"
# Keep source-control metadata out of the published tree
rm -rf "$WORK/.git"
(
  cd "$WORK"
  git init -q -b gh-pages
  git -c user.name="Avant Deploy" -c user.email="deploy@users.noreply.github.com" add -A
  git -c user.name="Avant Deploy" -c user.email="deploy@users.noreply.github.com" commit -qm "Publish $(date -u +%Y-%m-%dT%H:%MZ)"
  git remote add origin "https://github.com/sittaluvv/avant-loans-3d.git"
  git push -f origin HEAD:gh-pages
)
echo "Pushed dist/ to gh-pages. Site: https://sittaluvv.github.io/avant-loans-3d/"
