---
name: prd-lifecycle
description: >
  Full development lifecycle from PRD using Agent Teams with Scrum ceremonies.
  All voices in refinement. Reviewers inside each sprint. ACE continuous improvement.
  Covers: story refinement, epic decomposition, architecture, data modeling,
  pair programming, QA, security/performance/code/data/architecture reviews,
  sprint reviews, documentation, and release engineering.
  Conditional specialists (Applied AI Engineer, Data Scientist, UX/UI Designer)
  are activated when the PRD domain requires them.
argument-hint: <prd-file-path | prd-url | "inline PRD text">
disable-model-invocation: true
---

<Purpose>
Transform a Product Requirements Document into released, reviewed code via Scrum
ceremonies orchestrated through Claude Code Agent Teams.

This skill takes a PRD (file path, URL, or inline text) and orchestrates the full
development lifecycle:

1. Backlog refinement with all specialist voices
2. Epic decomposition with cross-domain challenge rounds
3. Architecture + data model design with formal review gates
4. Pair programming sprints with integrated reviews (QA, security, performance,
   code quality, data integrity, architecture compliance)
5. Documentation generation (README, API docs, data docs, changelog)
6. Release engineering (PR creation, version tagging, CI/CD configuration)

Every teammate uses the opus model and general-purpose subagent type. There is no
dependency on OMC agents or OMC infrastructure. All artifacts are stored in a
project-local `prd-lifecycle/` directory. ACE (Accumulated Collective Experience)
learnings from each sprint feed forward into every subsequent sprint, creating a
continuous improvement loop across the entire lifecycle.
</Purpose>

<Use_When>
Activate this skill when ANY of these patterns are detected in the user request:

- "prd lifecycle" — explicit skill invocation
- "implement this prd" — user has a PRD ready for execution
- "build from prd" — user wants to go from document to code
- "prd to code" — explicit PRD-to-implementation intent
- "full lifecycle" — user wants the complete development process
- User provides a PRD file path, URL, or inline PRD text with intent to build

The user must have or provide a PRD. The PRD can be in any format: structured JSON
with user stories, markdown with story sections, or plain text description. Plain
text PRDs will be refined during Ceremony 1 (Backlog Refinement).
</Use_When>

<Do_Not_Use_When>
Do NOT activate this skill when the request is:

- A single feature implementation — use a standard executor agent instead
- A task without a formal PRD — there must be a requirements document to drive from
- A quick prototype or proof of concept — this skill enforces full ceremony gates
  which add overhead inappropriate for throwaway code
- A simple bug fix — use targeted debugging and fix workflows instead
- A code review of existing code — use dedicated review skills instead
- A refactoring task — use architect + executor workflows instead

If in doubt, ask the user: "This looks like it could be a full PRD lifecycle run.
Do you want to activate the full Scrum ceremony process, or would a simpler
approach be better for this task?"
</Do_Not_Use_When>

<Execution_Policy>
HARD RULES — violations of these rules are not permitted:

1. ALL teammates use opus model and general-purpose subagent type. No exceptions.

2. CEREMONY-GATED phase transitions. You cannot skip a ceremony. You cannot
   advance to the next phase until all gates in the current phase are satisfied.
   The gate conditions are specified in each ceremony's description.

3. REVIEWERS INSIDE SPRINTS. Reviews happen as part of the sprint, not as a
   separate phase after all sprints complete. Each sprint contains its own
   build + verify + review cycle.

4. MAX 5 CONCURRENT TEAMMATES at any time. If you need more roles than 5 in a
   sub-phase, stagger them: complete one batch, shut down, spawn the next.

5. MAX 3 FIX-VERIFY CYCLES per finding. If a reviewer flags an issue and the
   developer has attempted 3 fixes without resolution, the lead mediates and
   makes a binding decision (accept with documented risk, defer to a follow-up
   task, or escalate to user).

6. MAX 5 QA CYCLES per sprint. If the same test failure recurs 3 times across
   cycles, stop the sprint and report to the user with full diagnostic context.

7. SHELL SCRIPTS for deterministic steps. Use the provided scripts for project
   initialization, sprint setup, state management, and learning collection:
   - scripts/init-project.sh — scaffold prd-lifecycle/ directory
   - scripts/init-sprint.sh — create sprint-{n}/ with report stubs
   - scripts/write-state.sh — read/write state.json
   - scripts/collect-learnings.sh — aggregate ACE entries from retros

8. ACE FEED-FORWARD. Every sprint's learnings (captured in retro.md) must be
   aggregated and provided to all teammates in subsequent sprints. No sprint
   operates without the accumulated wisdom of prior sprints.

9. PROJECT-LOCAL ARTIFACTS. All output goes in `prd-lifecycle/` in the project
   root. No files in `.omc/`, no files in `~/.claude/` except reading skill
   preambles and scripts.

10. CLEAN SHUTDOWN. Every teammate must be shut down via SendMessage
    (type: "shutdown_request") when their work is complete. No orphaned agents.
</Execution_Policy>

<Steps>
You are the LEAD — acting as Product Owner and Scrum Master. You orchestrate the
entire lifecycle. Follow these steps mechanically, in order. Do not skip steps.
Do not reorder phases.

============================================================================
STEP 0: INITIALIZATION
============================================================================

0.1  PARSE PRD INPUT

     Determine the PRD source from the skill argument:

     a) FILE PATH — If the argument looks like a file path (starts with `/`, `./`,
        `~`, or contains common file extensions like `.md`, `.txt`, `.json`):
        - Use the Read tool to load the file content
        - Store the content as the raw PRD text

     b) URL — If the argument starts with `http://` or `https://`:
        - Use WebFetch to retrieve the content
        - Prompt: "Extract the full PRD content including all user stories,
          requirements, and acceptance criteria"
        - Store the fetched content as the raw PRD text

     c) INLINE TEXT — If the argument is neither a file path nor a URL:
        - Use the argument text directly as the raw PRD text
        - Note: inline PRDs will likely need heavy refinement in Ceremony 1

     If the PRD text is empty or unparseable, ask the user with AskUserQuestion:
     "I could not parse the PRD input. Please provide either a file path, a URL,
     or paste your PRD text directly."

