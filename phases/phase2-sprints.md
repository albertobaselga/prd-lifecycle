# Phase 2: Execution Sprints

## Teammate Lifecycle

| Role | Lifecycle | Spawn Point | Shutdown Point |
|------|-----------|-------------|----------------|
| Scrum Master (SM) | Long-lived | First Refinement (R.1) | T.5 when routing to Release |
| Product Manager (PM) | Per-cycle | Refinement start (R.2) | After Sprint Review (SR.5) |
| Developers (dev-1, dev-2) | Per-sprint | BUILD sub-phase | After BUILD complete |
| Reviewers (qa, security, etc.) | Per-sprint | VERIFY sub-phase | After VERIFY complete |
| Architect | Per-sprint | ARCH REVIEW sub-phase | After Retro |
| Conditional specialists | As needed | Per sub-phase | After sub-phase |

Execute sprints using story-based planning. Stories from multiple epics may be batched
into a single sprint if they share no dependencies and combined capacity is manageable.
Follow the continuous cycle: REFINEMENT → PLANNING → SPRINT → RETRO → (loop or release).

For EACH cycle:

----------------------------------------------------------------------------
REFINEMENT (Team: TL + SM + PM + Executors)
----------------------------------------------------------------------------

R.1  SPAWN SCRUM MASTER (if not already alive)

     If this is the first refinement session, spawn the Scrum Master:

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="scrum-master",
          prompt="You are the Scrum Master. You facilitate refinement sessions,
          sprint planning, and retrospectives. You help the team estimate story
          points, decompose stories into tasks, and maintain process discipline.
          Read your role instructions from
          ~/.claude/skills/prd-lifecycle/preambles/scrum-master.md and prior
          learnings from prd-lifecycle/{slug}/learnings.md (if it exists) before
          starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     The Scrum Master stays alive across all refinement and planning sessions
     until just before release.

R.2  SPAWN PRODUCT MANAGER

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="product-manager",
          prompt="You are the Product Manager. Present stories from the backlog,
          explain business context, answer clarifying questions, and validate
          that decomposed tasks meet acceptance criteria. Read your role
          instructions from ~/.claude/skills/prd-lifecycle/preambles/product-manager.md
          and prior learnings from prd-lifecycle/{slug}/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

R.3  FACILITATE REFINEMENT SESSION

     SM facilitates the refinement session:

     SendMessage(type="message", recipient="scrum-master",
       content="REFINEMENT SESSION: Read prd-lifecycle/{slug}/backlog.json and
       identify all stories with status=\"backlog\". Present each story to the
       team for decomposition and estimation. Use the Story Point calibration
       table to guide estimates:

       | SP | T-shirt | Files | Risk |
       |---|---|---|---|
       | 1 | XS | 1-2 | Minimal |
       | 2 | S | 2-3 | Low |
       | 3 | M | 4-6 | Moderate |
       | 5 | L | 7-10 | High |
       | 8 | XL | 10+ | Very High |

       For each story, coordinate with PM to:
       1. Clarify acceptance criteria
       2. Decompose into tasks (implementation, review, testing)
       3. Estimate story points based on complexity and risk
       4. Update backlog.json: change status to \"refined\", add tasks array
          and story_points field

       Present stories in priority order from backlog.json. Work through the
       backlog until the team signals capacity for planning or until all
       stories are refined.

       RESPONSE FORMAT: After refining each batch of stories, report:
       - Stories refined (IDs and titles)
       - Story points assigned
       - Number of stories remaining with status=\"backlog\"",
       summary="Refinement session facilitation")

     Wait for SM's SendMessage response. Track refinement progress. The PM may
     send clarifying questions to the lead — answer them and relay to SM.

R.4  PRODUCT MANAGER VALIDATION

     After SM reports refinement progress, send to PM:

     SendMessage(type="message", recipient="product-manager",
       content="VALIDATE REFINEMENT: Review the refined stories in
       prd-lifecycle/{slug}/backlog.json. Verify that:
       1. Tasks cover all acceptance criteria
       2. Story points align with complexity
       3. No critical details were missed

       If validation fails, report which stories need re-refinement.
       If validation passes, confirm readiness for planning.",
       summary="Refinement validation")

     Wait for PM's SendMessage response.

     If PM requests re-refinement, relay feedback to SM and repeat R.3.
     Maximum 2 refinement cycles per batch.

R.5  PM STAYS ALIVE

     After successful validation the Product Manager stays alive through
     Sprint Review.  Do NOT shut it down here — its scope-guard perspective
     is needed when evaluating sprint results (SR.2b).

     The Scrum Master also stays alive for Sprint Planning.

R.6  TRANSITION TO PLANNING GATE

     Count remaining backlog stories:
     BACKLOG_COUNT=$(jq '[.stories[] | select(.status != "done")] | length' prd-lifecycle/{slug}/backlog.json)

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=refinement_done product_backlog_count=$BACKLOG_COUNT

     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

     Template reference: See ~/.claude/skills/prd-lifecycle/templates/sprint-backlog.json
     for the sprint backlog format that will be created during Planning.

----------------------------------------------------------------------------
SPRINT PLANNING (Team: TL + SM only)
----------------------------------------------------------------------------

