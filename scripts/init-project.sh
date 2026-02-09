#!/bin/bash
# Usage: bash init-project.sh [project-root]
# Creates prd-lifecycle/ scaffold with all subdirectories
set -euo pipefail

PROJECT_ROOT="${1:-.}"
BASE="$PROJECT_ROOT/prd-lifecycle"

mkdir -p "$BASE"/{arch,specs,data,sprints,release}

# Initialize state
CREATED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
cat > "$BASE/state.json" << EOF
{
  "phase": "specification",
  "step": "init",
  "status": "active",
  "current_sprint": 0,
  "current_epic": "",
  "team_name": "",
  "epics_completed": [],
  "epics_remaining": [],
  "created_at": "$CREATED_AT"
}
EOF

# Initialize learnings
cat > "$BASE/learnings.md" << 'EOF'
# ACE Learnings — Cross-Sprint Compendium

<!-- Strategies and pitfalls accumulated across all sprints -->
EOF

echo "Initialized prd-lifecycle/ at $BASE"
