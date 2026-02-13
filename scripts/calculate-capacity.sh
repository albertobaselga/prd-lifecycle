#!/bin/bash
# Usage: bash calculate-capacity.sh <project-root> <instance>
# Calculates sprint capacity from velocity history
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

VELOCITY="$BASE/velocity.json"
DEFAULT_CAPACITY=13

# If velocity file doesn't exist or is empty, use default
if [[ ! -f "$VELOCITY" ]]; then
  echo "capacity=$DEFAULT_CAPACITY"
  exit 0
fi

# Get last 3 sprints' completed story points
COMPLETED=$(jq -r '[.sprints | sort_by(.sprint) | reverse | limit(3;.[]) | .completed] | @json' "$VELOCITY")

# If no sprints recorded, use default
if [[ "$COMPLETED" == "[]" || "$COMPLETED" == "null" ]]; then
  echo "capacity=$DEFAULT_CAPACITY"
  exit 0
fi

# Calculate average and clamp to [8, 21]
AVG=$(echo "$COMPLETED" | jq '[.[] | tonumber] | add / length | round')
CLAMPED=$(echo "$AVG" | jq 'if . < 8 then 8 elif . > 21 then 21 else . end')

echo "capacity=$CLAMPED"
