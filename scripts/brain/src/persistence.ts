import * as fs from 'fs';
import * as nodePath from 'path';
import { setup, createActor } from 'xstate';
import { guards } from './guards.js';
import { actions } from './actions.js';

const BASE_DIR = 'prd-lifecycle';
const STATE_FILE = 'state.json';

/**
 * Compute the state directory path.
 * With instance: prd-lifecycle/{instance}
 * Without instance (legacy): prd-lifecycle
 */
export function getStateDir(instance?: string): string {
  return instance ? nodePath.join(BASE_DIR, instance) : BASE_DIR;
}

function stateFilePath(projectRoot: string, instance?: string): string {
  return nodePath.join(projectRoot, getStateDir(instance), STATE_FILE);
}

/**
 * Validates an instance slug against path traversal and naming rules.
 * Must be lowercase alphanumeric with hyphens, no leading/trailing hyphen, max 60 chars.
 * Rejects: ../../evil, my-api-, -my-api, MY_API, spaces, underscores, etc.
 */
export function validateInstance(instance: string): void {
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(instance) || instance.length > 60) {
    throw new Error(
      `Invalid instance slug: "${instance}". ` +
      `Must be lowercase alphanumeric with hyphens (no leading/trailing hyphen), max 60 chars. ` +
      `Underscores should be replaced with hyphens.`
    );
  }
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
 *   execution + phase1_complete       → { execution: "refinement" } (mapped to new state)
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
  } else if (phase === 'execution' && step === 'phase1_complete') {
    // Legacy state: phase1_complete → refinement (state was removed)
    value = { execution: 'refinement' };
  } else if (phase === 'execution' && step.startsWith('sprint_')) {
    const sprintStep = step.slice('sprint_'.length); // strip "sprint_" prefix
    value = { execution: { sprint: sprintStep } };
  } else {
    value = { [phase]: step };
  }

  // Extract context fields (only current BrainContext keys)
  // Old epic fields (current_epic, epics_completed, epics_remaining) are silently ignored —
  // epic tracking moved to external artifacts (epics.json, backlog.json).
  const context = {
    instance: legacy.instance ?? '',
    team_name: legacy.team_name ?? '',
    current_sprint: legacy.current_sprint ?? 0,
    has_ai_ml: legacy.has_ai_ml ?? false,
    has_analytics: legacy.has_analytics ?? false,
    has_frontend_ui: legacy.has_frontend_ui ?? false,
    created_at: legacy.created_at ?? '',
    product_backlog_count: legacy.product_backlog_count ?? 0,
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
export function readState(projectRoot: string, instance?: string): any | null {
  const filePath = stateFilePath(projectRoot, instance);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  if (raw.trim() === '') {
    throw new Error(`state.json is empty (0 bytes) at ${filePath}`);
  }
  const data = JSON.parse(raw);

  // Auto-migrate legacy format and persist the migrated version
  if (isLegacyFormat(data)) {
    const migrated = migrateLegacyState(data);
    writeState(projectRoot, migrated, instance);
    return migrated;
  }

  return data;
}

/**
 * Atomic write: tmp file + rename (prevents corruption on interrupt).
 */
export function writeState(projectRoot: string, snapshot: any, instance?: string): void {
  const filePath = stateFilePath(projectRoot, instance);
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
 *
 * NOTE: instance is REQUIRED. Callers must validate it first via validateInstance().
 * NOTE: TOCTOU race exists between existsSync and writeState — acceptable for
 *       single-Lead usage pattern. [FIX-7]
 */
export function initializeProject(projectRoot: string, workflowDef: any, instance: string): void {
  const filePath = stateFilePath(projectRoot, instance);
  if (fs.existsSync(filePath)) {
    throw new Error(`state.json already exists at ${filePath} — delete first to reinitialize`);
  }

  const baseDir = nodePath.join(projectRoot, getStateDir(instance));
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

  // Set instance and created_at in the snapshot context.
  // Works because XState assign does PARTIAL merge, and workflow.json
  // already has "instance": "" in initial context [FIX-3]
  snapshot.context = {
    ...snapshot.context,
    instance,
    created_at: new Date().toISOString(),
  };

  writeState(projectRoot, snapshot, instance);
}

/**
 * Scan prd-lifecycle/ for subdirectories containing state.json.
 * Returns array of { slug, statePath, isLegacy } objects.
 * Also detects legacy flat format (prd-lifecycle/state.json without instance subdir).
 *
 * Does NOT use a scaffold name exclusion list [FIX-6 revised].
 * The state.json existence check is sufficient. A name exclusion list would
 * hide legitimately-named instances like slug "data" or "release".
 */
export function listInstances(projectRoot: string): Array<{
  slug: string;
  statePath: string;
  isLegacy: boolean;
}> {
  const baseDir = nodePath.join(projectRoot, BASE_DIR);
  if (!fs.existsSync(baseDir)) return [];

  const results: Array<{ slug: string; statePath: string; isLegacy: boolean }> = [];

  // Check for legacy flat format
  const legacyPath = nodePath.join(baseDir, STATE_FILE);
  if (fs.existsSync(legacyPath)) {
    results.push({ slug: '(legacy)', statePath: legacyPath, isLegacy: true });
  }

  // Scan subdirectories
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const instanceState = nodePath.join(baseDir, entry.name, STATE_FILE);
    if (fs.existsSync(instanceState)) {
      results.push({
        slug: entry.name,
        statePath: instanceState,
        isLegacy: false,
      });
    }
  }

  return results;
}
