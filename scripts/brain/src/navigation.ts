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

  // 6. Handle dynamic resume_at (retro_done depends on remaining epics)
  let resumeAt = nav.resumeAt;
  if (nav.resumeAtIfEpics && snapshot.context.epics_remaining.length > 0) {
    resumeAt = nav.resumeAtIfEpics;
  } else if (nav.resumeAtIfNoEpics && snapshot.context.epics_remaining.length === 0) {
    resumeAt = nav.resumeAtIfNoEpics;
  }

  // 7. Resolve loadFile to absolute path (handle dynamic loadFileIfEpics)
  let rawLoadFile = nav.loadFile || null;
  if (nav.loadFileIfEpics && snapshot.context.epics_remaining.length > 0) {
    rawLoadFile = nav.loadFileIfEpics;
  }
  const loadFile = rawLoadFile
    ? nodePath.join(SKILL_DIR, rawLoadFile)
    : null;

  return {
    loadFile,
    resumeAt,
    roles: nav.roles,
    conditionalRoles,
    extraRoles,
    meaning: nav.meaning,
    previous: nav.previous,
  };
}
