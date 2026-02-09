# Phase 2: Execution Sprints

Execute one sprint per epic (or batch independent epics into one sprint if they
share no dependencies and combined complexity is manageable). Follow the execution
order from epics.json.

For EACH sprint:

----------------------------------------------------------------------------
SPRINT SETUP
----------------------------------------------------------------------------

S.1  INITIALIZE SPRINT DIRECTORY

     Determine sprint number (starts at 1, increments per sprint).
     Run: bash ~/.claude/skills/prd-lifecycle/scripts/init-sprint.sh {n}

     This creates:
       prd-lifecycle/sprints/sprint-{n}/
         reports/
           qa.md
           security.md
           performance.md
           code-review.md
           arch-review.md
           data-review.md
         review.md
         retro.md

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh current_epic=E{id} step=sprint_setup
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

S.2  LOAD PRIOR LEARNINGS

     Read prd-lifecycle/learnings.md. This file contains accumulated ACE entries
     from all prior sprints. All teammates spawned in this sprint will receive
     these learnings as part of their context.

     CONTEXT MANAGEMENT (applies to ALL context distribution steps):

     When distributing context to teammates, the Lead MUST:
     a) Send file PATHS, not file contents — let teammates read files themselves
     b) For changed-file lists: send paths grouped by directory
     c) For fix cycles: send only the specific finding (file:line + description),
        NOT the full review report
     d) For learnings.md: if > 150 lines, tell teammates to read only the
        last 2 sprint sections and any entries with helpful >= 3

S.3  CREATE TASKS WITH DEPENDENCY GRAPH

     Use TaskCreate to create all tasks for this sprint. Use TaskUpdate with
     addBlockedBy to establish the dependency chain.

     For STANDARD epics (not data-heavy):
       Task 1: IMPL-{epic}-1 — "Implement {story group A}"
       Task 2: IMPL-{epic}-2 — "Implement {story group B}"
       Task 3: PAIR-REVIEW-1 — "Pair review of IMPL-1" (blockedBy: IMPL-1)
       Task 4: PAIR-REVIEW-2 — "Pair review of IMPL-2" (blockedBy: IMPL-2)
       Task 5: QA — "QA verification" (blockedBy: PAIR-REVIEW-1, PAIR-REVIEW-2)
       Task 6: SECURITY — "Security review" (blockedBy: PAIR-REVIEW-1, PAIR-REVIEW-2)
       Task 7: PERFORMANCE — "Performance review" (blockedBy: PAIR-REVIEW-1, PAIR-REVIEW-2)
       Task 8: CODE-REVIEW — "Code quality review" (blockedBy: PAIR-REVIEW-1, PAIR-REVIEW-2)
       Task 9: ARCH-REVIEW — "Architecture review" (blockedBy: QA, SECURITY, PERFORMANCE, CODE-REVIEW)
       Task 10: SPRINT-REVIEW — "Sprint review" (blockedBy: ARCH-REVIEW)

     For DATA-HEAVY epics:
       Task 1: DATA-{epic} — "Implement data layer (schemas, migrations)"
       Task 2: IMPL-{epic}-1 — "Implement {story group A}" (blockedBy: DATA)
       Task 3: IMPL-{epic}-2 — "Implement {story group B}" (blockedBy: DATA)
       Task 4-5: PAIR-REVIEW tasks (blockedBy: respective IMPL)
       Task 6: DATA-REVIEW — "Data model review" (blockedBy: PAIR-REVIEW-1, PAIR-REVIEW-2)
       Task 7-10: QA, SECURITY, PERFORMANCE, CODE-REVIEW (blockedBy: PAIR-REVIEW-1, PAIR-REVIEW-2)
       Task 11: ARCH-REVIEW (blockedBy: QA, SECURITY, PERFORMANCE, CODE-REVIEW, DATA-REVIEW)
       Task 12: SPRINT-REVIEW (blockedBy: ARCH-REVIEW)

----------------------------------------------------------------------------
SUB-PHASE A: BUILD (2-3 teammates)
----------------------------------------------------------------------------

