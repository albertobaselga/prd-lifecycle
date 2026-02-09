import * as fs from 'fs';
import * as nodePath from 'path';
import { stateValueToPath, statePathToFlatDisplay } from './utils.js';
import type { NavigationOutput } from './types.js';

const BOX_WIDTH = 68;

function pad(text: string): string {
  const padded = text.padEnd(BOX_WIDTH - 4);
  return `║  ${padded}║`;
}

function divider(): string {
  return `╠${'═'.repeat(BOX_WIDTH - 2)}╣`;
}

function header(title: string): string {
  const top = `╔${'═'.repeat(BOX_WIDTH - 2)}╗`;
  const line = pad(title);
  return `${top}\n${line}`;
}

function footer(): string {
  return `╚${'═'.repeat(BOX_WIDTH - 2)}╝`;
}

function blank(): string {
  return pad('');
}

const SPRINT_STEPS = [
  'setup', 'build', 'build_done', 'verify', 'verify_done',
  'arch_review', 'arch_done', 'review_done', 'retro_done',
];

export function renderNavigationBox(
  snapshot: any,
  nav: NavigationOutput,
  projectRoot?: string,
): string {
  const statePath = stateValueToPath(snapshot.value);
  const { phase, step } = statePathToFlatDisplay(statePath);
  const ctx = snapshot.context;
  const lines: string[] = [];

  // --- HEADER ---
  lines.push(header('PRD-LIFECYCLE BRAIN — Navigation'));
  lines.push(divider());

  // --- POSITION ---
  lines.push(pad('POSITION'));
  lines.push(pad(`  Phase:       ${phase}`));
  lines.push(pad(`  Step:        ${step}`));
  lines.push(pad(`  Team:        ${ctx.team_name || '(not set)'}`));

  // Sprint/Epic only during execution sprint states (not phase1_complete)
  if (phase === 'execution' && step !== 'phase1_complete') {
    const totalEpics = (ctx.epics_completed?.length || 0) + (ctx.epics_remaining?.length || 0);
    lines.push(pad(`  Sprint:      ${ctx.current_sprint} / ${totalEpics}`));
    lines.push(pad(`  Epic:        ${ctx.current_epic || '(between sprints)'}`));
  }

  lines.push(blank());
  lines.push(divider());

  // --- CAME FROM ---
  lines.push(pad('CAME FROM'));
  lines.push(pad(`  Previous:    ${nav.previous}`));
  lines.push(pad(`  Meaning:     ${nav.meaning}`));
  lines.push(blank());
  lines.push(divider());

  // --- GO TO ---
  lines.push(pad('GO TO'));
  if (nav.loadFile) {
    lines.push(pad(`  Load:        ${nav.loadFile}`));
    // Check if file exists
    if (!fs.existsSync(nav.loadFile)) {
      lines.push(pad(`  ⚠ WARNING:   Load file not found!`));
    }
  }
  lines.push(pad(`  Resume at:   ${nav.resumeAt}`));
  lines.push(pad(`  Roles:       ${nav.roles}`));
  if (nav.conditionalRoles.length > 0) {
    lines.push(pad(`  + Conditional: ${nav.conditionalRoles.join(', ')}`));
  }
  if (nav.extraRoles.length > 0) {
    lines.push(pad(`  + Extra:     ${nav.extraRoles.join(', ')}`));
  }
  lines.push(blank());
  lines.push(divider());

  // --- SPRINT PROGRESS (only during sprint substates) ---
  if (statePath.startsWith('execution.sprint.')) {
    const sprintStep = statePath.split('.').pop()!;
    const stepIdx = SPRINT_STEPS.indexOf(sprintStep);
    if (stepIdx >= 0) {
      lines.push(pad('SPRINT PROGRESS'));
      lines.push(pad(`  Sprint step: ${stepIdx + 1} / ${SPRINT_STEPS.length}`));
      lines.push(blank());
      lines.push(divider());
    }
  }

  // --- PROGRESS ---
  lines.push(pad('PROGRESS'));
  const completed = ctx.epics_completed || [];
  const remaining = ctx.epics_remaining || [];
  lines.push(pad(`  Completed:   [${completed.join(', ') || '(none)'}] (${completed.length})`));
  lines.push(pad(`  Remaining:   [${remaining.join(', ') || '(none)'}] (${remaining.length})`));
  lines.push(pad(`  Domains:     AI/ML=${ctx.has_ai_ml}  Analytics=${ctx.has_analytics}  Frontend=${ctx.has_frontend_ui}`));
  lines.push(blank());
  lines.push(divider());

  // --- ARTIFACTS ---
  if (projectRoot) {
    lines.push(pad('ARTIFACTS'));
    const baseDir = nodePath.join(projectRoot, 'prd-lifecycle');
    // learnings.md line count
    const learningsPath = nodePath.join(baseDir, 'learnings.md');
    if (fs.existsSync(learningsPath)) {
      const lineCount = fs.readFileSync(learningsPath, 'utf-8').split('\n').length;
      lines.push(pad(`  learnings.md:  ${lineCount} lines`));
    }
    // epics.json
    const epicsPath = nodePath.join(baseDir, 'backlog', 'epics.json');
    lines.push(pad(`  epics.json:    ${fs.existsSync(epicsPath) ? 'exists' : 'not found'}`));
    // Sprint dir
    if (ctx.current_sprint > 0) {
      const sprintDir = nodePath.join(baseDir, 'sprints', `sprint-${ctx.current_sprint}`);
      lines.push(pad(`  sprint-${ctx.current_sprint}/:     ${fs.existsSync(sprintDir) ? 'exists' : 'not found'}`));
    }
    lines.push(blank());
    lines.push(divider());
  }

  // --- WARNINGS ---
  const warnings: string[] = [];
  if (phase === 'execution' && ctx.current_sprint === 0 && step !== 'phase1_complete') {
    warnings.push('Sprint counter is 0 but phase is execution');
  }
  if (phase === 'execution' && !ctx.current_epic
      && !['sprint_retro_done', 'sprint_setup', 'phase1_complete'].includes(step)) {
    warnings.push('No current_epic set during execution phase');
  }
  if (step === 'sprint_retro_done' && remaining.length === 0) {
    warnings.push('All epics complete — should transition to release');
  }

  if (warnings.length > 0) {
    lines.push(pad('WARNINGS'));
    for (const w of warnings) {
      lines.push(pad(`  ⚠ ${w}`));
    }
    lines.push(blank());
    lines.push(divider());
  }

  // --- PROTOCOL ---
  lines.push(pad('PROTOCOL'));
  lines.push(pad('  1. Read the file shown in LOAD (if any)'));
  lines.push(pad('  2. Jump to the section shown in RESUME AT'));
  lines.push(pad('  3. Follow instructions from that point'));
  lines.push(pad('  4. After each sub-step: run brain with new state'));
  lines.push(pad('  5. If confused or after compaction: run brain (no args)'));
  lines.push(blank());
  lines.push(footer());

  return lines.join('\n');
}

export function renderNoStateBox(): string {
  const lines: string[] = [];
  lines.push(header('PRD-LIFECYCLE BRAIN — No State Found'));
  lines.push(divider());
  lines.push(blank());
  lines.push(pad('No prd-lifecycle/state.json in current directory.'));
  lines.push(blank());
  lines.push(pad('  • Fresh project?  Run: brain --init'));
  lines.push(pad('  • Resume?         cd to your project root and re-run brain'));
  lines.push(blank());
  lines.push(footer());
  return lines.join('\n');
}

export function renderErrorBox(title: string, message: string, hint?: string): string {
  const lines: string[] = [];
  lines.push(header(`PRD-LIFECYCLE BRAIN — ${title}`));
  lines.push(divider());
  lines.push(blank());
  lines.push(pad(message));
  if (hint) {
    lines.push(blank());
    lines.push(pad(hint));
  }
  lines.push(blank());
  lines.push(footer());
  return lines.join('\n');
}