0.2  DERIVE PROJECT SLUG

     Extract the project title from the PRD content:
     - Look for a title heading (# Title), a "title" field in JSON, or the first
       meaningful sentence
     - Convert to a lowercase slug: replace spaces with hyphens, remove special
       characters, truncate to 30 characters
     - The team name will be: `prd-{slug}`

     Example: "Task Management API" becomes team name `prd-task-management-api`

0.3  CREATE TEAM

     Run: TeamCreate(team_name="prd-{slug}", description="{first 200 chars of PRD}")

0.4  SCAFFOLD PROJECT DIRECTORY

     Run: bash ~/.claude/skills/prd-lifecycle/scripts/init-project.sh

     This creates:
       prd-lifecycle/
         arch/           — architecture docs per epic
         specs/          — functional specs per epic
         data/           — data model docs per epic
         sprints/        — sprint directories
         release/        — release artifacts
         state.json      — lifecycle state tracker
         learnings.md    — ACE learning compendium

0.5  PERSIST RAW PRD

     Write the raw PRD content to prd-lifecycle/prd.json:

     {
       "raw": "<full PRD text>",
       "stories": [],
       "title": "<extracted title>",
       "slug": "<project slug>"
     }

0.6  DETECT PRD DOMAINS (Conditional Specialists)

     Analyze the raw PRD text to determine which conditional specialist roles
     are needed. Set domain flags based on content analysis:

     a) has_ai_ml = TRUE if the PRD mentions any of:
        - Machine learning, ML, AI, artificial intelligence, neural network
        - Model training, inference, embeddings, vector search
        - Recommendation engine, classification, NLP, computer vision
        - LLM, generative AI, fine-tuning, RAG, prompt engineering
        If TRUE: the Applied AI Engineer will participate in relevant phases.

     b) has_analytics = TRUE if the PRD mentions any of:
        - Analytics, metrics, dashboards, reporting, KPIs
        - A/B testing, experimentation, statistical analysis
        - Event tracking, user behavior, funnel analysis
        - Data warehouse, BI, data visualization
        If TRUE: the Data Scientist will participate in relevant phases.

     c) has_frontend_ui = TRUE if the PRD mentions any of:
        - User interface, UI, UX, frontend, web app, mobile app
        - Dashboard (visual), forms, components, design system
        - Responsive design, accessibility, WCAG
        - User flows, wireframes, interaction design
        If TRUE: the UX/UI Product Designer will participate in relevant phases.

     Store these flags in prd-lifecycle/state.json via:
     bash ~/.claude/skills/prd-lifecycle/scripts/write-state.sh set has_ai_ml '{true|false}'
     bash ~/.claude/skills/prd-lifecycle/scripts/write-state.sh set has_analytics '{true|false}'
     bash ~/.claude/skills/prd-lifecycle/scripts/write-state.sh set has_frontend_ui '{true|false}'

     The conditional specialists and their phase participation:

     | Role | Flag | Phase 1 | Phase 2 BUILD | Phase 2 VERIFY |
     |------|------|---------|---------------|----------------|
     | applied-ai-engineer | has_ai_ml | Swaps into slot 5 for Ceremonies 1-2 | Joins BUILD for AI/ML epics | AI/ML review |
     | data-scientist | has_analytics | Swaps into slot 5 for Ceremonies 1-2 | Joins BUILD for analytics epics | Analytics review |
     | ux-ui-designer | has_frontend_ui | Swaps into slot 5 for Ceremonies 1-2 | Joins BUILD for UI epics | UX review |

     SLOT MANAGEMENT: The max-5-concurrent rule still applies. When conditional
     specialists participate in Phase 1, they temporarily replace tech-writer
     in slot 5 during Ceremonies 1-2. Tech-writer returns for Ceremony 3
     (spec writing). If multiple conditional specialists are needed in Phase 1,
     rotate them through slot 5 sequentially (e.g., AI engineer for Ceremony 1
     AI stories, then UX designer for Ceremony 1 UI stories, then tech-writer
     for Ceremony 3).

0.7  ANNOUNCE TO USER

     Inform the user that the PRD lifecycle has been initialized:
     "PRD lifecycle initialized for **{title}**. Starting Phase 1: Specification
     with 5 specialist teammates. This phase includes Backlog Refinement, Epic
     Decomposition, and Architecture/Data Model/Spec Validation."

     If any conditional specialists are activated, also announce:
     "Domain analysis detected: {list active domains}. Conditional specialists
     will participate: {list active specialist names}."


============================================================================
PHASE 1: SPECIFICATION
============================================================================

Spawn 5 specialist teammates. Each teammate receives a role-specific preamble
loaded from ~/.claude/skills/prd-lifecycle/preambles/{role}.md (if the file
exists; if it does not exist, provide a brief role description inline).

SPAWN ALL 5 TEAMMATES:

  Task(subagent_type="general-purpose", model="opus",
       team_name="prd-{slug}", name="architect",
       prompt="You are the Architect. {preamble content or: You are responsible
       for system architecture, component design, integration patterns, file
       structure, and technology selection. You review all designs for
       scalability, maintainability, and correctness.}")

  Task(subagent_type="general-purpose", model="opus",
       team_name="prd-{slug}", name="data-engineer",
       prompt="You are the Data Engineer. {preamble content or: You are
       responsible for data modeling, database schema design, migrations, indexes,
       constraints, data integrity, and query optimization. You have authority on
       all data-related decisions.}")

  Task(subagent_type="general-purpose", model="opus",
       team_name="prd-{slug}", name="qa-engineer",
       prompt="You are the QA Engineer. {preamble content or: You are responsible
       for test strategy, test case design, acceptance criteria validation,
       edge case identification, and build verification. You ensure every story
       has testable acceptance criteria.}")

  Task(subagent_type="general-purpose", model="opus",
       team_name="prd-{slug}", name="security-reviewer",
       prompt="You are the Security Reviewer. {preamble content or: You are
       responsible for security analysis, threat modeling, OWASP Top 10
       compliance, input validation, authentication/authorization review, and
       secrets management. You flag security risks early.}")

  Task(subagent_type="general-purpose", model="opus",
       team_name="prd-{slug}", name="tech-writer",
       prompt="You are the Tech Writer. {preamble content or: You are responsible
       for functional specifications, API contract documentation, user flow
       documentation, error scenario documentation, and ensuring requirements
       are unambiguous and complete.}")

Wait for all 5 teammates to confirm they are ready (they will send idle
notifications after processing their initial prompts).

CONDITIONAL SPECIALIST ROTATION (Phase 1):

If any domain flags were set in Step 0.6, conditional specialists participate
in Ceremonies 1 and 2 by temporarily swapping into slot 5 (tech-writer's slot).
Tech-writer returns for Ceremony 3 (spec authoring).

Rotation protocol:
a) If ONE conditional specialist: shut down tech-writer before Ceremony 1,
   spawn the specialist. After Ceremony 2, shut down specialist, re-spawn
   tech-writer for Ceremony 3.

