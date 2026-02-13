# prd-lifecycle

A [Claude Code](https://claude.ai/download) skill that takes a PRD and orchestrates the **full development lifecycle** using native Agent Teams, modeled after a high-performance Scrum team.

18 specialized roles — each a super senior expert with domain-specific reasoning, red flag detection, and quality bars. Ceremony-driven phase gates. Pair programming. Parallel reviews. Learnings that compound across sprints.

```
/prd-lifecycle ./docs/prd.md
```

## The Team

### Core Roles (always active)

| Role | Expert Identity | Purpose |
|------|----------------|---------|
| **Lead** | Conductor + orchestrator | Backlog, ceremonies, gates, team coordination |
| `product-manager` | Outcomes over outputs | Prioritization, scope boundaries, success criteria |
| `scrum-master` | Impediment remover, not PM | WIP control, ceremonies, retrospectives |
| `architect` | "What changes together = real boundaries" | Design authority, architecture review |
| `data-engineer` | "Data outlives applications" | Data model, schemas, migrations |
| `dev-1` | "Writes code others maintain" | Build + review dev-2's code |
| `dev-2` | "Writes code others maintain" | Build + review dev-1's code |
| `qa-engineer` | "Testing finds ways it breaks" | Tests, build verification |
| `security-reviewer` | Assumes breach, thinks in attack trees | OWASP, secrets, input validation |
| `performance-reviewer` | "Thinks in orders of magnitude" | Complexity, N+1, latency |
| `code-reviewer` | "Reads code like an editor reads prose" | Quality, SOLID, patterns |
| `tech-writer` | "Docs are the UI of your API" | Specs, API docs, README, changelog |
| `release-engineer` | Last line of defense before prod | Git, CI/CD, deployment, PR |

### Conditional Specialists (activated by PRD domain)

| Role | Activated When | Expert Identity |
|------|---------------|-----------------|
| `applied-ai-engineer` | AI/ML features | "Simplest model that meets requirements" |
| `data-scientist` | Analytics/experimentation | "Dashboards with 47 metrics where nobody knows which matter" |
| `ux-ui-designer` | User-facing interfaces | "Designs for user who doesn't read instructions" |
| `prompt-engineer` | LLM/prompt features | "Prompts are communication protocols, not magic" |
| `data-analyst` | Data-heavy queries/reports | "Distributions, not averages" |
| `fullstack-dev` | Cross-stack epics | "The API is the contract" |
| `product-designer` | Complex user flows | "Problem solver, not pixel-pusher" |

## How It Works

```
Phase 1: SPECIFICATION ─── top-down decomposition ────────────────
  Ceremony 1: Epic Decomposition (architect + data-engineer lead)
  Ceremony 2: Story Refinement per epic (5 teammates challenge every story)
  Ceremony 3: Architecture + Data Model + Spec Validation
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
│       │   ├── START_SPRINT [guard: hasRemainingStories] → setup
│       │   └── START_RELEASE [guard: noRemainingStories] → release
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
| `hasRemainingStories` | `retro_done` | Allows `START_SPRINT` only when stories remain in backlog |
| `noRemainingStories` | `retro_done` | Allows `START_RELEASE` only when all stories done |

### Context (tracked in state.json)

| Field | Type | Purpose |
|-------|------|---------|
| `team_name` | string | Team identifier for this lifecycle |
| `current_sprint` | number | Sprint counter (1-indexed, increments at START_SPRINT) |
| `product_backlog_count` | number | Stories remaining in backlog |
| `current_sprint_stories` | string | Story IDs in current sprint |
| `sprint_story_count` | number | Stories planned for current sprint |
| `has_ai_ml` | boolean | Activates `applied-ai-engineer` |
| `has_analytics` | boolean | Activates `data-scientist` |
| `has_frontend_ui` | boolean | Activates `ux-ui-designer` |

## Anti-Overengineering Guardrails

AI agents have a documented bias toward overengineering. This skill counteracts it at three layers:

**Layer 1: Universal Simplicity Mandate** — Every agent preamble includes a Simplicity Mandate that overrides all other guidance. Five laws (PRD-only scope, fewer files, direct code, justify abstractions, ask when uncertain) plus a self-check before every deliverable.

**Layer 2: Role-Specific Guardrails** — Seven key roles have targeted protections:

| Role | Guardrail |
|------|-----------|
| `architect` | Complexity Budget — max epics/files scaled to PRD size. No patterns without concrete variability. |
| `dev` | Anti-Overengineering Protocol — simplest code per AC, no speculative features. |
| `code-reviewer` | Overengineering Detection — flags single-use abstractions, >3 files/story ratio. |
| `security-reviewer` | Scope Discipline — only real vulnerabilities, proportional to PRD context. |
| `qa-engineer` | Test Scope Discipline — tests only ACs + happy path + explicit error cases. |
| `scrum-master` | Complexity Guard — max 5 tasks/story, flags task:story ratio >4:1. |
| `product-manager` | Scope Guard — last line of defense: "Is this in the PRD?" |

**Layer 3: Orchestration Rules** — SKILL.md Rule 13 (SIMPLICITY BIAS) enforces a Simplification Pass after refinement, challenges epic counts, and treats overengineering as a sprint-blocking finding during VERIFY.

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
2. Decompose the PRD into value-based epics (Ceremony 1)
3. Refine stories per epic with 5 domain experts (Ceremony 2)
4. Design architecture + data model, validate specs (Ceremony 3)
5. Execute sprints with pair programming, QA, and parallel reviews
6. Produce release artifacts: docs, changelog, CI/CD, PR

## Project Artifacts

The skill creates a `prd-lifecycle/` directory in your project root:

```
prd-lifecycle/
  state.json            # XState snapshot (current position + context)
  backlog.json          # Product backlog (stories with priorities + SPs)
  prd.json              # Extracted stories from PRD
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
  preambles/                                # 18 expert specialist personas
    architect.md                        # Architecture + integration
    data-engineer.md                    # Data model, schemas, migrations
    dev.md                              # Implementation + pair review
    qa-engineer.md                      # Testing + build verification
    security-reviewer.md                # OWASP + vulnerabilities
    performance-reviewer.md             # Hotspots, complexity, latency
    code-reviewer.md                    # Quality, patterns, SOLID
    tech-writer.md                      # Docs, specs, changelog
    release-engineer.md                 # Git, CI/CD, versioning, deploy
    product-manager.md                  # Prioritization, scope, success criteria
    scrum-master.md                     # Ceremonies, WIP, impediments
    applied-ai-engineer.md              # AI/ML pipelines (conditional)
    data-scientist.md                   # Analytics, experimentation (conditional)
    ux-ui-designer.md                   # UX/UI, accessibility (conditional)
    prompt-engineer.md                  # Prompt design, LLM integration (conditional)
    data-analyst.md                     # Queries, reports, dashboards (conditional)
    fullstack-dev.md                    # Cross-stack implementation (conditional)
    product-designer.md                 # UX strategy, flows (conditional)
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
    create-backlog.sh                   # Scaffold backlog.json from epics
    init-sprint.sh                      # Create sprint-{n}/ dirs + report stubs
    check-refinement.sh                 # Verify stories meet Definition of Ready
    calculate-capacity.sh               # Team capacity for sprint planning
    check-epic-status.sh                # Epic completion status across sprints
    record-velocity.sh                  # Record sprint velocity data
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
npm test              # 198 tests (vitest)
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
