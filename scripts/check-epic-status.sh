#!/bin/bash
# Usage: bash check-epic-status.sh <project-root> <instance>
# Outputs JSON array of epic IDs where all stories are done
set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo "Error: jq required" >&2; exit 1; }

[[ $# -lt 1 ]] && { echo "Usage: $0 <project-root> [instance]" >&2; exit 1; }

PROJECT_ROOT="$1"
INSTANCE="${2:-}"

if [[ -n "$INSTANCE" ]]; then
  BASE="$PROJECT_ROOT/prd-lifecycle/$INSTANCE"
else
  BASE="$PROJECT_ROOT/prd-lifecycle"
fi

BACKLOG="$BASE/backlog.json"

# If backlog doesn't exist, return empty array
if [[ ! -f "$BACKLOG" ]]; then
  echo "[]"
  exit 0
fi

# Group stories by epic_id and check if all are done
jq -r '
  [
    .stories
    | group_by(.epic_id)[]
    | select(length > 0 and all(.status == "done"))
    | .[0].epic_id
  ]
' "$BACKLOG"
