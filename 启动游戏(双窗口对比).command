#!/bin/zsh
cd -- "${0:A:h}"
unset ELECTRON_RUN_AS_NODE
if ! command -v node >/dev/null 2>&1; then
  export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
fi
if ! command -v node >/dev/null 2>&1; then
  echo '请先安装 Node.js LTS，然后重新双击此文件。'
  read -k 1
  exit 1
fi
node ./node_modules/electron/cli.js . --both
