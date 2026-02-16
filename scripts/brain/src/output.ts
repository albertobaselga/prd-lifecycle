import * as fs from 'fs';
import * as nodePath from 'path';
import { stateValueToPath, statePathToFlatDisplay } from './utils.js';
import type { NavigationOutput } from './types.js';

// ── ASCII helpers (kept for human-facing error/nostate boxes) ──

const BOX_WIDTH = 68;

function pad(text: string): string {
  const padded = text.padEnd(BOX_WIDTH - 4);
  return `║  ${padded}║`;
}

function divider(): string {
  return `╠${'═'.repeat(BOX_WIDTH - 2)}╣`;
}

function boxHeader(title: string): string {
  const top = `╔${'═'.repeat(BOX_WIDTH - 2)}╗`;
  const line = pad(title);
  return `${top}\n${line}`;
}

function boxFooter(): string {
  return `╚${'═'.repeat(BOX_WIDTH - 2)}╝`;
}

function blank(): string {
  return pad('');
}

// ── Sprint step constants ──

const SPRINT_STEPS = [
  'setup', 'build', 'build_done', 'verify', 'verify_done',
  'arch_review', 'arch_done', 'review_done', 'retro_done',
];

// ── Cheatsheet (static, self-referential for the Lead) ──

function renderCheatsheet(teamName: string, instance?: string): string {
  const t = teamName || 'YOUR_TEAM';
  const inst = instance || '{slug}';
  const lines: string[] = [];
  lines.push('---');
  lines.push('');
  lines.push('## LEAD CHEATSHEET');
  lines.push('');
  lines.push('### Your Role');
  lines.push('You are the ORCHESTRATOR. You NEVER write code yourself.');
  lines.push('You delegate ALL work to teammates and make binding decisions.');
  lines.push('');
  lines.push('### Team API');
  lines.push('');
  lines.push('To spawn a teammate (assign work to a specialist):');
  lines.push(`  Task(team_name="${t}", name="role", subagent_type="general-purpose", prompt="preamble+task")`);
  lines.push(`  Always include: role preamble + learnings.md + artifact dir + SendMessage response protocol`);
  lines.push(`  Artifact dir: prd-lifecycle/${inst}/`);
  lines.push('');
  lines.push('To message a teammate (communicate directly):');
  lines.push('  SendMessage(type="message", recipient="NAME", content="...", summary="5-10 words")');
  lines.push('');
  lines.push('To notify all teammates (use sparingly — costs scale with team size):');
  lines.push('  SendMessage(type="broadcast", content="...", summary="5-10 words")');
  lines.push('');
  lines.push('To shut down a teammate (end their session gracefully):');
  lines.push('  SendMessage(type="shutdown_request", recipient="NAME")');
  lines.push('  Then wait for their shutdown_response before proceeding');
  lines.push('');
  lines.push('To create a task (track work in shared list):');
  lines.push('  TaskCreate(subject="...", description="...", activeForm="...ing")');
  lines.push('');
  lines.push('To assign a task (give ownership to teammate):');
  lines.push('  TaskUpdate(taskId="ID", owner="NAME")');
  lines.push('');
  lines.push('To check all tasks (see progress and blockers):');
  lines.push('  TaskList()');
  lines.push('');
  lines.push('### Your Rules');
  lines.push('- Your plain text output is INVISIBLE to teammates → ALWAYS use SendMessage');
  lines.push('- Include role preamble + learnings.md in EVERY teammate spawn prompt');
  lines.push('- Transition handshake: VERIFY → UPDATE → ORIENT → LOAD → EXECUTE');
  lines.push('- Max iterations: 3 ceremony rounds, 3 fix cycles, 5 QA cycles');
  lines.push('- If confused or after compaction → run brain (no args) immediately');
  return lines.join('\n');
}

// ── Main navigation renderer (Markdown, LLM-optimized) ──

