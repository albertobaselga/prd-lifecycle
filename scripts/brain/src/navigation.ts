import * as nodePath from 'path';
import { stateValueToPath, resolveStateNode } from './utils.js';
import type { NavigationOutput } from './types.js';

// SKILL_DIR is the root of the prd-lifecycle skill
const SKILL_DIR = nodePath.resolve(__dirname, '..', '..', '..');

export function getSkillDir(): string {
  return SKILL_DIR;
}

/**
 * Compute navigation output from a snapshot's current state and the workflow definition.
 * Reads meta.nav from the state node in workflow.json.
 */
export function computeNavigation(snapshot: any, workflowDef: any): NavigationOutput {
  // 1. Get current state path
  const statePath = stateValueToPath(snapshot.value);

  // 2. Walk workflow.json to find the state node
  const stateNode = resolveStateNode(workflowDef, statePath);
  if (!stateNode) {
    return {
      loadFile: null,
      resumeAt: `(unknown state: ${statePath})`,
      roles: '(unknown)',
      conditionalRoles: [],
      extraRoles: [],
      meaning: `State ${statePath} not found in workflow definition`,
      previous: '(unknown)',
      lifecycleBeforeAdvancing: null,
      artifactRef: null,
    };
  }

  // 3. Read navigation metadata from meta.nav
  const nav = stateNode.meta?.nav;
  if (!nav) {
    return {
      loadFile: null,
      resumeAt: `(no navigation for ${statePath})`,
      roles: '(unknown)',
      conditionalRoles: [],
      extraRoles: [],
      meaning: `State ${statePath} has no navigation metadata`,
      previous: '(unknown)',
      lifecycleBeforeAdvancing: null,
      artifactRef: null,
    };
  }

  // 4. Resolve conditional roles from context
  const conditionalRoles: string[] = [];
  if (nav.conditionalRoles) {
    for (const [flag, role] of Object.entries(nav.conditionalRoles)) {
      if (snapshot.context[flag]) conditionalRoles.push(role as string);
    }
  }

  // 5. Include extraRoles (unconditional additions like data-engineer at build_done)
  const extraRoles: string[] = nav.extraRoles ? [nav.extraRoles] : [];

  // 6. Handle dynamic resume_at (retro_done depends on remaining stories)
  let resumeAt = nav.resumeAt;
  if (nav.resumeAtIfStories && snapshot.context.product_backlog_count > 0) {
    resumeAt = nav.resumeAtIfStories;
  } else if (nav.resumeAtIfNoStories && snapshot.context.product_backlog_count === 0) {
    resumeAt = nav.resumeAtIfNoStories;
  }

  // 7. Resolve loadFile to absolute path (handle dynamic loadFileIfStories)
  let rawLoadFile = nav.loadFile || null;
  if (nav.loadFileIfStories && snapshot.context.product_backlog_count > 0) {
    rawLoadFile = nav.loadFileIfStories;
  }
  const loadFile = rawLoadFile
    ? nodePath.join(SKILL_DIR, rawLoadFile)
    : null;

  // 8. Extract lifecycleBeforeAdvancing (teammate shutdown instructions for retro_done)
  const lifecycleBeforeAdvancing: string | null = nav.lifecycleBeforeAdvancing || null;

  // 9. Extract artifactRef (sprint-backlog.json path for sprint sub-states)
  //    Replace {current_sprint} placeholder with actual sprint number
  let artifactRef: string | null = nav.artifactRef || null;
  if (artifactRef && snapshot.context.current_sprint != null) {
    artifactRef = artifactRef.replace('{current_sprint}', String(snapshot.context.current_sprint));
  }

  return {
    loadFile,
    resumeAt,
    roles: nav.roles,
    conditionalRoles,
    extraRoles,
    meaning: nav.meaning,
    previous: nav.previous,
    lifecycleBeforeAdvancing,
    artifactRef,
  };
}
