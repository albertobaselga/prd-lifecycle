---
name: prd-lifecycle
description: >
  Full development lifecycle from PRD using Agent Teams with Scrum ceremonies.
  All voices in refinement. Reviewers inside each sprint. ACE continuous improvement.
  Covers: epic decomposition, story refinement (per epic), architecture, data modeling,
  pair programming, QA, security/performance/code/data/architecture reviews,
  sprint reviews, documentation, and release engineering.
  Conditional specialists (Applied AI Engineer, Data Scientist, UX/UI Designer,
  Prompt Engineer) are activated when the PRD domain requires them.
argument-hint: <prd-file-path | prd-url | "inline PRD text">
disable-model-invocation: true
---

<Purpose>
Transform a Product Requirements Document into released, reviewed code via Scrum
ceremonies orchestrated through Claude Code Agent Teams.

This skill takes a PRD (file path, URL, or inline text) and orchestrates the full
development lifecycle:

1. Epic decomposition with cross-domain challenge rounds
2. Story refinement with all specialist voices (per epic)
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
text PRDs will be decomposed into epics during Ceremony 1 (Epic Decomposition)
and refined into stories during Ceremony 2 (Story Refinement).
</Use_When>

<Do_Not_Use_When>
Do NOT activate this skill when the request is:

- A single feature implementation — use a simpler agent workflow instead
- A task without a formal PRD — there must be a requirements document to drive from
- A quick prototype or proof of concept — this skill enforces full ceremony gates
  which add overhead inappropriate for throwaway code
- A simple bug fix — use targeted debugging and fix workflows instead
- A code review of existing code — use dedicated review skills instead
- A refactoring task — use a targeted refactoring workflow instead

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

4. MAX 10 CONCURRENT TEAMMATES at any time. The TL decides team composition per ceremony based on PRD needs.

5. MAX 3 FIX-VERIFY CYCLES per finding. If a reviewer flags an issue and the
   developer has attempted 3 fixes without resolution, the lead mediates and
   makes a binding decision (accept with documented risk, defer to a follow-up
   task, or escalate to user).

6. MAX 5 QA CYCLES per sprint. If the same test failure recurs 3 times across
   cycles, stop the sprint and report to the user with full diagnostic context.

7. SHELL SCRIPTS for deterministic steps. Use the provided scripts for project
   initialization, sprint setup, state management, and learning collection:
   - scripts/brain/run.sh — state management + deterministic navigation + debug log
     (also handles project initialization via --init flag)
   - scripts/init-sprint.sh — create sprint-{n}/ with report stubs
   - scripts/collect-learnings.sh — aggregate ACE entries from retros

8. ACE FEED-FORWARD. Every sprint's learnings (captured in retro.md) must be
   aggregated and provided to all teammates in subsequent sprints. No sprint
   operates without the accumulated wisdom of prior sprints.

9. PROJECT-LOCAL ARTIFACTS. All output goes in `prd-lifecycle/{slug}/` in the
   project root (where {slug} is the PRD instance slug from Step 0.2). No files in `.omc/`, no files in `~/.claude/` except reading skill
   preambles and scripts.

10. CLEAN SHUTDOWN. Every teammate must be shut down via SendMessage
    (type: "shutdown_request") when their work is complete. No orphaned agents.

11. GIT COMMIT AFTER EVERY SPRINT. After each sprint's retro is complete and
    teammates are shut down, commit all changes with a descriptive message:
    # Mono-epic sprint:
    feat(sprint-{n}): implement epic E{id} — {epic title}

    # Multi-epic sprint:
    feat(sprint-{n}): implement stories {S-IDs} from epics {E-IDs}
    This creates atomic rollback points per sprint. The commit step is in phase2-sprints.md.

