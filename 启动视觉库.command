#!/bin/zsh
set -e
cd -- "${0:A:h}"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

if ! command -v node >/dev/null || ! node -e 'require("node:sqlite")' >/dev/null 2>&1; then
  printf '视觉库需要支持 SQLite 的 Node.js（建议 22.13 或更新版本）。\n'
  read -r '?按回车关闭窗口…'
  exit 1
fi
if [[ ! -f dist/index.html ]]; then
  npm ci
  npm run build
fi
exec node server/local-app.js --open
