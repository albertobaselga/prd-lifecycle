# Plan: PRD Lifecycle Skill

> Persistent reference copy. See `~/.claude/skills/prd-lifecycle/` for the live skill.

## Overview

A Claude Code skill that takes a PRD and orchestrates the full development lifecycle using native Agent Teams, modeled after a high-performance Scrum team. All actors participate in refinement. Each sprint is self-contained: build → verify → review → sprint review → retro. Learnings compound across sprints via ACE model.

## Principles

- No OMC dependency — `general-purpose` subagent type, native Claude Code tools only
- All Opus — every teammate uses opus model
- Ceremony-driven — no phase transitions without multi-party validation
- Reviewers inside the sprint — not a separate wave
- ACE learnings at every Sprint Review
- Project-local artifacts in `prd-lifecycle/` (no `.omc/`)
- Deterministic steps handled by shell scripts (not LLM reasoning)

## File Inventory (22 files)

```
~/.claude/skills/prd-lifecycle/
  SKILL.md                              # Main orchestration (~1500+ lines)
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
    applied-ai-engineer.md              # AI/ML pipelines, model selection (conditional)
    data-scientist.md                   # Analytics, experimentation, metrics (conditional)
    ux-ui-designer.md                   # UX/UI, accessibility, design system (conditional)
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

~/.claude/docs/plans/
  prd-lifecycle.md                      # This file (persistent reference)
```

## The Team (14 roles, max 5 concurrent)

### Core Roles (always available)

| Role | Model | Type | Purpose |
|------|-------|------|---------|
| Product Owner / Scrum Master | (lead) | orchestrator | Backlog, ceremonies, gates |
| architect | opus | general-purpose | Design authority, arch review |
| data-engineer | opus | general-purpose | Data model, schemas, migrations |
| dev-1 | opus | general-purpose | Build + review dev-2's code |
| dev-2 | opus | general-purpose | Build + review dev-1's code |
| qa-engineer | opus | general-purpose | Tests, build verification |
| security-reviewer | opus | general-purpose | OWASP, secrets, validation |
| performance-reviewer | opus | general-purpose | Complexity, N+1, latency |
| code-reviewer | opus | general-purpose | Quality, SOLID, patterns |
| tech-writer | opus | general-purpose | Specs, docs, changelog |
| release-engineer | opus | general-purpose | Git, CI/CD, deployment, PR |

### Conditional Specialists (activated by PRD domain analysis)

| Role | Model | Type | Activated When | Purpose |
|------|-------|------|----------------|---------|
| applied-ai-engineer | opus | general-purpose | PRD has AI/ML features | ML pipelines, model selection, inference, responsible AI |
| data-scientist | opus | general-purpose | PRD has analytics/experimentation | Metrics, A/B testing, event tracking, statistical modeling |
| ux-ui-designer | opus | general-purpose | PRD has user-facing interfaces | UX, accessibility, design system, responsive design |

## Process: 3 Phases

### Phase 1: SPECIFICATION (5 teammates)
- Ceremony 1: Backlog Refinement (all 5 challenge stories)
- Ceremony 2: Epic Decomposition (architect + data-engineer lead, all review)
- Ceremony 3: Architecture + Data Model + Spec Validation (parallel tracks, all validate)
- Gate: All approved → shutdown all 5

### Phase 2: EXECUTION SPRINTS (per epic)
- Sprint Planning (lead creates task dependency graph)
- Sub-Phase A: BUILD (2-3 teammates — pair programming + data if needed)
- Sub-Phase B: VERIFY + REVIEW (4-5 reviewers in parallel)
- Sub-Phase C: ARCHITECTURE REVIEW (architect)
- Sprint Review (all current teammates)
- Sprint Retrospective (ACE learnings captured)
- Shutdown → next epic

### Phase 3: RELEASE (2 teammates)
- tech-writer: README, API docs, data docs, changelog, release notes
- release-engineer: Git, versioning, CI/CD, deployment, PR
- Final Retrospective + TeamDelete

## Task Dependency Graph (per data-heavy epic)

```
DATA tasks (data-engineer)
    → IMPL tasks (dev-1, dev-2) [blockedBy DATA]
        → PAIR-REVIEW tasks (cross-dev) [blockedBy IMPL]
            → QA, SEC, PERF, CODE, DATA-REV, ARCH [blockedBy all pair reviews]
                → SPRINT REVIEW ceremony
                    → SPRINT RETRO (ACE)
```

## Error Handling

| Failure | Recovery |
|---------|----------|
| Ceremony deadlock (3+ iterations) | Lead makes binding decision |
| Pair review deadlock (3 fix cycles) | Lead mediates |
| QA exhaustion (5 cycles or same failure 3x) | Stop, report to user |
| CRITICAL security finding | Escalate to user |
| Data model conflict | Lead mediates, data-engineer authority |
| Teammate crash (>10min silence) | Reassign, spawn replacement |
| Sprint Review NO-GO | Re-run affected sub-phases only |
| AI/ML model conflict (AI eng vs architect) | Lead mediates, AI eng authority on ML |
| UX vs feature scope conflict | Lead mediates, UX authority on accessibility |
| Analytics vs privacy conflict | Security authority on privacy, analytics adapts |

## Key Design Decisions

1. **Data-engineer in refinement** — Data modeling is more critical at spec time than implementation details (which architect covers)
2. **Reviewers inside sprints** — Tighter feedback loops, fewer context switches
3. **Shell scripts for deterministic steps** — Don't waste LLM reasoning on file creation and JSON updates
4. **ACE feed-forward** — Each sprint's learnings are injected into the next sprint's teammate prompts
5. **Max 5 concurrent** — Respects Claude Code team limits while allowing full coverage
6. **Phase recycling** — Same team name, different teammate compositions per phase
7. **Conditional specialists** — AI Engineer, Data Scientist, UX Designer activated by PRD domain analysis, swap into slots to respect max-5-concurrent rule

## Invocation

```
/prd-lifecycle ./docs/prd.md
/prd-lifecycle https://docs.example.com/prd
/prd-lifecycle "Build a task management API with auth, CRUD, and real-time updates"
```