b) If TWO conditional specialists: rotate through Ceremony 1 (specialist A
   reviews stories, shuts down; specialist B reviews stories, shuts down).
   For Ceremony 2, spawn the most relevant specialist for epic grouping.
   Re-spawn tech-writer for Ceremony 3.

c) If THREE conditional specialists: each reviews stories in Ceremony 1
   sequentially via slot 5 rotation. For Ceremony 2, spawn the specialist
   whose domain has the most epics. Re-spawn tech-writer for Ceremony 3.

d) If NO conditional specialists: keep the original 5 team as-is.

In all rotation cases, the lead collects each specialist's feedback and
includes it in the synthesis step, even after the specialist has been
shut down for the rotation. Their domain perspective is preserved in the
refined stories' domain_notes.

Spawn conditional specialists with their preamble from
~/.claude/skills/prd-lifecycle/preambles/{role}.md:

  applied-ai-engineer:
  Task(subagent_type="general-purpose", model="opus",
       team_name="prd-{slug}", name="applied-ai-engineer",
       prompt="You are the Applied AI Engineer. {preamble content}")

  data-scientist:
  Task(subagent_type="general-purpose", model="opus",
       team_name="prd-{slug}", name="data-scientist",
       prompt="You are the Data Scientist. {preamble content}")

  ux-ui-designer:
  Task(subagent_type="general-purpose", model="opus",
       team_name="prd-{slug}", name="ux-ui-designer",
       prompt="You are the UX/UI Product Designer. {preamble content}")

----------------------------------------------------------------------------
CEREMONY 1: BACKLOG REFINEMENT
----------------------------------------------------------------------------

Goal: Every user story has clear acceptance criteria, is understood by all 5
specialists, and has been validated from each domain perspective.

1.1  EXTRACT STORIES

     Parse the raw PRD text to identify user stories. Stories may be formatted as:
     - "As a {role}, I want {feature}, so that {benefit}"
     - Numbered requirements
     - Feature descriptions
     - JSON story objects

     Create a structured list of stories with: ID, title, description,
     acceptance criteria (if present), and priority (if stated).

1.2  DISTRIBUTE STORIES TO ALL TEAMMATES

     Send the full story list to each of the 5 teammates via SendMessage:

     SendMessage(type="message", recipient="architect",
       content="BACKLOG REFINEMENT: Please review these user stories from your
       architecture perspective. For each story, provide: (1) feasibility
       assessment, (2) missing technical details, (3) suggested acceptance
       criteria additions, (4) dependency flags. Stories: {story list}",
       summary="Review stories from architecture perspective")

     Repeat for: data-engineer, qa-engineer, security-reviewer, tech-writer
     — each with their domain-specific review prompt.

1.3  COLLECT FEEDBACK

     Wait for all 5 teammates to respond. Each will provide domain-specific
     feedback on the stories. Collect all feedback.

1.4  SYNTHESIZE AND RESOLVE CONFLICTS

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
     ask the user for a decision. Frame the question clearly: "The architect
     suggests X while the data engineer suggests Y because Z. Which approach
     do you prefer?"

1.5  SEND REVISED STORIES FOR VALIDATION

     Send the revised story list back to all 5 teammates:

     SendMessage(type="message", recipient="{each teammate}",
       content="REFINEMENT VALIDATION: Here are the revised stories after
       incorporating all feedback. Please confirm you approve these from your
       domain perspective, or flag any remaining concerns. Stories: {revised list}",
       summary="Validate revised stories")

1.6  ITERATE UNTIL CONSENSUS

     If any teammate flags remaining concerns:
     a) Address the concern
     b) Re-send for validation
     c) Maximum 3 refinement iterations
     d) If consensus is not reached after 3 iterations, the lead makes binding
        decisions on remaining disputes and documents the rationale

1.7  GATE: PERSIST REFINED STORIES

     Once all 5 teammates approve (or lead has made binding decisions):
     - Update prd-lifecycle/prd.json: set the "stories" array to the refined list
     - Each story must have: id, title, description, acceptance_criteria (array),
       priority, domain_notes (object with keys: arch, data, qa, security, spec)

     Announce: "Backlog Refinement complete. {N} stories refined and approved
     by all specialists."

----------------------------------------------------------------------------
CEREMONY 2: EPIC DECOMPOSITION + REVIEW
----------------------------------------------------------------------------

Goal: Group stories into 3-7 epics with clear boundaries and dependency ordering.

2.1  REQUEST EPIC PROPOSAL

     SendMessage to architect and data-engineer jointly:

     "EPIC DECOMPOSITION: Based on the refined stories, propose an epic grouping.
     Group related stories into 3-7 epics. For each epic provide: epic ID (E1,
     E2...), title, included story IDs, rationale, estimated complexity
     (S/M/L/XL), dependencies on other epics, and whether it is data-heavy
     (requires schema changes, migrations, or significant data work).
     Here are the refined stories: {stories from prd.json}"

2.2  CHALLENGE ROUND

     Send the architect+data-engineer proposal to the other 3 teammates:

     SendMessage to qa-engineer, security-reviewer, tech-writer:
     "EPIC REVIEW: The architect and data engineer propose this epic grouping.
     Challenge from your perspective: Are the boundaries correct? Are there
     missing cross-cutting concerns? Would you reorder priorities? Does the
     dependency chain make sense? Proposal: {epic proposal}"

2.3  REVISE BASED ON CHALLENGES

     Send challenge feedback to architect + data-engineer:
     "EPIC REVISION: Here is feedback from the team on your epic proposal.
     Please revise and respond with the updated grouping. Feedback: {challenges}"

2.4  ITERATE UNTIL CONSENSUS

     Send revised proposal to all 5 for final approval. Maximum 3 iterations.
     Lead makes binding decisions on remaining disputes after 3 rounds.

2.5  GATE: PERSIST EPICS

     Write to prd-lifecycle/epics.json:

     {
       "epics": [
         {
           "id": "E1",
           "title": "...",
           "stories": ["S1", "S2"],
           "complexity": "M",
           "data_heavy": false,
           "depends_on": [],
           "status": "pending"
         }
       ],
       "execution_order": ["E1", "E3", "E2", "E4"]
     }

     Update state: bash ~/.claude/skills/prd-lifecycle/scripts/write-state.sh set epics_remaining '["E1","E2","E3"]'

     Announce: "Epic Decomposition complete. {N} epics defined. Execution order:
     {order}."