A.1  SPAWN BUILD TEAMMATES

     For standard epics, spawn 2 developers:

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="dev-1",
          prompt="You are Developer 1 in a pair programming team. You implement
          features and review your partner's code. Read your role instructions
          from ~/.claude/skills/prd-lifecycle/preambles/dev.md and prior
          learnings from prd-lifecycle/learnings.md (if it exists) before
          starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="dev-2",
          prompt="You are Developer 2 in a pair programming team. You implement
          features and review your partner's code. Read your role instructions
          from ~/.claude/skills/prd-lifecycle/preambles/dev.md and prior
          learnings from prd-lifecycle/learnings.md (if it exists) before
          starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     For data-heavy epics, also spawn data-engineer:

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="data-engineer",
          prompt="You are the Data Engineer. Implement the data layer: schemas,
          migrations, seed data, and data access patterns. Read your role
          instructions from ~/.claude/skills/prd-lifecycle/preambles/data-engineer.md
          and prior learnings from prd-lifecycle/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     CONDITIONAL BUILD SPECIALISTS (max 3 total with devs, respecting 5-limit):

     If has_ai_ml AND this epic involves AI/ML features, spawn applied-ai-engineer
     INSTEAD OF one dev (use dev-1 only + applied-ai-engineer):
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="applied-ai-engineer",
          prompt="You are the Applied AI Engineer. Implement the ML pipeline
          components for this epic. Read your role instructions from
          ~/.claude/skills/prd-lifecycle/preambles/applied-ai-engineer.md and
          prior learnings from prd-lifecycle/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     If has_frontend_ui AND this epic involves significant UI work, spawn
     ux-ui-designer INSTEAD OF one dev (use dev-1 only + ux-ui-designer):
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="ux-ui-designer",
          prompt="You are the UX/UI Product Designer. Implement the UI
          components and ensure accessibility compliance. Read your role
          instructions from ~/.claude/skills/prd-lifecycle/preambles/ux-ui-designer.md
          and prior learnings from prd-lifecycle/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     If has_analytics AND this epic involves analytics features, spawn
     data-scientist INSTEAD OF one dev (use dev-1 only + data-scientist):
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="data-scientist",
          prompt="You are the Data Scientist. Implement the analytics pipeline,
          event tracking, and metrics infrastructure. Read your role instructions
          from ~/.claude/skills/prd-lifecycle/preambles/data-scientist.md and
          prior learnings from prd-lifecycle/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     NOTE: Only ONE conditional specialist per BUILD sub-phase. If an epic
     requires multiple specialists (e.g., AI + UI), prioritize the dominant
     domain and have the dev handle the secondary domain. The specialist
     review in VERIFY will catch issues.

     When a conditional specialist replaces dev-2 in BUILD:
     - dev-1 handles general implementation + pair reviews the specialist's code
     - The specialist handles domain-specific implementation
     - Pair review is: dev-1 reviews specialist's code, specialist reviews
       dev-1's domain-relevant code

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh step=sprint_build
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

A.2  DISTRIBUTE CONTEXT

     Send each build teammate:
     - The architecture doc for this epic (prd-lifecycle/arch/epic-{id}.md)
     - The data model doc for this epic (prd-lifecycle/data/epic-{id}.md)
     - The functional spec for this epic (prd-lifecycle/specs/epic-{id}.md)
     - The accumulated learnings (prd-lifecycle/learnings.md)
     - Their assigned IMPL task(s)

A.3  DATA-HEAVY SEQUENCE (if applicable)

     If data-heavy epic:
     a) data-engineer implements DATA task first (schemas, migrations, seed data)
     b) data-engineer marks DATA task complete and reports files changed
     c) Lead unblocks IMPL tasks (TaskUpdate status)
     d) dev-1 and dev-2 begin IMPL tasks

A.4  IMPLEMENTATION

     Each developer implements their assigned stories:
     a) Developer reads the spec and architecture docs
     b) Developer writes code, tests, and documentation comments
     c) Developer marks their IMPL task complete
     d) Developer reports: files created/changed, test results, any deviations
        from spec (with justification)

