#!/bin/zsh
set -e
fieldwork_script_dir="${0:A:h}"
cd "$fieldwork_script_dir/.."
if ! command -v node >/dev/null || ! command -v pnpm >/dev/null; then
  fieldwork_runtime_dir="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies"
  export PATH="$fieldwork_runtime_dir/node/bin:$fieldwork_runtime_dir/bin/fallback:$PATH"
fi
exec pnpm dev "$@"