export function renderNavigationBox(
  snapshot: any,
  nav: NavigationOutput,
  projectRoot?: string,
  instance?: string,
): string {
  const statePath = stateValueToPath(snapshot.value);
  const { phase, step } = statePathToFlatDisplay(statePath);
  const ctx = snapshot.context;
  const inst = instance || ctx.instance || undefined;
  const lines: string[] = [];

  // --- HEADER ---
  lines.push('# BRAIN — Navigation');
  lines.push('');

  // --- POSITION ---
  lines.push('## Position');
  lines.push(`Phase: ${phase}`);
  lines.push(`Step: ${step}`);
  lines.push(`Team: ${ctx.team_name || '(not set)'}`);
  if (inst) {
    lines.push(`Instance: ${inst}`);
  }

  if (statePath.startsWith('execution.sprint.')) {
    lines.push(`Sprint: ${ctx.current_sprint}`);
    lines.push(`Backlog: ${ctx.product_backlog_count} stories remaining`);
  }

  lines.push('');

  // --- CAME FROM ---
  lines.push('## Came From');
  lines.push(`Previous: ${nav.previous}`);
  lines.push(`Meaning: ${nav.meaning}`);
  lines.push('');

  // --- GO TO ---
  lines.push('## Go To');
  if (nav.loadFile) {
    lines.push(`Load: ${nav.loadFile}`);
    if (!fs.existsSync(nav.loadFile)) {
      lines.push('WARNING: Load file not found!');
    }
  }
  lines.push(`Resume at: ${nav.resumeAt}`);
  lines.push(`Roles: ${nav.roles}`);
  if (nav.conditionalRoles.length > 0) {
    lines.push(`Conditional: ${nav.conditionalRoles.join(', ')}`);
  }
  if (nav.extraRoles.length > 0) {
    lines.push(`Extra: ${nav.extraRoles.join(', ')}`);
  }
  lines.push('');

  // --- ARTIFACT REFERENCE (sprint sub-states — compaction resilience) ---
  if (nav.artifactRef) {
    lines.push('## Sprint Artifact');
    lines.push(`Sprint backlog: ${nav.artifactRef}`);
    lines.push('Read this file to recover sprint context (stories, tasks, progress) after compaction.');
    lines.push('');
  }

  // --- LIFECYCLE INSTRUCTIONS (retro_done — teammate management) ---
  if (nav.lifecycleBeforeAdvancing) {
    lines.push('## Teammate Lifecycle');
    lines.push(nav.lifecycleBeforeAdvancing);
    lines.push('');
  }

  // --- SPRINT PROGRESS (only during sprint substates) ---
  if (statePath.startsWith('execution.sprint.')) {
    const sprintStep = statePath.split('.').pop()!;
    const stepIdx = SPRINT_STEPS.indexOf(sprintStep);
    if (stepIdx >= 0) {
      lines.push('## Sprint Progress');
      lines.push(`Step ${stepIdx + 1} / ${SPRINT_STEPS.length}`);
      lines.push('');
    }
  }

  // --- PROGRESS ---
  lines.push('## Progress');
  lines.push(`Backlog: ${ctx.product_backlog_count} stories remaining`);
  lines.push(`Domains: AI/ML=${ctx.has_ai_ml} Analytics=${ctx.has_analytics} Frontend=${ctx.has_frontend_ui}`);
  lines.push('');

  // --- ARTIFACTS ---
  if (projectRoot) {
    lines.push('## Artifacts');
    const baseDir = inst
      ? nodePath.join(projectRoot, 'prd-lifecycle', inst)
      : nodePath.join(projectRoot, 'prd-lifecycle');
    if (inst) {
      lines.push(`Artifact dir: prd-lifecycle/${inst}/`);
    }
    const learningsPath = nodePath.join(baseDir, 'learnings.md');
    if (fs.existsSync(learningsPath)) {
      const lineCount = fs.readFileSync(learningsPath, 'utf-8').split('\n').length;
      lines.push(`learnings.md: ${lineCount} lines`);
    }
    const epicsPath = nodePath.join(baseDir, 'epics.json');
    lines.push(`epics.json: ${fs.existsSync(epicsPath) ? 'exists' : 'not found'}`);
    const backlogPath = nodePath.join(baseDir, 'backlog.json');
    lines.push(`backlog.json: ${fs.existsSync(backlogPath) ? 'exists' : 'not found'}`);
    const prdCoverageAudit = nodePath.join(baseDir, 'reports', 'prd-coverage-audit.md');
    const storyCoverageAudit = nodePath.join(baseDir, 'reports', 'story-coverage-audit.md');
    if (fs.existsSync(prdCoverageAudit) || fs.existsSync(storyCoverageAudit)) {
      lines.push(`prd-coverage-audit.md: ${fs.existsSync(prdCoverageAudit) ? 'exists' : 'not found'}`);
      lines.push(`story-coverage-audit.md: ${fs.existsSync(storyCoverageAudit) ? 'exists' : 'not found'}`);
    }
    if (ctx.current_sprint > 0) {
      const sprintDir = nodePath.join(baseDir, 'sprints', `sprint-${ctx.current_sprint}`);
      lines.push(`sprint-${ctx.current_sprint}/: ${fs.existsSync(sprintDir) ? 'exists' : 'not found'}`);
    }
    lines.push('');
  }

  // --- WARNINGS (skip section entirely when empty) ---
  const warnings: string[] = [];
  if (phase === 'execution' && ctx.current_sprint === 0
      && !['refinement', 'sprint_planning'].includes(step)) {
    warnings.push('Sprint counter is 0 but past planning phase');
  }

  if (warnings.length > 0) {
    lines.push('## Warnings');
    for (const w of warnings) {
      lines.push(`- ${w}`);
    }
    lines.push('');
  }

  // --- PROTOCOL ---
  lines.push('## Protocol');
  lines.push('1. Read the file shown in Load');
  lines.push('2. Jump to the section shown in Resume at');
  lines.push('3. Follow instructions from that point');
  lines.push('4. After each sub-step: run brain with new state');
  lines.push('5. If confused or after compaction: run brain (no args)');
  lines.push('');

  // --- CHEATSHEET ---
  lines.push(renderCheatsheet(ctx.team_name, inst));

  return lines.join('\n');
}

