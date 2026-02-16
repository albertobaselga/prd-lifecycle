# Phase 1: Specification

## Teammate Lifecycle

| Role | Lifecycle | Spawn Point | Shutdown Point |
|------|-----------|-------------|----------------|
| Core 6 (architect, data-engineer, qa-engineer, security-reviewer, tech-writer, product-manager) | Full Phase 1 | Phase 1 entry | Step 3.6 |
| Conditional (applied-ai-engineer, data-scientist, ux-ui-designer, prompt-engineer) | Full Phase 1 | Phase 1 entry (if domain flags set) | Step 3.6 |

Execute 3 ceremonies in order: Epic Decomposition → Story Refinement → Architecture/Data/Spec Validation.
Each ceremony follows: propose → challenge → consensus → persist → audit.

For EACH ceremony, the Lead:
1. Dispatches prompts to specialists (deterministic — exact prompts below)
2. Waits for all responses via SendMessage
3. Synthesizes feedback and resolves conflicts (Lead decision)
4. Iterates until consensus (max 3 rounds, then Lead binding decision)
5. Persists gate artifact and runs coverage audit
6. Transitions brain: `bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=<event>`

Spawn the core 6 specialist teammates plus any conditional specialists.
Each teammate receives a role-specific preamble loaded from
~/.claude/skills/prd-lifecycle/preambles/{role}.md (if the file exists;
if it does not exist, provide a brief role description inline).

