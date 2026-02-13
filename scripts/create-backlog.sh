#!/bin/bash
# Usage: bash create-backlog.sh <project-root> [instance]
# Creates initial backlog.json scaffold from epics
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
EPICS="$BASE/epics.json"

# Check if backlog already exists
if [[ -f "$BACKLOG" ]]; then
  echo "Warning: backlog.json already exists at $BACKLOG. Will not overwrite." >&2
  exit 1
fi

# Check if epics exists
if [[ ! -f "$EPICS" ]]; then
  echo "Error: epics.json not found at $EPICS" >&2
  exit 1
fi

# Read epic IDs for Lead context
EPIC_IDS=$(jq -r '[.epics[].id] | join(", ")' "$EPICS" 2>/dev/null || echo "unknown")
EPIC_COUNT=$(jq '[.epics | length] | .[0] // 0' "$EPICS" 2>/dev/null || echo 0)

# Create scaffold backlog
echo '{"stories": []}' > "$BACKLOG"

echo "Created scaffold backlog for $EPIC_COUNT epics ($EPIC_IDS). Lead must add stories during Discovery/Refinement."