A.5  PAIR REVIEW PROTOCOL

     ALL pair review communication goes through the Lead via SendMessage.
     Teammates do NOT message each other directly.

     When a developer completes their IMPL task, the opposite developer's
     PAIR-REVIEW task unblocks:

     a) Lead sends the completed work to the reviewing developer via SendMessage:
        SendMessage(type="message", recipient="{reviewing-dev-name}",
          content="PAIR REVIEW: Review the following implementation by {dev-name}.
          Check against: (1) acceptance criteria from the spec, (2) architecture
          compliance, (3) code quality and readability, (4) test coverage,
          (5) error handling. Files changed: {file list}. Spec: {spec reference}.
          Respond with APPROVE or REQUEST_CHANGES with specific file:line feedback.",
          summary="Pair review request for {dev-name}'s work")

        Wait for the reviewer's SendMessage response. Do NOT proceed based on
        idle status — the reviewer may be reading code.

     b) If reviewer responds APPROVE: mark PAIR-REVIEW task complete.

     c) If reviewer responds REQUEST_CHANGES:
        - Lead relays the change requests to the original developer via SendMessage:
          SendMessage(type="message", recipient="{original-dev-name}",
            content="PAIR REVIEW CHANGES REQUESTED: {reviewer feedback}",
            summary="Change requests from pair review")
        - Wait for the developer's SendMessage response confirming fix
        - Lead sends re-review request to the reviewer via SendMessage:
          SendMessage(type="message", recipient="{reviewing-dev-name}",
            content="PAIR REVIEW RE-CHECK: Changes applied. Please re-review. {details}",
            summary="Re-review after pair review fixes")
        - Wait for reviewer's SendMessage response
        - Maximum 3 fix cycles
        - After 3 cycles: lead reviews the dispute, makes a binding decision,
          and documents the rationale in the sprint review notes

A.6  SHUTDOWN BUILD TEAMMATES

     Once all PAIR-REVIEW tasks are complete (all approved):
     SendMessage(type="shutdown_request", recipient="dev-1", content="Build phase complete.")
     SendMessage(type="shutdown_request", recipient="dev-2", content="Build phase complete.")
     If data-engineer was spawned:
     SendMessage(type="shutdown_request", recipient="data-engineer", content="Build phase complete.")

     Wait for shutdown confirmations (responses arrive as new conversation
     turns). Track which teammates have confirmed shutdown.

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh step=sprint_build_done
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

----------------------------------------------------------------------------
SUB-PHASE B: VERIFY + REVIEW (4-5 teammates, parallel)
----------------------------------------------------------------------------

B.1  SPAWN REVIEW TEAMMATES

     Spawn 4 reviewers (5 if data-heavy epic):

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="qa-engineer",
          prompt="You are the QA Engineer. Run tests, write new tests for
          uncovered paths, verify build integrity, and run type checking.
          Read your role instructions from
          ~/.claude/skills/prd-lifecycle/preambles/qa-engineer.md and prior
          learnings from prd-lifecycle/learnings.md (if it exists) before
          starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="security-reviewer",
          prompt="You are the Security Reviewer. Check OWASP Top 10 compliance,
          scan for secrets/credentials in code, validate input sanitization,
          review auth flows, and assess dependency vulnerabilities.
          Read your role instructions from
          ~/.claude/skills/prd-lifecycle/preambles/security-reviewer.md and
          prior learnings from prd-lifecycle/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="performance-reviewer",
          prompt="You are the Performance Reviewer. Identify O(n^2+) hotspots,
          N+1 query patterns, memory leaks, unnecessary re-renders, bundle size
          issues, and missing caching opportunities. Read your role instructions
          from ~/.claude/skills/prd-lifecycle/preambles/performance-reviewer.md
          and prior learnings from prd-lifecycle/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="code-reviewer",
          prompt="You are the Code Reviewer. Evaluate code quality, SOLID
          principles adherence, DRY compliance, naming conventions, error
          handling patterns, and documentation completeness. Read your role
          instructions from
          ~/.claude/skills/prd-lifecycle/preambles/code-reviewer.md and prior
          learnings from prd-lifecycle/learnings.md (if it exists) before
          starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     If data-heavy epic:
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="data-engineer",
          prompt="You are the Data Engineer reviewing the data layer. Verify
          schema correctness, migration safety (up and down), index coverage,
          constraint enforcement, and data integrity. Read your role instructions
          from ~/.claude/skills/prd-lifecycle/preambles/data-engineer.md and
          prior learnings from prd-lifecycle/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh step=sprint_verify
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

     CONDITIONAL SPECIALIST REVIEWERS:

     Conditional specialists review AFTER the core 4 reviewers complete and
     are shut down (to respect max-5-concurrent). The lead runs them as a
     second verification wave if applicable to this epic.

     If has_ai_ml AND this epic has AI/ML components:
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="applied-ai-engineer",
          prompt="You are the Applied AI Engineer reviewing the ML components.
          Verify model integration, inference performance, fallback behavior,
          and responsible AI compliance. Read your role instructions from
          ~/.claude/skills/prd-lifecycle/preambles/applied-ai-engineer.md and
          prior learnings from prd-lifecycle/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")
     → Writes to: sprints/sprint-{n}/reports/ai-review.md

     If has_analytics AND this epic has analytics components:
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="data-scientist",
          prompt="You are the Data Scientist reviewing analytics components.
          Verify event tracking, metrics accuracy, statistical validity,
          and data privacy compliance. Read your role instructions from
          ~/.claude/skills/prd-lifecycle/preambles/data-scientist.md and
          prior learnings from prd-lifecycle/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")
     → Writes to: sprints/sprint-{n}/reports/analytics-review.md

     If has_frontend_ui AND this epic has UI components:
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="ux-ui-designer",
          prompt="You are the UX/UI Product Designer reviewing the interface.
          Verify design compliance, accessibility (WCAG 2.1 AA), responsive
          behavior, and UI state coverage. Read your role instructions from
          ~/.claude/skills/prd-lifecycle/preambles/ux-ui-designer.md and
          prior learnings from prd-lifecycle/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")
     → Writes to: sprints/sprint-{n}/reports/ux-review.md

     These conditional reviews follow the same finding severity protocol
     (CRITICAL/HIGH/MEDIUM/LOW) and the same fix cycle limits (max 3) as
     the core reviewers.

