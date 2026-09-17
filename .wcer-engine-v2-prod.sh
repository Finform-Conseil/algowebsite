#!/usr/bin/env bash
set -euo pipefail
source "$HOME/.nvm/nvm.sh"
nvm use 22 >/dev/null
exec pnpm exec next start -p 3001