P.1  CALCULATE CAPACITY

     SM runs capacity calculation:

     SendMessage(type="message", recipient="scrum-master",
       content="CALCULATE CAPACITY: Run:
       bash ~/.claude/skills/prd-lifecycle/scripts/calculate-capacity.sh . {slug}

       This returns team capacity in story points for the upcoming sprint.
       Report the capacity value.",
       summary="Capacity calculation")

     Wait for SM's SendMessage response with capacity value.

P.2  PRESENT VELOCITY TREND

     SM analyzes velocity history:

     SendMessage(type="message", recipient="scrum-master",
       content="VELOCITY ANALYSIS: Read prd-lifecycle/{slug}/velocity.json and
       present the velocity trend for the last 3 sprints (if available).
       Calculate average velocity. Compare to current capacity.
       Recommend: Use lower of (capacity, avg velocity) for planning.",
       summary="Velocity trend analysis")

     Wait for SM's SendMessage response with velocity recommendation.

P.3  SELECT STORIES FOR SPRINT

     Team Lead + SM collaborate to select stories:

     SendMessage(type="message", recipient="scrum-master",
       content="STORY SELECTION: Read prd-lifecycle/{slug}/backlog.json.
       Select stories where status=\"refined\", ordered by priority field
       (ascending = higher priority), up to {capacity} story points.

       Include any spillover stories from the previous sprint (status=\"spillover\").
       Spillover stories take priority over new refined stories.

       List the selected story IDs and their total story points.",
       summary="Story selection for sprint")

     Wait for SM's SendMessage response with selected stories.

     Lead verifies the selection. If adjustments needed, send feedback to SM
     and repeat P.3. Maximum 2 selection cycles.

P.4  CREATE SPRINT BACKLOG

     After story selection is confirmed:

     SendMessage(type="message", recipient="scrum-master",
       content="CREATE SPRINT BACKLOG: Update backlog.json and create sprint
       backlog:

       1. In prd-lifecycle/{slug}/backlog.json, change status=\"refined\" to
          status=\"planned\" for all selected stories
       2. For spillover stories, change status=\"spillover\" to status=\"planned\"
       3. Create directory: mkdir -p prd-lifecycle/{slug}/sprints/sprint-{n}
       4. Write prd-lifecycle/{slug}/sprints/sprint-{n}/sprint-backlog.json
          using the template from ~/.claude/skills/prd-lifecycle/templates/sprint-backlog.json

       The sprint backlog must include:
       - sprint_number: {n}
       - stories: array of selected stories (copy from backlog.json)
       - Each story includes: id, title, epic_id, story_points, tasks, status

       Report when complete.",
       summary="Sprint backlog creation")

     Wait for SM's SendMessage response confirming sprint backlog creation.

P.5  TRANSITION TO SPRINT EXECUTION

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=sprint_planning_done

     NOTE: The current_sprint counter increments automatically via brain action
     on PLANNING_DONE event.

     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

     Template reference: See ~/.claude/skills/prd-lifecycle/templates/velocity.json
     for the velocity tracking format.

     NOTE: The brain enforces product_backlog_count > 0 for START_PLANNING
     via the hasRemainingStories guard. If the Lead were to send
     START_PLANNING with product_backlog_count=0, the brain would reject
     the event. In practice, T.4e prevents this by routing to START_RELEASE
     when $REMAINING equals 0. This guard provides a safety net.

----------------------------------------------------------------------------
SPRINT SETUP
----------------------------------------------------------------------------

S.1  INITIALIZE SPRINT DIRECTORY

     The sprint directory was already created during Planning (P.4), but we
     need to initialize the reports structure.

     Run: bash ~/.claude/skills/prd-lifecycle/scripts/init-sprint.sh {n} . {slug}

     The script is idempotent — it checks `test -f sprint-backlog.json` before
     creating. If sprint-backlog.json exists, it only creates missing report
     files.

     This ensures:
       prd-lifecycle/{slug}/sprints/sprint-{n}/
         sprint-backlog.json (already exists from Planning)
         reports/
           qa.md
           security.md
           performance.md
           code-review.md
           arch-review.md
           data-review.md
         review.md (to be created)
         retro.md (to be created)

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=sprint_build
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

S.2  LOAD PRIOR LEARNINGS

     Read prd-lifecycle/{slug}/learnings.md. This file contains accumulated ACE entries
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

     Use TaskCreate to create all tasks for this sprint. Read sprint-backlog.json
     to get the stories and their pre-defined tasks (tasks were created during
     Refinement).

     STORY-BASED TASK STRUCTURE:

     Tasks are organized per story, not per epic. A sprint may contain stories
     from multiple epics. Each story has its own implementation and review tasks.

     For each story in sprint-backlog.json:
       Task {story-id}-IMPL — "Implement {story title}" (includes story's tasks array)
       Task {story-id}-REVIEW — "Pair review of {story-id}" (blockedBy: {story-id}-IMPL)

     After all story-specific tasks, create verification tasks:
       Task QA — "QA verification" (blockedBy: all REVIEW tasks)
       Task SECURITY — "Security review" (blockedBy: all REVIEW tasks)
       Task PERFORMANCE — "Performance review" (blockedBy: all REVIEW tasks)
       Task CODE-REVIEW — "Code quality review" (blockedBy: all REVIEW tasks)
       Task ARCH-REVIEW — "Architecture review" (blockedBy: QA, SECURITY, PERFORMANCE, CODE-REVIEW)
       Task SPRINT-REVIEW — "Sprint review" (blockedBy: ARCH-REVIEW)

     For DATA-HEAVY stories (identified by epic's has_data_layer flag):
       Task DATA-{story-id} — "Implement data layer for {story-id}" (runs first)
       Task {story-id}-IMPL (blockedBy: DATA-{story-id})
       Task DATA-REVIEW — "Data model review" (blockedBy: all REVIEW tasks)
       Task ARCH-REVIEW (blockedBy: QA, SECURITY, PERFORMANCE, CODE-REVIEW, DATA-REVIEW)

     MULTI-EPIC AWARENESS:

     Stories in this sprint may come from different epics (check epic_id field
     in sprint-backlog.json). This affects context distribution — each developer
     needs docs for their assigned stories' epics.

----------------------------------------------------------------------------
SUB-PHASE A: BUILD (2-3 teammates)
----------------------------------------------------------------------------

A.1  SPAWN BUILD TEAMMATES

     For standard stories, spawn 2 developers:

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="dev-1",
          prompt="You are Developer 1 in a pair programming team. You implement
          features and review your partner's code. Read your role instructions
          from ~/.claude/skills/prd-lifecycle/preambles/fullstack-dev.md and prior
          learnings from prd-lifecycle/{slug}/learnings.md (if it exists) before
          starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="dev-2",
          prompt="You are Developer 2 in a pair programming team. You implement
          features and review your partner's code. Read your role instructions
          from ~/.claude/skills/prd-lifecycle/preambles/fullstack-dev.md and prior
          learnings from prd-lifecycle/{slug}/learnings.md (if it exists) before
          starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     For data-heavy stories, also spawn data-engineer:

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="data-engineer",
          prompt="You are the Data Engineer. Implement the data layer: schemas,
          migrations, seed data, and data access patterns. Read your role
          instructions from ~/.claude/skills/prd-lifecycle/preambles/data-engineer.md
          and prior learnings from prd-lifecycle/{slug}/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     CONDITIONAL BUILD SPECIALISTS (alongside devs, respecting 10-limit):

     If has_ai_ml AND stories in this sprint involve AI/ML features, spawn applied-ai-engineer
     alongside devs:
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="applied-ai-engineer",
          prompt="You are the Applied AI Engineer. Implement the ML pipeline
          components for stories in this sprint. Read your role instructions from
          ~/.claude/skills/prd-lifecycle/preambles/applied-ai-engineer.md and
          prior learnings from prd-lifecycle/{slug}/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     If has_frontend_ui AND stories in this sprint involve significant UI work, spawn
     ux-ui-designer alongside devs:
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="ux-ui-designer",
          prompt="You are the UX/UI Product Designer. Implement the UI
          components and ensure accessibility compliance. Read your role
          instructions from ~/.claude/skills/prd-lifecycle/preambles/ux-ui-designer.md
          and prior learnings from prd-lifecycle/{slug}/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     If has_analytics AND stories in this sprint involve analytics features, spawn
     data-scientist alongside devs:
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="data-scientist",
          prompt="You are the Data Scientist. Implement the analytics pipeline,
          event tracking, and metrics infrastructure. Read your role instructions
          from ~/.claude/skills/prd-lifecycle/preambles/data-scientist.md and
          prior learnings from prd-lifecycle/{slug}/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     If has_ai_ml AND stories in this sprint involve prompts/prompt chains, spawn
     prompt-engineer alongside devs:
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="prompt-engineer",
          prompt="You are the Prompt Engineer. Implement and optimize prompts,
          prompt chains, and LLM integration components. Read your role instructions
          from ~/.claude/skills/prd-lifecycle/preambles/prompt-engineer.md and
          prior learnings from prd-lifecycle/{slug}/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     NOTE: Multiple conditional specialists can be active simultaneously (max 10
     total teammates). If stories require multiple specialists (e.g., AI + UI +
     prompts), spawn all applicable ones alongside devs.

     When conditional specialists are present in BUILD:
     - dev-1 and dev-2 handle general implementation
     - Each specialist handles their domain-specific implementation
     - Pair review: devs review specialist code, specialists review
       domain-relevant dev code

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=sprint_build
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

A.2  DISTRIBUTE CONTEXT

     Send each build teammate context for the stories they will implement.

     MULTI-EPIC AWARENESS:

     Stories in this sprint may come from different epics. Each developer needs
     documentation for ALL epics that have stories assigned to them.

     For each developer, identify their assigned stories from sprint-backlog.json,
     extract the epic_id for each story, and send:
     - Architecture docs: prd-lifecycle/{slug}/arch/epic-{id}.md for each relevant epic
     - Data model docs: prd-lifecycle/{slug}/data/epic-{id}.md for each relevant epic
     - Functional specs: prd-lifecycle/{slug}/specs/epic-{id}.md for each relevant epic
     - The accumulated learnings: prd-lifecycle/{slug}/learnings.md
     - Their assigned IMPL task(s) with story details from sprint-backlog.json

     Example context message:

     SendMessage(type="message", recipient="dev-1",
       content="IMPLEMENTATION CONTEXT: You are assigned stories from epics E1, E3.
       Read the following documentation:
       - Architecture: prd-lifecycle/{slug}/arch/epic-1.md, prd-lifecycle/{slug}/arch/epic-3.md
       - Data models: prd-lifecycle/{slug}/data/epic-1.md, prd-lifecycle/{slug}/data/epic-3.md
       - Specs: prd-lifecycle/{slug}/specs/epic-1.md, prd-lifecycle/{slug}/specs/epic-3.md
       - Learnings: prd-lifecycle/{slug}/learnings.md

       Your assigned stories:
       - {story-1-id}: {title} (epic E1, {SP} points) — tasks: {task list}
       - {story-3-id}: {title} (epic E3, {SP} points) — tasks: {task list}

       Begin implementation. Report when each story is complete.",
       summary="Implementation assignment")

A.3  DATA-HEAVY SEQUENCE (if applicable)

     If any story in this sprint requires data layer work (check epic's has_data_layer
     flag or story's tasks include data-layer tasks):
     a) data-engineer implements DATA tasks first (schemas, migrations, seed data)
     b) data-engineer marks DATA task complete and reports files changed
     c) Lead unblocks IMPL tasks (TaskUpdate status)
     d) dev-1 and dev-2 begin IMPL tasks