----------------------------------------------------------------------------
CEREMONY 3: ARCHITECTURE + DATA MODEL + SPEC VALIDATION
----------------------------------------------------------------------------

Goal: Produce per-epic architecture docs, data model docs, and functional specs,
each validated by all 5 specialists.

3.1  PARALLEL AUTHORING (3 tracks simultaneously)

     Send instructions to 3 teammates in parallel:

     a) architect:
        "ARCHITECTURE DOCS: For each epic, write an architecture document
        covering: file/module structure, component interfaces, integration
        points with other epics, technology choices, error handling strategy,
        and scaling considerations. Write each to: prd-lifecycle/arch/epic-{id}.md
        Epics: {epic list with stories}"

     b) data-engineer:
        "DATA MODEL DOCS: For each epic, write a data model document covering:
        schema definitions (tables/collections with columns/fields and types),
        entity relationship descriptions, migration plan (up and down),
        index strategy, constraints and validation rules, and seed data needs.
        Write each to: prd-lifecycle/data/epic-{id}.md
        Epics: {epic list with stories}"

     c) tech-writer:
        "FUNCTIONAL SPECS: For each epic, write a functional specification
        covering: API contracts (endpoints, request/response schemas, status
        codes), user flows (step-by-step interactions), error scenarios
        (what can go wrong and how the system responds), and integration
        touchpoints with other epics. Write each to: prd-lifecycle/specs/epic-{id}.md
        Epics: {epic list with stories}"

     Wait for all 3 to complete their documents.

3.2  ARCHITECTURE REVIEW (all 5 participate)

     Send all architecture docs to all 5 teammates:
     "ARCHITECTURE REVIEW: Review the architecture documents for all epics.
     Evaluate: completeness, consistency across epics, feasibility, security
     implications, data access patterns, testability, and documentation clarity.
     Provide specific feedback with file references. Docs: {list arch files}"

     Collect all feedback. Have architect revise. Re-send for validation.
     Iterate until consensus (max 3 rounds). Lead makes binding decisions after.

3.3  DATA MODEL REVIEW (all 5 participate)

     Send all data model docs to all 5 teammates:
     "DATA MODEL REVIEW: Review the data model documents for all epics.
     Evaluate: schema correctness, normalization level, migration safety,
     index coverage, constraint completeness, cross-epic data consistency,
     and query performance implications. Provide specific feedback.
     Docs: {list data files}"

     Collect feedback. Have data-engineer revise. Iterate until consensus.

3.4  SPEC VALIDATION (all 5 participate)

     Send all spec docs to all 5 teammates:
     "SPEC VALIDATION: Review the functional specifications for all epics.
     Evaluate: completeness against acceptance criteria, API consistency,
     error handling coverage, user flow clarity, and alignment with
     architecture and data model docs. Docs: {list spec files}"

     Collect feedback. Have tech-writer revise. Iterate until consensus.

3.5  GATE: ALL DOCUMENTS FINALIZED

     Verify all files exist and have been approved:
     - prd-lifecycle/arch/epic-{id}.md for each epic
     - prd-lifecycle/data/epic-{id}.md for each epic
     - prd-lifecycle/specs/epic-{id}.md for each epic

     Announce: "Phase 1 Specification complete. Architecture, data model, and
     functional specs validated by all specialists."

3.6  SHUTDOWN PHASE 1 TEAMMATES

     Send shutdown requests to all 5:
     SendMessage(type="shutdown_request", recipient="architect",
       content="Phase 1 Specification complete. Shutting down.")
     Repeat for: data-engineer, qa-engineer, security-reviewer, tech-writer.

     Wait for all shutdown confirmations.

3.7  UPDATE STATE

     Run: bash ~/.claude/skills/prd-lifecycle/scripts/write-state.sh set phase execution


============================================================================
PHASE 2: EXECUTION SPRINTS
============================================================================

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

S.2  LOAD PRIOR LEARNINGS

     Read prd-lifecycle/learnings.md. This file contains accumulated ACE entries
     from all prior sprints. All teammates spawned in this sprint will receive
     these learnings as part of their context.

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
          features and review your partner's code. {prior learnings}")

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="dev-2",
          prompt="You are Developer 2 in a pair programming team. You implement
          features and review your partner's code. {prior learnings}")

     For data-heavy epics, also spawn data-engineer:

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="data-engineer",
          prompt="You are the Data Engineer. Implement the data layer: schemas,
          migrations, seed data, and data access patterns. {prior learnings}")

     CONDITIONAL BUILD SPECIALISTS (max 3 total with devs, respecting 5-limit):

     If has_ai_ml AND this epic involves AI/ML features, spawn applied-ai-engineer
     INSTEAD OF one dev (use dev-1 only + applied-ai-engineer):
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="applied-ai-engineer",
          prompt="You are the Applied AI Engineer. Implement the ML pipeline
          components for this epic. {preamble content} {prior learnings}")

     If has_frontend_ui AND this epic involves significant UI work, spawn
     ux-ui-designer INSTEAD OF one dev (use dev-1 only + ux-ui-designer):
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="ux-ui-designer",
          prompt="You are the UX/UI Product Designer. Implement the UI
          components and ensure accessibility compliance. {preamble content}
          {prior learnings}")

     If has_analytics AND this epic involves analytics features, spawn
     data-scientist INSTEAD OF one dev (use dev-1 only + data-scientist):
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="data-scientist",
          prompt="You are the Data Scientist. Implement the analytics pipeline,
          event tracking, and metrics infrastructure. {preamble content}
          {prior learnings}")

     NOTE: Only ONE conditional specialist per BUILD sub-phase. If an epic
     requires multiple specialists (e.g., AI + UI), prioritize the dominant
     domain and have the dev handle the secondary domain. The specialist
     review in VERIFY will catch issues.

     When a conditional specialist replaces dev-2 in BUILD:
     - dev-1 handles general implementation + pair reviews the specialist's code
     - The specialist handles domain-specific implementation
     - Pair review is: dev-1 reviews specialist's code, specialist reviews
       dev-1's domain-relevant code

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

     When a developer completes their IMPL task, the opposite developer's
     PAIR-REVIEW task unblocks:

     a) Lead sends the completed work to the reviewing developer:
        "PAIR REVIEW: Review the following implementation by {dev-name}.
        Check against: (1) acceptance criteria from the spec, (2) architecture
        compliance, (3) code quality and readability, (4) test coverage,
        (5) error handling. Files changed: {file list}. Spec: {spec reference}.
        Respond with APPROVE or REQUEST_CHANGES with specific file:line feedback."

     b) If APPROVE: mark PAIR-REVIEW task complete.

     c) If REQUEST_CHANGES:
        - Send change requests to the original developer
        - Developer fixes and reports back
        - Reviewer re-reviews
        - Maximum 3 fix cycles
        - After 3 cycles: lead reviews the dispute, makes a binding decision,
          and documents the rationale in the sprint review notes