SPAWN CORE 6 TEAMMATES:

  Task(subagent_type="general-purpose", model="opus",
       team_name="prd-{slug}", name="architect",
       prompt="You are the Architect. Read your full role instructions from
       ~/.claude/skills/prd-lifecycle/preambles/architect.md before doing
       anything else.
       RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
       SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
       summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
       the lead.")

  Task(subagent_type="general-purpose", model="opus",
       team_name="prd-{slug}", name="data-engineer",
       prompt="You are the Data Engineer. Read your full role instructions from
       ~/.claude/skills/prd-lifecycle/preambles/data-engineer.md before doing
       anything else.
       RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
       SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
       summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
       the lead.")

  Task(subagent_type="general-purpose", model="opus",
       team_name="prd-{slug}", name="qa-engineer",
       prompt="You are the QA Engineer. Read your full role instructions from
       ~/.claude/skills/prd-lifecycle/preambles/qa-engineer.md before doing
       anything else.
       RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
       SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
       summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
       the lead.")

  Task(subagent_type="general-purpose", model="opus",
       team_name="prd-{slug}", name="security-reviewer",
       prompt="You are the Security Reviewer. Read your full role instructions
       from ~/.claude/skills/prd-lifecycle/preambles/security-reviewer.md
       before doing anything else.
       RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
       SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
       summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
       the lead.")

  Task(subagent_type="general-purpose", model="opus",
       team_name="prd-{slug}", name="tech-writer",
       prompt="You are the Tech Writer. Read your full role instructions from
       ~/.claude/skills/prd-lifecycle/preambles/tech-writer.md before doing
       anything else.
       RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
       SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
       summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
       the lead.")

  Task(subagent_type="general-purpose", model="opus",
       team_name="prd-{slug}", name="product-manager",
       prompt="You are the Product Manager. You are the voice of the PRD in
       Phase 1 — your job is to ensure no PRD requirement is lost during
       decomposition. Read your full role instructions from
       ~/.claude/skills/prd-lifecycle/preambles/product-manager.md before
       doing anything else.
       RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
       SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
       summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
       the lead.")

Wait for all core teammates to confirm they are ready. Teammate responses
arrive as new conversation turns via SendMessage. Track which teammates
have responded. If a teammate hasn't responded after 3 minutes, send a
follow-up message. Continue only when all core teammates have confirmed.

SPAWN CONDITIONAL SPECIALISTS (Phase 1):

If any domain flags were set in Step 0.6, spawn conditional specialists
ALONGSIDE the core 6 (no rotation needed — max 10 concurrent allows it).
All conditional specialists participate in ALL 3 Ceremonies.

Spawn conditional specialists with their preamble from
~/.claude/skills/prd-lifecycle/preambles/{role}.md:

  If has_ai_ml:
  Task(subagent_type="general-purpose", model="opus",
       team_name="prd-{slug}", name="applied-ai-engineer",
       prompt="You are the Applied AI Engineer. Read your full role instructions
       from ~/.claude/skills/prd-lifecycle/preambles/applied-ai-engineer.md
       before doing anything else.
       RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
       SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
       summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
       the lead.")

  If has_ai_ml:
  Task(subagent_type="general-purpose", model="opus",
       team_name="prd-{slug}", name="prompt-engineer",
       prompt="You are the Prompt Engineer. Read your full role instructions
       from ~/.claude/skills/prd-lifecycle/preambles/prompt-engineer.md
       before doing anything else.
       RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
       SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
       summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
       the lead.")

  If has_analytics:
  Task(subagent_type="general-purpose", model="opus",
       team_name="prd-{slug}", name="data-scientist",
       prompt="You are the Data Scientist & Analyst. Read your full role
       instructions from ~/.claude/skills/prd-lifecycle/preambles/data-scientist.md
       before doing anything else.
       RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
       SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
       summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
       the lead.")

  If has_frontend_ui:
  Task(subagent_type="general-purpose", model="opus",
       team_name="prd-{slug}", name="ux-ui-designer",
       prompt="You are the UX/UI Product Designer & Design Strategist. Read
       your full role instructions from
       ~/.claude/skills/prd-lifecycle/preambles/ux-ui-designer.md before doing
       anything else.
       RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
       SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
       summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
       the lead.")

Wait for all conditional specialists to confirm readiness.

TRANSITION:
bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=phase1_spawned
Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

----------------------------------------------------------------------------
CEREMONY 1: EPIC DECOMPOSITION
----------------------------------------------------------------------------

Goal: Decompose the raw PRD into 3-5 value-based epics (max 7 with written
justification per Rule 13a). Each epic is an independent unit of value that
maps to explicit PRD sections. NO stories are extracted yet — that happens
in Ceremony 2.

1.1  REQUEST EPIC PROPOSALS

     Send the raw PRD text to architect and data-engineer separately:

     SendMessage(type="message", recipient="architect",
       content="EPIC DECOMPOSITION: Based on this PRD, propose an epic grouping.
       Decompose the PRD into the MINIMUM number of epics needed. Target 3-5
       epics. You may propose up to 7 ONLY if you provide written justification
       for why each epic beyond 5 cannot be merged into another.
       For each epic provide: epic ID (E1, E2...), title, rationale for why this
       epic MUST be separate (not just convenient), prd_sections (list of PRD
       section headings or paragraph references this epic covers), estimated
       complexity (S/M/L/XL), dependencies on other epics, and whether it is
       data-heavy (requires schema changes, migrations, or significant data work).
       DO NOT extract user stories yet — that happens in Ceremony 2.
       SIMPLICITY CHECK: Before finalizing, verify — could any two epics be merged
       without losing clarity? If yes, merge them.
       RAW PRD: {raw PRD text from prd.json}
       RESPONSE FORMAT: Respond via SendMessage with your proposed epic grouping
       inline in the message content. Do NOT write to a file yet.",
       summary="Propose epic grouping from PRD")

     Send the same to data-engineer with domain-specific framing (focus on
     data boundaries, schema separation, migration independence).

     Wait for both architect and data-engineer to respond via SendMessage.
     Do NOT proceed based on idle status. Send follow-up after 5 minutes
     if either hasn't responded.

1.2  CHALLENGE ROUND

     Send the architect+data-engineer proposals to all other teammates:

     SendMessage to qa-engineer, security-reviewer, tech-writer (and any
     conditional specialists):
     "EPIC REVIEW: The architect and data engineer propose these epic groupings.
     Challenge from your perspective: Are the boundaries correct? Does each epic
     map to clear PRD sections? Are there missing cross-cutting concerns? Would
     you reorder priorities? Does the dependency chain make sense?
     Architect proposal: {proposal}
     Data Engineer proposal: {proposal}
     RESPONSE FORMAT: Respond via SendMessage with your challenges and
     suggestions inline in the message content."

     SendMessage to product-manager:
     "EPIC REVIEW — PRODUCT PERSPECTIVE: Review these epic proposals as the
     PRD authority. Challenge: Does each epic deliver clear user value? Are
     boundaries aligned with user journeys? Would a user recognize these epics
     as meaningful product increments? Are there PRD features that don't fit
     neatly in any proposed epic?
     Architect proposal: {proposal}
     Data Engineer proposal: {proposal}
     RESPONSE FORMAT: Respond via SendMessage with your challenges and
     suggestions inline in the message content."

     Wait for all 4 teammates to respond via SendMessage. Do NOT proceed
     based on idle status — they may be analyzing the proposals. Track which
     teammates have responded. Send follow-up after 5 minutes if missing.

1.3  REVISE BASED ON CHALLENGES

     Send challenge feedback to architect + data-engineer via SendMessage:
     "EPIC REVISION: Here is feedback from the team on your epic proposals.
     Please collaborate on a SINGLE revised grouping and respond with it.
     Feedback: {challenges}
     RESPONSE FORMAT: Respond via SendMessage with the revised epic grouping
     inline in the message content."

     Wait for both to respond via SendMessage with their revised proposal.

1.4  ITERATE UNTIL CONSENSUS

     Send revised proposal to all teammates for final approval via SendMessage.
     Wait for all responses via SendMessage before evaluating consensus.
     Maximum 3 iterations. Lead makes binding decisions on remaining disputes
     after 3 rounds.

1.5  GATE: PERSIST EPICS

     Write to prd-lifecycle/{slug}/epics.json:

     {
       "epics": [
         {
           "id": "E1",
           "title": "...",
           "rationale": "...",
           "prd_sections": ["Section 2.1: User Authentication", "Section 2.3: Session Management"],
           "complexity": "M",
           "data_heavy": false,
           "depends_on": [],
           "status": "pending"
         }
       ],
       "execution_order": ["E1", "E3", "E2", "E4"]
     }

     NOTE: No "stories" field in epics yet — stories are extracted in Ceremony 2.

1.5b PRD COVERAGE AUDIT (mandatory — PM deliverable)

     After epics are persisted, the PM verifies that the PRD is fully covered:

     SendMessage(type="message", recipient="product-manager",
       content="PRD COVERAGE AUDIT: Read the raw PRD from prd-lifecycle/{slug}/prd.json
       (the 'raw' field). Read the persisted epics from prd-lifecycle/{slug}/epics.json.

       For EACH identifiable requirement, feature, or user need in the PRD:
       1. Identify which epic(s) cover it (via prd_sections or semantic match)
       2. Mark as COVERED or UNCOVERED

       Write your audit to prd-lifecycle/{slug}/reports/prd-coverage-audit.md with:

       ## PRD Coverage Audit — Post Epic Decomposition
       | # | PRD Requirement / Feature | Covering Epic(s) | Status |
       |---|---------------------------|-------------------|--------|
       | 1 | User authentication       | E1                | COVERED |
       | 2 | Real-time notifications    | —                 | UNCOVERED |

       SUMMARY: X/Y requirements covered. Z UNCOVERED.

       If ANY requirement is UNCOVERED, list recommended actions:
       - Assign to existing epic (which one and why)
       - Create new epic (with justification)
       - Defer as POST-MVP (with user impact assessment)

       RESPONSE FORMAT: Write the audit file, then respond via SendMessage
       confirming the audit results.",
       summary="Audit PRD coverage against epics")

     Wait for PM's response. If UNCOVERED requirements exist:
     a) Discuss with architect whether to expand an existing epic or create a new one
     b) If creating a new epic would exceed 7: escalate to user via AskUserQuestion
     c) Update epics.json with any changes
     d) Ask PM to re-run the audit to confirm all covered

     Only proceed to TRANSITION when PM confirms full coverage (or Lead explicitly
     defers specific requirements as POST-MVP with documented rationale).

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=ceremony1_complete
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

     Announce: "Epic Decomposition complete. {N} epics defined. Execution order:
     {order}. PRD coverage audit: all requirements mapped."

----------------------------------------------------------------------------
CEREMONY 2: STORY REFINEMENT (per epic)
----------------------------------------------------------------------------

Goal: For each epic, extract user stories that deliver the epic's value.
Every story must belong to exactly one epic and trace to explicit PRD
requirements via its epic's prd_sections.

2.1  EXTRACT STORIES PER EPIC

     For each epic in epics.json (following execution_order):

     Parse the PRD sections referenced by this epic (see epic.prd_sections)
     to identify user stories. Stories may be formatted as:
     - "As a {role}, I want {feature}, so that {benefit}"
     - Numbered requirements
     - Feature descriptions
     - JSON story objects

     Create a structured list of stories with: ID, title, description,
     acceptance criteria (if present), priority (if stated), and epic_id.

2.2  DISTRIBUTE STORIES TO ALL TEAMMATES

     Send the stories grouped by epic to all teammates (core + conditional):

     SendMessage(type="message", recipient="architect",
       content="STORY REFINEMENT: Please review these user stories grouped by
       epic. For each story, provide: (1) feasibility assessment, (2) missing
       technical details, (3) suggested acceptance criteria additions,
       (4) dependency flags, (5) T-shirt sizing estimate (XS/S/M/L/XL).
       Verify each story belongs in its assigned epic.
       NOTE: T-shirt sizing is initial by Phase 1 specialists. Executors
       (devs, architect) adjust estimates during Refinement.
       Stories by epic: {stories grouped by epic_id}
       RESPONSE FORMAT: Respond via SendMessage with your feedback inline
       in the message content. Do NOT write to a file.",
       summary="Review stories per epic from architecture perspective")

     Repeat for: data-engineer, qa-engineer, security-reviewer, tech-writer,
     product-manager (and any conditional specialists) — each with their
     domain-specific review prompt. PM's review prompt focuses on product
     perspective: does each story solve a real user problem? Are acceptance
     criteria measurable and verifiable?

2.3  COLLECT FEEDBACK

     Wait for all teammates to respond. Teammate responses arrive as new
     conversation turns via SendMessage. Process each response as it arrives.
     Track which teammates have responded. If a teammate hasn't responded
     after 5 minutes, send a follow-up message. Continue only when all
     expected responses have been received.

2.4  SYNTHESIZE AND RESOLVE CONFLICTS

     Review all feedback. Identify:
     a) Unanimous additions — apply directly
     b) Non-conflicting suggestions — apply directly
     c) Conflicts between domains — resolve by:
        - Data vs. Architecture conflicts: discuss with both, prefer the
          approach that satisfies both constraints
        - Security vs. Feature scope: security requirements are non-negotiable;
          scope adjustments go to user via AskUserQuestion
        - QA vs. Timeline: if QA identifies untestable criteria, rewrite the
          criteria rather than removing them

     If a conflict cannot be resolved between teammates, use AskUserQuestion to
     ask the user for a decision.

2.4b SIMPLIFICATION PASS (mandatory — per Rule 13b)

     Before sending revised stories for validation, compare against the
     original PRD text:

     a) For each story: is every acceptance criterion traceable to an
        explicit PRD requirement? Remove or tag as POST-MVP any that aren't.
     b) For each story: does it have a valid epic_id matching an epic in
        epics.json? Stories without a valid epic_id are DISCARDED.
     c) Count stories now vs. stories initially extracted from the PRD.
        If growth ratio > 1.3x, flag to the team: "Story count grew from
        {original} to {current} ({ratio}x). Justify each addition or cut."
     d) Check for "infrastructure stories" added by specialists (e.g.,
        "set up monitoring", "add logging framework", "create abstraction
        layer") — these are POST-MVP unless the PRD explicitly requires them.
     e) Remove duplicate or near-duplicate stories that emerged from
        multiple specialists suggesting similar things independently.

