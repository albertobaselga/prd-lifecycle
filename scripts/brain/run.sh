#!/bin/bash
# brain — XState v5 state machine engine for prd-lifecycle
# Usage: bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh [project_root] [args...]
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is required but not found. Install Node.js 18+ to use brain." >&2
  exit 1
fi
exec node "$SCRIPT_DIR/dist/brain.cjs" "$@"
