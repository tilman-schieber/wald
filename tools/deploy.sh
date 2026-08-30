#!/bin/sh
# Baut das Spiel und veröffentlicht es auf GitHub Pages (Branch gh-pages).
#   sh tools/deploy.sh
set -e
cd "$(dirname "$0")/.."
GITHUB_PAGES=1 npm run build
rm -rf .gh-pages-tmp
git worktree add -q --detach .gh-pages-tmp
cd .gh-pages-tmp
git checkout -q --orphan gh-pages
git rm -rfq . >/dev/null 2>&1 || true
cp -R ../dist/. .
touch .nojekyll
git add -A
git commit -qm "Deploy $(date '+%Y-%m-%d %H:%M')"
git push -f origin gh-pages
cd ..
git worktree remove --force .gh-pages-tmp
echo "veröffentlicht: https://tilman-schieber.github.io/wald/"
