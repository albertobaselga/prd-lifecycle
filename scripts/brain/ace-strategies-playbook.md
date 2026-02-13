# ACE Strategies Playbook

<!--
This playbook accumulates successful strategies for this workspace.
Claude reads this before each prompt to learn from past successes.
Reference entry IDs like [strat-001] when a strategy helps.

Format:
## [strat-XXX] YYYY-MM-DD | helpful=N
**Context:** When this applies
**Strategy:** What to do
**Outcome:** Expected result
---
-->


## [strat-002] 2026-02-10 | helpful=0
**Context:** When planning a feature that changes output format consumed by LLM agents
**Strategy:** Run multiple critic review passes on the plan before execution — each pass catches a different class of issues (pass 1: missing code, pass 2: build/test ordering, integration gaps)
**Outcome:** Execution phase completed in a single pass with all 148 tests passing, because the plan was precise enough to copy-paste. The 3 review cycles saved more time than they cost.
---

## [strat-003] 2026-02-10 | helpful=0
**Context:** When LLM agents consume structured text output (navigation boxes, status displays)
**Strategy:** Use Markdown headings and bullet lists instead of Unicode box-drawing characters — LLMs tokenize box chars as multiple expensive tokens per character while Markdown tokens are 1:1
**Outcome:** Significant token savings per brain invocation, and Markdown is natively understood by LLMs without parsing overhead
---

## [strat-004] 2026-02-12 | helpful=0
**Context:** When executing a large refactoring plan (24 steps, 5 phases) that restructures state machine workflow and type definitions
**Strategy:** Batch implementation by dependency layer — types first, then workflow definition, then logic files (navigation/output/persistence), then build, then tests. Read all files in each batch before writing any, and do a build check between batches to catch integration issues early.
**Outcome:** Each batch built on a verified foundation. The intermediate build check after batch 2 caught issues before they compounded into the test phase, avoiding the stale-artifact trap (pit-002).
---

## [strat-005] 2026-02-12 | helpful=0
**Context:** When delegating test rewrites to parallel agents across 7+ test files during a large refactoring
**Strategy:** After parallel agents complete, immediately build and run the full test suite before claiming success — then fix failures in a single focused pass by reading the actual source code (guards, workflow, output logic) to understand the correct expected values, rather than guessing from test context alone
**Outcome:** The parallel agents missed engine.test.ts entirely and introduced subtle mismatches (e.g., 'shutdown' vs 'shut down', wrong state paths for conditional rendering). The build-then-fix pass caught all 11 failures and resolved them to 198/198 passing by grounding fixes in actual source truth.
---

## [strat-006] 2026-02-12 | helpful=0
**Context:** When executing a multi-batch plan with 3+ independent tasks (e.g., scripts, docs, templates) that don't share state
**Strategy:** Dispatch independent tasks to parallel agents while simultaneously starting the next independent task (Task 13 preambles) yourself — don't wait idle for agents to finish
**Outcome:** Batch 4 completed 4 tasks (10-13) in the wall-clock time of the slowest single agent, rather than sequentially. The lead stayed productive on preamble edits while 3 agents wrote scripts/docs/templates in parallel.
---

## [strat-007] 2026-02-12 | helpful=0
**Context:** When merging a large feature branch (27+ modified files) with multiple concerns into master
**Strategy:** Group commits by logical concern (core engine, tests+build, docs+scripts) rather than one monolithic commit or per-file commits — this creates a reviewable, bisectable history while keeping the merge clean via fast-forward
**Outcome:** Clean fast-forward merge with 3 semantic commits, 198/198 tests passing on master, and easy-to-navigate git history for future debugging or rollback
---