A.4  IMPLEMENTATION

     Each developer implements their assigned stories:
     a) Developer reads the spec and architecture docs for their stories' epics
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

A.5b COLLECT BUILD RETRO INPUT (before shutdown)

     Before shutting down build teammates, collect their retrospective input.
     This ensures dev perspectives are captured for the sprint retro (T.2).

     Send to each build teammate (dev-1, dev-2, data-engineer if present,
     and any conditional specialists if present):

     SendMessage(type="message", recipient="{build-teammate}",
       content="SPRINT RETRO INPUT (pre-shutdown): Before you shut down,
       share your retrospective for this sprint:
       - What worked well during implementation?
       - What was harder than expected?
       - What should we do differently next sprint?
       Format: ## [strategy] {title}: {description}
       and/or: ## [pitfall] {title}: {description}",
       summary="Collect retro input before shutdown")

     Wait for all build teammates to respond via SendMessage.
     Store their retro inputs for use in T.2 (compile retro).

A.6  SHUTDOWN BUILD TEAMMATES

     Once all PAIR-REVIEW tasks are complete (all approved) and retro input
     collected (A.5b):
     SendMessage(type="shutdown_request", recipient="dev-1", content="Build phase complete.")
     SendMessage(type="shutdown_request", recipient="dev-2", content="Build phase complete.")
     If data-engineer was spawned:
     SendMessage(type="shutdown_request", recipient="data-engineer", content="Build phase complete.")
     If conditional specialists were spawned (applied-ai-engineer, ux-ui-designer,
     data-scientist, prompt-engineer):
     SendMessage(type="shutdown_request", recipient="{specialist}", content="Build phase complete.")
     Repeat for each active conditional specialist.

     Wait for shutdown confirmations (responses arrive as new conversation
     turns). Track which teammates have confirmed shutdown.

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=sprint_build_done
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

