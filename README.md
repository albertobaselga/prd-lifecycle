# prd-lifecycle

A [Claude Code](https://claude.ai/download) skill that takes a PRD and orchestrates the **full development lifecycle** using native Agent Teams, modeled after a high-performance Scrum team.

15 specialized roles — each a super senior expert with domain-specific reasoning, red flag detection, and quality bars. Ceremony-driven phase gates. Pair programming. Parallel reviews. Learnings that compound across sprints.

```
/prd-lifecycle ./docs/prd.md
```

## The Team

```
                          ┌─────────────┐
                          │    LEAD     │  Conductor + Orchestrator
                          │ (You/Claude)│  Backlog, ceremonies, gates
                          └──────┬──────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
     ┌────────┴────────┐ ┌──────┴──────┐  ┌────────┴────────┐
     │   PHASE 1       │ │  PHASE 2    │  │    PHASE 3      │
     │  Specification  │ │  Execution  │  │    Release       │
     │                 │ │             │  │                  │
     │ 5 core + up to  │ │ SM, PM,     │  │ release-engineer │
     │ 4 conditional   │ │ devs, QA,   │  │ tech-writer      │
     │ specialists     │ │ reviewers,  │  │ product-manager  │
     │                 │ │ architect   │  │                  │
     └─────────────────┘ └─────────────┘  └──────────────────┘
```

### Core Roles (Phase 1: Specification)

| Role | Expert Identity | Purpose |
|------|----------------|---------|
| `architect` | "What changes together = real boundaries" | Epic decomposition lead, architecture design, integration review |
| `data-engineer` | "Data outlives applications" | Epic co-lead, data model, schemas, migrations |
| `qa-engineer` | "Testing finds ways it breaks" | Story feasibility, test scenarios, acceptance criteria |
| `security-reviewer` | Assumes breach, thinks in attack trees | OWASP, input validation, auth boundaries |
| `tech-writer` | "Docs are the UI of your API" | Functional specs, API contracts, story clarity |

### Core Roles (Phase 2: Execution Sprints)

| Role | Expert Identity | Lifecycle |
|------|----------------|-----------|
| `scrum-master` | Impediment remover, not PM | Long-lived: first Refinement → last Retro |
| `product-manager` | Outcomes over outputs | Per-cycle: Refinement → Sprint Review |
| `dev-1` | Fullstack — "The API is the contract" | Per-sprint: BUILD only |
| `dev-2` | Fullstack — "The API is the contract" | Per-sprint: BUILD only |
| `qa-engineer` | "Testing finds ways it breaks" | Per-sprint: VERIFY only |
| `security-reviewer` | Assumes breach, thinks in attack trees | Per-sprint: VERIFY only |
| `performance-reviewer` | "Thinks in orders of magnitude" | Per-sprint: VERIFY only |
| `code-reviewer` | "Reads code like an editor reads prose" | Per-sprint: VERIFY only |
| `architect` | Design authority | Per-sprint: ARCH REVIEW + Retro |

### Core Roles (Phase 3: Release)

| Role | Expert Identity | Purpose |
|------|----------------|---------|
| `release-engineer` | Last line of defense before prod | Git, CI/CD, deployment, PR |
| `tech-writer` | "Docs are the UI of your API" | README, API docs, changelog |
| `product-manager` | Outcomes over outputs | Release validation, notes |

### Conditional Specialists (activated by PRD domain)

| Role | Flag | Trigger Keywords | Expert Identity |
|------|------|-----------------|-----------------|
| `applied-ai-engineer` | `has_ai_ml` | ML, AI, embeddings, inference | "Simplest model that meets requirements" |
| `prompt-engineer` | `has_ai_ml` | LLM, prompts, RAG, fine-tuning | "Prompts are communication protocols" |
| `data-scientist` | `has_analytics` | Analytics, dashboards, A/B tests | "Distributions, not averages" |
| `ux-ui-designer` | `has_frontend_ui` | UI, UX, frontend, WCAG | "Designs for user who doesn't read instructions" |

Conditional specialists participate in **all 3 ceremonies** of Phase 1, and join BUILD/VERIFY in Phase 2 when the sprint includes stories from their domain.

Max **10 concurrent teammates** at any time (5 core + up to 4 conditional + Lead).

## How It Works

### End-to-End Flow

```
  PRD (input)
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 1: SPECIFICATION                                              │
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │  Ceremony 1   │    │  Ceremony 2   │    │    Ceremony 3        │   │
│  │    EPIC       │───▶│    STORY      │───▶│  ARCH + DATA MODEL   │   │
│  │ DECOMPOSITION │    │  REFINEMENT   │    │  + SPEC VALIDATION   │   │
│  │              │    │  (per epic)   │    │                      │   │
│  │ PRD → epics  │    │ epics →      │    │ 3 parallel tracks:   │   │
│  │ (3-5, max 7) │    │ stories      │    │ arch/ data/ specs/   │   │
│  └──────────────┘    └──────────────┘    └──────────────────────┘   │
│                                                                     │
│  Gate: all teammates approve → Phase 2                              │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 2: EXECUTION SPRINTS (loop until backlog empty)               │
│                                                                     │
│  ┌────────────┐   ┌──────────┐   ┌──────────────────────────────┐   │
│  │ REFINEMENT │──▶│ PLANNING │──▶│          SPRINT               │   │
│  │ SM+PM+devs │   │ SM+TL    │   │                              │   │
│  │ decompose  │   │ scope    │   │  BUILD ──▶ VERIFY ──▶ ARCH   │   │
│  │ estimate   │   │ velocity │   │  (pair)   (parallel) REVIEW  │   │
│  └────────────┘   └──────────┘   │                              │   │
│        ▲                         │  ──▶ SPRINT REVIEW ──▶ RETRO │   │
│        │                         └──────────────┬───────────────┘   │
│        │                                        │                   │
│        └──── stories remain? ◀──────────────────┘                   │
│                   │ no                                               │
└───────────────────┼─────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ PHASE 3: RELEASE                                                    │
│                                                                     │
│  tech-writer: README, API docs, changelog, release notes            │
│  release-engineer: Git tags, CI/CD, deployment config, PR           │
│  product-manager: Release validation                                │
│  Final Retrospective → TeamDelete → DONE                            │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase 1: Specification (Top-Down Decomposition)

```
                    ┌─────────────────────┐
                    │     RAW PRD TEXT     │
                    └──────────┬──────────┘
                               │
              CEREMONY 1: EPIC DECOMPOSITION
              ─────────────────────────────
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
         architect        data-engineer    (all others
         proposes          proposes        challenge)
         epic grouping     epic grouping
              │                │                │
              └────────────────┼────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │    CONSENSUS         │  max 3 rounds
                    │    (Lead merges)     │  Lead binds after 3
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │     epics.json       │  3-5 epics with
                    │  + execution_order   │  prd_sections mapping
                    └──────────┬──────────┘
                               │
              CEREMONY 2: STORY REFINEMENT (per epic)
              ────────────────────────────────────────
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
         For each epic:   All teammates    Simplification
         extract stories  review per epic  pass: trace to PRD
              │                │                │
              └────────────────┼────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │      prd.json        │  stories with
                    │   (stories[]  with   │  epic_id assigned
                    │    epic_id)          │
                    └──────────┬──────────┘
                               │
              CEREMONY 3: ARCH + DATA MODEL + SPEC
              ──────────────────────────────────────
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
         architect:       data-engineer:   tech-writer:
         arch/epic-N.md   data/epic-N.md   specs/epic-N.md
              │                │                │
              ▼                ▼                ▼
         All teammates review each track (max 3 rounds)
              │                │                │
              └────────────────┼────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   backlog.json       │  prioritized
                    │   + arch/ data/      │  stories ready
                    │     specs/           │  for sprints
                    └─────────────────────┘
```

### Phase 2: Sprint Lifecycle

```
                    ┌───────────────────────────┐
                    │       REFINEMENT          │
                    │  SM + PM + dev-1 + dev-2  │
                    │  decompose → tasks        │
                    │  estimate → story points  │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │      SPRINT PLANNING      │
                    │  SM presents velocity     │
                    │  TL + SM scope sprint     │
                    └─────────────┬─────────────┘
                                  │
    ┌─────────────────────────────▼──────────────────────────────┐
    │                        SPRINT N                            │
    │                                                            │
    │  ┌────────────────────────────────────────────────────┐    │
    │  │  A. BUILD (pair programming)                       │    │
    │  │                                                    │    │
    │  │  dev-1 ◀──────────▶ dev-2                         │    │
    │  │  implements E1       implements E2                 │    │
    │  │       │                    │                       │    │
    │  │       ▼                    ▼                       │    │
    │  │  dev-2 reviews E1   dev-1 reviews E2              │    │
    │  │  (PAIR-REVIEW)      (PAIR-REVIEW)                 │    │
    │  │       │                    │                       │    │
    │  │       ▼                    ▼                       │    │
    │  │  fix cycles (max 3)  fix cycles (max 3)           │    │
    │  │                                                    │    │
    │  │  + conditional: ai-eng, prompt-eng, ux, data-sci  │    │
    │  └────────────────────────┬───────────────────────────┘    │
    │                           │                                │
    │  ┌────────────────────────▼───────────────────────────┐    │
    │  │  B. VERIFY (parallel reviews)                      │    │
    │  │                                                    │    │
    │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐          │    │
    │  │  │ qa-eng   │ │ security │ │ perf-rev │          │    │
    │  │  │ tests +  │ │ OWASP +  │ │ hotspots │          │    │
    │  │  │ coverage │ │ auth     │ │ N+1      │          │    │
    │  │  └──────────┘ └──────────┘ └──────────┘          │    │
    │  │  ┌──────────┐ ┌──────────┐                        │    │
    │  │  │ code-rev │ │ data-eng │ (if data-heavy)        │    │
    │  │  │ quality  │ │ schemas  │                        │    │
    │  │  └──────────┘ └──────────┘                        │    │
    │  │  + conditional: ai-eng, prompt-eng, ux, data-sci  │    │
    │  │                                                    │    │
    │  │  Findings → devs fix → re-verify (max 3 cycles)   │    │
    │  └────────────────────────┬───────────────────────────┘    │
    │                           │                                │
    │  ┌────────────────────────▼───────────────────────────┐    │
    │  │  C. ARCHITECTURE REVIEW                            │    │
    │  │  architect reviews cross-epic integration          │    │
    │  │  APPROVE / REQUEST_CHANGES → fix → re-review       │    │
    │  └────────────────────────┬───────────────────────────┘    │
    │                           │                                │
    │  ┌────────────────────────▼───────────────────────────┐    │
    │  │  SPRINT REVIEW (GO / NO-GO)                        │    │
    │  │  architect + SM + PM assess readiness              │    │
    │  │  Lead makes binding GO/NO-GO decision              │    │
    │  └────────────────────────┬───────────────────────────┘    │
    │                           │                                │
    │  ┌────────────────────────▼───────────────────────────┐    │
    │  │  RETROSPECTIVE (ACE)                               │    │
    │  │  strategies (what worked) + pitfalls (what didn't) │    │
    │  │  learnings.md feeds forward to next sprint         │    │
    │  └────────────────────────┬───────────────────────────┘    │
    │                           │                                │
    └───────────────────────────┼────────────────────────────────┘
                                │
                 ┌──────────────▼──────────────┐
                 │     stories remaining?       │
                 ├──────── YES ────────────────▶ back to REFINEMENT
                 │                             │
                 └──────── NO ─────────────────▶ PHASE 3: RELEASE
```

### Agent Lifecycle Across Phases

```
Phase 1: SPECIFICATION
─────────────────────────────────────────────────────────────────
architect        ████████████████████████████████████████████████
data-engineer    ████████████████████████████████████████████████
qa-engineer      ████████████████████████████████████████████████
security-rev     ████████████████████████████████████████████████
tech-writer      ████████████████████████████████████████████████
applied-ai-eng   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  (if has_ai_ml)
prompt-engineer  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  (if has_ai_ml)
data-scientist   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  (if has_analytics)
ux-ui-designer   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  (if has_frontend_ui)
                 |←── C1 ──→|←── C2 ──→|←──── C3 ────→| shutdown


Phase 2: EXECUTION SPRINTS
─────────────────────────────────────────────────────────────────
                 REFINE  PLAN    BUILD    VERIFY  ARCH   REV  RETRO
scrum-master     ████████████                           ████████████  (long-lived)
product-manager  ████████████                     ██████████         (per-cycle)
dev-1                            ████████                            (per-sprint)
dev-2                            ████████                            (per-sprint)
qa-engineer                               ███████                    (per-sprint)
security-rev                               ███████                    (per-sprint)
perf-reviewer                              ███████                    (per-sprint)
code-reviewer                              ███████                    (per-sprint)
architect                                          ██████████████    (per-sprint)
conditional*                     ████████  ███████                    (as needed)

                 * applied-ai-eng, prompt-eng, ux-ui, data-sci


Phase 3: RELEASE
─────────────────────────────────────────────────────────────────
release-engineer ████████████████████████████████
tech-writer      ████████████████████████████████
product-manager  ████████████████████████████████
                 |←────── release artifacts ──────→| shutdown + TeamDelete
```

## State Machine

The lifecycle is driven by a formal [XState v5](https://stately.ai/docs/xstate-v5) state machine that enforces valid transitions and provides deterministic navigation output.

### Architecture

```
workflow.json          ← Machine DEFINITION (ships with skill, version-controlled)
scripts/brain/         ← TypeScript ENGINE (loads workflow, processes events)
{project}/state.json   ← Per-project INSTANCE (XState snapshot, enables resume)
```

- **workflow.json** defines all states, transitions, guards, actions, and navigation metadata
- **brain** is a stateless CLI engine — reads state.json, processes an event, writes new state, outputs a navigation box
- **state.json** is the single source of truth per project — both human-readable (`jq .value`) and machine-resumable

### State Tree (20 states across 4 phases)

```
prdLifecycle
├── specification                              PHASE 1
│   ├── init                                   Project scaffold created
│   ├── scaffold_complete                      Team name persisted
│   ├── domains_detected                       Domain flags set
│   ├── phase1_spawned                         Specialists active
│   ├── ceremony1_complete                     Epics defined
│   └── ceremony2_complete                     Stories refined per epic
│
├── execution                                  PHASE 2
│   ├── refinement                             Decompose stories → tasks
│   ├── sprint_planning                        Scope sprint by velocity
│   └── sprint (loop)
│       ├── setup                              Sprint dir created
│       ├── build                              Devs implementing
│       ├── build_done                         Code committed
│       ├── verify                             Reviewers active
│       ├── verify_done                        All reviews complete
│       ├── arch_review                        Architect reviewing
│       ├── arch_done                          Architecture approved
│       ├── review_done                        GO/NO-GO decided
│       └── retro_done ─┬─ START_REFINEMENT ──▶ refinement
│                       ├─ START_PLANNING ────▶ sprint_planning
│                       └─ START_RELEASE ─────▶ release
│
├── release                                    PHASE 3
│   ├── release_started                        Release teammates spawned
│   └── release_done                           All artifacts created
│
└── completed                                  FINAL
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

| Guard | At State | Allows Event | Purpose |
|-------|----------|-------------|---------|
| `hasRemainingStories` | `retro_done` | `START_REFINEMENT` | Loop back when stories remain in backlog |
| `hasRemainingStories` | `retro_done` | `START_PLANNING` | Skip refinement if stories already refined |
| `noRemainingStories` | `retro_done` | `START_RELEASE` | Advance to release when backlog empty |

### Context (tracked in state.json)

| Field | Type | Purpose |
|-------|------|---------|
| `team_name` | string | Team identifier for this lifecycle |
| `current_sprint` | number | Sprint counter (1-indexed, increments at PLANNING_DONE) |
| `product_backlog_count` | number | Stories remaining in backlog |
| `has_ai_ml` | boolean | Activates `applied-ai-engineer` + `prompt-engineer` |
| `has_analytics` | boolean | Activates `data-scientist` |
| `has_frontend_ui` | boolean | Activates `ux-ui-designer` |

## Anti-Overengineering Guardrails

AI agents have a documented bias toward overengineering. This skill counteracts it at three layers:

**Layer 1: Universal Simplicity Mandate** — Every agent preamble includes a Simplicity Mandate that overrides all other guidance. Five laws (PRD-only scope, fewer files, direct code, justify abstractions, ask when uncertain) plus a self-check before every deliverable.

**Layer 2: Role-Specific Guardrails** — Seven key roles have targeted protections:

| Role | Guardrail |
|------|-----------|
| `architect` | Complexity Budget — max epics/files scaled to PRD size. No patterns without concrete variability. |
| `fullstack-dev` | Anti-Overengineering Protocol — simplest code per AC, no speculative features, max 200 LOC/story. |
| `code-reviewer` | Overengineering Detection — flags single-use abstractions, >3 files/story ratio. |
| `security-reviewer` | Scope Discipline — only real vulnerabilities, proportional to PRD context. |
| `qa-engineer` | Test Scope Discipline — tests only ACs + happy path + explicit error cases. |
| `scrum-master` | Complexity Guard — max 5 tasks/story, flags task:story ratio >4:1. |
| `product-manager` | Scope Guard — last line of defense: "Is this in the PRD?" |

**Layer 3: Orchestration Rules** — SKILL.md Rule 13 (SIMPLICITY BIAS) enforces a Simplification Pass after refinement, challenges epic counts, and treats overengineering as a sprint-blocking finding during VERIFY.

## ACE: Accumulated Collective Experience

Every sprint ends with a retrospective that captures:

- **Strategies** — what worked (reuse in future sprints)
- **Pitfalls** — what went wrong (avoid in future sprints)

These are aggregated into `learnings.md` and provided to **every teammate** in subsequent sprints, creating a compounding improvement loop across the lifecycle.

```
Sprint 1 retro → learnings.md
                       │
Sprint 2 reads ◀───────┘
Sprint 2 retro → learnings.md (appended)
                       │
Sprint 3 reads ◀───────┘
        ...continues...
```

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
3. Refine stories per epic with all domain experts (Ceremony 2)
4. Design architecture + data model, validate specs (Ceremony 3)
5. Execute sprints with pair programming, QA, and parallel reviews
6. Produce release artifacts: docs, changelog, CI/CD, PR

### Resume

If the session is interrupted (context compaction, network issues), the state machine enables seamless resume:

```bash
# Re-invoke the skill — it detects existing state and resumes
/prd-lifecycle
```

The brain reads `state.json`, outputs the navigation box with the exact resume point, and the Lead picks up where it left off.

## Project Artifacts

The skill creates a `prd-lifecycle/{slug}/` directory in your project root:

```
prd-lifecycle/{slug}/
  state.json            # XState snapshot (current position + context)
  backlog.json          # Product backlog (stories with priorities + SPs)
  epics.json            # Epic definitions with execution_order
  prd.json              # Raw PRD + extracted stories with epic_id
  learnings.md          # ACE strategies + pitfalls across sprints
  arch/
    epic-{id}.md        # Architecture per epic
    epic-{id}-ux.md     # UX architecture (if has_frontend_ui)
  specs/epic-{id}.md    # Functional spec per epic
  data/epic-{id}.md     # Data model per epic
  sprints/sprint-{n}/
    sprint-backlog.json # Stories + tasks for this sprint
    review.md           # Sprint Review notes
    retro.md            # Sprint Retrospective (ACE)
    reports/
      qa-report.md
      security-report.md
      performance-report.md
      code-review.md
      arch-review.md
      ux-review.md      # (if has_frontend_ui)
      prompt-review.md  # (if has_ai_ml)
  release/
    changelog.md
    release-notes.md
  brain.log             # Debug log (append-only, timestamped)
```

## Skill Structure

```
prd-lifecycle/
  SKILL.md                              # Main orchestration (Lead instructions)
  workflow.json                         # XState v5 machine definition (20 states)
  phases/
    phase2-sprints.md                   # Sprint execution sub-phases
  preambles/                            # 15 expert specialist personas
    architect.md                        # Architecture + integration
    data-engineer.md                    # Data model, schemas, migrations
    fullstack-dev.md                    # Fullstack implementation + pair review
    qa-engineer.md                      # Testing + build verification
    security-reviewer.md                # OWASP + vulnerabilities
    performance-reviewer.md             # Hotspots, complexity, latency
    code-reviewer.md                    # Quality, patterns, SOLID
    tech-writer.md                      # Docs, specs, changelog
    release-engineer.md                 # Git, CI/CD, versioning, deploy
    product-manager.md                  # Prioritization, scope, success criteria
    scrum-master.md                     # Ceremonies, WIP, impediments
    applied-ai-engineer.md              # AI/ML pipelines (conditional)
    data-scientist.md                   # Analytics + data analysis (conditional)
    ux-ui-designer.md                   # UX/UI + design strategy (conditional)
    prompt-engineer.md                  # Prompt design, LLM integration (conditional)
  templates/
    epic-breakdown.md                   # Epic decomposition schema
    review-verdict.md                   # Universal review verdict format
    final-report.md                     # Completion summary + retrospective
    sprint-retro.md                     # ACE strategy/pitfall capture
  scripts/
    brain/                              # TypeScript + XState v5 engine
      src/                              # Source (cli, engine, navigation, output)
      dist/brain.cjs                    # Pre-built bundle (no build step needed)
      run.sh                            # Wrapper: node dist/brain.cjs "$@"
    create-backlog.sh                   # Scaffold backlog.json from epics
    init-sprint.sh                      # Create sprint-{n}/ dirs + report stubs
    check-refinement.sh                 # Verify stories meet Definition of Ready
    calculate-capacity.sh               # Team capacity for sprint planning
    check-epic-status.sh                # Epic completion status across sprints
    record-velocity.sh                  # Record sprint velocity data
    collect-learnings.sh                # Aggregate ACE entries across sprints
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