12. NEVER STOP UNTIL LIFECYCLE COMPLETE. The Lead MUST continue executing
    sprints until ALL stories are completed (product_backlog_count=0) and the lifecycle reaches the
    "completed" state. Do NOT pause between sprints to ask the user for
    permission to continue. Do NOT stop after a single sprint. Do NOT
    present intermediate results and wait. The user initiated a FULL
    lifecycle — execute it fully. The ONLY acceptable stop conditions are:
    a) All stories complete (product_backlog_count=0) and final retrospective presented (F.5)
    b) An escalation condition from section <Escalation_And_Stop_Conditions>
    c) A tool permission denial that cannot be worked around
    If context is running low between sprints, summarize progress and
    continue — do NOT stop and ask the user to resume.

13. SIMPLICITY BIAS. You and every agent on the team have a documented
    tendency to overengineer. Counteract this at every decision point:
    a) In Ceremony 1 (Epic Decomposition): challenge the epic count.
       Target the MINIMUM number of epics (3-5). Require written
       justification for every epic beyond 5. Each epic must map to
       explicit PRD sections.
    b) In Ceremony 2 (Story Refinement): after synthesizing feedback, run a
       Simplification Pass — compare refined stories against the original
       PRD text and remove any additions not traceable to explicit PRD
       requirements. Flag if story count grew >30% from the original.
       Discard stories without a valid epic_id.
    c) In Refinement (Phase 2): verify task counts per story. Flag any
       story with >5 tasks for splitting. Flag sprint-level task:story
       ratio >4:1.
    d) In VERIFY (Phase 2): treat significant overengineering (>50% more
       files or code than necessary) as a HIGH finding equivalent to a
       bug — it blocks the sprint until simplified.
    e) When ANY specialist proposes scope beyond the PRD, the Lead MUST
       challenge: "Is this in the PRD? What happens if we don't do this?"
       Additions not in the PRD are tagged POST-MVP and deferred.
</Execution_Policy>

<Steps>
You are the LEAD — acting as Product Owner and Scrum Master. You orchestrate the
entire lifecycle. Follow these steps mechanically, in order. Do not skip steps.
Do not reorder phases.

============================================================================
STEP 0: INITIALIZATION
============================================================================

RESUME CHECK (run FIRST, before anything else):

     1. Run: bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh --list

     2. If "No PRD instances found":
        This is a FRESH START. Continue with Step 0.1 below.

     3. If instances exist:
        a. Parse the PRD argument (step 0.1 logic) and derive slug (step 0.2 logic)
        b. If an instance with matching slug exists in the list: RESUME that instance
           - Run brain orient: bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug}
           - Read prd-lifecycle/{slug}/prd.json for the PRD content
           - Read prd-lifecycle/{slug}/learnings.md for accumulated context
           - Re-create the team: TeamCreate(team_name="{team_name from brain output}")
           - Discover lead name (step 0.3b)
           - Follow the PROTOCOL from brain output:
             Read the file shown in LOAD, jump to RESUME AT, follow from there
        c. If NO matching slug: NEW PRD → continue to Step 0.1 below
        d. If no PRD argument provided (bare /prd-lifecycle):
           - If exactly 1 instance: RESUME it (same as 3b above)
           - If multiple instances: ask user with AskUserQuestion which to resume

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

     NOTE: State cannot be written here yet — state.json is created by
     brain --init in Step 0.4. The team_name will be persisted after scaffold.

0.3b DISCOVER LEAD NAME

     After TeamCreate completes, read the team config to discover the lead's
     own name:

     Read file: ~/.claude/teams/prd-{slug}/config.json

     Extract the lead's name from the members array (the first member, or
     the member with the team creator role). Store this as {lead-name}.

     ALL subsequent teammate spawns MUST include in their prompt:
     "RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
     SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
     summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
     the lead and other teammates."