2.5  SEND REVISED STORIES FOR VALIDATION

     Send the revised story list (grouped by epic) back to all teammates:

     SendMessage(type="message", recipient="{each teammate}",
       content="REFINEMENT VALIDATION: Here are the revised stories grouped by
       epic after incorporating all feedback. Please confirm you approve these
       from your domain perspective, or flag any remaining concerns.
       Stories by epic: {revised list grouped by epic_id}
       RESPONSE FORMAT: Respond via SendMessage with either APPROVE or your
       remaining concerns inline in the message content.",
       summary="Validate revised stories per epic")

     Wait for all teammates to respond via SendMessage with their validation.
     Do NOT proceed based on idle status. Track which teammates have responded.
     Send follow-up after 5 minutes if missing.

2.6  ITERATE UNTIL CONSENSUS

     If any teammate flags remaining concerns:
     a) Address the concern
     b) Re-send for validation
     c) Maximum 3 refinement iterations
     d) If consensus is not reached after 3 iterations, the lead makes binding
        decisions on remaining disputes and documents the rationale

2.7  GATE: PERSIST REFINED STORIES

     Once all teammates approve (or lead has made binding decisions):
     - Update prd-lifecycle/{slug}/prd.json: set the "stories" array to the refined list
     - Each story must have: id, title, description, acceptance_criteria (array),
       priority, epic_id, domain_notes (object with keys: arch, data, qa, security, spec)

     Announce: "Story Refinement complete. {N} stories across {M} epics refined
     and approved by all specialists."

