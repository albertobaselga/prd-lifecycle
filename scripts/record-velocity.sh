#!/bin/bash
# Usage: bash record-velocity.sh <project-root> <instance> <sprint-number> <planned-sp> <completed-sp>
# Records sprint velocity data
set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo "Error: jq required" >&2; exit 1; }

[[ $# -lt 5 ]] && { echo "Usage: $0 <project-root> <instance> <sprint-number> <planned-sp> <completed-sp>" >&2; exit 1; }

PROJECT_ROOT="$1"
INSTANCE="${2:-}"
SPRINT_NUM="$3"
PLANNED_SP="$4"
COMPLETED_SP="$5"

[[ ! "$SPRINT_NUM" =~ ^[0-9]+$ ]] && { echo "Error: sprint-number must be a positive integer" >&2; exit 1; }
[[ ! "$PLANNED_SP" =~ ^[0-9]+$ ]] && { echo "Error: planned-sp must be a positive integer" >&2; exit 1; }
[[ ! "$COMPLETED_SP" =~ ^[0-9]+$ ]] && { echo "Error: completed-sp must be a positive integer" >&2; exit 1; }

if [[ -n "$INSTANCE" ]]; then
  BASE="$PROJECT_ROOT/prd-lifecycle/$INSTANCE"
else
  BASE="$PROJECT_ROOT/prd-lifecycle"
fi

VELOCITY="$BASE/velocity.json"
TODAY=$(date -u +%Y-%m-%d)

# Create velocity file if it doesn't exist
if [[ ! -f "$VELOCITY" ]]; then
  echo '{"sprints": []}' > "$VELOCITY"
fi

# Append sprint entry
jq --arg sprint "$SPRINT_NUM" \
   --arg planned "$PLANNED_SP" \
   --arg completed "$COMPLETED_SP" \
   --arg date "$TODAY" \
   '.sprints += [{
     "sprint": ($sprint | tonumber),
     "planned": ($planned | tonumber),
     "completed": ($completed | tonumber),
     "date": $date
   }]' "$VELOCITY" > "$VELOCITY.tmp" && mv "$VELOCITY.tmp" "$VELOCITY"

echo "Recorded velocity for sprint $SPRINT_NUM: planned=$PLANNED_SP, completed=$COMPLETED_SP"