CRITICAL — IDLE STATUS AND RESPONSE WAITING:

     In Claude Code Teams, teammates go idle after EVERY turn — this is normal
     and expected. An idle teammate (isActive: false) is NOT a non-responsive
     teammate. Idle simply means they finished their current turn and are
     waiting for input or processing a response.

     YOU MUST:
     - Wait for actual SendMessage responses from teammates, not check idle status
     - NEVER skip waiting because teammates appear idle — they may be composing
       their SendMessage response
     - NEVER invent shortcuts like "consensus by incorporation" or "applying
       previous consensus" to bypass waiting for explicit teammate feedback
     - NEVER proceed unilaterally on ceremony steps that require teammate input
     - If a teammate hasn't sent a SendMessage response after 5 minutes, send
       them a follow-up message asking for their response

     ANTI-PATTERNS (DO NOT DO THESE):
     - Checking idle status and concluding "no response coming"
     - Skipping Ceremony rounds because teammates "already contributed"
     - Building documents without the required review feedback
     - Proceeding to the next ceremony before collecting all responses

EXECUTION MODEL:

     This skill uses Claude Code Agent Teams for ALL work. Your Team
     teammates (dev-1, dev-2, data-engineer, architect, qa-engineer, etc.)
     ARE your execution mechanism.

     YOU MUST:
     - Use Task(team_name="prd-{slug}", ...) to spawn teammates
     - Send work to teammates via SendMessage — they write code, run tests, report back
     - NEVER write code yourself — delegate to your Team teammates

0.4  SCAFFOLD PROJECT DIRECTORY

     Run: bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} --init

     This creates:
       prd-lifecycle/{slug}/
         arch/           — architecture docs per epic
         specs/          — functional specs per epic
         data/           — data model docs per epic
         sprints/        — sprint directories
         release/        — release artifacts
         state.json      — lifecycle state tracker
         learnings.md    — ACE learning compendium

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} team_name=prd-{slug} step=scaffold_complete
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

0.5  PERSIST RAW PRD

     Write the raw PRD content to prd-lifecycle/{slug}/prd.json:

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

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} has_ai_ml={true|false} has_analytics={true|false} has_frontend_ui={true|false} step=domains_detected
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

     The conditional specialists and their phase participation:

     | Role | Flag | Phase 1 | Phase 2 BUILD | Phase 2 VERIFY |
     |------|------|---------|---------------|----------------|
     | applied-ai-engineer | has_ai_ml | Joins all 3 Ceremonies | Joins BUILD for AI/ML epics | AI/ML review |
     | data-scientist | has_analytics | Joins all 3 Ceremonies | Joins BUILD for analytics epics | Analytics review |
     | ux-ui-designer | has_frontend_ui | Joins all 3 Ceremonies | Joins BUILD for UI epics | UX review |
     | prompt-engineer | has_ai_ml | Joins all 3 Ceremonies | Joins BUILD for LLM epics | Prompt review |

     SLOT MANAGEMENT: With max 10 concurrent teammates, all conditional
     specialists can be present simultaneously alongside the core 5.
     No rotation needed — spawn all applicable specialists at Phase 1 start
     and keep them through Ceremony 3.

0.7  ANNOUNCE TO USER

     Inform the user that the PRD lifecycle has been initialized:
     "PRD lifecycle initialized for **{title}**. Starting Phase 1: Specification
     with up to 9 specialist teammates (5 core + conditional). This phase includes
     Epic Decomposition, Story Refinement (per epic), and Architecture/Data Model/
     Spec Validation."

     If any conditional specialists are activated, also announce:
     "Domain analysis detected: {list active domains}. Conditional specialists
     will participate: {list active specialist names}."


============================================================================
PHASE 1: SPECIFICATION
============================================================================

Spawn the core 5 specialist teammates plus any conditional specialists.
Each teammate receives a role-specific preamble loaded from
~/.claude/skills/prd-lifecycle/preambles/{role}.md (if the file exists;
if it does not exist, provide a brief role description inline).

SPAWN CORE 5 TEAMMATES:

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

Wait for all core teammates to confirm they are ready. Teammate responses
arrive as new conversation turns via SendMessage. Track which teammates
have responded. If a teammate hasn't responded after 3 minutes, send a
follow-up message. Continue only when all core teammates have confirmed.

SPAWN CONDITIONAL SPECIALISTS (Phase 1):