2.7b STORY COVERAGE AUDIT (mandatory — PM deliverable)

     After stories are persisted, the PM verifies story completeness:

     SendMessage(type="message", recipient="product-manager",
       content="STORY COVERAGE AUDIT: Read prd-lifecycle/{slug}/epics.json and
       prd-lifecycle/{slug}/prd.json (the 'stories' array).

       Verify TWO things:

       1. EPIC COVERAGE: Every epic has at least one story with matching epic_id.
       2. REQUIREMENT COVERAGE: Cross-reference your PRD Coverage Audit from
          prd-lifecycle/{slug}/reports/prd-coverage-audit.md. For each PRD
          requirement marked COVERED, verify that at least one story in the
          covering epic addresses it.

       Write your audit to prd-lifecycle/{slug}/reports/story-coverage-audit.md with:

       ## Story Coverage Audit — Post Refinement
       | Epic | Title | Stories | PRD Reqs Covered | Gaps |
       |------|-------|---------|------------------|------|
       | E1   | Auth  | 3       | 2/2              | —    |
       | E2   | API   | 4       | 3/4              | Real-time notifications |

       If ANY gap: recommend adding a story, moving from another epic, or
       deferring with impact assessment.

       RESPONSE FORMAT: Write the audit file, then respond via SendMessage
       confirming the audit results.",
       summary="Audit story coverage against epics and PRD")

     Wait for PM's response. If gaps exist:
     a) Extract missing stories (re-run 2.1 for the affected epic only)
     b) Run through abbreviated specialist review (2.2-2.6 for new stories only)
     c) Ask PM to re-confirm coverage

     Only proceed to TRANSITION when PM confirms full coverage.

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=ceremony2_complete
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

