#!/usr/bin/env bash
# Prototype preview deploy script — throwaway (wayfinder ticket #30).
# Builds the current branch and serves dist/ on the LAN so the family
# can open the prototype variants on real phones/tablets.
set -euo pipefail
cd "$(dirname "$0")/.."

HOST_IP="$(hostname -I | awk '{print $1}')"
PORT="${PORT:-4321}"

echo "==> Installing deps (if needed)"
[ -d node_modules ] || pnpm install --frozen-lockfile

echo "==> Building prototype branch ($(git branch --show-current))"
pnpm build

echo "==> Serving dist/ — family can open:"
echo "      http://${HOST_IP}:${PORT}/?variant=A   (Refined handbook)"
echo "      http://${HOST_IP}:${PORT}/?variant=B   (Progressive focus)"
echo "      http://${HOST_IP}:${PORT}/?variant=C   (Guided tally)"
echo "    Switch variants with the floating pill at the bottom."

exec npx --yes serve -l "${PORT}" dist