----------------------------------------------------------------------------
SUB-PHASE B: VERIFY + REVIEW (4+ teammates, parallel)
----------------------------------------------------------------------------

B.1  SPAWN REVIEW TEAMMATES

     Spawn 4 reviewers (5 if data-heavy stories):

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="qa-engineer",
          prompt="You are the QA Engineer. Run tests, write new tests for
          uncovered paths, verify build integrity, and run type checking.
          Read your role instructions from
          ~/.claude/skills/prd-lifecycle/preambles/qa-engineer.md and prior
          learnings from prd-lifecycle/{slug}/learnings.md (if it exists) before
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
          prior learnings from prd-lifecycle/{slug}/learnings.md (if it exists)
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
          and prior learnings from prd-lifecycle/{slug}/learnings.md (if it exists)
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
          learnings from prd-lifecycle/{slug}/learnings.md (if it exists) before
          starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     If data-heavy stories (any story in sprint requires data layer):
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="data-engineer",
          prompt="You are the Data Engineer reviewing the data layer. Verify
          schema correctness, migration safety (up and down), index coverage,
          constraint enforcement, and data integrity. Read your role instructions
          from ~/.claude/skills/prd-lifecycle/preambles/data-engineer.md and
          prior learnings from prd-lifecycle/{slug}/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=sprint_verify
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

     CONDITIONAL SPECIALIST REVIEWERS:

     Conditional specialists review AFTER the core 4 reviewers complete and
     are shut down (to respect max-10-concurrent). The lead runs them as a
     second verification wave if applicable to stories in this sprint.

     If has_ai_ml AND stories in this sprint have AI/ML components:
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="applied-ai-engineer",
          prompt="You are the Applied AI Engineer reviewing the ML components.
          Verify model integration, inference performance, fallback behavior,
          and responsible AI compliance. Read your role instructions from
          ~/.claude/skills/prd-lifecycle/preambles/applied-ai-engineer.md and
          prior learnings from prd-lifecycle/{slug}/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")
     → Writes to: prd-lifecycle/{slug}/sprints/sprint-{n}/reports/ai-review.md

     If has_analytics AND stories in this sprint have analytics components:
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="data-scientist",
          prompt="You are the Data Scientist reviewing analytics components.
          Verify event tracking, metrics accuracy, statistical validity,
          and data privacy compliance. Read your role instructions from
          ~/.claude/skills/prd-lifecycle/preambles/data-scientist.md and
          prior learnings from prd-lifecycle/{slug}/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")
     → Writes to: prd-lifecycle/{slug}/sprints/sprint-{n}/reports/analytics-review.md

     If has_frontend_ui AND stories in this sprint have UI components:
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="ux-ui-designer",
          prompt="You are the UX/UI Product Designer reviewing the interface.
          Verify design compliance, accessibility (WCAG 2.1 AA), responsive
          behavior, and UI state coverage. Read your role instructions from
          ~/.claude/skills/prd-lifecycle/preambles/ux-ui-designer.md and
          prior learnings from prd-lifecycle/{slug}/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")
     → Writes to: prd-lifecycle/{slug}/sprints/sprint-{n}/reports/ux-review.md

     If has_ai_ml AND stories in this sprint have prompt/LLM components:
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="prompt-engineer",
          prompt="You are the Prompt Engineer reviewing prompt design and LLM
          integration. Verify prompt quality, chain reliability, fallback
          behavior, and output validation. Read your role instructions from
          ~/.claude/skills/prd-lifecycle/preambles/prompt-engineer.md and
          prior learnings from prd-lifecycle/{slug}/learnings.md (if it exists)
          before starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")
     → Writes to: prd-lifecycle/{slug}/sprints/sprint-{n}/reports/prompt-review.md

     These conditional reviews follow the same finding severity protocol
     (CRITICAL/HIGH/MEDIUM/LOW) and the same fix cycle limits (max 3) as
     the core reviewers.