----------------------------------------------------------------------------
CEREMONY 3: ARCHITECTURE + DATA MODEL + SPEC VALIDATION
----------------------------------------------------------------------------

Goal: Produce per-epic architecture docs, data model docs, and functional specs,
each validated by all specialists.

3.1  PARALLEL AUTHORING (3+ tracks simultaneously)

     Send instructions to 3 teammates in parallel:

     a) architect:
        "ARCHITECTURE DOCS: For each epic, write an architecture document
        covering: file/module structure, component interfaces, integration
        points with other epics, technology choices, error handling strategy,
        and scaling considerations. Write each to: prd-lifecycle/{slug}/arch/epic-{id}.md
        Epics: {epics from epics.json}
        Stories per epic: {stories from prd.json filtered by epic_id}"

     b) data-engineer:
        "DATA MODEL DOCS: For each epic, write a data model document covering:
        schema definitions (tables/collections with columns/fields and types),
        entity relationship descriptions, migration plan (up and down),
        index strategy, constraints and validation rules, and seed data needs.
        Write each to: prd-lifecycle/{slug}/data/epic-{id}.md
        Epics: {epics from epics.json}
        Stories per epic: {stories from prd.json filtered by epic_id}"

     c) tech-writer:
        "FUNCTIONAL SPECS: For each epic, write a functional specification
        covering: API contracts (endpoints, request/response schemas, status
        codes), user flows (step-by-step interactions), error scenarios
        (what can go wrong and how the system responds), and integration
        touchpoints with other epics. Write each to: prd-lifecycle/{slug}/specs/epic-{id}.md
        Epics: {epics from epics.json}
        Stories per epic: {stories from prd.json filtered by epic_id}"

     d) conditional specialists (in parallel with a-c):

     If has_ai_ml, send to applied-ai-engineer:
        "ML ARCHITECTURE DOCS: For each epic with ML/AI components, write an ML
        architecture supplement covering: model selection rationale, training/inference
        pipeline, versioning strategy, monitoring approach, and responsible AI
        considerations. Write each to: prd-lifecycle/{slug}/arch/epic-{id}-ml.md
        Epics: {epics from epics.json}
        Stories per epic: {stories from prd.json filtered by epic_id}"

     If has_analytics, send to data-scientist:
        "ANALYTICS ARCHITECTURE DOCS: For each epic with analytics components, write
        an analytics supplement covering: metrics taxonomy, event schema, analytics
        pipeline, experimentation framework, and privacy considerations.
        Write each to: prd-lifecycle/{slug}/arch/epic-{id}-analytics.md
        Epics: {epics from epics.json}
        Stories per epic: {stories from prd.json filtered by epic_id}"

     If has_frontend_ui, send to ux-ui-designer:
        "UX ARCHITECTURE DOCS: For each epic with frontend/UI components, write a UX
        supplement covering: information architecture, interaction patterns, component
        inventory, responsive strategy, and accessibility plan.
        Write each to: prd-lifecycle/{slug}/arch/epic-{id}-ux.md
        Epics: {epics from epics.json}
        Stories per epic: {stories from prd.json filtered by epic_id}"

     Wait for all teammates to complete their documents (core 3 + any conditional).
     Responses arrive as new conversation turns via SendMessage. Track which
     teammates have responded. If a teammate hasn't responded after 5 minutes,
     send a follow-up message. Continue only when all expected responses have
     been received.

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=ceremony3_authored
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

