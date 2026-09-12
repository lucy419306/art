#!/bin/zsh
cd -- "${0:A:h}"
if ! command -v npm >/dev/null 2>&1; then
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
fi
if ! command -v npm >/dev/null 2>&1; then
  echo '请先安装 Node.js LTS，然后重新双击此文件。'
  read -k 1
  exit 1
fi
if [[ ! -d node_modules/electron ]]; then
  npm ci || exit 1
fi
npm start