B.2  DISTRIBUTE REVIEW CONTEXT

     Send each reviewer context for ALL epics represented in this sprint.

     MULTI-EPIC AWARENESS:

     Stories in this sprint may come from different epics. Reviewers need
     documentation for ALL epics that have stories in this sprint so they can
     verify implementation against the correct architecture and specs.

     Identify all unique epic_ids from sprint-backlog.json. For each reviewer, send:
     - The list of all files changed in this sprint
     - Architecture docs for ALL epics in this sprint: prd-lifecycle/{slug}/arch/epic-{id}.md
     - Data model docs for ALL epics in this sprint: prd-lifecycle/{slug}/data/epic-{id}.md
     - Functional specs for ALL epics in this sprint: prd-lifecycle/{slug}/specs/epic-{id}.md
     - Their assigned review task
     - The report file they should write to:
       * qa-engineer → prd-lifecycle/{slug}/sprints/sprint-{n}/reports/qa.md
       * security-reviewer → prd-lifecycle/{slug}/sprints/sprint-{n}/reports/security.md
       * performance-reviewer → prd-lifecycle/{slug}/sprints/sprint-{n}/reports/performance.md
       * code-reviewer → prd-lifecycle/{slug}/sprints/sprint-{n}/reports/code-review.md
       * data-engineer → prd-lifecycle/{slug}/sprints/sprint-{n}/reports/data-review.md

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

        After each successful re-verification (or after all fix cycles for a finding):
        - If dev-fix was spawned (Cycle 2+), shut it down immediately:
          SendMessage(type="shutdown_request", recipient="dev-fix",
            content="Fix verified. Shutting down.")
          Wait for confirmation before proceeding to the next finding.

        - Maximum 3 fix-verify cycles per finding
        - If not resolved after 3 cycles: shut down dev-fix (if spawned),
          then escalate to user via AskUserQuestion

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

B.5b COLLECT REVIEWER RETRO INPUT (before shutdown)

     Before shutting down reviewers, collect their retrospective input.
     This ensures reviewer perspectives are captured for the sprint retro (T.2).

     Send to each reviewer (qa-engineer, security-reviewer, performance-reviewer,
     code-reviewer, data-engineer if present):

     SendMessage(type="message", recipient="{reviewer}",
       content="SPRINT RETRO INPUT (pre-shutdown): Before you shut down,
       share your retrospective for this sprint:
       - What code quality patterns did you observe (good or bad)?
       - Were the specs/architecture docs adequate for review?
       - What recurring issues should the team address?
       Format: ## [strategy] {title}: {description}
       and/or: ## [pitfall] {title}: {description}",
       summary="Collect retro input before shutdown")

     Wait for all reviewers to respond via SendMessage.
     Store their retro inputs for use in T.2 (compile retro).

     If conditional specialist reviewers were spawned, collect their retro
     input before shutting them down as well (same format).

