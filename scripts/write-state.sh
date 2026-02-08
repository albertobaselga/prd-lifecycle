#!/bin/bash
# Usage:
#   bash write-state.sh read [project-root]
#   bash write-state.sh set <key> <value> [project-root]
#   bash write-state.sh add-completed <epic-id> [project-root]
set -euo pipefail

ACTION="${1:-read}"

case "$ACTION" in
  read)
    PROJECT_ROOT="${2:-.}"
    STATE="$PROJECT_ROOT/prd-lifecycle/state.json"
    cat "$STATE"
    ;;
  set)
    KEY="$2"
    VALUE="$3"
    PROJECT_ROOT="${4:-.}"
    STATE="$PROJECT_ROOT/prd-lifecycle/state.json"
    TMP=$(mktemp)
    python3 -c "
import json, sys
with open('$STATE') as f:
    s = json.load(f)
value = '$VALUE'
# Try to parse as JSON (for arrays, numbers, bools)
try:
    value = json.loads(value)
except (json.JSONDecodeError, ValueError):
    pass
s['$KEY'] = value
with open('$TMP', 'w') as f:
    json.dump(s, f, indent=2)
"
    mv "$TMP" "$STATE"
    echo "Set $KEY=$VALUE"
    ;;
  add-completed)
    EPIC="$2"
    PROJECT_ROOT="${3:-.}"
    STATE="$PROJECT_ROOT/prd-lifecycle/state.json"
    TMP=$(mktemp)
    python3 -c "
import json
with open('$STATE') as f:
    s = json.load(f)
if '$EPIC' not in s.get('epics_completed', []):
    s.setdefault('epics_completed', []).append('$EPIC')
if '$EPIC' in s.get('epics_remaining', []):
    s['epics_remaining'].remove('$EPIC')
with open('$TMP', 'w') as f:
    json.dump(s, f, indent=2)
"
    mv "$TMP" "$STATE"
    echo "Marked $EPIC as completed"
    ;;
  *)
    echo "Usage: write-state.sh {read|set|add-completed} [args...] [project-root]"
    exit 1
    ;;
esac