3.2  ARCHITECTURE REVIEW (all teammates participate)

     Send all architecture docs to all teammates:
     "ARCHITECTURE REVIEW: Review the architecture documents for all epics.
     Evaluate: completeness, consistency across epics, feasibility, security
     implications, data access patterns, testability, and documentation clarity.
     Provide specific feedback with file references. Docs: {list arch files}
     RESPONSE FORMAT: Respond via SendMessage with your feedback inline
     in the message content. Reference specific files and sections."

     Collect all feedback (responses arrive as new conversation turns via
     SendMessage — track which teammates have responded, send follow-up after
     5 minutes if missing). Have architect revise. Re-send for validation.
     Iterate until consensus (max 3 rounds). Lead makes binding decisions after.

3.3  DATA MODEL REVIEW (all teammates participate)

     Send all data model docs to all teammates:
     "DATA MODEL REVIEW: Review the data model documents for all epics.
     Evaluate: schema correctness, normalization level, migration safety,
     index coverage, constraint completeness, cross-epic data consistency,
     and query performance implications. Provide specific feedback.
     Docs: {list data files}
     RESPONSE FORMAT: Respond via SendMessage with your feedback inline
     in the message content. Reference specific files and sections."

     Collect feedback (responses arrive as new conversation turns via
     SendMessage — track which teammates have responded, send follow-up after
     5 minutes if missing). Have data-engineer revise. Iterate until consensus.

