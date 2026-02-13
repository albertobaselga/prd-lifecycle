import type { BrainEvent } from './types.js';

// All valid typed event names (for typed event syntax detection)
const TYPED_EVENTS = new Set([
  'SCAFFOLD_COMPLETE', 'DOMAINS_DETECTED', 'PHASE1_SPAWNED',
  'CEREMONY1_COMPLETE', 'CEREMONY2_COMPLETE', 'PHASE1_COMPLETE',
  'REFINEMENT_DONE', 'PLANNING_DONE',
  'BUILD_STARTED', 'BUILD_DONE',
  'VERIFY_STARTED', 'VERIFY_DONE', 'ARCH_REVIEW_STARTED',
  'ARCH_DONE', 'REVIEW_DONE', 'RETRO_DONE',
  'START_REFINEMENT', 'START_PLANNING', 'START_RELEASE',
  'RELEASE_DONE', 'LIFECYCLE_COMPLETE',
]);

// step= value → event type mapping
const STEP_TO_EVENT: Record<string, string> = {
  scaffold_complete: 'SCAFFOLD_COMPLETE',
  domains_detected: 'DOMAINS_DETECTED',
  phase1_spawned: 'PHASE1_SPAWNED',
  ceremony1_complete: 'CEREMONY1_COMPLETE',
  ceremony2_complete: 'CEREMONY2_COMPLETE',
  phase1_complete: 'PHASE1_COMPLETE',
  refinement_done: 'REFINEMENT_DONE',
  sprint_planning_done: 'PLANNING_DONE',
  start_refinement: 'START_REFINEMENT',
  start_planning: 'START_PLANNING',
  sprint_build: 'BUILD_STARTED',
  sprint_build_done: 'BUILD_DONE',
  sprint_verify: 'VERIFY_STARTED',
  sprint_verify_done: 'VERIFY_DONE',
  sprint_arch_review: 'ARCH_REVIEW_STARTED',
  sprint_arch_done: 'ARCH_DONE',
  sprint_review_done: 'REVIEW_DONE',
  sprint_retro_done: 'RETRO_DONE',
  release_started: 'START_RELEASE',
  release_done: 'RELEASE_DONE',
  completed: 'LIFECYCLE_COMPLETE',
};

// Fields silently ignored by the machine (backward compatibility)
// 'instance' is in this set as a safety net [FIX-1] — primary defense is early extraction
const IGNORED_FIELDS = new Set(['phase', 'current_sprint', 'instance']);

// Fields that should be coerced to number when present
const NUMERIC_FIELDS = new Set(['product_backlog_count']);

export interface ParseResult {
  projectRoot: string;
  mode: 'orient' | 'init' | 'transition' | 'list';
  instance: string | null;
  event: BrainEvent | null;
  ignoredFields: string[];
}

function coerceValue(raw: string, key?: string): string | number | boolean | unknown {
  // Force numeric fields to number
  if (key && NUMERIC_FIELDS.has(key)) {
    const n = Number(raw);
    return isNaN(n) ? 0 : n;
  }
  // Case-insensitive boolean normalization
  if (raw.toLowerCase() === 'true') return true;
  if (raw.toLowerCase() === 'false') return false;
  // Try JSON.parse for numbers, arrays, objects
  try { return JSON.parse(raw); } catch {}
  // Fall back to string
  return raw;
}

export function parseArgs(args: string[]): ParseResult {
  // Match brain.sh behavior: if the first arg contains '=' or is a typed event,
  // it's not a directory — default to '.' and include it in remaining args.
  let projectRoot = '.';
  let remaining: string[];
  if (args[0] && !args[0].includes('=') && !TYPED_EVENTS.has(args[0]) && !args[0].startsWith('--')) {
    projectRoot = args[0];
    remaining = args.slice(1);
  } else {
    remaining = args.slice(0);
  }

  // Flag precedence: --list > --init > event parsing [FIX-5]

  // Check for --list flag FIRST (no parsing needed)
  if (remaining.includes('--list')) {
    return { projectRoot, mode: 'list', instance: null, event: null, ignoredFields: [] };
  }

  // Parse key=value pairs and detect typed event syntax
  const kvPairs: Record<string, any> = {};
  let typedEventName: string | null = null;
  const ignoredFields: string[] = [];

  for (const arg of remaining) {
    if (arg.startsWith('--')) continue; // Skip flags

    const eqIdx = arg.indexOf('=');
    if (eqIdx === -1) {
      // No '=' — might be a typed event name like BUILD_STARTED
      if (TYPED_EVENTS.has(arg)) {
        typedEventName = arg;
      }
      continue;
    }

    const key = arg.slice(0, eqIdx);
    const rawValue = arg.slice(eqIdx + 1);
    kvPairs[key] = coerceValue(rawValue, key);
  }

  // Extract instance BEFORE step extraction [FIX-1 primary defense]
  const instanceValue = (kvPairs['instance'] as string) || null;
  delete kvPairs['instance'];

  // Determine step from step= key or typed event name
  const stepValue = kvPairs['step'] as string | undefined;
  delete kvPairs['step'];

  // Check for --init flag (after kvPairs parsing so instance= is available)
  if (remaining.includes('--init')) {
    return { projectRoot, mode: 'init', instance: instanceValue, event: null, ignoredFields: [] };
  }

  // Track ignored fields
  for (const key of Object.keys(kvPairs)) {
    if (IGNORED_FIELDS.has(key)) {
      ignoredFields.push(key);
    }
  }

  // If no step= and no typed event, this is orient mode
  if (!stepValue && !typedEventName) {
    return { projectRoot, mode: 'orient', instance: instanceValue, event: null, ignoredFields };
  }

  // Build the event
  const eventType = typedEventName || STEP_TO_EVENT[stepValue!];
  if (!eventType) {
    // Unknown step value — treat as orient with warning
    return { projectRoot, mode: 'orient', instance: instanceValue, event: null, ignoredFields };
  }

  // Start with the event type
  const event: any = { type: eventType };

  // Apply payload fields (skip ignored)
  // NOTE: Epic field transformations (add-completed=, current_epic=) have been removed.
  // Epic tracking is now external (epics.json, backlog.json).
  for (const [key, value] of Object.entries(kvPairs)) {
    if (IGNORED_FIELDS.has(key)) {
      continue;
    }
    event[key] = value;
  }

  return {
    projectRoot,
    mode: 'transition',
    instance: instanceValue,
    event: event as BrainEvent,
    ignoredFields,
  };
}
