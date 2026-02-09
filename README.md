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

## State Machine

The lifecycle is driven by a formal [XState v5](https://stately.ai/docs/xstate-v5) state machine that enforces valid transitions and provides deterministic navigation output.

### Architecture

```
workflow.json          ← Machine DEFINITION (ships with skill, version-controlled)
scripts/brain/         ← TypeScript ENGINE (loads workflow, processes events)
{project}/state.json   ← Per-project INSTANCE (XState snapshot, enables resume)
```

- **workflow.json** defines all 19 states, transitions, guards, actions, and navigation metadata
- **brain** is a stateless CLI engine — reads state.json, processes an event, writes new state, outputs a navigation box
- **state.json** is the single source of truth per project — both human-readable (`jq .value`) and machine-resumable

### State Tree (19 states across 4 phases)

```
prdLifecycle
├── specification                           PHASE 1
│   ├── init
│   ├── scaffold_complete
│   ├── domains_detected
│   ├── phase1_spawned
│   ├── ceremony1_complete
│   └── ceremony2_complete
├── execution                               PHASE 2
│   ├── phase1_complete
│   └── sprint (loop)
│       ├── setup ─→ build ─→ build_done
│       ├── verify ─→ verify_done
│       ├── arch_review ─→ arch_done
│       ├── review_done ─→ retro_done
│       │   ├── START_SPRINT [guard: hasRemainingEpics] → setup
│       │   └── START_RELEASE [guard: noRemainingEpics] → release
├── release                                 PHASE 3
│   ├── release_started
│   └── release_done
└── completed                               FINAL
```

### Design Invariant: Compass, Not Autopilot

Every state is a stable checkpoint. No auto-transitions (`always`, `onDone`). The Lead reads the navigation box, evaluates the situation, and explicitly sends an event to advance. This ensures every state is observable, resumable after context compaction, and controllable by the Lead.

### CLI Interface

```bash
# Orient (read current state, no side effects)
bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh

# Initialize a new project
bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh --init

# Advance state with key=value pairs
bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh step=scaffold_complete team_name=prd-myproject

# Or use typed event syntax
bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh BUILD_STARTED
```

The engine outputs a formatted navigation box telling the Lead exactly where they are, what to do next, which teammates to spawn, and what file to read.

### Guards

| Guard | At State | Purpose |
|-------|----------|---------|
| `hasRemainingEpics` | `retro_done` | Allows `START_SPRINT` only when epics remain |
| `noRemainingEpics` | `retro_done` | Allows `START_RELEASE` only when all epics done |

### Context (tracked in state.json)

| Field | Type | Purpose |
|-------|------|---------|
| `team_name` | string | Team identifier for this lifecycle |
| `current_sprint` | number | Sprint counter (1-indexed, increments at START_SPRINT) |
| `current_epic` | string | Epic being built in current sprint |
| `epics_completed` | string[] | Epics that passed sprint review |
| `epics_remaining` | string[] | Epics still to be built |
| `has_ai_ml` | boolean | Activates `applied-ai-engineer` |
| `has_analytics` | boolean | Activates `data-scientist` |
| `has_frontend_ui` | boolean | Activates `ux-ui-designer` |

## Prerequisites

- [Claude Code](https://claude.ai/download) CLI installed
- [tmux](https://github.com/tmux/tmux) (required by Agent Teams)
- [Node.js](https://nodejs.org/) 18+ (used by brain engine)

## Installation

### Quick (recommended)

```bash
git clone https://github.com/albertobaselga/prd-lifecycle.git ~/prd-lifecycle
bash ~/prd-lifecycle/install.sh
```

The installer will:
1. Verify prerequisites (Claude Code, tmux, Node.js)
2. Enable `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` in `~/.claude/settings.json`
3. Create a symlink: `~/.claude/skills/prd-lifecycle` → `~/prd-lifecycle`

### Manual

```bash
# Clone
git clone https://github.com/albertobaselga/prd-lifecycle.git ~/prd-lifecycle

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
  state.json            # XState snapshot (current position + context)
  learnings.md          # ACE strategies + pitfalls across sprints
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
  brain.log             # Debug log (append-only, timestamped)
```

## Skill Structure

```
prd-lifecycle/
  SKILL.md                              # Main orchestration
  workflow.json                         # XState v5 machine definition (19 states)
  phases/
    phase2-sprints.md                   # Sprint execution sub-phases (BUILD, VERIFY, etc.)
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
    brain/                              # TypeScript + XState v5 engine
      src/                              # Source (cli, engine, navigation, output, etc.)
      dist/brain.cjs                    # Pre-built bundle (no build step needed)
      run.sh                            # Wrapper: node dist/brain.cjs "$@"
    init-sprint.sh                      # Create sprint-{n}/ dirs + report stubs
    collect-learnings.sh                # Aggregate ACE entries across sprints
  docs/
    plan.md                             # Design document + architecture reference
  install.sh                            # One-command installer
  LICENSE                               # MIT
  README.md                             # This file
```

## Development

The brain engine ships pre-built (`dist/brain.cjs`), so users don't need a build step. To modify the engine:

```bash
cd ~/prd-lifecycle/scripts/brain
npm install
npm test              # 130 tests (vitest)
npm run build         # rebuild dist/brain.cjs
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