A.6  SHUTDOWN BUILD TEAMMATES

     Once all PAIR-REVIEW tasks are complete (all approved):
     SendMessage(type="shutdown_request", recipient="dev-1", content="Build phase complete.")
     SendMessage(type="shutdown_request", recipient="dev-2", content="Build phase complete.")
     If data-engineer was spawned:
     SendMessage(type="shutdown_request", recipient="data-engineer", content="Build phase complete.")

     Wait for shutdown confirmations.

----------------------------------------------------------------------------
SUB-PHASE B: VERIFY + REVIEW (4-5 teammates, parallel)
----------------------------------------------------------------------------

B.1  SPAWN REVIEW TEAMMATES

     Spawn 4 reviewers (5 if data-heavy epic):

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="qa-engineer",
          prompt="You are the QA Engineer. Run tests, write new tests for
          uncovered paths, verify build integrity, and run type checking.
          {prior learnings}")

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="security-reviewer",
          prompt="You are the Security Reviewer. Check OWASP Top 10 compliance,
          scan for secrets/credentials in code, validate input sanitization,
          review auth flows, and assess dependency vulnerabilities.
          {prior learnings}")

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="performance-reviewer",
          prompt="You are the Performance Reviewer. Identify O(n^2+) hotspots,
          N+1 query patterns, memory leaks, unnecessary re-renders, bundle size
          issues, and missing caching opportunities. {prior learnings}")

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="code-reviewer",
          prompt="You are the Code Reviewer. Evaluate code quality, SOLID
          principles adherence, DRY compliance, naming conventions, error
          handling patterns, and documentation completeness. {prior learnings}")

     If data-heavy epic:
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="data-engineer",
          prompt="You are the Data Engineer reviewing the data layer. Verify
          schema correctness, migration safety (up and down), index coverage,
          constraint enforcement, and data integrity. {prior learnings}")

     CONDITIONAL SPECIALIST REVIEWERS:

     Conditional specialists review AFTER the core 4 reviewers complete and
     are shut down (to respect max-5-concurrent). The lead runs them as a
     second verification wave if applicable to this epic.

     If has_ai_ml AND this epic has AI/ML components:
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="applied-ai-engineer",
          prompt="You are the Applied AI Engineer reviewing the ML components.
          Verify model integration, inference performance, fallback behavior,
          and responsible AI compliance. {preamble content} {prior learnings}")
     → Writes to: sprints/sprint-{n}/reports/ai-review.md

     If has_analytics AND this epic has analytics components:
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="data-scientist",
          prompt="You are the Data Scientist reviewing analytics components.
          Verify event tracking, metrics accuracy, statistical validity,
          and data privacy compliance. {preamble content} {prior learnings}")
     → Writes to: sprints/sprint-{n}/reports/analytics-review.md

     If has_frontend_ui AND this epic has UI components:
     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="ux-ui-designer",
          prompt="You are the UX/UI Product Designer reviewing the interface.
          Verify design compliance, accessibility (WCAG 2.1 AA), responsive
          behavior, and UI state coverage. {preamble content} {prior learnings}")
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

     Wait for all reviewers to complete. Read each report. Triage findings:

     a) CRITICAL findings: Must be fixed before sprint can pass.
        - Re-spawn a developer (dev-1) to fix the specific issues
        - Send the developer the finding details with file:line references
        - After fix, send back to the original reviewer for re-verification
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

----------------------------------------------------------------------------
SUB-PHASE C: ARCHITECTURE REVIEW
----------------------------------------------------------------------------

C.1  SPAWN ARCHITECT (if not already present)

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="architect",
          prompt="You are the Architect performing a post-implementation review.
          Verify the implementation matches the architecture documents.
          {prior learnings}")

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

----------------------------------------------------------------------------
SPRINT REVIEW
----------------------------------------------------------------------------

R.1  GATHER ALL CURRENT TEAMMATES

     At this point, only the architect should be active. The lead conducts the
     sprint review.

R.2  PRESENT SUMMARY

     Send to architect:
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
     What is your overall confidence level? Any concerns for future epics?"

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

----------------------------------------------------------------------------
SPRINT RETROSPECTIVE
----------------------------------------------------------------------------

T.1  ASK TEAMMATES FOR RETROSPECTIVE INPUT

     Send to all active teammates:
     "SPRINT RETROSPECTIVE: What worked well in this sprint? What didn't?
     What should we do differently in the next sprint? Format your response as:
     ## [strategy] {title}: {description}
     ## [pitfall] {title}: {description}"

T.2  COMPILE RETRO

     Write all entries to prd-lifecycle/sprints/sprint-{n}/retro.md using the
     format the collect-learnings.sh script expects:
     ## [strategy] {title}: {description}
     ## [pitfall] {title}: {description}

T.3  AGGREGATE LEARNINGS

     Run: bash ~/.claude/skills/prd-lifecycle/scripts/collect-learnings.sh

     This updates prd-lifecycle/learnings.md with entries from all sprint retros.

T.4  UPDATE STATE

     Run: bash ~/.claude/skills/prd-lifecycle/scripts/write-state.sh add-completed E{id}
     Run: bash ~/.claude/skills/prd-lifecycle/scripts/write-state.sh set current_sprint {n+1}

T.5  SHUTDOWN ALL SPRINT TEAMMATES

     Send shutdown requests to all remaining teammates (architect and any others).
     Wait for confirmations.

T.6  ADVANCE TO NEXT EPIC

     Read epics.json to determine the next epic in execution_order.
     If more epics remain: return to SPRINT SETUP (S.1) for the next sprint.
     If all epics complete: proceed to PHASE 3.


============================================================================
PHASE 3: RELEASE
============================================================================

R.1  UPDATE STATE

     Run: bash ~/.claude/skills/prd-lifecycle/scripts/write-state.sh set phase release

R.2  SPAWN RELEASE TEAMMATES (2)

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="tech-writer",
          prompt="You are the Tech Writer. Generate comprehensive project
          documentation from the architecture docs, data model docs, specs,
          and sprint reports.")

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="release-engineer",
          prompt="You are the Release Engineer. Handle git hygiene, version
          management, CI/CD configuration, deployment setup, and PR creation.")