B.2  DISTRIBUTE REVIEW CONTEXT

     Send each reviewer:
     - The list of all files changed in this sprint
     - The architecture doc, data model doc, and spec for this epic
     - Their assigned review task
     - The report file they should write to:
       * qa-engineer → sprints/sprint-{n}/reports/qa.md
       * security-reviewer → sprints/sprint-{n}/reports/security.md
       * performance-reviewer → sprints/sprint-{n}/reports/performance.md
       * code-reviewer → sprints/sprint-{n}/reports/code-review.md
       * data-engineer → sprints/sprint-{n}/reports/data-review.md

     Include this instruction in every review context message:
     "CONTEXT MANAGEMENT: Do NOT read all files in a single turn.
     1. Read the spec and architecture doc first (understand intent)
     2. Read changed files ONE DIRECTORY AT A TIME, core logic first
     3. Skip test files on first pass — review after core logic
     4. For files > 300 lines, use Grep to find relevant functions
     5. Write findings to your report file INCREMENTALLY after each
        file group — do not accumulate all findings in memory"

B.3  PARALLEL REVIEW EXECUTION

     All reviewers work simultaneously. Each produces a report with:
     - Finding severity: CRITICAL / HIGH / MEDIUM / LOW / INFO
     - Finding description with file:line references
     - Recommended fix
     - Overall verdict: PASS / PASS_WITH_WARNINGS / FAIL

     Specific reviewer instructions:

     qa-engineer:
     - Run existing test suite (bash commands)
     - Write new tests for uncovered acceptance criteria
     - Run build verification (compile/transpile succeeds)
     - Run type checking via lsp_diagnostics_directory
     - Report test coverage gaps

     security-reviewer:
     - OWASP Top 10 checklist against the code
     - Scan for hardcoded secrets, API keys, credentials
     - Validate all user input is sanitized
     - Review authentication and authorization logic
     - Check dependency versions for known vulnerabilities

     performance-reviewer:
     - Identify algorithmic complexity hotspots (O(n^2) or worse)
     - Detect N+1 query patterns
     - Check for memory leaks (unclosed resources, growing collections)
     - Review bundle size impact (if frontend)
     - Identify missing caching opportunities

     code-reviewer:
     - SOLID principles compliance
     - Code duplication detection
     - Naming convention consistency
     - Error handling completeness
     - Documentation and comment quality

     data-engineer (if present):
     - Schema correctness against data model doc
     - Migration safety (reversible, handles existing data)
     - Index coverage for query patterns
     - Constraint enforcement (NOT NULL, UNIQUE, FK)
     - Data integrity across related entities

