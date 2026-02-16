/**
 * Brain context — persisted in state.json alongside XState's `value`.
 * Tracks project metadata, sprint progress, and domain flags.
 *
 * Epic tracking (current_epic, epics_completed, epics_remaining) has been
 * moved to external artifacts (epics.json, backlog.json). The brain only
 * knows product_backlog_count for routing guards.
 */
export interface BrainContext {
  instance: string;
  team_name: string;
  current_sprint: number;
  has_ai_ml: boolean;
  has_analytics: boolean;
  has_frontend_ui: boolean;
  created_at: string;
  product_backlog_count: number;
}

/**
 * Discriminated union of all events the brain state machine accepts.
 * Each event maps 1:1 to a transition in workflow.json.
 * ORIENT is NOT included — it's handled at the engine level (no transition).
 */
export type BrainEvent =
  | { type: 'SCAFFOLD_COMPLETE'; team_name: string }
  | { type: 'DOMAINS_DETECTED'; has_ai_ml: boolean; has_analytics: boolean; has_frontend_ui: boolean }
  | { type: 'PHASE1_SPAWNED' }
  | { type: 'CEREMONY1_COMPLETE' }
  | { type: 'CEREMONY2_COMPLETE' }
  | { type: 'CEREMONY3_AUTHORED' }
  | { type: 'CEREMONY3_REVIEWED' }
  | { type: 'PHASE1_COMPLETE'; product_backlog_count: number }
  | { type: 'REFINEMENT_DONE'; product_backlog_count: number }
  | { type: 'PLANNING_DONE' }
  | { type: 'BUILD_STARTED' }
  | { type: 'BUILD_DONE' }
  | { type: 'VERIFY_STARTED' }
  | { type: 'VERIFY_DONE' }
  | { type: 'ARCH_REVIEW_STARTED' }
  | { type: 'ARCH_DONE' }
  | { type: 'REVIEW_DONE' }
  | { type: 'RETRO_DONE' }
  | { type: 'START_REFINEMENT'; product_backlog_count: number }
  | { type: 'START_PLANNING'; product_backlog_count: number }
  | { type: 'START_RELEASE'; product_backlog_count: number }
  | { type: 'RELEASE_DONE' }
  | { type: 'LIFECYCLE_COMPLETE' };

/**
 * Navigation output computed from a state's meta.nav in workflow.json.
 * Used by the box renderer to produce the navigation guidance box.
 */
export interface NavigationOutput {
  loadFile: string | null;
  resumeAt: string;
  roles: string;
  conditionalRoles: string[];
  extraRoles: string[];
  meaning: string;
  previous: string;
  lifecycleBeforeAdvancing: string | null;
  artifactRef: string | null;
}