// ── Instance list renderer (Markdown, LLM-facing) ──

export function renderInstanceList(
  instances: Array<{ slug: string; statePath: string; isLegacy: boolean }>,
): string {
  const lines: string[] = [];
  lines.push('# BRAIN — Instances');
  lines.push('');

  if (instances.length === 0) {
    lines.push('No PRD instances found.');
    lines.push('');
    lines.push('Start new: `brain . instance={slug} --init`');
  } else {
    lines.push(`Found ${instances.length} instance(s):`);
    lines.push('');
    for (const inst of instances) {
      try {
        const raw = fs.readFileSync(inst.statePath, 'utf-8');
        const state = JSON.parse(raw);
        const path = stateValueToPath(state.value);
        const { phase, step } = statePathToFlatDisplay(path);
        const label = inst.isLegacy ? '**(legacy)**' : `**${inst.slug}**`;
        lines.push(`- ${label} — ${phase}.${step} (team: ${state.context?.team_name || '(not set)'})`);
      } catch {
        lines.push(`- **${inst.slug}** — (corrupt state)`);
      }
    }
    lines.push('');
    lines.push('Resume: `brain . instance={slug}`');
    lines.push('New:    `brain . instance={slug} --init`');
  }

  return lines.join('\n');
}

// ── Human-facing boxes (kept as ASCII — shown in terminal for debugging) ──

export function renderNoStateBox(instance?: string): string {
  const lines: string[] = [];
  if (instance) {
    lines.push(boxHeader('PRD-LIFECYCLE BRAIN — No State Found'));
    lines.push(divider());
    lines.push(blank());
    lines.push(pad(`No state.json for instance "${instance}".`));
    lines.push(blank());
    lines.push(pad(`  Fresh start?  Run: brain . instance=${instance} --init`));
    lines.push(pad('  List all:     Run: brain --list'));
  } else {
    lines.push(boxHeader('PRD-LIFECYCLE BRAIN — No State Found'));
    lines.push(divider());
    lines.push(blank());
    lines.push(pad('No instance specified and no legacy state.json found.'));
    lines.push(blank());
    lines.push(pad('  List instances:  brain --list'));
    lines.push(pad('  Fresh start:     brain . instance={slug} --init'));
  }
  lines.push(blank());
  lines.push(boxFooter());
  return lines.join('\n');
}

export function renderErrorBox(title: string, message: string, hint?: string): string {
  const lines: string[] = [];
  lines.push(boxHeader(`PRD-LIFECYCLE BRAIN — ${title}`));
  lines.push(divider());
  lines.push(blank());
  lines.push(pad(message));
  if (hint) {
    lines.push(blank());
    lines.push(pad(hint));
  }
  lines.push(blank());
  lines.push(boxFooter());
  return lines.join('\n');
}
