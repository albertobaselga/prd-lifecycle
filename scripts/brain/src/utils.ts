/**
 * Convert XState's nested `value` object to a dot-separated path string.
 *
 * Examples:
 *   { "specification": "init" }                    → "specification.init"
 *   { "execution": { "sprint": "build" } }         → "execution.sprint.build"
 *   { "execution": "phase1_complete" }              → "execution.phase1_complete"
 *   "completed"                                     → "completed"
 */
export function stateValueToPath(value: any): string {
  if (typeof value === 'string') return value;
  const entries = Object.entries(value);
  if (entries.length !== 1) {
    throw new Error(`Unexpected parallel state value: ${JSON.stringify(value)}`);
  }
  const [key, child] = entries[0];
  return `${key}.${stateValueToPath(child)}`;
}

/**
 * Convert a dot path to the flat Phase + Step format used in brain.sh output.
 * This is for DISPLAY ONLY — the navigation box shows Phase/Step lines
 * matching brain.sh's format.
 *
 * Examples:
 *   "specification.init"           → { phase: "specification", step: "init" }
 *   "execution.sprint.build"       → { phase: "execution", step: "sprint_build" }
 *   "execution.phase1_complete"    → { phase: "execution", step: "phase1_complete" }
 *   "completed"                    → { phase: "completed", step: "completed" }
 */
export function statePathToFlatDisplay(dotPath: string): { phase: string; step: string } {
  const parts = dotPath.split('.');
  if (parts.length === 1) return { phase: parts[0], step: parts[0] };
  return { phase: parts[0], step: parts.slice(1).join('_') };
}

/**
 * Walk the workflow.json state tree to find the node at the given dot path.
 * Returns the state node object, or null if the path is invalid.
 */
export function resolveStateNode(workflowDef: any, dotPath: string): any | null {
  const parts = dotPath.split('.');
  let node = workflowDef;
  for (const part of parts) {
    if (!node.states?.[part]) return null;
    node = node.states[part];
  }
  return node;
}

/**
 * Walk up the dot path, trimming one segment at a time, to find
 * the nearest valid ancestor in the workflow definition.
 */
export function findNearestAncestor(workflowDef: any, dotPath: string): string {
  const parts = dotPath.split('.');
  for (let i = parts.length - 1; i > 0; i--) {
    const candidate = parts.slice(0, i).join('.');
    if (resolveStateNode(workflowDef, candidate)) return candidate;
  }
  return workflowDef.initial || '(root)';
}