If any domain flags were set in Step 0.6, spawn conditional specialists
ALONGSIDE the core 5 (no rotation needed — max 10 concurrent allows it).
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

     Wait for all 3 teammates to respond via SendMessage. Do NOT proceed
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

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=ceremony1_complete
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

     Announce: "Epic Decomposition complete. {N} epics defined. Execution order:
     {order}."

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

     Repeat for: data-engineer, qa-engineer, security-reviewer, tech-writer
     (and any conditional specialists) — each with their domain-specific
     review prompt.

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

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=ceremony2_complete
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

----------------------------------------------------------------------------
CEREMONY 3: ARCHITECTURE + DATA MODEL + SPEC VALIDATION
----------------------------------------------------------------------------

Goal: Produce per-epic architecture docs, data model docs, and functional specs,
each validated by all specialists.

3.1  PARALLEL AUTHORING (3 tracks simultaneously)

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

     Wait for all 3 to complete their documents. Responses arrive as new
     conversation turns via SendMessage. Track which teammates have responded.
     If a teammate hasn't responded after 5 minutes, send a follow-up message.
     Continue only when all 3 expected responses have been received.

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

3.4  SPEC VALIDATION (all teammates participate)

     Send all spec docs to all teammates:
     "SPEC VALIDATION: Review the functional specifications for all epics.
     Evaluate: completeness against acceptance criteria, API consistency,
     error handling coverage, user flow clarity, and alignment with
     architecture and data model docs. Docs: {list spec files}
     RESPONSE FORMAT: Respond via SendMessage with your feedback inline
     in the message content. Reference specific files and sections."

     Collect feedback (responses arrive as new conversation turns via
     SendMessage — track which teammates have responded, send follow-up after
     5 minutes if missing). Have tech-writer revise. Iterate until consensus.

3.4b CREATE PRODUCT BACKLOG
     Run: bash ~/.claude/skills/prd-lifecycle/scripts/create-backlog.sh . {slug}
     This creates backlog.json with all stories from the specification in status="backlog".
     Verify: test -f prd-lifecycle/{slug}/backlog.json

3.5  GATE: ALL DOCUMENTS FINALIZED

     Verify all files exist and have been approved:
     - prd-lifecycle/{slug}/arch/epic-{id}.md for each epic
     - prd-lifecycle/{slug}/data/epic-{id}.md for each epic
     - prd-lifecycle/{slug}/specs/epic-{id}.md for each epic
     - prd-lifecycle/{slug}/backlog.json

     Announce: "Phase 1 Specification complete. Architecture, data model, and
     functional specs validated by all specialists."