B.6  SHUTDOWN REVIEW TEAMMATES (except any needed for arch review)

     Shutdown core reviewers:
     SendMessage(type="shutdown_request") to: qa-engineer, security-reviewer,
     performance-reviewer, code-reviewer, and data-engineer (if present).
     Wait for all shutdown confirmations.

     Shutdown conditional specialist reviewers (if spawned in this sprint):
     SendMessage(type="shutdown_request") to any of: applied-ai-engineer,
     data-scientist, ux-ui-designer, prompt-engineer that were spawned for
     the second verification wave. Wait for all shutdown confirmations.

     NEXT: Sub-Phase C — Architecture Review. Spawn the architect as a team
     agent via Task(team_name=...). See C.1.

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=sprint_verify_done
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
          learnings from prd-lifecycle/{slug}/learnings.md (if it exists) before
          starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=sprint_arch_review
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

C.2  ARCHITECTURE COMPLIANCE CHECK

     Send the architect context for ALL epics in this sprint:

     MULTI-EPIC AWARENESS:

     Stories in this sprint may come from different epics. The architect needs
     to verify implementation against architecture for ALL epics represented.

     Identify all unique epic_ids from sprint-backlog.json. Send to architect:
     - Architecture docs for ALL epics in this sprint: prd-lifecycle/{slug}/arch/epic-{id}.md
     - List of all files created/changed in this sprint
     - All review reports from Sub-Phase B

     "ARCHITECTURE REVIEW: Verify that the implementation matches the
     architecture documents for epics {epic-id-list}. Check: component
     boundaries respected, interfaces match spec, integration points correct,
     error handling strategy followed, no architectural drift. Write your
     report to: prd-lifecycle/{slug}/sprints/sprint-{n}/reports/arch-review.md"

C.3  HANDLE FINDINGS

     If architect finds CRITICAL architectural drift:
     - Re-spawn developer to fix
     - Maximum 3 fix cycles
     - If unresolvable: escalate to user

C.4  GATE: ARCHITECTURE REVIEW PASS

     arch-review.md verdict must be PASS or PASS_WITH_WARNINGS.

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=sprint_arch_done
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

----------------------------------------------------------------------------
SPRINT REVIEW (Team: TL + architect + SM + PM)
----------------------------------------------------------------------------

SR.1  GATHER ACTIVE TEAMMATES

     At this point, the architect, scrum-master, and product-manager should
     be active.  The lead conducts the sprint review with all three.

SR.2  PRESENT SUMMARY

     Send to architect, scrum-master, AND product-manager via SendMessage:

     SendMessage(type="message", recipient="architect",
       content="SPRINT REVIEW: Sprint {n} for stories from epics {epic-id-list} is complete.
       Summary of results:
       - QA: {verdict} ({N} findings)
       - Security: {verdict} ({N} findings)
       - Performance: {verdict} ({N} findings)
       - Code Quality: {verdict} ({N} findings)
       - Data Review: {verdict if applicable}
       - Architecture: {verdict}
       - Tests: {pass/fail count}
       - Build: {pass/fail}
       What is your overall confidence level? Any concerns for future sprints?
       RESPONSE FORMAT: Respond via SendMessage with your confidence assessment
       and any concerns inline in the message content.",
       summary="Sprint review — architecture confidence")

     SendMessage(type="message", recipient="scrum-master",
       content="SPRINT REVIEW: Sprint {n} complete. Planned: {PLANNED_SP} SP,
       Completed: {COMPLETED_SP} SP. Review verdicts: QA={verdict},
       Security={verdict}, Performance={verdict}, Code={verdict}, Arch={verdict}.
       From a process perspective: Was the sprint scope appropriate? Was velocity
       on track? Any process improvements for the next sprint?
       RESPONSE FORMAT: Respond via SendMessage with your process assessment.",
       summary="Sprint review — process assessment")

SR.2b PRODUCT MANAGER REVIEW

     SendMessage(type="message", recipient="product-manager",
       content="SPRINT REVIEW — PRODUCT ASSESSMENT: Sprint {n} complete for
       stories from epics {epic-id-list}.

       Review verdicts: QA={verdict}, Security={verdict}, Performance={verdict},
       Code={verdict}, Arch={verdict}.
       Planned: {PLANNED_SP} SP, Completed: {COMPLETED_SP} SP.

       Evaluate from a product perspective:
       1. Did this sprint deliver user value toward the success metrics in the PRD?
       2. Was scope maintained or did it creep beyond what was refined?
       3. Are the measurable success criteria met or on track?
       4. Are there stories that technically passed but missed the product intent?

       Write your Product Review report to:
       prd-lifecycle/{slug}/sprints/sprint-{n}/reports/product-review.md

       Use the format from your preamble (Status, Value Delivery, Scope
       Assessment, Success Criteria, Findings, Verdict).

       RESPONSE FORMAT: Respond via SendMessage with your verdict summary
       (APPROVE / REQUEST_CHANGES) and key findings.",
       summary="Sprint review — product assessment")

     Wait for ALL THREE teammates (architect, scrum-master, product-manager)
     to respond via SendMessage before proceeding.

SR.3  GO / NO-GO DECISION

     Based on all reports, architect confidence, SM process assessment,
     and PM product verdict, the lead makes a decision:

     GO — All gates passed, no unresolved CRITICAL/HIGH findings.
     NO-GO — Unresolved issues remain. Create targeted fix tasks and re-run
     only the affected sub-phases (do not restart the entire sprint).

