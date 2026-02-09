/**
 * Brain context — persisted in state.json alongside XState's `value`.
 * Tracks project metadata, sprint progress, and domain flags.
 */
export interface BrainContext {
  team_name: string;
  current_sprint: number;
  current_epic: string;
  epics_completed: string[];
  epics_remaining: string[];
  has_ai_ml: boolean;
  has_analytics: boolean;
  has_frontend_ui: boolean;
  created_at: string;
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
  | { type: 'CEREMONY2_COMPLETE'; epics_remaining: string[] }
  | { type: 'PHASE1_COMPLETE' }
  | { type: 'START_SPRINT'; epicId: string }
  | { type: 'BUILD_STARTED' }
  | { type: 'BUILD_DONE' }
  | { type: 'VERIFY_STARTED' }
  | { type: 'VERIFY_DONE' }
  | { type: 'ARCH_REVIEW_STARTED' }
  | { type: 'ARCH_DONE' }
  | { type: 'REVIEW_DONE' }
  | { type: 'RETRO_DONE'; epicId: string }
  | { type: 'START_RELEASE' }
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
}