R.3  DISTRIBUTE CONTEXT

     Send both teammates:
     - All sprint review summaries (sprints/sprint-*/review.md)
     - All review reports (sprints/sprint-*/reports/*.md)
     - All architecture docs (arch/*.md)
     - All data model docs (data/*.md)
     - All specs (specs/*.md)
     - Accumulated learnings (learnings.md)
     - The original PRD (prd.json)

R.4  TECH WRITER DELIVERABLES

     Send to tech-writer:
     "RELEASE DOCUMENTATION: Produce the following deliverables. Write each
     to prd-lifecycle/release/:
     1. README.md — Project overview, setup instructions, usage guide
     2. API.md — Complete API documentation (from specs)
     3. DATA.md — Data model documentation (from data model docs)
     4. CHANGELOG.md — All changes organized by epic/sprint
     5. RELEASE-NOTES.md — User-facing release notes"

R.5  RELEASE ENGINEER DELIVERABLES

     Send to release-engineer:
     "RELEASE ENGINEERING: Perform the following tasks:
     1. Git cleanup — ensure clean history, meaningful commit messages
     2. Version bump — set appropriate version (semver based on scope)
     3. CI/CD — configure CI pipeline (GitHub Actions, or project-appropriate)
     4. Deployment config — environment configs, Docker if applicable
     5. Migration plan — document migration steps for data changes
     6. PR creation — create a pull request with comprehensive description
        summarizing all epics, changes, and review outcomes
     Write deployment/CI configs to the project root. Write the migration plan
     to prd-lifecycle/release/MIGRATION.md."

R.6  GATE: RELEASE ARTIFACTS COMPLETE

     Verify all deliverables exist:
     - prd-lifecycle/release/README.md
     - prd-lifecycle/release/API.md
     - prd-lifecycle/release/DATA.md
     - prd-lifecycle/release/CHANGELOG.md
     - prd-lifecycle/release/RELEASE-NOTES.md
     - prd-lifecycle/release/MIGRATION.md (if data changes exist)
     - CI/CD configuration file in project root
     - PR created (or ready to create)

R.7  SHUTDOWN RELEASE TEAMMATES

     SendMessage(type="shutdown_request", recipient="tech-writer", content="Release phase complete.")
     SendMessage(type="shutdown_request", recipient="release-engineer", content="Release phase complete.")
     Wait for confirmations.


============================================================================
FINAL RETROSPECTIVE
============================================================================

F.1  UPDATE STATE

     Run: bash ~/.claude/skills/prd-lifecycle/scripts/write-state.sh set phase completed

F.2  FINAL LEARNING AGGREGATION

     Run: bash ~/.claude/skills/prd-lifecycle/scripts/collect-learnings.sh

F.3  COMPILE FULL RETROSPECTIVE

     Read all sprint retros (sprints/sprint-*/retro.md). Write a comprehensive
     final retrospective to prd-lifecycle/release/RETROSPECTIVE.md covering:
     - Overall timeline (sprints completed, total ceremony count)
     - Top strategies that worked across sprints
     - Top pitfalls encountered and how they were resolved
     - Recommendations for future projects

F.4  CLEAN UP TEAM

     Run: TeamDelete("prd-{slug}")

F.5  PRESENT FINAL REPORT TO USER

     Present a structured summary:

     "## PRD Lifecycle Complete: {project title}

     **Sprints completed:** {N}
     **Epics delivered:** {list}
     **Total review findings:** {count by severity}
     **CRITICAL findings resolved:** {count}

     ### Deliverables
     - Source code: {summary of what was built}
     - Documentation: prd-lifecycle/release/README.md, API.md, DATA.md
     - Release notes: prd-lifecycle/release/RELEASE-NOTES.md
     - Changelog: prd-lifecycle/release/CHANGELOG.md
     - All review reports: prd-lifecycle/sprints/sprint-*/reports/

     ### Key Learnings
     {top 3-5 ACE entries from learnings.md}

     ### Next Steps
     - Review and merge the PR
     - Run the migration plan (if applicable)
     - Deploy to staging for acceptance testing"

F.6  OFFER LEARNING EXPORT

     Ask the user: "Would you like me to merge the top learnings from this
     lifecycle into your global ACE playbooks for future projects?"

     If yes, append the top strategies and pitfalls to the user's global
     learning repository.
</Steps>

<Tool_Usage>
Tools used by this skill, organized by purpose:

TEAM LIFECYCLE:
- TeamCreate(team_name, description) — create the Scrum team at lifecycle start
- TeamDelete(team_name) — clean up the team at lifecycle end

TEAMMATE SPAWNING:
- Task(subagent_type="general-purpose", model="opus", team_name="prd-{slug}",
  name="{role}", prompt="{preamble + context}") — spawn each teammate
  All teammates use opus model and general-purpose subagent type without exception.

TASK MANAGEMENT:
- TaskCreate(subject, description, activeForm) — create sprint tasks
- TaskUpdate(taskId, status, addBlockedBy) — set dependencies, update status
- TaskList() — check task progress across the sprint
- TaskGet(taskId) — read full task details before starting work

TEAMMATE COMMUNICATION:
- SendMessage(type="message", recipient, content, summary) — direct messages to
  specific teammates for ceremony participation, work distribution, and feedback
- SendMessage(type="shutdown_request", recipient, content) — graceful shutdown of
  teammates when their phase or sprint work is complete

FILE OPERATIONS:
- Read — load PRD files, preambles, architecture docs, reports
- Write — create prd.json, epics.json, architecture docs, reports, release docs
- Edit — update existing files (state, reports, specs)

SHELL SCRIPTS:
- Bash: bash ~/.claude/skills/prd-lifecycle/scripts/init-project.sh — scaffold
  the prd-lifecycle/ directory with all subdirectories and initial state
- Bash: bash ~/.claude/skills/prd-lifecycle/scripts/init-sprint.sh {n} — create sprint-{n}/ directory with
  report stubs, review template, and retrospective template
- Bash: bash ~/.claude/skills/prd-lifecycle/scripts/write-state.sh {read|set|add-completed} — manage lifecycle
  state in state.json (phase, sprint number, completed epics)
- Bash: bash ~/.claude/skills/prd-lifecycle/scripts/collect-learnings.sh — aggregate ACE entries from all sprint
  retrospectives into the master learnings.md compendium