SR.4  WRITE SPRINT REVIEW

     Write to prd-lifecycle/{slug}/sprints/sprint-{n}/review.md:
     - Date, stories covered (with epic references), decision (GO/NO-GO)
     - Summary of each review area
     - Key findings and resolutions
     - Deferred items (if any)
     - Architect confidence assessment
     - SM process assessment and velocity observations
     - PM product verdict (value delivery, scope assessment, success criteria)

     Verify that product-review.md was written by the PM:
     test -f prd-lifecycle/{slug}/sprints/sprint-{n}/reports/product-review.md

SR.5  COLLECT PM RETRO INPUT & SHUTDOWN

     Before shutting down the PM, collect retro input:

     SendMessage(type="message", recipient="product-manager",
       content="SPRINT RETRO INPUT (pre-shutdown): Before you shut down,
       share your retrospective for this sprint from a product perspective:
       - Did the refined stories accurately reflect the PRD intent?
       - Were acceptance criteria clear enough for implementation?
       - What scope risks should the team watch for next sprint?
       Format: ## [strategy] {title}: {description}
       and/or: ## [pitfall] {title}: {description}",
       summary="Collect PM retro input before shutdown")

     Wait for PM's SendMessage response.  Store for use in T.2.

     Then shut down:
     SendMessage(type="shutdown_request", recipient="product-manager",
       content="Sprint Review complete. Thank you for your product assessment.")

     Wait for shutdown confirmation (response arrives as a new conversation turn).

     NOTE: PM will be re-spawned at R.2 if the lifecycle loops back to
     Refinement for the next cycle.

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=sprint_review_done
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

----------------------------------------------------------------------------
SPRINT RETROSPECTIVE
----------------------------------------------------------------------------

T.1  ASK REMAINING TEAMMATES FOR RETROSPECTIVE INPUT

     At this point, architect and scrum-master should be active.  The PM
     was shut down after Sprint Review (SR.5) — its retro input is
     collected in SR.5b below.  Devs and reviewers already provided retro
     input before shutdown (A.5b and B.5b).

     Send to architect and scrum-master:

     SendMessage(type="message", recipient="architect",
       content="SPRINT RETROSPECTIVE: What worked well in this sprint?
       What didn't? What should we do differently next sprint?
       Format: ## [strategy] {title}: {description}
       and/or: ## [pitfall] {title}: {description}",
       summary="Retro input from architect")

     SendMessage(type="message", recipient="scrum-master",
       content="SPRINT RETROSPECTIVE: From a process perspective, what worked
       well? What didn't? How was estimation accuracy? Sprint planning quality?
       Format: ## [strategy] {title}: {description}
       and/or: ## [pitfall] {title}: {description}",
       summary="Retro input from scrum-master")

     Wait for both to respond via SendMessage. Send follow-up after 5 minutes
     if missing.

T.2  COMPILE RETRO (all sources)

     Combine retro inputs from ALL sources:
     - Build teammates (collected in A.5b before their shutdown)
     - Reviewers (collected in B.5b before their shutdown)
     - Product Manager (collected in SR.5 before shutdown)
     - Architect (collected in T.1)
     - Scrum Master (collected in T.1)

     Write all entries to prd-lifecycle/{slug}/sprints/sprint-{n}/retro.md using the
     format the collect-learnings.sh script expects:
     ## [strategy] {title}: {description}
     ## [pitfall] {title}: {description}

