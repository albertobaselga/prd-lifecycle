import { setup, createActor } from 'xstate';
import { guards } from './guards.js';
import { actions } from './actions.js';
import { stateValueToPath } from './utils.js';
import type { BrainContext, BrainEvent } from './types.js';

// Load workflow.json — resolved at build time by esbuild
import workflowDef from '../../../workflow.json';

export function createBrainMachine() {
  return setup({
    types: {} as { context: BrainContext; events: BrainEvent },
    guards,
    actions,
  }).createMachine(workflowDef as any);
}

/**
 * Process an event against the brain state machine.
 *
 * @param snapshot - Persisted snapshot to restore from, or null for fresh machine
 * @param event - Event to send, or null for orient-only (no transition)
 * @returns { snapshot, changed, machine } — the new persisted snapshot and whether state changed
 */
export function processEvent(
  snapshot: any | null,
  event: BrainEvent | null,
): { snapshot: any; changed: boolean; machine: any } {
  const machine = createBrainMachine();

  const actor = snapshot
    ? createActor(machine, { snapshot: snapshot as any }).start()
    : createActor(machine).start();

  const beforePath = stateValueToPath(actor.getSnapshot().value);

  if (event) {
    actor.send(event);
  }

  const afterSnap = actor.getSnapshot();
  const afterPath = stateValueToPath(afterSnap.value);
  const changed = event !== null && beforePath !== afterPath;

  const persisted = actor.getPersistedSnapshot();
  actor.stop();

  return { snapshot: persisted, changed, machine };
}
