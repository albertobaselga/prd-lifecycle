# ACE Pitfalls Playbook

<!--
This playbook tracks mistakes to avoid in this workspace.
Claude reads this before each prompt to avoid repeating errors.
Reference entry IDs like [pit-001] when avoiding a pitfall.

Format:
## [pit-XXX] YYYY-MM-DD | helpful=N
**Context:** When this can happen
**Pitfall:** What went wrong
**Consequence:** Impact
**Prevention:** How to avoid
---
-->


## [pit-002] 2026-02-10 | helpful=0
**Context:** When a plan includes both 'build step' and 'integration tests that run the built artifact'
**Pitfall:** Ordering build AFTER integration test changes means tests validate against stale dist/ artifacts from a previous build
**Consequence:** Tests pass falsely — they're testing the old code, not the new implementation. The bug only surfaces when someone runs a clean build later.
**Prevention:** In TDD plans with compiled artifacts: always sequence as (1) write unit tests, (2) write implementation, (3) BUILD, (4) update integration tests, (5) run full suite
---

## [pit-003] 2026-02-10 | helpful=0
**Context:** When writing implementation plans that reference exact file changes
**Pitfall:** Describing changes in prose ('add a cheatsheet section') without providing the exact code leads to ambiguous execution where the implementer makes different assumptions
**Consequence:** Implementation diverges from intent, requiring rework cycles. First plan review caught that 'missing exact code' was the #1 issue.
**Prevention:** Plans must include complete, copy-pasteable code blocks for every file change — treat the plan as a script, not a description
---

## [pit-004] 2026-02-10 | helpful=0
**Context:** When running multiple critic review rounds on a large plan within a single conversation
**Pitfall:** Each review round adds significant context (the full plan + review findings + updated plan), and 3 rounds of review on a 30-file change plan can exhaust the context window before execution even begins
**Consequence:** Session ran out of context and required a continuation, losing fine-grained context about early review findings and forcing a summary-based handoff
**Prevention:** For large plans (>15 files), limit to 2 review rounds in the planning session, then start execution in a fresh session with the plan file as the single source of truth. The plan file itself should be the context, not the conversation history.
---

## [pit-005] 2026-02-12 | helpful=0
**Context:** When a plan removes fields from shared types (BrainContext, BrainEvent) and those types are used across 6+ files (guards, actions, navigation, output, persistence, tests)
**Strategy:** Updating types.ts first without simultaneously updating all consumers creates a window where the build is broken and you can't validate intermediate progress
**Consequence:** You must hold the entire type-change cascade in your head across multiple sequential edits. If any consumer file is missed, the build break only surfaces later when you try to compile — potentially after writing more code on top of the broken state.
**Prevention:** When removing or renaming type fields, grep for every usage BEFORE starting edits, create a complete list of all files that reference the removed fields, and include them all in the same execution batch. Don't split type definition changes and their consumers across different batches.
---

## [pit-006] 2026-02-12 | helpful=0
**Context:** When tests validate guard conditions that check machine context (not event payload), such as `noRemainingStories` checking `product_backlog_count=0`
**Pitfall:** Writing tests that only send the event without first setting the required context values — assuming the guard checks the event payload rather than pre-existing machine context
**Consequence:** Guard rejects the event because context doesn't satisfy the condition, causing test failures that look like the transition is broken when it's actually the test setup that's wrong
**Prevention:** Before writing guard-dependent test transitions, read the actual guard implementation to confirm whether it checks context or event payload, then ensure test setup assigns the required context values (via prior transitions or context initialization) before firing the guarded event
---

## [pit-007] 2026-02-12 | helpful=0
**Context:** When writing CLI smoke tests for a state machine with event-driven transitions mapped through a step-name lookup table
**Pitfall:** Guessing step names from memory (e.g., 'ceremony_1_done', 'sprint_setup_done') instead of reading the actual CLI step-name mappings in the source code first
**Consequence:** Smoke test silently used wrong step names, state appeared stuck at 'phase1_spawned', wasting a full debug cycle (grep → read → re-run) before discovering the correct names were 'ceremony1_complete' and 'sprint_planning_done'
**Prevention:** Before writing any CLI smoke test sequence, grep for the step-name mapping table (e.g., `stepToEvent` or equivalent) and use exact step names from the source — never reconstruct them from memory or convention
---