B.4  COLLECT REPORTS AND TRIAGE

     Wait for all reviewers to complete. Reviewer responses arrive as new
     conversation turns via SendMessage. Track which reviewers have responded.
     If a reviewer hasn't responded after 5 minutes, send a follow-up message.
     Continue only when all expected reviewer responses have been received.
     Read each report. Triage findings:

     a) CRITICAL findings: Must be fixed before sprint can pass.
        ALL fix-cycle communication goes through the Lead via SendMessage.
        HYBRID FIX CYCLE (context-aware):

        Cycle 1 — Reuse existing dev-1 (already has project context):
        - Send ONLY the finding details: file:line + description + fix guidance
        - Do NOT re-send the full review report or file contents
          SendMessage(type="message", recipient="dev-1",
            content="FIX REQUIRED: {file}:{line} — {finding description}.
            Fix guidance: {specific fix suggestion}.
            RESPONSE FORMAT: Fix the code, then respond confirming
            what you changed (files and lines modified).",
            summary="Critical finding fix request")
        - Wait for the developer's SendMessage response confirming fix

        Cycle 2+ — If dev-1's context is exhausted or fix failed:
        - Shut down dev-1 via SendMessage(type="shutdown_request")
        - Spawn a FRESH developer with MINIMAL context:
          Task(subagent_type="general-purpose", name="dev-fix",
            prompt="Fix {file}:{line} — {finding}. Read ONLY that file.
            Fix the issue and report what you changed.")
        - This fresh agent has clean context, avoiding accumulation

        Re-verification — TARGETED, not full re-review:
        - Send to the original reviewer:
          SendMessage(type="message", recipient="{reviewer-name}",
            content="RE-VERIFY: Re-read ONLY {file}:{lines changed}.
            PASS or FAIL + one-line reason.",
            summary="Targeted re-verification request")
        - Wait for reviewer's SendMessage response

        - Maximum 3 fix-verify cycles per finding
        - If not resolved after 3 cycles: escalate to user via AskUserQuestion

     b) HIGH findings: Should be fixed. Follow same process as CRITICAL.

     c) MEDIUM findings: Fix if time permits, otherwise document as tech debt.

     d) LOW/INFO findings: Document only, no action required.

B.5  GATE: VERIFY + REVIEW PASS

     The sprint passes Sub-Phase B when:
     - Zero CRITICAL findings remain unresolved
     - Zero HIGH findings remain unresolved (or explicitly deferred by user)
     - All tests pass
     - Build succeeds
     - Type checking passes (zero errors)

B.6  SHUTDOWN REVIEW TEAMMATES (except any needed for arch review)

     Shutdown: qa-engineer, security-reviewer, performance-reviewer, code-reviewer
     and data-engineer (if present).

     If architect is needed for Sub-Phase C and a slot is available, keep one
     reviewer slot open.

     NEXT: Sub-Phase C — Architecture Review. Spawn the architect as a team
     agent via Task(team_name=...). See C.1.

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh step=sprint_verify_done
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

----------------------------------------------------------------------------
SUB-PHASE C: ARCHITECTURE REVIEW
----------------------------------------------------------------------------

C.1  SPAWN ARCHITECT (if not already present)

     ⚠ TEAM AGENT REQUIRED — The architect MUST be spawned as a team agent
     with Task(team_name=...) so it uses SendMessage protocol.

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="architect",
          prompt="You are the Architect performing a post-implementation review.
          Verify the implementation matches the architecture documents. Read
          your role instructions from
          ~/.claude/skills/prd-lifecycle/preambles/architect.md and prior
          learnings from prd-lifecycle/learnings.md (if it exists) before
          starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh step=sprint_arch_review
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

C.2  ARCHITECTURE COMPLIANCE CHECK

     Send the architect:
     - Architecture doc for this epic (prd-lifecycle/arch/epic-{id}.md)
     - List of all files created/changed in this sprint
     - All review reports from Sub-Phase B

     "ARCHITECTURE REVIEW: Verify that the implementation matches the
     architecture document. Check: component boundaries respected, interfaces
     match spec, integration points correct, error handling strategy followed,
     no architectural drift. Write your report to:
     sprints/sprint-{n}/reports/arch-review.md"

C.3  HANDLE FINDINGS

     If architect finds CRITICAL architectural drift:
     - Re-spawn developer to fix
     - Maximum 3 fix cycles
     - If unresolvable: escalate to user