3.6  SHUTDOWN PHASE 1 TEAMMATES

     Send shutdown requests to all Phase 1 teammates:
     SendMessage(type="shutdown_request", recipient="architect",
       content="Phase 1 Specification complete. Shutting down.")
     Repeat for: data-engineer, qa-engineer, security-reviewer, tech-writer,
     and any active conditional specialists (applied-ai-engineer,
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

============================================================================
PHASE 3: RELEASE
============================================================================

R.1  TRANSITION TO RELEASE

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=release_started product_backlog_count=0
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

R.2  SPAWN RELEASE TEAMMATES (3)

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="tech-writer",
          prompt="You are the Tech Writer. Generate comprehensive project
          documentation from the architecture docs, data model docs, specs,
          and sprint reports.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="release-engineer",
          prompt="You are the Release Engineer. Handle git hygiene, version
          management, CI/CD configuration, deployment setup, and PR creation.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

     Task(subagent_type="general-purpose", model="opus",
          team_name="prd-{slug}", name="product-manager",
          prompt="You are the Product Manager. Validate that the release
          delivers on the product hypothesis, define release messaging, and
          verify that user-facing communication accurately represents the
          shipped functionality. Read your role instructions from
          ~/.claude/skills/prd-lifecycle/preambles/product-manager.md before
          starting work.
          RESPONSE PROTOCOL: The team lead's name is '{lead-name}'. You MUST use
          SendMessage(type=\"message\", recipient=\"{lead-name}\", content=\"...\",
          summary=\"...\") for ALL responses. Plain text output is INVISIBLE to
          the lead.")

R.3  DISTRIBUTE CONTEXT (SCOPED PER ROLE)

     Do NOT send all docs to both teammates. Scope by role to avoid
     context overload:

     Tech-writer receives (documentation-focused):
     - Architecture docs paths (prd-lifecycle/{slug}/arch/*.md)
     - Spec paths (prd-lifecycle/{slug}/specs/*.md)
     - Data model doc paths (prd-lifecycle/{slug}/data/*.md)
     - The original PRD (prd-lifecycle/{slug}/prd.json)
     - Latest sprint review only (prd-lifecycle/{slug}/sprints/sprint-{last}/review.md)
     - Instruction: "Read these files incrementally, one directory at a time"

     Release-engineer receives (ops-focused):
     - Sprint review summary paths (prd-lifecycle/{slug}/sprints/sprint-*/review.md)
     - Accumulated learnings path (prd-lifecycle/{slug}/learnings.md)
     - The original PRD (prd-lifecycle/{slug}/prd.json)
     - No architecture, spec, or data model docs (not needed for release)

     Product-manager receives (product-focused):
     - The original PRD (prd-lifecycle/{slug}/prd.json)
     - All product-review reports (prd-lifecycle/{slug}/sprints/sprint-*/reports/product-review.md)
     - Sprint review summaries (prd-lifecycle/{slug}/sprints/sprint-*/review.md)
     - Instruction: "Validate release messaging against PRD hypothesis and success criteria"

     IMPORTANT: Send file PATHS only, not contents. Let each teammate
     read files themselves to manage their own context budget.

R.4  TECH WRITER DELIVERABLES

     Send to tech-writer:
     "RELEASE DOCUMENTATION: Produce the following deliverables. Write each
     to prd-lifecycle/{slug}/release/:
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
     to prd-lifecycle/{slug}/release/MIGRATION.md."

R.5b PRODUCT MANAGER DELIVERABLES

     Send to product-manager:
     "RELEASE VALIDATION: Review all release documentation produced by
     tech-writer (prd-lifecycle/{slug}/release/). Verify:
     1. RELEASE-NOTES.md accurately represents shipped functionality
     2. README.md messaging aligns with the product hypothesis from the PRD
     3. No features are over-promised or under-represented
     4. Success criteria from the PRD are addressed in the release narrative
     Write your assessment to prd-lifecycle/{slug}/release/PRODUCT-SIGNOFF.md
     with verdict: APPROVE or REQUEST_CHANGES."

     Wait for PM's SendMessage response. If REQUEST_CHANGES, relay feedback
     to tech-writer for revision. Maximum 2 revision cycles.

R.6  GATE: RELEASE ARTIFACTS COMPLETE

     Verify all deliverables exist:
     - prd-lifecycle/{slug}/release/README.md
     - prd-lifecycle/{slug}/release/API.md
     - prd-lifecycle/{slug}/release/DATA.md
     - prd-lifecycle/{slug}/release/CHANGELOG.md
     - prd-lifecycle/{slug}/release/RELEASE-NOTES.md
     - prd-lifecycle/{slug}/release/MIGRATION.md (if data changes exist)
     - prd-lifecycle/{slug}/release/PRODUCT-SIGNOFF.md (PM approval)
     - CI/CD configuration file in project root
     - PR created (or ready to create)

R.7  SHUTDOWN RELEASE TEAMMATES

     SendMessage(type="shutdown_request", recipient="tech-writer", content="Release phase complete.")
     SendMessage(type="shutdown_request", recipient="release-engineer", content="Release phase complete.")
     SendMessage(type="shutdown_request", recipient="product-manager", content="Release phase complete. Thank you for your product stewardship.")
     Wait for confirmations (responses arrive as new conversation turns).
     Track which teammates have confirmed shutdown.

R.7b GIT COMMIT RELEASE WORK

     Commit all release artifacts:
     git add -A && git commit -m "feat(release): complete release — docs, changelog, and deployment config"

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=release_done
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.


============================================================================
FINAL RETROSPECTIVE
============================================================================

F.1  TRANSITION TO COMPLETED

     TRANSITION:
     bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} step=completed
     Read the file shown in LOAD (if any). Jump to the section shown in RESUME AT.

F.2  FINAL LEARNING AGGREGATION

     Run: bash ~/.claude/skills/prd-lifecycle/scripts/collect-learnings.sh . {slug}

F.3  COMPILE FULL RETROSPECTIVE

     Read all sprint retros (prd-lifecycle/{slug}/sprints/sprint-*/retro.md). Write a comprehensive
     final retrospective to prd-lifecycle/{slug}/release/RETROSPECTIVE.md covering:
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
     - Documentation: prd-lifecycle/{slug}/release/README.md, API.md, DATA.md
     - Release notes: prd-lifecycle/{slug}/release/RELEASE-NOTES.md
     - Changelog: prd-lifecycle/{slug}/release/CHANGELOG.md
     - All review reports: prd-lifecycle/{slug}/sprints/sprint-*/reports/

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
- Edit — update existing files (reports, specs, docs — NEVER state.json)

SHELL SCRIPTS:
- Bash: bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} --init — scaffold
  the prd-lifecycle/{slug}/ directory with all subdirectories and initial state
- Bash: bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh --list — list all PRD instances
- Bash: bash ~/.claude/skills/prd-lifecycle/scripts/init-sprint.sh {n} . {slug} — create sprint-{n}/ directory with
  report stubs, review template, and retrospective template
- Bash: bash ~/.claude/skills/prd-lifecycle/scripts/brain/run.sh . instance={slug} [key=value ...] — unified state
  management + navigation. Writes state, outputs where to go next, logs to brain.log.
  Orient-only: just instance=. Write+orient: key=value pairs. Complete epic: add-completed=E{id}.
- Bash: bash ~/.claude/skills/prd-lifecycle/scripts/collect-learnings.sh . {slug} — aggregate ACE entries from all sprint
  retrospectives into the master learnings.md compendium

FILE DISCOVERY:
- Glob — find files by pattern (e.g., prd-lifecycle/{slug}/sprints/sprint-*/reports/*.md)
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
  This is a single feature. Use a simpler agent workflow.

  "Quick prototype of auth flow"
  This is a prototype. The full ceremony overhead is inappropriate.

  "Refactor the database layer"
  This is a refactoring task. Use a targeted refactoring workflow.

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
- [ ] Epic Decomposition passed — 3-7 epics defined with PRD section mapping
      and execution order, all specialists approved (or lead made binding decisions)
- [ ] Story Refinement passed — all stories have acceptance criteria and valid
      epic_id, all specialists approved (or lead made binding decisions)
- [ ] Architecture Review passed — per-epic arch docs validated by all specialists
- [ ] Data Model Review passed — per-epic data docs validated by all specialists
- [ ] Spec Validation passed — per-epic specs validated by all specialists

PHASE 2 GATES (per sprint):
- [ ] All IMPL tasks completed and pair-reviewed (APPROVE verdict)
- [ ] QA report: PASS or PASS_WITH_WARNINGS (zero CRITICAL/HIGH unresolved)
- [ ] Security report: PASS or PASS_WITH_WARNINGS (zero CRITICAL/HIGH unresolved)
- [ ] Performance report: PASS or PASS_WITH_WARNINGS (zero CRITICAL/HIGH unresolved)
- [ ] Code Review report: PASS or PASS_WITH_WARNINGS (zero CRITICAL/HIGH unresolved)
- [ ] Data Review report (if data-heavy): PASS or PASS_WITH_WARNINGS
- [ ] AI/ML Review report (if has_ai_ml and epic has ML): PASS or PASS_WITH_WARNINGS
- [ ] Prompt Review report (if has_ai_ml and epic has prompts/LLM): PASS or PASS_WITH_WARNINGS
- [ ] Analytics Review report (if has_analytics and epic has analytics): PASS or PASS_WITH_WARNINGS
- [ ] UX Review report (if has_frontend_ui and epic has UI): PASS or PASS_WITH_WARNINGS
- [ ] Architecture Review report: PASS or PASS_WITH_WARNINGS
- [ ] Sprint Review: GO decision
- [ ] Sprint Retrospective: ACE entries captured
- [ ] All sprint teammates shut down cleanly

PHASE 2 AGGREGATE:
- [ ] All stories completed (product_backlog_count=0)
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
- [ ] brain orient output shows state: completed
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

  ╔══════════════════════════════════════════════════════════════════╗
  ║  CRITICAL: NEVER write state.json directly.                     ║
  ║  ALWAYS use brain/run.sh for ALL state transitions.             ║
  ║  Direct writes corrupt the XState snapshot format.              ║
  ╚══════════════════════════════════════════════════════════════════╝

  All lifecycle state is persisted in prd-lifecycle/{slug}/state.json as an XState v5
  snapshot. The file is managed EXCLUSIVELY by the brain engine. The format is:

  {
    "value": { "execution": { "sprint": "build" } },   ← nested state path
    "context": {
      "instance": "task-api",
      "team_name": "prd-task-api",
      "current_sprint": 2,
      "product_backlog_count": 0,
      "has_ai_ml": false,
      "has_analytics": false,
      "has_frontend_ui": true,
      "created_at": "2026-02-09T10:00:00Z"
    },
    "status": "active",
    "historyValue": {},
    "children": {}
  }

  DO NOT read individual fields from state.json to determine position.
  Instead, run brain with no arguments — it reads state.json and outputs
  a navigation box telling you exactly where you are and what to do next.

  Step values and their meaning (for reference only — brain tells you this):

  | step | phase | What's done | Resume from |
  |------|-------|-------------|-------------|
  | init | specification | Scaffold just created | Step 0.5 (persist PRD) |
  | scaffold_complete | specification | Team name persisted | Step 0.6 (domains) |
  | domains_detected | specification | Flags set | Step 0.7 (announce) → Phase 1 |
  | phase1_spawned | specification | Teammates active | Resume ceremonies |
  | ceremony1_complete | specification | Epics decomposed | Ceremony 2 (Story Refinement) |
  | ceremony2_complete | specification | Stories refined per epic | Ceremony 3 |
  | refinement | execution | Team refines product backlog stories into tasks with SP | Continue refinement |
  | sprint_planning | execution | TL + SM select stories for sprint based on capacity | Continue sprint planning |
  | sprint_setup | execution | Sprint dir created | Spawn BUILD teammates (A.1) |
  | sprint_build | execution | BUILD in progress | Continue BUILD |
  | sprint_build_done | execution | Devs shut down | Start VERIFY (B.1) |
  | sprint_verify | execution | VERIFY in progress | Continue reviews |
  | sprint_verify_done | execution | Reviews complete | ARCH REVIEW (C.1) |
  | sprint_arch_review | execution | Arch review in progress | Continue C.2-C.4 |
  | sprint_arch_done   | execution | Arch review passed | Sprint REVIEW (R.1) |
  | sprint_review_done | execution | GO decision made | Sprint RETRO (T.1) — note: dev retro collected at A.5b, reviewer retro at B.5b |
  | sprint_retro_done | execution | Retro complete | Next epic or Phase 3 |
  | release_started | release | Phase 3 active | Continue release |
  | release_done | release | Artifacts complete | FINAL steps (F.1) |
  | completed | completed | Everything done | No resume needed |

  NOTE: You do not need to memorize this table. Run brain with no arguments
  and it will tell you exactly where to resume via the LOAD and RESUME AT fields.

  To resume an interrupted lifecycle:
  1. The RESUME CHECK at the top of Step 0 handles this automatically
  2. Run brain --list to find instances, then brain . instance={slug} to orient
  3. Re-creates the team: TeamCreate(team_name="{team_name from brain output}")
  4. Discovers lead name (step 0.3b)
  5. Follow the PROTOCOL in the brain output (LOAD + RESUME AT)
  6. Re-spawns only the teammates needed for the current sub-phase

  All artifacts from completed phases are preserved in prd-lifecycle/{slug}/ and do
  not need to be regenerated. Architecture docs, data models, specs, and
  sprint reports from completed work remain available for context.

  IMPORTANT: When resuming mid-sprint, read the sprint's existing reports
  and task list to understand what BUILD/VERIFY work has already been done.
  Do not re-run completed tasks.

EXTERNAL SCRIPTS (ADVISORY):

  These scripts perform calculations outside the brain. They provide DATA — they never send brain events.

  | Script | Usage | Output |
  |--------|-------|--------|
  | `create-backlog.sh` | `bash ~/.claude/skills/prd-lifecycle/scripts/create-backlog.sh . {slug}` | Creates backlog.json from specs + epics.json |
  | `calculate-capacity.sh` | `bash ~/.claude/skills/prd-lifecycle/scripts/calculate-capacity.sh . {slug}` | `capacity=N` (moving avg, clamped [8,21]) |
  | `record-velocity.sh` | `bash ~/.claude/skills/prd-lifecycle/scripts/record-velocity.sh . {slug} {sprint} {planned} {completed}` | Appends to velocity.json |
  | `check-epic-status.sh` | `bash ~/.claude/skills/prd-lifecycle/scripts/check-epic-status.sh . {slug}` | JSON array of 100%-done epic IDs |
  | `check-refinement.sh` | `bash ~/.claude/skills/prd-lifecycle/scripts/check-refinement.sh . {slug} {capacity}` | `recommendation|refined_sp=N|threshold=M` |

BACKLOG FRESHNESS INVARIANT:

  ALWAYS recompute `product_backlog_count` from backlog.json immediately before every routing event:
  ```bash
  jq '[.stories[] | select(.status != "done")] | length' prd-lifecycle/{slug}/backlog.json
  ```
  NEVER use a cached value. If the value drifts from reality, guards (hasRemainingStories/noRemainingStories) will make incorrect routing decisions.

  Events requiring fresh count: PHASE1_COMPLETE, REFINEMENT_DONE, START_REFINEMENT, START_PLANNING, START_RELEASE.

TEMPLATE REFERENCES:

  - Sprint backlog format: `~/.claude/skills/prd-lifecycle/templates/sprint-backlog.json`
  - Velocity tracking: `~/.claude/skills/prd-lifecycle/templates/velocity.json`

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
  - Verify Node.js is available: `which node` (required by brain engine)
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

  Teammate count exceeds 10:
  - Review which teammates are active: TaskList + check for idle notifications
  - Shut down any teammates that have completed their work
  - Stagger spawning: complete one batch before starting the next
  - Never have more than 10 active teammates simultaneously

  State file corruption:
  - NEVER write state.json directly — it is an XState snapshot managed by brain
  - If parseable: fix via brain transition (e.g., brain/run.sh . instance={slug} step=sprint_build)
  - If unparseable: delete state.json and re-initialize with brain . instance={slug} --init,
    then advance to the correct state using brain transitions
  - Reconstruct position from artifacts (check which sprint dirs exist,
    which epic docs exist, which reports are written)

  Memory/context pressure in long lifecycles:
  - ACE playbook injection is now a ranked digest (~8KB per prompt vs previous
    143KB). reader.sh selects top entries by helpful count + recency. Full
    playbooks remain on disk as source of truth.
  - reflector.py auto-compacts playbooks when they exceed 60 entries (target: 35).
    Archives originals to *.archive.md before compacting.
  - Learnings.md: compacted at T.3 if > 150 lines (grouped by theme, not sprint)
  - When sending context to teammates: send file PATHS only, not contents.
    Teammates read files themselves to manage their own context budget.
  - All reviewer preambles include Context Management instructions for
    incremental reading (one directory at a time, write findings incrementally).
  - Fix cycles use hybrid approach: cycle 1 reuses existing dev, cycle 2+
    spawns fresh developer with minimal context to avoid accumulation.
  - R.3 release context is scoped per role (tech-writer vs release-engineer)
  - Architecture, data, and spec docs per epic are scoped — only send the
    docs for the current epic, not all epics
</Advanced>
