#!/bin/bash
# Usage: bash init-sprint.sh <sprint-number> [project-root]
# Creates sprint-{n}/ directory with report stubs
set -euo pipefail

SPRINT_NUM="$1"
PROJECT_ROOT="${2:-.}"
SPRINT_DIR="$PROJECT_ROOT/prd-lifecycle/sprints/sprint-$SPRINT_NUM"
TODAY=$(date -u +%Y-%m-%d)

mkdir -p "$SPRINT_DIR/reports"

# Create report stubs
for report in qa security performance code-review arch-review data-review; do
  TITLE=$(echo "$report" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g')
  cat > "$SPRINT_DIR/reports/$report.md" << EOF
# $TITLE Report — Sprint $SPRINT_NUM

**Status:** pending
**Reviewer:** (unassigned)
**Date:** $TODAY

---
EOF
done

# Create review stub
cat > "$SPRINT_DIR/review.md" << EOF
# Sprint Review — Sprint $SPRINT_NUM

**Date:** $TODAY
**Decision:** (pending)

---
EOF

# Create retro stub
cat > "$SPRINT_DIR/retro.md" << EOF
# Sprint Retrospective — Sprint $SPRINT_NUM

**Date:** $TODAY

---

## Strategies (what worked)

## Pitfalls (what didn't)
EOF

echo "Initialized sprint-$SPRINT_NUM at $SPRINT_DIR"