C.4  GATE: ARCHITECTURE REVIEW PASS

     arch-review.md verdict must be PASS or PASS_WITH_WARNINGS.

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh step=sprint_arch_done
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

----------------------------------------------------------------------------
SPRINT REVIEW
----------------------------------------------------------------------------

R.1  GATHER ALL CURRENT TEAMMATES

     At this point, only the architect should be active. The lead conducts the
     sprint review.

R.2  PRESENT SUMMARY

     Send to architect via SendMessage:
     "SPRINT REVIEW: Sprint {n} for epic {id} ({title}) is complete.
     Summary of results:
     - QA: {verdict} ({N} findings)
     - Security: {verdict} ({N} findings)
     - Performance: {verdict} ({N} findings)
     - Code Quality: {verdict} ({N} findings)
     - Data Review: {verdict if applicable}
     - Architecture: {verdict}
     - Tests: {pass/fail count}
     - Build: {pass/fail}
     What is your overall confidence level? Any concerns for future epics?
     RESPONSE FORMAT: Respond via SendMessage with your confidence assessment
     and any concerns inline in the message content."

     Wait for architect's SendMessage response before proceeding.

R.3  GO / NO-GO DECISION

     Based on all reports and architect feedback, the lead makes a decision:

     GO — All gates passed, no unresolved CRITICAL/HIGH findings.
     NO-GO — Unresolved issues remain. Create targeted fix tasks and re-run
     only the affected sub-phases (do not restart the entire sprint).

R.4  WRITE SPRINT REVIEW

     Write to prd-lifecycle/sprints/sprint-{n}/review.md:
     - Date, epic covered, decision (GO/NO-GO)
     - Summary of each review area
     - Key findings and resolutions
     - Deferred items (if any)
     - Confidence assessment

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh step=sprint_review_done
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

----------------------------------------------------------------------------
SPRINT RETROSPECTIVE
----------------------------------------------------------------------------

T.1  ASK TEAMMATES FOR RETROSPECTIVE INPUT

     Send to all active teammates via SendMessage:
     "SPRINT RETROSPECTIVE: What worked well in this sprint? What didn't?
     What should we do differently in the next sprint? Format your response as:
     ## [strategy] {title}: {description}
     ## [pitfall] {title}: {description}"

     Wait for all active teammates to respond via SendMessage. Do NOT proceed
     based on idle status. Track which teammates have responded. Send follow-up
     after 5 minutes if missing.

T.2  COMPILE RETRO

     Write all entries to prd-lifecycle/sprints/sprint-{n}/retro.md using the
     format the collect-learnings.sh script expects:
     ## [strategy] {title}: {description}
     ## [pitfall] {title}: {description}

T.3  AGGREGATE LEARNINGS

     Run: bash ~/.claude/skills/prd-lifecycle/scripts/collect-learnings.sh

     This updates prd-lifecycle/learnings.md with entries from all sprint retros.

     After collect-learnings.sh completes, if learnings.md exceeds 150 lines,
     spawn a compaction agent:

     Task(subagent_type="general-purpose", model="sonnet",
       prompt="Compact prd-lifecycle/learnings.md:
       1. Read learnings.md and both ACE playbooks (for cross-reference)
       2. Remove duplicate entries (same lesson, different wording)
       3. Merge related entries into consolidated entries grouped by theme
       4. Cap the result at 150 lines maximum
       5. Group by theme (e.g., Architecture, Testing, Performance), not by sprint
       6. Preserve entries with helpful >= 3 verbatim
       7. Write the compacted result back to learnings.md")

T.4  UPDATE STATE

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh add-completed=E{id} step=sprint_retro_done
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

T.5  SHUTDOWN ALL SPRINT TEAMMATES

     Send shutdown requests to all remaining teammates (architect and any others).
     Wait for confirmations (responses arrive as new conversation turns).
     Track which teammates have confirmed shutdown.

T.6  ADVANCE TO NEXT EPIC

     Read epics.json to determine the next epic in execution_order.
     The brain output from T.4 handles routing:
     - If epics remain: LOAD shows phase2-sprints.md, RESUME AT shows SPRINT SETUP (S.1)
     - If all epics complete: RESUME AT shows PHASE 3: RELEASE in SKILL.md
     Follow the PROTOCOL in the brain output.