T.3  AGGREGATE LEARNINGS

     Run: bash ~/.claude/skills/prd-lifecycle/scripts/collect-learnings.sh . {slug}

     This updates prd-lifecycle/{slug}/learnings.md with entries from all sprint retros.

     After collect-learnings.sh completes, if learnings.md exceeds 150 lines,
     spawn a compaction agent:

     Task(subagent_type="general-purpose", model="sonnet",
       prompt="Compact prd-lifecycle/{slug}/learnings.md:
       1. Read learnings.md and both ACE playbooks (for cross-reference)
       2. Remove duplicate entries (same lesson, different wording)
       3. Merge related entries into consolidated entries grouped by theme
       4. Cap the result at 150 lines maximum
       5. Group by theme (e.g., Architecture, Testing, Performance), not by sprint
       6. Preserve entries with helpful >= 3 verbatim
       7. Write the compacted result back to learnings.md")

T.4  RETRO-TRANSITION: 6-STEP PROTOCOL FOR NEXT PHASE ROUTING

     This is a complex transition with multiple decision points. Follow all
     6 steps in sequence.

T.4a DETERMINE SPRINT COMPLETENESS

     Lead performs 4-step protocol to classify sprint results:

     1. Read prd-lifecycle/{slug}/sprints/sprint-{n}/sprint-backlog.json
     2. For each story, check if ALL tasks are done:
        - If ALL tasks done → change story status to "done" in backlog.json
        - If NOT all done → change story status to "spillover" in backlog.json
          and record remaining_points (story_points - completed_points)
     3. Compute sprint metrics:
        PLANNED_SP = sum of all story_points in sprint-backlog.json
        COMPLETED_SP = sum of story_points for stories where ALL tasks done
     4. Update prd-lifecycle/{slug}/backlog.json with final statuses

T.4b CHECK EPIC COMPLETION

     Lead runs epic status check:
     bash ~/.claude/skills/prd-lifecycle/scripts/check-epic-status.sh . {slug}

     This script outputs epic IDs that are 100% done (all stories in status="done").
     Lead updates prd-lifecycle/{slug}/epics.json: for each completed epic, set
     status="completed" externally (not via brain — brain doesn't track epics).

T.4c BRAIN TRANSITION (NO PAYLOAD)

     Transition the brain state WITHOUT payload:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=sprint_retro_done

     The brain transitions to retro_done state. This enables 3-way routing:
     START_REFINEMENT, START_PLANNING, or START_RELEASE.

T.4d RECORD VELOCITY

     Lead records sprint velocity:
     bash ~/.claude/skills/prd-lifecycle/scripts/record-velocity.sh . {slug} {sprint} {PLANNED_SP} {COMPLETED_SP}

     Template reference: See ~/.claude/skills/prd-lifecycle/templates/velocity.json
     for the velocity tracking format.

T.4e DECIDE NEXT PHASE (scripts advise, Lead decides, brain validates)

     Lead uses scripts for advisory input but makes the final decision:

     REMAINING=$(jq '[.stories[] | select(.status != "done")] | length' prd-lifecycle/{slug}/backlog.json)

     if [ "$REMAINING" -eq 0 ]; then
       # All stories done → release
       bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=release_started product_backlog_count=0
     else
       # Stories remain → check if refinement needed
       CAPACITY=$(bash ~/.claude/skills/prd-lifecycle/scripts/calculate-capacity.sh . {slug} | cut -d= -f2)
       RESULT=$(bash ~/.claude/skills/prd-lifecycle/scripts/check-refinement.sh . {slug} $CAPACITY)
       REC=$(echo "$RESULT" | cut -d'|' -f1)

       if [[ "$REC" == refinement_needed* ]]; then
         bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=start_refinement product_backlog_count=$REMAINING
       else
         bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=start_planning product_backlog_count=$REMAINING
       fi
     fi

     LEAD CAN OVERRIDE: Scripts provide advisory recommendations. If
     check-refinement.sh says "ready for planning" but Lead knows stories need
     decomposition or re-estimation, send START_REFINEMENT anyway. Lead has
     final authority.

T.4f FOLLOW BRAIN OUTPUT PROTOCOL

     After the brain transition in T.4e, read the brain output:
     - LOAD: file path to read (if any)
     - RESUME AT: section to jump to

     Follow the protocol exactly: load the file, jump to the resume section.

T.5  TEAMMATE LIFECYCLE: SHUTDOWN SPRINT TEAMMATES

     Before git commit, manage teammate lifecycle:

     Shutdown architect:
     SendMessage(type="shutdown_request", recipient="architect", content="Sprint complete.")
     Wait for shutdown confirmation.

     The Product Manager should already be shut down (after Sprint Review step SR.5).

     SM LIFECYCLE — depends on next phase (determined in T.4e):
     - If routing to REFINEMENT or PLANNING: SM stays alive (long-lived across cycles).
     - If routing to RELEASE (product_backlog_count=0): shut down SM now.
       SendMessage(type="shutdown_request", recipient="scrum-master",
         content="All sprints complete. Release phase begins. Thank you for your service.")
       Wait for shutdown confirmation.

T.6  GIT COMMIT SPRINT WORK

     After all teammates are shut down, commit ALL changes from this sprint.
     This creates an atomic rollback point for the sprint's work.

     Commit format depends on epic coverage:

     MONO-EPIC SPRINT (all stories from one epic):
     git add -A && git commit -m "feat(sprint-{n}): implement epic E{id} — {epic title}"

     MULTI-EPIC SPRINT (stories from multiple epics):
     git add -A && git commit -m "feat(sprint-{n}): implement stories {S-IDs} from epics {E-IDs}"

     Example multi-epic:
     git add -A && git commit -m "feat(sprint-3): implement stories S-5,S-7,S-9 from epics E1,E3"

     Where:
     - {n} is the current sprint number
     - {S-IDs} is a comma-separated list of story IDs completed in this sprint
     - {E-IDs} is a comma-separated list of epic IDs that had stories in this sprint
     - {epic title} is the epic's title from epics.json (for mono-epic sprints)

     NOTE: Use git add -A to capture all changes (code, reports, retro, state).
     If the commit fails (e.g., no changes), log and continue — do not block.

----------------------------------------------------------------------------
CONTINUOUS CYCLE
----------------------------------------------------------------------------

Follow the brain output from T.4f. The brain handles routing based on
product_backlog_count and available refined stories.

Possible routes:
- REFINEMENT (R.1): If stories need decomposition/estimation
- PLANNING (P.1): If enough refined stories are ready
- RELEASE (Phase 3): If all stories are done

CRITICAL: Do NOT pause here to ask the user if they want to continue.
Do NOT present sprint results and wait. The lifecycle is a continuous
process — immediately proceed to the next cycle or to Phase 3.
The user will see the final report at F.5 when everything is done.
