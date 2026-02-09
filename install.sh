#!/bin/bash
set -euo pipefail

# prd-lifecycle skill installer
# Creates a symlink from ~/.claude/skills/prd-lifecycle → this repo

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$HOME/.claude/skills/prd-lifecycle"
SETTINGS="$HOME/.claude/settings.json"

echo "=== prd-lifecycle skill installer ==="
echo ""

# --- Prerequisites ---

# Check Claude Code
if ! command -v claude &>/dev/null; then
  echo "ERROR: Claude Code CLI not found. Install from https://claude.ai/download"
  exit 1
fi
echo "[ok] Claude Code CLI found"

# Check tmux (required for Agent Teams)
if ! command -v tmux &>/dev/null; then
  echo "ERROR: tmux not found. Agent Teams requires tmux."
  echo "  Ubuntu/Debian: sudo apt install tmux"
  echo "  macOS:         brew install tmux"
  exit 1
fi
echo "[ok] tmux found"

# Check python3 (used by helper scripts)
if ! command -v python3 &>/dev/null; then
  echo "ERROR: python3 not found. Helper scripts require python3."
  exit 1
fi
echo "[ok] python3 found"

# --- Enable Agent Teams ---

mkdir -p "$HOME/.claude"

if [[ -f "$SETTINGS" ]]; then
  # Add CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS to existing settings
  if grep -q "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS" "$SETTINGS"; then
    echo "[ok] Agent Teams already enabled in settings.json"
  else
    TMP=$(mktemp)
    python3 -c "
import json
with open('$SETTINGS') as f: s = json.load(f)
s.setdefault('env', {})['CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS'] = '1'
with open('$TMP', 'w') as f: json.dump(s, f, indent=2)
"
    mv "$TMP" "$SETTINGS"
    echo "[ok] Enabled CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS in settings.json"
  fi
else
  # Create minimal settings.json
  cat > "$SETTINGS" << 'SETTINGS_EOF'
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
SETTINGS_EOF
  echo "[ok] Created settings.json with Agent Teams enabled"
fi

# --- Install team-first CLAUDE.md ---

CLAUDE_MD="$HOME/.claude/CLAUDE.md"
CLAUDE_TEAM_MD="$SCRIPT_DIR/CLAUDE.team.md"

if [[ -f "$CLAUDE_MD" ]]; then
  # Check if it's already the team-first version
  if grep -q "Team-First Development" "$CLAUDE_MD"; then
    echo "[ok] Team-first CLAUDE.md already installed"
  else
    # Back up existing CLAUDE.md (may be OMC or custom)
    BACKUP="$HOME/.claude/CLAUDE.md.bak.$(date +%Y%m%d%H%M%S)"
    cp "$CLAUDE_MD" "$BACKUP"
    cp "$CLAUDE_TEAM_MD" "$CLAUDE_MD"
    echo "[ok] Installed team-first CLAUDE.md (backup: $BACKUP)"
  fi
else
  cp "$CLAUDE_TEAM_MD" "$CLAUDE_MD"
  echo "[ok] Installed team-first CLAUDE.md"
fi

# --- Install skill via symlink ---

if [[ -L "$SKILL_DIR" ]]; then
  EXISTING_TARGET="$(readlink "$SKILL_DIR")"
  if [[ "$EXISTING_TARGET" == "$SCRIPT_DIR" ]]; then
    echo "[ok] Symlink already points to this repo"
  else
    echo "WARNING: $SKILL_DIR is a symlink to $EXISTING_TARGET"
    echo "  Remove it first: rm $SKILL_DIR"
    exit 1
  fi
elif [[ -d "$SKILL_DIR" ]]; then
  echo "WARNING: $SKILL_DIR already exists as a directory."
  echo "  Back it up and remove it first:"
  echo "    mv $SKILL_DIR ${SKILL_DIR}.bak"
  echo "    rm -rf $SKILL_DIR"
  echo "  Then re-run this installer."
  exit 1
else
  mkdir -p "$(dirname "$SKILL_DIR")"
  ln -s "$SCRIPT_DIR" "$SKILL_DIR"
  echo "[ok] Created symlink: $SKILL_DIR -> $SCRIPT_DIR"
fi

# --- Verify ---

echo ""
if [[ -f "$SKILL_DIR/SKILL.md" ]]; then
  echo "=== Installation successful ==="
  echo ""
  echo "Usage:"
  echo "  /prd-lifecycle ./path/to/prd.md"
  echo "  /prd-lifecycle \"Build a task management API with auth and CRUD\""
  echo ""
  echo "To update:  cd $SCRIPT_DIR && git pull"
  echo "To remove:  rm $SKILL_DIR"
else
  echo "ERROR: Installation verification failed. SKILL.md not found at $SKILL_DIR"
  exit 1
fi
