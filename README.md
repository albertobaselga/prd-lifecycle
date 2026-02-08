# prd-lifecycle

A [Claude Code](https://claude.ai/download) skill that takes a PRD and orchestrates the **full development lifecycle** using native Agent Teams, modeled after a high-performance Scrum team.

14 specialized roles. Ceremony-driven phase gates. Pair programming. Parallel reviews. Learnings that compound across sprints.

```
/prd-lifecycle ./docs/prd.md
```

## The Team

### Core Roles (always active)

| Role | Purpose |
|------|---------|
| **Product Owner / Scrum Master** | Backlog, ceremonies, gates (the lead) |
| `architect` | Design authority, architecture review |
| `data-engineer` | Data model, schemas, migrations |
| `dev-1` | Build + review dev-2's code |
| `dev-2` | Build + review dev-1's code |
| `qa-engineer` | Tests, build verification |
| `security-reviewer` | OWASP, secrets, input validation |
| `performance-reviewer` | Complexity, N+1, latency |
| `code-reviewer` | Quality, SOLID, patterns |
| `tech-writer` | Specs, API docs, README, changelog |
| `release-engineer` | Git, CI/CD, deployment, PR |

### Conditional Specialists (activated by PRD domain)

| Role | Activated When | Purpose |
|------|---------------|---------|
| `applied-ai-engineer` | PRD has AI/ML features | ML pipelines, model selection, prompt engineering, responsible AI |
| `data-scientist` | PRD has analytics/experimentation | Metrics, A/B testing, event tracking, statistical modeling |
| `ux-ui-designer` | PRD has user-facing interfaces | UX, accessibility (WCAG 2.1 AA), responsive design |

## How It Works

```
Phase 1: SPECIFICATION ─── all voices in refinement ──────────────
  Ceremony: Backlog Refinement (5 teammates challenge every story)
  Ceremony: Epic Decomposition (architect + data-engineer lead)
  Ceremony: Architecture + Data Model + Spec Validation
  Gate: all approved → Phase 2

Phase 2: EXECUTION SPRINTS ─── per epic, full cycle ──────────────
  Sprint Planning → BUILD (pair programming) → VERIFY (parallel reviews)
  → Architecture Review → Sprint Review → Sprint Retrospective (ACE)
  Learnings feed forward into next sprint

Phase 3: RELEASE ─── docs + deployment ───────────────────────────
  tech-writer: README, API docs, changelog, release notes
  release-engineer: Git, versioning, CI/CD, PR
  Final Retrospective → TeamDelete
```

Max 5 concurrent teammates. Sprints are self-contained. Reviewers work **inside** each sprint, not as a separate wave.

## Prerequisites

- [Claude Code](https://claude.ai/download) CLI installed
- [tmux](https://github.com/tmux/tmux) (required by Agent Teams)
- python3 (used by helper scripts)

## Installation

### Quick (recommended)

```bash
git clone https://github.com/YOUR_USERNAME/prd-lifecycle.git ~/prd-lifecycle
bash ~/prd-lifecycle/install.sh
```

The installer will:
1. Verify prerequisites (Claude Code, tmux, python3)
2. Enable `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` in `~/.claude/settings.json`
3. Create a symlink: `~/.claude/skills/prd-lifecycle` → `~/prd-lifecycle`

### Manual

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/prd-lifecycle.git ~/prd-lifecycle

# Enable Agent Teams
# Add to ~/.claude/settings.json under "env":
#   "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"

# Symlink into Claude Code skills
ln -s ~/prd-lifecycle ~/.claude/skills/prd-lifecycle
```

## Usage

```bash
# From a PRD file
/prd-lifecycle ./docs/prd.md

# From a URL
/prd-lifecycle https://docs.example.com/prd

# From inline text
/prd-lifecycle "Build a task management API with auth, CRUD, and real-time updates"
```

The skill will:
1. Analyze the PRD and detect domains (AI/ML, analytics, frontend)
2. Run Backlog Refinement with 5 domain experts challenging every story
3. Decompose into epics, design architecture + data model, validate specs
4. Execute sprints with pair programming, QA, and parallel reviews
5. Produce release artifacts: docs, changelog, CI/CD, PR

## Project Artifacts

The skill creates a `prd-lifecycle/` directory in your project root:

```
prd-lifecycle/
  prd.json              # Refined user stories
  epics.json            # Approved epic breakdown
  data-model.md         # Master data model
  state.json            # Lifecycle state (for resume)
  learnings.md          # ACE strategies + pitfalls
  arch/epic-{id}.md     # Architecture per epic
  specs/epic-{id}.md    # Functional spec per epic
  data/epic-{id}.md     # Data model per epic
  sprints/sprint-{n}/
    review.md           # Sprint Review notes
    retro.md            # Sprint Retrospective (ACE)
    reports/            # QA, security, perf, code review reports
  release/
    changelog.md
    release-notes.md
```

## File Structure

```
prd-lifecycle/
  SKILL.md                              # Main orchestration (1500+ lines)
  preambles/
    architect.md                        # Architecture + integration
    data-engineer.md                    # Data model, schemas, migrations
    dev.md                              # Implementation + pair review
    qa-engineer.md                      # Testing + build verification
    security-reviewer.md                # OWASP + vulnerabilities
    performance-reviewer.md             # Hotspots, complexity, latency
    code-reviewer.md                    # Quality, patterns, SOLID
    tech-writer.md                      # Docs, specs, changelog
    release-engineer.md                 # Git, CI/CD, versioning, deploy
    applied-ai-engineer.md              # AI/ML pipelines (conditional)
    data-scientist.md                   # Analytics, experimentation (conditional)
    ux-ui-designer.md                   # UX/UI, accessibility (conditional)
  templates/
    epic-breakdown.md                   # Epic decomposition schema
    review-verdict.md                   # Universal review verdict format
    final-report.md                     # Completion summary + retrospective
    sprint-retro.md                     # ACE strategy/pitfall capture
  scripts/
    init-project.sh                     # Scaffold prd-lifecycle/ directory tree
    init-sprint.sh                      # Create sprint-{n}/ dirs + report stubs
    write-state.sh                      # Read/write/update state.json
    collect-learnings.sh                # Aggregate ACE entries across sprints
  docs/
    plan.md                             # Design document + architecture reference
  install.sh                            # One-command installer
  LICENSE                               # MIT
  README.md                             # This file
```

## Updating

```bash
cd ~/prd-lifecycle && git pull
```

Because the skill is symlinked, updates take effect immediately.

## Uninstall

```bash
# Remove symlink
rm ~/.claude/skills/prd-lifecycle

# Optionally remove the env var from ~/.claude/settings.json
# Optionally remove the repo
rm -rf ~/prd-lifecycle
```

## License

MIT
