import * as fs from 'fs';
import * as nodePath from 'path';
import { setup, createActor } from 'xstate';
import { guards } from './guards.js';
import { actions } from './actions.js';

const STATE_DIR = 'prd-lifecycle';
const STATE_FILE = 'state.json';

function stateFilePath(projectRoot: string): string {
  return nodePath.join(projectRoot, STATE_DIR, STATE_FILE);
}

/**
 * Detect whether a parsed state.json is in the legacy flat format
 * (written by the old brain.sh / write-state.sh) rather than the
 * XState snapshot format. Legacy format has `phase` + `step` at root
 * level but no `value` field.
 */
export function isLegacyFormat(data: any): boolean {
  return data != null
    && typeof data.phase === 'string'
    && typeof data.step === 'string'
    && data.value === undefined;
}

/**
 * Convert a legacy flat-format state.json to an XState-compatible snapshot.
 *
 * Old format:  { phase, step, status, team_name, current_sprint, ... }
 * New format:  { value, context, status, historyValue, children }
 *
 * Step name mapping:
 *   specification + init              → { specification: "init" }
 *   execution + phase1_complete       → { execution: "phase1_complete" }
 *   execution + sprint_build          → { execution: { sprint: "build" } }
 *   release + release_started         → { release: "release_started" }
 *   completed + completed             → "completed"
 */
export function migrateLegacyState(legacy: any): any {
  const { phase, step } = legacy;

  // Build the nested `value` field
  let value: any;
  if (phase === 'completed') {
    value = 'completed';
  } else if (phase === 'execution' && step.startsWith('sprint_')) {
    const sprintStep = step.slice('sprint_'.length); // strip "sprint_" prefix
    value = { execution: { sprint: sprintStep } };
  } else {
    value = { [phase]: step };
  }

  // Extract context fields (only BrainContext keys)
  const context = {
    team_name: legacy.team_name ?? '',
    current_sprint: legacy.current_sprint ?? 0,
    current_epic: legacy.current_epic ?? '',
    epics_completed: legacy.epics_completed ?? [],
    epics_remaining: legacy.epics_remaining ?? [],
    has_ai_ml: legacy.has_ai_ml ?? false,
    has_analytics: legacy.has_analytics ?? false,
    has_frontend_ui: legacy.has_frontend_ui ?? false,
    created_at: legacy.created_at ?? '',
  };

  return {
    value,
    context,
    status: legacy.status ?? 'active',
    historyValue: {},
    children: {},
  };
}

/**
 * Read state.json from the project directory.
 * Returns null if the file doesn't exist.
 * Throws on corrupt JSON or empty file.
 * Auto-migrates legacy (flat) format to XState snapshot format.
 */
export function readState(projectRoot: string): any | null {
  const filePath = stateFilePath(projectRoot);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  if (raw.trim() === '') {
    throw new Error(`state.json is empty (0 bytes) at ${filePath}`);
  }
  const data = JSON.parse(raw);

  // Auto-migrate legacy format and persist the migrated version
  if (isLegacyFormat(data)) {
    const migrated = migrateLegacyState(data);
    writeState(projectRoot, migrated);
    return migrated;
  }

  return data;
}

/**
 * Atomic write: tmp file + rename (prevents corruption on interrupt).
 */
export function writeState(projectRoot: string, snapshot: any): void {
  const filePath = stateFilePath(projectRoot);
  const dir = nodePath.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpFile = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(snapshot, null, 2));
  fs.renameSync(tmpFile, filePath);
}

/**
 * Initialize a new project: create scaffold directories, learnings.md, and initial state.json.
 * Reads scaffold dirs and initial context from workflow.json metadata.
 * Uses XState to create a proper persisted snapshot (not a hand-built object).
 * Throws if state.json already exists.
 */
export function initializeProject(projectRoot: string, workflowDef: any): void {
  const filePath = stateFilePath(projectRoot);
  if (fs.existsSync(filePath)) {
    throw new Error(`state.json already exists at ${filePath} — delete first to reinitialize`);
  }

  const baseDir = nodePath.join(projectRoot, STATE_DIR);
  fs.mkdirSync(baseDir, { recursive: true });

  // Create scaffold directories from workflow.json meta.scaffold
  const scaffoldDirs: string[] = workflowDef.meta?.scaffold || [];
  for (const dir of scaffoldDirs) {
    fs.mkdirSync(nodePath.join(baseDir, dir), { recursive: true });
  }

  // Create learnings.md with header
  fs.writeFileSync(
    nodePath.join(baseDir, 'learnings.md'),
    '# ACE Learnings — Cross-Sprint Compendium\n',
  );

  // Create a proper XState snapshot by starting a fresh actor.
  // This ensures the persisted format includes all XState-internal fields
  // (children, historyValue, etc.) that createActor({ snapshot }) expects.
  const machine = setup({
    types: {} as { context: any; events: any },
    guards,
    actions,
  }).createMachine(workflowDef as any);

  const actor = createActor(machine).start();
  const snapshot = actor.getPersistedSnapshot();
  actor.stop();

  // Set created_at in the snapshot context
  snapshot.context = { ...snapshot.context, created_at: new Date().toISOString() };

  writeState(projectRoot, snapshot);
}