3.4  SPEC VALIDATION (all teammates participate, including PM)

     Send all spec docs to all teammates (including product-manager):
     "SPEC VALIDATION: Review the functional specifications for all epics.
     Evaluate: completeness against acceptance criteria, API consistency,
     error handling coverage, user flow clarity, and alignment with
     architecture and data model docs. Docs: {list spec files}
     RESPONSE FORMAT: Respond via SendMessage with your feedback inline
     in the message content. Reference specific files and sections."

     Send spec-specific prompt to product-manager:
     "SPEC VALIDATION — PRODUCT PERSPECTIVE: Review the functional specs
     from a user intent perspective. Do the specs faithfully represent the
     user needs behind each story? Are error scenarios described from the
     user's point of view? Are there acceptance criteria that the specs
     don't adequately address?
     Docs: {list spec files}
     RESPONSE FORMAT: Respond via SendMessage with your feedback inline."

     Collect feedback (responses arrive as new conversation turns via
     SendMessage — track which teammates have responded, send follow-up after
     5 minutes if missing). Have tech-writer revise. Iterate until consensus.

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=ceremony3_reviewed
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

3.4b CREATE PRODUCT BACKLOG
     Run: bash ~/.claude/skills/prd-lifecycle/scripts/create-backlog.sh . {slug}
     This reads stories from prd.json and creates backlog.json with all stories
     in status="backlog". Verify: test -f prd-lifecycle/{slug}/backlog.json

3.5  GATE: ALL DOCUMENTS FINALIZED

     Verify all files exist and have been approved:
     - prd-lifecycle/{slug}/arch/epic-{id}.md for each epic
     - prd-lifecycle/{slug}/data/epic-{id}.md for each epic
     - prd-lifecycle/{slug}/specs/epic-{id}.md for each epic
     - prd-lifecycle/{slug}/backlog.json
     - prd-lifecycle/{slug}/reports/prd-coverage-audit.md
     - prd-lifecycle/{slug}/reports/story-coverage-audit.md
     If has_ai_ml: prd-lifecycle/{slug}/arch/epic-{id}-ml.md (for AI-relevant epics)
     If has_analytics: prd-lifecycle/{slug}/arch/epic-{id}-analytics.md (for analytics-relevant epics)
     If has_frontend_ui: prd-lifecycle/{slug}/arch/epic-{id}-ux.md (for UI-relevant epics)

     Announce: "Phase 1 Specification complete. Architecture, data model, and
     functional specs validated by all specialists."

3.6  SHUTDOWN PHASE 1 TEAMMATES

     Send shutdown requests to all Phase 1 teammates:
     SendMessage(type="shutdown_request", recipient="architect",
       content="Phase 1 Specification complete. Shutting down.")
     Repeat for: data-engineer, qa-engineer, security-reviewer, tech-writer,
     product-manager, and any active conditional specialists (applied-ai-engineer,
     data-scientist, ux-ui-designer, prompt-engineer).

     Wait for all shutdown confirmations (responses arrive as new conversation
     turns). Track which teammates have confirmed shutdown.

3.6b GIT COMMIT PHASE 1 WORK

     Commit all Phase 1 artifacts (architecture, data models, specs, epics):
     git add -A && git commit -m "feat(phase1): complete specification — architecture, data models, and specs for all epics"

3.7  TRANSITION TO PHASE 2

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=phase1_complete product_backlog_count=N
     Where N = `jq '[.stories[] | select(.status != "done")] | length' prd-lifecycle/{slug}/backlog.json`
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

     NOTE: Brain output will show LOAD: ~/.claude/skills/prd-lifecycle/phases/phase2-sprints.md
     and RESUME AT: SPRINT SETUP (S.1). Read phase2-sprints.md and continue there.
     All Phase 2 sprint instructions are in that file.
