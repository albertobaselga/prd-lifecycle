#!/bin/bash
# Usage: bash collect-learnings.sh [project-root]
# Aggregates ACE entries from all sprint retros into master learnings.md
set -euo pipefail

PROJECT_ROOT="${1:-.}"
BASE="$PROJECT_ROOT/prd-lifecycle"
MASTER="$BASE/learnings.md"

echo "# ACE Learnings — Cross-Sprint Compendium" > "$MASTER"
echo "<!-- Auto-aggregated from sprint retrospectives -->" >> "$MASTER"
echo "" >> "$MASTER"

for retro in "$BASE"/sprints/sprint-*/retro.md; do
  if [[ -f "$retro" ]]; then
    SPRINT=$(basename "$(dirname "$retro")")
    echo "---" >> "$MASTER"
    echo "## From $SPRINT" >> "$MASTER"
    echo "" >> "$MASTER"
    # Extract strategy and pitfall entries (lines starting with ## [strat or ## [pit)
    grep -A 10 '^\(## \[strat\|## \[pit\)' "$retro" >> "$MASTER" 2>/dev/null || true
    echo "" >> "$MASTER"
  fi
done

echo "Collected learnings into $MASTER"