FILE DISCOVERY:
- Glob — find files by pattern (e.g., prd-lifecycle/sprints/sprint-*/reports/*.md)
- Grep — search file contents (e.g., find CRITICAL findings across all reports)

USER INTERACTION:
- AskUserQuestion — resolve ambiguity during refinement, get user decisions on
  scope/priority conflicts, handle escalations from deadlocked ceremonies

CODE QUALITY:
- lsp_diagnostics_directory — project-level type checking during QA verification,
  used by qa-engineer to detect type errors across the codebase
</Tool_Usage>

<Examples>
GOOD — appropriate uses of this skill:

  /prd-lifecycle ./docs/prd.md
  Loads the PRD from a local markdown file and runs the full lifecycle.

  /prd-lifecycle https://docs.google.com/document/d/abc123/export?format=txt
  Fetches the PRD from a URL and runs the full lifecycle.

  /prd-lifecycle "Build a task management API with user authentication, project
  organization, task CRUD with assignments and due dates, real-time notifications
  via WebSockets, and a dashboard showing project progress. Tech stack: Node.js,
  PostgreSQL, Redis for pub/sub."
  Uses inline text as the PRD. Will undergo heavy refinement in Ceremony 1.

  /prd-lifecycle ./requirements/e-commerce-platform.json
  Loads a structured JSON PRD with pre-defined user stories and acceptance criteria.

BAD — do NOT use this skill for these:

  "Fix the login bug"
  This is a single issue, not a PRD. Use a targeted debugging workflow.

  "Add a button to the dashboard"
  This is a single feature. Use a standard executor agent.

  "Quick prototype of auth flow"
  This is a prototype. The full ceremony overhead is inappropriate.

  "Refactor the database layer"
  This is a refactoring task. Use architect + executor workflows.

  "Review this PR"
  This is a code review. Use dedicated review skills.
</Examples>

<Escalation_And_Stop_Conditions>
The lead must handle these situations according to the specified protocols:

CEREMONY DEADLOCK (3+ iterations without consensus):
- The lead makes a binding decision on all remaining disputes
- Document the decision rationale in the ceremony gate artifact
- Announce: "Lead decision: {rationale}. Proceeding with {choice}."
- No further iteration on decided items

PAIR REVIEW DEADLOCK (3 fix cycles without resolution):
- Lead reviews the disputed code and both perspectives
- Makes a binding decision: accept as-is (with documented risk), accept with
  specific modifications, or defer to a follow-up task
- Document in sprint review notes

QA EXHAUSTION (5 cycles or same failure 3 times):
- Stop the sprint immediately
- Compile a diagnostic report: failing test, stack trace, attempted fixes,
  hypothesis for root cause
- Present to user via AskUserQuestion: "QA has been unable to resolve this
  failure after {N} attempts. {diagnostic summary}. Options: (1) Continue with
  a different approach, (2) Skip this test and document as known issue,
  (3) Stop the lifecycle and investigate manually."

CRITICAL SECURITY FINDING REQUIRING ARCHITECTURE CHANGE:
- Stop current sprint work
- Escalate to user immediately: "A CRITICAL security finding requires an
  architecture change: {description}. This affects epic {id} and potentially
  {downstream epics}. Continuing without addressing this creates risk of
  {consequence}. Recommend: {proposed change}."
- User must approve the architecture change before resuming
- If approved: update architecture docs, re-run affected reviews

DATA MODEL CONFLICT (architect vs data-engineer):
- Lead mediates the discussion
- Data-engineer has authority on data-specific decisions (schema design,
  normalization, migration strategy, index selection)
- Architect has authority on data access patterns, caching strategy, and
  cross-service data flow
- Document the resolution and which authority applied

MIGRATION FAILURE ON EXISTING DATA:
- data-engineer designs a rollback migration immediately
- Test rollback on a copy of the data if possible
- Document the failure mode and rollback procedure
- Escalate to user if data loss is possible

AI/ML MODEL CONFLICT (applied-ai-engineer vs architect on infrastructure):
- Lead mediates the discussion
- Applied AI Engineer has authority on model selection, ML pipeline design,
  and inference optimization decisions
- Architect has authority on infrastructure provisioning, service boundaries,
  and deployment architecture
- Document the resolution and which authority applied

UX vs FEATURE SCOPE CONFLICT (ux-ui-designer vs dev on implementation):
- Lead mediates the discussion
- UX/UI Designer has authority on user experience, accessibility, and
  interaction design decisions
- Developer has authority on technical feasibility and implementation approach
- If accessibility is at stake, UX/UI Designer's position takes precedence
- Document the resolution

ANALYTICS vs PRIVACY CONFLICT (data-scientist vs security-reviewer):
- Lead mediates the discussion
- Security reviewer has authority on privacy and compliance requirements
- Data scientist has authority on statistical methods and metrics design
- Privacy requirements are non-negotiable; analytics must adapt
- Document the resolution and any analytics limitations imposed by privacy

TEAMMATE CRASH (no messages for >10 minutes):
- Send a follow-up message to the teammate
- If still no response after 2 minutes: send shutdown_request
- Reassign the teammate's tasks to a new task
- Spawn a replacement teammate with the same role and preamble
- Provide the replacement with context about work completed so far

SPRINT REVIEW NO-GO:
- Do NOT restart the entire sprint
- Identify the specific failing areas
- Create targeted fix tasks for the failures only
- Re-spawn only the necessary teammates (developer for fixes, reviewer for
  re-verification)
- Re-run only the affected sub-phases
- If NO-GO persists after 2 targeted fix rounds: escalate to user
</Escalation_And_Stop_Conditions>

<Final_Checklist>
Before claiming the PRD lifecycle is complete, the lead MUST verify ALL of
the following. Do not skip any item. Do not claim completion if any item fails.

PHASE 1 GATES:
- [ ] Backlog Refinement passed — all stories have acceptance criteria, all 5
      specialists approved (or lead made binding decisions)
- [ ] Epic Decomposition passed — 3-7 epics defined with execution order,
      all 5 specialists approved (or lead made binding decisions)
- [ ] Architecture Review passed — per-epic arch docs validated by all 5
- [ ] Data Model Review passed — per-epic data docs validated by all 5
- [ ] Spec Validation passed — per-epic specs validated by all 5

PHASE 2 GATES (per sprint):
- [ ] All IMPL tasks completed and pair-reviewed (APPROVE verdict)
- [ ] QA report: PASS or PASS_WITH_WARNINGS (zero CRITICAL/HIGH unresolved)
- [ ] Security report: PASS or PASS_WITH_WARNINGS (zero CRITICAL/HIGH unresolved)
- [ ] Performance report: PASS or PASS_WITH_WARNINGS (zero CRITICAL/HIGH unresolved)
- [ ] Code Review report: PASS or PASS_WITH_WARNINGS (zero CRITICAL/HIGH unresolved)
- [ ] Data Review report (if data-heavy): PASS or PASS_WITH_WARNINGS
- [ ] AI/ML Review report (if has_ai_ml and epic has ML): PASS or PASS_WITH_WARNINGS
- [ ] Analytics Review report (if has_analytics and epic has analytics): PASS or PASS_WITH_WARNINGS
- [ ] UX Review report (if has_frontend_ui and epic has UI): PASS or PASS_WITH_WARNINGS
- [ ] Architecture Review report: PASS or PASS_WITH_WARNINGS
- [ ] Sprint Review: GO decision
- [ ] Sprint Retrospective: ACE entries captured
- [ ] All sprint teammates shut down cleanly

PHASE 2 AGGREGATE:
- [ ] All epics in execution_order have completed sprints with GO decisions
- [ ] learnings.md is up to date with all sprint retros aggregated

PHASE 3 GATES:
- [ ] README.md exists and is complete
- [ ] API.md exists and covers all endpoints
- [ ] DATA.md exists and covers all schemas
- [ ] CHANGELOG.md exists and covers all epics
- [ ] RELEASE-NOTES.md exists with user-facing summary
- [ ] MIGRATION.md exists (if data changes were made)
- [ ] CI/CD configuration exists in project root
- [ ] PR created (or ready to create on user command)
- [ ] Release teammates shut down cleanly

FINAL:
- [ ] state.json shows phase: "completed"
- [ ] learnings.md has final aggregation from all sprints
- [ ] RETROSPECTIVE.md compiled from all sprint retros
- [ ] TeamDelete executed successfully
- [ ] Final report presented to user
- [ ] Learning export offered to user
</Final_Checklist>

<Advanced>
CONFIGURATION:

  PRD Input Formats:
  - File path: any local file (.md, .txt, .json, .yaml). Read tool loads it.
  - URL: any accessible URL. WebFetch retrieves and extracts content.
  - Inline text: passed directly as the skill argument. Works best with
    detailed descriptions; minimal PRDs will need heavy refinement.

  PRD Size Guidelines:
  - Small PRD (1-10 stories): 3-4 epics, 3-4 sprints, ~2 hours
  - Medium PRD (10-30 stories): 4-6 epics, 4-6 sprints, ~4 hours
  - Large PRD (30-50 stories): 5-7 epics, 5-7 sprints, ~6 hours
  - Very large PRD (50+ stories): consider splitting into multiple lifecycle
    runs. Each run should cover a coherent subset of functionality. Run them
    sequentially, feeding learnings from one into the next.

  Epic Count:
  - Maximum 7 epics per lifecycle run is recommended
  - Fewer than 3 epics suggests the PRD may be too small for this skill
  - More than 7 epics increases risk of context loss across sprints

RESUME:

  All lifecycle state is persisted in prd-lifecycle/state.json. The state tracks:
  - phase: "specification" | "execution" | "release" | "completed"
  - status: "active" | "paused" | "completed"
  - current_sprint: number
  - epics_completed: array of epic IDs
  - epics_remaining: array of epic IDs

  To resume an interrupted lifecycle:
  1. Read prd-lifecycle/state.json to determine current phase and sprint
  2. Read epics.json to determine which epics remain
  3. Read learnings.md for accumulated context
  4. Re-create the team: TeamCreate("prd-{slug}")
  5. Skip completed phases/sprints
  6. Re-spawn the appropriate teammates for the current phase
  7. Continue from the current step

  All artifacts from completed phases are preserved in prd-lifecycle/ and do
  not need to be regenerated. Architecture docs, data models, specs, and
  sprint reports from completed work remain available for context.

PRD FORMAT GUIDE:

  Best (structured JSON):
  {
    "title": "Project Name",
    "description": "Project overview",
    "stories": [
      {
        "id": "S1",
        "title": "User Registration",
        "description": "As a new user, I want to register...",
        "acceptance_criteria": ["AC1: ...", "AC2: ..."],
        "priority": "high",
        "non_functional": ["NFR1: Response time < 200ms"]
      }
    ],
    "constraints": ["Must use PostgreSQL", "Deploy to AWS"],
    "non_functional_requirements": ["99.9% uptime", "GDPR compliant"]
  }

  Good (structured markdown):
  # Project Name
  ## Overview
  ...
  ## User Stories
  ### S1: User Registration
  As a new user, I want to register so that I can access the platform.
  **Acceptance Criteria:**
  - [ ] User can register with email and password
  - [ ] Email verification is sent
  **Priority:** High

  Acceptable (plain text):
  "Build a task management API with user auth, projects, tasks with
  assignments and due dates, notifications, and a dashboard."

  Plain text PRDs will undergo the most transformation during Ceremony 1.
  The refinement process will extract stories, define acceptance criteria,
  and add domain-specific requirements. This is fine — the ceremony process
  is designed to handle ambiguity.

TROUBLESHOOTING:

  Scripts fail to execute:
  - Verify python3 is available: `which python3`
  - Check file permissions: `ls -la scripts/`
  - Ensure the scripts are executable: `chmod +x scripts/*.sh`
  - Run from the project root directory

  Teammate goes silent (no messages after assignment):
  - Send a follow-up message: "Status check — are you still working on {task}?"
  - Wait 2 minutes for response
  - If no response: send shutdown_request, spawn a replacement with same role
  - Provide replacement with the task context and any partial work references

  Cross-epic dependency blocks execution:
  - If epic E3 depends on E2 but E2 is not yet complete, do not start E3
  - Check if the dependency is a hard requirement or soft (nice-to-have)
  - If soft: start E3 with a stub/interface for the E2 dependency
  - If hard: prioritize E2 completion, defer E3 to the next available sprint

  Teammate count exceeds 5:
  - Review which teammates are active: TaskList + check for idle notifications
  - Shut down any teammates that have completed their work
  - Stagger spawning: complete one batch before starting the next
  - Never have more than 5 active teammates simultaneously

  State file corruption:
  - Read the raw state.json to assess damage
  - If parseable: fix the corrupted field manually via write-state.sh
  - If unparseable: reconstruct from artifacts (check which sprint dirs exist,
    which epic docs exist, which reports are written)
  - Write a fresh state.json reflecting the reconstructed state

  Memory/context pressure in long lifecycles:
  - Learnings.md may grow large across many sprints
  - Summarize older sprint learnings to keep the file concise
  - When sending context to teammates, prioritize recent sprint learnings
    and only include older entries if directly relevant to the current epic
  - Architecture, data, and spec docs per epic are scoped — only send the
    docs for the current epic, not all epics
</Advanced>
