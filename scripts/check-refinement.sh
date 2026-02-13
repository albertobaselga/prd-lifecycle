#!/bin/bash
# Usage: bash check-refinement.sh <project-root> <instance> <capacity>
# Checks if enough stories are refined for planning
set -euo pipefail

command -v jq >/dev/null 2>&1 || { echo "Error: jq required" >&2; exit 1; }

[[ $# -lt 3 ]] && { echo "Usage: $0 <project-root> <instance> <capacity>" >&2; exit 1; }

PROJECT_ROOT="$1"
INSTANCE="${2:-}"
CAPACITY="$3"

[[ ! "$CAPACITY" =~ ^[0-9]+$ ]] && { echo "Error: capacity must be a positive integer, got: $CAPACITY" >&2; exit 1; }

if [[ -n "$INSTANCE" ]]; then
  BASE="$PROJECT_ROOT/prd-lifecycle/$INSTANCE"
else
  BASE="$PROJECT_ROOT/prd-lifecycle"
fi

BACKLOG="$BASE/backlog.json"

# If backlog doesn't exist, recommend refinement
if [[ ! -f "$BACKLOG" ]]; then
  THRESHOLD=$((CAPACITY * 2))
  echo "refinement_needed|refined_sp=0|threshold=$THRESHOLD"
  exit 0
fi

# Calculate refined story points (status="refined")
REFINED_SP=$(jq '[.stories[] | select(.status == "refined") | .story_points] | add // 0' "$BACKLOG")

# Threshold is capacity * 2 (enough for 2 sprints)
THRESHOLD=$((CAPACITY * 2))

# Check if we have enough refined stories
if [[ $REFINED_SP -ge $THRESHOLD ]]; then
  echo "ready_for_planning|refined_sp=$REFINED_SP|threshold=$THRESHOLD"
else
  echo "refinement_needed|refined_sp=$REFINED_SP|threshold=$THRESHOLD"
fi
